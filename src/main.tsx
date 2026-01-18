import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from './context/ThemeContext';
import { GameVersionProvider } from './context/GameVersionContext';
import { ServerSettingsProvider } from './context/ServerSettingsContext';
import { ErrorBoundary } from './components/layout/ErrorBoundary';
// Initialize Amplify configuration
import './lib/cognitoConfig';
import App from './App';
import './i18n';  // Initialize i18n
import './index.css';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <ErrorBoundary>
            <ThemeProvider>
                <ServerSettingsProvider>
                    <GameVersionProvider>
                        <App />
                    </GameVersionProvider>
                </ServerSettingsProvider>
            </ThemeProvider>
        </ErrorBoundary>
    </StrictMode>
);
