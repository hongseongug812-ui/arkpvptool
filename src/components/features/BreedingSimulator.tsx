import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import './BreedingSimulator.css';

// Mutation mechanics constants
const MUTATION_CHANCE = 0.025; // 2.5% per parent stat
const STAT_POINTS_PER_MUT = 2;
const MAX_MUTATIONS = 20;

interface BreedingStats {
    health: number;
    stamina: number;
    weight: number;
    melee: number;
}

interface BreedingSimulatorProps {
    onClose: () => void;
}

export function BreedingSimulator({ onClose }: BreedingSimulatorProps) {
    const { i18n } = useTranslation();
    const isKorean = i18n.language === 'ko';

    const [parentA, setParentA] = useState<BreedingStats>({ health: 40, stamina: 30, weight: 30, melee: 40 });
    const [parentB, setParentB] = useState<BreedingStats>({ health: 38, stamina: 32, weight: 28, melee: 42 });
    const [targetMutations, setTargetMutations] = useState(20);
    const [simulationRuns, _setSimulationRuns] = useState(1000);
    const [results, setResults] = useState<{ avgGenerations: number; successRate: number; expectedOffspring: number } | null>(null);

    const statConfig = [
        { key: 'health' as keyof BreedingStats, label: isKorean ? '체력' : 'Health', icon: '❤️' },
        { key: 'stamina' as keyof BreedingStats, label: isKorean ? '기력' : 'Stamina', icon: '⚡' },
        { key: 'weight' as keyof BreedingStats, label: isKorean ? '무게' : 'Weight', icon: '📦' },
        { key: 'melee' as keyof BreedingStats, label: isKorean ? '근공' : 'Melee', icon: '⚔️' },
    ];

    // Calculate inheritance probability
    const inheritanceProbs = useMemo(() => {
        return statConfig.map(stat => {
            const a = parentA[stat.key];
            const b = parentB[stat.key];
            // Higher stat has 55% chance, same stats have 50%
            const highProb = a > b ? 0.55 : (b > a ? 0.45 : 0.5);
            return { ...stat, aProb: highProb, bProb: 1 - highProb, best: Math.max(a, b) };
        });
    }, [parentA, parentB]);

    // Simulate breeding
    const runSimulation = () => {
        let totalGenerations = 0;
        let successes = 0;
        let totalOffspring = 0;

        for (let run = 0; run < simulationRuns; run++) {
            let mutations = 0;
            let generation = 0;
            let offspring = 0;

            while (mutations < targetMutations && generation < 500) {
                generation++;
                offspring++;

                // Check each stat for mutation (simplified)
                for (let i = 0; i < 4; i++) {
                    if (Math.random() < MUTATION_CHANCE && mutations < MAX_MUTATIONS) {
                        mutations++;
                    }
                }
            }

            if (mutations >= targetMutations) {
                successes++;
                totalGenerations += generation;
                totalOffspring += offspring;
            }
        }

        setResults({
            avgGenerations: successes > 0 ? Math.round(totalGenerations / successes) : 0,
            successRate: (successes / simulationRuns) * 100,
            expectedOffspring: successes > 0 ? Math.round(totalOffspring / successes) : 0,
        });
    };

    // Expected mutations per breeding
    const expectedMutPerBreed = 4 * MUTATION_CHANCE * 2; // 4 stats, 2 parents

    return (
        <div className="breeding-overlay" onClick={onClose}>
            <div className="breeding-simulator" onClick={(e) => e.stopPropagation()}>
                <div className="breeding-simulator__header">
                    <h2>🧬 {isKorean ? '브리딩 시뮬레이터' : 'Breeding Simulator'}</h2>
                    <button className="breeding-simulator__close" onClick={onClose}>✕</button>
                </div>

                <div className="breeding-simulator__content">
                    {/* Parent Stats Input */}
                    <div className="breeding-parents">
                        <div className="breeding-parent">
                            <h3>👨 {isKorean ? '부모 A' : 'Parent A'}</h3>
                            {statConfig.map(stat => (
                                <div key={stat.key} className="stat-input">
                                    <span>{stat.icon} {stat.label}</span>
                                    <input
                                        type="number"
                                        className="input"
                                        value={parentA[stat.key]}
                                        onChange={(e) => setParentA({ ...parentA, [stat.key]: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                            ))}
                        </div>
                        <div className="breeding-vs">VS</div>
                        <div className="breeding-parent">
                            <h3>👩 {isKorean ? '부모 B' : 'Parent B'}</h3>
                            {statConfig.map(stat => (
                                <div key={stat.key} className="stat-input">
                                    <span>{stat.icon} {stat.label}</span>
                                    <input
                                        type="number"
                                        className="input"
                                        value={parentB[stat.key]}
                                        onChange={(e) => setParentB({ ...parentB, [stat.key]: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Inheritance Probabilities */}
                    <div className="breeding-probs">
                        <h3>📊 {isKorean ? '상속 확률' : 'Inheritance Probability'}</h3>
                        {inheritanceProbs.map(prob => (
                            <div key={prob.key} className="prob-row">
                                <span>{prob.icon} {prob.label}</span>
                                <div className="prob-bar">
                                    <div className="prob-a" style={{ width: `${prob.aProb * 100}%` }}>
                                        A: {Math.round(prob.aProb * 100)}%
                                    </div>
                                    <div className="prob-b" style={{ width: `${prob.bProb * 100}%` }}>
                                        B: {Math.round(prob.bProb * 100)}%
                                    </div>
                                </div>
                                <span className="best-stat">👑 {prob.best}pt</span>
                            </div>
                        ))}
                    </div>

                    {/* Mutation Calculator */}
                    <div className="breeding-mutation">
                        <h3>🎲 {isKorean ? '돌연변이 계산' : 'Mutation Calculator'}</h3>
                        <div className="mutation-config">
                            <div className="mutation-input">
                                <label>{isKorean ? '목표 돌연변이' : 'Target Mutations'}</label>
                                <input
                                    type="number"
                                    className="input"
                                    value={targetMutations}
                                    onChange={(e) => setTargetMutations(Math.min(MAX_MUTATIONS, parseInt(e.target.value) || 0))}
                                    max={MAX_MUTATIONS}
                                />
                            </div>
                            <button className="btn btn--primary" onClick={runSimulation}>
                                🔬 {isKorean ? '시뮬레이션' : 'Simulate'}
                            </button>
                        </div>

                        <div className="mutation-info">
                            <div className="info-item">
                                <span className="info-label">{isKorean ? '돌연변이 확률/스탯' : 'Mutation %/stat'}</span>
                                <span className="info-value">{(MUTATION_CHANCE * 100).toFixed(1)}%</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">{isKorean ? '예상 돌연변이/교배' : 'Expected mut/breed'}</span>
                                <span className="info-value">{expectedMutPerBreed.toFixed(2)}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">{isKorean ? '스탯 증가/돌연변이' : 'Stat points/mut'}</span>
                                <span className="info-value">+{STAT_POINTS_PER_MUT}</span>
                            </div>
                        </div>

                        {results && (
                            <div className="simulation-results">
                                <h4>📈 {isKorean ? '시뮬레이션 결과' : 'Simulation Results'}</h4>
                                <div className="result-grid">
                                    <div className="result-item">
                                        <span className="result-label">{isKorean ? '평균 세대' : 'Avg Generations'}</span>
                                        <span className="result-value">{results.avgGenerations}</span>
                                    </div>
                                    <div className="result-item">
                                        <span className="result-label">{isKorean ? '성공률' : 'Success Rate'}</span>
                                        <span className="result-value">{results.successRate.toFixed(1)}%</span>
                                    </div>
                                    <div className="result-item">
                                        <span className="result-label">{isKorean ? '예상 자손 수' : 'Expected Offspring'}</span>
                                        <span className="result-value">{results.expectedOffspring}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
