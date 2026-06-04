import drawQrcode from '../../../../utils/weapp.qrcode.esm.js';
const {
  generateRandomId
} = require('../../../../utils/randomId.js');

const app = getApp();

Page({
  data: {
    isSharePage: false, // 是否是分享进入的页面
    randomId: '',
    qrcodeSrc: '',
    sum: 0,
    subCount: '',
    showContent: true, // 控制非分享内容的显示
    percentage: 0, // 新增进度百分比
    name: '',
  },

  onLoad: function (options) {
    // // 检查是否是分享进入的页面
    // if (options.from === 'share') {
    //   this.setData({
    //     isSharePage: true,
    //     showContent: false,
    //     randomId: options.randomId || ''
    //   });

    //   // 直接使用传入的userid生成二维码
    //   if (options.userid) {
    //     this.drawQRCode(options.userid);
    //   }
    // } else {
    // 原有正常流程
    const itsid = wx.getStorageSync('itsid');
    const userid = wx.getStorageSync('userid');
    // if (itsid) {
    //   this.fetchData(itsid)
    //     .then(userid => {
    // this.checkRandomId(userid, itsid);
    this.fetchData(itsid);
    this.fetchSumData(userid);
    this.fetchSubCountData(userid);
    this.fetchAccelerationRate(userid);
    //       })
    //       .catch(err => {
    //         console.error('fetchData 失败', err);
    //       });
    //   } else {
    //     wx.navigateTo({
    //       url: '/subPackages/user/pages/login/login'
    //     });
    //   }
    // }
  },

  // 新增获取加速率方法
  fetchAccelerationRate(userid) {
    const that = this;
    wx.request({
      url: `${app.globalData.AUrl}/jy/go/we.aspx?ituid=106&itjid=10610&itcid=10624&userid=${userid}`,
      method: 'GET',
      success(res) {
        if (res.statusCode === 200 && res.data) {
          // 处理加速率数据，假设返回格式如：{ "jiasulv": "30%" }
          let rate = parseInt(res.data.jiasulv) || 0;
          that.setData({
            percentage: rate
          });
        }
      },
      fail(err) {
        console.error('获取加速率失败', err);
        wx.showToast({
          title: '获取加速率失败',
          icon: 'none'
        });
      }
    });
  },
  // 检查或生成 randomId
  // checkRandomId(userid, itsid) {
  //   let that = this;

  //   wx.request({
  //     url: `${app.globalData.AUrl}/jy/go/we.aspx?ituid=106&itjid=10610&itcid=10618&userid=${userid}`,
  //     method: 'GET',
  //     success(res) {
  //       console.log('[推荐码接口] 原始响应:', res.data);

  //       // 强化数据验证
  //       if (res.statusCode === 200 &&
  //         res.data?.code === "1" &&
  //         res.data?.result?.list?.length > 0 &&
  //         res.data.result.list[0].randomId
  //       ) {
  //         const serverRandomId = res.data.result.list[0].randomId;
  //         console.log('[推荐码接口] 有效推荐码:', serverRandomId);

  //         that.setData({
  //           randomId: serverRandomId
  //         });
  //         wx.setStorageSync('randomId', serverRandomId);
  //         that.drawQRCode(userid);
  //       } else {
  //         console.warn('[推荐码接口] 无有效推荐码，生成新码');

  //         // 生成新推荐码
  //         const newRandomId = generateRandomId();
  //         console.log('[新推荐码] 生成:', newRandomId);

  //         // 保存到服务器
  //         wx.request({
  //           url: `${app.globalData.backUrl}/phone.aspx?mbid=10610&ituid=${app.globalData.ituid}&itsid=${itsid}`,
  //           method: 'POST',
  //           data: {
  //             userid: userid,
  //             randomId: newRandomId,
  //             itsid: itsid
  //           },
  //           success(saveRes) {
  //             console.log('[保存接口] 响应:', saveRes.data);

  //             if (saveRes.data?.code === "1") {
  //               that.setData({
  //                 randomId: newRandomId
  //               });
  //               wx.setStorageSync('randomId', newRandomId);
  //               that.drawQRCode(userid);
  //             } else {
  //               console.error('[保存失败] 服务端返回异常:', saveRes.data);
  //               wx.showToast({

  //               });
  //             }
  //           },
  //           fail(saveErr) {
  //             console.error('[保存失败] 网络异常:', saveErr);
  //             wx.showToast({
  //               title: '网络异常，请稍后重试',
  //               icon: 'none'
  //             });
  //           }
  //         });
  //       }
  //     },
  //     fail(err) {
  //       console.error('[接口错误] 推荐码请求失败:', err);
  //       wx.showToast({
  //         title: '网络连接异常，请检查网络设置',
  //         icon: 'none',
  //         duration: 3000
  //       });
  //     }
  //   });
  // },
  // 生成随机 ID
  generateRandomId() {
    return generateRandomId(); // 调用工具函数生成随机 ID
  },

  // 获取用户数据
  fetchData(itsid) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: `${app.globalData.AUrl}/jy/go/we.aspx?ituid=106&itjid=10603&itcid=10603&itsid=${itsid}`,
        method: 'GET',
        success: (res) => {
          if (res.statusCode === 200 && res.data) {
            app.globalData.userid = res.data.userid;
            // 格式化电话号码，隐藏中间部分
            const formattedName = this.formatPhoneNumber(res.data.name);
            this.setData({
              leixing: res.data.leixing || '用户',
              name: formattedName // 使用格式化后的电话号码
            });
            resolve(res.data.userid); // 返回 userid
          }
        },
        fail: (error) => {
          console.error('获取数据失败', error);
          wx.showToast({
            title: '获取数据失败，请检查网络或联系管理员',
            icon: 'none'
          });
          reject(error);
        }
      });
    });
  },
  formatPhoneNumber(phone) {
    if (!phone) return phone; // 如果电话号码为空，直接返回
    // 假设电话号码是11位，隐藏中间4位
    return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
  },
  // 获取 sum 数据
  fetchSumData(userid) {
    const that = this;
    wx.request({
      url: `${app.globalData.AUrl}/jy/go/we.aspx?ituid=106&itjid=10610&itcid=10620&userid=${userid}`,
      method: 'GET',
      success(res) {
        if (res.statusCode === 200 && res.data) {
          that.setData({
            sum: res.data.result.list[0].sum || '0',
          });
        }
      },
      fail(err) {
        console.error('获取 sum 数据失败', err);
        wx.showToast({
          title: '获取数据失败，请检查网络或联系管理员',
          icon: 'none'
        });
      }
    });
  },
  fetchSubCountData(userid) {
    const that = this;
    wx.request({
      url: `${app.globalData.AUrl}/jy/go/we.aspx?ituid=106&itjid=0902&itcid=10621&userid=${userid}`,
      method: 'GET',
      success(res) {
        if (res.statusCode === 200 && res.data) {
          that.setData({
            subCount: res.data.subCount || '0',
          });
        }
      },
      fail(err) {
        console.error('获取团队成员数据失败', err);
        wx.showToast({
          title: '获取数据失败',
          icon: 'none'
        });
      }
    });
  },
  // 绘制二维码
  drawQRCode(userid) {
    const that = this;
    drawQrcode({
      width: 200,
      height: 200,
      canvasId: 'myQrcode',
      text: `${app.globalData.AUrl}/jy/liang/kadi?userid=${userid}`,
      callback: () => {
        wx.canvasToTempFilePath({
          x: 0,
          y: 0,
          width: 200,
          height: 200,
          canvasId: 'myQrcode',
          success: (res) => {
            console.log('二维码图片路径：', res.tempFilePath);
            that.setData({
              qrcodeSrc: res.tempFilePath
            });
          },
          fail: (err) => {
            console.error('获取二维码图片失败', err);
          }
        });
      }
    });
  },

  // 保存二维码图片
  saveQRCodeImage() {
    wx.canvasToTempFilePath({
      x: 0,
      y: 0,
      width: 200,
      height: 200,
      canvasId: 'myQrcode',
      success: (res) => {
        console.log('二维码图片路径：', res.tempFilePath);
        wx.saveImageToPhotosAlbum({
          filePath: res.tempFilePath,
          success(res) {
            wx.showToast({
              title: '保存成功，可分享给好友注册',
              icon: 'success'
            });
          },
          fail(err) {
            wx.showToast({
              title: '保存失败，请重试',
              icon: 'none'
            });
          }
        });
      },
      fail: (err) => {
        console.error('获取二维码图片失败', err);
      }
    });
  },

  onReady() {},

  onShow() {
    const itsid = wx.getStorageSync('itsid');
    const userid = wx.getStorageSync('userid');
    // if (itsid) {
    //   this.checkRandomId(userid, itsid);
    // }
  },



  onHide() {},

  onUnload() {},

  onPullDownRefresh() {},

  onReachBottom() {},

  onShareAppMessage() {
    return {
      title: '邀请您加入',
      path: `/subPackages/package/pages/xq/xq?from=share&userid=${wx.getStorageSync('userid')}&randomId=${this.data.randomId}`,
      imageUrl: this.data.qrcodeSrc
    }
  },

});