import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import * as tf from '@tensorflow/tfjs';
import { decodeJpeg } from '@tensorflow/tfjs-react-native';
import { Buffer } from 'buffer';
import { Asset } from 'expo-asset';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTensorflowModel } from 'react-native-fast-tflite';

const { width } = Dimensions.get('window');

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isReady, setIsReady] = useState(false);
  const [prediction, setPrediction] = useState('Tara');
  const [isProcessing, setIsProcessing] = useState(false);
  const [labels, setLabels] = useState<string[]>([]);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);

  const primaryColor = useThemeColor({}, 'primary');

  // Model yükleme hook'u
  const { state: modelState, model } = useTensorflowModel(require('../../assets/models/model_v1_plastik.tflite'));

  useEffect(() => {
    async function prepare() {
      try {
        await tf.ready();
        const asset = Asset.fromModule(require('../../assets/models/labels.txt'));
        await asset.downloadAsync();
        if (asset.localUri) {
          const text = await FileSystem.readAsStringAsync(asset.localUri);
          const loadedLabels = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
          setLabels(loadedLabels);
        }
        setIsReady(true);
      } catch (error) {
        console.warn("TensorFlow veya Etiketler yüklenirken hata oluştu:", error);
        setIsReady(true);
      }
    }

    if (modelState === 'loaded' || modelState === 'error') {
      prepare();
    }
  }, [modelState]);

  const captureAndAnalyze = async () => {
    if (!cameraRef.current || isProcessing || !model || labels.length === 0) {
      if (!model) setPrediction("Model yüklenemedi");
      else if (labels.length === 0) setPrediction("Etiketler yüklenemedi");
      return;
    }

    try {
      setIsProcessing(true);
      setPrediction("Analiz ediliyor...");

      // İlk aşamada fotoğrafı sadece uri olarak çekelim (hızlı olması için base64'ü manipulator'de alacağız)
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.5 });

      if (!photo?.uri) {
        setPrediction("Fotoğraf alınamadı");
        return;
      }

      setCapturedImage(photo.uri);

      // --- EXIF ROTASYON DÜZELTMESİ ---
      // expo-camera, yatay piksellerin yanına "Bu resim 90 derece döndürüldü" diye bir EXIF etiketi yapıştırır.
      // TensorFlow (decodeJpeg) EXIF etiketini okuyamaz, bu yüzden resmi "yan yatmış ve ezilmiş" olarak görürdü.
      // ImageManipulator ile resmi fiziksel olarak dik konuma çevirip o şekilde Base64'e dönüştürüyoruz.
      const manipResult = await ImageManipulator.manipulateAsync(
        photo.uri,
        [], // İşlem yok, uygulamanın default algoritması sayesinde EXIF'i piksellere işleyip kalıcı döndürüyor
        { format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );

      if (!manipResult.base64) {
        setPrediction("Fotoğraf işlenemedi");
        return;
      }

      // Base64 -> Uint8Array
      const imgBuffer = Buffer.from(manipResult.base64, 'base64');
      const rawImageData = new Uint8Array(imgBuffer);

      // Decode JPEG to Tensor (Artık kesin olarak DİK şekilde)
      const imageTensor = decodeJpeg(rawImageData);

      // Kırpmadan direkt resmi 224x224 boyutuna zorla
      const resized = tf.image.resizeBilinear(imageTensor, [224, 224]);
      
      // Eğitim sırasındaki gibi [0, 1] standart aralığına geri dönelim (1./255.0 rescale)
      const normalized = resized.div(255.0).expandDims(0); // [1, 224, 224, 3]

      // --- ÇÖKÜŞ NOKTASI (RAM PAYLAŞIM HATASI) DÜZELTİSİ ---
      // tfjs'nin dataSync() metodu büyük bir RAM havuzunun (Memory Pool) sadece bir penceresini (view) döndürür.
      // C++ tabanlı TFLite eklentisi JSI üzerinden bu diziyi okumaya çalışınca, sadece resmi değil o havuzun 
      // arkasındaki BÜTÜN çöp (rastgele) veriyi okur! Yapay zeka bu devasa çöp veriye bakıp sürekli %99.4 "Diğer" der.
      // ÇÖZÜM: dataSync() verisini TAMAMEN YENİ VE İZOLE bir Float32Array'in içine KOPYALAMAK.
      const rawDataSync = normalized.dataSync(); 
      const inputData = new Float32Array(rawDataSync);

      // Model inference
      const output = await model.run([inputData]);
      const probabilities = output[0] as Float32Array;

      // En yüksek olasılığı bul
      let maxIdx = 0;
      let maxVal = probabilities[0];
      for (let i = 1; i < probabilities.length; i++) {
        if (probabilities[i] > maxVal) {
          maxVal = probabilities[i];
          maxIdx = i;
        }
      }

      // Hafızayı temizle
      tf.dispose([imageTensor, resized, normalized]);

      let resultLabel = labels[maxIdx] || 'Bilinmeyen';
      const percentage = (maxVal * 100).toFixed(1);

      // İngilizce etiketleri Türkçeleştir (Opsiyonel)
      if (resultLabel.toLowerCase().includes('plastic')) resultLabel = 'Plastik';
      if (resultLabel.toLowerCase().includes('paper')) resultLabel = 'Kağıt';
      if (resultLabel.toLowerCase().includes('diger') || resultLabel.toLowerCase().includes('other')) resultLabel = 'Diğer Atık (Bilinmeyen)';

      setPrediction(`Sonuç: ${resultLabel} (%${percentage})`);

    } catch (error) {
      console.error('Kamera veya Tahmin hatası:', error);
      setPrediction("Analiz Hatası");
    } finally {
      setIsProcessing(false);
    }
  };

  const resetCamera = () => {
    setCapturedImage(null);
    setPrediction('Kameraya Gösterin');
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.centerAll]}>
        <Text style={styles.permissionText}>
          Tarama yapmak için kamerayı kullanmaya izniniz gerekiyor.
        </Text>
        <TouchableOpacity style={styles.scanButton} onPress={requestPermission}>
          <Text style={styles.scanButtonText}>İzin Ver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!isReady) {
    return (
      <View style={[styles.container, styles.centerAll]}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.loadingText}>Yapay Zeka Modeli Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* Üstteki Siyah Boşluk ve Başlık */}
      <View style={styles.topArea}>
        <Text style={styles.topTitle}>Atık Tanıyıcı</Text>
      </View>

      {/* 1:1 Kare Kamera Çerçevesi */}
      <View style={styles.cameraWrapper}>
        {capturedImage ? (
          <Image source={{ uri: capturedImage }} style={styles.squareCamera} resizeMode="cover" />
        ) : (
          <CameraView style={styles.squareCamera} facing="back" ref={cameraRef} />
        )}

        {/* Ortada küçük bir odaklama karesi */}
        {!capturedImage && (
          <View style={styles.focusFrame} pointerEvents="none" />
        )}
      </View>

      {/* Alt Siyah Alan ve Butonlar (Harita stili Yüzen Panel Yapısı) */}
      <View style={styles.bottomArea} pointerEvents="box-none">

        {/* Sonuç Kartı - Sadece analiz yapılıyorsa veya fotoğraf çekilmişse gösterilsin */}
        {(capturedImage || isProcessing) && (
          <View style={styles.resultCard}>
            {isProcessing ? (
              <ActivityIndicator size="small" color={primaryColor} />
            ) : (
              <MaterialIcons
                name={capturedImage ? "check-circle" : "center-focus-weak"}
                size={24}
                color={capturedImage ? "#4CAF50" : primaryColor}
              />
            )}
            <Text style={styles.resultText}>{prediction}</Text>
          </View>
        )}

        {/* Aksiyon Container */}
        <View style={styles.actionContainer}>
          {capturedImage ? (
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: '#4CAF50' }]}
              onPress={isProcessing ? undefined : resetCamera}
              activeOpacity={0.8}
              disabled={isProcessing}
            >
              <MaterialIcons name="refresh" size={24} color="white" />
              <Text style={styles.addButtonText}>Yeniden Tara</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: primaryColor }]}
              onPress={captureAndAnalyze}
              activeOpacity={0.8}
              disabled={isProcessing}
            >
              <MaterialIcons name="camera-alt" size={24} color="white" />
              <Text style={styles.addButtonText}>Fotoğraf Çek ve Tara</Text>
            </TouchableOpacity>
          )}
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // Siyah sinematik arkaplan
    flexDirection: 'column',
  },
  centerAll: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    color: '#ddd',
    fontSize: 16,
  },
  permissionText: {
    textAlign: 'center',
    marginBottom: 20,
    color: 'white',
    fontSize: 16,
    paddingHorizontal: 30,
  },
  scanButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 35,
    paddingVertical: 12,
    borderRadius: 25,
  },
  scanButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Üst Alan
  topArea: {
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 20,
    backgroundColor: '#000',
    marginTop: 60,
    marginBottom: 10,
  },
  topTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 1,
  },

  // Kamera Alanı (1:1 Oran)
  cameraWrapper: {
    width: width,
    height: width, // Tam Kare
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#111',
  },
  squareCamera: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  focusFrame: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 20,
    margin: 30,
    borderStyle: 'dashed',
  },

  // Alt Alan
  bottomArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center', // Ortalama
    paddingHorizontal: 20,
    backgroundColor: '#000',
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 30,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    minWidth: 200,
    justifyContent: 'center',
  },
  resultText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  actionContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    flex: 1,
    marginHorizontal: 10,
    maxWidth: 300,
  },
  addButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});
