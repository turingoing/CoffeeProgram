// subPackages/package/pages/chongzhijilu/chongzhijilu.js
const app = getApp(); // 获取全局应用实例

Page({
  /**
   * 页面的初始数据
   */
  data: {
    records: [], // 用于存储符合条件的记录数据
    showNoData: false, // 是否显示无数据提示
    AUrl: app.globalData.AUrl,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.fetchRecords();
  },

  /**
   * 获取充值记录
   */
  fetchRecords() {
    let that = this
    // 从全局获取 userid
    const userid = app.globalData.userid;
    if (!userid) {
      console.error('userid 未获取到，请检查全局变量是否正确设置');
      return;
    }

    // 构造接口 URL
    const url = `${app.globalData.AUrl}/jy/go/we.aspx?ituid=106&itjid=10610&itcid=10629&userid=${userid}`;

    // 使用 wx.request 发起网络请求
    wx.request({
      url: url,
      method: 'GET',
      header: {
        'Content-Type': 'application/json'
      },
      success: (res) => {
        that.setData({
          records: res.data.result.list
        })
        // if (res.statusCode === 200) {
        //   const data = res.data;
        //   if (data && data.result && data.result.list) {
        //     // 筛选 money 大于等于 1800 的记录
        //     const filteredRecords = data.result.list.filter(item => {
        //       // 确保 money 是数值类型
        //       const money = parseFloat(item.money);
        //       return !isNaN(money) && money >= 1800;
        //     });

        //     this.setData({
        //       records: filteredRecords,
        //       showNoData: filteredRecords.length === 0 // 如果筛选后记录为空，显示无数据提示
        //     });
        //   } else {
        //     console.error('接口返回数据格式不正确', data);
        //     this.setData({
        //       showNoData: true // 如果接口返回数据格式不正确，也显示无数据提示
        //     });
        //   }
        // } else {
        //   console.error('接口请求失败', res);
        //   this.setData({
        //     showNoData: true // 如果接口请求失败，显示无数据提示
        //   });
        // }
      },
      fail: (err) => {
        console.error('请求失败', err);
        this.setData({
          showNoData: true // 如果请求失败，显示无数据提示
        });
      },
      complete: () => {
        wx.stopPullDownRefresh(); // 停止下拉刷新
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
});