import { useState, useEffect, useCallback } from 'react';

export interface FavoriteItem {
    id: string;
    type: 'rathole' | 'dino' | 'location';
    name: string;
    mapId?: string;
    addedAt: number;
}

interface UseFavoritesReturn {
    favorites: FavoriteItem[];
    isFavorite: (id: string) => boolean;
    addFavorite: (item: Omit<FavoriteItem, 'addedAt'>) => void;
    removeFavorite: (id: string) => void;
    toggleFavorite: (item: Omit<FavoriteItem, 'addedAt'>) => void;
    clearFavorites: () => void;
    getFavoritesByType: (type: FavoriteItem['type']) => FavoriteItem[];
}

const STORAGE_KEY = 'ark-pvp-favorites';

export function useFavorites(): UseFavoritesReturn {
    const [favorites, setFavorites] = useState<FavoriteItem[]>([]);

    // Load from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                setFavorites(JSON.parse(stored));
            }
        } catch (error) {
            console.error('Failed to load favorites:', error);
        }
    }, []);

    // Save to localStorage whenever favorites change
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
        } catch (error) {
            console.error('Failed to save favorites:', error);
        }
    }, [favorites]);

    const isFavorite = useCallback((id: string) => {
        return favorites.some(fav => fav.id === id);
    }, [favorites]);

    const addFavorite = useCallback((item: Omit<FavoriteItem, 'addedAt'>) => {
        setFavorites(prev => {
            if (prev.some(fav => fav.id === item.id)) {
                return prev;
            }
            return [...prev, { ...item, addedAt: Date.now() }];
        });
    }, []);

    const removeFavorite = useCallback((id: string) => {
        setFavorites(prev => prev.filter(fav => fav.id !== id));
    }, []);

    const toggleFavorite = useCallback((item: Omit<FavoriteItem, 'addedAt'>) => {
        if (isFavorite(item.id)) {
            removeFavorite(item.id);
        } else {
            addFavorite(item);
        }
    }, [isFavorite, addFavorite, removeFavorite]);

    const clearFavorites = useCallback(() => {
        setFavorites([]);
    }, []);

    const getFavoritesByType = useCallback((type: FavoriteItem['type']) => {
        return favorites.filter(fav => fav.type === type);
    }, [favorites]);

    return {
        favorites,
        isFavorite,
        addFavorite,
        removeFavorite,
        toggleFavorite,
        clearFavorites,
        getFavoritesByType,
    };
}
