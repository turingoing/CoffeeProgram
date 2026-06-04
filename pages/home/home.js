const app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    content: '', // 消费券数量
    freeze: '', //  冻结积分
    money: '', // 余额
    score: '', // 积分
    tupianUrl: app.globalData.tupianUrl,
    AUrl: app.globalData.AUrl,
    swiperList: [
      app.globalData.tupianUrl + '/new/bgimg1.png',
      app.globalData.tupianUrl + '/new/bgimg2.png',
      app.globalData.tupianUrl + '/new/bgimg3.png',
      app.globalData.tupianUrl + '/new/bgimg4.png',
    ],
    companyIconUrl: app.globalData.tupianUrl + '/new/company.png',
  },
  hasSession() {
    const itsid = String(wx.getStorageSync('itsid') || '');
    return Boolean(itsid && itsid !== '0');
  },
  isRealLogin() {
    const raw = wx.getStorageSync('isLoginSuccess');
    const hasSession = this.hasSession();
    const flagLogin = raw === true || raw === 'true' || raw === 1 || raw === '1';
    return hasSession && flagLogin;
  },
  clearAuthState() {
    wx.setStorageSync('isLoginSuccess', false);
    wx.removeStorageSync('itsid');
    wx.removeStorageSync('userid');
    wx.removeStorageSync('name');
    wx.removeStorageSync('avatar');
    wx.removeStorageSync('inviteUserid');
    wx.removeStorageSync('updataArray');
    wx.removeStorageSync('sum');
    wx.removeStorageSync('total');
    wx.removeStorageSync('categories');
    wx.removeStorageSync('dishSum');
    app.globalData.userid = null;
    app.globalData.itsid = null;
  },
  onLoad(options) {
    const AUrl = app.globalData.AUrl;
    console.log('Options:', options);
    console.log('AUrl:', AUrl);
    console.log('query 参数:', options);
    const sys = wx.getSystemInfoSync();
    const windowWidth = sys.windowWidth || sys.screenWidth;
    const windowHeight = sys.windowHeight || sys.screenHeight;
    const swiperHeightRpx = Math.round(750 * (windowHeight / windowWidth) * 0.405);
    this.setData({ swiperHeight: swiperHeightRpx });
    const itsid = wx.getStorageSync('itsid');
    const userid = wx.getStorageSync('inviteUserid'); // 从 Storage 获取 invite
    console.log('对方userid', userid);



    // const invite = wx.getStorageSync('invite');
    // console.log('从缓存中获取的 invite:', invite); // 新增此行，打印缓存中的 invite
    if (this.hasSession()) {
      this.fetchData10603(itsid);
    }
    // const duifangCode = this.fetchDuiFangCode(userid)
    // console.log('对方Code', duifangCode);
    // const inviteCode = this.fetchCode()
    // console.log('自己的PN100：', inviteCode);
    // if(inviteCode !== '' || inviteCode !== null || inviteCode !== '0' || inviteCode !== 0) return
    // this.saveCode(duifangCode)
  },
  

  /**
   * 获取10603接口数据
   */
  fetchData10603: function (itsid, invite) {
    const that = this;
    const AUrl = app.globalData.AUrl;
    wx.request({
      url: `${AUrl}/jy/go/we.aspx?ituid=106&itjid=10603&itcid=10603&itsid=${itsid}`,
      method: 'GET',
      success: (res) => {
        const data = res && res.data;
        const useridValue = String((data && data.userid) || ''); 
        const hasValidUser = res.statusCode === 200 && useridValue !== '' && useridValue !== '0';
        if (hasValidUser) {
          const newName = (data.name || '').trim();
          const newAvatar = data.avatar || '';
          that.setData({
            content: data.content || '0',
            freeze: data.freeze || '0',
            money: data.money || '0',
            score: data.score || '0',
            name: newName || '',
            userid: data.userid || '0',
            avatarUrl: newAvatar || ''
          });
          // 存储全局变量
          // app.globalData.userid = res.data.userid;
          wx.setStorageSync('userid', useridValue);
          if (newName) wx.setStorageSync('name', newName);
          if (newAvatar) wx.setStorageSync('avatar', newAvatar);
          // console.log('用户ID已全局化:', app.globalData.userid);
          wx.setStorageSync('isLoginSuccess', true);
        } else {
          that.clearAuthState();
          that.setData({
            content: '0',
            freeze: '0',
            money: '0',
            score: '0',
            name: '',
            userid: '0',
            avatarUrl: '',
            isLoginSuccess: false
          });
        }
      },
      fail: (error) => {
        console.error('获取数据失败', error);
      }
    });
  },
  // 首页到店取：预设自提并跳到点单页
  gotoOrderPickUp() {
    app.globalData.selected = '自提';
    app.globalData.forceStoreSelectOnOrder = true;
    wx.switchTab({
      url: '/pages/order/order',
    });
  },
  
  handleNavigate2() {
    wx.navigateTo({
      url: `/subPackages/package/pages/recharge-input/recharge-input?scene=stored`
    });
  },
  
  handleNavigate3() {
    const isLogin = this.isRealLogin();
    if (!isLogin) {
      wx.showModal({
        title: '提示',
        content: '目前暂未登录，是否跳转登录页面？',
        confirmText: '立即登录',
        cancelText: '取消',
        success(res) {
          if (res.confirm) {
            wx.navigateTo({ url: '/subPackages/user/pages/register/register?from=my' });
          }
        }
      });
      return;
    }
    wx.navigateTo({
      url: '/subPackages/package/pages/couponReceive/couponReceive',
    });
  },

  handleNavigateNewStoreRecharge() {
    wx.navigateTo({
      url: '/subPackages/package/pages/CouponReceiveNew/CouponReceiveNew',
    });
  },


  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    const itsid = wx.getStorageSync('itsid');
    const isLogin = this.isRealLogin();
    this.setData({
      name: isLogin ? (wx.getStorageSync('name') || this.data.name || '') : '',
      avatarUrl: isLogin ? (wx.getStorageSync('avatar') || this.data.avatarUrl || '') : '',
      isLoginSuccess: isLogin
    });
    if (this.hasSession() && itsid) {
      this.fetchData10603(itsid);
    } else {
      this.setData({
        content: '0',
        freeze: '0',
        money: '0',
        score: '0'
      });
    }
  },

  gotoLogin() {
    wx.navigateTo({
      url: `/subPackages/user/pages/register/register?from=home`,
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

  onChange: function (e) {
    // 这里是处理 change 事件的逻辑
    // e.detail.current 会包含当前 swiper 的索引
    console.log('当前 swiper 的索引为：', e.detail.current);
  },

  onImageLoad: function (e) {
    // 这里是处理图片加载完成事件的逻辑
    console.log('图片加载完成', e);
  },

  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})
