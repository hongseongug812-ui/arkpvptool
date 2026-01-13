// Local Storage utility for persisting user settings

const STORAGE_KEYS = {
    GAME_VERSION: 'ark_tactics_game_version',
    SERVER_SETTINGS: 'ark_tactics_server_settings',
    LAST_TAB: 'ark_tactics_last_tab',
    USER_PREFERENCES: 'ark_tactics_preferences',
} as const;

type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

// Generic get/set with JSON serialization
export function getStorageItem<T>(key: StorageKey, defaultValue: T): T {
    try {
        const item = localStorage.getItem(key);
        if (item === null) return defaultValue;
        return JSON.parse(item) as T;
    } catch (error) {
        console.warn(`Failed to read from localStorage: ${key}`, error);
        return defaultValue;
    }
}

export function setStorageItem<T>(key: StorageKey, value: T): boolean {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.warn(`Failed to write to localStorage: ${key}`, error);
        return false;
    }
}

export function removeStorageItem(key: StorageKey): void {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.warn(`Failed to remove from localStorage: ${key}`, error);
    }
}

// Specific helpers
export const storage = {
    // Game Version
    getGameVersion: () => getStorageItem(STORAGE_KEYS.GAME_VERSION, 'ASA'),
    setGameVersion: (version: 'ASA' | 'ASE') => setStorageItem(STORAGE_KEYS.GAME_VERSION, version),

    // Server Settings
    getServerSettings: () =>
        getStorageItem(STORAGE_KEYS.SERVER_SETTINGS, {
            maxWildLevel: 150,
            tamingMultiplier: 1.0,
            damageMultiplier: 1.0,
        }),
    setServerSettings: (settings: Record<string, number>) =>
        setStorageItem(STORAGE_KEYS.SERVER_SETTINGS, settings),

    // Last Tab
    getLastTab: () => getStorageItem(STORAGE_KEYS.LAST_TAB, 'raid'),
    setLastTab: (tab: string) => setStorageItem(STORAGE_KEYS.LAST_TAB, tab),

    // User Preferences
    getPreferences: () =>
        getStorageItem(STORAGE_KEYS.USER_PREFERENCES, {
            showSplashOnStart: true,
            autoSaveSettings: true,
        }),
    setPreferences: (prefs: Record<string, boolean>) =>
        setStorageItem(STORAGE_KEYS.USER_PREFERENCES, prefs),

    // Clear all
    clearAll: () => {
        Object.values(STORAGE_KEYS).forEach((key) => {
            removeStorageItem(key);
        });
    },
};

export default storage;
