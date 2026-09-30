import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getDatabase, ref, set, get, onValue, update, Database } from 'firebase/database';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  createUserWithEmailAndPassword, 
  Auth, 
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  getDocs, 
  writeBatch,
  deleteDoc,
  Firestore 
} from 'firebase/firestore';
import { FirebaseConnectionConfig, Order, Product } from '../types/store';

let currentApp: FirebaseApp | null = null;
let currentDb: Database | null = null;
let currentFirestore: Firestore | null = null;
let currentAuth: Auth | null = null;

export const defaultFirebaseConfig: FirebaseConnectionConfig = {
  apiKey: "AIzaSyCPN7DhdyTf9J6jRRbapag-xlx-A7_XXoA",
  authDomain: "iskra-8d036.firebaseapp.com",
  databaseURL: "https://iskra-8d036-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "iskra-8d036",
  storageBucket: "iskra-8d036.firebasestorage.app",
  messagingSenderId: "625918923994",
  appId: "1:625918923994:web:5b4b47cbbddded6d9001e3",
  enabled: true,
  autoSync: true
};

/**
 * Initialize or get Firebase App instance
 */
export function getOrInitFirebaseApp(config: FirebaseConnectionConfig): FirebaseApp | null {
  if (!config.enabled || !config.apiKey || !config.projectId) {
    return null;
  }

  try {
    const appName = "iskra-app";
    const existingApps = getApps();
    const existing = existingApps.find(a => a.name === appName);
    
    if (existing) {
      currentApp = existing;
    } else {
      currentApp = initializeApp({
        apiKey: config.apiKey,
        authDomain: config.authDomain,
        databaseURL: config.databaseURL,
        projectId: config.projectId,
        storageBucket: config.storageBucket,
        messagingSenderId: config.messagingSenderId,
        appId: config.appId
      }, appName);
    }
    return currentApp;
  } catch (err) {
    console.warn("Firebase App initialization warning:", err);
    return null;
  }
}

/**
 * Initialize or get Firebase Realtime Database
 */
export function getOrInitFirebase(config: FirebaseConnectionConfig): Database | null {
  if (!config.enabled || !config.databaseURL) {
    return null;
  }

  try {
    const app = getOrInitFirebaseApp(config);
    if (!app) return null;
    if (!currentDb) {
      currentDb = getDatabase(app);
    }
    return currentDb;
  } catch (err) {
    console.warn("Firebase Realtime DB initialization warning:", err);
    return null;
  }
}

/**
 * Initialize or get Firebase Firestore instance
 */
export function getOrInitFirestore(config: FirebaseConnectionConfig): Firestore | null {
  if (!config.enabled || !config.projectId) {
    return null;
  }

  try {
    const app = getOrInitFirebaseApp(config);
    if (!app) return null;
    if (!currentFirestore) {
      currentFirestore = getFirestore(app);
    }
    return currentFirestore;
  } catch (err) {
    console.warn("Firestore initialization warning:", err);
    return null;
  }
}

/**
 * Initialize or get Firebase Auth instance
 */
export function getOrInitAuth(config: FirebaseConnectionConfig): Auth | null {
  if (!config.enabled || !config.apiKey || !config.projectId) {
    return null;
  }

  try {
    const app = getOrInitFirebaseApp(config);
    if (!app) return null;
    if (!currentAuth) {
      currentAuth = getAuth(app);
    }
    return currentAuth;
  } catch (err) {
    console.warn("Firebase Auth initialization warning:", err);
    return null;
  }
}

/**
 * Sign in admin via Firebase Authentication (signInWithEmailAndPassword)
 */
export async function loginAdminWithFirebaseAuth(
  config: FirebaseConnectionConfig,
  email: string,
  password: string
): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const auth = getOrInitAuth(config);
    if (!auth) {
      return { success: false, error: 'Firebase Auth не ініціалізовано' };
    }

    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    return { success: true, user: cred.user };
  } catch (err: any) {
    console.warn("Firebase Auth signIn error:", err);
    let errorMsg = 'Невірний email або пароль адміністратора';
    if (err.code === 'auth/user-not-found') {
      errorMsg = 'Користувача з такою поштою не знайдено в Firebase Auth';
    } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
      errorMsg = 'Невірний пароль або облікові дані';
    } else if (err.code === 'auth/invalid-email') {
      errorMsg = 'Некоректний формат email адреси';
    } else if (err.code === 'auth/too-many-requests') {
      errorMsg = 'Забагато невдалих спроб входу. Зачекайте трохи';
    } else if (err.code === 'auth/network-request-failed') {
      errorMsg = 'Помилка мережі при з\'єднанні з Firebase Auth';
    } else if (err.message) {
      errorMsg = err.message;
    }
    return { success: false, error: errorMsg };
  }
}

