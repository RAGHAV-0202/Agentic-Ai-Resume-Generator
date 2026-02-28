/**
 * useTheme — Dark mode toggle hook
 * 
 * Manages theme state via localStorage + class on <html>.
 * Tailwind's `dark:` variant activates when <html class="dark">.
 */
import { useState, useEffect, useCallback } from 'react';

export const useTheme = () => {
    const [isDark, setIsDark] = useState(() => {
        if (typeof window === 'undefined') return false;
        const saved = localStorage.getItem('theme');
        if (saved) return saved === 'dark';
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    useEffect(() => {
        const root = document.documentElement;
        if (isDark) {
            root.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            root.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDark]);

    const toggleTheme = useCallback(() => {
        setIsDark(prev => !prev);
    }, []);

    return { isDark, toggleTheme };
};
