const Theme = {
  apply() {
    const root = document.documentElement;
    root.setAttribute('data-theme', store.settings.theme);
    root.style.setProperty('--accent', store.settings.accent);
    root.style.setProperty('--speed-mult', store.settings.animationSpeed === 'fast' ? '0.5' : store.settings.animationSpeed === 'slow' ? '1.8' : '1');
  },

  toggle() {
    store.settings.theme = store.settings.theme === 'light' ? 'dark' : 'light';
    store.saveSettings();
    this.apply();
  },

  setAccent(hex) {
    store.settings.accent = hex;
    store.saveSettings();
    this.apply();
  }
};
