// ============================================
// Ark: Survival Ascended PVP Utility - Types
// ============================================

// --------- Raid Calculator Types ---------

/** 구조물 재질 티어 */
export type StructureTier = 'Thatch' | 'Wood' | 'Stone' | 'Metal' | 'Tek';

/** 구조물 인터페이스 */
export interface Structure {
    id: string;
    name: string;
    name_kr: string;
    tier: StructureTier;
    hp: number;
}

/** 재질별 데미지 맵 */
export interface DamageByTier {
    Thatch?: number;
    Wood?: number;
    Stone?: number;
    Metal?: number;
    Tek?: number;
}

/** 제작 재료 맵 (자원명: 수량) */
export interface Recipe {
    [resource: string]: number;
}

/** 폭발물 인터페이스 */
export interface Explosive {
    id: string;
    name: string;
    name_kr: string;
    damage: DamageByTier;
    recipe: Recipe;
}

// --------- Turret Types ---------

/** 터렛 인터페이스 */
export interface Turret {
    id: string;
    name: string;
    name_kr: string;
    damage_per_shot: number;
    multiplier_vs_dino: number;
    rate_of_fire: number; // shots per second
}

// --------- Soaker (Dino) Types ---------

/** 공룡 특수 능력 모드 */
export interface DinoAbility {
    mode_id: string;
    mode_name: string;
    reduction_percent: number; // 피해 감소율 (0-100)
}

/** 탱킹용 공룡 인터페이스 */
export interface Dino {
    id: string;
    name: string;
    name_kr: string;
    base_hp: number;
    can_equip_saddle: boolean;
    special_abilities: DinoAbility[];
}

// --------- Dino Stats Types ---------

/** 개별 스탯 정보 (기본값 + 야생 증가량) */
export interface DinoStat {
    base: number;
    inc_wild: number;
}

/** 공룡 스탯 모음 */
export interface DinoStats {
    health: DinoStat;
    stamina: DinoStat;
    weight: DinoStat;
    melee: DinoStat;
}

/** 공룡 스탯 엔트리 */
export interface DinoStatsEntry {
    id: string;
    name_kr: string;
    stats: DinoStats;
    note?: string;
}

/** 공룡 스탯 데이터 전체 */
export interface DinoStatsData {
    version: string;
    dinos: DinoStatsEntry[];
}

/** 테이밍 워치리스트 엔트리 */
export interface WatchlistEntry {
    dinoId: string;
    targetStats: {
        health?: number;
        stamina?: number;
        weight?: number;
        melee?: number;
    };
    currentStats: {
        health: number;
        stamina: number;
        weight: number;
        melee: number;
    };
    nickname?: string;
}


// --------- Rathole Types ---------

/** 게임 버전 */
export type GameVersion = 'ASA' | 'ASE';

/** 레이트홀 난이도 */
export type RatholeDifficulty = 'Easy' | 'Medium' | 'Hard' | 'Extreme';

/** 부족 규모 */
export type TribeSize = 'Solo' | 'Small' | 'Small/Medium' | 'Medium' | 'Alpha' | 'Alpha/Medium';

/** 입구 크기 타입 */
export type EntranceSize =
    | 'Glitch/Pixel'
    | 'Swimmer'
    | 'Swimmer/Tuso'
    | 'Crouch'
    | 'Drop-down'
    | 'Small'
    | 'Medium'
    | 'Large'
    | 'Open'
    | 'Flyer'
    | 'Flyer/Climber'
    | 'Pteranodon'
    | 'Cosmo/Yi Ling'
    | 'Zipline/Drake'
    | 'Magmasaur'
    | 'Grapple Only';

/** 위치 타입 */
export type LocationType =
    | 'Underwater'
    | 'Underwater Cave'
    | 'Cave'
    | 'Rathole'
    | 'Tree Platform'
    | 'Plateau'
    | 'Cliff'
    | 'Basin'
    | 'Pillar'
    | 'Glitch/Rathole'
    | 'Ceiling';

/** 좌표 정보 */
export interface Coordinates {
    lat: number;
    lon: number;
}

/** 레이트홀 위치 정보 */
export interface RatholeLocation {
    id: string;
    name: string;
    coords: Coordinates | null;
    type: LocationType;
    tribe_size: TribeSize;
    difficulty: RatholeDifficulty;
    entrance_size: EntranceSize;
    description: string;
    strategy_note: string;
    pros: string[];
    cons: string[];
}

/** 맵 정보 */
export interface RatholeMap {
    map_id: string;
    map_name: string;
    locations: RatholeLocation[];
}

/** 레이트홀 전체 데이터 */
export interface RatholeData {
    version: string;
    last_updated: string;
    maps: RatholeMap[];
}

// --------- Data Container Types ---------

/** 레이드 데이터 (구조물 + 폭발물) */
export interface RaidData {
    structures: Structure[];
    explosives: Explosive[];
}

/** 탱킹 데이터 (터렛 + 공룡) */
export interface SoakerData {
    turrets: Turret[];
    dinos: Dino[];
}

/** 전체 앱 데이터 */
export interface AppData {
    raid: RaidData;
    soaker: SoakerData;
    rathole: {
        asa: RatholeData;
        ase: RatholeData;
    };
}

