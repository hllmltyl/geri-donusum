# Google Colab - Aşama 1.1: Plastik Sınıflandırma Modeli

Bu eğitim betiğini Google Colab'da boş bir notebook açarak kopyalayıp çalıştırabilirsin. 
Bu betik, Kaggle'dan "Garbage Classification" veri setini indirecek ve **Curriculum Learning**'in ilk aşaması olarak **Sadece Plastik** nesnelerini tanımak üzerine eğitecektir. 
*(Not: Yapay zekanın "Plastiği" tanıyabilmesi için "Plastik olmayan" şeyleri de görmesi gerekir. Bu yüzden sadece 2 kategori (Plastik ve Diğerleri) ile başlayacağız.)*

## 1. Hazırlık: Kaggle API Anahtarını Yükleme
Önce Colab'da bir hücre açıp bunu çalıştır:

```python
!pip install -q kaggle

# Kaggle'dan indirdiğin kaggle.json dosyasını Colab'a yükle
from google.colab import files
files.upload() 

# Kaggle klasörünü ayarla
!mkdir -p ~/.kaggle
!cp kaggle.json ~/.kaggle/
!chmod 600 ~/.kaggle/kaggle.json
```

## 2. Veri Setini İndirme
```python
# Veri setini indiriyoruz
!kaggle datasets download -d mostafaabla/garbage-classification
!unzip -q garbage-classification.zip -d dataset/
```

## 3. Curriculum Learning - Sadece Plastik (ve Diğerleri) Veri Seti Hazırlama
Plastik dışındaki her şeyi şimdilik "diger" klasörüne toplayacağız.

```python
import os
import shutil
import random

target_dir = 'curriculum_dataset/step1'

# Klasörleri oluştur
os.makedirs(f'{target_dir}/plastik', exist_ok=True)
os.makedirs(f'{target_dir}/diger', exist_ok=True)

# Otomatik olarak 'plastic' klasörünün olduğu ana dizini bul
source_dir = None
for root, dirs, files in os.walk('dataset'):
    if any(d.lower() == 'plastic' for d in dirs):
        source_dir = root
        break

if not source_dir:
    raise Exception("Hata: 'plastic' klasörü bulunamadı. Lütfen dataset/ dizinini kontrol et.")
    
print(f"Veri seti dizini bulundu: {source_dir}")

for category in os.listdir(source_dir):
    cat_path = os.path.join(source_dir, category)
    if not os.path.isdir(cat_path): continue
    
    images = os.listdir(cat_path)
    
    if category.lower() == 'plastic':
        # Bütün plastikleri al
        for img in images:
            shutil.copy(os.path.join(cat_path, img), os.path.join(f'{target_dir}/plastik', img))
    else:
        # Diğerlerinden sadece %10 kadar örnek seç (Catastrophic forgetting için temel)
        sample_images = random.sample(images, int(len(images) * 0.1))
        for img in sample_images:
            shutil.copy(os.path.join(cat_path, img), os.path.join(f'{target_dir}/diger', f'{category}_{img}'))

print("Veri seti Step 1 için hazırlandı!")
print(f"Plastik Görsel Sayısı: {len(os.listdir(target_dir + '/plastik'))}")
print(f"Diğer Görsel Sayısı: {len(os.listdir(target_dir + '/diger'))}")
```

## 4. Modelin Eğitimi (MobileNetV2)
Mobil cihazlarda gerçek zamanlı kamera ile çalışabilmesi için **MobileNetV2** (çok hızlı ve hafif) kullanacağız.

```python
import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D
from tensorflow.keras.models import Model

# Hyperparametreler
IMG_SIZE = 224
BATCH_SIZE = 32
EPOCHS = 10

# Veri Artırımı (Data Augmentation)
datagen = ImageDataGenerator(
    rescale=1./255,
    validation_split=0.2, # %20'si test için
    rotation_range=20,
    width_shift_range=0.2,
    height_shift_range=0.2,
    horizontal_flip=True
)

train_generator = datagen.flow_from_directory(
    target_dir,
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='training'
)

val_generator = datagen.flow_from_directory(
    target_dir,
    target_size=(IMG_SIZE, IMG_SIZE),
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='validation'
)

# MobileNetV2 Yükle (Üst katmanı hariç tut)
base_model = MobileNetV2(weights='imagenet', include_top=False, input_shape=(IMG_SIZE, IMG_SIZE, 3))

# Fine-tuning için ilk aşamada base modeli dondur
base_model.trainable = False

# Kendi sınıflandırıcı katmanlarımızı ekleyelim
x = base_model.output
x = GlobalAveragePooling2D()(x)
x = Dense(128, activation='relu')(x)
predictions = Dense(train_generator.num_classes, activation='softmax')(x)

model = Model(inputs=base_model.input, outputs=predictions)

model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])

# Eğitimi Başlat
print("Eğitim Başlıyor...")
history = model.fit(
    train_generator,
    validation_data=val_generator,
    epochs=EPOCHS
)

# İnce Ayar (Fine-Tuning) - Modelin sadece son kısmını eğittik, şimdi biraz daha derine inelim
base_model.trainable = True
for layer in base_model.layers[:100]:
    layer.trainable = False # İlk 100 katman donuk kalsın

model.compile(optimizer=tf.keras.optimizers.Adam(1e-5), loss='categorical_crossentropy', metrics=['accuracy'])
history_fine = model.fit(
    train_generator,
    validation_data=val_generator,
    epochs=5
)
```

## 5. TFLite Formatına Dönüştürme
Bu aşama, modeli Expo/React Native mobil uygulaman içine almanı sağlayacaktır.

```python
# Sınıf isimlerini kaydet
labels = '\n'.join(sorted(train_generator.class_indices.keys()))
with open('labels.txt', 'w') as f:
    f.write(labels)
print(labels)

# TFLite'a dönüştür
converter = tf.lite.TFLiteConverter.from_keras_model(model)
# Optimizasyon (boyutu küçültür)
converter.optimizations = [tf.lite.Optimize.DEFAULT]
tflite_model = converter.convert()

with open('model_v1_plastik.tflite', 'wb') as f:
    f.write(tflite_model)
    
print("Hazır! Sol taraftaki dosya menüsünden 'model_v1_plastik.tflite' ve 'labels.txt' dosyalarını bilgisayarına indir.")
```

**Bu kodu çalıştırdıktan ve TFLite dosyasını indirdikten sonra bana haber ver! Aşama 2'ye (Mobil entegrasyon) geçeceğiz.**
