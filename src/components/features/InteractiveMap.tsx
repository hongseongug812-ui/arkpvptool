import { useMemo, useState, useRef } from 'react';
import type { RatholeLocation } from '../../types';
import './InteractiveMap.css';

interface InteractiveMapProps {
    mapId: string;
    mapName: string;
    locations: RatholeLocation[];
    onLocationClick: (location: RatholeLocation) => void;
    onLocationHover?: (location: RatholeLocation | null) => void;
    isKorean: boolean;
}

// ARK map coordinates are typically 0-100 for both lat and lon
const MAP_SIZE = 100;

// Local map images in public/maps/ folder
// All maps have AI-generated backgrounds
const MAP_IMAGES: Record<string, string> = {
    // The Island
    'the_island': '/maps/the_island.png',
    'the_island_asa': '/maps/the_island.png',
    'the_island_ase': '/maps/the_island.png',
    // Scorched Earth
    'scorched_earth': '/maps/scorched_earth.png',
    'scorched_earth_asa': '/maps/scorched_earth.png',
    'scorched_earth_ase': '/maps/scorched_earth.png',
    // Aberration
    'aberration': '/maps/aberration.png',
    'aberration_asa': '/maps/aberration.png',
    'aberration_ase': '/maps/aberration.png',
    // The Center
    'the_center': '/maps/the_center.png',
    'the_center_asa': '/maps/the_center.png',
    'the_center_ase': '/maps/the_center.png',
    // Extinction
    'extinction': '/maps/extinction.png',
    'extinction_ase': '/maps/extinction.png',
    // Ragnarok
    'ragnarok': '/maps/ragnarok.png',
    'ragnarok_ase': '/maps/ragnarok.png',
    // Valguero
    'valguero': '/maps/valguero.png',
    'valguero_ase': '/maps/valguero.png',
    // Genesis (Part 1 and Part 2)
    'genesis': '/maps/genesis.png',
    'genesis_ase': '/maps/genesis.png',
    'genesis_1': '/maps/genesis.png',
    'genesis_1_ase': '/maps/genesis.png',
    'genesis_2': '/maps/genesis.png',
    'genesis_2_ase': '/maps/genesis.png',
    // Crystal Isles
    'crystal_isles': '/maps/crystal_isles.png',
    'crystal_isles_ase': '/maps/crystal_isles.png',
    // Lost Island
    'lost_island': '/maps/lost_island.png',
    'lost_island_ase': '/maps/lost_island.png',
    // Fjordur
    'fjordur': '/maps/fjordur.png',
    'fjordur_ase': '/maps/fjordur.png',
    // Future maps - fallback to empty (will show gradient)
    'future_maps': '',
};

// Type icons and colors for markers
const TYPE_CONFIG: Record<string, { icon: string; color: string }> = {
    'Cave': { icon: '🕳️', color: '#8E44AD' },
    'Underwater': { icon: '🌊', color: '#3498DB' },
    'Underwater Rathole': { icon: '🐚', color: '#00CED1' },
    'Rathole': { icon: '🐀', color: '#E74C3C' },
    'Cliff Ledge': { icon: '🏔️', color: '#95A5A6' },
    'Cliff': { icon: '⛰️', color: '#7F8C8D' },
    'Ceiling': { icon: '🦇', color: '#2C3E50' },
    'Tree Platform': { icon: '🌲', color: '#27AE60' },
    'Pillar': { icon: '🗼', color: '#F39C12' },
    'default': { icon: '📍', color: '#00E5FF' },
};

const DIFFICULTY_COLORS: Record<string, string> = {
    'Easy': '#2ECC71',
    'Medium': '#F39C12',
    'Hard': '#E74C3C',
    'Extreme': '#9B59B6',
};

