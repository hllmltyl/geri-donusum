export type WasteCategory =
  | 'hepsi'
  | 'plastik'
  | 'cam'
  | 'kagit'
  | 'metal'
  | 'organik'
  | 'elektronik'
  | 'ahsap'
  | 'tekstil'
  | 'pil'
  | 'atik_yag'
  | 'tibbi'
  | 'insaat'
  | 'beyazesya'
  | 'lastik'
  | 'mobilya'
  | 'kompozit'
  | 'boya';

export type WasteItem = {
  id: string;
  tur: Exclude<WasteCategory, 'hepsi'>;
  malzeme: string;
  yontem: string;
  aciklama: string;
  ipucular: string[];
};

export const WASTE_ITEMS: WasteItem[] = [
  {
    id: 'w1',
    tur: 'plastik',
    malzeme: 'Pet şişe',
    yontem: 'Plastik geri dönüşüm kutusuna atın',
    aciklama: 'Kapakları ayrı toplayın; temiz ve kuru olmasına dikkat edin.',
    ipucular: [
      'Şişeyi hızlıca çalkalayıp kurulayın',
      'Hacmi azaltmak için şişeyi sıkıştırın',
      'Kapakları ayrı toplayıp geri dönüştürün',
    ],
  },
  {
    id: 'w2',
    tur: 'cam',
    malzeme: 'Cam kavanoz',
    yontem: 'Cam geri dönüşüm kutusuna atın',
    aciklama: 'Metal kapakları ayırın, camı kırmadan atmaya çalışın.',
    ipucular: [
      'Kavanozu durulayıp etiketleri mümkünse çıkarın',
      'Metal kapakları metal atıkla birlikte atın',
      'Kırık camları kalın bir kutuda güvenli şekilde taşıyın',
    ],
  },
  {
    id: 'w3',
    tur: 'kagit',
    malzeme: 'Gazete/dergi',
    yontem: 'Kâğıt-karton geri dönüşüm kutusuna atın',
    aciklama: 'Islak/yağlı kâğıtlar geri dönüşüme uygun değildir.',
    ipucular: [
      'Gazete ve dergileri ip ile demetleyin',
      'Islak/yağlı kâğıtları ayrı tutun',
      'Zımbaları çıkarmak gerekli değildir ama tercih edilebilir',
    ],
  },
  {
    id: 'w4',
    tur: 'metal',
    malzeme: 'İçecek kutusu (alüminyum)',
    yontem: 'Metal geri dönüşüm kutusuna atın',
    aciklama: 'Mümkünse ezerek hacmini küçültün.',
    ipucular: [
      'Kutuyu hızlıca durulayın',
      'Hacmi azaltmak için kutuyu bastırarak ezin',
      'Diğer malzemelerle karıştırmayın',
    ],
  },
  {
    id: 'w5',
    tur: 'organik',
    malzeme: 'Meyve sebze artıkları',
    yontem: 'Organik atık/kompost',
    aciklama: 'Evde kompost yapabilir ya da organik atık kutusuna atabilirsiniz.',
    ipucular: [
      'Suyu süzüp kokuyu azaltın',
      'Kompostta karbon/azot dengesine dikkat edin',
      'Et/süt ürünlerini organikten ayrı tutun',
    ],
  },
  {
    id: 'w6',
    tur: 'elektronik',
    malzeme: 'Eski telefon',
    yontem: 'Yetkili elektronik atık toplama noktaları',
    aciklama: 'Pillerini ayrı toplayın, lisanslı merkezlere teslim edin.',
    ipucular: [
      'Kişisel verilerinizi sıfırlayın',
      'Bataryayı delmeyin/ezmeyin',
      'Orijinal kutu veya korunaklı poşette teslim edin',
    ],
  },
  {
    id: 'w7',
    tur: 'kagit',
    malzeme: 'Karton koli',
    yontem: 'Kâğıt-karton geri dönüşüm kutusuna atın',
    aciklama: 'Temiz ve kuru olmasına dikkat edin, bantları mümkünse çıkartın.',
    ipucular: [
      'Koliyi düzleştirerek yerden tasarruf edin',
      'Plastik bantları mümkünse sökün',
      'Yağlı/pis kolileri geri dönüşüme karıştırmayın',
    ],
  },
  {
    id: 'w8',
    tur: 'plastik',
    malzeme: 'Plastik poşet',
    yontem: 'Plastik geri dönüşüm',
    aciklama: 'Mümkünse tekrar kullanın; geri dönüşüm için temizleyip kurulayın.',
    ipucular: [
      'Poşetleri iç içe koyup top yaparak biriktirin',
      'Yırtık poşetleri de temizse geri dönüştürün',
      'Marketlerdeki poşet kutularını tercih edin',
    ],
  },
  // Yeni kategoriler ve örnek atıklar
  { id: 'w9',  tur: 'ahsap', malzeme: 'Ahşap palet', yontem: 'Belediye büyük atık toplama/ahşap geri dönüşüm', aciklama: 'Çivi ve metal parçaları ayırın.', ipucular: [ 'Palleti mümkünse yeniden kullanın', 'Çivileri sökerken eldiven kullanın', 'Islak ahşabı kurumaya bırakın' ] },
  { id: 'w10', tur: 'ahsap', malzeme: 'Tahta parçası', yontem: 'Atık ahşap toplama noktaları', aciklama: 'Vernikli/boyalı yüzeyler tehlikeli olabilir, ayrı toplayın.', ipucular: [ 'Boyalı/vernikli parçaları ayrı poşetleyin', 'Uzun parçaları kesip küçültün', 'Metal bağlantıları ayırın' ] },
  { id: 'w11', tur: 'tekstil', malzeme: 'Giysi (kullanılabilir)', yontem: 'Giysi kumbarası/bağış', aciklama: 'Temiz ve kullanılabilir durumda bağışlayın.', ipucular: [ 'Yıkanıp katlanmış halde bağışlayın', 'Düğme/fermuarları sağlamlaştırın', 'Çiftleri (çorap vb.) bir araya bağlayın' ] },
  { id: 'w12', tur: 'tekstil', malzeme: 'Eski çarşaf', yontem: 'Tekstil geri dönüşüm kumbarası', aciklama: 'Temizleyin ve kurutun, poşetleyip atın.', ipucular: [ 'Küçük parçalara kesip yer kazanın', 'Nemli tekstili önce kurutun', 'Küf kokulu ürünleri ayrı tutun' ] },
  { id: 'w13', tur: 'pil', malzeme: 'Küçük kalem pil', yontem: 'TAP pil toplama kutuları', aciklama: 'Asla evsel atığa karıştırmayın.', ipucular: [ 'Artık şarjı kalmayanları birlikte biriktirin', 'Kutupları bantlayarak kısa devreyi önleyin', 'Çocukların erişemeyeceği yerde saklayın' ] },
  { id: 'w14', tur: 'pil', malzeme: 'Şarjlı pil', yontem: 'Yetkili pil toplama noktası', aciklama: 'Kısa devreyi önlemek için kutupları bantlayın.', ipucular: [ 'Cihazdan çıkarıp ayrı saklayın', 'Hasarlı pilleri delmeyin', 'Sızdırma varsa ayrı kapta muhafaza edin' ] },
  { id: 'w15', tur: 'atik_yag', malzeme: 'Kızartma yağı', yontem: 'Atık yağ toplama bidonu/belediye', aciklama: 'Lavaboya dökmeyin; uygun kapta biriktirin.', ipucular: [ 'Soğuduktan sonra kaba aktarın', 'Güneş görmeyen yerde saklayın', 'Yabancı maddelerle karıştırmayın' ] },
  { id: 'w16', tur: 'atik_yag', malzeme: 'Motor yağı', yontem: 'Lisanslı atık yağ toplama', aciklama: 'Sızdırmaz kapta teslim edin.', ipucular: [ 'Huni kullanarak dökün', 'Etiketleyip “Atık Motor Yağı” yazın', 'Sızdırma riskine karşı ikincil kap kullanın' ] },
  { id: 'w17', tur: 'tibbi', malzeme: 'İğne/şırınga', yontem: 'Sağlık kuruluşu/tehlikeli atık', aciklama: 'Delinmeye dayanıklı kapta toplayın.', ipucular: [ 'Kapaklı, delinmez bir şişe kullanın', 'Asla kapağını tekrar takmayın', 'Çocuklardan uzak tutun' ] },
  { id: 'w18', tur: 'tibbi', malzeme: 'İlaç (son kullanmış)', yontem: 'Eczane ilaç toplama', aciklama: 'Evsel atığa atmayın, eczaneye teslim edin.', ipucular: [ 'Blister ve kutuları birlikte getirin', 'Sıvı ilaçları sızdırmaz poşete koyun', 'Prospektüsü saklayın' ] },
  { id: 'w19', tur: 'insaat', malzeme: 'Moloz', yontem: 'Belediye inşaat atığı kabul noktası', aciklama: 'Karışık atıkları ayırarak teslim edin.', ipucular: [ 'Ağır torbaları aşırı doldurmayın', 'Metal/ahşap/ plastikleri ayrı toplayın', 'Tozu azaltmak için ıslatın' ] },
  { id: 'w20', tur: 'insaat', malzeme: 'Seramik/karo', yontem: 'İnşaat atığı depolama', aciklama: 'Tozunu minimuma indirin, torbalayın.', ipucular: [ 'Kırıkları kalın torbada paketleyin', 'Kenarları bantla zedelemeyi önleyin', 'Küçük parçalara ayırın' ] },
  { id: 'w21', tur: 'beyazesya', malzeme: 'Buzdolabı', yontem: 'Belediye/üretici geri alma', aciklama: 'Gazlı sistemler için yetkili söküm gerekir.', ipucular: [ 'Kapıları bantlayarak sabitleyin', 'İç rafları çıkarın', 'Dik konumda taşıyın' ] },
  { id: 'w22', tur: 'beyazesya', malzeme: 'Çamaşır makinesi', yontem: 'Yetkili toplama', aciklama: 'Hortum ve kabloları sabitleyin.', ipucular: [ 'Nakliye cıvatalarını takın', 'Su hortumunu boşaltın', 'Kabloyu makineye bağlayın' ] },
  { id: 'w23', tur: 'lastik', malzeme: 'Otomobil lastiği', yontem: 'Lisanslı lastik toplama', aciklama: 'Janttan ayırın; toplama noktalarına teslim edin.', ipucular: [ 'Janttan çıkarmak için servise başvurun', 'İçini temizleyip kurutun', 'Çift olarak bağlayın' ] },
  { id: 'w24', tur: 'lastik', malzeme: 'Bisiklet lastiği', yontem: 'Lastik geri dönüşüm', aciklama: 'Temizleyip bağlayın.', ipucular: [ 'İç lastiği ayrı toplayın', 'Çamuru fırça ile temizleyin', 'Demetleyip teslim edin' ] },
  { id: 'w25', tur: 'mobilya', malzeme: 'Kanepe', yontem: 'Büyük hacimli atık randevulu toplama', aciklama: 'Sökülebiliyorsa parçalara ayırın.', ipucular: [ 'Ayak ve kolçakları sökün', 'Kumaşı yırtmadan koruyun', 'Asansör kullanımını önceden planlayın' ] },
  { id: 'w26', tur: 'mobilya', malzeme: 'Masa', yontem: 'Büyük atık toplama/ahşap geri dönüşüm', aciklama: 'Metal aksamları ayırın.', ipucular: [ 'Ayakları söküp vidaları poşetleyin', 'Yüzeyi çizilmemesi için örtün', 'Keskin köşeleri bantlayın' ] },
  { id: 'w27', tur: 'kompozit', malzeme: 'Tetra Pak', yontem: 'Kompozit ambalaj geri dönüşümü', aciklama: 'Yıkayıp kurulayın, sıkıştırın.', ipucular: [ 'Köşeleri açıp tamamen boşaltın', 'Yıkayıp kuruttuktan sonra düzleştirin', 'Plastik kapakları ayrı toplayın' ] },
  { id: 'w28', tur: 'kompozit', malzeme: 'Kahve kapsülü', yontem: 'Üretici kapsül geri dönüşümü', aciklama: 'Alüminyum/kahve posasını ayrı programlara verin.', ipucular: [ 'Üreticinin geri alım programını kontrol edin', 'Alüminyum kapsülleri yıkayıp kurutun', 'Posayı organik atığa ayırın' ] },
  { id: 'w29', tur: 'boya', malzeme: 'Boya kutusu', yontem: 'Tehlikeli atık toplama', aciklama: 'Kalan boyayı kurumaya bırakmayın; lisanslı merkeze verin.', ipucular: [ 'Kapağı sıkıca kapatın', 'Sızdırmaz ikincil kaba koyun', 'Etiket üzerindeki uyarıları takip edin' ] },
  { id: 'w30', tur: 'boya', malzeme: 'Tiner/çözücü', yontem: 'Tehlikeli atık', aciklama: 'Sızdırmaz kap; güneşten uzak tutun.', ipucular: [ 'Ateşten ve kıvılcımdan uzak tutun', 'Sızdırmayı emici malzemeyle kontrol edin', 'Orijinal kabında saklayın' ] },
];

export const CATEGORY_FILTERS: { value: WasteCategory; label: string }[] = [
  { value: 'hepsi', label: 'Hepsi' },
  { value: 'plastik', label: 'Plastik' },
  { value: 'cam', label: 'Cam' },
  { value: 'kagit', label: 'Kağıt' },
  { value: 'metal', label: 'Metal' },
  { value: 'organik', label: 'Organik' },
  { value: 'elektronik', label: 'Elektronik' },
  { value: 'ahsap', label: 'Ahşap' },
  { value: 'tekstil', label: 'Tekstil' },
  { value: 'pil', label: 'Pil' },
  { value: 'atik_yag', label: 'Atık Yağ' },
  { value: 'tibbi', label: 'Tıbbi' },
  { value: 'insaat', label: 'İnşaat Atığı' },
  { value: 'beyazesya', label: 'Beyaz Eşya' },
  { value: 'lastik', label: 'Lastik' },
  { value: 'mobilya', label: 'Mobilya' },
  { value: 'kompozit', label: 'Kompozit' },
  { value: 'boya', label: 'Boya/Çözücü' },
];

