import tensorflow as tf

# Az önce eğittiğin modelin klasör adı
saved_model_dir = 'mobil_atik_tanima_modeli'

print("Model okunuyor ve TFLite formatına dönüştürülüyor...")

# Dönüştürücüyü SavedModel klasöründen başlat
converter = tf.lite.TFLiteConverter.from_saved_model(saved_model_dir)

# --- MOBİL OPTİMİZASYONU (Çok Önemli) ---
# Bu ayar, modelin ağırlıklarını sıkıştırarak (Quantization) 
# dosya boyutunu küçültür ve telefonda çok daha az şarj/RAM harcamasını sağlar.
converter.optimizations = [tf.lite.Optimize.DEFAULT]

# Dönüşümü gerçekleştir
tflite_model = converter.convert()

# Çıkan sonucu .tflite dosyası olarak kaydet
tflite_dosya_adi = 'atik_tanima_modeli.tflite'
with open(tflite_dosya_adi, 'wb') as f:
    f.write(tflite_model)

print(f"--- İŞLEM TAMAM ---")
print(f"Mobil cihazlar için optimize edilmiş modelin '{tflite_dosya_adi}' adıyla kaydedildi!")