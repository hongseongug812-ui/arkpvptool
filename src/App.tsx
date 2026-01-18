import { useState, useEffect, useCallback } from 'react';
import { SplashScreen } from './components/layout/SplashScreen';
import { Header } from './components/layout/Header';
import { BottomNavigation } from './components/layout/BottomNavigation';
import { PWAInstallPrompt } from './components/layout/PWAInstallPrompt';
import { CombatCalculator } from './components/features/CombatCalculator';
import { DinoEncyclopedia } from './components/features/DinoEncyclopedia';
import { FoodCalculator } from './components/features/FoodCalculator';
import { MapViewer } from './components/features/MapViewer';
import { IniGenerator } from './components/features/IniGenerator';
import { Settings } from './components/features/Settings';
import { dataManager } from './services/DataManager';
import './App.css';

export type TabId = 'combat' | 'dino' | 'food' | 'map' | 'ini' | 'settings';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<TabId>('combat');
  const [prevTab, setPrevTab] = useState<TabId>('combat');
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Loading function - can be called again
  const runLoadingSequence = useCallback(async () => {
    setIsLoading(true);
    setLoadProgress(0);

    for (let i = 0; i <= 100; i += 20) {
      setLoadProgress(i);
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    const raidData = dataManager.getStructures();
    const soakerData = dataManager.getDinos();
    const dinoStats = dataManager.getAllDinoStats();

    console.log('📦 Data loaded:', {
      structures: raidData.length,
      dinos: soakerData.length,
      dinoStats: dinoStats.length,
    });

    setLoadProgress(100);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setIsLoading(false);
  }, []);

  // Initial load
  useEffect(() => {
    runLoadingSequence();
  }, [runLoadingSequence]);

  // Handle logo click - show splash again
  const handleLogoClick = () => {
    runLoadingSequence();
  };

  // Tab change with transition
  const handleTabChange = (newTab: string) => {
    if (newTab === activeTab || isTransitioning) return;

    setIsTransitioning(true);
    setPrevTab(activeTab);

    setTimeout(() => {
      setActiveTab(newTab as TabId);
      setTimeout(() => setIsTransitioning(false), 300);
    }, 150);
  };

  // Get slide direction
  const getSlideDirection = () => {
    const tabs: TabId[] = ['combat', 'dino', 'food', 'map', 'ini', 'settings'];
    const prevIndex = tabs.indexOf(prevTab);
    const currIndex = tabs.indexOf(activeTab);
    return currIndex > prevIndex ? 'slide-left' : 'slide-right';
  };

  const renderTabContent = () => (
    <div className={`tab-content ${isTransitioning ? 'transitioning' : ''}`}>
      <div className={`tab-panel ${activeTab === 'combat' ? `tab-panel--active ${getSlideDirection()}` : ''}`}>
        {activeTab === 'combat' && <CombatCalculator />}
      </div>
      <div className={`tab-panel ${activeTab === 'dino' ? `tab-panel--active ${getSlideDirection()}` : ''}`}>
        {activeTab === 'dino' && <DinoEncyclopedia />}
      </div>
      <div className={`tab-panel ${activeTab === 'food' ? `tab-panel--active ${getSlideDirection()}` : ''}`}>
        {activeTab === 'food' && <FoodCalculator />}
      </div>
      <div className={`tab-panel ${activeTab === 'map' ? `tab-panel--active ${getSlideDirection()}` : ''}`}>
        {activeTab === 'map' && <MapViewer />}
      </div>
      <div className={`tab-panel ${activeTab === 'ini' ? `tab-panel--active ${getSlideDirection()}` : ''}`}>
        {activeTab === 'ini' && <IniGenerator />}
      </div>
      <div className={`tab-panel ${activeTab === 'settings' ? `tab-panel--active ${getSlideDirection()}` : ''}`}>
        {activeTab === 'settings' && <Settings />}
      </div>
    </div>
  );

  if (isLoading) {
    return <SplashScreen progress={loadProgress} />;
  }

  return (
    <div className="app">
      <Header onLogoClick={handleLogoClick} />
      <main className="app__content">
        <div className="container">
          {renderTabContent()}
        </div>
      </main>
      <BottomNavigation activeTab={activeTab} onTabChange={handleTabChange} />
      <PWAInstallPrompt />
    </div>
  );
}

export default App;
