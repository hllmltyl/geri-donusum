import { RecyclingPoint } from '@/constants/types';
import { CATEGORY_COLORS, WasteCategory } from '@/constants/waste';

export const WASTE_TYPES: { label: string, value: RecyclingPoint['type'] }[] = [
    { label: 'Pil', value: 'pil' },
    { label: 'Cam', value: 'cam' },
    { label: 'Plastik', value: 'plastik' },
    { label: 'Kağıt', value: 'kagit' },
    { label: 'Elektronik', value: 'elektronik' },
    { label: 'Metal', value: 'metal' },
    { label: 'Atık Yağ', value: 'atik_yag' },
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
    return CATEGORY_COLORS[type as WasteCategory] || '#FF9800';
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
        case 'atik_yag': return 'opacity';
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
