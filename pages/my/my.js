const app = getApp();
Page({
  data: {
    // 核心数据（和图片匹配）
    leixing: "用户",
    agent: "",
    name: "",
    avatar: "", // 头像地址
    money: 0.0, // 个人余额
    coffeeCoupon: 0.0, // 咖啡券
    depositCard: 0.0, // 储值卡
    electronicCoupon: 0.0, // 电子券
    tupianUrl: app.globalData.tupianUrl,
    AUrl: app.globalData.AUrl,
    isLogin: false,
  },
  toLogin() {
    const isLogin = this.isRealLogin();
    if (!isLogin) {
      wx.showModal({
        title: "提示",
        content: "目前暂未登录，是否跳转登录页面？",
        confirmText: "立即登录",
        cancelText: "取消",
        success(res) {
          if (res.confirm) {
            wx.navigateTo({
              url: "/subPackages/user/pages/register/register?from=my",
            });
          }
        },
      });
    }
    return isLogin;
  },
  hasSession() {
    const itsid = String(wx.getStorageSync("itsid") || "");
    return Boolean(itsid && itsid !== "0");
  },
  isRealLogin() {
    const raw = wx.getStorageSync("isLoginSuccess");
    const hasSession = this.hasSession();
    const flagLogin =
      raw === true || raw === "true" || raw === 1 || raw === "1";
    return hasSession && flagLogin;
  },
  clearAuthState() {
    wx.setStorageSync("isLoginSuccess", false);
    wx.removeStorageSync("itsid");
    wx.removeStorageSync("userid");
    wx.removeStorageSync("name");
    wx.removeStorageSync("avatar");
    wx.removeStorageSync("inviteUserid");
    wx.removeStorageSync("updataArray");
    wx.removeStorageSync("sum");
    wx.removeStorageSync("total");
    wx.removeStorageSync("categories");
    wx.removeStorageSync("dishSum");
    getApp().globalData.userid = null;
    getApp().globalData.itsid = null;
  },

  // 右上角二维码点击事件
  gotoQrcode() {
    if (!this.toLogin()) return
    this.gotoInviteCode();
  },

  // 卡狄D套餐详情
  gotocardDetail() {
    wx.navigateTo({
      url: "/subPackages/package/pages/cardList/cardList",
    });
  },

  gotoBalanceRecord() {
    wx.navigateTo({
      url: "/subPackages/package/pages/balanceRecord/balanceRecord?type=balance",
    });
  },

  gotoDepositRecord() {
    wx.navigateTo({
      url: "/subPackages/package/pages/balanceRecord/balanceRecord?type=stored",
    });
  },

  gotoCoffeeRecord() {
    wx.navigateTo({
      url: "/subPackages/package/pages/balanceRecord/balanceRecord?type=coffee",
    });
  },

  gotoElectronicRecord() {
    wx.navigateTo({
      url: "/subPackages/package/pages/balanceRecord/balanceRecord?type=electronic",
    });
  },

  // 电商订单
  gotoEcommerceOrder() {
    wx.switchTab({
      url: "/pages/orders/orders",
    });
  },

  // 口味定制
  gotoTasteCustom() {
    wx.showToast({
      title: "暂未实现",
      icon: "none",
    });
  },

  // 公告
  gotoNotice() {
    if (!this.toLogin()) return;
    wx.showToast({
      title: "暂未实现",
      icon: "none",
    });
  },

  // 领券中心
  gotoCouponCenter() {
    if (!this.toLogin()) return;
    wx.navigateTo({
      url: "/subPackages/package/pages/couponReceive/couponReceive",
    });
  },

  // 我的优惠券
  gotoMyCoupon() {
    wx.navigateTo({
      url: "/subPackages/package/pages/kaquan/kaquan",
    });
  },

  // 收货地址
  gotoAddress() {
    wx.navigateTo({
      url: "/subPackages/package/pages/chooseLocation/chooseLocation",
    });
  },

  // 我的收藏
  gotoCollection() {
    wx.navigateTo({
      url: '/subPackages/package/pages/favorite/favorite'
    });
  },

  // 会员订单
  gotoMemberOrder() {
    wx.navigateTo({
      url: "/subPackages/package/pages/memberOrder/memberOrder",
    });
  },

  // 微股东门店
  gotoShareholderStore() {
    wx.navigateTo({
      url: "/subPackages/package/pages/recharge/recharge",
    });
  },

  // 子账户
  gotoSubAccount() {
    wx.navigateTo({
      url: "/subPackages/package/pages/qiehuan/qiehuan",
    });
  },

  // 我的好友
  gotoMyFriend() {
    wx.navigateTo({
      url: "/subPackages/package/pages/huiyuanrenshu/huiyuanrenshu",
    });
  },

  // 发票管理
  gotoInvoice() {
    wx.navigateTo({
      url: "/subPackages/package/pages/fapiao/fapiao",
    });
  },

  // 邀请码
  gotoInviteCode() {
    wx.navigateTo({
      url: "/subPackages/package/pages/putong/putong",
    });
  },

  // 设置
  gotoSetting() {
    if (!this.toLogin()) return;
    wx.navigateTo({
      url: "/subPackages/package/pages/anquan/anquan",
    });
  },

  gotoNoticePage() {
    wx.navigateTo({
      url: "/subPackages/package/pages/notice/notice",
    });
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    const itsid = wx.getStorageSync("itsid");
    if (this.hasSession()) {
      this.fetchUserData(itsid);
    }
  },
  tapLeftWrap() {
    const isLogin = this.isRealLogin();
    if (!isLogin) {
      wx.navigateTo({
        url: "/subPackages/user/pages/register/register?from=my",
      });
    }
  },
  cardLoginPrompt() {
    if (!this.toLogin()) return;
    this.gotocardDetail();
  },

  // 从接口获取用户数据（如需则保留，无需则删除）
  fetchUserData(itsid) {
    const that = this;
    wx.request({
      url: `${app.globalData.AUrl}/jy/go/we.aspx?ituid=106&itjid=10603&itcid=10603&itsid=${itsid}`,
      method: "GET",
      success: (res) => {
        const data = res && res.data;
        const useridValue = String((data && data.userid) || "");
        const hasValidUser =
          res.statusCode === 200 && useridValue !== "" && useridValue !== "0";
        console.log("hasValidUser:", hasValidUser);
        if (hasValidUser) {
          wx.setStorageSync("isLoginSuccess", true);
          if (useridValue) {
            wx.setStorageSync("userid", useridValue);
          }
          that.setData({
            leixing: data.leixing || "用户",
            agent: data.agent || "",
            name: data.name || "",
            money: data.money || 0.0,
            coffeeCoupon: data.score || 0.0,
            depositCard: data.chuzhika || 0.0,
            electronicCoupon: data.dianzi || 0.0,
            avatar: `${app.globalData.AUrl}/jy/wxuser/106/images/info/beiload.png/mylogo1.jpg`,
            isLogin: true,
          });
          wx.setStorageSync("name", data.name || "");
          wx.setStorageSync("avatar", data.avatar || "");
        } else {
          that.clearAuthState();
          that.setData({
            isLogin: false,
            name: "",
            avatar: "",
            money: 0.0,
            leixing: "用户",
            coffeeCoupon: 0.0,
            depositCard: 0.0,
            electronicCoupon: 0.0,
          });
        }
      },
      fail: () => {
        const isLogin = that.isRealLogin();
        that.setData({ isLogin });
      },
    });
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    const itsid = wx.getStorageSync("itsid");
    if (this.hasSession()) {
      this.setData({ isLogin: this.isRealLogin() });
      this.fetchUserData(itsid);
    } else {
      wx.setStorageSync("isLoginSuccess", false);
      this.setData({
        isLogin: false,
        name: "",
        avatar: "",
        money: 0.0,
        coffeeCoupon: 0.0,
        depositCard: 0.0,
        electronicCoupon: 0.0,
      });
    }
  },
});
