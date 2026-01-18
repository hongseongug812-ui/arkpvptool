import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './PWAInstallPrompt.css';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
    const { i18n } = useTranslation();
    const isKorean = i18n.language === 'ko';
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
            return;
        }

        // Check if dismissed recently
        const dismissed = localStorage.getItem('pwa_prompt_dismissed');
        if (dismissed) {
            const dismissedTime = parseInt(dismissed, 10);
            const daysPassed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
            if (daysPassed < 7) return; // Don't show for 7 days after dismissal
        }

        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            // Show prompt after a short delay
            setTimeout(() => setShowPrompt(true), 3000);
        };

        const handleAppInstalled = () => {
            setIsInstalled(true);
            setShowPrompt(false);
            setDeferredPrompt(null);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setIsInstalled(true);
        }

        setShowPrompt(false);
        setDeferredPrompt(null);
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem('pwa_prompt_dismissed', Date.now().toString());
    };

    if (!showPrompt || isInstalled) return null;

    return (
        <div className="pwa-prompt animate-slide-up">
            <div className="pwa-prompt__icon">📱</div>
            <div className="pwa-prompt__content">
                <span className="pwa-prompt__title">
                    {isKorean ? '앱 설치하기' : 'Install App'}
                </span>
                <span className="pwa-prompt__desc">
                    {isKorean
                        ? '홈 화면에 추가하여 빠르게 접근하세요!'
                        : 'Add to home screen for quick access!'}
                </span>
            </div>
            <div className="pwa-prompt__actions">
                <button className="pwa-prompt__btn pwa-prompt__btn--install" onClick={handleInstall}>
                    {isKorean ? '설치' : 'Install'}
                </button>
                <button className="pwa-prompt__btn pwa-prompt__btn--dismiss" onClick={handleDismiss}>
                    ✕
                </button>
            </div>
        </div>
    );
}