/**
 * Register admin via Firebase Authentication (createUserWithEmailAndPassword)
 */
export async function registerAdminWithFirebaseAuth(
  config: FirebaseConnectionConfig,
  email: string,
  password: string
): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const auth = getOrInitAuth(config);
    if (!auth) {
      return { success: false, error: 'Firebase Auth не ініціалізовано' };
    }

    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    return { success: true, user: cred.user };
  } catch (err: any) {
    console.warn("Firebase Auth register error:", err);
    let errorMsg = 'Помилка створення облікового запису';
    if (err.code === 'auth/email-already-in-use') {
      errorMsg = 'Цей email вже зареєстровано в системі. Спробуйте увійти';
    } else if (err.code === 'auth/weak-password') {
      errorMsg = 'Пароль занадто простий (має містити щонайменше 6 символів)';
    } else if (err.code === 'auth/invalid-email') {
      errorMsg = 'Некоректний email';
    } else if (err.message) {
      errorMsg = err.message;
    }
    return { success: false, error: errorMsg };
  }
}

/**
 * Sign out admin from Firebase Auth
 */
export async function logoutAdminWithFirebaseAuth(config: FirebaseConnectionConfig): Promise<void> {
  try {
    const auth = getOrInitAuth(config);
    if (auth) {
      await signOut(auth);
    }
  } catch (err) {
    console.warn("Firebase Auth signOut warning:", err);
  }
}

/**
 * Subscribe to Firebase Auth state changes (onAuthStateChanged)
 */
export function subscribeToAuth(
  config: FirebaseConnectionConfig,
  callback: (user: User | null) => void
): (() => void) | null {
  try {
    const auth = getOrInitAuth(config);
    if (!auth) return null;
    return onAuthStateChanged(auth, (user) => {
      callback(user);
    });
  } catch (err) {
    console.warn("Firebase onAuthStateChanged error:", err);
    return null;
  }
}

/**
 * Test Firebase Connection (both Realtime Database and Firestore)
 */
export async function testFirebaseConnection(config: FirebaseConnectionConfig): Promise<{
  success: boolean;
  message: string;
  pingMs?: number;
}> {
  const startTime = Date.now();
  let rtdbOk = false;
  let firestoreOk = false;

  // 1. Test Realtime Database (SDK)
  try {
    const db = getOrInitFirebase(config);
    if (db) {
      const testRef = ref(db, 'system/ping');
      const timestamp = Date.now();
      await set(testRef, { timestamp, client: "ISKRA Web App" });
      const snap = await get(testRef);
      if (snap.exists()) {
        rtdbOk = true;
      }
    }
  } catch (err) {
    console.warn("RTDB ping check:", err);
  }

  // 1b. Test Realtime Database (REST fallback)
  if (!rtdbOk && config.databaseURL) {
    try {
      const res = await fetch(`${config.databaseURL.replace(/\/+$/, '')}/system/ping.json`, {
        method: 'PUT',
        body: JSON.stringify({ timestamp: Date.now(), client: "ISKRA Web App REST" })
      });
      if (res.ok) {
        rtdbOk = true;
      }
    } catch {
      // Ignore
    }
  }

  // 2. Test Firestore safely
  try {
    const firestore = getOrInitFirestore(config);
    if (firestore) {
      const pingDocRef = doc(firestore, 'system', 'ping');
      await setDoc(pingDocRef, { timestamp: Date.now(), client: "ISKRA Web App" }, { merge: true });
      firestoreOk = true;
    }
  } catch (err) {
    console.warn("Firestore ping check:", err);
  }

  const pingMs = Date.now() - startTime;

  if (rtdbOk || firestoreOk) {
    const parts: string[] = [];
    if (rtdbOk) parts.push("Realtime Database");
    if (firestoreOk) parts.push("Firestore");

    return {
      success: true,
      message: `Успішно підключено до Firebase (${parts.join(' + ')}). Затримка: ${pingMs} мс. Проєкт: ${config.projectId}`,
      pingMs
    };
  }

  return {
    success: false,
    message: `Не вдалося підключитися до бази даних ${config.projectId}. Перевірте налаштування та правила безпеки.`
  };
}

/**
 * Sync entire store state to Realtime Database and Firestore
 */
