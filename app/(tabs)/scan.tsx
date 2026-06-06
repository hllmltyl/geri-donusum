import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import * as jpeg from 'jpeg-js';
import { Buffer } from 'buffer';
import { Asset } from 'expo-asset';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, StyleSheet, Text, View, Pressable, InteractionManager, Alert } from 'react-native';
import { Image } from 'expo-image';
import { useTensorflowModel } from 'react-native-fast-tflite';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useIsFocused } from '@react-navigation/native';
import * as Location from 'expo-location';
import { verifyPhysicalDropoff, getNearbyPoints, updateWeeklyTaskProgress, processScanAction } from '@/utils/points';
import { auth } from '@/firebaseConfig';
import { CustomAlert } from '@/components/CustomAlert';

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

// Model ve etiket dosyalarının üst seviyede senkronize şekilde yüklenmesi (Lazy-load uyarısını önlemek için)
const modelAsset = require('../../assets/models/atik_tanima_modeli.tflite');
const labelAsset = require('../../assets/models/atik_tanima_modeli.txt');

let cachedLabels: string[] | null = null;

const mapModelKeyToDbCategory = (key: string): string => {
  switch (key) {
    case 'battery': return 'pil';
    case 'cardboard': return 'karton';
    case 'glass': return 'cam';
    case 'metal': return 'metal';
    case 'paper': return 'kagit';
    case 'plastic': return 'plastik';
    case 'trash': return 'diger';
    case 'other': return 'diger';
    default: return key;
  }
};

