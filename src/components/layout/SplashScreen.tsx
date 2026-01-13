import './SplashScreen.css';

interface SplashScreenProps {
    progress: number;
}

export function SplashScreen({ progress }: SplashScreenProps) {
    return (
        <div className="splash-screen">
            {/* Background Grid */}
            <div className="splash-grid"></div>

            {/* Main Content */}
            <div className="splash-content">
                {/* ARK Implant Logo with Scanner */}
                <div className="splash-logo">
                    <div className="implant-scanner">
                        <span className="implant-icon">💠</span>
                        <div className="scanner-ring-splash scanner-ring-splash--1"></div>
                        <div className="scanner-ring-splash scanner-ring-splash--2"></div>
                        <div className="scanner-ring-splash scanner-ring-splash--3"></div>
                    </div>
                </div>

                {/* Title */}
                <div className="splash-title">
                    <h1>ARK TACTICS</h1>
                    <p>PVP UTILITY</p>
                </div>

                {/* Loading Bar */}
                <div className="splash-loader">
                    <div className="loader-label">
                        <span>SCANNING DATA</span>
                        <span>{progress}%</span>
                    </div>
                    <div className="loader-bar">
                        <div className="loader-fill" style={{ width: `${progress}%` }}>
                            <div className="loader-glow"></div>
                        </div>
                    </div>
                    <div className="loader-status">
                        {progress < 30 && '구조물 데이터 로딩...'}
                        {progress >= 30 && progress < 60 && '공룡 스탯 로딩...'}
                        {progress >= 60 && progress < 90 && '집터 데이터 로딩...'}
                        {progress >= 90 && '초기화 완료!'}
                    </div>
                </div>
            </div>

            {/* Corner Decorations */}
            <div className="corner corner--tl"></div>
            <div className="corner corner--tr"></div>
            <div className="corner corner--bl"></div>
            <div className="corner corner--br"></div>
        </div>
    );
}
