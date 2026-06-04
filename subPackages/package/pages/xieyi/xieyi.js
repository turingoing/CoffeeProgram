const app = getApp();

Page({
  data: {
    agreementType: '',
    content: ''
  },

  onLoad(options) {
    const agreement = options.agreement || '';

    if (agreement === 'recharge') {
      wx.setNavigationBarTitle({
        title: '充值协议'
      });
      this.setData({
        agreementType: 'recharge'
      });
      return;
    }

    let itjid = 0;
    if (agreement === 'user') {
      itjid = 10600;
      wx.setNavigationBarTitle({
        title: '卡狄咖啡用户服务协议'
      });
    } else if (agreement === 'privacy') {
      itjid = 10601;
      wx.setNavigationBarTitle({
        title: '卡狄咖啡用户隐私使用协议'
      });
    }

    if (!itjid) {
      return;
    }

    wx.request({
      url: `${app.globalData.AUrl}/jy/go/we.aspx?ituid=106&itjid=${itjid}`,
      method: 'GET',
      success: (res) => {
        this.setData({
          agreementType: agreement,
          content: res.data.content || ''
        });
      }
    });
  }
});
