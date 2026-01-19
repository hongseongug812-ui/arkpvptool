import { RatholeViewer } from './RatholeViewer';
import './MapViewer.css';

export function MapViewer() {
    return (
        <div className="map-viewer">
            <div className="map-content">
                <RatholeViewer />
            </div>
        </div>
    );
}
