import { RecyclingPoint } from '@/constants/types';

export const WASTE_TYPES: { label: string, value: RecyclingPoint['type'] }[] = [
    { label: 'Pil', value: 'pil' },
    { label: 'Cam', value: 'cam' },
    { label: 'Plastik', value: 'plastik' },
    { label: 'Kağıt', value: 'kagit' },
    { label: 'Elektronik', value: 'elektronik' },
    { label: 'Metal', value: 'metal' },
    { label: 'Mavi Kapak', value: 'mavi_kapak' },
    { label: 'Yağ', value: 'yag' },
    { label: 'Tekstil', value: 'tekstil' },
    { label: 'Organik', value: 'organik' },
    { label: 'Ahşap', value: 'ahsap' },
    { label: 'Tıbbi', value: 'tibbi' },
    { label: 'İnşaat', value: 'insaat' },
    { label: 'Beyaz Eşya', value: 'beyazesya' },
    { label: 'Lastik', value: 'lastik' },
    { label: 'Mobilya', value: 'mobilya' },
    { label: 'Kompozit', value: 'kompozit' },
    { label: 'Boya', value: 'boya' },
    { label: 'Diğer', value: 'diger' },
];

export function getMarkerColor(type: string): string {
    switch (type) {
        case 'pil': return '#F44336';
        case 'cam': return '#4CAF50';
        case 'plastik': return '#2196F3';
        case 'kagit': return '#795548';
        case 'elektronik': return '#607D8B';
        case 'metal': return '#9E9E9E';
        case 'mavi_kapak': return '#0D47A1';
        case 'yag': return '#FDD835';
        case 'tekstil': return '#E91E63';
        case 'organik': return '#8BC34A';
        case 'ahsap': return '#795548';
        case 'tibbi': return '#D32F2F';
        case 'insaat': return '#FF5722';
        case 'beyazesya': return '#78909C';
        case 'lastik': return '#37474F';
        case 'mobilya': return '#5D4037';
        case 'kompozit': return '#009688';
        case 'boya': return '#9C27B0';
        default: return '#FF9800';
    }
}

export function getMarkerIcon(type: string): string {
    switch (type) {
        case 'pil': return 'battery-charging-full';
        case 'cam': return 'local-drink';
        case 'plastik': return 'science';
        case 'kagit': return 'description';
        case 'elektronik': return 'computer';
        case 'metal': return 'build';
        case 'mavi_kapak': return 'radio-button-checked';
        case 'yag': return 'opacity';
        case 'tekstil': return 'checkroom';
        case 'organik': return 'spa';
        case 'ahsap': return 'nature';
        case 'tibbi': return 'medical-services';
        case 'insaat': return 'construction';
        case 'beyazesya': return 'kitchen';
        case 'lastik': return 'directions-car';
        case 'mobilya': return 'chair';
        case 'kompozit': return 'layers';
        case 'boya': return 'format-paint';
        default: return 'place';
    }
}
