import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import './HatchingTimer.css';

// Hatching times in seconds (based on 1x server rate)
const HATCHING_TIMES: Record<string, { name: string; nameKr: string; time: number }> = {
    rex: { name: 'Rex', nameKr: '티라노', time: 4 * 60 * 60 }, // 4h
    giga: { name: 'Giganotosaurus', nameKr: '기가노토', time: 2 * 24 * 60 * 60 }, // 2d
    wyvern: { name: 'Wyvern', nameKr: '와이번', time: 4 * 60 * 60 + 59 * 60 }, // ~5h
    rock_drake: { name: 'Rock Drake', nameKr: '록 드레이크', time: 3 * 24 * 60 * 60 }, // 3d
    deinonychus: { name: 'Deinonychus', nameKr: '데이노니쿠스', time: 2 * 60 * 60 }, // 2h
    magmasaur: { name: 'Magmasaur', nameKr: '마그마사우르', time: 5 * 60 * 60 }, // 5h
    shadowmane: { name: 'Shadowmane', nameKr: '쉐도우메인', time: 7 * 60 * 60 }, // 7h
    small: { name: 'Small Dino', nameKr: '소형 공룡', time: 1 * 60 * 60 }, // 1h
    medium: { name: 'Medium Dino', nameKr: '중형 공룡', time: 2 * 60 * 60 }, // 2h
    large: { name: 'Large Dino', nameKr: '대형 공룡', time: 5 * 60 * 60 }, // 5h
};

interface HatchingEgg {
    id: string;
    dinoType: string;
    startTime: number;
    endTime: number;
    nickname: string;
}

const HATCHING_KEY = 'ark-pvp-hatching-eggs';

interface HatchingTimerProps {
    onClose: () => void;
}

