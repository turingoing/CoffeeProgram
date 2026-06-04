const app = getApp();

Page({
  /**
   * 页面的初始数据
   */
  data: {
    List: [],
    List1: [],
    List2: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    let that = this;
    const userid = wx.getStorageSync('userid');

    wx.request({
      url: `${app.globalData. AUrl}/jy/go/we.aspx?ituid=106&itjid=0902&itcid=10619&userid=${userid}`,
      method: 'GET',
      success: (res) => {
        console.log('原始数据:', res.data.result);

        let List1 = [];
        let List2 = [];

        res.data.result.forEach(item => {
          // 仅处理 endTime 的年份
          const originalEndTime = item.endTime;
          item.endTime = originalEndTime.replace(/^[^\/]+\//, ''); // 移除年份

          console.log('处理后:', {
            originalEndTime: originalEndTime,
            newEndTime: item.endTime
          });

          // 保持 startTime 完整
          if (item.status == 1) {
            List1.push(item);
          } else if (item.status == 2) {
            List2.push(item);
          }
        });

        that.setData({
          List1: List1,
          List2: List2,
          List: res.data.result
        });

        console.log('处理后的列表:', this.data.List);
      },
      fail: (err) => {
        console.error('请求失败', err);
      }
    });
  },


  // 其他方法保持不变
  onTabsChange(event) {
    console.log(`Change tab, tab-panel value is ${event.detail.value}.`);
  },

  onTabsClick(event) {
    console.log(`Click tab, tab-panel value is ${event.detail.value}.`);
  },

  onclink(e) {
    // 固定参数配置
    const fixedParams = {
      dishId: "010201", // 固定商品ID
      image: "M7.jpg", // 固定图片名称
      index1: 1, // 假设商品在第一个分类
      index2: 1, // 假设商品在分类的第二个位置
      dishName: "冰美式" // 固定菜品名称为冰美式
    };
    const app = getApp();
    app.globalData.selectedDishName = fixedParams.dishName;
    // 拼接完整图片路径
    const fullImageURL = `${app.globalData. AUrl}/jy/wxUserImg/106/${fixedParams.image}`;

    // 跳转时携带参数
    wx.navigateTo({
      url: `/subPackages/package/pages/diandan/diandan?
        image=${encodeURIComponent(fullImageURL)}&
        index1=${fixedParams.index1}&
        index2=${fixedParams.index2}&
        dishId=${fixedParams.dishId}&
        dishName=${encodeURIComponent(fixedParams.dishName)}`
        .replace(/\s+/g, '') // 移除换行空格
    });
  }
});