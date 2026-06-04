Component({
  properties: {
    active:{      //对外提供当前选中的项 可以直接在每个页面中引入  以避免 tabbar显示与点击不同步的现象
      type: Number,
      value:0
    }
  },
  data: {
    routerList: [
      { pagePath: "/pages/home/home", iconPath: "/images/home.png", selectedIconPath: "/images/home-active.png", text: "首页"},
      { pagePath: "/pages/order/order", iconPath: "/images/order.png", selectedIconPath: "/images/order-active.png", text: "点单"},
      { pagePath: "/pages/orders/orders", iconPath: "/images/orders.png", selectedIconPath: "/images/orders-active.png", text: "订单" },
      { pagePath: "/pages/my/my", iconPath: "/images/my.png", selectedIconPath: "/images/my-active.png", text: "我的" },
    ] // 动态加载的 tabBar 列表
  },
  methods: {
    loadPage(event){
      wx.switchTab({
        url: event.target.dataset.url,
      })
    },

  }
});
