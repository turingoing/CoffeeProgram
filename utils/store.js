const DEFAULT_STORE_BUSINESS_HOURS = '07:00-21:30';

function formatDistanceText(distance) {
  const distanceValue = Number(distance);
  if (!Number.isFinite(distanceValue) || distanceValue < 0) {
    return '';
  }

  if (parseInt(distanceValue, 10) >= 1) {
    return `${distanceValue.toFixed(1)}km`;
  }

  return `${Math.round(distanceValue * 1000)}m`;
}

function rad(value) {
  return value * Math.PI / 180.0;
}

function calculateDistance(lat1, lng1, lat2, lng2) {
  const radLat1 = rad(lat1);
  const radLat2 = rad(lat2);
  const a = radLat1 - radLat2;
  const b = rad(lng1) - rad(lng2);
  let distance = 2 * Math.asin(Math.sqrt(
    Math.pow(Math.sin(a / 2), 2) +
    Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)
  ));

  distance = distance * 6378.137;
  distance = Math.round(distance * 10000) / 10000;
  return distance;
}

function isValidLatitude(value) {
  return Number.isFinite(value) && value >= -90 && value <= 90;
}

function isValidLongitude(value) {
  return Number.isFinite(value) && value >= -180 && value <= 180;
}

function normalizeUserCoordinate(value) {
  if (value === null || value === undefined) {
    return NaN;
  }

  if (typeof value === 'string' && !value.trim()) {
    return NaN;
  }

  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : NaN;
}

function hasUsableUserLocation(latitude, longitude) {
  const normalizedLatitude = normalizeUserCoordinate(latitude);
  const normalizedLongitude = normalizeUserCoordinate(longitude);

  if (!isValidLatitude(normalizedLatitude) || !isValidLongitude(normalizedLongitude)) {
    return false;
  }

  if (Math.abs(normalizedLatitude) < 0.000001 && Math.abs(normalizedLongitude) < 0.000001) {
    return false;
  }

  return true;
}

function scoreCoordinateCandidate(candidate) {
  if (!candidate.isValid) {
    return -1;
  }

  let score = 0;
  if (candidate.latitude >= 0 && candidate.latitude <= 55) {
    score += 1;
  }
  if (candidate.longitude >= 70 && candidate.longitude <= 140) {
    score += 1;
  }

  return score;
}

function parseStoreCoordinate(store = {}) {
  const directCandidate = {
    latitude: parseFloat(store.latitude),
    longitude: parseFloat(store.longitude)
  };
  directCandidate.isValid = isValidLatitude(directCandidate.latitude)
    && isValidLongitude(directCandidate.longitude);

  const swappedCandidate = {
    latitude: parseFloat(store.longitude),
    longitude: parseFloat(store.latitude)
  };
  swappedCandidate.isValid = isValidLatitude(swappedCandidate.latitude)
    && isValidLongitude(swappedCandidate.longitude);

  const directScore = scoreCoordinateCandidate(directCandidate);
  const swappedScore = scoreCoordinateCandidate(swappedCandidate);
  const bestCandidate = swappedScore > directScore ? swappedCandidate : directCandidate;

  return {
    latitude: bestCandidate.latitude,
    longitude: bestCandidate.longitude,
    isValid: bestCandidate.isValid
  };
}

function getStoreAddress(store = {}) {
  const address = [
    store.add,
    store.address,
    store.addressDesc,
    [store.province, store.city, store.street, store.door].filter(Boolean).join('')
  ].find(item => typeof item === 'string' && item.trim());

  return (address || '').trim();
}

function normalizeBusinessTimeText(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, '')
    .replace(/[：]/g, ':')
    .replace(/[~～—–至]/g, '-');
}

