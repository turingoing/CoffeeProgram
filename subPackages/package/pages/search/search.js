// subPackages/package/pages/search/search.js
const app = getApp();
Page({
  data: {
    searchValue: '', // 搜索框的值
    AUrl: app.globalData.AUrl,
    searchResults: [] // 搜索结果
  },
  onSearchInput(e) {
    this.setData({
      searchValue: e.detail.value // 更新搜索框的值
    });
  },
  onSearch() {
    const keyword = this.data.searchValue.trim();
    if (!keyword) {
      wx.showToast({
        title: '请输入搜索关键词',
        icon: 'none'
      });
      return;
    }
    this.fetchSearchResults(keyword); // 调用搜索接口
  },
  fetchSearchResults(keyword) {
    const that = this;
    const url = `${app.globalData.AUrl}/jy/go/we.aspx?ituid=106&itjid=5035&itcid=5035&id=01`;
    wx.request({
      url: url,
      method: 'GET',
      data: {
        keyword: keyword // 将关键词传递给后端
      },
      success: (res) => {
        console.log("接口返回的数据：", res); // 打印返回的数据，便于调试
        if (res.statusCode === 200 && res.data.code === '1') {
          // 提取商品信息并根据name进行匹配筛选
          const searchResults = res.data.result.goods.flatMap(category => {
            return category.children.filter(item => {
              return item.name.toLowerCase().includes(keyword.toLowerCase());
            });
          });
          that.setData({
            searchResults: searchResults // 更新搜索结果
          });
          console.log("更新后的 searchResults 数据：", that.data.searchResults);
        } else {
          wx.showToast({
            title: '未找到相关商品',
            icon: 'none'
          });
        }
      },
      fail: (error) => {
        console.error('请求失败:', error);
        wx.showToast({
          title: '搜索失败，请检查网络',
          icon: 'none'
        });
      }
    });
  },
  navigateToDianDan: function (e) {
    console.log("触发点击事件的数据：", e.currentTarget.dataset);
    const dishId = e.currentTarget.dataset.dishid;
    if (!this.data.searchResults) {
      console.error('Search results data is not available');
      wx.showToast({
        title: '数据加载中...',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    // 在 searchResults 中查找匹配的 dishId
    const dish = this.data.searchResults.find(d => d.id === dishId);

    if (dish) {
      const app = getApp();
      app.globalData.selectedDishName = dish.name;
      const fullImageURL = `${app.globalData. AUrl}/jy/wxUserImg/106/${dish.image}`;

      wx.navigateTo({
        url: `/subPackages/package/pages/diandan/diandan?image=${encodeURIComponent(fullImageURL)}&index1=${e.currentTarget.dataset.index1}&index2=${e.currentTarget.dataset.index2}&dishId=${dishId}`
      });
    } else {
      console.error('未找到对应的菜品信息');
      wx.showToast({
        title: '未找到菜品信息',
        icon: 'none',
        duration: 2000
      });
    }
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