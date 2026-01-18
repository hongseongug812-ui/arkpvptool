import { useState, useMemo, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameVersion } from '../../context/GameVersionContext';
import { dataManager } from '../../services/DataManager';
import { DinoCompare } from './DinoCompare';
import { BreedingSimulator } from './BreedingSimulator';
import { RaidTimer } from './RaidTimer';
import type { DinoStatsEntry, WatchlistEntry } from '../../types';
import './StatEvaluator.css';

type StatKey = 'health' | 'stamina' | 'weight' | 'melee';

interface Rating { tier: string; icon: string; nameKr: string; nameEn: string; color: string; bgColor: string; }

// Server level cap presets
const LEVEL_CAP_PRESETS = [
    { id: 'official', labelKr: '오피셜 (150)', labelEn: 'Official (150)', maxLevel: 150 },
    { id: 'small_tribe', labelKr: '스몰트 (180)', labelEn: 'Small Tribe (180)', maxLevel: 180 },
    { id: 'unofficial_225', labelKr: '비공식 (225)', labelEn: 'Unofficial (225)', maxLevel: 225 },
    { id: 'unofficial_300', labelKr: '비공식 (300)', labelEn: 'Unofficial (300)', maxLevel: 300 },
    { id: 'custom', labelKr: '커스텀', labelEn: 'Custom', maxLevel: 0 },
];

// Dino categories with all dinos properly categorized
const DINO_CATEGORIES: Record<string, { icon: string; labelKr: string; labelEn: string; ids: string[] }> = {
    pvp_meta: { icon: '⚔️', labelKr: 'PVP 메타', labelEn: 'PVP Meta', ids: ['stego', 'rex', 'carcha', 'giga', 'shadowmane', 'thyla', 'rhynio'] },
    dealers: { icon: '💥', labelKr: '딜러', labelEn: 'Dealers', ids: ['therizino', 'rhino', 'rex', 'carcha', 'giga', 'thyla'] },
    tankers: { icon: '🛡️', labelKr: '탱커', labelEn: 'Tankers', ids: ['stego', 'carbonemys', 'trike', 'paracer', 'gasbag', 'rhynio'] },
    flyers: { icon: '🦅', labelKr: '비행', labelEn: 'Flyers', ids: ['pteranodon', 'argentavis', 'quetzal', 'wyvern', 'crystal_wyvern', 'desmodus', 'griffin', 'rhynio', 'pelagornis'] },
    support: { icon: '💖', labelKr: '서포터', labelEn: 'Support', ids: ['yuty', 'daedon'] },
    water: { icon: '🌊', labelKr: '수중', labelEn: 'Aquatic', ids: ['tusoteuthis', 'mosasaurus', 'megalodon', 'plesiosaur', 'basilosaurus', 'dunkleosteus'] },
    utility: { icon: '🔧', labelKr: '유틸리티', labelEn: 'Utility', ids: ['astrocetus', 'astrodelphis', 'sinomacrops', 'fjordhawk'] },
};

// ASA-only dinos (not in ASE)
const ASA_ONLY_DINOS = ['carcha', 'rhynio', 'desmodus', 'fjordhawk', 'sinomacrops'];
// ASE-only dinos (not in ASA yet)
const ASE_ONLY_DINOS = ['astrocetus', 'astrodelphis', 'shadowmane', 'crystal_wyvern', 'gasbag'];

const STAT_LABELS: Record<StatKey, { short: string; fullKr: string; fullEn: string }> = {
    health: { short: 'HP', fullKr: '체력', fullEn: 'Health' },
    stamina: { short: 'ST', fullKr: '기력', fullEn: 'Stamina' },
    weight: { short: 'WT', fullKr: '무게', fullEn: 'Weight' },
    melee: { short: 'ME', fullKr: '근공', fullEn: 'Melee' },
};

const WATCHLIST_KEY = 'ark_taming_watchlist_v2';
const LEVEL_CAP_KEY = 'ark_level_cap';

