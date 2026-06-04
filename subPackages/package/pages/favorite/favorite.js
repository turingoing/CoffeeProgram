const app = getApp();

Page({
  data: {
    list: [],
    loading: true,
    loadFailed: false,
    cancelingId: ""
  },

  onShow() {
    this.getList();
  },

  getList() {
    this.setData({
      loading: true,
      loadFailed: false
    });

    wx.request({
      url: "https://www.caldicoffee.com.cn/jy/go/we.aspx",
      data: {
        ituid: 106,
        itjid: 10660,
        itcid: 10660,
        itsid: app.globalData.itsid
      },
      success: (res) => {
        const success = res.data && res.data.code === "1";
        const rawList = success && res.data.result ? res.data.result.list : [];

        this.setData({
          list: this.normalizeList(rawList),
          loading: false,
          loadFailed: !success
        });
      },
      fail: () => {
        this.setData({
          list: [],
          loading: false,
          loadFailed: true
        });
      }
    });
  },

  normalizeList(list = []) {
    return list.map((item, index) => ({
      id: `${item.goodsId || "goods"}-${item.skuCode || index}`,
      goodsId: item.goodsId || "",
      skuCode: item.skuCode || "",
      goodsName: item.goodsName || "",
      goodsImage: item.goodsImage || "",
      price: this.formatPrice(item.price),
      specTags: [item.cupSize, item.flavor, item.temperature].filter(
        (spec) => typeof spec === "string" && spec.trim()
      )
    }));
  },

  formatPrice(price) {
    const value = Number(price);
    return Number.isFinite(value) ? value.toFixed(2) : "0.00";
  },

  cancelFavorite(e) {
    const index = Number(e.currentTarget.dataset.index);
    const item = this.data.list[index];
    const itsid = wx.getStorageSync('itsid') || app.globalData.itsid;

    if (!item || !item.goodsId || this.data.cancelingId) {
      return;
    }

    if (!itsid) {
      wx.showToast({
        title: '登录状态失效，请重新登录',
        icon: 'none'
      });
      return;
    }

    this.setData({
      cancelingId: item.id
    });

    wx.request({
      url: `${app.globalData.backUrl}phone.aspx?mbid=10637&ituid=${app.globalData.ituid}&itsid=${itsid}`,
      method: 'POST',
      data: {
        value: item.goodsId
      },
      success: (res) => {
        this.setData({
          list: this.data.list.filter((_, listIndex) => listIndex !== index)
        });
        wx.setStorageSync(`isFavorited_${item.goodsId}`, false);
        wx.removeStorageSync(`savedSpecs_${item.goodsId}`);
        wx.showToast({
          title: '已取消收藏',
          icon: 'none'
        });
      },
      fail: () => {
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        });
      },
      complete: () => {
        this.setData({
          cancelingId: ""
        });
      }
    });
  }
});