export function InteractiveMap({
    mapId,
    mapName,
    locations,
    onLocationClick,
    onLocationHover,
    isKorean
}: InteractiveMapProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [hoveredLocation, setHoveredLocation] = useState<RatholeLocation | null>(null);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [showLegend, setShowLegend] = useState(true);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);

    // Touch gesture states
    const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
    const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(null);
    const [darkMapMode, setDarkMapMode] = useState(false);
    const [clusteringEnabled, setClusteringEnabled] = useState(true);

    // Get map image URL
    const mapImageUrl = MAP_IMAGES[mapId] || null;

    // Get unique location types for legend
    const locationTypes = useMemo(() => {
        const types = new Set(locations.map(loc => loc.type));
        return Array.from(types);
    }, [locations]);

    // Convert ARK coordinates to map position (percentage)
    const coordToPosition = (lat: number, lon: number) => {
        // ARK uses lat for Y (inverted) and lon for X
        const x = (lon / MAP_SIZE) * 100;
        const y = (lat / MAP_SIZE) * 100;
        return { x, y };
    };

    // Cluster markers based on zoom level
    interface Cluster {
        id: string;
        center: { x: number; y: number };
        locations: RatholeLocation[];
        count: number;
    }

    const clusteredLocations = useMemo(() => {
        if (!clusteringEnabled || zoom > 1.5) {
            // No clustering at high zoom or when disabled
            return { clusters: [] as Cluster[], singles: locations };
        }

        const clusterRadius = 8 / zoom; // Cluster radius in map units, smaller when zoomed in
        const clusters: Cluster[] = [];
        const used = new Set<string>();

        locations.forEach(loc => {
            if (!loc.coords || used.has(loc.id)) return;

            const pos = coordToPosition(loc.coords.lat, loc.coords.lon);
            const nearby = locations.filter(other => {
                if (!other.coords || other.id === loc.id || used.has(other.id)) return false;
                const otherPos = coordToPosition(other.coords.lat, other.coords.lon);
                const dist = Math.sqrt(Math.pow(pos.x - otherPos.x, 2) + Math.pow(pos.y - otherPos.y, 2));
                return dist < clusterRadius;
            });

            if (nearby.length >= 2) {
                const clusterLocs = [loc, ...nearby];
                clusterLocs.forEach(l => used.add(l.id));

                // Calculate cluster center
                const avgX = clusterLocs.reduce((sum, l) => sum + (l.coords ? coordToPosition(l.coords.lat, l.coords.lon).x : 0), 0) / clusterLocs.length;
                const avgY = clusterLocs.reduce((sum, l) => sum + (l.coords ? coordToPosition(l.coords.lat, l.coords.lon).y : 0), 0) / clusterLocs.length;

                clusters.push({
                    id: `cluster-${loc.id}`,
                    center: { x: avgX, y: avgY },
                    locations: clusterLocs,
                    count: clusterLocs.length,
                });
            }
        });

        const singles = locations.filter(l => !used.has(l.id));
        return { clusters, singles };
    }, [locations, zoom, clusteringEnabled]);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button === 0) {
            setIsDragging(true);
            setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging) {
            setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoom(prev => Math.min(3, Math.max(0.5, prev + delta)));
    };

    const handleLocationHover = (location: RatholeLocation | null) => {
        setHoveredLocation(location);
        onLocationHover?.(location);
    };

    const resetView = () => {
        setZoom(1);
        setPan({ x: 0, y: 0 });
    };

    // Touch gesture handlers
    const getTouchDistance = (touches: React.TouchList) => {
        if (touches.length < 2) return null;
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 1) {
            setTouchStart({ x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y });
        } else if (e.touches.length === 2) {
            setLastTouchDistance(getTouchDistance(e.touches));
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (e.touches.length === 1 && touchStart) {
            // Pan
            setPan({ x: e.touches[0].clientX - touchStart.x, y: e.touches[0].clientY - touchStart.y });
        } else if (e.touches.length === 2 && lastTouchDistance) {
            // Pinch zoom
            const newDistance = getTouchDistance(e.touches);
            if (newDistance) {
                const scale = newDistance / lastTouchDistance;
                setZoom(prev => Math.min(3, Math.max(0.5, prev * scale)));
                setLastTouchDistance(newDistance);
            }
        }
    };

    const handleTouchEnd = () => {
        setTouchStart(null);
        setLastTouchDistance(null);
    };

    const getMarkerConfig = (type: string) => TYPE_CONFIG[type] || TYPE_CONFIG['default'];

    return (
        <div className="interactive-map" ref={containerRef}>
            <div className="interactive-map__header">
                <h3 className="interactive-map__title">
                    🗺️ {mapName}
                    <span className="interactive-map__count">
                        ({locations.length} {isKorean ? '개 위치' : 'locations'})
                    </span>
                </h3>
                <div className="interactive-map__controls">
                    <button
                        className="map-control-btn"
                        onClick={() => setZoom(prev => Math.min(3, prev + 0.2))}
                        title="Zoom In"
                    >
                        ➕
                    </button>
                    <span className="zoom-level">{Math.round(zoom * 100)}%</span>
                    <button
                        className="map-control-btn"
                        onClick={() => setZoom(prev => Math.max(0.5, prev - 0.2))}
                        title="Zoom Out"
                    >
                        ➖
                    </button>
                    <button
                        className="map-control-btn"
                        onClick={resetView}
                        title="Reset View"
                    >
                        🎯
                    </button>
                    <button
                        className={`map-control-btn ${showLegend ? 'map-control-btn--active' : ''}`}
                        onClick={() => setShowLegend(!showLegend)}
                        title="Toggle Legend"
                    >
                        📋
                    </button>
                    <button
                        className={`map-control-btn ${clusteringEnabled ? 'map-control-btn--active' : ''}`}
                        onClick={() => setClusteringEnabled(!clusteringEnabled)}
                        title={isKorean ? "클러스터링 토글" : "Toggle Clustering"}
                    >
                        🔲
                    </button>
                    <button
                        className={`map-control-btn ${darkMapMode ? 'map-control-btn--active' : ''}`}
                        onClick={() => setDarkMapMode(!darkMapMode)}
                        title={isKorean ? "다크 모드" : "Dark Mode"}
                    >
                        🌙
                    </button>
                </div>
            </div>

            <div
                className="interactive-map__container"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{ cursor: isDragging ? 'grabbing' : 'grab', touchAction: 'none' }}
            >
                <div
                    className="interactive-map__canvas"
                    style={{
                        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                        transformOrigin: 'center center'
                    }}
                >
                    {/* Map Background - Image or Grid Pattern */}
                    <svg
                        className="map-svg"
                        viewBox="0 0 100 100"
                        preserveAspectRatio="xMidYMid meet"
                    >
                        <defs>
                            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.1" opacity="0.5" />
                            </pattern>
                            <radialGradient id="mapGradient" cx="50%" cy="50%" r="70%">
                                <stop offset="0%" stopColor="var(--color-bg-secondary)" />
                                <stop offset="100%" stopColor="var(--color-bg-primary)" />
                            </radialGradient>
                        </defs>

                        {/* Background - Map Image or Fallback */}
                        {mapImageUrl && !imageError ? (
                            <image
                                href={mapImageUrl}
                                x="0"
                                y="0"
                                width="100"
                                height="100"
                                preserveAspectRatio="xMidYMid meet"
                                onLoad={() => setImageLoaded(true)}
                                onError={() => setImageError(true)}
                                style={{
                                    opacity: imageLoaded ? 1 : 0.5,
                                    filter: darkMapMode ? 'brightness(0.5) contrast(1.2)' : 'none'
                                }}
                            />
                        ) : (
                            <rect width="100" height="100" fill="url(#mapGradient)" />
                        )}

                        {/* Grid Overlay */}
                        <rect width="100" height="100" fill="url(#grid)" />

                        {/* Coordinate Labels */}
                        {[0, 25, 50, 75, 100].map(val => (
                            <g key={val}>
                                <text x={val} y="2" fontSize="2" fill="var(--color-text-muted)" textAnchor="middle">{val}</text>
                                <text x="2" y={val} fontSize="2" fill="var(--color-text-muted)" textAnchor="start">{val}</text>
                            </g>
                        ))}

                        {/* Cluster Markers */}
                        {clusteredLocations.clusters.map(cluster => (
                            <g
                                key={cluster.id}
                                className="map-cluster"
                                transform={`translate(${cluster.center.x}, ${cluster.center.y})`}
                                onClick={() => setZoom(prev => Math.min(3, prev + 0.5))}
                                style={{ cursor: 'pointer' }}
                            >
                                <circle r="4" fill="var(--color-accent)" opacity="0.3" />
                                <circle r="3" fill="var(--color-accent)" opacity="0.8" />
                                <text
                                    fontSize="2.5"
                                    fill="white"
                                    textAnchor="middle"
                                    dominantBaseline="central"
                                    fontWeight="bold"
                                >
                                    {cluster.count}
                                </text>
                            </g>
                        ))}

                        {/* Single Location Markers */}
                        {clusteredLocations.singles.map(loc => {
                            if (!loc.coords) return null;
                            const pos = coordToPosition(loc.coords.lat, loc.coords.lon);
                            const config = getMarkerConfig(loc.type);
                            const isHovered = hoveredLocation?.id === loc.id;
                            const difficultyColor = DIFFICULTY_COLORS[loc.difficulty] || '#888';

                            return (
                                <g
                                    key={loc.id}
                                    className={`map-marker ${isHovered ? 'map-marker--hovered' : ''}`}
                                    transform={`translate(${pos.x}, ${pos.y})`}
                                    onClick={() => onLocationClick(loc)}
                                    onMouseEnter={() => handleLocationHover(loc)}
                                    onMouseLeave={() => handleLocationHover(null)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    {/* Pulse animation for hovered */}
                                    {isHovered && (
                                        <circle r="5" fill={config.color} opacity="0.3" className="marker-pulse" />
                                    )}

                                    {/* Marker circle */}
                                    <circle
                                        r={isHovered ? "3" : "2.5"}
                                        fill={config.color}
                                        stroke={difficultyColor}
                                        strokeWidth="0.5"
                                        opacity={isHovered ? 1 : 0.9}
                                    />

                                    {/* Inner dot */}
                                    <circle r="0.8" fill="white" opacity="0.8" />
                                </g>
                            );
                        })}
                    </svg>
                </div>

                {/* Hover Tooltip */}
                {hoveredLocation && hoveredLocation.coords && (
                    <div
                        className="map-tooltip"
                        style={{
                            left: `${(hoveredLocation.coords.lon / MAP_SIZE) * 100}%`,
                            top: `${(hoveredLocation.coords.lat / MAP_SIZE) * 100}%`,
                        }}
                    >
                        <div className="map-tooltip__header">
                            <span className="map-tooltip__icon">{getMarkerConfig(hoveredLocation.type).icon}</span>
                            <span className="map-tooltip__name">{hoveredLocation.name}</span>
                        </div>
                        <div className="map-tooltip__info">
                            <span className="map-tooltip__type">{hoveredLocation.type}</span>
                            <span className={`map-tooltip__difficulty map-tooltip__difficulty--${hoveredLocation.difficulty.toLowerCase()}`}>
                                {hoveredLocation.difficulty}
                            </span>
                        </div>
                        <div className="map-tooltip__coords">
                            📍 {hoveredLocation.coords.lat.toFixed(1)}, {hoveredLocation.coords.lon.toFixed(1)}
                        </div>
                    </div>
                )}
            </div>

            {/* Legend */}
            {showLegend && (
                <div className="map-legend">
                    <div className="map-legend__title">{isKorean ? '범례' : 'Legend'}</div>
                    <div className="map-legend__items">
                        {locationTypes.map(type => {
                            const config = getMarkerConfig(type);
                            const count = locations.filter(l => l.type === type).length;
                            return (
                                <div key={type} className="map-legend__item">
                                    <span
                                        className="map-legend__color"
                                        style={{ backgroundColor: config.color }}
                                    />
                                    <span className="map-legend__label">{config.icon} {type}</span>
                                    <span className="map-legend__count">{count}</span>
                                </div>
                            );
                        })}
                    </div>
                    <div className="map-legend__difficulty">
                        <div className="map-legend__subtitle">{isKorean ? '난이도' : 'Difficulty'}</div>
                        <div className="map-legend__difficulty-items">
                            {Object.entries(DIFFICULTY_COLORS).map(([name, color]) => (
                                <span key={name} className="difficulty-badge" style={{ borderColor: color }}>
                                    {name}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Instructions */}
            <div className="map-instructions">
                <span>🖱️ {isKorean ? '드래그: 이동 | 스크롤: 확대/축소 | 클릭: 상세보기' : 'Drag: Pan | Scroll: Zoom | Click: Details'}</span>
            </div>
        </div>
    );
}
