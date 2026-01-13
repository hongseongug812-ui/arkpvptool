// ============================================
// DataManager Service - 데이터 로딩 및 관리
// ============================================

import type {
    Structure,
    Explosive,
    Turret,
    Dino,
    RatholeLocation,
    RatholeMap,
    RaidData,
    SoakerData,
    RatholeData,
    AppData,
    StructureTier,
    GameVersion,
    RatholeDifficulty,
    DinoStatsData,
    DinoStatsEntry,
} from '../types';

// JSON 데이터 임포트
import raidDataJson from '../data/raid_data.json';
import soakerDataJson from '../data/soaker_data.json';
import ratholeAsaJson from '../data/rathole_asa.json';
import ratholeAseJson from '../data/rathole_ase.json';
import dinoStatsJson from '../data/dino_stats.json';

/**
 * DataManager 서비스
 * - JSON 데이터 로딩 및 파싱
 * - 데이터 조회 및 필터링 유틸리티 제공
 */
class DataManager {
    private static instance: DataManager;

    private raidData: RaidData;
    private soakerData: SoakerData;
    private ratholeAsaData: RatholeData;
    private ratholeAseData: RatholeData;
    private dinoStatsData: DinoStatsData;

    private constructor() {
        // JSON 데이터 로드 및 타입 캐스팅
        this.raidData = raidDataJson as unknown as RaidData;
        this.soakerData = soakerDataJson as unknown as SoakerData;
        this.ratholeAsaData = ratholeAsaJson as unknown as RatholeData;
        this.ratholeAseData = ratholeAseJson as unknown as RatholeData;
        this.dinoStatsData = dinoStatsJson as unknown as DinoStatsData;
    }

    /** 싱글톤 인스턴스 반환 */
    public static getInstance(): DataManager {
        if (!DataManager.instance) {
            DataManager.instance = new DataManager();
        }
        return DataManager.instance;
    }

    // ========== 전체 데이터 조회 ==========

    /** 모든 앱 데이터 반환 */
    public getAllData(): AppData {
        return {
            raid: this.raidData,
            soaker: this.soakerData,
            rathole: {
                asa: this.ratholeAsaData,
                ase: this.ratholeAseData,
            },
        };
    }

    // ========== 구조물 관련 ==========

    /** 모든 구조물 반환 */
    public getStructures(): Structure[] {
        return this.raidData.structures;
    }

    /** ID로 구조물 조회 */
    public getStructureById(id: string): Structure | undefined {
        return this.raidData.structures.find((s) => s.id === id);
    }

    /** 티어별 구조물 필터링 */
    public getStructuresByTier(tier: StructureTier): Structure[] {
        return this.raidData.structures.filter((s) => s.tier === tier);
    }

    // ========== 폭발물 관련 ==========

    /** 모든 폭발물 반환 */
    public getExplosives(): Explosive[] {
        return this.raidData.explosives;
    }

    /** ID로 폭발물 조회 */
    public getExplosiveById(id: string): Explosive | undefined {
        return this.raidData.explosives.find((e) => e.id === id);
    }

    /**
     * 특정 구조물을 파괴하는 데 필요한 폭발물 개수 계산
     * @param structureId 구조물 ID
     * @param explosiveId 폭발물 ID
     * @returns 필요한 개수 또는 null (해당 티어에 데미지가 없는 경우)
     */
    public calculateExplosivesNeeded(
        structureId: string,
        explosiveId: string
    ): number | null {
        const structure = this.getStructureById(structureId);
        const explosive = this.getExplosiveById(explosiveId);

        if (!structure || !explosive) return null;

        const damage = explosive.damage[structure.tier];
        if (!damage || damage <= 0) return null;

        return Math.ceil(structure.hp / damage);
    }

    // ========== 터렛 관련 ==========

    /** 모든 터렛 반환 */
    public getTurrets(): Turret[] {
        return this.soakerData.turrets;
    }

    /** ID로 터렛 조회 */
    public getTurretById(id: string): Turret | undefined {
        return this.soakerData.turrets.find((t) => t.id === id);
    }

    /**
     * 터렛의 초당 DPS 계산 (공룡 대상)
     * @param turretId 터렛 ID
     * @returns DPS 또는 null
     */
    public getTurretDPS(turretId: string): number | null {
        const turret = this.getTurretById(turretId);
        if (!turret) return null;

        return turret.damage_per_shot * turret.multiplier_vs_dino * turret.rate_of_fire;
    }

    // ========== 공룡 (Soaker) 관련 ==========

    /** 모든 탱킹용 공룡 반환 */
    public getDinos(): Dino[] {
        return this.soakerData.dinos;
    }

    /** ID로 공룡 조회 */
    public getDinoById(id: string): Dino | undefined {
        return this.soakerData.dinos.find((d) => d.id === id);
    }

