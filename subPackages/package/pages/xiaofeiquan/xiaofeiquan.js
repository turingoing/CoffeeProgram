const app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    tupianUrl: app.globalData.tupianUrl,
    isTransferPopupShow: false,
    transferPhone: '',
    phone: '',//对方手机号
    showCodeDialog: false, // 控制弹窗显示
    inputBoxes: ["", "", "", "", "", ""], // 六个输入框
    codeValue: '', // 完整交易码
    testFocus: false, // 隐藏输入框聚焦
    content: '',
    result: [],
    earningsList: [{
      date: '6月24日',
      amount: 0.01
    },
    {
      date: '6月23日',
      amount: 0.01
    },
      // 更多数据...
    ]

  },
  getEarningsData: function () {
    // 从服务器获取数据
    const earningsList = [{
      date: '6月24日',
      amount: 0.01
    },
    {
      date: '6月23日',
      amount: 0.01
    },
      // 更多数据...
    ];
    this.setData({
      earningsList
    });
  },
  onBackClick: function () {
    wx.switchTab({
      url: '/pages/my/my',
    })
  },

  // 显示交易码弹窗
  showCodeDialog() {
    // 确保转赠弹窗关闭
    this.setData({
      isTransferPopupShow: false,
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
      // const userid = wx.getStorageSync('userid');
      const itsid = wx.getStorageSync('itsid') || app.globalData.itsid || '';// ✅ 修复1：和上方保持一致，缓存+全局双兜底，防止丢失
      wx.request({
        url: `${app.globalData.AUrl}/jy/go/we.aspx`, // 确保链接正确
        method: 'GET',
        data: {
          ituid: 106,
          itjid: 10610,
          itcid: 10632,
          itsid
        },
        success: (res) => {
          console.log('交易码接口响应：', res.data); // 打印接口返回的数据

          // 检查接口返回数据
          if (res.data.code === "1") { // 确保 code 是字符串
            if (res.data.result && res.data.result.list && res.data.result.list[0] && res.data.result.list[0].transactionCode) {
              const serverCode = res.data.result.list[0].transactionCode;
              console.log('服务器返回的交易码：', serverCode); // 打印服务器返回的交易码
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
  verifyCode() {
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
        console.log('服务器返回的交易码：', serverCode); // 打印服务器返回的交易码
        console.log('用户输入的交易码：', codeValue); // 打印用户输入的交易码

        // 使用安全比较
        if (codeValue === serverCode) {
          this.closeDialog(); // 关闭交易码弹窗
          this.doTransfer(); // 执行转赠请求
        } else {
          wx.showToast({
            title: '交易码不匹配',
            icon: 'none'
          });
        }
      })
      .catch(err => {
        console.error('验证失败:', err);
        wx.showToast({
          title: err.message || '验证失败',
          icon: 'none',
          duration: 2000
        });
      })
      .finally(() => {
        wx.hideLoading();
      });
  },

  onLoad: function () {
    this.getcontentData()
    this.getJiluList()

  },

  getJiluList() {
    let that = this
    wx.request({
      url: `${app.globalData.AUrl}/jy/go/we.aspx?ituid=106&itjid=0902&itcid=10633&userid=${app.globalData.userid}`,
      success: (res) => {
        console.log(res);
        // 对返回的手机号进行格式化
        const formattedList = res.data.result.map(item => {
          // 隐藏 give 字段的中间四位
          const formattedGive = hideMiddleFour(item.give);
          // 隐藏 userid 字段的中间四位
          const formattedUserid = hideMiddleFour(item.userid);
          return {
            ...item,
            give: formattedGive,
            userid: formattedUserid
          };
        });
        that.setData({
          List: formattedList
        });
      },
      fail: (err) => {
        console.error('Request failed:', err);
      }
    });

    // 辅助函数：隐藏手机号中间四位
    function hideMiddleFour(phone) {
      // 验证手机号是否合法（中国大陆手机号）
      if (/^1[3-9]\d{9}$/.test(phone)) {
        return phone.slice(0, 3) + '****' + phone.slice(7);
      }
      // 如果手机号不合法，直接返回原值
      return phone;
    }
  },

  onzengclik: function () {
    this.setData({
      isTransferPopupShow: true
    });
  },
  onConfirmTransfer: function () {
    let that = this
    if (!this.data.transferPhone || !this.data.transferScore || !this.data.phone) {
      wx.showToast({
        title: '请填写完整信息',
        icon: 'none'
      });
      return;
    }
    if (!this.data.isTransferConfirmed) {
      wx.showModal({
        title: '转赠确认',
        content: '一旦转赠无法返还，是否继续？',
        success: (res) => {
          if (res.confirm) {
            if (Number(that.data.transferScore <= 0)) {
              wx.showToast({
                title: '数量不能<=0',
                icon: 'none',
                duration: 2000
              });
              return
            }
            if (Number(that.data.content) < Number(that.data.transferScore)) {
              wx.showToast({
                title: '消费券不足',
                icon: 'none',
                duration: 2000
              });
              that.setData({
                isTransferConfirmed: false
              })
              return
            }
            that.showCodeDialog();
          }
        }
      });
    } else {
      this.showCodeDialog();
    }
  },

  // 执行转赠逻辑
  doTransfer: function () {
    const itsid = wx.getStorageSync('itsid');
    const {
      transferPhone,
      transferScore,
      phone
    } = this.data;
    const userid = app.globalData.userid;
    let that = this
    wx.request({
      url: `${app.globalData.backUrl}phone.aspx?mbid=10612&ituid=${app.globalData.ituid}&itsid=${itsid}`,
      method: 'POST',
      data: {
        userid: userid,
        randomId: transferPhone,
        content: transferScore,
        phone: phone
      },
      success: (res) => {
        console.log('转赠完整响应：', res);
        if (res.data.code === '0') {
          wx.showToast({
            title: res.data.desc,
            icon: 'success',
            duration: 2000
          });
          //转赠完成---->清空输入
          that.setData({
            isTransferPopupShow: false,
            transferPhone: '',
            transferScore: '',
            phone: '',
            isTransferConfirmed: false
          });
          that.getcontentData()
          that.getJiluList()
        } else {
          wx.showToast({
            title: res.data.desc,
            icon: 'none',
            duration: 2000
          });
        }
      },
      fail: (err) => {
        wx.showToast({
          title: '转赠失败，请检查网络或联系管理员',
          icon: 'none'
        });
        console.error('转赠失败', err);
        this.setData({
          isTransferConfirmed: false
        });
      }
    });
  },


  // 新增积分获取方法
  getcontentData: function () {
    const itsid = wx.getStorageSync('itsid');
    const that = this;

    wx.request({
      url: `${app.globalData.AUrl}/jy/go/we.aspx?ituid=106&itjid=10603&itcid=10603&itsid=${itsid}`,
      method: 'GET',
      success: (res) => {
        console.log('积分接口返回的数据：', res.data); // 打印接口返回的数据
        if (res.statusCode === 200 && res.data && res.data.content) {
          console.log("积分数据：", res.data.score);
          that.setData({
            content: res.data.score
          });
        } else {
          wx.showToast({
            title: '获取积分失败，请稍后重试',
            icon: 'none'
          });
          console.error('积分接口返回数据不符合预期', res.data);
        }
      },
      fail: (error) => {
        wx.showToast({
          title: '网络请求失败，请检查网络',
          icon: 'none'
        });
        console.error('积分接口失败', error);
      }
    });
  },
  // 输入对方ID的事件处理
  onTransferPhoneInput: function (e) {
    this.setData({
      transferPhone: e.detail.value
    });
  },

  // 输入对方电话号事件处理
  onPhoneNumber: function (e) {
    this.setData({
      phone: e.detail.value
    });
  },

  // 输入转赠数量的事件处理
  onTransferScoreInput: function (e) {
    this.setData({
      transferScore: e.detail.value
    });
  },

  // 取消转赠按钮点击事件
  onCancelTransfer: function () {
    this.setData({
      isTransferPopupShow: false, // 关闭转赠弹窗
      isTransferConfirmed: false // 重置确认状态
    });

  },
  /**
   * 生命周期函数--监听页面加载
   */

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})