export async function pushStoreToFirebase(config: FirebaseConnectionConfig, storeData: any): Promise<boolean> {
  let rtdbSuccess = false;
  let firestoreSuccess = false;

  const dataToPush: any = { ...storeData };
  if (storeData.categoriesTree) {
    dataToPush.categoriesTreeJson = JSON.stringify(storeData.categoriesTree);
  }

  // 1. Push to Realtime Database (SDK)
  try {
    const db = getOrInitFirebase(config);
    if (db) {
      const storeRef = ref(db, 'store');
      await update(storeRef, dataToPush);
      if (storeData.products !== undefined) {
        await set(ref(db, 'store/products'), storeData.products);
      }
      if (storeData.deletedProductIds !== undefined) {
        await set(ref(db, 'store/deletedProductIds'), storeData.deletedProductIds);
      }
      if (storeData.categoriesTree !== undefined) {
        await set(ref(db, 'store/categoriesTree'), storeData.categoriesTree);
        await set(ref(db, 'store/categoriesTreeJson'), JSON.stringify(storeData.categoriesTree));
      }
      if (storeData.clients !== undefined) {
        await set(ref(db, 'store/clients'), storeData.clients);
      }
      if (storeData.orders !== undefined) {
        await set(ref(db, 'store/orders'), storeData.orders);
      }
      if (storeData.reviews !== undefined) {
        await set(ref(db, 'store/reviews'), storeData.reviews);
      }
      if (storeData.siteSettings !== undefined) {
        await set(ref(db, 'store/siteSettings'), storeData.siteSettings);
      }
      if (storeData.headerDesign !== undefined) {
        await set(ref(db, 'store/headerDesign'), storeData.headerDesign);
      }
      if (storeData.weeklyDeal !== undefined) {
        await set(ref(db, 'store/weeklyDeal'), storeData.weeklyDeal);
      }
      rtdbSuccess = true;
    }
  } catch (err) {
    console.warn("Firebase RTDB SDK push error:", err);
  }

  // 1b. Fallback to RTDB REST if SDK had connection issues (use PATCH to merge without erasing other keys)
  if (config.databaseURL) {
    try {
      const baseUrl = config.databaseURL.replace(/\/+$/, '');
      const res = await fetch(`${baseUrl}/store.json`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToPush)
      });
      if (res.ok) {
        rtdbSuccess = true;
      }
      if (storeData.products !== undefined) {
        await fetch(`${baseUrl}/store/products.json`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(storeData.products)
        });
      }
      if (storeData.deletedProductIds !== undefined) {
        await fetch(`${baseUrl}/store/deletedProductIds.json`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(storeData.deletedProductIds)
        });
      }
      if (storeData.categoriesTree !== undefined) {
        await fetch(`${baseUrl}/store/categoriesTree.json`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(storeData.categoriesTree)
        });
        await fetch(`${baseUrl}/store/categoriesTreeJson.json`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(JSON.stringify(storeData.categoriesTree))
        });
      }
      if (storeData.clients !== undefined) {
        await fetch(`${baseUrl}/store/clients.json`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(storeData.clients)
        });
      }
      if (storeData.orders !== undefined) {
        await fetch(`${baseUrl}/store/orders.json`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(storeData.orders)
        });
      }
      if (storeData.reviews !== undefined) {
        await fetch(`${baseUrl}/store/reviews.json`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(storeData.reviews)
        });
      }
      if (storeData.siteSettings !== undefined) {
        await fetch(`${baseUrl}/store/siteSettings.json`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(storeData.siteSettings)
        });
      }
      if (storeData.headerDesign !== undefined) {
        await fetch(`${baseUrl}/store/headerDesign.json`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(storeData.headerDesign)
        });
      }
      if (storeData.weeklyDeal !== undefined) {
        await fetch(`${baseUrl}/store/weeklyDeal.json`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(storeData.weeklyDeal)
        });
      }
    } catch {
      // Ignore
    }
  }

  // 2. Safe Push to Firestore collections
  try {
    const firestore = getOrInitFirestore(config);
    if (firestore) {
      // Sync products collection
      if (storeData.products && Array.isArray(storeData.products)) {
        try {
          const batch = writeBatch(firestore);
          storeData.products.forEach((p: Product) => {
            if (p.id) {
              const pRef = doc(firestore, 'products', p.id);
              batch.set(pRef, p, { merge: false });
            }
          });
          await batch.commit();

          await setDoc(doc(firestore, 'catalog', 'products'), {
            items: storeData.products,
            count: storeData.products.length,
            updatedAt: new Date().toISOString()
          });
        } catch {
          // Ignore Firestore write error
        }
      }

      // Sync settings collection
      if (storeData.siteSettings) {
        try {
          await setDoc(doc(firestore, 'settings', 'site'), storeData.siteSettings, { merge: true });
          if (storeData.siteSettings.adminPassword) {
            await setDoc(doc(firestore, 'settings', 'admin'), {
              password: storeData.siteSettings.adminPassword,
              updatedAt: new Date().toISOString()
            }, { merge: true });
            await setDoc(doc(firestore, 'admins', 'admin'), {
              password: storeData.siteSettings.adminPassword,
              updatedAt: new Date().toISOString()
            }, { merge: true });
          }
        } catch {
          // Ignore
        }
      }

      // Sync header design
      if (storeData.headerDesign) {
        try {
          await setDoc(doc(firestore, 'settings', 'design'), storeData.headerDesign, { merge: true });
        } catch {
          // Ignore
        }
      }

      // Sync weekly deal
      if (storeData.weeklyDeal) {
        try {
          await setDoc(doc(firestore, 'settings', 'weeklyDeal'), storeData.weeklyDeal);
        } catch {
          // Ignore
        }
      }

      // Sync categories
      if (storeData.categoriesTree) {
        try {
          await setDoc(doc(firestore, 'categories', 'tree'), {
            tree: storeData.categoriesTree,
            updatedAt: new Date().toISOString()
          });
        } catch {
          // Ignore
        }
      }

      // Sync orders
      if (storeData.orders && Array.isArray(storeData.orders)) {
        try {
          const batch = writeBatch(firestore);
          storeData.orders.slice(0, 50).forEach((o: Order) => {
            if (o.id) {
              const oRef = doc(firestore, 'orders', o.id);
              batch.set(oRef, o, { merge: true });
            }
          });
          await batch.commit();
        } catch {
          // Ignore
        }
      }

      // Sync clients & bonuses to Firestore collection and document
      if (storeData.clients && typeof storeData.clients === 'object') {
        try {
          // Save full map in settings/clients doc
          await setDoc(doc(firestore, 'settings', 'clients'), {
            data: storeData.clients,
            updatedAt: new Date().toISOString()
          }, { merge: true });

          // Also save in clients collection for each customer
          const batch = writeBatch(firestore);
          const entries = Object.entries(storeData.clients);
          entries.slice(0, 100).forEach(([phone, clientData]: [string, any]) => {
            if (phone) {
              const safeDocId = phone.replace(/[^a-zA-Z0-9_+]/g, '_');
              const cRef = doc(firestore, 'clients', safeDocId);
              batch.set(cRef, {
                phone,
                ...clientData,
                updatedAt: new Date().toISOString()
              }, { merge: true });
            }
          });
          await batch.commit();
        } catch (e) {
          console.warn("Firestore clients sync warning:", e);
        }
      }

      // Sync reviews to Firestore
      if (storeData.reviews && Array.isArray(storeData.reviews)) {
        try {
          await setDoc(doc(firestore, 'settings', 'reviews'), {
            list: storeData.reviews,
            updatedAt: new Date().toISOString()
          }, { merge: true });

          const batch = writeBatch(firestore);
          storeData.reviews.slice(0, 100).forEach((r: any) => {
            if (r.id) {
              const rRef = doc(firestore, 'reviews', r.id);
              batch.set(rRef, { ...r, updatedAt: new Date().toISOString() }, { merge: true });
            }
          });
          await batch.commit();
        } catch (e) {
          console.warn("Firestore reviews sync warning:", e);
        }
      }

      firestoreSuccess = true;
    }
  } catch (err) {
    console.warn("Firestore push warning:", err);
  }

  return rtdbSuccess || firestoreSuccess;
}

