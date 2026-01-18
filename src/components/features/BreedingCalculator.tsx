import { useState, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { dataManager } from '../../services/DataManager';
import { ShareButton } from '../common/ShareButton';
import { HatchingTimer } from './HatchingTimer';
import type { DinoStatsEntry } from '../../types';
import './BreedingCalculator.css';

// Breeding constants
const MUTATION_CHANCE = 0.025; // 2.5% per parent per stat
const STATS_COUNT = 6; // HP, Stam, O2, Food, Weight, Melee
const MAX_MUTATIONS = 20; // Max mutations per side

interface BreedingPair {
    male: { dino: DinoStatsEntry | null; level: number; mutations: number };
    female: { dino: DinoStatsEntry | null; level: number; mutations: number };
}

interface BreedingResult {
    mutationChancePerBaby: number;
    expectedMutationsPerBaby: number;
    babiesForOneMutation: number;
    canMutate: { male: boolean; female: boolean };
    inheritanceInfo: string;
}

export function BreedingCalculator() {
    const { i18n } = useTranslation();
    const isKorean = i18n.language === 'ko';
    const resultRef = useRef<HTMLDivElement>(null);

    const allDinos = dataManager.getAllDinoStats();

    // Filter dinos that can breed
    const breedableDinos = useMemo(() => {
        return allDinos.filter(d => !d.id.includes('crystal_wyvern')); // Most dinos can breed
    }, [allDinos]);

    const [pair, setPair] = useState<BreedingPair>({
        male: { dino: breedableDinos[0] || null, level: 150, mutations: 0 },
        female: { dino: breedableDinos[0] || null, level: 150, mutations: 0 }
    });

    const [targetMutations, setTargetMutations] = useState(20);
    const [babiesPerBatch, setBabiesPerBatch] = useState(10);
    const [showHatchingTimer, setShowHatchingTimer] = useState(false);

    // Calculate breeding results
    const result = useMemo<BreedingResult>(() => {
        const maleCan = pair.male.mutations < MAX_MUTATIONS;
        const femaleCan = pair.female.mutations < MAX_MUTATIONS;

        // Each stat has 2.5% chance from each parent
        // Total mutation chance = sum of chances from both parents for all stats
        let totalChance = 0;

        if (maleCan) {
            totalChance += MUTATION_CHANCE * STATS_COUNT;
        }
        if (femaleCan) {
            totalChance += MUTATION_CHANCE * STATS_COUNT;
        }

        // Cap at reasonable maximum
        const mutationChancePerBaby = Math.min(totalChance, 1);
        const expectedMutationsPerBaby = mutationChancePerBaby;
        const babiesForOneMutation = mutationChancePerBaby > 0 ? Math.ceil(1 / mutationChancePerBaby) : Infinity;

        let inheritanceInfo = '';
        if (maleCan && femaleCan) {
            inheritanceInfo = isKorean
                ? '양쪽 부모 모두 돌연변이 가능'
                : 'Both parents can pass mutations';
        } else if (maleCan) {
            inheritanceInfo = isKorean
                ? '수컷만 돌연변이 가능 (암컷 20+ 돌연변이)'
                : 'Only male can mutate (female has 20+ mutations)';
        } else if (femaleCan) {
            inheritanceInfo = isKorean
                ? '암컷만 돌연변이 가능 (수컷 20+ 돌연변이)'
                : 'Only female can mutate (male has 20+ mutations)';
        } else {
            inheritanceInfo = isKorean
                ? '⚠️ 양쪽 모두 20+ 돌연변이로 추가 돌연변이 불가'
                : '⚠️ Both parents have 20+ mutations - no new mutations possible';
        }

        return {
            mutationChancePerBaby,
            expectedMutationsPerBaby,
            babiesForOneMutation,
            canMutate: { male: maleCan, female: femaleCan },
            inheritanceInfo
        };
    }, [pair, isKorean]);

    // Calculate babies needed for target mutations
    const babiesNeeded = useMemo(() => {
        if (result.mutationChancePerBaby <= 0) return Infinity;

        // Using geometric distribution expected value
        const currentMutations = Math.max(pair.male.mutations, pair.female.mutations);
        const mutationsNeeded = Math.max(0, targetMutations - currentMutations);

        return Math.ceil(mutationsNeeded / result.mutationChancePerBaby);
    }, [result, pair, targetMutations]);

    // Calculate batches needed
    const batchesNeeded = useMemo(() => {
        if (babiesNeeded === Infinity) return Infinity;
        return Math.ceil(babiesNeeded / babiesPerBatch);
    }, [babiesNeeded, babiesPerBatch]);

    const handleDinoChange = (gender: 'male' | 'female', dinoId: string) => {
        const dino = breedableDinos.find(d => d.id === dinoId) || null;
        setPair(prev => ({
            ...prev,
            [gender]: { ...prev[gender], dino }
        }));
    };

    const handleLevelChange = (gender: 'male' | 'female', level: number) => {
        setPair(prev => ({
            ...prev,
            [gender]: { ...prev[gender], level: Math.max(1, Math.min(999, level)) }
        }));
    };

    const handleMutationChange = (gender: 'male' | 'female', mutations: number) => {
        setPair(prev => ({
            ...prev,
            [gender]: { ...prev[gender], mutations: Math.max(0, mutations) }
        }));
    };

    return (
        <div className="breeding-calculator">
            <div className="page-header">
                <div className="page-header__top">
                    <div>
                        <h2 className="page-title">🧬 {isKorean ? '브리딩 계산기' : 'Breeding Calculator'}</h2>
                        <p className="page-desc">{isKorean ? '돌연변이 확률 및 브리딩 계획 계산' : 'Calculate mutation chances and breeding plans'}</p>
                    </div>
                    <button className="compare-btn" onClick={() => setShowHatchingTimer(true)}>
                        🥚 {isKorean ? '부화 타이머' : 'Hatch Timer'}
                    </button>
                </div>
            </div>

            <div className="breeding-grid">
                {/* Parent Cards */}
                <div className="card parent-card parent-card--male">
                    <div className="parent-card__header">
                        <span className="parent-card__gender">♂️</span>
                        <h3 className="parent-card__title">{isKorean ? '수컷' : 'Male'}</h3>
                    </div>

                    <div className="input-group">
                        <label>{isKorean ? '공룡' : 'Dino'}</label>
                        <select
                            className="input select"
                            value={pair.male.dino?.id || ''}
                            onChange={(e) => handleDinoChange('male', e.target.value)}
                        >
                            {breedableDinos.map(d => (
                                <option key={d.id} value={d.id}>
                                    {isKorean ? d.name_kr.split('(')[0].trim() : d.id}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="input-group">
                        <label>{isKorean ? '레벨' : 'Level'}</label>
                        <input
                            type="number"
                            className="input"
                            value={pair.male.level}
                            onChange={(e) => handleLevelChange('male', parseInt(e.target.value) || 1)}
                        />
                    </div>

                    <div className="input-group">
                        <label>{isKorean ? '현재 돌연변이' : 'Current Mutations'}</label>
                        <input
                            type="number"
                            className="input"
                            value={pair.male.mutations}
                            onChange={(e) => handleMutationChange('male', parseInt(e.target.value) || 0)}
                        />
                        <span className={`mutation-status ${pair.male.mutations >= 20 ? 'mutation-status--capped' : 'mutation-status--ok'}`}>
                            {pair.male.mutations >= 20
                                ? (isKorean ? '🚫 돌연변이 불가' : '🚫 Capped')
                                : (isKorean ? '✓ 돌연변이 가능' : '✓ Can Mutate')
                            }
                        </span>
                    </div>
                </div>

                <div className="breeding-center">
                    <div className="heart-icon">💕</div>
                    <div className="breeding-arrow">→ 🥚 →</div>
                </div>

                <div className="card parent-card parent-card--female">
                    <div className="parent-card__header">
                        <span className="parent-card__gender">♀️</span>
                        <h3 className="parent-card__title">{isKorean ? '암컷' : 'Female'}</h3>
                    </div>

                    <div className="input-group">
                        <label>{isKorean ? '공룡' : 'Dino'}</label>
                        <select
                            className="input select"
                            value={pair.female.dino?.id || ''}
                            onChange={(e) => handleDinoChange('female', e.target.value)}
                        >
                            {breedableDinos.map(d => (
                                <option key={d.id} value={d.id}>
                                    {isKorean ? d.name_kr.split('(')[0].trim() : d.id}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="input-group">
                        <label>{isKorean ? '레벨' : 'Level'}</label>
                        <input
                            type="number"
                            className="input"
                            value={pair.female.level}
                            onChange={(e) => handleLevelChange('female', parseInt(e.target.value) || 1)}
                        />
                    </div>

                    <div className="input-group">
                        <label>{isKorean ? '현재 돌연변이' : 'Current Mutations'}</label>
                        <input
                            type="number"
                            className="input"
                            value={pair.female.mutations}
                            onChange={(e) => handleMutationChange('female', parseInt(e.target.value) || 0)}
                        />
                        <span className={`mutation-status ${pair.female.mutations >= 20 ? 'mutation-status--capped' : 'mutation-status--ok'}`}>
                            {pair.female.mutations >= 20
                                ? (isKorean ? '🚫 돌연변이 불가' : '🚫 Capped')
                                : (isKorean ? '✓ 돌연변이 가능' : '✓ Can Mutate')
                            }
                        </span>
                    </div>
                </div>
            </div>

            {/* Results */}
            <div className="card breeding-results" ref={resultRef}>
                <div className="card__header">
                    <h3 className="card__title">📊 {isKorean ? '브리딩 결과' : 'Breeding Results'}</h3>
                    <ShareButton targetRef={resultRef} title="ARK-Breeding-Result" compact />
                </div>

                <div className="breeding-results__grid">
                    <div className="result-stat">
                        <span className="result-stat__label">{isKorean ? '돌연변이 확률' : 'Mutation Chance'}</span>
                        <span className="result-stat__value result-stat__value--accent">
                            {(result.mutationChancePerBaby * 100).toFixed(1)}%
                        </span>
                        <span className="result-stat__sub">{isKorean ? '새끼당' : 'per baby'}</span>
                    </div>

                    <div className="result-stat">
                        <span className="result-stat__label">{isKorean ? '1회 돌연변이까지' : 'Babies for 1 Mutation'}</span>
                        <span className="result-stat__value">
                            ~{result.babiesForOneMutation === Infinity ? '∞' : result.babiesForOneMutation}
                        </span>
                        <span className="result-stat__sub">{isKorean ? '예상 새끼 수' : 'expected babies'}</span>
                    </div>

                    <div className="result-stat result-stat--wide">
                        <span className="result-stat__label">{isKorean ? '상속 정보' : 'Inheritance Info'}</span>
                        <span className={`result-stat__info ${!result.canMutate.male && !result.canMutate.female ? 'result-stat__info--warning' : ''}`}>
                            {result.inheritanceInfo}
                        </span>
                    </div>
                </div>

                {/* Mutation Planner */}
                <div className="mutation-planner">
                    <h4 className="mutation-planner__title">🎯 {isKorean ? '돌연변이 목표 계획' : 'Mutation Goal Planner'}</h4>

                    <div className="planner-inputs">
                        <div className="input-group">
                            <label>{isKorean ? '목표 돌연변이' : 'Target Mutations'}</label>
                            <input
                                type="number"
                                className="input"
                                value={targetMutations}
                                onChange={(e) => setTargetMutations(Math.max(1, parseInt(e.target.value) || 1))}
                            />
                        </div>
                        <div className="input-group">
                            <label>{isKorean ? '배치당 새끼 수' : 'Babies per Batch'}</label>
                            <input
                                type="number"
                                className="input"
                                value={babiesPerBatch}
                                onChange={(e) => setBabiesPerBatch(Math.max(1, parseInt(e.target.value) || 1))}
                            />
                        </div>
                    </div>

                    <div className="planner-results">
                        <div className="planner-result">
                            <span className="planner-result__icon">🥚</span>
                            <div>
                                <span className="planner-result__label">{isKorean ? '필요한 새끼' : 'Babies Needed'}</span>
                                <span className="planner-result__value">
                                    ~{babiesNeeded === Infinity ? '∞' : babiesNeeded.toLocaleString()}
                                </span>
                            </div>
                        </div>
                        <div className="planner-result">
                            <span className="planner-result__icon">🔄</span>
                            <div>
                                <span className="planner-result__label">{isKorean ? '필요한 배치' : 'Batches Needed'}</span>
                                <span className="planner-result__value">
                                    ~{batchesNeeded === Infinity ? '∞' : batchesNeeded.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mutation Tips */}
                <div className="mutation-tips">
                    <h4>💡 {isKorean ? '브리딩 팁' : 'Breeding Tips'}</h4>
                    <ul>
                        <li>{isKorean
                            ? '0/0 암컷(클린)을 사용하여 수컷에 돌연변이를 쌓으세요'
                            : 'Use 0/0 (clean) females to stack mutations on males'}
                        </li>
                        <li>{isKorean
                            ? '한 스탯당 최대 254 포인트(레벨 255 제한)'
                            : 'Max 254 points per stat (level 255 cap)'}
                        </li>
                        <li>{isKorean
                            ? '좋은 돌연변이가 나오면 즉시 백업 브리딩'
                            : 'Backup breed immediately when you get a good mutation'}
                        </li>
                    </ul>
                </div>
            </div>

            {/* Hatching Timer Modal */}
            {showHatchingTimer && <HatchingTimer onClose={() => setShowHatchingTimer(false)} />}
        </div>
    );
}
