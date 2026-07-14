const STORAGE_KEYS = {
  habits: 'ht_habits',
  categories: 'ht_categories',
  settings: 'ht_settings',
  logs: 'ht_logs',
  meta: 'ht_meta'
};

const DEFAULT_CATEGORIES = [
  { id: 'health', name: 'Health', color: '#2f6e51' },
  { id: 'fitness', name: 'Fitness', color: '#c2632b' },
  { id: 'study', name: 'Study', color: '#3a5a9b' },
  { id: 'coding', name: 'Coding', color: '#6b4fa0' },
  { id: 'reading', name: 'Reading', color: '#9a6b2f' },
  { id: 'business', name: 'Business', color: '#2b6f7a' },
  { id: 'money', name: 'Money', color: '#7a7a2b' },
  { id: 'meditation', name: 'Meditation', color: '#5a4a8a' },
  { id: 'sleep', name: 'Sleep', color: '#3d3d6b' },
  { id: 'water', name: 'Water', color: '#2b6f9a' },
  { id: 'exercise', name: 'Exercise', color: '#a03b3b' }
];

const DEFAULT_SETTINGS = {
  theme: 'light',
  accent: '#2f6e51',
  animationSpeed: 'normal',
  weekStart: 'monday',
  autoBackup: false,
  confirmDelete: true,
  defaultMonth: 'current',
  reminderTime: '20:00',
  notificationsEnabled: false
};

class Store {
  constructor() {
    this.habits = this._load(STORAGE_KEYS.habits, []);
    this.categories = this._load(STORAGE_KEYS.categories, DEFAULT_CATEGORIES);
    this.settings = Object.assign({}, DEFAULT_SETTINGS, this._load(STORAGE_KEYS.settings, {}));
    this.logs = this._load(STORAGE_KEYS.logs, {});
    this.meta = this._load(STORAGE_KEYS.meta, { xp: 0, level: 1, badges: [], lastVisit: null });
  }

  _load(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }

  _save(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  }

  saveHabits() { return this._save(STORAGE_KEYS.habits, this.habits); }
  saveCategories() { return this._save(STORAGE_KEYS.categories, this.categories); }
  saveSettings() { return this._save(STORAGE_KEYS.settings, this.settings); }
  saveLogs() { return this._save(STORAGE_KEYS.logs, this.logs); }
  saveMeta() { return this._save(STORAGE_KEYS.meta, this.meta); }

  toggleLog(habitId, dateKey) {
    if (!this.logs[habitId]) this.logs[habitId] = {};
    const wasComplete = !!this.logs[habitId][dateKey];
    if (wasComplete) {
      delete this.logs[habitId][dateKey];
    } else {
      this.logs[habitId][dateKey] = true;
      this.meta.xp += 10;
      this.meta.level = Math.floor(this.meta.xp / 100) + 1;
      this.saveMeta();
    }
    this.saveLogs();
    return !wasComplete;
  }

  isComplete(habitId, dateKey) {
    return !!(this.logs[habitId] && this.logs[habitId][dateKey]);
  }

  addHabit(habit) {
    habit.id = 'h_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    habit.order = this.habits.length;
    habit.createdAt = Date.now();
    this.habits.push(habit);
    this.saveHabits();
    return habit;
  }

  updateHabit(id, patch) {
    const h = this.habits.find(x => x.id === id);
    if (!h) return null;
    Object.assign(h, patch);
    this.saveHabits();
    return h;
  }

  deleteHabit(id) {
    this.habits = this.habits.filter(x => x.id !== id);
    delete this.logs[id];
    this.saveHabits();
    this.saveLogs();
  }

  duplicateHabit(id) {
    const h = this.habits.find(x => x.id === id);
    if (!h) return null;
    const copy = Object.assign({}, h, { name: h.name + ' (copy)' });
    return this.addHabit(copy);
  }

  addCategory(cat) {
    cat.id = 'c_' + Date.now();
    this.categories.push(cat);
    this.saveCategories();
    return cat;
  }

  exportData() {
    return JSON.stringify({
      habits: this.habits,
      categories: this.categories,
      settings: this.settings,
      logs: this.logs,
      meta: this.meta,
      exportedAt: new Date().toISOString()
    }, null, 2);
  }

  importData(json) {
    const data = JSON.parse(json);
    if (data.habits) this.habits = data.habits;
    if (data.categories) this.categories = data.categories;
    if (data.settings) this.settings = Object.assign({}, DEFAULT_SETTINGS, data.settings);
    if (data.logs) this.logs = data.logs;
    if (data.meta) this.meta = data.meta;
    this.saveHabits();
    this.saveCategories();
    this.saveSettings();
    this.saveLogs();
    this.saveMeta();
  }

  resetAll() {
    localStorage.clear();
    this.habits = [];
    this.categories = DEFAULT_CATEGORIES.slice();
    this.settings = Object.assign({}, DEFAULT_SETTINGS);
    this.logs = {};
    this.meta = { xp: 0, level: 1, badges: [], lastVisit: null };
    this.saveHabits();
    this.saveCategories();
    this.saveSettings();
    this.saveLogs();
    this.saveMeta();
  }
}

const store = new Store();
