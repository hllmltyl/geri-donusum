import { Tabs, router } from 'expo-router';
import { Platform, StyleSheet, View, Pressable, Alert } from 'react-native';
import { BlurView } from 'expo-blur';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useUser } from '@/context/UserContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Merkez Tarama Butonu (Süper Uygulama Tarzı)
function CenterScanButton(props: any) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <View style={[props.style, styles.centerButtonWrapper]}>
      <AnimatedPressable
        onPress={props.onPress}
        onPressIn={() => { scale.value = withSpring(0.9, { damping: 15, stiffness: 300 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 300 }); }}
        style={[styles.centerButton, animatedStyle]}
      >
        <IconSymbol name="camera.fill" size={30} color="#FFF" />
      </AnimatedPressable>
    </View>
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const { isAdmin } = useUser();
  const isDark = colorScheme === 'dark';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#51A646',
        tabBarInactiveTintColor: isDark ? '#8E8E93' : '#8E8E93',
        headerShown: false,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginBottom: 6,
        },
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 25 : 15,
          left: 20,
          right: 20,
          height: Platform.OS === 'ios' ? 88 : 68,
          borderRadius: 35,
          paddingHorizontal: 10,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          borderTopWidth: 0,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.1,
          shadowRadius: 20,
          backgroundColor: 'transparent',
        },
        tabBarBackground: () => (
          <BlurView 
            intensity={isDark ? 40 : 80} 
            tint={isDark ? 'dark' : 'light'} 
            experimentalBlurMethod="dimezisBlurView"
            style={{ ...StyleSheet.absoluteFillObject, borderRadius: 32, overflow: 'hidden', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.4)' }} 
          />
        ),
      }}>
      
      {/* 1. GÖRÜNÜR SEKME: ANA SAYFA */}
      <Tabs.Screen
        name="homepage"
        options={{
          title: 'Ana Sayfa',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="house.fill" color={color} />,
        }}
      />

      {/* 2. GÖRÜNÜR SEKME: HARİTA */}
      <Tabs.Screen
        name="map"
        options={{
          title: 'Harita',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="map.fill" color={color} />,
        }}
      />

      {/* 3. MERKEZ SEKME (SÜPER APP TARA BUTONU) */}
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Tara',
          tabBarButton: (props) => <CenterScanButton {...props} />,
        }}
      />

      {/* 4. GÖRÜNÜR SEKME: PROFİL */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profilim',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="person.circle.fill" color={color} />,
        }}
      />

      {/* GİZLİ SEKMELER (HREF: NULL) */}
      <Tabs.Screen
        name="waste"
        options={{
          href: null,
          title: 'Atıklar',
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          href: null,
          title: 'Liderlik',
        }}
      />
      <Tabs.Screen
        name="upcycle"
        options={{
          href: null,
          title: 'Asistan',
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          href: null,
          title: 'Admin',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  centerButtonWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 10 : 0,
  },
  centerButton: {
    top: -25, // Yukarı taşması için
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#51A646',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#51A646',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.2)', // Cam efekti üzerine otururken şık durması için
  }
});
