/**
 * Business Day Calculator for Florida Title Contracts
 * Excludes weekends and federal holidays
 */

// Federal Holidays (fixed and floating)
const FEDERAL_HOLIDAYS = {
  // Fixed date holidays
  newYearsDay: { month: 0, day: 1 }, // January 1
  independenceDay: { month: 6, day: 4 }, // July 4
  veteransDay: { month: 10, day: 11 }, // November 11
  christmasDay: { month: 11, day: 25 }, // December 25

  // Floating holidays (calculated)
  mlkDay: null, // 3rd Monday in January
  presidentsDay: null, // 3rd Monday in February
  memorialDay: null, // Last Monday in May
  laborDay: null, // 1st Monday in September
  thanksgivingDay: null, // 4th Thursday in November
};

/**
 * Calculate floating federal holidays for a given year
 */
function getFloatingHolidays(year) {
  const holidays = [];

  // MLK Day - 3rd Monday in January
  holidays.push(getNthWeekdayOfMonth(year, 0, 1, 3));

  // Presidents Day - 3rd Monday in February
  holidays.push(getNthWeekdayOfMonth(year, 1, 1, 3));

  // Memorial Day - Last Monday in May
  holidays.push(getLastWeekdayOfMonth(year, 4, 1));

  // Labor Day - 1st Monday in September
  holidays.push(getNthWeekdayOfMonth(year, 8, 1, 1));

  // Thanksgiving - 4th Thursday in November
  holidays.push(getNthWeekdayOfMonth(year, 10, 4, 4));

  return holidays;
}

/**
 * Get the nth weekday of a month (e.g., 3rd Monday)
 */
function getNthWeekdayOfMonth(year, month, weekday, n) {
  const firstDay = new Date(year, month, 1);
  const firstWeekday = firstDay.getDay();

  // Calculate days to add to get to the first occurrence of the weekday
  let daysToAdd = (weekday - firstWeekday + 7) % 7;

  // Add weeks to get to the nth occurrence
  daysToAdd += (n - 1) * 7;

  return new Date(year, month, 1 + daysToAdd);
}

/**
 * Get the last occurrence of a weekday in a month
 */
function getLastWeekdayOfMonth(year, month, weekday) {
  const lastDay = new Date(year, month + 1, 0);
  const lastWeekday = lastDay.getDay();

  let daysToSubtract = (lastWeekday - weekday + 7) % 7;

  return new Date(year, month + 1, 0 - daysToSubtract);
}

/**
 * Check if a date is a federal holiday
 */
export function isFederalHoliday(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  // Check fixed holidays
  if (month === 0 && day === 1) return true; // New Year's
  if (month === 6 && day === 4) return true; // Independence Day
  if (month === 10 && day === 11) return true; // Veterans Day
  if (month === 11 && day === 25) return true; // Christmas

  // Check floating holidays
  const floatingHolidays = getFloatingHolidays(year);
  return floatingHolidays.some(holiday =>
    holiday.getMonth() === month && holiday.getDate() === day
  );
}

/**
 * Check if a date is a weekend
 */
export function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
}

/**
 * Check if a date is a business day
 */
export function isBusinessDay(date) {
  return !isWeekend(date) && !isFederalHoliday(date);
}

/**
 * Add calendar days to a date and adjust if it lands on weekend/holiday
 * Per FAR/BAR STANDARD F: Calendar days are used, but if deadline falls on
 * weekend/holiday, it extends to next business day
 * @param {Date} startDate - Starting date
 * @param {number} calendarDays - Number of calendar days to add
 * @returns {Date} - Resulting date (adjusted to next business day if needed)
 */
export function addCalendarDays(startDate, calendarDays) {
  const resultDate = new Date(startDate);
  resultDate.setDate(resultDate.getDate() + calendarDays);

  // If result lands on weekend or holiday, push to next business day
  while (!isBusinessDay(resultDate)) {
    resultDate.setDate(resultDate.getDate() + 1);
  }

  return resultDate;
}

/**
 * Subtract calendar days from a date and adjust if it lands on weekend/holiday
 * Used for backward calculations (e.g., "X days before closing")
 * @param {Date} startDate - Starting date
 * @param {number} calendarDays - Number of calendar days to subtract
 * @returns {Date} - Resulting date (adjusted to previous business day if needed)
 */
export function subtractCalendarDays(startDate, calendarDays) {
  const resultDate = new Date(startDate);
  resultDate.setDate(resultDate.getDate() - calendarDays);

  // If result lands on weekend or holiday, push back to previous business day
  while (!isBusinessDay(resultDate)) {
    resultDate.setDate(resultDate.getDate() - 1);
  }

  return resultDate;
}

/**
 * Add business days to a date (ONLY use for specific business day requirements)
 * NOTE: Most FAR/BAR deadlines use CALENDAR days, not business days!
 * @param {Date} startDate - Starting date
 * @param {number} businessDays - Number of business days to add
 * @returns {Date} - Resulting date
 */
export function addBusinessDays(startDate, businessDays) {
  if (businessDays === 0) return new Date(startDate);

  let currentDate = new Date(startDate);
  let daysAdded = 0;

  while (daysAdded < businessDays) {
    currentDate.setDate(currentDate.getDate() + 1);

    if (isBusinessDay(currentDate)) {
      daysAdded++;
    }
  }

  return currentDate;
}

/**
 * Calculate business days between two dates
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {number} - Number of business days
 */
export function businessDaysBetween(startDate, endDate) {
  let count = 0;
  let currentDate = new Date(startDate);

  while (currentDate < endDate) {
    currentDate.setDate(currentDate.getDate() + 1);
    if (isBusinessDay(currentDate)) {
      count++;
    }
  }

  return count;
}

/**
 * Calculate days remaining until a deadline
 * @param {Date} deadline - Deadline date
 * @returns {number} - Days remaining (negative if overdue)
 */
export function daysRemaining(deadline) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const deadlineDate = new Date(deadline);
  deadlineDate.setHours(0, 0, 0, 0);

  const diffTime = deadlineDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Ensure a date falls on a business day
 * If it's a weekend or holiday, move to the next business day
 * @param {Date} date - Date to adjust
 * @returns {Date} - Date adjusted to next business day if needed
 */
export function ensureBusinessDay(date) {
  const resultDate = new Date(date);

  // Move forward until we hit a business day
  while (!isBusinessDay(resultDate)) {
    resultDate.setDate(resultDate.getDate() + 1);
  }

  return resultDate;
}

/**
 * Format date to readable string
 */
export function formatDate(date) {
  if (!date) return '';

  const d = new Date(date);
  const options = {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };

  return d.toLocaleDateString('en-US', options);
}
