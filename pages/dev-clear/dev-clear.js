const app = getApp();

Page({
  data: {
    cleared: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.clearPrivacyAgreement();
  },

  /**
   * 清除隐私协议缓存
   */
  clearPrivacyAgreement: function() {
    try {
      console.log('正在清除隐私协议缓存...');
      
      // 清除本地存储
      wx.removeStorageSync('hasAgreedPrivacy');
      wx.removeStorageSync('privacyAgreedTime');
      
      // 清除全局变量
      app.globalData.hasAgreedPrivacy = false;
      
      // 更新状态
      this.setData({
        cleared: true
      });
      
      wx.showToast({
        title: '缓存已清除',
        icon: 'success',
        duration: 2000
      });
      
      console.log('隐私协议缓存已清除');
    } catch (error) {
      console.error('清除缓存失败:', error);
      wx.showToast({
        title: '清除失败',
        icon: 'none',
        duration: 2000
      });
    }
  },
  
  /**
   * 返回首页并重新加载
   */
  backToHome: function() {
    wx.reLaunch({
      url: '/pages/loading/loading',
    });
  },
  
  /**
   * 再次清除缓存
   */
  clearAgain: function() {
    this.clearPrivacyAgreement();
  }
}) 