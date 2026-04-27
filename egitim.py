import os
import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D
from tensorflow.keras.models import Model

# ==========================================
# 1. DOSYA YOLU VE EĞİTİM PARAMETRELERİ
# ==========================================
# DATA_DIR: Eğitim verilerinin bulunduğu ana klasörün yoludur. 
# Bu klasörün içinde her bir sınıf için ayrı alt klasörler bulunmalıdır.
DATA_DIR = r"D:\Dosyalar\Mobil\Datasets" 

# BATCH_SIZE: Modelin ağırlıklarını güncellemeden önce aynı anda işleyip belleğe alacağı resim sayısıdır.
# 64 değeri Fine-Tuning (Aşama 2) sırasında GPU belleğine fazla geldiği için (OOM Hatası) 32'ye düşürüldü.
BATCH_SIZE = 32

# IMG_SIZE: Görüntülerin modele verilmeden önce yeniden boyutlandırılacağı (Genişlik, Yükseklik) piksel değerleridir.
# MobileNetV2 modeli, (224, 224) boyutlarındaki görsellerle en iyi ve standart sonucu verecek şekilde tasarlanmıştır.
IMG_SIZE = (224, 224) 

# ==========================================
# 2. VERİ SETİNİ YÜKLEME VE HAZIRLAMA
# ==========================================
print("\n[AŞAMA 1] Veri Seti Yükleniyor ve Eğitim/Doğrulama Gruplarına Ayrılıyor...")

# train_ds: Eğitim (Training) veri setimizdir. Modelin kalıpları öğrenmesi için kullanılacak ana kısımdır.
# validation_split=0.2: Veri setimizin %20'sini modeli eğitirken test etmek (doğrulamak) için ayırıyoruz.
# subset="training": Bu ayrılan verinin %80'lik öğrenme kısmını temsil ettiğini belirtiyoruz.
train_ds = tf.keras.utils.image_dataset_from_directory(
    DATA_DIR,
    validation_split=0.2,
    subset="training",
    seed=123,
    image_size=IMG_SIZE,
    batch_size=BATCH_SIZE
)

# val_ds: Doğrulama (Validation) veri setimizdir. Modelin görmediği veriler üzerindeki başarısını ölçeceğimiz kısımdır.
# Model bu verileri eğitim sırasında kesinlikle ezberleyemez, sadece doğruluk oranını hesaplamak için kullanır.
val_ds = tf.keras.utils.image_dataset_from_directory(
    DATA_DIR,
    validation_split=0.2,
    subset="validation",
    seed=123,
    image_size=IMG_SIZE,
    batch_size=BATCH_SIZE
)

class_names = train_ds.class_names
print(f"\n[BİLGİ] Tespit Edilen Sınıflar ({len(class_names)} Adet Sınıf Bulundu):")
for name in class_names:
    print(f"  --> {name}")

# ==========================================
# PERFORMANS OPTİMİZASYONLARI (DATA PIPELINE)
# ==========================================
print("\n[AŞAMA 2] Veri Seti Performans ve Bellek Optimizasyonları Uygulanıyor...")

# AUTOTUNE: TensorFlow'un sistem kaynaklarına (CPU/RAM) bakarak en uygun Cache ve Prefetch miktarını dinamik belirlemesini sağlar.
AUTOTUNE = tf.data.AUTOTUNE

# .shuffle(): Verileri her Epoch'ta karıştırarak modelin eğitim verilerinin sırasını ezberlemesini (Overfitting) engeller.
# Sessiz kapanma (RAM taşması) hatasını önlemek için buffer_size değerini 1000'e çektik.
train_ds = train_ds.shuffle(buffer_size=1000).prefetch(buffer_size=AUTOTUNE)
val_ds = val_ds.prefetch(buffer_size=AUTOTUNE)

# ==========================================
# 3. TRANSFER LEARNING (TRANSFER ÖĞRENME) VE MİMARİ
# ==========================================
print("\n[AŞAMA 3] Transfer Learning Kullanılarak Model Mimarisi İnşa Ediliyor...")

# preprocess_input: Görüntü piksellerini MobileNetV2'nin önceden eğitildiği dönemdeki sayısal aralığa getirir (Ölçeklendirme/Normalizasyon).
preprocess_input = tf.keras.applications.mobilenet_v2.preprocess_input

# base_model: Önceden milyonlarca resimle (ImageNet) eğitilmiş güçlü bir göze sahip olan MobileNetV2 modelinin temelidir.
# include_top=False: Modelin orijinal, ImageNet için olan 1000 sınıflı son karar verme (sınıflandırma) katmanını almıyoruz. Orayı kendi veri setimiz için biz tasarlayacağız.
base_model = MobileNetV2(input_shape=IMG_SIZE + (3,), include_top=False, weights='imagenet')

