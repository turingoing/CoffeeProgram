const app = getApp();
// 用于在本地缓存记录已经领取过的卡券ID
const LOCAL_RECEIVED_KEY = 'coupon_receive_ids';

Page({
  data: {
    loading: true,
    couponList: [] // 已删除 useMockApi
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

    // 请求真实的接口
    wx.request({
      // url: `${app.globalData.AUrl}/jy/go/phone.aspx?ituid=106&mbid=10652&itsid=${itsid}
      url: `${app.globalData.AUrl}/jy/go/we.aspx?ituid=106&itjid=0902&itcid=10655&userid=${userid}`,
      method: 'GET',
      success: (res) => {
        const responseData = res && res.data ? res.data : {};
        const code = String(responseData.code || '');
        
        // 接口约定 code 为 "1" 是成功
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

        // 获取返回的 result 数组
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

  getCoupon(event) {
    // 改用 cardid
    const cardid = event.currentTarget.dataset.cardid;
    if (!cardid) {
      wx.showToast({ title: '券信息异常', icon: 'none' });
      return;
    }

    const userid = this.getUserId();
    if (!userid) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    const itsid = this.getItsid();
    if (!itsid) {
      wx.showToast({ title: '登录已失效，请重新登录', icon: 'none' });
      return;
    }

    const list = this.data.couponList || [];
    const index = list.findIndex((item) => String(item.cardid) === String(cardid));
    
    if (index < 0) {
      wx.showToast({ title: '券不存在', icon: 'none' });
      return;
    }

    if (list[index].isReceived) {
      wx.showToast({ title: '该券已领取', icon: 'none' });
      return;
    }

    const indexKey = `couponList[${index}].receiving`;
    this.setData({ [indexKey]: true });

    wx.request({
      url: `${app.globalData.AUrl}/jy/go/phone.aspx?ituid=106&mbid=10652&itsid=${itsid}`,
      method: 'POST',
      header: { 'content-type': 'application/json' },
      data: {
        userid,
        itsid,
        cardid: String(cardid)
      },
      success: (res) => {
        const responseData = res && res.data ? res.data : {};
        const descText = String(responseData.desc || responseData.msg || responseData.message || '领取结果未知');
        const isSuccess = descText.includes('成功');
        if (isSuccess) {
          this.handleReceiveSuccess(index, cardid, descText);
          return;
        }
        this.setData({ [indexKey]: false });
        wx.showToast({ title: descText, icon: 'none' });
      },
      fail: () => {
        this.setData({ [indexKey]: false });
        wx.showToast({ title: '网络异常，领取失败', icon: 'none' });
      }
    });
  },

  handleReceiveSuccess(index, cardid, descText) {
    this.setData({
      [`couponList[${index}].isReceived`]: true,
      [`couponList[${index}].receiving`]: false
    });
    this.saveReceivedCouponId(cardid);
    wx.showToast({ title: descText || '领取成功', icon: 'success' });
  },

  // 将服务器数据与本地缓存的已领取状态合并
  mergeLocalReceivedState(serverList) {
    const localReceivedIds = this.getLocalReceivedIds();
    return (serverList || []).map((item) => {
      const cardid = item.cardid || '';
      // 检查本地是否有领取记录
      const localReceived = localReceivedIds.includes(String(cardid));
      
      // 保留接口返回的所有属性，并添加控制UI状态的字段
      return {
        ...item,
        isReceived: localReceived, // 因为目前列表接口没有返回isReceived字段，所以依赖本地缓存判断
        receiving: false
      };
    });
  },

  getLocalReceivedIds() {
    const ids = wx.getStorageSync(LOCAL_RECEIVED_KEY);
    if (Array.isArray(ids)) {
      return ids.map((id) => String(id));
    }
    return [];
  },

  saveReceivedCouponId(cardid) {
    const ids = this.getLocalReceivedIds();
    const targetId = String(cardid);
    if (ids.includes(targetId)) {
      return;
    }
    ids.push(targetId);
    wx.setStorageSync(LOCAL_RECEIVED_KEY, ids);
  }
});
