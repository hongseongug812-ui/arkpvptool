import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { dataManager } from '../../services/DataManager';
import type { Dino } from '../../types';
import './SoakingSimulator.css';

const VEGGIE_CAKE_HEAL_PERCENT = 0.10;
const VEGGIE_CAKE_COOLDOWN = 30;

export function SoakingSimulator() {
    const { t, i18n } = useTranslation();
    const isKorean = i18n.language === 'ko';

    const dinos = dataManager.getDinos();

    // Turret definitions with i18n
    const TURRET_TYPES = [
        { id: 'auto', nameKr: '자동 포탑', nameEn: 'Auto Turret', damagePerShot: 70, rateOfFire: 2.85, multiplierVsDino: 4.0, color: '#00E5FF' },
        { id: 'heavy', nameKr: '헤비 포탑', nameEn: 'Heavy Turret', damagePerShot: 300, rateOfFire: 2.5, multiplierVsDino: 1.0, color: '#9B59B6' },
        { id: 'tek', nameKr: '테크 포탑', nameEn: 'Tek Turret', damagePerShot: 150, rateOfFire: 2.5, multiplierVsDino: 1.5, color: '#FFD700' },
    ];

    const BUFFS = [
        { id: 'mate_boost', nameKr: '메이트 부스트', nameEn: 'Mate Boost', reduction: 0.33, icon: '💕' },
        { id: 'yuty_courage', nameKr: '유티 용기 버프', nameEn: 'Yuty Courage Roar', reduction: 0.20, icon: '🦖' },
    ];

    const [selectedDino, setSelectedDino] = useState<Dino | null>(dinos[0] || null);
    const [currentHP, setCurrentHP] = useState(10000);
    const [saddleArmor, setSaddleArmor] = useState(25);
    const [selectedAbility, setSelectedAbility] = useState<string | undefined>(dinos[0]?.special_abilities[0]?.mode_id);
    const [turretCounts, setTurretCounts] = useState({ auto: 10, heavy: 5, tek: 0 });
    const [activeBuffs, setActiveBuffs] = useState<Record<string, boolean>>({ mate_boost: false, yuty_courage: false });

    const result = useMemo(() => {
        if (!selectedDino) return null;
        const saddleMultiplier = selectedDino.can_equip_saddle ? 100 / (100 + 4 * saddleArmor) : 1;
        const ability = selectedDino.special_abilities.find((a) => a.mode_id === selectedAbility);
        const abilityReduction = ability ? ability.reduction_percent / 100 : 0;
        let buffMultiplier = 1;
        BUFFS.forEach((buff) => { if (activeBuffs[buff.id]) buffMultiplier *= (1 - buff.reduction); });

        const turretBreakdown: { id: string; name: string; dps: number; percentage: number; color: string }[] = [];
        let totalDPS = 0;

        TURRET_TYPES.forEach((turret) => {
            const count = turretCounts[turret.id as keyof typeof turretCounts];
            if (count > 0) {
                const baseDamage = turret.damagePerShot * turret.multiplierVsDino;
                const finalDamage = baseDamage * saddleMultiplier * (1 - abilityReduction) * buffMultiplier;
                const dps = finalDamage * turret.rateOfFire * count;
                turretBreakdown.push({ id: turret.id, name: isKorean ? turret.nameKr : turret.nameEn, dps, percentage: 0, color: turret.color });
                totalDPS += dps;
            }
        });

        turretBreakdown.forEach((t) => { t.percentage = totalDPS > 0 ? (t.dps / totalDPS) * 100 : 0; });

        const survivalTime = totalDPS > 0 ? currentHP / totalDPS : Infinity;
        const healPerCake = currentHP * VEGGIE_CAKE_HEAL_PERCENT;
        const cakesCanEat = Math.floor(survivalTime / VEGGIE_CAKE_COOLDOWN);
        const totalHealFromCakes = cakesCanEat * healPerCake;
        const survivalTimeWithCakes = totalDPS > 0 ? (currentHP + totalHealFromCakes) / totalDPS : Infinity;
        const totalReduction = 1 - (saddleMultiplier * (1 - abilityReduction) * buffMultiplier);

        return { saddleReduction: Math.round((1 - saddleMultiplier) * 100), abilityReduction: Math.round(abilityReduction * 100), buffReduction: Math.round((1 - buffMultiplier) * 100), totalReduction: Math.round(totalReduction * 100), totalDPS: Math.round(totalDPS), survivalTime, survivalTimeWithCakes, cakesCanEat, turretBreakdown };
    }, [selectedDino, currentHP, saddleArmor, selectedAbility, turretCounts, activeBuffs, isKorean]);

    const handleDinoChange = (dinoId: string) => {
        const dino = dinos.find((d) => d.id === dinoId);
        setSelectedDino(dino || null);
        setSelectedAbility(dino?.special_abilities[0]?.mode_id);
        if (dino) setCurrentHP(dino.base_hp * 10);
    };

    const formatTime = (seconds: number) => {
        if (!isFinite(seconds)) return '∞';
        if (seconds < 60) return isKorean ? `${seconds.toFixed(1)}초` : `${seconds.toFixed(1)}s`;
        const mins = Math.floor(seconds / 60);
        const secs = Math.round(seconds % 60);
        return isKorean ? `${mins}분 ${secs}초` : `${mins}m ${secs}s`;
    };

    const getPieChartGradient = () => {
        if (!result || result.turretBreakdown.length === 0) return 'transparent';
        let currentAngle = 0;
        const segments: string[] = [];
        result.turretBreakdown.forEach((t) => { const endAngle = currentAngle + (t.percentage * 3.6); segments.push(`${t.color} ${currentAngle}deg ${endAngle}deg`); currentAngle = endAngle; });
        return `conic-gradient(${segments.join(', ')})`;
    };

    return (
        <div className="soaking-simulator">
            <div className="page-header">
                <h2 className="page-title">🛡️ {t('soak.title')}</h2>
                <p className="page-desc">{t('soak.desc')}</p>
            </div>

            <div className="soaking-grid">
                <div className="card">
                    <h3 className="card__title">🦕 {t('soak.dinoSettings')}</h3>
                    <div className="input-group">
                        <label>{isKorean ? '공룡' : 'Dino'}</label>
                        <select className="input select" value={selectedDino?.id || ''} onChange={(e) => handleDinoChange(e.target.value)}>
                            {dinos.map((d) => (<option key={d.id} value={d.id}>{isKorean ? d.name_kr : d.name}</option>))}
                        </select>
                    </div>
                    <div className="input-group">
                        <label>{isKorean ? '현재 HP' : 'Current HP'}</label>
                        <input type="number" className="input" min={1} value={currentHP} onChange={(e) => setCurrentHP(Math.max(1, parseInt(e.target.value) || 1))} />
                    </div>
                    {selectedDino?.can_equip_saddle && (
                        <div className="input-group">
                            <label>{isKorean ? '안장 방어도' : 'Saddle Armor'}</label>
                            <input type="number" className="input" min={0} value={saddleArmor} onChange={(e) => setSaddleArmor(Math.max(0, parseFloat(e.target.value) || 0))} />
                        </div>
                    )}
                    {selectedDino && selectedDino.special_abilities.length > 0 && (
                        <div className="input-group">
                            <label>{isKorean ? '특수 능력' : 'Special Ability'}</label>
                            <select className="input select" value={selectedAbility || ''} onChange={(e) => setSelectedAbility(e.target.value || undefined)}>
                                <option value="">{isKorean ? '없음' : 'None'}</option>
                                {selectedDino.special_abilities.map((ab) => (<option key={ab.mode_id} value={ab.mode_id}>{ab.mode_name} (-{ab.reduction_percent}%)</option>))}
                            </select>
                        </div>
                    )}
                    <div className="buff-section">
                        <label className="section-label">{t('soak.buffs')}</label>
                        <div className="buff-list">
                            {BUFFS.map((buff) => (
                                <label key={buff.id} className={`buff-checkbox ${activeBuffs[buff.id] ? 'buff-checkbox--active' : ''}`}>
                                    <input type="checkbox" checked={activeBuffs[buff.id]} onChange={() => setActiveBuffs((prev) => ({ ...prev, [buff.id]: !prev[buff.id] }))} />
                                    <span className="buff-icon">{buff.icon}</span>
                                    <span className="buff-name">{isKorean ? buff.nameKr : buff.nameEn}</span>
                                    <span className="buff-value">-{Math.round(buff.reduction * 100)}%</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="card">
                    <h3 className="card__title">🔫 {t('soak.turretSettings')}</h3>
                    <p className="turret-desc">{isKorean ? '각 터렛 종류별 개수를 입력하세요' : 'Enter count for each turret type'}</p>
                    <div className="turret-inputs">
                        {TURRET_TYPES.map((turret) => (
                            <div key={turret.id} className="turret-input-row" style={{ borderColor: turret.color }}>
                                <div className="turret-info">
                                    <span className="turret-name">{isKorean ? turret.nameKr : turret.nameEn}</span>
                                    <span className="turret-stats">{turret.damagePerShot}dmg × {turret.multiplierVsDino}x</span>
                                </div>
                                <input type="number" className="turret-count-input" min={0} max={100} value={turretCounts[turret.id as keyof typeof turretCounts]} onChange={(e) => setTurretCounts((prev) => ({ ...prev, [turret.id]: Math.max(0, parseInt(e.target.value) || 0) }))} />
                            </div>
                        ))}
                    </div>
                    <div className="turret-total">
                        <span>{isKorean ? '총 터렛' : 'Total Turrets'}</span>
                        <span className="turret-total-count">{Object.values(turretCounts).reduce((a, b) => a + b, 0)}</span>
                    </div>
                </div>
            </div>

            {result && (
                <div className="card soaking-results">
                    <h3 className="card__title">📊 {t('common.result')}</h3>
                    <div className="result-main-grid">
                        <div className="result-cards">
                            <div className="result-box result-box--primary">
                                <span className="result-label">⏱️ {t('soak.survivalTime')}</span>
                                <span className="result-value">{formatTime(result.survivalTime)}</span>
                            </div>
                            <div className="result-box result-box--success">
                                <span className="result-label">🥗 {t('soak.withCake')}</span>
                                <span className="result-value">{formatTime(result.survivalTimeWithCakes)}</span>
                            </div>
                        </div>
                        {result.turretBreakdown.length > 0 && (
                            <div className="damage-chart">
                                <div className="pie-chart" style={{ background: getPieChartGradient() }}>
                                    <div className="pie-chart__center">
                                        <span className="pie-chart__dps">{result.totalDPS.toLocaleString()}</span>
                                        <span className="pie-chart__label">{t('soak.totalDps')}</span>
                                    </div>
                                </div>
                                <div className="chart-legend">
                                    {result.turretBreakdown.map((t) => (<div key={t.id} className="legend-item"><span className="legend-color" style={{ background: t.color }}></span><span className="legend-name">{t.name}</span><span className="legend-value">{Math.round(t.percentage)}%</span></div>))}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="cake-info"><span className="cake-icon">🥬</span><div><span className="cake-label">{isKorean ? '야채 케이크' : 'Veggie Cakes'}</span><span className="cake-value">{isKorean ? `생존 중 ${result.cakesCanEat}개 섭취 가능` : `Can eat ${result.cakesCanEat} during survival`}</span></div></div>
                    <div className="damage-breakdown">
                        <div className="breakdown-item"><span>{isKorean ? '안장 감소' : 'Saddle Reduction'}</span><span className="text-success">-{result.saddleReduction}%</span></div>
                        <div className="breakdown-item"><span>{isKorean ? '특수 능력' : 'Special Ability'}</span><span className="text-success">-{result.abilityReduction}%</span></div>
                        <div className="breakdown-item"><span>{isKorean ? '버프 감소' : 'Buff Reduction'}</span><span className="text-success">-{result.buffReduction}%</span></div>
                        <div className="breakdown-item highlight"><span>{isKorean ? '총 감소율' : 'Total Reduction'}</span><span className="text-accent">-{result.totalReduction}%</span></div>
                    </div>
                    {result.turretBreakdown.length > 0 && (<div className="turret-dps-list"><h4>{isKorean ? '터렛별 DPS' : 'DPS per Turret'}</h4><div className="turret-dps-grid">{result.turretBreakdown.map((t) => (<div key={t.id} className="turret-dps-item" style={{ borderColor: t.color }}><span className="turret-dps-name">{t.name}</span><span className="turret-dps-value">{Math.round(t.dps).toLocaleString()}</span></div>))}</div></div>)}
                </div>
            )}
        </div>
    );
}
