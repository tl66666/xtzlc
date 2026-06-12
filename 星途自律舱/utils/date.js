function pad(value) {
  return String(value).padStart(2, '0');
}

function formatDate(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatDisplayDate(date = new Date()) {
  const weekNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return {
    dateText: `${date.getMonth() + 1}月${date.getDate()}日`,
    weekText: weekNames[date.getDay()],
    fullText: `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${weekNames[date.getDay()]}`
  };
}

function addDays(date, amount) {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  copy.setDate(copy.getDate() + amount);
  return copy;
}

function getRecentDates(count, endDate = new Date()) {
  return Array.from({ length: count }, (_, index) => {
    const offset = index - count + 1;
    return formatDate(addDays(endDate, offset));
  });
}

function isSameDay(a, b) {
  return formatDate(a) === formatDate(b);
}

module.exports = {
  formatDate,
  formatDisplayDate,
  getRecentDates,
  isSameDay,
  addDays
};
