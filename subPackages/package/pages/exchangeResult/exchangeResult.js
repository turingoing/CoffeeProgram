const app = getApp();

Page({
  data: {
    selectedAddress: {
      address: '',
      phone: '',
      username: '',
    },
    selectedItemName: '',
    selectedItemPrice: '',
    itemId: '',
    tupianUrl: app.globalData.tupianUrl,
    currentImage: '',
    score: 0, // 初始化 score 为 0
    pointsAmount: 0,
    showCodeDialog: false, // 控制弹窗显示
    inputBoxes: ["", "", "", "", "", ""], // 六个输入框
    codeValue: '', // 完整交易码
    testFocus: false, // 隐藏输入框聚焦
    AUrl: app.globalData.AUrl,
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

  handleGetFocus() {
    this.setData({
      testFocus: true
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
      const userid = wx.getStorageSync('userid');

      wx.request({
        url: `${app.globalData. AUrl}/jy/go/we.aspx`, // 请确保链接合法且可访问
        method: 'GET',
        data: {
          ituid: 106,
          itjid: 10610,
          itcid: 10632,
          userid: userid
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
  onzhifu() {
    this.showCodeDialog();
  },

  // 新增支付提交方法
  submitPayment() {
    const app = getApp();
    const that = this;
    const {
      itemId,
      score,
      pointsAmount
    } = this.data;

    const itsid = app.globalData.itsid || '';
    console.log('准备提交的 MCODE:', itemId);

    if (!itsid) {
      wx.showToast({
        title: '支付失败，缺少 itsid',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    // 判断积分是否足够
    if (score >= pointsAmount) {
      wx.showLoading({
        title: '正在支付...',
      });

      wx.request({
        url: `${app.globalData.backUrl}phone.aspx?mbid=123&ituid=${app.globalData.ituid}&itsid=${itsid}`,
        method: 'POST',
        data: {
          MCODE: itemId,
          OPID: '1202',
          UNITID: '1',
          NUM: 1,
          USERID: '0',
          NOTE: ' ',
          AMT: '0',
          SCORE: pointsAmount
        },
        header: {
          'content-type': 'application/json'
        },
        success: (res) => {
          wx.hideLoading();
          if (res.data.code === "0") {
            const newScore = that.data.score - pointsAmount;
            wx.showToast({
              title: '支付成功',
              icon: 'success',
              duration: 2000
            });
            that.setData({
              score: newScore
            });
          } else {
            wx.showToast({
              title: res.data.msg || '支付失败',
              icon: 'none',
              duration: 2000
            });
          }
        },
        fail: (err) => {
          wx.hideLoading();
          wx.showToast({
            title: '网络连接失败',
            icon: 'none',
            duration: 2000
          });
          console.error('支付接口调用失败', err);
        }
      });
    } else {
      wx.showToast({
        title: '积分不足，无法支付',
        icon: 'none',
        duration: 2000
      });
    }
  },


  verifyCode() {
    const that = this;
    const {
      codeValue
    } = this.data;



    this.getServerTransactionCode()
      .then(serverCode => {
        const safeCompare = (a, b) => {
          let mismatch = 0;
          const length = Math.max(a.length, b.length);
          for (let i = 0; i < length; ++i) {
            mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
          }
          return mismatch === 0;
        };

        if (safeCompare(codeValue, serverCode)) {
          that.closeDialog();
          that.submitPayment(); // 验证成功后调用支付方法
        } else {
          wx.showToast({
            title: '交易码不匹配',
            icon: 'none'
          });
        }
      })
  },


  onLoad: function (options) {
    const app = getApp(); // 获取全局 App 实例
    console.log('Received options:', options);

    this.setData({
      itemId: options.itemid, // ✅ 直接使用 itemid 参数
      selectedItemName: decodeURIComponent(options.name),
      selectedItemPrice: decodeURIComponent(options.price || '0'),
      currentImage: decodeURIComponent(options.tupian)
    });
    this.setData({
      pointsAmount: parseFloat(this.data.selectedItemPrice)
    });

    console.log('pointsAmount:', this.data.pointsAmount);

    if (options.addressDesc && options.phone) {
      this.setData({
        selectedAddress: {
          address: decodeURIComponent(options.addressDesc),
          phone: decodeURIComponent(options.phone),
          username: decodeURIComponent(options.username),
        }
      });
    }

    // 尝试从接口获取 score
    this.fetchScore();

    this.setData({
      pointsAmount: parseFloat(selectedItemPrice) // 假设需要扣除的积分等于商品价格
    });
  },

  onShow: function () {
    const addressDesc = app.globalData.addressDesc;
    const phone = app.globalData.phone;
    const usernmae = app.globalData.username;
    console.log('Reading globalData:', app.globalData);

    if (addressDesc) {
      this.setData({
        selectedAddress: {
          address: addressDesc,
          phone: phone,
          username: usernmae,
        }
      });
    } else {
      console.error('Global data addressDesc is missing');
    }
  },

  onResultTap(e) {
    const addressDesc = e.currentTarget.dataset.addressdesc; // 使用 addressDesc
    const phone = e.currentTarget.dataset.phone;
    wx.navigateTo({
      url: `/subPackages/package/pages/chooseLocation/chooseLocation?type=exchangeResult&addressDesc=${encodeURIComponent(addressDesc)}&phone=${encodeURIComponent(phone)}`
    });
  },

  // onzhifu() {
  //   this.showCodeDialog(); // 改为先显示交易码弹窗

  //   const that = this;
  //   const {
  //     itemId,
  //     score,
  //     pointsAmount
  //   } = this.data;

  //   const itsid = app.globalData.itsid || '';
  //   console.log('准备提交的 MCODE:', itemId);
  //   if (!itsid) {
  //     console.error('itsid is missing in app.globalData');
  //     wx.showToast({
  //       title: '支付失败，缺少 itsid',
  //       icon: 'none',
  //       duration: 2000
  //     });
  //     return;
  //   }

  //   // 判断积分是否足够
  //   if (score >= pointsAmount) {
  //     wx.showLoading({
  //       title: '正在支付...',
  //     });

  //     wx.request({
  //       url: `${app.globalData.backUrl}phone.aspx?mbid=123&ituid=${app.globalData.ituid}&itsid=${itsid}`, // 确保 itsid 已定义
  //       method: 'POST',
  //       data: {
  //         MCODE: itemId,
  //         OPID: '1202',
  //         UNITID: '1',
  //         NUM: 1, // 假设数量为1
  //         USERID: '0',
  //         NOTE: ' ',
  //         AMT: '0',
  //         SCORE: pointsAmount // 传递需要扣除的积分
  //       },
  //       header: {
  //         'content-type': 'application/json'
  //       },
  //       success: (res) => {
  //         wx.hideLoading();

  //         if (res.data.code === "0") {
  //           const newScore = that.data.score - that.data.pointsAmount;
  //           wx.showToast({
  //             title: '支付成功',
  //             icon: 'success',
  //             duration: 2000
  //           });

  //           // 更新用户积分
  //           that.setData({
  //             score: newScore
  //           });
  //         } else {
  //           wx.showToast({
  //             title: '支付失败',
  //             icon: 'none',
  //             duration: 2000
  //           });
  //         }
  //       },
  //       fail: (err) => {
  //         wx.hideLoading();
  //         wx.showToast({
  //           title: '支付失败',
  //           icon: 'none',
  //           duration: 2000
  //         });
  //         console.error('支付接口调用失败', err);
  //       }
  //     });
  //   } else {
  //     wx.showToast({
  //       title: '积分不足，无法支付',
  //       icon: 'none',
  //       duration: 2000
  //     });
  //   }
  // },

  // 新增方法：从接口获取 score
  fetchScore() {
    const app = getApp();
    const itsid = app.globalData.itsid || ''; // 使用默认值或根据你的需求调整

    if (!itsid) {
      console.error('itsid is missing in app.globalData');
      return;
    }

    wx.request({
      url: `${app.globalData. AUrl}/jy/go/we.aspx?ituid=106&itjid=10603&itcid=10603&itsid=${itsid}`,
      method: 'GET',
      success: (res) => {
        console.log('Fetch score response:', res.data);

        // 直接从接口返回的数据中获取 score
        const score = parseFloat(res.data.score);

        this.setData({
          score: score
        });
      },
      fail: (err) => {
        console.error('Fetch score request failed:', err);
        wx.showToast({
          title: '加载积分失败',
          icon: 'none',
          duration: 2000
        });
      }
    });
  },

  onReady: function () {
    // 页面初次渲染完成时触发
  },

  onHide: function () {
    // 页面隐藏时触发
  },

  onPullDownRefresh: function () {
    // 监听用户下拉动作
    this.fetchScore(); // 下拉刷新时重新获取分数
    wx.stopPullDownRefresh(); // 停止下拉刷新
  },

  onReachBottom: function () {
    // 页面上拉触底事件的处理函数
  },

  onShareAppMessage: function () {
    // 用户点击右上角分享
  }
});