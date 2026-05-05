import { Tabs, router } from 'expo-router';
import { Platform, StyleSheet, View, Pressable, Alert } from 'react-native';


import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useUser } from '@/context/UserContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// AI Chat İkonu için özel kapsayıcı (taşma yapmayan, sadece hafif büyük)
function AIChatIcon({ color, focused }: { color: string, focused: boolean }) {
  return (
    <View style={{
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: focused ? '#51A646' : 'transparent',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: Platform.OS === 'ios' ? -5 : 0,
    }}>
      <IconSymbol name="sparkles" size={30} color={focused ? '#FFF' : color} />
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
        tabBarInactiveTintColor: '#8E8E93',
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
          <View 
            style={{ ...StyleSheet.absoluteFillObject, borderRadius: 32, overflow: 'hidden', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.4)', backgroundColor: isDark ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)' }} 
          />
        ),
      }}>
      
      {/* 1. ANA SAYFA */}
      <Tabs.Screen
        name="homepage"
        options={{
          title: 'Ana Sayfa',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="house.fill" color={color} />,
        }}
      />

      {/* 2. ATIK REHBERİ */}
      <Tabs.Screen
        name="waste"
        options={{
          title: 'Rehber',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="leaf.fill" color={color} />,
        }}
      />

      {/* 3. AI CHAT (Merkezde hizalı) */}
      <Tabs.Screen
        name="ai-chat"
        options={{
          title: 'AI Sohbet',
          tabBarStyle: { display: 'none' }, // Alt sayfa kuralı: Paneli gizle
          tabBarIcon: ({ color, focused }) => <AIChatIcon color={color} focused={focused} />,
        }}
      />

      {/* 4. HARİTA */}
      <Tabs.Screen
        name="map"
        options={{
          title: 'Harita',
          tabBarStyle: { display: 'none' },
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="map.fill" color={color} />,
        }}
      />

      {/* 5. PROFİL */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profilim',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="person.circle.fill" color={color} />,
        }}
      />

      {/* GİZLİ SEKMELER (HREF: NULL) */}
      <Tabs.Screen
        name="scan"
        options={{
          href: null,
          title: 'Tara',
          tabBarStyle: { display: 'none' },
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
        name="admin"
        options={{
          href: null,
          title: 'Admin',
          tabBarStyle: { display: 'none' },
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({});
