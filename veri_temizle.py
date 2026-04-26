import tensorflow as tf
import os
from pathlib import Path

DATA_DIR = r"D:\Dosyalar\Mobil\Datasets"
count = 0
removed = 0

print("TensorFlow derin tarama başlatılıyor... Lütfen bekleyin.")

for root, dirs, files in os.walk(DATA_DIR):
    for file in files:
        dosya_yolu = os.path.join(root, file)
        
        # Sadece resim dosyalarına bak
        if file.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp', '.gif')):
            try:
                # TensorFlow dosyayı gerçekten okumaya çalışsın
                img_bytes = tf.io.read_file(dosya_yolu)
                tf.io.decode_image(img_bytes)
            except Exception:
                # Eğer decode edemezse bozuktur, siliyoruz
                print(f"Bozuk dosya imha ediliyor: {dosya_yolu}")
                os.remove(dosya_yolu)
                removed += 1
        
        count += 1
        if count % 10000 == 0:
            print(f"{count} dosya tarandı...")

print(f"\n--- TARAMA BİTTİ ---")
print(f"Toplam Silinen sinsi dosya: {removed}")