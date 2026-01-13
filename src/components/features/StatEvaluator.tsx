import { useState, useMemo, useEffect, useCallback } from 'react';
import { dataManager } from '../../services/DataManager';
import type { DinoStatsEntry, WatchlistEntry } from '../../types';
import './StatEvaluator.css';

type StatKey = 'health' | 'stamina' | 'weight' | 'melee';

interface Rating {
    tier: string;
    icon: string;
    name: string;
    color: string;
    bgColor: string;
}

const STAT_LABELS: Record<StatKey, { short: string; full: string }> = {
    health: { short: 'HP', full: '체력' },
    stamina: { short: 'ST', full: '기력' },
    weight: { short: 'WT', full: '무게' },
    melee: { short: 'ME', full: '근공' },
};

const WATCHLIST_KEY = 'ark_taming_watchlist_v2';

function getRating(point: number): Rating {
    if (point >= 50) return { tier: 'godly', icon: '🔴', name: '전설급', color: '#FFD700', bgColor: 'rgba(255, 215, 0, 0.15)' };
    if (point >= 40) return { tier: 'great', icon: '🟣', name: '훌륭함', color: '#9B59B6', bgColor: 'rgba(155, 89, 182, 0.15)' };
    if (point >= 30) return { tier: 'good', icon: '🟢', name: '좋음', color: '#00FF66', bgColor: 'rgba(0, 255, 102, 0.15)' };
    if (point >= 20) return { tier: 'average', icon: '⚪', name: '보통', color: '#FFFFFF', bgColor: 'rgba(255, 255, 255, 0.1)' };
    return { tier: 'trash', icon: '💩', name: '망함', color: '#888888', bgColor: 'rgba(136, 136, 136, 0.15)' };
}

function getOverallRating(points: number[]): { badge: string; color: string } {
    const validPoints = points.filter(p => p > 0);
    if (validPoints.length === 0) return { badge: '', color: '#888' };

    const maxPoint = Math.max(...validPoints);
    const avgPoint = validPoints.reduce((a, b) => a + b, 0) / validPoints.length;

    if (maxPoint >= 50 || avgPoint >= 45) return { badge: '🏆 전설급 종자', color: '#FFD700' };
    if (maxPoint >= 40 || avgPoint >= 35) return { badge: '⭐ 우수 종자', color: '#9B59B6' };
    if (maxPoint >= 30 || avgPoint >= 25) return { badge: '✓ 양호', color: '#00FF66' };
    return { badge: '', color: '#888' };
}

// Stat Counter Component
interface StatCounterProps {
    label: string;
    value: number;
    baseValue: number;
    incWild: number;
    point: number;
    rating: Rating;
    onChange: (value: number) => void;
}

function StatCounter({ label, value, baseValue, incWild, point, rating, onChange }: StatCounterProps) {
    const handleDecrement = useCallback((amount: number = 1) => {
        const step = incWild * amount;
        onChange(Math.max(baseValue, value - step));
    }, [value, baseValue, incWild, onChange]);

    const handleIncrement = useCallback((amount: number = 1) => {
        const step = incWild * amount;
        onChange(value + step);
    }, [value, incWild, onChange]);

    return (
        <div className="stat-counter">
            <span className="stat-counter__label">{label}</span>
            <div className="stat-counter__controls">
                <button
                    className="stat-counter__btn stat-counter__btn--minus"
                    onClick={() => handleDecrement(1)}
                    onContextMenu={(e) => { e.preventDefault(); handleDecrement(10); }}
                    title="클릭: -1, 우클릭: -10"
                >
                    −
                </button>
                <span className="stat-counter__value">{Math.round(value)}</span>
                <button
                    className="stat-counter__btn stat-counter__btn--plus"
                    onClick={() => handleIncrement(1)}
                    onContextMenu={(e) => { e.preventDefault(); handleIncrement(10); }}
                    title="클릭: +1, 우클릭: +10"
                >
                    +
                </button>
            </div>
            <div className="stat-counter__point" style={{ color: rating.color }}>
                <span className="stat-counter__point-value">{point > 0 ? point : '-'}</span>
                <span className="stat-counter__point-icon">{point > 0 ? rating.icon : ''}</span>
            </div>
        </div>
    );
}