function getStoreBusinessTime(store = {}) {
  const directValue = [
    store.yytime,
    store.businesshours,
    store.businessHours,
    store.openTime,
    store.opentime,
    store.worktime,
    store.workTime,
    store.yysj
  ].find(item => typeof item === 'string' && item.trim());

  if (directValue) {
    return normalizeBusinessTimeText(directValue);
  }

  const start = String(store.starttime || store.startTime || '').trim();
  const end = String(store.endtime || store.endTime || '').trim();
  if (start && end) {
    return normalizeBusinessTimeText(`${start}-${end}`);
  }

  return DEFAULT_STORE_BUSINESS_HOURS;
}

function getStoreTag(store = {}) {
  const arrayTag = Array.isArray(store.labels)
    ? store.labels.find(item => typeof item === 'string' && item.trim())
    : '';
  const directValue = [
    arrayTag,
    store.tag,
    store.tagName,
    store.label,
    store.remark,
    store.mark
  ].find(item => typeof item === 'string' && item.trim());

  return directValue ? directValue.trim() : '';
}

function getStorePhone(store = {}) {
  const rawValue = [
    store.phone,
    store.tel,
    store.telephone,
    store.mobile,
    store.contactPhone,
    store.contactphone,
    store.storephone,
    store.phoneNumber
  ].find(item => typeof item === 'string' && item.trim());

  console.log('【getStorePhone】原始值查找结果:', rawValue);
  console.log('【getStorePhone】各字段值:', { phone: store.phone, tel: store.tel, telephone: store.telephone, mobile: store.mobile, contactPhone: store.contactPhone, contactphone: store.contactphone, storephone: store.storephone, phoneNumber: store.phoneNumber });

  if (!rawValue) {
    return '';
  }

  const phone = rawValue
    .split(/[\/,;|]+/)
    .map(item => item.trim())
    .find(Boolean);

  console.log('【getStorePhone】最终解析电话:', phone);
  return phone || '';
}

