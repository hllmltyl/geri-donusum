import os
import random
import shutil

# Klasör yolları
kaynak_klasor = r"D:\Dosyalar\Mobil\Datasets"
# Halihazırdaki yedek klasöründen farklı bir isim verelim ki karışmasın
yedek_klasor = r"D:\Dosyalar\Mobil\Datasets_Yedek_Extra"
hedef_sayi = 5000

print(f"Veri Seti Seyreltme İşlemi Başlıyor (Hedef: Her sınıf için {hedef_sayi} resim)...\n")

if not os.path.exists(yedek_klasor):
    os.makedirs(yedek_klasor)

# Klasörleri gez
for kategori in os.listdir(kaynak_klasor):
    kategori_yolu = os.path.join(kaynak_klasor, kategori)
    
    # Sadece klasörleri işleme al
    if not os.path.isdir(kategori_yolu):
        continue

    dosyalar = os.listdir(kategori_yolu)
    mevcut_sayi = len(dosyalar)
    
    print(f"[{kategori}]: Şu an {mevcut_sayi} dosya var.")
    
    # Eğer dosya sayısı hedef_sayi'den fazlaysa seyreltme yap
    if mevcut_sayi > hedef_sayi:
        tasilacak_sayi = mevcut_sayi - hedef_sayi
        print(f" -> {tasilacak_sayi} adet dosya fazlalık olarak belirlendi. {yedek_klasor} dizinine taşınıyor...")
        
        # Rastgele dosyaları seç ve taşı
        tasilacak_dosyalar = random.sample(dosyalar, tasilacak_sayi)
        
        hedef_kategori_yolu = os.path.join(yedek_klasor, kategori)
        if not os.path.exists(hedef_kategori_yolu):
            os.makedirs(hedef_kategori_yolu)
            
        for dosya in tasilacak_dosyalar:
            eski_yol = os.path.join(kategori_yolu, dosya)
            yeni_yol = os.path.join(hedef_kategori_yolu, dosya)
            
            try:
                shutil.move(eski_yol, yeni_yol)
            except Exception:
                pass
            
        print(f" -> {kategori} klasörü {hedef_sayi} adet resme düşürüldü.\n")
    else:
        print(f" -> {kategori} zaten {hedef_sayi} veya daha az dosyaya sahip ({mevcut_sayi}), işlem yapılmadı.\n")

print("--- İŞLEM TAMAM ---")
print(f"Veri setin artık her sınıftan rastgele seçilmiş en fazla {hedef_sayi} resim içeriyor.")
print(f"Fazlalıklar '{yedek_klasor}' klasörüne taşındı.")
