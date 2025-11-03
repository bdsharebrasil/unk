import React, { useEffect, useState } from 'react';

const STORAGE_KEY = 'theme';

function getPreferred(): string {
  if (typeof window === 'undefined') return 'dark';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) return stored;
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  return prefersDark ? 'dark' : 'light';
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<string>(() => getPreferred());

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light');
    try { localStorage.setItem(STORAGE_KEY, theme); } catch (e) { /* ignore */ }
  }, [theme]);

  const toggle = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return (
    <button
      aria-label="Alternar tema"
      title="Alternar tema"
      onClick={toggle}
      className="flex items-center gap-2 px-3 py-1 rounded-md text-sm bg-transparent border border-transparent hover:opacity-90"
      style={{
        background: 'transparent',
        color: 'var(--foreground)'
      }}
    >
      {theme === 'dark' ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" fill="currentColor" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6.76 4.84l-1.8-1.79L3.17 5l1.79 1.79 1.8-1.95zM1 13h3v-2H1v2zm10 8h2v-3h-2v3zm9.03-3.03l-1.79-1.79-1.95 1.8L19 19.83l1.03-1.86zM17.24 4.84l1.8-1.79L20.83 5l-1.79 1.79-1.8-1.95zM22 11v2h-3v-2h3zM4.24 19.78l1.79-1.8L4.24 16l-1.79 1.79 1.79 1.99zM12 6a6 6 0 100 12A6 6 0 0012 6z" fill="currentColor"/>
        </svg>
      )}
      <span className="hidden sm:inline">{theme === 'dark' ? 'Dark' : 'Light'}</span>
    </button>
  );
}
