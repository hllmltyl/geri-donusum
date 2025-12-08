import { auth, db } from '@/firebaseConfig';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';

// Kullanıcı veri tipi (Genişletilebilir)
export type UserData = {
    uid: string;
    email: string | null;
    displayName?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    photoURL?: string | null;
    points: number;       // Oyunlaştırma için
    level: number;        // Oyunlaştırma için
    badges: string[];     // Oyunlaştırma için
    createdAt?: any;
};

type UserContextType = {
    user: User | null;          // Firebase Auth kullanıcısı
    userData: UserData | null;  // Firestore'daki detaylı veri (puan, seviye vb.)
    loading: boolean;
    refreshUserData: () => Promise<void>; // Manuel yenileme gerekirse
};

const UserContext = createContext<UserContextType>({
    user: null,
    userData: null,
    loading: true,
    refreshUserData: async () => { },
});

export function useUser() {
    return useContext(UserContext);
}

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 1. Auth durumunu dinle
        const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            setLoading(true);

            if (currentUser) {
                // 2. Kullanıcı giriş yaptıysa Firestore verisini CANLI dinle (onSnapshot)
                const userDocRef = doc(db, 'users', currentUser.uid);

                const unsubscribeSnapshot = onSnapshot(userDocRef, async (docSnap) => {
                    if (docSnap.exists()) {
                        // Mevcut kullanıcı verisi
                        const data = docSnap.data() as UserData;
                        // Eğer yeni eklenen alanlar (points, level) yoksa varsayılan ata (Migration)
                        if (data.points === undefined || data.level === undefined) {
                            // Eksik alanları tamamla (Yol kazası olmaması için)
                            await setDoc(userDocRef, {
                                points: 0,
                                level: 1,
                                badges: []
                            }, { merge: true });
                        }
                        setUserData(data);
                    } else {
                        // Doküman yoksa (nadiren olur ama)
                        setUserData(null);
                    }
                    setLoading(false);
                }, (error) => {
                    console.error("User data listen error:", error);
                    setLoading(false);
                });

                return () => {
                    unsubscribeSnapshot();
                };
            } else {
                // Çıkış yapıldı
                setUserData(null);
                setLoading(false);
            }
        });

        return () => unsubscribeAuth();
    }, []);

    const refreshUserData = async () => {
        // onSnapshot zaten canlı dinliyor ama manuel tetiklemek istersen
        if (!user) return;
        try {
            const ref = doc(db, 'users', user.uid);
            const snap = await getDoc(ref);
            if (snap.exists()) {
                setUserData(snap.data() as UserData);
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <UserContext.Provider value={{ user, userData, loading, refreshUserData }}>
            {children}
        </UserContext.Provider>
    );
}
