/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

// Ana renkler - Geri dönüşüm teması
const primaryGreen = '#51A646';
const secondaryBrown = '#BCA47C';
const neutralGray = '#6C6C74';

// Açık tonlar
const lightGreen = '#7BC67A';
const lightBrown = '#D4C4A0';
const lightGray = '#9A9AA3';

// Koyu tonlar
const darkGreen = '#3A7A2F';
const darkBrown = '#8B7355';
const darkGray = '#4A4A52';

export const Colors = {
  light: {
    text: '#2C2C2C',
    background: '#FFFFFF',
    tint: primaryGreen,
    icon: neutralGray,
    tabIconDefault: neutralGray,
    tabIconSelected: primaryGreen,
    primary: primaryGreen,
    secondary: secondaryBrown,
    neutral: neutralGray,
    lightPrimary: lightGreen,
    lightSecondary: lightBrown,
    lightNeutral: lightGray,
    darkPrimary: darkGreen,
    darkSecondary: darkBrown,
    darkNeutral: darkGray,
    card: '#FFFFFF',
    border: lightGray,
    notification: primaryGreen,
    success: primaryGreen,
    warning: secondaryBrown,
    error: '#E74C3C',
    inputBackground: '#F5F5F5',
    placeholder: '#9E9E9E',
  },
  dark: {
    text: '#FFFFFF',
    background: '#1A1A1A',
    tint: lightGreen,
    icon: lightGray,
    tabIconDefault: lightGray,
    tabIconSelected: lightGreen,
    primary: lightGreen,
    secondary: lightBrown,
    neutral: lightGray,
    lightPrimary: '#9DD89C',
    lightSecondary: '#E8DCC0',
    lightNeutral: '#B8B8C0',
    darkPrimary: darkGreen,
    darkSecondary: darkBrown,
    darkNeutral: darkGray,
    card: '#2A2A2A',
    border: darkGray,
    notification: lightGreen,
    success: lightGreen,
    warning: lightBrown,
    error: '#FF6B6B',
    inputBackground: '#333333',
    placeholder: '#AAAAAA',
  },
};
