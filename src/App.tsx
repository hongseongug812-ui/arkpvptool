import { useState, useEffect, useCallback } from 'react';
import { SplashScreen } from './components/layout/SplashScreen';
import { Header } from './components/layout/Header';
import { BottomNavigation } from './components/layout/BottomNavigation';
import { RaidCalculator } from './components/features/RaidCalculator';
import { RatholeViewer } from './components/features/RatholeViewer';
import { SoakingSimulator } from './components/features/SoakingSimulator';
import { StatEvaluator } from './components/features/StatEvaluator';
import { dataManager } from './services/DataManager';
import './App.css';

type TabId = 'raid' | 'soak' | 'stat' | 'map';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<TabId>('raid');
  const [prevTab, setPrevTab] = useState<TabId>('raid');
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
    const tabs: TabId[] = ['raid', 'soak', 'stat', 'map'];
    const prevIndex = tabs.indexOf(prevTab);
    const currIndex = tabs.indexOf(activeTab);
    return currIndex > prevIndex ? 'slide-left' : 'slide-right';
  };

  const renderTabContent = () => (
    <div className={`tab-content ${isTransitioning ? 'transitioning' : ''}`}>
      <div className={`tab-panel ${activeTab === 'raid' ? `tab-panel--active ${getSlideDirection()}` : ''}`}>
        {activeTab === 'raid' && <RaidCalculator />}
      </div>
      <div className={`tab-panel ${activeTab === 'soak' ? `tab-panel--active ${getSlideDirection()}` : ''}`}>
        {activeTab === 'soak' && <SoakingSimulator />}
      </div>
      <div className={`tab-panel ${activeTab === 'stat' ? `tab-panel--active ${getSlideDirection()}` : ''}`}>
        {activeTab === 'stat' && <StatEvaluator />}
      </div>
      <div className={`tab-panel ${activeTab === 'map' ? `tab-panel--active ${getSlideDirection()}` : ''}`}>
        {activeTab === 'map' && <RatholeViewer />}
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
    </div>
  );
}

export default App;
