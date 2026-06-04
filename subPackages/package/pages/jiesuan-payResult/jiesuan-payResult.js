// subPackages/package/pages/jiesuan-payResult/jiesuan-payResult.js
const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    AUrl: app.globalData.AUrl
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    console.log(options);
    let resultObj = {};
    try {
      resultObj = JSON.parse(decodeURIComponent(options.result || '{}'));
    } catch (e) {
      resultObj = {};
    }
    const is_success = resultObj.is_success
    const itsid = wx.getStorageSync('itsid')
    const ORDERID = resultObj.client_sn
    const ZFID = resultObj.sn
    let that = this
    this.setData({
      result: options.result || '',
      is_success,
    });
    if (is_success) {
      // wx.request({
      //   url: `${that.data.AUrl}/jy/go/phone.aspx?mbid=114&ituid=106&itsid=${itsid}`,
      //   method: "POST",
      //   data: {
      //     ORDERID: ORDERID,
      //     ZFID: ZFID
      //   },
      //   success(res) {
      //     wx.setStorageSync('updataArray', [])
      //     console.log(res)
      //     console.log('已调用', ORDERID, ZFID)
      //   }
      // })
    }
  },

  goBackOrder() {
    wx.switchTab({
      url: '/pages/order/order',
    })
  },

  goBackOrders() {
    wx.switchTab({
      url: '/pages/orders/orders',
    })
  },
  handleBackToOrderPage() {
    if (this.data.is_success) {
      this.goBackOrders();
      return;
    }
    this.goBackOrder();
  },
  onBackPress() {
    this.handleBackToOrderPage();
    return true;
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
    wx.hideHomeButton();
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
