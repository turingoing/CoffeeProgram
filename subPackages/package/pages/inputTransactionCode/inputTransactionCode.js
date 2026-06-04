const app = getApp();
Page({
  data: {
    inputBoxes: ["", "", "", "", "", ""], // 六个空的输入框
    testFocus: false, // 隐藏输入框聚焦
    codeValue: '', // 当前输入的六位数字
    originalCode: '', // 保存第一次输入的交易码
    confirmStep: 0, // 确认步骤状态 (0: 初始, 1: 输入确认码, 2: 验证成功)
    showConfirmInput: false, // 是否显示确认输入框
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
    const value = e.detail.value;
    const tempList = this.data.inputBoxes.slice(); // 克隆数组，避免直接修改引用
    for (let i = 0; i < 6; i++) {
      tempList[i] = value[i] ? value[i] : '';
    }

    // 仅在首次输入时重置 confirmStep
    let newConfirmStep = this.data.confirmStep;
    if (this.data.confirmStep === 0) {
      newConfirmStep = 0;
    }

    this.setData({
      inputBoxes: tempList,
      codeValue: value,
      confirmStep: newConfirmStep
    });
  },


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

  // 确认升级并发送请求
  confirmUpgrade() {
    const {
      codeValue,
      originalCode,
      confirmStep
    } = this.data;

    if (!/^\d{6}$/.test(codeValue)) {
      wx.showToast({
        title: '请输入六位数字的交易码',
        icon: 'none'
      });
      return;
    }


    if (confirmStep === 0) {
      this.setData({
        confirmStep: 1,
        originalCode: codeValue,
        codeValue: '',
        inputBoxes: ["", "", "", "", "", ""],
        showConfirmInput: true,
        testFocus: true // 新增：自动聚焦
      });

      // 确保聚焦生效
      setTimeout(() => {
        this.setData({
          testFocus: true
        });
      }, 100);

      wx.showToast({
        title: '请再次输入交易码以确认',
        icon: 'none'
      });
    } else if (confirmStep === 1) {
      // 比较两次输入是否一致
      if (codeValue !== originalCode) {
        wx.showToast({
          title: '两次输入的交易码不一致',
          icon: 'none'
        });
        this.setData({
          codeValue: '',
          inputBoxes: ["", "", "", "", "", ""],
          testFocus: true // 自动聚焦输入框
        });
        setTimeout(() => {
          this.setData({
            testFocus: true
          });
        }, 100);
        return;
      }

      // 两次输入一致，进入验证成功状态
      this.setData({
        confirmStep: 2
      });

      // 提交交易码
      this.submitTransactionCode();
    }
  },
  submitTransactionCode() {
    const {
      originalCode,
      itsid,
      userid
    } = this.data;

    wx.request({
      url: `${app.globalData.backUrl}/phone.aspx?mbid=10611&ituid=${app.globalData.ituid}&itsid=${itsid}`,
      method: 'POST',
      data: {
        userid: userid,
        transactionCode: originalCode
      },
      success: (res) => {
        if (res.statusCode === 200) {
          wx.setStorageSync('hasTransactionCode', true);
          wx.showToast({
            title: '保存成功',
            icon: 'success'
          });

          wx.navigateTo({
            url: '/subPackages/package/pages/shareholder/shareholder'
          });
        } else {
          wx.showToast({
            title: '保存失败：' + (res.data.msg || '未知错误'),
            icon: 'none'
          });
        }
        // 根据需求，这里可以选择是否重置状态，
        // 或者只提示成功/失败后让用户自行选择是否重新输入确认。
        this.setData({
          confirmStep: 0 // 或者更新为其他状态以便用户继续操作
        });
      },
      fail: () => {
        wx.showToast({
          title: '网络请求错误',
          icon: 'none'
        });
        this.setData({
          confirmStep: 0
        });
      }
    });
  },


  onReady() {},

  onShow() {},

  onHide() {},

  onUnload() {},

  onPullDownRefresh() {},

  onReachBottom() {},

  onShareAppMessage() {}
});