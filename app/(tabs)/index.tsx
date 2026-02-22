import { router } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { leerJsonSeguro, URL_API } from '@/constants/api';
import { guardarUsuarioSesion, type UsuarioSesion } from '@/constants/sesion';

type UsuarioApi = {
  id?: string;
  nombreUsuario?: string;
  es_admin?: number;
  rol?: string;
  nombre?: string;
  apellidos?: string;
};

type RespuestaLogin = {
  ok?: boolean;
  error?: string;
  user?: UsuarioApi;
};

function esUsuarioAdmin(usuario?: UsuarioApi) {
  return Number(usuario?.es_admin) === 1;
}

function mapearUsuarioSesion(usuario?: UsuarioApi) {
  const id = String(usuario?.id || '').trim();

  if (!id) {
    return null;
  }

  const usuarioSesion: UsuarioSesion = {
    id,
    nombreUsuario: String(usuario?.nombreUsuario || '').trim(),
    nombre: String(usuario?.nombre || '').trim(),
    apellidos: String(usuario?.apellidos || '').trim(),
    es_admin: Number(usuario?.es_admin) === 1 ? 1 : 0,
    rol: String(usuario?.rol || 'user').trim() || 'user',
  };

  return usuarioSesion;
}

export default function InicioScreen() {
  const [usuarioEscrito, setUsuarioEscrito] = useState('');
  const [contrasenaEscrita, setContrasenaEscrita] = useState('');
  const [mensajeError, setMensajeError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function entrar() {
    if (cargando) {
      return;
    }

    setMensajeError('');
    setCargando(true);

    try {
      const response = await fetch(`${URL_API}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombreUsuario: usuarioEscrito.trim(),
          contrasena: contrasenaEscrita,
        }),
      });

      const data = await leerJsonSeguro<RespuestaLogin>(response);

      if (!response.ok || !data.ok) {
        setMensajeError(data.error || `No se pudo iniciar sesion (HTTP ${response.status})`);
        return;
      }

      const usuarioSesion = mapearUsuarioSesion(data.user);

      if (!usuarioSesion) {
        setMensajeError('No se pudo guardar la sesion del usuario');
        return;
      }

      guardarUsuarioSesion(usuarioSesion);

      if (esUsuarioAdmin(data.user)) {
        router.replace('/clases');
        return;
      }

      router.replace('/home');
    } catch {
      setMensajeError('Error de red al iniciar sesion');
    } finally {
      setCargando(false);
    }
  }

  return (
    <ImageBackground
      source={require('@/assets/images/banner_login2.jpg')}
      style={styles.fondo}
      resizeMode="cover">
      <View style={styles.capaOscura}>
        <KeyboardAvoidingView
          style={styles.centrado}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.tarjeta}>
            <View style={styles.contenedorLogo}>
              <Image source={require('@/assets/images/evol_negro.png')} style={styles.logo} />
            </View>

            <View style={styles.cajaLogin}>
              <Text style={styles.titulo}>Iniciar sesion</Text>

              <Text style={styles.etiqueta}>Usuario</Text>
              <TextInput
                style={styles.input}
                value={usuarioEscrito}
                onChangeText={setUsuarioEscrito}
                placeholder="Escribe tu usuario"
                placeholderTextColor="#95a0b1"
                autoCapitalize="none"
              />

              <Text style={styles.etiqueta}>Contrasena</Text>
              <TextInput
                style={styles.input}
                value={contrasenaEscrita}
                onChangeText={setContrasenaEscrita}
                placeholder="Escribe tu contrasena"
                placeholderTextColor="#95a0b1"
                secureTextEntry
              />

              {mensajeError ? <Text style={styles.textoError}>{mensajeError}</Text> : null}

              <Pressable style={styles.botonEntrar} onPress={entrar}>
                <Text style={styles.textoBoton}>{cargando ? 'Entrando...' : 'Entrar'}</Text>
              </Pressable>

              <Text style={styles.textoRegistro}>Aun no tienes cuenta?</Text>
              <Pressable onPress={() => router.push('/registro')}>
                <Text style={styles.enlaceRegistro}>Haz click aqui para registrarte</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  fondo: {
    flex: 1,
  },
  capaOscura: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    padding: 18,
    justifyContent: 'center',
  },
  centrado: {
    width: '100%',
  },
  tarjeta: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#0b0f1a',
  },
  contenedorLogo: {
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 26,
    paddingHorizontal: 18,
  },
  logo: {
    width: 170,
    height: 56,
    resizeMode: 'contain',
  },
  cajaLogin: {
    paddingHorizontal: 20,
    paddingVertical: 22,
  },
  titulo: {
    color: '#22c55e',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  etiqueta: {
    color: '#22c55e',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    width: '100%',
    backgroundColor: '#122037',
    color: '#ffffff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    fontSize: 14,
  },
  textoError: {
    color: '#ffb4b4',
    marginBottom: 10,
  },
  botonEntrar: {
    width: '100%',
    backgroundColor: '#22c55e',
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 11,
    marginTop: 4,
  },
  textoBoton: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  textoRegistro: {
    marginTop: 14,
    color: '#ffffff',
    textAlign: 'center',
    fontSize: 13,
  },
  enlaceRegistro: {
    marginTop: 4,
    color: '#22c55e',
    textAlign: 'center',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
