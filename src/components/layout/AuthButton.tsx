import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './AuthButton.css';

// Cognito Configuration
const COGNITO_DOMAIN = "ap-northeast-2rrxrgr12q.auth.ap-northeast-2.amazoncognito.com";
const CLIENT_ID = "5fo7590rfgih1nk2hh47fvcb94";
const REDIRECT_URI = window.location.origin;
const SCOPES = "email openid phone";

interface User {
    email?: string;
    sub?: string;
}

export function AuthButton() {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { i18n } = useTranslation();
    const isKorean = i18n.language === 'ko';

    useEffect(() => {
        checkForAuthCallback();
        checkStoredUser();
    }, []);

    // Check if we're returning from a Cognito login
    function checkForAuthCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');

        if (code) {
            // Exchange code for tokens
            exchangeCodeForTokens(code);
        }
    }

    async function exchangeCodeForTokens(code: string) {
        try {
            const tokenEndpoint = `https://${COGNITO_DOMAIN}/oauth2/token`;
            const body = new URLSearchParams({
                grant_type: 'authorization_code',
                client_id: CLIENT_ID,
                code: code,
                redirect_uri: REDIRECT_URI,
            });

            const response = await fetch(tokenEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: body.toString(),
            });

            if (response.ok) {
                const tokens = await response.json();
                localStorage.setItem('cognito_access_token', tokens.access_token);
                localStorage.setItem('cognito_id_token', tokens.id_token);

                // Decode ID token to get user info
                const payload = JSON.parse(atob(tokens.id_token.split('.')[1]));
                const userData = { email: payload.email, sub: payload.sub };
                localStorage.setItem('cognito_user', JSON.stringify(userData));
                setUser(userData);

                // Clean URL
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        } catch (error) {
            console.error('Token exchange error:', error);
        } finally {
            setIsLoading(false);
        }
    }

    function checkStoredUser() {
        const storedUser = localStorage.getItem('cognito_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setIsLoading(false);
    }

    function handleSignIn() {
        const loginUrl = `https://${COGNITO_DOMAIN}/oauth2/authorize?` +
            `client_id=${CLIENT_ID}&` +
            `response_type=code&` +
            `scope=${encodeURIComponent(SCOPES)}&` +
            `redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;

        window.location.href = loginUrl;
    }

    function handleSignOut() {
        localStorage.removeItem('cognito_access_token');
        localStorage.removeItem('cognito_id_token');
        localStorage.removeItem('cognito_user');
        setUser(null);

        // Optionally redirect to Cognito logout
        const logoutUrl = `https://${COGNITO_DOMAIN}/logout?` +
            `client_id=${CLIENT_ID}&` +
            `logout_uri=${encodeURIComponent(REDIRECT_URI)}`;
        window.location.href = logoutUrl;
    }

    if (isLoading) {
        return <div className="auth-btn auth-btn--loading">⏳</div>;
    }

    if (user) {
        return (
            <div className="auth-user">
                <div className="auth-user__avatar">
                    {user.email?.charAt(0).toUpperCase() || '👤'}
                </div>
                <div className="auth-user__menu">
                    <span className="auth-user__email">{user.email}</span>
                    <button
                        className="auth-user__logout"
                        onClick={handleSignOut}
                    >
                        {isKorean ? '로그아웃' : 'Sign Out'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <button
            className="auth-btn auth-btn--login"
            onClick={handleSignIn}
        >
            👤 {isKorean ? '로그인' : 'Sign In'}
        </button>
    );
}