function getRating(point: number, maxLevel: number): Rating {
    const ratio = maxLevel / 150;
    const godly = Math.round(50 * ratio);
    const great = Math.round(40 * ratio);
    const good = Math.round(30 * ratio);
    const avg = Math.round(20 * ratio);

    if (point >= godly) return { tier: 'godly', icon: '🔴', nameKr: '전설급', nameEn: 'Legendary', color: '#FFD700', bgColor: 'rgba(255, 215, 0, 0.15)' };
    if (point >= great) return { tier: 'great', icon: '🟣', nameKr: '훌륭함', nameEn: 'Excellent', color: '#9B59B6', bgColor: 'rgba(155, 89, 182, 0.15)' };
    if (point >= good) return { tier: 'good', icon: '🟢', nameKr: '좋음', nameEn: 'Good', color: '#00FF66', bgColor: 'rgba(0, 255, 102, 0.15)' };
    if (point >= avg) return { tier: 'average', icon: '⚪', nameKr: '보통', nameEn: 'Average', color: '#FFFFFF', bgColor: 'rgba(255, 255, 255, 0.1)' };
    return { tier: 'trash', icon: '💩', nameKr: '망함', nameEn: 'Trash', color: '#888888', bgColor: 'rgba(136, 136, 136, 0.15)' };
}

function getOverallRating(points: number[], isKorean: boolean, maxLevel: number): { badge: string; color: string } {
    const validPoints = points.filter(p => p > 0);
    if (validPoints.length === 0) return { badge: '', color: '#888' };
    const maxPoint = Math.max(...validPoints);
    const avgPoint = validPoints.reduce((a, b) => a + b, 0) / validPoints.length;
    const ratio = maxLevel / 150;

    if (maxPoint >= 50 * ratio || avgPoint >= 45 * ratio) return { badge: isKorean ? '🏆 전설급 종자' : '🏆 Legendary', color: '#FFD700' };
    if (maxPoint >= 40 * ratio || avgPoint >= 35 * ratio) return { badge: isKorean ? '⭐ 우수 종자' : '⭐ Excellent', color: '#9B59B6' };
    if (maxPoint >= 30 * ratio || avgPoint >= 25 * ratio) return { badge: isKorean ? '✓ 양호' : '✓ Good', color: '#00FF66' };
    return { badge: '', color: '#888' };
}

// Find dino's category
function getDinoCategory(dinoId: string): { key: string; icon: string; labelKr: string; labelEn: string } | null {
    for (const [key, cat] of Object.entries(DINO_CATEGORIES)) {
        if (cat.ids.includes(dinoId)) {
            return { key, ...cat };
        }
    }
    return null;
}

// Get dino image URL - handles various naming conventions
function getDinoImageUrl(dinoId: string): string {
    // Convert id to potential file names
    const variations = [
        dinoId.replace(/_/g, '-'),           // underscore to hyphen
        dinoId.replace(/-/g, '_'),           // hyphen to underscore
        dinoId.replace(/[_-]/g, ''),         // no separator
        dinoId,                               // as-is
    ];

    // Special mappings for known mismatches
    const specialMappings: Record<string, string> = {
        'carcha': 'carcharodontosaurus',
        'stego': 'stegosaurus',
        'giga': 'giganotosaurus',
        'yuty': 'yutyrannus',
        'rex': 'rex',
        'daedon': 'daeodon',
        'thyla': 'thylacoleo',
        'therizino': 'therizinosaur',
        'rhynio': 'rhyniognatha',
        'trike': 'triceratops',
        'paracer': 'paraceratherium',
        'gasbag': 'gasbags',
        'rhino': 'woolly-rhino',
        'giant_bee': 'giant-queen-bee',
        'royal_griffin': 'griffin',
        'woolly_rhino': 'woolly-rhino',
        'dire_bear': 'dire-bear',
        'rock_elemental': 'rock-elemental',
        'rock_drake': 'rock-drake',
        'snow_owl': 'snow-owl',
        'terror_bird': 'terror-bird',
        'dung_beetle': 'dung-beetle',
        'thorny_dragon': 'thorny-dragon',
        'crystal_wyvern': 'crystal-wyvern',
        'tek_stryder': 'tek-stryder',
        'stryder': 'tek-stryder',
        'spinosaurus': 'spino',
        'carbonemys': 'carbonemys',
        'tusoteuthis': 'tusoteuthis',
        'yi_ling': 'yi-ling',
    };

    const mappedId = specialMappings[dinoId] || variations[0];
    return `/dinos/${mappedId}.png`;
}

