import { DarkTheme, DefaultTheme, ThemeProvider, Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme, Platform, TouchableOpacity } from 'react-native';
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
          <TouchableOpacity onPress={() => router.replace('/dashboard')} style={{ marginLeft: Platform.OS === 'web' ? 20 : 10, marginRight: 10 }}>
            <ThemedText type="link">← Dashboard</ThemedText>
          </TouchableOpacity>
        ),
        headerStyle: { backgroundColor: colorScheme === 'dark' ? '#111' : '#fff' },
        headerTitleStyle: { paddingLeft: 0 }
      }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="dashboard" options={{ title: 'Templates', headerLeft: () => null }} />
        <Stack.Screen name="import" options={{ title: 'Import Template' }} />
        <Stack.Screen name="templates/[id]" options={{ title: 'Template Editor' }} />
      </Stack>
    </ThemeProvider>
  );
}
