const app = getApp();
Page({
  data: {
    inputBoxes: ["", "", "", "", "", ""], // 六个空的输入框
    testFocus: false, // 隐藏输入框聚焦
    codeValue: '', // 发送请求携带的六位数字
  },

  // 获取焦点
  handleGetFocus() {
    this.setData({
      testFocus: true
    })
  },

  handleNotFocus() {
    this.setData({
      testFocus: false
    })
  },

  // 展示用户输入的数字
  handleTestInput(e) {
    const value = e.detail.value
    const tempList = this.data.inputBoxes
    for (let i = 0; i < 6; i++) {
      tempList[i] = value[i] ? value[i] : ''
    }
    this.setData({
      inputBoxes: tempList,
      codeValue: value
    })
  },
  // 页面加载时获取 itsid 和 userid
  // 页面加载时获取 itsid 和 userid
  onLoad: function () {
    const itsid = wx.getStorageSync('itsid');
    const userid = wx.getStorageSync('userid');

    if (itsid) {
      this.setData({
        itsid: itsid,
        userid: userid
      });
    } else {
      console.error('itsid 未定义或获取失败');
      wx.showToast({
        title: '未登录或会话已过期',
        icon: 'none'
      });
      wx.navigateTo({
        url: '/subPackages/user/pages/login/login',
      });
    }
  },

  getServerTransactionCode() {
    return new Promise((resolve, reject) => {
      // const userid = wx.getStorageSync('userid');
      const itsid = wx.getStorageSync('itsid') || app.globalData.itsid || '';// ✅ 修复1：和上方保持一致，缓存+全局双兜底，防止丢失
      wx.request({
        url: `${app.globalData. AUrl}/jy/go/we.aspx`,
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
            const serverCode = res.data.result?.list?.[0]?.transactionCode;
            if (serverCode && serverCode.length === 6) {
              resolve(serverCode);
            } else {
              reject(new Error('交易码错误'));
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
  verifyPassword() {
    const {
      codeValue
    } = this.data; // 用户输入的密码
    this.getServerTransactionCode()
      .then(serverCode => {
        if (codeValue === serverCode) {
          wx.showToast({
            title: '验证成功',
            icon: 'success'
          });
          // 跳转到修改密码页面
          wx.navigateTo({
            url: '/subPackages/package/pages/password/password'
          });
        } else {
          wx.showToast({
            title: '密码验证失败',
            icon: 'none'
          });
        }
      })
      .catch(err => {
        wx.showToast({
          title: err.message,
          icon: 'none'
        });
      });
  },
  confirmUpgrade() {
    this.verifyPassword();
  },
  onReady() {},

  onShow() {},

  onHide() {},

  onUnload() {},

  onPullDownRefresh() {},

  onReachBottom() {},

  onShareAppMessage() {}
});