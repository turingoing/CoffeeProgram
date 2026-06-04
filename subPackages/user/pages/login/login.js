// pages/login/login.js

const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    phone: '',
    itsid: '',
    // avatarUrl: app.globalData.userInfo.avatarUrl,
    projectName: app.globalData.projectName,
    nickname: '',
    userInfo: {}
  },

  // 获取用户头像
  onChooseAvatar(e) {
    const {
      avatarUrl
    } = e.detail
    this.setData({
      avatarUrl: avatarUrl,
    })
  },

  // 昵称
  nameInput: function (e) {
    console.log("1011111");
    let that = this
    let value = e.detail.value.replace(/\s+/g, '') //去除空格
    // 更新昵称
    that.setData({
      nickname: value
    });
    app.globalData.nickname = value
  },

  nameFocus(e) {
    let that = this
    that.setData({
      nickname: e.detail.value
    })
  },

  getUserGender: function () {
    wx.getSetting({ //判断用户是否授权
      success: (res) => {
        console.log(res);
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo  
          console.log("用户已经授权");
          wx.getUserInfo({
            success: (res) => {
              console.log(res);
            },
            fail: (err) => {
              console.log(err);
            }
          });
        } else {
          // 未授权，需要先请求授权  
          wx.authorize({
            scope: 'scope.userInfo',
            success: (res) => {
              console.log(res);
              // 授权成功，再次调用 getUserInfo  
              wx.getUserInfo({
                success: (res) => {
                  console.log(res);
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

  // 注册
  goindex(e) {
    // console.log(app.globalData);
    // let that = this;
    // if (that.data.nickname) {
    //   wx.login({
    //     success: (res) => {
    //       wx.uploadFile({//注册用户
    //         filePath: that.data.avatarUrl,
    //         name: 'file',
    //         url: `${app.globalData.backUrl}phone.aspx?mbid=148&unitid=2&ituid=106&code=` + res.code,
    //         header: {
    //           'content-type': 'application/json'
    //         },
    //         formData: {
    //           filepath: 'images\\singeravatar',   //用户头像路径
    //           name: that.data.nickname,           //用户昵称
    //           gender: '男'                        //用户默认性别
    //         },
    //         success: res => {//注册成功
    //           wx.showToast({
    //             title: '注册成功',
    //             icon: "success",
    //             duration: 1000,
    //             success() {//执行登录
    //               setTimeout(() => {//根据上面设置的秒数延时
    //                 wx.showLoading({
    //                   title: '正在登录中...',
    //                   // 是否展示透明蒙层，防止触摸穿透
    //                   mask: true
    //                 })
    //                 wx.login({//登录
    //                   success: (res) => {
    //                     console.log(res.code)
    //                     wx.request({
    //                       url: `${app.globalData.backUrl}phone.aspx?mbid=129&ituid=106`,
    //                       data: {
    //                         code: res.code
    //                       },
    //                       success(res) {
    //                         console.log('注册后自动登录的res.data.value', res.data.value)
    //                         let itsid_exist = res.data.value

    //                         app.globalData.itsid = res.data.value.itsid
    //                         console.log("itsid:", app.globalData.itsid);
    //                         // 更新动态itsid
    //                         wx.setStorageSync(that.data.projectName, { itsid: itsid_exist.itsid, userid: itsid_exist.userid });

    //                         wx.request({
    //                           url: `${app.globalData.backUrl}we.aspx?ituid=106&itjid=1026&itcid=66032&itsid=` + itsid_exist.itsid,  // 请求的接口地址
    //                           // data: {},  // 请求参数，可以是一个对象或者一个字符串
    //                           // method: 'GET',  // 请求方法，支持GET和POST，默认为GET
    //                           // header: {
    //                           //   'content-type': 'application/json'  // 设置请求的header，通常用于指定请求数据的格式
    //                           // },
    //                           success(res) {
    //                             console.log("data_from_serve", res.data.data_from_serve)
    //                             that.setData({
    //                               userInfo: res.data.data_from_serve,
    //                               userid: res.data.data_from_serve.userid
    //                             });
    //                             app.globalData.userid = res.data.data_from_serve.userid

    //                             let newDigtalInfo = {
    //                               ...itsid_exist, // 展开原有的digtalInfo对象  
    //                               type: res.data.data_from_serve.type,
    //                               name: res.data.data_from_serve.name,
    //                               unitid: res.data.data_from_serve.unitid,
    //                               avatarUrl: res.data.data_from_serve.avatarUrl
    //                             };
    //                             wx.setStorageSync(that.data.projectName, newDigtalInfo);

    //                             app.globalData.userInfo = newDigtalInfo;
    //                             app.globalData.isLogin = true;

    //                             wx.switchTab({//跳转回首页
    //                               url: '/pages/home/home',
    //                             })
    //                           }
    //                         })
    //                       }, fail(res) {
    //                         wx.showToast({
    //                           title: '没有账号，请注册',
    //                         })
    //                       }
    //                     })
    //                   },
    //                   complete() {
    //                     wx.hideLoading()
    //                   }
    //                 });
    //               }, 1000)
    //             }
    //           });
    //         },
    //         fail(res) {
    //           wx.showToast({
    //             title: '注册失败',
    //             icon: "error",
    //             duration: 2000
    //           })
    //         },
    //         complete: function (res) {
    //           // 无论成功还是失败都会执行  
    //         }
    //       });
    //     },
    //   })
    // } else {
    //   wx.showToast({
    //     title: '请完善信息',
    //     icon: 'error',
    //   })
    // }
    wx.navigateTo({
      url: '/subPackages/user/pages/register/register?from=2',
    })
  },

  //点击登录（获取itsid情况下) 
  login() {
    // 显示 loading 提示框
    wx.showLoading({
      title: '正在登录中...',
      // 是否展示透明蒙层，防止触摸穿透
      mask: true
    })
    let that = this;
    wx.login({
      success: (res) => {
        wx.request({
          url: `${app.globalData.backUrl}phone.aspx?mbid=129&ituid=106`,
          data: {
            code: res.code
          },
          success(res) {
            let itsid_exist = res.data.value
            app.globalData.itsid = res.data.value.itsid
            console.log("login的itsid:", app.globalData.itsid);
            wx.setStorageSync('itsid', app.globalData.itsid);
            if (itsid_exist.itsid == '0') {
              wx.showModal({
                content: '没有账号，请注册',
                complete: (res) => {
                  // if (res.cancel) {}
                  // if (res.confirm) {}
                }
              })
            } else {
              wx.request({
                url: `${app.globalData.backUrl}we.aspx?ituid=106&itjid=1026&itcid=66032&itsid=` + itsid_exist.itsid, // 请求的接口地址
                success: function (res) {
                  console.log("log获取信息：", res);
                  that.setData({
                    userInfo: res.data.data_from_serve,
                    userid: res.data.data_from_serve.userid,
                  });
                  app.globalData.userid = res.data.data_from_serve.userid
                  // app.globalData.avatar = res.data.data_from_serve.avatarUrl
                  wx.setStorageSync('avatar', res.data.data_from_serve.avatarUrl)

                  let newDigtalInfo = {
                    ...itsid_exist, // 展开原有的digtalInfo对象  
                    type: res.data.data_from_serve.type,
                    name: res.data.data_from_serve.name,
                    unitid: res.data.data_from_serve.unitid,
                    avatarUrl: res.data.data_from_serve.avatarUrl
                  };

                  wx.switchTab({ //跳转回首页
                    url: '/pages/home/home',
                  })
                },
                fail(res) {
                  wx.showToast({
                    title: '没有账号，请注册',
                  })
                }
              })
            }
          }


        })
      },
      complete() {
        wx.hideLoading()
      }
    });

  },
  onPickerChange(e) {
    const {
      key
    } = e.currentTarget.dataset;
    const {
      value
    } = e.detail;
    let sex = e.detail.value[0] == '女' ? '0' : '1'
    console.log('picker change:', e.detail.value, sex);

    this.setData({
      gender: e.detail.value,
      [`${key}Visible`]: false,
      [`${key}Value`]: value,
      [`${key}Text`]: value.join(' '),
      sex: sex
    });
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    let that = this;
    wx.login({
      success: (res) => {
        wx.request({
          url: `${app.globalData.backUrl}phone.aspx?mbid=129&ituid=${app.globalData.ituid}`,
          data: {
            code: res.code
          },
          success(res3) {
            console.log(res3)
            app.globalData.userid = res3.data.value.userid
            app.globalData.itsid = res3.data.value.itsid
            console.log("userid是:" + app.globalData.userid);
            console.log("itsid是:" + app.globalData.itsid);
            wx.setStorageSync('userid', res3.data.value.userid);
            wx.setStorageSync('itsid', res3.data.value.itsid);
            // console.log("?><", app.globalData);
            // // 更新动态itsid
            // let userinfo = wx.getStorageSync(app.globalData.projectName);
            // let itsid_exist = res3.data.value
            // if (userinfo?.itsid) {
            //   userinfo.itsid = itsid_exist.itsid
            // } else {
            //   userinfo = {
            //     itsid: itsid_exist.itsid
            //   }
            // }
            // // var projectName = '${app.globalData.projectName}'
            // wx.setStorageSync(app.globalData.projectName, userinfo)
          }
        })
      },

      complete() {
        wx.hideLoading()
      }
    });
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
  onHide() {},

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    app.globalData.userInfo = this.data.userInfo;
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

  }
})