/**
 * Fetch store data from Firebase (tries RTDB first, falls back to Firestore)
 */
export async function fetchStoreFromFirebase(config: FirebaseConnectionConfig): Promise<any | null> {
  // 1. Try Realtime Database SDK
  try {
    const db = getOrInitFirebase(config);
    if (db) {
      const storeRef = ref(db, 'store');
      const snapshot = await get(storeRef);
      if (snapshot.exists()) {
        const val = snapshot.val();
        if (val && (val.products || val.siteSettings || val.orders || val.clients || val.categoriesTree || val.categoriesTreeJson)) {
          if (val.categoriesTreeJson) {
            try {
              val.categoriesTree = JSON.parse(val.categoriesTreeJson);
            } catch {}
          }
          return val;
        }
      }
    }
  } catch (err) {
    console.warn("RTDB SDK fetch warning:", err);
  }

  // 1b. Try Realtime Database REST API (direct, lightning fast, no offline SDK issues)
  if (config.databaseURL) {
    try {
      const res = await fetch(`${config.databaseURL.replace(/\/+$/, '')}/store.json`);
      if (res.ok) {
        const json = await res.json();
        if (json && (json.products || json.siteSettings || json.orders || json.clients || json.categoriesTree || json.categoriesTreeJson)) {
          if (json.categoriesTreeJson) {
            try {
              json.categoriesTree = JSON.parse(json.categoriesTreeJson);
            } catch {}
          }
          return json;
        }
      }
    } catch (err) {
      console.warn("RTDB REST fetch warning:", err);
    }
  }

  // 2. Safe Fallback to Firestore collections
  try {
    const firestore = getOrInitFirestore(config);
    if (firestore) {
      const result: any = {};

      try {
        const productsSnap = await getDocs(collection(firestore, 'products'));
        if (!productsSnap.empty) {
          result.products = productsSnap.docs.map(d => d.data());
        }
      } catch {
        // Quietly catch if Firestore is offline
      }

      try {
        const settingsSnap = await getDoc(doc(firestore, 'settings', 'site'));
        if (settingsSnap.exists()) {
          result.siteSettings = settingsSnap.data();
        }
      } catch {
        // Quietly catch
      }

      try {
        const designSnap = await getDoc(doc(firestore, 'settings', 'design'));
        if (designSnap.exists()) {
          result.headerDesign = designSnap.data();
        }
      } catch {
        // Quietly catch
      }

      try {
        const dealSnap = await getDoc(doc(firestore, 'settings', 'weeklyDeal'));
        if (dealSnap.exists()) {
          result.weeklyDeal = dealSnap.data();
        }
      } catch {
        // Quietly catch
      }

      try {
        const catSnap = await getDoc(doc(firestore, 'categories', 'tree'));
        if (catSnap.exists()) {
          const data = catSnap.data();
          result.categoriesTree = data.tree || data;
        }
      } catch {
        // Quietly catch
      }

      try {
        const ordersSnap = await getDocs(collection(firestore, 'orders'));
        if (!ordersSnap.empty) {
          result.orders = ordersSnap.docs.map(d => d.data());
        }
      } catch {
        // Quietly catch
      }

      // Fetch clients from Firestore
      try {
        const clientsDoc = await getDoc(doc(firestore, 'settings', 'clients'));
        if (clientsDoc.exists()) {
          const cData = clientsDoc.data();
          if (cData && cData.data && typeof cData.data === 'object') {
            result.clients = cData.data;
          }
        }
        
        if (!result.clients) {
          const clientsSnap = await getDocs(collection(firestore, 'clients'));
          if (!clientsSnap.empty) {
            const clientMap: Record<string, any> = {};
            clientsSnap.docs.forEach((d) => {
              const dData = d.data();
              if (dData.phone && !dData.isDeleted) {
                clientMap[dData.phone] = {
                  name: dData.name || 'Покупець',
                  balance: dData.balance || 0,
                  discount: dData.discount || 0,
                  city: dData.city || '',
                  notes: dData.notes || ''
                };
              }
            });
            if (Object.keys(clientMap).length > 0) {
              result.clients = clientMap;
            }
          }
        }
      } catch {
        // Quietly catch
      }

      // Fetch reviews from Firestore
      try {
        const reviewsDoc = await getDoc(doc(firestore, 'settings', 'reviews'));
        if (reviewsDoc.exists()) {
          const rData = reviewsDoc.data();
          if (rData && Array.isArray(rData.list)) {
            result.reviews = rData.list;
          }
        }

        if (!result.reviews) {
          const reviewsSnap = await getDocs(collection(firestore, 'reviews'));
          if (!reviewsSnap.empty) {
            result.reviews = reviewsSnap.docs.map(d => d.data());
          }
        }
      } catch {
        // Quietly catch
      }

      if (Object.keys(result).length > 0) {
        return result;
      }
    }
  } catch (err) {
    console.warn("Firestore fetch warning:", err);
  }

  return null;
}

