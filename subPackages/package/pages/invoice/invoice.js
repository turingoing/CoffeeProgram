const app = getApp();
Page({
  data: {
    orderIds: [],
    amounts: '',
    productNames: [],
    quantities: [],
    totalAmount: '0.00',
    type: 'personal', // 默认值
    typeMap: {
      personal: '个人/非企业单位',
      company: '企业'
    },
    method: 'categories', // 默认值
    methodMap: {
      categories: '商品类别',
      details: '商品明细'
    },
    type: 'personal',
    method: 'categories', // 默认值

  },
  onLoad(options) {
    const app = getApp();
    // 检查参数是否存在，避免 undefined
    const orderIds = options.orderIds ? options.orderIds.split(',') : [];
    const amounts = options.amounts ? options.amounts.split(',').map(Number) : [];
    const productNames = options.productNames ? options.productNames.split(',') : [];
    const quantities = options.quantities ? options.quantities.split(',').map(Number) : [];
    const totalAmount = options.totalAmount || '0.00';

    // 设置页面数据
    this.setData({
      orderIds,
      amounts,
      productNames,
      quantities,
      totalAmount
    });
  },
  submitInvoice(e) {
    const app = getApp();
    const values = e.detail.value;

    // 表单验证
    if (!values.title) {
      wx.showToast({
        title: '请填写发票抬头',
        icon: 'none'
      });
      return;
    }

    if (this.data.type === 'company' && !values.taxId) {
      wx.showToast({
        title: '请填写纳税人识别号',
        icon: 'none'
      });
      return;
    }

    if (!values.email) {
      wx.showToast({
        title: '请填写邮箱地址',
        icon: 'none'
      });
      return;
    }

    const userid = app.globalData.userid;
    const now = new Date();
    const pad = n => n < 10 ? '0' + n : n;
    const timestampLocal = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    // 提取表单数据并转换字段值
    const invoiceData = {
      type: this.data.typeMap[this.data.type], // 抬头类型
      method: this.data.methodMap[this.data.method], // 开票方式
      amount: this.data.totalAmount, // 金额
      title: values.title, // 发票抬头
      title_type: "电子发票", // 发票类型
      taxId: values.taxId || '', // 税号
      email: values.email, // 邮箱
      orderIds: this.data.orderIds, // 订单号
      userid: userid,
      time: timestampLocal,
    };

    const itsid = wx.getStorageSync('itsid');
    wx.request({
      url: `${app.globalData.backUrl}phone.aspx?mbid=10609&ituid=${app.globalData.ituid}&itsid=${itsid}`,
      method: 'POST',
      data: invoiceData,
      header: {
        'content-type': 'application/json'
      },
      success: (res) => { // 使用箭头函数
        if (res.statusCode === 200) {
          wx.showToast({
            title: '开票申请已提交',
            icon: 'success',
            duration: 1500,
          });

          // 第二步：发票提交成功后，再次调用接口处理订单号（假设仍需mbid=10618）
          // 遍历 orderIds 数组，逐个处理每个订单号
          this.data.orderIds.forEach((orderId) => {
            wx.request({
              url: `${app.globalData.backUrl}phone.aspx?mbid=10618&ituid=${app.globalData.ituid}&itsid=${itsid}`,
              method: 'POST',
              data: {
                orderid: this.data.orderIds.join(',') // 将数组转换为字符串
              },
              success: (resPostOrder) => {
                if (resPostOrder.statusCode === 200) {
                  console.log(`订单号 ${orderId} 提交成功`);
                } else {
                  console.error(`订单号 ${orderId} 提交失败`);
                }
              },
              fail: () => {
                console.error(`订单号 ${orderId} 提交网络错误`);
              }
            });
          });

          // 所有订单号处理完成后，返回上一页
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);

        } else {
          wx.showToast({
            title: '提交失败，请稍后再试',
            icon: 'none'
          });
        }
      },
      fail: () => {
        wx.showToast({
          title: '网络错误，请检查后重试',
          icon: 'none'
        });
      }
    });
  },

  onTypeChange(e) {
    this.setData({
      type: e.detail.value
    });
  },

  onMethodChange(e) {
    this.setData({
      method: e.detail.value
    });
  },

  // 其他生命周期函数和方法
});