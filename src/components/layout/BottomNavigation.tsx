import './BottomNavigation.css';

interface BottomNavigationProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

const TABS = [
    { id: 'combat', label: 'Combat', icon: '⚔️' },
    { id: 'dino', label: 'Dino', icon: '🦖' },
    { id: 'food', label: 'Food', icon: '🍳' },
    { id: 'map', label: 'Map', icon: '🗺️' },
    { id: 'ini', label: 'INI', icon: '📝' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
];

export function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
    return (
        <nav className="bottom-nav">
            {TABS.map((tab) => (
                <button
                    key={tab.id}
                    className={`bottom-nav__item ${activeTab === tab.id ? 'bottom-nav__item--active' : ''}`}
                    onClick={() => onTabChange(tab.id)}
                >
                    <span className="bottom-nav__icon">{tab.icon}</span>
                    <span className="bottom-nav__label">{tab.label}</span>
                </button>
            ))}
        </nav>
    );
}
