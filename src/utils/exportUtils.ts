import html2canvas from 'html2canvas';

export interface ExportOptions {
    filename?: string;
    backgroundColor?: string;
    scale?: number;
}

/**
 * Capture an element as an image and trigger download
 */
export async function exportElementAsImage(
    element: HTMLElement,
    options: ExportOptions = {}
): Promise<void> {
    const {
        filename = `ark-tactics-${Date.now()}`,
        backgroundColor = '#121212',
        scale = 2
    } = options;

    try {
        const canvas = await html2canvas(element, {
            backgroundColor,
            scale,
            useCORS: true,
            logging: false,
            allowTaint: true,
            foreignObjectRendering: false,
            removeContainer: true,
            imageTimeout: 0,
            onclone: (clonedDoc) => {
                // Fix any problematic elements in the cloned document
                const clonedElement = clonedDoc.body.querySelector('.pie-chart');
                if (clonedElement) {
                    // Ensure pie chart has proper dimensions
                    (clonedElement as HTMLElement).style.minWidth = '160px';
                    (clonedElement as HTMLElement).style.minHeight = '160px';
                }
            }
        });

        // Create download link
        const link = document.createElement('a');
        link.download = `${filename}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();

        return;
    } catch (error) {
        console.error('Failed to export image:', error);
        throw error;
    }
}

/**
 * Capture an element as a blob for sharing
 */
export async function captureElementAsBlob(
    element: HTMLElement,
    backgroundColor = '#121212'
): Promise<Blob> {
    const canvas = await html2canvas(element, {
        backgroundColor,
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true
    });

    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) {
                resolve(blob);
            } else {
                reject(new Error('Failed to create blob'));
            }
        }, 'image/png');
    });
}

/**
 * Share content using Web Share API (if supported)
 */
export async function shareResult(
    element: HTMLElement,
    title: string,
    text: string
): Promise<boolean> {
    // Check if Web Share API is supported
    if (!navigator.share) {
        // Fallback to download
        await exportElementAsImage(element, { filename: title.replace(/\s+/g, '-').toLowerCase() });
        return false;
    }

    try {
        const blob = await captureElementAsBlob(element);
        const file = new File([blob], `${title}.png`, { type: 'image/png' });

        await navigator.share({
            title,
            text,
            files: [file]
        });

        return true;
    } catch (error) {
        // User cancelled or error occurred
        if ((error as Error).name !== 'AbortError') {
            console.error('Share failed:', error);
            // Fallback to download
            await exportElementAsImage(element, { filename: title.replace(/\s+/g, '-').toLowerCase() });
        }
        return false;
    }
}

/**
 * Copy image to clipboard
 */
export async function copyImageToClipboard(element: HTMLElement): Promise<boolean> {
    try {
        const blob = await captureElementAsBlob(element);

        await navigator.clipboard.write([
            new ClipboardItem({
                'image/png': blob
            })
        ]);

        return true;
    } catch (error) {
        console.error('Failed to copy image:', error);
        return false;
    }
}
