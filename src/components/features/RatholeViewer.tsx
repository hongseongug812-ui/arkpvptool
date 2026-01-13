import { useState, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useGameVersion } from '../../context/GameVersionContext';
import { dataManager } from '../../services/DataManager';
import type { RatholeLocation, TribeSize } from '../../types';
import './RatholeViewer.css';

const TRIBE_FILTERS: { value: TribeSize | 'all'; label: string; icon: string }[] = [
    { value: 'all', label: '전체', icon: '🌍' },
    { value: 'Solo', label: 'Solo', icon: '👤' },
    { value: 'Small', label: 'Small', icon: '👥' },
    { value: 'Medium', label: 'Medium', icon: '🏠' },
    { value: 'Alpha', label: 'Alpha', icon: '👑' },
];

// Type icons for thumbnails
const TYPE_ICONS: Record<string, string> = {
    'Cave': '🕳️',
    'Underwater': '🌊',
    'Underwater Rathole': '🐚',
    'Rathole': '🐀',
    'Cliff Ledge': '🏔️',
    'Cliff': '⛰️',
    'Ceiling': '🦇',
    'Tree Platform': '🌲',
    'Pillar': '🗼',
    'default': '📍',
};

export function RatholeViewer() {
    const { gameVersion } = useGameVersion();
    const [selectedMapId, setSelectedMapId] = useState<string | null>(null);
    const [selectedLocation, setSelectedLocation] = useState<RatholeLocation | null>(null);
    const [tribeSizeFilter, setTribeSizeFilter] = useState<TribeSize | 'all'>('all');
    const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' });

    const maps = useMemo(() => dataManager.getRatholeMaps(gameVersion), [gameVersion]);
    const effectiveMapId = selectedMapId || maps[0]?.map_id || null;

    const locations = useMemo(() => {
        let locs: RatholeLocation[] = effectiveMapId
            ? dataManager.getRatholesByMapId(effectiveMapId, gameVersion)
            : dataManager.getAllRatholeLocations(gameVersion);
        if (tribeSizeFilter !== 'all') {
            locs = locs.filter((loc) => loc.tribe_size.includes(tribeSizeFilter));
        }
        return locs;
    }, [effectiveMapId, gameVersion, tribeSizeFilter]);

    const showToast = useCallback((message: string) => {
        setToast({ show: true, message });
        setTimeout(() => setToast({ show: false, message: '' }), 2000);
    }, []);

    const handleCopyCoords = async (coords: { lat: number; lon: number }, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(`${coords.lat.toFixed(1)} ${coords.lon.toFixed(1)}`);
            showToast('📋 좌표가 복사되었습니다!');
        } catch (err) {
            console.error('Failed to copy:', err);
            showToast('❌ 복사 실패');
        }
    };

    const getTypeIcon = (type: string) => TYPE_ICONS[type] || TYPE_ICONS['default'];

    return (
        <div className="rathole-viewer">
            <div className="page-header">
                <h2 className="page-title">🗺️ 전략 지도</h2>
                <p className="page-desc">PVP 집터 및 은신처 정보 ({locations.length}개)</p>
            </div>

            {/* Filter Toggle Buttons */}
            <div className="filter-toggle-group">
                <div className="filter-toggle-label">
                    <span>👤</span> 부족 규모
                </div>
                <div className="filter-toggles">
                    {TRIBE_FILTERS.map((f) => (
                        <button
                            key={f.value}
                            className={`filter-toggle ${tribeSizeFilter === f.value ? 'filter-toggle--active' : ''}`}
                            onClick={() => setTribeSizeFilter(f.value)}
                        >
                            <span className="filter-toggle__icon">{f.icon}</span>
                            <span className="filter-toggle__label">{f.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Map Tabs */}
            <div className="map-tabs">
                {maps.map((map) => (
                    <button
                        key={map.map_id}
                        className={`map-tab ${effectiveMapId === map.map_id ? 'map-tab--active' : ''}`}
                        onClick={() => setSelectedMapId(map.map_id)}
                    >
                        <span>{map.map_name}</span>
                        <span className="map-tab__count">{map.locations.length}</span>
                    </button>
                ))}
            </div>

            {/* Location Grid */}
            <div className="location-grid">
                {locations.length === 0 ? (
                    <div className="empty-state">
                        <span>🔍</span>
                        <p>필터 조건에 맞는 위치가 없습니다</p>
                    </div>
                ) : locations.map((loc) => (
                    <div key={loc.id} className="card card--hover location-card" onClick={() => setSelectedLocation(loc)}>
                        {/* Thumbnail */}
                        <div className="location-card__thumbnail">
                            <span className="thumbnail-icon">{getTypeIcon(loc.type)}</span>
                            <span className={`thumbnail-difficulty thumbnail-difficulty--${loc.difficulty.toLowerCase()}`}>
                                {loc.difficulty}
                            </span>
                        </div>

                        {/* Content */}
                        <div className="location-card__content">
                            <div className="location-card__header">
                                <h4>{loc.name}</h4>
                            </div>

                            <div className="location-card__meta">
                                <span className="badge badge--accent">{loc.type}</span>
                                <span className="tribe-size">{loc.tribe_size}</span>
                            </div>

                            {loc.coords && (
                                <div className="coords-row">
                                    <span className="coords-text">📍 {loc.coords.lat.toFixed(1)}, {loc.coords.lon.toFixed(1)}</span>
                                    <button
                                        className="copy-btn"
                                        onClick={(e) => handleCopyCoords(loc.coords!, e)}
                                        title="좌표 복사"
                                    >
                                        📋
                                    </button>
                                </div>
                            )}

                            <p className="description">{loc.description}</p>

                            {(loc.pros?.length || loc.cons?.length) && (
                                <div className="tags">
                                    {loc.pros?.[0] && <span className="tag tag--pro">✓ {loc.pros[0]}</span>}
                                    {loc.cons?.[0] && <span className="tag tag--con">✗ {loc.cons[0]}</span>}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Toast Notification */}
            {toast.show && (
                <div className="toast animate-slide-up">
                    {toast.message}
                </div>
            )}

            {/* Modal - rendered via Portal to bypass parent transform issues */}
            {selectedLocation && createPortal(
                <div className="modal-overlay" onClick={() => setSelectedLocation(null)}>
                    <div className="modal card" onClick={(e) => e.stopPropagation()}>
                        <button className="modal__close" onClick={() => setSelectedLocation(null)}>✕</button>

                        {/* Modal Thumbnail */}
                        <div className="modal__thumbnail">
                            <span className="modal-thumbnail-icon">{getTypeIcon(selectedLocation.type)}</span>
                        </div>

                        <div className="modal__header">
                            <h2>{selectedLocation.name}</h2>
                            <div className="modal__badges">
                                <span className={`badge badge--${selectedLocation.difficulty.toLowerCase()}`}>{selectedLocation.difficulty}</span>
                                <span className="badge badge--accent">{selectedLocation.type}</span>
                                <span className="badge">{selectedLocation.tribe_size}</span>
                            </div>
                        </div>

                        {selectedLocation.coords && (
                            <div className="modal__coords">
                                <span className="coords-value">📍 LAT {selectedLocation.coords.lat.toFixed(1)} / LON {selectedLocation.coords.lon.toFixed(1)}</span>
                                <button
                                    className="btn btn--secondary copy-btn--large"
                                    onClick={(e) => handleCopyCoords(selectedLocation.coords!, e)}
                                >
                                    📋 좌표 복사
                                </button>
                            </div>
                        )}

                        <div className="modal__section">
                            <h4>📝 설명</h4>
                            <p>{selectedLocation.description}</p>
                        </div>

                        <div className="modal__section modal__strategy">
                            <h4>⚔️ 전술 조언</h4>
                            <p>{selectedLocation.strategy_note}</p>
                        </div>

                        {(selectedLocation.pros?.length || selectedLocation.cons?.length) && (
                            <div className="modal__pros-cons">
                                {selectedLocation.pros?.length > 0 && (
                                    <div className="pros">
                                        <h4>✓ 장점</h4>
                                        <ul>{selectedLocation.pros.map((p, i) => <li key={i}>{p}</li>)}</ul>
                                    </div>
                                )}
                                {selectedLocation.cons?.length > 0 && (
                                    <div className="cons">
                                        <h4>✗ 단점</h4>
                                        <ul>{selectedLocation.cons.map((c, i) => <li key={i}>{c}</li>)}</ul>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
