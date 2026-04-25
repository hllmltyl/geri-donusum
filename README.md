# ♻️ Geri Dönüşüm Mobil Uygulaması

Bu proje, **React Native** ve **Expo** kullanılarak geliştirilmiş, çevre bilincini artırmayı ve geri dönüşümü kolaylaştırmayı hedefleyen açık kaynaklı bir mobil uygulamadır. 

Kullanıcılar, yapay zeka (TFLite) destekli kamera özelliği sayesinde atık türlerini (Cam, Metal, Kağıt, Plastik) anlık olarak sınıflandırabilir ve harita özelliği üzerinden kendilerine en yakın geri dönüşüm noktalarını kolayca bulabilirler.

## ✨ Temel Özellikler

* **🤖 Yapay Zeka ile Atık Sınıflandırma (AI):** Telefonunuzun kamerasını kullanarak atıkların türünü gerçek zamanlı olarak tespit edin. (Keras ve TensorFlow Lite kullanılarak eğitilmiş modeller ile güçlendirilmiştir)
* **🗺️ Geri Dönüşüm Noktaları Haritası:** Cihazınızın konum servisini (GPS) kullanarak çevrenizdeki geri dönüşüm kutularını ve tesislerini harita üzerinde detaylarıyla görüntüleyin.
* **☁️ Bulut Tabanlı Veri:** Firebase Firestore entegrasyonu sayesinde harita verileri ve diğer içerikler hızlı, güvenilir ve anlık olarak güncellenir.
* **📱 Çapraz Platform:** iOS ve Android cihazlarda sorunsuz bir şekilde çalışır.

## 🛠️ Kullanılan Teknolojiler

* **Frontend:** React Native, Expo, React Navigation (Expo Router)
* **Backend & Veritabanı:** Firebase (Firestore)
* **Makine Öğrenmesi (ML):** TensorFlow Lite (`react-native-fast-tflite`), Keras (MobileNetV2 vb. modellerin entegrasyonu)
* **Harita & Konum:** `react-native-maps`, `expo-location`

## 🚀 Kurulum ve Çalıştırma

Projeyi yerel geliştirme ortamınızda çalıştırmak için aşağıdaki adımları izleyebilirsiniz.

### Ön Koşullar
* [Node.js](https://nodejs.org/) (v18 veya üzeri önerilir)
* `npm` veya `yarn`
* Fiziksel cihazda test için [Expo Go](https://expo.dev/go) uygulaması

### Adımlar

1. **Projeyi Klonlayın:**
   ```bash
   git clone <repository-url>
   cd geri-donusum
   ```

2. **Bağımlılıkları Yükleyin:**
   ```bash
   npm install
   ```

3. **Çevre Değişkenlerini (Environment Variables) Ayarlayın:**
   * Proje kök dizinindeki `.env` dosyasını kendi Firebase yapılandırmalarınızla düzenleyin (Firestore bağlantıları için gereklidir).

4. **Uygulamayı Başlatın:**
   ```bash
   npx expo start
   ```

5. **Test Edin:**
   * Terminalde çıkan **QR kodu**, iOS için Kamera uygulamanızla, Android için ise **Expo Go** uygulaması ile okutarak projeyi telefonunuzda çalıştırabilirsiniz.
   * Alternatif olarak terminal üzerinden `a` (Android Emulator) veya `i` (iOS Simulator) tuşlarına basarak sanal cihazlarda test edebilirsiniz.

## 📸 Ekran Görüntüleri

*(Projenin ekran görüntülerini buraya ekleyebilirsiniz)*

| 📸 Atık Tarama (AI Sınıflandırma) | 🗺️ Harita Görünümü |
|:---:|:---:|
| <!-- <img src="docs/scan.png" width="250" /> --> <br> *Kamera ile atık tespiti* | <!-- <img src="docs/map.png" width="250" /> --> <br> *Yakındaki noktalar* |

## 🤝 Katkıda Bulunma

Projeye katkıda bulunmak isterseniz "Pull Request" açabilir veya eksiklikler/hatalar için "Issue" oluşturabilirsiniz.

1. Bu depoyu Fork'layın
2. Yeni bir özellik dalı (branch) oluşturun: `git checkout -b feature/YeniOzellik`
3. Değişikliklerinizi Commit'leyin: `git commit -m 'feat: Yeni özellik eklendi'`
4. Dalınızı (branch) gönderin: `git push origin feature/YeniOzellik`
5. Bir Pull Request açın!

## 📄 Lisans

Bu proje **MIT Lisansı** altında lisanslanmıştır. Detaylar için dosyayı inceleyebilirsiniz.
