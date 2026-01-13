import { useGameVersion } from '../../context/GameVersionContext';
import './Header.css';

interface HeaderProps {
    onLogoClick?: () => void;
}

export function Header({ onLogoClick }: HeaderProps) {
    const { gameVersion, setGameVersion } = useGameVersion();

    return (
        <header className="header">
            <div className="header__brand" onClick={onLogoClick} style={{ cursor: onLogoClick ? 'pointer' : 'default' }}>
                <div className="header__logo">
                    <div className="logo-implant">
                        <span className="implant-core">💠</span>
                        <div className="implant-ring"></div>
                    </div>
                </div>
                <div className="header__title">
                    <h1>ARK TACTICS</h1>
                    <span className="header__subtitle">PVP UTILITY</span>
                </div>
            </div>

            {/* Custom ARK Toggle Switch */}
            <div className="ark-toggle">
                <button
                    className={`ark-toggle__option ark-toggle__option--asa ${gameVersion === 'ASA' ? 'ark-toggle__option--active' : ''}`}
                    onClick={() => setGameVersion('ASA')}
                >
                    <span className="ark-toggle__glow"></span>
                    <span className="ark-toggle__text">ASA</span>
                    {gameVersion === 'ASA' && <span className="ark-toggle__neon"></span>}
                </button>
                <div className="ark-toggle__divider">
                    <span className="divider-diamond">◆</span>
                </div>
                <button
                    className={`ark-toggle__option ark-toggle__option--ase ${gameVersion === 'ASE' ? 'ark-toggle__option--active' : ''}`}
                    onClick={() => setGameVersion('ASE')}
                >
                    <span className="ark-toggle__glow"></span>
                    <span className="ark-toggle__text">ASE</span>
                    {gameVersion === 'ASE' && <span className="ark-toggle__flame"></span>}
                </button>
            </div>
        </header>
    );
}
