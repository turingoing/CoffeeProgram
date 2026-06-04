const app = getApp()

Component({
  /**
   * 组件的属性列表
   */

  properties: {
    currentPunchCardDate: {
      type: Array,
      value: []
    },
    currentYear: { // 当前页面显示的年
      type: Number,
      value: new Date().getFullYear()
    },
    currentMonth: { // 当前页面显示的年月
      type: Number,
      value: new Date().getMonth() + 1
    },
    nowYear: { // 当前年
      type: Number,
      value: new Date().getFullYear()
    },
    nowMonth: { // 当前月
      type: Number,
      value: new Date().getMonth() + 1
    },
    nowDate: { // 当前日
      type: Number,
      value: new Date().getDate()
    },

  },

  /**
   * 组件的初始数据
   */
  data: {
    currentMonthDateLen: 0, // 当月天数
    preMonthDateLen: 0, // 当月中，上月多余天数
    allArr: [], // 35个或42个日期数据=当前显示月所有日期数据+上月残余尾部日期+下月残余头部日期
    nowDate: null,
    selectedDate: null, //当前选择日期
    selectedMonth: null, //当前选择月
    selectedYear: null, //当前选择年
    AUrl: app.globalData.AUrl,
  },
  // 用observers监听properties的属性值
  observers: {
    'currentPunchCardDate': function (val) {
      console.log(val)

    }
  },
  // 在组件实例刚刚被创建时执行
  created() {},
  // 在组件实例进入页面节点树时执行
  ready() {
    this.getAllArr()
  },
  /**
   * 组件的方法列表
   */
  methods: {
    // 获取某年某月天数：下个月1日-本月1日 
    getDateLen(year, month) {
      let actualMonth = month - 1;
      let timeDistance = new Date(year, month) - new Date(year, actualMonth);
      return timeDistance / (1000 * 60 * 60 * 24);
    },
    // 获取某月1号是周几
    getFirstDateWeek(year, month) {
      // 0-6，0代表周天
      return new Date(year, month - 1, 1).getDay()
    },
    // 上月
    preMonth(year, month) {
      if (month == 1) {
        return {
          year: --year,
          month: 12
        }
      } else {
        return {
          year: year,
          month: --month
        }
      }
    },
    // 下月
    nextMonth(year, month) {
      if (month == 12) {
        return {
          year: ++year,
          month: 1
        }
      } else {
        return {
          year: year,
          month: ++month
        }
      }
    },
    // 获取当月数据，返回数组
    getCurrentArr() {
      let currentMonthDateLen = this.getDateLen(this.data.currentYear, this.data.currentMonth) // 获取当月天数
      let currentMonthDateArr = [] // 定义空数组
      if (currentMonthDateLen > 0) {
        for (let i = 1; i <= currentMonthDateLen; i++) {
          currentMonthDateArr.push({
            month: 'current', // 只是为了增加标识，区分上下月
            date: i
          })
        }
      }
      this.setData({
        currentMonthDateLen
      })
      return currentMonthDateArr
    },
    // 获取当月中，上月多余的日期数据，返回数组
    getPreArr() {
      let preMonthDateLen = this.getFirstDateWeek(this.data.currentYear, this.data.currentMonth) // 当月1号是周几 == 上月残余天数）
      console.log("preMonthDateLen=", preMonthDateLen);
      let preMonthDateArr = [] // 定义空数组
      if (preMonthDateLen > 0) {
        let {
          year,
          month
        } = this.preMonth(this.data.currentYear, this.data.currentMonth) // 获取上月 年、月
        let date = this.getDateLen(year, month) // 获取上月天数
        for (let i = 0; i < preMonthDateLen; i++) {
          preMonthDateArr.unshift({ // 尾部追加
            month: 'pre', // 只是为了增加标识，区分当、下月
            date: date
          })
          date--
        }
      }
      this.setData({
        preMonthDateLen
      })
      return preMonthDateArr
    },
    // 获取当月中，下月多余的日期数据，返回数组
    getNextArr() {
      let nextMonthDateLen = 35 - this.data.preMonthDateLen - this.data.currentMonthDateLen // 下月多余天数
      console.log(" nextMonthDateLen=", nextMonthDateLen);
      let nextMonthDateArr = [] // 定义空数组
      if (nextMonthDateLen > 0) {
        for (let i = 1; i <= nextMonthDateLen; i++) {
          nextMonthDateArr.push({
            month: 'next', // 只是为了增加标识，区分当、上月
            date: i
          })
        }
      } else if (nextMonthDateLen < 0) {
        for (let i = 1; i <= (7 + nextMonthDateLen); i++) {
          nextMonthDateArr.push({
            month: 'next', // 只是为了增加标识，区分当、上月
            date: i
          })
        }

      }
      return nextMonthDateArr
    },
    // 整合当月所有日期数据=上月残余+本月+下月多余
    getAllArr() {
      let preArr = this.getPreArr()
      let currentArr = this.getCurrentArr()
      let nextArr = this.getNextArr()
      let allArr = [...preArr, ...currentArr, ...nextArr]
      this.setData({
        allArr
      })
      let sendObj = {
        currentYear: this.data.currentYear,
        currentMonth: this.data.currentMonth,
        currentDate: this.data.selectedDate,
        allArr: this.data.allArr,
      }
      // 向父组件发送数据
      this.triggerEvent('sendObj', sendObj)

    },
    // 点击 上月
    gotoPreMonth() {
      let {
        year,
        month
      } = this.preMonth(this.data.currentYear, this.data.currentMonth)
      this.setData({
        currentYear: year,
        currentMonth: month,
      })
      this.getAllArr()
    },
    // 点击 下月
    gotoNextMonth() {
      let {
        year,
        month
      } = this.nextMonth(this.data.currentYear, this.data.currentMonth)
      this.setData({
        currentYear: year,
        currentMonth: month,
      })
      this.getAllArr()
    },
    // 点击日期
    clickDate(e) {
      var date = e.currentTarget.dataset.day;
      var current = e.currentTarget.dataset.current;
      if (current == 0) {
        if (date > 6) {
          // 点击上月日期--去上个月
          var {
            year,
            month
          } = this.preMonth(this.data.currentYear, this.data.currentMonth)
          this.gotoPreMonth()
        } else {
          // 点击下月
          var {
            year,
            month
          } = this.nextMonth(this.data.currentYear, this.data.currentMonth)
          this.gotoNextMonth()
        }
      } else {
        var year = this.data.currentYear;
        var month = this.data.currentMonth;
      }
      this.setData({
        selectedYear: year,
        selectedMonth: month,
        selectedDate: date,
      })
      console.log("当前选择日期", year, "-", month, "-", date);
      console.log(this.data.selectedDate);
      wx.nextTick(() => {
        this.getAllArr()
      })

    },
    // 回今天
    gotoToday() {
      this.setData({
        currentYear: this.data.nowYear,
        currentMonth: this.data.nowMonth,
      })
      this.getAllArr()
    }
  }
})