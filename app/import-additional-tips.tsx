import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { db } from '@/firebaseConfig';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import { doc, setDoc } from 'firebase/firestore';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { CustomAlert } from '@/components/CustomAlert';

// 50 Ek İpucu
const additionalTips = [
    {
        id: "tip_016",
        text: "Duş sürenizi 5 dakika kısaltarak yılda yaklaşık 30.000 litre su tasarrufu yapabilirsiniz.",
        category: "su",
        active: true
    },
    {
        id: "tip_017",
        text: "LED ampuller, geleneksel ampullerden %80 daha az enerji tüketir ve 25 kat daha uzun ömürlüdür.",
        category: "enerji",
        active: true
    },
    {
        id: "tip_018",
        text: "Buzdolabınızı duvardan en az 10 cm uzakta tutun. Bu, enerji verimliliğini artırır.",
        category: "enerji",
        active: true
    },
    {
        id: "tip_019",
        text: "Yağmur suyu toplama sistemleri ile bahçe sulamasında kullanılabilecek ücretsiz su elde edebilirsiniz.",
        category: "su",
        active: true
    },
    {
        id: "tip_020",
        text: "Çamaşır ve bulaşık makinelerini tam dolu çalıştırın. Yarı dolu çalıştırmak su ve enerji israfıdır.",
        category: "enerji",
        active: true
    },
    {
        id: "tip_021",
        text: "Meyve ve sebze kabukları kompost için mükemmel malzemelerdir. Çöpe atmak yerine kompost yapın.",
        category: "organik",
        active: true
    },
    {
        id: "tip_022",
        text: "Plastik ambalajlı ürünler yerine cam veya karton ambalajlı ürünleri tercih edin.",
        category: "plastik",
        active: true
    },
    {
        id: "tip_023",
        text: "Eski gazeteleri ve kartonları geri dönüşüme göndererek 1 ton kağıt için 17 ağacın kesilmesini engelleyebilirsiniz.",
        category: "kagit",
        active: true
    },
    {
        id: "tip_024",
        text: "Şarj cihazlarını kullanmadığınızda prizden çekin. Boşta beklerken bile enerji tüketirler.",
        category: "enerji",
        active: true
    },
    {
        id: "tip_025",
        text: "Toplu taşıma, bisiklet veya yürüyüş tercih ederek karbon ayak izinizi azaltın.",
        category: "genel",
        active: true
    },
    {
        id: "tip_026",
        text: "Eski kitaplarınızı kütüphanelere bağışlayın veya ikinci el kitap alışverişi yapın.",
        category: "kagit",
        active: true
    },
    {
        id: "tip_027",
        text: "Çift taraflı baskı yaparak kağıt kullanımını yarıya indirin.",
        category: "kagit",
        active: true
    },
    {
        id: "tip_028",
        text: "Eski cep telefonlarınızı geri dönüşüme gönderin. İçlerindeki altın, gümüş ve bakır geri kazanılabilir.",
        category: "elektronik",
        active: true
    },
    {
        id: "tip_029",
        text: "Yemek artıklarını hayvan barınaklarına bağışlayabilir veya kompost yapabilirsiniz.",
        category: "organik",
        active: true
    },
    {
        id: "tip_030",
        text: "Plastik pipet kullanmayı bırakın. Dünyada her gün 1 milyar plastik pipet kullanılıyor.",
        category: "plastik",
        active: true
    },
    {
        id: "tip_031",
        text: "Termostat ayarını kışın 1 derece düşürüp yazın 1 derece yükselterek %10 enerji tasarrufu yapın.",
        category: "enerji",
        active: true
    },
    {
        id: "tip_032",
        text: "Eski battaniyeleri hayvan barınaklarına bağışlayın. Onlar için çok değerlidir.",
        category: "tekstil",
        active: true
    },
    {
        id: "tip_033",
        text: "Dişlerinizi fırçalarken musluğu kapatın. Dakikada 6 litre su tasarrufu sağlar.",
        category: "su",
        active: true
    },
    {
        id: "tip_034",
        text: "Yerel ve mevsimlik ürünler satın alın. Taşıma maliyeti ve karbon emisyonu daha düşüktür.",
        category: "genel",
        active: true
    },
    {
        id: "tip_035",
        text: "Eski ayakkabılarınızı geri dönüşüm kutularına atın. Spor ayakkabılar özel olarak geri dönüştürülebilir.",
        category: "tekstil",
        active: true
    },
    {
        id: "tip_036",
        text: "Cam kavanozları saklama kabı olarak yeniden kullanın. Plastik yerine cam tercih edin.",
        category: "cam",
        active: true
    },
    {
        id: "tip_037",
        text: "Eski gözlüklerinizi bağışlayın. Birçok kuruluş bunları ihtiyaç sahiplerine ulaştırır.",
        category: "genel",
        active: true
    },
    {
        id: "tip_038",
        text: "Dijital fatura ve e-posta tercih edin. Kağıt israfını azaltın.",
        category: "kagit",
        active: true
    },
    {
        id: "tip_039",
        text: "Eski oyuncakları kreşlere veya yetimhanelere bağışlayın.",
        category: "genel",
        active: true
    },
    {
        id: "tip_040",
        text: "Bulaşıkları elde yıkamak yerine bulaşık makinesi kullanın. Daha az su harcar.",
        category: "su",
        active: true
    },
    {
        id: "tip_041",
        text: "Eski halıları geri dönüşüm merkezlerine götürün. Halılar özel işlemle geri dönüştürülebilir.",
        category: "tekstil",
        active: true
    },
    {
        id: "tip_042",
        text: "Güneş enerjisi panelleri düşünün. Uzun vadede hem çevreye hem de cüzdanınıza faydalıdır.",
        category: "enerji",
        active: true
    },
    {
        id: "tip_043",
        text: "Eski pil ve aküleri asla normal çöpe atmayın. Özel toplama noktalarını kullanın.",
        category: "pil",
        active: true
    },
    {
        id: "tip_044",
        text: "Kahve telvelerini gübre olarak kullanın. Bitkiler için mükemmel besin kaynağıdır.",
        category: "organik",
        active: true
    },
    {
        id: "tip_045",
        text: "Plastik şişe yerine filtreli su kullanın. Yılda yüzlerce plastik şişeden kurtulursunuz.",
        category: "plastik",
        active: true
    },
    {
        id: "tip_046",
        text: "Eski CD ve DVD'leri geri dönüşüme gönderin. Polikarbonat plastikten yapılmışlardır.",
        category: "plastik",
        active: true
    },
    {
        id: "tip_047",
        text: "Yemek yaparken tencere kapağını kapatın. %75 daha az enerji tüketirsiniz.",
        category: "enerji",
        active: true
    },
    {
        id: "tip_048",
        text: "Eski mumları eritip yeni mumlar yapabilirsiniz. Sıfır atık yaşam için harika bir yöntem.",
        category: "genel",
        active: true
    },
    {
        id: "tip_049",
        text: "Bahçe atıklarını kompost yapın. Yaprak ve çim kırpıntıları mükemmel kompost malzemesidir.",
        category: "organik",
        active: true
    },
    {
        id: "tip_050",
        text: "Eski çorapları temizlik bezi olarak kullanın. Atık tekstili azaltmanın kolay yolu.",
        category: "tekstil",
        active: true
    },
    {
        id: "tip_051",
        text: "Yağlı kağıtları (pizza kutusu gibi) kompost yapın. Normal geri dönüşüme uygun değillerdir.",
        category: "organik",
        active: true
    },
    {
        id: "tip_052",
        text: "Eski şarj kabloları ve kulaklıkları elektronik atık toplama noktalarına götürün.",
        category: "elektronik",
        active: true
    },
    {
        id: "tip_053",
        text: "Kağıt havlu yerine bez havlu kullanın. Yılda tonlarca kağıt tasarrufu sağlar.",
        category: "kagit",
        active: true
    },
    {
        id: "tip_054",
        text: "Eski deterjan kutularını saklama kabı olarak kullanın. Yaratıcı geri dönüşüm!",
        category: "plastik",
        active: true
    },
    {
        id: "tip_055",
        text: "Araba yıkarken kova kullanın, hortum değil. 300 litre su tasarrufu yapabilirsiniz.",
        category: "su",
        active: true
    },
    {
        id: "tip_056",
        text: "Eski tişörtleri alışveriş çantası olarak dönüştürün. Basit ve kullanışlı!",
        category: "tekstil",
        active: true
    },
    {
        id: "tip_057",
        text: "Donmuş gıdaları buzdolabında çözün. Mikrodalga yerine bu yöntem enerji tasarrufu sağlar.",
        category: "enerji",
        active: true
    },
    {
        id: "tip_058",
        text: "Eski mum kavanozlarını saksı olarak kullanın. Dekoratif ve çevre dostu!",
        category: "cam",
        active: true
    },
    {
        id: "tip_059",
        text: "Plastik poşet yerine kağıt torba tercih edin. Kağıt daha hızlı doğada çözünür.",
        category: "kagit",
        active: true
    },
    {
        id: "tip_060",
        text: "Eski bilgisayar parçalarını e-atık merkezlerine götürün. Değerli metaller içerirler.",
        category: "elektronik",
        active: true
    },
    {
        id: "tip_061",
        text: "Yemek artıklarını dondurarak saklayın. Gıda israfını azaltmanın en iyi yolu.",
        category: "organik",
        active: true
    },
    {
        id: "tip_062",
        text: "Eski çerçeveleri yeniden boyayıp kullanın. Yeni almak yerine yenileyin.",
        category: "genel",
        active: true
    },
    {
        id: "tip_063",
        text: "Balmumu sarma kağıtları kullanın. Streç film yerine doğal alternatif.",
        category: "plastik",
        active: true
    },
    {
        id: "tip_064",
        text: "Eski çakmakları özel toplama kutularına atın. Plastik ve metal içerirler.",
        category: "plastik",
        active: true
    },
    {
        id: "tip_065",
        text: "Bahçenizde yağmur bahçesi oluşturun. Yağmur suyunu toprakta tutar ve taşkını önler.",
        category: "su",
        active: true
    }
];