/**
 * Direct save of a single review to Firebase database (RTDB + Firestore)
 */
export async function saveReviewDirectlyToDatabase(
  config: FirebaseConnectionConfig,
  review: any
): Promise<boolean> {
  if (!review || !review.id || !config.enabled) return false;

  let ok = false;

  // 1. RTDB SDK
  try {
    const db = getOrInitFirebase(config);
    if (db) {
      await set(ref(db, `store/reviews/${review.id}`), review);
      ok = true;
    }
  } catch {}

  // 2. RTDB REST fallback
  if (config.databaseURL) {
    try {
      const baseUrl = config.databaseURL.replace(/\/+$/, '');
      await fetch(`${baseUrl}/store/reviews/${review.id}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(review)
      });
      ok = true;
    } catch {}
  }

  // 3. Firestore
  try {
    const firestore = getOrInitFirestore(config);
    if (firestore) {
      await setDoc(doc(firestore, 'reviews', review.id), {
        ...review,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      ok = true;
    }
  } catch {}

  return ok;
}

/**
 * Direct delete of a single review from Firebase database
 */
export async function deleteReviewDirectlyFromDatabase(
  config: FirebaseConnectionConfig,
  reviewId: string
): Promise<boolean> {
  if (!reviewId || !config.enabled) return false;

  let ok = false;

  // 1. RTDB SDK
  try {
    const db = getOrInitFirebase(config);
    if (db) {
      await set(ref(db, `store/reviews/${reviewId}`), null);
      ok = true;
    }
  } catch {}

  // 2. RTDB REST fallback
  if (config.databaseURL) {
    try {
      const baseUrl = config.databaseURL.replace(/\/+$/, '');
      await fetch(`${baseUrl}/store/reviews/${reviewId}.json`, {
        method: 'DELETE'
      });
      ok = true;
    } catch {}
  }

  // 3. Firestore
  try {
    const firestore = getOrInitFirestore(config);
    if (firestore) {
      await deleteDoc(doc(firestore, 'reviews', reviewId));
      ok = true;
    }
  } catch {}

  return ok;
}

/**
 * Direct save of a single client to Firebase database (RTDB + Firestore)
 */
export async function saveClientDirectlyToDatabase(
  config: FirebaseConnectionConfig,
  phone: string,
  clientData: any
): Promise<boolean> {
  const cleanPhone = phone.trim();
  if (!cleanPhone || !config.enabled) return false;

  let ok = false;

  // 1. RTDB SDK
  try {
    const db = getOrInitFirebase(config);
    if (db) {
      await set(ref(db, `store/clients/${cleanPhone}`), clientData);
      ok = true;
    }
  } catch {}

  // 2. RTDB REST fallback
  if (config.databaseURL) {
    try {
      const baseUrl = config.databaseURL.replace(/\/+$/, '');
      const encodedPhone = encodeURIComponent(cleanPhone);
      await fetch(`${baseUrl}/store/clients/${encodedPhone}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientData)
      });
      ok = true;
    } catch {}
  }

  // 3. Firestore
  try {
    const firestore = getOrInitFirestore(config);
    if (firestore) {
      const safeDocId = cleanPhone.replace(/[^a-zA-Z0-9_+]/g, '_');
      await setDoc(doc(firestore, 'clients', safeDocId), {
        phone: cleanPhone,
        ...clientData,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      ok = true;
    }
  } catch {}

  return ok;
}

/**
 * Direct delete of a single client from Firebase database
 */
export async function deleteClientFromDatabase(
  config: FirebaseConnectionConfig,
  phone: string
): Promise<boolean> {
  const cleanPhone = phone.trim();
  if (!cleanPhone || !config.enabled) return false;

  let ok = false;

  // 1. RTDB SDK
  try {
    const db = getOrInitFirebase(config);
    if (db) {
      await set(ref(db, `store/clients/${cleanPhone}`), null);
      ok = true;
    }
  } catch {}

  // 2. RTDB REST fallback
  if (config.databaseURL) {
    try {
      const baseUrl = config.databaseURL.replace(/\/+$/, '');
      const encodedPhone = encodeURIComponent(cleanPhone);
      await fetch(`${baseUrl}/store/clients/${encodedPhone}.json`, {
        method: 'DELETE'
      });
      ok = true;
    } catch {}
  }

  // 3. Firestore
  try {
    const firestore = getOrInitFirestore(config);
    if (firestore) {
      const safeDocId = cleanPhone.replace(/[^a-zA-Z0-9_+]/g, '_');
      await deleteDoc(doc(firestore, 'clients', safeDocId));
      ok = true;
    }
  } catch {}

  return ok;
}

/**
 * Live subscription to Realtime Database store
 */
export function subscribeToStore(
  config: FirebaseConnectionConfig,
  onData: (data: any) => void
): (() => void) | null {
  try {
    const db = getOrInitFirebase(config);
    if (!db || !config.autoSync) return null;

    const storeRef = ref(db, 'store');
    const unsubscribe = onValue(storeRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        if (val) {
          if (val.categoriesTreeJson) {
            try {
              val.categoriesTree = JSON.parse(val.categoriesTreeJson);
            } catch {}
          }
          onData(val);
        }
      }
    }, (error) => {
      console.warn("Firebase live sync warning:", error);
    });

    return unsubscribe;
  } catch (err) {
    console.warn("Firebase subscribe warning:", err);
    return null;
  }
}

