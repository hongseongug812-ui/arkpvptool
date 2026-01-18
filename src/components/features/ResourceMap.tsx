import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import './ResourceMap.css';

interface Resource {
    id: string;
    nameKr: string;
    nameEn: string;
    icon: string;
    color: string;
    description?: string;
}

interface ResourceLocation {
    resourceId: string;
    x: number; // percentage
    y: number;
    size?: 'sm' | 'md' | 'lg';
    note?: string;
}

interface GameMap {
    id: string;
    nameKr: string;
    nameEn: string;
    image: string;
    resources: ResourceLocation[];
}

// Resources
const RESOURCES: Record<string, Resource> = {
    metal: { id: 'metal', nameKr: '메탈', nameEn: 'Metal', icon: '⛏️', color: '#8b8b8b' },
    crystal: { id: 'crystal', nameKr: '크리스탈', nameEn: 'Crystal', icon: '💎', color: '#00d4ff' },
    obsidian: { id: 'obsidian', nameKr: '흑요석', nameEn: 'Obsidian', icon: '🖤', color: '#1a1a2e' },
    oil: { id: 'oil', nameKr: '오일', nameEn: 'Oil', icon: '🛢️', color: '#2d2d2d' },
    polymer: { id: 'polymer', nameKr: '폴리머', nameEn: 'Polymer', icon: '🔷', color: '#4a4aff' },
    silica: { id: 'silica', nameKr: '실리카 펄', nameEn: 'Silica Pearls', icon: '⚪', color: '#f0f0f0' },
    paste: { id: 'paste', nameKr: '시멘트 풀', nameEn: 'Cementing Paste', icon: '🏠', color: '#c4a35a' },
    blackpearl: { id: 'blackpearl', nameKr: '검은 진주', nameEn: 'Black Pearls', icon: '⚫', color: '#0d0d0d' },
    sulfur: { id: 'sulfur', nameKr: '황', nameEn: 'Sulfur', icon: '🟡', color: '#ffff00' },
    element: { id: 'element', nameKr: '엘레멘트', nameEn: 'Element', icon: '💠', color: '#ff00ff' },
    gem_red: { id: 'gem_red', nameKr: '레드 젬', nameEn: 'Red Gem', icon: '🔴', color: '#ff3333' },
    gem_blue: { id: 'gem_blue', nameKr: '블루 젬', nameEn: 'Blue Gem', icon: '🔵', color: '#3333ff' },
    gem_green: { id: 'gem_green', nameKr: '그린 젬', nameEn: 'Green Gem', icon: '🟢', color: '#33ff33' },
    gas: { id: 'gas', nameKr: '가스볼', nameEn: 'Gas Ball', icon: '💨', color: '#90ee90' },
    honey: { id: 'honey', nameKr: '꿀', nameEn: 'Honey', icon: '🍯', color: '#ffa500' },
    sap: { id: 'sap', nameKr: '수액', nameEn: 'Sap', icon: '🧴', color: '#8b4513' },
    cactussap: { id: 'cactussap', nameKr: '선인장 수액', nameEn: 'Cactus Sap', icon: '🌵', color: '#228b22' },
    raremushroom: { id: 'raremushroom', nameKr: '희귀 버섯', nameEn: 'Rare Mushroom', icon: '🍄', color: '#8b0000' },
    rareflower: { id: 'rareflower', nameKr: '희귀 꽃', nameEn: 'Rare Flower', icon: '🌸', color: '#ff69b4' },
    obelisk: { id: 'obelisk', nameKr: '오벨리스크', nameEn: 'Obelisk', icon: '🔺', color: '#ff4444' },
    cave: { id: 'cave', nameKr: '동굴/아티팩트', nameEn: 'Cave/Artifact', icon: '🕳️', color: '#8844ff' },
    deepsea: { id: 'deepsea', nameKr: '딥시 크레이트', nameEn: 'Deep Sea Crate', icon: '📦', color: '#0088ff' },
};

