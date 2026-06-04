// subPackages/package/pages/shareholder-pay/shareholder-pay.js
const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    AUrl: app.globalData.AUrl,
    result: {
      is_success: false,//支付成功
      client_sn: '',//订单id
      sn: '',//支付id
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    let that = this;

    console.log(options)
    this.setData({
      orderid: options.orderid,
      terminal: options.terminal,
      amt: options.amt,
      sign: options.sign,
      return_url: options.return_url,

      appId: options.appId,
      nonceStr: options.nonceStr,
      package: decodeURIComponent(options.package),
      paySign: decodeURIComponent(options.paySign),
      signType: options.signType,
      timeStamp: options.timeStamp,

      'result.client_sn': options.orderid,
      'result.sn': options.SN,
    }, () => {
      console.log("that.data:", that.data);
    })
  },

  pay() {
    let that = this;

    const itsid = wx.getStorageSync('itsid')
    const ORDERID = that.data.result.client_sn
    const ZFID = that.data.result.sn
    console.log("itsid:", itsid);
    console.log("ORDERID:", ORDERID);
    console.log("ZFID:", ZFID);

    wx.requestPayment({
      timeStamp: that.data.timeStamp,
      nonceStr: that.data.nonceStr,
      package: that.data.package,
      signType: that.data.signType,
      paySign: that.data.paySign,
      success(res) {
        console.log("支付成功！", res);
        wx.request({
          url: `${that.data.AUrl}/jy/go/phone.aspx?mbid=10628&ituid=106&itsid=${itsid}`,
          method: "POST",
          data: {
            ORDERID: ORDERID,
            ZFID: ZFID
          },
          success(res) {
            console.log(res)
            console.log('已调用', ORDERID, ZFID)

            that.setData({
              'result.is_success': true,
            })
            let result = JSON.stringify(that.data.result)
            wx.navigateTo({
              url: `${that.data.return_url}?result=${result}`
            })
          }
        })
      },
      fail(res) {
        console.log("支付失败！", res);
        that.setData({
          'result.is_success': false,
        })
        let result = JSON.stringify(that.data.result)

        if (res.errMsg === 'requestPayment:fail cancel') {
          console.warn('用户取消支付');

          wx.navigateTo({
            url: `${that.data.return_url}?result=${result}`
          })
          // setTimeout(() => {
          // }, 200);
        }

        else {
          console.error('支付失败', res);
          wx.request({
            url: `${that.data.AUrl}/jy/go/phone.aspx?mbid=166&ituid=106&itsid=${itsid}`,
            method: "POST",
            data: {
              ORDERID: ORDERID,
              ZFID: res.errMsg
            },
            success(res) {
              console.log(res)
              console.log('已调用', ORDERID, ZFID)

              wx.navigateTo({
                url: `${that.data.return_url}?result=${result}`
              })
              // setTimeout(() => {
              // }, 200);
            }
          })
        }
      },

      complete(res) {

      }
    })
  },

  navigateTo: function (e) {
    wx.redirectTo({
      url: e.detail.url,
      fail(e) {
        wx.showToast({
          title: "支付失败"
        });
      },
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

  }
})