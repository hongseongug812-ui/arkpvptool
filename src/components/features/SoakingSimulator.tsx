import { useState, useMemo } from 'react';
import { dataManager } from '../../services/DataManager';
import type { Dino } from '../../types';
import './SoakingSimulator.css';

const VEGGIE_CAKE_HEAL_PERCENT = 0.10;
const VEGGIE_CAKE_COOLDOWN = 30;

// Turret definitions with damage values
const TURRET_TYPES = [
    { id: 'auto', name: '자동 포탑', damagePerShot: 70, rateOfFire: 2.85, multiplierVsDino: 4.0, color: '#00E5FF' },
    { id: 'heavy', name: '헤비 포탑', damagePerShot: 300, rateOfFire: 2.5, multiplierVsDino: 1.0, color: '#9B59B6' },
    { id: 'tek', name: '테크 포탑', damagePerShot: 150, rateOfFire: 2.5, multiplierVsDino: 1.5, color: '#FFD700' },
];

// Buff definitions
const BUFFS = [
    { id: 'mate_boost', name: '메이트 부스트 (Mate Boost)', reduction: 0.33, icon: '💕' },
    { id: 'yuty_courage', name: '유티 용기 버프 (Yuty Courage)', reduction: 0.20, icon: '🦖' },
];

interface TurretCounts {
    auto: number;
    heavy: number;
    tek: number;
}

interface TurretDamageBreakdown {
    id: string;
    name: string;
    dps: number;
    percentage: number;
    color: string;
}

