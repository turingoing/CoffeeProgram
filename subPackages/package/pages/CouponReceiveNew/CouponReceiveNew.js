const app = getApp();
const LOCAL_RECEIVED_KEY = 'coupon_receive_ids';

Page({
  data: {
    loading: true,
    couponList: []
  },

  onLoad() {
    this.loadCouponList();
  },

  getUserId() {
    const userIdFromStorage = wx.getStorageSync('userid');
    if (userIdFromStorage) {
      return String(userIdFromStorage);
    }
    if (app.globalData && app.globalData.userid) {
      return String(app.globalData.userid);
    }
    return '';
  },

  getItsid() {
    const itsidFromStorage = wx.getStorageSync('itsid');
    if (itsidFromStorage) {
      return String(itsidFromStorage);
    }
    if (app.globalData && app.globalData.itsid) {
      return String(app.globalData.itsid);
    }
    return '';
  },

  loadCouponList() {
    const userid = this.getUserId();
    if (!userid) {
      this.setData({
        loading: false,
        couponList: []
      });
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    this.setData({ loading: true });

    wx.request({
      url: `${app.globalData.AUrl}/jy/go/we.aspx?ituid=106&itjid=0902&itcid=10655&userid=${userid}`,
      method: 'GET',
      success: (res) => {
        const responseData = res && res.data ? res.data : {};
        const code = String(responseData.code || '');
        
        if (code !== '1') {
          wx.showToast({
            title: responseData.msg || '加载失败',
            icon: 'none'
          });
          this.setData({
            couponList: [],
            loading: false
          });
          return;
        }

        const rawList = responseData.result || [];
        const mergedList = this.mergeLocalReceivedState(rawList);
        
        this.setData({
          couponList: mergedList,
          loading: false
        });
      },
      fail: () => {
        this.setData({
          couponList: [],
          loading: false
        });
        wx.showToast({ title: '网络异常，请稍后重试', icon: 'none' });
      }
    });
  },

  // 立即领取 → 直接跳转，带当前优惠券的 cardid
  getCoupon(event) {
    // 1. 获取当前点击的这张券的 cardid
    const cardid = event.currentTarget.dataset.cardid;
    if (!cardid) {
      wx.showToast({ title: '券信息异常', icon: 'none' });
      return;
    }

    // 👇👇 这里改成传 cardid
    wx.navigateTo({
      url: `/subPackages/package/pages/recharge-input/recharge-input?scene=new_store&cardid=${cardid}`
    });

    // ==================== 以下是你原有逻辑，完全不动 ====================
    const userid = this.getUserId();
    const itsid = this.getItsid();
    if (!userid || !itsid) return;

    const list = this.data.couponList || [];
    const index = list.findIndex((item) => String(item.cardid) === String(cardid));
    if (index < 0) return;

    const indexKey = `couponList[${index}].receiving`;
    this.setData({ [indexKey]: true });

    wx.request({
      url: `${app.globalData.AUrl}/jy/go/phone.aspx?ituid=106&mbid=10652&itsid=${itsid}`,
      method: 'POST',
      header: { 'content-type': 'application/json' },
      data: { userid, itsid, cardid: String(cardid) },
      success: (res) => {
        const responseData = res && res.data ? res.data : {};
        const descText = String(responseData.desc || responseData.msg || '领取结果未知');
        this.setData({ [indexKey]: false });
      },
      fail: () => {
        this.setData({ [indexKey]: false });
      }
    });
  },

  handleReceiveSuccess(index, cardid, descText) {
    this.setData({ [`couponList[${index}].receiving`]: false });
    wx.showToast({ title: descText || '领取成功', icon: 'success' });
  },

  mergeLocalReceivedState(serverList) {
    return (serverList || []).map((item) => {
      return {
        ...item,
        isReceived: false,    // 永远显示立即领取
        receiving: false
      };
    });
  },

  getLocalReceivedIds() {
    return [];
  },

  saveReceivedCouponId(cardid) {
    // 不保存
  }
});