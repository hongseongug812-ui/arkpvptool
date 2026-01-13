import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { GameVersion } from '../types';
import { storage } from '../utils/storage';

interface GameVersionContextType {
    gameVersion: GameVersion;
    setGameVersion: (version: GameVersion) => void;
}

const GameVersionContext = createContext<GameVersionContextType | null>(null);

export function GameVersionProvider({ children }: { children: ReactNode }) {
    // Load initial value from localStorage
    const [gameVersion, setGameVersionState] = useState<GameVersion>(() => {
        const saved = storage.getGameVersion();
        return (saved === 'ASA' || saved === 'ASE') ? saved : 'ASA';
    });

    // Wrapper to save to localStorage
    const setGameVersion = (version: GameVersion) => {
        setGameVersionState(version);
        storage.setGameVersion(version);
    };

    // Update HTML data-theme attribute when version changes
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', gameVersion);
    }, [gameVersion]);

    return (
        <GameVersionContext.Provider value={{ gameVersion, setGameVersion }}>
            {children}
        </GameVersionContext.Provider>
    );
}

export function useGameVersion() {
    const context = useContext(GameVersionContext);
    if (!context) {
        throw new Error('useGameVersion must be used within a GameVersionProvider');
    }
    return context;
}