# Özellik çıkarıcı olarak kullanacağımız base_model'in daha önceden öğrendiği yetenekleri bozmamak (ağırlıklarının değişmesini önlemek) için eğitilmesini durduruyoruz.
base_model.trainable = False

# Data Augmentation (Veri Artırma) Katmanları
# Modelin aynı resimleri sürekli ezberlemesini önlemek için her turda resimleri hafifçe çevirip, yakınlaştırıp değiştiriyoruz.
data_augmentation = tf.keras.Sequential([
    tf.keras.layers.RandomFlip("horizontal"),
    tf.keras.layers.RandomRotation(0.2),
    tf.keras.layers.RandomZoom(0.2),
])

# Mimari yapılandırma (Model Architecture)
inputs = tf.keras.Input(shape=IMG_SIZE + (3,)) # Modele girecek fotoğraf boyutları (RGB)
x = data_augmentation(inputs) # Önce fotoğrafları hafifçe çarpıtıp esnetiyoruz (Sadece eğitim sırasında çalışır)

# TFLite modeli içindeki gizli "preprocess_input" dönüşümü bazen bozulur.
# Bu yüzden model mimarisinde TFLite UYUMLU DOĞRUDAN Rescaling işlemi yapmıyoruz, RN tarafı halledecek!
# Modelin girişini [-1, 1] arası Float32 bekleyecek şekilde saf bırakıyoruz.
x = base_model(x, training=False) # Görüntüyü ana modele iletiyoruz.

# GlobalAveragePooling2D: Taban modelden çıkan çok boyutlu haritayı tek boyutlu düz bir diziye çevirerek işlem yükünü azaltır.
x = GlobalAveragePooling2D()(x)

# Dense: Yapay sinir ağının bizim veri setimize özel detayları öğrenmesini sağlayan gizli katmandır. 
x = Dense(256, activation='relu')(x) # Nöron sayısı 128'den 256'ya artırıldı!

# Dropout: Nöronların %40'ını rastgele kapatarak modelin 'Arka Plan' gibi gereksiz detayları ezberlemesini (Overfitting) engeller.
x = tf.keras.layers.Dropout(0.4)(x)

# outputs: Modelimizin en sonki çıktı, yani karar katmanıdır. Kaç tane sınıfımız varsa (örneğin 10 atık türü) o kadar çıktı verir.
# 'softmax' fonksiyonu, sonuçları 0 ile 1 arasında olasılıklara böler. Hangi sınıfın olasılığı en yüksekse modelin tahmini o olur.
outputs = Dense(len(class_names), activation='softmax')(x)

# Giriş ve çıkışları bağlayarak nihai modelimizi oluşturuyoruz.
model = Model(inputs, outputs)

# ==========================================
# 4. MODELİ DERLEME VE 2 AŞAMALI EĞİTİM (FINE-TUNING)
# ==========================================
print("\n[AŞAMA 4] Model Başlangıç Eğitimi İçin Derleniyor...")

# 1. AŞAMA: Sadece yeni eklediğimiz "Baş" Kısmını eğitiyoruz. 
# Learning Rate'i biraz yüksek (0.001) tutuyoruz.
model.compile(optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
              loss='sparse_categorical_crossentropy',
              metrics=['accuracy'])

print("\n[AŞAMA 5] Adım 1: Sadece Sınıflandırma Katmanı Eğitiliyor (3 Epoch)...")
history_head = model.fit(
    train_ds,
    validation_data=val_ds,
    epochs=3
)

# 2. AŞAMA: FINE-TUNING (Modelin beynini çözüyoruz)
print("\n[AŞAMA 5] Adım 2: Fine-Tuning Başlatılıyor (Tüm model eğitiliyor)...")
# MobileNetV2'nin önceden öğrendiği ağırlıkları serbest bırakıyoruz
base_model.trainable = True

# Çok düşük learning rate (0.00001) kullanarak, ImageNet'ten gelen o devasa bilgileri
# tamamen silmeden "hassas" bir şekilde bizim atıklara uyarlıyoruz.
model.compile(optimizer=tf.keras.optimizers.Adam(learning_rate=0.00001),
              loss='sparse_categorical_crossentropy',
              metrics=['accuracy'])

# 40 bin görsel gibi devasa veri için 7 epoch Fine-Tuning harika bir "ezber bozdurucudur"
history_fine = model.fit(
    train_ds,
    validation_data=val_ds,
    epochs=7
)

# ==========================================
# 5. EĞİTİLEN MODELİ KAYDETME
# ==========================================
print("\n[AŞAMA 6] Eğitim Başarıyla Tamamlandı. Model Disk Üzerine Kaydediliyor...")
kayit_yolu = "mobil_atik_tanima_modeli"
model.save(kayit_yolu)
print(f"\n[BAŞARILI] İşlem Sonucu: Eğitilmiş modeliniz '{kayit_yolu}' dizinine başarıyla kaydedildi!")