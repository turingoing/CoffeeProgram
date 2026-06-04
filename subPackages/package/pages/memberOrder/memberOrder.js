

// 获取全局应用实例（固定写法）
const app = getApp();

// 封装Promise请求工具
function requestPromise(option) {
  return new Promise((resolve, reject) => {
    wx.request({
      ...option,
      success: (res) => resolve(res),
      fail: (error) => reject(error)
    });
  });
}

// 注册页面
Page({
  // 页面数据
  data: {
    packageName: "用户",      
    orderAmount: "",      
    balancePayment: "",   
    voucherPayment: "",   
    status: "进行中",     
    dailyRelease: "",     
    releasedAmount: "",   
    pendingAmount: "",    
    totalQuota: "",       
    currentDays: "",      
    totalDays: 360,       
    progressPercent: 0,   
  },

  // 页面加载
  async onLoad(options) {
    wx.showLoading({
      title: "加载中...",
      mask: true,
    });
    try {
      await Promise.all([this.getPackageInfo(), this.getReleasePoints()]);
    } catch (error) {
      wx.showToast({ title: '加载失败，请重试', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  getPackageInfo: function () {
    const itsid = wx.getStorageSync('itsid') || app.globalData.itsid || '';
    if (!itsid) return;

    // 🔥 修复1：加上 return （规范写法，支持后续并行请求）
    return requestPromise({
      url: `${app.globalData.AUrl}/jy/go/we.aspx?ituid=106&itjid=10658&itcid=10658&itsid=${itsid}`,
      method: 'get',
    }).then((res) => {
      try {
        const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data; 
        console.log('获取套餐信息接口响应：', data);

        // 🔥 修复2：统一用解析后的 data，不要用res.data
        if (res.statusCode === 200 && data) {
          console.log('获取套餐数据成功', data.usertitle);

          // 🔥 修复2：这里必须用 data.usertitle
          let packageName = (data.usertitle || '用户').trim();
          if (packageName === '普通会员') {
            packageName = '卡狄D套餐'
          } else if (packageName === 'VIP会员') {
            packageName = '卡狄C套餐'
          } else if (packageName === '铂金会员') {
            packageName = '卡狄B套餐'
          } else if (packageName === '钻石会员') {
            packageName = '卡狄A套餐'
          } else { packageName = '用户' }

          let orderAmount = 0;
          let balancePayment = 0;
          let voucherPayment = 0;
          if (packageName === '卡狄D套餐') {
            orderAmount = 1000;
            balancePayment = 600;
            voucherPayment = 400;
          }
          if (packageName === '卡狄C套餐') {
            orderAmount = 3000;
            balancePayment = 1800;
            voucherPayment = 1200;
          }
          if (packageName === '卡狄B套餐') {
            orderAmount = 9000;
            balancePayment = 5400;
            voucherPayment = 3600;
          }
          if (packageName === '卡狄A套餐') {
            orderAmount = 27000;
            balancePayment = 16200;
            voucherPayment = 10800;
          }

          this.setData({
            packageName,
            orderAmount,
            balancePayment,
            voucherPayment
          });
        }
      } catch (error) {
        console.error('处理套餐数据失败', error);
        wx.showToast({ title: '处理数据失败', icon: 'none' });
      }
    // 🔥 修复3：删除多余的大括号 {{
    }).catch((error) => {
      wx.showToast({ title: '获取数据失败，请检查网络', icon: 'none' });
      console.error('获取套餐数据失败', error);
    });
  },

  getReleasePoints: function () {
    const itsid = wx.getStorageSync('itsid') || app.globalData.itsid || '';
    if (!itsid) return;

    // 🔥 修复1：加上 return （规范写法）
    return requestPromise({
      url: `${app.globalData.AUrl}/jy/go/we.aspx?ituid=106&itjid=10657&itcid=10657&itsid=${itsid}`,
      method: 'get',
    }).then((res) => {
      try {
        const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
        if (res.statusCode === 200 && data) {
          const yi = Number(data.yi) || 0;
          const dai = Number(data.dai) || 0;
          const returnscore = Number(data.returnscore) || 0;
          this.setData({
            dailyRelease: returnscore,
            releasedAmount: yi,
            pendingAmount: dai,
            totalQuota: yi + dai
          })
          this.calculateProgress();
        }
      } catch (error) {
        console.error('处理释放数据失败', error);
        wx.showToast({ title: '处理数据失败', icon: 'none' });
      }
    }).catch((error) => {
      wx.showToast({ title: '获取数据失败，请检查网络', icon: 'none' });
      console.error('获取释放数据失败', error);
    });
  },

  // 计算进度条
  calculateProgress: function () {
    const { totalDays, releasedAmount, dailyRelease } = this.data;
    if (!dailyRelease || !totalDays) return;

    const currentDays = releasedAmount / dailyRelease;
    if (currentDays === this.data.totalDays) {
      this.setData({
        status: "已完成",
      })
    }
    const percent = (currentDays / totalDays) * 100;

    this.setData({
      progressPercent: percent.toFixed(2),
      currentDays: currentDays
    });
  },

  // 购买按钮
  handleBuyClick() {
    wx.navigateTo({ url: "/subPackages/package/pages/cardList/cardList" });
  }
});