const app = getApp();
Page({
  data: {
    earningsList: [],
    totalProfit: "0.00",
    type: 'order',
    AUrl: app.globalData.AUrl,
  },
  onLoad: function (options) {
    const itsid = wx.getStorageSync('itsid');
    if (itsid) {
      this.getResult(itsid);
    } else {
      wx.showToast({
        title: 'itsid 未设置',
        icon: 'none'
      });
    }
    this.setData({
      type: options.type || 'order'
    });
  },
  getResult: function (itsid) {
    wx.showLoading({
      title: '加载中...'
    });
    wx.request({
      url: `${app.globalData. AUrl}/jy/go/we.aspx?ituid=106&itjid=10610&itcid=10610&itsid=${itsid}`,
      success: async (res) => {
        if (res.data?.code === '1') {
          const stores = res.data.result.list.map(store => ({
            id: store.unitid || store.id,
            storeNamegd: store.name,
            amount: '0.00'
          }));

          // 获取每个门店的详细收益
          const promises = stores.map(store => {
            return new Promise((resolve) => {
              wx.request({
                url: `${app.globalData. AUrl}/jy/go/we.aspx?ituid=106&itjid=10610&itcid=10625&unitid=${store.id}`,
                success: (res) => {
                  if (res.data?.code === '1' && res.data.result?.list?.length > 0) {
                    store.amount = (res.data.result.list[0].Totalprofit || '0.00').toString();
                  }
                  resolve();
                },
                fail: () => resolve()
              });
            });
          });

          await Promise.all(promises);

          // 计算总收益
          const total = stores.reduce((sum, item) => sum + parseFloat(item.amount), 0);

          this.setData({
            earningsList: stores,
            totalProfit: total.toFixed(2)
          });
        }
        wx.hideLoading();
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({
          title: '请求失败',
          icon: 'none'
        });
      }
    });
  },
  navigateToStoreDailyEarnings: function (e) {
    const storeId = e.currentTarget.dataset.storeid;
    const storeNamegd = e.currentTarget.dataset.storenamegd;

    wx.navigateTo({
      url: `/subPackages/package/pages/storeDailyEarnings/storeDailyEarnings?storeId=${storeId}&storeNamegd=${encodeURIComponent(storeNamegd)}`,
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