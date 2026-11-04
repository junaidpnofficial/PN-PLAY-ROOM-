import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  updateDoc,
  increment,
  arrayUnion,
  onSnapshot,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { db, auth, googleProvider, signInWithPopup, signOut, handleFirestoreError, OperationType } from '../firebase';
import { GameResult, PublishedItem, ModerationStatus } from '../types';
import { checkContentModeration } from './moderationService';

export const ADMIN_EMAIL = 'junaidpnofficial@gmail.com';

const LOCAL_PUBLISHED_KEY = 'playroom_published_items_cache';

export function isUserAdmin(user: User | null): boolean {
  if (!user) return false;
  return user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

/**
 * Save a completed game record to Firestore
 */
export async function saveGameResultToFirestore(result: GameResult): Promise<void> {
  const collectionPath = 'game_results';
  try {
    const payload: Record<string, any> = {
      id: String(result.id).slice(0, 128),
      n: String(result.n || 'Player').slice(0, 60),
      g: String(result.g || 'Game').slice(0, 50),
      gameId: String(result.gameId).slice(0, 30),
      v: Number(result.v) || 0,
      t: Number(result.t) || Date.now(),
      createdAt: serverTimestamp(),
    };
    if (result.detail && typeof result.detail === 'string') {
      payload.detail = result.detail.slice(0, 200);
    }

    const docRef = doc(db, collectionPath, payload.id);
    await setDoc(docRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${collectionPath}/${result.id}`);
  }
}

/**
 * Delete a game record from Firestore (Admin restricted)
 */
export async function deleteGameResultFromFirestore(resultId: string): Promise<void> {
  const collectionPath = 'game_results';
  try {
    const docRef = doc(db, collectionPath, resultId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${collectionPath}/${resultId}`);
  }
}

/**
 * Real-time listener for game results across players
 */
export function subscribeToGameResults(onUpdate: (results: GameResult[]) => void): () => void {
  const collectionPath = 'game_results';
  try {
    const q = query(collection(db, collectionPath), orderBy('t', 'desc'), limit(150));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: GameResult[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          items.push({
            id: data.id || docSnap.id,
            n: data.n,
            g: data.g,
            gameId: data.gameId,
            v: data.v,
            t: data.t,
            detail: data.detail,
          });
        });
        onUpdate(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, collectionPath);
      }
    );
    return unsubscribe;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, collectionPath);
    return () => {};
  }
}

// -------------------------------------------------------------
// Published Items & Moderation System
// -------------------------------------------------------------

function getCachedPublishedItems(): PublishedItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_PUBLISHED_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

function saveCachedPublishedItems(items: PublishedItem[]): void {
  try {
    localStorage.setItem(LOCAL_PUBLISHED_KEY, JSON.stringify(items.slice(0, 100)));
  } catch {}
}

/**
 * Publishes user content (challenge, score card, or showcase) to Firestore.
 * Runs pre-publish content moderation.
 */
export async function publishContentItem(
  data: Omit<PublishedItem, 'id' | 'status' | 'flagCount' | 'createdAt'>
): Promise<PublishedItem> {
  // Pre-publish automated safety verification
  const titleCheck = checkContentModeration(data.title);
  if (!titleCheck.isClean) {
    throw new Error(titleCheck.reason || 'Title contains inappropriate language.');
  }

  if (data.detail) {
    const detailCheck = checkContentModeration(data.detail);
    if (!detailCheck.isClean) {
      throw new Error(detailCheck.reason || 'Description contains inappropriate language.');
    }
  }

  const nameCheck = checkContentModeration(data.authorName);
  if (!nameCheck.isClean) {
    throw new Error(nameCheck.reason || 'Player name contains inappropriate language.');
  }

  const cleanId = `pub_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const collectionPath = 'published_items';

  const publishedItem: PublishedItem = {
    id: cleanId,
    authorName: String(data.authorName).trim().slice(0, 60),
    type: data.type,
    gameId: data.gameId,
    title: String(data.title).trim().slice(0, 80),
    detail: data.detail ? String(data.detail).trim().slice(0, 250) : undefined,
    scoreValue: Number(data.scoreValue) || 0,
    challengeSeed: data.challengeSeed ? String(data.challengeSeed).slice(0, 100) : undefined,
    status: 'active',
    flagCount: 0,
    flagReasons: [],
    createdAt: Date.now(),
  };

  // Cache locally
  const currentLocal = getCachedPublishedItems();
  saveCachedPublishedItems([publishedItem, ...currentLocal.filter((p) => p.id !== cleanId)]);

  try {
    const docRef = doc(db, collectionPath, cleanId);
    const firestoreData: Record<string, any> = {
      id: publishedItem.id,
      authorName: publishedItem.authorName,
      type: publishedItem.type,
      gameId: publishedItem.gameId,
      title: publishedItem.title,
      scoreValue: publishedItem.scoreValue,
      status: publishedItem.status,
      flagCount: publishedItem.flagCount,
      createdAt: publishedItem.createdAt,
    };

    if (publishedItem.detail) firestoreData.detail = publishedItem.detail;
    if (publishedItem.challengeSeed) firestoreData.challengeSeed = publishedItem.challengeSeed;
    if (publishedItem.flagReasons && publishedItem.flagReasons.length > 0) {
      firestoreData.flagReasons = publishedItem.flagReasons;
    }

    await setDoc(docRef, firestoreData);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${collectionPath}/${cleanId}`);
  }

  return publishedItem;
}

