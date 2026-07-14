const Stats = {
  getCurrentStreak(habitId) {
    let streak = 0;
    let d = new Date();
    while (true) {
      const key = CalendarUtil.formatDateKey(d);
      if (store.isComplete(habitId, key)) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else {
        if (streak === 0) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yKey = CalendarUtil.formatDateKey(yesterday);
          if (CalendarUtil.formatDateKey(d) === CalendarUtil.formatDateKey(new Date()) && store.isComplete(habitId, yKey)) {
            d = yesterday;
            continue;
          }
        }
        break;
      }
    }
    return streak;
  },

  getLongestStreak(habitId) {
    const dates = Object.keys(store.logs[habitId] || {}).sort();
    if (dates.length === 0) return 0;
    let longest = 1, current = 1;
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1]);
      const cur = new Date(dates[i]);
      const diff = Math.round((cur - prev) / 86400000);
      if (diff === 1) { current++; longest = Math.max(longest, current); }
      else current = 1;
    }
    return Math.max(longest, current);
  },

  getCompletionRate(habitId, days = 30) {
    let completed = 0;
    const d = new Date();
    for (let i = 0; i < days; i++) {
      const key = CalendarUtil.formatDateKey(d);
      if (store.isComplete(habitId, key)) completed++;
      d.setDate(d.getDate() - 1);
    }
    return Math.round((completed / days) * 100);
  },

  getTodayCompletionCount() {
    const key = CalendarUtil.formatDateKey(new Date());
    const active = store.habits.filter(h => !h.archived);
    const done = active.filter(h => store.isComplete(h.id, key)).length;
    return { done, total: active.length, pct: active.length ? Math.round((done / active.length) * 100) : 0 };
  },

  getWeeklyPct() {
    const active = store.habits.filter(h => !h.archived);
    if (active.length === 0) return 0;
    let done = 0, possible = 0;
    const d = new Date();
    for (let i = 0; i < 7; i++) {
      const key = CalendarUtil.formatDateKey(d);
      active.forEach(h => { possible++; if (store.isComplete(h.id, key)) done++; });
      d.setDate(d.getDate() - 1);
    }
    return Math.round((done / possible) * 100);
  },

  getMonthlyPct() {
    const active = store.habits.filter(h => !h.archived);
    if (active.length === 0) return 0;
    const now = new Date();
    const days = CalendarUtil.daysInMonth(now.getFullYear(), now.getMonth());
    let done = 0, possible = 0;
    for (let i = 1; i <= days; i++) {
      const key = CalendarUtil.formatDateKey(new Date(now.getFullYear(), now.getMonth(), i));
      active.forEach(h => { possible++; if (store.isComplete(h.id, key)) done++; });
    }
    return Math.round((done / possible) * 100);
  },

  rankHabits() {
    const active = store.habits.filter(h => !h.archived);
    return active.map(h => ({
      habit: h,
      rate: this.getCompletionRate(h.id, 30),
      streak: this.getCurrentStreak(h.id),
      longest: this.getLongestStreak(h.id)
    })).sort((a, b) => b.rate - a.rate);
  }
};

const Charts = {
  css(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  },

  clear(ctx, canvas) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  },

  drawProgressRing(canvas, pct, label) {
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const size = canvas.clientWidth;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);
    const cx = size / 2, cy = size / 2, r = size / 2 - 10;
    ctx.clearRect(0, 0, size, size);
    ctx.lineWidth = 10;
    ctx.strokeStyle = this.css('--track');
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = this.css('--accent');
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * (pct / 100)));
    ctx.stroke();
    ctx.fillStyle = this.css('--text');
    ctx.font = '600 20px Space Grotesk, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(pct + '%', cx, cy - 4);
    ctx.font = '400 11px Inter, sans-serif';
    ctx.fillStyle = this.css('--text-muted');
    ctx.fillText(label, cx, cy + 16);
  },

  drawBarChart(canvas, data) {
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);
    if (data.length === 0) return;
    const max = Math.max(...data.map(d => d.value), 1);
    const barW = w / data.length;
    data.forEach((d, i) => {
      const barH = (d.value / max) * (h - 30);
      const x = i * barW + barW * 0.2;
      const y = h - barH - 20;
      ctx.fillStyle = d.color || this.css('--accent');
      const bw = barW * 0.6;
      const rad = 4;
      ctx.beginPath();
      ctx.moveTo(x, y + barH);
      ctx.arcTo(x, y, x + rad, y, rad);
      ctx.arcTo(x + bw, y, x + bw, y + rad, rad);
      ctx.lineTo(x + bw, y + barH);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = this.css('--text-muted');
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(d.label, x + bw / 2, h - 6);
    });
  },

  drawLineChart(canvas, points) {
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);
    if (points.length === 0) return;
    const max = Math.max(...points.map(p => p.value), 1);
    const stepX = w / Math.max(points.length - 1, 1);
    ctx.beginPath();
    points.forEach((p, i) => {
      const x = i * stepX;
      const y = h - 20 - (p.value / max) * (h - 30);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = this.css('--accent');
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.stroke();
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, this.css('--accent') + '55');
    grad.addColorStop(1, this.css('--accent') + '00');
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
  },

  drawPieChart(canvas, slices) {
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const size = canvas.clientWidth;
    canvas.width = size * dpr; canvas.height = size * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size, size);
    const total = slices.reduce((s, d) => s + d.value, 0);
    if (total === 0) return;
    const cx = size / 2, cy = size / 2, r = size / 2 - 6;
    let start = -Math.PI / 2;
    slices.forEach(s => {
      const angle = (s.value / total) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, start, start + angle);
      ctx.closePath();
      ctx.fillStyle = s.color;
      ctx.fill();
      start += angle;
    });
    ctx.fillStyle = this.css('--surface');
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2);
    ctx.fill();
  },

  drawHeatmap(canvas, weeks) {
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const cell = 12, gap = 3;
    const w = weeks.length * (cell + gap);
    const h = 7 * (cell + gap);
    canvas.width = w * dpr; canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);
    weeks.forEach((week, wi) => {
      week.forEach((intensity, di) => {
        const x = wi * (cell + gap), y = di * (cell + gap);
        ctx.fillStyle = intensity === null ? 'transparent' : this.intensityColor(intensity);
        this.roundRect(ctx, x, y, cell, cell, 3);
        ctx.fill();
      });
    });
  },

  roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  },

  intensityColor(pct) {
    if (pct <= 0) return this.css('--track');
    const accent = this.css('--accent');
    const alpha = 0.25 + Math.min(pct, 100) / 100 * 0.75;
    return this.hexToRgba(accent, alpha);
  },

  hexToRgba(hex, alpha) {
    const h = hex.replace('#', '');
    const bigint = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
    const r = (bigint >> 16) & 255, g = (bigint >> 8) & 255, b = bigint & 255;
    return `rgba(${r},${g},${b},${alpha})`;
  }
};
