const app = getApp();
Page({
  data: {
    tupianUrl: app.globalData.tupianUrl,
    quantity: 1,
    membershipRechargePlans: {},
    baseAmount: 180, // 默认基础金额
    showCodeDialog: false, // 控制弹窗显示
    inputBoxes: ["", "", "", "", "", ""], // 六个输入框
    codeValue: '', // 完整交易码
    testFocus: false, // 隐藏输入框聚焦
    // checked: false,
    money: '',
    value: 0,
    value1: 0,
    buttons: [{
      label: '普通会员',
      value: 0
      // content: '需要60%现金和40%积分，现金180+积分120'
    },
    {
      label: 'VIP会员',
      value: 1
      // content: '需要60%现金和40%积分，现金5400+积分3600'
    },
    {
      label: '铂金会员',
      value: 2
      // content: '需要60%现金和40%积分，现金16200+积分10800'
    },
    {
      label: '钻石会员',
      value: 3
      // content: '需要60%现金和40%积分，现金16200+积分10800'
    },
      // {
      //   label: '自定义',
      //   value: 3
      //   // content: '自定义想充值得份数，一份需要60%现金和40%积分，以此类推乘以份数即可'
      // },
    ],
    charge: '',
    selectedContent: '需要60%现金和40%积分，现金1800+积分1200', // 用于存储选中按钮对应的文字描述
    cashAmount: '600', // 现金金额
    pointsAmount: '400.00', // 积分金额
  },
  // handleChange(e) {
  //   this.setData({
  //     checked: e.detail.checked,
  //   });
  // },


  // 显示交易码弹窗
  showCodeDialog() {
    this.setData({
      showCodeDialog: true
    });
  },

  // 关闭弹窗
  closeDialog() {
    this.setData({
      showCodeDialog: false,
      codeValue: '',
      inputBoxes: ["", "", "", "", "", ""]
    });
  },


  handleGetFocus() {
    this.setData({
      testFocus: true
    })
  },

  handleNotFocus() {
    this.setData({
      testFocus: false
    })
  },
  // 处理输入
  handleTestInput(e) {
    const value = e.detail.value
    const tempList = this.data.inputBoxes
    for (let i = 0; i < 6; i++) {
      tempList[i] = value[i] ? value[i] : ''
    }
    this.setData({
      inputBoxes: tempList,
      codeValue: value
    })
  },
  // 验证交易码
  getServerTransactionCode() {
    return new Promise((resolve, reject) => {
      // const userid = wx.getStorageSync('userid');
      const itsid = wx.getStorageSync('itsid') || app.globalData.itsid || '';// ✅ 修复1：和上方保持一致，缓存+全局双兜底，防止丢失
      let that = this
      wx.showToast({
        title: '验证中...',
        icon: 'loading',
        mask: true
      });
      wx.request({
        url: `${app.globalData.AUrl}/jy/go/we.aspx`,
        method: 'GET',
        data: {
          ituid: 106,
          itjid: 10610,
          itcid: 10632,
          itsid
        },
        success: (res) => {
          console.log('交易码接口响应：', res.data);
          wx.hideToast()
          // 解析接口响应
          if (res.data.result.list[0].transactionCode === that.data.codeValue) {
            wx.showToast({
              title: '操作成功',
              icon: 'none',
              duration: 2000
            })
            that.closeDialog();
            that.executeRecharge();
          } else {
            wx.showToast({
              title: '交易码错误',
              icon: 'none',
              duration: 2000
            })
            // reject(new Error('交易码错误'));
          }
        },
        fail: (err) => {
          reject(new Error('网络连接失败，请检查网络'));
        }
      });
    });
  },

  // 修改后的验证方法
  verifyCode() {
    const that = this;
    const {
      codeValue
    } = this.data;

    if (!/^\d{6}$/.test(codeValue)) {
      wx.showToast({
        title: '请输入6位数字交易码',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    // wx.showToast({
    //   title: '验证中...',
    //   icon: 'loading',
    //   mask: true
    // });

    this.getServerTransactionCode()
    // .then(serverCode => {
    //   // 安全对比（防止时序攻击）
    //   const safeCompare = (a, b) => {
    //     let mismatch = 0;
    //     const length = Math.max(a.length, b.length);
    //     for (let i = 0; i < length; ++i) {
    //       mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
    //     }
    //     return mismatch === 0;
    //   };

    //   if (safeCompare(codeValue, serverCode)) {
    //     that.closeDialog();
    //     that.executeRecharge();
    //   } else {
    //     wx.showToast({
    //       title: '交易码不匹配',
    //       icon: 'none'
    //     });
    //   }
    // })
    // .catch(err => {
    //   console.error('验证失败:', err);
    //   wx.showToast({
    //     title: err.message || '验证失败',
    //     icon: 'none',
    //     duration: 2000
    //   });
    // })
    // .finally(() => {
    //   wx.hideToast();
    // });
  },

  // 事件处理函数直接定义在这里
  onChange: function (e) {
    this.setData({
      value: e.detail.value,
    });
    this.calculateCashAndPoints();
  },
  gocharge(e) {
    console.log("aaaa");
    // wx.redirectTo({
    //   url: '/subPackages/package/pages/shengji/shengji ',
    // })
    wx.navigateTo({
      url: '/subPackages/package/pages/shengji/shengji',
    })
  },
  confirmChange(e) {
    wx.showModal({
      title: '是否确认划扣',
      content: '一旦确认无法更改',
      complete: (res) => {
        if (res.confirm) {
          this.showCodeDialog(); // 显示交易码弹窗
        }
      }
    });
  },
  executeRecharge() {
    let that = this;
    const invite1 = wx.getStorageSync('invite');
    console.log('提交的推荐码:', invite1); // 调试日志
    console.log('邀请人ID:', invite1);
    const itsid = wx.getStorageSync('itsid');
    // const baseAmount = that.data.baseAmount; // 使用固定的单份基础金额
    // const quantity = that.data.quantity; // 使用页面数据中的 quantity
    // const amt = baseAmount * quantity; // 总充值金额
    const content = that.data.content || 0; // 获取当前用户的积分
    const score = that.data.score || 0; // 获取当前用户的积分
    const pointsAmount = parseFloat(that.data.pointsAmount); // 需要的积分金额
    let value1 = that.data.value1
    let money = that.data.money
    console.log(money);
    let cashAmount = that.data.cashAmount
    // 判断积分是否足够
    if (Number(score) >= Number(pointsAmount) && Number(money) >= Number(cashAmount)) {
      console.log("够了");
      // 积分足够，可以进行充值
      // 根据 quantity 选择对应的 MCODE
      let MCODE;
      switch (value1) {
        case 0:
          MCODE = 900;
          break;
        case 1:
          MCODE = 901;
          break;
        case 2:
          MCODE = 902;
          break;
        case 3:
          MCODE = 903;
          break;
        default:
          MCODE = ''; // 默认值，可根据需求调整
          break;
      }
      console.log(MCODE);
      console.log(content);
      console.log(that.data.cashAmount);
      wx.request({
        url: `${app.globalData.backUrl}phone.aspx?mbid=10623&ituid=${app.globalData.ituid}&itsid=${itsid}`,
        data: {
          MCODE: MCODE, // 动态设置MCODE
          OPID: '1201',
          UNITID: '1',
          NUM: '1',
          USERID: '0',
          NOTE: ' ',
          AMT: that.data.cashAmount,
          // invite: invite1
        },
        method: 'POST',
        header: {
          'content-type': 'application/json'
        },
        success: (res) => {
          wx.showToast({
            title: '划扣成功',
            duration: 2000
          });
          that.setData({
            visible: false
          });
          wx.switchTab({
            url: '/pages/home/home',
          })
          // wx.requestPayment({
          //   "timeStamp": res.data.timeStamp,
          //   "nonceStr": res.data.nonceStr,
          //   "package": res.data.package,
          //   "signType": res.data.signType,
          //   "paySign": res.data.paySign,
          //   "success": function (res) {
          //     wx.showToast({
          //       title: '划扣成功',
          //       duration: 2000
          //     });
          //     setTimeout(() => {
          //       that.setData({
          //         visible: false
          //       });
          //     }, 2000);
          //     wx.switchTab({
          //       url: '/pages/home/home',
          //     })
          //   },
          //   "fail": function (err) {
          //     console.log(err.errMsg);
          //     console.log("返回失败");
          //     that.setData({
          //       onclick: false
          //     });
          //     app.globalData.userInfo = true;
          //     that.setData({
          //       localVar: app.globalData.userInfo
          //     });
          //   }
          // });
        }
      });
    } else {
      if (Number(money) < Number(cashAmount)) {
        // if (Number(money) < Number(cashAmount)) {
        console.log("wwww", money);
        console.log(cashAmount);
        wx.showToast({
          title: '余额不足，无法充值',
          icon: 'none',
          duration: 2000
        });
        return
      }
      if (Number(score) < Number(pointsAmount)) {
        // 消费券不足，提示用户
        wx.showToast({
          title: '消费券不足，无法充值',
          icon: 'none',
          duration: 2000
        });
        return
      }
    }
  },
  onChange1: function (e) {
    const value1 = e.detail.value;
    console.log(value1);
    let charge = '';
    switch (value1) {
      case 0: // 300
        charge = 1000;
        break;
      case 1: // 一份
        charge = 3000;
        break;
      case 2: // 三份
        charge = 9000;
        break;
      case 3: // 九份
        charge = 27000;
        break;
      default:
        charge = 1000;
    }
    console.log(charge);
    this.setData({
      fetchMoney: this.data.chongZhiMoneyList[value1].price, // 发送请求的金额
      value1: value1,
      charge: charge,
    });
    this.calculateCashAndPoints();
  },

  calculateCashAndPoints: function () {
    let charge = this.data.charge;
    //  console.log(charge);
    const cashAmount = (charge * 0.6).toFixed(2);
    const pointsAmount = (charge * 0.4).toFixed(2);

    //  const selectedContent = `需要60%现金和40%积分，现金${cashAmount}+积分${pointsAmount}`;
    this.setData({
      cashAmount: cashAmount,
      pointsAmount: pointsAmount,
    });
  },


  onLoad: function () {
    const itsid = wx.getStorageSync('itsid');
    this.fetchData(itsid);
    this.getMembershipPlans(itsid);
    this.getChongZhiMoney(); // 获取会员充值金额
    this.fetchCode();
    // const app = getApp();
    // console.log(app.globalData.invite1);
    // this.setData({
    //   invite1: app.globalData.invite1 || ''
    // });
  },
  fetchData: function (itsid) {
    const that = this;
    wx.request({
      url: `${app.globalData.AUrl}/jy/go/we.aspx?ituid=106&itjid=10602&itcid=10602&itsid=${itsid}`, // 后台接口地址
      method: 'GET',
      success: function (res) {
        console.log(res);
        if (res.statusCode == 200 && res.data) {
          that.setData({
            content: res.data.content || '',
            freeze: res.data.freeze || '',
            money: res.data.money || '默认值', // 如果money为空，则设置为默认值
            score: res.data.score || '',
          });
        }
      },
      fail: function (error) {
        console.error('获取数据失败', error);
        that.setData({
          money: '获取失败', // 设置默认值或提示信息
        });
      }
    });
  },
  getMembershipPlans: function (itsid) {
    wx.request({
      url: `${app.globalData.AUrl}/jy/go/we.aspx?ituid=106&itjid=10608&itcid=10608&itsid=${itsid}`,
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200 && res.data && res.data.membershipRechargePlans) {
          this.setData({
            membershipRechargePlans: res.data.membershipRechargePlans
          });
        } else {
          wx.showToast({
            title: '获取数据失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        wx.showToast({
          title: '请求失败',
          icon: 'none'
        });
      },
    });
  },
  getChongZhiMoney() {
    let that = this
    wx.request({
      url: `${app.globalData.AUrl}/jy/go/we.aspx?ituid=106&itjid=10610&itcid=10639`,
      method: "GET",
      success(res) {
        console.log(res)
        that.setData({
          chongZhiMoneyList: res.data.result.list,

          fetchMoney: res.data.result.list[0].price,
          cashAmount: res.data.result.list[0].price,
        })
      }
    })
  },
  fetchCode() {
    let that = this
    const userid = wx.getStorageSync('userid')
    wx.request({
      url: `${app.globalData.AUrl}/jy/go/we.aspx?ituid=106&itjid=10610&itcid=10637&userid=${userid}`,
      method: "GET",
      success(res) {
        console.log(res)
        that.setData({
          inviteCode: res.data.result.list[0].invite
        })
      }
    })
  },

  onDecrease: function () {
    let newQuantity = this.data.quantity - 1;
    if (newQuantity < 1) newQuantity = 1;
    this.setData({
      quantity: newQuantity
    });
    this.calculateCashAndPoints();
  },

  onIncrease: function () {
    this.setData({
      quantity: this.data.quantity + 1
    });
    this.calculateCashAndPoints();
  },

  onRecharge: function () {
    let that = this;
    console.log('提交的推荐码:', this.data.inviteCode);
    const inviteCode = this.data.inviteCode
    const itsid = wx.getStorageSync('itsid');
    const baseAmount = that.data.baseAmount;
    const cashAmount = that.data.cashAmount;
    console.log(cashAmount);
    const quantity = that.data.quantity;
    const amt = baseAmount * quantity;
    const content = that.data.content || 0;
    const pointsAmount = parseFloat(that.data.pointsAmount);
    let value1 = that.data.value1;
    const fetchMoney = that.data.fetchMoney

    // 根据 quantity 选择对应的 MCODE
    let MCODE;
    switch (value1) {
      case 3:
        MCODE = 900;
        break;
      case 0:
        MCODE = 901;
        break;
      case 1:
        MCODE = 902;
        break;
      case 2:
        MCODE = 903;
        break;
      default:
        MCODE = '';
        break;
    }
    console.log(app.globalData.backUrl);
    wx.request({
      url: `${app.globalData.backUrl}phone.aspx?mbid=10601&ituid=${app.globalData.ituid}&itsid=${itsid}`,
      data: {
        MCODE: MCODE,
        OPID: '1206',
        UNITID: '1',
        NUM: quantity,
        USERID: '0',
        NOTE: ' ',
        AMT: fetchMoney,
        invite: inviteCode,
        RURL: '/subPackages/package/pages/shareholder-payResult/shareholder-payResult'
      },
      method: 'POST',
      header: {
        'content-type': 'application/json'
      },
      success: (res) => {
        try {
          console.log("接口返回数据:", res.data);
          
          // 处理返回数据可能是字符串的情况
          let responseData = res.data;
          if (typeof responseData === 'string') {
            try {
              // 尝试解析JSON字符串
              responseData = JSON.parse(responseData);
            } catch (e) {
              console.error("JSON解析失败，尝试手动提取yburl", e);
              
              // 手动提取yburl
              const ybUrlMatch = responseData.match(/\"yburl\":(https:\/\/[^,\}]+)/);
              if (ybUrlMatch && ybUrlMatch[1]) {
                // 找到了yburl，直接跳转
                const yburl = ybUrlMatch[1].trim();
                console.log("提取到yburl:", yburl);
                wx.navigateTo({
                  url: `/subPackages/package/pages/web-view/web-view?url=${encodeURIComponent(yburl)}`
                });
                return;
              }
            }
          }
          
          // 检查返回数据中是否包含yburl
          if (responseData && responseData.yburl) {
            // 如果存在yburl，则直接跳转到易宝支付页面
            console.log("跳转到易宝支付页面:", responseData.yburl);
            wx.navigateTo({
              url: `/subPackages/package/pages/web-view/web-view?url=${encodeURIComponent(responseData.yburl)}`
            });
          } else if (responseData && responseData.yeepay) {
            // 如果不存在yburl但存在yeepay，则按原来的逻辑处理
            let packageNew = encodeURIComponent(responseData.yeepay.package);
            let paySignNew = encodeURIComponent(responseData.yeepay.paySign);

            console.log("packageNew:", packageNew);
            console.log("paySignNew:", paySignNew);

            wx.navigateTo({
              url: `/subPackages/package/pages/shareholder-pay/shareholder-pay?return_url=${responseData.rurl}&orderid=${responseData.orderid}&terminal=${responseData.terminal_sn}&amt=${responseData.AMT}&sign=${responseData.sign}&appId=${responseData.yeepay.appId}&nonceStr=${responseData.yeepay.nonceStr}&package=${packageNew}&paySign=${paySignNew}&signType=${responseData.yeepay.signType}&timeStamp=${responseData.yeepay.timeStamp}&SN=${responseData.SN}`,
            });
          } else {
            // 处理不符合预期的响应
            wx.showToast({
              title: '支付接口返回格式异常',
              icon: 'none',
              duration: 2000
            });
            console.error("接口返回数据格式异常:", responseData);
          }
        } catch (error) {
          console.error("处理响应数据时出错:", error);
          wx.showToast({
            title: '处理支付数据失败',
            icon: 'none',
            duration: 2000
          });
        }
      },
      fail: (err) => {
        console.error("请求失败:", err);
        wx.showToast({
          title: '请求失败，请稍后再试',
          icon: 'none'
        });
      }
    });
  }
});