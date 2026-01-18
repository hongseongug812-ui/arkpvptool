import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import './FoodCalculator.css';

interface Recipe {
    id: string;
    nameKr: string;
    nameEn: string;
    icon: string;
    category: 'kibble' | 'food' | 'consumable' | 'dye' | 'other';
    tier?: string;
    ingredients: { name: string; nameKr: string; amount: number; icon: string }[];
    effect?: string;
    effectKr?: string;
    craftedIn?: string;
}

// All ARK Recipes
const RECIPES: Recipe[] = [
    // ========== KIBBLES ==========
    {
        id: 'basic_kibble', nameKr: '기본 키블', nameEn: 'Basic Kibble', icon: '🥣', category: 'kibble', tier: 'Basic',
        craftedIn: 'Cooking Pot',
        ingredients: [
            { name: 'Extra Small Egg', nameKr: '아주 작은 알', amount: 1, icon: '🥚' },
            { name: 'Cooked Meat', nameKr: '익힌 고기', amount: 1, icon: '🍖' },
            { name: 'Amarberry', nameKr: '아마르베리', amount: 10, icon: '🍒' },
            { name: 'Tintoberry', nameKr: '틴토베리', amount: 10, icon: '🍇' },
            { name: 'Mejoberry', nameKr: '메조베리', amount: 5, icon: '🫐' },
            { name: 'Fiber', nameKr: '섬유', amount: 5, icon: '🧵' },
            { name: 'Water', nameKr: '물', amount: 1, icon: '💧' },
        ]
    },
    {
        id: 'simple_kibble', nameKr: '간단 키블', nameEn: 'Simple Kibble', icon: '🥣', category: 'kibble', tier: 'Simple',
        craftedIn: 'Cooking Pot',
        ingredients: [
            { name: 'Small Egg', nameKr: '작은 알', amount: 1, icon: '🥚' },
            { name: 'Cooked Fish', nameKr: '익힌 생선', amount: 1, icon: '🐟' },
            { name: 'Rockarrot', nameKr: '록캐롯', amount: 2, icon: '🥕' },
            { name: 'Mejoberry', nameKr: '메조베리', amount: 5, icon: '🫐' },
            { name: 'Fiber', nameKr: '섬유', amount: 5, icon: '🧵' },
            { name: 'Water', nameKr: '물', amount: 1, icon: '💧' },
        ]
    },
    {
        id: 'regular_kibble', nameKr: '일반 키블', nameEn: 'Regular Kibble', icon: '🥣', category: 'kibble', tier: 'Regular',
        craftedIn: 'Cooking Pot',
        ingredients: [
            { name: 'Medium Egg', nameKr: '중간 알', amount: 1, icon: '🥚' },
            { name: 'Cooked Meat Jerky', nameKr: '육포', amount: 1, icon: '🥓' },
            { name: 'Longrass', nameKr: '롱그라스', amount: 2, icon: '🌾' },
            { name: 'Savoroot', nameKr: '세이보루트', amount: 2, icon: '🥔' },
            { name: 'Fiber', nameKr: '섬유', amount: 5, icon: '🧵' },
            { name: 'Water', nameKr: '물', amount: 1, icon: '💧' },
        ]
    },
    {
        id: 'superior_kibble', nameKr: '상급 키블', nameEn: 'Superior Kibble', icon: '🥣', category: 'kibble', tier: 'Superior',
        craftedIn: 'Cooking Pot',
        ingredients: [
            { name: 'Large Egg', nameKr: '큰 알', amount: 1, icon: '🥚' },
            { name: 'Prime Meat Jerky', nameKr: '최상급 육포', amount: 1, icon: '🥓' },
            { name: 'Citronal', nameKr: '시트로날', amount: 2, icon: '🍋' },
            { name: 'Rare Mushroom', nameKr: '희귀 버섯', amount: 2, icon: '🍄' },
            { name: 'Sap', nameKr: '수액', amount: 2, icon: '🧴' },
            { name: 'Fiber', nameKr: '섬유', amount: 5, icon: '🧵' },
            { name: 'Water', nameKr: '물', amount: 1, icon: '💧' },
        ]
    },
    {
        id: 'exceptional_kibble', nameKr: '특상급 키블', nameEn: 'Exceptional Kibble', icon: '🥣', category: 'kibble', tier: 'Exceptional',
        craftedIn: 'Cooking Pot',
        ingredients: [
            { name: 'Extra Large Egg', nameKr: '아주 큰 알', amount: 1, icon: '🥚' },
            { name: 'Focal Chili', nameKr: '포컬 칠리', amount: 1, icon: '🌶️' },
            { name: 'Rare Flower', nameKr: '희귀 꽃', amount: 10, icon: '🌸' },
            { name: 'Mejoberry', nameKr: '메조베리', amount: 10, icon: '🫐' },
            { name: 'Fiber', nameKr: '섬유', amount: 5, icon: '🧵' },
            { name: 'Water', nameKr: '물', amount: 1, icon: '💧' },
        ]
    },
    {
        id: 'extraordinary_kibble', nameKr: '최상급 키블', nameEn: 'Extraordinary Kibble', icon: '🥣', category: 'kibble', tier: 'Extraordinary',
        craftedIn: 'Cooking Pot',
        ingredients: [
            { name: 'Special Egg', nameKr: '특수 알', amount: 1, icon: '🥚' },
            { name: 'Giant Bee Honey', nameKr: '꿀', amount: 1, icon: '🍯' },
            { name: 'Lazarus Chowder', nameKr: '라자루스 차우더', amount: 1, icon: '🥘' },
            { name: 'Mejoberry', nameKr: '메조베리', amount: 10, icon: '🫐' },
            { name: 'Fiber', nameKr: '섬유', amount: 5, icon: '🧵' },
            { name: 'Water', nameKr: '물', amount: 1, icon: '💧' },
        ]
    },

    // ========== FOODS (Stat Buffs) ==========
    {
        id: 'focal_chili', nameKr: '포컬 칠리', nameEn: 'Focal Chili', icon: '🌶️', category: 'food',
        effect: '+25% Movement Speed, +100% Crafting Speed for 15 min', effectKr: '이동속도 +25%, 제작속도 +100% (15분)',
        craftedIn: 'Cooking Pot',
        ingredients: [
            { name: 'Cooked Meat', nameKr: '익힌 고기', amount: 9, icon: '🍖' },
            { name: 'Citronal', nameKr: '시트로날', amount: 5, icon: '🍋' },
            { name: 'Tintoberry', nameKr: '틴토베리', amount: 20, icon: '🍇' },
            { name: 'Amarberry', nameKr: '아마르베리', amount: 20, icon: '🍒' },
            { name: 'Azulberry', nameKr: '아줄베리', amount: 20, icon: '🫐' },
            { name: 'Mejoberry', nameKr: '메조베리', amount: 10, icon: '🫐' },
            { name: 'Water', nameKr: '물', amount: 1, icon: '💧' },
        ]
    },
    {
        id: 'enduro_stew', nameKr: '인듀로 스튜', nameEn: 'Enduro Stew', icon: '🍲', category: 'food',
        effect: '+1.2 HP/sec, +15% Melee for 15 min', effectKr: 'HP회복 +1.2/초, 근접공격 +15% (15분)',
        craftedIn: 'Cooking Pot',
        ingredients: [
            { name: 'Cooked Meat', nameKr: '익힌 고기', amount: 9, icon: '🍖' },
            { name: 'Rockarrot', nameKr: '록캐롯', amount: 5, icon: '🥕' },
            { name: 'Savoroot', nameKr: '세이보루트', amount: 5, icon: '🥔' },
            { name: 'Mejoberry', nameKr: '메조베리', amount: 10, icon: '🫐' },
            { name: 'Stimberry', nameKr: '스팀베리', amount: 10, icon: '🍓' },
            { name: 'Water', nameKr: '물', amount: 1, icon: '💧' },
        ]
    },
    {
        id: 'lazarus_chowder', nameKr: '라자루스 차우더', nameEn: 'Lazarus Chowder', icon: '🥘', category: 'food',
        effect: '-85% Oxygen consumption, +1.5 Stamina/sec for 10 min', effectKr: '산소 소모 -85%, 기력회복 +1.5/초 (10분)',
        craftedIn: 'Cooking Pot',
        ingredients: [
            { name: 'Cooked Meat', nameKr: '익힌 고기', amount: 9, icon: '🍖' },
            { name: 'Savoroot', nameKr: '세이보루트', amount: 5, icon: '🥔' },
            { name: 'Longrass', nameKr: '롱그라스', amount: 5, icon: '🌾' },
            { name: 'Mejoberry', nameKr: '메조베리', amount: 10, icon: '🫐' },
            { name: 'Narcoberry', nameKr: '나코베리', amount: 10, icon: '🍇' },
            { name: 'Water', nameKr: '물', amount: 1, icon: '💧' },
        ]
    },
    {
        id: 'calien_soup', nameKr: '칼리엔 수프', nameEn: 'Calien Soup', icon: '🍜', category: 'food',
        effect: '+50 Hyperthermal Insulation for 15 min', effectKr: '열 저항 +50 (15분)',
        craftedIn: 'Cooking Pot',
        ingredients: [
            { name: 'Citronal', nameKr: '시트로날', amount: 5, icon: '🍋' },
            { name: 'Tintoberry', nameKr: '틴토베리', amount: 20, icon: '🍇' },
            { name: 'Amarberry', nameKr: '아마르베리', amount: 20, icon: '🍒' },
            { name: 'Mejoberry', nameKr: '메조베리', amount: 10, icon: '🫐' },
            { name: 'Stimberry', nameKr: '스팀베리', amount: 10, icon: '🍓' },
            { name: 'Water', nameKr: '물', amount: 1, icon: '💧' },
        ]
    },
    {
        id: 'fria_curry', nameKr: '프리아 커리', nameEn: 'Fria Curry', icon: '🍛', category: 'food',
        effect: '+50 Hypothermal Insulation for 15 min', effectKr: '냉기 저항 +50 (15분)',
        craftedIn: 'Cooking Pot',
        ingredients: [
            { name: 'Longrass', nameKr: '롱그라스', amount: 5, icon: '🌾' },
            { name: 'Rockarrot', nameKr: '록캐롯', amount: 5, icon: '🥕' },
            { name: 'Azulberry', nameKr: '아줄베리', amount: 20, icon: '🫐' },
            { name: 'Mejoberry', nameKr: '메조베리', amount: 10, icon: '🫐' },
            { name: 'Water', nameKr: '물', amount: 1, icon: '💧' },
        ]
    },
    {
        id: 'shadow_steak', nameKr: '쉐도우 스테이크', nameEn: 'Shadow Steak Saute', icon: '🥩', category: 'food',
        effect: '+50 Hypothermal, Removes Blind effect for 3 min', effectKr: '눈부심 효과 제거, 냉기 저항 +50 (3분)',
        craftedIn: 'Cooking Pot',
        ingredients: [
            { name: 'Cooked Prime Meat', nameKr: '익힌 최상급', amount: 3, icon: '🍖' },
            { name: 'Mejoberry', nameKr: '메조베리', amount: 20, icon: '🫐' },
            { name: 'Narcoberry', nameKr: '나코베리', amount: 20, icon: '🍇' },
            { name: 'Rare Mushroom', nameKr: '희귀 버섯', amount: 2, icon: '🍄' },
            { name: 'Rare Flower', nameKr: '희귀 꽃', amount: 2, icon: '🌸' },
            { name: 'Savoroot', nameKr: '세이보루트', amount: 1, icon: '🥔' },
            { name: 'Water', nameKr: '물', amount: 1, icon: '💧' },
        ]
    },
    {
        id: 'battle_tartare', nameKr: '배틀 타르타르', nameEn: 'Battle Tartare', icon: '🍖', category: 'food',
        effect: '+60% Melee, +50% Resist, -90% HP regen for 3 min', effectKr: '근접 +60%, 저항 +50%, HP회복 -90% (3분)',
        craftedIn: 'Cooking Pot',
        ingredients: [
            { name: 'Raw Prime Meat', nameKr: '최상급 생고기', amount: 3, icon: '🥩' },
            { name: 'Mejoberry', nameKr: '메조베리', amount: 20, icon: '🫐' },
            { name: 'Stimberry', nameKr: '스팀베리', amount: 20, icon: '🍓' },
            { name: 'Rare Mushroom', nameKr: '희귀 버섯', amount: 2, icon: '🍄' },
            { name: 'Rare Flower', nameKr: '희귀 꽃', amount: 2, icon: '🌸' },
            { name: 'Rockarrot', nameKr: '록캐롯', amount: 1, icon: '🥕' },
            { name: 'Water', nameKr: '물', amount: 1, icon: '💧' },
        ]
    },
    {
        id: 'mindwipe_tonic', nameKr: '마인드와이프 토닉', nameEn: 'Mindwipe Tonic', icon: '🧠', category: 'food',
        effect: 'Reset Engrams and Stat Points', effectKr: '스탯 및 엔그램 초기화',
        craftedIn: 'Cooking Pot',
        ingredients: [
            { name: 'Cooked Prime Meat', nameKr: '익힌 최상급', amount: 24, icon: '🍖' },
            { name: 'Mejoberry', nameKr: '메조베리', amount: 200, icon: '🫐' },
            { name: 'Narcoberry', nameKr: '나코베리', amount: 72, icon: '🍇' },
            { name: 'Stimberry', nameKr: '스팀베리', amount: 72, icon: '🍓' },
            { name: 'Rare Mushroom', nameKr: '희귀 버섯', amount: 24, icon: '🍄' },
            { name: 'Rare Flower', nameKr: '희귀 꽃', amount: 24, icon: '🌸' },
            { name: 'Water', nameKr: '물', amount: 1, icon: '💧' },
        ]
    },

    // ========== CONSUMABLES ==========
    {
        id: 'narcotic', nameKr: '마취약', nameEn: 'Narcotic', icon: '💊', category: 'consumable',
        effect: '+40 Torpor', effectKr: '기절도 +40',
        craftedIn: 'Mortar & Pestle',
        ingredients: [
            { name: 'Narcoberry', nameKr: '나코베리', amount: 5, icon: '🍇' },
            { name: 'Spoiled Meat', nameKr: '썩은 고기', amount: 1, icon: '🤢' },
        ]
    },
    {
        id: 'stimulant', nameKr: '각성제', nameEn: 'Stimulant', icon: '💉', category: 'consumable',
        effect: '-40 Torpor, -15 Water', effectKr: '기절도 -40, 수분 -15',
        craftedIn: 'Mortar & Pestle',
        ingredients: [
            { name: 'Stimberry', nameKr: '스팀베리', amount: 5, icon: '🍓' },
            { name: 'Sparkpowder', nameKr: '스파크파우더', amount: 2, icon: '✨' },
        ]
    },
    {
        id: 'medical_brew', nameKr: '치료약', nameEn: 'Medical Brew', icon: '🧪', category: 'consumable',
        effect: '+40 HP over 5 sec', effectKr: 'HP +40 (5초)',
        craftedIn: 'Cooking Pot',
        ingredients: [
            { name: 'Tintoberry', nameKr: '틴토베리', amount: 20, icon: '🍇' },
            { name: 'Narcoberry', nameKr: '나코베리', amount: 2, icon: '🍇' },
            { name: 'Water', nameKr: '물', amount: 1, icon: '💧' },
        ]
    },
    {
        id: 'energy_brew', nameKr: '에너지 음료', nameEn: 'Energy Brew', icon: '⚡', category: 'consumable',
        effect: '+40 Stamina', effectKr: '기력 +40',
        craftedIn: 'Cooking Pot',
        ingredients: [
            { name: 'Azulberry', nameKr: '아줄베리', amount: 20, icon: '🫐' },
            { name: 'Stimberry', nameKr: '스팀베리', amount: 2, icon: '🍓' },
            { name: 'Water', nameKr: '물', amount: 1, icon: '💧' },
        ]
    },
    {
        id: 'sweet_cake', nameKr: '스위트 케이크', nameEn: 'Sweet Vegetable Cake', icon: '🍰', category: 'consumable',
        effect: 'Heals herbivores +500 HP, Achatina food', effectKr: '초식공룡 HP +500, 아카티나 먹이',
        craftedIn: 'Cooking Pot',
        ingredients: [
            { name: 'Giant Bee Honey', nameKr: '꿀', amount: 2, icon: '🍯' },
            { name: 'Sap', nameKr: '수액', amount: 4, icon: '🧴' },
            { name: 'Rockarrot', nameKr: '록캐롯', amount: 2, icon: '🥕' },
            { name: 'Longrass', nameKr: '롱그라스', amount: 2, icon: '🌾' },
            { name: 'Savoroot', nameKr: '세이보루트', amount: 2, icon: '🥔' },
            { name: 'Citronal', nameKr: '시트로날', amount: 2, icon: '🍋' },
            { name: 'Stimulant', nameKr: '각성제', amount: 4, icon: '💉' },
            { name: 'Fiber', nameKr: '섬유', amount: 25, icon: '🧵' },
            { name: 'Water', nameKr: '물', amount: 1, icon: '💧' },
        ]
    },
    {
        id: 'wyvern_milk', nameKr: '와이번 밀크', nameEn: 'Wyvern Milk', icon: '🥛', category: 'consumable',
        effect: 'For raising baby Wyverns', effectKr: '와이번 새끼 양육용',
        craftedIn: 'Alpha Wyvern',
        ingredients: [
            { name: 'From Alpha Wyvern', nameKr: '알파 와이번에서 획득', amount: 5, icon: '🐉' },
        ]
    },

    // ========== OTHER ==========
    {
        id: 'jerky', nameKr: '육포', nameEn: 'Cooked Meat Jerky', icon: '🥓', category: 'other',
        craftedIn: 'Preserving Bin',
        ingredients: [
            { name: 'Cooked Meat', nameKr: '익힌 고기', amount: 1, icon: '🍖' },
            { name: 'Oil', nameKr: '오일', amount: 1, icon: '🛢️' },
            { name: 'Sparkpowder', nameKr: '스파크파우더', amount: 3, icon: '✨' },
        ]
    },
    {
        id: 'prime_jerky', nameKr: '최상급 육포', nameEn: 'Prime Meat Jerky', icon: '🥓', category: 'other',
        craftedIn: 'Preserving Bin',
        ingredients: [
            { name: 'Cooked Prime Meat', nameKr: '익힌 최상급', amount: 1, icon: '🍖' },
            { name: 'Oil', nameKr: '오일', amount: 1, icon: '🛢️' },
            { name: 'Sparkpowder', nameKr: '스파크파우더', amount: 3, icon: '✨' },
        ]
    },
    {
        id: 'sparkpowder', nameKr: '스파크파우더', nameEn: 'Sparkpowder', icon: '✨', category: 'other',
        craftedIn: 'Mortar & Pestle',
        ingredients: [
            { name: 'Flint', nameKr: '부싯돌', amount: 2, icon: '🪨' },
            { name: 'Stone', nameKr: '돌', amount: 1, icon: '🪨' },
        ]
    },
];

