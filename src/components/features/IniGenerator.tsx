import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import './IniGenerator.css';

interface IniSettings {
    // Display
    resolutionX: number;
    resolutionY: number;
    fullscreen: boolean;
    vsync: boolean;
    maxFps: number;

    // Graphics
    graphicsQuality: number;
    viewDistance: number;
    antiAliasing: number;
    shadowQuality: number;
    textureQuality: number;
    effectsQuality: number;
    foliageQuality: number;
    groundClutter: number;

    // PVP Optimizations
    lightShafts: boolean;
    lightBloom: boolean;
    distortionEffect: boolean;
    motionBlur: boolean;
    ambientOcclusion: boolean;

    // Game Settings
    showCrosshair: boolean;
    hudScale: number;
    showFloatingNames: boolean;
    showStatusNotifications: boolean;
    thirdPersonCamera: boolean;
    cameraShake: number;
    fov: number;

    // Performance
    lowMemory: boolean;
    noSound: boolean;
    useBattleye: boolean;
    d3d10: boolean;
    sm4: boolean;
    noVR: boolean;
}

// Presets for different use cases
const PRESETS = {
    pvp: {
        id: 'pvp',
        icon: '⚔️',
        labelKr: 'PVP 최적화',
        labelEn: 'PVP Optimized',
        descKr: '프레임 우선, 시인성 최대',
        descEn: 'Max FPS, Best Visibility',
        settings: {
            graphicsQuality: 0, viewDistance: 2, antiAliasing: 0,
            shadowQuality: 0, textureQuality: 2, effectsQuality: 0,
            foliageQuality: 0, groundClutter: 0, lightShafts: false,
            lightBloom: false, distortionEffect: false, motionBlur: false,
            ambientOcclusion: false, maxFps: 144, vsync: false,
        }
    },
    balanced: {
        id: 'balanced',
        icon: '⚖️',
        labelKr: '균형',
        labelEn: 'Balanced',
        descKr: '성능과 품질의 균형',
        descEn: 'Balance Performance & Quality',
        settings: {
            graphicsQuality: 2, viewDistance: 3, antiAliasing: 2,
            shadowQuality: 2, textureQuality: 3, effectsQuality: 2,
            foliageQuality: 2, groundClutter: 2, lightShafts: true,
            lightBloom: true, distortionEffect: false, motionBlur: false,
            ambientOcclusion: true, maxFps: 60, vsync: true,
        }
    },
    highEnd: {
        id: 'highEnd',
        icon: '💎',
        labelKr: '고사양',
        labelEn: 'High End',
        descKr: '최고 품질 그래픽',
        descEn: 'Maximum Visual Quality',
        settings: {
            graphicsQuality: 4, viewDistance: 4, antiAliasing: 4,
            shadowQuality: 4, textureQuality: 4, effectsQuality: 4,
            foliageQuality: 4, groundClutter: 4, lightShafts: true,
            lightBloom: true, distortionEffect: true, motionBlur: true,
            ambientOcclusion: true, maxFps: 60, vsync: true,
        }
    },
    potato: {
        id: 'potato',
        icon: '🥔',
        labelKr: '감자 PC',
        labelEn: 'Potato PC',
        descKr: '최소 사양용 극한 최적화',
        descEn: 'Extreme optimization for low specs',
        settings: {
            graphicsQuality: 0, viewDistance: 0, antiAliasing: 0,
            shadowQuality: 0, textureQuality: 0, effectsQuality: 0,
            foliageQuality: 0, groundClutter: 0, lightShafts: false,
            lightBloom: false, distortionEffect: false, motionBlur: false,
            ambientOcclusion: false, maxFps: 30, vsync: false,
            lowMemory: true, sm4: true,
        }
    },
};

const RESOLUTIONS = [
    { w: 1280, h: 720, label: '720p' },
    { w: 1600, h: 900, label: '900p' },
    { w: 1920, h: 1080, label: '1080p' },
    { w: 2560, h: 1440, label: '1440p' },
    { w: 3840, h: 2160, label: '4K' },
];

const defaultSettings: IniSettings = {
    resolutionX: 1920, resolutionY: 1080, fullscreen: true, vsync: false, maxFps: 60,
    graphicsQuality: 3, viewDistance: 3, antiAliasing: 3, shadowQuality: 2,
    textureQuality: 3, effectsQuality: 3, foliageQuality: 3, groundClutter: 3,
    lightShafts: true, lightBloom: true, distortionEffect: false, motionBlur: false,
    ambientOcclusion: true, showCrosshair: true, hudScale: 1.0, showFloatingNames: true,
    showStatusNotifications: true, thirdPersonCamera: true, cameraShake: 0.5, fov: 90,
    lowMemory: false, noSound: false, useBattleye: true, d3d10: false, sm4: false, noVR: true,
};

