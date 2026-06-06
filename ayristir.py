import os
import shutil
import numpy as np
from PIL import Image

# =====================================================================
# CONFIGURATION / YAPILANDIRMA
# =====================================================================
# KAYNAK_DIR: Ayrıştırmak istediğiniz büyük veri setinin bulunduğu klasör.
# Bu klasörün içinde de 'plastic', 'glass' vb. alt klasörler olmalıdır.
KAYNAK_DIR = r"D:\Dosyalar\Mobil\Compressed\archive_X"

# HEDEF_DIR: Slayttaki 8 klasörün (battery, cardboard, glass...) olduğu yeni veri seti klasörü.
HEDEF_DIR = r"D:\Dosyalar\Mobil\Datasets"

# HEDEF_SAYI: Sınıf başına ulaşılmak istenen maksimum görsel sayısı.
HEDEF_SAYI = 5000

# tolerans: Grayscale (siyah-beyaz) tespiti için RGB kanalları arası fark toleransı.
# 0 ile 255 arasındadır. Çok düşük değerler (örn: 2.0) neredeyse tamamen siyah-beyaz olanları eler.
GRAYSCALE_TOLERANCE = 2.0

# =====================================================================
# YARDIMCI FONKSİYONLAR
# =====================================================================

def is_grayscale(img, threshold=GRAYSCALE_TOLERANCE):
    """
    Görselin siyah-beyaz (grayscale) olup olmadığını kontrol eder.
    """
    if img.mode == 'L':
        return True
    if img.mode != 'RGB':
        img = img.convert('RGB')
        
    arr = np.array(img)
    if len(arr.shape) < 3:
        return True
        
    # RGB kanalları arasındaki ortalama farkı hesapla
    r, g, b = arr[:,:,0], arr[:,:,1], arr[:,:,2]
    diff = np.mean(np.abs(r - g)) + np.mean(np.abs(g - b))
    
    return diff < threshold

def calculate_ahash(img):
    """
    Görselin 8x8 boyutunda Average Hash (aHash) değerini hesaplar.
    Bu değer görselin 'parmak izi' gibidir.
    """
    # Görseli 8x8 piksele düşür ve siyah-beyaza çevir
    img_small = img.convert('L').resize((8, 8), Image.Resampling.BILINEAR)
    pixels = np.array(img_small)
    avg = pixels.mean()
    
    # Ortalama değerin üstündeki pikseller True (1), altındakiler False (0) olur
    return pixels >= avg

def hash_to_string(hash_matrix):
    """
    Boole matrisini karşılaştırılabilir bir string'e çevirir.
    """
    return "".join("1" if x else "0" for x in hash_matrix.flatten())

def get_all_variants(hash_matrix):
    """
    Matrisin tüm döndürülmüş (90, 180, 270 derece) ve simetrik (aynalanmış)
    varyasyonlarını döndürür. Böylece yan dönmüş fotoğrafları da yakalarız.
    """
    variants = []
    # Orijinal ve döndürülmüş halleri
    for i in range(4):
        rot = np.rot90(hash_matrix, i)
        variants.append(hash_to_string(rot))
        # Aynalanmış halleri
        variants.append(hash_to_string(np.fliplr(rot)))
    return set(variants)

# =====================================================================
# ANA SÜREÇ
# =====================================================================

