import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import './FoodCalculator.css';

// Ingredient types
interface Ingredient {
    id: string;
    nameKr: string;
    nameEn: string;
    icon: string;
}

interface Recipe {
    id: string;
    nameKr: string;
    nameEn: string;
    icon: string;
    category: 'kibble' | 'food' | 'consumable' | 'custom';
    ingredients: { ingredientId: string; amount: number }[];
    result: number;
    note?: string;
}

// All ingredients
const INGREDIENTS: Record<string, Ingredient> = {
    // Meats
    raw_meat: { id: 'raw_meat', nameKr: '생고기', nameEn: 'Raw Meat', icon: '🥩' },
    cooked_meat: { id: 'cooked_meat', nameKr: '익힌 고기', nameEn: 'Cooked Meat', icon: '🍖' },
    raw_prime: { id: 'raw_prime', nameKr: '최상급 생고기', nameEn: 'Raw Prime Meat', icon: '🥩' },
    cooked_prime: { id: 'cooked_prime', nameKr: '익힌 최상급 고기', nameEn: 'Cooked Prime Meat', icon: '🍖' },
    raw_fish: { id: 'raw_fish', nameKr: '생선회', nameEn: 'Raw Fish Meat', icon: '🐟' },
    cooked_fish: { id: 'cooked_fish', nameKr: '익힌 생선', nameEn: 'Cooked Fish', icon: '🍣' },
    jerky: { id: 'jerky', nameKr: '육포', nameEn: 'Cooked Meat Jerky', icon: '🥓' },
    prime_jerky: { id: 'prime_jerky', nameKr: '최상급 육포', nameEn: 'Prime Meat Jerky', icon: '🥓' },

    // Eggs
    extra_small_egg: { id: 'extra_small_egg', nameKr: '아주 작은 알', nameEn: 'Extra Small Egg', icon: '🥚' },
    small_egg: { id: 'small_egg', nameKr: '작은 알', nameEn: 'Small Egg', icon: '🥚' },
    medium_egg: { id: 'medium_egg', nameKr: '중간 알', nameEn: 'Medium Egg', icon: '🥚' },
    large_egg: { id: 'large_egg', nameKr: '큰 알', nameEn: 'Large Egg', icon: '🥚' },
    extra_large_egg: { id: 'extra_large_egg', nameKr: '아주 큰 알', nameEn: 'Extra Large Egg', icon: '🥚' },
    special_egg: { id: 'special_egg', nameKr: '특수 알', nameEn: 'Special Egg', icon: '🥚' },

    // Vegetables & Fruits
    mejoberry: { id: 'mejoberry', nameKr: '메조베리', nameEn: 'Mejoberry', icon: '🫐' },
    tintoberry: { id: 'tintoberry', nameKr: '틴토베리', nameEn: 'Tintoberry', icon: '🍇' },
    amarberry: { id: 'amarberry', nameKr: '아마르베리', nameEn: 'Amarberry', icon: '🍒' },
    azulberry: { id: 'azulberry', nameKr: '아줄베리', nameEn: 'Azulberry', icon: '🫐' },
    stimberry: { id: 'stimberry', nameKr: '스팀베리', nameEn: 'Stimberry', icon: '🍓' },
    narcoberry: { id: 'narcoberry', nameKr: '나코베리', nameEn: 'Narcoberry', icon: '🍇' },
    rockarrot: { id: 'rockarrot', nameKr: '록캐롯', nameEn: 'Rockarrot', icon: '🥕' },
    longrass: { id: 'longrass', nameKr: '롱그라스', nameEn: 'Longrass', icon: '🌾' },
    savoroot: { id: 'savoroot', nameKr: '세이보루트', nameEn: 'Savoroot', icon: '🥔' },
    citronal: { id: 'citronal', nameKr: '시트로날', nameEn: 'Citronal', icon: '🍋' },

    // Other
    fiber: { id: 'fiber', nameKr: '섬유', nameEn: 'Fiber', icon: '🧵' },
    thatch: { id: 'thatch', nameKr: '초가', nameEn: 'Thatch', icon: '🌿' },
    water: { id: 'water', nameKr: '물', nameEn: 'Water', icon: '💧' },
    oil: { id: 'oil', nameKr: '오일', nameEn: 'Oil', icon: '🛢️' },
    sparkpowder: { id: 'sparkpowder', nameKr: '스파크파우더', nameEn: 'Sparkpowder', icon: '✨' },
    honey: { id: 'honey', nameKr: '꿀', nameEn: 'Giant Bee Honey', icon: '🍯' },
    rare_mushroom: { id: 'rare_mushroom', nameKr: '희귀 버섯', nameEn: 'Rare Mushroom', icon: '🍄' },
    rare_flower: { id: 'rare_flower', nameKr: '희귀 꽃', nameEn: 'Rare Flower', icon: '🌸' },
    sap: { id: 'sap', nameKr: '수액', nameEn: 'Sap', icon: '🧴' },
    polymer: { id: 'polymer', nameKr: '폴리머', nameEn: 'Polymer', icon: '🔷' },
    organic_polymer: { id: 'organic_polymer', nameKr: '유기 폴리머', nameEn: 'Organic Polymer', icon: '🦭' },
    focal_chili: { id: 'focal_chili', nameKr: '포컬 칠리', nameEn: 'Focal Chili', icon: '🌶️' },
};

