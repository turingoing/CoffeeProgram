const app = getApp();
const storeUtils = require('../../../../utils/store');

Page({
  data: {
    stores: [],
    type: 'order',
    latitude: '',
    longitude: '',
    isloading: true
  },

  onLoad(options) {
    this.setData({
      type: options.type || 'order'
    });

    const itsid = wx.getStorageSync('itsid') || app.globalData.itsid || '';
    this.getResult(itsid);
    this.checkLocationPermission(false);
  },

  onShow() {
    this.checkLocationPermission(false);
  },

  clearLocationState() {
    this.setData({
      latitude: '',
      longitude: ''
    }, () => {
      this.refreshStores();
    });
  },

  getLocationFailureType(err = {}) {
    const errMsg = String(err.errMsg || err.message || '').toLowerCase();

    if (errMsg.includes('auth deny') || errMsg.includes('auth denied')) {
      return 'authDenied';
    }

    if (
      errMsg.includes('system permission denied') ||
      errMsg.includes('location service disabled') ||
      errMsg.includes('locationswitchoff') ||
      errMsg.includes('location unavailable') ||
      errMsg.includes('system not support location') ||
      errMsg.includes('gps')
    ) {
      return 'serviceDisabled';
    }

    return 'other';
  },

  showLocationPermissionModal() {
    if (this._hasShownLocationPermissionModal) {
      return;
    }

    this._hasShownLocationPermissionModal = true;
    wx.showModal({
      title: '提示',
      content: '需要您授权位置权限才能获取附近的门店，是否去设置开启？',
      confirmText: '去设置',
      cancelText: '取消',
      success: (res) => {
        if (!res.confirm) {
          return;
        }

        wx.openSetting({
          success: (settingRes) => {
            if (settingRes.authSetting && settingRes.authSetting['scope.userLocation']) {
              this.getLocation({
                showSystemLocationPrompt: true
              });
            }
          }
        });
      }
    });
  },

  showLocationServiceDisabledModal() {
    if (this._hasShownLocationServiceModal) {
      return;
    }

    this._hasShownLocationServiceModal = true;
    wx.showModal({
      title: '提示',
      content: '手机定位未开启，无法显示与店铺的距离，请先开启手机定位。',
      showCancel: false,
      confirmText: '我知道了'
    });
  },

  checkLocationPermission(showPrompt = false) {
    wx.getSetting({
      success: (settingRes) => {
        const authSetting = settingRes.authSetting || {};
        if (authSetting['scope.userLocation'] === false) {
          this.clearLocationState();
          if (showPrompt) {
            this.showLocationPermissionModal();
          }
          return;
        }

        this.getLocation({
          showAuthPrompt: showPrompt,
          showSystemLocationPrompt: showPrompt
        });
      },
      fail: () => {
        this.getLocation({
          showAuthPrompt: showPrompt,
          showSystemLocationPrompt: showPrompt
        });
      }
    });
  },

  getLocation(options = {}) {
    wx.getLocation({
      type: 'wgs84',
      success: ({ latitude, longitude }) => {
        this.setData({
          latitude,
          longitude
        }, () => {
          this.refreshStores();
        });
      },
      fail: (err) => {
        this.clearLocationState();

        const failureType = this.getLocationFailureType(err);
        if (failureType === 'authDenied') {
          if (options.showAuthPrompt) {
            this.showLocationPermissionModal();
          }
          return;
        }

        if (failureType === 'serviceDisabled') {
          if (options.showSystemLocationPrompt) {
            this.showLocationServiceDisabledModal();
          }
          return;
        }

        if (options.showSystemLocationPrompt) {
          this.showLocationServiceDisabledModal();
        }
      }
    });
  },

  getResult(itsid = '') {
    wx.request({
      url: `${app.globalData.AUrl}/jy/go/we.aspx?ituid=106&itjid=10610&itcid=10626&itsid=${itsid}`,
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200 && res.data.code === '1') {
          this.rawStores = res?.data?.result?.list || [];
          this.refreshStores();
          return;
        }
        console.log("shkahdf",res);
        wx.showToast({
          title: '门店加载失败',
          icon: 'none'
        });
      },
      fail: () => {
        wx.showToast({
          title: '门店加载失败',
          icon: 'none'
        });
      },
      complete: () => {
        this.setData({
          isloading: false
        });
      }
    });
  },

  refreshStores() {
    const selectedStoreId = String(wx.getStorageSync('selectedStoreId') || app.globalData.selectedStoreId || '');
    const sourceStores = Array.isArray(this.rawStores) ? this.rawStores : [];
    const stores = storeUtils.enrichStores(
      sourceStores,
      this.data.latitude,
      this.data.longitude
    ).map((store) => ({
      ...store,
      ctaText: store.isOpen ? '去下单' : '休息中',
      ctaHintText: store.isOpen ? '选择门店' : '暂不可选',
      isSelected: store.isOpen && String(store.id) === selectedStoreId
    }));

    this.setData({ stores });
  },

  getStoreById(storeId) {
    const targetId = String(storeId || '');
    return (this.data.stores || []).find(store => String(store.id) === targetId)
      || null;
  },

  onCallStore(e) {
    const store = this.getStoreById(e.currentTarget.dataset.id);
    storeUtils.makeStorePhoneCall(store);
  },

  onNavigateStore(e) {
    const store = this.getStoreById(e.currentTarget.dataset.id);
    storeUtils.openStoreLocation(store);
  },

  onStoreSelect(e) {
    const storeId = String(e.currentTarget.dataset.id || '');
    const selectedStore = this.getStoreById(storeId);

    if (!selectedStore) {
      wx.showToast({
        title: '未找到门店',
        icon: 'none'
      });
      return;
    }

    if (!selectedStore.isOpen) {
      wx.showToast({
        title: '当前门店休息中，暂不可选',
        icon: 'none'
      });
      return;
    }

    const storeCdtype = selectedStore.cdtype || '';
    console.log('【ziti onStoreSelect】选中门店完整数据:', selectedStore);
    console.log('【ziti onStoreSelect】门店cdtype值:', storeCdtype);

    app.globalData.selectedStoreName = selectedStore.name;
    app.globalData.storeName = selectedStore.name;
    app.globalData.selectedStoreId = storeId;
    app.globalData.selectedStoreCdtype = storeCdtype;
    app.globalData.selected = '自提';
    app.setStoreInfo && app.setStoreInfo(selectedStore);
    wx.setStorageSync('selectedStoreId', storeId);
    wx.setStorageSync('selectedStoreName', selectedStore.name);
    wx.setStorageSync('selectedStoreCdtype', storeCdtype);

    wx.showToast({
      title: `已选择：${selectedStore.name}`,
      icon: 'success',
      duration: 1600
    });

    if (this.data.type === 'order') {
      wx.switchTab({
        url: '/pages/order/order'
      });
      return;
    }

    if (this.data.type === 'jiesuan' || this.data.type === 'jiesuan-now') {
      wx.navigateBack();
    }
  }
});
