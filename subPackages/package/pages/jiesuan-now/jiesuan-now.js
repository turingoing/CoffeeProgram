const app = getApp();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    address: '',
    selected: '自提', // 默认选择自提
    storeName: '',
    phone: '',
    username: '',
    items: [], // 用于存储商品信息的数组
    usePoints: false, // 是否使用积分支付，默认不勾选
    useCoupon: false, // 是否使用卡券支付
    couponAvailable: false, // 卡券是否可用
    delivery: 5,
    couponId: '',
    showCodeDialog: false, // 控制弹窗显示
    inputBoxes: ["", "", "", "", "", ""], // 六个输入框
    codeValue: '', // 完整交易码
    testFocus: false, // 隐藏输入框聚焦
    AUrl: app.globalData.AUrl,
    tupianUrl: app.globalData.tupianUrl,
    isShow: true,
    creatingWxOrder: false,
    userScore: 0, // 当前用户积分
    requiredScore: 0, // 本次支付需要积分
    pointsAvailable: false, // 消费券是否可用
    totalPrice: 0, // 总价格
    totalCount: 0, // 商品总数量
    remark: '', // 备注
    
    // 新增字段
    orderType: 1, // 订单类型：1=自提，2=外送，默认自提
    basePrice: 0, // 商品基础价格（不含配送费）
    finalDeliveryFee: 0, // 最终配送费
    // 新增UI/逻辑状态
    payMethod: 'wechat', // wechat | balance | coffee | deposit | storecard
    pendingPayMethod: '',
    funds: { balance: 0, coffee: 0, deposit: 0, storecard: 0 },
    storecardid: '',
    balanceDisabled: true,
    coffeeDisabled: true,
    depositDisabled: true,
    storecardDisabled: true,
    hasStoreCard: false,
    selectedCouponText: '',
    dineType: 'dine_in'
  },

  normalizeProductImage(image) {
    const raw = String(image || '').trim();
    if (!raw) {
      return '';
    }

    if (/^https?:\/\//i.test(raw)) {
      return raw.replace(/^https?:\/\/(?:www\.)?caldicoffee\.com(?=\/)/i, app.globalData.AUrl);
    }

    return `${app.globalData.AUrl}/jy/wxUserImg/106/${raw.replace(/^\/+/, '')}`;
  },

  // 启动支付流程
  initiatePayment() {
    if (this.data.creatingWxOrder) {
      return;
    }

    const userid = String(wx.getStorageSync('userid') || '');
    const itsid = String(wx.getStorageSync('itsid') || '');
    if (!userid || userid === '0' || !itsid || itsid === '0') {
      wx.navigateTo({ url: '/subPackages/user/pages/register/register?from=jiesuan-now' });
      return;
    }
    const method = this.data.payMethod || 'wechat';
    const payable = Number(this.data.payableAmount || this.data.totalPrice || 0);
    if (method === 'wechat') {
      this.cashPayment();
      return;
    }
    if (method === 'balance' && Number(this.data.funds.balance || 0) < payable) {
      wx.showToast({ title: '余额不足抵扣', icon: 'none' });
      return;
    }
    if (method === 'coffee' && Number(this.data.funds.coffee || 0) < payable) {
      wx.showToast({ title: '咖啡券不足抵扣', icon: 'none' });
      return;
    }
    if (method === 'deposit' && Number(this.data.funds.deposit || 0) < payable) {
      wx.showToast({ title: '储值卡不足抵扣', icon: 'none' });
      return;
    }
    if (method === 'storecard' && Number(this.data.funds.storecard || 0) < payable) {
      wx.showToast({ title: '门店储值卡不足抵扣', icon: 'none' });
      return;
    }
    this.setData({ pendingPayMethod: method });
    this.showCodeDialog();
  },

  // 显示交易码弹窗
  showCodeDialog() {
    this.setData({
      showCodeDialog: true
    });
  },

  // 关闭弹窗
  closeDialog() {
    this.setData({
      showCodeDialog: false,
      codeValue: '',
      inputBoxes: ["", "", "", "", "", ""]
    });
  },

  // 输入框获取焦点
  handleGetFocus() {
    this.setData({
      testFocus: true
    });
  },

  // 输入框失去焦点
  handleNotFocus() {
    this.setData({
      testFocus: false
    });
  },

  // 处理输入的交易码
  handleTestInput(e) {
    const value = e.detail.value;
    const tempList = this.data.inputBoxes;
    for (let i = 0; i < 6; i++) {
      tempList[i] = value[i] ? value[i] : '';
    }
    this.setData({
      inputBoxes: tempList,
      codeValue: value
    });
  },

  // 获取交易码 - 需要实现
  // TODO: 实现获取交易码的接口调用
  getServerTransactionCode() {
    return new Promise((resolve, reject) => {
      // const userid = wx.getStorageSync('userid');
      const itsid = wx.getStorageSync('itsid') || app.globalData.itsid || '';// ✅ 修复1：和上方保持一致，缓存+全局双兜底，防止丢失
      // 接口调用示例
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
          console.log('交易码接口响应：', res.data);
          if (res.data.code === "1") {
            if (res.data.result?.list?.[0]?.transactionCode) {
              const serverCode = res.data.result.list[0].transactionCode;
              if (serverCode.length === 6) {
                resolve(serverCode);
              } else {
                reject(new Error('交易码格式无效（长度不符）'));
              }
            } else {
              reject(new Error('接口返回数据格式异常'));
            }
          } else {
            reject(new Error(res.data.msg || '接口请求失败'));
          }
        },
        fail: (err) => {
          reject(new Error('网络连接失败，请检查网络'));
        }
      });
    });
  },

  // 验证交易码
  async verifyCode() {
    try {
      const inputCode = this.data.codeValue.trim();
      if (inputCode.length !== 6) {
        wx.showToast({
          title: '请输入6位交易码',
          icon: 'none'
        });
        return;
      }

      const serverCode = await this.getServerTransactionCode();
      if (inputCode === serverCode) {
        wx.showToast({
          title: '交易码验证成功'
        });
        this.closeDialog();
        this.executePayByMethod(this.data.pendingPayMethod || this.data.payMethod);
      } else {
        wx.showToast({
          title: '交易码错误，请重新输入',
          icon: 'none'
        });
        this.setData({
          codeValue: '',
          inputBoxes: ["", "", "", "", "", ""]
        });
      }
    } catch (error) {
      wx.showToast({
        title: error.message,
        icon: 'none'
      });
    }
  },
  executePayByMethod(method) {
    if (method === 'coffee') {
      this.coffeeWalletPayment();
      return;
    }
    if (method === 'balance') {
      this.balancePayment();
      return;
    }
    if (method === 'deposit') {
      this.depositPayment();
      return;
    }
    if (method === 'storecard') {
      this.storeCardPayment();
      return;
    }
    this.cashPayment();
  },

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

  // 备注输入处理
  inputRemark(e) {
    this.setData({
      remark: e.detail.value
    });
  },
  // 设置取餐方式（自提内）
  /*
  setDineType(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({ dineType: type, selected: '自提' });
  },
  */

  // 卡券选择处理
  couponCheckboxChange: function (e) {
    let useCoupon = e.detail.value.includes('卡券支付');

    // 强制校验卡券可用性
    if (useCoupon) {
      this.fetchCoupons(); // 获取卡券列表
      if (!this.data.couponAvailable) {
        wx.showToast({
          title: '当前订单不符合卡券使用条件',
          icon: 'none'
        });
        useCoupon = false; // 强制取消勾选状态
      }
    } else {
      this.setData({
        useCoupon: false
      });
    }

    // 与积分支付互斥
    if (useCoupon && this.data.usePoints) {
      this.setData({
        usePoints: false
      });
    }

    this.setData({
      useCoupon
    }); // 更新最终状态
  },

  // 积分支付选择处理
  checkboxChange: function (e) {
    let usePoints = e.detail.value.includes('积分支付');

    // 检查积分是否足够
    if (usePoints) {
      // 调用检查积分可用性方法
      this.fetchUserScores();
    } else {
      this.setData({
        usePoints: false
      });
    }

    // 与卡券支付互斥
    if (usePoints && this.data.useCoupon) {
      this.setData({
        useCoupon: false
      });
    }

    this.setData({
      usePoints
    });
  },

  // 检查积分可用性 - 需要实现
  // TODO: 实现积分检查接口调用
  fetchUserScores: function () {
    let unitid = this.data.selected === '自提' 
      ? (wx.getStorageSync('selectedStoreId') || app.globalData.selectedStoreId || '')
      : (wx.getStorageSync('deliveryUnitId') || app.globalData.deliveryUnitId || '6');
    const that = this;
    const itsid = wx.getStorageSync('itsid');

    console.log('消费券查询参数:', { itsid });

    // 示例接口调用
    wx.request({
      url: `${app.globalData.AUrl}/jy/go/we.aspx?ituid=106&itjid=10603&itcid=10604&itsid=${itsid}&shopid=${unitid}`,
      method: 'GET',
      success: (res) => {
        console.log('消费券接口返回:', res.data);

        // 检查返回的数据是否包含score字段
        if (res.data && typeof res.data.score !== 'undefined') {
          const score = parseInt(res.data.score || 0, 10);
          const requiredScore = Math.ceil(that.data.totalPrice * 1.6);

          console.log('消费券数据:', { score, requiredScore, isEnough: score >= requiredScore });

          that.setData({
            userScore: score,
            requiredScore: requiredScore,
            pointsAvailable: score >= requiredScore
          });

          // 检查是否有足够的消费券
          if (score < requiredScore) {
            wx.showToast({
              title: '当前消费券不足',
              icon: 'none',
              duration: 2000
            });

            // 强制取消勾选状态
            that.setData({
              usePoints: false
            });
          }
        } else {
          console.error('消费券接口返回数据格式异常:', res.data);
          that.getUserScoreForCheck();
        }
      },
      fail: (err) => {
        console.error('获取消费券信息失败:', err);
        that.getUserScoreForCheck();
      }
    });
  },

  // 备用获取积分方法 - 需要实现
  getUserScoreForCheck: function () {
    const that = this;
    const itsid = wx.getStorageSync('itsid');
    let unitid = this.data.selected === '自提' 
      ? (wx.getStorageSync('selectedStoreId') || app.globalData.selectedStoreId || '')
      : (wx.getStorageSync('deliveryUnitId') || app.globalData.deliveryUnitId || '6');
    
    // 备用方法示例
    wx.request({
      url: `${app.globalData.AUrl}/jy/go/we.aspx?ituid=106&itjid=10603&itcid=10604&itsid=${itsid}&shopid=${unitid}`,  
      success(res) {
        console.log('备用积分接口返回:', res.data);

        if (res.data && res.data.code === '1') {
          const score = parseInt(res.data.score || 0, 10);
          const requiredScore = Math.ceil(that.data.totalPrice * 1.6);

          that.setData({
            userScore: score,
            requiredScore: requiredScore,
            pointsAvailable: score >= requiredScore
          });

          if (score < requiredScore) {
            wx.showToast({
              title: '当前消费券不足',
              icon: 'none',
              duration: 2000
            });
            that.setData({
              usePoints: false
            });
          }
        } else {
          wx.showToast({
            title: '当前无可用消费券',
            icon: 'none',
            duration: 2000
          });
          that.setData({
            usePoints: false
          });
        }
      },
      fail() {
        wx.showToast({
          title: '当前无可用消费券',
          icon: 'none',
          duration: 2000
        });
        that.setData({
          usePoints: false
        });
      }
    });
  },

  // 页面加载时执行
  onLoad: function (options) {
    // 加载立即购买的商品信息
    const buyNowItems = (wx.getStorageSync('buyNowItems') || []).map(item => ({
      ...item,
      imageUrl: this.normalizeProductImage(item.image)
    }));

    if (buyNowItems.length > 0) {
      // 计算总价和总数量
      const totalPrice = buyNowItems.reduce((total, item) => {
        return total + (item.price * item.num);
      }, 0);

      const totalCount = buyNowItems.reduce((count, item) => {
        return count + item.num;
      }, 0);

      this.setData({
        items: buyNowItems,
        totalPrice: totalPrice,
        totalCount: totalCount
      });
    }

    // 获取用户信息 - 包括自提门店、送货地址等
    this.loadUserInfo();
    // 预取资金余额
    this.prefetchFunds && this.prefetchFunds();
  },

  // 加载用户信息 - 需要实现
  loadUserInfo() {
    // 从全局获取基本信息
    const currentSelected = app.globalData.selected || '自提';
    const resolvedStoreName = app.globalData.selectedStoreName || app.globalData.storeName || wx.getStorageSync('selectedStoreName') || '';
    this.setData({
      selected: currentSelected,
      address: currentSelected === '外送' ? (app.globalData.addressDesc || '') : resolvedStoreName,
      phone: app.globalData.phone || '',
      username: app.globalData.username || '',
      storeName: resolvedStoreName,
    });
  },

  // 页面显示时执行
  onShow: function () {
    // 更新全局相关信息
    const currentSelected = app.globalData.selected || this.data.selected || '自提';
    const resolvedStoreName = app.globalData.selectedStoreName || app.globalData.storeName || wx.getStorageSync('selectedStoreName') || '';
    this.setData({
      isShow: true,
      creatingWxOrder: false,
      selected: currentSelected,
      address: currentSelected === '外送' ? app.globalData.addressDesc : resolvedStoreName,
      phone: app.globalData.phone,
      username: app.globalData.username,
      storeName: resolvedStoreName,
      delivery: app.globalData.delivery || 5
    }, () => {
      // 重新计算总价
      this.calculateTotal();
      this.prefetchFunds();
    });
      // 应用选中的优惠券
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
      }
      if (!this.data.selectedCouponText) {
        this.fetchCoupons();
      }
  },



  // 计算总价
  calculateTotal: function () {
    // 计算商品价格总和
    const itemsTotal = this.data.items.reduce((sum, item) => {
      const quantity = Number(item.num) || 0;
      const price = Number(item.price) || 0;
      return sum + (quantity * price);
    }, 0);
    
    // 记录基础商品价格
    console.log('商品基础价格:', itemsTotal.toFixed(2));

    // 如果选择外送，则加上配送费
    const deliveryFee = this.data.selected === '外送' ? Number(this.data.delivery) : 0;
    const total = itemsTotal + deliveryFee;
    const couponAmt = Number(this.data.appliedCouponAmt || 0);
    const payable = Math.max(0, total - couponAmt);
    
    console.log('计算总价详情:', {
      '商品总价': itemsTotal.toFixed(2),
      '配送费': deliveryFee.toFixed(2),
      '优惠金额': couponAmt.toFixed(2),
      '实付金额': payable.toFixed(2),
      '配送模式': this.data.selected
    });

    // 更新UI显示
    this.setData({
      totalPrice: itemsTotal.toFixed(2),
      payableAmount: payable.toFixed(2)
    });
    
    // 额外记录订单类型，便于其他函数使用
    const orderType = this.data.selected === '自提' ? 1 : 2;
    // 记录到页面数据中，方便其他地方引用
    this.setData({
      orderType: orderType,
      basePrice: itemsTotal.toFixed(2),
      finalDeliveryFee: deliveryFee.toFixed(2)
    });
    
    return total;
  },
  recomputePayable() {
    const base = Number(this.data.totalPrice || 0);
    const includeDelivery = this.data.selected === '外送' ? Number(this.data.delivery || 0) : 0;
    const couponAmt = Number(this.data.appliedCouponAmt || 0);
    const payable = Math.max(0, base + includeDelivery - couponAmt);
    this.setData({ payableAmount: payable.toFixed(2) });
  },

  // TODO: 实现获取卡券列表接口
  fetchCoupons() {
    const that = this;
    const userid = wx.getStorageSync('userid');
    // 接口调用示例
    wx.request({
      url: `${app.globalData.AUrl}/jy/go/we.aspx?ituid=106&itjid=0902&itcid=10619&userid=${userid}`,
      method: 'GET',
      success: (res) => {
        const list = (res.data && res.data.result) ? res.data.result : [];
        // 筛选status==='1'的可用券
        const usable = list.filter(item => item.status === '1');
        if (usable.length > 0) {
          const first = usable[0];
          const end = (first.endTime || '').replace(/^[^\/]+\//, '');
          that.setData({
            cardid: first.cardid,
            selectedCouponText: `[${first.cardName}] 已减￥${first.atm}`,
            couponAvailable: true,
            useCoupon: true,
            appliedCouponAmt: Number(first.atm || 0)
          });
          that.calculateTotal();
        }
      },
      fail: (err) => {
        console.error('获取卡券请求失败', err);
      }
    });
  },

  // 处理支付结果
  handlePaymentResult(res, type) {
    console.log('立即购买钱包支付返回：', type, res && res.data);
    const msg = {
      coupon: {
        success: '卡券支付成功',
        fail: '卡券支付失败'
      },
      points: {
        success: '积分支付成功',
        fail: '积分支付失败'
      },
      cash: {
        success: '支付成功',
        fail: '支付失败'
      },
      balance: {
        success: '余额支付成功',
        fail: '余额支付失败'
      },
      deposit: {
        success: '储值卡支付成功',
        fail: '储值卡支付失败'
      },
      storecard: {
        success: '门店储值卡支付成功',
        fail: '门店储值卡支付失败'
      },
      coffee: {
        success: '咖啡券支付成功',
        fail: '咖啡券支付失败'
      }
    }[type];

    const resp = res && res.data ? res.data : {};
    const hasOrder = !!(resp.orderid || resp.ORDERID || resp.sn || resp.SN || resp.result?.orderid || resp.result?.list?.[0]?.orderid);
    const success = resp.code === '1' || resp.code === 1 || resp.code === '0' || resp.code === 0 || resp.success === true ||
      resp.result === '1' || resp.result === 1 || /成功/.test(String(resp.msg || resp.desc || '')) || hasOrder;
    if (success) {
      // 清除立即购买的缓存数据
      wx.removeStorageSync('buyNowItems');

      const result = {
        is_success: true,
        msg: resp.msg || resp.desc || msg.success,
        client_sn: resp.orderid || resp.ORDERID || resp.sn || resp.SN || '',
        sn: resp.sn || resp.SN || resp.orderid || resp.ORDERID || ''
      };
      const resultParam = encodeURIComponent(JSON.stringify(result));
      wx.showToast({
        title: msg.success,
        icon: 'success'
      });
      setTimeout(() => wx.navigateTo({
        url: `/subPackages/package/pages/jiesuan-payResult/jiesuan-payResult?result=${resultParam}`
      }), 1200);
    } else {
      wx.showToast({
        title: resp.msg || resp.desc || msg.fail,
        icon: 'none'
      });
    }
  },

  // 取餐方式选择
  setDineType(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({ dineType: type, selected: '自提' }, () => {
      this.calculateTotal();
      this.fetchCoupons();
      this.recomputePayable && this.recomputePayable();
    });
  },
  // 自提/外送切换
  selectOption(e) {
    const option = e.currentTarget.dataset.option;
    this.setData({
      selected: option,
      address: option === '外送' ? (app.globalData.addressDesc || '') : (app.globalData.storeName || '')
    }, () => {
      this.calculateTotal();
      this.fetchCoupons();
      this.recomputePayable && this.recomputePayable();
    });
  },
  onTapPickup() {
    app.globalData.selected = '自提';
    this.setData({ selected: '自提' });
    wx.navigateTo({
      url: '/subPackages/package/pages/ziti/ziti?type=jiesuan-now'
    });
  },
  onTapDelivery() {
    app.globalData.selected = '外送';
    this.setData({ selected: '外送' });
    wx.navigateTo({
      url: '/subPackages/package/pages/chooseLocation/chooseLocation?type=jiesuan-now'
    });
  },


  // 现金支付流程 - 需要实现
  cashPayment() {
    if (this.data.creatingWxOrder) {
      return;
    }
    // TODO: 实现立即购买的现金支付处理
    const itsid = wx.getStorageSync('itsid');
    const userid = wx.getStorageSync('userid');
    const app = getApp();
    
    // 修改：统一获取unitId的逻辑，并添加默认外送门店ID
    let unitId;
    if (this.data.selected === '自提') {
      unitId = wx.getStorageSync('selectedStoreId');
    } else {
      // 外送时，优先使用存储中的deliveryUnitId，如果没有则使用app.globalData中的，如果也没有则使用默认值
      unitId = wx.getStorageSync('deliveryUnitId') || app.globalData.deliveryUnitId || '6'; // 默认外送门店ID为6
    }
    
    let totalAmount = Number(this.data.payableAmount || this.data.totalPrice || 0);

    if (this.data.selected === '自提' && !unitId) {
      wx.showToast({
        title: '请选择门店',
        duration: 2000
      });
      return;
    }

    // 不再重复加配送费，因为calculateTotal中已经处理过了
    // if (this.data.selected === '外送') {
    //   totalAmount += this.data.delivery;
    // }
    
    console.log('支付模式:', this.data.selected);
    console.log('使用的门店ID:', unitId);
    console.log('计算后的总金额（含优惠与配送费）:', totalAmount);

    // 获取商品信息，用于提交MCODE和NUM
    const item = this.data.items[0]; // 假设立即购买只有一个商品
    const mcode = item.skuCode || ''; // 商品编码
    const num = item.num || 1; // 商品数量

    this.setData({ creatingWxOrder: true });
    wx.showLoading({ title: '创建支付...', mask: true });

    //现金支付接口
    wx.request({
      // 微信支付接口（与购物车结算不一致）：mbid=10642, OPID=1200
      url: `${app.globalData.backUrl}phone.aspx?mbid=10642&ituid=${app.globalData.ituid}&itsid=${itsid}`,
      method: 'POST',
      data: {
          MCODE: mcode,//商品编码
          OPID: '1200',
          UNITID: unitId,
          NUM: num,
          USERID: userid,
          NOTE: this.data.remark || '', // 用户备注
          remark: this.data.remark || '', // 用户备注
          ASK: item.ask, // 添加规格数据
          AMT: totalAmount, //金额
          XXSQ: 'SQB',
          RURL: '/subPackages/package/pages/jiesuan-payResult/jiesuan-payResult',
          type: this.data.selected === '自提' ? 1 : 2,
          username: this.data.username,
          phone: this.data.phone,
          address: this.data.address,
          extra: JSON.stringify({ 
            in_lite_app: true,
            specs: this.data.selectedSpecs,
            isDelivery: this.data.selected === '外送', // 添加是否外送标记
            deliveryFee: this.data.selected === '外送' ? this.data.delivery : 0, // 添加配送费
            note: this.data.remark || '' // 用户备注放在extra中
          })
      },
      header: {
        'content-type': 'application/json'
      },
      success: (res) => {
        wx.hideLoading();
        console.log('支付接口返回:', res);

        if (!(res.data && res.data.yeepay)) {
          this.setData({ creatingWxOrder: false });
          wx.showToast({
            title: (res.data && res.data.msg) || '获取支付参数失败',
            icon: 'none'
          });
          return;
        }

        let packageNew = encodeURIComponent(res.data.yeepay.package)
        let paySignNew = encodeURIComponent(res.data.yeepay.paySign)

        console.log("packageNew:", packageNew);
        console.log("paySignNew:", paySignNew);

        // 移除立即购买缓存
        wx.removeStorageSync('buyNowItems');

        const amtInCents = Math.round(totalAmount * 100);
        wx.navigateTo({
          url: `/subPackages/package/pages/jiesuan-pay/jiesuan-pay?return_url=${res.data.rurl}&orderid=${res.data.orderid}&terminal=${res.data.terminal_sn}&amt=${amtInCents}&sign=${res.data.sign}&appId=${res.data.yeepay.appId}&nonceStr=${res.data.yeepay.nonceStr}&package=${packageNew}&paySign=${paySignNew}&signType=${res.data.yeepay.signType}&timeStamp=${res.data.yeepay.timeStamp}&SN=${res.data.SN}`,
          fail: () => {
            this.setData({ creatingWxOrder: false });
            wx.showToast({
              title: '支付页面打开失败',
              icon: 'none'
            });
          }
        });
      },
      fail: (err) => {
        wx.hideLoading();
        this.setData({ creatingWxOrder: false });
        console.error('支付接口调用失败:', err);
        wx.showToast({
          title: '支付失败，请重试',
          icon: 'none'
        });
      }
    });
  },

  balancePayment() {
    this.storedPay('1210');
  },
  coffeeWalletPayment() {
    this.storedPay('1203');
  },
  depositPayment() {
    this.storedPay('1211');
  },
  storeCardPayment() {
    this.storedPay('1212');
  },
  storedPay(opid) {
    const itsid = wx.getStorageSync('itsid');
    const unitId = this.data.selected === '自提'
      ? (wx.getStorageSync('selectedStoreId') || app.globalData.selectedStoreId)
      : (wx.getStorageSync('deliveryUnitId') || app.globalData.deliveryUnitId || '6');
    const totalAmount = Number(this.data.payableAmount || this.data.totalPrice || 0);
    const orderType = this.data.selected === '自提' ? 1 : 2;
    const deliveryFee = this.data.selected === '外送' ? Number(this.data.delivery || 0) : 0;
    const isDelivery = this.data.selected === '外送' ? 1 : 0;
    const item = (this.data.items && this.data.items[0]) ? this.data.items[0] : {};
    const mcode = item.skuCode || '';
    const num = item.num || 1;
    const payScore = opid === '1203' ? (totalAmount * 1.6) : totalAmount;
    if (opid === '1210' && Number(this.data.funds.balance || 0) < totalAmount) {
      wx.showToast({ title: '余额不足抵扣', icon: 'none' });
      return;
    }
    if (opid === '1211' && Number(this.data.funds.deposit || 0) < totalAmount) {
      wx.showToast({ title: '储值卡不足抵扣', icon: 'none' });
      return;
    }
    if (opid === '1212' && Number(this.data.funds.storecard || 0) < totalAmount) {
      wx.showToast({ title: '门店储值卡不足抵扣', icon: 'none' });
      return;
    }
    if (opid === '1203' && Number(this.data.funds.coffee || 0) < totalAmount) {
      wx.showToast({ title: '咖啡券不足抵扣', icon: 'none' });
      return;
    }
    const payload = {
      MCODE: mcode,
      OPID: opid,
      UNITID: unitId,
      NUM: num,
      USERID: '0',
      NOTE: this.data.remark || '',
      remark: this.data.remark || '',
      AMT: 0,
      SCORE: payScore,
      integralTotal: totalAmount.toFixed(2),
      ASK: item.ask,
      type: orderType,
      orderType: orderType,
      isDelivery: isDelivery,
      deliveryFee: deliveryFee,
      totalWithDelivery: totalAmount,
      username: this.data.username,
      phone: this.data.phone,
      address: this.data.address,
      extra: JSON.stringify({
        in_lite_app: true,
        specs: this.data.selectedSpecs,
        isDelivery: this.data.selected === '外送',
        deliveryFee: deliveryFee,
        orderType: orderType,
        totalPrice: totalAmount
      })
    };
    if (opid === '1212') {
      payload.storecardid = this.data.storecardid || '';
    }
    const url = `${app.globalData.backUrl}phone.aspx?mbid=10643&ituid=${app.globalData.ituid}&itsid=${itsid}`
    wx.request({
      // 钱包抵扣接口（余额/咖啡券/储值卡，与购物车结算一致）：mbid=10643, OPID=1210/1203/1211
      url: url,
      method: 'POST',
      data: payload,
      header: { 'content-type': 'application/json' },
      success: (res) => {
        console.log('支付接口返回:', res);
        console.log('支付对账日志', {
          OPID: payload.OPID,
          AMT: payload.AMT,
          SCORE: payload.SCORE,
          resp: res && res.data
        });
        const type = opid === '1210' ? 'balance' : (opid === '1211' ? 'deposit' : (opid === '1212' ? 'storecard' : 'coffee'));
        this.handlePaymentResult(res, type);
        wx.removeStorageSync('buyNowItems');
      },
      fail: () => {
        wx.showToast({ title: '支付失败，请重试', icon: 'none' });
      }
    });
  }
  ,
  // 预取资金余额（余额/咖啡券/储值卡）
  prefetchFunds() {
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
        const total = Number(this.data.payableAmount || this.data.totalPrice || 0);
        const hasStoreCard = storecard > 0;
        const nextPayMethod = (this.data.payMethod === 'storecard' && !hasStoreCard) ? 'wechat' : (this.data.payMethod || 'wechat');
        this.setData({
          funds: { balance, coffee, deposit, storecard },
          storecardid,
          balanceDisabled: !(balance >= total),
          coffeeDisabled: !(coffee >= Math.ceil(total * 1.6) || coffee >= total),
          depositDisabled: !(deposit >= total),
          storecardDisabled: !(storecard >= total),
          hasStoreCard,
          payMethod: nextPayMethod,
          // 不覆盖已选择的优惠券文案
        });
      }
    });
  },
  // 选择支付方式
  choosePayMethod(e) {
    const val = e.detail.value;
    this.setData({ payMethod: val, pendingPayMethod: '' });
  },
  guardBalancePay() {
    const payable = Number(this.data.payableAmount || this.data.totalPrice || 0);
    if (this.data.balanceDisabled || Number(this.data.funds.balance || 0) < payable) {
      wx.showToast({ title: '余额不足抵扣', icon: 'none' });
      return;
    }
    this.setData({ payMethod: 'balance', pendingPayMethod: '' });
  },
  guardCoffeePay() {
    const payable = Number(this.data.payableAmount || this.data.totalPrice || 0);
    if (this.data.coffeeDisabled || Number(this.data.funds.coffee || 0) < payable) {
      wx.showToast({ title: '咖啡券不足抵扣', icon: 'none' });
      return;
    }
    this.setData({ payMethod: 'coffee', pendingPayMethod: '' });
  },
  guardDepositPay() {
    const payable = Number(this.data.payableAmount || this.data.totalPrice || 0);
    if (this.data.depositDisabled || Number(this.data.funds.deposit || 0) < payable) {
      wx.showToast({ title: '储值卡不足抵扣', icon: 'none' });
      return;
    }
    this.setData({ payMethod: 'deposit', pendingPayMethod: '' });
  },
  guardStoreCardPay() {
    const payable = Number(this.data.payableAmount || this.data.totalPrice || 0);
    if (this.data.storecardDisabled || Number(this.data.funds.storecard || 0) < payable) {
      wx.showToast({ title: '门店储值卡不足抵扣', icon: 'none' });
      return;
    }
    this.setData({ payMethod: 'storecard', pendingPayMethod: '' });
  },
  // 优惠券行点击
  couponSelect() {
    wx.navigateTo({
      url: '/subPackages/package/pages/coupon-select/coupon-select?from=jiesuan-now'
    });
  }
})