// Maps with resource locations
const MAPS: GameMap[] = [
    {
        id: 'island',
        nameKr: '아일랜드',
        nameEn: 'The Island',
        image: '/maps/theisland.png',
        resources: [
            // ===== Metal Clusters =====
            { resourceId: 'metal', x: 39.5, y: 42.5, size: 'lg', note: '화산 Rim - 최고의 철 광산' },
            { resourceId: 'metal', x: 84, y: 56, size: 'lg', note: "Far's Peak / NE Mountain" },
            { resourceId: 'metal', x: 45, y: 19, size: 'lg', note: 'NW Frozen Tooth 설원' },
            { resourceId: 'metal', x: 28, y: 46, size: 'md', note: 'Grand Hills / West Mountain' },
            { resourceId: 'metal', x: 57, y: 72, size: 'md', note: 'Red Peak / SE Mountains' },
            // ===== Crystal =====
            { resourceId: 'crystal', x: 22, y: 18, size: 'lg', note: 'Northern Snow Peaks' },
            { resourceId: 'crystal', x: 38, y: 46, size: 'md', note: 'Near Volcano' },
            // ===== Obsidian =====
            { resourceId: 'obsidian', x: 40, y: 43.5, size: 'lg', note: 'Volcanic Interior' },
            // ===== Oil =====
            { resourceId: 'oil', x: 14, y: 8, size: 'lg', note: 'Deep Sea Trench SW (수중)' },
            { resourceId: 'oil', x: 90, y: 65, size: 'lg', note: 'Deep Sea Trench NE (수중)' },
            { resourceId: 'oil', x: 70, y: 75, size: 'md', note: 'Surface Oil SE 해안' },
            // ===== Beaver Dams / Paste =====
            { resourceId: 'paste', x: 46, y: 48, size: 'lg', note: 'Central River 비버 댐' },
            { resourceId: 'paste', x: 18, y: 54, size: 'lg', note: 'Southern Swamp 비버 댐' },
            // ===== Obelisks =====
            { resourceId: 'obelisk', x: 12, y: 50, size: 'lg', note: 'South Obelisk 🔴' },
            { resourceId: 'obelisk', x: 52, y: 10, size: 'lg', note: 'North Obelisk 🔵' },
            { resourceId: 'obelisk', x: 92, y: 52, size: 'lg', note: 'East Obelisk 🟢' },
            // ===== Caves =====
            { resourceId: 'cave', x: 14.2, y: 53.5, size: 'md', note: 'Southern Swamp Cave' },
            { resourceId: 'cave', x: 83.6, y: 68.2, size: 'md', note: 'NE Hill Cave' },
            // ===== Deep Sea Crates =====
            { resourceId: 'deepsea', x: 50, y: 12, size: 'lg', note: 'Deep Sea Loot Crates' },
        ]
    },
    {
        id: 'scorched',
        nameKr: '스코치드 어스',
        nameEn: 'Scorched Earth',
        image: '/maps/ScorchedEarth.png',
        resources: [
            { resourceId: 'metal', x: 80, y: 20, size: 'lg', note: '북동 산' },
            { resourceId: 'metal', x: 20, y: 30, size: 'lg', note: '북서 산' },
            { resourceId: 'crystal', x: 75, y: 25, size: 'md' },
            { resourceId: 'sulfur', x: 85, y: 70, size: 'lg', note: '황무지' },
            { resourceId: 'sulfur', x: 15, y: 80, size: 'lg', note: '남서 사막' },
            { resourceId: 'oil', x: 50, y: 50, size: 'md', note: '오아시스' },
            { resourceId: 'cactussap', x: 40, y: 60, size: 'lg', note: '사막 전역' },
        ]
    },
    {
        id: 'aberration',
        nameKr: '에버레이션',
        nameEn: 'Aberration',
        image: '/maps/Aberration.png',
        resources: [
            { resourceId: 'metal', x: 50, y: 30, size: 'lg', note: '상층부' },
            { resourceId: 'gem_blue', x: 30, y: 50, size: 'lg', note: '중층부' },
            { resourceId: 'gem_green', x: 45, y: 55, size: 'lg', note: '중층부' },
            { resourceId: 'gem_red', x: 60, y: 75, size: 'lg', note: '하층부' },
            { resourceId: 'gas', x: 40, y: 70, size: 'md', note: '가스 구역' },
            { resourceId: 'element', x: 50, y: 85, size: 'md', note: '방사능 구역' },
        ]
    },
    {
        id: 'extinction',
        nameKr: '익스팅션',
        nameEn: 'Extinction',
        image: '/maps/Extinction.png',
        resources: [
            { resourceId: 'metal', x: 25, y: 25, size: 'lg', note: '눈 돔' },
            { resourceId: 'metal', x: 70, y: 30, size: 'lg', note: '황무지' },
            { resourceId: 'crystal', x: 30, y: 28, size: 'md', note: '눈 돔' },
            { resourceId: 'oil', x: 55, y: 25, size: 'lg', note: '도시 북쪽' },
            { resourceId: 'element', x: 50, y: 50, size: 'lg', note: '도시 중심' },
            { resourceId: 'polymer', x: 50, y: 55, size: 'md', note: '도시' },
        ]
    },
    {
        id: 'ragnarok',
        nameKr: '라그나로크',
        nameEn: 'Ragnarok',
        image: '/maps/Ragnarok.png',
        resources: [
            { resourceId: 'metal', x: 25, y: 35, size: 'lg', note: '하이랜드' },
            { resourceId: 'metal', x: 45, y: 15, size: 'lg', note: '화산' },
            { resourceId: 'metal', x: 80, y: 45, size: 'md', note: '바이킹 베이' },
            { resourceId: 'crystal', x: 20, y: 40, size: 'lg', note: '하이랜드' },
            { resourceId: 'obsidian', x: 45, y: 12, size: 'lg', note: '화산' },
            { resourceId: 'oil', x: 10, y: 20, size: 'lg', note: '북서 해안' },
            { resourceId: 'silica', x: 90, y: 80, size: 'md', note: '남동 해저' },
        ]
    },
    {
        id: 'genesis',
        nameKr: '제네시스',
        nameEn: 'Genesis',
        image: '/maps/Gensispart1.png',
        resources: [
            { resourceId: 'metal', x: 15, y: 50, size: 'lg', note: '북극' },
            { resourceId: 'metal', x: 85, y: 50, size: 'lg', note: '화산' },
            { resourceId: 'element', x: 50, y: 50, size: 'lg', note: '우주 바이옴' },
            { resourceId: 'blackpearl', x: 50, y: 80, size: 'lg', note: '바다 바이옴' },
            { resourceId: 'honey', x: 50, y: 20, size: 'md', note: '숲 바이옴' },
        ]
    },
];

