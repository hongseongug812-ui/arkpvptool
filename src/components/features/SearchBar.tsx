import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { dataManager } from '../../services/DataManager';
import './SearchBar.css';

interface SearchResult {
    id: string;
    type: 'rathole' | 'dino' | 'structure';
    name: string;
    icon: string;
    meta: string;
    mapId?: string;
}

interface SearchBarProps {
    onResultSelect?: (result: SearchResult) => void;
    placeholder?: string;
}

export function SearchBar({ onResultSelect, placeholder = '검색 (Ctrl+K)' }: SearchBarProps) {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const resultsRef = useRef<HTMLDivElement>(null);

    // Get all searchable data
    const searchableData = useMemo(() => {
        const ratholes = dataManager.getAllRatholeLocations();
        const dinos = dataManager.getDinos();
        const structures = dataManager.getStructures();

        return {
            ratholes: ratholes.map(r => ({
                id: `rathole-${r.id}`,
                type: 'rathole' as const,
                name: r.name,
                icon: r.type === 'Cave' ? '🕳️' : r.type === 'Underwater' ? '🌊' : '📍',
                meta: `${r.type} • ${r.difficulty}`,
            })),
            dinos: dinos.map(d => ({
                id: `dino-${d.id}`,
                type: 'dino' as const,
                name: d.name,
                icon: '🦖',
                meta: `HP: ${d.base_hp.toLocaleString()}`,
            })),
            structures: structures.map(s => ({
                id: `structure-${s.id}`,
                type: 'structure' as const,
                name: s.name,
                icon: s.tier === 'Tek' ? '💎' : s.tier === 'Metal' ? '🔩' : '🧱',
                meta: `${s.tier} • HP: ${s.hp.toLocaleString()}`,
            })),
        };
    }, []);

    // Filter results based on query
    const results = useMemo(() => {
        if (!query.trim()) return [];

        const lowerQuery = query.toLowerCase();
        const filtered: SearchResult[] = [];

        // Search ratholes
        const matchingRatholes = searchableData.ratholes
            .filter(r => r.name.toLowerCase().includes(lowerQuery) || r.meta.toLowerCase().includes(lowerQuery))
            .slice(0, 5);
        filtered.push(...matchingRatholes);

        // Search dinos
        const matchingDinos = searchableData.dinos
            .filter(d => d.name.toLowerCase().includes(lowerQuery))
            .slice(0, 5);
        filtered.push(...matchingDinos);

        // Search structures
        const matchingStructures = searchableData.structures
            .filter(s => s.name.toLowerCase().includes(lowerQuery))
            .slice(0, 5);
        filtered.push(...matchingStructures);

        return filtered;
    }, [query, searchableData]);

    // Group results by type
    const groupedResults = useMemo(() => {
        const groups: Record<string, { title: string; items: SearchResult[] }> = {};

        results.forEach(result => {
            const groupKey = result.type;
            if (!groups[groupKey]) {
                groups[groupKey] = {
                    title: groupKey === 'rathole' ? '📍 레트홀 / 위치' :
                        groupKey === 'dino' ? '🦖 공룡' : '🏗️ 건물',
                    items: [],
                };
            }
            groups[groupKey].items.push(result);
        });

        return Object.values(groups);
    }, [results]);

    // Keyboard shortcut to open search
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                inputRef.current?.focus();
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
                setQuery('');
                inputRef.current?.blur();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Handle keyboard navigation in results
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (!isOpen) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setFocusedIndex(prev => Math.min(prev + 1, results.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setFocusedIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter' && focusedIndex >= 0) {
            e.preventDefault();
            handleResultClick(results[focusedIndex]);
        }
    }, [isOpen, results, focusedIndex]);

    const handleResultClick = (result: SearchResult) => {
        onResultSelect?.(result);
        setIsOpen(false);
        setQuery('');
    };

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (resultsRef.current && !resultsRef.current.contains(e.target as Node) &&
                inputRef.current && !inputRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="search-bar">
            <div className="search-bar__input-wrapper">
                <span className="search-bar__icon">🔍</span>
                <input
                    ref={inputRef}
                    type="text"
                    className="search-bar__input"
                    placeholder={placeholder}
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                        setFocusedIndex(-1);
                    }}
                    onFocus={() => query && setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                />
                {query ? (
                    <button
                        className="search-bar__clear"
                        onClick={() => {
                            setQuery('');
                            setIsOpen(false);
                            inputRef.current?.focus();
                        }}
                    >
                        ✕
                    </button>
                ) : (
                    <span className="search-bar__shortcut">Ctrl+K</span>
                )}
            </div>

            {isOpen && query && (
                <div ref={resultsRef} className="search-bar__results">
                    {groupedResults.length > 0 ? (
                        groupedResults.map((group, groupIndex) => (
                            <div key={groupIndex} className="search-bar__group">
                                <div className="search-bar__group-title">{group.title}</div>
                                {group.items.map((item) => {
                                    const flatIndex = results.indexOf(item);
                                    return (
                                        <div
                                            key={item.id}
                                            className={`search-bar__result-item ${flatIndex === focusedIndex ? 'search-bar__result-item--focused' : ''}`}
                                            onClick={() => handleResultClick(item)}
                                            onMouseEnter={() => setFocusedIndex(flatIndex)}
                                        >
                                            <span className="search-bar__result-icon">{item.icon}</span>
                                            <div className="search-bar__result-content">
                                                <div className="search-bar__result-name">{item.name}</div>
                                                <div className="search-bar__result-meta">{item.meta}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ))
                    ) : (
                        <div className="search-bar__no-results">
                            <div className="search-bar__no-results-icon">🔍</div>
                            <div>"{query}"에 대한 결과가 없습니다</div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// Favorite Button Component
interface FavoriteButtonProps {
    isActive: boolean;
    onClick: () => void;
    size?: 'small' | 'medium' | 'large';
}

export function FavoriteButton({ isActive, onClick, size = 'medium' }: FavoriteButtonProps) {
    const sizeMap = {
        small: '0.9rem',
        medium: '1.2rem',
        large: '1.5rem',
    };

    return (
        <button
            className={`favorite-btn ${isActive ? 'favorite-btn--active' : 'favorite-btn--inactive'}`}
            onClick={(e) => {
                e.stopPropagation();
                onClick();
            }}
            style={{ fontSize: sizeMap[size] }}
            title={isActive ? '즐겨찾기 해제' : '즐겨찾기 추가'}
        >
            {isActive ? '★' : '☆'}
        </button>
    );
}
