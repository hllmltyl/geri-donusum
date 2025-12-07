import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { db } from '@/firebaseConfig';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import { doc, setDoc } from 'firebase/firestore';
import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

// İpuçları verisi
const tipsData = {
    tips: [
        {
            id: "tip_001",
            text: "Plastik şişelerinizi geri dönüşüm kutusuna atmadan önce kapaklarını ayrı toplayın. Kapaklar farklı bir plastik türü olduğu için ayrı işlenmelidir.",
            category: "plastik",
            active: true
        },
        {
            id: "tip_002",
            text: "Cam şişe ve kavanozları geri dönüşüme göndermeden önce mutlaka yıkayın. Temiz cam, geri dönüşüm kalitesini artırır.",
            category: "cam",
            active: true
        },
        {
            id: "tip_003",
            text: "Kağıt atıklarınızı katlamak yerine düz bir şekilde toplayın. Bu, geri dönüşüm tesislerinde işlemi kolaylaştırır.",
            category: "kagit",
            active: true
        },
        {
            id: "tip_004",
            text: "Piller asla normal çöpe atılmamalıdır. Pil toplama kutularını kullanın veya satış noktalarına iade edin.",
            category: "pil",
            active: true
        },
        {
            id: "tip_005",
            text: "Organik atıklarınızı kompost yaparak doğal gübre elde edebilirsiniz. Bu hem çöp miktarını azaltır hem de toprağı zenginleştirir.",
            category: "organik",
            active: true
        },
        {
            id: "tip_006",
            text: "Elektronik atıklarınızı özel toplama noktalarına götürün. E-atıklar değerli metaller içerir ve özel işlem gerektirir.",
            category: "elektronik",
            active: true
        },
        {
            id: "tip_007",
            text: "Alışverişe bez çanta ile gidin. Her yıl milyonlarca plastik poşet kullanılıyor ve bunların çoğu okyanusları kirletiyor.",
            category: "genel",
            active: true
        },
        {
            id: "tip_008",
            text: "Tek kullanımlık ürünler yerine yeniden kullanılabilir alternatifleri tercih edin. Cam su şişeleri, metal pipetler ve bez peçeteler harika seçeneklerdir.",
            category: "genel",
            active: true
        },
        {
            id: "tip_009",
            text: "Atık yağları lavaboya dökmeyin! 1 litre atık yağ, 1 milyon litre suyu kirletebilir. Atık yağ toplama noktalarını kullanın.",
            category: "atik_yag",
            active: true
        },
        {
            id: "tip_010",
            text: "Kullanmadığınız kıyafetleri atmak yerine bağışlayın veya geri dönüşüm kutularına atın. Tekstil atıkları yeniden değerlendirilebilir.",
            category: "tekstil",
            active: true
        },
        {
            id: "tip_011",
            text: "Alüminyum kutular sonsuz kez geri dönüştürülebilir. Bir alüminyum kutuyu geri dönüştürmek, yeni üretmekten %95 daha az enerji kullanır.",
            category: "metal",
            active: true
        },
        {
            id: "tip_012",
            text: "Gıda atıklarını azaltmak için alışverişinizi planlayın. Satın aldığınız ürünlerin son kullanma tarihlerini kontrol edin.",
            category: "organik",
            active: true
        },
        {
            id: "tip_013",
            text: "Eski mobilyalarınızı atmadan önce tamir etmeyi veya yenilemeyi düşünün. Küçük onarımlar mobilyanın ömrünü uzatabilir.",
            category: "mobilya",
            active: true
        },
        {
            id: "tip_014",
            text: "Karton kutuları düzleştirerek saklayın. Bu, geri dönüşüm kutularında daha fazla yer kazandırır ve taşımayı kolaylaştırır.",
            category: "kagit",
            active: true
        },
        {
            id: "tip_015",
            text: "Eski telefonlarınızı atmayın! Elektronik cihazlar değerli mineraller içerir ve geri dönüşüm programlarına katılabilir.",
            category: "elektronik",
            active: true
        }
    ]
};

