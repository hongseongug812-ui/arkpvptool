import type { TabId } from '../../App';
import './TabNavigation.css';

interface TabNavigationProps {
    activeTab: TabId;
    onTabChange: (tab: TabId) => void;
}

const tabs: { id: TabId; label: string; icon: string }[] = [
    { id: 'raid', label: 'Raid Calculator', icon: '💣' },
    { id: 'soaking', label: 'Soaking Sim', icon: '🦖' },
    { id: 'rathole', label: 'Rathole DB', icon: '🗺️' },
];

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
    return (
        <nav className="tab-nav">
            <div className="tabs">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        className={`tab ${activeTab === tab.id ? 'tab--active' : ''}`}
                        onClick={() => onTabChange(tab.id)}
                    >
                        <span className="tab__icon">{tab.icon}</span>
                        <span className="tab__label">{tab.label}</span>
                    </button>
                ))}
            </div>
        </nav>
    );
}
