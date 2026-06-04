const app = getApp();

Page({
  data: {
    orders: [], // 用于存储订单数据
    selectedIds: [],
    selectAll: false,
    totalAmount: 0,
  },

  onLoad(options) {
    const userid = wx.getStorageSync('userid');
    let that = this;
    wx.request({
      // url: `${app.globalData.backUrl}we.aspx?ituid=${app.globalData.ituid}&itjid=0107&itcid=10628&userid=${userid}`,
      url: `${app.globalData.backUrl}we.aspx?ituid=${app.globalData.ituid}&itjid=0107&itcid=10650&userid=${userid}`,
      success(res) {
        console.log(res);
        console.log(res.data.result);
        // 过滤掉 kaipiao 为 1 的订单（已开票的不显示）
        const filteredOrders = (res.data.result.goods || []).filter(order => {
          // 假设 order 中的 children 是订单的子项，我们需要检查是否有子项的 kaipiao 为 1
          return order.children.every(child => child.kaipiao !== "1");
        });
        // 预先计算每个订单的总金额
        const ordersWithTotal = filteredOrders.map(order => {
          const total = order.children.reduce((sum, child) => sum + parseFloat(child.total), 0);
          return {
            ...order,
            total
          };
        });
        that.setData({
          orders: ordersWithTotal
        });
      },
      fail(err) {
        console.error(err);
        wx.showToast({
          title: '获取订单失败',
          icon: 'none',
        });
      }
    });
  },

  onCheckboxTap(e) {
    const order_id = e.currentTarget.dataset.id;
    console.log('Tapped order ID:', order_id);
    console.log('Selected IDs:', this.data.selectedIds);

    let selectedIds = this.data.selectedIds;

    if (selectedIds.includes(order_id)) {
      selectedIds = selectedIds.filter((id) => id !== order_id);
    } else {
      selectedIds = [...selectedIds, order_id];
    }

    // 获取最新的 selectAll 状态
    const selectAll = selectedIds.length === this.data.orders.length;

    // 计算总金额并保留两位小数
    const totalAmount = selectedIds.reduce((sum, id) => {
      const order = this.data.orders.find((item) => item.id === id);
      if (order && order.total) {
        return sum + order.total;
      }
      return sum;
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
      this.data.orders.map((item) => item.id) : [];

    // 计算总金额并保留两位小数
    const totalAmount = selectAll ?
      this.data.orders.reduce((sum, order) => {
        return sum + order.total;
      }, 0).toFixed(2) :
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

    const orders = this.data.orders.filter((item) => selectedIds.includes(item.id));

    // 提取订单号、商品名称、数量和总金额
    const orderIds = orders.map((item) => item.id); // 订单号数组
    const productNames = []; // 商品名称数组
    const quantities = []; // 商品数量数组
    const amounts = []; // 商品金额数组

    orders.forEach(order => {
      if (order.children) {
        order.children.forEach(child => {
          productNames.push(child.productName);
          quantities.push(child.num);
          amounts.push(parseFloat(child.total));
        });
      }
    });

    // 计算总金额
    const totalAmount = amounts.reduce((sum, amount) => sum + amount, 0).toFixed(2);

    // 将数据传递到发票申请页面
    wx.navigateTo({
      url: `/subPackages/package/pages/invoice/invoice?orderIds=${orderIds.join(',')}&productNames=${productNames.join(',')}&quantities=${quantities.join(',')}&amounts=${amounts.join(',')}&totalAmount=${totalAmount}`,
    });
  },
  // 页面生命周期方法
  onReady() { },
  onShow() { },
  onHide() { },
  onUnload() { },
  onPullDownRefresh() { },
  onReachBottom() { },
  onShareAppMessage() { },
});