export function SoakingSimulator() {
    const dinos = dataManager.getDinos();

    const [selectedDino, setSelectedDino] = useState<Dino | null>(dinos[0] || null);
    const [currentHP, setCurrentHP] = useState(10000);
    const [saddleArmor, setSaddleArmor] = useState(25);
    const [selectedAbility, setSelectedAbility] = useState<string | undefined>(dinos[0]?.special_abilities[0]?.mode_id);

    // Multi-turret counts
    const [turretCounts, setTurretCounts] = useState<TurretCounts>({
        auto: 10,
        heavy: 5,
        tek: 0,
    });

    // Active buffs
    const [activeBuffs, setActiveBuffs] = useState<Record<string, boolean>>({
        mate_boost: false,
        yuty_courage: false,
    });

    const result = useMemo(() => {
        if (!selectedDino) return null;

        // 1. Saddle multiplier
        const saddleMultiplier = selectedDino.can_equip_saddle ? 100 / (100 + 4 * saddleArmor) : 1;

        // 2. Special ability reduction
        const ability = selectedDino.special_abilities.find((a) => a.mode_id === selectedAbility);
        const abilityReduction = ability ? ability.reduction_percent / 100 : 0;

        // 3. Buff reduction (multiplicative)
        let buffMultiplier = 1;
        BUFFS.forEach((buff) => {
            if (activeBuffs[buff.id]) {
                buffMultiplier *= (1 - buff.reduction);
            }
        });

        // 4. Calculate DPS per turret type
        const turretBreakdown: TurretDamageBreakdown[] = [];
        let totalDPS = 0;

        TURRET_TYPES.forEach((turret) => {
            const count = turretCounts[turret.id as keyof TurretCounts];
            if (count > 0) {
                const baseDamage = turret.damagePerShot * turret.multiplierVsDino;
                const finalDamage = baseDamage * saddleMultiplier * (1 - abilityReduction) * buffMultiplier;
                const dps = finalDamage * turret.rateOfFire * count;

                turretBreakdown.push({
                    id: turret.id,
                    name: turret.name,
                    dps,
                    percentage: 0, // Will calculate after total
                    color: turret.color,
                });
                totalDPS += dps;
            }
        });

        // Calculate percentages
        turretBreakdown.forEach((t) => {
            t.percentage = totalDPS > 0 ? (t.dps / totalDPS) * 100 : 0;
        });

        // 5. Survival calculations
        const survivalTime = totalDPS > 0 ? currentHP / totalDPS : Infinity;
        const healPerCake = currentHP * VEGGIE_CAKE_HEAL_PERCENT;
        const cakesCanEat = Math.floor(survivalTime / VEGGIE_CAKE_COOLDOWN);
        const totalHealFromCakes = cakesCanEat * healPerCake;
        const survivalTimeWithCakes = totalDPS > 0 ? (currentHP + totalHealFromCakes) / totalDPS : Infinity;

        // 6. Total reduction calculation
        const totalReduction = 1 - (saddleMultiplier * (1 - abilityReduction) * buffMultiplier);

        return {
            saddleReduction: Math.round((1 - saddleMultiplier) * 100),
            abilityReduction: Math.round(abilityReduction * 100),
            buffReduction: Math.round((1 - buffMultiplier) * 100),
            totalReduction: Math.round(totalReduction * 100),
            totalDPS: Math.round(totalDPS),
            survivalTime,
            survivalTimeWithCakes,
            cakesCanEat,
            turretBreakdown,
        };
    }, [selectedDino, currentHP, saddleArmor, selectedAbility, turretCounts, activeBuffs]);

    const handleDinoChange = (dinoId: string) => {
        const dino = dinos.find((d) => d.id === dinoId);
        setSelectedDino(dino || null);
        setSelectedAbility(dino?.special_abilities[0]?.mode_id);
        if (dino) setCurrentHP(dino.base_hp * 10);
    };

    const handleTurretChange = (turretId: keyof TurretCounts, value: number) => {
        setTurretCounts((prev) => ({ ...prev, [turretId]: Math.max(0, value) }));
    };

    const handleBuffToggle = (buffId: string) => {
        setActiveBuffs((prev) => ({ ...prev, [buffId]: !prev[buffId] }));
    };

    const formatTime = (seconds: number) => {
        if (!isFinite(seconds)) return '∞';
        if (seconds < 60) return `${seconds.toFixed(1)}초`;
        const mins = Math.floor(seconds / 60);
        const secs = Math.round(seconds % 60);
        return `${mins}분 ${secs}초`;
    };

    // Generate pie chart conic gradient
    const getPieChartGradient = () => {
        if (!result || result.turretBreakdown.length === 0) return 'transparent';

        let currentAngle = 0;
        const segments: string[] = [];

        result.turretBreakdown.forEach((t) => {
            const endAngle = currentAngle + (t.percentage * 3.6); // 360 / 100
            segments.push(`${t.color} ${currentAngle}deg ${endAngle}deg`);
            currentAngle = endAngle;
        });

        return `conic-gradient(${segments.join(', ')})`;
    };

    return (
        <div className="soaking-simulator">
            <div className="page-header">
                <h2 className="page-title">🛡️ 소킹 시뮬레이터</h2>
                <p className="page-desc">복합 터렛 환경에서의 생존 시간을 계산합니다</p>
            </div>

            <div className="soaking-grid">
                {/* Dino Settings */}
                <div className="card">
                    <h3 className="card__title">🦕 공룡 설정</h3>
                    <div className="input-group">
                        <label>공룡</label>
                        <select className="input select" value={selectedDino?.id || ''} onChange={(e) => handleDinoChange(e.target.value)}>
                            {dinos.map((d) => (<option key={d.id} value={d.id}>{d.name_kr}</option>))}
                        </select>
                    </div>
                    <div className="input-group">
                        <label>현재 HP</label>
                        <input type="number" className="input" min={1} value={currentHP} onChange={(e) => setCurrentHP(Math.max(1, parseInt(e.target.value) || 1))} />
                    </div>
                    {selectedDino?.can_equip_saddle && (
                        <div className="input-group">
                            <label>안장 방어도</label>
                            <input type="number" className="input" min={0} value={saddleArmor} onChange={(e) => setSaddleArmor(Math.max(0, parseFloat(e.target.value) || 0))} />
                        </div>
                    )}
                    {selectedDino && selectedDino.special_abilities.length > 0 && (
                        <div className="input-group">
                            <label>특수 능력</label>
                            <select className="input select" value={selectedAbility || ''} onChange={(e) => setSelectedAbility(e.target.value || undefined)}>
                                <option value="">없음</option>
                                {selectedDino.special_abilities.map((ab) => (<option key={ab.mode_id} value={ab.mode_id}>{ab.mode_name} (-{ab.reduction_percent}%)</option>))}
                            </select>
                        </div>
                    )}

                    {/* Buff Checkboxes */}
                    <div className="buff-section">
                        <label className="section-label">활성화된 버프</label>
                        <div className="buff-list">
                            {BUFFS.map((buff) => (
                                <label key={buff.id} className={`buff-checkbox ${activeBuffs[buff.id] ? 'buff-checkbox--active' : ''}`}>
                                    <input
                                        type="checkbox"
                                        checked={activeBuffs[buff.id]}
                                        onChange={() => handleBuffToggle(buff.id)}
                                    />
                                    <span className="buff-icon">{buff.icon}</span>
                                    <span className="buff-name">{buff.name}</span>
                                    <span className="buff-value">-{Math.round(buff.reduction * 100)}%</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Turret Settings - Multi Input */}
                <div className="card">
                    <h3 className="card__title">🔫 터렛 설정 (복합 배치)</h3>
                    <p className="turret-desc">각 터렛 종류별 개수를 입력하세요</p>

                    <div className="turret-inputs">
                        {TURRET_TYPES.map((turret) => (
                            <div key={turret.id} className="turret-input-row" style={{ borderColor: turret.color }}>
                                <div className="turret-info">
                                    <span className="turret-name">{turret.name}</span>
                                    <span className="turret-stats">
                                        {turret.damagePerShot}dmg × {turret.multiplierVsDino}배
                                    </span>
                                </div>
                                <input
                                    type="number"
                                    className="turret-count-input"
                                    min={0}
                                    max={100}
                                    value={turretCounts[turret.id as keyof TurretCounts]}
                                    onChange={(e) => handleTurretChange(turret.id as keyof TurretCounts, parseInt(e.target.value) || 0)}
                                />
                            </div>
                        ))}
                    </div>

                    <div className="turret-total">
                        <span>총 터렛</span>
                        <span className="turret-total-count">
                            {Object.values(turretCounts).reduce((a, b) => a + b, 0)}개
                        </span>
                    </div>
                </div>
            </div>

            {/* Results */}
            {result && (
                <div className="card soaking-results">
                    <h3 className="card__title">📊 결과</h3>

                    <div className="result-main-grid">
                        {/* Survival Time Cards */}
                        <div className="result-cards">
                            <div className="result-box result-box--primary">
                                <span className="result-label">⏱️ 생존 시간</span>
                                <span className="result-value">{formatTime(result.survivalTime)}</span>
                            </div>
                            <div className="result-box result-box--success">
                                <span className="result-label">🥗 케이크 포함</span>
                                <span className="result-value">{formatTime(result.survivalTimeWithCakes)}</span>
                            </div>
                        </div>

                        {/* Pie Chart */}
                        {result.turretBreakdown.length > 0 && (
                            <div className="damage-chart">
                                <div className="pie-chart" style={{ background: getPieChartGradient() }}>
                                    <div className="pie-chart__center">
                                        <span className="pie-chart__dps">{result.totalDPS.toLocaleString()}</span>
                                        <span className="pie-chart__label">Total DPS</span>
                                    </div>
                                </div>
                                <div className="chart-legend">
                                    {result.turretBreakdown.map((t) => (
                                        <div key={t.id} className="legend-item">
                                            <span className="legend-color" style={{ background: t.color }}></span>
                                            <span className="legend-name">{t.name}</span>
                                            <span className="legend-value">{Math.round(t.percentage)}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Cake Info */}
                    <div className="cake-info">
                        <span className="cake-icon">🥬</span>
                        <div>
                            <span className="cake-label">야채 케이크</span>
                            <span className="cake-value">생존 중 <strong>{result.cakesCanEat}개</strong> 섭취 가능</span>
                        </div>
                    </div>

                    {/* Damage Breakdown */}
                    <div className="damage-breakdown">
                        <div className="breakdown-item"><span>안장 감소</span><span className="text-success">-{result.saddleReduction}%</span></div>
                        <div className="breakdown-item"><span>특수 능력</span><span className="text-success">-{result.abilityReduction}%</span></div>
                        <div className="breakdown-item"><span>버프 감소</span><span className="text-success">-{result.buffReduction}%</span></div>
                        <div className="breakdown-item highlight"><span>총 감소율</span><span className="text-accent">-{result.totalReduction}%</span></div>
                    </div>

                    {/* Per-Turret DPS */}
                    {result.turretBreakdown.length > 0 && (
                        <div className="turret-dps-list">
                            <h4>터렛별 DPS</h4>
                            <div className="turret-dps-grid">
                                {result.turretBreakdown.map((t) => (
                                    <div key={t.id} className="turret-dps-item" style={{ borderColor: t.color }}>
                                        <span className="turret-dps-name">{t.name}</span>
                                        <span className="turret-dps-value">{Math.round(t.dps).toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