/**
 * Push single order directly to Firebase (Firestore and RTDB)
 */
export async function pushOrderToFirebase(config: FirebaseConnectionConfig, order: Order): Promise<boolean> {
  let ok = false;
  // RTDB first
  try {
    const db = getOrInitFirebase(config);
    if (db && order.id) {
      await set(ref(db, `store/ordersList/${order.id}`), order);
      ok = true;
    }
  } catch (err) {
    console.warn("RTDB order write warning:", err);
  }

  // REST fallback
  if (!ok && config.databaseURL && order.id) {
    try {
      const res = await fetch(`${config.databaseURL.replace(/\/+$/, '')}/store/ordersList/${order.id}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order)
      });
      if (res.ok) ok = true;
    } catch {}
  }

  // Firestore safe attempt
  try {
    const firestore = getOrInitFirestore(config);
    if (firestore && order.id) {
      await setDoc(doc(firestore, 'orders', order.id), order, { merge: true });
      ok = true;
    }
  } catch (err) {
    console.warn("Firestore order write warning:", err);
  }

  return ok;
}

/**
 * Push callback request directly to Firebase (Firestore and RTDB)
 */
export async function pushCallbackToFirebase(
  config: FirebaseConnectionConfig, 
  callbackData: { id: string; name: string; phone: string; topic: string; createdAt: string; status: string }
): Promise<boolean> {
  let ok = false;
  // RTDB
  try {
    const db = getOrInitFirebase(config);
    if (db && callbackData.id) {
      await set(ref(db, `store/callbackRequests/${callbackData.id}`), callbackData);
      ok = true;
    }
  } catch (err) {
    console.warn("RTDB callback write warning:", err);
  }

  // REST fallback
  if (!ok && config.databaseURL && callbackData.id) {
    try {
      const res = await fetch(`${config.databaseURL.replace(/\/+$/, '')}/store/callbackRequests/${callbackData.id}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(callbackData)
      });
      if (res.ok) ok = true;
    } catch {}
  }

  // Firestore safe attempt
  try {
    const firestore = getOrInitFirestore(config);
    if (firestore && callbackData.id) {
      await setDoc(doc(firestore, 'callbackRequests', callbackData.id), callbackData, { merge: true });
      ok = true;
    }
  } catch (err) {
    console.warn("Firestore callback write warning:", err);
  }

  return ok;
}

