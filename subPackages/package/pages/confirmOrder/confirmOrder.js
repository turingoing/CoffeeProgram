const app = getApp();

const PACKAGE_CONFIG = {
  '1': {
    packageName: '卡狄D套餐',
    payAmount: 600,
    coffeeAmount: 400,
    totalAmount: 1000,
    multiple: '1.7倍',
    totalReturn: 1700,
    days: '360天',
    dailyReturn: 4.72,
    mcode: 900,
    AMT2: 400
  },
  '2': {
    packageName: '卡狄C套餐',
    payAmount: 1800,
    coffeeAmount: 1200,
    totalAmount: 3000,
    multiple: '1.8倍',
    totalReturn: 5400,
    days: '360天',
    dailyReturn: 15,
    mcode: 901,
    AMT2: 1200
  },
  '3': {
    packageName: '卡狄B套餐',
    payAmount: 5400,
    coffeeAmount: 3600,
    totalAmount: 9000,
    multiple: '1.9倍',
    totalReturn: 17100,
    days: '360天',
    dailyReturn: 47.5,
    mcode: 902,
    AMT2: 3600
  },
  '4': {
    packageName: '卡狄A套餐',
    payAmount: 16200,
    coffeeAmount: 10800,
    totalAmount: 27000,
    multiple: '2倍',
    totalReturn: 54000,
    days: '360天',
    dailyReturn: 150,
    mcode: 903,
    AMT2: 10800
  }
};

