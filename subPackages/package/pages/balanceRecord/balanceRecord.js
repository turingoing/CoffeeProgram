const app = getApp();

const TABS = [
  { label: '全部', type: 'all' },
  { label: '收入', type: 'income' },
  { label: '支出', type: 'expense' }
];

const PAGE_CONFIG_MAP = {
  balance: {
    title: '个人余额',
    titleLabel: '个人余额可用',
    canRecharge: true,
    canTransfer: false
  },
  stored: {
    title: '储值卡',
    titleLabel: '储值卡可用',
    canRecharge: true,
    canTransfer: false
  },
  coffee: {
    title: '咖啡券',
    titleLabel: '咖啡券可用',
    canRecharge: false,
    canTransfer: true
  },
  electronic: {
    title: '电子券',
    titleLabel: '电子券可用',
    canRecharge: false,
    canTransfer: false
  }
};

Page({
  data: {
    pageType: '',
    titleLabel: '',
    money: '0.00',
    canRecharge: false,
    canTransfer: false,
    tabs: TABS,
    currentTab: 'all',
    incomeList: [],
    expenseList: [],
    records: [],
    loading: true,
    refresherTriggered: false
  },

  onLoad(options) {
    const type = options && options.type;
    const pageConfig = PAGE_CONFIG_MAP[type];

    if (pageConfig) {
      wx.setNavigationBarTitle({ title: pageConfig.title });
      this.type = type;
      this.setData({
        pageType: type,
        titleLabel: pageConfig.titleLabel,
        canRecharge: pageConfig.canRecharge,
        canTransfer: pageConfig.canTransfer
      });
      return;
    }

    wx.showToast({
      title: '页面参数错误',
      icon: 'none',
      duration: 1500
    });

    setTimeout(() => {
      const pages = getCurrentPages();
      if (pages.length > 1) {
        wx.navigateBack();
        return;
      }
      wx.switchTab({ url: '/pages/home/home' });
    }, 1500);
  },

  onShow() {
    if (!this.type) {
      return;
    }
    this.refreshPage();
  },

  handleTabChange(event) {
    const { type } = event.currentTarget.dataset;
    if (!type || type === this.data.currentTab) {
      return;
    }

    this.setData({ currentTab: type });
    this.updateDisplayRecords(type);
  },

  updateDisplayRecords(tabType) {
    let records = [];
    const { incomeList, expenseList } = this.data;

    if (tabType === 'income') {
      records = incomeList;
    } else if (tabType === 'expense') {
      records = expenseList;
    } else {
      records = [...incomeList, ...expenseList].sort((a, b) => {
        return new Date(b.time).getTime() - new Date(a.time).getTime();
      });
    }

    this.setData({
      records,
      loading: false
    });
  },

  handleListRefresh() {
    if (this.data.refresherTriggered) {
      return;
    }

    this.setData({ refresherTriggered: true });

    this.refreshPage({
      refreshMoney: false,
      showLoading: false,
      stopRefresh: true
    });
  },

  refreshPage(options = {}) {
    const {
      refreshMoney = true,
      showLoading = true,
      stopRefresh = false
    } = options;

    if (showLoading) {
      this.setData({ loading: true });
    }

    if (refreshMoney) {
      this.fetchUserMoney();
    }

    Promise.all([
      this.fetchRecordsRaw('income'),
      this.fetchRecordsRaw('expense')
    ])
      .then(([incomeList, expenseList]) => {
        this.setData({ incomeList, expenseList });
        this.updateDisplayRecords(this.data.currentTab);
      })
      .catch(() => {
        this.setData({ loading: false });
      })
      .finally(() => {
        if (stopRefresh) {
          this.setData({ refresherTriggered: false });
          wx.stopPullDownRefresh();
        }
      });
  },

  fetchRecordsRaw(tabType) {
    return new Promise((resolve) => {
      const userid = wx.getStorageSync('userid') || app.globalData.userid;

      if (!userid) {
        resolve([]);
        return;
      }

      const url = this.getRecordApiUrl(tabType, userid);
      if (!url) {
        resolve([]);
        return;
      }

      wx.request({
        url,
        method: 'GET',
        header: {
          'Content-Type': 'application/json'
        },
        success: (res) => {
          const result = res && res.data ? res.data.result : null;
          const list = Array.isArray(result)
            ? result
            : Array.isArray(result && result.list)
              ? result.list
              : Array.isArray(result && result.goods)
                ? result.goods
                : [];

          const records = list.map((item, index) =>
            this.normalizeRecord(item, index, tabType)
          );
          resolve(records);
        },
        fail: () => {
          resolve([]);
        }
      });
    });
  },

  fetchUserMoney() {
    const itsid = wx.getStorageSync('itsid') || app.globalData.itsid;

    if (!itsid) {
      this.setData({ money: '0.00' });
      return;
    }

    wx.request({
      url: `${app.globalData.AUrl}/jy/go/we.aspx?ituid=106&itjid=10603&itcid=10603&itsid=${itsid}`,
      method: 'GET',
      header: {
        'Content-Type': 'application/json'
      },
      success: (res) => {
        const data = res && res.data ? res.data : {};
        let moneyField = data.money;

        if (this.type === 'stored') {
          moneyField = data.chuzhika;
        }

        if (this.type === 'coffee') {
          moneyField = data.score;
        }

        if (this.type === 'electronic') {
          moneyField = data.dianzi;
        }

        this.setData({ money: this.formatMoney(moneyField) });
      },
      fail: () => {
        this.setData({ money: '0.00' });
      }
    });
  },

  getRecordApiUrl(tabType, userid) {
    const itsid = wx.getStorageSync('itsid') || app.globalData.itsid;
    const baseUrl = app.globalData.AUrl;

    const apiMap = {
      balance: {
        income: `${baseUrl}/jy/go/we.aspx?ituid=106&itjid=10610&itcid=10629&userid=${userid}`,
        expense: `${baseUrl}/jy/go/we.aspx?ituid=106&itjid=0107&itcid=10656&itsid=${itsid}&opid=1210`
      },
      stored: {
        income: `${baseUrl}/jy/go/we.aspx?ituid=106&itjid=10610&itcid=10659&userid=${userid}`,
        expense: `${baseUrl}/jy/go/we.aspx?ituid=106&itjid=0107&itcid=10656&itsid=${itsid}&opid=1211`
      },
      coffee: {
        income: `${baseUrl}/jy/go/we.aspx?ituid=106&itjid=10610&itcid=10630&userid=${userid}`,
        expense: `${baseUrl}/jy/go/we.aspx?ituid=106&itjid=0107&itcid=10656&itsid=${itsid}&opid=1203`
      },
      electronic: {
        income: '',
        expense: `${baseUrl}/jy/go/we.aspx?ituid=106&itjid=0107&itcid=10661&itsid=${itsid}`
      }
    };

    const typeApiMap = apiMap[this.type] || apiMap.balance;
    return typeApiMap[tabType];
  },

  normalizeRecord(item = {}, index, tabType) {
    const amountSource = this.getFirstValidValue([
      item.money,
      item.amount,
      item.price,
      item.changeMoney,
      item.dan,
      item.returnscore,
      item.score,
      item.content,
      item.value,
      item.total,
      0
    ]);

    const amountNumber = this.parseNumber(amountSource);

    return {
      id: item.id || item.orderid || item.logid || `${tabType}-${index}`,
      time: item.time || item.addtime || item.createTime || item.createtime || item.date || '--',
      money: this.buildDisplayAmount(amountNumber, tabType, item),
      recordType: tabType
    };
  },

  buildDisplayAmount(amountNumber, tabType, item = {}) {
    if (!Number.isFinite(amountNumber)) {
      return '0.00';
    }

    const absAmount = Math.abs(amountNumber).toFixed(2);
    if (
      tabType === 'expense' ||
      amountNumber < 0 ||
      item.type === 'expense' ||
      item.direction === 'out'
    ) {
      return `-${absAmount}`;
    }

    return `+${absAmount}`;
  },

  formatMoney(value) {
    const amount = this.parseNumber(value);
    if (!Number.isFinite(amount)) {
      return '0.00';
    }
    return amount.toFixed(2);
  },

  parseNumber(value) {
    if (typeof value === 'string') {
      const matched = value.replace(/,/g, '').match(/-?\d+(\.\d+)?/);
      return matched ? Number(matched[0]) : 0;
    }

    const amount = Number(value);
    return Number.isFinite(amount) ? amount : 0;
  },

  getFirstValidValue(values) {
    for (let i = 0; i < values.length; i += 1) {
      if (values[i] !== undefined && values[i] !== null) {
        return values[i];
      }
    }
    return '';
  },

  goRecharge() {
    if (!this.data.canRecharge) {
      wx.showToast({
        title: '咖啡券暂不支持充值',
        icon: 'none'
      });
      return;
    }

    const scene = this.type === 'stored' ? 'stored' : 'balance';
    wx.navigateTo({
      url: `/subPackages/package/pages/recharge-input/recharge-input?scene=${scene}`
    });
  },

  goTransfer() {
    if (!this.data.canTransfer) {
      return;
    }

    wx.navigateTo({
      url: '/subPackages/package/pages/xiaofeiquan/xiaofeiquan'
    });
  }
});
