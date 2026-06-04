// miniprogram/pages/punchCard/calendarCard/calendarCard.js
const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    id: null,
    name: "",
    icon: "",
    disabledFlag: true,
    totalDays: 0,
    monthDays: 0,
    habitInfo: {},
    currentDate: null,
    currentMonth: null,
    currentYear: null,
    nowYear: new Date().getFullYear(),
    nowMonth: new Date().getMonth(),
    nowDate: new Date().getDate(),
    punchCardDateArr: []

  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.setData({
      AUrl: app.globalData.AUrl,
    })
    // var nowYear = new Date().getFullYear()
    // var nowMonth = new Date().getMonth()

  },
  // 获取子组件的数据
  getObj(e) {
    console.log("获取子组件的数据", e);
    this.setData({
      currentDate: e.detail.currentDate,
      currentMonth: e.detail.currentMonth,
      currentYear: e.detail.currentYear,
    })
    this.getInfo(e.detail.currentYear, e.detail.currentMonth)
  },
  //获取当月购买数据
  getInfo(year, month) {
    let that = this;
    console.log(year);
    console.log(month);
    const storage = wx.getStorageSync('itsid')
    const itsid = storage
    console.log(itsid);
    wx.request({
      url: `${app.globalData.AUrl}/jy/go/we.aspx?ituid=106&itjid=10631&itcid=10631&key1=${year}&key2=${month}&itsid=${itsid}`,
      success: (res) => {
        console.log(res.data.d);
        that.setData({
          punchCardDateArr: res.data.d,
          monthDays: res.data.d.length
        })
      }
    })
  }
})