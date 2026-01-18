import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RaidCalculator } from './RaidCalculator';
import { SoakingSimulator } from './SoakingSimulator';
import './CombatCalculator.css';

type CombatMode = 'raid' | 'soak';

export function CombatCalculator() {
    const { i18n } = useTranslation();
    const isKorean = i18n.language === 'ko';
    const [mode, setMode] = useState<CombatMode>('raid');

    return (
        <div className="combat-calc">
            {/* Mode Toggle */}
            <div className="combat-mode-toggle">
                <button
                    className={`combat-mode-btn ${mode === 'raid' ? 'active' : ''}`}
                    onClick={() => setMode('raid')}
                >
                    💣 {isKorean ? '레이드' : 'Raid'}
                </button>
                <button
                    className={`combat-mode-btn ${mode === 'soak' ? 'active' : ''}`}
                    onClick={() => setMode('soak')}
                >
                    🛡️ {isKorean ? '소킹' : 'Soaking'}
                </button>
            </div>

            {/* Content */}
            <div className="combat-content">
                {mode === 'raid' && <RaidCalculator />}
                {mode === 'soak' && <SoakingSimulator />}
            </div>
        </div>
    );
}