/**
 * Fetches a single published item by ID (e.g. for deep linking `?share=...`)
 */
export async function getPublishedItemById(itemId: string): Promise<PublishedItem | null> {
  const collectionPath = 'published_items';
  try {
    const docRef = doc(db, collectionPath, itemId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const d = snap.data();
      const item: PublishedItem = {
        id: snap.id,
        authorName: d.authorName,
        type: d.type,
        gameId: d.gameId,
        title: d.title,
        detail: d.detail,
        scoreValue: d.scoreValue,
        challengeSeed: d.challengeSeed,
        status: d.status || 'active',
        flagCount: d.flagCount || 0,
        flagReasons: d.flagReasons || [],
        createdAt: d.createdAt || Date.now(),
      };
      return item;
    }
  } catch (error) {
    console.debug('Failed to fetch from Firestore, checking local cache:', error);
  }

  // Fallback to local cache
  const localList = getCachedPublishedItems();
  const match = localList.find((x) => x.id === itemId);
  return match || null;
}

/**
 * Real-time listener for public community published content
 */
export function subscribeToPublishedItems(onUpdate: (items: PublishedItem[]) => void): () => void {
  const collectionPath = 'published_items';
  try {
    const q = query(collection(db, collectionPath), orderBy('createdAt', 'desc'), limit(60));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items: PublishedItem[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          items.push({
            id: docSnap.id,
            authorName: d.authorName,
            type: d.type,
            gameId: d.gameId,
            title: d.title,
            detail: d.detail,
            scoreValue: d.scoreValue,
            challengeSeed: d.challengeSeed,
            status: d.status || 'active',
            flagCount: d.flagCount || 0,
            flagReasons: d.flagReasons || [],
            createdAt: d.createdAt || Date.now(),
          });
        });
        saveCachedPublishedItems(items);
        onUpdate(items);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, collectionPath);
        // Fallback to local cache
        onUpdate(getCachedPublishedItems());
      }
    );
    return unsubscribe;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, collectionPath);
    onUpdate(getCachedPublishedItems());
    return () => {};
  }
}

/**
 * Community moderation report: flags an item for review
 */
export async function reportPublishedItem(itemId: string, reason: string): Promise<void> {
  const collectionPath = 'published_items';
  try {
    const docRef = doc(db, collectionPath, itemId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      const newCount = (data.flagCount || 0) + 1;
      const newStatus = newCount >= 2 ? 'flagged' : data.status;

      await updateDoc(docRef, {
        flagCount: increment(1),
        status: newStatus,
        flagReasons: arrayUnion(reason.slice(0, 100)),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${collectionPath}/${itemId}`);
  }

  // Also update local cache
  const localList = getCachedPublishedItems();
  const updated = localList.map((item) => {
    if (item.id === itemId) {
      const count = item.flagCount + 1;
      return {
        ...item,
        flagCount: count,
        status: (count >= 2 ? 'flagged' : item.status) as ModerationStatus,
        flagReasons: [...(item.flagReasons || []), reason],
      };
    }
    return item;
  });
  saveCachedPublishedItems(updated);
}

/**
 * Admin moderation: set status ('active' | 'flagged' | 'hidden')
 */
export async function adminModeratePublishedItem(itemId: string, newStatus: ModerationStatus): Promise<void> {
  const collectionPath = 'published_items';
  try {
    const docRef = doc(db, collectionPath, itemId);
    await updateDoc(docRef, {
      status: newStatus,
      flagCount: newStatus === 'active' ? 0 : increment(0),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${collectionPath}/${itemId}`);
  }

  // Update local cache
  const localList = getCachedPublishedItems();
  const updated = localList.map((item) => (item.id === itemId ? { ...item, status: newStatus } : item));
  saveCachedPublishedItems(updated);
}

/**
 * Admin deletion of a published item
 */
export async function adminDeletePublishedItem(itemId: string): Promise<void> {
  const collectionPath = 'published_items';
  try {
    const docRef = doc(db, collectionPath, itemId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${collectionPath}/${itemId}`);
  }

  // Remove from local cache
  const localList = getCachedPublishedItems();
  saveCachedPublishedItems(localList.filter((item) => item.id !== itemId));
}

// -------------------------------------------------------------
// Auth & Account Management
// -------------------------------------------------------------

/**
 * Real-time Auth listener
 */
export function subscribeToAuth(onUserChange: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, (user) => {
    onUserChange(user);
  });
}

/**
 * Google Sign In Popup
 */
export async function loginWithGoogle(): Promise<User | null> {
  try {
    const cred = await signInWithPopup(auth, googleProvider);
    return cred.user;
  } catch (error) {
    console.error('Google Sign In Error:', error);
    throw error;
  }
}

/**
 * Logout
 */
export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Logout Error:', error);
    throw error;
  }
}
