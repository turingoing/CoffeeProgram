const app = getApp();

function hasGuestSession() {
  const itsid = String(wx.getStorageSync('itsid') || '');
  const userid = String(wx.getStorageSync('userid') || '');
  return itsid && itsid !== '0' && userid && userid !== '0';
}

function wxLogin() {
  return new Promise((resolve, reject) => {
    wx.login({
      success: (res) => {
        if (res.code) {
          resolve(res.code);
          return;
        }
        reject(new Error('获取登录code失败'));
      },
      fail: () => reject(new Error('获取登录code失败'))
    });
  });
}

function request(options) {
  return new Promise((resolve, reject) => {
    wx.request({
      ...options,
      success: resolve,
      fail: reject
    });
  });
}

function saveGuestSession(userInfoRes) {
  const value = userInfoRes && userInfoRes.data && userInfoRes.data.value;
  if (!value || !value.itsid || !value.userid) {
    throw new Error('获取用户信息失败');
  }

  app.globalData.itsid = value.itsid;
  app.globalData.userid = value.userid;
  wx.setStorageSync('isLoginSuccess', false);
  wx.setStorageSync('itsid', value.itsid);
  wx.setStorageSync('userid', value.userid);

  return {
    itsid: value.itsid,
    userid: value.userid
  };
}

function ensureGuestLogin(options = {}) {
  if (hasGuestSession()) {
    return Promise.resolve({
      itsid: wx.getStorageSync('itsid'),
      userid: wx.getStorageSync('userid')
    });
  }

  return wxLogin()
    .then((code) => request({
      url: `${app.globalData.backUrl}phone.aspx?ituid=${app.globalData.ituid}&mbid=120&code=${code}`
    }))
    .then((openidRes) => {
      const openid = openidRes && openidRes.data && openidRes.data.value && openidRes.data.value.openid;
      if (!openid) {
        throw new Error('获取openid失败');
      }

      return request({
        url: `${app.globalData.backUrl}phone.aspx?mbid=10620&ituid=106`,
        method: 'POST',
        data: {
          openid,
          phone: '',
          invite: options.invite || '',
          type: 0
        }
      });
    })
    .then(() => wxLogin())
    .then((code) => request({
      url: `${app.globalData.backUrl}phone.aspx?mbid=129&ituid=106`,
      data: {
        code
      }
    }))
    .then(saveGuestSession);
}

module.exports = {
  ensureGuestLogin,
  hasGuestSession
};
