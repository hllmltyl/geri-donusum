import os
import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D
from tensorflow.keras.models import Model

# --- 1. DOSYA YOLU VE EĞİTİM PARAMETRELERİ ---
DATA_DIR = r"D:\Dosyalar\Mobil\Datasets" 
BATCH_SIZE = 64  # Bellek yetersizliği (OOM) durumunda 32'ye düşürülebilir.
IMG_SIZE = (224, 224) 

# --- 2. VERİ YÜKLEME ---
print("\nVeri seti yükleniyor...")

train_ds = tf.keras.utils.image_dataset_from_directory(
    DATA_DIR,
    validation_split=0.2,
    subset="training",
    seed=123,
    image_size=IMG_SIZE,
    batch_size=BATCH_SIZE
)

val_ds = tf.keras.utils.image_dataset_from_directory(
    DATA_DIR,
    validation_split=0.2,
    subset="validation",
    seed=123,
    image_size=IMG_SIZE,
    batch_size=BATCH_SIZE
)

class_names = train_ds.class_names
print(f"\nTanımlanan Atık Sınıfları ({len(class_names)} Adet):")
for name in class_names:
    print(f"  - {name}")

# --- PERFORMANS AYARLARI ---
# .cache(): Verileri RAM'e alarak disk erişimini minimize eder ve eğitimi hızlandırır.
# .shuffle(): Veri setini karıştırarak modelin genelleme yeteneğini artırır.
# .prefetch(): GPU işlem yaparken CPU'nun sonraki paketi hazırlamasını sağlar.
# Not: Bellek hatası (Memory Error) durumunda .cache() fonksiyonu kaldırılmalıdır.

AUTOTUNE = tf.data.AUTOTUNE
train_ds = train_ds.cache().shuffle(buffer_size=1000).prefetch(buffer_size=AUTOTUNE)
val_ds = val_ds.cache().prefetch(buffer_size=AUTOTUNE)

# --- 3. MODEL MİMARİSİ ---
print("\nModel oluşturuluyor...")

# MobileNetV2 girişi için normalizasyon katmanı
preprocess_input = tf.keras.applications.mobilenet_v2.preprocess_input

# Önceden eğitilmiş temel model (ImageNet ağırlıklarıyla)
base_model = MobileNetV2(input_shape=IMG_SIZE + (3,), include_top=False, weights='imagenet')
base_model.trainable = False

# Mimari yapılandırma
inputs = tf.keras.Input(shape=IMG_SIZE + (3,))
x = preprocess_input(inputs)
x = base_model(x, training=False)
x = GlobalAveragePooling2D()(x)
x = Dense(128, activation='relu')(x)
outputs = Dense(len(class_names), activation='softmax')(x)

model = Model(inputs, outputs)

# --- 4. DERLEME VE EĞİTİM ---
model.compile(optimizer=tf.keras.optimizers.Adam(learning_rate=0.0001),
              loss='sparse_categorical_crossentropy',
              metrics=['accuracy'])

print("\nModel eğitimi başlatılıyor...")
history = model.fit(
    train_ds,
    validation_data=val_ds,
    epochs=10
)

# --- 5. MODELİ KAYDETME ---
kayit_yolu = "mobil_atik_tanima_modeli"
model.save(kayit_yolu)
print(f"\nEğitim tamamlandı. Model '{kayit_yolu}' dizinine kaydedildi.")