import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GameVersionProvider } from './context/GameVersionContext';
import { ServerSettingsProvider } from './context/ServerSettingsContext';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <ServerSettingsProvider>
            <GameVersionProvider>
                <App />
            </GameVersionProvider>
        </ServerSettingsProvider>
    </StrictMode>
);
