const app = getApp();
Page({
  data: {
    coupons: [],
    selectedId: ''
  },
  onLoad() {
    const userid = wx.getStorageSync('userid') || app.globalData.userid || '';
    wx.request({
      url: `${app.globalData.AUrl}/jy/go/we.aspx?ituid=106&itjid=0902&itcid=10619&userid=${userid}`,
      method: 'GET',
      success: (res) => {
        const list = (res.data && res.data.result) ? res.data.result : [];
        // 归一化、去重、仅展示可选的券（status==='1'为可用）
        const seen = new Set();
        const normalized = list.map(item => {
          const end = (item.endTime || '').replace(/^[^\/]+\//, '');
          return {
            cardid: item.cardid,
            cardName: item.cardName,
            atm: Number(item.atm || 0),
            endTime: end || '长期有效',
            disabled: item.status !== '1'
          };
        }).filter(item => {
          if (seen.has(item.cardid)) return false;
          seen.add(item.cardid);
          return true;
        });
        // 默认选中第一个可用
        const firstUsable = normalized.find(n => !n.disabled);
        this.setData({ coupons: normalized, selectedId: firstUsable ? firstUsable.cardid : '' });
      }
    });
  },
  // 单选选中
  radioChange(e) {
    this.setData({ selectedId: e.detail.value });
  },
  selectOne(e) {
    const id = e.currentTarget.dataset.id;
    const disabled = e.currentTarget.dataset.disabled;
    if (disabled) return;
    this.setData({ selectedId: id });
  },
  confirm() {
    const { coupons, selectedId } = this.data;
    const picked = coupons.find(c => c.cardid == selectedId) || coupons.find(c => !c.disabled);
    if (!picked) {
      wx.showToast({ title: '请选择优惠券', icon: 'none' });
      return;
    }
    wx.setStorageSync('selectedCoupon', {
      cardid: picked.cardid,
      cardName: picked.cardName,
      atm: picked.atm
    });
    wx.navigateBack();
  }
});
