import os
import random
import shutil

# Klasör yolları
kaynak_klasor = r"D:\Dosyalar\Mobil\Datasets"
yedek_klasor = r"D:\Dosyalar\Mobil\Datasets_Yedek"
hedef_sayi = 5000
korunacak_ilk_sayi = 1000  # Listenin başındaki elenmeyecek korunacak dosya sayısı

print("Dengeleme ve Temizlik İşlemi Başlıyor...\n")

if not os.path.exists(yedek_klasor):
    os.makedirs(yedek_klasor)

# Klasörleri gez
for kategori in os.listdir(kaynak_klasor):
    kategori_yolu = os.path.join(kaynak_klasor, kategori)
    
    # Sadece klasörleri işleme al
    if not os.path.isdir(kategori_yolu):
        continue
        
    # DIGER klasörünü (252 resim) tamamen yedeğe taşı ve aradan çıkar (Eğer hala duruyorsa)
    if kategori == "DIGER":
        print(f"[{kategori}] sınıfı yetersiz veri nedeniyle tamamen yedeğe taşınıyor...")
        hedef_kategori_yolu = os.path.join(yedek_klasor, kategori)
        if not os.path.exists(hedef_kategori_yolu):
            shutil.move(kategori_yolu, hedef_kategori_yolu)
            print(f" -> DIGER klasörü devreden çıkarıldı.\n")
        continue

    # Dosyaları alfabetik sırayla al (Böylece ilk 1000 dosya her zaman tutarlı kalır)
    dosyalar = sorted([f for f in os.listdir(kategori_yolu) if os.path.isfile(os.path.join(kategori_yolu, f))])
    mevcut_sayi = len(dosyalar)
    
    print(f"[{kategori}]: {mevcut_sayi} dosya bulundu.")
    
    # Eğer dosya sayısı hedef_sayi'den fazlaysa dengeleme yap
    if mevcut_sayi > hedef_sayi:
        # İlk 1000 dosyayı koru
        korunan_dosyalar = dosyalar[:korunacak_ilk_sayi]
        kalan_adaylar = dosyalar[korunacak_ilk_sayi:]
        
        # 5000'e tamamlamak için kalan adaylar arasından rastgele seçilecek sayı: 4000
        secilecek_kalan_sayi = hedef_sayi - korunacak_ilk_sayi
        
        # Seçilen dosyalar aktif kalacak, seçilmeyen fazlalıklar yedeğe taşınacak
        tutulacak_kalanlar = random.sample(kalan_adaylar, secilecek_kalan_sayi)
        tasilacak_dosyalar = list(set(kalan_adaylar) - set(tutulacak_kalanlar))
        
        print(f" -> İlk {korunacak_ilk_sayi} dosya korundu.")
        print(f" -> Kalan {len(kalan_adaylar)} dosya arasından {secilecek_kalan_sayi} adet rastgele seçildi.")
        print(f" -> {len(tasilacak_dosyalar)} adet fazlalık dosya {yedek_klasor} dizinine taşınıyor...")
        
        hedef_kategori_yolu = os.path.join(yedek_klasor, kategori)
        if not os.path.exists(hedef_kategori_yolu):
            os.makedirs(hedef_kategori_yolu)
            
        for dosya in tasilacak_dosyalar:
            eski_yol = os.path.join(kategori_yolu, dosya)
            yeni_yol = os.path.join(hedef_kategori_yolu, dosya)
            # Taşınacak dosya hedef yedek dizininde zaten varsa çakışmayı önlemek için sil
            if os.path.exists(yeni_yol):
                os.remove(eski_yol)
            else:
                shutil.move(eski_yol, yeni_yol)
            
        print(f" -> {kategori} başarıyla {hedef_sayi} adetle sınırlandı (İlk {korunacak_ilk_sayi} korundu + {secilecek_kalan_sayi} rastgele).\n")
    else:
        print(f" -> {kategori} zaten uygun sayıda ({mevcut_sayi}), işlem yapılmadı.\n")

print("--- İŞLEM TAMAM ---")
print(f"Veri setiniz artık her sınıfta maksimum {hedef_sayi} dosya olacak şekilde dengelendi!")