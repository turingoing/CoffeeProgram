const app = getApp();
const FIXED_RECHARGE_QUANTITY = 1;
Page({
  data: {
    tupianUrl: app.globalData.tupianUrl,
    MCODE: '',
    quantity: 1, // 初始数量
    pricePerUnit: '', // 每份价格，单位为元
    userid: app.globalData.userid, // 获取全局userid
    showCodeDialog: false, // 控制弹窗显示
    inputBoxes: ["", "", "", "", "", ""], // 六个输入框
    codeValue: '', // 完整交易码
    testFocus: false, // 隐藏输入框聚焦
    money: '0.00', // 初始化为字符串格式
    score: '0.00', // 初始化为字符串格式
    dianzi: '0.00',
    selectedCouponType: ''
  },

  onLoad(options) {
    this.resetQuantity();
    this.refreshBalance(); // 初始化时加载余额
  },

  onShow() {
    this.resetQuantity();
    this.refreshBalance();
    this.loadPriceData();
  },

  // 加载价格数据
  resetQuantity() {
    if (this.data.quantity === FIXED_RECHARGE_QUANTITY) {
      return;
    }

    this.setData({
      quantity: FIXED_RECHARGE_QUANTITY
    });
  },

  loadPriceData() {
    const AUrl = app.globalData.AUrl;
    wx.request({
      url: `${AUrl}/jy/go/we.aspx?ituid=106&itjid=10641&itcid=10641`,
      success: (res) => {
        const pricePerUnit = Number(res.data.data || 0);
        this.setData({
          MCODE: res.data.code,
          pricePerUnit
        });
        this.updatePaymentAmounts(FIXED_RECHARGE_QUANTITY, pricePerUnit);
      }
    });
  },

  // 刷新余额数据
  refreshBalance() {
    const itsid = wx.getStorageSync('itsid');
    wx.request({
      url: `${app.globalData.AUrl}/jy/go/we.aspx?ituid=106&itjid=10603&itcid=10603&itsid=${itsid}`,
      success: (res) => {
        this.setData({
          money: parseFloat(res.data.money || 0).toFixed(2),
          score: parseFloat(res.data.score || 0).toFixed(2),
          dianzi: parseFloat(res.data.dianzi || 0).toFixed(2)
        });
      }
    });
  },
  updatePaymentAmounts(quantity, unitPrice = this.data.pricePerUnit) {
    const amount = Number(unitPrice || 0) * FIXED_RECHARGE_QUANTITY;
    this.setData({
      quantity: FIXED_RECHARGE_QUANTITY,
      showMoney: (amount * 0.6).toFixed(2),
      showQuan: (amount * 0.4).toFixed(2)
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
      type: isKafei ? 'kafei' : 'dianzi',
      label: isKafei ? '消费券' : '电子券',
      balance: Number(isKafei ? this.data.score : this.data.dianzi)
    };
  },

  // 显示交易码弹窗
  showCodeDialog() {
    this.setData({
      showCodeDialog: true,
      codeValue: '',
      inputBoxes: ["", "", "", "", "", ""],
      testFocus: false
    }, () => {
      this.handleGetFocus();
    });
  },

  // 关闭弹窗
  closeDialog() {
    this.setData({
      showCodeDialog: false,
      codeValue: '',
      inputBoxes: ["", "", "", "", "", ""],
      testFocus: false
    });
  },

  handleGetFocus() {
    if (!this.data.showCodeDialog) return;
    this.setData({
      testFocus: false
    }, () => {
      this.setData({
        testFocus: true
      });
    });
  },

  handleNotFocus() {
    this.setData({
      testFocus: false
    });
  },

  // 处理输入
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

  // 验证交易码
  getServerTransactionCode() {
    return new Promise((resolve, reject) => {
      // const userid = wx.getStorageSync('userid');
      const itsid = wx.getStorageSync('itsid') || app.globalData.itsid || '';
      wx.request({
        url: `${app.globalData.AUrl}/jy/go/we.aspx`, // 请确保链接合法且可访问
        method: 'GET',
        data: {
          ituid: 106,
          itjid: 10610,
          itcid: 10632,
          itsid: itsid
        },
        success: (res) => {
          console.log('交易码接口响应：', res.data);

          // 解析接口响应
          if (res.data.code === "1") {
            // 检查数据结构完整性
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

  // 修改后的验证方法
  verifyCode() {
    const that = this;
    const {
      codeValue
    } = this.data;

    if (!/^\d{6}$/.test(codeValue)) {
      wx.showToast({
        title: '请输入6位数字交易码',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({
      title: '验证中...',
      mask: true
    });

    this.getServerTransactionCode()
      .then(serverCode => {
        wx.hideLoading();
        const inputCode = String(codeValue);
        const currentServerCode = String(serverCode);
        // 安全对比（防止时序攻击）
        const safeCompare = (a, b) => {
          let mismatch = 0;
          const length = Math.max(a.length, b.length);
          for (let i = 0; i < length; ++i) {
            mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
          }
          return mismatch === 0;
        };

        if (safeCompare(inputCode, currentServerCode)) {
          this.closeDialog();
          that.executePayment(); // 验证成功后调用支付接口
        } else {
          wx.showToast({
            title: '交易码不匹配',
            icon: 'none'
          });
        }
      })
      .catch(err => {
        wx.hideLoading();
        console.error('验证失败:', err);
        wx.showToast({
          title: err.message || '验证失败',
          icon: 'none',
          duration: 2000
        });
      });
  },

  // 执行支付
  executePayment() {
    const that = this;

    const itsid = wx.getStorageSync('itsid');
    const quantity = FIXED_RECHARGE_QUANTITY;
    const allPrice =  this.data.pricePerUnit * quantity
    const AMT1 = (allPrice * 0.6).toFixed(2);
    const AMT2 = (allPrice * 0.4).toFixed(2);
    const MCODE = this.data.MCODE
    const AUrl = app.globalData.AUrl
    wx.request({
      url: `${app.globalData.backUrl}phone.aspx?mbid=10633&ituid=${app.globalData.ituid}&itsid=${itsid}`, //股东升级
      data: {
        MCODE: MCODE,
        OPID: '1205',
        UNITID: '1',
        invite: '',
        NUM: quantity,
        USERID: that.data.userid, // 传递userid
        NOTE: ' ',
        // AMT: that.data.pricePerUnit, // 将单份总金额传递给接口
        AMT: AMT1,//传的是金额的数目，
        AMT2, // 新增AMT2参数，代表电子券或咖啡券的金额
        type: that.data.selectedCouponType,
        // RURL: '/subPackages/package/pages/recharge-payResult/recharge-payResult'
      },
      method: 'POST',
      header: {
        'content-type': 'application/json' // 设置请求的header，通常用于指定请求数据的格式
      },
      success: (res) => {
        console.log("mbid=10602:", res);
        const successDuration = 2000;
        // wx.navigateTo({
        //   url: `/subPackages/package/pages/recharge-pay/recharge-pay?return_url=${res.data.rurl}&orderid=${res.data.orderid}&terminal=${res.data.terminal_sn}&amt=${res.data.AMT}&sign=${res.data.sign}`,
        // })

        wx.showToast({
          title: '升级成功',
          duration: successDuration
        });
        wx.request({
          url: `${AUrl}/jy/go/we.aspx?ituid=106&itjid=10603&itcid=10603&itsid=${itsid}`,
          method: 'GET',
          success: (res) => {
            that.setData({
              money: res.data.money || '0',
              score: res.data.score || '0',
              dianzi: res.data.dianzi || '0',
            });
          },
          fail: (error) => {
            console.error('获取数据失败', error);
          }
        });
        // 发起微信支付
        setTimeout(() => {
          wx.switchTab({
            url: '/pages/my/my',
          });
        }, successDuration);
        // wx.requestPayment({
        //   "timeStamp": res.data.timeStamp, // 时间戳
        //   "nonceStr": res.data.nonceStr, // 随机字符串
        //   "package": res.data.package, // 统一下单接口返回的prepay_id参数值，格式为prepay_id=***
        //   "signType": res.data.signType, // 签名算法，应与后台下单时的值一致
        //   "paySign": res.data.paySign, // 签名，具体见微信支付文档
        //   success: function (res) {
        //     wx.showToast({
        //       title: '支付成功',
        //       duration: 2000
        //     });
        //     setTimeout(() => {
        //       that.setData({
        //         visible: false
        //       });
        //     }, 2000);
        //   },
        //   fail: function (err) {
        //     console.log(err.errMsg);
        //     console.log("支付失败");
        //     that.setData({
        //       onclick: false
        //     });
        //     app.globalData.userInfo = true;
        //     that.setData({
        //       localVar: app.globalData.userInfo
        //     });
        //   }
        // });
      },
      fail: (err) => {
        console.error('支付接口调用失败:', err);
        wx.showToast({
          title: '支付失败，请重试',
          icon: 'none'
        });
      }
    });
  },

  // 其他方法保持不变
  onDecrease: function () {
    this.updatePaymentAmounts(FIXED_RECHARGE_QUANTITY);
  },

  onIncrease: function () {
    this.updatePaymentAmounts(FIXED_RECHARGE_QUANTITY);
    wx.showToast({
      title: '一次只能购买一份噢',
      icon: 'none'
    });
  },
  onRecharge: function () {
    if (!this.data.selectedCouponType) {
      wx.showToast({
        title: '请选择支付方式',
        icon: 'none'
      });
      return;
    }
    if (!this.checkUpgradeBalance()) return;
    this.showCodeDialog(); // 先显示交易码弹窗
  },
  // 专用升级余额检查方法
  checkUpgradeBalance() {
    const cashNeeded = parseFloat(this.data.showMoney);
    const couponNeeded = parseFloat(this.data.showQuan);
    const currentCash = parseFloat(this.data.money);
    const couponMeta = this.getSelectedCouponMeta();

    // 现金检查
    if (currentCash < cashNeeded) {
      wx.showToast({
        title: `升级金额不足`,
        icon: 'none'
      });
      return false;
    }

    // 消费券检查
    if (couponMeta.balance < couponNeeded) {
      wx.showToast({
        title: `${couponMeta.label}不足`,
        icon: 'none'
      });
      return false;
    }

    return true;
  },
});
