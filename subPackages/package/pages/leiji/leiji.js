// subPackages/package/pages/leiji/leiji.js
// pages/totalEarnings/totalEarnings.js
Page({
  data: {
    result: [],
    earningsList: [{
        date: '6月24日',
        amount: 0.01
      },
      {
        date: '6月23日',
        amount: 0.01
      },
      // 更多数据...
    ]
  }, // this.getEarningsData(); 
  onLoad: function () {
    const itsid = wx.getStorageSync('itsid');
    if (itsid) {
      this.getResult(itsid);
    } else {
      wx.showToast({
        title: 'itsid 未设置',
        icon: 'none'
      });
    }
  },

  getResult: function (itsid) {
    wx.request({
      url: `${app.globalData. AUrl}/jy/go/we.aspx?ituid=106&itjid=10609&itcid=10609&itsid=${itsid}`,
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200 && res.data.code === '1') {
          this.setData({
            result: res.data.result.list
          });
        } else {
          console.error('服务器返回错误状态码或操作失败', res);
          wx.showToast({
            title: '请求失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        console.error('请求失败', err);
        wx.showToast({
          title: '请求失败',
          icon: 'none'
        });
      }
    });
  },

  // getEarningsData: function () {
  //     // 从服务器获取数据
  //     const earningsList = [{
  //         date: '6月24日',
  //         amount: 0.01
  //       },
  //       {
  //         date: '6月23日',
  //         amount: 0.01
  //       },
  //       // 更多数据...
  //     ];
  //     this.setData({
  //       earningsList
  //     });
  //   },
  // 其他逻辑...


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