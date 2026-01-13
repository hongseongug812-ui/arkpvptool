import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { GameVersion } from '../types';

interface GameVersionContextType {
    gameVersion: GameVersion;
    setGameVersion: (version: GameVersion) => void;
}

const GameVersionContext = createContext<GameVersionContextType | null>(null);

export function GameVersionProvider({ children }: { children: ReactNode }) {
    const [gameVersion, setGameVersion] = useState<GameVersion>('ASA');

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
