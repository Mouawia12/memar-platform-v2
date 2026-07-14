'use strict';

const dayjs = require('dayjs');
const utc   = require('dayjs/plugin/utc');
const isBetween = require('dayjs/plugin/isBetween');

dayjs.extend(utc);
dayjs.extend(isBetween);

const NOW = () => dayjs.utc();

/**
 * Returns 'late' | 'today' | 'upcoming' | 'future' based on a due date string
 */
function classifyDate(dateStr) {
  if (!dateStr) return 'future';
  const d = dayjs.utc(dateStr).startOf('day');
  const today = NOW().startOf('day');

  if (d.isBefore(today))  return 'late';
  if (d.isSame(today))    return 'today';
  if (d.diff(today, 'day') <= 7) return 'upcoming';
  return 'future';
}

/**
 * Kuwait timezone offset (+3)
 */
function toKuwaitTime(date) {
  return dayjs.utc(date).utcOffset(3).format('YYYY-MM-DD HH:mm');
}

/**
 * Returns start/end of today in UTC (for Kuwait +3 offset)
 */
function kuwaitToday() {
  const now = dayjs.utc().utcOffset(3);
  return {
    start: now.startOf('day').utc().toISOString(),
    end:   now.endOf('day').utc().toISOString(),
  };
}

module.exports = { classifyDate, toKuwaitTime, kuwaitToday, dayjs };
