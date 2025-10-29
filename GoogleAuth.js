import { serverUrl } from '../src/App';

// Simple Google OAuth implementation for frontend
// Use environment variable for client ID to match backend

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '458280472299-vmd1t5nekhckkk2b2pna6erhhni0vr6u.apps.googleusercontent.com';
const REDIRECT_URI = 'mongodb://localhost:27017/shopnest/auth/callback';
const SCOPE = 'openid email profile';

class GoogleAuthService {
  getAuthUrl() {
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      scope: SCOPE,
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent'
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async handleCallback(code) {
    try {
      console.log('GoogleAuth: Received code from callback:', code);
      const response = await fetch(`${serverUrl}/api/auth/google/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ code, redirect_uri: REDIRECT_URI })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('GoogleAuth: Token exchange failed with status:', response.status, errorData);
        throw new Error(errorData.message || 'Failed to exchange code for token');
      }

      const data = await response.json();
      console.log('GoogleAuth: Token exchange successful, user data:', data.user);

      // Store user data in localStorage for immediate use
      localStorage.setItem('userData', JSON.stringify(data.user));

      return data;
    } catch (error) {
      console.error('GoogleAuth: Error exchanging code for token:', error);
      throw error;
    }
  }

  async getUserInfo(accessToken) {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get user info');
      }

      const userInfo = await response.json();
      return {
        name: userInfo.name,
        email: userInfo.email,
        picture: userInfo.picture
      };
    } catch (error) {
      console.error('Error getting user info:', error);
      throw error;
    }
  }
}

export default new GoogleAuthService();