// Recipes
const RECIPES: Recipe[] = [
    // Kibbles (ASA Simplified)
    {
        id: 'basic_kibble', nameKr: '기본 키블', nameEn: 'Basic Kibble', icon: '🥣', category: 'kibble',
        ingredients: [{ ingredientId: 'extra_small_egg', amount: 1 }, { ingredientId: 'cooked_meat', amount: 1 }, { ingredientId: 'amarberry', amount: 10 }, { ingredientId: 'mejoberry', amount: 5 }, { ingredientId: 'tintoberry', amount: 10 }, { ingredientId: 'fiber', amount: 5 }], result: 1
    },
    {
        id: 'simple_kibble', nameKr: '간단 키블', nameEn: 'Simple Kibble', icon: '🥣', category: 'kibble',
        ingredients: [{ ingredientId: 'small_egg', amount: 1 }, { ingredientId: 'cooked_fish', amount: 1 }, { ingredientId: 'rockarrot', amount: 2 }, { ingredientId: 'mejoberry', amount: 5 }], result: 1
    },
    {
        id: 'regular_kibble', nameKr: '일반 키블', nameEn: 'Regular Kibble', icon: '🥣', category: 'kibble',
        ingredients: [{ ingredientId: 'medium_egg', amount: 1 }, { ingredientId: 'jerky', amount: 1 }, { ingredientId: 'longrass', amount: 2 }, { ingredientId: 'savoroot', amount: 2 }], result: 1
    },
    {
        id: 'superior_kibble', nameKr: '상급 키블', nameEn: 'Superior Kibble', icon: '🥣', category: 'kibble',
        ingredients: [{ ingredientId: 'large_egg', amount: 1 }, { ingredientId: 'prime_jerky', amount: 1 }, { ingredientId: 'citronal', amount: 2 }, { ingredientId: 'sap', amount: 2 }, { ingredientId: 'rare_mushroom', amount: 2 }], result: 1
    },
    {
        id: 'exceptional_kibble', nameKr: '특상급 키블', nameEn: 'Exceptional Kibble', icon: '🥣', category: 'kibble',
        ingredients: [{ ingredientId: 'extra_large_egg', amount: 1 }, { ingredientId: 'prime_jerky', amount: 1 }, { ingredientId: 'focal_chili', amount: 1 }, { ingredientId: 'rare_flower', amount: 10 }, { ingredientId: 'mejoberry', amount: 10 }], result: 1
    },
    {
        id: 'extraordinary_kibble', nameKr: '최상급 키블', nameEn: 'Extraordinary Kibble', icon: '🥣', category: 'kibble',
        ingredients: [{ ingredientId: 'special_egg', amount: 1 }, { ingredientId: 'honey', amount: 1 }, { ingredientId: 'rare_flower', amount: 10 }, { ingredientId: 'rare_mushroom', amount: 10 }, { ingredientId: 'mejoberry', amount: 10 }], result: 1
    },

    // Foods
    {
        id: 'focal_chili', nameKr: '포컬 칠리', nameEn: 'Focal Chili', icon: '🌶️', category: 'food',
        ingredients: [{ ingredientId: 'cooked_meat', amount: 9 }, { ingredientId: 'citronal', amount: 5 }, { ingredientId: 'tintoberry', amount: 20 }, { ingredientId: 'amarberry', amount: 20 }, { ingredientId: 'azulberry', amount: 20 }, { ingredientId: 'mejoberry', amount: 10 }, { ingredientId: 'water', amount: 1 }], result: 1, note: '+25% 속도, 15분'
    },
    {
        id: 'enduro_stew', nameKr: '인듀로 스튜', nameEn: 'Enduro Stew', icon: '🍲', category: 'food',
        ingredients: [{ ingredientId: 'cooked_meat', amount: 9 }, { ingredientId: 'rockarrot', amount: 5 }, { ingredientId: 'savoroot', amount: 5 }, { ingredientId: 'mejoberry', amount: 10 }, { ingredientId: 'stimberry', amount: 10 }, { ingredientId: 'water', amount: 1 }], result: 1, note: '+15% 근접, 15분'
    },
    {
        id: 'lazarus_chowder', nameKr: '라자루스 차우더', nameEn: 'Lazarus Chowder', icon: '🥘', category: 'food',
        ingredients: [{ ingredientId: 'cooked_meat', amount: 9 }, { ingredientId: 'savoroot', amount: 5 }, { ingredientId: 'longrass', amount: 5 }, { ingredientId: 'mejoberry', amount: 10 }, { ingredientId: 'narcoberry', amount: 10 }, { ingredientId: 'water', amount: 1 }], result: 1, note: '산소 소모 15% 감소, 10분'
    },
    {
        id: 'calien_soup', nameKr: '칼리엔 수프', nameEn: 'Calien Soup', icon: '🍜', category: 'food',
        ingredients: [{ ingredientId: 'citronal', amount: 5 }, { ingredientId: 'tintoberry', amount: 20 }, { ingredientId: 'amarberry', amount: 20 }, { ingredientId: 'mejoberry', amount: 10 }, { ingredientId: 'stimberry', amount: 10 }, { ingredientId: 'water', amount: 1 }], result: 1, note: '열 저항, 15분'
    },
    {
        id: 'fria_curry', nameKr: '프리아 커리', nameEn: 'Fria Curry', icon: '🍛', category: 'food',
        ingredients: [{ ingredientId: 'citronal', amount: 5 }, { ingredientId: 'longrass', amount: 5 }, { ingredientId: 'rockarrot', amount: 5 }, { ingredientId: 'azulberry', amount: 20 }, { ingredientId: 'mejoberry', amount: 10 }, { ingredientId: 'water', amount: 1 }], result: 1, note: '냉기 저항, 15분'
    },

    // Consumables
    {
        id: 'narcotic', nameKr: '마취약', nameEn: 'Narcotic', icon: '💊', category: 'consumable',
        ingredients: [{ ingredientId: 'narcoberry', amount: 5 }, { ingredientId: 'sparkpowder', amount: 1 }], result: 1
    },
    {
        id: 'stimulant', nameKr: '각성제', nameEn: 'Stimulant', icon: '💉', category: 'consumable',
        ingredients: [{ ingredientId: 'stimberry', amount: 5 }, { ingredientId: 'sparkpowder', amount: 2 }], result: 1
    },
    {
        id: 'medical_brew', nameKr: '치료약', nameEn: 'Medical Brew', icon: '🧪', category: 'consumable',
        ingredients: [{ ingredientId: 'tintoberry', amount: 20 }, { ingredientId: 'narcoberry', amount: 2 }, { ingredientId: 'water', amount: 1 }], result: 1, note: '+40 HP'
    },
    {
        id: 'energy_brew', nameKr: '에너지 음료', nameEn: 'Energy Brew', icon: '⚡', category: 'consumable',
        ingredients: [{ ingredientId: 'stimberry', amount: 20 }, { ingredientId: 'azulberry', amount: 2 }, { ingredientId: 'water', amount: 1 }], result: 1, note: '+40 스태미나'
    },
];