interface StatCounterProps { label: string; value: number; baseValue: number; incWild: number; point: number; rating: Rating; onChange: (value: number) => void; isKorean: boolean; maxPoints: number; }

function StatCounter({ label, value, baseValue, incWild, point, rating, onChange, isKorean, maxPoints }: StatCounterProps) {
    const [inputMode, setInputMode] = useState(false);
    const [inputValue, setInputValue] = useState('');

    const handleDecrement = useCallback((amount: number = 1) => { onChange(Math.max(baseValue, value - incWild * amount)); }, [value, baseValue, incWild, onChange]);
    const handleIncrement = useCallback((amount: number = 1) => { const maxValue = baseValue + (incWild * maxPoints); onChange(Math.min(maxValue, value + incWild * amount)); }, [value, baseValue, incWild, onChange, maxPoints]);

    const handleInputSubmit = () => { const numValue = parseFloat(inputValue); if (!isNaN(numValue) && numValue >= baseValue) { const maxValue = baseValue + (incWild * maxPoints); onChange(Math.min(maxValue, numValue)); } setInputMode(false); };
    const handleValueClick = () => { setInputValue(Math.round(value).toString()); setInputMode(true); };

    return (
        <div className="stat-counter">
            <span className="stat-counter__label">{label}</span>
            <div className="stat-counter__controls">
                <button className="stat-counter__btn stat-counter__btn--minus" onClick={() => handleDecrement(1)} onContextMenu={(e) => { e.preventDefault(); handleDecrement(10); }} title={isKorean ? '클릭: -1, 우클릭: -10' : 'Click: -1, Right-click: -10'}>−</button>
                {inputMode ? (
                    <input type="number" className="stat-counter__input" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onBlur={handleInputSubmit} onKeyDown={(e) => { if (e.key === 'Enter') handleInputSubmit(); if (e.key === 'Escape') setInputMode(false); }} autoFocus />
                ) : (
                    <span className="stat-counter__value" onClick={handleValueClick} title={isKorean ? '클릭하여 직접 입력' : 'Click to input'}>{Math.round(value)}</span>
                )}
                <button className="stat-counter__btn stat-counter__btn--plus" onClick={() => handleIncrement(1)} onContextMenu={(e) => { e.preventDefault(); handleIncrement(10); }} title={isKorean ? '클릭: +1, 우클릭: +10' : 'Click: +1, Right-click: +10'}>+</button>
            </div>
            <div className="stat-counter__point" style={{ color: rating.color }}>
                <span className="stat-counter__point-value">{point > 0 ? point : '-'}</span>
                <span className="stat-counter__point-icon">{point > 0 ? rating.icon : ''}</span>
            </div>
        </div>
    );
}

interface WatchlistCardProps { entry: WatchlistEntry; dino: DinoStatsEntry; onStatChange: (statKey: StatKey, value: number) => void; onRemove: () => void; isKorean: boolean; maxLevel: number; }

