// subPackages/package/pages/jiesuan-pay/jiesuan-pay.js
const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    AUrl: app.globalData.AUrl,
    invokingWxPay: false,
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
    let that = this

    console.log("支付页面接收到的参数:", options)
    
    // 确保amt是数字类型，并检查是否为外送订单（包含配送费）
    let amtValue = parseInt(options.amt || 0);
    
    // 调试信息：检查金额是否正确
    console.log("解析后的金额(分):", amtValue);
    console.log("转换为元显示:", amtValue/100);
    
    // 检查是否为外送订单，应该包含配送费
    const orderType = options.orderType || options.type || '1';
    console.log("订单类型:", orderType, "(1=自提, 2=外送)");
    console.log("data:",wx.request.data);
    
    const isDelivery = orderType === '2';
    if (isDelivery) {
      console.log("这是外送订单，金额应该包含配送费");
    }
    
    this.setData({
      orderid: options.orderid || '',
      terminal: options.terminal || '',
      amt: amtValue, // 确保使用解析后的数字
      sign: options.sign || '',
      return_url: options.return_url || '',
      orderType: orderType, // 添加订单类型

      appId: options.appId || '',
      nonceStr: options.nonceStr || '',
      package: decodeURIComponent(options.package || ''),
      paySign: decodeURIComponent(options.paySign || ''),
      signType: options.signType || '',
      timeStamp: options.timeStamp || '',

      'result.client_sn': options.orderid || '',
      'result.sn': options.SN || '',
    }, () => {
      console.log("支付页面数据设置完成:", that.data);
    })
  },

  pay() {
    if (this.data.invokingWxPay) {
      return;
    }

    let that = this;

    const itsid = wx.getStorageSync('itsid')
    const ORDERID = that.data.result.client_sn
    const ZFID = that.data.result.sn
    console.log("itsid:", itsid);
    console.log("ORDERID:", ORDERID);
    console.log("ZFID:", ZFID);
    console.log("支付金额(分):", that.data.amt);
    console.log("支付金额(元):", that.data.amt/100);
    
    // 检查是否包含配送费的快速判断（简单估算）
    if (that.data.orderType === '2') { // 如果是外送订单
      const amtValue = Number(that.data.amt);
      if (amtValue % 500 === 0) { // 如果是整数元且能被5整除
        console.warn("警告：外送订单金额能被5整除，可能没有包含配送费!");
      } else {
        console.log("金额包含配送费(5元)");
      }
    }

    that.setData({ invokingWxPay: true });
    wx.requestPayment({
      timeStamp: that.data.timeStamp,
      nonceStr: that.data.nonceStr,
      package: that.data.package,
      signType: that.data.signType,
      paySign: that.data.paySign,
      success(res) {
        console.log("支付成功！", res);
        wx.request({
          url: `${that.data.AUrl}/jy/go/phone.aspx?mbid=114&ituid=106&itsid=${itsid}`,
          method: "POST",
          data: {
            ORDERID: ORDERID,
            ZFID: ZFID
          },
          success(res) {
            console.log(res)
            console.log('已调用', ORDERID, ZFID)
            wx.setStorageSync('updataArray', [])

            that.setData({
              'result.is_success': true,
            })

            let result = JSON.stringify(that.data.result)

            wx.navigateTo({
              url: `${that.data.return_url}?result=${result}`
            })
            // setTimeout(() => {
            // }, 200);
          }
        })
      },
      fail(res) {
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

      complete() {
        that.setData({ invokingWxPay: false });
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
    this.setData({ invokingWxPay: false });
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
    wx.switchTab({
      url: '/pages/order/order',
    })
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
