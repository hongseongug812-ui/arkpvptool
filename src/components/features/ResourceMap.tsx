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
    water_vein: { id: 'water_vein', nameKr: '물 베인', nameEn: 'Water Vein', icon: '💧', color: '#00aaff' },
    oil_vein: { id: 'oil_vein', nameKr: '오일 베인', nameEn: 'Oil Vein', icon: '🛢️', color: '#333333' },
    wyvern: { id: 'wyvern', nameKr: '와이번 둥지', nameEn: 'Wyvern Nest', icon: '🐉', color: '#ff6600' },
    charge_node: { id: 'charge_node', nameKr: '차지 노드', nameEn: 'Charge Node', icon: '⚡', color: '#ffff00' },
    gas_vein: { id: 'gas_vein', nameKr: '가스 베인', nameEn: 'Gas Vein', icon: '💨', color: '#00ff88' },
    drake_nest: { id: 'drake_nest', nameKr: '락 드레이크 둥지', nameEn: 'Rock Drake Nest', icon: '🦎', color: '#00ccff' },
    reaper: { id: 'reaper', nameKr: '리퍼 퀘 구역', nameEn: 'Reaper Queen Zone', icon: '👾', color: '#ff0066' },
    surface: { id: 'surface', nameKr: '지표 입구', nameEn: 'Surface Entrance', icon: '☀️', color: '#ffaa00' },
    osd: { id: 'osd', nameKr: 'OSD', nameEn: 'Orbital Supply Drop', icon: '📡', color: '#00ff00' },
    element_vein: { id: 'element_vein', nameKr: '엘리먼트 베인', nameEn: 'Element Vein', icon: '💎', color: '#ff00ff' },
    titan: { id: 'titan', nameKr: '타이탄 터미널', nameEn: 'Titan Terminal', icon: '👹', color: '#ff4400' },
    city: { id: 'city', nameKr: '도시 터미널', nameEn: 'City Terminal', icon: '🏙️', color: '#00ffff' },
    whale: { id: 'whale', nameKr: '좌초된 고래', nameEn: 'Beached Whale', icon: '🐋', color: '#4488ff' },
    charcoal: { id: 'charcoal', nameKr: '숭', nameEn: 'Charcoal', icon: '🪨', color: '#333333' },
    dungeon: { id: 'dungeon', nameKr: '던전 입구', nameEn: 'Dungeon Entrance', icon: '🚧', color: '#aa4400' },
    wild_crop: { id: 'wild_crop', nameKr: '야생 작물', nameEn: 'Wild Crops', icon: '🥕', color: '#88cc00' },
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
            // ===== Water Veins =====
            { resourceId: 'water_vein', x: 18, y: 12.5, size: 'lg', note: 'NW Plateau 물 베인' },
            { resourceId: 'water_vein', x: 47.7, y: 50.2, size: 'lg', note: 'Central Oasis 물 베인' },
            { resourceId: 'water_vein', x: 72.9, y: 84.1, size: 'md', note: 'SE Dunes 물 베인' },
            // ===== Oil Veins =====
            { resourceId: 'oil_vein', x: 12.7, y: 18.4, size: 'lg', note: 'SW Oil Field' },
            { resourceId: 'oil_vein', x: 50.5, y: 52.8, size: 'lg', note: 'Central Plateau' },
            { resourceId: 'oil_vein', x: 86.3, y: 78.6, size: 'md', note: 'NE Field' },
            // ===== Wyvern Nests =====
            { resourceId: 'wyvern', x: 42, y: 48.7, size: 'lg', note: 'World Scar West' },
            { resourceId: 'wyvern', x: 55.1, y: 53.6, size: 'lg', note: 'World Scar East' },
            { resourceId: 'wyvern', x: 36.2, y: 64.9, size: 'md', note: 'South Pass' },
            // ===== Sulfur =====
            { resourceId: 'sulfur', x: 85, y: 70, size: 'lg', note: '황무지' },
            { resourceId: 'sulfur', x: 15, y: 80, size: 'lg', note: '남서 사막' },
            // ===== Cactus Sap =====
            { resourceId: 'cactussap', x: 50, y: 50, size: 'lg', note: '사막 전역' },
        ]
    },
    {
        id: 'aberration',
        nameKr: '에버레이션',
        nameEn: 'Aberration',
        image: '/maps/Aberration.png',
        resources: [
            // ===== Charge Nodes =====
            { resourceId: 'charge_node', x: 65, y: 21, size: 'lg', note: 'NE Cavern Cluster' },
            { resourceId: 'charge_node', x: 50, y: 48, size: 'lg', note: 'Lower Grave' },
            { resourceId: 'charge_node', x: 31, y: 42, size: 'md', note: 'West Spine Ridge' },
            // ===== Gas Veins =====
            { resourceId: 'gas_vein', x: 72, y: 36, size: 'lg', note: 'Upper Plateau Vent' },
            { resourceId: 'gas_vein', x: 49, y: 50, size: 'lg', note: 'Deep Cavern Vent' },
            // ===== Rock Drake Nests =====
            { resourceId: 'drake_nest', x: 50, y: 47, size: 'lg', note: 'Grave of the Lost - Upper Ledge' },
            { resourceId: 'drake_nest', x: 52, y: 46, size: 'lg', note: 'Grave of the Lost - Sky Tunnel' },
            // ===== Reaper Queen Zones =====
            { resourceId: 'reaper', x: 78, y: 21, size: 'lg', note: 'Main Chamber' },
            { resourceId: 'reaper', x: 46, y: 60, size: 'lg', note: 'Side Tunnel Complex' },
            // ===== Surface Entrances =====
            { resourceId: 'surface', x: 84, y: 20, size: 'lg', note: 'Burn Point Alpha' },
            { resourceId: 'surface', x: 26, y: 49, size: 'md', note: 'North Scar' },
            // ===== Gems =====
            { resourceId: 'gem_green', x: 54, y: 51, size: 'lg', note: 'Green Zone - Fungal Terrace' },
            { resourceId: 'gem_blue', x: 40, y: 48, size: 'lg', note: 'Blue Zone - Luminous Cavern' },
            { resourceId: 'gem_red', x: 76, y: 38, size: 'lg', note: 'Red Zone - Rift Veins' },
            // ===== Element =====
            { resourceId: 'element', x: 76, y: 38, size: 'lg', note: 'Core Rift - Element Ore' },
            // ===== Metal =====
            { resourceId: 'metal', x: 61, y: 39, size: 'md', note: 'Upper Ridge' },
            // ===== Artifact Cave =====
            { resourceId: 'cave', x: 50, y: 47, size: 'md', note: 'Grave of the Lost' },
        ]
    },
    {
        id: 'extinction',
        nameKr: '익스팅션',
        nameEn: 'Extinction',
        image: '/maps/Extinction.png',
        resources: [
            // ===== OSD Pads =====
            { resourceId: 'osd', x: 18.9, y: 12.4, size: 'lg', note: 'NW Industrial Sector' },
            { resourceId: 'osd', x: 31.1, y: 24.8, size: 'lg', note: 'West Ruins' },
            { resourceId: 'osd', x: 50.4, y: 49.6, size: 'lg', note: 'Sanctuary Rooftop' },
            { resourceId: 'osd', x: 63, y: 69.2, size: 'md', note: 'South Park / Plaza' },
            // ===== Element Veins =====
            { resourceId: 'element_vein', x: 22.5, y: 15, size: 'md', note: '10k - North Corridor' },
            { resourceId: 'element_vein', x: 52.2, y: 48.9, size: 'lg', note: '25k - Mid-City' },
            { resourceId: 'element_vein', x: 45.3, y: 86.6, size: 'lg', note: '50k - Corrupted Core Edge' },
            // ===== City Terminal =====
            { resourceId: 'city', x: 50, y: 50, size: 'lg', note: 'Sanctuary Center' },
            // ===== Titan Terminals =====
            { resourceId: 'titan', x: 40.5, y: 28, size: 'lg', note: 'Forest Titan' },
            { resourceId: 'titan', x: 68.1, y: 72.4, size: 'lg', note: 'Desert Titan' },
            { resourceId: 'titan', x: 82.2, y: 12, size: 'lg', note: 'Ice Titan' },
            // ===== Landmarks =====
            { resourceId: 'obelisk', x: 92.7, y: 10.5, size: 'lg', note: 'Snow Dome ❄️' },
            { resourceId: 'obelisk', x: 12.6, y: 78.9, size: 'lg', note: 'Desert Dome 🏜️' },
            { resourceId: 'obelisk', x: 72, y: 60.3, size: 'lg', note: 'Sunken Forest 🌳' },
            // ===== Resources =====
            { resourceId: 'element', x: 54, y: 46.8, size: 'lg', note: 'Element Dust - City Benches' },
            { resourceId: 'polymer', x: 32.4, y: 88.1, size: 'lg', note: 'Corrupted Nodules' },
        ]
    },
    {
        id: 'ragnarok',
        nameKr: '라그나로크',
        nameEn: 'Ragnarok',
        image: '/maps/Ragnarok.png',
        resources: [
            // ===== Beached Whales =====
            { resourceId: 'whale', x: 34.8, y: 26.4, size: 'lg', note: 'Highlands Strand A' },
            { resourceId: 'whale', x: 36.6, y: 29, size: 'md', note: 'Highlands Strand B' },
            { resourceId: 'whale', x: 18.5, y: 12.2, size: 'md', note: 'Lowland Strand C' },
            // ===== Wild Crops =====
            { resourceId: 'wild_crop', x: 42.2, y: 31.7, size: 'lg', note: 'Savoroot - Highland Terrace' },
            { resourceId: 'wild_crop', x: 45, y: 34, size: 'md', note: 'Rockarrot - Highland Scree' },
            // ===== Obsidian =====
            { resourceId: 'obsidian', x: 72.4, y: 50.1, size: 'lg', note: 'Volcano Flank' },
            { resourceId: 'obsidian', x: 74.1, y: 48.3, size: 'md', note: 'Volcano Cave' },
            // ===== Charcoal =====
            { resourceId: 'charcoal', x: 70.9, y: 52, size: 'lg', note: 'Burnt Tree Field' },
            { resourceId: 'charcoal', x: 68, y: 58, size: 'md', note: 'Burnt Ridge' },
            // ===== Wyvern Trench (Fire/Lightning/Poison) =====
            { resourceId: 'wyvern', x: 72.6, y: 49.9, size: 'lg', note: 'Fire Wyverns - Trench Center' },
            { resourceId: 'wyvern', x: 75.5, y: 53.2, size: 'lg', note: 'Lightning Wyverns - NE Edge' },
            { resourceId: 'wyvern', x: 70, y: 55.7, size: 'lg', note: 'Poison Wyverns - SE Edge' },
            // ===== Ice Wyvern Nests =====
            { resourceId: 'wyvern', x: 10.5, y: 84, size: 'lg', note: 'Ice Wyverns - Murder Snow A' },
            { resourceId: 'wyvern', x: 8.7, y: 80.6, size: 'lg', note: 'Ice Wyverns - Murder Snow B' },
            // ===== Dungeons =====
            { resourceId: 'dungeon', x: 73.9, y: 46.5, size: 'lg', note: 'Lava Golem Cave' },
            { resourceId: 'dungeon', x: 11.2, y: 81.9, size: 'lg', note: 'Ice Worm Queen Cave' },
            { resourceId: 'dungeon', x: 52.6, y: 62.9, size: 'lg', note: 'Jungle Labyrinth' },
            { resourceId: 'dungeon', x: 19.9, y: 52, size: 'md', note: "Life's Labyrinth" },
            // ===== Oil Veins =====
            { resourceId: 'oil_vein', x: 84.8, y: 22.7, size: 'lg', note: 'Desert Pump Site' },
            { resourceId: 'oil_vein', x: 12.5, y: 78.9, size: 'md', note: 'Snowfield Pump Site' },
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
