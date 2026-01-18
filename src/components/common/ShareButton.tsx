import { useRef, useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { exportElementAsImage, shareResult, copyImageToClipboard } from '../../utils/exportUtils';
import './ShareButton.css';

interface ShareButtonProps {
    targetRef: React.RefObject<HTMLElement | null>;
    title?: string;
    compact?: boolean;
}

export function ShareButton({ targetRef, title = 'ARK Tactics Result', compact = false }: ShareButtonProps) {
    const { i18n } = useTranslation();
    const isKorean = i18n.language === 'ko';
    const [isOpen, setIsOpen] = useState(false);
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const menuRef = useRef<HTMLDivElement>(null);

    const showFeedback = useCallback((success: boolean) => {
        setStatus(success ? 'success' : 'error');
        setTimeout(() => {
            setStatus('idle');
            setIsOpen(false);
        }, 1500);
    }, []);

    const handleDownload = useCallback(async () => {
        if (!targetRef.current) return;
        setStatus('loading');
        try {
            await exportElementAsImage(targetRef.current, { filename: title.replace(/\s+/g, '-').toLowerCase() });
            showFeedback(true);
        } catch {
            showFeedback(false);
        }
    }, [targetRef, title, showFeedback]);

    const handleShare = useCallback(async () => {
        if (!targetRef.current) return;
        setStatus('loading');
        try {
            await shareResult(targetRef.current, title, isKorean ? 'ARK Tactics 계산 결과' : 'ARK Tactics Calculation Result');
            showFeedback(true);
        } catch {
            showFeedback(false);
        }
    }, [targetRef, title, isKorean, showFeedback]);

    const handleCopy = useCallback(async () => {
        if (!targetRef.current) return;
        setStatus('loading');
        try {
            const success = await copyImageToClipboard(targetRef.current);
            showFeedback(success);
        } catch {
            showFeedback(false);
        }
    }, [targetRef, showFeedback]);

    const toggleMenu = () => {
        if (status === 'loading') return;
        setIsOpen(!isOpen);
    };

    // Close menu when clicking outside
    const handleClickOutside = useCallback((e: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
            setIsOpen(false);
        }
    }, []);

    // Add/remove click outside listener
    useEffect(() => {
        if (isOpen) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [isOpen, handleClickOutside]);

    const getButtonContent = () => {
        if (status === 'loading') return '⏳';
        if (status === 'success') return '✅';
        if (status === 'error') return '❌';
        return '📤';
    };

    return (
        <div className="share-button-wrapper" ref={menuRef}>
            <button
                className={`share-button ${compact ? 'share-button--compact' : ''} ${status !== 'idle' ? `share-button--${status}` : ''}`}
                onClick={toggleMenu}
                title={isKorean ? '공유/저장' : 'Share/Save'}
                disabled={status === 'loading'}
            >
                <span className="share-button__icon">{getButtonContent()}</span>
                {!compact && (
                    <span className="share-button__text">
                        {isKorean ? '공유' : 'Share'}
                    </span>
                )}
            </button>

            {isOpen && status === 'idle' && (
                <div className="share-menu">
                    <button className="share-menu__item" onClick={handleDownload}>
                        <span className="share-menu__icon">💾</span>
                        <span>{isKorean ? '이미지 저장' : 'Save Image'}</span>
                    </button>
                    <button className="share-menu__item" onClick={handleCopy}>
                        <span className="share-menu__icon">📋</span>
                        <span>{isKorean ? '클립보드 복사' : 'Copy to Clipboard'}</span>
                    </button>
                    {'share' in navigator && (
                        <button className="share-menu__item" onClick={handleShare}>
                            <span className="share-menu__icon">📱</span>
                            <span>{isKorean ? '앱으로 공유' : 'Share to App'}</span>
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
