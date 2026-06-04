const app = getApp();
Page({
  data: {
    name: '', // 用户名
    leixing: '', // 用户类型
    freeze: '', // 我的消费券
    content: '', // 可用积分
    score: '', // 冻结积分
    money: '', // 余额
    charge: 300,
    isUpgraded: false,
    transactionCode: '',
    buttons: [{
        label: '普通会员',
        value: 3
        // content: '需要60%现金和40%积分，现金1800+积分1200'
      },
      {
        label: 'VIP会员',
        value: 0
        // content: '需要60%现金和40%积分，现金5400+积分3600'
      },
      {
        label: '铂金会员',
        value: 1
        // content: '需要60%现金和40%积分，现金16200+积分10800'
      },
      {
        label: '钻石会员',
        value: 2
        // content: '需要60%现金和40%积分，现金16200+积分10800'
      },

    ],
    value1: 3,
  },

  onLoad: function () {
    const itsid = wx.getStorageSync('itsid');
    if (itsid) {
      this.fetchData(itsid);
    } else {
      console.error('itsid 未定义或获取失败');
      wx.showToast({
        title: '未登录或会话已过期',
        icon: 'none'
      });
      wx.navigateTo({
        url: '/subPackages/user/pages/login/login',
      });
    }
    this.calculateCashAndPoints();
  },

  fetchData: function () {
    const that = this;
    const itsid = wx.getStorageSync('itsid');
    if (!itsid) {
      console.error('itsid 未定义或获取失败');
      wx.showToast({
        title: '未登录或会话已过期',
        icon: 'none'
      });
      wx.navigateTo({
        url: '/subPackages/user/pages/login/login',
      });
      return;
    }

    // 后台接口地址
    wx.request({
      url: `${app.globalData. AUrl}/jy/go/we.aspx?ituid=106&itjid=10603&itcid=10603&itsid=${itsid}`,
      method: 'GET',
      success: function (res) {
        console.log(res);
        if (res.statusCode === 200 && res.data) {
          that.setData({
            content: res.data.content || '0', // 可用积分
            freeze: res.data.freeze || '0', // 冻结积分
            money: res.data.money || '0', // 余额
            score: res.data.score || '0', // 积分
            name: res.data.name || '未登录', // 用户名
            leixing: res.data.leixing || '普通会员' // 用户类型
          });
        } else {
          wx.showToast({
            title: '获取数据失败',
            icon: 'none'
          });
        }
      },
      fail: function (error) {
        console.error('获取数据失败', error);
        wx.showToast({
          title: '网络请求错误',
          icon: 'none'
        });
      }
    });
  },
  confirmChange(e) { //确认划扣
    wx.showModal({
      title: '是否确认划扣',
      content: '一旦确认无法更改',
      complete: (res) => {
        if (res.cancel) {

        }

        if (res.confirm) {
          this.setData({
            showModal: true
          });
          wx.showModal({
            title: '请输入六位交易码',
            content: '',
            complete: (res) => {

              if (res.cancel) {

              }

              if (res.confirm) {

              }
              let that = this;
              const invite1 = wx.getStorageSync('invite');
              console.log('提交的推荐码:', invite1); // 调试日志
              console.log('邀请人ID:', invite1);
              const itsid = wx.getStorageSync('itsid');
              // const baseAmount = that.data.baseAmount; // 使用固定的单份基础金额
              // const quantity = that.data.quantity; // 使用页面数据中的 quantity
              // const amt = baseAmount * quantity; // 总充值金额
              const content = that.data.content || 0; // 获取当前用户的积分
              const pointsAmount = parseFloat(that.data.pointsAmount); // 需要的积分金额
              let value1 = that.data.value1
              let money = that.data.money
              console.log(money);
              let cashAmount = that.data.cashAmount
              // 判断积分是否足够
              if (Number(content) >= Number(pointsAmount) && Number(money) >= Number(cashAmount)) {
                console.log("够了");
                // 积分足够，可以进行充值
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
                    invite: invite1
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
                    wx.requestPayment({
                      "timeStamp": res.data.timeStamp,
                      "nonceStr": res.data.nonceStr,
                      "package": res.data.package,
                      "signType": res.data.signType,
                      "paySign": res.data.paySign,
                      "success": function (res) {
                        wx.showToast({
                          title: '划扣成功',
                          duration: 2000
                        });
                        setTimeout(() => {
                          that.setData({
                            visible: false
                          });
                        }, 2000);
                        wx.switchTab({
                          url: '/pages/home/home',
                        })
                      },
                      "fail": function (err) {
                        console.log(err.errMsg);
                        console.log("返回失败");
                        that.setData({
                          onclick: false
                        });
                        app.globalData.userInfo = true;
                        that.setData({
                          localVar: app.globalData.userInfo
                        });
                      }
                    });
                  }
                });
              } else {
                if (content < pointsAmount) {
                  // 消费券不足，提示用户
                  wx.showToast({
                    title: '消费券不足，无法充值',
                    icon: 'none',
                    duration: 2000
                  });
                }
                if (Number(money) < Number(cashAmount)) {
                  console.log("wwww", money);
                  console.log(cashAmount);
                  wx.showToast({
                    title: '余额不足，无法充值',
                    icon: 'none',
                    duration: 2000
                  });
                }
              }
            }
          })
        }
      }
    })
  },
  onChange1: function (e) {
    const value1 = e.detail.value;
    let charge = '';
    console.log(value1);
    switch (value1) {
      case 0: // 一份
        charge = 3000;
        break;
      case 1: // 三份
        charge = 9000;
        break;
      case 2: // 九份
        charge = 27000;
        break;
      case 3: // 300
        charge = 300;
        break;
      default:
        charge = 300;
    }
    console.log(charge);
    this.setData({
      value1: value1,
      charge: charge,
    });
    this.calculateCashAndPoints();
  },

  calculateCashAndPoints: function () {
    // const baseAmount = 1800; // 每一份的基础金额固定为1800元
    // const xiaofeiquan = 1200; //每份积分
    let charge = this.data.charge;
    console.log(charge);
    const cashAmount = (charge * 0.6).toFixed(2);
    const pointsAmount = (charge * 0.4).toFixed(2);

    this.setData({
      cashAmount: cashAmount,
      pointsAmount: pointsAmount,
    });
  },

  gocharge() {

  },
  onReady() {
    // 页面初次渲染完成
  },
  onShow() {
    // 页面显示
  },
  onHide() {
    // 页面隐藏
  },
  onUnload() {
    // 页面卸载
  },
  onPullDownRefresh() {
    // 下拉刷新
  },
  onReachBottom() {
    // 上拉触底
  },
  onShareAppMessage() {
    // 分享
  }
});