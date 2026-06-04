const app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    isTransferPopupShow: false,
    transferScore: '', // 划转积分数量
    couponAmount: '', // 消费券金额
    score: '',
    showCodeDialog: false, // 控制弹窗显示
    inputBoxes: ["", "", "", "", "", ""], // 六个输入框
    codeValue: '', // 完整交易码
    testFocus: false, // 隐藏输入框聚焦
    result: [],
    progressPercentage: 0, // 存储接口返回的进度值
    dailyReturn: {
      date: '',
      returnscore: ''
    } // 新增每日返还数据
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
      // const userid = wx.getStorageSync('userid');
      const itsid = wx.getStorageSync('itsid') || app.globalData.itsid || '';// ✅ 修复1：和上方保持一致，缓存+全局双兜底，防止丢失

      wx.request({
        url: `${app.globalData. AUrl}/jy/go/we.aspx`, // 请确保链接合法且可访问
        method: 'GET',
        data: {
          ituid: 106,
          itjid: 10610,
          itcid: 10632,
          itsid
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
        const safeCompare = (a, b) => {
          let mismatch = 0;
          const length = Math.max(a.length, b.length);
          for (let i = 0; i < length; ++i) {
            mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
          }
          return mismatch === 0;
        };

        if (safeCompare(codeValue, serverCode)) {
          // 交易码验证通过，发送划转请求
          that.sendTransferRequest();
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

  onBackClick: function () {
    wx.switchTab({
      url: '/pages/my/my',
    });
  },
  onLoad: function () {
    const itsid = wx.getStorageSync('itsid');
    const that = this;
    const userid = app.globalData.userid; // 确保已经获取userid

    wx.request({
      url: `${app.globalData. AUrl}/jy/go/we.aspx?ituid=106&itjid=10603&itcid=10603&itsid=${itsid}`, // 确保链接正确
      method: 'GET',
      success: (res) => {
        that.fetchProgressData(userid);
        this.fetchDailyReturnData(userid);
        console.log('接口返回的数据：', res.data); // 打印接口返回的数据
        if (res.statusCode === 200 && res.data && res.data.userid) {
          app.globalData.userid = res.data.userid;
          console.log('全局变量 userid：', app.globalData.userid); // 确认是否正确存储
          that.setData({
            score: res.data.score
          });
        } else {
          wx.showToast({
            title: '获取用户ID失败，请检查网络或联系管理员',
            icon: 'none'
          });
          console.error('接口返回数据不符合预期', res.data);
        }
      },
      fail: (error) => {
        wx.showToast({
          title: '获取数据失败，请检查网络或联系管理员',
          icon: 'none'
        });
        console.error('获取数据失败', error);
      }
    });
  },
  fetchDailyReturnData: function (userid) {
    const that = this;
    wx.request({
      url: `${app.globalData. AUrl}/jy/go/we.aspx?ituid=106&itjid=10610&itcid=10630&userid=${userid}`,
      method: 'GET',
      success: (res) => {
        console.log('完整接口响应：', res);
        if (res.statusCode === 200 && res.data && res.data.result) {
          const rawData = res.data.result.list || [];
          const processedData = rawData.map(item => ({
            date: this.formatDate(item.date), // 格式化日期
            returnscore: parseFloat(item.returnscore).toFixed(2) // 保留两位小数
          }));

          that.setData({
            dailyReturnList: processedData
          });
        } else {
          console.warn('接口返回数据结构异常', res.data);
        }
      },
      fail: (err) => {
        console.error('请求失败', err);
        wx.showToast({
          title: '数据加载失败',
          icon: 'none'
        });
      }
    });
  },

  // 日期格式化方法
  formatDate: function (dateString) {
    if (!dateString) return '';
    // 处理多种可能的日期格式
    try {
      const datePart = dateString.split(' ')[0];
      const [year, month, day] = datePart.split(/[/-]/);
      return `${year}/${month.padStart(2, '0')}/${day.padStart(2, '0')}`;
    } catch (e) {
      return dateString;
    }
  },
  onzengclik: function () {
    this.setData({
      isTransferPopupShow: true
    });
  },
  onConfirmTransfer: function () {
    const {
      transferScore,
      score
    } = this.data;
    const transferScoreNum = parseFloat(transferScore);
    const scoreNum = parseFloat(score);

    if (!transferScore || transferScoreNum <= 0) {
      wx.showToast({
        title: '请输入有效数量',
        icon: 'none'
      });
      return;
    }

    if (transferScoreNum > scoreNum) {
      wx.showToast({
        title: '积分不足',
        icon: 'none'
      });
      return;
    }

    // 隐藏划转弹窗，显示交易码弹窗
    this.setData({
      isTransferPopupShow: false,
      showCodeDialog: true
    });
  },

  // 如果划转积分小于等于当前积分，则执行划转操作
  sendTransferRequest: function () {
    const {
      transferScore
    } = this.data;
    const itsid = wx.getStorageSync('itsid');
    const userid = app.globalData.userid;

    wx.request({
      url: `${app.globalData.backUrl}phone.aspx?mbid=10608&ituid=${app.globalData.ituid}&itsid=${itsid}`,
      method: 'POST',
      data: {
        userid: userid,
        score: transferScore
      },
      success: (res) => {
        console.log(res);
        if (res.statusCode === 200 && (!res.data || res.data === "")) {
          wx.showToast({
            title: '划转成功',
            icon: 'success',
            duration: 1500
          });
          setTimeout(() => {
            this.setData({
              showCodeDialog: false,
              codeValue: '',
              inputBoxes: ["", "", "", "", "", ""],
              transferScore: ''
            });
          }, 1500);
          this.getscoreData();
        } else {
          wx.showToast({
            title: `划转失败：${res.data.desc || '未知错误'}`,
            icon: 'none'
          });
        }
      },
      fail: (error) => {
        console.error('划转请求失败', error);
        wx.showToast({
          title: '划转请求失败，请检查网络或联系管理员',
          icon: 'none'
        });
      }
    });
  },
  getscoreData: function () {
    const itsid = wx.getStorageSync('itsid');
    const that = this;

    wx.request({
      url: `${app.globalData. AUrl}/jy/go/we.aspx?ituid=106&itjid=10603&itcid=10603&itsid=${itsid}`,
      method: 'GET',
      success: (res) => {
        console.log('积分接口返回的数据：', res.data); // 打印接口返回的数据
        if (res.statusCode === 200 && res.data && res.data.content) {
          console.log("积分数据：", res.data.content);
          that.setData({
            score: res.data.score
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
  onCancelTransfer: function () {
    this.setData({
      isTransferPopupShow: false,
    });
  },
  onTransferScoreInput: function (e) {
    const transferScore = e.detail.value;
    this.setData({
      transferScore: transferScore,
      couponAmount: transferScore // 1:1划转
    });
  },

  fetchProgressData: function (userid) {
    const that = this;
    wx.request({
      url: `${app.globalData. AUrl}/jy/go/we.aspx?ituid=106&itjid=10610&itcid=10624&userid=${userid}`,
      method: 'GET',
      success(res) {
        if (res.statusCode === 200 && res.data) {
          // 假设接口返回格式：{ "progress": 80 }
          let progress = parseInt(res.data.progress) || 0;
          that.setData({
            progressPercentage: progress
          });
        }
      },
      fail(err) {
        console.error('获取进度数据失败', err);
        wx.showToast({
          title: '获取进度失败',
          icon: 'none'
        });
      }
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