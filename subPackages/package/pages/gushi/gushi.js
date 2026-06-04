const app = getApp();
Page({
  data: {
    tupianUrl: app.globalData.tupianUrl
},
onLoad: function() {
  console.log(app.globalData); // 访问全局数据
},
})