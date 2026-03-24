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
Mobil cihazlarda gerçek zamanlı kamera ile çalışabilmesi için **MobileNetV2** (çok hızlı, hafif ve mobilde verimli çalışması için Google tarafından tasarlanmış bir yapay sinir ağı) kullanacağız.

```python
import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D
from tensorflow.keras.models import Model

# --- Hyperparametreler (Eğitim Kuralları) ---
IMG_SIZE = 224 # MobileNetV2 varsayılan olarak 224x224 kare boyutunda fotoğraflar kabul eder.
BATCH_SIZE = 32 # Model her eğitim adımında 32 fotoğrafı aynı anda işleyerek ağırlıklarını günceller.
EPOCHS = 10 # Tüm veri seti yapay zekaya 10 tur (epoch) gösterilecektir.

# --- Veri Artırımı (Data Augmentation) ve Ön İşleme ---
# Gerçek hayatta kullanıcılar her zaman mükemmel fotoğraf çekmez (açı, yön farklı olur).
# Yapay zekanın ezberlemesini önlemek için fotoğraflara eğitim esnasında rastgele bozulmalar (artırımlar) ekleriz.
datagen = ImageDataGenerator(
    rescale=1./255, # KRİTİK: Piksel renk değerlerini 0-255 arasından 0-1 (Ondalık) aralığına sıkıştırarak makinenin öğrenmesini kolaylaştırır.
    validation_split=0.2, # Verinin %80'i eğitim (öğrenme), %20'si ise test (sınav) için ayrılır.
    rotation_range=20, # Rastgele 20 dereceye kadar sağa/sola döndür
    width_shift_range=0.2, # Resmi rastgele %20 sağa/sola kaydır
    height_shift_range=0.2, # Resmi rastgele %20 yukarı/aşağı kaydır
    horizontal_flip=True # Görüntüyü rastgele yatay eksende (ayna görüntüsü gibi) ters çevir
)

# Eğitim (Antrenman) Veri Jeneratörü
train_generator = datagen.flow_from_directory(
    target_dir,
    target_size=(IMG_SIZE, IMG_SIZE), # Tüm fotoğraflar KESİLMEDEN zorla 224x224 boyutuna (Sıkıştırılarak/Bilineer) yeniden boyutlandırılır.
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='training' # Sınav değil, ders çalışma materyali
)

# Doğrulama (Sınav) Veri Jeneratörü (Artırımlar doğrulama setine de uygulanır)
val_generator = datagen.flow_from_directory(
    target_dir,
    target_size=(IMG_SIZE, IMG_SIZE), # Boyut yine 224x224
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='validation' # Modelin ders sonrası teste tabi tutulacağı "Görmediği" %20'lik materyal
)

# --- Transfer Learning (Öğrenme Transferi) ---
# ImageNet isimli milyarlarca görselle eğitilmiş ve şekil, çizgi, gölge algısı olan "Ana Modeli" indiriyoruz.
# include_top=False: Son karar mekanizmasını (Bu köpek, şu araba diyen kısmını) iptal ediyoruz. Biz kendi karar (Plastik/Diğer) mekanizmamızı koyacağız.
base_model = MobileNetV2(weights='imagenet', include_top=False, input_shape=(IMG_SIZE, IMG_SIZE, 3))

# İlk aşamada google'ın milyarlarca fotoğrafta eğittiği görme yeteneği (ağırlıklar) bozulmasın diye tabanı donduruyoruz.
base_model.trainable = False

# --- Kendi Zihnimizi (Karar Katmanlarını) Ekleyelim ---
x = base_model.output
x = GlobalAveragePooling2D()(x) # Görüntüden alınan karmaşık haritayı (örneğin 7x7 boyutlarındaki algıları) tek bir 1-Boyutlu özete sıkıştırır.
x = Dense(128, activation='relu')(x) # 128 Nöronluk bir beyin zarı ekliyoruz. Relu: Sinyalleri filtreleyen (eksi değerleri sıfırlayan) bir fonksiyondur.
predictions = Dense(train_generator.num_classes, activation='softmax')(x) # Çıkış katmanı: Softmax, sonucu "0.99 Diğer, 0.01 Plastik" gibi yüzdelik/olasılık oranlarına böler.

# Modeli İnşa Et
model = Model(inputs=base_model.input, outputs=predictions)

# Modeli Derle (Kayıp ve Başarı Hesaplayıcıları bağla)
model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])

# --- 1. Aşama Eğitim (Transfer Learning) ---
print("Eğitim Başlıyor... (Sadece en dıştaki karar katmanı eğitiliyor)")
history = model.fit(
    train_generator,
    validation_data=val_generator,
    epochs=EPOCHS # 10 Tur
)

# --- 2. Aşama İnce Ayar (Fine-Tuning) ---
# Artık model neyin plastik olduğuna dış katmanda karar vermeye alıştı. 
# ŞİMDİ ana beynin de (ilk donmuş katmanlar) bizim plastik veri setimize göre biraz esnemesine (öğrenmesine) izin veriyoruz.
base_model.trainable = True
for layer in base_model.layers[:100]:
    layer.trainable = False # Beynin en temel kısımlarını (ilk 100 katman - düz çizgileri, gölgeleri algılayan kısım) koruyoruz, bozulmalarını istemiyoruz.

# Çok DÜŞÜK bir öğrenme oranı (1e-5) ile yeniden derliyoruz ki model elindeki doğru bilgileri kaba bir şekilde aniden unutmasın (Catastrophic Forgetting olmasın).
model.compile(optimizer=tf.keras.optimizers.Adam(1e-5), loss='categorical_crossentropy', metrics=['accuracy'])
print("\nGelişmiş Eğitim (İnce Ayar) Başlıyor...")
history_fine = model.fit(
    train_generator,
    validation_data=val_generator,
    epochs=5 # 5 Tur daha yavaşça eğit
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
