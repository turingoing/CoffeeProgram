const app = getApp();
Page({
  data: {
    score: 0,
    tupianUrl: app.globalData.tupianUrl,
    AUrl: app.globalData.AUrl,
    // products: [
    //   {
    //     id:'1',
    //     image:"/subPackages/package/pages/images/礼品.png",
    //     name:'咖啡杯',
    //     credits:'100'
    //   },
    //   {
    //     id:'2',
    //     image:"/subPackages/package/pages/images/礼品.png",
    //     name:'咖啡杯',
    //     credits:'100'
    //   },
    //   {
    //     id:'1',
    //     image:"/subPackages/package/pages/images/礼品.png",
    //     name:'咖啡杯',
    //     credits:'100'
    //   },
    //   {
    //     id:'1',
    //     image:"/subPackages/package/pages/images/礼品.png",
    //     name:'咖啡杯',
    //     credits:'100'
    //   },
    //   {
    //     id:'1',
    //     image:"/subPackages/package/pages/images/礼品.png",
    //     name:'咖啡杯',
    //     credits:'100'
    //   },
    //   {
    //     id:'1',
    //     image:"/subPackages/package/pages/images/礼品.png",
    //     name:'咖啡杯',
    //     credits:'100'
    //   },
    // ],
    ships: [],
    showAll: true,
    isNotEmpty: false
  },

  onLoad: function () {
    // 页面加载时，尝试从本地存储中获取数据
    const itsid = wx.getStorageSync('itsid');
    console.log(itsid);
    this.fetchData(itsid);
    // if (wx.getStorageSync('ships')) {
    //   this.setData({
    //     ships: wx.getStorageSync('ships')
    //   });
    // } else {
      // 如果本地存储中没有数据，则调用接口获取数据
      // this.fetchCategories();
    // }
  },

  changeShowTab(e) {
    e.currentTarget.dataset.tab === 'all' ? this.setData({showAll: true}) : this.setData({showAll: false})
    e.currentTarget.dataset.tab !== 'all' ? this.handleFilter() : ''
  },

  handleFilter() {
    let that = this
    console.log(this.data.ships);
    this.data.ships.forEach((item) => {
      item.children.forEach((i) => {
        if(Number(that.data.score) >= Number(i.price)) {
          return that.setData({isNotEmpty: true})
        }
      })
    })
  },

  fetchCategories: function () {
    const that = this;
    wx.request({
      url: `${app.globalData.AUrl}/jy/go/we.aspx?ituid=106&itjid=5035&itcid=5035&id=80`,
      method: 'GET',
      success: function (res) {
        if (res.data.code === '1' && res.data.result && res.data.result.goods) {
          // 如果请求成功且返回的数据格式正确
          that.setData({
            ships: res.data.result.goods,
          });
          // 同时将数据存储到本地存储中
          // wx.setStorageSync('ships', res.data.result.goods);
        } else {
          // 如果请求成功但数据格式不正确
          wx.showToast({
            title: '数据加载失败',
            icon: 'none',
            duration: 2000
          });
        }
      },
      fail: function (error) {
        // 如果请求失败
        console.error('请求失败:', error);
        wx.showToast({
          title: '请求失败，请检查网络',
          icon: 'none',
          duration: 2000
        });
      }
    });
  },
  // fetchData: function () {
  //   const that = this;
  //   const itsid = wx.getStorageSync('itsid');
  //   wx.request({
  //     url: `https://www.ruanzi.net/jy/go/we.aspx?ituid=106&itjid=10603&itcid=10603&itsid=${itsid}`,
  //     method: 'GET',
  //     success: function (res) {
  //       console.log(res);
  //       if (res.statusCode == 200 && res.data) {
  //         that.setData({
  //           content: res.data.content,
  //           freeze: res.data.freeze,
  //           money: res.data.money,
  //           score: res.data.score,
  //         });
  //         app.globalData.score = res.data.score; // 确保这里正确设置了全局变量
  //       }
  //     },
  //     fail: function (error) {
  //       console.error('获取数据失败', error);
  //     }
  //   });
  // },
  // goToProductDetail: function (e) {
  //   const shipsId = e.currentTarget.dataset.id;
  //   wx.navigateTo({
  //     url: `/product-detail/product-detail?id=${shipsId}`
  //     1030
  //   });
  // },
  // exchangeProduct: function (e) {
  //   const shipsId = e.currentTarget.dataset.id;
  //   const ship = this.data.categories.find(p => p.id === shipsId);
  //   if (ship) {
  //     wx.showModal({
  //       title: '确认兑换',
  //       content: `您确定要使用 ${dItem.price} 积分兑换 ${dItem.name} 吗？`,
  //       success: (res) => {
  //         if (res.confirm) {
  //           this.exchangeProductApi(shipsId);
  //         }
  //       }
  //     });
  //   }
  // },
  // exchangeProductApi: function (shipsId) {
  //   wx.request({
  //     url: `${app.globalData.backUrl}phone.aspx?mbid=10602&ituid=${app.globalData.ituid}&itsid=${itsid}`,
  //     data: {
  //       MCODE: 920,
  //       OPID: '1020',
  //       UNITID: '2',
  //       NUM: that.data.quantity,
  //       USERID: '0',
  //       NOTE: ' ',
  //       AMT: ''
  //     },
  //     success: (res) => {
  //       if (res.data.success) {
  //         wx.showToast({
  //           title: '兑换成功',
  //           icon: 'success'
  //         });
  //         this.fetchCategories(); // 重新加载商品列表
  //       } else {
  //         wx.showToast({
  //           title: '兑换失败',
  //           icon: 'none'
  //         });
  //       }
  //     },
  //     fail: function (error) {
  //       console.error('兑换请求失败:', error);
  //       wx.showToast({
  //         title: '兑换请求失败，请检查网络',
  //         icon: 'none',
  //         duration: 2000
  //       });
  //     }
  //   });
  // },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  // onRecharge: function () {
  //   let that = this
  //   const itsid = wx.getStorageSync('itsid')
  //   console.log(itsid);
  //   wx.request({
  //     url: `${app.globalData.backUrl}phone.aspx?mbid=10601&ituid=${app.globalData.ituid}&itsid=${itsid}`,
  //     data: {
  //       MCODE: 910,
  //       OPID: '1030',
  //       UNITID: '2',
  //       NUM: that.data.quantity,
  //       USERID: '0',
  //       NOTE: ' ',
  //       AMT: ''
  //     },
  //     method: 'POST',
  //     header: {
  //       'content-type': 'application/json' // 设置请求的header，通常用于指定请求数据的格式
  //     },
  //     success: (res) => {
  //       console.log("mbid=121:", res)
  //       wx.showToast({
  //         title: '兑换成功',
  //         duration: 2000
  //       })
  //       that.setData({
  //         visible: false
  //       })
  //       wx.requestPayment({
  //         "timeStamp": res.data.timeStamp, //时间戳
  //         "nonceStr": res.data.nonceStr, //随机字符串
  //         "package": res.data.package, //统一下单接口返回的prepay_id参数值，格式为prepay_id=***
  //         "signType": res.data.signType, //签名算法，应与后台下单时的值一致
  //         "paySign": res.data.paySign, //签名，具体见微信支付文档
  //         // "totalFee": 1,   //支付金额
  //         "success": function (res) {
  //           wx.showToast({
  //             title: '兑换成功',
  //             duration: 2000
  //           })
  //           setTimeout(() => {
  //             that.setData({
  //               visible: false
  //             })
  //           }, 2000);
  //         },
  //         "fail": function (err) {
  //           console.log(err.errMsg);
  //           console.log("兑换失败");
  //           that.setData({
  //             onclick: false
  //           })
  //           app.globalData.userInfo = true
  //           that.setData({
  //             localVar: app.globalData.userInfo
  //           })
  //           // console.log(that.data.localVar);
  //         }
  //       })
  //     }
  //   })
  // },


  navigateToduihuan: function (e) {
    const itemId = e.currentTarget.dataset.itemid;
    console.log('传递的itemId:', e.currentTarget.dataset.itemid);
    console.log('当前ships数据:', this.data.ships);
    let targetItem = null;

    // 遍历所有分类
    for (const category of this.data.ships) {
      if (!category.children) continue;
      // 在分类的children中查找商品
      targetItem = category.children.find(item => item.id === itemId);
      if (targetItem) break; // 找到后立即终止循环
    }

    if (targetItem) {
      const fullImageURL = `${app.globalData.AUrl}/jy/wxUserImg/106/${targetItem.image}`;
      wx.navigateTo({
        url: `/subPackages/package/pages/duihuan/duihuan?itemId=${itemId}&image=${encodeURIComponent(fullImageURL)}&name=${encodeURIComponent(targetItem.name)}
        &price=${encodeURIComponent(targetItem.price)}&desc=${encodeURIComponent(targetItem.desc)}`
      });
    } else {
      wx.showToast({
        title: '商品不存在',
        icon: 'none'
      });
    }
  },

  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.fetchCategories();
    this.fetchData();

  },
  fetchData: function () {
    const that = this;
    const itsid = wx.getStorageSync('itsid');
    wx.request({
      url: `${app.globalData.AUrl}/jy/go/we.aspx?ituid=106&itjid=10603&itcid=10603&itsid=${itsid}`,
      method: 'GET',
      success: function (res) {
        if (res.statusCode === 200 && res.data) {
          that.setData({
            score: res.data.score, // 确保这里更新了积分
            // 其他数据...
          });
          app.globalData.score = res.data.score; // 更新全局变量
        }
      },
      fail: function (error) {
        console.error('获取数据失败', error);
      }
    });
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