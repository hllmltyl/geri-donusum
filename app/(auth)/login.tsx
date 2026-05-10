import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { auth } from '@/firebaseConfig';
import { useThemeColor } from '@/hooks/useThemeColor';
import { MaterialIcons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useTranslation();
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
      setError(t('auth.emailPasswordRequired'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.replace('/(tabs)/homepage');
      return;
    } catch (error: any) {
      // Firebase hata kodlarına göre mesajlar
      const errorCode = error?.code;
      let errorMessage = t('auth.errors.genericError');

      switch (errorCode) {
        case 'auth/invalid-credential':
          errorMessage = t('auth.errors.invalidCredential');
          break;
        case 'auth/user-not-found':
          errorMessage = t('auth.errors.userNotFound');
          break;
        case 'auth/wrong-password':
          errorMessage = t('auth.errors.wrongPassword');
          break;
        case 'auth/invalid-email':
          errorMessage = t('auth.errors.invalidEmail');
          break;
        case 'auth/user-disabled':
          errorMessage = t('auth.errors.userDisabled');
          break;
        case 'auth/too-many-requests':
          errorMessage = t('auth.errors.tooManyRequests');
          break;
        case 'auth/network-request-failed':
          errorMessage = t('auth.errors.networkFailed');
          break;
        default:
          errorMessage = error?.message ?? t('auth.errors.loginError');
      }

      setError(errorMessage);
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
            {t('auth.appTitle')}
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: secondaryColor }]}>
            {t('auth.loginSubtitle')}
          </ThemedText>
        </View>

        {/* Form Container */}
        <View style={[styles.formContainer, { backgroundColor: cardColor }]}>
          <ThemedText type="subtitle" style={[styles.formTitle, { color: textColor }]}>
            {t('auth.login')}
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
              placeholder={t('auth.email')}
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
              placeholder={t('auth.password')}
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
                <ThemedText style={styles.submitButtonText}>{t('auth.login')}</ThemedText>
              </>
            )}
          </TouchableOpacity>

          {/* Kayıt Ol Linki */}
          <View style={styles.linkContainer}>
            <ThemedText style={[styles.linkText, { color: secondaryColor }]}>
              {t('auth.noAccount')}{' '}
            </ThemedText>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <ThemedText style={[styles.link, { color: primaryColor }]}>
                  {t('auth.register')}
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