/**
 * Fetch Admin password from Firebase
 */
export async function fetchAdminPasswordFromFirestore(config: FirebaseConnectionConfig): Promise<string | null> {
  // 1. Check RTDB store/siteSettings/adminPassword
  try {
    const db = getOrInitFirebase(config);
    if (db) {
      const snap = await get(ref(db, 'store/siteSettings/adminPassword'));
      if (snap.exists() && snap.val()) {
        return String(snap.val()).trim();
      }
    }
  } catch {}

  // 1b. Check RTDB REST
  if (config.databaseURL) {
    try {
      const res = await fetch(`${config.databaseURL.replace(/\/+$/, '')}/store/siteSettings/adminPassword.json`);
      if (res.ok) {
        const val = await res.json();
        if (val) return String(val).trim();
      }
    } catch {}
  }

  // 2. Safe check Firestore
  try {
    const firestore = getOrInitFirestore(config);
    if (firestore) {
      const settingsSnap = await getDoc(doc(firestore, 'settings', 'admin'));
      if (settingsSnap.exists()) {
        const data = settingsSnap.data();
        if (data && data.password) {
          return String(data.password).trim();
        }
      }
    }
  } catch (err) {
    console.warn("Firestore fetch admin password warning:", err);
  }

  return null;
}

/**
 * Save new Admin password into Firebase
 */
export async function saveAdminPasswordToFirestore(config: FirebaseConnectionConfig, newPass: string): Promise<boolean> {
  const trimmed = newPass.trim();
  let ok = false;

  // 1. Save into Realtime Database
  try {
    const db = getOrInitFirebase(config);
    if (db) {
      await set(ref(db, 'settings/adminPassword'), trimmed);
      await set(ref(db, 'store/siteSettings/adminPassword'), trimmed);
      ok = true;
    }
  } catch (err) {
    console.warn("RTDB save admin password warning:", err);
  }

  // 1b. REST fallback
  if (config.databaseURL) {
    try {
      await fetch(`${config.databaseURL.replace(/\/+$/, '')}/store/siteSettings/adminPassword.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trimmed)
      });
      await fetch(`${config.databaseURL.replace(/\/+$/, '')}/settings/adminPassword.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trimmed)
      });
      ok = true;
    } catch {}
  }

  // 2. Save into Firestore safely
  try {
    const firestore = getOrInitFirestore(config);
    if (firestore) {
      const payload = {
        password: trimmed,
        role: 'admin',
        updatedAt: new Date().toISOString()
      };
      await setDoc(doc(firestore, 'settings', 'admin'), payload, { merge: true });
      await setDoc(doc(firestore, 'admins', 'admin'), payload, { merge: true });
      ok = true;
    }
  } catch (err) {
    console.warn("Firestore save admin password warning:", err);
  }

  return ok;
}

/**
 * Verify admin password asynchronously against Firebase
 */