export function ResourceMap() {
    const { i18n } = useTranslation();
    const isKorean = i18n.language === 'ko';

    const [selectedMap, setSelectedMap] = useState<string>('island');
    const [selectedResource, setSelectedResource] = useState<string | null>(null);
    const [hoveredPoint, setHoveredPoint] = useState<ResourceLocation | null>(null);

    const currentMap = useMemo(() => MAPS.find(m => m.id === selectedMap), [selectedMap]);

    const filteredResources = useMemo(() => {
        if (!currentMap) return [];
        if (!selectedResource) return currentMap.resources;
        return currentMap.resources.filter(r => r.resourceId === selectedResource);
    }, [currentMap, selectedResource]);

    const uniqueResourceIds = useMemo(() => {
        if (!currentMap) return [];
        return [...new Set(currentMap.resources.map(r => r.resourceId))];
    }, [currentMap]);

    return (
        <div className="resource-map">
            {/* Header */}
            <div className="resource-map__header">
                <h2>🗺️ {isKorean ? '자원 맵' : 'Resource Map'}</h2>
                <p>{isKorean ? 'ARK 맵별 자원 위치' : 'Resource locations by ARK map'}</p>
            </div>

            {/* Map Selector */}
            <div className="resource-map__maps">
                {MAPS.map(map => (
                    <button
                        key={map.id}
                        className={`map-btn ${selectedMap === map.id ? 'active' : ''}`}
                        onClick={() => { setSelectedMap(map.id); setSelectedResource(null); }}
                    >
                        {isKorean ? map.nameKr : map.nameEn}
                    </button>
                ))}
            </div>

            {/* Resource Filter */}
            <div className="resource-filter">
                <button
                    className={`resource-filter-btn ${selectedResource === null ? 'active' : ''}`}
                    onClick={() => setSelectedResource(null)}
                >
                    📋 {isKorean ? '전체' : 'All'}
                </button>
                {uniqueResourceIds.map(resId => {
                    const res = RESOURCES[resId];
                    if (!res) return null;
                    return (
                        <button
                            key={resId}
                            className={`resource-filter-btn ${selectedResource === resId ? 'active' : ''}`}
                            onClick={() => setSelectedResource(selectedResource === resId ? null : resId)}
                            style={{ '--res-color': res.color } as React.CSSProperties}
                        >
                            {res.icon} {isKorean ? res.nameKr : res.nameEn}
                        </button>
                    );
                })}
            </div>

            {/* Map Display */}
            <div className="resource-map__display">
                <div className="resource-map__container">
                    <img
                        src={currentMap?.image}
                        alt={currentMap?.nameEn}
                        className="resource-map__image"
                        onError={(e) => { e.currentTarget.style.background = 'var(--color-bg-tertiary)'; }}
                    />

                    {/* Resource Points */}
                    {filteredResources.map((loc, idx) => {
                        const res = RESOURCES[loc.resourceId];
                        if (!res) return null;
                        return (
                            <div
                                key={idx}
                                className={`resource-point resource-point--${loc.size || 'md'}`}
                                style={{
                                    left: `${loc.x}%`,
                                    top: `${loc.y}%`,
                                    '--point-color': res.color,
                                } as React.CSSProperties}
                                onMouseEnter={() => setHoveredPoint(loc)}
                                onMouseLeave={() => setHoveredPoint(null)}
                            >
                                <span>{res.icon}</span>
                            </div>
                        );
                    })}

                    {/* Tooltip */}
                    {hoveredPoint && (
                        <div
                            className="resource-tooltip"
                            style={{
                                left: `${hoveredPoint.x}%`,
                                top: `${hoveredPoint.y - 10}%`
                            }}
                        >
                            {RESOURCES[hoveredPoint.resourceId]?.icon} {isKorean ? RESOURCES[hoveredPoint.resourceId]?.nameKr : RESOURCES[hoveredPoint.resourceId]?.nameEn}
                            {hoveredPoint.note && <span className="resource-tooltip__note">{hoveredPoint.note}</span>}
                        </div>
                    )}
                </div>
            </div>

            {/* Legend */}
            <div className="resource-legend">
                <h4>{isKorean ? '범례' : 'Legend'}</h4>
                <div className="resource-legend__grid">
                    {uniqueResourceIds.map(resId => {
                        const res = RESOURCES[resId];
                        if (!res) return null;
                        return (
                            <div key={resId} className="resource-legend__item">
                                <span className="resource-legend__icon" style={{ color: res.color }}>{res.icon}</span>
                                <span>{isKorean ? res.nameKr : res.nameEn}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