export default function ImportTipsScreen() {
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState('');
    const [completed, setCompleted] = useState(false);

    const primaryColor = useThemeColor({}, 'primary');
    const backgroundColor = useThemeColor({}, 'background');
    const cardColor = useThemeColor({}, 'card');
    const textColor = useThemeColor({}, 'text');

    const importTips = async () => {
        try {
            setLoading(true);
            setProgress('İpuçları yükleniyor...');

            let count = 0;
            for (const tip of tipsData.tips) {
                const docRef = doc(db, 'tips', tip.id);
                await setDoc(docRef, {
                    text: tip.text,
                    category: tip.category,
                    active: tip.active,
                    createdAt: new Date()
                });
                count++;
                setProgress(`${count}/${tipsData.tips.length} ipucu yüklendi...`);
            }

            setProgress(`✅ ${count} adet çevre ipucu başarıyla yüklendi!`);
            setCompleted(true);

            Alert.alert(
                'Başarılı!',
                `${count} adet çevre ipucu Firebase'e yüklendi.`,
                [{ text: 'Tamam' }]
            );
        } catch (error: any) {
            Alert.alert('Hata', error?.message || 'Bir hata oluştu');
            setProgress('❌ Hata: ' + (error?.message || 'Bilinmeyen hata'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <ThemedView style={[styles.container, { backgroundColor }]}>
            <ScrollView contentContainerStyle={styles.content}>
                <MaterialIcons name="cloud-upload" size={64} color={primaryColor} style={styles.icon} />

                <ThemedText style={[styles.title, { color: textColor }]}>
                    Çevre İpuçlarını Yükle
                </ThemedText>

                <ThemedText style={[styles.description, { color: textColor }]}>
                    Bu ekran, 15 adet çevre ipucunu Firebase Firestore'a yükler.
                    Bu işlem sadece bir kez yapılmalıdır.
                </ThemedText>

                <View style={[styles.infoBox, { backgroundColor: cardColor }]}>
                    <ThemedText style={[styles.infoText, { color: textColor }]}>
                        📊 Toplam: 15 ipucu
                    </ThemedText>
                    <ThemedText style={[styles.infoText, { color: textColor }]}>
                        🗂️ Koleksiyon: tips
                    </ThemedText>
                    <ThemedText style={[styles.infoText, { color: textColor }]}>
                        ✅ Kategoriler: plastik, cam, kağıt, pil, organik, elektronik, metal, tekstil, atık yağ, mobilya, genel
                    </ThemedText>
                </View>

                {progress ? (
                    <View style={[styles.progressBox, { backgroundColor: cardColor }]}>
                        <ThemedText style={[styles.progressText, { color: textColor }]}>
                            {progress}
                        </ThemedText>
                    </View>
                ) : null}

                <TouchableOpacity
                    style={[
                        styles.button,
                        { backgroundColor: completed ? '#4CAF50' : primaryColor },
                        loading && styles.buttonDisabled
                    ]}
                    onPress={importTips}
                    disabled={loading || completed}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <MaterialIcons
                                name={completed ? "check-circle" : "cloud-upload"}
                                size={24}
                                color="#fff"
                                style={styles.buttonIcon}
                            />
                            <ThemedText style={styles.buttonText}>
                                {completed ? 'Yükleme Tamamlandı' : 'İpuçlarını Yükle'}
                            </ThemedText>
                        </>
                    )}
                </TouchableOpacity>

                {completed && (
                    <ThemedText style={[styles.note, { color: textColor }]}>
                        ℹ️ İpuçları başarıyla yüklendi. Artık bu ekranı kapatabilirsiniz.
                    </ThemedText>
                )}
            </ScrollView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 24,
        alignItems: 'center',
    },
    icon: {
        marginTop: 40,
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    description: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 24,
    },
    infoBox: {
        width: '100%',
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
    },
    infoText: {
        fontSize: 14,
        marginBottom: 8,
        lineHeight: 20,
    },
    progressBox: {
        width: '100%',
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
        alignItems: 'center',
    },
    progressText: {
        fontSize: 14,
        textAlign: 'center',
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 12,
        marginBottom: 16,
        minWidth: 200,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonIcon: {
        marginRight: 8,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    note: {
        fontSize: 14,
        textAlign: 'center',
        fontStyle: 'italic',
    },
});
