const app = getApp();

const SCENE_MAP = {
  balance: {
    title: '充值中心',
    assetName: '个人余额',
    options: [
      { amount: 600, gift: 0 },
      { amount: 1800, gift: 0 },
      { amount: 5400, gift: 0 },
      { amount: 12000, gift: 0 },
      { amount: 16200, gift: 0 }
    ],
    amountCodeMap: { 600: 920, 1800: 920, 5400: 920, 12000: 920, 16200: 920 }
  },
  stored: {
    title: '储值卡充值',
    assetName: '储值卡',
    options: [
      { amount: 100, gift: 30 },
      { amount: 300, gift: 120 },
      { amount: 498, gift: 250 },
      { amount: 998, gift: 600 }
    ],
    amountCodeMap: { 100: 920, 300: 920, 498: 920, 998: 920 },
    tips: '当前充值储值卡，只能用于消费购物，不能用于其它使用！'
  },
  new_store: {
    title: '新门店储值',
    assetName: '新店储值卡',
    options: [
      { amount: 100, gift: 30 },
      { amount: 300, gift: 120 },
      { amount: 498, gift: 250 },
      { amount: 998, gift: 600 }
    ],
    amountCodeMap: { 100: 920, 300: 920, 498: 920, 998: 920 },
    tips: '当前充值门店储值卡，仅限指定门店使用。'
  }
};

