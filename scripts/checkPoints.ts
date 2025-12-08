import { initializeApp } from "firebase/app";
import { collection, getDocs, getFirestore } from "firebase/firestore";
import * as fs from 'fs';
import * as path from 'path';

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
    console.warn('.env read error');
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

async function check() {
    console.log('Checking recyclingPoints collection...');
    try {
        const snap = await getDocs(collection(db, 'recyclingPoints'));
        console.log(`Total documents: ${snap.size}`);
        snap.forEach(doc => console.log(`- ${doc.id}: ${JSON.stringify(doc.data().title)}`));
    } catch (e) {
        console.error('Error reading Firestore:', e);
    }
}

check();
