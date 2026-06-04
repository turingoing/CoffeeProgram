// subPackages/package/pages/shareholder-payResult/shareholder-payResult.js
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
    const is_success = JSON.parse(options.result).is_success
    const itsid = wx.getStorageSync('itsid')
    const ORDERID = JSON.parse(options.result).client_sn
    const ZFID = JSON.parse(options.result).sn
    let that = this
    this.setData({
      result: options.result,
      is_success,
    });
    if (is_success) {
      // wx.request({
      //   url: `${that.data.AUrl}/jy/go/phone.aspx?mbid=10628&ituid=106&itsid=${itsid}`,
      //   method: "POST",
      //   data: {
      //     ORDERID: ORDERID,
      //     ZFID: ZFID
      //   },
      //   success(res){
      //     console.log(res)
      //     console.log('已调用', ORDERID, ZFID)
      //   }
      // })
    }
  },

  goBackHome() {
    wx.switchTab({
      url: '/pages/home/home',
    })
  },
  goBackShareholder() {
    wx.navigateTo({
      url: '/subPackages/package/pages/shareholder/shareholder',
    })
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