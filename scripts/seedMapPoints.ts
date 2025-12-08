import { initializeApp } from "firebase/app";
import { addDoc, collection, getFirestore } from "firebase/firestore";
import * as fs from 'fs';
import * as path from 'path';

// .env dosyasını manuel oku (dotenv bağımlılığı olmadan)
const envPath = path.resolve(process.cwd(), '.env');
let envConfig: any = {};

try {
    if (fs.existsSync(envPath)) {
        const envFile = fs.readFileSync(envPath, 'utf8');
        envFile.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value) {
                envConfig[key.trim()] = value.trim();
            }
        });
    }
} catch (e) {
    console.warn('.env dosyası okunamadı, varsayılanlar veya process.env kullanılacak.');
}

const firebaseConfig = {
    apiKey: envConfig.EXPO_PUBLIC_API_KEY || process.env.EXPO_PUBLIC_API_KEY,
    authDomain: envConfig.EXPO_PUBLIC_AUTH_DOMAIN || process.env.EXPO_PUBLIC_AUTH_DOMAIN,
    projectId: envConfig.EXPO_PUBLIC_PROJECT_ID || process.env.EXPO_PUBLIC_PROJECT_ID,
    storageBucket: envConfig.EXPO_PUBLIC_STORAGE_BUCKET || process.env.EXPO_PUBLIC_STORAGE_BUCKET,
    messagingSenderId: envConfig.EXPO_PUBLIC_MESSAGING_SENDER_ID || process.env.EXPO_PUBLIC_MESSAGING_SENDER_ID,
    appId: envConfig.EXPO_PUBLIC_APP_ID || process.env.EXPO_PUBLIC_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const POINTS = [
    { title: 'Pil Kutusu', type: 'pil', latitude: 37.0408458, longitude: 36.2204845, description: '' },
    { title: 'Cam Kumbarası', type: 'cam', latitude: 37.0572, longitude: 36.2265, description: '' },
    { title: 'Plastik Konteyneri', type: 'plastik', latitude: 37.0595, longitude: 36.2225, description: '' },
    { title: 'Kağıt Toplama', type: 'kagit', latitude: 37.0560, longitude: 36.2250, description: '' },
    { title: 'Elektronik Atık', type: 'elektronik', latitude: 37.0580, longitude: 36.2280, description: '' },
];

async function seed() {
    console.log('Veri yükleniyor...');
    const colRef = collection(db, 'recyclingPoints');

    for (const point of POINTS) {
        await addDoc(colRef, {
            ...point,
            verified: true,
            createdAt: new Date(),
            createdBy: 'system'
        });
        console.log(`Eklendi: ${point.title}`);
    }
    console.log('Tamamlandı.');
}

seed().catch(console.error);