export default function ImportAdditionalTipsScreen() {
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState('');
    const [completed, setCompleted] = useState(false);

    const [alertConfig, setAlertConfig] = useState({
        visible: false,
        title: '',
        message: '',
        type: 'info' as 'success' | 'error' | 'warning' | 'info' | 'xp'
    });

    const showAlert = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' | 'xp' = 'info') => {
        setAlertConfig({ visible: true, title, message, type });
    };

    const hideAlert = () => {
        setAlertConfig(prev => ({ ...prev, visible: false }));
    };

    const primaryColor = useThemeColor({}, 'primary');
    const backgroundColor = useThemeColor({}, 'background');
    const cardColor = useThemeColor({}, 'card');
    const textColor = useThemeColor({}, 'text');

    const importTips = async () => {
        try {
            setLoading(true);
            setProgress('50 ek ipucu yükleniyor...');

            let count = 0;
            for (const tip of additionalTips) {
                const docRef = doc(db, 'tips', tip.id);
                await setDoc(docRef, {
                    text: tip.text,
                    category: tip.category,
                    active: tip.active,
                    createdAt: new Date()
                });
                count++;
                setProgress(`${count}/${additionalTips.length} ipucu yüklendi...`);
            }

            setProgress(`✅ ${count} adet ek çevre ipucu başarıyla yüklendi!`);
            setCompleted(true);

            showAlert(
                'Başarılı!',
                `${count} adet ek çevre ipucu Firebase'e yüklendi. Toplam ${count + 15} ipucu var!`,
                'success'
            );
        } catch (error: any) {
            showAlert('Hata', error?.message || 'Bir hata oluştu', 'error');
            setProgress('❌ Hata: ' + (error?.message || 'Bilinmeyen hata'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <ThemedView style={[styles.container, { backgroundColor }]}>
            <ScrollView contentContainerStyle={styles.content}>
                <MaterialIcons name="add-circle" size={64} color={primaryColor} style={styles.icon} />

                <ThemedText style={[styles.title, { color: textColor }]}>
                    50 Ek İpucu Yükle
                </ThemedText>

                <ThemedText style={[styles.description, { color: textColor }]}>
                    Bu ekran, 50 adet daha çevre ipucunu Firebase'e yükler.
                    Mevcut 15 ipucuna ek olarak toplam 65 ipucu olacak.
                </ThemedText>

                <View style={[styles.infoBox, { backgroundColor: cardColor }]}>
                    <ThemedText style={[styles.infoText, { color: textColor }]}>
                        📊 Yeni İpuçlar: 50 adet
                    </ThemedText>
                    <ThemedText style={[styles.infoText, { color: textColor }]}>
                        📊 Toplam: 65 ipucu
                    </ThemedText>
                    <ThemedText style={[styles.infoText, { color: textColor }]}>
                        🗂️ Kategoriler: su, enerji, plastik, cam, kağıt, organik, elektronik, tekstil, pil, genel
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
                                name={completed ? "check-circle" : "add-circle"}
                                size={24}
                                color="#fff"
                                style={styles.buttonIcon}
                            />
                            <ThemedText style={styles.buttonText}>
                                {completed ? 'Yükleme Tamamlandı' : '50 İpucu Yükle'}
                            </ThemedText>
                        </>
                    )}
                </TouchableOpacity>

                {completed && (
                    <ThemedText style={[styles.note, { color: textColor }]}>
                        ℹ️ 50 ek ipucu başarıyla yüklendi. Artık toplam 65 ipucu var!
                    </ThemedText>
                )}
            </ScrollView>

            <CustomAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                onClose={hideAlert}
            />
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