Page({
  data: {
    scene: 'balance',
    assetName: '个人余额',
    tips: '',
    currentBalance: '0.00',
    storecardid: '',
    cardid: '',
    amountOptions: [],
    selectedAmount: 0,
    payMethod: 'wechat',
    agreementChecked: false,
    showDualPayMethods: false
  },

  buildNewStoreOptionsByRate(options, storecardrate) {
    const rate = Number(storecardrate || 100);
    const bonusRate = rate > 100 ? (rate - 100) / 100 : 0;
    return (options || []).map((item) => {
      const amount = Number(item.amount || 0);
      const gift = Number((amount * bonusRate).toFixed(2));
      return {
        ...item,
        gift
      };
    });
  },

  isStoredRechargeScene(scene = this.data.scene) {
    return scene === 'stored' || scene === 'new_store';
  },

  onLoad(options) {
    const scene = options?.scene && SCENE_MAP[options.scene] ? options.scene : 'balance';
    const config = SCENE_MAP[scene];
    const cardid = scene === 'new_store' ? String(options?.cardid || '') : '';
    const amountOptions = (config.options || []).map((item) => ({ ...item }));

    wx.setNavigationBarTitle({ title: config.title });
    this.setData({
      scene,
      assetName: config.assetName,
      tips: config.tips || '',
      amountOptions,
      selectedAmount: amountOptions[0]?.amount || 0,
      payMethod: 'wechat',
      showDualPayMethods: this.isStoredRechargeScene(scene),
      cardid
    });

    this.loadBalance(scene);
  },

  loadBalance(scene) {
    const itsid = wx.getStorageSync('itsid');
    if (!itsid) {
      return;
    }

    wx.request({
      url: `${app.globalData.AUrl}/jy/go/we.aspx?ituid=106&itjid=10603&itcid=10603&itsid=${itsid}`,
      method: 'GET',
      success: (res) => {
        const data = res?.data || {};
        const balanceValue = scene === 'balance'
          ? data.money
          : (scene === 'new_store' ? data.storecardtotal : data.chuzhika);
        const storecardid = String(data.storecardid || '');
        const nextData = {
          currentBalance: Number(balanceValue || 0).toFixed(2),
          storecardid
        };

        if (scene === 'new_store') {
          nextData.amountOptions = this.buildNewStoreOptionsByRate(
            SCENE_MAP.new_store.options,
            data.storecardrate
          );
        }

        this.setData(nextData);
      }
    });
  },

  selectAmount(e) {
    const value = Number(e.currentTarget.dataset.value || 0);
    if (!value) {
      return;
    }
    this.setData({ selectedAmount: value });
  },

  selectPayMethod(e) {
    const method = String(e.currentTarget.dataset.method || 'wechat');
    if (!this.isStoredRechargeScene()) {
      this.setData({ payMethod: 'wechat' });
      return;
    }
    this.setData({
      payMethod: method === 'bankcard' ? 'bankcard' : 'wechat'
    });
  },

  toggleAgreementChecked() {
    this.setData({
      agreementChecked: !this.data.agreementChecked
    });
  },

  normalizePaymentResponse(rawData) {
    let responseData = rawData;
    if (typeof responseData !== 'string') {
      return responseData;
    }

    try {
      return JSON.parse(responseData);
    } catch (error) {
      console.error('JSON解析失败，尝试手动提取 yburl', error);
      const ybUrlMatch = responseData.match(/"yburl"\s*:\s*"?(https:\/\/[^",}]+)"?/);
      if (ybUrlMatch && ybUrlMatch[1]) {
        return {
          yburl: ybUrlMatch[1].trim()
        };
      }
      return null;
    }
  },

  gotoPayResult(returnUrl, resultData) {
    const safeReturnUrl = returnUrl || '/subPackages/package/pages/shareholder-payResult/shareholder-payResult';
    const result = JSON.stringify(resultData);
    wx.navigateTo({
      url: `${safeReturnUrl}?result=${result}`
    });
  },

  handleLegacyPayment(responseData) {
    if (responseData && responseData.yburl) {
      wx.navigateTo({
        url: `/subPackages/package/pages/web-view/web-view?url=${encodeURIComponent(responseData.yburl)}`
      });
      return;
    }

    if (responseData && responseData.yeepay) {
      const packageNew = encodeURIComponent(responseData.yeepay.package || '');
      const paySignNew = encodeURIComponent(responseData.yeepay.paySign || '');

      wx.navigateTo({
        url: `/subPackages/package/pages/shareholder-pay/shareholder-pay?return_url=${responseData.rurl}&orderid=${responseData.orderid}&terminal=${responseData.terminal_sn}&amt=${responseData.AMT}&sign=${responseData.sign}&appId=${responseData.yeepay.appId}&nonceStr=${responseData.yeepay.nonceStr}&package=${packageNew}&paySign=${paySignNew}&signType=${responseData.yeepay.signType}&timeStamp=${responseData.yeepay.timeStamp}&SN=${responseData.SN}`
      });
      return;
    }

    wx.showToast({
      title: '支付接口返回格式异常',
      icon: 'none',
      duration: 2000
    });
    console.error('接口返回数据格式异常:', responseData);
  },

  startDirectWeChatPayment(responseData) {
    const yeepay = responseData && responseData.yeepay;
    if (!yeepay) {
      if (responseData && responseData.yburl) {
        wx.showToast({
          title: '当前返回的是银行卡支付地址，请选择银行卡支付',
          icon: 'none'
        });
        return;
      }
      wx.showToast({
        title: '未获取到微信支付参数',
        icon: 'none'
      });
      return;
    }

    const itsid = wx.getStorageSync('itsid');
    const orderid = responseData.orderid || '';
    const sn = responseData.SN || '';
    const returnUrl = responseData.rurl || '/subPackages/package/pages/shareholder-payResult/shareholder-payResult';
    const failResult = {
      is_success: false,
      client_sn: orderid,
      sn
    };

    wx.requestPayment({
      timeStamp: String(yeepay.timeStamp || ''),
      nonceStr: String(yeepay.nonceStr || ''),
      package: String(yeepay.package || ''),
      signType: String(yeepay.signType || ''),
      paySign: String(yeepay.paySign || ''),
      success: () => {
        const successResult = {
          is_success: true,
          client_sn: orderid,
          sn
        };

        wx.request({
          url: `${app.globalData.AUrl}/jy/go/phone.aspx?mbid=10628&ituid=106&itsid=${itsid}`,
          method: 'POST',
          data: {
            ORDERID: orderid,
            ZFID: sn
          },
          complete: () => {
            this.gotoPayResult(returnUrl, successResult);
          }
        });
      },
      fail: (err) => {
        if (err.errMsg === 'requestPayment:fail cancel') {
          this.gotoPayResult(returnUrl, failResult);
          return;
        }

        wx.request({
          url: `${app.globalData.AUrl}/jy/go/phone.aspx?mbid=166&ituid=106&itsid=${itsid}`,
          method: 'POST',
          data: {
            ORDERID: orderid,
            ZFID: err.errMsg
          },
          complete: () => {
            this.gotoPayResult(returnUrl, failResult);
          }
        });
      }
    });
  },

  createOrder() {
    const { selectedAmount, scene, payMethod, cardid, agreementChecked } = this.data;
    const isStoredScene = this.isStoredRechargeScene(scene);

    if (!selectedAmount) {
      wx.showToast({ title: '请选择充值金额', icon: 'none' });
      return;
    }

    if (!agreementChecked) {
      wx.showToast({ title: '请先确认充值协议', icon: 'none' });
      return;
    }

    if (!isStoredScene && payMethod !== 'wechat') {
      wx.showToast({ title: '仅支持微信支付', icon: 'none' });
      return;
    }

    if (isStoredScene && payMethod !== 'wechat' && payMethod !== 'bankcard') {
      wx.showToast({ title: '请选择支付方式', icon: 'none' });
      return;
    }

    const itsid = wx.getStorageSync('itsid');
    if (!itsid) {
      if (scene === 'new_store') {
        wx.navigateTo({
          url: '/subPackages/user/pages/register/register?from=home'
        });
        return;
      }
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    const config = SCENE_MAP[scene] || SCENE_MAP.balance;
    const mcode = config.amountCodeMap[selectedAmount] || 920;
    const opidMap = {
      balance: '1207',
      stored: '1217',
      new_store: '1218'
    };
    const opid = opidMap[scene];

    if (!opid) {
      wx.showToast({ title: '充值场景参数错误', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '创建订单中...', mask: true });
    wx.request({
      url: `${app.globalData.backUrl}phone.aspx?mbid=10651&ituid=${app.globalData.ituid}&itsid=${itsid}`,
      method: 'POST',
      header: {
        'content-type': 'application/json'
      },
      data: {
        MCODE: mcode,
        OPID: opid,
        UNITID: '1',
        NUM: 1,
        USERID: '0',
        NOTE: ' ',
        AMT: Number(selectedAmount),
        invite: String(this.data.inviteCode || wx.getStorageSync('invite') || ''),
        RURL: '/subPackages/package/pages/shareholder-payResult/shareholder-payResult',
        ...(scene === 'new_store' && cardid ? { cardid } : {})
      },
      success: (res) => {
        const responseData = this.normalizePaymentResponse(res.data);
        wx.hideLoading();

        if (!responseData) {
          wx.showToast({
            title: '支付接口返回格式异常',
            icon: 'none',
            duration: 2000
          });
          console.error('接口返回数据格式异常:', res.data);
          return;
        }

        if (isStoredScene && payMethod === 'wechat') {
          this.startDirectWeChatPayment(responseData);
          return;
        }

        this.handleLegacyPayment(responseData);
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('请求失败:', err);
        wx.showToast({
          title: '请求失败，请稍后再试',
          icon: 'none'
        });
      }
    });
  },

  goRechargeAgreement() {
    wx.navigateTo({
      url: '/subPackages/package/pages/xieyi/xieyi?agreement=recharge'
    });
  }
});
