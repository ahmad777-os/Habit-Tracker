const QUOTES = [
  'Small habits, repeated daily, become who you are.',
  'You do not rise to your goals, you fall to your systems.',
  'Every checkbox is a vote for the person you want to become.',
  'Discipline is choosing between what you want now and what you want most.',
  'Consistency turns effort into identity.',
  'Progress is quiet, then suddenly obvious.',
  'The habit is the algorithm. Trust the loop.'
];

const UI = {
  state: {
    view: 'dashboard',
    search: '',
    filter: 'all',
    sort: 'newest',
    editingHabitId: null
  },

  init() {
    Theme.apply();
    this.renderSidebar();
    this.bindGlobal();
    this.bindShortcuts();
    this.syncChromeIcons();
    this.switchView('dashboard');
    this.scheduleReminders();
  },

  syncChromeIcons() {
    document.querySelector('.search-icon').innerHTML = Icons.svg('search', 15);
    document.getElementById('themeToggle').innerHTML = Icons.svg(store.settings.theme === 'dark' ? 'sun' : 'moon', 16);
    const collapsed = document.querySelector('.app').classList.contains('sidebar-collapsed');
    document.getElementById('sidebarToggle').innerHTML = Icons.svg(collapsed ? 'chevronsRight' : 'chevronsLeft', 15);
    document.getElementById('fabAdd').innerHTML = Icons.svg('plus', 24);
  },

  bindGlobal() {
    document.getElementById('themeToggle').addEventListener('click', () => { Theme.toggle(); this.syncChromeIcons(); });
    document.getElementById('sidebarToggle').addEventListener('click', () => {
      document.querySelector('.app').classList.toggle('sidebar-collapsed');
      this.syncChromeIcons();
    });
    document.getElementById('fabAdd').addEventListener('click', () => this.openHabitModal(null));
    document.getElementById('modalOverlay').addEventListener('click', (e) => {
      if (e.target.id === 'modalOverlay') this.closeModal();
    });
    document.getElementById('globalSearch').addEventListener('input', (e) => {
      this.state.search = e.target.value.toLowerCase();
      this.renderCurrentView();
    });
  },

  bindShortcuts() {
    document.addEventListener('keydown', (e) => {
      const tag = (e.target.tagName || '').toLowerCase();
      const typing = tag === 'input' || tag === 'textarea' || e.target.isContentEditable;
      if (e.key === 'Escape') { this.closeModal(); return; }
      if (typing) return;
      if (e.key === 'n' || e.key === 'N') { e.preventDefault(); this.openHabitModal(null); }
      if (e.ctrlKey && (e.key === 'f' || e.key === 'F')) { e.preventDefault(); document.getElementById('globalSearch').focus(); }
      if (e.ctrlKey && (e.key === 's' || e.key === 'S')) { e.preventDefault(); this.toast('All changes saved automatically'); }
    });
  },

  renderSidebar() {
    const nav = document.getElementById('sidebarNav');
    const items = [
      { id: 'dashboard', icon: 'grid', label: 'Dashboard' },
      { id: 'habits', icon: 'listChecks', label: 'Habits' },
      { id: 'statistics', icon: 'barChart', label: 'Statistics' },
      { id: 'settings', icon: 'settings', label: 'Settings' }
    ];
    nav.innerHTML = items.map(it => `
      <button class="nav-item${this.state.view === it.id ? ' active' : ''}" data-view="${it.id}">
        <span class="nav-icon">${Icons.svg(it.icon, 17)}</span><span class="nav-label">${it.label}</span>
      </button>`).join('');
    nav.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', () => this.switchView(btn.getAttribute('data-view')));
    });
    const level = document.getElementById('sidebarLevel');
    if (level) {
      const xpInLevel = store.meta.xp % 100;
      level.innerHTML = `<div class="level-badge">${Icons.svg('flame', 13)} Lv ${store.meta.level}</div>
        <div class="xp-track"><div class="xp-fill" style="width:${xpInLevel}%"></div></div>
        <span class="xp-label">${xpInLevel}/100 XP</span>`;
    }
  },

  switchView(view) {
    this.state.view = view;
    this.renderSidebar();
    this.renderCurrentView();
  },

  renderCurrentView() {
    const main = document.getElementById('mainContent');
    if (this.state.view === 'dashboard') this.renderDashboard(main);
    else if (this.state.view === 'habits') this.renderHabitsView(main);
    else if (this.state.view === 'statistics') this.renderStatisticsView(main);
    else if (this.state.view === 'settings') this.renderSettingsView(main);
  },

  greeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  },

  renderDashboard(main) {
    const today = new Date();
    const todayStats = Stats.getTodayCompletionCount();
    const active = store.habits.filter(h => !h.archived);
    const bestStreak = Math.max(0, ...active.map(h => Stats.getLongestStreak(h.id)));
    const quote = QUOTES[today.getDate() % QUOTES.length];

    main.innerHTML = `
      <div class="view-header">
        <div>
          <p class="eyebrow">${today.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
          <h1>${this.greeting()}</h1>
        </div>
      </div>
      <p class="quote">"${quote}"</p>
      <div class="card-grid">
        <div class="stat-card"><span class="stat-value">${active.length}</span><span class="stat-label">Total habits</span></div>
        <div class="stat-card"><span class="stat-value">${todayStats.done}/${todayStats.total}</span><span class="stat-label">Completed today</span></div>
        <div class="stat-card"><span class="stat-value">${bestStreak}</span><span class="stat-label">Best streak</span></div>
        <div class="stat-card"><span class="stat-value">${Stats.getWeeklyPct()}%</span><span class="stat-label">Weekly progress</span></div>
      </div>
      <div class="ring-grid">
        <div class="ring-card"><canvas id="ringToday" width="140" height="140"></canvas></div>
        <div class="ring-card"><canvas id="ringWeek" width="140" height="140"></canvas></div>
        <div class="ring-card"><canvas id="ringMonth" width="140" height="140"></canvas></div>
      </div>
      <h2 class="section-title">Today's habits</h2>
      <div class="today-list" id="todayList"></div>
    `;

    Charts.drawProgressRing(document.getElementById('ringToday'), todayStats.pct, 'Today');
    Charts.drawProgressRing(document.getElementById('ringWeek'), Stats.getWeeklyPct(), 'This week');
    Charts.drawProgressRing(document.getElementById('ringMonth'), Stats.getMonthlyPct(), 'This month');

    const key = CalendarUtil.formatDateKey(today);
    const list = document.getElementById('todayList');
    list.innerHTML = active.map(h => {
      const done = store.isComplete(h.id, key);
      return `<div class="today-row${done ? ' done' : ''}" data-id="${h.id}">
        <button class="check-circle${done ? ' checked' : ''}" data-toggle="${h.id}" style="--habit-color:${h.color}">${done ? Icons.svg('check', 12) : ''}</button>
        <span class="today-icon" style="color:${h.color}">${Icons.svg(h.icon, 16)}</span>
        <span class="today-name">${this.escape(h.name)}</span>
        <span class="today-streak">${Icons.svg('flame', 12)} ${Stats.getCurrentStreak(h.id)} day streak</span>
      </div>`;
    }).join('') || this.emptyState('No habits yet', 'Add your first habit to start tracking.');

    list.querySelectorAll('[data-toggle]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-toggle');
        const nowDone = store.toggleLog(id, key);
        this.renderSidebar();
        this.renderDashboard(main);
        if (nowDone) {
          const stats = Stats.getTodayCompletionCount();
          if (stats.pct === 100) this.confetti();
        }
      });
    });
  },

  renderHabitsView(main) {
    main.innerHTML = `
      <div class="view-header">
        <div><p class="eyebrow">Tracker</p><h1>Habits</h1></div>
        <button class="btn-primary" id="addHabitBtn">+ Add habit</button>
      </div>
      <div class="toolbar">
        <select id="filterSelect">
          <option value="all">All</option>
          <option value="today">Today</option>
          <option value="pinned">Pinned</option>
          <option value="favorite">Favorite</option>
          <option value="archived">Archived</option>
          ${store.categories.map(c => `<option value="cat:${c.id}">${c.name}</option>`).join('')}
        </select>
        <select id="sortSelect">
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="alpha">Alphabetical</option>
          <option value="streak">Highest streak</option>
          <option value="rate">Completion rate</option>
        </select>
      </div>
      <div class="table-wrap"><table class="habit-table" id="habitTable"></table></div>
    `;
    document.getElementById('addHabitBtn').addEventListener('click', () => this.openHabitModal(null));
    document.getElementById('filterSelect').value = this.state.filter;
    document.getElementById('sortSelect').value = this.state.sort;
    document.getElementById('filterSelect').addEventListener('change', (e) => { this.state.filter = e.target.value; this.renderHabitsView(main); });
    document.getElementById('sortSelect').addEventListener('change', (e) => { this.state.sort = e.target.value; this.renderHabitsView(main); });
    this.renderHabitTable();
  },

  getFilteredSortedHabits() {
    const today = CalendarUtil.formatDateKey(new Date());
    let list = store.habits.slice();
    if (this.state.filter === 'archived') list = list.filter(h => h.archived);
    else list = list.filter(h => !h.archived);
    if (this.state.filter === 'pinned') list = list.filter(h => h.pinned);
    if (this.state.filter === 'favorite') list = list.filter(h => h.favorite);
    if (this.state.filter === 'today') list = list.filter(h => !store.isComplete(h.id, today));
    if (this.state.filter.startsWith('cat:')) list = list.filter(h => h.category === this.state.filter.slice(4));
    if (this.state.search) list = list.filter(h => h.name.toLowerCase().includes(this.state.search));

    if (this.state.sort === 'newest') list.sort((a, b) => b.createdAt - a.createdAt);
    if (this.state.sort === 'oldest') list.sort((a, b) => a.createdAt - b.createdAt);
    if (this.state.sort === 'alpha') list.sort((a, b) => a.name.localeCompare(b.name));
    if (this.state.sort === 'streak') list.sort((a, b) => Stats.getCurrentStreak(b.id) - Stats.getCurrentStreak(a.id));
    if (this.state.sort === 'rate') list.sort((a, b) => Stats.getCompletionRate(b.id) - Stats.getCompletionRate(a.id));
    list.sort((a, b) => (b.pinned === a.pinned) ? 0 : (b.pinned ? 1 : -1));
    return list;
  },

  renderHabitTable() {
    const table = document.getElementById('habitTable');
    if (!table) return;
    const now = new Date();
    const days = CalendarUtil.daysInMonth(now.getFullYear(), now.getMonth());
    const list = this.getFilteredSortedHabits();

    let head = '<thead><tr><th class="sticky-col">Habit</th>';
    for (let d = 1; d <= days; d++) head += `<th class="${d === now.getDate() ? 'today-col' : ''}">${d}</th>`;
    head += '<th>Streak</th></tr></thead>';

    let body = '<tbody>';
    list.forEach(h => {
      body += `<tr data-id="${h.id}"><td class="sticky-col habit-cell">
        <span class="habit-icon" style="color:${h.color}">${Icons.svg(h.icon, 15)}</span>
        <span class="habit-name">${this.escape(h.name)}</span>
        <div class="row-actions">
          <button data-action="edit" title="Edit">${Icons.svg('edit', 13)}</button>
          <button data-action="pin" title="${h.pinned ? 'Unpin' : 'Pin'}" class="${h.pinned ? 'active-action' : ''}">${Icons.svg('pin', 13)}</button>
          <button data-action="duplicate" title="Duplicate">${Icons.svg('copy', 13)}</button>
          <button data-action="archive" title="${h.archived ? 'Restore' : 'Archive'}">${Icons.svg(h.archived ? 'restore' : 'archive', 13)}</button>
          <button data-action="delete" title="Delete">${Icons.svg('trash', 13)}</button>
        </div>
      </td>`;
      for (let d = 1; d <= days; d++) {
        const key = CalendarUtil.formatDateKey(new Date(now.getFullYear(), now.getMonth(), d));
        const done = store.isComplete(h.id, key);
        body += `<td><button class="cell-check${done ? ' checked' : ''}" data-toggle="${h.id}" data-date="${key}" style="--habit-color:${h.color}">${done ? Icons.svg('check', 10) : ''}</button></td>`;
      }
      body += `<td class="streak-cell">${Stats.getCurrentStreak(h.id)} ${Icons.svg('flame', 12)}</td></tr>`;
    });
    body += '</tbody>';

    if (list.length === 0) {
      table.outerHTML = `<div class="table-wrap">${this.emptyState('No habits found', 'Try a different filter or add a new habit.')}</div>`;
      return;
    }

    table.innerHTML = head + body;

    table.querySelectorAll('[data-toggle]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-toggle');
        const date = btn.getAttribute('data-date');
        store.toggleLog(id, date);
        this.renderHabitTable();
        this.renderSidebar();
      });
    });
    table.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const row = e.target.closest('tr');
        const id = row.getAttribute('data-id');
        const action = btn.getAttribute('data-action');
        this.handleHabitAction(id, action);
      });
    });
  },

  handleHabitAction(id, action) {
    const h = store.habits.find(x => x.id === id);
    if (!h) return;
    if (action === 'edit') this.openHabitModal(id);
    if (action === 'pin') { store.updateHabit(id, { pinned: !h.pinned }); this.renderHabitsView(document.getElementById('mainContent')); }
    if (action === 'duplicate') { store.duplicateHabit(id); this.renderHabitsView(document.getElementById('mainContent')); this.toast('Habit duplicated'); }
    if (action === 'archive') { store.updateHabit(id, { archived: !h.archived }); this.renderHabitsView(document.getElementById('mainContent')); }
    if (action === 'delete') {
      const proceed = store.settings.confirmDelete ? confirm(`Delete "${h.name}"? This cannot be undone.`) : true;
      if (proceed) {
        store.deleteHabit(id);
        this.renderHabitsView(document.getElementById('mainContent'));
        this.toast('Habit deleted');
      }
    }
  },

  renderStatisticsView(main) {
    const ranking = Stats.rankHabits();
    main.innerHTML = `
      <div class="view-header"><div><p class="eyebrow">Insights</p><h1>Statistics</h1></div></div>
      <div class="chart-grid">
        <div class="chart-card"><h3>30-day completion by habit</h3><canvas id="barChart" style="width:100%;height:220px"></canvas></div>
        <div class="chart-card"><h3>Weekly trend</h3><canvas id="lineChart" style="width:100%;height:220px"></canvas></div>
        <div class="chart-card"><h3>Category split</h3><canvas id="pieChart" width="220" height="220"></canvas><div id="pieLegend" class="legend"></div></div>
        <div class="chart-card"><h3>Activity heatmap</h3><div class="heatmap-scroll"><canvas id="heatmap"></canvas></div></div>
      </div>
      <h2 class="section-title">Habit ranking</h2>
      <div class="rank-list" id="rankList"></div>
    `;

    Charts.drawBarChart(document.getElementById('barChart'), ranking.slice(0, 8).map(r => ({ label: r.habit.name.slice(0, 6), value: r.rate, color: r.habit.color })));

    const weekPoints = [];
    const d = new Date();
    d.setDate(d.getDate() - 6);
    for (let i = 0; i < 7; i++) {
      const key = CalendarUtil.formatDateKey(d);
      const active = store.habits.filter(h => !h.archived);
      const done = active.filter(h => store.isComplete(h.id, key)).length;
      weekPoints.push({ label: CalendarUtil.dayNamesShort[d.getDay()], value: active.length ? Math.round((done / active.length) * 100) : 0 });
      d.setDate(d.getDate() + 1);
    }
    Charts.drawLineChart(document.getElementById('lineChart'), weekPoints);

    const catCounts = {};
    store.habits.filter(h => !h.archived).forEach(h => { catCounts[h.category] = (catCounts[h.category] || 0) + 1; });
    const slices = Object.keys(catCounts).map(cid => {
      const cat = store.categories.find(c => c.id === cid) || { name: cid, color: '#888' };
      return { label: cat.name, value: catCounts[cid], color: cat.color };
    });
    Charts.drawPieChart(document.getElementById('pieChart'), slices);
    document.getElementById('pieLegend').innerHTML = slices.map(s => `<span class="legend-item"><i style="background:${s.color}"></i>${s.label}</span>`).join('');

    const weeks = [];
    const startDay = new Date();
    startDay.setDate(startDay.getDate() - 20 * 7);
    for (let w = 0; w < 20; w++) {
      const col = [];
      for (let dd = 0; dd < 7; dd++) {
        const day = new Date(startDay);
        day.setDate(day.getDate() + w * 7 + dd);
        if (day > new Date()) { col.push(null); continue; }
        const key = CalendarUtil.formatDateKey(day);
        const active = store.habits.filter(h => !h.archived);
        const done = active.filter(h => store.isComplete(h.id, key)).length;
        col.push(active.length ? Math.round((done / active.length) * 100) : 0);
      }
      weeks.push(col);
    }
    Charts.drawHeatmap(document.getElementById('heatmap'), weeks);

    document.getElementById('rankList').innerHTML = ranking.map((r, i) => `
      <div class="rank-row">
        <span class="rank-pos">${i + 1}</span>
        <span class="today-icon" style="color:${r.habit.color}">${Icons.svg(r.habit.icon, 16)}</span>
        <span class="today-name">${this.escape(r.habit.name)}</span>
        <span class="rank-badge">${r.rate}% · ${r.streak}d streak · best ${r.longest}d</span>
      </div>`).join('') || this.emptyState('No data yet', 'Track a few days to see rankings.');
  },

  renderSettingsView(main) {
    const s = store.settings;
    main.innerHTML = `
      <div class="view-header"><div><p class="eyebrow">Preferences</p><h1>Settings</h1></div></div>
      <div class="settings-grid">
        <div class="settings-card">
          <h3>Appearance</h3>
          <label class="settings-row">Theme
            <select id="setTheme"><option value="light">Light</option><option value="dark">Dark</option></select>
          </label>
          <label class="settings-row">Accent color
            <input type="color" id="setAccent" value="${s.accent}">
          </label>
          <label class="settings-row">Animation speed
            <select id="setAnim"><option value="slow">Slow</option><option value="normal">Normal</option><option value="fast">Fast</option></select>
          </label>
        </div>
        <div class="settings-card">
          <h3>Behavior</h3>
          <label class="settings-row">Week starts on
            <select id="setWeekStart"><option value="sunday">Sunday</option><option value="monday">Monday</option></select>
          </label>
          <label class="settings-row">Confirm before delete
            <input type="checkbox" id="setConfirmDelete">
          </label>
          <label class="settings-row">Daily reminder time
            <input type="time" id="setReminderTime" value="${s.reminderTime}">
          </label>
          <button class="btn-ghost" id="enableNotifications">Enable browser notifications</button>
        </div>
        <div class="settings-card">
          <h3>Data</h3>
          <button class="btn-ghost" id="exportBtn">Export JSON</button>
          <label class="btn-ghost file-label">Import JSON<input type="file" id="importInput" accept="application/json" hidden></label>
          <button class="btn-ghost" id="exportCsvBtn">Export CSV</button>
          <button class="btn-danger" id="resetBtn">Reset all data</button>
        </div>
        <div class="settings-card">
          <h3>Categories</h3>
          <div id="categoryList" class="category-list"></div>
          <div class="new-category-row">
            <input type="text" id="newCatName" placeholder="New category name">
            <input type="color" id="newCatColor" value="#2f6e51">
            <button class="btn-ghost" id="addCatBtn">Add</button>
          </div>
        </div>
      </div>
    `;
    document.getElementById('setTheme').value = s.theme;
    document.getElementById('setAnim').value = s.animationSpeed;
    document.getElementById('setWeekStart').value = s.weekStart;
    document.getElementById('setConfirmDelete').checked = s.confirmDelete;

    document.getElementById('setTheme').addEventListener('change', (e) => { s.theme = e.target.value; store.saveSettings(); Theme.apply(); });
    document.getElementById('setAccent').addEventListener('input', (e) => Theme.setAccent(e.target.value));
    document.getElementById('setAnim').addEventListener('change', (e) => { s.animationSpeed = e.target.value; store.saveSettings(); Theme.apply(); });
    document.getElementById('setWeekStart').addEventListener('change', (e) => { s.weekStart = e.target.value; store.saveSettings(); });
    document.getElementById('setConfirmDelete').addEventListener('change', (e) => { s.confirmDelete = e.target.checked; store.saveSettings(); });
    document.getElementById('setReminderTime').addEventListener('change', (e) => { s.reminderTime = e.target.value; store.saveSettings(); this.scheduleReminders(); });
    document.getElementById('enableNotifications').addEventListener('click', () => this.requestNotifications());

    document.getElementById('exportBtn').addEventListener('click', () => this.exportJSON());
    document.getElementById('exportCsvBtn').addEventListener('click', () => this.exportCSV());
    document.getElementById('importInput').addEventListener('change', (e) => this.importJSON(e.target.files[0]));
    document.getElementById('resetBtn').addEventListener('click', () => {
      if (confirm('This will permanently erase all habits and progress. Continue?')) {
        store.resetAll();
        this.renderSidebar();
        this.switchView('dashboard');
        this.toast('All data has been reset');
      }
    });

    document.getElementById('addCatBtn').addEventListener('click', () => {
      const name = document.getElementById('newCatName').value.trim();
      if (!name) return;
      store.addCategory({ name, color: document.getElementById('newCatColor').value });
      this.renderSettingsView(main);
    });

    document.getElementById('categoryList').innerHTML = store.categories.map(c => `<span class="cat-pill" style="--pill-color:${c.color}">${c.name}</span>`).join('');
  },

  exportJSON() {
    const blob = new Blob([store.exportData()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'habit-tracker-backup.json';
    a.click();
    URL.revokeObjectURL(url);
    this.toast('Backup exported');
  },

  exportCSV() {
    let rows = [['Habit', 'Category', 'Date', 'Completed']];
    store.habits.forEach(h => {
      const logs = store.logs[h.id] || {};
      Object.keys(logs).forEach(date => rows.push([h.name, h.category, date, 'Yes']));
    });
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'habit-tracker.csv';
    a.click();
    URL.revokeObjectURL(url);
    this.toast('CSV exported');
  },

  importJSON(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        store.importData(reader.result);
        this.renderSidebar();
        this.switchView('dashboard');
        this.toast('Backup imported successfully');
      } catch (e) {
        this.toast('Import failed: invalid file');
      }
    };
    reader.readAsText(file);
  },

  requestNotifications() {
    if (!('Notification' in window)) { this.toast('Notifications are not supported here'); return; }
    Notification.requestPermission().then(perm => {
      store.settings.notificationsEnabled = perm === 'granted';
      store.saveSettings();
      this.toast(perm === 'granted' ? 'Notifications enabled' : 'Notifications permission denied');
      this.scheduleReminders();
    });
  },

  scheduleReminders() {
    if (this._reminderTimer) clearInterval(this._reminderTimer);
    this._reminderTimer = setInterval(() => {
      if (!store.settings.notificationsEnabled || !('Notification' in window)) return;
      const now = new Date();
      const [h, m] = store.settings.reminderTime.split(':').map(Number);
      if (now.getHours() === h && now.getMinutes() === m) {
        const stats = Stats.getTodayCompletionCount();
        if (stats.done < stats.total) {
          new Notification('Habit reminder', { body: `You still have ${stats.total - stats.done} habits left today.` });
        }
      }
    }, 60000);
  },

  openHabitModal(id) {
    this.state.editingHabitId = id;
    const h = id ? store.habits.find(x => x.id === id) : null;
    this.openModal(`
      <h2>${h ? 'Edit habit' : 'New habit'}</h2>
      <div class="form-grid">
        <label>Name<input type="text" id="fName" value="${h ? this.escape(h.name) : ''}" placeholder="e.g. Morning meditation"></label>
        <label class="full">Icon
          <div class="icon-picker">${HABIT_ICON_SET.map(i => `<button type="button" class="icon-opt${h && h.icon === i.key ? ' selected' : ''}" data-icon="${i.key}" title="${i.label}">${Icons.svg(i.key, 16)}</button>`).join('')}</div>
        </label>
        <label>Color<input type="color" id="fColor" value="${h ? h.color : '#2f6e51'}"></label>
        <label>Category
          <select id="fCategory">${store.categories.map(c => `<option value="${c.id}" ${h && h.category === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}</select>
        </label>
        <label>Priority
          <select id="fPriority">
            <option value="low" ${h && h.priority === 'low' ? 'selected' : ''}>Low</option>
            <option value="medium" ${!h || h.priority === 'medium' ? 'selected' : ''}>Medium</option>
            <option value="high" ${h && h.priority === 'high' ? 'selected' : ''}>High</option>
          </select>
        </label>
        <label>Goal<input type="text" id="fGoal" value="${h ? this.escape(h.goal || '') : ''}" placeholder="e.g. 30 minutes"></label>
        <label>Reminder time<input type="time" id="fReminder" value="${h ? h.reminder || '' : ''}"></label>
        <label class="full">Notes<textarea id="fNotes" placeholder="Optional notes">${h ? this.escape(h.notes || '') : ''}</textarea></label>
      </div>
      <div class="modal-actions">
        <button class="btn-ghost" id="cancelHabit">Cancel</button>
        <button class="btn-primary" id="saveHabit">${h ? 'Save changes' : 'Add habit'}</button>
      </div>
    `);

    let selectedIcon = h ? h.icon : HABIT_ICON_SET[0].key;
    document.querySelectorAll('.icon-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.icon-opt').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedIcon = btn.getAttribute('data-icon');
      });
    });
    if (!document.querySelector('.icon-opt.selected')) document.querySelector('.icon-opt').classList.add('selected');

    document.getElementById('cancelHabit').addEventListener('click', () => this.closeModal());
    document.getElementById('saveHabit').addEventListener('click', () => {
      const name = document.getElementById('fName').value.trim();
      if (!name) { this.toast('Please enter a habit name'); return; }
      const payload = {
        name,
        icon: selectedIcon,
        color: document.getElementById('fColor').value,
        category: document.getElementById('fCategory').value,
        priority: document.getElementById('fPriority').value,
        goal: document.getElementById('fGoal').value.trim(),
        reminder: document.getElementById('fReminder').value,
        notes: document.getElementById('fNotes').value.trim()
      };
      if (h) {
        store.updateHabit(h.id, payload);
        this.toast('Habit updated');
      } else {
        Object.assign(payload, { archived: false, pinned: false, favorite: false });
        store.addHabit(payload);
        this.toast('Habit added');
      }
      this.closeModal();
      this.renderCurrentView();
      this.renderSidebar();
    });
  },

  openModal(innerHtml) {
    const overlay = document.getElementById('modalOverlay');
    document.getElementById('modalBox').innerHTML = innerHtml;
    overlay.classList.add('visible');
  },

  closeModal() {
    document.getElementById('modalOverlay').classList.remove('visible');
  },

  toast(message) {
    const container = document.getElementById('toastContainer');
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = message;
    container.appendChild(el);
    requestAnimationFrame(() => el.classList.add('visible'));
    setTimeout(() => { el.classList.remove('visible'); setTimeout(() => el.remove(), 300); }, 2600);
  },

  emptyState(title, sub) {
    return `<div class="empty-state"><div class="empty-icon">${Icons.svg('inbox', 30)}</div><h3>${title}</h3><p>${sub}</p></div>`;
  },

  escape(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  confetti() {
    const canvas = document.getElementById('confettiCanvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.classList.add('visible');
    const colors = ['#2f6e51', '#c2632b', '#3a5a9b', '#9a6b2f', '#6b4fa0'];
    const pieces = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * canvas.height * 0.3,
      r: 4 + Math.random() * 5,
      c: colors[Math.floor(Math.random() * colors.length)],
      vy: 2 + Math.random() * 3,
      vx: -2 + Math.random() * 4,
      rot: Math.random() * 360,
      vr: -6 + Math.random() * 12
    }));
    let frame = 0;
    const loop = () => {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r);
        ctx.restore();
      });
      if (frame < 140) requestAnimationFrame(loop);
      else { canvas.classList.remove('visible'); ctx.clearRect(0, 0, canvas.width, canvas.height); }
    };
    loop();
  }
};
