import './EmptyState.css';

interface EmptyStateProps {
    type?: 'loading' | 'empty' | 'error';
    message?: string;
}

export function EmptyState({ type = 'empty', message }: EmptyStateProps) {
    const getContent = () => {
        switch (type) {
            case 'loading':
                return {
                    icon: '💠',
                    text: message || '데이터를 스캔 중입니다...',
                    animationClass: 'empty-state__icon--scanning',
                };
            case 'error':
                return {
                    icon: '⚠️',
                    text: message || '오류가 발생했습니다',
                    animationClass: '',
                };
            default:
                return {
                    icon: '🔍',
                    text: message || '검색 결과가 없습니다',
                    animationClass: '',
                };
        }
    };

    const content = getContent();

    return (
        <div className={`empty-state empty-state--${type}`}>
            {/* ARK Implant Scanner Effect */}
            <div className="empty-state__scanner">
                <div className={`empty-state__icon ${content.animationClass}`}>
                    <span className="icon-core">{content.icon}</span>
                    {type === 'loading' && (
                        <>
                            <div className="scanner-ring scanner-ring--1"></div>
                            <div className="scanner-ring scanner-ring--2"></div>
                            <div className="scanner-ring scanner-ring--3"></div>
                        </>
                    )}
                </div>
            </div>

            <p className="empty-state__text">{content.text}</p>

            {type === 'loading' && (
                <div className="empty-state__dots">
                    <span className="dot"></span>
                    <span className="dot"></span>
                    <span className="dot"></span>
                </div>
            )}
        </div>
    );
}