def main():
    print("=== Otomatik Görsel Ayrıştırma ve Filtreleme Başlıyor ===\n")
    
    if not os.path.exists(HEDEF_DIR):
        print(f"Hata: Hedef klasör bulunamadı: {HEDEF_DIR}")
        print("Lütfen hedef klasörü oluşturup sınıfları ekleyin.")
        return

    # Hedef klasördeki sınıfları tara (battery, cardboard, glass, vb.)
    siniflar = [d for d in os.listdir(HEDEF_DIR) if os.path.isdir(os.path.join(HEDEF_DIR, d))]
    
    print(f"Tespit edilen hedef sınıflar: {siniflar}\n")

    for sinif in siniflar:
        hedef_sinif_yolu = os.path.join(HEDEF_DIR, sinif)
        kaynak_sinif_yolu = os.path.join(KAYNAK_DIR, sinif)
        
        # Hedef sınıftaki mevcut dosyaları bul
        mevcut_dosyalar = [f for f in os.listdir(hedef_sinif_yolu) if f.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp'))]
        mevcut_sayisi = len(mevcut_dosyalar)
        
        print(f"[{sinif.upper()}] Sınıfı İşleniyor...")
        print(f" -> Hedef klasörde halihazırda {mevcut_sayisi} dosya var.")
        
        if mevcut_sayisi >= HEDEF_SAYI:
            print(f" -> Bu sınıf zaten hedeflenen {HEDEF_SAYI} görsel limitine ulaşmış. Pas geçiliyor.\n")
            continue

        # Büyük veri setinde bu sınıfın klasörü var mı kontrol et
        if not os.path.exists(kaynak_sinif_yolu):
            print(f" -> UYARI: Kaynak klasörde '{sinif}' sınıfı bulunamadı ({kaynak_sinif_yolu}). Bu sınıf doldurulamayacak.\n")
            continue

        # Hedef klasördeki mevcut görsellerin hash'lerini çıkarıp hafızaya alalım (tekrarları önlemek için)
        benzerlik_havuzu = set()
        print(" -> Hedef klasördeki mevcut resimlerin parmak izleri çıkarılıyor...")
        for dosya in mevcut_dosyalar:
            yol = os.path.join(hedef_sinif_yolu, dosya)
            try:
                with Image.open(yol) as img:
                    h_matrix = calculate_ahash(img)
                    # Mevcut resmin tüm yönlerdeki parmak izlerini havuzumuza ekliyoruz
                    benzerlik_havuzu.update(get_all_variants(h_matrix))
            except Exception:
                # Bozuk dosya ise atla
                pass

        # Kaynak klasördeki resimleri listele
        kaynak_dosyalar = [f for f in os.listdir(kaynak_sinif_yolu) if f.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp'))]
        print(f" -> Kaynak klasörde {len(kaynak_dosyalar)} aday görsel bulundu. Seçim ve filtreleme başlıyor...")
        
        eklenen_sayac = 0
        siyah_beyaz_sayac = 0
        kopya_sayac = 0
        bozuk_sayac = 0
        
        for dosya in kaynak_dosyalar:
            # Hedef sayıya ulaştıysak dur
            if (mevcut_sayisi + eklenen_sayac) >= HEDEF_SAYI:
                break
                
            kaynak_yol = os.path.join(kaynak_sinif_yolu, dosya)
            hedef_yol = os.path.join(hedef_sinif_yolu, dosya)
            
            # Eğer aynı isimde dosya hedefte zaten varsa atla
            if os.path.exists(hedef_yol):
                continue
                
            try:
                with Image.open(kaynak_yol) as img:
                    # 1. Adım: Siyah-Beyaz kontrolü
                    if is_grayscale(img):
                        siyah_beyaz_sayac += 1
                        continue
                        
                    # 2. Adım: Parmak İzi (Hash) Kontrolü
                    h_matrix = calculate_ahash(img)
                    h_str = hash_to_string(h_matrix)
                    
                    # Eğer bu görsel veya döndürülmüş versiyonu havuzda varsa kopyadır, atla
                    if h_str in benzerlik_havuzu:
                        kopya_sayac += 1
                        continue
                        
                    # Benzersiz ve renkli bir görsel bulduk!
                    # Havuzu güncelle (tüm yön varyasyonlarıyla)
                    benzerlik_havuzu.update(get_all_variants(h_matrix))
                    
                # Dosyayı kopyala
                shutil.copy(kaynak_yol, hedef_yol)
                eklenen_sayac += 1
                
            except Exception:
                bozuk_sayac += 1
                continue
        
        print(f" -> BİTTİ: {eklenen_sayac} benzersiz renkli görsel kopyalandı.")
        print(f" -> Filtrelenenler: {siyah_beyaz_sayac} Siyah-Beyaz | {kopya_sayac} Döndürülmüş/Kopya | {bozuk_sayac} Bozuk Dosya.")
        print(f" -> Yeni Toplam: {mevcut_sayisi + eklenen_sayac} görsel.\n")

    print("=== İşlem Başarıyla Tamamlandı ===")

if __name__ == "__main__":
    main()
