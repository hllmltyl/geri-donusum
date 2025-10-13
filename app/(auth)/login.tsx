import { auth } from '@/firebaseConfig';
import { Link, useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
import { Alert, StyleSheet, TextInput, View, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MaterialIcons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Renkler
  const primaryColor = useThemeColor({}, 'primary');
  const secondaryColor = useThemeColor({}, 'secondary');
  const backgroundColor = useThemeColor({}, 'background');
  const cardColor = useThemeColor({}, 'card');
  const borderColor = useThemeColor({}, 'border');
  const textColor = useThemeColor({}, 'text');

  async function handleLogin() {
    if (!email || !password) {
      setError('Email ve şifre gerekli.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.replace('/(tabs)/homepage');
      return;
    } catch (error: any) {
      console.error('[Login] error', error);
      setError(error?.message ?? 'Bilinmeyen hata');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor }]}>
        {/* Header */}
        <View style={styles.header}>
          <MaterialIcons name="recycling" size={60} color={primaryColor} />
          <ThemedText type="title" style={[styles.title, { color: primaryColor }]}>
            Geri Dönüşüm Rehberi
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: secondaryColor }]}>
            Sürdürülebilir yaşam için atıklarınızı doğru yönetin
          </ThemedText>
        </View>

        {/* Form Container */}
        <View style={[styles.formContainer, { backgroundColor: cardColor }]}>
          <ThemedText type="subtitle" style={[styles.formTitle, { color: textColor }]}>
            Giriş Yap
          </ThemedText>
          
          {error && (
            <View style={styles.errorContainer}>
              <MaterialIcons name="error" size={20} color="#E74C3C" />
              <ThemedText style={styles.error}>{error}</ThemedText>
            </View>
          )}

          <View style={styles.inputContainer}>
            <MaterialIcons name="email" size={20} color={secondaryColor} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { 
                backgroundColor: backgroundColor, 
                borderColor: borderColor,
                color: textColor 
              }]}
              placeholder="E-posta"
              placeholderTextColor={secondaryColor}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputContainer}>
            <MaterialIcons name="lock" size={20} color={secondaryColor} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { 
                backgroundColor: backgroundColor, 
                borderColor: borderColor,
                color: textColor 
              }]}
              placeholder="Şifre"
              placeholderTextColor={secondaryColor}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              style={styles.passwordToggle}
              onPress={() => setShowPassword(!showPassword)}
            >
              <MaterialIcons
                name={showPassword ? "visibility" : "visibility-off"}
                size={20}
                color={secondaryColor}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: primaryColor }]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <MaterialIcons name="login" size={20} color="#FFFFFF" />
                <ThemedText style={styles.submitButtonText}>Giriş Yap</ThemedText>
              </>
            )}
          </TouchableOpacity>

          {/* Kayıt Ol Linki */}
          <View style={styles.linkContainer}>
            <ThemedText style={[styles.linkText, { color: secondaryColor }]}>
              Hesabın yok mu?{' '}
            </ThemedText>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <ThemedText style={[styles.link, { color: primaryColor }]}>
                  Kayıt Ol
                </ThemedText>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 0,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 4,
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 0,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  formContainer: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 24,
    marginHorizontal: 16,
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#6C6C74',
    shadowOpacity: 0.10,
    shadowRadius: 8,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  error: {
    color: '#E74C3C',
    fontSize: 14,
    flex: 1,
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  inputIcon: {
    position: 'absolute',
    left: 12,
    top: 12,
    zIndex: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 44,
    paddingVertical: 12,
    fontSize: 16,
  },
  passwordToggle: {
    position: 'absolute',
    right: 12,
    top: 12,
    zIndex: 1,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  linkText: {
    fontSize: 14,
  },
  link: {
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

