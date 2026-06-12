const { DIMENSIONS, ECOSYSTEM_UNLOCKS } = require('./constants');

function getDimensionRecords(records = [], dimensionId) {
  return records.filter((record) => record.dimension === dimensionId);
}

function getUnlockedParts(dimensionId, count) {
  return (ECOSYSTEM_UNLOCKS[dimensionId] || []).map((item) => ({
    ...item,
    unlocked: count >= item.threshold
  }));
}

function getNewUnlocks(dimensionId, beforeCount, afterCount) {
  return (ECOSYSTEM_UNLOCKS[dimensionId] || []).filter((item) => (
    beforeCount < item.threshold && afterCount >= item.threshold
  ));
}

function getNextUnlock(dimensionId, count) {
  const next = (ECOSYSTEM_UNLOCKS[dimensionId] || []).find((item) => count < item.threshold);
  if (!next) return null;
  return {
    ...next,
    need: next.threshold - count,
    progress: Math.max(0, Math.min(100, Math.round((count / next.threshold) * 100)))
  };
}

function buildEcosystemState(records = []) {
  return DIMENSIONS.map((dimension) => {
    const count = getDimensionRecords(records, dimension.id).length;
    const parts = getUnlockedParts(dimension.id, count);
    const unlockedCount = parts.filter((item) => item.unlocked).length;
    return {
      ...dimension,
      count,
      unlockedCount,
      totalParts: parts.length,
      parts,
      nextUnlock: getNextUnlock(dimension.id, count)
    };
  });
}

module.exports = {
  buildEcosystemState,
  getDimensionRecords,
  getUnlockedParts,
  getNewUnlocks,
  getNextUnlock
};