function WatchlistCard({ entry, dino, onStatChange, onRemove, isKorean, maxLevel }: WatchlistCardProps) {
    const statKeys: StatKey[] = ['health', 'stamina', 'weight', 'melee'];
    const maxPoints = Math.floor(maxLevel * 0.7);
    const points = statKeys.map(key => { const value = entry.currentStats[key]; const baseStat = dino.stats[key].base; const incWild = dino.stats[key].inc_wild; if (value <= baseStat || incWild === 0) return 0; return Math.round((value - baseStat) / incWild); });
    const overallRating = getOverallRating(points, isKorean, maxLevel);
    const dinoName = dino.name_kr.split('(')[0].trim();
    const dinoRole = dino.name_kr.includes('(') ? dino.name_kr.split('(')[1]?.replace(')', '') : '';
    const category = getDinoCategory(dino.id);

    return (
        <div className="watchlist-card">
            <div className="watchlist-card__header">
                <div className="watchlist-card__avatar">
                    <img
                        src={getDinoImageUrl(dino.id)}
                        alt={dinoName}
                        className="watchlist-card__avatar-img"
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                    />
                    <span className="avatar-initial hidden">{dinoName.charAt(0)}</span>
                </div>
                <div className="watchlist-card__info">
                    <h4 className="watchlist-card__name">{dinoName}</h4>
                    <div className="watchlist-card__meta">
                        {category && <span className="watchlist-card__category">{category.icon} {isKorean ? category.labelKr : category.labelEn}</span>}
                        {dinoRole && <span className="watchlist-card__role">{dinoRole}</span>}
                    </div>
                    {overallRating.badge && <span className="watchlist-card__badge" style={{ color: overallRating.color }}>{overallRating.badge}</span>}
                </div>
                <button className="watchlist-card__remove" onClick={onRemove} title={isKorean ? '제거' : 'Remove'}>✕</button>
            </div>
            <div className="watchlist-card__stats">
                {statKeys.map((key, idx) => {
                    const value = entry.currentStats[key]; const baseStat = dino.stats[key].base; const incWild = dino.stats[key].inc_wild;
                    return <StatCounter key={key} label={isKorean ? STAT_LABELS[key].fullKr : STAT_LABELS[key].fullEn} value={value} baseValue={baseStat} incWild={incWild} point={points[idx]} rating={getRating(points[idx], maxLevel)} onChange={(v) => onStatChange(key, v)} isKorean={isKorean} maxPoints={maxPoints} />;
                })}
            </div>
        </div>
    );
}

