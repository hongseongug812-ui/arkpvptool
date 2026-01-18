import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameVersion } from '../../context/GameVersionContext';
import { dataManager } from '../../services/DataManager';
import type { DinoStatsEntry } from '../../types';
import './DinoEncyclopedia.css';

type StatKey = 'health' | 'stamina' | 'weight' | 'melee';

interface Rating { tier: string; icon: string; color: string; }

// Server level cap presets
const LEVEL_CAP_PRESETS = [
    { id: 'official', labelKr: '오피셜 (150)', labelEn: 'Official (150)', maxLevel: 150 },
    { id: 'small_tribe', labelKr: '스몰트 (180)', labelEn: 'Small Tribe (180)', maxLevel: 180 },
    { id: 'unofficial_225', labelKr: '비공식 (225)', labelEn: 'Unofficial (225)', maxLevel: 225 },
    { id: 'unofficial_300', labelKr: '비공식 (300)', labelEn: 'Unofficial (300)', maxLevel: 300 },
];

// Dino categories
const DINO_CATEGORIES: Record<string, { icon: string; labelKr: string; labelEn: string; ids: string[] }> = {
    pvp_meta: { icon: '⚔️', labelKr: 'PVP 메타', labelEn: 'PVP Meta', ids: ['stego', 'rex', 'carcha', 'giga', 'shadowmane', 'thyla', 'rhynio'] },
    dealers: { icon: '💥', labelKr: '딜러', labelEn: 'Dealers', ids: ['therizino', 'rhino', 'rex', 'carcha', 'giga', 'thyla'] },
    tankers: { icon: '🛡️', labelKr: '탱커', labelEn: 'Tankers', ids: ['stego', 'carbonemys', 'trike', 'paracer', 'gasbag', 'rhynio'] },
    flyers: { icon: '🦅', labelKr: '비행', labelEn: 'Flyers', ids: ['pteranodon', 'argentavis', 'quetzal', 'wyvern', 'crystal_wyvern', 'desmodus', 'griffin', 'rhynio', 'pelagornis'] },
    support: { icon: '💖', labelKr: '서포터', labelEn: 'Support', ids: ['yuty', 'daedon'] },
    water: { icon: '🌊', labelKr: '수중', labelEn: 'Aquatic', ids: ['tusoteuthis', 'mosasaurus', 'megalodon', 'plesiosaur', 'basilosaurus', 'dunkleosteus'] },
    utility: { icon: '🔧', labelKr: '유틸리티', labelEn: 'Utility', ids: ['astrocetus', 'astrodelphis', 'sinomacrops', 'fjordhawk'] },
};

// ASA/ASE dino filters
const ASA_ONLY_DINOS = ['carcha', 'rhynio', 'desmodus', 'fjordhawk', 'sinomacrops'];
const ASE_ONLY_DINOS = ['astrocetus', 'astrodelphis', 'shadowmane', 'crystal_wyvern', 'gasbag'];

// Get dino image URL
function getDinoImageUrl(dinoId: string): string {
    const specialMappings: Record<string, string> = {
        // Short names to full names
        'carcha': 'carcharodontosaurus', 'stego': 'stegosaurus', 'giga': 'giganotosaurus',
        'yuty': 'yutyrannus', 'rex': 'rex', 'daedon': 'daeodon', 'thyla': 'thylacoleo',
        'therizino': 'therizinosaur', 'rhynio': 'rhyniognatha', 'trike': 'triceratops',
        'paracer': 'paraceratherium', 'gasbag': 'gasbags', 'rhino': 'woolly-rhino',
        'tropeo': 'tropeognathus', 'angler': 'anglerfish', 'stryder': 'tek-stryder',
        // Underscore to hyphen conversions
        'giant_bee': 'giant-queen-bee', 'royal_griffin': 'griffin', 'woolly_rhino': 'woolly-rhino',
        'dire_bear': 'dire-bear', 'direbear': 'dire-bear', 'rock_elemental': 'rock-elemental',
        'rock_drake': 'rock-drake', 'snow_owl': 'snow-owl', 'terror_bird': 'terror-bird',
        'dung_beetle': 'dung-beetle', 'dungbeetle': 'dung-beetle', 'thorny_dragon': 'thorny-dragon',
        'crystal_wyvern': 'crystal-wyvern', 'tek_stryder': 'tek-stryder', 'roll_rat': 'roll-rat',
        // Spelling variations
        'spinosaurus': 'spino', 'achatina': 'Achatina', 'unicorn': 'equus',
        'hyaenodon': 'hyaenodon', 'megalania': 'megalania', 'reaper': 'reaper',
    };
    const mappedId = specialMappings[dinoId] || dinoId.replace(/_/g, '-');
    return `/dinos/${mappedId}.png`;
}

