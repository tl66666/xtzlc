const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;
const DIMENSIONS = ['sport', 'diet', 'study', 'work', 'plan', 'sleep'];

function formatDate(date = new Date()) {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

async function ensureUser(openid) {
  const users = db.collection('users');
  const found = await users.where({ _openid: openid }).limit(1).get();
  if (found.data.length) return found.data[0];
  const now = new Date();
  const user = {
    _openid: openid,
    nickname: '星途旅人',
    avatarUrl: '',
    planetName: '未命名星球',
    level: 1,
    totalStarlight: 0,
    starCoins: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: '',
    createdAt: now,
    updatedAt: now
  };
  await users.add({ data: user });
  return user;
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const dimension = event.dimension;
  const date = event.date || formatDate();
  const payload = event.payload || {};

  if (!DIMENSIONS.includes(dimension)) {
    throw new Error('Invalid dimension');
  }

  const user = await ensureUser(OPENID);
  const checkIns = db.collection('check_ins');
  const existing = await checkIns.where({ _openid: OPENID, date, dimension }).limit(1).get();
  const now = new Date();
  const record = {
    _openid: OPENID,
    dimension,
    date,
    payload,
    starlight: Number(event.starlight) || 10,
    createdAt: now,
    updatedAt: now
  };

  if (existing.data.length) {
    await checkIns.doc(existing.data[0]._id).update({ data: record });
  } else {
    await checkIns.add({ data: record });
  }

  const todayRecords = await checkIns.where({ _openid: OPENID, date }).get();
  const completedCount = new Set(todayRecords.data.map((item) => item.dimension)).size;
  const perfectBonus = completedCount >= 6 && todayRecords.data.length === 6 ? 30 : 0;
  const dailyStats = db.collection('daily_stats');
  const dailyFound = await dailyStats.where({ _openid: OPENID, date }).limit(1).get();
  const dailyPayload = {
    _openid: OPENID,
    date,
    completedDimensions: [...new Set(todayRecords.data.map((item) => item.dimension))],
    completionCount: completedCount,
    isPerfectDay: completedCount >= 6,
    updatedAt: now
  };

  if (dailyFound.data.length) {
    await dailyStats.doc(dailyFound.data[0]._id).update({ data: dailyPayload });
  } else {
    await dailyStats.add({ data: { ...dailyPayload, createdAt: now } });
  }

  await db.collection('users').where({ _openid: OPENID }).update({
    data: {
      totalStarlight: _.inc(existing.data.length ? 0 : record.starlight + perfectBonus),
      starCoins: _.inc(existing.data.length ? 0 : 1),
      currentStreak: user.lastActiveDate === date ? user.currentStreak : Math.max(1, user.currentStreak || 0),
      longestStreak: Math.max(user.longestStreak || 0, user.currentStreak || 1),
      lastActiveDate: date,
      updatedAt: now
    }
  });

  return {
    ok: true,
    record,
    completedCount
  };
};
