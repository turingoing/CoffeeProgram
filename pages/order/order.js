const app = getApp();
const storeUtils = require('../../utils/store');
const guestLogin = require('../../utils/guestLogin');
Page({
  data: {
    sideBarIndex: 0,
    scrollTop: 0,
    contentScrollTarget: '',
    sum: 0,
    totalprice: 0,
    menuReady: false,
    categories: [], // 使用空数组初始化，稍后从服务器加载数据
    selected: '',
    address: '',
    storeName: '',
    selectedStoreIsOpen: true,
    selectedStoreBusinessStatusText: '',
    selectedStoreBusinessTime: '',
    authorized: false, // 是否已授权
    nearbyStores: [], // 附近门店数据
    latitude: '', // 用户纬度
    AUrl: app.globalData.AUrl,
    tupianUrl: app.globalData.tupianUrl,
    isCheckoutSubmitting: false,
    isGuestOrdering: false,
    longitude: '', // 用户经度
    showRecommendationPopup: false, // 控制推荐弹窗的显示
    recommendedStore: null, // 推荐的最近门店
    selectedStoreDistance: '',
    showCartPopup: false, // 控制弹窗显示
    cartItems: [], // 弹窗内购物车数据，与 updataArray 同步
  },

  // 按 id 分组并累加数量
  setCheckoutSubmitting: function (isSubmitting) {
    this._isCheckoutSubmitting = isSubmitting;
    if (this.data.isCheckoutSubmitting !== isSubmitting) {
      this.setData({
        isCheckoutSubmitting: isSubmitting
      });
    }
  },

  setGuestOrdering: function (isOrdering) {
    this._isGuestOrdering = isOrdering;
    if (this.data.isGuestOrdering !== isOrdering) {
      this.setData({
        isGuestOrdering: isOrdering
      });
    }
  },

  groupItemsByQuantity: function (updataArray) {
    return updataArray.reduce((acc, item) => {
      // 若该 id 项不存在，则初始化（初始数量为 0）
      acc[item.id] = acc[item.id] || {
        ...item,
        num: 0
      };
      // 累加相同 id 的商品数量
      acc[item.id].num += item.num;
      return acc;
    }, {});
  },

  syncCategoriesFromUpdataArray: function (updataArray) {
    const groupedItems = this.groupItemsByQuantity(updataArray);
    const newCategories = this.data.categories.map(category => ({
      ...category,
      children: category.children.map(item => ({
        ...item,
        num: groupedItems[item.id]?.num || 0
      }))
    }));

    // 使用全量更新确保触发渲染
    this.setData({
      categories: newCategories
    }, () => {
      this.scheduleMeasureSections();
    });
  },

  scheduleMeasureSections: function () {
    clearTimeout(this._measureSectionTimer);
    this._measureSectionTimer = setTimeout(() => {
      this.measureSectionPositions();
    }, 80);
  },

  measureSectionPositions: function () {
    const currentScrollTop = this._contentScrollTop || 0;
    const query = wx.createSelectorQuery().in(this);
    query.select('.content-scroll-view').boundingClientRect();
    query.selectAll('.menu-section-anchor').boundingClientRect();
    query.exec((res) => {
      const containerRect = res && res[0];
      const sectionRects = (res && res[1]) || [];

      if (!containerRect || !sectionRects.length) {
        this.sectionTops = [];
        return;
      }

      this.sectionTops = sectionRects.map((rect) => Math.max(0, rect.top - containerRect.top + currentScrollTop));
    });
  },

  handleDishImageLoad: function () {
    this.scheduleMeasureSections();
  },

  onContentScroll: function (e) {
    const scrollTop = Number(e.detail.scrollTop || 0);
    this._contentScrollTop = scrollTop;

    const pendingSideBarIndex = this._pendingSideBarIndex;
    if (Number.isFinite(pendingSideBarIndex)) {
      const pendingTargetTop = Number(this.sectionTops && this.sectionTops[pendingSideBarIndex]);
      const reachedPendingTarget = Number.isFinite(pendingTargetTop) && Math.abs(scrollTop - pendingTargetTop) <= 24;
      const pendingTimedOut = Date.now() >= (this._pendingSideBarDeadline || 0);

      if (!reachedPendingTarget && !pendingTimedOut) {
        if (this.data.sideBarIndex !== pendingSideBarIndex) {
          this.setData({
            sideBarIndex: pendingSideBarIndex
          });
        }
        return;
      }

      this._pendingSideBarIndex = null;
      this._pendingSideBarDeadline = 0;
    }

    const sectionTops = this.sectionTops || [];
    if (!sectionTops.length) {
      return;
    }

    const currentOffset = scrollTop + 20;
    let activeIndex = sectionTops.length - 1;

    for (let i = 0; i < sectionTops.length; i += 1) {
      const nextTop = sectionTops[i + 1];
      if (nextTop === undefined || currentOffset < nextTop) {
        activeIndex = i;
        break;
      }
    }

    if (activeIndex !== this.data.sideBarIndex) {
      this.setData({
        sideBarIndex: activeIndex
      });
    }
  },

  onAddressSelected: function (e) {
    if (e.detail.addressDesc && e.detail.door) {
      // 更新页面数据，显示选中的地址
      this.setData({
        address: e.detail.addressDesc + e.detail.door,
        isDelivery: true // 假设您需要设置 isDelivery 为 true
      });
    }
  },
  chooseAddress: function () {
    wx.navigateTo({
      url: '/subPackages/package/pages/chooseLocation/chooseLocation?type=order'
    });
  },

  hasDeliveryAddress: function () {
    return !!String(app.globalData.addressDesc || this.data.address || '').trim();
  },

  navigateToDeliveryAddressPicker: function (type = 'order') {
    app.globalData.selected = '外送';
    this.setData({
      selected: '外送',
      address: app.globalData.addressDesc || ''
    });

    wx.navigateTo({
      url: `/subPackages/package/pages/chooseLocation/chooseLocation?type=${type}`
    });
  },

  formatDistanceText: function (distance) {
    return storeUtils.formatDistanceText(distance);
  },

  normalizeLocationCoordinate: function (value) {
    if (value === null || value === undefined) {
      return NaN;
    }

    if (typeof value === 'string' && !value.trim()) {
      return NaN;
    }

    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : NaN;
  },

  hasUsableUserLocation: function (latitude, longitude) {
    const normalizedLatitude = this.normalizeLocationCoordinate(latitude);
    const normalizedLongitude = this.normalizeLocationCoordinate(longitude);

    if (!Number.isFinite(normalizedLatitude) || !Number.isFinite(normalizedLongitude)) {
      return false;
    }

    if (
      normalizedLatitude < -90 ||
      normalizedLatitude > 90 ||
      normalizedLongitude < -180 ||
      normalizedLongitude > 180
    ) {
      return false;
    }

    if (Math.abs(normalizedLatitude) < 0.000001 && Math.abs(normalizedLongitude) < 0.000001) {
      return false;
    }

    return true;
  },

  clearLocationDisplay: function () {
    this.setData({
      latitude: '',
      longitude: '',
      recommendedStore: null,
      showRecommendationPopup: false
    });
    this.clearSelectedStoreMeta();
  },

  getLocationFailureType: function (err = {}) {
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

  showLocationPermissionModal: function () {
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

  showLocationServiceDisabledModal: function () {
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

  clearSelectedStoreMeta: function () {
    this.setData({
      selectedStoreDistance: '',
      selectedStoreIsOpen: true,
      selectedStoreBusinessStatusText: '',
      selectedStoreBusinessTime: ''
    });
  },

  clearSelectedStoreSelection: function () {
    app.globalData.selectedStoreName = '';
    app.globalData.selectedStoreId = '';
    app.globalData.storeName = '';
    wx.removeStorageSync('selectedStoreId');
    wx.removeStorageSync('selectedStoreName');
    this.setData({
      storeName: ''
    });
    this.clearSelectedStoreMeta();
  },

  applySelectedStoreSelection: function (store, options = {}) {
    if (!store) {
      return;
    }

    const {
      showRecommendationPopup = false,
      markRecommendationShown = false,
      showToast = false
    } = options;

    console.log('【applySelectedStoreSelection】选中门店完整数据:', store);
    console.log('【applySelectedStoreSelection】门店cdtype值:', store ? store.cdtype : 'store为空');

    app.globalData.selectedStoreName = store.name;
    app.globalData.storeName = store.name;
    app.globalData.selectedStoreId = store.id;
    if (store.cdtype) {
      app.globalData.selectedStoreCdtype = store.cdtype;
      wx.setStorageSync('selectedStoreCdtype', store.cdtype);
    }
    app.setStoreInfo && app.setStoreInfo(store);
    wx.setStorageSync('selectedStoreId', store.id);
    wx.setStorageSync('selectedStoreName', store.name);

    this.setData({
      storeName: store.name,
      showRecommendationPopup
    });
    this.applySelectedStoreMeta(store);

    if (markRecommendationShown) {
      wx.setStorageSync('hasShownRecommendationPopup', true);
    }

    if (showToast) {
      wx.showToast({
        title: `已选择自提门店：${store.name}`,
        icon: 'success'
      });
    }
  },

  applySelectedStoreMeta: function (store) {
    if (!store) {
      this.clearSelectedStoreMeta();
      return;
    }

    this.setData({
      selectedStoreDistance: store.distanceText || this.formatDistanceText(store.distance),
      selectedStoreIsOpen: store.isOpen !== false,
      selectedStoreBusinessStatusText: store.businessStatusText || '',
      selectedStoreBusinessTime: store.displayBusinessTime || ''
    });
  },

  showNoOpenStoreModal: function () {
    if (this._hasShownNoOpenStoreModal) {
      return;
    }

    this._hasShownNoOpenStoreModal = true;
    wx.showModal({
      title: '提示',
      content: '你好，当前没有店铺在营业噢',
      showCancel: false
    });
  },

  updateSelectedStoreDistance: function (userLatitude = this.data.latitude, userLongitude = this.data.longitude) {
    const selectedStoreId = String(wx.getStorageSync('selectedStoreId') || app.globalData.selectedStoreId || '');
    const latitude = this.normalizeLocationCoordinate(userLatitude);
    const longitude = this.normalizeLocationCoordinate(userLongitude);

    if (!selectedStoreId || !this.hasUsableUserLocation(latitude, longitude)) {
      this.clearSelectedStoreMeta();
      return;
    }

    const recommendedStore = this.data.recommendedStore;
    if (recommendedStore && String(recommendedStore.id) === selectedStoreId) {
      const enrichedRecommendedStore = storeUtils.enrichStores([recommendedStore], latitude, longitude)[0];
      this.applySelectedStoreMeta(enrichedRecommendedStore);
      return;
    }

    const currentStoreInfo = app.globalData.storeInfo;
    if (currentStoreInfo && String(currentStoreInfo.id) === selectedStoreId) {
      const enrichedCurrentStore = storeUtils.enrichStores([currentStoreInfo], latitude, longitude)[0];
      this.applySelectedStoreMeta(enrichedCurrentStore);
      return;
    }

    const itsid = wx.getStorageSync('itsid');
    if (!itsid) {
      this.clearSelectedStoreMeta();
      return;
    }

    wx.request({
      url: `${app.globalData.AUrl}/jy/go/we.aspx?ituid=106&itjid=10610&itcid=10626&itsid=${itsid}`,
      method: 'GET',
      data: {
        latitude,
        longitude
      },
      success: (res) => {
        const stores = storeUtils.enrichStores(res?.data?.result?.list || [], latitude, longitude);
        const selectedStore = stores.find(store => String(store.id) === selectedStoreId);

        if (!selectedStore) {
          this.clearSelectedStoreMeta();
          return;
        }

        this.applySelectedStoreMeta(selectedStore);
      },
      fail: () => { }
    });
  },

  hasValidLogin: function () {
    const rawLogin = wx.getStorageSync('isLoginSuccess');
    const itsid = String(wx.getStorageSync('itsid') || '');
    const userid = String(wx.getStorageSync('userid') || '');
    return (rawLogin === true || rawLogin === 'true' || rawLogin === 1 || rawLogin === '1') &&
      itsid && itsid !== '0' && userid && userid !== '0';
  },

  promptLoginForOrder: function () {
    wx.showModal({
      title: '提示',
      content: '目前暂未登录，是否跳转登录页面？',
      confirmText: '立即登录',
      cancelText: '取消',
      success(res) {
        if (res.confirm) {
          wx.setStorageSync('loginRedirectUrl', '/pages/order/order');
          wx.navigateTo({
            url: '/subPackages/user/pages/register/register?from=order'
          });
        }
      }
    });
  },

  handleDeliveryClick: function () {
    if (!this.hasValidLogin()) {
      this.promptLoginForOrder();
      return;
    }

    app.globalData.selected = '外送';
    this.setData({
      selected: '外送',
      address: app.globalData.addressDesc || this.data.address || ''
    });

    wx.navigateTo({
      url: '/subPackages/package/pages/chooseLocation/chooseLocation?type=order'
    });
  },

  handleChooseStoreClick: function () {
    wx.navigateTo({
      url: '/subPackages/package/pages/ziti/ziti?type=order'
    });
  },

  selectOption: function (e) {
    const option = e.currentTarget.dataset.option;
    app.globalData.selected = option;
    console.log(option);
    if (option === '外送') {
      this.setData({
        selected: option,
        address: app.globalData.addressDesc || this.data.address || ''
      });
    } else {
      this.setData({
        selected: option,
        storeName: app.globalData.selectedStoreName || app.globalData.storeName || this.data.storeName || ''
      });
    }
  },
  gobackPublish: function () {
    if (this._isCheckoutSubmitting || this._isGuestOrdering) {
      return;
    }
    const page = this;
    const app = getApp();
    const updataArray = wx.getStorageSync('updataArray') || [];
    const unitId = this.data.selected === '自提' ? wx.getStorageSync('selectedStoreId') : '';
    // const unitId = this.data.
    const backUrl = app.globalData.backUrl;
    const resetCheckoutSubmitting = () => {
      this.setCheckoutSubmitting(false);
    };

    // 使用与购物车弹窗一致的合并结果，避免结算数量与购物车不一致
    const cartItems = this.getCartItemsFromUpdataArray(updataArray);

    if (cartItems.length === 0) {
      resetCheckoutSubmitting();
      wx.showToast({
        title: '购物车为空',
        icon: 'none',
        duration: 2000
      });
      return;
    }
    const rawLogin = wx.getStorageSync('isLoginSuccess');
    const itsid = String(wx.getStorageSync('itsid') || '');
    const userid = String(wx.getStorageSync('userid') || '');
    const isLogin = (rawLogin === true || rawLogin === 'true' || rawLogin === 1 || rawLogin === '1') &&
      itsid && itsid !== '0' && userid && userid !== '0';
    const canSelfPickupGuestOrder = this.data.selected === '自提' && guestLogin.hasGuestSession();
    if (!isLogin && !canSelfPickupGuestOrder) {
      if (this.data.selected === '自提') {
        this.setGuestOrdering(true);
        guestLogin.ensureGuestLogin()
          .then(() => {
            this.setGuestOrdering(false);
            this.gobackPublish();
          })
          .catch((err) => {
            console.error('自提免登录失败:', err);
            this.setGuestOrdering(false);
            wx.showToast({
              title: '免登录失败，请重试',
              icon: 'none'
            });
          });
        return;
      }
      resetCheckoutSubmitting();
      wx.navigateTo({ url: '/subPackages/user/pages/register/register?from=order' });
      return;
    }

    if (this.data.selected === '外送' && !this.hasDeliveryAddress()) {
      resetCheckoutSubmitting();
      this._pendingDeliveryCheckoutAfterAddress = true;
      this.navigateToDeliveryAddressPicker('order');
      return;
    }

    if (this.data.selected === '自提' && (!unitId || this.data.storeName === '')) {
      resetCheckoutSubmitting();
      this._pendingPickupCheckoutAfterStoreSelect = true;
      wx.navigateTo({
        url: '/subPackages/package/pages/ziti/ziti?type=order'
      });
      return;
    }

    if (this.data.selected === '自提' && this.data.selectedStoreIsOpen === false) {
      wx.showToast({
        title: '当前门店休息中，请重新选择',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    this._shouldResetCheckoutOnShow = false;
    this.setCheckoutSubmitting(true);
    wx.request({
      url: `${backUrl}phone.aspx?mbid=10639&ituid=106&keyvalue=${unitId}`,
      success(res) {
        console.log("是否营业：", res);
        if (res.data.code == '0') {
          const validCartItems = cartItems.filter(item => item.skuCode);
          if (validCartItems.length !== cartItems.length) {
            resetCheckoutSubmitting();
            wx.showToast({ title: '存在商品规格未就绪，请返回重选后再结算', icon: 'none' });
            return;
          }
          const createOrder = () => new Promise((resolve, reject) => {
            wx.request({
              url: `${backUrl}phone.aspx?mbid=10627&ituid=${app.globalData.ituid}&itsid=${wx.getStorageSync('itsid')}`,
              method: "POST",
              success(r1) {
                console.log('创建订单(10627)返回：', r1?.data);
                resolve(r1);
              },
              fail(err) {
                console.error('创建订单(10627)失败', err);
                reject(err);
              }
            });
          });

          const pushItem = (item) => new Promise((resolve, reject) => {
            wx.request({
              url: `${backUrl}phone.aspx?mbid=10604&ituid=${app.globalData.ituid}&itsid=${wx.getStorageSync('itsid')}`,
              method: "POST",
              data: {
                MCODE: item.skuCode,
                NUM: Number(item.num || 0),
                UNITID: unitId,
                add: item.add || '',
                img: item.image || ''
              },
              success(resp) {
                console.log('添加商品(10604)返回：',
                  '【后台数据】', resp?.data,  // 加“【后台数据】”标注
                  '【商品编码】', item.skuCode,
                  '【数量】', item.num);
                resolve(resp);
              },
              fail(err) {
                reject(err);
              }
            });
          });

          createOrder()
            .then(() => {
              let chain = Promise.resolve();
              validCartItems.forEach(item => {
                chain = chain.then(() => pushItem(item));
              });
              return chain;
            })
            .then(() => {
              wx.navigateTo({
                url: '/subPackages/package/pages/jiesuan/jiesuan',
                success: () => {
                  page._shouldResetCheckoutOnShow = true;
                },
                fail: () => {
                  resetCheckoutSubmitting();
                  wx.showToast({ title: '跳转结算页失败，请重试', icon: 'none' });
                }
              });
            })
            .catch((err) => {
              resetCheckoutSubmitting();
              console.error('提交结算商品失败', err);
              wx.showToast({ title: '提交结算商品失败，请重试', icon: 'none' });
            });
        }
        else {
          resetCheckoutSubmitting();
          console.error('门店营业检查(10639)失败：', res?.data);
          wx.showToast({
            title: res.data.desc,
            icon: 'error',
            mask: true
          })
        }
      }
      , fail(err) {
        resetCheckoutSubmitting();
        console.error('调用10639失败', err);
        wx.showToast({ title: '门店状态接口失败', icon: 'none' });
      }
    })


  },

  onLoad: function (options) {
    const AUrl = app.globalData.AUrl;
    this._hasShownLocationPermissionModal = false;
    this._hasShownLocationServiceModal = false;

    // 【新增】读取并设置当前门店的cdtype
  const currentCdtype = wx.getStorageSync('selectedStoreCdtype') || app.globalData.selectedStoreCdtype || '';
  this.setData({ cdtype: currentCdtype });


    this.checkLocationPermission({
      showAuthPrompt: true,
      showSystemLocationPrompt: true
    });
    this.fetchCategories();
    if (options.selected) {
      this.setData({
        selected: decodeURIComponent(options.selected)
      });
      app.globalData.selected = decodeURIComponent(options.selected);
    }
    if (options.address) {
      this.setData({
        address: decodeURIComponent(options.address),
        totalPrice: this.countTotalPrice()
      });
    }

    // 初始化购物车数据
    const updataArray = wx.getStorageSync('updataArray') || [];
    this.syncCategoriesFromUpdataArray(updataArray);
    this.setData({
      totalprice: this.countTotalPrice()
    });
  },
  onPullDownRefresh() {
    // 用户下拉刷新时，重新拉接口并合并缓存
    this.fetchCategories();
    wx.stopPullDownRefresh();
  },


  // 检查位置权限并获取位置
  checkLocationPermission: function (options = {}) {
    const normalizedOptions = typeof options === 'boolean'
      ? {
        showAuthPrompt: options,
        showSystemLocationPrompt: options
      }
      : options;
    const {
      showAuthPrompt = false,
      showSystemLocationPrompt = false
    } = normalizedOptions;

    wx.getSetting({
      success: (settingRes) => {
        const authSetting = settingRes.authSetting || {};
        if (authSetting['scope.userLocation'] === false) {
          this.setData({
            authorized: false
          });
          this.clearLocationDisplay();
          if (showAuthPrompt) {
            this.showLocationPermissionModal();
          }
          return;
        }

        this.getLocation({
          showAuthPrompt,
          showSystemLocationPrompt
        });
      },
      fail: () => {
        this.getLocation({
          showAuthPrompt,
          showSystemLocationPrompt
        });
      }
    });
  },

  fetchCategories: function () {
    const that = this;
    const AUrl = app.globalData.AUrl;
  
    // 从全局或缓存读取当前选中门店的 cdtype
    const currentCdtype = wx.getStorageSync('selectedStoreCdtype') || app.globalData.selectedStoreCdtype || '';
    console.log('【fetchCategories】当前门店cdtype:', currentCdtype);
  
    // 把 cdtype 拼接到URL上
    let url = `${AUrl}/jy/go/we.aspx?ituid=106&itjid=5035&itcid=5035&id=01`;
    if (currentCdtype) {
      url += `&keyvalue=${currentCdtype}`;
    }
  
    console.log('【fetchCategories】请求URL:', url);
  
    wx.request({
      url: url,
      success(res) {
        console.log("order数据：",res);
        if (res.data.code === '1' && res.data.result) {
          let categories = res.data.result.goods.map(cat => ({
            ...cat,
            children: Array.isArray(cat.children) ? cat.children : []
          }));
  
          const updataArray = wx.getStorageSync('updataArray') || [];
          const groupedItems = that.groupItemsByQuantity(updataArray);
  
          categories = categories.map(cat => ({
            ...cat,
            children: cat.children.map(item => {
              const groupItem = groupedItems[item.id];
              if (groupItem) {
                return {
                  ...item,
                  num: groupItem.num,
                  skuCode: groupItem.skuCode,
                  add: groupItem.add,
                  selectedSize: groupItem.selectedSize,
                  selectedTemperature: groupItem.selectedTemperature,
                  selectedSweetness: groupItem.selectedSweetness,
                };
              } else {
                return {
                  ...item,
                  num: 0
                };
              }
            })
          }));
  
          that.setData({
            categories,
            menuReady: true
          }, () => {
            that.scheduleMeasureSections();
          });
          wx.setStorageSync('categories', categories);
        }
      }
    });
  },
  
  onSideBarChange(e) {
    const value = Number(e.detail.value);
    if (!Number.isFinite(value)) {
      return;
    }

    this._pendingSideBarIndex = value;
    this._pendingSideBarDeadline = Date.now() + 800;

    this.setData({
      sideBarIndex: value,
      scrollTop: 0,
      contentScrollTarget: ''
    }, () => {
      this.setData({
        contentScrollTarget: `category-section-${value}`
      });
    });
  },

  // handelChange(e) {
  //   let tempCategories = this.data.categories;
  //   const { id, dishId } = e.currentTarget.dataset;
  //   tempCategories[id - 1].children[dishId - 1].num = e.detail.value;
  //   let tempCount = 0;
  //   tempCategories[id - 1].children.forEach(item => {
  //     tempCount += parseInt(item.num, 10);
  //   });
  //   tempCategories[id - 1].badgeProps.count = tempCount;
  //   let tempSum = 0;
  //   tempCategories.forEach(item => {
  //     tempSum += parseInt(item.badgeProps.count, 10);
  //   });
  //   this.setData({
  //     categories: tempCategories,
  //     sum: tempSum
  //   });
  // },

  navigateToDianDan: function (e) {
    if (!wx.getStorageSync('isLoginSuccess')) {
      // wx.navigateTo({
      //   url: '/subPackages/user/pages/register/register',
      // })
      //return
      // wx.setStorageSync('itsid','[WXA]abc');
    }
    console.log(e);
    const dishId = e.currentTarget.dataset.dishid;
    const dish = this.data.categories.reduce((acc, category) => {
      if (category && category.children) {
        return acc || category.children.find(d => d.id === dishId);
      }
      return acc;
    }, null);

    if (dish) {
      const app = getApp();
      app.globalData.selectedDishName = dish.name;

      // 拼接完整的图片URL
      const fullImageURL = `${app.globalData.AUrl}/jy/wxUserImg/106/${dish.image}`;

      // 跳转到详情页，并传递完整的图片URL
      wx.navigateTo({
        url: `/subPackages/package/pages/diandan/diandan?image=${encodeURIComponent(fullImageURL)}&index1=${e.currentTarget.dataset.index1}&index2=${e.currentTarget.dataset.index2}&dishId=${dishId}`
      });
    } else {
      console.error('未找到对应的菜品信息');
      wx.showToast({
        title: '未找到菜品信息',
        icon: 'none',
        duration: 2000
      });
    }
  },




  onReady() { },

  onShow: function () {
    if (this._shouldResetCheckoutOnShow) {
      this._shouldResetCheckoutOnShow = false;
      this.setCheckoutSubmitting(false);
    }
    const isFirstShowAfterLoad = !this._hasShownOrderPageOnce;
    this._hasShownOrderPageOnce = true;
    this._hasShownLocationPermissionModal = false;
    this._hasShownLocationServiceModal = false;
    this._hasShownNoOpenStoreModal = false;
    const forceStoreSelect = app.globalData.forceStoreSelectOnOrder === true;
    if (forceStoreSelect) {
      app.globalData.forceStoreSelectOnOrder = false;
      app.globalData.selectedStoreName = '';
      app.globalData.storeName = '';
      wx.removeStorageSync('selectedStoreId');
      wx.removeStorageSync('selectedStoreName');
      wx.removeStorageSync('hasShownRecommendationPopup');
    }
    const categories = wx.getStorageSync('categories') || [];
    const updataArray = wx.getStorageSync('updataArray') || [];
    const cartItems = this.getCartItemsFromUpdataArray(updataArray);
    this.syncCategoriesFromUpdataArray(updataArray);
    const sum = wx.getStorageSync('sum') || 0;
    const totalprice = wx.getStorageSync('total') || 0; // 这里改名成 totalprice
    this.setData({
      categories,
      menuReady: categories.length > 0,
      totalprice: this.countTotalPrice(),
      sum: updataArray.reduce((sum, item) => sum + item.num, 0),
      cartItems,
      showCartPopup: false
    });
    if (!isFirstShowAfterLoad || forceStoreSelect) {
      this.clearLocationDisplay();
      this.checkLocationPermission({
        showAuthPrompt: false,
        showSystemLocationPrompt: true
      });
    }
    this.fetchCategories();
    this.setData({
      categories,
      menuReady: categories.length > 0
    }, () => {
      this.setData({
        totalprice: this.countTotalPrice()
      });
      this.scheduleMeasureSections();
    });

    const selectedDishName = app.globalData.selectedDishName;
    console.log('选中的菜品名称:', selectedDishName);
    this.setData({
      selectedDishName: selectedDishName
    });


    // 确保此处没有拼写错误
    this.setData({
      selected: app.globalData.selected,
      address: app.globalData.addressDesc,
      storeName: app.globalData.selectedStoreName || '',
      totalprice: this.countTotalPrice() // 使用函数计算
    }, () => {
      this.updateSelectedStoreDistance();

      if (this._pendingDeliveryCheckoutAfterAddress) {
        const shouldContinueCheckout = this.data.selected === '外送' && this.hasDeliveryAddress();
        this._pendingDeliveryCheckoutAfterAddress = false;
        if (shouldContinueCheckout) {
          this.gobackPublish();
        }
        return;
      }

      if (this._pendingPickupCheckoutAfterStoreSelect) {
        const shouldContinueCheckout = this.data.selected === '自提'
          && !!String(wx.getStorageSync('selectedStoreId') || '').trim()
          && !!String(this.data.storeName || '').trim();
        this._pendingPickupCheckoutAfterStoreSelect = false;
        if (shouldContinueCheckout) {
          this.gobackPublish();
        }
      }
    });
  },

  //   const tabBar = this.getTabBar();
  //   if (typeof tabBar.setData === 'function' && tabBar) {
  //     tabBar.setData({
  //       active: 1
  //     });
  //   }

  // getLocation: function () {
  //   const that = this;
  //   const hasShownRecommendationPopup = wx.getStorageSync('hasShownRecommendationPopup');
  //   const selectedStoreName = app.globalData.selectedStoreName;

  //   if (hasShownRecommendationPopup || selectedStoreName) {
  //     console.log("用户已看过推荐弹窗或选择过门店，不再获取位置");
  //     return;
  //   }

  //   wx.getSetting({
  //     success(settingdata) {
  //       if (!settingdata.authSetting['scope.userLocation']) {
  //         // 用户未授权，提示用户并引导授权
  //         wx.authorize({
  //           scope: 'scope.userLocation',
  //           success() {
  //             that._getLocation();
  //           },
  //           fail() {
  //             wx.showToast({
  //               title: '需要授权位置信息',
  //               icon: 'none'
  //             });
  //           }
  //         });
  //       } else {
  //         that._getLocation();
  //       }
  //     }
  //   });
  // },
  // 获取用户位置
  getLocation: function (options = {}) {
    const that = this;
    wx.getLocation({
      type: 'wgs84', // 返回可以用于地图的经纬度
      success(res) {
        const {
          latitude,
          longitude
        } = res;
        const normalizedLatitude = that.normalizeLocationCoordinate(latitude);
        const normalizedLongitude = that.normalizeLocationCoordinate(longitude);

        if (!that.hasUsableUserLocation(normalizedLatitude, normalizedLongitude)) {
          console.warn('获取到无效定位坐标:', res);
          that.setData({
            authorized: false
          });
          that.clearLocationDisplay();
          if (options.showSystemLocationPrompt) {
            that.showLocationServiceDisabledModal();
          }
          return;
        }
        console.log("获取到用户位置：", latitude, longitude);
        that.setData({
          authorized: true,
          latitude: normalizedLatitude,
          longitude: normalizedLongitude
        });
        that.getNearbyStores(latitude, longitude); // 调用获取附近门店
        that.updateSelectedStoreDistance(normalizedLatitude, normalizedLongitude);
      },
      fail(err) {
        console.error("获取位置失败：", err);
        that.setData({
          authorized: false
        });
        that.clearLocationDisplay();

        const failureType = that.getLocationFailureType(err);
        if (failureType === 'authDenied') {
          if (options.showAuthPrompt) {
            that.showLocationPermissionModal();
          }
          return;
        }

        if (failureType === 'serviceDisabled') {
          if (options.showSystemLocationPrompt) {
            that.showLocationServiceDisabledModal();
          }
          return;
        }

        if (options.showSystemLocationPrompt) {
          that.showLocationServiceDisabledModal();
        }
      }
    });
  },

  // /**
  //  * 实际获取位置的逻辑
  //  */
  // _getLocation: function () {
  //   const that = this;
  //   wx.getLocation({
  //     type: 'wgs84', // 返回可以用于地图的经纬度
  //     success(res) {
  //       const {
  //         latitude,
  //         longitude
  //       } = res;
  //       console.log("获取到用户位置：", latitude, longitude);
  //       that.setData({
  //         latitude: latitude,
  //         longitude: longitude
  //       });

  //       // 调用后端接口获取附近门店
  //       that.getNearbyStores(latitude, longitude);
  //     },
  //     fail(err) {
  //       console.error("获取位置失败：", err);
  //       if (err.errMsg === 'getLocation:fail auth deny') {
  //         wx.showToast({
  //           title: '用户拒绝授权位置信息',
  //           icon: 'none'
  //         });
  //       } else {
  //         wx.showToast({
  //           title: '获取位置失败，请检查网络',
  //           icon: 'none'
  //         });
  //       }
  //     }
  //   });
  // },

  // // 获取附近门店1111111
  // getNearbyStores: function (latitude, longitude) {
  //   const that = this;
  //   const itsid = wx.getStorageSync('itsid'); // 从本地存储获取 itsid

  //   wx.request({
  //     url: `https://www.ruanzi.net/jy/go/we.aspx?ituid=106&itjid=10610&itcid=10610&itsid= ${itsid}`,
  //     method: 'GET',
  //     data: {
  //       latitude: latitude,
  //       longitude: longitude
  //     },
  //     success(res) {
  //       if (res.data.code === '1' && res.data.result) {
  //         const stores = res.data.result.list; // 获取接口返回的门店数据
  //         const nearbyStores = that.calculateNearbyStores(latitude, longitude, stores); // 筛选附近门店
  //         console.log("附近门店数据：", nearbyStores); // 调试信息
  //         that.setData({
  //           nearbyStores // 更新页面数据
  //         });
  //       } else {
  //         wx.showToast({
  //           title: '未找到附近门店',
  //           icon: 'none'
  //         });
  //       }
  //     },
  //     fail(err) {
  //       console.error("请求失败:", err);
  //       wx.showToast({
  //         title: '请求失败，请检查网络',
  //         icon: 'none'
  //       });
  //     }
  //   });
  // },
  getNearbyStores: function (latitude, longitude) {
    const that = this;
    if (!this.hasUsableUserLocation(latitude, longitude)) {
      this.clearLocationDisplay();
      return;
    }

    const hasShownRecommendationPopup = wx.getStorageSync('hasShownRecommendationPopup');
    const itsidValue = wx.getStorageSync('itsid');

    wx.request({
      url: `${app.globalData.AUrl}/jy/go/we.aspx?ituid=106&itjid=10610&itcid=10626&itsid=${itsidValue}`,
      method: 'GET',
      data: {
        latitude: latitude,
        longitude: longitude
      },
      success(res) {
        console.log("首次进入点单页面:",res);
        if (res.data.code === '1' && res.data.result) {
          const stores = storeUtils.enrichStores(res.data.result.list || [], latitude, longitude);
          console.log('【getNearbyStores】所有门店数据(含cdtype):', stores.map(s => ({ id: s.id, name: s.name, add: s.add, cdtype: s.cdtype, distanceText: s.distanceText })));
          const selectedStoreId = String(wx.getStorageSync('selectedStoreId') || app.globalData.selectedStoreId || '');
          const selectedStore = stores.find(store => String(store.id) === selectedStoreId);
          const openStores = stores.filter(store => store.isOpen);
          const shouldForceRecommend = !!selectedStore && !selectedStore.isOpen;

          that.setData({
            nearbyStores: stores
          });

          if (selectedStore && selectedStore.isOpen) {
            that.setData({
              storeName: selectedStore.name || that.data.storeName
            });
            that.applySelectedStoreMeta(selectedStore);
            return;
          }

          if (selectedStore && !selectedStore.isOpen) {
            that.clearSelectedStoreSelection();
          }

          if (!openStores.length) {
            that.setData({
              recommendedStore: null,
              showRecommendationPopup: false
            });
            that.showNoOpenStoreModal();
            return;
          }

          const nearestStore = that.findNearestStore(latitude, longitude, openStores);
          console.log('【getNearbyStores】推荐的最近门店(含cdtype):', nearestStore ? { id: nearestStore.id, name: nearestStore.name, add: nearestStore.add, cdtype: nearestStore.cdtype, distanceText: nearestStore.distanceText } : null);
          if (!nearestStore) {
            that.showNoOpenStoreModal();
            return;
          }

          // 首次进入且还没有已选门店时，先让用户在推荐弹窗里确认，而不是直接静默选店
          if (!selectedStore && !shouldForceRecommend) {
            if (hasShownRecommendationPopup) {
              return;
            }

            that.setData({
              recommendedStore: nearestStore,
              showRecommendationPopup: true
            });
            return;
          }

          if (hasShownRecommendationPopup && !shouldForceRecommend) {
            return;
          }

          that.setData({
            recommendedStore: nearestStore,
            showRecommendationPopup: true
          });
          return;
        }

        wx.showToast({
          title: '未找到附近门店',
          icon: 'none'
        });
      },
      fail(err) {
        console.error('请求失败:', err);
        wx.showToast({
          title: '请求失败，请检查网络',
          icon: 'none'
        });
      }
    });
    return;
    const selectedStoreName = app.globalData.selectedStoreName;

    if (hasShownRecommendationPopup || selectedStoreName) {
      console.log("用户已看过推荐弹窗或选择过门店，不再查询附近门店");
      return;
    }
    const AUrl = app.globalData.AUrl;
    const itsid = wx.getStorageSync('itsid'); // 从本地存储获取 itsid

    wx.request({
      url: `${app.globalData.AUrl}/jy/go/we.aspx?ituid=106&itjid=10610&itcid=10626&itsid=${itsid}`,
      method: 'GET',
      data: {
        latitude: latitude,
        longitude: longitude
      },
      success(res) {
        if (res.data.code === '1' && res.data.result) {
          const stores = res.data.result.list; // 获取接口返回的门店数据
          const nearestStore = that.findNearestStore(latitude, longitude, stores); // 找到最近的门店
          console.log(nearestStore);
          // 设置推荐的门店并显示弹窗
          that.setData({
            storeName: nearestStore.name,
            recommendedStore: nearestStore, // 设置推荐的门店
            showRecommendationPopup: true // 显示弹窗
          });
          app.globalData.selectedStoreName = nearestStore.name
          wx.setStorageSync('selectedStoreId', nearestStore.id)
          console.log("最近的门店数据：", nearestStore); // 调试信息
        } else {
          wx.showToast({
            title: '未找到附近门店',
            icon: 'none'
          });
        }
      },
      fail(err) {
        console.error("请求失败:", err);
        wx.showToast({
          title: '请求失败，请检查网络',
          icon: 'none'
        });
      }
    });
  },
  findNearestStore: function (latitude, longitude, stores) {
    return storeUtils.findNearestStore(latitude, longitude, stores);
    console.log(latitude, longitude, stores);
    const R = 6371; // 地球半径（单位：公里）
    let nearestStore = null;
    let minDistance = Infinity;

    stores.forEach(store => {
      const storeLatitude = parseFloat(store.latitude);
      const storeLongitude = parseFloat(store.longitude);
      const distance = this.calculateDistance(latitude, longitude, storeLongitude, storeLatitude);

      if (distance < minDistance) {
        minDistance = distance;
        nearestStore = {
          ...store,
          distance: distance.toFixed(2) // 保留两位小数
        };
      }
    });

    return nearestStore;
  },
  // 计算附近门店
  calculateNearbyStores: function (latitude, longitude, stores) {
    const nearbyStores = [];
    const R = 6371; // 地球半径（单位：公里）

    stores.forEach(store => {
      const storeLatitude = parseFloat(store.latitude);
      const storeLongitude = parseFloat(store.longitude);
      const distance = this.calculateDistance(latitude, longitude, storeLongitude, storeLatitude);

      if (distance <= 10) { // 筛选10公里内的门店
        nearbyStores.push({
          ...store,
          distance: distance.toFixed(2) // 保留两位小数
        });
      }
    });

    return nearbyStores;
  },

  // Haversine 公式计算距离
  rad(d) {
    return d * Math.PI / 180.0
  },
  calculateDistance: function (lat1, lng1, lat2, lng2) {
    return storeUtils.calculateDistance(lat1, lng1, lat2, lng2);
    console.log(lat1, lng1, lat2, lng2);
    // const R = 6371; // 地球半径（单位：公里）
    // const dLat = (lat2 - lat1) * Math.PI / 180;
    // const dLon = (lon2 - lon1) * Math.PI / 180;
    // const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    //   Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    //   Math.sin(dLon / 2) * Math.sin(dLon / 2);
    // const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    // return R * c; // 返回距离（单位：公里）
    var radLat1 = this.rad(lat1);
    var radLat2 = this.rad(lat2);
    var a = radLat1 - radLat2;
    var b = this.rad(lng1) - this.rad(lng2);
    var s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2) + Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)));
    s = s * 6378.137; // EARTH_RADIUS;
    s = Math.round(s * 10000) / 10000; //输出为公里
    var distance = s;
    var distance_str = "";
    if (parseInt(distance) >= 1) {
      distance_str = distance.toFixed(1) + "km";
    } else {
      distance_str = distance * 1000 + "m";
    }
    console.info('距离是', s);
    console.info('距离是', distance_str);
    return s;
  },
  navigateToStore: function () {
    const {
      recommendedStore
    } = this.data;
    if (!recommendedStore) {
      wx.showToast({
        title: '未找到推荐门店',
        icon: 'none'
      });
      return;
    }

    // 调起微信导航
    storeUtils.openStoreLocation(recommendedStore);
    return;
    wx.openLocation({
      latitude: parseFloat(recommendedStore.longitude),
      longitude: parseFloat(recommendedStore.latitude),
      name: recommendedStore.name,
      address: recommendedStore.add,
      success: function () {
        console.log('导航成功');
      },
      fail: function (err) {
        console.error('导航失败:', err);
        wx.showToast({
          title: '导航失败',
          icon: 'none'
        });
      }
    });
  },


  // 选择推荐的门店
  selectRecommendedStore: function () {
    const recommendedStoreCurrent = this.data.recommendedStore;
    console.log('【selectRecommendedStore】弹窗确认选择的门店(含cdtype):', recommendedStoreCurrent ? { id: recommendedStoreCurrent.id, name: recommendedStoreCurrent.name, add: recommendedStoreCurrent.add, cdtype: recommendedStoreCurrent.cdtype } : null);
    if (!recommendedStoreCurrent || recommendedStoreCurrent.isOpen === false) {
      wx.showToast({
        title: '当前门店休息中，请选择其他门店',
        icon: 'none'
      });
      return;
    }

    this.applySelectedStoreSelection(recommendedStoreCurrent, {
      showRecommendationPopup: false,
      markRecommendationShown: true
    });
    this.setData({
      menuReady: false
    });
    this.fetchCategories();
    wx.showToast({
      title: `已选择自提门店：${recommendedStoreCurrent.name}`,
      icon: 'success'
    });
    return;

    // 更新全局变量
    app.globalData.selectedStoreName = recommendedStore.name;
    app.globalData.selectedStoreId = recommendedStore.id;

    // 更新页面数据
    this.setData({
      storeName: recommendedStore.name, // 同步门店名称
      selectedStoreDistance: this.formatDistanceText(recommendedStore.distance),
      showRecommendationPopup: false // 关闭弹窗
    });

    // 设置标志，表示已经显示过推荐弹窗
    wx.setStorageSync('hasShownRecommendationPopup', true);

    wx.showToast({
      title: `已选择自提门店：${recommendedStore.name}`,
      icon: 'success'
    });
  },

  closeRecommendationPopup: function () {
    this.setData({
      showRecommendationPopup: false
    });

    // 设置标志，表示已经显示过推荐弹窗
    wx.setStorageSync('hasShownRecommendationPopup', true);
  },



  // 点击购物袋图片时调用
  toggleCartPopup: function () {
    const updataArray = wx.getStorageSync('updataArray') || [];
    const cartItems = this.getCartItemsFromUpdataArray(updataArray); // 使用 updataArray 提取数据
    if (!cartItems.length) {
      this.setData({
        cartItems: [],
        totalprice: this.countTotalPrice(),
        showCartPopup: false
      });
      return;
    }
    this.setData({
      cartItems,
      totalprice: this.countTotalPrice(),
      showCartPopup: !this.data.showCartPopup
    });
  },
  stopPropagation() { },
  // 新增方法：从categories提取购物车数据
  getCartItemsFromUpdataArray: function (updataArray) {
    const map = new Map();
    (updataArray || [])
      .filter(item => Number(item.num) > 0)
      .forEach(item => {
        const key = `${item.skuCode ? `sku:${item.skuCode}` : `id:${item.id}`}|${JSON.stringify(item.specs || {})}`;
        const existing = map.get(key);
        if (existing) {
          map.set(key, {
            ...existing,
            ...item,
            num: Number(existing.num || 0) + Number(item.num || 0),
            specs: item.specs || existing.specs || {}
          });
        } else {
          map.set(key, {
            ...item,
            specs: item.specs || {}
          });
        }
      });
    return Array.from(map.values());
  },

  // 关闭弹窗
  // countTotalPrice: function (categories) {
  //   return (categories || this.data.categories)
  //     .flatMap(category => category.children || [])
  //     .reduce((total, item) => {
  //       const num = Number(item.num) || 0;
  //       const price = Number(item.price) || 0;
  //       return total + (num * price);
  //     }, 0)
  //     .toFixed(2);
  // },
  // 增加商品数量
  // 增加数量（购物车与分类页面同时更新）
  onIncrease: function (e) {
    const skuCode = e.currentTarget.dataset.skucode;
    const updataArray = wx.getStorageSync('updataArray') || [];
    // 根据 skuCode 查找该商品记录的索引
    const itemIndex = updataArray.findIndex(item => item.skuCode === skuCode);
    if (itemIndex !== -1) {
      // 更新该 skuCode 对应的商品数量
      updataArray[itemIndex] = {
        ...updataArray[itemIndex],
        num: updataArray[itemIndex].num + 1
      };
      // 同步更新分类页面（分组求和）
      this.syncCategoriesFromUpdataArray(updataArray);
      // 更新缓存、购物车弹窗数据、总价和总数
      this.syncCartData(updataArray);
      this.setData({
        cartItems: this.getCartItemsFromUpdataArray(updataArray)
      });
    }
  },

  // 减少数量
  // 减少数量（集成 wx.showModal 原生弹窗）
onDecrease: function (e) {
  const skuCode = e.currentTarget.dataset.skucode;
  const updataArray = wx.getStorageSync('updataArray') || [];
  const itemIndex = updataArray.findIndex(item => item.skuCode === skuCode);
  
  if (itemIndex !== -1) {
    const currentNum = updataArray[itemIndex].num;

    // 核心逻辑
    if (currentNum === 1) {
      // 数量为 1，弹出原生确认框
      const that = this;
      wx.showModal({
        title: '提示',
        content: '确定不要了吗？',
        confirmColor: '#CDAEF2', // 确认按钮颜色（和你主题色一致）
        success (res) {
          if (res.confirm) {
            // 用户点击了「确定」，执行删除
            let newArray = updataArray.filter(item => item.skuCode !== skuCode);
            that.syncCategoriesFromUpdataArray(newArray);
            that.syncCartData(newArray);
            that.setData({
              cartItems: that.getCartItemsFromUpdataArray(newArray)
            });
          } else if (res.cancel) {
            // 用户点击了「取消」，什么都不做
            console.log('用户取消删除');
          }
        }
      })
    } else {
      // 数量 > 1，直接减 1
      updataArray[itemIndex] = {
        ...updataArray[itemIndex],
        num: currentNum - 1
      };
      this.syncCategoriesFromUpdataArray(updataArray);
      this.syncCartData(updataArray);
      this.setData({
        cartItems: this.getCartItemsFromUpdataArray(updataArray)
      });
    }
  }
},

  // 同步购物车数据和缓存
  syncCartData: function (updataArray) {
    // 去重：同 sku + 同规格 只保留一条
    const deduped = (updataArray || []).reduce((acc, it) => {
      const key = `${it.skuCode ? `sku:${it.skuCode}` : `id:${it.id}`}|${JSON.stringify(it.specs || {})}`;
      const prev = acc.map[key];
      acc.map[key] = prev
        ? { ...prev, ...it, num: Number(prev.num || 0) + Number(it.num || 0) }
        : { ...it };
      return acc;
    }, { map: {} });
    const merged = Object.values(deduped.map);
    // 更新缓存
    wx.setStorageSync('updataArray', merged);
    const sum = merged.reduce((sum, item) => sum + (item.num || 0), 0);
    wx.setStorageSync('sum', sum);
    const total = this.countTotalPrice();
    wx.setStorageSync('total', total);

    // 同步更新视图，包括购物车弹窗的数据（cartItems）和其他显示数据
    this.setData({
      sum: sum,
      totalprice: total,
      showCartPopup: sum > 0 ? this.data.showCartPopup : false,
      // 重新计算购物车内具体的 item 数组
      cartItems: this.getCartItemsFromUpdataArray(merged)
    });

    // 同步更新分类页面数据
    this.syncCategoriesFromUpdataArray(merged);
  },

  // 更新 updataArray
  updateUpdataArray: function (cartItems) {
    const updataArray = wx.getStorageSync('updataArray') || [];
    cartItems.forEach(item => {
      // 同时比较 id 和 skuCode，确保相同 id 但不同 skuCode 的商品不会被覆盖
      const existingIndex = updataArray.findIndex(upItem =>
        upItem.id === item.id && upItem.skuCode === item.skuCode
      );
      if (existingIndex !== -1) {
        updataArray[existingIndex] = item; // 更新现有项
      } else {
        updataArray.push(item); // 添加新项
      }
    });
    return updataArray;
  },



  // 总价计算方法
  countTotalPrice: function () {
    const updataArray = wx.getStorageSync('updataArray') || [];
    let totalPrice = 0;

    updataArray.forEach(item => {
      const num = Number(item.num) || 0;
      const price = Number(item.price) || 0;
      totalPrice += num * price;
    });

    return totalPrice.toFixed(2); // 返回格式化后的总价
  },
  // 点击商品图片跳转到详情页，详情页可修改所选杯型、温度和甜度等信息
  // navigateToDetail: function (e) {
  //   const id = e.currentTarget.dataset.id;
  //   const selectedSize = e.currentTarget.dataset.size;
  //   const selectedTemperature = e.currentTarget.dataset.temperature;
  //   const selectedSweetness = e.currentTarget.dataset.sweetness;
  //   const image = e.currentTarget.dataset.image;
  //   const index1 = e.currentTarget.dataset.index1;
  //   const index2 = e.currentTarget.dataset.index2;
  //   const fullImageURL = `https://www.ruanzi.net/jy/wxUserImg/106/ ${image}`

  //   console.log('传递的 index1:', index1);
  //   console.log('传递的 index2:', index2);

  //   wx.navigateTo({
  //     url: `/subPackages/package/pages/diandan/diandan?dishId=${id}&image=${encodeURIComponent( fullImageURL)}&selectedSize=${selectedSize}&selectedTemperature=${selectedTemperature}&selectedSweetness=${selectedSweetness}&index1=${index1}&index2=${index2}`
  //   });
  // },
  onHide() { },

  onUnload() { },

  onPullDownRefresh() { },

  onReachBottom() { },

  onShareAppMessage() { }
});
