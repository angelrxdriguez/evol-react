import Constants from 'expo-constants';
import { Platform } from 'react-native';

function obtenerHostLocal() {
  const hostUri = Constants.expoConfig?.hostUri ?? '';
  const host = hostUri.split(':')[0];

  if (host) {
    return host;
  }

  if (Platform.OS === 'android') {
    return '10.0.2.2';
  }

  return 'localhost';
}

export const URL_API =
  process.env.EXPO_PUBLIC_API_URL?.trim() || `http://${obtenerHostLocal()}:3003`;

export async function leerJsonSeguro<T = Record<string, unknown>>(response: Response): Promise<T> {
  const texto = await response.text();

  if (!texto) {
    return {} as T;
  }

  try {
    return JSON.parse(texto) as T;
  } catch {
    return {} as T;
  }
}
