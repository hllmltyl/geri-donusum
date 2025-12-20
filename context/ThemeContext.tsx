import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
    themeMode: ThemeMode;
    colorScheme: 'light' | 'dark'; // The actual active scheme
    setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
    themeMode: 'system',
    colorScheme: 'light',
    setThemeMode: () => { },
});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [themeMode, setThemeMode] = useState<ThemeMode>('system');
    const systemColorScheme = useRNColorScheme();
    const [activeScheme, setActiveScheme] = useState<'light' | 'dark'>(systemColorScheme || 'light');

    useEffect(() => {
        // Load saved theme
        (async () => {
            try {
                const savedTheme = await AsyncStorage.getItem('themeMode');
                if (savedTheme) {
                    setThemeMode(savedTheme as ThemeMode);
                }
            } catch (e) {
                console.error("Failed to load theme", e);
            }
        })();
    }, []);

    useEffect(() => {
        // Save theme changes
        AsyncStorage.setItem('themeMode', themeMode).catch(e => console.error(e));

        // Determine active scheme
        if (themeMode === 'system') {
            setActiveScheme(systemColorScheme || 'light');
        } else {
            setActiveScheme(themeMode);
        }
    }, [themeMode, systemColorScheme]);

    return (
        <ThemeContext.Provider value={{ themeMode, colorScheme: activeScheme, setThemeMode }}>
            {children}
        </ThemeContext.Provider>
    );
}
