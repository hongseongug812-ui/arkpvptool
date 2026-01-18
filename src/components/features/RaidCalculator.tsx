import { useState, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { dataManager } from '../../services/DataManager';
import { ShareButton } from '../common/ShareButton';
import type { Structure, Explosive } from '../../types';
import './RaidCalculator.css';

// Icon mappings
const STRUCTURE_ICONS: Record<string, string> = { 'Metal': '🔩', 'Tek': '💎', 'Stone': '🪨', 'Wood': '🪵', 'default': '🏠' };
const EXPLOSIVE_ICONS: Record<string, string> = { 'c4': '💣', 'rocket': '🚀', 'grenade': '💥', 'tek_grenade': '⚡', 'cannon': '🎯', 'default': '💥' };
const RESOURCE_ICONS: Record<string, string> = { '화약': '🧨', 'Gunpowder': '🧨', '폴리머': '🔷', 'Polymer': '🔷', '수정': '💎', 'Crystal': '💎', '철 주괴': '🔩', 'Metal Ingot': '🔩', '시멘트': 'ite', 'Cementing Paste': '�ite', '가죽': '🟤', 'Hide': '🟤', '섬유': '🧵', 'Fiber': '🧵', '엘리먼트': '💜', 'Element': '💜', 'default': '📦' };

export function RaidCalculator() {
    const { t, i18n } = useTranslation();
    const isKorean = i18n.language === 'ko';

    const structures = dataManager.getStructures();
    const explosives = dataManager.getExplosives();

    const [selectedStructure, setSelectedStructure] = useState<Structure | null>(structures[0] || null);
    const [selectedExplosive, setSelectedExplosive] = useState<Explosive | null>(explosives[0] || null);
    const [quantity, setQuantity] = useState(1);
    const [showResult, setShowResult] = useState(false);
    const resultRef = useRef<HTMLDivElement>(null);

    const calculation = useMemo(() => {
        if (!selectedStructure || !selectedExplosive) return null;
        const damage = selectedExplosive.damage[selectedStructure.tier];
        if (!damage || damage <= 0) return { error: true, needed: null, totalCost: {} };
        const totalHP = selectedStructure.hp * quantity;
        const needed = Math.ceil(totalHP / damage);
        const totalCost: Record<string, number> = {};
        for (const [resource, amount] of Object.entries(selectedExplosive.recipe)) {
            totalCost[resource] = Math.ceil(amount * needed);
        }
        return { error: false, needed, totalCost, damage, totalHP };
    }, [selectedStructure, selectedExplosive, quantity]);

    const handleCalculate = () => {
        setShowResult(false);
        setTimeout(() => setShowResult(true), 50);
    };

    const getStructureIcon = (tier: string) => STRUCTURE_ICONS[tier] || STRUCTURE_ICONS['default'];
    const getExplosiveIcon = (id: string) => EXPLOSIVE_ICONS[id] || EXPLOSIVE_ICONS['default'];
    const getResourceIcon = (name: string) => RESOURCE_ICONS[name] || RESOURCE_ICONS['default'];

    return (
        <div className="raid-calculator">
            <div className="page-header">
                <h2 className="page-title">💣 {t('raid.title')}</h2>
                <p className="page-desc">{t('raid.desc')}</p>
            </div>

            <div className="raid-calculator__grid">
                <div className="card raid-calculator__inputs">
                    <h3 className="card__title">🎯 {t('raid.target')}</h3>

                    <div className="input-group">
                        <label>{t('raid.structure')}</label>
                        <div className="select-with-icon">
                            <span className="select-icon">{selectedStructure ? getStructureIcon(selectedStructure.tier) : '🏠'}</span>
                            <select className="input select" value={selectedStructure?.id || ''} onChange={(e) => { setSelectedStructure(structures.find((s) => s.id === e.target.value) || null); setShowResult(false); }}>
                                {structures.map((s) => (
                                    <option key={s.id} value={s.id}>{isKorean ? s.name_kr : s.name} ({s.tier})</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {selectedStructure && (
                        <div className="structure-info-card">
                            <div className="structure-info-header">
                                <span className="structure-icon-lg">{getStructureIcon(selectedStructure.tier)}</span>
                                <div>
                                    <span className="structure-name">{isKorean ? selectedStructure.name_kr : selectedStructure.name}</span>
                                    <span className={`tier-badge tier-badge--${selectedStructure.tier.toLowerCase()}`}>{selectedStructure.tier}</span>
                                </div>
                            </div>
                            <div className="structure-hp">
                                <span>HP</span>
                                <span className="hp-value">{selectedStructure.hp.toLocaleString()}</span>
                            </div>
                        </div>
                    )}

                    <div className="input-group">
                        <label>{t('raid.quantity')}</label>
                        <div className="quantity-input">
                            <button className="qty-btn" onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button>
                            <input type="number" className="input qty-value" min={1} max={999} value={quantity} onChange={(e) => { setQuantity(Math.max(1, parseInt(e.target.value) || 1)); setShowResult(false); }} />
                            <button className="qty-btn" onClick={() => setQuantity(Math.min(999, quantity + 1))}>+</button>
                        </div>
                    </div>

                    <div className="input-group">
                        <label>{t('raid.explosive')}</label>
                        <div className="select-with-icon">
                            <span className="select-icon">{selectedExplosive ? getExplosiveIcon(selectedExplosive.id) : '💥'}</span>
                            <select className="input select" value={selectedExplosive?.id || ''} onChange={(e) => { setSelectedExplosive(explosives.find((ex) => ex.id === e.target.value) || null); setShowResult(false); }}>
                                {explosives.map((ex) => (
                                    <option key={ex.id} value={ex.id}>{isKorean ? ex.name_kr : ex.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <button className="btn btn--primary calculate-btn" onClick={handleCalculate}>
                        🔥 {t('common.calculate')}
                    </button>
                </div>

                <div className="card raid-calculator__result" ref={resultRef}>
                    <div className="card__header">
                        <h3 className="card__title">📊 {t('common.result')}</h3>
                        {showResult && calculation?.needed && (
                            <ShareButton targetRef={resultRef} title="ARK-Raid-Result" compact />
                        )}
                    </div>

                    {!showResult ? (
                        <div className="result-placeholder">
                            <span className="placeholder-icon">💣</span>
                            <p>{t('raid.noResult')}</p>
                        </div>
                    ) : calculation?.error ? (
                        <div className="raid-result__error">
                            <span className="error-icon">🚫</span>
                            <p>{t('raid.noDamage')}</p>
                        </div>
                    ) : calculation?.needed ? (
                        <div className="raid-result animate-slide-up">
                            <div className="raid-result__main">
                                <div className="explosion-bg"></div>
                                <span className="result-explosive-icon">{selectedExplosive ? getExplosiveIcon(selectedExplosive.id) : '💣'}</span>
                                <span className="result-label">{t('raid.needed', { name: isKorean ? selectedExplosive?.name_kr : selectedExplosive?.name })}</span>
                                <span className="result-count animate-impact">{calculation.needed.toLocaleString()}</span>
                                <span className="result-unit">{isKorean ? '개' : 'units'}</span>
                            </div>

                            <div className="raid-result__stats">
                                <div className="stat-item">
                                    <span>{t('raid.totalHp')}</span>
                                    <span>{calculation.totalHP?.toLocaleString()}</span>
                                </div>
                                <div className="stat-item">
                                    <span>{t('raid.damagePerUnit')}</span>
                                    <span>{calculation.damage?.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="raid-result__cost">
                                <h4>🔧 {t('raid.materials')}</h4>
                                <div className="inventory-grid">
                                    {Object.entries(calculation.totalCost).map(([resource, amount]) => (
                                        <div key={resource} className="inventory-item">
                                            <span className="inventory-icon">{getResourceIcon(resource)}</span>
                                            <div className="inventory-info">
                                                <span className="inventory-name">{resource}</span>
                                                <span className="inventory-amount">{amount.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
