const app = getApp();

const NOTICE_LIST_ID_KEYS = [
  'id',
  'noticeId',
  'notice_id',
  'newsId',
  'articleId',
  'contentId'
];

const NOTICE_LIST_TITLE_KEYS = ['title', 'noticeTitle', 'newsTitle', 'name'];

const NOTICE_LIST_TIME_KEYS = [
  'publishTime',
  'publish_time',
  'releaseTime',
  'release_time',
  'addtime',
  'createTime',
  'createdAt',
  'time'
];

const NOTICE_LIST_IMAGE_KEYS = [
  'coverImage',
  'cover',
  'image',
  'img',
  'pic',
  'thumb',
  'thumbnail',
  'banner'
];

const NOTICE_LIST_SUMMARY_KEYS = [
  'summary',
  'subtitle',
  'subTitle',
  'desc',
  'description',
  'brief',
  'remark',
  'intro'
];

const PAGE_TITLE = '\u516c\u544a';
const EMPTY_TEXT = '\u6682\u65e0\u516c\u544a';
const MORE_TEXT = '\u67e5\u770b\u8be6\u60c5';
const FINISHED_TEXT = '\u6ca1\u6709\u66f4\u591a\u4e86';
const LOADING_TEXT = '\u52a0\u8f7d\u4e2d';
const LOAD_FAILED_TEXT = '\u516c\u544a\u52a0\u8f7d\u5931\u8d25';
const DEFAULT_TITLE = '\u516c\u544a\u6807\u9898';

function normalizeText(value) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value).trim();
}

function pickFirst(source = {}, keys = []) {
  for (const key of keys) {
    const value = source[key];

    if (value === null || value === undefined) {
      continue;
    }

    if (typeof value === 'string' && !value.trim()) {
      continue;
    }

    return value;
  }

  return '';
}

function padNumber(value) {
  return String(value).padStart(2, '0');
}

function formatPublishTime(value) {
  const rawValue = normalizeText(value);

  if (!rawValue) {
    return '';
  }

  if (/^\d{10,13}$/.test(rawValue)) {
    const timestamp = rawValue.length === 10 ? Number(rawValue) * 1000 : Number(rawValue);
    const date = new Date(timestamp);

    if (!Number.isNaN(date.getTime())) {
      return `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(date.getDate())} ${padNumber(date.getHours())}:${padNumber(date.getMinutes())}:${padNumber(date.getSeconds())}`;
    }
  }

  const parsedDate = new Date(rawValue.replace(/-/g, '/'));

  if (!Number.isNaN(parsedDate.getTime())) {
    return `${parsedDate.getFullYear()}-${padNumber(parsedDate.getMonth() + 1)}-${padNumber(parsedDate.getDate())} ${padNumber(parsedDate.getHours())}:${padNumber(parsedDate.getMinutes())}:${padNumber(parsedDate.getSeconds())}`;
  }

  return rawValue;
}

function isPlainObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function looksLikeNoticeItem(value = {}) {
  if (!isPlainObject(value)) {
    return false;
  }

  const candidateKeys = [
    ...NOTICE_LIST_ID_KEYS,
    ...NOTICE_LIST_TITLE_KEYS,
    ...NOTICE_LIST_IMAGE_KEYS,
    ...NOTICE_LIST_SUMMARY_KEYS,
    ...NOTICE_LIST_TIME_KEYS
  ];

  return candidateKeys.some((key) => normalizeText(value[key]));
}

function extractListPayload(responseData = {}) {
  const arrayCandidates = [
    responseData?.result?.list,
    responseData?.result?.rows,
    responseData?.result?.records,
    responseData?.data?.list,
    responseData?.data?.rows,
    responseData?.data?.records,
    responseData?.list,
    responseData?.rows,
    responseData?.records,
    Array.isArray(responseData?.result) ? responseData.result : null,
    Array.isArray(responseData?.data) ? responseData.data : null,
    Array.isArray(responseData) ? responseData : null
  ];

  const matchedArray = arrayCandidates.find(Array.isArray);

  if (matchedArray) {
    return matchedArray;
  }

  const objectCandidates = [
    responseData?.result?.detail,
    responseData?.result?.data,
    responseData?.result?.info,
    responseData?.data?.detail,
    responseData?.data?.data,
    responseData?.data?.info,
    responseData?.result,
    responseData?.data,
    responseData
  ];

  const matchedObject = objectCandidates.find((item) => looksLikeNoticeItem(item));

  return matchedObject ? [matchedObject] : [];
}

function normalizeNoticeList(list = []) {
  return (list || []).map((item, index) => ({
    id: normalizeText(pickFirst(item, NOTICE_LIST_ID_KEYS)) || `notice-${index}`,
    title: normalizeText(pickFirst(item, NOTICE_LIST_TITLE_KEYS)) || DEFAULT_TITLE,
    publishTimeText: formatPublishTime(pickFirst(item, NOTICE_LIST_TIME_KEYS)),
    coverImage: normalizeText(pickFirst(item, NOTICE_LIST_IMAGE_KEYS)),
    summary: normalizeText(pickFirst(item, NOTICE_LIST_SUMMARY_KEYS))
  }));
}

function getNoticeListRequestUrl() {
  return `${app.globalData.AUrl}/jy/go/we.aspx?ituid=106&itjid=10662&itcid=10662&keyvalue=3`;
}

Page({
  data: {
    list: [],
    loading: true,
    pageTitle: PAGE_TITLE,
    emptyText: EMPTY_TEXT,
    moreText: MORE_TEXT,
    finishedText: FINISHED_TEXT
  },

  onLoad() {
    wx.setNavigationBarTitle({
      title: PAGE_TITLE
    });

    this.loadNoticeList();
  },

  onPullDownRefresh() {
    this.loadNoticeList();
  },

  loadNoticeList() {
    const url = getNoticeListRequestUrl();

    this.setData({
      loading: true
    });

    wx.showLoading({
      title: LOADING_TEXT,
      mask: true
    });

    if (!url) {
      this.setData({
        list: [],
        loading: false
      });
      wx.hideLoading();
      wx.stopPullDownRefresh();
      return;
    }

    wx.request({
      url,
      method: 'GET',
      success: (res) => {
        const list = normalizeNoticeList(extractListPayload(res.data));

        this.setData({
          list,
          loading: false
        });
      },
      fail: () => {
        this.setData({
          list: [],
          loading: false
        });
        wx.showToast({
          title: LOAD_FAILED_TEXT,
          icon: 'none'
        });
      },
      complete: () => {
        wx.hideLoading();
        wx.stopPullDownRefresh();
      }
    });
  },

  handleNoticeTap(e) {
    const id = String(e.currentTarget.dataset.id || '');

    if (!id) {
      return;
    }

    wx.navigateTo({
      url: `/subPackages/package/pages/noticeDetail/noticeDetail?id=${id}`
    });
  }
});