function normalizeTimeToken(token) {
  const [hour = '', minute = ''] = String(token || '').split(':');
  if (!hour || !minute) {
    return '';
  }

  return `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
}

function toMinutes(token) {
  const [hourText = '', minuteText = ''] = normalizeTimeToken(token).split(':');
  const hour = Number(hourText);
  const minute = Number(minuteText);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return NaN;
  }

  return hour * 60 + minute;
}

function parseBusinessRanges(businessTime) {
  const normalized = normalizeBusinessTimeText(businessTime);
  const ranges = [];
  const pattern = /(\d{1,2}:\d{2})-(\d{1,2}:\d{2})/g;
  let match;

  while ((match = pattern.exec(normalized)) !== null) {
    const startText = normalizeTimeToken(match[1]);
    const endText = normalizeTimeToken(match[2]);
    const startMinutes = toMinutes(startText);
    const endMinutes = toMinutes(endText);

    if (!Number.isFinite(startMinutes) || !Number.isFinite(endMinutes)) {
      continue;
    }

    ranges.push({
      startText,
      endText,
      startMinutes,
      endMinutes
    });
  }

  return ranges;
}

function isMinuteInRange(currentMinutes, range) {
  if (range.startMinutes <= range.endMinutes) {
    return currentMinutes >= range.startMinutes && currentMinutes <= range.endMinutes;
  }

  return currentMinutes >= range.startMinutes || currentMinutes <= range.endMinutes;
}

function getStoreBusinessState(store = {}, date = new Date()) {
  const displayBusinessTime = getStoreBusinessTime(store);
  const ranges = parseBusinessRanges(displayBusinessTime);
  const closeFlag = String(store.closeflag || store.isclose || '').trim();

  if (closeFlag === '0') {
    return {
      displayBusinessTime,
      isOpen: false,
      businessStatusText: '休息中'
    };
  }
  if (!ranges.length) {
    return {
      displayBusinessTime,
      isOpen: true,
      businessStatusText: '营业中'
    };
  }

  const currentMinutes = date.getHours() * 60 + date.getMinutes();
  const isOpen = ranges.some(range => isMinuteInRange(currentMinutes, range));

  return {
    displayBusinessTime,
    isOpen,
    businessStatusText: isOpen ? '营业中' : '休息中'
  };
}

function enrichStores(stores = [], latitude, longitude, date = new Date()) {
  const userLatitude = normalizeUserCoordinate(latitude);
  const userLongitude = normalizeUserCoordinate(longitude);
  const hasLocation = hasUsableUserLocation(userLatitude, userLongitude);

  return (stores || []).map((store) => {
    const businessState = getStoreBusinessState(store, date);
    const coordinate = parseStoreCoordinate(store);
    let distanceValue = '';
    let distanceText = '';

    if (hasLocation && coordinate.isValid) {
      const computedDistance = calculateDistance(
        userLatitude,
        userLongitude,
        coordinate.latitude,
        coordinate.longitude
      );
      distanceValue = computedDistance.toFixed(2);
      distanceText = formatDistanceText(computedDistance);
    }

    return {
      ...store,
      displayAddress: getStoreAddress(store),
      displayBusinessTime: businessState.displayBusinessTime,
      businessStatusText: businessState.businessStatusText,
      isOpen: businessState.isOpen,
      isSelectable: businessState.isOpen,
      displayTag: getStoreTag(store),
      distanceValue,
      distanceText
    };
  });
}

function getOpenStores(stores = [], date = new Date()) {
  return (stores || []).filter(store => getStoreBusinessState(store, date).isOpen);
}

function findNearestStore(latitude, longitude, stores = []) {
  let nearestStore = null;
  let minDistance = Infinity;

  (stores || []).forEach((store) => {
    const coordinate = parseStoreCoordinate(store);
    if (!coordinate.isValid) {
      return;
    }

    const distance = calculateDistance(latitude, longitude, coordinate.latitude, coordinate.longitude);
    if (distance < minDistance) {
      minDistance = distance;
      nearestStore = {
        ...store,
        distance: distance.toFixed(2),
        distanceText: formatDistanceText(distance)
      };
    }
  });

  return nearestStore;
}

function findNearestOpenStore(latitude, longitude, stores = [], date = new Date()) {
  const openStores = enrichStores(stores, latitude, longitude, date).filter(store => store.isOpen);
  return findNearestStore(latitude, longitude, openStores);
}

function openStoreLocation(store) {
  if (!store) {
    wx.showToast({
      title: '未找到门店',
      icon: 'none'
    });
    return false;
  }

  const coordinate = parseStoreCoordinate(store);
  if (!coordinate.isValid) {
    wx.showToast({
      title: '门店位置信息缺失',
      icon: 'none'
    });
    return false;
  }

  wx.openLocation({
    latitude: coordinate.latitude,
    longitude: coordinate.longitude,
    name: store.name || '门店',
    address: getStoreAddress(store),
    success() { },
    fail() {
      wx.showToast({
        title: '导航失败',
        icon: 'none'
      });
    }
  });

  return true;
}

function makeStorePhoneCall(store) {
  console.log('【makeStorePhoneCall】传入的store:', store);
  const phoneNumber = getStorePhone(store);
  console.log('【makeStorePhoneCall】获取到的电话号码:', phoneNumber);

  if (!phoneNumber) {
    console.log('【makeStorePhoneCall】电话号码为空，显示提示');
    wx.showToast({
      title: '门店暂无联系电话',
      icon: 'none'
    });
    return false;
  }

  console.log('【makeStorePhoneCall】正在拨打电话:', phoneNumber);
  wx.makePhoneCall({
    phoneNumber,
    fail() {
      wx.showToast({
        title: '拨号失败',
        icon: 'none'
      });
    }
  });

  return true;
}

module.exports = {
  calculateDistance,
  enrichStores,
  findNearestOpenStore,
  findNearestStore,
  formatDistanceText,
  getOpenStores,
  getStoreAddress,
  getStoreBusinessState,
  getStoreBusinessTime,
  getStorePhone,
  getStoreTag,
  makeStorePhoneCall,
  openStoreLocation
};
