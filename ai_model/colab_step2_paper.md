# Google Colab - Aşama 1.2: Plastik + Kağıt Modeli (Curriculum Learning)

Tebrikler, modelimiz artık plastiği tanıyor! İkinci aşamaya geçiyoruz: **Kağıt**.
Modelin plastiği unutmasını engellemek için (**Catastrophic Forgetting**) eski modelimizi Kağıt ve Plastik ağırlıklı yeni karmayla eğiteceğiz.

> **ÖNEMLİ:** Bu kodu, bir önceki Aşama 1.1'i çalıştırdığın **AYNI Google Colab Notebook'unda, kodların en altına yeni bir kod hücresi (code cell) açarak** çalıştır. 
> Böylece bir önceki aşamadan gelen eğitilmiş `model` değişkeni havızada duruyor olacak ve biz onun üzerine inşa edeceğiz.

## 1. Yeni Veri Seti Karması (Mix) Hazırlama
Aşağıdaki kodu yeni hücreye yapıştır:

```python
import os
import shutil
import random

target_dir_step2 = 'curriculum_dataset/step2'

os.makedirs(f'{target_dir_step2}/plastik', exist_ok=True)
os.makedirs(f'{target_dir_step2}/kagit', exist_ok=True)
os.makedirs(f'{target_dir_step2}/diger', exist_ok=True)

plastic_dir, paper_dir = None, None
diger_dirs = []

# Klasörleri bul
for root, dirs, files in os.walk('dataset'):
    for d in dirs:
        if d.lower() == 'plastic': plastic_dir = os.path.join(root, d)
        elif d.lower() == 'paper': paper_dir = os.path.join(root, d)
        elif len(os.listdir(os.path.join(root, d))) > 100:
            diger_dirs.append(os.path.join(root, d))

# 1. Bütün kağıtları alıyoruz (Yeni odak noktamız)
paper_images = os.listdir(paper_dir)
for img in paper_images:
    shutil.copy(os.path.join(paper_dir, img), os.path.join(f'{target_dir_step2}/kagit', img))

# 2. Plastik bilgisini canlı tutmak için, Kağıt sayısının %40'ı kadar (70-30 dengesi) geçmiş plastik bilgisini ekliyoruz
plastic_images = os.listdir(plastic_dir)
sample_plastic_count = int(len(paper_images) * (30/70))
sample_plastic = random.sample(plastic_images, min(sample_plastic_count, len(plastic_images)))
for img in sample_plastic:
    shutil.copy(os.path.join(plastic_dir, img), os.path.join(f'{target_dir_step2}/plastik', img))

# 3. Modelin dünyayı sadece Kağıt ve Plastik'ten ibaret sanmaması için, diğer atıklardan %5'lik minik bir 'çöp kutusu'
for d in  diger_dirs:
    d_images = os.listdir(d)
    sample_d = random.sample(d_images, int(len(d_images) * 0.05))
    for img in sample_d:
        shutil.copy(os.path.join(d, img), os.path.join(f'{target_dir_step2}/diger', f"{os.path.basename(d)}_{img}"))

print("Step 2 (Kağıt+Plastik Mix) Veri Seti Hazır!")
print(f"Kağıt Görsel Sayısı: {len(os.listdir(target_dir_step2 + '/kagit'))}")
print(f"Plastik Görsel Sayısı: {len(os.listdir(target_dir_step2 + '/plastik'))}")
print(f"Diğer Görsel Sayısı: {len(os.listdir(target_dir_step2 + '/diger'))}")
```

## 2. Kademeli Öğrenme (Model Head Replacement) ve Eğitim
Bir önceki aşamada ürettiğimiz model "2 Sınıf" çıktısı veriyordu. Şimdi Kağıt eklendiği için çıktı sayısı "3 Sınıf" oldu. 
Bu yüzden modelimizin "göz zekası"nı koruyup, sadece "karar merciine" (sınıflandırma katmanına) format atmamız gerekiyor.

```python
from tensorflow.keras.layers import Dense
from tensorflow.keras.models import Model
import tensorflow as tf

# Yeni Veri Sınıflarını Oku (Data Generator 2)
train_generator_step2 = datagen.flow_from_directory(
    target_dir_step2, target_size=(IMG_SIZE, IMG_SIZE), batch_size=BATCH_SIZE, class_mode='categorical', subset='training'
)
val_generator_step2 = datagen.flow_from_directory(
    target_dir_step2, target_size=(IMG_SIZE, IMG_SIZE), batch_size=BATCH_SIZE, class_mode='categorical', subset='validation'
)

# --- Katastrofik Unutmayı Önleme Hulesi (Transfer Learning on Transfer Learning) ---
# Mevcut 'model' değişkenindeki en son `Dense` sınıflandırıcıyı atıyoruz.
# Sondan 2. katman olan GlobalAveragePooling2D katmanını bulup alıyoruz
x = model.layers[-2].output

# YENİ 3 sınıflı karar katmanını (head) takıyoruz
predictions_step2 = Dense(train_generator_step2.num_classes, activation='softmax')(x)

# Modeli baştan paketliyoruz (Gözler eski tecrübeli, karar mekanizması yeni 3 sınıflı)
model_step2 = Model(inputs=model.input, outputs=predictions_step2)

# Eski ağırlıkları dondurup, önce sadece bu yeni "karar mekanizmasını" eğiteceğiz
for layer in model_step2.layers[:-1]:
    layer.trainable = False

model_step2.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])

print(">> Adım 1: Sadece Yeni Karar Katmanını Eğitme Başlıyor...")
model_step2.fit(train_generator_step2, validation_data=val_generator_step2, epochs=5)

# Şimdi modelin kilidini açıp çok kısık bir öğrenme oranıyla komple sistemi Kağıt için ince ayar (Fine-Tuning) yapalım
base_model.trainable = True # En baştaki gözü de yavaşça eğitime dahil et
model_step2.compile(optimizer=tf.keras.optimizers.Adam(1e-5), loss='categorical_crossentropy', metrics=['accuracy'])

print(">> Adım 2: Dev İnce Ayar (Fine-Tuning) Başlıyor...")
model_step2.fit(train_generator_step2, validation_data=val_generator_step2, epochs=5)

# --- TFLite'a Dönüştür (model_v2) ---
labels_step2 = '\n'.join(sorted(train_generator_step2.class_indices.keys()))
with open('labels_v2.txt', 'w') as f: f.write(labels_step2)
print("Sınıflar:", labels_step2)

converter = tf.lite.TFLiteConverter.from_keras_model(model_step2)
converter.optimizations = [tf.lite.Optimize.DEFAULT]
tflite_model_v2 = converter.convert()

with open('model_v2_plastik_kagit.tflite', 'wb') as f: f.write(tflite_model_v2)
    
print("Muazzam! 'model_v2_plastik_kagit.tflite' modeli hazır, indirebilirsin.")
```

**Bu kodu çalıştırıp V2 (versiyon 2) modelini indirdikten sonra bana haber ver!** Artık mobil uygulamaya entegrasyon zamanı!
