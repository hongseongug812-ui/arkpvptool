import { useState, useEffect, useCallback } from 'react';

const THEME_KEY = 'ark-pvp-theme';

export interface ThemeConfig {
    preset: 'cyberpunk' | 'neon' | 'classic' | 'ocean' | 'custom';
    accentColor: string;
    accentGlow: string;
}

const THEME_PRESETS: Record<string, Omit<ThemeConfig, 'preset'>> = {
    cyberpunk: {
        accentColor: '#00D9FF',
        accentGlow: 'rgba(0, 217, 255, 0.5)',
    },
    neon: {
        accentColor: '#FF00FF',
        accentGlow: 'rgba(255, 0, 255, 0.5)',
    },
    classic: {
        accentColor: '#4CAF50',
        accentGlow: 'rgba(76, 175, 80, 0.5)',
    },
    ocean: {
        accentColor: '#00BCD4',
        accentGlow: 'rgba(0, 188, 212, 0.5)',
    },
};

const DEFAULT_THEME: ThemeConfig = {
    preset: 'cyberpunk',
    accentColor: '#00D9FF',
    accentGlow: 'rgba(0, 217, 255, 0.5)',
};

export function useTheme() {
    const [theme, setTheme] = useState<ThemeConfig>(DEFAULT_THEME);

    // Load theme from localStorage
    useEffect(() => {
        const saved = localStorage.getItem(THEME_KEY);
        if (saved) {
            try {
                setTheme(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse theme:', e);
            }
        }
    }, []);

    // Apply theme to CSS variables
    useEffect(() => {
        document.documentElement.style.setProperty('--color-accent', theme.accentColor);
        document.documentElement.style.setProperty('--color-accent-glow', theme.accentGlow);
        document.documentElement.style.setProperty('--color-accent-dim', `${theme.accentColor}20`);
    }, [theme]);

    // Save theme to localStorage
    const saveTheme = useCallback((newTheme: ThemeConfig) => {
        setTheme(newTheme);
        localStorage.setItem(THEME_KEY, JSON.stringify(newTheme));
    }, []);

    // Apply preset
    const applyPreset = useCallback((preset: ThemeConfig['preset']) => {
        if (preset === 'custom') {
            saveTheme({ ...theme, preset: 'custom' });
        } else {
            const presetConfig = THEME_PRESETS[preset];
            saveTheme({
                preset,
                ...presetConfig,
            });
        }
    }, [theme, saveTheme]);

    // Set custom accent color
    const setAccentColor = useCallback((color: string) => {
        // Generate glow from color
        const glow = color + '80'; // 50% opacity
        saveTheme({
            preset: 'custom',
            accentColor: color,
            accentGlow: glow,
        });
    }, [saveTheme]);

    return {
        theme,
        presets: Object.keys(THEME_PRESETS) as ThemeConfig['preset'][],
        applyPreset,
        setAccentColor,
    };
}