const CATEGORIES = [
    { id: 'all', labelKr: '전체', labelEn: 'All', icon: '📋' },
    { id: 'kibble', labelKr: '키블', labelEn: 'Kibble', icon: '🥣' },
    { id: 'food', labelKr: '버프 음식', labelEn: 'Buff Food', icon: '🍲' },
    { id: 'consumable', labelKr: '소모품', labelEn: 'Consumables', icon: '💊' },
    { id: 'other', labelKr: '기타', labelEn: 'Other', icon: '📦' },
];

export function FoodCalculator() {
    const { i18n } = useTranslation();
    const isKorean = i18n.language === 'ko';

    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredRecipes = useMemo(() => {
        let result = RECIPES;
        if (selectedCategory !== 'all') {
            result = result.filter(r => r.category === selectedCategory);
        }
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(r =>
                r.nameKr.toLowerCase().includes(q) ||
                r.nameEn.toLowerCase().includes(q)
            );
        }
        return result;
    }, [selectedCategory, searchQuery]);

    return (
        <div className="food-calc">
            {/* Header */}
            <div className="food-calc__header">
                <h2>🍳 {isKorean ? '음식 & 레시피' : 'Food & Recipes'}</h2>
                <p>{isKorean ? 'ARK 요리 레시피 및 재료 목록' : 'ARK cooking recipes and ingredients'}</p>
            </div>

            {/* Search */}
            <div className="food-calc__search">
                <span>🔍</span>
                <input
                    type="text"
                    placeholder={isKorean ? '레시피 검색...' : 'Search recipes...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && <button onClick={() => setSearchQuery('')}>✕</button>}
            </div>

            {/* Categories */}
            <div className="food-calc__categories">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat.id}
                        className={`food-cat-btn ${selectedCategory === cat.id ? 'active' : ''}`}
                        onClick={() => setSelectedCategory(cat.id)}
                    >
                        {cat.icon} {isKorean ? cat.labelKr : cat.labelEn}
                    </button>
                ))}
            </div>

            {/* Recipe Grid - Dododex Style */}
            <div className="food-grid">
                {filteredRecipes.map(recipe => (
                    <div
                        key={recipe.id}
                        className={`food-card ${selectedRecipe?.id === recipe.id ? 'food-card--selected' : ''}`}
                        onClick={() => setSelectedRecipe(selectedRecipe?.id === recipe.id ? null : recipe)}
                    >
                        <span className="food-card__icon">{recipe.icon}</span>
                        <span className="food-card__name">{isKorean ? recipe.nameKr : recipe.nameEn}</span>
                        {recipe.tier && <span className="food-card__tier">{recipe.tier}</span>}
                    </div>
                ))}
            </div>

            {/* Recipe Detail Panel - Dododex Style */}
            {selectedRecipe && (
                <div className="food-detail">
                    <div className="food-detail__header">
                        <div className="food-detail__title">
                            <span className="food-detail__icon">{selectedRecipe.icon}</span>
                            <div>
                                <h3>{isKorean ? selectedRecipe.nameKr : selectedRecipe.nameEn}</h3>
                                {selectedRecipe.craftedIn && (
                                    <span className="food-detail__craft">
                                        🔧 {selectedRecipe.craftedIn}
                                    </span>
                                )}
                            </div>
                        </div>
                        <button className="food-detail__close" onClick={() => setSelectedRecipe(null)}>✕</button>
                    </div>

                    {selectedRecipe.effect && (
                        <div className="food-detail__effect">
                            <span>✨</span>
                            <span>{isKorean ? selectedRecipe.effectKr : selectedRecipe.effect}</span>
                        </div>
                    )}

                    <div className="food-detail__ingredients">
                        <h4>📦 {isKorean ? '재료' : 'Ingredients'}</h4>
                        <div className="food-ingredient-list">
                            {selectedRecipe.ingredients.map((ing, idx) => (
                                <div key={idx} className="food-ingredient">
                                    <span className="food-ingredient__icon">{ing.icon}</span>
                                    <span className="food-ingredient__name">{isKorean ? ing.nameKr : ing.name}</span>
                                    <span className="food-ingredient__amount">×{ing.amount}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
