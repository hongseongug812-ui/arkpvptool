import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Korean translations
const ko = {
    translation: {
        // Common
        common: {
            calculate: '계산하기',
            result: '결과',
            settings: '설정',
            loading: '로딩 중...',
            error: '오류 발생',
            retry: '다시 시도',
            copy: '복사',
            copied: '복사됨!',
            close: '닫기',
            save: '저장',
            cancel: '취소',
        },

        // Header
        header: {
            title: 'ARK TACTICS',
            subtitle: 'PVP UTILITY',
        },

        // Navigation
        nav: {
            raid: 'Raid',
            soak: 'Soaking',
            stats: 'Stats',
            map: 'Map',
        },

        // Raid Calculator
        raid: {
            title: '레이드 계산기',
            desc: '구조물 파괴에 필요한 폭발물을 계산합니다',
            target: '타겟 설정',
            structure: '구조물',
            quantity: '파괴할 개수',
            explosive: '폭발물',
            needed: '필요한 {{name}}',
            count: '{{count}}개',
            totalHp: '총 HP',
            damagePerUnit: '개당 데미지',
            materials: '필요 재료',
            noResult: '타겟을 설정하고 계산 버튼을 눌러주세요',
            noDamage: '이 폭발물은 해당 재질에 데미지를 주지 못합니다',
        },

        // Soaking Simulator
        soak: {
            title: '소킹 시뮬레이터',
            desc: '실제 PVP 환경에서의 생존 시간을 계산합니다',
            dinoSettings: '공룡 설정',
            turretSettings: '터렛 설정',
            buffs: '활성화된 버프',
            mateBoost: '메이트 부스트',
            yutyCourage: '유티 용기 버프',
            survivalTime: '생존 시간',
            withCake: '케이크 포함',
            totalDps: '총 DPS',
            autoTurret: '자동 포탑',
            heavyTurret: '헤비 포탑',
            tekTurret: '테크 포탑',
        },

        // Stat Evaluator
        stats: {
            title: '스탯 감정사',
            desc: '테이밍한 공룡의 야생 포인트를 역산합니다',
            selectDino: '공룡 선택',
            inputStats: '스탯 입력',
            pointResult: '포인트 결과',
            total: '합계',
            rating: '등급',
        },

        // Map Viewer
        map: {
            title: '전략 지도',
            desc: 'PVP 집터 및 은신처 정보',
            tribeSize: '부족 규모',
            all: '전체',
            difficulty: '난이도',
            coords: '좌표',
            copiedCoords: '좌표가 복사되었습니다!',
            noResults: '필터 조건에 맞는 위치가 없습니다',
            pros: '장점',
            cons: '단점',
            strategy: '전술 조언',
        },

        // Splash Screen
        splash: {
            scanning: '데이터 스캔 중',
            loadingStructures: '구조물 데이터 로딩...',
            loadingDinos: '공룡 스탯 로딩...',
            loadingMaps: '집터 데이터 로딩...',
            complete: '초기화 완료!',
        },
    },
};

// English translations
const en = {
    translation: {
        // Common
        common: {
            calculate: 'Calculate',
            result: 'Result',
            settings: 'Settings',
            loading: 'Loading...',
            error: 'Error occurred',
            retry: 'Retry',
            copy: 'Copy',
            copied: 'Copied!',
            close: 'Close',
            save: 'Save',
            cancel: 'Cancel',
        },

        // Header
        header: {
            title: 'ARK TACTICS',
            subtitle: 'PVP UTILITY',
        },

        // Navigation
        nav: {
            raid: 'Raid',
            soak: 'Soaking',
            stats: 'Stats',
            map: 'Map',
        },

        // Raid Calculator
        raid: {
            title: 'Raid Calculator',
            desc: 'Calculate explosives needed to destroy structures',
            target: 'Target Settings',
            structure: 'Structure',
            quantity: 'Quantity to Destroy',
            explosive: 'Explosive',
            needed: 'Required {{name}}',
            count: '{{count}} units',
            totalHp: 'Total HP',
            damagePerUnit: 'Damage per Unit',
            materials: 'Required Materials',
            noResult: 'Set target and click calculate',
            noDamage: 'This explosive cannot damage this material type',
        },

        // Soaking Simulator
        soak: {
            title: 'Soaking Simulator',
            desc: 'Calculate survival time in real PVP environments',
            dinoSettings: 'Dino Settings',
            turretSettings: 'Turret Settings',
            buffs: 'Active Buffs',
            mateBoost: 'Mate Boost',
            yutyCourage: 'Yuty Courage Roar',
            survivalTime: 'Survival Time',
            withCake: 'With Veggie Cake',
            totalDps: 'Total DPS',
            autoTurret: 'Auto Turret',
            heavyTurret: 'Heavy Turret',
            tekTurret: 'Tek Turret',
        },

        // Stat Evaluator
        stats: {
            title: 'Stat Evaluator',
            desc: 'Reverse calculate wild points from tamed dino stats',
            selectDino: 'Select Dino',
            inputStats: 'Input Stats',
            pointResult: 'Point Results',
            total: 'Total',
            rating: 'Rating',
        },

        // Map Viewer
        map: {
            title: 'Strategic Map',
            desc: 'PVP base locations and hideouts',
            tribeSize: 'Tribe Size',
            all: 'All',
            difficulty: 'Difficulty',
            coords: 'Coordinates',
            copiedCoords: 'Coordinates copied!',
            noResults: 'No locations match filter criteria',
            pros: 'Pros',
            cons: 'Cons',
            strategy: 'Strategy Tips',
        },

        // Splash Screen
        splash: {
            scanning: 'Scanning Data',
            loadingStructures: 'Loading structure data...',
            loadingDinos: 'Loading dino stats...',
            loadingMaps: 'Loading base locations...',
            complete: 'Initialization complete!',
        },
    },
};

// Get saved language or detect from browser
const getSavedLanguage = (): string => {
    const saved = localStorage.getItem('ark_tactics_language');
    if (saved) return saved;

    const browserLang = navigator.language.split('-')[0];
    return browserLang === 'ko' ? 'ko' : 'en';
};

i18n.use(initReactI18next).init({
    resources: {
        ko,
        en,
    },
    lng: getSavedLanguage(),
    fallbackLng: 'en',
    interpolation: {
        escapeValue: false,
    },
});

// Save language preference
export const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('ark_tactics_language', lang);
};

export default i18n;
