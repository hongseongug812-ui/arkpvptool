import { createContext, useContext, useState, type ReactNode } from 'react';

interface ServerSettings {
    maxWildLevel: number;
    difficultyOffset: number;
    tamingMultiplier: number;
}

interface ServerSettingsContextType {
    settings: ServerSettings;
    updateSettings: (newSettings: Partial<ServerSettings>) => void;
}

const defaultSettings: ServerSettings = {
    maxWildLevel: 150,
    difficultyOffset: 5.0,
    tamingMultiplier: 1.0,
};

const ServerSettingsContext = createContext<ServerSettingsContextType | null>(null);

export function ServerSettingsProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<ServerSettings>(defaultSettings);

    const updateSettings = (newSettings: Partial<ServerSettings>) => {
        setSettings((prev) => ({ ...prev, ...newSettings }));
    };

    return (
        <ServerSettingsContext.Provider value={{ settings, updateSettings }}>
            {children}
        </ServerSettingsContext.Provider>
    );
}

export function useServerSettings() {
    const context = useContext(ServerSettingsContext);
    if (!context) {
        throw new Error('useServerSettings must be used within a ServerSettingsProvider');
    }
    return context;
}