function getRating(point: number, maxLevel: number): Rating {
    const ratio = maxLevel / 150;
    if (point >= 50 * ratio) return { tier: 'godly', icon: '🔴', color: '#FFD700' };
    if (point >= 40 * ratio) return { tier: 'great', icon: '🟣', color: '#9B59B6' };
    if (point >= 30 * ratio) return { tier: 'good', icon: '🟢', color: '#00FF66' };
    if (point >= 20 * ratio) return { tier: 'average', icon: '⚪', color: '#FFFFFF' };
    return { tier: 'trash', icon: '💩', color: '#888888' };
}

// Dino Detail Modal Component
interface DinoDetailModalProps {
    dino: DinoStatsEntry;
    onClose: () => void;
    isKorean: boolean;
    maxLevel: number;
}

function DinoDetailModal({ dino, onClose, isKorean, maxLevel }: DinoDetailModalProps) {
    const [stats, setStats] = useState<Record<StatKey, number>>({
        health: dino.stats.health.base,
        stamina: dino.stats.stamina.base,
        weight: dino.stats.weight.base,
        melee: dino.stats.melee.base,
    });

    const statKeys: StatKey[] = ['health', 'stamina', 'weight', 'melee'];
    const statLabels: Record<StatKey, { kr: string; en: string; icon: string }> = {
        health: { kr: '체력', en: 'Health', icon: '❤️' },
        stamina: { kr: '기력', en: 'Stamina', icon: '⚡' },
        weight: { kr: '무게', en: 'Weight', icon: '📦' },
        melee: { kr: '근공', en: 'Melee', icon: '⚔️' },
    };

    const calcPoint = (key: StatKey) => {
        const base = dino.stats[key].base;
        const inc = dino.stats[key].inc_wild;
        if (stats[key] <= base || inc === 0) return 0;
        return Math.round((stats[key] - base) / inc);
    };

    const dinoName = dino.name_kr.split('(')[0].trim();
    const dinoRole = dino.name_kr.includes('(') ? dino.name_kr.split('(')[1]?.replace(')', '') : '';

    // Simple breeding info (placeholder - can be expanded)
    const breedingInfo = {
        incubationTime: '~2시간', // These would come from data
        maturationTime: '~4시간',
        imprintInterval: '~8시간',
    };

    return (
        <div className="dino-modal-overlay" onClick={onClose}>
            <div className="dino-modal" onClick={(e) => e.stopPropagation()}>
                <button className="dino-modal__close" onClick={onClose}>✕</button>

                {/* Header with Image */}
                <div className="dino-modal__header">
                    <div className="dino-modal__image">
                        <img
                            src={getDinoImageUrl(dino.id)}
                            alt={dinoName}
                            onError={(e) => { e.currentTarget.src = ''; }}
                        />
                    </div>
                    <div className="dino-modal__title">
                        <h2>{dinoName}</h2>
                        {dinoRole && <span className="dino-modal__role">{dinoRole}</span>}
                        {dino.note && <p className="dino-modal__note">{dino.note}</p>}
                    </div>
                </div>

                <div className="dino-modal__content">
                    {/* Stat Calculator */}
                    <div className="dino-modal__section">
                        <h3>📊 {isKorean ? '스탯 계산기' : 'Stat Calculator'}</h3>
                        <div className="stat-calculator">
                            {statKeys.map((key) => {
                                const point = calcPoint(key);
                                const rating = getRating(point, maxLevel);
                                const base = dino.stats[key].base;
                                const inc = dino.stats[key].inc_wild;

                                return (
                                    <div key={key} className="stat-row">
                                        <span className="stat-row__label">
                                            {statLabels[key].icon} {isKorean ? statLabels[key].kr : statLabels[key].en}
                                        </span>
                                        <div className="stat-row__controls">
                                            <button onClick={() => setStats(s => ({ ...s, [key]: Math.max(base, s[key] - inc) }))}>−</button>
                                            <input
                                                type="number"
                                                value={Math.round(stats[key])}
                                                onChange={(e) => setStats(s => ({ ...s, [key]: parseFloat(e.target.value) || base }))}
                                            />
                                            <button onClick={() => setStats(s => ({ ...s, [key]: s[key] + inc }))}>+</button>
                                        </div>
                                        <span className="stat-row__point" style={{ color: rating.color }}>
                                            {point > 0 ? `${point}pt ${rating.icon}` : '-'}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="stat-base-info">
                            <small>{isKorean ? '기본 스탯' : 'Base Stats'}: HP {dino.stats.health.base} | ST {dino.stats.stamina.base} | WT {dino.stats.weight.base} | ME {dino.stats.melee.base}</small>
                        </div>
                    </div>

                    {/* Breeding Info */}
                    <div className="dino-modal__section">
                        <h3>🧬 {isKorean ? '브리딩 정보' : 'Breeding Info'}</h3>
                        <div className="breeding-info-grid">
                            <div className="breeding-info-item">
                                <span className="breeding-info-icon">🥚</span>
                                <span className="breeding-info-label">{isKorean ? '부화 시간' : 'Incubation'}</span>
                                <span className="breeding-info-value">{breedingInfo.incubationTime}</span>
                            </div>
                            <div className="breeding-info-item">
                                <span className="breeding-info-icon">🐣</span>
                                <span className="breeding-info-label">{isKorean ? '성장 시간' : 'Maturation'}</span>
                                <span className="breeding-info-value">{breedingInfo.maturationTime}</span>
                            </div>
                            <div className="breeding-info-item">
                                <span className="breeding-info-icon">💕</span>
                                <span className="breeding-info-label">{isKorean ? '각인 간격' : 'Imprint Interval'}</span>
                                <span className="breeding-info-value">{breedingInfo.imprintInterval}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Main Component
export function DinoEncyclopedia() {
    const { i18n } = useTranslation();
    const { gameVersion } = useGameVersion();
    const isKorean = i18n.language === 'ko';
    const allDinos = dataManager.getAllDinoStats();

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedDino, setSelectedDino] = useState<DinoStatsEntry | null>(null);
    const [levelCapPreset, setLevelCapPreset] = useState('official');

    const maxLevel = useMemo(() => {
        return LEVEL_CAP_PRESETS.find(p => p.id === levelCapPreset)?.maxLevel || 150;
    }, [levelCapPreset]);

    // Filter dinos by game version
    const versionFilteredDinos = useMemo(() => {
        return allDinos.filter(dino => {
            if (gameVersion === 'ASA') return !ASE_ONLY_DINOS.includes(dino.id);
            return !ASA_ONLY_DINOS.includes(dino.id);
        });
    }, [allDinos, gameVersion]);

    // Filter by search and category
    const filteredDinos = useMemo(() => {
        let result = versionFilteredDinos;

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(d => d.name_kr.toLowerCase().includes(q) || d.id.toLowerCase().includes(q));
        }

        if (selectedCategory && DINO_CATEGORIES[selectedCategory]) {
            const categoryIds = DINO_CATEGORIES[selectedCategory].ids;
            result = result.filter(d => categoryIds.includes(d.id));
        }

        return result;
    }, [versionFilteredDinos, searchQuery, selectedCategory]);

    const handleDinoClick = useCallback((dino: DinoStatsEntry) => {
        setSelectedDino(dino);
    }, []);

    return (
        <div className="dino-encyclopedia">
            <div className="dino-encyclopedia__header">
                <h2>🦖 {isKorean ? '공룡 도감' : 'Dino Encyclopedia'}</h2>
                <p>{isKorean ? '공룡을 클릭하면 상세 정보를 볼 수 있어요' : 'Click a dino to see details'}</p>
            </div>

            {/* Level Cap Selector */}
            <div className="level-cap-row">
                {LEVEL_CAP_PRESETS.map(preset => (
                    <button
                        key={preset.id}
                        className={`level-cap-chip ${levelCapPreset === preset.id ? 'level-cap-chip--active' : ''}`}
                        onClick={() => setLevelCapPreset(preset.id)}
                    >
                        {isKorean ? preset.labelKr : preset.labelEn}
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="dino-search">
                <span>🔍</span>
                <input
                    type="text"
                    placeholder={isKorean ? '공룡 검색...' : 'Search dino...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && <button onClick={() => setSearchQuery('')}>✕</button>}
            </div>

            {/* Category Filters */}
            <div className="category-chips">
                <button
                    className={`category-chip ${selectedCategory === null ? 'category-chip--active' : ''}`}
                    onClick={() => setSelectedCategory(null)}
                >
                    📋 {isKorean ? '전체' : 'All'} ({versionFilteredDinos.length})
                </button>
                {Object.entries(DINO_CATEGORIES).map(([key, cat]) => (
                    <button
                        key={key}
                        className={`category-chip ${selectedCategory === key ? 'category-chip--active' : ''}`}
                        onClick={() => setSelectedCategory(selectedCategory === key ? null : key)}
                    >
                        {cat.icon} {isKorean ? cat.labelKr : cat.labelEn}
                    </button>
                ))}
            </div>

            {/* Dino Count */}
            <div className="dino-count">
                {filteredDinos.length}{isKorean ? '종' : ' dinos'}
            </div>

            {/* Dino Grid */}
            <div className="dino-grid">
                {filteredDinos.map((dino) => {
                    const dinoName = dino.name_kr.split('(')[0].trim();
                    return (
                        <div
                            key={dino.id}
                            className="dino-card"
                            onClick={() => handleDinoClick(dino)}
                        >
                            <div className="dino-card__image">
                                <img
                                    src={getDinoImageUrl(dino.id)}
                                    alt={dinoName}
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                    }}
                                />
                            </div>
                            <div className="dino-card__name">{dinoName}</div>
                        </div>
                    );
                })}
            </div>

            {/* Detail Modal */}
            {selectedDino && (
                <DinoDetailModal
                    dino={selectedDino}
                    onClose={() => setSelectedDino(null)}
                    isKorean={isKorean}
                    maxLevel={maxLevel}
                />
            )}
        </div>
    );
}
