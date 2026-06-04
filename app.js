// app.js
App({
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)
    wx.removeStorageSync('hasShownRecommendationPopup');
    
    // 检查是否首次使用应用（用于隐私协议）
    this.checkPrivacyAgreement();
    
    const userid = wx.getStorageSync('userid');
    const itsid = wx.getStorageSync('itsid');
    const categories = wx.getStorageSync('categories') || [];
    const total = wx.getStorageSync('total') || 0;
    this.globalData.categories = categories;
    this.globalData.total = total;

    // 如果存在 userid 和 itsid，则设置全局数据
    if (userid && itsid) {

      this.globalData.userid = userid;
      this.globalData.itsid = wx.getStorageSync('itsid');
    }
    // 登录
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
        globalData: {
          selectedAddress: ''
        }
      }
    })
  },
  globalData: {
    userInfo: null,
    backUrl: 'https://www.caldicoffee.com.cn/jy/go/',
    globalUrl: 'https://www.caldicoffee.com.cn/jy/wxuser/106',
    tupianUrl: 'https://www.caldicoffee.com.cn/jy/wxuser/106/images',
    AUrl: "https://www.caldicoffee.com.cn",
    ituid: 106,
    userid: null, // 用于存储用户ID
    userid2: null,
    itsid: null, // 用于存储用户的唯一标识
    // itsid: '[WXA] IR18ZBRBJFXF3UB80ETR',
    selected: '自提', // 默认选择自提
    addressDesc: '', // 地址描述
    selectedStoreName: '', // 门店信息
    selectedDishName: '',
    projectName: '1',
    totalprice: 0,
    selectedItemName: '',
    selectedItemPrice: '',
    selectedItemitemId: '',
    selectedStoreNamegd: '',
    appId: 'wxe1d69cebee046787', // 小程序的appId
    score: '',
    content: '',
    invite: null,
    invite1: null,
    phone: '',
    username: '',
    totalprice: 0,
    selectedStoreId: '',
    categories: [],
    hasAgreedPrivacy: false, // 用户是否已同意隐私协议
  },
  setSelected: function (selected) {
    console.log('Setting selected to:', selected);
    this.globalData.selected = selected;
  },
  setAddress: function (address) {
    console.log('Setting address to:', address);
    this.globalData.addressDesc = address;
  },
  setStoreInfo: function (storeInfo) {
    console.log('Setting storeInfo to:', storeInfo);
    this.globalData.storeInfo = storeInfo;

  },
  // 添加激活函数
  activateTerminal: function (vendor_sn, vendor_key, app_id, code, device_id) {
    return new Promise((resolve, reject) => {
      const params = {
        app_id: app_id,
        code: code,
        device_id: device_id,
        // 可选参数根据需求添加
      };
      // 过滤空值并排序
      const sortedParams = Object.keys(params).sort().reduce((obj, key) => {
        if (params[key]) obj[key] = params[key];
        return obj;
      }, {});
      // 拼接签名字符串
      const message = Object.entries(sortedParams).map(([k, v]) => `${k}=${v}`).join('&');
      // 生成签名
      const sign = CryptoJS.HmacSHA256(message, vendor_key).toString(); // 需引入加密库如crypto-js
      // 发送请求
      wx.request({
        url: 'https://api.shouqianba.com/terminal/activate',
        method: 'POST',
        data: {
          ...sortedParams,
          sign
        },
        header: {
          'Content-Type': 'application/json'
        },
        success: (res) => {
          if (res.data.result_code === '200') {
            resolve(res.data.biz_response); // 返回终端号和密钥
          } else {
            reject(res.data); // 返回错误信息
          }
        },
        fail: (err) => reject(err)
      });
    });
  },
  
  // 检查隐私协议同意状态
  checkPrivacyAgreement: function() {
    try {
      //强制清除隐私协议状态（测试用，正式发布时注释）
      //this.clearPrivacyAgreement();
      
      // 在应用启动时检查是否首次进入
      const hasAgreedPrivacy = wx.getStorageSync('hasAgreedPrivacy');
      const privacyAgreedTime = wx.getStorageSync('privacyAgreedTime');
      
      console.log('[App] 是否已同意隐私协议:', hasAgreedPrivacy);
      console.log('[App] 同意隐私协议的时间:', privacyAgreedTime);
      
      // 将隐私协议状态保存到全局变量
      this.globalData.hasAgreedPrivacy = hasAgreedPrivacy && privacyAgreedTime;
      
    } catch (error) {
      console.error('[App] 检查隐私协议状态失败:', error);
      this.globalData.hasAgreedPrivacy = false;
    }
  },
  
  // 清除隐私协议同意状态（用于测试）
  clearPrivacyAgreement: function() {
    try {
      console.log('[App] 清除隐私协议同意状态');
      wx.removeStorageSync('hasAgreedPrivacy');
      wx.removeStorageSync('privacyAgreedTime');
      this.globalData.hasAgreedPrivacy = false;
    } catch (error) {
      console.error('[App] 清除隐私协议状态失败:', error);
    }
  }
});
