import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeFirestore,
  getFirestore,
  Firestore,
  doc,
  getDoc,
  persistentLocalCache,
  persistentSingleTabManager,
  memoryLocalCache,
  setLogLevel,
} from 'firebase/firestore';
import firebaseConfigRaw from '../firebase-applet-config.json';

const firebaseConfig = firebaseConfigRaw as any;

// Initialize Firebase App
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Suppress Firestore verbose warnings/logs such as offline/connection notices
try {
  setLogLevel('silent');
} catch (e) {
  // Ignore
}

// Initialize Firestore with robust local persistent cache
export const firestore: Firestore = (() => {
  const databaseId = firebaseConfig.firestoreDatabaseId;
  try {
    return initializeFirestore(
      app,
      {
        localCache: persistentLocalCache({ tabManager: persistentSingleTabManager({}) }),
        ignoreUndefinedProperties: true,
        experimentalForceLongPolling: true,
      },
      databaseId || undefined
    );
  } catch {
    try {
      return initializeFirestore(
        app,
        {
          localCache: memoryLocalCache(),
          ignoreUndefinedProperties: true,
          experimentalForceLongPolling: true,
        },
        databaseId || undefined
      );
    } catch {
      return databaseId ? getFirestore(app, databaseId) : getFirestore(app);
    }
  }
})();

/**
 * Validate connection to Cloud Firestore backend on app boot.
 * Uses a fast 2-second timeout race and navigator status to prevent 10-second backend timeout notices.
 */
export async function testConnection(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    console.info('[Firestore] Browser offline. Local storage persistence active.');
    return false;
  }

  try {
    const checkPromise = getDoc(doc(firestore, '_connection_', 'status'));
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Backend ping timeout')), 2000)
    );

    await Promise.race([checkPromise, timeoutPromise]);
    return true;
  } catch {
    console.info('[Firestore] Operating in local offline persistence mode.');
    return false;
  }
}

// Connection check is available on demand when sync is invoked
export default app;
