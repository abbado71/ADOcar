import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User, 
  signOut 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

export const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/spreadsheets',
];

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
SCOPES.forEach((scope) => provider.addScope(scope));
provider.setCustomParameters({
  prompt: 'select_account',
});

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

declare global {
  interface Window {
    google?: any;
  }
}

const loadGsiScript = (): Promise<void> => {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.google?.accounts?.oauth2) {
      resolve();
      return;
    }
    const existing = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      setTimeout(resolve, 1500);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => resolve();
    document.head.appendChild(script);
    setTimeout(resolve, 2000);
  });
};

/**
 * Direct Google Identity Services (GSI) OAuth Token Flow
 * Works reliably inside browser iframes without third-party cookie restrictions
 */
export const requestGisToken = async (): Promise<{ user: { email?: string | null }; accessToken: string }> => {
  await loadGsiScript();
  if (typeof window === 'undefined' || !window.google?.accounts?.oauth2) {
    throw new Error('Google Identity Services non caricato');
  }

  return new Promise((resolve, reject) => {
    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: firebaseConfig.oAuthClientId,
        scope: SCOPES.join(' '),
        callback: async (tokenResponse: any) => {
          if (tokenResponse.error) {
            console.error('GIS Error:', tokenResponse);
            reject(new Error(tokenResponse.error_description || tokenResponse.error || 'Accesso Google non riuscito'));
            return;
          }
          if (!tokenResponse.access_token) {
            reject(new Error('Nessun token di accesso ricevuto da Google.'));
            return;
          }

          const accessToken = tokenResponse.access_token;
          cachedAccessToken = accessToken;

          let email: string | undefined = undefined;
          try {
            const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${accessToken}` },
            });
            if (userInfoRes.ok) {
              const info = await userInfoRes.json();
              email = info.email;
            }
          } catch (e) {
            console.warn('Info utente non disponibili, utilizzo email predefinita:', e);
          }

          resolve({
            user: { email: email || 'ado.domenico@gmail.com' },
            accessToken,
          });
        },
        error_callback: (err: any) => {
          reject(err);
        },
      });

      client.requestAccessToken({ prompt: '' });
    } catch (e) {
      reject(e);
    }
  });
};

export const googleSignIn = async (): Promise<{ user: { email?: string | null } | User; accessToken: string } | null> => {
  // 1. Try Google Identity Services first (best compatibility with iframes)
  try {
    const gisResult = await requestGisToken();
    if (gisResult?.accessToken) {
      return gisResult;
    }
  } catch (gisError) {
    console.warn('GIS tentativo fallito, fallback su Firebase Auth:', gisError);
  }

  // 2. Fallback to Firebase Auth signInWithPopup
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Impossibile ottenere il token di accesso Google dal login.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Errore Google Sign-in Firebase:', error);
    const code = error?.code || '';
    const message = error?.message || '';

    if (code === 'auth/popup-closed-by-user' || message.includes('popup-closed-by-user')) {
      const customErr: any = new Error(
        'La finestra di accesso Google è stata chiusa prima del completamento oppure è stata bloccata dalle impostazioni del browser.'
      );
      customErr.code = 'auth/popup-closed-by-user';
      throw customErr;
    } else if (code === 'auth/popup-blocked' || message.includes('popup-blocked')) {
      const customErr: any = new Error(
        'La finestra popup di accesso è stata bloccata dal browser. Consenti i popup per questo sito e riprova.'
      );
      customErr.code = 'auth/popup-blocked';
      throw customErr;
    } else if (code === 'auth/cancelled-popup-request' || message.includes('cancelled-popup-request')) {
      const customErr: any = new Error('Richiesta popup già in corso. Attendi qualche istante e riprova.');
      customErr.code = 'auth/cancelled-popup-request';
      throw customErr;
    }
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const setCachedAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

export const logoutGoogle = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};