// Dino Avatar Component
interface DinoAvatarProps {
    dino: DinoStatsEntry;
    size?: 'small' | 'medium' | 'large';
    isSelected?: boolean;
    onClick?: () => void;
}

function DinoAvatar({ dino, size = 'medium', isSelected = false, onClick }: DinoAvatarProps) {
    const sizeClass = `dino-avatar--${size}`;
    const initial = dino.name_kr.charAt(0);

    return (
        <div
            className={`dino-avatar ${sizeClass} ${isSelected ? 'dino-avatar--selected' : ''}`}
            onClick={onClick}
            title={dino.name_kr}
        >
            <div className="dino-avatar__circle">
                <span className="dino-avatar__initial">{initial}</span>
                {isSelected && <div className="dino-avatar__check">✓</div>}
            </div>
            {size !== 'large' && (
                <span className="dino-avatar__name">{dino.name_kr.split('(')[0].trim()}</span>
            )}
        </div>
    );
}

// Watchlist Card Component
interface WatchlistCardProps {
    entry: WatchlistEntry;
    dino: DinoStatsEntry;
    onStatChange: (statKey: StatKey, value: number) => void;
    onRemove: () => void;
}

function WatchlistCard({ entry, dino, onStatChange, onRemove }: WatchlistCardProps) {
    const statKeys: StatKey[] = ['health', 'stamina', 'weight', 'melee'];

    const points = statKeys.map(key => {
        const value = entry.currentStats[key];
        const baseStat = dino.stats[key].base;
        const incWild = dino.stats[key].inc_wild;
        if (value <= baseStat || incWild === 0) return 0;
        return Math.round((value - baseStat) / incWild);
    });

    const overallRating = getOverallRating(points);

    return (
        <div className="watchlist-card">
            <div className="watchlist-card__header">
                <DinoAvatar dino={dino} size="large" />
                <div className="watchlist-card__info">
                    <h4 className="watchlist-card__name">{dino.name_kr}</h4>
                    {overallRating.badge && (
                        <span className="watchlist-card__badge" style={{ color: overallRating.color }}>
                            {overallRating.badge}
                        </span>
                    )}
                </div>
                <button className="watchlist-card__remove" onClick={onRemove} title="제거">
                    ✕
                </button>
            </div>

            <div className="watchlist-card__stats">
                {statKeys.map((key, idx) => {
                    const value = entry.currentStats[key];
                    const baseStat = dino.stats[key].base;
                    const incWild = dino.stats[key].inc_wild;
                    const point = points[idx];
                    const rating = getRating(point);

                    return (
                        <StatCounter
                            key={key}
                            label={STAT_LABELS[key].full}
                            value={value}
                            baseValue={baseStat}
                            incWild={incWild}
                            point={point}
                            rating={rating}
                            onChange={(v) => onStatChange(key, v)}
                        />
                    );
                })}
            </div>
        </div>
    );
}

