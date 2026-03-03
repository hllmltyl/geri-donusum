import { IconSymbol } from '@/components/ui/IconSymbol';
import * as mobilenet from '@tensorflow-models/mobilenet';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import { decodeJpeg } from '@tensorflow/tfjs-react-native';
import { Buffer } from 'buffer';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function ScanScreen() {
    const [permission, requestPermission] = useCameraPermissions();
    const [isProcessing, setIsProcessing] = useState(false);
    const [predictionObj, setPredictionObj] = useState<{ raw: string, translated: string, probability: number } | null>(null);
    const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
    const cameraRef = useRef<CameraView>(null);

    // TFJS state
    const [isTfReady, setIsTfReady] = useState(false);
    const [model, setModel] = useState<mobilenet.MobileNet | null>(null);

    // TFJS modelini yüklüyoruz
    useEffect(() => {
        async function loadModel() {
            try {
                await tf.ready();
                // Sürüm 2 daha güncel ve iyi sonuç verir. Alpha 0.5 performans/doğruluk dengesini sağlar.
                const loadedModel = await mobilenet.load({ version: 2, alpha: 0.5 });
                setModel(loadedModel);
                setIsTfReady(true);
            } catch (err) {
                console.error("TFJS Model Yüklenemedi:", err);
            }
        }
        loadModel();
    }, []);

    if (!permission) {
        return <View style={styles.container} />;
    }

    if (!permission.granted) {
        return (
            <View style={styles.permissionContainer}>
                <IconSymbol name="camera.circle.fill" size={80} color="#0F5132" style={styles.permissionIcon} />
                <Text style={styles.permissionTitle}>Kamera İzni Gerekli</Text>
                <Text style={styles.permissionText}>Yapay zeka analizinin çalışabilmesi için atıkları taramamız gerekiyor.</Text>
                <TouchableOpacity onPress={requestPermission} style={styles.permissionButton}>
                    <Text style={styles.permissionButtonText}>Kameraya İzin Ver</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const loadLabels = async () => {
        // Label dosyasını okuma simülasyonu ya da bundle'dan alma (gerçekte require ile doğrudan text alamayız)
        // Şimdilik demo kategorilerini MobileNet 1000 sınıflarından çöp olanlara eşleyeceğiz
        return ["Plastik Şişe", "Karton Kutu", "Cam Şişe", "Metal Kutu"];
    };

    const takePictureAndAnalyze = async () => {
        if (!cameraRef.current || !model || !isTfReady) return;

        setIsProcessing(true);
        setPredictionObj(null);

        try {
            // 1. Kameradan kare al (Önce hızlıca önizleme için alıyoruz)
            const photo = await cameraRef.current.takePictureAsync({ base64: false, quality: 0.3 });

            if (photo?.uri) {
                // Önizlemeyi göster (kamera donar)
                setCapturedPhoto(photo.uri);

                // 2. Performansı artırmak için görseli küçült (AI 224x224 civarı çalışır, çok büyük resim CPU'yu kilitler)
                const manipResult = await ImageManipulator.manipulateAsync(
                    photo.uri,
                    [{ resize: { width: 400 } }], // Genişliği 400px'e düşürüyoruz, bu hızı uçuracak!
                    { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG, base64: true }
                );

                if (manipResult.base64) {
                    // Base64 string'i uint8 dizisine çevir
                    const buffer = Buffer.from(manipResult.base64, 'base64');
                    const imgData = new Uint8Array(buffer);

                    // JPEG kodunu çözüp Tensor oluştur
                    const imageTensor = decodeJpeg(imgData);

                    // MobileNet üzerinden tahminde bulun
                    const predictions = await model.classify(imageTensor);

                    // En yüksek ihtimalli birinci tahmini al
                    if (predictions && predictions.length > 0) {
                        const topPrediction = predictions[0];
                        const className = topPrediction.className.split(',')[0];
                        const probability = Math.round(topPrediction.probability * 100);

                        console.log("\n================ [ YAPAY ZEKA TARAMASI ] ================");
                        console.log(`🤖 Ham Sonuç: ${className}`);
                        console.log(`📊 Doğruluk (Güven): %${probability}`);
                        console.log("=========================================================\n");

                        // Kapsamlı İngilizce-Türkçe Çeviri Eşlemesi
                        let translated = "Diğer Atık";
                        const cls = className.toLowerCase();

                        if (cls.match(/bottle|plastic|container|jug|cup|mouse|keyboard|bag|case/)) translated = "Plastik";
                        else if (cls.match(/box|carton|paper|envelope|tissue|notebook|desktop|book/)) translated = "Kağıt/Karton";
                        else if (cls.match(/can|tin|pot|aluminum|barrel|drum/)) translated = "Metal";
                        else if (cls.match(/glass|goblet|beaker|pitcher|wine/)) translated = "Cam";
                        else if (cls.match(/laptop|phone|monitor|screen|device|tv/)) translated = "Elektronik";

                        // Ham çıktıyı basitçe Türkçeleştirici
                        const dictionary: Record<string, string> = {
                            "water bottle": "Su Şişesi", "pop bottle": "Gazlı İçecek Şişesi", "beer bottle": "Bira Şişesi", "wine bottle": "Şarap Şişesi",
                            "pill bottle": "İlaç Şişesi", "water jug": "Su Sürahisi", "cup": "Bardak", "coffee mug": "Kahve Kupası", "whiskey jug": "İçecek Sürahisi",
                            "mouse": "Fare", "computer keyboard": "Klavye", "desktop computer": "Masaüstü Bilgisayar", "notebook": "Defter / Laptop",
                            "laptop": "Dizüstü Bilgisayar", "screen": "Ekran", "monitor": "Monitör", "television": "Televizyon",
                            "book": "Kitap", "envelope": "Zarf", "paper towel": "Kağıt Havlu", "carton": "Karton", "box": "Kutu",
                            "can": "Teneke", "tin": "Teneke", "ashcan": "Çöp Kutusu", "plastic bag": "Plastik Poşet",
                            "goblet": "Kadeh", "beaker": "Deney Tüpü/Bardak", "pitcher": "Sürahi", "pot": "Tencere/Kutu", "barrel": "Fıçı",
                            "shopping basket": "Alışveriş Sepeti", "shopping cart": "Alışveriş Arabası"
                        };

                        // Tam eşleşme ara, bulamazsa kelime bazlı eşleştir veya orijinalini bırak
                        let rawTranslated = dictionary[cls] || className;
                        if (!dictionary[cls]) {
                            // Basit fallback: en azından ilk harfleri büyüt
                            rawTranslated = className.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                        }

                        setPredictionObj({ raw: rawTranslated, translated: translated, probability: probability });
                    } else {
                        setPredictionObj({ raw: 'Belirsiz', translated: 'Atık Algılanamadı', probability: 0 });
                    }

                    // Bellek sızıntısını önlemek için tensörü boşalt
                    tf.dispose([imageTensor]);
                }
            }
            setIsProcessing(false);

        } catch (e) {
            Alert.alert("Hata", "Fotoğraf işlenemedi.");
            setIsProcessing(false);
        }
    };

    const resetScan = () => {
        setPredictionObj(null);
        setCapturedPhoto(null);
    };

    return (
        <View style={styles.container}>
            {/* Üst Kısım: 4:3 Kamera */}
            <View style={styles.cameraContainer}>
                {capturedPhoto ? (
                    <Image source={{ uri: capturedPhoto }} style={styles.camera} />
                ) : (
                    <CameraView style={styles.camera} ref={cameraRef} facing="back" />
                )}

                {/* Kamera Üstü Overlay (Hedef Çerçevesi) */}
                <View style={styles.cameraOverlay}>
                    {!predictionObj && (
                        <View style={styles.targetFrame}>
                            <View style={[styles.corner, styles.topLeftCorner]} />
                            <View style={[styles.corner, styles.topRightCorner]} />
                            <View style={[styles.corner, styles.bottomLeftCorner]} />
                            <View style={[styles.corner, styles.bottomRightCorner]} />
                        </View>
                    )}
                </View>
            </View>

            {/* Alt Kısım: Kontroller & Sonuç Kartı */}
            <View style={styles.bottomSection}>
                {predictionObj ? (
                    <View style={styles.resultCard}>
                        <View style={styles.resultHeader}>
                            <IconSymbol name="leaf.fill" size={28} color="#0F5132" style={styles.resultIcon} />
                            <Text style={styles.resultCardTitle}>YAPAY ZEKA SONUCU</Text>
                        </View>

                        <View style={styles.resultRow}>
                            <Text style={styles.resultLabel}>Sınıf:</Text>
                            <Text style={styles.resultValuePrimary}>{predictionObj.translated}</Text>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.resultRow}>
                            <Text style={styles.resultLabel}>Nesne:</Text>
                            <Text style={styles.resultValueSecondary}>{predictionObj.raw}</Text>
                        </View>

                        <View style={styles.resultRow}>
                            <Text style={styles.resultLabel}>Doğruluk:</Text>
                            <Text style={styles.resultValueSecondary}>%{predictionObj.probability}</Text>
                        </View>

                        <TouchableOpacity style={styles.actionButton} onPress={resetScan}>
                            <IconSymbol name="arrow.clockwise" size={24} color="white" />
                            <Text style={styles.actionButtonText}>Yeni Tarama</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.idleControlsContainer}>
                        <View style={styles.hintBadge}>
                            <Text style={styles.hintText}>Atığı çerçevenin içine yerleştirin</Text>
                        </View>

                        <TouchableOpacity
                            style={styles.captureButton}
                            onPress={takePictureAndAnalyze}
                            disabled={isProcessing}
                        >
                            {isProcessing ? (
                                <ActivityIndicator size="large" color="white" />
                            ) : (
                                <View style={styles.captureInnerRing}>
                                    <IconSymbol name="camera.fill" size={32} color="#0F5132" />
                                </View>
                            )}
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f4f5f7' // Arka plan yeşil temanın kontrası gri-beyaz
    },
    cameraContainer: {
        width: width,
        height: width * (4 / 3), // 4:3 Formatı
        overflow: 'hidden',
        position: 'relative',
        backgroundColor: 'black'
    },
    camera: {
        flex: 1,
    },
    cameraOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    bottomSection: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    idleControlsContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    resultCard: {
        backgroundColor: '#ffffff',
        width: '100%',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#0F5132',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 10,
    },
    resultHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
    },
    resultIcon: {
        marginRight: 8,
    },
    resultCardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#0F5132',
        letterSpacing: 1.5,
        marginLeft: 10,
    },
    resultRow: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
    },
    resultLabel: {
        fontSize: 16,
        color: '#555',
        fontWeight: '600',
    },
    resultValuePrimary: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#0F5132',
    },
    resultValueSecondary: {
        fontSize: 16,
        color: '#333',
        fontWeight: '500',
    },
    divider: {
        width: '100%',
        height: 1,
        backgroundColor: 'rgba(0,0,0,0.1)',
        marginVertical: 5,
    },
    hintBadge: {
        backgroundColor: '#0F5132', // Uygulamanın yeşil teması
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 25,
        marginBottom: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5,
    },
    hintText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    targetFrame: {
        width: width * 0.7,
        height: width * 0.8,
        position: 'relative',
    },
    corner: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderColor: 'rgba(255, 255, 255, 0.8)',
    },
    topLeftCorner: {
        top: 0,
        left: 0,
        borderTopWidth: 4,
        borderLeftWidth: 4,
        borderTopLeftRadius: 15,
    },
    topRightCorner: {
        top: 0,
        right: 0,
        borderTopWidth: 4,
        borderRightWidth: 4,
        borderTopRightRadius: 15,
    },
    bottomLeftCorner: {
        bottom: 0,
        left: 0,
        borderBottomWidth: 4,
        borderLeftWidth: 4,
        borderBottomLeftRadius: 15,
    },
    bottomRightCorner: {
        bottom: 0,
        right: 0,
        borderBottomWidth: 4,
        borderRightWidth: 4,
        borderBottomRightRadius: 15,
    },
    captureButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    captureInnerRing: {
        width: 66,
        height: 66,
        borderRadius: 33,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0F5132',
        width: '100%',
        paddingVertical: 16,
        borderRadius: 20,
        marginTop: 20,
    },
    actionButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    permissionContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
        backgroundColor: '#fff'
    },
    permissionIcon: {
        marginBottom: 20,
    },
    permissionTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#0F5132',
        marginBottom: 10,
    },
    permissionText: {
        fontSize: 16,
        textAlign: 'center',
        color: '#666',
        marginBottom: 30,
        lineHeight: 24,
    },
    permissionButton: {
        backgroundColor: '#0F5132',
        paddingVertical: 15,
        paddingHorizontal: 40,
        borderRadius: 30,
        shadowColor: '#0F5132',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    permissionButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 18
    },
});
