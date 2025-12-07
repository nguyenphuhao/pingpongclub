import * as admin from 'firebase-admin';
import { env } from '../config/env.config';

/**
 * Firebase Admin SDK Adapter
 * Sau này trong NestJS: wrap thành FirebaseAdminService @Injectable()
 */

let firebaseApp: admin.app.App | undefined;

export function initializeFirebaseAdmin() {
  // Check if Firebase app already exists (important for Next.js dev mode hot reload)
  if (admin.apps.length > 0) {
    firebaseApp = admin.apps[0] as admin.app.App;
    return firebaseApp;
  }

  try {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: env.FIREBASE_PROJECT_ID,
        privateKey: env.FIREBASE_PRIVATE_KEY,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
      }),
    });
    console.log('✅ Firebase Admin initialized');
  } catch (error) {
    console.error('❌ Firebase Admin initialization failed:', error);
    throw error;
  }

  return firebaseApp;
}

export function getFirebaseAdmin(): admin.app.App {
  if (!firebaseApp || admin.apps.length === 0) {
    return initializeFirebaseAdmin();
  }
  return firebaseApp;
}

/**
 * Firebase Auth helper
 */
export class FirebaseAuthAdapter {
  private auth: admin.auth.Auth;

  constructor() {
    const app = getFirebaseAdmin();
    this.auth = app.auth();
  }

  /**
   * Verify Firebase ID Token
   */
  async verifyIdToken(idToken: string) {
    try {
      const decodedToken = await this.auth.verifyIdToken(idToken);
      return decodedToken;
    } catch (error) {
      throw new Error('Invalid Firebase token');
    }
  }

  /**
   * Get user by UID
   */
  async getUserByUid(uid: string) {
    try {
      return await this.auth.getUser(uid);
    } catch (error) {
      throw new Error(`Firebase user not found: ${uid}`);
    }
  }

  /**
   * Extract provider from Firebase decoded token
   * Returns: 'google.com', 'facebook.com', 'password', 'phone', etc.
   */
  getProviderFromToken(decodedToken: admin.auth.DecodedIdToken): string | null {
    // Firebase token has firebase.sign_in_provider field
    const provider = (decodedToken.firebase as any)?.sign_in_provider;
    return provider || null;
  }

  /**
   * Create custom token
   */
  async createCustomToken(uid: string, claims?: object) {
    return await this.auth.createCustomToken(uid, claims);
  }

  /**
   * Set custom claims
   */
  async setCustomUserClaims(uid: string, claims: object) {
    return await this.auth.setCustomUserClaims(uid, claims);
  }

  /**
   * Delete user
   */
  async deleteUser(uid: string) {
    return await this.auth.deleteUser(uid);
  }
}

/**
 * Firebase Messaging helper (for push notifications)
 */
export class FirebaseMessagingAdapter {
  private messaging: admin.messaging.Messaging;

  constructor() {
    const app = getFirebaseAdmin();
    this.messaging = app.messaging();
  }

  /**
   * Send to single device
   */
  async sendToDevice(
    token: string,
    notification: { title: string; body: string },
    data?: Record<string, string>,
  ) {
    try {
      const message: admin.messaging.Message = {
        token,
        notification,
        data,
      };
      const response = await this.messaging.send(message);
      return { success: true, messageId: response };
    } catch (error: any) {
      console.error('FCM send error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send to multiple devices
   */
  async sendToMultipleDevices(
    tokens: string[],
    notification: { title: string; body: string },
    data?: Record<string, string>,
  ) {
    try {
      const message: admin.messaging.MulticastMessage = {
        tokens,
        notification,
        data,
      };
      const response = await this.messaging.sendEachForMulticast(message);
      return {
        success: response.successCount > 0,
        successCount: response.successCount,
        failureCount: response.failureCount,
        responses: response.responses,
      };
    } catch (error: any) {
      console.error('FCM multicast error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send to topic
   */
  async sendToTopic(
    topic: string,
    notification: { title: string; body: string },
    data?: Record<string, string>,
  ) {
    try {
      const message: admin.messaging.Message = {
        topic,
        notification,
        data,
      };
      const response = await this.messaging.send(message);
      return { success: true, messageId: response };
    } catch (error: any) {
      console.error('FCM topic send error:', error);
      return { success: false, error: error.message };
    }
  }
}

/**
 * Trong NestJS, file này sẽ trở thành:
 * 
 * @Injectable()
 * export class FirebaseAdminService {
 *   private app: admin.app.App;
 *   
 *   constructor(private configService: ConfigService) {
 *     this.app = admin.initializeApp({...});
 *   }
 *   
 *   getAuth() { return this.app.auth(); }
 *   getMessaging() { return this.app.messaging(); }
 * }
 */

