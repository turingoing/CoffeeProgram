// subPackages/package/pages/yishifang/yishifang.js
const app = getApp();
Page({
  data: {
    list: [],
    AUrl: app.globalData.AUrl,
  },
  onLoad: function () {
    this.fetchReportData();
  },
  fetchReportData: function () {
    const that = this;
    const userid = wx.getStorageSync('userid');
    wx.request({
      url: `${app.globalData.AUrl}/jy/go/we.aspx?ituid=106&itjid=10610&itcid=10643&userid=${userid}`,
      method: 'GET',
      header: {
        'Content-Type': 'application/json'
      },
      success: function (res) {
        if (res.statusCode === 200) {
          that.setData({
            list: res.data.result.list
          });
        } else {
          wx.showToast({
            title: '获取数据失败',
            icon: 'none'
          });
        }
      },
      fail: function (err) {
        wx.showToast({
          title: '请求失败',
          icon: 'none'
        });
        console.error(err);
      }
    });
  },
  /**
   * 生命周期函数--监听页面加载
   */


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