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
  imageUrl?: string; // Firebase Storage URL veya harici görsel URL'i
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
  { id: 'w9', tur: 'ahsap', malzeme: 'Ahşap palet', yontem: 'Belediye büyük atık toplama/ahşap geri dönüşüm', aciklama: 'Çivi ve metal parçaları ayırın.', ipucular: ['Palleti mümkünse yeniden kullanın', 'Çivileri sökerken eldiven kullanın', 'Islak ahşabı kurumaya bırakın'] },
  { id: 'w10', tur: 'ahsap', malzeme: 'Tahta parçası', yontem: 'Atık ahşap toplama noktaları', aciklama: 'Vernikli/boyalı yüzeyler tehlikeli olabilir, ayrı toplayın.', ipucular: ['Boyalı/vernikli parçaları ayrı poşetleyin', 'Uzun parçaları kesip küçültün', 'Metal bağlantıları ayırın'] },
  { id: 'w11', tur: 'tekstil', malzeme: 'Giysi (kullanılabilir)', yontem: 'Giysi kumbarası/bağış', aciklama: 'Temiz ve kullanılabilir durumda bağışlayın.', ipucular: ['Yıkanıp katlanmış halde bağışlayın', 'Düğme/fermuarları sağlamlaştırın', 'Çiftleri (çorap vb.) bir araya bağlayın'] },
  { id: 'w12', tur: 'tekstil', malzeme: 'Eski çarşaf', yontem: 'Tekstil geri dönüşüm kumbarası', aciklama: 'Temizleyin ve kurutun, poşetleyip atın.', ipucular: ['Küçük parçalara kesip yer kazanın', 'Nemli tekstili önce kurutun', 'Küf kokulu ürünleri ayrı tutun'] },
  { id: 'w13', tur: 'pil', malzeme: 'Küçük kalem pil', yontem: 'TAP pil toplama kutuları', aciklama: 'Asla evsel atığa karıştırmayın.', ipucular: ['Artık şarjı kalmayanları birlikte biriktirin', 'Kutupları bantlayarak kısa devreyi önleyin', 'Çocukların erişemeyeceği yerde saklayın'] },
  { id: 'w14', tur: 'pil', malzeme: 'Şarjlı pil', yontem: 'Yetkili pil toplama noktası', aciklama: 'Kısa devreyi önlemek için kutupları bantlayın.', ipucular: ['Cihazdan çıkarıp ayrı saklayın', 'Hasarlı pilleri delmeyin', 'Sızdırma varsa ayrı kapta muhafaza edin'] },
  { id: 'w15', tur: 'atik_yag', malzeme: 'Kızartma yağı', yontem: 'Atık yağ toplama bidonu/belediye', aciklama: 'Lavaboya dökmeyin; uygun kapta biriktirin.', ipucular: ['Soğuduktan sonra kaba aktarın', 'Güneş görmeyen yerde saklayın', 'Yabancı maddelerle karıştırmayın'] },
  { id: 'w16', tur: 'atik_yag', malzeme: 'Motor yağı', yontem: 'Lisanslı atık yağ toplama', aciklama: 'Sızdırmaz kapta teslim edin.', ipucular: ['Huni kullanarak dökün', 'Etiketleyip “Atık Motor Yağı” yazın', 'Sızdırma riskine karşı ikincil kap kullanın'] },
  { id: 'w17', tur: 'tibbi', malzeme: 'İğne/şırınga', yontem: 'Sağlık kuruluşu/tehlikeli atık', aciklama: 'Delinmeye dayanıklı kapta toplayın.', ipucular: ['Kapaklı, delinmez bir şişe kullanın', 'Asla kapağını tekrar takmayın', 'Çocuklardan uzak tutun'] },
  { id: 'w18', tur: 'tibbi', malzeme: 'İlaç (son kullanmış)', yontem: 'Eczane ilaç toplama', aciklama: 'Evsel atığa atmayın, eczaneye teslim edin.', ipucular: ['Blister ve kutuları birlikte getirin', 'Sıvı ilaçları sızdırmaz poşete koyun', 'Prospektüsü saklayın'] },
  { id: 'w19', tur: 'insaat', malzeme: 'Moloz', yontem: 'Belediye inşaat atığı kabul noktası', aciklama: 'Karışık atıkları ayırarak teslim edin.', ipucular: ['Ağır torbaları aşırı doldurmayın', 'Metal/ahşap/ plastikleri ayrı toplayın', 'Tozu azaltmak için ıslatın'] },
  { id: 'w20', tur: 'insaat', malzeme: 'Seramik/karo', yontem: 'İnşaat atığı depolama', aciklama: 'Tozunu minimuma indirin, torbalayın.', ipucular: ['Kırıkları kalın torbada paketleyin', 'Kenarları bantla zedelemeyi önleyin', 'Küçük parçalara ayırın'] },
  { id: 'w21', tur: 'beyazesya', malzeme: 'Buzdolabı', yontem: 'Belediye/üretici geri alma', aciklama: 'Gazlı sistemler için yetkili söküm gerekir.', ipucular: ['Kapıları bantlayarak sabitleyin', 'İç rafları çıkarın', 'Dik konumda taşıyın'] },
  { id: 'w22', tur: 'beyazesya', malzeme: 'Çamaşır makinesi', yontem: 'Yetkili toplama', aciklama: 'Hortum ve kabloları sabitleyin.', ipucular: ['Nakliye cıvatalarını takın', 'Su hortumunu boşaltın', 'Kabloyu makineye bağlayın'] },
  { id: 'w23', tur: 'lastik', malzeme: 'Otomobil lastiği', yontem: 'Lisanslı lastik toplama', aciklama: 'Janttan ayırın; toplama noktalarına teslim edin.', ipucular: ['Janttan çıkarmak için servise başvurun', 'İçini temizleyip kurutun', 'Çift olarak bağlayın'] },
  { id: 'w24', tur: 'lastik', malzeme: 'Bisiklet lastiği', yontem: 'Lastik geri dönüşüm', aciklama: 'Temizleyip bağlayın.', ipucular: ['İç lastiği ayrı toplayın', 'Çamuru fırça ile temizleyin', 'Demetleyip teslim edin'] },
  { id: 'w25', tur: 'mobilya', malzeme: 'Kanepe', yontem: 'Büyük hacimli atık randevulu toplama', aciklama: 'Sökülebiliyorsa parçalara ayırın.', ipucular: ['Ayak ve kolçakları sökün', 'Kumaşı yırtmadan koruyun', 'Asansör kullanımını önceden planlayın'] },
  { id: 'w26', tur: 'mobilya', malzeme: 'Masa', yontem: 'Büyük atık toplama/ahşap geri dönüşüm', aciklama: 'Metal aksamları ayırın.', ipucular: ['Ayakları söküp vidaları poşetleyin', 'Yüzeyi çizilmemesi için örtün', 'Keskin köşeleri bantlayın'] },
  { id: 'w27', tur: 'kompozit', malzeme: 'Tetra Pak', yontem: 'Kompozit ambalaj geri dönüşümü', aciklama: 'Yıkayıp kurulayın, sıkıştırın.', ipucular: ['Köşeleri açıp tamamen boşaltın', 'Yıkayıp kuruttuktan sonra düzleştirin', 'Plastik kapakları ayrı toplayın'] },
  { id: 'w28', tur: 'kompozit', malzeme: 'Kahve kapsülü', yontem: 'Üretici kapsül geri dönüşümü', aciklama: 'Alüminyum/kahve posasını ayrı programlara verin.', ipucular: ['Üreticinin geri alım programını kontrol edin', 'Alüminyum kapsülleri yıkayıp kurutun', 'Posayı organik atığa ayırın'] },
  { id: 'w29', tur: 'boya', malzeme: 'Boya kutusu', yontem: 'Tehlikeli atık toplama', aciklama: 'Kalan boyayı kurumaya bırakmayın; lisanslı merkeze verin.', ipucular: ['Kapağı sıkıca kapatın', 'Sızdırmaz ikincil kaba koyun', 'Etiket üzerindeki uyarıları takip edin'] },
  { id: 'w30', tur: 'boya', malzeme: 'Tiner/çözücü', yontem: 'Tehlikeli atık', aciklama: 'Sızdırmaz kap; güneşten uzak tutun.', ipucular: ['Ateşten ve kıvılcımdan uzak tutun', 'Sızdırmayı emici malzemeyle kontrol edin', 'Orijinal kabında saklayın'] },

  // Plastik (hedef: 10 örnek)
  { id: 'w31', tur: 'plastik', malzeme: 'Yoğurt kabı', yontem: 'Plastik geri dönüşüm', aciklama: 'Etiketleri çıkarıp durulayın.', ipucular: ['Kapak ve gövdeyi ayrı atın', 'Kuru halde atın', 'Koku oluşmaması için çalkalayın'] },
  { id: 'w32', tur: 'plastik', malzeme: 'Deterjan şişesi (PE/HDPE)', yontem: 'Plastik geri dönüşüm', aciklama: 'Kimyasal kalıntıları durulayın.', ipucular: ['Çocuklardan uzak tutun', 'Kapağı ayrı atın', 'Etiket gerekmez'] },
  { id: 'w33', tur: 'plastik', malzeme: 'Şampuan şişesi', yontem: 'Plastik geri dönüşüm', aciklama: 'Boşaltıp kapağını kapatarak atın.', ipucular: ['Kıvamlı kalıntıyı suyla akıtın', 'Koku önlemek için çalkalayın', 'Kapaksız atmayın'] },
  { id: 'w34', tur: 'plastik', malzeme: 'Gıda saklama kabı (PP)', yontem: 'Plastik geri dönüşüm', aciklama: 'Temiz ve kuru olmalı.', ipucular: ['Yağlı ise peçeteyle silin', 'Kırık parçaları poşetleyin', 'Yapışkan etiket sorun değil'] },
  { id: 'w35', tur: 'plastik', malzeme: 'Plastik kapak', yontem: 'Plastik geri dönüşüm', aciklama: 'Şişelerden ayrı toplanabilir.', ipucular: ['Renk ayrımı yapmayın', 'Toplu biriktirin', 'Kuru tutun'] },
  { id: 'w36', tur: 'plastik', malzeme: 'Yoğurt iç kapağı (PP/PET)', yontem: 'Plastik geri dönüşüm', aciklama: 'Metalize film değilse plastik kutuya.', ipucular: ['Malzemeyi kontrol edin', 'Temiz atın', 'Kırışık sorun değil'] },
  { id: 'w37', tur: 'plastik', malzeme: 'Oyuncak (sert plastik)', yontem: 'Plastik geri dönüşüm', aciklama: 'Elektronik içermeyen, metal parçası az olan.', ipucular: ['Metal vidaları ayırın', 'Küçük parçaları poşetleyin', 'Kirliyse silin'] },
  { id: 'w38', tur: 'plastik', malzeme: 'Plastik meyve-sebze kabı (PET)', yontem: 'Plastik geri dönüşüm', aciklama: 'Kuru ve temiz olmalı.', ipucular: ['Etiketleri çıkarmak şart değil', 'Kırılgan kabı ezmeyin', 'Kapağıyla birlikte atın'] },

  // Cam (hedef: 10 örnek)
  { id: 'w39', tur: 'cam', malzeme: 'Soda/Meşrubat şişesi', yontem: 'Cam geri dönüşüm', aciklama: 'Kapakları ayrı toplayın.', ipucular: ['Şişeyi durulayın', 'Etiket kalabilir', 'Kırmadan atın'] },
  { id: 'w40', tur: 'cam', malzeme: 'Zeytin kavanozu', yontem: 'Cam geri dönüşüm', aciklama: 'Yağ kalıntısını silin.', ipucular: ['Kapağı metale', 'Kavanozu kurulayın', 'Koku yapmasını önleyin'] },
  { id: 'w41', tur: 'cam', malzeme: 'Salça kavanozu', yontem: 'Cam geri dönüşüm', aciklama: 'İçi boş ve temiz olmalı.', ipucular: ['Çalkalayın', 'Metal kapağı ayırın', 'Kurutup atın'] },
  { id: 'w42', tur: 'cam', malzeme: 'Yağ şişesi (cam)', yontem: 'Cam geri dönüşüm', aciklama: 'İyice süzdürün.', ipucular: ['Huniyle boşaltın', 'Çok yağlıysa peçeteyle silin', 'Damlama yapmayacak şekilde kapatın'] },
  { id: 'w43', tur: 'cam', malzeme: 'Parfüm şişesi (cam)', yontem: 'Cam geri dönüşüm', aciklama: 'Püskürtme başlığını ayırın.', ipucular: ['Metal/plastik parçaları ayırın', 'Kırılmayı önleyin', 'Koku kalıntısı sorun değil'] },
  { id: 'w44', tur: 'cam', malzeme: 'Kolonya şişesi (cam)', yontem: 'Cam geri dönüşüm', aciklama: 'Kapağı ayrı toplanır.', ipucular: ['Şişeyi boşaltın', 'Kapağı metale', 'Etiketi çıkarma şart değil'] },
  { id: 'w45', tur: 'cam', malzeme: 'Turşu kavanozu', yontem: 'Cam geri dönüşüm', aciklama: 'Tuzu yıkayın.', ipucular: ['Metal kapağı ayırın', 'Koku kalmasın', 'Kurutup atın'] },
  { id: 'w46', tur: 'cam', malzeme: 'Reçel kavanozu (farklı boylar)', yontem: 'Cam geri dönüşüm', aciklama: 'Cam temiz olmalı.', ipucular: ['Artıkları sıyırın', 'Çalkalayın', 'Kapağı metale atın'] },
  { id: 'w47', tur: 'cam', malzeme: 'İçecek şişesi (bira/soğuk çay)', yontem: 'Cam geri dönüşüm', aciklama: 'Boş ve temiz.', ipucular: ['Kapaksız atın', 'Camı kırmayın', 'Kasaya koymayın'] },

  // Kağıt (hedef: 10 örnek)
  { id: 'w48', tur: 'kagit', malzeme: 'Ofis kâğıdı', yontem: 'Kâğıt-karton geri dönüşüm', aciklama: 'Temiz ve kuru olmalı.', ipucular: ['Zımbaları çıkarmak gerekmez', 'Kâğıdı katlayın', 'Islak kâğıt atmayın'] },
  { id: 'w49', tur: 'kagit', malzeme: 'Kitap', yontem: 'Kâğıt-karton geri dönüşüm', aciklama: 'Kapak ve ciltli kısımlar sorun değildir.', ipucular: ['Bağışlanabilir durumu varsa bağışlayın', 'Kalın kapak kabul edilir', 'Temiz olmalı'] },
  { id: 'w50', tur: 'kagit', malzeme: 'Defter', yontem: 'Kâğıt-karton geri dönüşüm', aciklama: 'Spiral/birleştirici sorun olmaz.', ipucular: ['Spirali çıkarmak şart değil', 'Yapışkan notlar sorun değil', 'Islaksa kurutun'] },
  { id: 'w51', tur: 'kagit', malzeme: 'Kâğıt poşet', yontem: 'Kâğıt-karton geri dönüşüm', aciklama: 'Plastik sap varsa ayırın.', ipucular: ['Temiz olmalı', 'Yırtıp küçültün', 'Islak/yağlı olmamalı'] },
  { id: 'w52', tur: 'kagit', malzeme: 'Broşür/El ilanı', yontem: 'Kâğıt-karton geri dönüşüm', aciklama: 'Parlak yüzey sorun değildir.', ipucular: ['Demetleyin', 'Teli gerekmez', 'Kuru tutun'] },
  { id: 'w53', tur: 'kagit', malzeme: 'Zarf', yontem: 'Kâğıt-karton geri dönüşüm', aciklama: 'Pencereli zarf da kabul edilir.', ipucular: ['Kişisel bilgileri çıkarın', 'Kuru atın', 'Biriktirip atın'] },
  { id: 'w54', tur: 'kagit', malzeme: 'Yumurta kolisi (karton)', yontem: 'Kâğıt-karton geri dönüşüm', aciklama: 'Temiz ve kuru.', ipucular: ['Islaksa kurutun', 'Parçalayın', 'Koku yapmasın'] },
  { id: 'w55', tur: 'kagit', malzeme: 'Karton ambalaj', yontem: 'Kâğıt-karton geri dönüşüm', aciklama: 'Düzleştirip yer kazanın.', ipucular: ['Bantları mümkünse çıkarın', 'Düzleştirerek atın', 'Kuru tutun'] },

  // Metal (hedef: 10 örnek)
  { id: 'w56', tur: 'metal', malzeme: 'Konserve kutusu', yontem: 'Metal geri dönüşüm', aciklama: 'Boş ve durulanmış olmalı.', ipucular: ['Keskin kenarlara dikkat', 'Kapağı içine bastırın', 'Yer kaplamaması için ezebilirsiniz'] },
  { id: 'w57', tur: 'metal', malzeme: 'Teneke kutu', yontem: 'Metal geri dönüşüm', aciklama: 'Gıda kalıntısını temizleyin.', ipucular: ['Ezerek hacmi azaltın', 'Keskin kenarlara dikkat', 'Çocuklardan uzak tutun'] },
  { id: 'w58', tur: 'metal', malzeme: 'Alüminyum folyo (temiz)', yontem: 'Metal geri dönüşüm', aciklama: 'Yağlı/ kirli folyo uygun değildir.', ipucular: ['Temiz olanları top yapın', 'Küçük parçaları birleştirin', 'Kirliyse atmayın'] },
  { id: 'w59', tur: 'metal', malzeme: 'Metal kapak', yontem: 'Metal geri dönüşüm', aciklama: 'Cam kavanoz kapaklarını metale atın.', ipucular: ['Keskin kenarlara dikkat', 'Kavanozdan ayırın', 'Toplu biriktirin'] },
  { id: 'w60', tur: 'metal', malzeme: 'Aerosol kutusu (boş)', yontem: 'Metal geri dönüşüm', aciklama: 'Basınçsız ve tamamen boş olmalı.', ipucular: ['Delmeyin/yakmayın', 'Tam boşaldığından emin olun', 'Kapağını ayırın'] },
  { id: 'w61', tur: 'metal', malzeme: 'Balık konservesi kutusu', yontem: 'Metal geri dönüşüm', aciklama: 'Yağlı kalıntıyı silip atın.', ipucular: ['Kapağı içeri bastırın', 'Kokuyu azaltın', 'Ezin'] },
  { id: 'w62', tur: 'metal', malzeme: 'Enerji içeceği kutusu (Alüminyum)', yontem: 'Metal geri dönüşüm', aciklama: 'Boş ve temiz.', ipucular: ['Ezin', 'Pipeti çıkarın', 'Kuru atın'] },
  { id: 'w63', tur: 'metal', malzeme: 'Sardalya/ton balığı kutusu', yontem: 'Metal geri dönüşüm', aciklama: 'Koku yapmaması için durulayın.', ipucular: ['Ezin', 'Keskin kenarlara dikkat', 'Kapağı içeri bastırın'] },

  // Organik (hedef: 10 örnek)
  { id: 'w64', tur: 'organik', malzeme: 'Çay posası', yontem: 'Organik atık/kompost', aciklama: 'Filtre kâğıdı uygunsa komposta.', ipucular: ['Poşeti ayırın', 'Nem dengesine dikkat', 'Kokuyu önlemek için karıştırın'] },
  { id: 'w65', tur: 'organik', malzeme: 'Kahve telvesi', yontem: 'Organik atık/kompost', aciklama: 'Azot kaynağıdır.', ipucular: ['Filtre kâğıdı ile birlikte atılabilir', 'Aşırıya kaçmayın', 'Karbonla dengeleyin'] },
  { id: 'w66', tur: 'organik', malzeme: 'Yumurta kabuğu', yontem: 'Organik atık/kompost', aciklama: 'Kalsiyum kaynağı.', ipucular: ['Kırıp küçük parçalar yapın', 'Yıkayıp kurutun', 'Az miktarda ekleyin'] },
  { id: 'w67', tur: 'organik', malzeme: 'Meyve kabukları', yontem: 'Organik atık/kompost', aciklama: 'Narenciye kabukları sınırlı eklenmeli.', ipucular: ['Büyük parçaları küçültün', 'Islaklığı dengeleyin', 'Koku yaparsa karbon ekleyin'] },
  { id: 'w68', tur: 'organik', malzeme: 'Sebze kabukları', yontem: 'Organik atık/kompost', aciklama: 'Kompost için idealdir.', ipucular: ['Büyük kabukları küçültün', 'Karıştırarak hava verin', 'Aşırı ıslaksa kağıt ekleyin'] },
  { id: 'w69', tur: 'organik', malzeme: 'Bahçe yaprakları', yontem: 'Organik atık/kompost', aciklama: 'Karbon ağırlıklı materyal.', ipucular: ['Parçalayın', 'Nem dengesini koruyun', 'Düzenli çevirin'] },
  { id: 'w70', tur: 'organik', malzeme: 'Bayat ekmek', yontem: 'Organik atık/kompost', aciklama: 'Küflüyse kompostta dikkatli kullanın.', ipucular: ['Küf kokusuna dikkat', 'Küçük parçalara ayırın', 'Islaksa dengeleyin'] },
  { id: 'w71', tur: 'organik', malzeme: 'Çiçek yaprakları', yontem: 'Organik atık/kompost', aciklama: 'Pestisitli değilse uygun.', ipucular: ['Büyük sapları azaltın', 'Diğer atıklarla karıştırın', 'Oranı dengeleyin'] },

  // Elektronik (hedef: 10 örnek)
  { id: 'w72', tur: 'elektronik', malzeme: 'Dizüstü bilgisayar', yontem: 'Yetkili elektronik atık', aciklama: 'Verileri silin, lisanslı merkeze verin.', ipucular: ['Diskleri sıfırlayın', 'Pil/şarj cihazını ayrı toplayın', 'Orijinal kutuyla teslim edin'] },
  { id: 'w73', tur: 'elektronik', malzeme: 'Tablet', yontem: 'Yetkili elektronik atık', aciklama: 'Ekranı koruyun.', ipucular: ['İçindeki SIM/SD kartı çıkarın', 'Şarjı düşük bırakın', 'Kırılmayı önleyin'] },
  { id: 'w74', tur: 'elektronik', malzeme: 'Kulaklık', yontem: 'Yetkili elektronik atık', aciklama: 'Kabloları sarın.', ipucular: ['Küçük parçaları poşetleyin', 'Çalışıyorsa bağış', 'Islak bırakmayın'] },
  { id: 'w75', tur: 'elektronik', malzeme: 'Kablo', yontem: 'Yetkili elektronik atık', aciklama: 'Bakır geri kazanımı için.', ipucular: ['Demetleyin', 'Uçları bantlayın', 'Kısa parçaları birlikte atın'] },
  { id: 'w76', tur: 'elektronik', malzeme: 'Şarj aleti/Adaptör', yontem: 'Yetkili elektronik atık', aciklama: 'Kırık kabloları bantlayın.', ipucular: ['Fiş uçlarını koruyun', 'Kutuya birlikte koyun', 'Orijinal kabı tercih'] },
  { id: 'w77', tur: 'elektronik', malzeme: 'Blender/Mikser', yontem: 'Yetkili elektronik atık', aciklama: 'Kabloyu sarıp sabitleyin.', ipucular: ['Bıçaklara dikkat', 'Temizleyip kurulayın', 'Aksesuarları poşetleyin'] },
  { id: 'w78', tur: 'elektronik', malzeme: 'Uzaktan kumanda', yontem: 'Yetkili elektronik atık', aciklama: 'Pilleri çıkarın (pil kutusuna).', ipucular: ['Pilleri ayrı toplayın', 'Kırık kapakları bantlayın', 'Temizleyin'] },
  { id: 'w79', tur: 'elektronik', malzeme: 'Modem/Router', yontem: 'Yetkili elektronik atık', aciklama: 'Anten ve adaptörle birlikte.', ipucular: ['Şifreleri sıfırlayın', 'Kabloları birlikte bağlayın', 'Kutuya koyun'] },

  // Pil (hedef: 10 örnek)
  { id: 'w80', tur: 'pil', malzeme: 'Düğme pili (CR2032 vb.)', yontem: 'TAP pil toplama', aciklama: 'Kutupları bantlayın.', ipucular: ['Kısa devreyi önleyin', 'Çocuklardan uzak tutun', 'Toplu biriktirin'] },
  { id: 'w81', tur: 'pil', malzeme: 'AA kalem pil', yontem: 'TAP pil toplama', aciklama: 'Boş pilleri karıştırmayın.', ipucular: ['Kutupları bantlayın', 'Sızdıran pili poşetleyin', 'Kuru ortamda saklayın'] },
  { id: 'w82', tur: 'pil', malzeme: 'AAA ince kalem pil', yontem: 'TAP pil toplama', aciklama: 'Çocuklardan uzak.', ipucular: ['Bantlayın', 'Toplu atın', 'Sızdıranı ayrı koyun'] },
  { id: 'w83', tur: 'pil', malzeme: '9V pil', yontem: 'TAP pil toplama', aciklama: 'Kısa devre riski yüksek.', ipucular: ['Uçları bantlayın', 'Metalden uzak tutun', 'Kuru saklayın'] },
  { id: 'w84', tur: 'pil', malzeme: 'Lityum pil (kamera vb.)', yontem: 'TAP pil toplama', aciklama: 'Hasarlıysa uzman desteği.', ipucular: ['Delmeyin/ezmeyin', 'Aşırı ısınmadan kaçının', 'Poşetleyin'] },
  { id: 'w85', tur: 'pil', malzeme: 'NiMH şarjlı pil', yontem: 'TAP pil toplama', aciklama: 'Şarjlı piller de toplanır.', ipucular: ['Kutularda toplayın', 'Kutupları bantlayın', 'Etiketleyin'] },
  { id: 'w86', tur: 'pil', malzeme: 'Saat pili', yontem: 'TAP pil toplama', aciklama: 'Küçük boy, zehirli bileşenler.', ipucular: ['Kaybolmaması için poşetleyin', 'Bantlayın', 'Aile bireylerini bilgilendirin'] },
  { id: 'w87', tur: 'pil', malzeme: 'Oyuncak pili', yontem: 'TAP pil toplama', aciklama: 'Cihazdan çıkarıp toplayın.', ipucular: ['Artık enerjiyi boşaltmayın', 'Bantlayın', 'Çocuklardan uzak'] },

  // Atık Yağ (hedef: 10 örnek)
  { id: 'w88', tur: 'atik_yag', malzeme: 'Kızartma yağı (evsel)', yontem: 'Atık yağ toplama bidonu', aciklama: 'Lavaboya dökmeyin.', ipucular: ['Soğutun', 'Huniyle bidona aktarın', 'Etiketleyin'] },
  { id: 'w89', tur: 'atik_yag', malzeme: 'Fritöz yağı', yontem: 'Atık yağ toplama', aciklama: 'Süzüp ayrı kapta biriktirin.', ipucular: ['Gıda parçalarını süzün', 'Sızdırmaz kap kullanın', 'Güneşten uzak'] },
  { id: 'w90', tur: 'atik_yag', malzeme: 'Ayçiçek yağı atığı', yontem: 'Atık yağ toplama', aciklama: 'Karıştırmadan biriktirin.', ipucular: ['Etiketleyin', 'Ağzını sıkıca kapatın', 'Küçük kaplarda toplayın'] },
  { id: 'w91', tur: 'atik_yag', malzeme: 'Zeytinyağı atığı', yontem: 'Atık yağ toplama', aciklama: 'Cam şişeden bidona aktarın.', ipucular: ['Camı ayrı atın', 'Dökülmeyi önleyin', 'Sızıntı kontrolü'] },
  { id: 'w92', tur: 'atik_yag', malzeme: 'Mısırözü yağı atığı', yontem: 'Atık yağ toplama', aciklama: 'Aynı tür yağlarla biriktirin.', ipucular: ['Farklı yağları karıştırmayın', 'Serin yerde saklayın', 'Taşma olmasın'] },
  { id: 'w93', tur: 'atik_yag', malzeme: 'Motor yağı (evsel küçük miktar)', yontem: 'Lisanslı atık yağ toplama', aciklama: 'Sızdırmaz kapta.', ipucular: ['Deri teması etmeyin', 'Sızıntıya karşı ikincil kap', 'Etiketleyin'] },
  { id: 'w94', tur: 'atik_yag', malzeme: 'Hidrolik yağ atığı', yontem: 'Lisanslı atık yağ toplama', aciklama: 'Karıştırmadan teslim edin.', ipucular: ['Uygun PPE kullanın', 'Sızdırmaz kap', 'Uzman teslimi'] },
  { id: 'w95', tur: 'atik_yag', malzeme: 'Dişli yağı atığı', yontem: 'Lisanslı atık yağ toplama', aciklama: 'Sızdırmaz, etiketli kap.', ipucular: ['Karıştırmayın', 'Kokuya karşı kapalı tutun', 'Sıcak ortamdan uzak'] },
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

