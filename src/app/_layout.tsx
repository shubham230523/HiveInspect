import { DarkTheme, DefaultTheme, ThemeProvider, Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme, Platform, TouchableOpacity, View } from 'react-native';
import { useEffect } from 'react';
import { ThemedText } from '@/components/themed-text';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => router.replace('/dashboard')}
            style={{
              marginLeft: Platform.OS === 'web' ? 40 : 10,
              marginRight: 20,
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 10,
            }}
          >
            <ThemedText type="linkPrimary">← Dashboard</ThemedText>
          </TouchableOpacity>
        ),
        headerStyle: {
          backgroundColor: colorScheme === 'dark' ? '#111' : '#fff',
        },
        headerShadowVisible: false,
        headerTitle: () => null, // Explicitly remove the title text
      }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="dashboard" options={{ headerLeft: () => null }} />
        <Stack.Screen name="import" options={{ }} />
        <Stack.Screen name="templates/[id]" options={{ }} />
      </Stack>
    </ThemeProvider>
  );
}
