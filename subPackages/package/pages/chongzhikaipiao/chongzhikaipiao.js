// subPackages/package/pages/chongzhikaipiao/chongzhikaipiao.js
const app = getApp();
Page({
  data: {
    orders: [{
        orderId: '097',
        amount: 78.14,
        orderNumber: '**********097',
        orderTime: '2023-04-11 15:19',
        invoiced: false,
      },
      {
        orderId: '384',
        amount: 119.8,
        orderNumber: '**********384',
        orderTime: '2023-04-11 15:17',
        invoiced: false,
      },
      {
        orderId: '408',
        amount: 12.18,
        orderNumber: '**********408',
        orderTime: '2023-04-04 08:52',
        invoiced: false,
      },
      {
        orderId: '256',
        amount: 9.9,
        orderNumber: '**********256',
        orderTime: '2023-04-03 09:06',
        invoiced: false,
      },
      {
        orderId: '200',
        amount: 13.39,
        orderNumber: '**********200',
        orderTime: '2023-03-20 08:46',
        invoiced: false,
      },
      {
        orderId: '954',
        amount: 13.92,
        orderNumber: '**********954',
        orderTime: '2023-03-08 09:06',
        invoiced: false,
      },
    ],
    selectedIds: [],
    selectAll: false,
    totalAmount: 0,
  },

  onCheckboxTap(e) {
    const orderId = e.currentTarget.dataset.id;
    console.log('Tapped order ID:', orderId);
    console.log('Selected IDs:', this.data.selectedIds);

    let selectedIds = this.data.selectedIds;

    if (selectedIds.includes(orderId)) {
      selectedIds = selectedIds.filter((id) => id !== orderId);
    } else {
      selectedIds = [...selectedIds, orderId];
    }

    // 获取最新的 selectAll 状态
    const selectAll = selectedIds.length === this.data.orders.length;

    // 计算总金额并保留两位小数
    const totalAmount = selectedIds.reduce((sum, id) => {
      const order = this.data.orders.find((item) => item.orderId === id);
      return sum + (parseFloat(order.amount) || 0);
    }, 0).toFixed(2);

    this.setData({
      selectedIds,
      selectAll,
      totalAmount,
    }, () => {
      console.log('After setData:', this.data.selectedIds);
    });
  },

  onSelectAllTap() {
    const selectAll = !this.data.selectAll;
    const selectedIds = selectAll ?
      this.data.orders.map((item) => item.orderId) : [];

    // 计算总金额并保留两位小数
    const totalAmount = selectAll ?
      this.data.orders.reduce((sum, item) => sum + parseFloat(item.amount), 0).toFixed(2) :
      0;

    this.setData({
      selectAll,
      selectedIds,
      totalAmount,
    }, () => {
      console.log('After setData:', this.data.selectedIds);
    });
  },

  onNextTap() {
    const selectedIds = this.data.selectedIds;
    if (selectedIds.length === 0) {
      wx.showToast({
        title: '请先选择订单',
        icon: 'none',
      });
      return;
    }

    const orders = this.data.orders.filter((item) => selectedIds.includes(item.orderId));
    const orderNos = orders.map((item) => item.orderNumber);
    const amounts = orders.map((item) => parseFloat(item.amount)); // 确保金额是浮点数

    wx.navigateTo({
      url: `/subPackages/package/pages/invoice/invoice?orderNos=${orderNos.join(',')}&amounts=${amounts.join(',')}`,
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