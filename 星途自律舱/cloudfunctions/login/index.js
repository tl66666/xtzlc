const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async () => {
  const { OPENID } = cloud.getWXContext();
  const users = db.collection('users');
  const found = await users.where({ _openid: OPENID }).limit(1).get();

  if (found.data.length) {
    return {
      openid: OPENID,
      user: found.data[0]
    };
  }

  const now = new Date();
  const user = {
    _openid: OPENID,
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
  return {
    openid: OPENID,
    user
  };
};
