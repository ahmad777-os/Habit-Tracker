const CalendarUtil = {
  monthNames: ['January','February','March','April','May','June','July','August','September','October','November','December'],
  dayNamesShort: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],

  formatDateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  },

  daysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  },

  firstWeekdayOfMonth(year, month, weekStart) {
    let wd = new Date(year, month, 1).getDay();
    if (weekStart === 'monday') wd = (wd + 6) % 7;
    return wd;
  },

  buildMonthMatrix(year, month, weekStart) {
    const total = this.daysInMonth(year, month);
    const lead = this.firstWeekdayOfMonth(year, month, weekStart);
    const cells = [];
    for (let i = 0; i < lead; i++) cells.push(null);
    for (let d = 1; d <= total; d++) cells.push(new Date(year, month, d));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  },

  isToday(date) {
    const now = new Date();
    return date && date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
  },

  orderedDayNames(weekStart) {
    if (weekStart === 'monday') return ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  }
};
