// subPackages/package/pages/anquan/anquan.js
const app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {

  },
  clearAuthState() {
    wx.setStorageSync('isLoginSuccess', false);
    wx.removeStorageSync('itsid');
    wx.removeStorageSync('userid');
    wx.removeStorageSync('name');
    wx.removeStorageSync('avatar');
    wx.removeStorageSync('inviteUserid');
    wx.removeStorageSync('updataArray');
    wx.removeStorageSync('sum');
    wx.removeStorageSync('total');
    wx.removeStorageSync('categories');
    wx.removeStorageSync('dishSum');
    app.globalData.userid = null;
    app.globalData.itsid = null;
  },
  logout() {
    wx.showModal({
      title: '提示',
      content: '确认退出登录？',
      confirmText: '退出登录',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          try {
            wx.clearStorageSync();
          } catch (e) { }
          this.clearAuthState();
          wx.showToast({
            "title": "退出登录成功",
            "icon": "success"
          });
          wx.switchTab({ url: '/pages/my/my' });
          }
        }
    });
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {

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
