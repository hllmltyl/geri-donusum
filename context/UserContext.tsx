import { UserProfile } from '@/constants/types';
import { auth, db } from '@/firebaseConfig';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';

type UserContextType = {
    user: User | null;          // Firebase Auth kullanıcısı
    userProfile: UserProfile | null;  // Firestore'daki detaylı veri (puan, seviye vb.)
    loading: boolean;
    isAdmin: boolean; // Admin mi?
    refreshUserData: () => Promise<void>; // Manuel yenileme gerekirse
};

const UserContext = createContext<UserContextType>({
    user: null,
    userProfile: null,
    loading: true,
    isAdmin: false,
    refreshUserData: async () => { },
});

export function useUser() {
    return useContext(UserContext);
}

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);


    useEffect(() => {
        // 1. Auth durumunu dinle
        const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            setLoading(true); // Set loading true at the start of auth state change

            if (currentUser) {
                // 2. Kullanıcı giriş yaptıysa Firestore verisini CANLI dinle (onSnapshot)
                const userDocRef = doc(db, 'users', currentUser.uid);

                const unsubscribeSnapshot = onSnapshot(userDocRef, async (docSnap) => {
                    if (docSnap.exists()) {
                        // Mevcut kullanıcı verisi
                        const data = docSnap.data() as UserProfile; // Cast to UserProfile
                        // Eğer yeni eklenen alanlar (points, level, role) yoksa varsayılan ata (Migration)
                        if (data.points === undefined || data.level === undefined || data.role === undefined) {
                            // Eksik alanları tamamla (Yol kazası olmaması için)
                            await setDoc(userDocRef, {
                                points: 0,
                                level: 1,
                                badges: [],
                                role: 'user' // Varsayılan rol
                            }, { merge: true });
                            // Fetch updated data after merge
                            const updatedDocSnap = await getDoc(userDocRef);
                            if (updatedDocSnap.exists()) {
                                setUserProfile(updatedDocSnap.data() as UserProfile);
                            }
                        } else {
                            setUserProfile(data);
                        }

                        // Admin Kontrolü
                        // 1. Veritabanında role: 'admin' ise
                        // 2. VEYA test için belirlediğimiz email ise
                        if (data.role === 'admin' || currentUser.email === 'admin@admin.com') {
                            setIsAdmin(true);
                        } else {
                            setIsAdmin(false);
                        }

                    } else {
                        // Doküman yoksa (nadiren olur ama)
                        // Yeni kullanıcı oluşturma mantığı...
                        // ...
                        // Eğer doküman yoksa ve yeni oluşturulacaksa, varsayılan değerlerle bir UserProfile oluştur
                        setUserProfile({
                            uid: currentUser.uid,
                            email: currentUser.email,
                            displayName: currentUser.displayName,
                            photoURL: currentUser.photoURL,
                            points: 0,
                            level: 1,
                            badges: [],
                            role: 'user'
                        });
                        setIsAdmin(false); // Doküman yoksa admin değil
                    }
                    setLoading(false); // Set loading false after data is processed
                }, (error) => {
                    console.error("User data listen error:", error);
                    setLoading(false);
                });

                return () => {
                    unsubscribeSnapshot();
                };
            } else {
                // Çıkış yapıldı
                setUserProfile(null);
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
                setUserProfile(snap.data() as UserProfile);
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <UserContext.Provider value={{ user, userProfile, loading, isAdmin, refreshUserData }}>
            {children}
        </UserContext.Provider>
    );
}