export function HatchingTimer({ onClose }: HatchingTimerProps) {
    const { i18n } = useTranslation();
    const isKorean = i18n.language === 'ko';
    const [eggs, setEggs] = useState<HatchingEgg[]>([]);
    const [selectedDino, setSelectedDino] = useState('rex');
    const [serverRate, setServerRate] = useState(1);
    const [nickname, setNickname] = useState('');
    const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
    const intervalRef = useRef<number | null>(null);
    const [, forceUpdate] = useState(0);

    // Load eggs from localStorage
    useEffect(() => {
        const saved = localStorage.getItem(HATCHING_KEY);
        if (saved) {
            try {
                setEggs(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse eggs:', e);
            }
        }

        // Check notification permission
        if ('Notification' in window) {
            setNotificationPermission(Notification.permission);
        }
    }, []);

    // Save eggs to localStorage
    useEffect(() => {
        localStorage.setItem(HATCHING_KEY, JSON.stringify(eggs));
    }, [eggs]);

    // Timer update interval
    useEffect(() => {
        intervalRef.current = window.setInterval(() => {
            forceUpdate(n => n + 1);

            // Check for completed eggs and send notifications
            eggs.forEach(egg => {
                const remaining = egg.endTime - Date.now();
                if (remaining <= 0 && remaining > -1000) {
                    sendNotification(egg);
                }
            });
        }, 1000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [eggs]);

    const requestNotificationPermission = async () => {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            setNotificationPermission(permission);
        }
    };

    const sendNotification = useCallback((egg: HatchingEgg) => {
        if (notificationPermission === 'granted') {
            const dinoInfo = HATCHING_TIMES[egg.dinoType];
            new Notification('🥚 알 부화 완료!', {
                body: `${egg.nickname || (isKorean ? dinoInfo.nameKr : dinoInfo.name)} 알이 부화했습니다!`,
                icon: '/icons/icon-192.png',
                tag: egg.id,
            });
        }
    }, [notificationPermission, isKorean]);

    const addEgg = () => {
        const dinoInfo = HATCHING_TIMES[selectedDino];
        const hatchTime = dinoInfo.time / serverRate;
        const now = Date.now();

        const newEgg: HatchingEgg = {
            id: `egg-${now}`,
            dinoType: selectedDino,
            startTime: now,
            endTime: now + hatchTime * 1000,
            nickname: nickname || (isKorean ? dinoInfo.nameKr : dinoInfo.name),
        };

        setEggs([...eggs, newEgg]);
        setNickname('');
    };

    const removeEgg = (id: string) => {
        setEggs(eggs.filter(e => e.id !== id));
    };

    const formatTime = (ms: number) => {
        if (ms <= 0) return isKorean ? '완료!' : 'Done!';

        const hours = Math.floor(ms / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((ms % (1000 * 60)) / 1000);

        if (hours > 0) {
            return `${hours}h ${minutes}m ${seconds}s`;
        }
        return `${minutes}m ${seconds}s`;
    };

    const getProgress = (egg: HatchingEgg) => {
        const total = egg.endTime - egg.startTime;
        const elapsed = Date.now() - egg.startTime;
        return Math.min(100, (elapsed / total) * 100);
    };

    return (
        <div className="hatching-overlay" onClick={onClose}>
            <div className="hatching-timer" onClick={(e) => e.stopPropagation()}>
                <div className="hatching-timer__header">
                    <h2>🥚 {isKorean ? '알 부화 타이머' : 'Egg Hatching Timer'}</h2>
                    <button className="hatching-timer__close" onClick={onClose}>✕</button>
                </div>

                <div className="hatching-timer__content">
                    {/* Notification Permission */}
                    {notificationPermission !== 'granted' && (
                        <div className="notification-banner">
                            <span>🔔 {isKorean ? '알림을 받으려면 권한을 허용하세요' : 'Enable notifications for alerts'}</span>
                            <button className="btn btn--sm btn--primary" onClick={requestNotificationPermission}>
                                {isKorean ? '허용' : 'Enable'}
                            </button>
                        </div>
                    )}

                    {/* Add Egg Form */}
                    <div className="add-egg-form">
                        <div className="form-row">
                            <select
                                className="input select"
                                value={selectedDino}
                                onChange={(e) => setSelectedDino(e.target.value)}
                            >
                                {Object.entries(HATCHING_TIMES).map(([key, info]) => (
                                    <option key={key} value={key}>
                                        {isKorean ? info.nameKr : info.name}
                                    </option>
                                ))}
                            </select>
                            <input
                                type="text"
                                className="input"
                                placeholder={isKorean ? '별명 (선택)' : 'Nickname (optional)'}
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                            />
                        </div>
                        <div className="form-row">
                            <div className="server-rate">
                                <label>{isKorean ? '서버 배율' : 'Server Rate'}</label>
                                <input
                                    type="number"
                                    className="input"
                                    value={serverRate}
                                    min={1}
                                    max={100}
                                    onChange={(e) => setServerRate(Math.max(1, parseInt(e.target.value) || 1))}
                                />
                                <span>x</span>
                            </div>
                            <button className="btn btn--primary" onClick={addEgg}>
                                ➕ {isKorean ? '알 추가' : 'Add Egg'}
                            </button>
                        </div>
                    </div>

                    {/* Active Eggs */}
                    <div className="eggs-list">
                        <h3>🐣 {isKorean ? '부화 중인 알' : 'Incubating Eggs'} ({eggs.length})</h3>

                        {eggs.length === 0 ? (
                            <div className="eggs-empty">
                                {isKorean ? '부화 중인 알이 없습니다' : 'No eggs incubating'}
                            </div>
                        ) : (
                            eggs.map(egg => {
                                const remaining = egg.endTime - Date.now();
                                const isDone = remaining <= 0;
                                const progress = getProgress(egg);

                                return (
                                    <div key={egg.id} className={`egg-card ${isDone ? 'egg-card--done' : ''}`}>
                                        <div className="egg-card__info">
                                            <span className="egg-card__name">{egg.nickname}</span>
                                            <span className="egg-card__type">
                                                {isKorean ? HATCHING_TIMES[egg.dinoType].nameKr : HATCHING_TIMES[egg.dinoType].name}
                                            </span>
                                        </div>
                                        <div className="egg-card__progress">
                                            <div className="progress-bar">
                                                <div
                                                    className="progress-bar__fill"
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>
                                            <span className={`egg-card__time ${isDone ? 'done' : ''}`}>
                                                {formatTime(remaining)}
                                            </span>
                                        </div>
                                        <button className="egg-card__remove" onClick={() => removeEgg(egg.id)}>
                                            ✕
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
