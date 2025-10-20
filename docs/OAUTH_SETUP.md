# OAuth Setup Guide

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to Credentials → Create Credentials → OAuth 2.0 Client ID
5. Add authorized redirect URIs:
   - Development: `http://localhost:5000/api/v1/auth/google/callback`
   - Production: `https://api.yourdomain.com/api/v1/auth/google/callback`
6. Copy Client ID and Client Secret to `.env`

## Facebook OAuth Setup

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app or select existing
3. Add Facebook Login product
4. Configure OAuth Redirect URIs:
   - Development: `http://localhost:5000/api/v1/auth/facebook/callback`
   - Production: `https://api.yourdomain.com/api/v1/auth/facebook/callback`
5. Copy App ID and App Secret to `.env`

## Apple Sign In Setup

1. Go to [Apple Developer](https://developer.apple.com/)
2. Create an App ID with Sign In with Apple capability
3. Create a Services ID
4. Configure Sign In with Apple:
   - Return URLs: `https://api.yourdomain.com/api/v1/auth/apple/callback`
5. Create a private key
6. Download the private key (.p8 file)
7. Save to `./certs/apple-private-key.p8`
8. Copy Team ID, Key ID, and Client ID to `.env`

## Testing OAuth

### Google
Navigate to: `http://localhost:5000/api/v1/auth/google`

### Facebook
Navigate to: `http://localhost:5000/api/v1/auth/facebook`

### Apple
Navigate to: `http://localhost:5000/api/v1/auth/apple`

## Frontend Integration
```javascript
// Redirect to OAuth
window.location.href = 'http://localhost:5000/api/v1/auth/google';

// Handle callback
const urlParams = new URLSearchParams(window.location.search);
const accessToken = urlParams.get('accessToken');
const refreshToken = urlParams.get('refreshToken');
const isNewUser = urlParams.get('isNewUser') === 'true';

// Store tokens
localStorage.setItem('accessToken', accessToken);
localStorage.setItem('refreshToken', refreshToken);

// Redirect based on user status
if (isNewUser) {
  window.location.href = '/onboarding';
} else {
  window.location.href = '/dashboard';
}
```