import { useCallback } from 'react';

const EXPORT_KEYS = [
    'ark-pvp-favorites',
    'ark-pvp-recent-history',
    'ark_taming_watchlist_v2',
    'ark_level_cap',
];

interface ExportData {
    version: string;
    exportedAt: string;
    data: Record<string, unknown>;
}

interface UseDataExportReturn {
    exportData: () => void;
    importData: (file: File) => Promise<{ success: boolean; message: string }>;
    getExportPreview: () => ExportData;
}

export function useDataExport(): UseDataExportReturn {
    const getExportPreview = useCallback((): ExportData => {
        const data: Record<string, unknown> = {};

        EXPORT_KEYS.forEach(key => {
            const value = localStorage.getItem(key);
            if (value) {
                try {
                    data[key] = JSON.parse(value);
                } catch {
                    data[key] = value;
                }
            }
        });

        return {
            version: '1.0.0',
            exportedAt: new Date().toISOString(),
            data,
        };
    }, []);

    const exportData = useCallback(() => {
        const exportObj = getExportPreview();
        const json = JSON.stringify(exportObj, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `ark-pvp-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, [getExportPreview]);

    const importData = useCallback(async (file: File): Promise<{ success: boolean; message: string }> => {
        return new Promise((resolve) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const content = e.target?.result as string;
                    const imported: ExportData = JSON.parse(content);

                    if (!imported.version || !imported.data) {
                        resolve({ success: false, message: '유효하지 않은 백업 파일입니다.' });
                        return;
                    }

                    let importedCount = 0;
                    Object.entries(imported.data).forEach(([key, value]) => {
                        if (EXPORT_KEYS.includes(key)) {
                            localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
                            importedCount++;
                        }
                    });

                    resolve({
                        success: true,
                        message: `${importedCount}개 항목을 가져왔습니다. 페이지를 새로고침하세요.`
                    });
                } catch (error) {
                    resolve({ success: false, message: '파일 파싱에 실패했습니다.' });
                }
            };

            reader.onerror = () => {
                resolve({ success: false, message: '파일 읽기에 실패했습니다.' });
            };

            reader.readAsText(file);
        });
    }, []);

    return {
        exportData,
        importData,
        getExportPreview,
    };
}
