import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameVersion } from '../../context/GameVersionContext';
import { changeLanguage } from '../../i18n';
import './Header.css';

interface HeaderProps {
    onLogoClick?: () => void;
}

export function Header({ onLogoClick }: HeaderProps) {
    const { t, i18n } = useTranslation();
    const { gameVersion, setGameVersion } = useGameVersion();
    const [showLangMenu, setShowLangMenu] = useState(false);

    const currentLang = i18n.language;

    const handleLangChange = (lang: string) => {
        changeLanguage(lang);
        setShowLangMenu(false);
    };

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
                    <h1>{t('header.title')}</h1>
                    <span className="header__subtitle">{t('header.subtitle')}</span>
                </div>
            </div>

            <div className="header__controls">
                {/* Language Selector */}
                <div className="lang-selector">
                    <button
                        className="lang-btn"
                        onClick={() => setShowLangMenu(!showLangMenu)}
                        title="Language"
                    >
                        {currentLang === 'ko' ? '🇰🇷' : '🇺🇸'}
                    </button>
                    {showLangMenu && (
                        <div className="lang-menu">
                            <button
                                className={`lang-option ${currentLang === 'ko' ? 'lang-option--active' : ''}`}
                                onClick={() => handleLangChange('ko')}
                            >
                                🇰🇷 한국어
                            </button>
                            <button
                                className={`lang-option ${currentLang === 'en' ? 'lang-option--active' : ''}`}
                                onClick={() => handleLangChange('en')}
                            >
                                🇺🇸 English
                            </button>
                        </div>
                    )}
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
            </div>
        </header>
    );
}
