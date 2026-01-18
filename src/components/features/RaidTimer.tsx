import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import './RaidTimer.css';

// Damage values for raid items
const RAID_ITEMS = {
    c4: { damage: 12250, name: 'C4', icon: '💣', cooldown: 0 },
    rocket: { damage: 1821, name: 'Rocket', icon: '🚀', cooldown: 3 },
    tek_grenade: { damage: 475, name: 'Tek Grenade', icon: '💎', cooldown: 0 },
    arthropleura: { damage: 250, name: 'Arthro Spit', icon: '🐛', cooldown: 2 },
};

// Structure presets (HP values at base level)
const STRUCTURE_PRESETS = {
    metal_wall: { hp: 10000, name: { kr: '메탈 벽', en: 'Metal Wall' } },
    metal_door: { hp: 6250, name: { kr: '메탈 문', en: 'Metal Door' } },
    metal_gateway: { hp: 25000, name: { kr: '메탈 게이트', en: 'Metal Gateway' } },
    tek_wall: { hp: 10000, name: { kr: '텍 벽', en: 'Tek Wall' } },
    tek_forcefield: { hp: 150000, name: { kr: '텍 포스필드', en: 'Tek Forcefield' } },
    vault: { hp: 50000, name: { kr: '볼트', en: 'Vault' } },
    turret: { hp: 2250, name: { kr: '터렛', en: 'Turret' } },
    tek_turret: { hp: 3000, name: { kr: '텍 터렛', en: 'Tek Turret' } },
    heavy_turret: { hp: 3000, name: { kr: '헤비 터렛', en: 'Heavy Turret' } },
};

interface RaidTimerProps {
    onClose: () => void;
}

export function RaidTimer({ onClose }: RaidTimerProps) {
    const { i18n } = useTranslation();
    const isKorean = i18n.language === 'ko';

    const [targetHP, setTargetHP] = useState(10000);
    const [selectedItem, setSelectedItem] = useState<keyof typeof RAID_ITEMS>('c4');
    const [countdown, setCountdown] = useState<number | null>(null);
    const [isRunning, setIsRunning] = useState(false);
    const intervalRef = useRef<number | null>(null);

    // Calculate items needed
    const itemsNeeded = Math.ceil(targetHP / RAID_ITEMS[selectedItem].damage);
    const totalTime = itemsNeeded * RAID_ITEMS[selectedItem].cooldown;

    // Timer functions
    const startTimer = useCallback(() => {
        if (totalTime <= 0) return;
        setCountdown(totalTime);
        setIsRunning(true);
    }, [totalTime]);

    const stopTimer = useCallback(() => {
        setIsRunning(false);
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    const resetTimer = useCallback(() => {
        stopTimer();
        setCountdown(null);
    }, [stopTimer]);

    // Timer effect
    useEffect(() => {
        if (isRunning && countdown !== null && countdown > 0) {
            intervalRef.current = window.setInterval(() => {
                setCountdown(prev => {
                    if (prev !== null && prev > 0) {
                        return prev - 1;
                    }
                    return 0;
                });
            }, 1000);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isRunning]);

    // Stop when countdown reaches 0
    useEffect(() => {
        if (countdown === 0) {
            stopTimer();
        }
    }, [countdown, stopTimer]);

    // Format time
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="raid-overlay" onClick={onClose}>
            <div className="raid-timer" onClick={(e) => e.stopPropagation()}>
                <div className="raid-timer__header">
                    <h2>⏱️ {isKorean ? '레이드 타이머' : 'Raid Timer'}</h2>
                    <button className="raid-timer__close" onClick={onClose}>✕</button>
                </div>

                <div className="raid-timer__content">
                    {/* Structure Presets */}
                    <div className="raid-section">
                        <h3>🏛️ {isKorean ? '건물 프리셋' : 'Structure Presets'}</h3>
                        <div className="preset-grid">
                            {Object.entries(STRUCTURE_PRESETS).map(([key, preset]) => (
                                <button
                                    key={key}
                                    className={`preset-btn ${targetHP === preset.hp ? 'preset-btn--active' : ''}`}
                                    onClick={() => setTargetHP(preset.hp)}
                                >
                                    <span className="preset-name">{isKorean ? preset.name.kr : preset.name.en}</span>
                                    <span className="preset-hp">{preset.hp.toLocaleString()} HP</span>
                                </button>
                            ))}
                        </div>
                        <div className="custom-hp">
                            <label>{isKorean ? '커스텀 HP' : 'Custom HP'}</label>
                            <input
                                type="number"
                                className="input"
                                value={targetHP}
                                onChange={(e) => setTargetHP(parseInt(e.target.value) || 0)}
                            />
                        </div>
                    </div>

                    {/* Raid Items */}
                    <div className="raid-section">
                        <h3>💥 {isKorean ? '공격 수단' : 'Attack Method'}</h3>
                        <div className="item-grid">
                            {Object.entries(RAID_ITEMS).map(([key, item]) => (
                                <button
                                    key={key}
                                    className={`item-btn ${selectedItem === key ? 'item-btn--active' : ''}`}
                                    onClick={() => setSelectedItem(key as keyof typeof RAID_ITEMS)}
                                >
                                    <span className="item-icon">{item.icon}</span>
                                    <span className="item-name">{item.name}</span>
                                    <span className="item-damage">{item.damage.toLocaleString()} DMG</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Calculation Results */}
                    <div className="raid-result">
                        <div className="result-main">
                            <span className="result-icon">{RAID_ITEMS[selectedItem].icon}</span>
                            <span className="result-count">{itemsNeeded}</span>
                            <span className="result-label">{isKorean ? '개 필요' : 'needed'}</span>
                        </div>
                        <div className="result-details">
                            <div className="detail-item">
                                <span>{isKorean ? '타겟 HP' : 'Target HP'}</span>
                                <span>{targetHP.toLocaleString()}</span>
                            </div>
                            <div className="detail-item">
                                <span>{isKorean ? '개당 데미지' : 'Damage/item'}</span>
                                <span>{RAID_ITEMS[selectedItem].damage.toLocaleString()}</span>
                            </div>
                            {RAID_ITEMS[selectedItem].cooldown > 0 && (
                                <div className="detail-item">
                                    <span>{isKorean ? '예상 시간' : 'Est. Time'}</span>
                                    <span>{formatTime(totalTime)}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Countdown Timer */}
                    {RAID_ITEMS[selectedItem].cooldown > 0 && (
                        <div className="raid-countdown">
                            <div className="countdown-display">
                                {countdown !== null ? formatTime(countdown) : formatTime(totalTime)}
                            </div>
                            <div className="countdown-controls">
                                {!isRunning ? (
                                    <button className="btn btn--primary" onClick={startTimer}>
                                        ▶️ {isKorean ? '시작' : 'Start'}
                                    </button>
                                ) : (
                                    <button className="btn btn--warning" onClick={stopTimer}>
                                        ⏸️ {isKorean ? '정지' : 'Pause'}
                                    </button>
                                )}
                                <button className="btn btn--secondary" onClick={resetTimer}>
                                    🔄 {isKorean ? '리셋' : 'Reset'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
