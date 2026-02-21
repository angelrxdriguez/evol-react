import { router } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { leerJsonSeguro, URL_API } from '@/constants/api';

type RespuestaRegistro = {
  ok?: boolean;
  error?: string;
};

export default function RegistroScreen() {
  const [usuarioNuevo, setUsuarioNuevo] = useState('');
  const [nombreNuevo, setNombreNuevo] = useState('');
  const [apellidosNuevos, setApellidosNuevos] = useState('');
  const [contrasenaNueva, setContrasenaNueva] = useState('');
  const [repetirContrasenaNueva, setRepetirContrasenaNueva] = useState('');
  const [mensajeError, setMensajeError] = useState('');
  const [cargando, setCargando] = useState(false);

  function validarContrasenas() {
    if (!contrasenaNueva) {
      return 'La contraseña es obligatoria';
    }

    if (contrasenaNueva.length < 6) {
      return 'La contraseña debe tener al menos 6 caracteres';
    }

    if (!repetirContrasenaNueva) {
      return 'Repite la contraseña';
    }

    if (contrasenaNueva !== repetirContrasenaNueva) {
      return 'Las contraseñas no coinciden';
    }

    return '';
  }

  async function crearCuenta() {
    if (cargando) {
      return;
    }

    const errorContrasena = validarContrasenas();

    if (errorContrasena) {
      setMensajeError(errorContrasena);
      return;
    }

    setMensajeError('');
    setCargando(true);

    try {
      const response = await fetch(`${URL_API}/registro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombreUsuario: usuarioNuevo.trim(),
          nombre: nombreNuevo.trim(),
          apellidos: apellidosNuevos.trim(),
          contrasena: contrasenaNueva,
        }),
      });

      const data = await leerJsonSeguro<RespuestaRegistro>(response);

      if (!response.ok || data.ok === false) {
        setMensajeError(data.error || 'No se pudo crear la cuenta');
        return;
      }

      router.replace('/');
    } catch {
      setMensajeError('Error de red al crear usuario');
    } finally {
      setCargando(false);
    }
  }

  return (
    <ImageBackground
      source={require('@/assets/images/evol_negro.png')}
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

            <ScrollView style={styles.cajaFormulario} keyboardShouldPersistTaps="handled">
              <Text style={styles.titulo}>Bienvenido</Text>

              <Text style={styles.etiqueta}>Nombre de usuario</Text>
              <TextInput style={styles.input}value={usuarioNuevo}onChangeText={setUsuarioNuevo}placeholder="Escribe tu nombre de usuario"placeholderTextColor="#95a0b1"autoCapitalize="none"/>

              <Text style={styles.etiqueta}>Nombre</Text>
              <TextInput style={styles.input}value={nombreNuevo}onChangeText={setNombreNuevo}placeholder="Escribe tu nombre"placeholderTextColor="#95a0b1"/>
              <Text style={styles.etiqueta}>Apellidos</Text>
              <TextInput style={styles.input}value={apellidosNuevos}onChangeText={setApellidosNuevos}placeholder="Escribe tus apellidos"placeholderTextColor="#95a0b1"/>

              <Text style={styles.etiqueta}>Contraseña</Text>
              <TextInput style={styles.input}value={contrasenaNueva}onChangeText={setContrasenaNueva}placeholder="Escribe tu contraseña"placeholderTextColor="#95a0b1"secureTextEntry/>

              <Text style={styles.etiqueta}>Repetir contraseña</Text>
              <TextInput style={styles.input}value={repetirContrasenaNueva}onChangeText={setRepetirContrasenaNueva}placeholder="Repite tu contraseña"placeholderTextColor="#95a0b1"secureTextEntry/>

              <Pressable style={styles.boton} onPress={crearCuenta}>
                <Text style={styles.textoBoton}>{cargando ? 'Creando...' : 'Crear cuenta'}</Text>
              </Pressable>

              {mensajeError ? <Text style={styles.textoError}>{mensajeError}</Text> : null}

              <Text style={styles.textoInicio}>¿Ya tienes cuenta?</Text>
              <Pressable onPress={() => router.replace('/')}>
                <Text style={styles.enlaceInicio}>Haz click aqui para iniciar sesion</Text>
              </Pressable>
            </ScrollView>
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
    maxHeight: '95%',
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
    paddingVertical: 24,
    paddingHorizontal: 18,
  },
  logo: {
    width: 170,
    height: 56,
    resizeMode: 'contain',
  },
  cajaFormulario: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    maxHeight: 560,
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
  boton: {
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
  textoError: {
    marginTop: 12,
    textAlign: 'center',
    color: '#f87171',
    fontSize: 14,
  },
  textoInicio: {
    marginTop: 14,
    textAlign: 'center',
    color: '#ffffff',
    fontSize: 14,
  },
  enlaceInicio: {
    marginTop: 4,
    textAlign: 'center',
    color: '#22c55e',
    fontSize: 14,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
