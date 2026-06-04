const NOTICE_DETAIL_ID_KEYS = [
  'id',
  'noticeId',
  'notice_id',
  'newsId',
  'articleId',
  'contentId'
];

const NOTICE_DETAIL_TITLE_KEYS = ['title', 'noticeTitle', 'newsTitle', 'name'];

const NOTICE_DETAIL_TIME_KEYS = [
  'publishTime',
  'publish_time',
  'releaseTime',
  'release_time',
  'addtime',
  'createTime',
  'createdAt',
  'time'
];

const NOTICE_DETAIL_IMAGE_KEYS = [
  'coverImage',
  'cover',
  'image',
  'img',
  'pic',
  'thumb',
  'thumbnail',
  'banner'
];

const NOTICE_DETAIL_SUMMARY_KEYS = [
  'summary',
  'subtitle',
  'subTitle',
  'desc',
  'description',
  'brief',
  'remark',
  'intro'
];

const NOTICE_DETAIL_HTML_KEYS = ['contentHtml', 'content_html', 'html', 'detailHtml'];
const NOTICE_DETAIL_CONTENT_KEYS = ['content', 'detail', 'body', 'contentText', 'description'];

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

function splitContentBlocks(text) {
  const normalizedText = normalizeText(text);

  if (!normalizedText) {
    return [];
  }

  const normalizedLineBreaks = normalizedText.replace(/\r\n/g, '\n');
  const blocks = normalizedLineBreaks
    .split(/\n\s*\n/)
    .map(item => normalizeText(item))
    .filter(Boolean);

  if (blocks.length) {
    return blocks;
  }

  return normalizedLineBreaks
    .split('\n')
    .map(item => normalizeText(item))
    .filter(Boolean);
}

function extractDetailPayload(responseData = {}) {
  const candidates = [
    responseData?.result?.detail,
    responseData?.result?.data,
    responseData?.result?.info,
    responseData?.data?.detail,
    responseData?.data?.data,
    responseData?.data?.info,
    responseData?.detail,
    responseData?.info
  ];

  for (const candidate of candidates) {
    if (candidate && typeof candidate === 'object' && !Array.isArray(candidate)) {
      return candidate;
    }
  }

  if (responseData && typeof responseData === 'object' && !Array.isArray(responseData)) {
    return responseData;
  }

  return {};
}

function normalizeNoticeDetail(detail = {}) {
  const contentBlockSource = [
    detail.contentBlocks,
    detail.blocks,
    detail.paragraphs,
    detail.contents
  ].find(Array.isArray);

  const contentBlocks = Array.isArray(contentBlockSource)
    ? contentBlockSource
      .map(item => normalizeText(typeof item === 'object' ? pickFirst(item, ['text', 'content', 'value']) : item))
      .filter(Boolean)
    : [];

  const rawHtml = normalizeText(pickFirst(detail, NOTICE_DETAIL_HTML_KEYS));
  const rawContent = normalizeText(pickFirst(detail, NOTICE_DETAIL_CONTENT_KEYS));
  const hasHtmlContent = /<[^>]+>/.test(rawHtml);

  return {
    id: normalizeText(pickFirst(detail, NOTICE_DETAIL_ID_KEYS)),
    title: normalizeText(pickFirst(detail, NOTICE_DETAIL_TITLE_KEYS)) || '公告详情',
    publishTimeText: formatPublishTime(pickFirst(detail, NOTICE_DETAIL_TIME_KEYS)),
    coverImage: normalizeText(pickFirst(detail, NOTICE_DETAIL_IMAGE_KEYS)),
    summary: normalizeText(pickFirst(detail, NOTICE_DETAIL_SUMMARY_KEYS)),
    contentBlocks: contentBlocks.length ? contentBlocks : splitContentBlocks(hasHtmlContent ? '' : (rawContent || rawHtml)),
    contentHtml: hasHtmlContent ? rawHtml : ''
  };
}

function getEmptyDetail() {
  return {
    id: '',
    title: '',
    publishTimeText: '',
    coverImage: '',
    summary: '',
    contentBlocks: [],
    contentHtml: ''
  };
}

function getNoticeDetailRequestUrl() {
  return '';
}

Page({
  data: {
    id: '',
    loading: true,
    detail: getEmptyDetail(),
    emptyText: '暂无公告'
  },

  onLoad(options = {}) {
    const id = String(options.id || '');

    this.setData({
      id
    });

    this.loadNoticeDetail();
  },

  loadNoticeDetail() {
    const id = this.data.id;
    const url = getNoticeDetailRequestUrl();
    const method = 'GET';

    this.setData({
      loading: true
    });

    wx.showLoading({
      title: '加载中',
      mask: true
    });

    if (!id || !url) {
      this.setData({
        detail: getEmptyDetail(),
        loading: false
      });
      wx.setNavigationBarTitle({
        title: '公告详情'
      });
      wx.hideLoading();
      return;
    }

    wx.request({
      url,
      method,
      success: (res) => {
        const detail = normalizeNoticeDetail(extractDetailPayload(res.data));

        this.setData({
          detail,
          loading: false
        });

        wx.setNavigationBarTitle({
          title: detail.title || '公告详情'
        });
      },
      fail: () => {
        this.setData({
          detail: getEmptyDetail(),
          loading: false
        });
        wx.showToast({
          title: '公告详情加载失败',
          icon: 'none'
        });
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  }
});
