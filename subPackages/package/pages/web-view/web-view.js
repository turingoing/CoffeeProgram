// web-view.js
Page({
  data: {
    url: ''
  },
  onLoad: function (options) {
    if (options.url) {
      this.setData({
        url: decodeURIComponent(options.url)
      });
    } else {
      wx.showToast({
        title: '链接无效',
        icon: 'none',
        duration: 2000
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 2000);
    }
  }
}); 