interface IniGeneratorProps {
    onClose?: () => void;
}

export function IniGenerator({ onClose }: IniGeneratorProps) {
    const { i18n } = useTranslation();
    const isKorean = i18n.language === 'ko';

    const [settings, setSettings] = useState<IniSettings>(defaultSettings);
    const [activePreset, setActivePreset] = useState<string | null>(null);
    const [activeSection, setActiveSection] = useState<'graphics' | 'game' | 'launch'>('graphics');
    const [copied, setCopied] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    const updateSetting = <K extends keyof IniSettings>(key: K, value: IniSettings[K]) => {
        setSettings(prev => ({ ...prev, [key]: value }));
        setActivePreset(null); // Clear preset when manually changing
    };

    const applyPreset = (presetKey: string) => {
        const preset = PRESETS[presetKey as keyof typeof PRESETS];
        if (preset) {
            setSettings(prev => ({ ...prev, ...preset.settings }));
            setActivePreset(presetKey);
        }
    };

    const generateIni = useMemo(() => {
        const lines: string[] = [
            '[/Script/ShooterGame.ShooterGameUserSettings]',
            'MasterAudioVolume=1.000000',
            'MusicAudioVolume=0.500000',
            'SFXAudioVolume=1.000000',
            'VoiceAudioVolume=1.000000',
            `bUseVSync=${settings.vsync ? 'True' : 'False'}`,
            `bUseDynamicResolution=False`,
            `ResolutionSizeX=${settings.resolutionX}`,
            `ResolutionSizeY=${settings.resolutionY}`,
            `LastUserConfirmedResolutionSizeX=${settings.resolutionX}`,
            `LastUserConfirmedResolutionSizeY=${settings.resolutionY}`,
            `FullscreenMode=${settings.fullscreen ? '0' : '1'}`,
            `LastConfirmedFullscreenMode=${settings.fullscreen ? '0' : '1'}`,
            `FrameRateLimit=${settings.maxFps}.000000`,
            `UIScaling=${settings.hudScale}`,
            `bThirdPersonPlayer=${settings.thirdPersonCamera ? 'True' : 'False'}`,
            `CameraShakeScale=${settings.cameraShake}`,
            `FOVMultiplier=${(settings.fov / 90).toFixed(2)}`,
            '',
            '[ScalabilityGroups]',
            `sg.ResolutionQuality=100`,
            `sg.ViewDistanceQuality=${settings.viewDistance}`,
            `sg.AntiAliasingQuality=${settings.antiAliasing}`,
            `sg.ShadowQuality=${settings.shadowQuality}`,
            `sg.PostProcessQuality=${settings.graphicsQuality}`,
            `sg.TextureQuality=${settings.textureQuality}`,
            `sg.EffectsQuality=${settings.effectsQuality}`,
            `sg.FoliageQuality=${settings.foliageQuality}`,
            `sg.GroundClutterQuality=${settings.groundClutter}`,
            '',
            '[/Script/Engine.RendererSettings]',
            `r.LightShafts=${settings.lightShafts ? '1' : '0'}`,
            `r.BloomQuality=${settings.lightBloom ? '5' : '0'}`,
            `r.DistortionQuality=${settings.distortionEffect ? '1' : '0'}`,
            `r.MotionBlurQuality=${settings.motionBlur ? '4' : '0'}`,
            `r.AmbientOcclusionLevels=${settings.ambientOcclusion ? '3' : '0'}`,
            '',
            '[ServerSettings]',
            `ShowFloatingDamageText=${settings.showFloatingNames ? 'True' : 'False'}`,
            `ShowStatusNotificationMessages=${settings.showStatusNotifications ? 'True' : 'False'}`,
        ];

        // Launch options section
        const launchOptions: string[] = [];
        if (settings.lowMemory) launchOptions.push('-lowmemory');
        if (settings.noSound) launchOptions.push('-nosound');
        if (!settings.useBattleye) launchOptions.push('-NoBattlEye');
        if (settings.d3d10) launchOptions.push('-d3d10');
        if (settings.sm4) launchOptions.push('-sm4');
        if (settings.noVR) launchOptions.push('-nomansky -nohmd');

        if (launchOptions.length > 0) {
            lines.push('', '[Launch Options - Add to Steam]', launchOptions.join(' '));
        }

        return lines.join('\n');
    }, [settings]);

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(generateIni);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const downloadIni = () => {
        const blob = new Blob([generateIni], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'GameUserSettings.ini';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const qualityLabels = isKorean
        ? ['최저', '낮음', '중간', '높음', '최고']
        : ['Lowest', 'Low', 'Medium', 'High', 'Ultra'];

    const QualitySlider = ({ label, value, onChange, icon }: { label: string; value: number; onChange: (v: number) => void; icon?: string }) => (
        <div className="ini-quality-slider">
            <div className="ini-quality-slider__header">
                <span>{icon} {label}</span>
                <span className="ini-quality-slider__value" data-quality={value}>{qualityLabels[value]}</span>
            </div>
            <input
                type="range"
                min={0}
                max={4}
                value={value}
                onChange={(e) => onChange(parseInt(e.target.value))}
                className="ini-quality-slider__input"
            />
            <div className="ini-quality-slider__ticks">
                {qualityLabels.map((_, i) => (
                    <span key={i} className={`tick ${value >= i ? 'active' : ''}`} />
                ))}
            </div>
        </div>
    );

    const Toggle = ({ label, value, onChange, hint }: { label: string; value: boolean; onChange: (v: boolean) => void; hint?: string }) => (
        <div className="ini-toggle-row">
            <div className="ini-toggle-row__info">
                <span className="ini-toggle-row__label">{label}</span>
                {hint && <span className="ini-toggle-row__hint">{hint}</span>}
            </div>
            <button
                className={`ini-toggle ${value ? 'ini-toggle--on' : ''}`}
                onClick={() => onChange(!value)}
            >
                <span className="ini-toggle__slider" />
            </button>
        </div>
    );

    return (
        <div className="ini-generator">
            {/* Header */}
            <div className="ini-header">
                <div className="ini-header__title">
                    <h2>⚙️ {isKorean ? 'INI 생성기' : 'INI Generator'}</h2>
                    <span className="ini-header__subtitle">GameUserSettings.ini</span>
                </div>
                <div className="ini-header__actions">
                    <button className="btn btn--sm btn--ghost" onClick={() => setShowPreview(!showPreview)}>
                        {showPreview ? '🔧' : '📄'} {showPreview ? (isKorean ? '설정' : 'Settings') : (isKorean ? '미리보기' : 'Preview')}
                    </button>
                    {onClose && <button className="ini-close" onClick={onClose}>✕</button>}
                </div>
            </div>

            {showPreview ? (
                /* Preview Mode */
                <div className="ini-preview-full">
                    <pre>{generateIni}</pre>
                </div>
            ) : (
                /* Settings Mode */
                <div className="ini-content">
                    {/* Quick Presets */}
                    <div className="ini-presets">
                        <h3>⚡ {isKorean ? '퀵 프리셋' : 'Quick Presets'}</h3>
                        <div className="ini-presets__grid">
                            {Object.values(PRESETS).map(preset => (
                                <button
                                    key={preset.id}
                                    className={`ini-preset-card ${activePreset === preset.id ? 'ini-preset-card--active' : ''}`}
                                    onClick={() => applyPreset(preset.id)}
                                >
                                    <span className="ini-preset-card__icon">{preset.icon}</span>
                                    <span className="ini-preset-card__name">{isKorean ? preset.labelKr : preset.labelEn}</span>
                                    <span className="ini-preset-card__desc">{isKorean ? preset.descKr : preset.descEn}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Section Tabs */}
                    <div className="ini-section-tabs">
                        <button
                            className={`ini-section-tab ${activeSection === 'graphics' ? 'active' : ''}`}
                            onClick={() => setActiveSection('graphics')}
                        >
                            🖥️ {isKorean ? '그래픽' : 'Graphics'}
                        </button>
                        <button
                            className={`ini-section-tab ${activeSection === 'game' ? 'active' : ''}`}
                            onClick={() => setActiveSection('game')}
                        >
                            🎮 {isKorean ? '게임' : 'Game'}
                        </button>
                        <button
                            className={`ini-section-tab ${activeSection === 'launch' ? 'active' : ''}`}
                            onClick={() => setActiveSection('launch')}
                        >
                            🚀 {isKorean ? '실행' : 'Launch'}
                        </button>
                    </div>

                    {/* Graphics Section */}
                    {activeSection === 'graphics' && (
                        <div className="ini-section-content">
                            {/* Resolution */}
                            <div className="ini-card">
                                <h4>📺 {isKorean ? '해상도' : 'Resolution'}</h4>
                                <div className="ini-resolution-grid">
                                    {RESOLUTIONS.map(res => (
                                        <button
                                            key={res.label}
                                            className={`ini-res-btn ${settings.resolutionX === res.w && settings.resolutionY === res.h ? 'active' : ''}`}
                                            onClick={() => { updateSetting('resolutionX', res.w); updateSetting('resolutionY', res.h); }}
                                        >
                                            {res.label}
                                        </button>
                                    ))}
                                </div>
                                <div className="ini-row-inline">
                                    <Toggle label={isKorean ? '전체화면' : 'Fullscreen'} value={settings.fullscreen} onChange={v => updateSetting('fullscreen', v)} />
                                    <Toggle label="VSync" value={settings.vsync} onChange={v => updateSetting('vsync', v)} />
                                </div>
                                <div className="ini-fps-row">
                                    <span>🎯 {isKorean ? '최대 FPS' : 'Max FPS'}</span>
                                    <input
                                        type="number"
                                        value={settings.maxFps}
                                        onChange={(e) => updateSetting('maxFps', parseInt(e.target.value) || 60)}
                                        min={30}
                                        max={300}
                                    />
                                </div>
                            </div>

                            {/* Quality Sliders */}
                            <div className="ini-card">
                                <h4>🎨 {isKorean ? '품질 설정' : 'Quality Settings'}</h4>
                                <QualitySlider label={isKorean ? '그래픽 품질' : 'Graphics'} icon="✨" value={settings.graphicsQuality} onChange={v => updateSetting('graphicsQuality', v)} />
                                <QualitySlider label={isKorean ? '시야 거리' : 'View Distance'} icon="👁️" value={settings.viewDistance} onChange={v => updateSetting('viewDistance', v)} />
                                <QualitySlider label={isKorean ? '텍스처' : 'Textures'} icon="🖼️" value={settings.textureQuality} onChange={v => updateSetting('textureQuality', v)} />
                                <QualitySlider label={isKorean ? '그림자' : 'Shadows'} icon="🌑" value={settings.shadowQuality} onChange={v => updateSetting('shadowQuality', v)} />
                                <QualitySlider label={isKorean ? '이펙트' : 'Effects'} icon="💥" value={settings.effectsQuality} onChange={v => updateSetting('effectsQuality', v)} />
                                <QualitySlider label={isKorean ? '초목' : 'Foliage'} icon="🌿" value={settings.foliageQuality} onChange={v => updateSetting('foliageQuality', v)} />
                                <QualitySlider label={isKorean ? '안티앨리어싱' : 'Anti-Aliasing'} icon="🔲" value={settings.antiAliasing} onChange={v => updateSetting('antiAliasing', v)} />
                            </div>

                            {/* PVP Optimizations */}
                            <div className="ini-card ini-card--pvp">
                                <h4>⚔️ {isKorean ? 'PVP 최적화' : 'PVP Optimizations'}</h4>
                                <p className="ini-card__hint">{isKorean ? '끄면 FPS 상승, 시인성 향상' : 'Turn off for better FPS & visibility'}</p>
                                <Toggle label={isKorean ? '빛 줄기' : 'Light Shafts'} value={settings.lightShafts} onChange={v => updateSetting('lightShafts', v)} />
                                <Toggle label={isKorean ? '블룸' : 'Bloom'} value={settings.lightBloom} onChange={v => updateSetting('lightBloom', v)} />
                                <Toggle label={isKorean ? '왜곡 효과' : 'Distortion'} value={settings.distortionEffect} onChange={v => updateSetting('distortionEffect', v)} />
                                <Toggle label={isKorean ? '모션 블러' : 'Motion Blur'} value={settings.motionBlur} onChange={v => updateSetting('motionBlur', v)} />
                                <Toggle label={isKorean ? '앰비언트 오클루전' : 'Ambient Occlusion'} value={settings.ambientOcclusion} onChange={v => updateSetting('ambientOcclusion', v)} />
                            </div>
                        </div>
                    )}

                    {/* Game Section */}
                    {activeSection === 'game' && (
                        <div className="ini-section-content">
                            <div className="ini-card">
                                <h4>🎯 {isKorean ? '카메라 설정' : 'Camera Settings'}</h4>
                                <div className="ini-fov-slider">
                                    <span>FOV: {settings.fov}°</span>
                                    <input
                                        type="range"
                                        min={70}
                                        max={120}
                                        value={settings.fov}
                                        onChange={(e) => updateSetting('fov', parseInt(e.target.value))}
                                    />
                                </div>
                                <Toggle label={isKorean ? '3인칭 카메라' : '3rd Person Camera'} value={settings.thirdPersonCamera} onChange={v => updateSetting('thirdPersonCamera', v)} />
                                <div className="ini-fov-slider">
                                    <span>{isKorean ? '카메라 흔들림' : 'Camera Shake'}: {(settings.cameraShake * 100).toFixed(0)}%</span>
                                    <input
                                        type="range"
                                        min={0}
                                        max={1}
                                        step={0.1}
                                        value={settings.cameraShake}
                                        onChange={(e) => updateSetting('cameraShake', parseFloat(e.target.value))}
                                    />
                                </div>
                            </div>

                            <div className="ini-card">
                                <h4>📊 HUD</h4>
                                <div className="ini-fov-slider">
                                    <span>HUD {isKorean ? '크기' : 'Scale'}: {(settings.hudScale * 100).toFixed(0)}%</span>
                                    <input
                                        type="range"
                                        min={0.5}
                                        max={2}
                                        step={0.1}
                                        value={settings.hudScale}
                                        onChange={(e) => updateSetting('hudScale', parseFloat(e.target.value))}
                                    />
                                </div>
                                <Toggle label={isKorean ? '조준점' : 'Crosshair'} value={settings.showCrosshair} onChange={v => updateSetting('showCrosshair', v)} />
                                <Toggle label={isKorean ? '플로팅 이름' : 'Floating Names'} value={settings.showFloatingNames} onChange={v => updateSetting('showFloatingNames', v)} />
                                <Toggle label={isKorean ? '상태 알림' : 'Status Notifications'} value={settings.showStatusNotifications} onChange={v => updateSetting('showStatusNotifications', v)} />
                            </div>
                        </div>
                    )}

                    {/* Launch Section */}
                    {activeSection === 'launch' && (
                        <div className="ini-section-content">
                            <div className="ini-card">
                                <h4>🚀 {isKorean ? '실행 옵션' : 'Launch Options'}</h4>
                                <p className="ini-card__hint">{isKorean ? 'Steam 실행 옵션에 추가하세요' : 'Add these to Steam launch options'}</p>
                                <Toggle label={isKorean ? '저메모리 모드' : 'Low Memory'} value={settings.lowMemory} onChange={v => updateSetting('lowMemory', v)} hint={isKorean ? 'RAM 부족시' : 'For low RAM'} />
                                <Toggle label={isKorean ? '사운드 비활성화' : 'No Sound'} value={settings.noSound} onChange={v => updateSetting('noSound', v)} hint={isKorean ? 'FPS 약간 상승' : 'Slight FPS boost'} />
                                <Toggle label="BattlEye" value={settings.useBattleye} onChange={v => updateSetting('useBattleye', v)} hint={isKorean ? '치트 방지' : 'Anti-cheat'} />
                                <Toggle label="DirectX 10" value={settings.d3d10} onChange={v => updateSetting('d3d10', v)} hint={isKorean ? '구형 GPU용' : 'For old GPUs'} />
                                <Toggle label="Shader Model 4" value={settings.sm4} onChange={v => updateSetting('sm4', v)} hint={isKorean ? '그래픽 단순화' : 'Simplified graphics'} />
                                <Toggle label={isKorean ? 'VR 비활성화' : 'No VR/Sky'} value={settings.noVR} onChange={v => updateSetting('noVR', v)} hint={isKorean ? 'VR 끄기' : 'Disable VR'} />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Action Bar */}
            <div className="ini-action-bar">
                <button className="btn btn--lg btn--secondary" onClick={copyToClipboard}>
                    {copied ? '✅ ' + (isKorean ? '복사됨!' : 'Copied!') : '📋 ' + (isKorean ? '복사' : 'Copy')}
                </button>
                <button className="btn btn--lg btn--primary" onClick={downloadIni}>
                    💾 {isKorean ? '다운로드' : 'Download'}
                </button>
            </div>
        </div>
    );
}
