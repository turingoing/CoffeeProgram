const app = getApp();

Page({
  data: {
    tupianUrl: app.globalData.tupianUrl,
    AUrl: app.globalData.AUrl,
    tupianUrl: app.globalData.tupianUrl,
    
    // 基础订单信息
    address: '',
    selected: '自提', // 自提 / 外送
    storeName: '',
    phone: '',
    username: '',
    items: [], 
    delivery: 5,
    totalprice: '0.00',
    payableAmount: '0.00',
    remark: '',
    dineType: 'dine_in', // dine_in | takeaway
    isShow: true,
    creatingWxOrder: false,

    // 优惠券相关
    couponAvailable: false, 
    useCoupon: false,
    selectedCouponText: '',
    appliedCouponAmt: 0,
    cardid: '',
    List1: [],
    List2: [],

    // 支付弹窗相关
    showCodeDialog: false, 
    inputBoxes: ["", "", "", "", "", ""], 
    codeValue: '', 
    testFocus: false,

    // 核心：统一支付方式与余额展示
    payMethod: 'wechat', // wechat | balance | coffee | deposit | storecard
    pendingPayMethod: '', // 弹窗期间暂存的支付方式
    funds: { balance: 0, coffee: 0, deposit: 0, storecard: 0 },
    storecardid: '',
    balanceDisabled: true,
    coffeeDisabled: true,
    depositDisabled: true,
    storecardDisabled: true,
    hasStoreCard: false
  },

  onLoad(options) {
    this.setData({
      client_sn: Date.now(),
    });
  },

  onShow() {
    // 页面显示时，更新全局状态
    const currentSelected = app.globalData.selected || '自提';
    const resolvedStoreName = app.globalData.selectedStoreName || app.globalData.storeName || wx.getStorageSync('selectedStoreName') || '';
    const resolvedStoreId = wx.getStorageSync('selectedStoreId') || app.globalData.selectedStoreId || '';
    this.setData({
      isShow: true,
      creatingWxOrder: false,
      selected: currentSelected,
      address: currentSelected === '外送' ? (app.globalData.addressDesc || '') : resolvedStoreName,
      phone: app.globalData.phone,
      username: app.globalData.username,
      storeName: resolvedStoreName,
      unitId: resolvedStoreId,
      delivery: app.globalData.delivery || 5
    }, () => {
      // 1. 获取商品，算总价
      this.fetchItems();
      
      // 2. 检查是否有刚选中的优惠券
      const picked = wx.getStorageSync('selectedCoupon');
      if (picked && picked.cardid) {
        this.setData({
          cardid: picked.cardid,
          selectedCouponText: `[${picked.cardName}] 已减￥${picked.atm}`,
          couponAvailable: true,
          useCoupon: true,
          appliedCouponAmt: Number(picked.atm || 0)
        });
        this.calculateTotal();
        wx.removeStorageSync('selectedCoupon');
      } else if (!this.data.selectedCouponText) {
        // 没有则自动获取最优优惠券
        this.fetchCoupons();
      }
      
      // 3. 拉取用户三大钱包余额（余额/咖啡券/储值卡）
      this.prefetchFunds();
    });
  },

  // ---------------- 【核心支付调度逻辑】 ----------------
  
  // 1. 点击提交订单按钮
  initiatePayment() {
    if (this.data.creatingWxOrder) {
      return;
    }

    const userid = String(wx.getStorageSync('userid') || '');
    const itsid = String(wx.getStorageSync('itsid') || '');
    if (!userid || userid === '0' || !itsid || itsid === '0') {
      wx.navigateTo({ url: '/subPackages/user/pages/register/register?from=jiesuan' });
      return;
    }
    
    const method = this.data.payMethod || 'wechat';
    const payable = Number(this.data.payableAmount || this.data.totalprice || 0);

    // 如果是微信支付，直接去结算（不需要输入6位交易码）
    if (method === 'wechat') {
      this.cashPayment();
      return;
    }

    // 如果是钱包支付，二次校验余额是否足够
    if (method === 'balance' && Number(this.data.funds.balance || 0) < payable) {
      return wx.showToast({ title: '余额不足抵扣', icon: 'none' });
    }
    if (method === 'coffee' && Number(this.data.funds.coffee || 0) < (payable * 1.6)) {
      return wx.showToast({ title: '咖啡券不足抵扣', icon: 'none' });
    }
    if (method === 'deposit' && Number(this.data.funds.deposit || 0) < payable) {
      return wx.showToast({ title: '储值卡不足抵扣', icon: 'none' });
    }
    if (method === 'storecard' && Number(this.data.funds.storecard || 0) < payable) {
      return wx.showToast({ title: '门店储值卡不足抵扣', icon: 'none' });
    }

    // 余额充足，唤起交易码弹窗
    this.setData({ pendingPayMethod: method });
    this.showCodeDialog();
  },

  // 2. 交易码验证成功后的执行分发
  executePayByMethod(method) {
    if (method === 'coffee') return this.coffeeWalletPayment();
    if (method === 'balance') return this.balancePayment();
    if (method === 'deposit') return this.depositPayment();
    if (method === 'storecard') return this.storeCardPayment();
    this.cashPayment(); // 兜底
  },

  // ---------------- 【微信支付(现金)逻辑】 ----------------
  buildPaymentNote(opid) {
    const noteMap = {
      '1200': '\u5fae\u4fe1\u652f\u4ed8',
      '1210': '\u4f59\u989d\u652f\u4ed8',
      '1203': '\u5496\u5561\u5238\u652f\u4ed8',
      '1211': '\u50a8\u503c\u5361\u652f\u4ed8',
      '1212': '\u95e8\u5e97\u50a8\u503c\u5361\u652f\u4ed8'
    };
    const baseNote = noteMap[String(opid)] || '\u652f\u4ed8';
    const isDelivery = this.data.selected === '\u5916\u9001';
    const suffix = isDelivery
      ? '\u5916\u9001'
      : (this.data.dineType === 'takeaway'
        ? '\u81ea\u63d0\u5e26\u8d70'
        : '\u5e97\u5185\u7528\u9910');

    return `${baseNote}-${suffix}`;
  },

  cashPayment() {
    if (this.data.creatingWxOrder) {
      return;
    }

    const itsid = wx.getStorageSync('itsid');
    const userid = wx.getStorageSync('userid');
    
    let unitId = this.data.selected === '自提' 
      ? wx.getStorageSync('selectedStoreId') 
      : (wx.getStorageSync('deliveryUnitId') || app.globalData.deliveryUnitId || '6');

    if (this.data.selected === '自提' && !unitId) {
      return wx.showToast({ title: '请选择门店', icon: 'none' });
    }

    let totalAmount = Number(this.data.payableAmount || 0);
    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
      return wx.showToast({ title: '订单金额异常，请重试', icon: 'none' });
    }
    const amtInCents = Math.round(totalAmount * 100);

    this.setData({ creatingWxOrder: true });
    wx.showLoading({ title: '创建支付...', mask: true });
    wx.request({
      url: `${app.globalData.backUrl}phone.aspx?mbid=122&ituid=${app.globalData.ituid}&itsid=${itsid}`,
      method: 'POST',
      header: { 'content-type': 'application/json' },
      data: {
        MCODE: '',
        OPID: '1200', // 1200 代表微信支付获取统一下单
        UNITID: unitId,
        NUM: '',
        USERID: '0',
        NOTE: this.data.remark || '',
        AMT: totalAmount,
        XXSQ: 'SQB',
        RURL: '/subPackages/package/pages/jiesuan-payResult/jiesuan-payResult',
        type: this.data.selected === '自提' ? 1 : 2,
        username: this.data.username,
        phone: this.data.phone,
        address: this.data.address,
        extra: JSON.stringify({ in_lite_app: true })
      },
      success: (res) => {
        wx.hideLoading();
        // 安全校验：必须确保后台返回了 yeepay 微信参数
        console.log("【122微信支付下单】后台返回的真实数据:", res);
        // if (res.data && res.data.yeepay &&  res.data.code === '1' )
        if (res.data && res.data.yeepay  ) {
          const yp = res.data.yeepay;
          const packageNew = encodeURIComponent(yp.package || '');
          const paySignNew = encodeURIComponent(yp.paySign || '');

          const orderType = this.data.selected === '外送' ? '2' : '1';
          const urlParams = {
            return_url: res.data.rurl,
            orderid: res.data.orderid,
            terminal: res.data.terminal_sn,
            amt: amtInCents.toString(),
            sign: res.data.sign,
            appId: yp.appId,
            nonceStr: yp.nonceStr,
            package: packageNew,
            paySign: paySignNew,
            signType: yp.signType,
            timeStamp: yp.timeStamp,
            SN: res.data.SN,
            orderType: orderType
          };

          let url = '/subPackages/package/pages/jiesuan-pay/jiesuan-pay?';
          for (const key in urlParams) {
            if (urlParams[key]) url += `${key}=${urlParams[key]}&`;
          }
          url = url.slice(0, -1);
          
          // 跳转至你的微信支付收银台
          wx.navigateTo({
            url,
            fail: () => {
              this.setData({ creatingWxOrder: false });
              wx.showToast({ title: '支付页面打开失败', icon: 'none' });
            }
          });
        } else {
          this.setData({ creatingWxOrder: false });
          wx.showToast({ title: (res.data && res.data.msg) || '获取支付参数失败', icon: 'none' });
        }
      },
      fail: () => {
        this.setData({ creatingWxOrder: false });
        wx.hideLoading();
        wx.showToast({ title: '网络异常，请重试', icon: 'none' });
      }
    });
  },

  // ---------------- 【三大内部钱包支付逻辑】 ----------------
  balancePayment() { this.storedPay('1210'); },
  depositPayment() { this.storedPay('1211'); },
  storeCardPayment() { this.storedPay('1212'); },
  coffeeWalletPayment() { this.storedPay('1203'); },

  storedPay(opid) {
    const itsid = wx.getStorageSync('itsid');
    const userid = wx.getStorageSync('userid');
    const unitId = this.data.selected === '自提'
      ? (wx.getStorageSync('selectedStoreId') || app.globalData.selectedStoreId)
      : (wx.getStorageSync('deliveryUnitId') || app.globalData.deliveryUnitId || '6');
    
    const totalAmount = Number(this.data.payableAmount || this.data.totalprice || 0);
    const deliveryFee = this.data.selected === '外送' ? Number(this.data.delivery || 0) : 0;
    const couponAmt = Number(this.data.appliedCouponAmt || 0);
    const neededAmount = Math.max(0, Number(this.data.totalprice || 0) - couponAmt + deliveryFee);
    const balance = Number(this.data.funds.balance || 0);
    const deposit = Number(this.data.funds.deposit || 0);
    const storecard = Number(this.data.funds.storecard || 0);
    if (opid === '1210' && balance < neededAmount) {
      wx.showToast({ title: '余额不足抵扣', icon: 'none' });
      return;
    }
    if (opid === '1211' && deposit < neededAmount) {
      wx.showToast({ title: '储值卡不足抵扣', icon: 'none' });
      return;
    }
    if (opid === '1212' && storecard < neededAmount) {
      wx.showToast({ title: '门店储值卡不足抵扣', icon: 'none' });
      return;
    }
    if (opid === '1203') {
      const needed = Math.ceil(totalAmount * 1.6);
      const coffee = Number(this.data.funds.coffee || 0);
      if (coffee < needed) {
        wx.showToast({ title: '咖啡券不足抵扣', icon: 'none' });
        return;
      }
    }
   //新添加一个type类型
    const type = this.data.selected === '自提' ? 1 : 2;
    
    const payScore = opid === '1203' ? (totalAmount * 1.6) : totalAmount;

    wx.showLoading({ title: '支付中...', mask: true });

    const requestData = {
      MCODE: '',
      OPID: opid,
      UNITID: unitId,
      NOTE: this.data.remark || '',
      NUM: '',
      USERID: userid,
      AMT: 0,
      SCORE: payScore,
      type,
      extra: JSON.stringify({ in_lite_app: true })
    };
    if (opid === '1212') {
      requestData.storecardid = this.data.storecardid || '';
    }
    wx.request({
      url: `${app.globalData.backUrl}phone.aspx?mbid=124&ituid=${app.globalData.ituid}&itsid=${itsid}`,
      method: 'POST',
      header: { 'content-type': 'application/json' },
      data: requestData,
      success: (res) => {
        wx.hideLoading();
        const type = opid === '1210' ? 'balance' : (opid === '1211' ? 'deposit' : (opid === '1212' ? 'storecard' : 'coffee'));
        this.handlePaymentResult(res, type);
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: '支付失败，请重试', icon: 'none' });
      }
    });
  },

  syncOrderAddressInfo() {
    return new Promise((resolve, reject) => {
      const userid = String(wx.getStorageSync('userid') || '');
      const itsid = String(wx.getStorageSync('itsid') || '');
      if (!userid || userid === '0' || !itsid || itsid === '0') {
        resolve();
        return;
      }
      wx.request({
        url: `${app.globalData.AUrl}/jy/go/we.aspx?ituid=106&itjid=10610&itcid=10622&userid=${userid}`,
        method: 'GET',
        success: (res) => {
          const list = res?.data?.result?.list || [];
          const orderid = String((list[0] && list[0].orderid) || '');
          if (!orderid) {
            reject(new Error('订单号获取失败'));
            return;
          }
          wx.request({
            url: `${app.globalData.AUrl}/jy/go/phone.aspx?mbid=10617&ituid=106&itsid=${itsid}`,
            method: 'POST',
            data: {
              orderid: orderid,
              type: this.data.selected === '自提' ? 1 : 2,
              username: this.data.username,
              phone: this.data.phone,
              address: this.data.address,
              extra: JSON.stringify({ in_lite_app: true })
            },
            success: () => resolve(),
            fail: () => reject(new Error('订单地址信息提交失败'))
          });
        },
        fail: () => reject(new Error('订单号接口请求失败'))
      });
    });
  },

  handlePaymentResult(res, type) {
    const msgDict = {
      wechat: { success: '支付成功', fail: '支付失败' },
      balance: { success: '余额支付成功', fail: '余额支付失败' },
      deposit: { success: '储值卡支付成功', fail: '储值卡支付失败' },
      storecard: { success: '门店储值卡支付成功', fail: '门店储值卡支付失败' },
      coffee: { success: '咖啡券支付成功', fail: '咖啡券支付失败' }
    };
    const msg = msgDict[type] || msgDict['wechat'];
    const resp = res && res.data ? res.data : {};
    
    const hasOrder = !!(resp.orderid || resp.ORDERID || resp.sn || resp.SN);
    const success = resp.code == 1 || resp.code == 0 || resp.success || /成功/.test(resp.msg || '') || hasOrder;

    if (success) {
      const continueSuccessFlow = () => {
        const categories = wx.getStorageSync('categories') || [];
        categories.forEach(cat => cat.children?.forEach(i => i.num = 0));
        wx.setStorageSync('categories', categories);
        wx.removeStorageSync('updataArray');
        wx.removeStorageSync('cartItems');
        wx.setStorageSync('sum', 0);
        wx.setStorageSync('total', 0);
        const result = {
          is_success: true,
          msg: resp.msg || resp.desc || msg.success,
          client_sn: resp.orderid || resp.ORDERID || resp.sn || resp.SN || '',
          sn: resp.sn || resp.SN || resp.orderid || resp.ORDERID || ''
        };
        const resultParam = encodeURIComponent(JSON.stringify(result));
        wx.showToast({ title: msg.success, icon: 'success' });
        setTimeout(() => wx.navigateTo({
          url: `/subPackages/package/pages/jiesuan-payResult/jiesuan-payResult?result=${resultParam}`
        }), 1200);
      };
      if (type === 'coffee') {
        this.syncOrderAddressInfo()
          .catch((err) => {
            console.error('10617地址信息同步失败:', err);
          })
          .finally(() => {
            continueSuccessFlow();
          });
      } else {
        continueSuccessFlow();
      }
    } else {
      wx.showToast({ title: resp.msg || resp.desc || msg.fail, icon: 'none' });
    }
  },

  // ---------------- 【交易码与安全验证逻辑】 ----------------
  showCodeDialog() { this.setData({ showCodeDialog: true }); },
  closeDialog() { this.setData({ showCodeDialog: false, codeValue: '', inputBoxes: ["", "", "", "", "", ""] }); },
  handleGetFocus() { this.setData({ testFocus: true }); },
  handleNotFocus() { this.setData({ testFocus: false }); },
  
  handleTestInput(e) {
    const value = e.detail.value;
    const tempList = this.data.inputBoxes;
    for (let i = 0; i < 6; i++) {
      tempList[i] = value[i] ? value[i] : '';
    }
    this.setData({ inputBoxes: tempList, codeValue: value });
  },

  getServerTransactionCode() {
    return new Promise((resolve, reject) => {
      // const userid = wx.getStorageSync('userid');
      const itsid = wx.getStorageSync('itsid') || app.globalData.itsid || '';// ✅ 修复1：和上方保持一致，缓存+全局双兜底，防止丢失
      wx.request({
        url: `${app.globalData.AUrl}/jy/go/we.aspx`,
        method: 'GET',
        data: { ituid: 106, itjid: 10610, itcid: 10632, itsid: itsid },
        success: (res) => {
          if (res.data.code === "1" && res.data.result?.list?.[0]?.transactionCode) {
            const serverCode = res.data.result.list[0].transactionCode;
            serverCode.length === 6 ? resolve(serverCode) : reject(new Error('交易码长度异常'));
          } else {
            reject(new Error(res.data.msg || '获取交易码失败'));
          }
        },
        fail: () => reject(new Error('网络连接失败'))
      });
    });
  },

  async verifyCode() {
    try {
      const inputCode = this.data.codeValue.trim();
      if (inputCode.length !== 6) return wx.showToast({ title: '请输入6位交易码', icon: 'none' });
      
      wx.showLoading({ title: '验证中', mask: true });
      const serverCode = await this.getServerTransactionCode();
      wx.hideLoading();

      if (inputCode === serverCode) {
        this.closeDialog();
        this.executePayByMethod(this.data.pendingPayMethod || this.data.payMethod);
      } else {
        wx.showToast({ title: '交易码错误', icon: 'none' });
        this.setData({ codeValue: '', inputBoxes: ["", "", "", "", "", ""] });
      }
    } catch (error) {
      wx.hideLoading();
      wx.showToast({ title: error.message, icon: 'none' });
    }
  },

  // ---------------- 【基础订单与金额计算】 ----------------
  prefetchFunds() {
    // 同时加上自提和外送的区分，但是选择外送的时候，unitid 还是默认的6！
    let unitid = this.data.selected === '自提' 
      ? (wx.getStorageSync('selectedStoreId') || app.globalData.selectedStoreId || '')
      : (wx.getStorageSync('deliveryUnitId') || app.globalData.deliveryUnitId || '6');
    const itsid = wx.getStorageSync('itsid');
    wx.request({
      url: `${app.globalData.AUrl}/jy/go/we.aspx?ituid=106&itjid=10603&itcid=10604&itsid=${itsid}&shopid=${unitid}`,
      method: 'GET',
      success: (res) => {
        const balance = Number(res.data.money || 0);
        const coffee = Number(res.data.score || 0);
        const deposit = Number(res.data.chuzhika || res.data.chuhzika || 0);
        const storecard = Number(res.data.storecard || 0);
        const storecardid = String(res.data.storecardid || '');
        const total = Number(this.data.selected === '外送' ? (this.data.totalprice*1 + this.data.delivery*1) : this.data.totalprice) || 0;
        const hasStoreCard = storecard > 0;
        const nextPayMethod = (this.data.payMethod === 'storecard' && !hasStoreCard) ? 'wechat' : (this.data.payMethod || 'wechat');
        
        this.setData({
          funds: { balance, coffee, deposit, storecard },
          balanceDisabled: balance < total,
          coffeeDisabled: coffee < Math.ceil(total * 1.6),
          depositDisabled: deposit < total,
          storecardDisabled: storecard < total,
          hasStoreCard,
          storecardid,
          payMethod: nextPayMethod
        });
      }
    });
  },

  selectOption(e) {
    const option = e.currentTarget.dataset.option;
    app.globalData.selected = option;
    if (option === '自提') {
      app.globalData.address = app.globalData.storeName;
    } else if (option === '外送') {
      const deliveryUnitId = '6'; 
      wx.setStorageSync('deliveryUnitId', deliveryUnitId);
      app.globalData.deliveryUnitId = deliveryUnitId;
    }
    this.setData({
      selected: option,
      address: option === '外送' ? (app.globalData.addressDesc || '') : (app.globalData.storeName || '')
    }, () => {
      this.fetchItems();
      this.fetchCoupons();
      this.prefetchFunds(); // 切换模式重新校验余额可用性
    });
  },

  fetchItems() {
    const itsid = wx.getStorageSync('itsid');
    wx.request({
      url: `${app.globalData.AUrl}/jy/go/we.aspx?ituid=106&itjid=10610&itcid=10601&itsid=${itsid}`,
      method: 'GET',
      success: (res) => {
        if (res.data.code === '1' && res.data.result) {
          const items = res.data.result.list;
          const hasValidItem = items.some(item => item.title.includes('冰美式') && Number(item.num) === 1);
          this.setData({
            items: items,
            couponAvailable: hasValidItem,
            useCoupon: hasValidItem ? this.data.useCoupon : false 
          }, () => {
            this.calculateTotal();
          });
        }
      }
    });
  },

  fetchCoupons() {
    const userid = wx.getStorageSync('userid');
    wx.request({
      url: `${app.globalData.AUrl}/jy/go/we.aspx?ituid=106&itjid=0902&itcid=10619&userid=${userid}`,
      method: 'GET',
      success: (res) => {
        const list = (res.data && res.data.result) ? res.data.result : [];
        const List1 = [];
        list.forEach(item => {
          if (item.status == '1') List1.push(item);
        });
        if (List1.length > 0) {
          const first = List1[0];
          this.setData({
            cardid: first.cardid,
            selectedCouponText: `[${first.cardName}] 已减￥${first.atm}`,
            couponAvailable: true,
            useCoupon: true,
            appliedCouponAmt: Number(first.atm || 0)
          });
          this.calculateTotal();
        } else {
          this.setData({ couponAvailable: false, useCoupon: false, selectedCouponText: '暂无可用券', appliedCouponAmt: 0 });
        }
      }
    });
  },

  calculateTotal() {
    let total = this.data.items.reduce((sum, item) => sum + (Number(item.num) || 0) * (Number(item.price) || 0), 0);
    this.setData({ totalprice: total.toFixed(2) });

    const deliveryFee = this.data.selected === '外送' ? Number(this.data.delivery) : 0;
    const couponAmt = Number(this.data.appliedCouponAmt || 0);
    const payable = Math.max(0, total + deliveryFee - couponAmt);
    
    this.setData({ payableAmount: payable.toFixed(2) });
  },

  // ---------------- 【交互事件处理】 ----------------
  choosePayMethod(e) { this.setData({ payMethod: e.detail.value, pendingPayMethod: '' }); },
  guardBalancePay() { if (this.data.balanceDisabled) wx.showToast({ title: '余额不足抵扣', icon: 'none' }); else this.setData({ payMethod: 'balance' }); },
  guardCoffeePay() {
    const payable = Number(this.data.payableAmount || this.data.totalprice || 0);
    if (this.data.coffeeDisabled || Number(this.data.funds.coffee || 0) < (payable * 1.6)) {
      wx.showToast({ title: '咖啡券不足抵扣', icon: 'none' });
    } else {
      this.setData({ payMethod: 'coffee' });
    }
  },
  guardDepositPay() { if (this.data.depositDisabled) wx.showToast({ title: '储值卡不足抵扣', icon: 'none' }); else this.setData({ payMethod: 'deposit' }); },
  guardStoreCardPay() { if (this.data.storecardDisabled) wx.showToast({ title: '门店储值卡不足抵扣', icon: 'none' }); else this.setData({ payMethod: 'storecard' }); },
  setDineType(e) { this.setData({ dineType: e.currentTarget.dataset.type, selected: '自提' }); },
  inputRemark(e) { this.setData({ remark: e.detail.value }); },
  couponSelect() { wx.navigateTo({ url: '/subPackages/package/pages/coupon-select/coupon-select?from=jiesuan' }); },
  gotoChooseLocation() { wx.navigateTo({ url: '/subPackages/package/pages/chooseLocation/chooseLocation?type=jiesuan' }); }
});
