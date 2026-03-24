import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState, useRef, useEffect } from 'react';
import { Button, StyleSheet, Text, View, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useTensorflowModel } from 'react-native-fast-tflite';
import * as tf from '@tensorflow/tfjs';
import { decodeJpeg } from '@tensorflow/tfjs-react-native';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import { Buffer } from 'buffer';

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isReady, setIsReady] = useState(false);
  const [prediction, setPrediction] = useState('Hazır (Tahmin Bekleniyor)');
  const [isProcessing, setIsProcessing] = useState(false);
  const [labels, setLabels] = useState<string[]>([]);
  const cameraRef = useRef<CameraView>(null);

  // Model yükleme hook'u
  const { state: modelState, model } = useTensorflowModel(require('../../assets/models/model_v1_plastik.tflite'));

  useEffect(() => {
    async function prepare() {
      try {
        // TensorFlow.js başlatılıyor
        await tf.ready();
        
        // Etiketleri yükle
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
      
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.5 });
      
      if (!photo?.base64) {
         setPrediction("Fotoğraf alınamadı");
         return;
      }

      // Base64 -> Uint8Array
      const imgBuffer = Buffer.from(photo.base64, 'base64');
      const rawImageData = new Uint8Array(imgBuffer);
      
      // Decode JPEG to Tensor
      const imageTensor = decodeJpeg(rawImageData); 
      
      // Resize to 224x224 and normalize to [0, 1]
      const resized = tf.image.resizeBilinear(imageTensor, [224, 224]);
      const normalized = resized.div(255.0).expandDims(0); // [1, 224, 224, 3] boyutuna getirilir
      
      const inputData = normalized.dataSync(); // Float32Array çıkar
      
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
      
      const resultLabel = labels[maxIdx] || 'Bilinmeyen';
      const percentage = (maxVal * 100).toFixed(1);
      
      setPrediction(`Sonuç: ${resultLabel} (%${percentage})`);
      
    } catch (error) {
      console.error('Kamera veya Tahmin hatası:', error);
      setPrediction("Analiz Hatası");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center', marginBottom: 20, color: 'white' }}>
          Kamerayı kullanmak için izninize ihtiyacımız var
        </Text>
        <Button onPress={requestPermission} title="İzin Ver" />
      </View>
    );
  }

  if (!isReady) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.loadingText}>Yapay Zeka Modeli Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing="back" ref={cameraRef} />
      <View style={styles.overlay}>
        <Text style={styles.predictionText}>{prediction}</Text>
        <TouchableOpacity 
          style={[styles.scanButton, isProcessing && styles.scanButtonDisabled]} 
          onPress={captureAndAnalyze}
          disabled={isProcessing}
        >
          <Text style={styles.scanButtonText}>
            {isProcessing ? 'İşleniyor...' : 'Kameradan Analiz Et'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: 'white',
    fontSize: 16,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
  },
  predictionText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  scanButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
  },
  scanButtonDisabled: {
    backgroundColor: '#81C784',
  },
  scanButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

