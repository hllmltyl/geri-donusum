export interface RecyclingPoint {
    id: string;
    title: string;
    description: string;
    latitude: number;
    longitude: number;
    type: 'pil' | 'cam' | 'plastik' | 'kagit' | 'elektronik' | 'diger';
    verified: boolean;
    createdBy: string; // 'system' or userId
    createdAt: any; // Firestore Timestamp
}
