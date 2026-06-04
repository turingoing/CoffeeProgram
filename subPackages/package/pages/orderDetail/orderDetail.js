// subPackages/package/pages/orderDetail/orderDetail.js
const app = getApp();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    currentindex: 0,
    mendianList: [], // 门店订单
    waimaiList: [], // 外卖订单
    orderList: [],
    AUrl: app.globalData.AUrl,
    daifukuan: [

    ],
    daifahuo: [
      {
        order_id: '202305130001',
        date: '2023-05-10',
        product_name: '卡布奇诺',
        price: 999,
        quantity: 1,
        total: 999,
        status: '待收货',
        statusindex: 1,
        image_url: 'https://img2.baidu.com/it/u=74791221,1571543144&fm=253&fmt=auto&app=120&f=PNG?w=500&h=500',
        desc: '奶香浓郁',
      },
    ],

    diashouhuo: [
      {
        order_id: '202305130001',
        date: '2023-05-10',
        product_name: '焦糖拿铁',
        price: 999,
        quantity: 1,
        total: 999,
        status: '待收货',
        statusindex: 2,
        image_url: 'https://ms.bdimg.com/pacific/0/pic/-232675334_-1095429706.jpg?x=0&y=0&h=200&w=300&vh=200.00&vw=300.00&oh=200.00&ow=300.00',
        desc: '全等深微曲屏',
      },
    ],
    daipingjia: [
      {
        order_id: '202305130001',
        date: '2023-05-10',
        product_name: '卡卡部落',
        price: 999,
        quantity: 1,
        total: 999,
        status: '待评价',
        statusindex: 3,
        image_url: 'https://ms.bdimg.com/pacific/0/pic/507692281_1496750964.jpg?x=0&y=0&h=150&w=225&vh=150.00&vw=225.00&oh=150.00&ow=225.00',
        desc: '丝滑浓香',
      },
    ],
    shouhuo: [],
  },

  getStatusText(status) {
    const statusMap = {
      '1': '待付款',
      '4': '待制作',
      '9': '制作完成',
      '99': '已取餐'
    };
    return statusMap[status] || '未知状态';
  },
  isStoreOrder(t) {
    const v = String(t || '').trim();
    return v === '1' || v === '自提' || v.toLowerCase() === 'store' || v === '门店';
  },
  isDeliveryOrder(t) {
    const v = String(t || '').trim();
    return v === '2' || v === '外送' || v.toLowerCase() === 'delivery' || v === '外卖';
  },
  resolveOrderType(orderGroup, firstItem) {
    const candidates = [
      firstItem?.order_type,
      orderGroup?.order_type,
      firstItem?.type,
      orderGroup?.type,
      firstItem?.dine_type,
      orderGroup?.dine_type
    ];
    for (let i = 0; i < candidates.length; i++) {
      const value = candidates[i];
      if (value !== undefined && value !== null && value !== '') {
        return String(value).trim();
      }
    }
    return '';
  },
  //tab栏事件
  onTabsChange(event) {
    // console.log(`Change tab, tab-panel value is ${event.detail.value}.`);
    this.setData({
      currentindex: event.detail.value
    })
  },
  //tab栏事件
  onTabsClick(event) {
    // console.log(`Click tab, tab-panel value is ${event.detail.value}.`);
  },
  //   去往商品详情界面
  godetail(e) {
    console.log(e.currentTarget.dataset);
    wx.navigateTo({
      url: '/pages/product-detail/index',
    })
  },
  goBack() {
    wx.navigateBack({
      delta: 1
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */

  // 处理订单数据
  processOrderData(rawData) {
    const ordersMap = new Map();
    let that = this
    rawData.forEach(orderGroup => {
      const orderId = orderGroup.id;
      const children = Array.isArray(orderGroup.children) ? orderGroup.children : [];
      const validItems = children.filter(item =>
        Number(item.num || 0) > 0 || Number(item.price || 0) > 0 || item.productName || item.title || item.name
      );

      const firstItem = validItems[0] || children[0] || {};
      const orderType = this.resolveOrderType(orderGroup, firstItem);
      const order = {
        id: orderId,
        date: this.formatDate(orderGroup.time),
        total: 0,
        order_type: orderType,
        order_status: firstItem.order_status,
        statusText: this.getStatusText(firstItem.order_status),
        products: []
      };

      validItems.forEach(item => {
        const price = parseFloat(item.price) || 0;
        const quantity = parseInt(item.num) || 0;
        const total = price * quantity;

        const product = {
          productName: item.productName,
          // add: that.extractValues(item.add),
          add: item.add,
          price: price,
          quantity: quantity,
          total: total,
          image_url: item.imageUrl ? `${that.data.AUrl}/jy/wxUserImg/106/${item.imageUrl}` : '/images/咖啡.png'
        };

        order.products.push(product);
        order.total += total;
      });

      ordersMap.set(orderId, order);
    });

    const processedData = Array.from(ordersMap.values());
    console.log('Processed Order Data:', processedData); // 调试输出
    return processedData;
  },

  // 日期格式化
  formatDate(dateString) {
    const datePattern = /(\d{4})-(\d{1,2})-(\d{1,2})\s(\d{1,2}):(\d{1,2}):(\d{1,2})/;
    const match = dateString.match(datePattern);

    if (match) {
      const year = match[1];
      const month = match[2].padStart(2, '0');
      const day = match[3].padStart(2, '0');
      const hours = match[4].padStart(2, '0');
      const minutes = match[5].padStart(2, '0');
      const seconds = match[6].padStart(2, '0');

      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }

    return dateString;
  },

  // 获取订单数据
  fetchOrders() {
    this.setData({
      orderList: []
    })
    wx.showToast({
      title: '数据加载中',
      icon: 'loading',
      duration: 10000, // 需设置足够长的时间
      mask: true
    })
    const userid = wx.getStorageSync('userid');
    const that = this;

    wx.request({
      url: `${app.globalData.backUrl}we.aspx?ituid=${app.globalData.ituid}&itjid=0107&itcid=10648&userid=${userid}&id=${that.data.id}`,
      success(res) {
        if (res.data?.result?.goods) {
          const processedData = that.processOrderData(res.data.result.goods);
          const mendian = processedData.filter(item => that.isStoreOrder(item.order_type));
          const waimai = processedData.filter(item => that.isDeliveryOrder(item.order_type));

          that.setData({
            orderList: mendian.concat(waimai),
            mendianList: mendian,
            waimaiList: waimai
          });
        }
        wx.hideToast()

      },
      fail(err) {
        console.error('订单请求失败:', err);
        wx.showToast({
          title: '数据加载失败',
          icon: 'none'
        });
      }
    });
  },

  onLoad(options) {
    let that = this;

    that.setData({
      id: options.id
    })
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
    this.fetchOrders()
    this.setData({
      sum: wx.getStorageSync('sum'),
      address: app.globalData.addressDesc,
      categories: wx.getStorageSync('categories')
    })

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