export function StatEvaluator() {
    const allDinos = dataManager.getAllDinoStats();
    const [watchlist, setWatchlist] = useState<WatchlistEntry[]>([]);

    // Load watchlist from localStorage
    useEffect(() => {
        const saved = localStorage.getItem(WATCHLIST_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setWatchlist(parsed);
            } catch (e) {
                console.error('Failed to parse watchlist:', e);
            }
        }
    }, []);

    // Save watchlist to localStorage
    useEffect(() => {
        if (watchlist.length > 0) {
            localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist));
        } else {
            localStorage.removeItem(WATCHLIST_KEY);
        }
    }, [watchlist]);

    // Add dino to watchlist
    const handleAddDino = useCallback((dino: DinoStatsEntry) => {
        if (watchlist.some(w => w.dinoId === dino.id)) {
            // Remove if already exists
            setWatchlist(prev => prev.filter(w => w.dinoId !== dino.id));
        } else {
            // Add new entry with base stats
            const newEntry: WatchlistEntry = {
                dinoId: dino.id,
                targetStats: {},
                currentStats: {
                    health: dino.stats.health.base,
                    stamina: dino.stats.stamina.base,
                    weight: dino.stats.weight.base,
                    melee: dino.stats.melee.base,
                },
                nickname: dino.name_kr,
            };
            setWatchlist(prev => [...prev, newEntry]);
        }
    }, [watchlist]);

    // Update stat in watchlist entry
    const handleStatChange = useCallback((entryIndex: number, statKey: StatKey, value: number) => {
        setWatchlist(prev => prev.map((entry, idx) => {
            if (idx !== entryIndex) return entry;
            return {
                ...entry,
                currentStats: {
                    ...entry.currentStats,
                    [statKey]: value,
                },
            };
        }));
    }, []);

    // Remove from watchlist
    const handleRemove = useCallback((index: number) => {
        setWatchlist(prev => prev.filter((_, i) => i !== index));
    }, []);

    // Clear all
    const handleClearAll = useCallback(() => {
        if (confirm('워치리스트를 전체 삭제할까요?')) {
            setWatchlist([]);
        }
    }, []);

    return (
        <div className="stat-evaluator">
            <div className="page-header">
                <h2 className="page-title">🎯 테이밍 워치리스트</h2>
                <p className="page-desc">야생 공룡의 스탯을 실시간으로 평가하세요</p>
            </div>

            {/* Dino Selection Grid */}
            <div className="dino-grid-section">
                <div className="dino-grid-header">
                    <h3 className="section-title">🦖 공룡 선택</h3>
                    {watchlist.length > 0 && (
                        <button className="btn btn--danger btn--sm" onClick={handleClearAll}>
                            🗑️ 전체 삭제
                        </button>
                    )}
                </div>
                <div className="dino-grid">
                    {allDinos.map((dino) => {
                        const isSelected = watchlist.some(w => w.dinoId === dino.id);
                        return (
                            <DinoAvatar
                                key={dino.id}
                                dino={dino}
                                size="small"
                                isSelected={isSelected}
                                onClick={() => handleAddDino(dino)}
                            />
                        );
                    })}
                </div>
            </div>

            {/* Rating Guide (Compact) */}
            <div className="rating-guide-compact">
                <span className="rating-guide-item" style={{ color: '#FFD700' }}>🔴 50+</span>
                <span className="rating-guide-item" style={{ color: '#9B59B6' }}>🟣 40+</span>
                <span className="rating-guide-item" style={{ color: '#00FF66' }}>🟢 30+</span>
                <span className="rating-guide-item" style={{ color: '#FFFFFF' }}>⚪ 20+</span>
                <span className="rating-guide-item" style={{ color: '#888888' }}>💩 0-19</span>
            </div>

            {/* Watchlist Cards */}
            <div className="watchlist-cards">
                {watchlist.length === 0 ? (
                    <div className="watchlist-empty-state">
                        <div className="empty-icon">🦕</div>
                        <p>위에서 공룡을 클릭하여 추가하세요</p>
                        <span className="empty-hint">클릭: 추가/제거 | +/- 버튼: 스탯 조절</span>
                    </div>
                ) : (
                    watchlist.map((entry, index) => {
                        const dino = allDinos.find(d => d.id === entry.dinoId);
                        if (!dino) return null;
                        return (
                            <WatchlistCard
                                key={entry.dinoId}
                                entry={entry}
                                dino={dino}
                                onStatChange={(key, value) => handleStatChange(index, key, value)}
                                onRemove={() => handleRemove(index)}
                            />
                        );
                    })
                )}
            </div>
        </div>
    );
}
