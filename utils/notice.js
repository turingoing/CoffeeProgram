// 建议接口字段：
// 列表：id/title/publishTime/coverImage/summary
// 详情：id/title/publishTime/coverImage/summary/contentBlocks 或 contentHtml

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

function extractListPayload(responseData = {}) {
  const candidates = [
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

  return candidates.find(Array.isArray) || [];
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

function normalizeNoticeList(list = []) {
  return (list || []).map((item, index) => {
    const publishTime = pickFirst(item, [
      'publishTime',
      'publish_time',
      'releaseTime',
      'release_time',
      'addtime',
      'createTime',
      'createdAt',
      'time'
    ]);

    return {
      id: normalizeText(pickFirst(item, ['id', 'noticeId', 'notice_id', 'newsId', 'articleId', 'contentId'])) || `notice-${index}`,
      title: normalizeText(pickFirst(item, ['title', 'noticeTitle', 'newsTitle', 'name'])) || '公告标题',
      publishTimeText: formatPublishTime(publishTime),
      coverImage: normalizeText(pickFirst(item, ['coverImage', 'cover', 'image', 'img', 'pic', 'thumb', 'thumbnail', 'banner'])),
      summary: normalizeText(pickFirst(item, ['summary', 'subtitle', 'subTitle', 'desc', 'description', 'brief', 'remark', 'intro']))
    };
  });
}

function normalizeNoticeDetail(detail = {}) {
  const publishTime = pickFirst(detail, [
    'publishTime',
    'publish_time',
    'releaseTime',
    'release_time',
    'addtime',
    'createTime',
    'createdAt',
    'time'
  ]);

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

  const rawHtml = normalizeText(pickFirst(detail, ['contentHtml', 'content_html', 'html', 'detailHtml']));
  const rawContent = normalizeText(pickFirst(detail, ['content', 'detail', 'body', 'contentText', 'description']));
  const hasHtmlContent = /<[^>]+>/.test(rawHtml);

  return {
    id: normalizeText(pickFirst(detail, ['id', 'noticeId', 'notice_id', 'newsId', 'articleId', 'contentId'])),
    title: normalizeText(pickFirst(detail, ['title', 'noticeTitle', 'newsTitle', 'name'])) || '公告详情',
    publishTimeText: formatPublishTime(publishTime),
    coverImage: normalizeText(pickFirst(detail, ['coverImage', 'cover', 'image', 'img', 'pic', 'thumb', 'thumbnail', 'banner'])),
    summary: normalizeText(pickFirst(detail, ['summary', 'subtitle', 'subTitle', 'desc', 'description', 'brief', 'remark', 'intro'])),
    contentBlocks: contentBlocks.length ? contentBlocks : splitContentBlocks(hasHtmlContent ? '' : (rawContent || rawHtml)),
    contentHtml: hasHtmlContent ? rawHtml : ''
  };
}

module.exports = {
  extractDetailPayload,
  extractListPayload,
  normalizeNoticeDetail,
  normalizeNoticeList
};