export function StatEvaluator() {
    const { t, i18n } = useTranslation();
    const { gameVersion } = useGameVersion();
    const isKorean = i18n.language === 'ko';
    const allDinos = dataManager.getAllDinoStats();
    const [watchlist, setWatchlist] = useState<WatchlistEntry[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
    const [levelCapPreset, setLevelCapPreset] = useState('official');
    const [customLevelCap, setCustomLevelCap] = useState(150);
    const [showCompare, setShowCompare] = useState(false);
    const [showBreeding, setShowBreeding] = useState(false);
    const [showRaidTimer, setShowRaidTimer] = useState(false);

    const maxLevel = useMemo(() => {
        if (levelCapPreset === 'custom') return customLevelCap;
        return LEVEL_CAP_PRESETS.find(p => p.id === levelCapPreset)?.maxLevel || 150;
    }, [levelCapPreset, customLevelCap]);

    useEffect(() => {
        const saved = localStorage.getItem(WATCHLIST_KEY);
        if (saved) { try { setWatchlist(JSON.parse(saved)); } catch (e) { console.error('Failed to parse watchlist:', e); } }
        const savedLevelCap = localStorage.getItem(LEVEL_CAP_KEY);
        if (savedLevelCap) { try { const { preset, custom } = JSON.parse(savedLevelCap); setLevelCapPreset(preset); setCustomLevelCap(custom); } catch (e) { console.error('Failed to parse level cap:', e); } }
    }, []);

    useEffect(() => { if (watchlist.length > 0) localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist)); else localStorage.removeItem(WATCHLIST_KEY); }, [watchlist]);
    useEffect(() => { localStorage.setItem(LEVEL_CAP_KEY, JSON.stringify({ preset: levelCapPreset, custom: customLevelCap })); }, [levelCapPreset, customLevelCap]);

    // Filter dinos by game version (ASA/ASE)
    const versionFilteredDinos = useMemo(() => {
        return allDinos.filter(dino => {
            if (gameVersion === 'ASA') {
                // In ASA mode, exclude ASE-only dinos
                return !ASE_ONLY_DINOS.includes(dino.id);
            } else {
                // In ASE mode, exclude ASA-only dinos
                return !ASA_ONLY_DINOS.includes(dino.id);
            }
        });
    }, [allDinos, gameVersion]);

    // Group dinos by category
    const dinosByCategory = useMemo(() => {
        const grouped: Record<string, DinoStatsEntry[]> = {};
        const uncategorized: DinoStatsEntry[] = [];

        for (const dino of versionFilteredDinos) {
            const cat = getDinoCategory(dino.id);
            if (cat) {
                if (!grouped[cat.key]) grouped[cat.key] = [];
                grouped[cat.key].push(dino);
            } else {
                uncategorized.push(dino);
            }
        }

        if (uncategorized.length > 0) {
            grouped['other'] = uncategorized;
        }

        return grouped;
    }, [versionFilteredDinos]);

    // Filter dinos by search
    const filteredDinosByCategory = useMemo(() => {
        if (!searchQuery) return dinosByCategory;

        const q = searchQuery.toLowerCase();
        const filtered: Record<string, DinoStatsEntry[]> = {};

        for (const [catKey, dinos] of Object.entries(dinosByCategory)) {
            const matchedDinos = dinos.filter(d => d.name_kr.toLowerCase().includes(q) || d.id.toLowerCase().includes(q));
            if (matchedDinos.length > 0) {
                filtered[catKey] = matchedDinos;
            }
        }

        return filtered;
    }, [dinosByCategory, searchQuery]);

    const handleAddDino = useCallback((dino: DinoStatsEntry) => {
        if (watchlist.some(w => w.dinoId === dino.id)) { setWatchlist(prev => prev.filter(w => w.dinoId !== dino.id)); }
        else { setWatchlist(prev => [...prev, { dinoId: dino.id, targetStats: {}, currentStats: { health: dino.stats.health.base, stamina: dino.stats.stamina.base, weight: dino.stats.weight.base, melee: dino.stats.melee.base }, nickname: dino.name_kr }]); }
    }, [watchlist]);

    const handleStatChange = useCallback((entryIndex: number, statKey: StatKey, value: number) => {
        setWatchlist(prev => prev.map((entry, idx) => idx !== entryIndex ? entry : { ...entry, currentStats: { ...entry.currentStats, [statKey]: value } }));
    }, []);

    const handleRemove = useCallback((index: number) => { setWatchlist(prev => prev.filter((_, i) => i !== index)); }, []);
    const handleClearAll = useCallback(() => { if (confirm(isKorean ? '워치리스트를 전체 삭제할까요?' : 'Clear all watchlist?')) setWatchlist([]); }, [isKorean]);

    const toggleCategory = (catKey: string) => {
        setExpandedCategory(expandedCategory === catKey ? null : catKey);
    };

    const ratio = maxLevel / 150;
    const ratingThresholds = { godly: Math.round(50 * ratio), great: Math.round(40 * ratio), good: Math.round(30 * ratio), average: Math.round(20 * ratio) };

    return (
        <div className="stat-evaluator">
            <div className="page-header">
                <div className="page-header__top">
                    <div>
                        <h2 className="page-title">🎯 {t('stats.title')}</h2>
                        <p className="page-desc">{t('stats.desc')}</p>
                    </div>
                    <button className="compare-btn" onClick={() => setShowCompare(true)}>
                        📊 {isKorean ? '비교' : 'Compare'}
                    </button>
                    <button className="compare-btn" onClick={() => setShowBreeding(true)}>
                        🧬 {isKorean ? '브리딩' : 'Breeding'}
                    </button>
                    <button className="compare-btn" onClick={() => setShowRaidTimer(true)}>
                        ⏱️ {isKorean ? '레이드' : 'Raid'}
                    </button>
                </div>
            </div>

            {/* Server Level Cap Settings */}
            <div className="level-cap-section">
                <div className="level-cap-header">
                    <span className="level-cap-icon">⚙️</span>
                    <span className="level-cap-title">{isKorean ? '서버 레벨 캡' : 'Server Level Cap'}</span>
                    <span className="level-cap-value">Lv.{maxLevel}</span>
                </div>
                <div className="level-cap-presets">
                    {LEVEL_CAP_PRESETS.map(preset => (
                        <button key={preset.id} className={`level-cap-btn ${levelCapPreset === preset.id ? 'level-cap-btn--active' : ''}`} onClick={() => setLevelCapPreset(preset.id)}>
                            {isKorean ? preset.labelKr : preset.labelEn}
                        </button>
                    ))}
                </div>
                {levelCapPreset === 'custom' && (
                    <div className="custom-level-input">
                        <input type="number" className="custom-level-field" min={1} max={999} value={customLevelCap} onChange={(e) => setCustomLevelCap(Math.max(1, parseInt(e.target.value) || 150))} />
                        <span className="custom-level-label">{isKorean ? '레벨' : 'Level'}</span>
                    </div>
                )}
            </div>

            {/* Dino Selection with Category Accordion */}
            <div className="dino-selector-section">
                <div className="dino-search-box">
                    <span className="search-icon">🔍</span>
                    <input type="text" className="dino-search-input" placeholder={isKorean ? '공룡 검색...' : 'Search dino...'} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    {searchQuery && <button className="search-clear" onClick={() => setSearchQuery('')}>✕</button>}
                </div>

                {/* Category Filter Tabs */}
                <div className="category-tabs-row">
                    <button
                        className={`category-tab-btn ${expandedCategory === null ? 'category-tab-btn--active' : ''}`}
                        onClick={() => setExpandedCategory(null)}
                    >
                        <span className="category-tab-btn__icon">📋</span>
                        <span className="category-tab-btn__label">{isKorean ? '전체' : 'All'}</span>
                        <span className="category-tab-btn__count">{versionFilteredDinos.length}</span>
                    </button>
                    {Object.entries(DINO_CATEGORIES).map(([key, cat]) => {
                        const dinosInCat = filteredDinosByCategory[key] || [];
                        const selectedCount = dinosInCat.filter(d => watchlist.some(w => w.dinoId === d.id)).length;

                        return (
                            <button
                                key={key}
                                className={`category-tab-btn ${expandedCategory === key ? 'category-tab-btn--active' : ''} ${selectedCount > 0 ? 'category-tab-btn--has-selected' : ''}`}
                                onClick={() => setExpandedCategory(expandedCategory === key ? null : key)}
                            >
                                <span className="category-tab-btn__icon">{cat.icon}</span>
                                <span className="category-tab-btn__label">{isKorean ? cat.labelKr : cat.labelEn}</span>
                                {selectedCount > 0 && <span className="category-tab-btn__count">{selectedCount}</span>}
                            </button>
                        );
                    })}
                </div>

                {/* Dino Grid - Always Visible */}
                <div className="category-expanded-panel">
                    <div className="category-panel-header">
                        <span>
                            {expandedCategory ? (
                                <>{DINO_CATEGORIES[expandedCategory]?.icon} {isKorean ? DINO_CATEGORIES[expandedCategory]?.labelKr : DINO_CATEGORIES[expandedCategory]?.labelEn}</>
                            ) : (
                                <>{isKorean ? '📋 전체 공룡' : '📋 All Dinos'}</>
                            )}
                        </span>
                        <span className="category-panel-count">
                            {expandedCategory
                                ? (filteredDinosByCategory[expandedCategory]?.length || 0)
                                : versionFilteredDinos.filter(d => !searchQuery || d.name_kr.toLowerCase().includes(searchQuery.toLowerCase()) || d.id.toLowerCase().includes(searchQuery.toLowerCase())).length
                            }{isKorean ? '종' : ' dinos'}
                        </span>
                    </div>
                    <div className="dino-select-grid">
                        {(expandedCategory
                            ? (filteredDinosByCategory[expandedCategory] || [])
                            : versionFilteredDinos.filter(d => !searchQuery || d.name_kr.toLowerCase().includes(searchQuery.toLowerCase()) || d.id.toLowerCase().includes(searchQuery.toLowerCase()))
                        ).map((dino) => {
                            const isSelected = watchlist.some(w => w.dinoId === dino.id);
                            const dinoName = dino.name_kr.split('(')[0].trim();
                            const dinoRole = dino.name_kr.includes('(') ? dino.name_kr.split('(')[1]?.replace(')', '') : '';

                            return (
                                <div key={dino.id} className={`dino-select-card ${isSelected ? 'dino-select-card--selected' : ''}`} onClick={() => handleAddDino(dino)}>
                                    <div className="dino-select-card__avatar">
                                        <img
                                            src={getDinoImageUrl(dino.id)}
                                            alt={dinoName}
                                            className="dino-select-card__avatar-img"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                                const sibling = e.currentTarget.nextElementSibling as HTMLElement;
                                                if (sibling) sibling.style.display = 'flex';
                                            }}
                                        />
                                        <span className="dino-select-card__initial" style={{ display: 'none' }}>{dinoName.charAt(0)}</span>
                                        {isSelected && <div className="dino-select-card__check">✓</div>}
                                    </div>
                                    <div className="dino-select-card__info">
                                        <span className="dino-select-card__name">{dinoName}</span>
                                        {dinoRole && <span className="dino-select-card__role">{dinoRole}</span>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Action Bar */}
                {watchlist.length > 0 && (
                    <div className="dino-action-bar">
                        <span className="selected-count">{isKorean ? `${watchlist.length}개 선택됨` : `${watchlist.length} selected`}</span>
                        <button className="btn btn--danger btn--sm" onClick={handleClearAll}>🗑️ {isKorean ? '전체 삭제' : 'Clear All'}</button>
                    </div>
                )}
            </div>

            {/* Rating Guide */}
            <div className="rating-guide-compact">
                <span className="rating-guide-item" style={{ color: '#FFD700' }}>🔴 {ratingThresholds.godly}+</span>
                <span className="rating-guide-item" style={{ color: '#9B59B6' }}>🟣 {ratingThresholds.great}+</span>
                <span className="rating-guide-item" style={{ color: '#00FF66' }}>🟢 {ratingThresholds.good}+</span>
                <span className="rating-guide-item" style={{ color: '#FFFFFF' }}>⚪ {ratingThresholds.average}+</span>
                <span className="rating-guide-item" style={{ color: '#888888' }}>💩 0-{ratingThresholds.average - 1}</span>
            </div>

            {/* Watchlist Cards */}
            <div className="watchlist-cards">
                {watchlist.length === 0 ? (
                    <div className="watchlist-empty-state">
                        <div className="empty-icon">🦕</div>
                        <p>{isKorean ? '카테고리를 눌러 공룡을 선택하세요' : 'Click a category to select dinos'}</p>
                        <span className="empty-hint">{isKorean ? '스탯 숫자 클릭: 직접 입력 | +/-: 스탯 조절' : 'Click stat value: Direct input | +/-: Adjust'}</span>
                    </div>
                ) : (
                    watchlist.map((entry, index) => {
                        const dino = allDinos.find(d => d.id === entry.dinoId);
                        if (!dino) return null;
                        return <WatchlistCard key={entry.dinoId} entry={entry} dino={dino} onStatChange={(key, value) => handleStatChange(index, key, value)} onRemove={() => handleRemove(index)} isKorean={isKorean} maxLevel={maxLevel} />;
                    })
                )}
            </div>

            {/* Compare Modal */}
            {showCompare && <DinoCompare onClose={() => setShowCompare(false)} />}
            {showBreeding && <BreedingSimulator onClose={() => setShowBreeding(false)} />}
            {showRaidTimer && <RaidTimer onClose={() => setShowRaidTimer(false)} />}
        </div>
    );
}
