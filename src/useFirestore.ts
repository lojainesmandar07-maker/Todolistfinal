import { useState, useEffect } from 'react';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc, query, where, QuerySnapshot, DocumentData, serverTimestamp } from 'firebase/firestore';
import { DEFAULT_CHARACTERS, DEFAULT_CLOTHING, DEFAULT_STICKERS } from './defaultAssets';

export function useGoals() {
  const [goals, loading] = useFirestoreCollection<any>(auth.currentUser ? `users/${auth.currentUser.uid}/goals` : '');

  const addGoal = async (title: string, details: string, stickerUrl: string = '') => {
    if (!auth.currentUser) return;
    try {
      await setDoc(doc(collection(db, `users/${auth.currentUser.uid}/goals`)), {
        userId: auth.currentUser.uid,
        title,
        details,
        stickerUrl,
        completed: false,
        createdAt: serverTimestamp()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `users/${auth.currentUser.uid}/goals`);
    }
  };

  const toggleGoal = async (id: string, currentCompleted: boolean) => {
    if (!auth.currentUser) return;
    try {
      await updateDoc(doc(db, `users/${auth.currentUser.uid}/goals`, id), {
        completed: !currentCompleted
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${auth.currentUser.uid}/goals/${id}`);
    }
  };

  const removeGoal = async (id: string) => {
    if (!auth.currentUser) return;
    try {
      await deleteDoc(doc(db, `users/${auth.currentUser.uid}/goals`, id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `users/${auth.currentUser.uid}/goals/${id}`);
    }
  };

  return { goals, loading, addGoal, toggleGoal, removeGoal };
}

export function useFirestoreCollection<T>(path: string, validator?: (data: any) => boolean) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;
    const ref = collection(db, path);
    const q = query(ref, where('userId', '==', auth.currentUser.uid));

    const unsub = onSnapshot(q, (snapshot: QuerySnapshot<DocumentData>) => {
      const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as any;
      setData(items);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, path);
    });

    return unsub;
  }, [path]);

  return [data, loading] as const;
}

const assetSubscribers = new Set<() => void>();
const cachedAssets: any[] = (() => {
  try {
    const saved = localStorage.getItem('corner_global_assets_cache');
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return [];
})();
let isListeningToGlobalAssets = false;

export function useGlobalAssets(type: 'character' | 'clothing' | 'decal') {
  const defaultList = type === 'character' 
    ? DEFAULT_CHARACTERS 
    : type === 'clothing' 
      ? DEFAULT_CLOTHING 
      : DEFAULT_STICKERS;

  const [assets, setAssets] = useState<any[]>(() => {
    const loaded = cachedAssets.filter(a => a.type === type);
    const combined = [...defaultList];
    loaded.forEach(la => {
      if (!combined.some(c => c.id === la.id || c.url === la.url)) {
        combined.push(la);
      }
    });
    return combined;
  });
  
  useEffect(() => {
    const update = () => {
      const loaded = cachedAssets.filter(a => a.type === type);
      const combined = [...defaultList];
      loaded.forEach(la => {
        if (!combined.some(c => c.id === la.id || c.url === la.url)) {
          combined.push(la);
        }
      });
      setAssets(combined);
    };
    assetSubscribers.add(update);
    update(); // in case it loaded before we subscribed

    if (!isListeningToGlobalAssets) {
      isListeningToGlobalAssets = true;
      const ref = collection(db, 'globalAssets');
      onSnapshot(ref, (snapshot) => {
        cachedAssets.length = 0;
        const newAssets = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        cachedAssets.push(...newAssets);
        try {
          localStorage.setItem('corner_global_assets_cache', JSON.stringify(newAssets));
        } catch (e) {}
        assetSubscribers.forEach(sub => sub());
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'globalAssets'));
    }

    return () => {
      assetSubscribers.delete(update);
    };
  }, [type]);

  const addGlobalAsset = async (url: string, config?: { characterId?: string, x?: number, y?: number, width?: number, category?: string, useFullCanvasFit?: boolean }) => {
    if (!auth.currentUser) return;
    try {
      const data: any = {
        type,
        url,
        createdAt: serverTimestamp(),
      };
      if (config) {
        if (config.characterId !== undefined) data.characterId = config.characterId;
        if (config.x !== undefined) data.x = config.x;
        if (config.y !== undefined) data.y = config.y;
        if (config.width !== undefined) data.width = config.width;
        if (config.category !== undefined) data.category = config.category;
        if (config.useFullCanvasFit !== undefined) data.useFullCanvasFit = config.useFullCanvasFit;
      }
      await setDoc(doc(collection(db, 'globalAssets')), data);
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'globalAssets');
    }
  };
  
  const removeGlobalAsset = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'globalAssets', id));
    } catch(e) {
      handleFirestoreError(e, OperationType.DELETE, `globalAssets/${id}`);
    }
  }

  return { assets, addGlobalAsset, removeGlobalAsset };
}
export function useFirestoreSettings() {
  const [settings, setSettings] = useState<any>({});
  
  useEffect(() => {
    if (!auth.currentUser) return;
    const ref = doc(db, `users/${auth.currentUser.uid}/settings/profile`);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setSettings(snap.data());
      } else {
        // Initialize
        setDoc(ref, { 
          userId: auth.currentUser.uid, 
          fontMode: 'Dark',
          avatarUrl: '',
          customBgUrl: '',
          signBgUrl: '',
          boardBgUrl: ''
        }).catch(e => handleFirestoreError(e, OperationType.CREATE, ref.path));
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, ref.path);
    });
    return unsub;
  }, []);

  const updateSetting = async (key: string, value: any) => {
    if (!auth.currentUser) return;
    const ref = doc(db, `users/${auth.currentUser.uid}/settings/profile`);
    try {
      await updateDoc(ref, { [key]: value });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, ref.path);
    }
  };

  return [settings, updateSetting] as const;
}
