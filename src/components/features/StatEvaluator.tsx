import { useState, useMemo, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { dataManager } from '../../services/DataManager';
import type { DinoStatsEntry, WatchlistEntry } from '../../types';
import './StatEvaluator.css';

type StatKey = 'health' | 'stamina' | 'weight' | 'melee';

interface Rating { tier: string; icon: string; nameKr: string; nameEn: string; color: string; bgColor: string; }

// Dino categories for organization
const DINO_CATEGORIES = {
    pvp_meta: { icon: '⚔️', labelKr: 'PVP 메타', labelEn: 'PVP Meta', ids: ['stego', 'rex', 'carcha', 'giga', 'rhynio', 'shadowmane'] },
    tankers: { icon: '🛡️', labelKr: '탱커', labelEn: 'Tankers', ids: ['carbonemys', 'trike', 'paracer', 'gasbag'] },
    flyers: { icon: '🦅', labelKr: '비행', labelEn: 'Flyers', ids: ['pteranodon', 'argentavis', 'quetzal', 'wyvern', 'crystal_wyvern', 'desmodus', 'griffin'] },
    support: { icon: '💖', labelKr: '서포터', labelEn: 'Support', ids: ['yuty', 'daedon'] },
    water: { icon: '🌊', labelKr: '수중', labelEn: 'Aquatic', ids: ['tusoteuthis'] },
    utility: { icon: '🔧', labelKr: '유틸리티', labelEn: 'Utility', ids: ['therizino', 'rhino', 'thyla'] },
};

const STAT_LABELS: Record<StatKey, { short: string; fullKr: string; fullEn: string }> = {
    health: { short: 'HP', fullKr: '체력', fullEn: 'Health' },
    stamina: { short: 'ST', fullKr: '기력', fullEn: 'Stamina' },
    weight: { short: 'WT', fullKr: '무게', fullEn: 'Weight' },
    melee: { short: 'ME', fullKr: '근공', fullEn: 'Melee' },
};

const WATCHLIST_KEY = 'ark_taming_watchlist_v2';

function getRating(point: number): Rating {
    if (point >= 50) return { tier: 'godly', icon: '🔴', nameKr: '전설급', nameEn: 'Legendary', color: '#FFD700', bgColor: 'rgba(255, 215, 0, 0.15)' };
    if (point >= 40) return { tier: 'great', icon: '🟣', nameKr: '훌륭함', nameEn: 'Excellent', color: '#9B59B6', bgColor: 'rgba(155, 89, 182, 0.15)' };
    if (point >= 30) return { tier: 'good', icon: '🟢', nameKr: '좋음', nameEn: 'Good', color: '#00FF66', bgColor: 'rgba(0, 255, 102, 0.15)' };
    if (point >= 20) return { tier: 'average', icon: '⚪', nameKr: '보통', nameEn: 'Average', color: '#FFFFFF', bgColor: 'rgba(255, 255, 255, 0.1)' };
    return { tier: 'trash', icon: '💩', nameKr: '망함', nameEn: 'Trash', color: '#888888', bgColor: 'rgba(136, 136, 136, 0.15)' };
}

function getOverallRating(points: number[], isKorean: boolean): { badge: string; color: string } {
    const validPoints = points.filter(p => p > 0);
    if (validPoints.length === 0) return { badge: '', color: '#888' };
    const maxPoint = Math.max(...validPoints);
    const avgPoint = validPoints.reduce((a, b) => a + b, 0) / validPoints.length;
    if (maxPoint >= 50 || avgPoint >= 45) return { badge: isKorean ? '🏆 전설급 종자' : '🏆 Legendary Breed', color: '#FFD700' };
    if (maxPoint >= 40 || avgPoint >= 35) return { badge: isKorean ? '⭐ 우수 종자' : '⭐ Excellent Breed', color: '#9B59B6' };
    if (maxPoint >= 30 || avgPoint >= 25) return { badge: isKorean ? '✓ 양호' : '✓ Good', color: '#00FF66' };
    return { badge: '', color: '#888' };
}

interface StatCounterProps { label: string; value: number; baseValue: number; incWild: number; point: number; rating: Rating; onChange: (value: number) => void; isKorean: boolean; }

function StatCounter({ label, value, baseValue, incWild, point, rating, onChange, isKorean }: StatCounterProps) {
    const handleDecrement = useCallback((amount: number = 1) => { const step = incWild * amount; onChange(Math.max(baseValue, value - step)); }, [value, baseValue, incWild, onChange]);
    const handleIncrement = useCallback((amount: number = 1) => { const step = incWild * amount; onChange(value + step); }, [value, incWild, onChange]);

    return (
        <div className="stat-counter">
            <span className="stat-counter__label">{label}</span>
            <div className="stat-counter__controls">
                <button className="stat-counter__btn stat-counter__btn--minus" onClick={() => handleDecrement(1)} onContextMenu={(e) => { e.preventDefault(); handleDecrement(10); }} title={isKorean ? '클릭: -1, 우클릭: -10' : 'Click: -1, Right-click: -10'}>−</button>
                <span className="stat-counter__value">{Math.round(value)}</span>
                <button className="stat-counter__btn stat-counter__btn--plus" onClick={() => handleIncrement(1)} onContextMenu={(e) => { e.preventDefault(); handleIncrement(10); }} title={isKorean ? '클릭: +1, 우클릭: +10' : 'Click: +1, Right-click: +10'}>+</button>
            </div>
            <div className="stat-counter__point" style={{ color: rating.color }}>
                <span className="stat-counter__point-value">{point > 0 ? point : '-'}</span>
                <span className="stat-counter__point-icon">{point > 0 ? rating.icon : ''}</span>
            </div>
        </div>
    );
}

interface WatchlistCardProps { entry: WatchlistEntry; dino: DinoStatsEntry; onStatChange: (statKey: StatKey, value: number) => void; onRemove: () => void; isKorean: boolean; }

function WatchlistCard({ entry, dino, onStatChange, onRemove, isKorean }: WatchlistCardProps) {
    const statKeys: StatKey[] = ['health', 'stamina', 'weight', 'melee'];
    const points = statKeys.map(key => { const value = entry.currentStats[key]; const baseStat = dino.stats[key].base; const incWild = dino.stats[key].inc_wild; if (value <= baseStat || incWild === 0) return 0; return Math.round((value - baseStat) / incWild); });
    const overallRating = getOverallRating(points, isKorean);
    const dinoName = dino.name_kr.split('(')[0].trim();
    const dinoRole = dino.name_kr.includes('(') ? dino.name_kr.split('(')[1]?.replace(')', '') : '';

    return (
        <div className="watchlist-card">
            <div className="watchlist-card__header">
                <div className="watchlist-card__avatar">
                    <span className="avatar-initial">{dinoName.charAt(0)}</span>
                </div>
                <div className="watchlist-card__info">
                    <h4 className="watchlist-card__name">{dinoName}</h4>
                    {dinoRole && <span className="watchlist-card__role">{dinoRole}</span>}
                    {overallRating.badge && <span className="watchlist-card__badge" style={{ color: overallRating.color }}>{overallRating.badge}</span>}
                </div>
                <button className="watchlist-card__remove" onClick={onRemove} title={isKorean ? '제거' : 'Remove'}>✕</button>
            </div>
            <div className="watchlist-card__stats">
                {statKeys.map((key, idx) => {
                    const value = entry.currentStats[key];
                    const baseStat = dino.stats[key].base;
                    const incWild = dino.stats[key].inc_wild;
                    const point = points[idx];
                    const rating = getRating(point);
                    return <StatCounter key={key} label={isKorean ? STAT_LABELS[key].fullKr : STAT_LABELS[key].fullEn} value={value} baseValue={baseStat} incWild={incWild} point={point} rating={rating} onChange={(v) => onStatChange(key, v)} isKorean={isKorean} />;
                })}
            </div>
        </div>
    );
}

export function StatEvaluator() {
    const { t, i18n } = useTranslation();
    const isKorean = i18n.language === 'ko';
    const allDinos = dataManager.getAllDinoStats();
    const [watchlist, setWatchlist] = useState<WatchlistEntry[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    useEffect(() => { const saved = localStorage.getItem(WATCHLIST_KEY); if (saved) { try { setWatchlist(JSON.parse(saved)); } catch (e) { console.error('Failed to parse watchlist:', e); } } }, []);
    useEffect(() => { if (watchlist.length > 0) localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist)); else localStorage.removeItem(WATCHLIST_KEY); }, [watchlist]);

    // Filter dinos by search and category
    const filteredDinos = useMemo(() => {
        let result = allDinos;

        // Filter by search
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(d => d.name_kr.toLowerCase().includes(q) || d.id.toLowerCase().includes(q));
        }

        // Filter by category
        if (selectedCategory && DINO_CATEGORIES[selectedCategory as keyof typeof DINO_CATEGORIES]) {
            const categoryIds = DINO_CATEGORIES[selectedCategory as keyof typeof DINO_CATEGORIES].ids;
            result = result.filter(d => categoryIds.includes(d.id));
        }

        return result;
    }, [allDinos, searchQuery, selectedCategory]);

    const handleAddDino = useCallback((dino: DinoStatsEntry) => {
        if (watchlist.some(w => w.dinoId === dino.id)) { setWatchlist(prev => prev.filter(w => w.dinoId !== dino.id)); }
        else { setWatchlist(prev => [...prev, { dinoId: dino.id, targetStats: {}, currentStats: { health: dino.stats.health.base, stamina: dino.stats.stamina.base, weight: dino.stats.weight.base, melee: dino.stats.melee.base }, nickname: dino.name_kr }]); }
    }, [watchlist]);

    const handleStatChange = useCallback((entryIndex: number, statKey: StatKey, value: number) => {
        setWatchlist(prev => prev.map((entry, idx) => idx !== entryIndex ? entry : { ...entry, currentStats: { ...entry.currentStats, [statKey]: value } }));
    }, []);

    const handleRemove = useCallback((index: number) => { setWatchlist(prev => prev.filter((_, i) => i !== index)); }, []);
    const handleClearAll = useCallback(() => { if (confirm(isKorean ? '워치리스트를 전체 삭제할까요?' : 'Clear all watchlist?')) setWatchlist([]); }, [isKorean]);

    return (
        <div className="stat-evaluator">
            <div className="page-header">
                <h2 className="page-title">🎯 {t('stats.title')}</h2>
                <p className="page-desc">{t('stats.desc')}</p>
            </div>

            {/* Improved Dino Selection */}
            <div className="dino-selector-section">
                {/* Search Box */}
                <div className="dino-search-box">
                    <span className="search-icon">🔍</span>
                    <input
                        type="text"
                        className="dino-search-input"
                        placeholder={isKorean ? '공룡 검색...' : 'Search dino...'}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button className="search-clear" onClick={() => setSearchQuery('')}>✕</button>
                    )}
                </div>

                {/* Category Filter */}
                <div className="category-tabs">
                    <button
                        className={`category-tab ${!selectedCategory ? 'category-tab--active' : ''}`}
                        onClick={() => setSelectedCategory(null)}
                    >
                        <span className="category-icon">📋</span>
                        <span className="category-label">{isKorean ? '전체' : 'All'}</span>
                    </button>
                    {Object.entries(DINO_CATEGORIES).map(([key, cat]) => (
                        <button
                            key={key}
                            className={`category-tab ${selectedCategory === key ? 'category-tab--active' : ''}`}
                            onClick={() => setSelectedCategory(selectedCategory === key ? null : key)}
                        >
                            <span className="category-icon">{cat.icon}</span>
                            <span className="category-label">{isKorean ? cat.labelKr : cat.labelEn}</span>
                        </button>
                    ))}
                </div>

                {/* Dino Grid - Improved Visual Cards */}
                <div className="dino-select-grid">
                    {filteredDinos.length === 0 ? (
                        <div className="no-dino-result">
                            <span>🦕</span>
                            <p>{isKorean ? '검색 결과가 없습니다' : 'No results found'}</p>
                        </div>
                    ) : (
                        filteredDinos.map((dino) => {
                            const isSelected = watchlist.some(w => w.dinoId === dino.id);
                            const dinoName = dino.name_kr.split('(')[0].trim();
                            const dinoRole = dino.name_kr.includes('(') ? dino.name_kr.split('(')[1]?.replace(')', '') : '';

                            return (
                                <div
                                    key={dino.id}
                                    className={`dino-select-card ${isSelected ? 'dino-select-card--selected' : ''}`}
                                    onClick={() => handleAddDino(dino)}
                                >
                                    <div className="dino-select-card__avatar">
                                        <span>{dinoName.charAt(0)}</span>
                                        {isSelected && <div className="dino-select-card__check">✓</div>}
                                    </div>
                                    <div className="dino-select-card__info">
                                        <span className="dino-select-card__name">{dinoName}</span>
                                        {dinoRole && <span className="dino-select-card__role">{dinoRole}</span>}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Action Bar */}
                {watchlist.length > 0 && (
                    <div className="dino-action-bar">
                        <span className="selected-count">
                            {isKorean ? `${watchlist.length}개 선택됨` : `${watchlist.length} selected`}
                        </span>
                        <button className="btn btn--danger btn--sm" onClick={handleClearAll}>
                            🗑️ {isKorean ? '전체 삭제' : 'Clear All'}
                        </button>
                    </div>
                )}
            </div>

            {/* Rating Guide */}
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
                        <p>{isKorean ? '위에서 공룡을 클릭하여 추가하세요' : 'Click a dino above to add'}</p>
                        <span className="empty-hint">{isKorean ? '클릭: 추가/제거 | +/- 버튼: 스탯 조절' : 'Click: Add/Remove | +/-: Adjust stats'}</span>
                    </div>
                ) : (
                    watchlist.map((entry, index) => {
                        const dino = allDinos.find(d => d.id === entry.dinoId);
                        if (!dino) return null;
                        return <WatchlistCard key={entry.dinoId} entry={entry} dino={dino} onStatChange={(key, value) => handleStatChange(index, key, value)} onRemove={() => handleRemove(index)} isKorean={isKorean} />;
                    })
                )}
            </div>
        </div>
    );
}
