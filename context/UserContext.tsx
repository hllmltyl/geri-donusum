import { UserProfile } from '@/constants/types';
import { auth, db } from '@/firebaseConfig';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, onSnapshot, setDoc, updateDoc, deleteField } from 'firebase/firestore';
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
                        const rawData = docSnap.data() as any;
                        const data = rawData as UserProfile; 
                        
                        // Migrasyon ve eksik alan kontrolü
                        const hasOldFields = rawData.points !== undefined || rawData.level !== undefined;
                        const hasMissingFields = data.role === undefined || data.xp === undefined;

                        if (hasOldFields || hasMissingFields) {
                            const updates: any = {};
                            if (rawData.points !== undefined) {
                                if (data.xp === undefined) updates.xp = rawData.points || 0;
                                updates.points = deleteField();
                            }
                            if (rawData.level !== undefined) updates.level = deleteField();
                            if (data.role === undefined) {
                                // admin@admin.com ise direkt admin yap, yoksa user
                                updates.role = currentUser.email === 'admin@admin.com' ? 'admin' : 'user';
                            } else if (currentUser.email === 'admin@admin.com' && data.role !== 'admin') {
                                // Eğer email admin@admin.com ise ama veritabanında hala user ise admin'e yükselt
                                updates.role = 'admin';
                            }
                            if (data.xp === undefined && updates.xp === undefined) updates.xp = 0;

                            // Sadece gerektiğinde güncelleme yap (Sonsuz döngüyü kırar)
                            await updateDoc(userDocRef, updates);
                            // Not: updateDoc tetiklendiğinde onSnapshot tekrar çalışacak, 
                            // o zaman bu if'e girmeyeceği için döngü kırılmış olacak.
                            return;
                        }

                        setUserProfile(data);

                        // Admin Kontrolü
                        if (data.role === 'admin' || currentUser.email === 'admin@admin.com') {
                            setIsAdmin(true);
                        } else {
                            setIsAdmin(false);
                        }
                    } else {
                        // Doküman yoksa (Silinmiş veya yeni kullanıcı)
                        // ÖNEMLİ: Burada otomatik setDoc yapmıyoruz ki admin silince geri gelmesin.
                        // Sadece state'i boşaltıyoruz. Yeni profil oluşturma Sign-Up sayfasında olmalı.
                        setUserProfile(null);
                        setIsAdmin(false);
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