export default function ScanScreen() {
  // Kamera izin durumunu yöneten kanca
  const [permission, requestPermission] = useCameraPermissions();
  // Model ve etiketlerin yüklenme tamamlanma durumu
  const [isReady, setIsReady] = useState(false);
  const { t } = useTranslation();
  // Yapay zeka tahmini (Örn: 'PLASTIK', 'METAL')
  const [prediction, setPrediction] = useState<string | null>(null);
  // Yapay zeka tahmin güven skoru (Örn: '%92.5')
  const [confidence, setConfidence] = useState<string | null>(null);
  // Analiz/işleme yapılıyor mu animasyon bayrağı
  const [isProcessing, setIsProcessing] = useState(false);
  // Ekran geçiş optimizasyon durumu
  const [isTransitionReady, setIsTransitionReady] = useState(false);
  const router = useRouter();
  // Model sınıf etiket listesi (Örn: ['CAM', 'PIL', ...])
  const [labels, setLabels] = useState<string[]>([]);
  // Çekilen fotoğrafın yerel URI adresi
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  // Atığı fiziksel kutuya bırakma durum makinesi ('idle', 'loading', 'success', 'error')
  const [dropoffStatus, setDropoffStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  // Fiziksel bırakma sonucu mesajı
  const [dropoffMessage, setDropoffMessage] = useState<string | null>(null);
  // Veritabanı ile uyumlu kategori ismi (Örn: 'plastik', 'pil')
  const [scannedCategory, setScannedCategory] = useState<string | null>(null);
  
  // Akıllı Bırakma (Smart Drop-off) Konum ve Yakın Noktalar State'leri
  const [nearbyPoints, setNearbyPoints] = useState<any[]>([]); // Yakındaki kutuların listesi
  const [showPointSelector, setShowPointSelector] = useState(false); // Kutu seçim modal gösterimi
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null); // Kullanıcı enlem-boylam koordinatları

  // Özelleştirilmiş Alert (Uyarı Kutusu) Durumu
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'warning' | 'info' | 'xp',
    onConfirm: undefined as (() => void) | undefined
  });

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' | 'xp' = 'info', onConfirm?: () => void) => {
    setAlertConfig({ visible: true, title, message, type, onConfirm });
  };

  const hideAlert = () => {
    setAlertConfig(prev => ({ ...prev, visible: false }));
  };

  // Yakındaki (50 metre) geri dönüşüm kutularını tespit eden işlev
  const handleFindNearbyPoints = async () => {
    if (!auth.currentUser) {
      showAlert('Hata', 'Giriş yapmanız gerekiyor.', 'error');
      return;
    }
    try {
      setDropoffStatus('loading');
      
      // Kullanıcıdan konum izni talep etme
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setDropoffStatus('error');
        setDropoffMessage('Konum izni reddedildi.');
        return;
      }

      // Hızlı ve dengeli konum tespiti
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setUserLocation({ lat: location.coords.latitude, lng: location.coords.longitude });
      
      // 50 metre yarıçapındaki kutuları veritabanından çekme
      const points = await getNearbyPoints(location.coords.latitude, location.coords.longitude, 50);
      
      if (points.length === 0) {
        setDropoffStatus('error');
        setDropoffMessage('Yakınınızda (50m) kayıtlı bir kutu bulunamadı.');
      } else {
        setNearbyPoints(points);
        setShowPointSelector(true);
        setDropoffStatus('idle'); // Listeleme ekranına geçiyoruz
      }
    } catch (error: any) {
      setDropoffStatus('error');
      setDropoffMessage(error.message || 'Konum bulunamadı.');
    }
  };

  // Atığı fiziksel kutuya bıraklağını doğrulayan ve puan ekleyen işlev
  const handleConfirmDropoff = async (pointId: string) => {
    if (!auth.currentUser || !userLocation || !scannedCategory) return;

    try {
      setDropoffStatus('loading');

      // Veritabanı ve mesafe doğrulamasını gerçekleştir
      const result = await verifyPhysicalDropoff(
        auth.currentUser.uid,
        userLocation.lat,
        userLocation.lng,
        pointId,
        scannedCategory
      );

      if (result.success) {
        setShowPointSelector(false);
        setDropoffStatus('success');
        setDropoffMessage(result.message);
        
        // Haftalık Görevleri (Dropoff ve Karma) Tetikle
        await updateWeeklyTaskProgress(auth.currentUser.uid, 'dropoff', { category: scannedCategory });
        
        // Eğer kullanıcı bir noktayı onayladıysa, Denetçi görevini de tetikle
        if (result.verifiedPoint) {
          await updateWeeklyTaskProgress(auth.currentUser.uid, 'point_verified');
        }
      }
    } catch (error: any) {
      setDropoffStatus('idle'); // Yükleniyor durumundan çıkar
      showAlert('Doğrulama Başarısız', error.message || 'Yanlış kutu veya uzaksınız.', 'error');
      // Modalı (selector) kapatmıyoruz ki tekrar seçebilsin
    }
  };
  const cameraRef = useRef<CameraView>(null); // Kamera görünümüne erişim referansı
  const insets = useSafeAreaInsets(); // iOS/Android ekran çentik/menü boşlukları
  const isFocused = useIsFocused(); // Ekranın aktif odak durumunu izleyen kanca

  // Arayüz renk kancaları
  const primaryColor = useThemeColor({}, 'primary');
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');

  // Yerel TensorFlow Lite model dosyasını yükleyen kanca
  const { state: modelState, model } = useTensorflowModel(modelAsset);

  // Model etiket dosyasını (.txt) indiren ve yerel bellekten okuyan useEffect
  useEffect(() => {
    async function prepare() {
      try {
        if (cachedLabels) {
          // Etiketler önbellekte varsa direkt oradan yükle
          setLabels(cachedLabels);
        } else {
          // Önbellekte yoksa model txt dosyasını yerel sisteme indir ve oku
          const asset = Asset.fromModule(labelAsset);
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
    // Model başarıyla yüklendiğinde etiket hazırlama aşamasına geç
    if (modelState === 'loaded' || modelState === 'error') {
      prepare();
    }
  }, [modelState]);

  // Ekran geçiş animasyon optimizasyonu için etkileşim yöneticisi
  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setIsTransitionReady(true);
    });
    return () => task.cancel();
  }, []);

  // Kameradan anlık fotoğraf çeken ve TensorFlow Lite modeline gönderen ana işlev
  const captureAndAnalyze = async () => {
    // Model, kamera veya etiketler hazır değilse işlemi başlatma
    if (!cameraRef.current || isProcessing || !model || labels.length === 0) {
      if (!model) setPrediction(t('scan.modelLoadError'));
      else if (labels.length === 0) setPrediction(t('scan.labelsLoadError'));
      return;
    }
    try {
      setIsProcessing(true);
      setPrediction(t('scan.analyzing'));
      
      // %50 kalitede fotoğraf çek
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.5 });
      if (!photo?.uri) { setPrediction(t('scan.photoError')); return; }

      setCapturedImage(photo.uri);

      // Fotoğrafı kare biçiminde kırpma ve 224x224 (model girdi boyutu) boyutuna getirme
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

      // Base64 görsel verisini Uint8Array formatına dönüştürme
      const imgBuffer = Buffer.from(manipResult.base64, 'base64');
      const rawImageData = new Uint8Array(imgBuffer);
      
      // WebGL başlatma maliyetini önlemek için saf JS kütüphanesi (jpeg-js) ile resmi decode et
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
      const dbCategory = mapModelKeyToDbCategory(key);
      setScannedCategory(dbCategory);

      const translatedLabel = t(`wasteTypes.${key}`);
      
      // If translation doesn't exist (returns the key), fallback to original or capitalize
      resultLabel = translatedLabel !== `wasteTypes.${key}` ? translatedLabel : resultLabel;

      setPrediction(`${resultLabel}`);
      setConfidence(`%${percentage}`);

      if (auth.currentUser) {
        try {
          const scanResult = await processScanAction(auth.currentUser.uid, dbCategory, maxVal);
          if (scanResult.earnedXp > 0) {
            if (dbCategory === 'plastik') {
              await updateWeeklyTaskProgress(auth.currentUser.uid, 'plastic_scan');
            } else if (dbCategory === 'kagit') {
              await updateWeeklyTaskProgress(auth.currentUser.uid, 'paper_scan');
            }
            showAlert(
              t('auth.success'),
              `+${scanResult.earnedXp} XP kazandınız! Günlük limit: ${scanResult.dailyScanCount}/5`,
              'xp'
            );
          } else if (scanResult.limitReached) {
            showAlert(
              'Günlük Limit',
              'Bugün için tarama limitine ulaştınız. Tarama kaydedildi fakat ekstra puan verilmedi.',
              'warning'
            );
          }
        } catch (dbError: any) {
          showAlert('Tarama Limiti', dbError.message || 'Veritabanı güncelleme hatası.', 'error');
        }
      }
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
    setScannedCategory(null);
    setDropoffStatus('idle');
    setDropoffMessage(null);
    setShowPointSelector(false);
    setNearbyPoints([]);
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
            <Text style={[styles.resultText, { color: '#FFF' }]}>{prediction}{confidence ? ` (${confidence})` : ''}</Text>
          </View>
        )}

        {capturedImage && !isProcessing && (
          <View style={styles.dropoffContainer}>
            {dropoffStatus === 'success' ? (
              <View style={styles.successBox}>
                <MaterialIcons name="stars" size={24} color="#FFD700" />
                <Text style={styles.successText}>{dropoffMessage || t('scan.successDropoff')}</Text>
              </View>
            ) : showPointSelector ? (
              <View style={styles.selectorBox}>
                <Text style={styles.selectorTitle}>{t('scan.selectBox')}</Text>
                {nearbyPoints.map((point) => (
                  <PressableScale 
                    key={point.id} 
                    style={styles.pointItem}
                    onPress={() => handleConfirmDropoff(point.id)}
                  >
                    <View style={styles.pointIconBg}>
                      <MaterialIcons name="recycling" size={20} color={primaryColor} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.pointTitle} numberOfLines={1}>{point.title}</Text>
                      <Text style={styles.pointDistance}>{Math.round(point.distance)}m - Tür: {point.type}</Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={20} color="#AAA" />
                  </PressableScale>
                ))}
                <PressableScale style={{ marginTop: 10 }} onPress={() => setShowPointSelector(false)}>
                  <Text style={styles.cancelText}>{t('map.cancel')}</Text>
                </PressableScale>
              </View>
            ) : (
              <>
                <Text style={styles.dropoffQuestion}>{t('scan.dropoffQuestion')}</Text>
                {dropoffMessage && dropoffStatus === 'error' && (
                  <Text style={styles.errorText}>{dropoffMessage}</Text>
                )}
                <View style={styles.dropoffButtons}>
                  <PressableScale 
                    style={[styles.dropoffBtn, { backgroundColor: '#4CAF50' }]} 
                    onPress={handleFindNearbyPoints}
                    disabled={dropoffStatus === 'loading'}
                  >
                    {dropoffStatus === 'loading' ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <>
                        <MaterialIcons name="location-on" size={20} color="white" />
                        <Text style={styles.dropoffBtnText}>{t('scan.yesNearby')}</Text>
                      </>
                    )}
                  </PressableScale>
                  
                  <PressableScale 
                    style={[styles.dropoffBtn, { backgroundColor: '#F44336' }]} 
                    onPress={() => setDropoffStatus('success')} 
                    disabled={dropoffStatus === 'loading'}
                  >
                    <MaterialIcons name="close" size={20} color="white" />
                    <Text style={styles.dropoffBtnText}>{t('scan.no')}</Text>
                  </PressableScale>
                </View>
              </>
            )}
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

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onClose={hideAlert}
        onConfirm={alertConfig.onConfirm ? () => {
          alertConfig.onConfirm?.();
          hideAlert();
        } : undefined}
      />
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
  dropoffContainer: { width: '100%', alignItems: 'center', marginBottom: 20, paddingHorizontal: 20 },
  dropoffQuestion: { color: 'white', fontSize: 16, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  dropoffButtons: { flexDirection: 'row', gap: 15 },
  dropoffBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 20, elevation: 3 },
  dropoffBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16, marginLeft: 6 },
  successBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(76, 175, 80, 0.2)', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 20, borderWidth: 1, borderColor: '#4CAF50' },
  successText: { color: '#FFD700', fontWeight: 'bold', fontSize: 16, marginLeft: 8 },
  errorText: { color: '#F44336', fontSize: 14, marginBottom: 10, textAlign: 'center' },
  selectorBox: { width: '100%', backgroundColor: 'rgba(30, 30, 30, 0.95)', padding: 15, borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  selectorTitle: { color: 'white', fontSize: 15, fontWeight: '700', marginBottom: 10 },
  pointItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', padding: 10, borderRadius: 12, marginBottom: 8 },
  pointIconBg: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  pointTitle: { color: 'white', fontSize: 15, fontWeight: '600' },
  pointDistance: { color: '#AAA', fontSize: 12, marginTop: 2 },
  cancelText: { color: '#F44336', fontSize: 14, fontWeight: '600', textAlign: 'center', padding: 5 }
});