    /**
     * 공룡의 유효 HP 계산 (안장 방어력 + 특수 능력 적용)
     * @param dinoId 공룡 ID
     * @param levelPoints HP에 투자한 레벨 포인트
     * @param saddleArmor 안장 방어력
     * @param abilityModeId 사용할 특수 능력 모드 ID (optional)
     * @returns 유효 HP 정보
     */
    public calculateEffectiveHP(
        dinoId: string,
        levelPoints: number,
        saddleArmor: number = 0,
        abilityModeId?: string
    ): {
        baseHP: number;
        totalHP: number;
        effectiveHP: number;
        reductionPercent: number;
    } | null {
        const dino = this.getDinoById(dinoId);
        if (!dino) return null;

        // 기본 HP 계산 (레벨당 HP 증가는 기본 HP의 20%로 가정)
        const hpPerLevel = dino.base_hp * 0.2;
        const totalHP = dino.base_hp + levelPoints * hpPerLevel;

        // 안장 피해 감소율 계산: armor / (armor + 100)
        let saddleReduction = 0;
        if (dino.can_equip_saddle && saddleArmor > 0) {
            saddleReduction = saddleArmor / (saddleArmor + 100);
        }

        // 특수 능력 피해 감소율
        let abilityReduction = 0;
        if (abilityModeId) {
            const ability = dino.special_abilities.find((a) => a.mode_id === abilityModeId);
            if (ability) {
                abilityReduction = ability.reduction_percent / 100;
            }
        }

        // 총 피해 감소율 (곱셈 적용)
        const totalReduction = 1 - (1 - saddleReduction) * (1 - abilityReduction);

        // 유효 HP = 실제 HP / (1 - 피해감소율)
        const effectiveHP = totalHP / (1 - totalReduction);

        return {
            baseHP: dino.base_hp,
            totalHP: Math.round(totalHP),
            effectiveHP: Math.round(effectiveHP),
            reductionPercent: Math.round(totalReduction * 100),
        };
    }

    // ========== Rathole 관련 ==========

    /** Rathole 데이터 반환 (게임 버전별) */
    public getRatholeData(version: GameVersion = 'ASA'): RatholeData {
        return version === 'ASE' ? this.ratholeAseData : this.ratholeAsaData;
    }

    /** 모든 맵 목록 반환 */
    public getRatholeMaps(version: GameVersion = 'ASA'): RatholeMap[] {
        return this.getRatholeData(version).maps;
    }

    /** 맵 ID로 맵 정보 조회 */
    public getRatholeMapById(mapId: string, version: GameVersion = 'ASA'): RatholeMap | undefined {
        return this.getRatholeData(version).maps.find((m) => m.map_id === mapId);
    }

    /** 모든 Rathole 위치 반환 (전체 맵) */
    public getAllRatholeLocations(version: GameVersion = 'ASA'): RatholeLocation[] {
        return this.getRatholeData(version).maps.flatMap((m) => m.locations);
    }

    /** 맵별 Rathole 위치 반환 */
    public getRatholesByMapId(mapId: string, version: GameVersion = 'ASA'): RatholeLocation[] {
        const map = this.getRatholeMapById(mapId, version);
        return map ? map.locations : [];
    }

    /** ID로 Rathole 조회 */
    public getRatholeById(id: string, version: GameVersion = 'ASA'): RatholeLocation | undefined {
        return this.getAllRatholeLocations(version).find((r) => r.id === id);
    }

    /** 난이도별 Rathole 필터링 */
    public getRatholesByDifficulty(
        difficulty: RatholeDifficulty,
        version: GameVersion = 'ASA'
    ): RatholeLocation[] {
        return this.getAllRatholeLocations(version).filter((r) => r.difficulty === difficulty);
    }

    /** 부족 규모별 Rathole 필터링 */
    public getRatholesByTribeSize(
        tribeSize: string,
        version: GameVersion = 'ASA'
    ): RatholeLocation[] {
        return this.getAllRatholeLocations(version).filter((r) => r.tribe_size === tribeSize);
    }

    // ========== 공룡 스탯 관련 ==========

    /** 모든 공룡 스탯 데이터 반환 */
    public getDinoStatsData(): DinoStatsData {
        return this.dinoStatsData;
    }

    /** 모든 공룡 스탯 엔트리 반환 */
    public getAllDinoStats(): DinoStatsEntry[] {
        return this.dinoStatsData.dinos;
    }

    /** ID로 공룡 스탯 조회 */
    public getDinoStatsById(id: string): DinoStatsEntry | undefined {
        return this.dinoStatsData.dinos.find((d) => d.id === id);
    }

    /** 레벨에 따른 스탯 계산 (야생 기준) */
    public calculateWildStat(dinoId: string, statKey: 'health' | 'stamina' | 'weight' | 'melee', levels: number): number | null {
        const dino = this.getDinoStatsById(dinoId);
        if (!dino) return null;

        const stat = dino.stats[statKey];
        return Math.round(stat.base + stat.inc_wild * levels);
    }
}

// 싱글톤 인스턴스 export
export const dataManager = DataManager.getInstance();
export default DataManager;
