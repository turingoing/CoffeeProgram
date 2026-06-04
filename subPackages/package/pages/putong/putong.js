import drawQrcode from '../../../../utils/weapp.qrcode.esm.js';

const { generateRandomId } = require('../../../../utils/randomId.js');
const app = getApp();

Page({
  data: {
    AUrl: app.globalData.AUrl,
    itsid: '',
    userid: '',
    isSharePage: false,
    randomId: '',
    qrcodeSrc: '',
    sum: 0,
    subCount: '',
    showContent: true,
    percentage: 0,
    newQRCODE: '',
    leixing: '用户',
    memberTitle: '用户',
    name: '',
    statusBarHeight: 20,
    navBarHeight: 44,
    headerHeight: 64,
    contentTop: 80
  },

  onLoad(options) {
    console.log(options);
    this.initCustomNav();

    const cachedUserid = String(wx.getStorageSync('userid') || app.globalData.userid || '');
    this.setData({
      newQRCODE: `${this.data.AUrl}/jy/kadi/kadi?userid=${cachedUserid}`
    });

    if (options.from === 'share') {
      const shareUserid = String(options.userid || '');
      this.setData({
        isSharePage: true,
        showContent: false,
        randomId: options.randomId || '',
        userid: shareUserid,
        newQRCODE: shareUserid ? `${this.data.AUrl}/jy/kadi/kadi?userid=${shareUserid}` : this.data.newQRCODE
      });
    }
  },

  initCustomNav() {
    try {
      const systemInfo = wx.getSystemInfoSync();
      const statusBarHeight = systemInfo.statusBarHeight || 20;
      let navBarHeight = 44;

      if (typeof wx.getMenuButtonBoundingClientRect === 'function') {
        const menuButtonInfo = wx.getMenuButtonBoundingClientRect();
        if (menuButtonInfo && menuButtonInfo.top) {
          navBarHeight = menuButtonInfo.height + (menuButtonInfo.top - statusBarHeight) * 2;
        }
      }

      const headerHeight = statusBarHeight + navBarHeight;
      this.setData({
        statusBarHeight,
        navBarHeight,
        headerHeight,
        contentTop: headerHeight + 16
      });
    } catch (error) {
      console.error('初始化自定义标题栏失败', error);
    }
  },

  handleBack() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack({ delta: 1 });
      return;
    }

    wx.switchTab({
      url: '/pages/my/my'
    });
  },

  refreshMemberData() {
    if (this.data.isSharePage) {
      return;
    }

    const itsid = String(wx.getStorageSync('itsid') || app.globalData.itsid || '').trim();
    if (!itsid || itsid === '0') {
      return;
    }

    app.globalData.itsid = itsid;
    this.setData({ itsid });

    this.fetchData(itsid)
      .then((userid) => {
        const finalUserid = String(userid || this.data.userid || '').trim();
        if (!finalUserid || finalUserid === '0') {
          return;
        }

        this.checkRandomId(finalUserid, itsid);
        this.fetchSumData(finalUserid);
        this.fetchSubCountData(finalUserid);
        this.fetchAccelerationRate(finalUserid);
      })
      .catch((err) => {
        console.error('刷新普通会员页面数据失败', err);
      });
  },

  fetchAccelerationRate(userid) {
    if (!userid) {
      return;
    }

    wx.request({
      url: `${this.data.AUrl}/jy/go/we.aspx?ituid=106&itjid=10610&itcid=10624&userid=${userid}`,
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200 && res.data) {
          this.setData({
            percentage: parseInt(res.data.jiasulv, 10) || 0
          });
        }
      },
      fail: (err) => {
        console.error('获取加速率失败', err);
        wx.showToast({
          title: '获取加速率失败',
          icon: 'none'
        });
      }
    });
  },

  checkRandomId(userid, itsid) {
    if (!userid || !itsid) {
      return;
    }

    wx.request({
      url: `${this.data.AUrl}/jy/go/we.aspx?ituid=106&itjid=10610&itcid=10618&userid=${userid}`,
      method: 'GET',
      success: (res) => {
        console.log('[推荐码接口] 原始响应:', res.data);

        if (
          res.statusCode === 200 &&
          res.data?.code === '1' &&
          res.data?.result?.list?.length > 0 &&
          res.data.result.list[0].randomId
        ) {
          const serverRandomId = res.data.result.list[0].randomId;
          this.setData({
            randomId: serverRandomId
          });
          wx.setStorageSync('randomId', serverRandomId);
          return;
        }

        const newRandomId = generateRandomId();
        wx.request({
          url: `${app.globalData.backUrl}/phone.aspx?mbid=10610&ituid=${app.globalData.ituid}&itsid=${itsid}`,
          method: 'POST',
          data: {
            userid,
            randomId: newRandomId,
            itsid
          },
          success: (saveRes) => {
            console.log('[保存推荐码] 响应:', saveRes.data);
            if (saveRes.data?.code === '1') {
              this.setData({
                randomId: newRandomId
              });
              wx.setStorageSync('randomId', newRandomId);
            } else {
              console.error('[保存推荐码失败] 服务端返回异常', saveRes.data);
            }
          },
          fail: (saveErr) => {
            console.error('[保存推荐码失败] 网络异常:', saveErr);
            wx.showToast({
              title: '网络异常，请稍后重试',
              icon: 'none'
            });
          }
        });
      },
      fail: (err) => {
        console.error('[接口错误] 推荐码请求失败', err);
        wx.showToast({
          title: '网络连接异常，请检查网络设置',
          icon: 'none',
          duration: 3000
        });
      }
    });
  },

  generateRandomId() {
    return generateRandomId();
  },

  fetchData(itsid) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: `${this.data.AUrl}/jy/go/we.aspx?ituid=106&itjid=10603&itcid=10603&itsid=${itsid}`,
        method: 'GET',
        success: (res) => {
          if (res.statusCode !== 200 || !res.data) {
            reject(new Error('用户信息返回异常'));
            return;
          }

          const userid = String(res.data.userid || '');
          const leixing = res.data.leixing || '普通会员';

          if (userid) {
            app.globalData.userid = userid;
            wx.setStorageSync('userid', userid);
          }

          app.globalData.itsid = itsid;

          this.setData({
            itsid,
            userid,
            leixing,
            memberTitle: leixing,
            name: res.data.name || '',
            newQRCODE: `${this.data.AUrl}/jy/kadi/kadi?userid=${userid}`
          });

          resolve(userid);
        },
        fail: (error) => {
          console.error('获取普通会员数据失败', error);
          wx.showToast({
            title: '获取数据失败，请检查网络',
            icon: 'none'
          });
          reject(error);
        }
      });
    });
  },

  formatPhoneNumber(phone) {
    if (!phone) {
      return phone;
    }

    return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
  },

  fetchSumData(userid) {
    if (!userid) {
      return;
    }

    wx.request({
      url: `${this.data.AUrl}/jy/go/we.aspx?ituid=106&itjid=10610&itcid=10620&userid=${userid}`,
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200 && res.data) {
          this.setData({
            sum: res.data.sum || '0'
          });
        }
      },
      fail: (err) => {
        console.error('获取 sum 数据失败', err);
        wx.showToast({
          title: '获取数据失败，请检查网络',
          icon: 'none'
        });
      }
    });
  },

  fetchSubCountData(userid) {
    if (!userid) {
      return;
    }

    wx.request({
      url: `${this.data.AUrl}/jy/go/we.aspx?ituid=106&itjid=0902&itcid=10621&userid=${userid}`,
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200 && res.data) {
          this.setData({
            subCount: res.data.subCount || '0'
          });
        }
      },
      fail: (err) => {
        console.error('获取团队成员数据失败', err);
        wx.showToast({
          title: '获取数据失败',
          icon: 'none'
        });
      }
    });
  },

  drawQRCode(userid) {
    drawQrcode({
      width: 200,
      height: 200,
      canvasId: 'myQrcode',
      text: `${this.data.AUrl}/jy/kadi/kadi?userid=${userid}`,
      callback: () => {
        wx.canvasToTempFilePath({
          x: 0,
          y: 0,
          width: 200,
          height: 200,
          canvasId: 'myQrcode',
          success: (res) => {
            console.log('二维码图片路径：', res.tempFilePath);
            this.setData({
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

  saveQRCodeImage() {
    wx.canvasToTempFilePath({
      x: 0,
      y: 0,
      width: 200,
      height: 200,
      canvasId: 'myQrcode',
      success: (res) => {
        wx.saveImageToPhotosAlbum({
          filePath: res.tempFilePath,
          success() {
            wx.showToast({
              title: '保存成功，可分享给好友注册',
              icon: 'success'
            });
          },
          fail() {
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
    this.refreshMemberData();
  },

  onHide() {},

  onUnload() {},

  onPullDownRefresh() {},

  onReachBottom() {},

  onShareAppMessage() {
    const shareUserid = this.data.userid || wx.getStorageSync('userid') || '';
    return {
      title: '邀请您加入',
      path: `/subPackages/package/pages/xq/xq?from=share&userid=${shareUserid}&randomId=${this.data.randomId}`,
      imageUrl: this.data.qrcodeSrc
    };
  }
});
