import { useState, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { dataManager } from '../../services/DataManager';
import { ShareButton } from '../common/ShareButton';
import type { DinoStatsEntry } from '../../types';
import './DinoCompare.css';

type StatKey = 'health' | 'stamina' | 'weight' | 'melee';

const STAT_CONFIG: Record<StatKey, { label: string; labelKr: string; icon: string; color: string }> = {
    health: { label: 'Health', labelKr: '체력', icon: '❤️', color: '#FF6B6B' },
    stamina: { label: 'Stamina', labelKr: '기력', icon: '⚡', color: '#4ECDC4' },
    weight: { label: 'Weight', labelKr: '무게', icon: '📦', color: '#95A5A6' },
    melee: { label: 'Melee', labelKr: '근공', icon: '⚔️', color: '#FFD93D' },
};

const MAX_COMPARE = 4;

interface CompareSlot {
    dino: DinoStatsEntry | null;
    level: number;
}

interface DinoCompareProps {
    onClose: () => void;
}

export function DinoCompare({ onClose }: DinoCompareProps) {
    const { i18n } = useTranslation();
    const isKorean = i18n.language === 'ko';
    const compareRef = useRef<HTMLDivElement>(null);

    const allDinos = dataManager.getAllDinoStats();

    const [slots, setSlots] = useState<CompareSlot[]>([
        { dino: allDinos[0] || null, level: 150 },
        { dino: allDinos[1] || null, level: 150 },
    ]);

    const addSlot = () => {
        if (slots.length < MAX_COMPARE) {
            setSlots([...slots, { dino: allDinos[0] || null, level: 150 }]);
        }
    };

    const removeSlot = (index: number) => {
        if (slots.length > 2) {
            setSlots(slots.filter((_, i) => i !== index));
        }
    };

    const updateSlot = (index: number, updates: Partial<CompareSlot>) => {
        setSlots(slots.map((slot, i) => i === index ? { ...slot, ...updates } : slot));
    };

    // Calculate stats for each slot
    const comparisonData = useMemo(() => {
        return slots.map(slot => {
            if (!slot.dino) return null;

            const stats: Record<StatKey, { base: number; max: number; perLevel: number }> = {
                health: {
                    base: slot.dino.stats.health.base,
                    max: slot.dino.stats.health.base + (slot.dino.stats.health.inc_wild * slot.level * 0.7),
                    perLevel: slot.dino.stats.health.inc_wild,
                },
                stamina: {
                    base: slot.dino.stats.stamina.base,
                    max: slot.dino.stats.stamina.base + (slot.dino.stats.stamina.inc_wild * slot.level * 0.7),
                    perLevel: slot.dino.stats.stamina.inc_wild,
                },
                weight: {
                    base: slot.dino.stats.weight.base,
                    max: slot.dino.stats.weight.base + (slot.dino.stats.weight.inc_wild * slot.level * 0.7),
                    perLevel: slot.dino.stats.weight.inc_wild,
                },
                melee: {
                    base: slot.dino.stats.melee.base,
                    max: slot.dino.stats.melee.base + (slot.dino.stats.melee.inc_wild * slot.level * 0.7),
                    perLevel: slot.dino.stats.melee.inc_wild,
                },
            };

            return { dino: slot.dino, level: slot.level, stats };
        });
    }, [slots]);

    // Find best stat for each category
    const bestStats = useMemo(() => {
        const result: Record<StatKey, number> = { health: 0, stamina: 0, weight: 0, melee: 0 };

        Object.keys(result).forEach(key => {
            const statKey = key as StatKey;
            let maxValue = 0;
            comparisonData.forEach(data => {
                if (data && data.stats[statKey].max > maxValue) {
                    maxValue = data.stats[statKey].max;
                }
            });
            result[statKey] = maxValue;
        });

        return result;
    }, [comparisonData]);

    return (
        <div className="dino-compare-overlay" onClick={onClose}>
            <div className="dino-compare" onClick={(e) => e.stopPropagation()} ref={compareRef}>
                <div className="dino-compare__header">
                    <h2 className="dino-compare__title">📊 {isKorean ? '공룡 스탯 비교' : 'Dino Stat Comparison'}</h2>
                    <div className="dino-compare__actions">
                        <ShareButton targetRef={compareRef} title="ARK-Dino-Compare" compact />
                        <button className="dino-compare__close" onClick={onClose}>✕</button>
                    </div>
                </div>

                <div className="dino-compare__grid" style={{ gridTemplateColumns: `repeat(${slots.length}, 1fr)` }}>
                    {slots.map((slot, index) => (
                        <div key={index} className="compare-slot">
                            <div className="compare-slot__header">
                                {slots.length > 2 && (
                                    <button className="compare-slot__remove" onClick={() => removeSlot(index)}>✕</button>
                                )}
                                <select
                                    className="input select compare-slot__select"
                                    value={slot.dino?.id || ''}
                                    onChange={(e) => {
                                        const dino = allDinos.find(d => d.id === e.target.value) || null;
                                        updateSlot(index, { dino });
                                    }}
                                >
                                    {allDinos.map(d => (
                                        <option key={d.id} value={d.id}>
                                            {isKorean ? d.name_kr.split('(')[0].trim() : d.id}
                                        </option>
                                    ))}
                                </select>
                                <div className="compare-slot__level">
                                    <label>Lv.</label>
                                    <input
                                        type="number"
                                        className="input compare-slot__level-input"
                                        value={slot.level}
                                        onChange={(e) => updateSlot(index, { level: Math.max(1, parseInt(e.target.value) || 1) })}
                                    />
                                </div>
                            </div>

                            {comparisonData[index] && (
                                <div className="compare-slot__stats">
                                    {(Object.keys(STAT_CONFIG) as StatKey[]).map(statKey => {
                                        const config = STAT_CONFIG[statKey];
                                        const data = comparisonData[index]!;
                                        const isBest = data.stats[statKey].max >= bestStats[statKey] && bestStats[statKey] > 0;
                                        const percentage = bestStats[statKey] > 0
                                            ? (data.stats[statKey].max / bestStats[statKey]) * 100
                                            : 0;

                                        return (
                                            <div key={statKey} className={`compare-stat ${isBest ? 'compare-stat--best' : ''}`}>
                                                <div className="compare-stat__header">
                                                    <span className="compare-stat__icon">{config.icon}</span>
                                                    <span className="compare-stat__label">
                                                        {isKorean ? config.labelKr : config.label}
                                                    </span>
                                                    {isBest && <span className="compare-stat__crown">👑</span>}
                                                </div>
                                                <div className="compare-stat__bar-container">
                                                    <div
                                                        className="compare-stat__bar"
                                                        style={{
                                                            width: `${percentage}%`,
                                                            backgroundColor: config.color
                                                        }}
                                                    />
                                                </div>
                                                <div className="compare-stat__values">
                                                    <span className="compare-stat__base">
                                                        {isKorean ? '기본' : 'Base'}: {Math.round(data.stats[statKey].base)}
                                                    </span>
                                                    <span className="compare-stat__max">
                                                        {isKorean ? '최대' : 'Max'}: {Math.round(data.stats[statKey].max).toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {slots.length < MAX_COMPARE && (
                    <button className="dino-compare__add" onClick={addSlot}>
                        + {isKorean ? '공룡 추가' : 'Add Dino'}
                    </button>
                )}

                <div className="dino-compare__legend">
                    <span className="legend-item">
                        <span className="legend-icon">👑</span>
                        {isKorean ? '해당 스탯 1위' : 'Best in stat'}
                    </span>
                </div>
            </div>
        </div>
    );
}
