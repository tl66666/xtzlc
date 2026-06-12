const { DIMENSIONS } = require('./constants');
const { formatDate, getRecentDates } = require('./date');

function countByDate(records) {
  return records.reduce((map, record) => {
    map[record.date] = (map[record.date] || 0) + 1;
    return map;
  }, {});
}

function countByDimension(records) {
  const counts = DIMENSIONS.reduce((map, item) => {
    map[item.id] = 0;
    return map;
  }, {});
  records.forEach((record) => {
    counts[record.dimension] = (counts[record.dimension] || 0) + 1;
  });
  return counts;
}

function buildDashboardStats(records = [], today = new Date()) {
  const todayText = formatDate(today);
  const recentDates = getRecentDates(30, today);
  const weekDates = recentDates.slice(-7);
  const byDate = countByDate(records);
  const todayRecords = records.filter((record) => record.date === todayText);
  const completedDimensions = [...new Set(todayRecords.map((record) => record.dimension))];
  const dimensionCounts = countByDimension(records);
  const perfectDays = Object.values(byDate).filter((count) => count >= 6).length;
  const weekCompletedSlots = weekDates.reduce((sum, date) => sum + Math.min(byDate[date] || 0, 6), 0);

  return {
    today: {
      date: todayText,
      completedDimensions,
      completedCount: completedDimensions.length
    },
    totalCheckins: records.length,
    perfectDays,
    weekCompletionRate: Math.round((weekCompletedSlots / (7 * 6)) * 100),
    dimensionCounts,
    heatmap: recentDates.map((date) => ({
      date,
      count: byDate[date] || 0
    })),
    trend: weekDates.map((date) => ({
      date,
      count: byDate[date] || 0
    })),
    recentRecords: [...records].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).slice(0, 8)
  };
}

module.exports = {
  buildDashboardStats,
  countByDate,
  countByDimension
};
