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

const CalendarView = {
  cursor: new Date(),

  render(container) {
    const year = this.cursor.getFullYear();
    const month = this.cursor.getMonth();
    const weekStart = store.settings.weekStart;
    const cells = CalendarUtil.buildMonthMatrix(year, month, weekStart);
    const dayNames = CalendarUtil.orderedDayNames(weekStart);

    let html = `<div class="cal-header">
      <button class="icon-btn" id="calPrev" aria-label="Previous month">‹</button>
      <h2>${CalendarUtil.monthNames[month]} ${year}</h2>
      <button class="icon-btn" id="calNext" aria-label="Next month">›</button>
      <button class="btn-ghost" id="calToday">Today</button>
    </div>
    <div class="cal-grid">`;

    dayNames.forEach(dn => { html += `<div class="cal-dayname">${dn}</div>`; });

    cells.forEach(date => {
      if (!date) { html += `<div class="cal-cell empty"></div>`; return; }
      const key = CalendarUtil.formatDateKey(date);
      const total = store.habits.filter(h => !h.archived).length;
      let done = 0;
      store.habits.forEach(h => { if (!h.archived && store.isComplete(h.id, key)) done++; });
      const pct = total ? Math.round((done / total) * 100) : 0;
      const todayClass = CalendarUtil.isToday(date) ? ' today' : '';
      html += `<div class="cal-cell${todayClass}" data-date="${key}">
        <span class="cal-daynum">${date.getDate()}</span>
        <div class="cal-bar"><div class="cal-bar-fill" style="width:${pct}%"></div></div>
        <span class="cal-pct">${total ? pct + '%' : ''}</span>
      </div>`;
    });

    html += `</div>`;
    container.innerHTML = html;

    container.querySelector('#calPrev').addEventListener('click', () => { this.cursor.setMonth(this.cursor.getMonth() - 1); this.render(container); });
    container.querySelector('#calNext').addEventListener('click', () => { this.cursor.setMonth(this.cursor.getMonth() + 1); this.render(container); });
    container.querySelector('#calToday').addEventListener('click', () => { this.cursor = new Date(); this.render(container); });
    container.querySelectorAll('.cal-cell[data-date]').forEach(cell => {
      cell.addEventListener('click', () => UI.openDayDetail(cell.getAttribute('data-date')));
    });
  }
};