Page({
  data: {
    packageId: '',
    packageName: '',
    packageTag: '会员套餐',
    payAmount: '0.00',
    coffeeAmount: '0.00',
    totalAmount: '0.00',
    multiple: '0.0',
    totalReturn: '0.00',
    days: '0',
    dailyReturn: '0.00',
    AMT2: '0.00',
    quantity: 1,
    showCodeDialog: false,
    inputBoxes: ['', '', '', '', '', ''],
    codeValue: '',
    testFocus: false,
    money: '0.00',
    score: '0.00',
    dianzi: '0.00',
    cashAmount: '0.00',
    pointsAmount: '0.00',
    selectedCouponType: ''
  },

  onLoad(options) {
    const packageId = String(options.id || '1');
    this.setData({
      packageId,
      quantity: 1
    });
    this.loadPackageDetails(packageId);
    const itsid = wx.getStorageSync('itsid');
    if (itsid) {
      this.fetchUserData(itsid);
    }
  },

  formatAmount(value) {
    return Number(value).toFixed(2);
  },

  loadPackageDetails(id) {
    const base = PACKAGE_CONFIG[id] || PACKAGE_CONFIG['1'];
    this.setData({
      packageName: base.packageName,
      payAmount: this.formatAmount(base.payAmount),
      coffeeAmount: this.formatAmount(base.coffeeAmount),
      totalAmount: this.formatAmount(base.totalAmount),
      multiple: base.multiple,
      totalReturn: this.formatAmount(base.totalReturn),
      days: base.days,
      dailyReturn: this.formatAmount(base.dailyReturn),
      cashAmount: this.formatAmount(base.payAmount),
      pointsAmount: this.formatAmount(base.coffeeAmount),
    });
  },

  fetchUserData(itsid) {
    wx.request({
      url: `${app.globalData.AUrl}/jy/go/we.aspx?ituid=106&itjid=10602&itcid=10602&itsid=${itsid}`,
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200 && res.data) {
          this.setData({
            money: String(res.data.money || '0'),
            score: String(res.data.score || '0'),
            dianzi: String(res.data.dianzi || '0')
          });
        }
      }
    });
  },
  onSelectCouponType(e) {
    const type = e.currentTarget.dataset.type;
    if (type !== 'kafei' && type !== 'dianzi') {
      return;
    }
    this.setData({
      selectedCouponType: type
    });
  },
  getSelectedCouponMeta() {
    const isKafei = this.data.selectedCouponType === 'kafei';
    return {
      label: isKafei ? '咖啡券' : '电子券',
      balance: Number(isKafei ? this.data.score : this.data.dianzi)
    };
  },

  submitOrder() {
    if (!this.data.selectedCouponType) {
      wx.showToast({
        title: '请选择支付方式',
        icon: 'none'
      });
      return;
    }
    this.confirmChange();
  },

  confirmChange() {
    wx.showModal({
      title: '是否确认划扣',
      content: '一旦确认无法更改',
      success: (res) => {
        if (res.confirm) {
          this.showCodeDialog();
        }
      }
    });
  },

  showCodeDialog() {
    this.setData({
      showCodeDialog: true
    });
  },

  closeDialog() {
    this.setData({
      showCodeDialog: false,
      codeValue: '',
      inputBoxes: ['', '', '', '', '', ''],
      testFocus: false
    });
  },

  handleGetFocus() {
    this.setData({
      testFocus: true
    });
  },

  handleInputBlur() {
    this.setData({
      testFocus: false
    });
  },

  handleTestInput(e) {
    const value = e.detail.value;
    const inputBoxes = ['', '', '', '', '', ''];
    for (let i = 0; i < 6; i++) {
      inputBoxes[i] = value[i] ? value[i] : '';
    }
    this.setData({
      inputBoxes,
      codeValue: value
    });
  },

  getServerTransactionCode() {
    return new Promise((resolve, reject) => {
      // const userid = wx.getStorageSync('userid');
      const itsid = wx.getStorageSync('itsid') || app.globalData.itsid || '';// ✅ 修复1：和上方保持一致，缓存+全局双兜底，防止丢失
      wx.request({
        url: `${app.globalData.AUrl}/jy/go/we.aspx`,
        method: 'GET',
        data: {
          ituid: 106,
          itjid: 10610,
          itcid: 10632,
          itsid
        },
        success: (res) => {
          const code = res?.data?.result?.list?.[0]?.transactionCode;
          if (code) {
            resolve(String(code));
            return;
          }
          reject(new Error('交易码获取失败'));
        },
        fail: () => reject(new Error('网络连接失败，请检查网络'))
      });
    });
  },

  verifyCode() {
    const codeValue = this.data.codeValue;
    if (!/^\d{6}$/.test(codeValue)) {
      wx.showToast({
        title: '请输入6位数字交易码',
        icon: 'none'
      });
      return;
    }
    this.getServerTransactionCode()
      .then((serverCode) => {
        if (String(serverCode) !== String(codeValue)) {
          wx.showToast({
            title: '交易码错误',
            icon: 'none'
          });
          return;
        }
        this.closeDialog();
        this.executeRecharge();
      })
      .catch((err) => {
        wx.showToast({
          title: err.message || '验证失败',
          icon: 'none'
        });
      });
  },

  executeRecharge() {
    const money = Number(this.data.money || 0);
    const cashAmount = Number(this.data.cashAmount || 0);
    const pointsAmount = Number(this.data.pointsAmount || 0);
    const couponMeta = this.getSelectedCouponMeta();
    const packageId = String(this.data.packageId || '1');
    const mcode = PACKAGE_CONFIG[packageId]?.mcode || 900;
    const AMT2 = this.formatAmount(PACKAGE_CONFIG[packageId]?.AMT2 || 0);
    const itsid = wx.getStorageSync('itsid');
    if (money < cashAmount) {
      wx.showToast({
        title: '余额不足，无法充值',
        icon: 'none'
      });
      return;
    }
    if (couponMeta.balance < pointsAmount) {
      wx.showToast({
        title: `${couponMeta.label}不足，无法充值`,
        icon: 'none'
      });
      return;
    }
    wx.request({
      url: `${app.globalData.backUrl}phone.aspx?mbid=10623&ituid=${app.globalData.ituid}&itsid=${itsid}`,
      method: 'POST',
      header: {
        'content-type': 'application/json'
      },
      data: {
        MCODE: mcode,
        OPID: '1201',
        UNITID: '1',
        NUM: '1',
        USERID: '0',
        NOTE: ' ',
        AMT: this.data.cashAmount,
        type: this.data.selectedCouponType,
        AMT2 //新加的变量代表电子券或者咖啡券的金额，后端根据type区分是电子券还是咖啡券
      },
      success: () => {
        wx.showToast({
          title: '划扣成功',
          icon: 'success'
        });
        setTimeout(() => {
          wx.switchTab({
            url: '/pages/home/home'
          });
        }, 800);
      },
      fail: () => {
        wx.showToast({
          title: '提交失败，请稍后重试',
          icon: 'none'
        });
      }
    });
  },

  onUnload() {
    this.setData({
      showCodeDialog: false
    });
  }
});
