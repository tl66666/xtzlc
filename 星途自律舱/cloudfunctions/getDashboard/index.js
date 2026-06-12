const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();

exports.main = async () => {
  const { OPENID } = cloud.getWXContext();
  const [users, checkins, dailyStats, achievements] = await Promise.all([
    db.collection('users').where({ _openid: OPENID }).limit(1).get(),
    db.collection('check_ins').where({ _openid: OPENID }).orderBy('createdAt', 'desc').limit(100).get(),
    db.collection('daily_stats').where({ _openid: OPENID }).orderBy('date', 'desc').limit(30).get(),
    db.collection('user_achievements').where({ _openid: OPENID }).get()
  ]);

  return {
    user: users.data[0] || null,
    checkins: checkins.data,
    dailyStats: dailyStats.data,
    achievements: achievements.data
  };
};
