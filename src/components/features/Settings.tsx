import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useDataExport } from '../../hooks/useDataExport';
import { useTheme } from '../../hooks/useTheme';
import './Settings.css';

const THEME_NAMES: Record<string, { kr: string; en: string; emoji: string }> = {
    cyberpunk: { kr: '사이버펑크', en: 'Cyberpunk', emoji: '🌃' },
    neon: { kr: '네온', en: 'Neon', emoji: '💜' },
    classic: { kr: '클래식', en: 'Classic', emoji: '🌲' },
    ocean: { kr: '오션', en: 'Ocean', emoji: '🌊' },
};

export function Settings() {
    const { i18n } = useTranslation();
    const isKorean = i18n.language === 'ko';
    const { exportData, importData, getExportPreview } = useDataExport();
    const { theme, presets, applyPreset, setAccentColor } = useTheme();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null);
    const [showPreview, setShowPreview] = useState(false);

    const preview = getExportPreview();
    const dataStats = {
        favorites: (preview.data['ark-pvp-favorites'] as unknown[])?.length || 0,
        recentHistory: (preview.data['ark-pvp-recent-history'] as unknown[])?.length || 0,
        watchlist: (preview.data['ark_taming_watchlist_v2'] as unknown[])?.length || 0,
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const result = await importData(file);
            setImportResult(result);
            if (result.success) {
                setTimeout(() => window.location.reload(), 2000);
            }
        }
        e.target.value = '';
    };

    const handleClearAll = () => {
        if (confirm(isKorean ? '모든 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.' : 'Clear all data? This cannot be undone.')) {
            localStorage.clear();
            window.location.reload();
        }
    };

    return (
        <div className="settings">
            <div className="page-header">
                <h2 className="page-title">⚙️ {isKorean ? '설정' : 'Settings'}</h2>
                <p className="page-desc">{isKorean ? '데이터 관리 및 앱 설정' : 'Data management & app settings'}</p>
            </div>

            {/* Theme Customization */}
            <div className="settings-section">
                <h3 className="settings-section__title">
                    🎨 {isKorean ? '테마 설정' : 'Theme Settings'}
                </h3>

                <div className="theme-presets">
                    {presets.map((preset) => (
                        <button
                            key={preset}
                            className={`theme-preset-btn ${theme.preset === preset ? 'theme-preset-btn--active' : ''}`}
                            onClick={() => applyPreset(preset)}
                        >
                            <span className="theme-preset-btn__emoji">{THEME_NAMES[preset]?.emoji}</span>
                            <span className="theme-preset-btn__name">
                                {isKorean ? THEME_NAMES[preset]?.kr : THEME_NAMES[preset]?.en}
                            </span>
                        </button>
                    ))}
                </div>

                <div className="custom-color">
                    <label>{isKorean ? '커스텀 색상' : 'Custom Color'}</label>
                    <input
                        type="color"
                        value={theme.accentColor}
                        onChange={(e) => setAccentColor(e.target.value)}
                        className="color-picker"
                    />
                    <span className="color-value">{theme.accentColor}</span>
                </div>
            </div>

            {/* Data Backup Section */}
            <div className="settings-section">
                <h3 className="settings-section__title">
                    💾 {isKorean ? '데이터 백업' : 'Data Backup'}
                </h3>

                <div className="data-stats">
                    <div className="data-stat">
                        <span className="data-stat__icon">⭐</span>
                        <span className="data-stat__label">{isKorean ? '즐겨찾기' : 'Favorites'}</span>
                        <span className="data-stat__value">{dataStats.favorites}</span>
                    </div>
                    <div className="data-stat">
                        <span className="data-stat__icon">🕒</span>
                        <span className="data-stat__label">{isKorean ? '최근 조회' : 'Recent'}</span>
                        <span className="data-stat__value">{dataStats.recentHistory}</span>
                    </div>
                    <div className="data-stat">
                        <span className="data-stat__icon">🦕</span>
                        <span className="data-stat__label">{isKorean ? '워치리스트' : 'Watchlist'}</span>
                        <span className="data-stat__value">{dataStats.watchlist}</span>
                    </div>
                </div>

                <div className="settings-actions">
                    <button className="btn btn--primary" onClick={exportData}>
                        📤 {isKorean ? '내보내기' : 'Export'}
                    </button>
                    <button className="btn btn--secondary" onClick={handleImportClick}>
                        📥 {isKorean ? '가져오기' : 'Import'}
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                    />
                </div>

                {importResult && (
                    <div className={`import-result ${importResult.success ? 'import-result--success' : 'import-result--error'}`}>
                        {importResult.success ? '✅' : '❌'} {importResult.message}
                    </div>
                )}

                <button className="preview-toggle" onClick={() => setShowPreview(!showPreview)}>
                    {showPreview ? '▼' : '▶'} {isKorean ? '데이터 미리보기' : 'Preview Data'}
                </button>

                {showPreview && (
                    <pre className="data-preview">
                        {JSON.stringify(preview, null, 2)}
                    </pre>
                )}
            </div>

            {/* Danger Zone */}
            <div className="settings-section settings-section--danger">
                <h3 className="settings-section__title">
                    ⚠️ {isKorean ? '위험 구역' : 'Danger Zone'}
                </h3>
                <p className="settings-section__desc">
                    {isKorean
                        ? '아래 작업은 되돌릴 수 없습니다. 신중하게 진행하세요.'
                        : 'These actions cannot be undone. Proceed with caution.'}
                </p>
                <button className="btn btn--danger" onClick={handleClearAll}>
                    🗑️ {isKorean ? '모든 데이터 삭제' : 'Clear All Data'}
                </button>
            </div>

            {/* App Info */}
            <div className="settings-section">
                <h3 className="settings-section__title">
                    ℹ️ {isKorean ? '앱 정보' : 'App Info'}
                </h3>
                <div className="app-info">
                    <div className="app-info__item">
                        <span>Version</span>
                        <span>1.0.0</span>
                    </div>
                    <div className="app-info__item">
                        <span>{isKorean ? '저장소' : 'Storage'}</span>
                        <span>localStorage</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
