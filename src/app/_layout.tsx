import { DarkTheme, DefaultTheme, ThemeProvider, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme, Platform } from 'react-native';
import { useEffect } from 'react';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{
        headerStyle: { backgroundColor: colorScheme === 'dark' ? '#111' : '#fff' },
        headerTitleStyle: { paddingLeft: Platform.OS === 'web' ? 20 : 0 }
      }}>
        <Stack.Screen name="index" options={{ title: 'Hive Inspect Template Importer' }} />
        <Stack.Screen name="import" options={{ title: 'Import Template' }} />
        <Stack.Screen name="templates/[id]" options={{ title: 'Template Editor' }} />
      </Stack>
    </ThemeProvider>
  );
}
