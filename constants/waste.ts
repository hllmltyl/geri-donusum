export type WasteCategory =
  | 'hepsi'
  | 'plastik'
  | 'cam'
  | 'kagit'
  | 'metal'
  | 'organik'
  | 'elektronik';

export type WasteItem = {
  id: string;
  tur: Exclude<WasteCategory, 'hepsi'>;
  malzeme: string;
  yontem: string;
  aciklama: string;
};

export const WASTE_ITEMS: WasteItem[] = [
  {
    id: 'w1',
    tur: 'plastik',
    malzeme: 'Pet şişe',
    yontem: 'Plastik geri dönüşüm kutusuna atın',
    aciklama: 'Kapakları ayrı toplayın; temiz ve kuru olmasına dikkat edin.',
  },
  {
    id: 'w2',
    tur: 'cam',
    malzeme: 'Cam kavanoz',
    yontem: 'Cam geri dönüşüm kutusuna atın',
    aciklama: 'Metal kapakları ayırın, camı kırmadan atmaya çalışın.',
  },
  {
    id: 'w3',
    tur: 'kagit',
    malzeme: 'Gazete/dergi',
    yontem: 'Kâğıt-karton geri dönüşüm kutusuna atın',
    aciklama: 'Islak/yağlı kâğıtlar geri dönüşüme uygun değildir.',
  },
  {
    id: 'w4',
    tur: 'metal',
    malzeme: 'İçecek kutusu (alüminyum)',
    yontem: 'Metal geri dönüşüm kutusuna atın',
    aciklama: 'Mümkünse ezerek hacmini küçültün.',
  },
  {
    id: 'w5',
    tur: 'organik',
    malzeme: 'Meyve sebze artıkları',
    yontem: 'Organik atık/kompost',
    aciklama: 'Evde kompost yapabilir ya da organik atık kutusuna atabilirsiniz.',
  },
  {
    id: 'w6',
    tur: 'elektronik',
    malzeme: 'Eski telefon',
    yontem: 'Yetkili elektronik atık toplama noktaları',
    aciklama: 'Pillerini ayrı toplayın, lisanslı merkezlere teslim edin.',
  },
  {
    id: 'w7',
    tur: 'kagit',
    malzeme: 'Karton koli',
    yontem: 'Kâğıt-karton geri dönüşüm kutusuna atın',
    aciklama: 'Temiz ve kuru olmasına dikkat edin, bantları mümkünse çıkartın.',
  },
  {
    id: 'w8',
    tur: 'plastik',
    malzeme: 'Plastik poşet',
    yontem: 'Plastik geri dönüşüm',
    aciklama: 'Mümkünse tekrar kullanın; geri dönüşüm için temizleyip kurulayın.',
  },
];

export const CATEGORY_FILTERS: { value: WasteCategory; label: string }[] = [
  { value: 'hepsi', label: 'Hepsi' },
  { value: 'plastik', label: 'Plastik' },
  { value: 'cam', label: 'Cam' },
  { value: 'kagit', label: 'Kağıt' },
  { value: 'metal', label: 'Metal' },
  { value: 'organik', label: 'Organik' },
  { value: 'elektronik', label: 'Elektronik' },
];

