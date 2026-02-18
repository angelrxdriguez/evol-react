import { router } from 'expo-router';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

type Pestana = 'home' | 'inscribir' | 'mis-clases' | 'perfil';

type Props = {
  activa: Pestana;
};

type Opcion = {
  clave: Pestana;
  texto: string;
  ruta: '/home' | '/inscribir-clase' | '/mis-clases' | '/perfil';
  icono: ReturnType<typeof require>;
};

const OPCIONES: Opcion[] = [
  { clave: 'home', texto: 'Inicio', ruta: '/home', icono: require('@/assets/ico/inicio.png') },
  { clave: 'inscribir', texto: 'Clases', ruta: '/inscribir-clase', icono: require('@/assets/ico/clases.png') },
  {
    clave: 'mis-clases',
    texto: 'Mis clases',
    ruta: '/mis-clases',
    icono: require('@/assets/ico/misclases.png'),
  },
  { clave: 'perfil', texto: 'Perfil', ruta: '/perfil', icono: require('@/assets/ico/perfil.png') },
];

export default function BarraUsuario({ activa }: Props) {
  return (
    <View style={styles.contenedor}>
      {OPCIONES.map((opcion) => {
        const estaActiva = activa === opcion.clave;

        return (
          <Pressable
            key={opcion.clave}
            style={[styles.boton, estaActiva ? styles.botonActivo : null]}
            onPress={() => router.replace(opcion.ruta)}>
            <Image source={opcion.icono} style={[styles.icono, estaActiva ? styles.iconoActivo : null]} />
            <Text style={[styles.texto, estaActiva ? styles.textoActivo : null]}>{opcion.texto}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    backgroundColor: '#0b0f1a',
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 8,
    paddingHorizontal: 8,
    gap: 6,
  },
  boton: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    gap: 3,
  },
  botonActivo: {
    borderColor: '#22c55e',
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
  },
  icono: {
    width: 18,
    height: 18,
    resizeMode: 'contain',
    opacity: 0.85,
  },
  iconoActivo: {
    opacity: 1,
  },
  texto: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  textoActivo: {
    color: '#22c55e',
  },
});
