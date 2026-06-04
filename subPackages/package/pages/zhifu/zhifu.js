Page({
  data: {},
  onLoad: function () {
    this.setData({
      client_sn: Date.now(),
    });
  },
  navigateTo: function (e) {
    wx.redirectTo({
      url: e.detail.url,
      fail(e) {
        console.log(e);
      },
    });
  },
});