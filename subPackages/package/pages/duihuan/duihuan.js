const app = getApp()

Page({
  /**
   * 页面的初始数据
   */
  data: {
    currentImage: '',
    selectedItemName: '', // 确保数据对象中有这个属性
    selectedItemPrice: '',
    itemId: '',
    tupianUrl: app.globalData.tupianUrl,
    star: 5,
    mask: false
  },


  /**
   * 生命周期函数--监听页面加载
   */
  // 修改后的详情页 onLoad 函数
  onLoad: function (options) {
    this.setData({
      itemId: options.itemId,
      currentImage: decodeURIComponent(options.image),
      selectedItemName: decodeURIComponent(options.name),
      selectedItemPrice: decodeURIComponent(options.price),
      desc: decodeURIComponent(options.desc),
    });
  },

  openMask(){
    this.setData({
      mask: true,
    })
  },
  closeMask(){
    this.setData({
      mask: false
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {},

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // const app = getApp();
    // const selectedItemName = app.globalData.selectedItemName;
    // const selectedItemPrice = app.globalData.selectedItemPrice;
    // const selectedItemitemId = app.globalData.selectedItemitemId;
    // console.log('选中的菜品名称:', selectedItemName); // 修正变量名
    // // 你可以在这里做更多的事情，比如设置页面数据
    // this.setData({
    //   selectedItemName: selectedItemName,
    //   selectedItemPrice: selectedItemPrice,
    //   selectedItemitemId: selectedItemitemId
    // });
  },
  onExchangeClick: function () {
    const {
      itemId,
      selectedItemName,
      selectedItemPrice,
      currentImage
    } = this.data;
    wx.navigateTo({
      url: `/subPackages/package/pages/exchangeResult/exchangeResult?name=${encodeURIComponent(selectedItemName)}&price=${encodeURIComponent(selectedItemPrice)}&itemid=${itemId}&tupian=${encodeURIComponent(currentImage)}`
    });
  },
  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {},

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {},

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {},

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {},

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {}
});