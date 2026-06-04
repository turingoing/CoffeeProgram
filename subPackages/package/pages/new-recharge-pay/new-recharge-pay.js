const app = getApp();

Page({
  data: {
    AUrl: app.globalData.AUrl,
    orderid: '',
    amt: '0.00',
    return_url: '',
    // 存放微信支付必需参数
    payParams: {} 
  },

  onLoad(options) {
    // 接收参数，并严格进行 decode 解码，存入 data
    this.setData({
      orderid: options.orderid || '',
      amt: options.amt || '0.00',
      return_url: options.return_url || '',
      // 注意：由于上一页可能没传 SN，因此需要兼容
      SN: options.SN || '', 
      
      payParams: {
        appId: options.appId,
        nonceStr: options.nonceStr,
        package: decodeURIComponent(options.package || ''),
        paySign: decodeURIComponent(options.paySign || ''),
        signType: options.signType,
        timeStamp: options.timeStamp
      }
    });
  },

  // 执行微信支付动作
  executePay() {
    const { payParams, orderid, SN, return_url, AUrl } = this.data;
    const itsid = wx.getStorageSync('itsid');

    wx.showLoading({ title: '唤起收银台...', mask: true });

    wx.requestPayment({
      ...payParams,
      success: (res) => {
        wx.hideLoading();
        console.log("微信支付成功：", res);
        
        // 支付成功：主动通知后台 (mbid=10628)
        wx.request({
          url: `${AUrl}/jy/go/phone.aspx?mbid=10628&ituid=106&itsid=${itsid}`,
          method: "POST",
          data: {
            ORDERID: orderid,
            ZFID: SN // 填入后台生成的支付流水号或约定值
          },
          success: () => {
            // 这里使用 redirectTo 防止用户物理返回再次进入收银台
            wx.redirectTo({
              url: `${return_url}?status=success&orderid=${orderid}`
            });
          }
        });
      },
      fail: (err) => {
        wx.hideLoading();
        // 判断是否为用户主动点击取消
        if (err.errMsg === 'requestPayment:fail cancel') {
          wx.showToast({ title: '已取消支付', icon: 'none' });
        } else {
          console.error("微信支付真实异常：", err);
          
          // 支付失败：上报异常给后台 (mbid=166)
          wx.request({
            url: `${AUrl}/jy/go/phone.aspx?mbid=166&ituid=106&itsid=${itsid}`,
            method: "POST",
            data: {
              ORDERID: orderid,
              ZFID: err.errMsg // 后台约定的将错误信息放入该字段
            },
            success: () => {
              wx.redirectTo({
                url: `${return_url}?status=fail&orderid=${orderid}&msg=支付异常`
              });
            }
          });
        }
      }
    });
  }
});