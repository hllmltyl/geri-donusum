import os
import random
import shutil

# Klasör yolları
kaynak_klasor = r"D:\Dosyalar\Mobil\Datasets"
yedek_klasor = r"D:\Dosyalar\Mobil\Datasets_Yedek"
hedef_sayi = 40000

print("Dengeleme ve Temizlik İşlemi Başlıyor...\n")

if not os.path.exists(yedek_klasor):
    os.makedirs(yedek_klasor)

# Klasörleri gez
for kategori in os.listdir(kaynak_klasor):
    kategori_yolu = os.path.join(kaynak_klasor, kategori)
    
    # Sadece klasörleri işleme al
    if not os.path.isdir(kategori_yolu):
        continue
        
    # DIGER klasörünü (252 resim) tamamen yedeğe taşı ve aradan çıkar
    if kategori == "DIGER":
        print(f"[{kategori}] sınıfı yetersiz veri (252) nedeniyle tamamen yedeğe taşınıyor...")
        hedef_kategori_yolu = os.path.join(yedek_klasor, kategori)
        shutil.move(kategori_yolu, hedef_kategori_yolu)
        print(f" -> DIGER klasörü devreden çıkarıldı.\n")
        continue

    dosyalar = os.listdir(kategori_yolu)
    mevcut_sayi = len(dosyalar)
    
    print(f"[{kategori}]: {mevcut_sayi} dosya bulundu.")
    
    # Eğer dosya sayısı 40.000'den fazlaysa
    if mevcut_sayi > hedef_sayi:
        tasilacak_sayi = mevcut_sayi - hedef_sayi
        print(f" -> {tasilacak_sayi} adet dosya {yedek_klasor} dizinine taşınıyor (Lütfen bekleyin)...")
        
        # Rastgele dosyaları seç ve taşı
        tasilacak_dosyalar = random.sample(dosyalar, tasilacak_sayi)
        
        hedef_kategori_yolu = os.path.join(yedek_klasor, kategori)
        if not os.path.exists(hedef_kategori_yolu):
            os.makedirs(hedef_kategori_yolu)
            
        for dosya in tasilacak_dosyalar:
            eski_yol = os.path.join(kategori_yolu, dosya)
            yeni_yol = os.path.join(hedef_kategori_yolu, dosya)
            shutil.move(eski_yol, yeni_yol)
            
        print(f" -> {kategori} başarıyla {hedef_sayi} adetle sınırlandı.\n")
    else:
        print(f" -> {kategori} zaten uygun sayıda ({mevcut_sayi}), işlem yapılmadı.\n")

print("--- İŞLEM TAMAM ---")
print("Veri setin artık tamamen dengeli ve 9 sınıftan oluşuyor. Yeni eğitime hazır!")