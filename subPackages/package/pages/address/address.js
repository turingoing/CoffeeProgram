const app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    target: 'add',
    keyid: 0,
    userid: '',
    address: '',
    province: '',
    city: '',
    district: '',
    street: '',
    w: '', //经度
    s: '', //纬度
    MeFlag: 0,
    AUrl: app.globalData.AUrl,
    username: '',
    gender: '',
    phone: '',
    address: '', //广东省广州市天河区天源路804号
    addressDesc: '', //萌芽创意园
    door: '',
    isIndex: '',

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    if (options.target === 'add') {
      wx.setNavigationBarTitle({
        title: '新增地址'
      })
      this.setData({
        target: 'add'
      })
    }
    if (options.target === 'edit') {
      wx.setNavigationBarTitle({
        title: '编辑地址'
      })
      this.setData({
        target: 'edit',
        keyid: Number(options.keyid || 0),
        userid: app.globalData.userid,
        username: decodeURIComponent(options.name || options.username || ''),
        gender: decodeURIComponent(options.gender || ''),
        phone: decodeURIComponent(options.phone || ''),
        address: decodeURIComponent(options.address || ''),
        addressDesc: decodeURIComponent(options.addressdesc || ''),
        door: decodeURIComponent(options.door || ''),
        province: decodeURIComponent(options.province || ''),
        city: decodeURIComponent(options.city || ''),
        district: decodeURIComponent(options.district || ''),
        street: decodeURIComponent(options.street || ''),
        w: decodeURIComponent(options.w || ''),
        s: decodeURIComponent(options.s || ''),
        isIndex: Number(options.isIndex)
      })
    }
  },

  // 修改性别
  changeGender(value) {
    console.log(value.detail.value)
    this.setData({
      gender: value.detail.value
    })
  },
  // 修改设置默认地址
  changeIsindex(value) {
    console.log(value);
    console.log(value.detail.checked)
    if (value.detail.checked) {
      this.setData({
        isIndex: 1,
        MeFlag: 1

      })
    } else {
      this.setData({
        isIndex: 0,
        MeFlag: 0
      })
    }

  },

  chooseAddress() {
    let that = this

    wx.chooseLocation({
      success: (res) => {
        console.log('选择的地址:', res);
        const str = res.address
        console.log("str:", str);
        const words = str.split(/省|市|区/);
        console.log(words);

        that.setData({
          addressDesc: res.name, // 将选择的地址设置到数据中以便显示

          province: words[0] + '省',
          city: words[1] + '市',
          district: words[2] + '区',
          street: words[3],
          address: res.name,
          w: res.longitude,
          s: res.latitude,

        });
      },
      fail: (err) => {
        console.error('选择地址失败:', err);
        wx.showToast({
          title: '选择地址失败',
          icon: 'none'
        });
      }
    });
  },

  fetchData() {
    const that = this;

    const itsid = wx.getStorageSync('itsid')
    const userid = wx.getStorageSync('userid')
    console.log("username:", this.data.username); // 打印看看是否有值
    console.log("phone:", this.data.phone); // 打印看看是否有值


    // 后台接口地址
    const isEdit = this.data.target === 'edit';
    wx.request({
      url: `${app.globalData.backUrl}phone.aspx?mbid=10605&ituid=${app.globalData.ituid}&itsid=${itsid}`,
      method: 'POST',
      data: {
        userid: userid,
        address: that.data.address,
        province: that.data.province,
        city: that.data.city,
        district: that.data.district,
        street: that.data.street,
        w: that.data.w, //经度
        s: that.data.s, //纬度
        MeFlag: that.data.MeFlag,
        username: that.data.username,
        phone: that.data.phone,

        // userid: 0,
        // address: "111",
        // province: "that.data.province",
        // city: "that.data.city",
        // district: "that.data.district",
        // street: "that.data.street",
        // w: "that.data.w", //经度
        // s: "that.data.s", //纬度
        // MeFlag: 0,
        delivery: 5,
        keyid: isEdit ? that.data.keyid : 0, //只在修改时起效
        count: isEdit ? 1 : 0, //0新增，1修改
      },
      success(res) {
        console.log(res);
        console.log("dde");

        wx.navigateBack({
          delta: 1,
          success() {
            console.log("222");
            app.globalData.delivery = 5;
          },
          fail() {
            console.log("jjjjj");
          },
        })
      }
    });

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady(e) {
    let g = this.data.gender
    this.setData({
      gender: g
    })
  },
  onUsernameInput(e) {
    console.log('用户名输入:', e.detail.value); // 确认输入触发
    this.setData({
      username: e.detail.value
    });
  },

  onPhoneInput(e) {
    console.log('手机号输入:', e.detail.value); // 确认输入触发
    this.setData({
      phone: e.detail.value
    });
  },

  onDoorInput(e) {
    console.log('门牌号输入:', e.detail.value);
    this.setData({
      door: e.detail.value
    });
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