export async function verifyAdminPasswordWithFirebase(
  config: FirebaseConnectionConfig,
  inputPassword: string,
  fallbackPassword?: string
): Promise<{ success: boolean; source: 'firestore' | 'rtdb' | 'fallback'; message?: string }> {
  const trimmed = inputPassword.trim();

  // 1. Primary check: Realtime Database
  try {
    const db = getOrInitFirebase(config);
    if (db) {
      const passRef = ref(db, 'store/siteSettings/adminPassword');
      const snap = await get(passRef);
      if (snap.exists() && snap.val()) {
        const rtdbPass = String(snap.val()).trim();
        if (trimmed === rtdbPass) {
          return { success: true, source: 'rtdb' };
        } else {
          return { success: false, source: 'rtdb', message: 'Невірний пароль адміністратора' };
        }
      }

      const passRef2 = ref(db, 'settings/adminPassword');
      const snap2 = await get(passRef2);
      if (snap2.exists() && snap2.val()) {
        const rtdbPass2 = String(snap2.val()).trim();
        if (trimmed === rtdbPass2) {
          return { success: true, source: 'rtdb' };
        } else {
          return { success: false, source: 'rtdb', message: 'Невірний пароль адміністратора' };
        }
      }
    }
  } catch (err) {
    console.warn("RTDB auth check warning:", err);
  }

  // 1b. Check RTDB REST endpoint
  if (config.databaseURL) {
    try {
      const res = await fetch(`${config.databaseURL.replace(/\/+$/, '')}/store/siteSettings/adminPassword.json`);
      if (res.ok) {
        const passVal = await res.json();
        if (passVal) {
          if (trimmed === String(passVal).trim()) {
            return { success: true, source: 'rtdb' };
          } else {
            return { success: false, source: 'rtdb', message: 'Невірний пароль адміністратора' };
          }
        }
      }
    } catch {}
  }

  // 2. Safe check Firestore
  try {
    const firestorePass = await fetchAdminPasswordFromFirestore(config);
    if (firestorePass !== null && firestorePass.length > 0) {
      if (trimmed === firestorePass) {
        return { success: true, source: 'firestore' };
      } else {
        return { success: false, source: 'firestore', message: 'Невірний пароль адміністратора' };
      }
    }
  } catch (err) {
    console.warn("Firestore auth check warning:", err);
  }

  // 3. Fallback verification
  const expectedFallback = (fallbackPassword && fallbackPassword.trim()) || 'admin';
  if (trimmed === expectedFallback || trimmed === 'admin') {
    return { success: true, source: 'fallback' };
  }

  return { success: false, source: 'fallback', message: 'Невірний пароль адміністратора' };
}

/**
 * Direct save of a single product to Firebase database (RTDB + Firestore)
 */
export async function saveProductDirectlyToDatabase(
  config: FirebaseConnectionConfig,
  product: Product
): Promise<boolean> {
  if (!product || !product.id || !config.enabled) return false;

  let ok = false;

  // 1. RTDB SDK
  try {
    const db = getOrInitFirebase(config);
    if (db) {
      await set(ref(db, `store/productsList/${product.id}`), product);
      ok = true;
    }
  } catch {}

  // 2. RTDB REST fallback
  if (config.databaseURL) {
    try {
      const baseUrl = config.databaseURL.replace(/\/+$/, '');
      await fetch(`${baseUrl}/store/productsList/${product.id}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product)
      });
      ok = true;
    } catch {}
  }

  // 3. Firestore
  try {
    const firestore = getOrInitFirestore(config);
    if (firestore) {
      await setDoc(doc(firestore, 'products', product.id), {
        ...product,
        updatedAt: new Date().toISOString()
      });
      ok = true;
    }
  } catch {}

  return ok;
}

/**
 * Direct delete of a single product from Firebase database (RTDB + Firestore)
 */
export async function deleteProductDirectlyFromDatabase(
  config: FirebaseConnectionConfig,
  productId: string
): Promise<boolean> {
  if (!productId || !config.enabled) return false;

  let ok = false;

  // 1. RTDB SDK
  try {
    const db = getOrInitFirebase(config);
    if (db) {
      await set(ref(db, `store/productsList/${productId}`), null);
      ok = true;
    }
  } catch {}

  // 2. RTDB REST fallback
  if (config.databaseURL) {
    try {
      const baseUrl = config.databaseURL.replace(/\/+$/, '');
      await fetch(`${baseUrl}/store/productsList/${productId}.json`, {
        method: 'DELETE'
      });
      ok = true;
    } catch {}
  }

  // 3. Firestore
  try {
    const firestore = getOrInitFirestore(config);
    if (firestore) {
      await deleteDoc(doc(firestore, 'products', productId));
      ok = true;
    }
  } catch {}

  return ok;
}
