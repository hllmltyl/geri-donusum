export interface RecyclingPoint {
    id: string;
    title: string;
    description: string;
    latitude: number;
    longitude: number;
    type: 'pil' | 'cam' | 'plastik' | 'kagit' | 'elektronik' | 'metal' | 'atik_yag' | 'tekstil' | 'organik' | 'ahsap' | 'tibbi' | 'insaat' | 'beyazesya' | 'lastik' | 'mobilya' | 'kompozit' | 'boya' | 'diger';
    verified: boolean;
    createdBy: string; // 'system' or userId
    createdAt: any; // Firestore Timestamp
    status?: 'pending' | 'approved' | 'rejected';
    verifiedBy?: string[];
    dropoffCount?: number;
}

export interface UserProfile {
    uid: string;
    email: string | null;
    displayName?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    photoURL?: string | null;
    badges: string[];
    role?: 'user' | 'admin';
    createdAt?: any;
    xp?: number;
    trustScore?: number;
    dailyScanCount?: number;
    lastScanDate?: string | any;
    isShadowBanned?: boolean;
}

export interface Scan {
    userId: string;
    timestamp: any; // Firestore Timestamp
    wasteType: string;
    confidence: number;
    pointsEarned: number;
    isPhysicalDropoff: boolean;
}

export type Message = {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
};
