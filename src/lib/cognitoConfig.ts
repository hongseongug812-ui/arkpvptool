// AWS Amplify Configuration for Cognito
import { Amplify } from 'aws-amplify';

const COGNITO_DOMAIN = "ap-northeast-2rrxrgr12q.auth.ap-northeast-2.amazoncognito.com";

Amplify.configure({
    Auth: {
        Cognito: {
            userPoolId: 'ap-northeast-2_rrxRgR12q',
            userPoolClientId: '5fo7590rfgih1nk2hh47fvcb94',
            loginWith: {
                oauth: {
                    domain: COGNITO_DOMAIN,
                    scopes: ['phone', 'openid', 'email'],
                    redirectSignIn: [window.location.origin],
                    redirectSignOut: [window.location.origin],
                    responseType: 'code',
                }
            }
        }
    }
});

// User Pool Info (for reference)
export const COGNITO_USER_POOL_ID = "ap-northeast-2_rrxRgR12q";
export const COGNITO_CLIENT_ID = "5fo7590rfgih1nk2hh47fvcb94";
export const COGNITO_REGION = "ap-northeast-2";

// Lambda API URL
export const API_URL = "https://5zhxdohuu2japawoes6nehxeji0mmpzn.lambda-url.ap-northeast-2.on.aws";
