// subPackages/package/pages/qiehuan/qiehuan.js
const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    AUrl: app.globalData.AUrl,
    list: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {

  },

  handleLogin(e) {
    console.log(e.currentTarget.dataset.email);
    const email = e.currentTarget.dataset.email
    const itsid = wx.getStorageSync('itsid')
    wx.showModal({
      title: '账号切换',
      content: `确定以${email}登录吗？`,
      complete: (res) => {
        if (res.cancel) {
          
        }
        if (res.confirm) {
          wx.request({
            url: `${app.globalData.backUrl}phone.aspx?mbid=10631&ituid=106&itsid=${itsid}`,
            method: 'POST',
            data: {
              email
            },
            success(res) {
              console.log(res)
              wx.setStorageSync('itsid', res.data.itsid)
              wx.setStorageSync('userid', res.data.userid)
              app.globalData.itsid = res.data.itsid;
              app.globalData.userid = res.data.userid; 
              wx.switchTab({
                url: '/pages/home/home',
              }) 
            }
          })
        }
      }
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    let that = this
    const itsid = wx.getStorageSync('itsid')
    wx.request({
      url: `${app.globalData.AUrl}/jy/go/we.aspx?ituid=106&itjid=10642&itcid=10642&itsid=${itsid}`,
      method: 'GET',
      success(res) {
        console.log(res)
        that.setData({
          list: res.data.data
        })
      }
    })
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