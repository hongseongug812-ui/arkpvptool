import { useState, useMemo } from 'react';
import { dataManager } from '../../services/DataManager';
import type { Structure, Explosive } from '../../types';
import './RaidCalculator.css';

// Icon mappings for structures
const STRUCTURE_ICONS: Record<string, string> = {
    'Metal': '🔩',
    'Tek': '💎',
    'Stone': '🪨',
    'Wood': '🪵',
    'default': '🏠',
};

// Icon mappings for explosives
const EXPLOSIVE_ICONS: Record<string, string> = {
    'c4': '💣',
    'rocket': '🚀',
    'grenade': '💥',
    'tek_grenade': '⚡',
    'cannon': '🎯',
    'default': '💥',
};

// Icon mappings for resources
const RESOURCE_ICONS: Record<string, string> = {
    '화약': '🧨',
    '폴리머': '🔷',
    '수정': '💎',
    '철 주괴': '🔩',
    '시멘트': '�ite',
    '가죽': '🟤',
    '섬유': '🧵',
    '엘리먼트': '💜',
    'default': '📦',
};

export function RaidCalculator() {
    const structures = dataManager.getStructures();
    const explosives = dataManager.getExplosives();

    const [selectedStructure, setSelectedStructure] = useState<Structure | null>(structures[0] || null);
    const [selectedExplosive, setSelectedExplosive] = useState<Explosive | null>(explosives[0] || null);
    const [quantity, setQuantity] = useState(1);
    const [showResult, setShowResult] = useState(false);

    const calculation = useMemo(() => {
        if (!selectedStructure || !selectedExplosive) return null;

        const damage = selectedExplosive.damage[selectedStructure.tier];
        if (!damage || damage <= 0) {
            return { error: true, needed: null, totalCost: {} };
        }

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
        // Trigger animation reset
        setTimeout(() => setShowResult(true), 50);
    };

    const getStructureIcon = (tier: string) => STRUCTURE_ICONS[tier] || STRUCTURE_ICONS['default'];
    const getExplosiveIcon = (id: string) => EXPLOSIVE_ICONS[id] || EXPLOSIVE_ICONS['default'];
    const getResourceIcon = (name: string) => RESOURCE_ICONS[name] || RESOURCE_ICONS['default'];

    return (
        <div className="raid-calculator">
            <div className="page-header">
                <h2 className="page-title">💣 레이드 계산기</h2>
                <p className="page-desc">구조물 파괴에 필요한 폭발물을 계산합니다</p>
            </div>

            <div className="raid-calculator__grid">
                {/* Inputs Section */}
                <div className="card raid-calculator__inputs">
                    <h3 className="card__title">🎯 타겟 설정</h3>

                    {/* Structure Selection with Icons */}
                    <div className="input-group">
                        <label>구조물</label>
                        <div className="select-with-icon">
                            <span className="select-icon">{selectedStructure ? getStructureIcon(selectedStructure.tier) : '🏠'}</span>
                            <select
                                className="input select"
                                value={selectedStructure?.id || ''}
                                onChange={(e) => {
                                    setSelectedStructure(structures.find((s) => s.id === e.target.value) || null);
                                    setShowResult(false);
                                }}
                            >
                                {structures.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name_kr} ({s.tier})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Structure Info Card */}
                    {selectedStructure && (
                        <div className="structure-info-card">
                            <div className="structure-info-header">
                                <span className="structure-icon-lg">{getStructureIcon(selectedStructure.tier)}</span>
                                <div>
                                    <span className="structure-name">{selectedStructure.name_kr}</span>
                                    <span className={`tier-badge tier-badge--${selectedStructure.tier.toLowerCase()}`}>
                                        {selectedStructure.tier}
                                    </span>
                                </div>
                            </div>
                            <div className="structure-hp">
                                <span>HP</span>
                                <span className="hp-value">{selectedStructure.hp.toLocaleString()}</span>
                            </div>
                        </div>
                    )}

                    {/* Quantity */}
                    <div className="input-group">
                        <label>파괴할 개수</label>
                        <div className="quantity-input">
                            <button className="qty-btn" onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button>
                            <input
                                type="number"
                                className="input qty-value"
                                min={1}
                                max={999}
                                value={quantity}
                                onChange={(e) => {
                                    setQuantity(Math.max(1, parseInt(e.target.value) || 1));
                                    setShowResult(false);
                                }}
                            />
                            <button className="qty-btn" onClick={() => setQuantity(Math.min(999, quantity + 1))}>+</button>
                        </div>
                    </div>

                    {/* Explosive Selection with Icons */}
                    <div className="input-group">
                        <label>폭발물</label>
                        <div className="select-with-icon">
                            <span className="select-icon">{selectedExplosive ? getExplosiveIcon(selectedExplosive.id) : '💥'}</span>
                            <select
                                className="input select"
                                value={selectedExplosive?.id || ''}
                                onChange={(e) => {
                                    setSelectedExplosive(explosives.find((ex) => ex.id === e.target.value) || null);
                                    setShowResult(false);
                                }}
                            >
                                {explosives.map((ex) => (
                                    <option key={ex.id} value={ex.id}>
                                        {ex.name_kr}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Calculate Button */}
                    <button className="btn btn--primary calculate-btn" onClick={handleCalculate}>
                        🔥 계산하기
                    </button>
                </div>

                {/* Result Section */}
                <div className="card raid-calculator__result">
                    <h3 className="card__title">📊 계산 결과</h3>

                    {!showResult ? (
                        <div className="result-placeholder">
                            <span className="placeholder-icon">💣</span>
                            <p>타겟을 설정하고 계산 버튼을 눌러주세요</p>
                        </div>
                    ) : calculation?.error ? (
                        <div className="raid-result__error">
                            <span className="error-icon">🚫</span>
                            <p>이 폭발물은 해당 재질에 데미지를 주지 못합니다</p>
                        </div>
                    ) : calculation?.needed ? (
                        <div className="raid-result animate-slide-up">
                            {/* Main Result with Impact Animation */}
                            <div className="raid-result__main">
                                <div className="explosion-bg"></div>
                                <span className="result-explosive-icon">{selectedExplosive ? getExplosiveIcon(selectedExplosive.id) : '💣'}</span>
                                <span className="result-label">필요한 {selectedExplosive?.name_kr}</span>
                                <span className="result-count animate-impact">{calculation.needed.toLocaleString()}</span>
                                <span className="result-unit">개</span>
                            </div>

                            {/* Stats */}
                            <div className="raid-result__stats">
                                <div className="stat-item">
                                    <span>총 HP</span>
                                    <span>{calculation.totalHP?.toLocaleString()}</span>
                                </div>
                                <div className="stat-item">
                                    <span>개당 데미지</span>
                                    <span>{calculation.damage?.toLocaleString()}</span>
                                </div>
                            </div>

                            {/* Resource List - Game Inventory Style */}
                            <div className="raid-result__cost">
                                <h4>🔧 필요 재료</h4>
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
