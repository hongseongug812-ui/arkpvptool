import { useState, useEffect, useCallback } from 'react';

export interface RecentItem {
    id: string;
    type: 'rathole' | 'dino' | 'structure';
    name: string;
    viewedAt: number;
    mapId?: string;
}

interface UseRecentHistoryReturn {
    recentItems: RecentItem[];
    addToHistory: (item: Omit<RecentItem, 'viewedAt'>) => void;
    clearHistory: () => void;
    getRecentByType: (type: RecentItem['type']) => RecentItem[];
}

const STORAGE_KEY = 'ark-pvp-recent-history';
const MAX_ITEMS = 20;

export function useRecentHistory(): UseRecentHistoryReturn {
    const [recentItems, setRecentItems] = useState<RecentItem[]>([]);

    // Load from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                setRecentItems(JSON.parse(stored));
            }
        } catch (error) {
            console.error('Failed to load recent history:', error);
        }
    }, []);

    // Save to localStorage whenever items change
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(recentItems));
        } catch (error) {
            console.error('Failed to save recent history:', error);
        }
    }, [recentItems]);

    const addToHistory = useCallback((item: Omit<RecentItem, 'viewedAt'>) => {
        setRecentItems(prev => {
            // Remove existing entry if present
            const filtered = prev.filter(i => i.id !== item.id);
            // Add new entry at the beginning
            const updated = [{ ...item, viewedAt: Date.now() }, ...filtered];
            // Limit to max items
            return updated.slice(0, MAX_ITEMS);
        });
    }, []);

    const clearHistory = useCallback(() => {
        setRecentItems([]);
    }, []);

    const getRecentByType = useCallback((type: RecentItem['type']) => {
        return recentItems.filter(item => item.type === type);
    }, [recentItems]);

    return {
        recentItems,
        addToHistory,
        clearHistory,
        getRecentByType,
    };
}
