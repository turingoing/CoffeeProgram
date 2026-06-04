// subPackages/package/pages/huiyuanrenshu/huiyuanrenshu.js
const app = getApp();

Page({
  data: {
    familyMembers: [],
    usernameen: '',
    usertitle: ''
  },

  onLoad(options) {
    const userid = wx.getStorageSync('userid');
    this.fetchren(userid);
  },

  fetchren(userid) {
    const that = this;
    wx.request({
      url: `${app.globalData.AUrl}/jy/go/we.aspx?ituid=106&itjid=10610&itcid=10645&userid=${userid}`,
      method: 'GET',
      success(res) {
        if (res.statusCode === 200 && res.data && res.data.code === "1" && res.data.msg === "操作成功") {
          const processedMembers = res.data.result.list.map(member => {
            // 电话号正则表达式
            const regex = /^1[3-9]\d{9}$/;
            let maskedUsername = '';

            // if (member.usernameen && member.usernameen.length == 11 && regex.test(member.usernameen)) {
            if (member.usernameen && regex.test(member.usernameen)) {
              maskedUsername = member.usernameen.substring(0, 3) + '****' + member.usernameen.substring(7);
            } else {
              maskedUsername = member.usernameen
            }
            return {
              ...member,
              maskedUsernameen: maskedUsername
            };
          });
          that.setData({
            familyMembers: processedMembers
          });
        } else {
          wx.showToast({
            title: '获取数据失败',
            icon: 'none'
          });
        }
      },
      fail(err) {
        console.error('请求失败', err);
        wx.showToast({
          title: '请求失败',
          icon: 'none'
        });
      }
    });
  }
})