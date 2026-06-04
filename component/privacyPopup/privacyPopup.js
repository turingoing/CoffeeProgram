// component/privacyPopup/privacyPopup.js
const app = getApp()
Component({

  /**
   * 组件的属性列表
   */
  properties: {

  },

  /**
   * 组件的初始数据
   */
  data: {
    innerShow: false,
  },

  // 组件生命周期
  lifetimes: {
    // 在组件实例进入页面节点树时执行
    attached: function () {
      if (wx.getPrivacySetting) {
        wx.getPrivacySetting({
          success: res => {
            console.log("getPrivacySetting:", res);
            console.log("是否需要授权：", res.needAuthorization, "隐私协议的名称为：", res.privacyContractName)
            if (res.needAuthorization) {
              this.popUp()
            } else {
              this.triggerEvent("agree")
            }
          },
          fail: (error) => {
            console.error('getPrivacySetting fail:', error);
            this.popUp();
          },
          complete: () => { },
        })
      } else {
        // 低版本基础库不支持 wx.getPrivacySetting 接口，隐私接口可以直接调用
        this.triggerEvent("agree")
      }
    },
    detached: function () {
      // 在组件实例被从页面节点树移除时执行
    },
  },

  // 组件所在页面的生命周期
  pageLifetimes: {
    show: function () {
      // 页面被展示
    },
    hide: function () {
      // 页面被隐藏
    },
    resize: function (size) {
      // 页面尺寸变化
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    // 拒绝按钮
    handleDisagree(e) {
      this.triggerEvent("disagree")
      this.disPopUp()
    },

    // 同意按钮
    handleAgree(e) {
      // 用户同意隐私协议事件回调
      // 用户点击了同意，之后所有已声明过的隐私接口和组件都可以调用了
      this.triggerEvent("agree")
      this.disPopUp()
    },

    // 关闭弹窗
    disPopUp() {
      if (this.data.innerShow === true) {
        this.setData({
          innerShow: false
        })
      }
    },

    // 打开弹窗
    popUp() {
      if (this.data.innerShow === false) {
        this.setData({
          innerShow: true
        })
      }
    },

    // 查看隐私协议详情
    viewPrivacyDetail() {
      // wx.navigateTo({
      //   url: '/subPackages/package/pages/xieyi/xieyi?agreement=privacy'
      // });
      wx.openPrivacyContract({
        success: res => {
          console.log('openPrivacyContract success')
        },
        fail: res => {
          console.error('openPrivacyContract fail', res)
        }
      })
    },

    // 查看用户协议详情
    viewUserAgreement() {
      wx.navigateTo({
        url: '/subPackages/package/pages/xieyi/xieyi?agreement=user'
      });
    },
  }
})
