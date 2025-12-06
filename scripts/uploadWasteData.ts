// scripts/uploadWasteData.ts
// Bu script, constants/waste.ts dosyasındaki atık verilerini Firebase Firestore'a yükler
// Kullanım: npx ts-node scripts/uploadWasteData.ts

import * as dotenv from 'dotenv';
import { initializeApp } from 'firebase/app';
import { doc, getFirestore, writeBatch } from 'firebase/firestore';
import { CATEGORY_FILTERS, WASTE_ITEMS } from '../constants/waste';

// .env dosyasını yükle
dotenv.config();

// Firebase config
const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_APP_ID,
};

// Firebase'i başlat
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function uploadWasteData() {
    try {
        console.log('🚀 Atık verileri Firebase\'e yükleniyor...');
        console.log(`📊 Toplam ${WASTE_ITEMS.length} atık verisi bulundu`);

        // Firestore batch işlemi (500 işlem limiti var, bu yüzden parçalara ayırıyoruz)
        const batchSize = 500;
        const batches = [];

        for (let i = 0; i < WASTE_ITEMS.length; i += batchSize) {
            const batch = writeBatch(db);
            const chunk = WASTE_ITEMS.slice(i, i + batchSize);

            chunk.forEach((waste) => {
                const wasteRef = doc(db, 'wastes', waste.id);
                batch.set(wasteRef, {
                    ...waste,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
            });

            batches.push(batch);
        }

        // Tüm batch'leri çalıştır
        for (let i = 0; i < batches.length; i++) {
            await batches[i].commit();
            console.log(`✅ Batch ${i + 1}/${batches.length} tamamlandı`);
        }

        console.log('✅ Tüm atık verileri başarıyla yüklendi!');

        // Kategorileri de yükle
        console.log('\n📁 Kategoriler yükleniyor...');
        const categoriesBatch = writeBatch(db);

        CATEGORY_FILTERS.forEach((category) => {
            const categoryRef = doc(db, 'categories', category.value);
            categoriesBatch.set(categoryRef, {
                ...category,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        });

        await categoriesBatch.commit();
        console.log('✅ Kategoriler başarıyla yüklendi!');

        // İstatistikler
        console.log('\n📈 İstatistikler:');
        const stats: Record<string, number> = {};
        WASTE_ITEMS.forEach((waste) => {
            stats[waste.tur] = (stats[waste.tur] || 0) + 1;
        });

        Object.entries(stats).forEach(([category, count]) => {
            const categoryLabel = CATEGORY_FILTERS.find(c => c.value === category)?.label || category;
            console.log(`   ${categoryLabel}: ${count} atık`);
        });

        console.log('\n🎉 İşlem tamamlandı!');
        process.exit(0);
    } catch (error: any) {
        console.error('❌ Hata:', error.message);
        process.exit(1);
    }
}

// Script'i çalıştır
uploadWasteData();
