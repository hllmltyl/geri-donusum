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

## 2. Veri Setini Hazırlama: Kaggle + Kendi Verilerin
```python
# 1. Önce Kaggle'daki genel veri setini indiriyoruz (Diğer kategorileri -kağıt, metal- almak için)
!kaggle datasets download -d mostafaabla/garbage-classification
!unzip -q garbage-classification.zip -d dataset/

# 2. Şimdi Kendi oluşturduğun 'plastic.zip' dosyasını Colab'a yüklüyoruz
from google.colab import files
print("Lütfen hazırladığın 'plastic.zip' dosyasını seç:")
uploaded = files.upload()

# 3. Kaggle'daki plastikleri silip, seninkileri yerine koyuyoruz
import os
for root, dirs, files_in_dir in os.walk('dataset'):
    if 'plastic' in [d.lower() for d in dirs]:
        p_path = os.path.join(root, 'plastic')
        !rm -rf "{p_path}" # Eski plastikleri sil
        !mkdir -p "{p_path}" # Boş klasör oluştur
        # -j flagı ile zip içindeki klasör yapısını görmezden gelip sadece dosyaları oraya çıkartır
        !unzip -j -q plastic.zip -d "{p_path}" 
        print(f"İşlem Tamam: Kendi plastiklerin {p_path} klasörüne başarıyla yerleştirildi.")
        break
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

# Önce sınıflar arası dengeyi (class balance) sağlamak için plastik sayısını bulalım
plastic_path = os.path.join(source_dir, 'plastic')
plastic_count = len(os.listdir(plastic_path)) if os.path.exists(plastic_path) else 100
# 5 adet "diğer" kategorisi olduğu için dengeli dağılım hesapla
diger_limit_per_category = max(10, plastic_count // 5)

for category in os.listdir(source_dir):
    cat_path = os.path.join(source_dir, category)
    if not os.path.isdir(cat_path): continue
    
    images = os.listdir(cat_path)
    
    if category.lower() == 'plastic':
        # Bütün plastikleri al
        for img in images:
            shutil.copy(os.path.join(cat_path, img), os.path.join(f'{target_dir}/plastik', img))
    else:
        # OPTİMİZASYON: Veri Dengesizliğini Önleme (Class Imbalance)
        # Sadece %10 almak yerine, plastik sayısına eşdeğer miktarda toplam "diğer" görsel alıyoruz
        num_to_sample = min(len(images), diger_limit_per_category)
        sample_images = random.sample(images, num_to_sample)
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
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.models import Model
from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau

# --- Hyperparametreler (Eğitim Kuralları) ---
IMG_SIZE = 224 # MobileNetV2 varsayılan olarak 224x224 kare boyutunda fotoğraflar kabul eder.
BATCH_SIZE = 32 # Model her eğitim adımında 32 fotoğrafı aynı anda işleyerek ağırlıklarını günceller.
MAX_EPOCHS = 20 # Early Stopping eklendiği için maksimum tur sayısını artırabiliriz.

# --- Veri Artırımı (Data Augmentation) ve Ön İşleme ---
# MobileNetV2 piksellerin -1 ile 1 arasında olmasını bekler, bu yüzden rescale yerine preprocess_input kullanıyoruz.
# EĞİTİM Jeneratörü (Artırmalar SADECE burada var)
train_datagen = ImageDataGenerator(
    preprocessing_function=preprocess_input,
    validation_split=0.2, # Verinin %80'i eğitim (öğrenme), %20'si ise test (sınav) için ayrılır.
    rotation_range=30, # Açıyı biraz artırdık
    width_shift_range=0.2, 
    height_shift_range=0.2, 
    shear_range=0.15, # OPTİMİZASYON: Yamultma eklendi (farklı açılardan çekilmiş gibi)
    zoom_range=0.2, # OPTİMİZASYON: Yakınlaştırma/Uzaklaştırma eklendi
    horizontal_flip=True,
    fill_mode="nearest"
)

# SINAV Jeneratörü (Artırma YOK, Sadece Ön İşleme)
# Doğrulama (sınav) verileri eğilip bükülmez, ancak aynı matematiksel ölçekleme (preprocess_input) onlara da uygulanır.
val_datagen = ImageDataGenerator(
    preprocessing_function=preprocess_input,
    validation_split=0.2
)

# Eğitim (Antrenman) Veri Jeneratörü
train_generator = train_datagen.flow_from_directory(
    target_dir,
    target_size=(IMG_SIZE, IMG_SIZE), # Tüm fotoğraflar KESİLMEDEN zorla 224x224 boyutuna (Sıkıştırılarak/Bilineer) yeniden boyutlandırılır.
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='training' # Sınav değil, ders çalışma materyali
)

# Doğrulama (Sınav) Veri Jeneratörü (Artırımlar doğrulama setine de uygulanır)
val_generator = val_datagen.flow_from_directory(
    target_dir,
    target_size=(IMG_SIZE, IMG_SIZE), # Boyut yine 224x224
    batch_size=BATCH_SIZE,
    class_mode='categorical',
    subset='validation', # Modelin ders sonrası teste tabi tutulacağı materyal
    shuffle=False # Sınav verisinin sırasını karıştırmamak metrikleri daha stabil takip etmeyi sağlar
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
x = Dropout(0.3)(x) # OPTİMİZASYON: Fazla ezberlemeyi (overfitting) önlemek için nöronların %30'unu rastgele kapatarak eğitiyoruz.
predictions = Dense(train_generator.num_classes, activation='softmax')(x) # Çıkış katmanı: Softmax, sonucu "0.99 Diğer, 0.01 Plastik" gibi yüzdelik/olasılık oranlarına böler.

# Modeli İnşa Et
model = Model(inputs=base_model.input, outputs=predictions)

# Modeli Derle (Kayıp ve Başarı Hesaplayıcıları bağla)
model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])

# OPTİMİZASYON: Callbacks (Erken Durdurma ve Öğrenme Oranını Düşürme)
# Modelin başarı oranı artmayı durdurursa (overfitting başlarsa) eğitimi erken kesecek.
early_stop = EarlyStopping(monitor='val_loss', patience=3, restore_best_weights=True, verbose=1)
# Model takıldığında öğrenme esnekliğini (learning rate) yarıya indirecek.
reduce_lr = ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=2, min_lr=1e-6, verbose=1)

# --- 1. Aşama Eğitim (Transfer Learning) ---
print("Eğitim Başlıyor... (Sadece en dıştaki karar katmanı eğitiliyor)")
history = model.fit(
    train_generator,
    validation_data=val_generator,
    epochs=MAX_EPOCHS,
    callbacks=[early_stop, reduce_lr]
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
    epochs=10, # 10 Tur limit (Erken durdurma ile daha önce de bitebilir)
    callbacks=[early_stop]
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
