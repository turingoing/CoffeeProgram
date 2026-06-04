// pages/setting/index.js
const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'
const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    email: '', // 新增邮箱字段
    password: '', // 密码
    code: '', // 新增验证码字段
    countdown: 0, // 验证码倒计时
    isEmailRegister: false, // 注册方式标识
    isPhoneRegister: true, // 新增手机注册标识
    userid2: '',
    // navBarHeight: app.globalData.navBarHeight,
    // data_url: 'www.ruanzi.net',
    avatarUrl: defaultAvatarUrl,
    oldAvatar: '',
    baseImg: [], // base64图片集合
    value: "",
    pricevalue: null,
    priceError: false,
    userimg: "",
    gender: '1',
    genderText: '男',
    genderValue: [],
    genders: [{
      label: '男',
      value: '男'
    },
    {
      label: '女',
      value: '女'
    },
    ],
    from: 0,
    guestOrder: false,
    hidePrivacy: false,
    agreed: false,
    RegWay: 'shouji',
    isWechatLoginSubmitting: false
  },

  setWechatLoginSubmitting(isSubmitting) {
    if (this.data.isWechatLoginSubmitting === isSubmitting) {
      return;
    }

    this.setData({
      isWechatLoginSubmitting: isSubmitting
    });
  },

  toggleAgreement() {
    this.setData({
      agreed: !this.data.agreed
    });
  },

  // 协议页面路径
  goToAgreement() {
    wx.navigateTo({
      url: '/subPackages/package/pages/xieyi/xieyi?agreement=user'
    });
  },

  // 协议页面路径
  goToPrivacy() {
    // wx.navigateTo({
    //   url: '/subPackages/package/pages/xieyi/xieyi?agreement=privacy'
    // });

    wx.openPrivacyContract({
      success: res => {
        console.log('openPrivacyContract success')
      },
      fail: res => {
        console.error('openPrivacyContract fail', res)
      }
    })
  },

  // 新增方法 - 切换注册方式
  toggleRegisterType(e) {
    const type = e.currentTarget.dataset.type;

    if (type === 'email') {
      this.setData({
        isEmailRegister: true,
        isPhoneRegister: false,
        email: '',
        code: '',
        agreed: false
      });
    } else if (type === 'phone') {
      this.setData({
        isPhoneRegister: true,
        isEmailRegister: false,
        email: '',
        code: '',
        agreed: false
      });
    } else if (type === 'back') {
      this.setData({
        isEmailRegister: false,
        isPhoneRegister: false
      });
    }
  },
  // 新增方法 - 邮箱输入
  onEmailInput(e) {
    this.setData({
      email: e.detail.value.trim()
    });
  },
  onPasswordInput(e) {
    this.setData({
      password: e.detail.value.trim()
    });
  },

  handleEmailLogin() {
    const {
      email,
      password,
      agreed
    } = this.data;
    const emailReg = /^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/;
    if (!emailReg.test(email)) {
      wx.showToast({
        title: '邮箱格式错误',
        icon: 'none',
        duration: 2000
      });
      return;
    }
    if (!email) {
      wx.showToast({
        title: '请填写邮箱信息',
        icon: 'none',
        duration: 2000
      });
      return;
    }
    // if (!password) {
    //   wx.showToast({
    //     title: '请输入密码',
    //     icon: 'none',
    //     duration: 2000
    //   });
    //   return;
    // }
    if (!agreed) {
      wx.showToast({
        title: '请勾选协议',
        icon: 'none',
        duration: 2000
      });
      return;
    }
    this.fetchEmailLogin(email, password);
  },

  fetchEmailLogin(email, password) {
    const that = this;
    // 发送请求
    wx.request({
      url: `${app.globalData.backUrl}phone.aspx?mbid=10631&ituid=106`,
      method: 'POST',
      data: {
        email
      },
      success(res) {
        console.log(res)
        wx.setStorageSync('itsid', res.data.itsid)
        wx.setStorageSync('userid', res.data.userid)
        wx.setStorageSync('isLoginSuccess', true)
        app.globalData.itsid = res.data.itsid;
        app.globalData.userid = res.data.userid;
        console.log('登录成功，其itsid:', res.data.itsid, 'userid:', res.data.userid);
        that.redirectAfterAuthSuccess();
      }
    })
  },

  getPostAuthTabUrl() {
    const loginRedirectUrl = wx.getStorageSync('loginRedirectUrl');

    if (this.data.from === 'order' || loginRedirectUrl === '/pages/order/order') {
      wx.removeStorageSync('loginRedirectUrl');
      return '/pages/order/order';
    }

    return '';
  },

  redirectAfterAuthSuccess() {
    const postAuthTabUrl = this.getPostAuthTabUrl();

    if (postAuthTabUrl) {
      wx.switchTab({
        url: postAuthTabUrl
      });
      return;
    }

    wx.switchTab({
      url: '/pages/home/home'
    });
  },

  redirectAfterProfileSuccess() {
    const postAuthTabUrl = this.getPostAuthTabUrl();

    if (postAuthTabUrl) {
      wx.switchTab({
        url: postAuthTabUrl
      });
      return;
    }

    if (String(this.data.from) === '2') {
      wx.switchTab({
        url: '/pages/home/home'
      });
      return;
    }

    wx.reLaunch({
      url: '/pages/user/user',
    });
  },

  // 新增方法 - 验证码输入
  onCodeInput(e) {
    this.setData({
      code: e.detail.value.trim()
    });
  },

  // 新增方法 - 获取验证码
  async getVerificationCode() {
    const email = this.data.email;
    const emailReg = /^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/;
    if (!emailReg.test(email)) {
      wx.showToast({
        title: '邮箱格式错误',
        icon: 'none'
      });
      return;
    }
    if (!this.data.agreed) {
      wx.showToast({
        title: '请先同意协议',
        icon: 'none'
      });
      return;
    }

    // try {
    //   const res = await wx.request({
    //     url: `${app.globalData.backUrl}send_code`,
    //     method: 'POST',
    //     data: {
    //       email
    //     }
    //   });

    //   if (res.data.success) {
    //     wx.showToast({
    //       title: '验证码已发送'
    //     });
    //     this.startCountdown();
    //   } else {
    //     wx.showToast({
    //       title: res.data.message || '发送失败',
    //       icon: 'none'
    //     });
    //   }
    // } catch (error) {
    //   console.error('发送验证码失败:', error);
    //   wx.showToast({
    //     title: '请求失败',
    //     icon: 'none'
    //   });
    // }
  },

  // 新增方法 - 倒计时处理
  startCountdown() {
    this.setData({
      countdown: 60
    });
    const timer = setInterval(() => {
      if (this.data.countdown <= 1) {
        clearInterval(timer);
        this.setData({
          countdown: 0
        });
      } else {
        this.setData({
          countdown: this.data.countdown - 1
        });
      }
    }, 1000);
  },

  nameFocus(e) {
    this.setData({
      value: e.detail.value
    })
  },
  onPriceInput(e) {
    const {
      priceError
    } = this.data;
    const isNumber = /^\d+(\.\d+)?$/.test(e.detail.value);

    if (priceError === isNumber) {
      this.setData({
        priceError: !isNumber,
      });
    }
  },
  onGenderPicker() {
    this.setData({
      genderVisible: true
    });
  },
  onPickerChange(e) {

    const {
      key
    } = e.currentTarget.dataset;
    const {
      value
    } = e.detail;
    let gender = e.detail.value[0] == '女' ? '0' : '1'

    this.setData({
      gender: gender,
      [`${key}Visible`]: false,
      [`${key}Value`]: value,
      [`${key}Text`]: value.join(' '),
    });
  },
  onPickerCancel(e) {
    const {
      key
    } = e.currentTarget.dataset;

    this.setData({
      [`${key}Visible`]: false,
    });
  },
  onChooseAvatar(e) {
    const {
      avatarUrl
    } = e.detail
    console.log("avatarUrl:" + avatarUrl);
    this.setData({
      avatarUrl,
    });
    console.log("this.data.avatarUrl:" + this.data.avatarUrl);
  },
  nameInput(e) {
    //   用户昵称
    // let value = e.detail.value
    // console.log(e);
    let value = e.detail.value.replace(/\s+/g, '')
    this.setData({
      value: value
    })
  },
  getUserGender: function () {
    wx.getSetting({ //判断用户是否授权
      success: (res) => {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo  
          wx.getUserInfo({
            success: (res) => {
              this.setData({
                gender: res.userInfo.gender
              });
            },
            fail: (err) => {
              console.log(err);
            }
          });
        } else {
          // 未授权，需要先请求授权  
          wx.authorize({
            scope: 'scope.userInfo',
            success: () => {
              // 授权成功，再次调用 getUserInfo  
              wx.getUserInfo({
                success: (res) => {
                  // console.log(res);
                  this.setData({
                    gender: res.gender
                  });
                },
                fail: (err) => {
                  console.log(err);
                }
              });
            },
            fail: (err) => {
              // 授权失败，处理错误  
              console.log(err);
            }
          });
        }
      },
      fail: (err) => {
        console.log(err);
      }
    });
  },




  submit(e) {
    console.log(e);
    let that = this;
    const {
      isEmailRegister,
      email,
      code,
      agreed
    } = this.data;
    // const emailReg = /^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/;
    // if (!emailReg.test(email)) {
    if (email.length < 5) {
      wx.showToast({
        title: '帐号不少于五位',
        icon: 'none',
        duration: 2000
      });
      return;
    }
    if (!email) {
      wx.showToast({
        title: '请填写帐号名称',
        icon: 'none',
        duration: 2000
      });
      return;
    }
    if (!agreed) {
      wx.showToast({
        title: '请勾选协议',
        icon: 'none',
        duration: 2000
      });
      return;
    }
    // 这里添加邮箱注册逻辑
    this.handleEmailRegister(email);

    // console.log(that.data);
    // if (that.data.value) {
    //   if (that.data.oldAvatar === that.data.avatarUrl) {
    //     console.log("等于");
    //     that.noAvatar(that.data.value, that.data.gender);
    //     wx.switchTab({
    //       url: '/pages/home/home?userid=' + that.data.userid2
    //     });
    //   } else {
    //     console.log("不等于");
    //     wx.login({
    //       success: (res) => {
    //         console.log("ooooo");
    //         console.log("res:", res);
    //         let gender = 1
    //         wx.uploadFile({
    //           filePath: that.data.avatarUrl,
    //           name: 'file',
    //           url: `${app.globalData.backUrl}phone.aspx?mbid=148&unitid=2&ituid=106&code=${res.code}`,
    //           header: {
    //             'content-type': 'application/json'
    //           },
    //           formData: {
    //             filepath: 'images\\singeravatar', //用户头像
    //             filename1: '',
    //             name: that.data.value, //用户昵称  
    //             gender: gender,
    //           },
    //           success: res => {
    //             console.log(res);

    //             that.headimgcopy();
    //             wx.switchTab({
    //               url: '/pages/home/home?userid=' + that.data.userid2
    //             });
    //           },
    //           fail: err => {
    //             console.log("提交失败");
    //             wx.showToast({
    //               title: '提交失败',
    //               icon: "error",
    //               duration: 2000
    //             });
    //           }
    //         });
    //       },
    //     });
    //   }
    // } else {
    //   wx.showToast({
    //     title: '请完善所有信息',
    //     icon: 'error',
    //   });
    // }
  },

  handleEmailRegister(email) {
    let that = this
    const itsid = wx.getStorageSync('itsid')
    wx.showToast({
      title: '加载中',
      icon: 'loading',
      mask: true
    })
    wx.login({
      success: (res) => {
        wx.request({
          url: `${app.globalData.backUrl}phone.aspx?mbid=10630&ituid=106&itsid=${itsid}`,
          method: 'POST',
          data: {
            email,
            openid: res.code
          },
          success(res) {
            console.log(res)

            if (res.data.code == '0') {
              wx.showToast({
                title: res.data.desc,
                icon: 'success',
                duration: 2000,
                mask: true,
              });

              setTimeout(() => {
                wx.navigateBack({
                  delta: -1
                });
              }, 2000);
            }
            else {
              wx.showToast({
                title: res.data.desc,
                icon: 'error',
                duration: 2000,
                mask: true,
              });
            }

          }
        })
      },
    })
    // wx.hideToast()
    // wx.showToast({
    //   title: '注册成功',
    //   duration: 3000,
    //   mask: true,
    //   success() {
    //     wx.navigateBack({
    //       delta: -1
    //     })
    //   }
    // })
  },

  // 新增：获取 itsid 并存入全局变量和缓存
  getItsid(callback) {
    const that = this; // 新增此行以捕获Page实例
    wx.showLoading({
      title: '正在获取账号信息...',
      mask: true
    });
    wx.login({
      success: (res) => {
        wx.request({
          url: `${app.globalData.backUrl}phone.aspx?mbid=129&ituid=106`,
          data: {
            code: res.code
          },
          success(res3) {
            console.log("res3是：", res3);
            if (res3.data.value && res3.data.value.itsid && res3.data.value.userid) {
              app.globalData.itsid = res3.data.value.itsid;
              app.globalData.userid = res3.data.value.userid;
              wx.setStorageSync('isLoginSuccess', true);
              wx.setStorageSync('itsid', res3.data.value.itsid);
              wx.setStorageSync('userid', res3.data.value.userid);
              if (typeof callback === 'function') {
                callback();
              }
            } else {
              const itsid_exist = wx.getStorageSync(app.globalData.projectName); // 确保itsid_exist已定义
              wx.request({
                url: `${app.globalData.backUrl}we.aspx?ituid=106&itjid=1026&itcid=66032&itsid=${itsid_exist.itsid}`,
                success: (res) => { // 改为箭头函数以继承that
                  that.setData({
                    userInfo: res.data.data_from_serve,
                    userid: res.data.data_from_serve.userid,
                  });
                  wx.hideLoading();
                },
                fail: () => {
                  wx.hideLoading();
                  wx.showToast({
                    title: '获取用户信息失败',
                    icon: 'none'
                  });
                }
              });
            }
          },
          fail: () => {
            wx.hideLoading();
            wx.showToast({
              title: '接口调用失败',
              icon: 'none'
            });
          }
        });
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({
          title: '登录失败',
          icon: 'none'
        });
      }
    });
  },





  headimgcopy() {
    let that = this

    wx.login({
      success: (res) => {
        wx.request({
          url: `${app.globalData.backUrl}phone.aspx?ituid=${app.globalData.ituid}&mbid=120&code=${res.code}`,
          success(result) {
            wx.request({
              method: 'POST',
              url: `${app.globalData.backUrl}phone.aspx?ituid=${app.globalData.ituid}&mbid=1101`,
              data: {
                openid: result.data.value.openid
              },
              success(res) {
                wx.request({
                  method: 'POST',
                  url: `${app.globalData.backUrl}phone.aspx?ituid=${app.globalData.ituid}&mbid=10603`,
                  data: {
                    openid: result.data.value.openid,
                    name: that.data.value
                  }
                })
                wx.showToast({
                  title: '提交成功',
                  icon: "success",
                  duration: 2000
                })
                that.getItsid(() => {
                  that.redirectAfterProfileSuccess();
                });
              }
            })
          }
        })
      }
    })
  },
  noAvatar(name, gender) {
    let that = this; // 确保定义了 that
    wx.login({
      success: (res) => {
        wx.request({
          url: `${app.globalData.backUrl}phone.aspx?ituid=${app.globalData.ituid}&mbid=120&code=${res.code}`,
          success(result) {
            wx.request({
              method: 'POST',
              url: `${app.globalData.backUrl}phone.aspx?ituid=${app.globalData.ituid}&mbid=1102`,
              data: {
                openid: result.data.value.openid,
                name: name,
                gender: gender,

              },
              success() {
                wx.showToast({
                  title: '提交成功',
                  icon: "success",
                  duration: 2000
                });
                that.getItsid(() => {
                  that.redirectAfterProfileSuccess();
                });
              }
            });
          }
        });
      }
    });
  },
  goBack() {
    wx.navigateBack()
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    let that = this; // 确保定义了 that

    if (options.from) {
      console.log("options.from:", options.from);
      that.setData({
        from: options.from
      })
    }

    if (options.guestOrder) {
      that.setData({
        guestOrder: options.guestOrder === '1' || options.guestOrder === 'true'
      })
    }

    const hidePrivacy = options.hidePrivacy || options.hideAgreement;
    if (hidePrivacy) {
      that.setData({
        hidePrivacy: hidePrivacy === '1' || hidePrivacy === 'true'
      })
    }

    // 保存回调信息，用于登录成功后跳转回商品详情页
    if (options?.callback) {
      this.setData({
        callback: options.callback,
        dishId: options.dishId,
        index1: options.index1,
        index2: options.index2,
        action: options.action
      });
    }

    if (options?.regway) {
      this.setData({
        RegWay: options.regway
      })
      if (options.regway === 'youxiang') {
        wx.setNavigationBarTitle({
          title: '子账号注册',
        })
      }
    }
    if (options?.q) {
      const url = decodeURIComponent(options.q);
      const userid2 = this.urlToObj(url);
      this.setData({
        userid2: userid2,
      });
    }
    if (options?.avatar) {
      that.setData({
        avatarUrl: options.avatar,
        oldAvatar: options.avatar,
        value: options.name
      });
    }
    if (options?.from) {
      that.setData({
        from: options.from,
        value: options.name
      });
    }
  },

  urlToObj: function (url) {
    let obj = {}
    let str = url.slice(url.indexOf('?') + 1)
    let arr = str.split('&')
    for (let j = arr.length, i = 0; i < j; i++) {
      let arr_temp = arr[i].split('=')
      obj[arr_temp[0]] = arr_temp[1]
    }
    return obj['userid']
  },


  checkRegistered() {
    const that = this; // 确保在方法开始时定义 that

    wx.login({
      success(res) {
        if (res.code) {
          console.log(res.code);
          // 发起网络请求
          wx.request({
            url: `${app.globalData.backUrl}phone.aspx?ituid=${app.globalData.ituid}&mbid=120&code=${res.code}`,
            success(result) {
              console.log(result);
              app.globalData.openid = result.data.value.openid;

              wx.request({
                method: 'POST',
                url: `${app.globalData.backUrl}phone.aspx?ituid=${app.globalData.ituid}&mbid=5002`,
                data: {
                  openid: result.data.value.openid
                },
                success(res) {
                  console.log("res:", res);
                  console.log("是否已注册:", res.data.value);

                  if (res.data.value) { // 已注册
                    that.setData({ // 使用 that 而不是 this
                      Registered: true
                    });

                    // 获取itpnid
                    wx.request({
                      method: 'POST',
                      url: `${app.globalData.backUrl}phone.aspx?ituid=${app.globalData.ituid}&mbid=9903`,
                      data: {
                        openid: app.globalData.openid
                      },
                      success(res) {
                        console.log(res);
                        app.globalData.itpnId = res.data.value.itpnId;
                        console.log("itpnId:" + app.globalData.itpnId);
                      }
                    });

                    // 获取当前用户的在ituser表中UserID
                    wx.login({
                      success: (newLoginRes) => {
                        wx.request({
                          url: `${app.globalData.backUrl}phone.aspx?mbid=129&ituid=${app.globalData.ituid}`,
                          data: {
                            code: newLoginRes.code
                          },
                          success(res3) {
                            console.log("res3是: ", res3);
                            wx.setStorageSync('isLoginSuccess', true);
                            wx.setStorageSync('itsid', res3.data.value.itsid);
                            wx.setStorageSync('userid', res3.data.value.userid);
                            app.globalData.itsid = res3.data.value.itsid;
                            app.globalData.userid = res3.data.value.userid;
                            console.log("userid是:" + app.globalData.userid);
                            // 更新动态itsid
                            let userinfo = wx.getStorageSync(app.globalData.projectName);
                            let itsid_exist = res3.data.value;
                            if (userinfo.itsid) {
                              userinfo.itsid = itsid_exist.itsid;
                            } else {
                              userinfo = {
                                itsid: itsid_exist.itsid
                              };
                            }
                            wx.setStorageSync(app.globalData.projectName, userinfo);
                            const itsid = res3.data.value.itsid;
                            console.log('存储 itsid:', res3.data.value.itsid);
                            wx.setStorageSync('itsid', itsid);
                            app.globalData.itsid = itsid;
                            that.redirectAfterAuthSuccess();
                          } // 关闭 success(res3)
                        }); // 关闭 wx.request
                      } // 关闭 wx.login 的 success
                    }); // 关闭 wx.login
                  } else { // 未注册
                    console.log("22");
                    that.setData({ // 使用 that 而不是 this
                      Registered: false,
                      button: true
                    });

                    wx.showModal({
                      title: '提示',
                      content: '未注册为新用户，请点击授权登录',
                    });
                  } // 关闭 else
                } // 关闭 success(res)
              }); // 关闭 wx.request (mbid=5002)
            } // 关闭 success(result)
          }); // 关闭 wx.request (mbid=120)
        } else {
          console.log('获取注册状态失败', res.errMsg);
        } // 关闭 else
      } // 关闭 wx.login 的 success
    }); // 关闭 wx.login
  },

  // 拦截未勾选协议
  handleGetUser() {
    if (!this.data.agreed) {
      wx.showToast({
        title: '请先同意协议',
        icon: 'none'
      });
      return;
    }
  },

  // 拦截未勾选协议 - 手机号
  handleGetPhone() {
    if (!this.data.agreed) {
      wx.showToast({
        title: '请先同意协议',
        icon: 'none'
      });
      return;
    }
  },

  //手机号登录
  getPhoneNumber(e) {
    if (!this.data.agreed) {
      wx.showToast({
        title: '请先同意协议',
        icon: 'none'
      });
      return;
    }
    wx.showToast({
      title: '登录中',
      icon: 'loading'
    });
    const that = this;
    if (e.detail.errMsg === 'getPhoneNumber:ok') {
      const {
        encryptedData,
        iv
      } = e.detail;
      wx.login({
        success: (loginRes) => {
          wx.request({
            url: `${app.globalData.backUrl}phone.aspx?mbid=60&ituid=106`,
            method: 'POST',
            data: {
              code: e.detail.code,
              js_code: loginRes.code
            },
            success: (res) => {
              // 发送注册请求
              wx.request({
                url: `${app.globalData.backUrl}phone.aspx?mbid=10620&ituid=106`,
                method: 'POST',
                data: {
                  openid: res.data.openid,
                  phone: res.data.phone_info,
                  invite: that.data.userid2,
                  type: 1,//注册类型
                },
                success: (registerRes) => {
                  // 注册成功，获取用户信息
                  wx.login({
                    success: (newLoginRes) => {
                      wx.request({
                        url: `${app.globalData.backUrl}phone.aspx?mbid=129&ituid=106`,
                        data: {
                          code: newLoginRes.code
                        },
                        success: (userInfoRes) => {
                          // 确保数据解析正确
                          if (userInfoRes.data && userInfoRes.data.value) {
                            const {
                              itsid,
                              userid
                            } = userInfoRes.data.value;
                            // 更新全局变量
                            app.globalData.itsid = itsid;
                            app.globalData.userid = userid;
                            wx.setStorageSync('isLoginSuccess', true);
                            wx.setStorageSync('inviteUserid', that.data.userid2); // 存储到缓存，键名为invite
                            wx.setStorageSync('itsid', itsid);
                            wx.setStorageSync('userid', userid);
                            console.log('手机号登录成功，其itsid:', itsid, 'userid:', userid);

                            // 检查是否有回调页面，有则跳回之前的商品页面
                            if (that.data.callback && that.data.dishId) {
                              const params = {
                                dishId: that.data.dishId,
                                index1: that.data.index1 || 0,
                                index2: that.data.index2 || 0
                              };
                              const urlParams = Object.keys(params).map(key => `${key}=${params[key]}`).join('&');
                              // 跳转回商品详情页
                              wx.redirectTo({
                                url: `${that.data.callback}?${urlParams}`
                              });
                            } else {
                              // 无回调页面，正常跳转首页
                              that.redirectAfterAuthSuccess();
                            }
                          } else {
                            wx.showToast({
                              title: '获取用户信息失败',
                              icon: 'none'
                            });
                          }
                          wx.hideToast();
                        },
                        fail: (err) => {
                          console.error('获取用户信息失败:', err);
                          wx.showToast({
                            title: '获取信息失败',
                            icon: 'none'
                          });
                          wx.hideToast();
                        }
                      });
                    },
                    fail: (err) => {
                      console.error('重新登录失败:', err);
                      wx.showToast({
                        title: '登录失败',
                        icon: 'none'
                      });
                      wx.hideToast();
                    }
                  });
                },
                fail: (err) => {
                  console.error('注册请求失败:', err);
                  wx.showToast({
                    title: '注册失败',
                    icon: 'none'
                  });
                  wx.hideToast();
                }
              });
            },
            fail: (err) => {
              console.error('解密手机号失败:', err);
              wx.showToast({
                title: '登录失败',
                icon: 'none'
              });
              wx.hideToast();
            }
          });
        },
        fail: (err) => {
          console.error('获取登录code失败:', err);
          wx.showToast({
            title: '登录失败',
            icon: 'none'
          });
          wx.hideToast();
        }
      });
    } else {
      wx.showToast({
        title: '需要手机号授权',
        icon: 'none'
      });
      wx.hideToast();
    }
  },

  // 微信号登录、免登录
  openidLogin(e) {
    if (this.data.isWechatLoginSubmitting) {
      return;
    }

    let that = this;
    console.log("e:", e);

    let agreed = e.currentTarget.dataset.agreed
    let registerType = e.currentTarget.dataset.registertype
    console.log("registerType:", registerType);
    console.log("是否登录：", agreed);
    // 同意协议
    if (agreed) {
      this.setWechatLoginSubmitting(true);
      wx.login({
        success: (res) => {
          if (res.code) {
            wx.request({
              url: `${app.globalData.backUrl}phone.aspx?ituid=${app.globalData.ituid}&mbid=120&code=${res.code}`,
              success(result) {
                console.log(result)
                // 发送注册请求
                wx.request({
                  url: `${app.globalData.backUrl}phone.aspx?mbid=10620&ituid=106`,
                  method: 'POST',
                  data: {
                    openid: result.data.value.openid,
                    phone: '',
                    invite: that.data.userid2,
                    type: registerType
                  },
                  success: (res) => {
                    console.log("注册成功返回：", res);
                    // 注册成功，获取用户信息
                    wx.login({
                      success: (newLoginRes) => {
                        wx.request({
                          url: `${app.globalData.backUrl}phone.aspx?mbid=129&ituid=106`,
                          data: {
                            code: newLoginRes.code
                          },
                          success: (userInfoRes) => {
                            // 确保数据解析正确
                            if (userInfoRes.data && userInfoRes.data.value) {
                              const {
                                itsid,
                                userid
                              } = userInfoRes.data.value;
                              // 更新全局变量
                              app.globalData.itsid = itsid;
                              app.globalData.userid = userid;
                              if (registerType == 0) {
                                wx.setStorageSync('isLoginSuccess', false);
                              } else {
                                wx.setStorageSync('isLoginSuccess', true);
                              }

                              wx.setStorageSync('inviteUserid', that.data.userid2); // 存储到缓存，键名为invite
                              wx.setStorageSync('itsid', itsid);
                              wx.setStorageSync('userid', userid);
                              console.log('微信号登录成功，其itsid:', itsid, 'userid:', userid);

                              // 检查是否有回调页面，有则跳回之前的商品页面
                              if (that.data.callback && that.data.dishId) {
                                const params = {
                                  dishId: that.data.dishId,
                                  index1: that.data.index1 || 0,
                                  index2: that.data.index2 || 0
                                };
                                const urlParams = Object.keys(params).map(key => `${key}=${params[key]}`).join('&');
                                // 跳转回商品详情页
                                wx.redirectTo({
                                  url: `${that.data.callback}?${urlParams}`
                                });
                              } else {
                                // 无回调页面，正常跳转首页
                                that.redirectAfterAuthSuccess();
                              }
                            } else {
                              that.setWechatLoginSubmitting(false);
                              wx.showToast({
                                title: '获取用户信息失败',
                                icon: 'none'
                              });
                            }
                            wx.hideToast();
                          },
                          fail: (err) => {
                            console.error('获取用户信息失败:', err);
                            that.setWechatLoginSubmitting(false);
                            wx.showToast({
                              title: '获取信息失败',
                              icon: 'none'
                            });
                            wx.hideToast();
                          }
                        });
                      },
                      fail: (err) => {
                        console.error('重新登录失败:', err);
                        that.setWechatLoginSubmitting(false);
                        wx.showToast({
                          title: '登录失败',
                          icon: 'none'
                        });
                        wx.hideToast();
                      }
                    });
                  },
                  fail: (err) => {
                    console.error('注册请求失败:', err);
                    that.setWechatLoginSubmitting(false);
                    wx.showToast({
                      title: '注册失败',
                      icon: 'none'
                    });
                    wx.hideToast();
                  }
                });
              },
              fail: () => {
                that.setWechatLoginSubmitting(false);
              }
            })
          } else {
            that.setWechatLoginSubmitting(false);
          }
        },
        fail: (err) => {
          console.error('获取登录code失败:', err);
          that.setWechatLoginSubmitting(false);
          wx.showToast({
            title: '登录失败',
            icon: 'none'
          });
          wx.hideToast();
        }
      });

    }
    // 不同意协议
    else {
      wx.showToast({
        title: '请先同意协议',
        icon: 'none'
      });
    }
  },

  // 拒绝隐私协议 - 返回首页
  rejectGetPhone: function () {
    console.log('用户点击不同意手机号登录注册');
    try {
      // 确保未设置同意标志
      wx.removeStorageSync('hasHandleGetPhone');

      // 先显示提示
      wx.showModal({
        title: '提示',
        content: '您已拒绝一键注册登录，将返回首页',
        showCancel: false,
        success: () => {
          // 用户点击确认后，返回首页
          wx.switchTab({
            url: '/pages/home/home',
            success: () => {
              console.log('成功返回首页');
            },
            fail: (err) => {
              console.error('返回首页失败:', err);
              wx.showToast({
                title: '返回首页失败',
                icon: 'none',
                duration: 2000
              });
            }
          });
        }
      });
    } catch (error) {
      console.error('返回首页出错:', error);
      // 显示提示
      wx.showModal({
        title: '提示',
        content: '返回首页失败，请手动退出',
        showCancel: false
      });
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  },

  //账户注册登录-微信号登录注册
  getUserNumber(e) {
    if (!this.data.agreed) {
      wx.showToast({
        title: '请先同意协议',
        icon: 'none'
      });
      return;
    }
    wx.showToast({
      title: '登录中',
      icon: 'loading'
    });
    const that = this;
    if (e.detail.errMsg === 'getUserNumber:ok') {
      const {
        encryptedData,
        iv
      } = e.detail;
      wx.login({
        success: (loginRes) => {
          // 发送注册请求 - 使用微信登录而不是手机号
          wx.request({
            url: `${app.globalData.backUrl}phone.aspx?mbid=10640&ituid=106`,
            method: 'POST',
            data: {
              code: loginRes.code,
              invite: that.data.userid2
            },
            success: (registerRes) => {
              // 注册成功，获取用户信息
              wx.login({
                success: (newLoginRes) => {
                  wx.request({
                    url: `${app.globalData.backUrl}phone.aspx?mbid=129&ituid=106`,
                    data: {
                      code: newLoginRes.code
                    },
                    success: (userInfoRes) => {
                      // 确保数据解析正确
                      if (userInfoRes.data && userInfoRes.data.value) {
                        const {
                          itsid,
                          userid
                        } = userInfoRes.data.value;
                        // 更新全局变量
                        app.globalData.itsid = itsid;
                        app.globalData.userid = userid;
                        wx.setStorageSync('isLoginSuccess', true);
                        wx.setStorageSync('inviteUserid', that.data.userid2); // 存储到缓存，键名为invite
                        wx.setStorageSync('itsid', itsid);
                        wx.setStorageSync('userid', userid);
                        that.redirectAfterAuthSuccess();
                      } else {
                        wx.showToast({
                          title: '获取用户信息失败',
                          icon: 'none'
                        });
                      }
                      wx.hideToast();
                    },
                    fail: (err) => {
                      console.error('获取用户信息失败:', err);
                      wx.showToast({
                        title: '获取信息失败',
                        icon: 'none'
                      });
                      wx.hideToast();
                    }
                  });
                },
                fail: (err) => {
                  console.error('重新登录失败:', err);
                  wx.showToast({
                    title: '登录失败',
                    icon: 'none'
                  });
                  wx.hideToast();
                }
              });
            },
            fail: (err) => {
              console.error('账号注册请求失败:', err);
              wx.showToast({
                title: '注册失败',
                icon: 'none'
              });
              wx.hideToast();
            }
          });
        },
        fail: (err) => {
          console.error('获取登录code失败:', err);
          wx.showToast({
            title: '登录失败',
            icon: 'none'
          });
          wx.hideToast();
        }
      });
    } else {
      wx.showToast({
        title: '需要微信账号授权',
        icon: 'none'
      });
      wx.hideToast();
    }
  },

  // 拒绝隐私协议 - 返回首页
  rejectGetUser: function () {
    console.log('用户点击不同意微信登录注册');
    try {
      // 确保未设置同意标志
      wx.removeStorageSync('hasHandleGetUser');

      // 先显示提示
      wx.showModal({
        title: '提示',
        content: '您已拒绝微信登录注册，将返回首页',
        showCancel: false,
        success: () => {
          // 用户点击确认后，返回首页
          wx.switchTab({
            url: '/pages/home/home',
            success: () => {
              console.log('成功返回首页');
            },
            fail: (err) => {
              console.error('返回首页失败:', err);
              wx.showToast({
                title: '返回首页失败',
                icon: 'none',
                duration: 2000
              });
            }
          });
        }
      });
    } catch (error) {
      console.error('返回首页出错:', error);
      // 显示提示
      wx.showModal({
        title: '提示',
        content: '返回首页失败，请手动退出',
        showCancel: false
      });
    }
  },
})
