import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './IniGenerator.css';

interface IniSettings {
    // Graphics
    resolutionX: number;
    resolutionY: number;
    fullscreen: boolean;
    vsync: boolean;
    maxFps: number;
    graphicsQuality: number;
    viewDistance: number;
    antiAliasing: number;
    shadowQuality: number;
    textureQuality: number;

    // Game Settings
    showCrosshair: boolean;
    hudScale: number;
    showFloatingNames: boolean;
    showStatusNotifications: boolean;

    // Advanced
    lowMemory: boolean;
    noSound: boolean;
    useBattleye: boolean;
}

const defaultSettings: IniSettings = {
    resolutionX: 1920,
    resolutionY: 1080,
    fullscreen: true,
    vsync: false,
    maxFps: 60,
    graphicsQuality: 3,
    viewDistance: 3,
    antiAliasing: 3,
    shadowQuality: 2,
    textureQuality: 3,
    showCrosshair: true,
    hudScale: 1.0,
    showFloatingNames: true,
    showStatusNotifications: true,
    lowMemory: false,
    noSound: false,
    useBattleye: true,
};

interface IniGeneratorProps {
    onClose?: () => void;
}

export function IniGenerator({ onClose }: IniGeneratorProps) {
    const { i18n } = useTranslation();
    const isKorean = i18n.language === 'ko';

    const [settings, setSettings] = useState<IniSettings>(defaultSettings);
    const [copied, setCopied] = useState(false);

    const updateSetting = <K extends keyof IniSettings>(key: K, value: IniSettings[K]) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const generateIni = (): string => {
        const lines: string[] = [
            '[/Script/ShooterGame.ShooterGameUserSettings]',
            'MasterAudioVolume=1.000000',
            'MusicAudioVolume=1.000000',
            'SFXAudioVolume=1.000000',
            `bUseVSync=${settings.vsync ? 'True' : 'False'}`,
            `bUseDynamicResolution=False`,
            `ResolutionSizeX=${settings.resolutionX}`,
            `ResolutionSizeY=${settings.resolutionY}`,
            `LastUserConfirmedResolutionSizeX=${settings.resolutionX}`,
            `LastUserConfirmedResolutionSizeY=${settings.resolutionY}`,
            `WindowPosX=-1`,
            `WindowPosY=-1`,
            `FullscreenMode=${settings.fullscreen ? '0' : '1'}`,
            `LastConfirmedFullscreenMode=${settings.fullscreen ? '0' : '1'}`,
            `PreferredFullscreenMode=${settings.fullscreen ? '0' : '1'}`,
            `FrameRateLimit=${settings.maxFps}.000000`,
            '',
            '[ScalabilityGroups]',
            `sg.ResolutionQuality=100`,
            `sg.ViewDistanceQuality=${settings.viewDistance}`,
            `sg.AntiAliasingQuality=${settings.antiAliasing}`,
            `sg.ShadowQuality=${settings.shadowQuality}`,
            `sg.PostProcessQuality=${settings.graphicsQuality}`,
            `sg.TextureQuality=${settings.textureQuality}`,
            `sg.EffectsQuality=${settings.graphicsQuality}`,
            `sg.FoliageQuality=${settings.graphicsQuality}`,
            '',
            '[SessionSettings]',
            'SessionName=ARK',
            '',
            '[/Script/Engine.GameUserSettings]',
            `bUseDesiredScreenHeight=False`,
            `bUseHDRDisplayOutput=False`,
            '',
            '[ServerSettings]',
            `ShowFloatingDamageText=${settings.showFloatingNames ? 'True' : 'False'}`,
            `ShowStatusNotificationMessages=${settings.showStatusNotifications ? 'True' : 'False'}`,
            '',
            '[-Launch Options-]',
            settings.lowMemory ? '-lowmemory' : '',
            settings.noSound ? '-nosound' : '',
            !settings.useBattleye ? '-NoBattlEye' : '',
        ].filter(line => line !== '');

        return lines.join('\n');
    };

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(generateIni());
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const downloadIni = () => {
        const content = generateIni();
        const blob = new Blob([content], { type: 'text/plain' });
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

    return (
        <div className="ini-generator">
            <div className="ini-generator__header">
                <h2>⚙️ {isKorean ? 'INI 생성기' : 'INI Generator'}</h2>
                <span className="ini-generator__subtitle">GameUserSettings.ini</span>
                {onClose && (
                    <button className="ini-generator__close" onClick={onClose}>✕</button>
                )}
            </div>

            <div className="ini-generator__content">
                {/* Graphics Settings */}
                <div className="ini-section">
                    <h3>🖥️ {isKorean ? '그래픽 설정' : 'Graphics Settings'}</h3>

                    <div className="ini-row">
                        <label>{isKorean ? '해상도' : 'Resolution'}</label>
                        <div className="ini-row__inputs">
                            <input
                                type="number"
                                value={settings.resolutionX}
                                onChange={(e) => updateSetting('resolutionX', parseInt(e.target.value) || 1920)}
                                className="input input--small"
                            />
                            <span>×</span>
                            <input
                                type="number"
                                value={settings.resolutionY}
                                onChange={(e) => updateSetting('resolutionY', parseInt(e.target.value) || 1080)}
                                className="input input--small"
                            />
                        </div>
                    </div>

                    <div className="ini-row">
                        <label>{isKorean ? '전체 화면' : 'Fullscreen'}</label>
                        <button
                            className={`toggle-btn ${settings.fullscreen ? 'toggle-btn--active' : ''}`}
                            onClick={() => updateSetting('fullscreen', !settings.fullscreen)}
                        >
                            {settings.fullscreen ? 'ON' : 'OFF'}
                        </button>
                    </div>

                    <div className="ini-row">
                        <label>VSync</label>
                        <button
                            className={`toggle-btn ${settings.vsync ? 'toggle-btn--active' : ''}`}
                            onClick={() => updateSetting('vsync', !settings.vsync)}
                        >
                            {settings.vsync ? 'ON' : 'OFF'}
                        </button>
                    </div>

                    <div className="ini-row">
                        <label>{isKorean ? '최대 FPS' : 'Max FPS'}</label>
                        <input
                            type="number"
                            value={settings.maxFps}
                            onChange={(e) => updateSetting('maxFps', parseInt(e.target.value) || 60)}
                            className="input input--small"
                            min={30}
                            max={240}
                        />
                    </div>

                    <div className="ini-row">
                        <label>{isKorean ? '그래픽 품질' : 'Graphics Quality'}</label>
                        <select
                            value={settings.graphicsQuality}
                            onChange={(e) => updateSetting('graphicsQuality', parseInt(e.target.value))}
                            className="select"
                        >
                            {qualityLabels.map((label, i) => (
                                <option key={i} value={i}>{label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="ini-row">
                        <label>{isKorean ? '시야 거리' : 'View Distance'}</label>
                        <select
                            value={settings.viewDistance}
                            onChange={(e) => updateSetting('viewDistance', parseInt(e.target.value))}
                            className="select"
                        >
                            {qualityLabels.map((label, i) => (
                                <option key={i} value={i}>{label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="ini-row">
                        <label>{isKorean ? '안티앨리어싱' : 'Anti-Aliasing'}</label>
                        <select
                            value={settings.antiAliasing}
                            onChange={(e) => updateSetting('antiAliasing', parseInt(e.target.value))}
                            className="select"
                        >
                            {qualityLabels.map((label, i) => (
                                <option key={i} value={i}>{label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="ini-row">
                        <label>{isKorean ? '그림자 품질' : 'Shadow Quality'}</label>
                        <select
                            value={settings.shadowQuality}
                            onChange={(e) => updateSetting('shadowQuality', parseInt(e.target.value))}
                            className="select"
                        >
                            {qualityLabels.map((label, i) => (
                                <option key={i} value={i}>{label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="ini-row">
                        <label>{isKorean ? '텍스처 품질' : 'Texture Quality'}</label>
                        <select
                            value={settings.textureQuality}
                            onChange={(e) => updateSetting('textureQuality', parseInt(e.target.value))}
                            className="select"
                        >
                            {qualityLabels.map((label, i) => (
                                <option key={i} value={i}>{label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Game Settings */}
                <div className="ini-section">
                    <h3>🎮 {isKorean ? '게임 설정' : 'Game Settings'}</h3>

                    <div className="ini-row">
                        <label>{isKorean ? '조준점 표시' : 'Show Crosshair'}</label>
                        <button
                            className={`toggle-btn ${settings.showCrosshair ? 'toggle-btn--active' : ''}`}
                            onClick={() => updateSetting('showCrosshair', !settings.showCrosshair)}
                        >
                            {settings.showCrosshair ? 'ON' : 'OFF'}
                        </button>
                    </div>

                    <div className="ini-row">
                        <label>{isKorean ? 'HUD 크기' : 'HUD Scale'}</label>
                        <input
                            type="range"
                            value={settings.hudScale}
                            onChange={(e) => updateSetting('hudScale', parseFloat(e.target.value))}
                            min={0.5}
                            max={2}
                            step={0.1}
                            className="range-input"
                        />
                        <span className="range-value">{settings.hudScale.toFixed(1)}</span>
                    </div>

                    <div className="ini-row">
                        <label>{isKorean ? '플로팅 이름 표시' : 'Floating Names'}</label>
                        <button
                            className={`toggle-btn ${settings.showFloatingNames ? 'toggle-btn--active' : ''}`}
                            onClick={() => updateSetting('showFloatingNames', !settings.showFloatingNames)}
                        >
                            {settings.showFloatingNames ? 'ON' : 'OFF'}
                        </button>
                    </div>
                </div>

                {/* Advanced Settings */}
                <div className="ini-section">
                    <h3>⚡ {isKorean ? '실행 옵션' : 'Launch Options'}</h3>

                    <div className="ini-row">
                        <label>{isKorean ? '저메모리 모드' : 'Low Memory'}</label>
                        <button
                            className={`toggle-btn ${settings.lowMemory ? 'toggle-btn--active' : ''}`}
                            onClick={() => updateSetting('lowMemory', !settings.lowMemory)}
                        >
                            {settings.lowMemory ? 'ON' : 'OFF'}
                        </button>
                    </div>

                    <div className="ini-row">
                        <label>{isKorean ? '사운드 비활성화' : 'No Sound'}</label>
                        <button
                            className={`toggle-btn ${settings.noSound ? 'toggle-btn--active' : ''}`}
                            onClick={() => updateSetting('noSound', !settings.noSound)}
                        >
                            {settings.noSound ? 'ON' : 'OFF'}
                        </button>
                    </div>

                    <div className="ini-row">
                        <label>BattlEye</label>
                        <button
                            className={`toggle-btn ${settings.useBattleye ? 'toggle-btn--active' : ''}`}
                            onClick={() => updateSetting('useBattleye', !settings.useBattleye)}
                        >
                            {settings.useBattleye ? 'ON' : 'OFF'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Preview */}
            <div className="ini-preview">
                <div className="ini-preview__header">
                    <h4>📄 {isKorean ? '미리보기' : 'Preview'}</h4>
                </div>
                <pre className="ini-preview__code">
                    {generateIni()}
                </pre>
            </div>

            {/* Actions */}
            <div className="ini-actions">
                <button className="btn btn--secondary" onClick={copyToClipboard}>
                    {copied ? '✅ 복사됨!' : '📋 ' + (isKorean ? '복사' : 'Copy')}
                </button>
                <button className="btn btn--primary" onClick={downloadIni}>
                    💾 {isKorean ? '다운로드' : 'Download'}
                </button>
            </div>
        </div>
    );
}
