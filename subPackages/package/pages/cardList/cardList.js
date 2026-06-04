Page({
  data: {},
  /**
   * 自定义导航栏返回按钮逻辑
   */
  goback() {
    // 返回上一页（和原生返回按钮逻辑一致）
    wx.navigateBack({
      delta: 1 // 返回1级页面（回到我的页面）
    });
  },

  /**
   * 点击立即购买
   */
  gotoBuy(e) {
    const id = e.currentTarget.dataset.id;
    // 跳转到确认订单页面，并传递套餐ID
    wx.navigateTo({
      url: `/subPackages/package/pages/confirmOrder/confirmOrder?id=${id}&qty=1`,
    });
  }
});
