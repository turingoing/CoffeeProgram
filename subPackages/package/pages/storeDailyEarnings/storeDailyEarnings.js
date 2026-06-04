// storeDailyEarnings.js
const app = getApp();
const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
};

Page({
  data: {
    storeNamegd: '',
    storeId: '',
    dailyEarningsList: [],
    isLoading: true
  },

  onLoad: function (options) {
    console.log('接收到的参数:', options);
    this.initParams(options);
    this.getDailyEarningsData();
  },

  initParams: function (options) {
    if (!options.storeId) {
      wx.showToast({
        title: '参数错误',
        icon: 'none'
      });
      wx.navigateBack({
        delta: 1
      });
      return;
    }

    this.setData({
      storeId: options.storeId,
      storeNamegd: decodeURIComponent(options.storeNamegd)
    });
  },

  getDailyEarningsData: function () {
    const that = this;
    const cacheKey = `dailyEarnings-${this.data.storeId}`;
    const cachedData = wx.getStorageSync(cacheKey);

    if (cachedData) {
      this.setData({
        dailyEarningsList: cachedData,
        isLoading: false
      });
      return;
    }

    wx.showLoading({
      title: '加载中...'
    });
    wx.request({
      url: `${app.globalData. AUrl}/jy/go/we.aspx?ituid=106&itjid=10610&itcid=10623&unitid=${this.data.storeId}`,
      success: (res) => {
        if (res.statusCode === 200 && res.data.code === '1') {
          // 假设返回数据结构为 res.data.result.list
          const rawData = res.data.result.list;

          // 处理数据格式（根据实际字段调整）
          const processedData = rawData.map(item => ({
            date: formatDate(item.riqi), // 确保字段名正确
            amount: item.dangrilirun
          })).reverse();

          // 更新数据与缓存
          wx.setStorageSync(cacheKey, processedData);
          that.setData({
            dailyEarningsList: processedData
          });
        }
      },
      fail: () => {
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        });
      },
      complete: () => {
        that.setData({
          isLoading: false
        });
        wx.hideLoading();
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