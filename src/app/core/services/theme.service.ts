import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly storageKey = 'ifx_preferred_theme';
  public readonly isDark = signal<boolean>(true);

  constructor() {
    this.initTheme();
  }

  private initTheme(): void {
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      this.isDark.set(saved === 'dark');
    } else {
      // Preferencia nativa del sistema operativo
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.isDark.set(prefersDark);
    }
    this.applyTheme(this.isDark());
  }

  public toggleTheme(): void {
    const next = !this.isDark();
    this.isDark.set(next);
    localStorage.setItem(this.storageKey, next ? 'dark' : 'light');
    this.applyTheme(next);
  }

  private applyTheme(dark: boolean): void {
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }
}