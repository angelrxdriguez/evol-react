import { router } from 'expo-router';
import { useEffect } from 'react';
import { Image, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import BarraUsuario from '@/components/barra-usuario';
import { limpiarUsuarioSesion, leerUsuarioSesion } from '@/constants/sesion';

function crearDatosInvitado() {
  return {
    nombreUsuario: 'Invitado',
    nombreCompleto: 'Invitado',
  };
}

function leerDatosUsuario() {
  const usuario = leerUsuarioSesion();

  if (!usuario) {
    return crearDatosInvitado();
  }

  const nombreUsuario = String(usuario.nombreUsuario || 'Invitado').trim() || 'Invitado';
  const nombre = String(usuario.nombre || '').trim();
  const apellidos = String(usuario.apellidos || '').trim();
  const nombreCompleto = `${nombre} ${apellidos}`.trim() || nombreUsuario;

  return {
    nombreUsuario,
    nombreCompleto,
  };
}

export default function PerfilScreen() {
  const usuario = leerUsuarioSesion();
  const datosUsuario = leerDatosUsuario();

  useEffect(() => {
    if (!usuario) {
      router.replace('/');
    }
  }, [usuario]);

  if (!usuario) {
    return null;
  }

  function cerrarSesion() {
    limpiarUsuarioSesion();
    router.replace('/');
  }

  return (
    <SafeAreaView style={styles.pagina}>
      <View style={styles.nav}>
        <Image source={require('@/assets/images/evol_negativo-zoom2.png')} style={styles.logoNav} />
      </View>

      <View style={styles.contenido}>
        <View style={styles.tarjetaPerfil}>
          <Text style={styles.titulo}>Mi perfil</Text>
          <Image source={require('@/assets/images/evol_positivo.png')} style={styles.logoPerfil} />

          <Text style={styles.etiqueta}>Nombre de usuario:</Text>
          <Text style={styles.valor}>{datosUsuario.nombreUsuario}</Text>

          <Text style={styles.etiqueta}>Nombre completo:</Text>
          <Text style={styles.valor}>{datosUsuario.nombreCompleto}</Text>

          <Pressable style={styles.botonCerrarSesion} onPress={cerrarSesion}>
            <Text style={styles.textoBoton}>Cerrar sesion</Text>
          </Pressable>
        </View>
      </View>
      <BarraUsuario activa="perfil" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pagina: {
    flex: 1,
    backgroundColor: '#0b0f1a',
  },
  nav: {
    backgroundColor: '#0b0f1a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  logoNav: {
    width: 95,
    height: 38,
    resizeMode: 'contain',
  },
  contenido: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingBottom: 88,
  },
  tarjetaPerfil: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d9f8e4',
    borderRadius: 14,
    padding: 24,
  },
  titulo: {
    marginBottom: 16,
    fontSize: 24,
    color: '#000000',
    fontWeight: '700',
  },
  logoPerfil: {
    width: 200,
    height: 64,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginBottom: 16,
  },
  etiqueta: {
    marginBottom: 3,
    fontSize: 13,
    color: '#6b7280',
  },
  valor: {
    marginBottom: 16,
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
  },
  botonCerrarSesion: {
    width: '100%',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#22c55e',
  },
  textoBoton: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
});