const CATEGORIES = [
    { id: 'all', labelKr: '전체', labelEn: 'All', icon: '📋' },
    { id: 'kibble', labelKr: '키블', labelEn: 'Kibble', icon: '🥣' },
    { id: 'food', labelKr: '음식', labelEn: 'Food', icon: '🍲' },
    { id: 'consumable', labelKr: '소모품', labelEn: 'Consumables', icon: '💊' },
];

export function FoodCalculator() {
    const { i18n } = useTranslation();
    const isKorean = i18n.language === 'ko';

    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [quantities, setQuantities] = useState<Record<string, number>>({});

    const filteredRecipes = useMemo(() => {
        if (selectedCategory === 'all') return RECIPES;
        return RECIPES.filter(r => r.category === selectedCategory);
    }, [selectedCategory]);

    const totalIngredients = useMemo(() => {
        const totals: Record<string, number> = {};

        for (const [recipeId, qty] of Object.entries(quantities)) {
            if (qty <= 0) continue;
            const recipe = RECIPES.find(r => r.id === recipeId);
            if (!recipe) continue;

            for (const ing of recipe.ingredients) {
                totals[ing.ingredientId] = (totals[ing.ingredientId] || 0) + (ing.amount * qty);
            }
        }

        return totals;
    }, [quantities]);

    const hasAnyQuantity = Object.values(quantities).some(q => q > 0);

    const updateQuantity = (recipeId: string, delta: number) => {
        setQuantities(prev => ({
            ...prev,
            [recipeId]: Math.max(0, (prev[recipeId] || 0) + delta)
        }));
    };

    const setQuantity = (recipeId: string, value: number) => {
        setQuantities(prev => ({
            ...prev,
            [recipeId]: Math.max(0, value)
        }));
    };

    const clearAll = () => setQuantities({});

    return (
        <div className="food-calculator">
            {/* Header */}
            <div className="food-header">
                <h2>🍳 {isKorean ? '음식 재료 계산기' : 'Food Calculator'}</h2>
                <p>{isKorean ? '필요한 수량을 입력하면 총 재료를 계산합니다' : 'Enter quantities to calculate total ingredients'}</p>
            </div>

            {/* Category Filter */}
            <div className="food-categories">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat.id}
                        className={`food-category-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                        onClick={() => setSelectedCategory(cat.id)}
                    >
                        {cat.icon} {isKorean ? cat.labelKr : cat.labelEn}
                    </button>
                ))}
            </div>

            <div className="food-content">
                {/* Recipe List */}
                <div className="food-recipes">
                    <div className="food-recipes__header">
                        <h3>{isKorean ? '레시피' : 'Recipes'}</h3>
                        {hasAnyQuantity && (
                            <button className="food-clear-btn" onClick={clearAll}>
                                🗑️ {isKorean ? '초기화' : 'Clear'}
                            </button>
                        )}
                    </div>
                    <div className="food-recipes__list">
                        {filteredRecipes.map(recipe => (
                            <div key={recipe.id} className={`food-recipe-card ${(quantities[recipe.id] || 0) > 0 ? 'active' : ''}`}>
                                <div className="food-recipe-card__info">
                                    <span className="food-recipe-card__icon">{recipe.icon}</span>
                                    <div className="food-recipe-card__text">
                                        <span className="food-recipe-card__name">
                                            {isKorean ? recipe.nameKr : recipe.nameEn}
                                        </span>
                                        {recipe.note && (
                                            <span className="food-recipe-card__note">{recipe.note}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="food-recipe-card__controls">
                                    <button onClick={() => updateQuantity(recipe.id, -1)}>−</button>
                                    <input
                                        type="number"
                                        value={quantities[recipe.id] || 0}
                                        onChange={(e) => setQuantity(recipe.id, parseInt(e.target.value) || 0)}
                                        min={0}
                                    />
                                    <button onClick={() => updateQuantity(recipe.id, 1)}>+</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Total Ingredients */}
                <div className="food-totals">
                    <h3>📦 {isKorean ? '필요 재료' : 'Required Ingredients'}</h3>
                    {hasAnyQuantity ? (
                        <div className="food-totals__list">
                            {Object.entries(totalIngredients)
                                .sort(([, a], [, b]) => b - a)
                                .map(([ingId, amount]) => {
                                    const ing = INGREDIENTS[ingId];
                                    if (!ing) return null;
                                    return (
                                        <div key={ingId} className="food-total-item">
                                            <span className="food-total-item__icon">{ing.icon}</span>
                                            <span className="food-total-item__name">
                                                {isKorean ? ing.nameKr : ing.nameEn}
                                            </span>
                                            <span className="food-total-item__amount">×{amount}</span>
                                        </div>
                                    );
                                })}
                        </div>
                    ) : (
                        <div className="food-totals__empty">
                            <span>🍽️</span>
                            <p>{isKorean ? '레시피 수량을 입력하세요' : 'Enter recipe quantities'}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
