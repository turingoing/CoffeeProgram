const app = getApp();

Page({
  data: {
    code: '' // 用于存储用户输入的推荐码
  },

  // 输入框绑定事件
  onInput(e) {
    this.setData({
      code: e.detail.value.trim() // 去除输入内容的前后空格
    });
  },

  // 点击确认按钮
  confirmCode() {
    const {
      code
    } = this.data;
    const itsid = wx.getStorageSync('itsid');
    const userid = wx.getStorageSync('userid');

    if (!code) {
      wx.showToast({
        title: '请输入推荐码',
        icon: 'none'
      });
      return;
    }

    if (!itsid) {
      wx.showToast({
        title: '未登录或会话已过期，请重新登录',
        icon: 'none'
      });
      return;
    }

    // 验证推荐码的接口
    wx.request({
      url: `${app.globalData.AUrl}/jy/go/we.aspx?ituid=106&itjid=10610&itcid=10640&keyvalue=${code}`,
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200 && res.data.result.list && res.data.result.list.length > 0) {
          // 推荐码有效，存储推荐码
          // app.globalData.invite = code;
          // wx.setStorageSync('invite', code);

          // 调用第二个接口提交推荐码
          this.submitInviteCode(code, userid, itsid);
        } else {
          wx.showToast({
            title: '推荐码无效，请检查输入是否正确',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        console.error('验证推荐码失败', err);
        wx.showToast({
          title: '验证推荐码失败，请稍后再试',
          icon: 'none'
        });
      }
    });
  },

  // 提交推荐码到后端
  submitInviteCode(invite, userid, itsid) {
    wx.request({
      url: `${app.globalData.AUrl}/jy/go/phone.aspx?mbid=10615&ituid=106&itsid=${itsid}`,
      method: 'POST',
      data: {
        invite: invite,
        userid: userid
      },
      header: {
        'content-type': 'application/json' // 如果需要，可以设置请求头
      },
      success: (res) => {
        if (res.statusCode === 200) {
          wx.showToast({
            title: '提交成功',
            icon: 'success'
          });
          // 跳转到下一个页面
          wx.navigateTo({
            url: '/subPackages/package/pages/inputTransactionCode/inputTransactionCode'
          });
        } else {
          wx.showToast({
            title: '提交失败，请稍后再试',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        console.error('提交推荐码失败', err);
        wx.showToast({
          title: '提交推荐码失败，请检查网络',
          icon: 'none'
        });
      }
    });
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 可以在这里初始化一些数据或检查用户登录状态
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {},

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {},

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {},

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {},

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {},

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {},

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {}
});