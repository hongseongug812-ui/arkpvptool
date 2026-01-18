import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ResourceMap } from './ResourceMap';
import { RatholeViewer } from './RatholeViewer';
import './MapViewer.css';

type MapMode = 'resource' | 'rathole';

export function MapViewer() {
    const { i18n } = useTranslation();
    const isKorean = i18n.language === 'ko';
    const [mode, setMode] = useState<MapMode>('rathole');

    return (
        <div className="map-viewer">
            {/* Mode Toggle */}
            <div className="map-mode-toggle">
                <button
                    className={`map-mode-btn ${mode === 'rathole' ? 'active' : ''}`}
                    onClick={() => setMode('rathole')}
                >
                    🐀 {isKorean ? '집터' : 'Ratholes'}
                </button>
                <button
                    className={`map-mode-btn ${mode === 'resource' ? 'active' : ''}`}
                    onClick={() => setMode('resource')}
                >
                    ⛏️ {isKorean ? '자원' : 'Resources'}
                </button>
            </div>

            {/* Content */}
            <div className="map-content">
                {mode === 'rathole' && <RatholeViewer />}
                {mode === 'resource' && <ResourceMap />}
            </div>
        </div>
    );
}
