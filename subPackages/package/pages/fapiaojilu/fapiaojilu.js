// subPackages/package/pages/fapiaojilu/fapiaojilu.js
const app = getApp();
Page({
  data: {
    orders: [], // 用于存储订单数据
    selectedIds: [],
    selectAll: false,
    totalAmount: 0,
  },

  onLoad(options) {
    const userid = wx.getStorageSync('userid');

    let that = this;
    wx.request({
      url: `${app.globalData.backUrl}we.aspx?ituid=${app.globalData.ituid}&itjid=0107&itcid=10627&userid=${userid}`,
      success(res) {
        console.log(res);
        console.log(res.data.result);
        that.setData({
          orders: res.data.result.goods || [] // 将接口返回的订单数据存储到 orders 中
        });
      },
      fail(err) {
        console.error(err);
        wx.showToast({
          title: '获取订单失败',
          icon: 'none',
        });
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