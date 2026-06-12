const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

const ALLOWED_FIELDS = [
  'nickname',
  'avatarUrl',
  'planetName',
  'reminder',
  'customPlans'
];

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
  const input = event.profile || {};
  const payload = {};

  ALLOWED_FIELDS.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(input, key)) {
      payload[key] = input[key];
    }
  });

  await ensureUser(OPENID);
  payload.updatedAt = new Date();
  await db.collection('users').where({ _openid: OPENID }).update({
    data: payload
  });

  return {
    ok: true,
    profile: payload
  };
};
