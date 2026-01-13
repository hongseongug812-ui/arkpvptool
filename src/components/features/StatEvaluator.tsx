import { useState, useMemo, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { dataManager } from '../../services/DataManager';
import type { DinoStatsEntry, WatchlistEntry } from '../../types';
import './StatEvaluator.css';

type StatKey = 'health' | 'stamina' | 'weight' | 'melee';

interface Rating { tier: string; icon: string; nameKr: string; nameEn: string; color: string; bgColor: string; }

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

interface DinoAvatarProps { dino: DinoStatsEntry; size?: 'small' | 'medium' | 'large'; isSelected?: boolean; onClick?: () => void; isKorean: boolean; }

function DinoAvatar({ dino, size = 'medium', isSelected = false, onClick, isKorean }: DinoAvatarProps) {
    const name = isKorean ? dino.name_kr : (dino.name_kr.split('(')[1]?.replace(')', '') || dino.name_kr);
    const initial = name.charAt(0);
    return (
        <div className={`dino-avatar dino-avatar--${size} ${isSelected ? 'dino-avatar--selected' : ''}`} onClick={onClick} title={name}>
            <div className="dino-avatar__circle"><span className="dino-avatar__initial">{initial}</span>{isSelected && <div className="dino-avatar__check">✓</div>}</div>
            {size !== 'large' && <span className="dino-avatar__name">{name.split('(')[0].trim()}</span>}
        </div>
    );
}

interface WatchlistCardProps { entry: WatchlistEntry; dino: DinoStatsEntry; onStatChange: (statKey: StatKey, value: number) => void; onRemove: () => void; isKorean: boolean; }

function WatchlistCard({ entry, dino, onStatChange, onRemove, isKorean }: WatchlistCardProps) {
    const statKeys: StatKey[] = ['health', 'stamina', 'weight', 'melee'];
    const points = statKeys.map(key => { const value = entry.currentStats[key]; const baseStat = dino.stats[key].base; const incWild = dino.stats[key].inc_wild; if (value <= baseStat || incWild === 0) return 0; return Math.round((value - baseStat) / incWild); });
    const overallRating = getOverallRating(points, isKorean);
    const dinoName = isKorean ? dino.name_kr : (dino.name_kr.split('(')[1]?.replace(')', '') || dino.name_kr);

    return (
        <div className="watchlist-card">
            <div className="watchlist-card__header">
                <DinoAvatar dino={dino} size="large" isKorean={isKorean} />
                <div className="watchlist-card__info">
                    <h4 className="watchlist-card__name">{dinoName}</h4>
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

    useEffect(() => { const saved = localStorage.getItem(WATCHLIST_KEY); if (saved) { try { setWatchlist(JSON.parse(saved)); } catch (e) { console.error('Failed to parse watchlist:', e); } } }, []);
    useEffect(() => { if (watchlist.length > 0) localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist)); else localStorage.removeItem(WATCHLIST_KEY); }, [watchlist]);

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

            <div className="dino-grid-section">
                <div className="dino-grid-header">
                    <h3 className="section-title">🦖 {t('stats.selectDino')}</h3>
                    {watchlist.length > 0 && <button className="btn btn--danger btn--sm" onClick={handleClearAll}>🗑️ {isKorean ? '전체 삭제' : 'Clear All'}</button>}
                </div>
                <div className="dino-grid">
                    {allDinos.map((dino) => <DinoAvatar key={dino.id} dino={dino} size="small" isSelected={watchlist.some(w => w.dinoId === dino.id)} onClick={() => handleAddDino(dino)} isKorean={isKorean} />)}
                </div>
            </div>

            <div className="rating-guide-compact">
                <span className="rating-guide-item" style={{ color: '#FFD700' }}>🔴 50+</span>
                <span className="rating-guide-item" style={{ color: '#9B59B6' }}>🟣 40+</span>
                <span className="rating-guide-item" style={{ color: '#00FF66' }}>🟢 30+</span>
                <span className="rating-guide-item" style={{ color: '#FFFFFF' }}>⚪ 20+</span>
                <span className="rating-guide-item" style={{ color: '#888888' }}>💩 0-19</span>
            </div>

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
