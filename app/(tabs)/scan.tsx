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
import { ActivityIndicator, Dimensions, Image, StyleSheet, Text, View, Pressable } from 'react-native';
import { useTensorflowModel } from 'react-native-fast-tflite';
import { BlurView } from 'expo-blur';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function PressableScale({ onPress, style, children, disabled = false }: any) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <AnimatedPressable
      disabled={disabled}
      onPressIn={() => { scale.value = withSpring(0.92, { damping: 15, stiffness: 300 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 300 }); }}
      onPress={onPress}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}

let cachedLabels: string[] | null = null;

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isReady, setIsReady] = useState(false);
  const [prediction, setPrediction] = useState('Tara');
  const [isProcessing, setIsProcessing] = useState(false);
  const [labels, setLabels] = useState<string[]>([]);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const insets = useSafeAreaInsets();

  const primaryColor = useThemeColor({}, 'primary');

  const { state: modelState, model } = useTensorflowModel(require('../../assets/models/atik_tanima_modeli.tflite'));

  useEffect(() => {
    async function prepare() {
      try {
        await tf.ready();
        if (cachedLabels) {
          setLabels(cachedLabels);
        } else {
          const asset = Asset.fromModule(require('../../assets/models/atik_tanima_modeli.txt'));
          await asset.downloadAsync();
          if (asset.localUri) {
            const text = await FileSystem.readAsStringAsync(asset.localUri);
            const loadedLabels = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
            cachedLabels = loadedLabels;
            setLabels(loadedLabels);
          }
        }
        setIsReady(true);
      } catch (error) {
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
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.5 });
      if (!photo?.uri) { setPrediction("Fotoğraf alınamadı"); return; }

      setCapturedImage(photo.uri);

      const originWidth = photo.width || 1080;
      const originHeight = photo.height || 1920;
      const cropSize = Math.min(originWidth, originHeight) * 0.8; 
      const originX = (originWidth - cropSize) / 2;
      const originY = (originHeight - cropSize) / 2;

      const manipResult = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ crop: { originX: originX, originY: originY, width: cropSize, height: cropSize } }, { resize: { width: 224, height: 224 } }],
        { format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );

      if (!manipResult.base64) { setPrediction("Fotoğraf işlenemedi"); return; }

      const imgBuffer = Buffer.from(manipResult.base64, 'base64');
      const rawImageData = new Uint8Array(imgBuffer);
      const imageTensor = decodeJpeg(rawImageData);
      const resized = tf.image.resizeBilinear(imageTensor, [224, 224]);
      const normalized = resized.toFloat().sub(127.5).div(127.5).expandDims(0); 
      
      const rawDataSync = normalized.dataSync();
      const inputData = Float32Array.from(rawDataSync);

      const output = await model.run([inputData]);
      const probabilities = output[0] as Float32Array;

      let maxIdx = 0;
      let maxVal = probabilities[0];
      for (let i = 1; i < probabilities.length; i++) {
        if (probabilities[i] > maxVal) { maxVal = probabilities[i]; maxIdx = i; }
      }

      tf.dispose([imageTensor, resized, normalized]);

      let resultLabel = labels[maxIdx] || 'Bilinmeyen';
      const percentage = (maxVal * 100).toFixed(1);

      const labelMap: Record<string, string> = {
        'cam': 'Cam', 'diger': 'Diğer', 'elektronik': 'Elektronik',
        'kagit': 'Kağıt', 'metal': 'Metal', 'organik': 'Organik',
        'pil': 'Pil', 'plastik': 'Plastik', 'tekstil': 'Tekstil', 'tibbi': 'Tıbbi Atık'
      };
      const key = resultLabel.toLowerCase().trim();
      resultLabel = labelMap[key] || resultLabel;

      setPrediction(`Sonuç: ${resultLabel} (%${percentage})`);
    } catch (error) {
      setPrediction("Analiz Hatası");
    } finally {
      setIsProcessing(false);
    }
  };

  const resetCamera = () => {
    setCapturedImage(null);
    setPrediction('Tara');
  };

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.centerAll]}>
        <MaterialIcons name="camera-alt" size={80} color="rgba(255,255,255,0.2)" style={{ marginBottom: 20 }} />
        <Text style={styles.permissionText}>Tarama yapmak için kamerayı kullanmaya izniniz gerekiyor.</Text>
        <PressableScale style={[styles.scanButton, { backgroundColor: primaryColor }]} onPress={requestPermission}>
          <Text style={styles.scanButtonText}>İzin Ver</Text>
        </PressableScale>
      </View>
    );
  }

  if (!isReady) {
    return (
      <View style={[styles.container, styles.centerAll]}>
        <ActivityIndicator size="large" color={primaryColor} />
        <Text style={styles.loadingText}>Yapay Zeka Modeli Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Üst Alan */}
      <BlurView intensity={80} tint="dark" experimentalBlurMethod="dimezisBlurView" style={styles.topArea}>
        <Text style={styles.topTitle}>Atık Tarayıcı</Text>
      </BlurView>

      {/* Kamera Alanı */}
      <View style={styles.cameraWrapper}>
        {capturedImage ? (
          <Image source={{ uri: capturedImage }} style={styles.squareCamera} resizeMode="cover" />
        ) : (
          <CameraView style={styles.squareCamera} facing="back" ref={cameraRef} />
        )}
        {!capturedImage && <View style={styles.focusFrame} pointerEvents="none" />}
      </View>

      {/* Alt Alan */}
      <View style={[styles.bottomArea, { paddingBottom: insets.bottom + 80 }]} pointerEvents="box-none">
        {(capturedImage || isProcessing) && (
          <BlurView intensity={60} tint="dark" experimentalBlurMethod="dimezisBlurView" style={styles.resultCard}>
            {isProcessing ? (
              <ActivityIndicator size="small" color={primaryColor} />
            ) : (
              <MaterialIcons name={capturedImage ? "check-circle" : "center-focus-weak"} size={28} color={primaryColor} />
            )}
            <Text style={[styles.resultText, { color: '#FFF' }]}>{prediction}</Text>
          </BlurView>
        )}

        <View style={styles.actionContainer}>
          {capturedImage ? (
            <PressableScale
              style={[styles.actionBtn, { backgroundColor: 'rgba(255,255,255,0.15)' }]}
              onPress={isProcessing ? undefined : resetCamera}
              disabled={isProcessing}
            >
              <MaterialIcons name="refresh" size={28} color="white" />
              <Text style={styles.actionBtnText}>Yeniden Tara</Text>
            </PressableScale>
          ) : (
            <PressableScale
              style={[styles.actionBtn, { backgroundColor: primaryColor }]}
              onPress={captureAndAnalyze}
              disabled={isProcessing}
            >
              <MaterialIcons name="camera-alt" size={28} color="white" />
              <Text style={styles.actionBtnText}>Fotoğraf Çek ve Tara</Text>
            </PressableScale>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', flexDirection: 'column' },
  centerAll: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  loadingText: { marginTop: 20, color: '#ddd', fontSize: 16, fontWeight: '600' },
  permissionText: { textAlign: 'center', marginBottom: 30, color: '#FFF', fontSize: 18, fontWeight: '500' },
  scanButton: { paddingHorizontal: 40, paddingVertical: 16, borderRadius: 25, elevation: 4 },
  scanButtonText: { color: 'white', fontSize: 18, fontWeight: '800' },
  topArea: { paddingTop: 60, paddingBottom: 20, alignItems: 'center', backgroundColor: 'transparent', zIndex: 10 },
  topTitle: { color: 'white', fontSize: 22, fontWeight: '900', letterSpacing: 0.5 },
  cameraWrapper: { width: width, height: width, position: 'relative', overflow: 'hidden', backgroundColor: '#111' },
  squareCamera: { flex: 1, width: '100%', height: '100%' },
  focusFrame: { ...StyleSheet.absoluteFillObject, borderWidth: 3, borderColor: 'rgba(255, 255, 255, 0.4)', borderRadius: 30, margin: 40, borderStyle: 'dashed' },
  bottomArea: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, backgroundColor: '#000' },
  resultCard: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 18, borderRadius: 30, marginBottom: 30, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  resultText: { fontSize: 18, fontWeight: '800', marginLeft: 12 },
  actionContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', width: '100%' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, paddingHorizontal: 30, borderRadius: 30, flex: 1, maxWidth: 300, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  actionBtnText: { color: 'white', fontSize: 18, fontWeight: '800', marginLeft: 10 },
});
