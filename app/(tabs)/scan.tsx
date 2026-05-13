import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import * as jpeg from 'jpeg-js';
import { Buffer } from 'buffer';
import { Asset } from 'expo-asset';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, StyleSheet, Text, View, Pressable, InteractionManager } from 'react-native';
import { Image } from 'expo-image';
import { useTensorflowModel } from 'react-native-fast-tflite';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useIsFocused } from '@react-navigation/native';


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
  const { t } = useTranslation();
  const [prediction, setPrediction] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTransitionReady, setIsTransitionReady] = useState(false);
  const router = useRouter();
  const [labels, setLabels] = useState<string[]>([]);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();

  const primaryColor = useThemeColor({}, 'primary');
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');

  const { state: modelState, model } = useTensorflowModel(require('../../assets/models/atik_tanima_modeli.tflite'));

  useEffect(() => {
    async function prepare() {
      try {
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

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setIsTransitionReady(true);
    });
    return () => task.cancel();
  }, []);

  const captureAndAnalyze = async () => {
    if (!cameraRef.current || isProcessing || !model || labels.length === 0) {
      if (!model) setPrediction(t('scan.modelLoadError'));
      else if (labels.length === 0) setPrediction(t('scan.labelsLoadError'));
      return;
    }
    try {
      setIsProcessing(true);
      setPrediction(t('scan.analyzing'));
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.5 });
      if (!photo?.uri) { setPrediction(t('scan.photoError')); return; }

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

      if (!manipResult.base64) { setPrediction(t('scan.processingError')); return; }

      const imgBuffer = Buffer.from(manipResult.base64, 'base64');
      const rawImageData = new Uint8Array(imgBuffer);
      
      // Decode JPEG using purely JS (avoids massive WebGL TFJS initialization)
      const decoded = jpeg.decode(rawImageData, { useTArray: true });
      
      const inputData = new Float32Array(224 * 224 * 3);
      let j = 0;
      for (let i = 0; i < decoded.data.length; i += 4) {
        inputData[j++] = (decoded.data[i] - 127.5) / 127.5;     // R
        inputData[j++] = (decoded.data[i + 1] - 127.5) / 127.5; // G
        inputData[j++] = (decoded.data[i + 2] - 127.5) / 127.5; // B
      }

      const output = await model.run([inputData]);
      const probabilities = output[0] as Float32Array;

      let maxIdx = 0;
      let maxVal = probabilities[0];
      for (let i = 1; i < probabilities.length; i++) {
        if (probabilities[i] > maxVal) { maxVal = probabilities[i]; maxIdx = i; }
      }


      let resultLabel = labels[maxIdx] || t('scan.unknown');
      const percentage = (maxVal * 100).toFixed(1);

      const key = resultLabel.toLowerCase().trim();
      const translatedLabel = t(`wasteTypes.${key}`);
      
      // If translation doesn't exist (returns the key), fallback to original or capitalize
      resultLabel = translatedLabel !== `wasteTypes.${key}` ? translatedLabel : resultLabel;

      setPrediction(`${resultLabel}`);
      setConfidence(`%${percentage}`);
    } catch (error) {
      setPrediction(t('scan.analysisError'));
    } finally {
      setIsProcessing(false);
    }
  };

  const resetCamera = () => {
    setCapturedImage(null);
    setPrediction(null);
    setConfidence(null);
  };

  if (!isTransitionReady || !permission || !isReady) {
    return (
      <View style={[styles.container, { backgroundColor, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={primaryColor} />
        <Text style={{ marginTop: 20, color: textColor, fontWeight: 'bold' }}>{t('scan.loadingAI')}</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.centerAll]}>
        <MaterialIcons name="camera-alt" size={80} color="rgba(255,255,255,0.2)" style={{ marginBottom: 20 }} />
        <Text style={styles.permissionText}>{t('scan.permissionRequired')}</Text>
        <PressableScale style={[styles.scanButton, { backgroundColor: primaryColor }]} onPress={requestPermission}>
          <Text style={styles.scanButtonText}>{t('scan.grantPermission')}</Text>
        </PressableScale>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Üst Alan */}
      <View style={[styles.topArea, { backgroundColor: 'rgba(30, 30, 30, 0.85)' }]}>
        <PressableScale onPress={() => router.back()} style={{ position: 'absolute', left: 20, top: 60, zIndex: 20, padding: 10 }}>
          <MaterialIcons name="arrow-back" size={28} color="white" />
        </PressableScale>
        <Text style={styles.topTitle}>{t('scan.title')}</Text>
      </View>

      {/* Kamera Alanı */}
      <View style={styles.cameraWrapper}>
        <CameraView 
          style={styles.squareCamera} 
          facing="back" 
          ref={cameraRef} 
          active={isFocused && !capturedImage} 
        />
        {capturedImage && (
          <Image source={{ uri: capturedImage }} style={[styles.squareCamera, { position: 'absolute', top: 0, left: 0 }]} contentFit="cover" />
        )}
        {!capturedImage && isFocused && <View style={styles.focusFrame} pointerEvents="none" />}
      </View>

      {/* Alt Alan */}
      <View style={[styles.bottomArea, { paddingBottom: insets.bottom + 80 }]} pointerEvents="box-none">
        {(capturedImage || isProcessing) && (
          <View style={[styles.resultCard, { backgroundColor: 'rgba(30, 30, 30, 0.85)' }]}>
            {isProcessing ? (
              <ActivityIndicator size="small" color={primaryColor} />
            ) : (
              <MaterialIcons name={capturedImage ? "check-circle" : "center-focus-weak"} size={28} color={primaryColor} />
            )}
            <Text style={[styles.resultText, { color: '#FFF' }]}>{prediction}</Text>
          </View>
        )}

        <View style={styles.actionContainer}>
          {capturedImage ? (
            <View style={{ flexDirection: 'row', gap: 10, width: '100%', paddingHorizontal: 10 }}>
              <PressableScale
                style={[styles.actionBtn, { backgroundColor: 'rgba(255,255,255,0.15)', flex: 1, paddingHorizontal: 0 }]}
                onPress={isProcessing ? undefined : resetCamera}
                disabled={isProcessing}
              >
                <MaterialIcons name="refresh" size={22} color="white" />
                <Text style={[styles.actionBtnText, { fontSize: 14 }]}>{t('scan.retry')}</Text>
              </PressableScale>
              
              <PressableScale
                style={[styles.actionBtn, { backgroundColor: primaryColor, flex: 1.2, paddingHorizontal: 0 }]}
                onPress={() => {
                  if (prediction) {
                    const cleanedText = prediction.split(' ')[0];
                    router.navigate({ pathname: '/(tabs)/ai-chat', params: { wasteType: cleanedText } });
                  }
                }}
                disabled={isProcessing}
              >
                <MaterialIcons name="smart-toy" size={22} color="white" />
                <Text style={[styles.actionBtnText, { fontSize: 14 }]}>{t('scan.askAssistant')}</Text>
              </PressableScale>
            </View>
          ) : (
            <PressableScale
              style={[styles.actionBtn, { backgroundColor: primaryColor }]}
              onPress={captureAndAnalyze}
              disabled={isProcessing}
            >
              <MaterialIcons name="camera-alt" size={28} color="white" />
              <Text style={styles.actionBtnText}>{t('scan.takePhoto')}</Text>
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
