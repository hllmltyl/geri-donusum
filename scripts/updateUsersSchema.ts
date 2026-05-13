import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import * as dotenv from 'dotenv';

// Çevre değişkenlerini yükle
dotenv.config();

const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_APP_ID,
};

async function updateUsersSchema() {
    try {
        console.log('🚀 Kullanıcı veritabanı şeması güncelleniyor (Gamification Phase 1)...');

        const app = initializeApp(firebaseConfig);
        const db = getFirestore(app);

        const usersRef = collection(db, 'users');
        const snapshot = await getDocs(usersRef);

        if (snapshot.empty) {
            console.log('Kullanıcı bulunamadı.');
            process.exit(0);
        }

        console.log(`📊 Toplam ${snapshot.size} kullanıcı bulundu. İnceleniyor...`);

        // Batch oluştur (Firebase batch işlemleri maksimum 500 doküman alabilir)
        let batch = writeBatch(db);
        let count = 0;
        let totalUpdated = 0;

        for (const userDoc of snapshot.docs) {
            const userData = userDoc.data();
            const userRef = doc(db, 'users', userDoc.id);

            const updates: any = {};
            
            if (userData.xp === undefined) updates.xp = 0;
            if (userData.level === undefined) updates.level = 1;
            if (userData.trustScore === undefined) updates.trustScore = 20;
            if (userData.dailyScanCount === undefined) updates.dailyScanCount = 0;
            if (userData.isShadowBanned === undefined) updates.isShadowBanned = false;
            // lastScanDate varsayılan olarak null bırakılabilir, ilk scan yapıldığında dolar

            if (Object.keys(updates).length > 0) {
                batch.update(userRef, updates);
                count++;
                totalUpdated++;
            }

            // Batch limiti koruması
            if (count === 400) {
                await batch.commit();
                console.log(`...400 kullanıcı güncellendi, devam ediliyor...`);
                batch = writeBatch(db);
                count = 0;
            }
        }

        if (count > 0) {
            await batch.commit();
        }

        console.log(`✅ İşlem tamamlandı! Toplam ${totalUpdated} kullanıcıya eksik alanlar eklendi.`);
        process.exit(0);
    } catch (error: any) {
        console.error('❌ Hata oluştu:', error.message);
        console.error('\n📝 Kontrol listesi:');
        console.error('   1. .env dosyasında Firebase config değerleri tam mı?');
        console.error('   2. Firestore rules (güvenlik kuralları) tarafında admin izniniz/okuma-yazma izniniz var mı?');
        console.error('      (Hata alırsanız geçici olarak allow read, write: if true; yapmayı deneyin)');
        process.exit(1);
    }
}

updateUsersSchema();
