import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="registro" options={{ headerShown: false }} />
        <Stack.Screen name="clases" options={{ headerShown: false }} />
        <Stack.Screen name="home" options={{ headerShown: false }} />
        <Stack.Screen name="inscribir-clase" options={{ headerShown: false }} />
        <Stack.Screen name="mis-clases" options={{ headerShown: false }} />
        <Stack.Screen name="perfil" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}
