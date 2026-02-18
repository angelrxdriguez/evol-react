import { router } from 'expo-router';
import { useEffect } from 'react';
import { Image, ImageBackground, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import BarraUsuario from '@/components/barra-usuario';
import { leerUsuarioSesion } from '@/constants/sesion';

export default function HomeScreen() {
  const usuario = leerUsuarioSesion();

  useEffect(() => {
    if (!usuario) {
      router.replace('/');
    }
  }, [usuario]);

  if (!usuario) {
    return null;
  }

  return (
    <SafeAreaView style={styles.pagina}>
      <ImageBackground
        source={require('@/assets/images/banner_login2.jpg')}
        style={styles.fondo}
        resizeMode="cover">
        <View style={styles.capaOscura}>
          <View style={styles.nav}>
            <Image source={require('@/assets/images/evol_negativo-zoom2.png')} style={styles.logo} />
          </View>

          <View style={styles.intro}>
            <Text style={styles.titulo}>VENTAJAS DE NUESTRA APP</Text>

            <View style={styles.grid}>
              <View style={styles.ventaja}>
                <Text style={styles.icono}>+</Text>
                <Text style={styles.textoVentaja}>Inscribete a clases en pocos pasos.</Text>
              </View>

              <View style={styles.ventaja}>
                <Text style={styles.icono}>OK</Text>
                <Text style={styles.textoVentaja}>Gestiona tus clases y horarios.</Text>
              </View>

              <View style={styles.ventaja}>
                <Text style={styles.icono}>!</Text>
                <Text style={styles.textoVentaja}>Consulta novedades y avisos del gimnasio.</Text>
              </View>
            </View>

            <Pressable style={styles.botonVerClases} onPress={() => router.replace('/inscribir-clase')}>
              <Text style={styles.textoBoton}>VER CLASES</Text>
            </Pressable>
          </View>
        </View>
      </ImageBackground>
      <BarraUsuario activa="home" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pagina: {
    flex: 1,
    backgroundColor: '#0b0f1a',
  },
  fondo: {
    flex: 1,
  },
  capaOscura: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingBottom: 76,
  },
  nav: {
    backgroundColor: '#0b0f1a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  logo: {
    width: 95,
    height: 38,
    resizeMode: 'contain',
  },
  intro: {
    marginTop: 34,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 18,
    backgroundColor: 'rgba(11, 15, 26, 0.78)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  titulo: {
    color: '#22c55e',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
  },
  grid: {
    gap: 10,
  },
  ventaja: {
    borderWidth: 1,
    borderColor: '#ffffff',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  icono: {
    color: '#22c55e',
    fontSize: 16,
    fontWeight: '700',
    minWidth: 22,
    textAlign: 'center',
  },
  textoVentaja: {
    color: '#ffffff',
    fontSize: 14,
    flex: 1,
    lineHeight: 19,
  },
  botonVerClases: {
    marginTop: 18,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ffffff',
    alignItems: 'center',
    paddingVertical: 12,
  },
  textoBoton: {
    color: '#ffffff',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
