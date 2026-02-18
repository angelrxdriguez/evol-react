import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Pestaña = 'home' | 'inscribir' | 'mis-clases' | 'perfil';

type Props = {
  activa: Pestaña;
};

type Opcion = {
  clave: Pestaña;
  texto: string;
  ruta: '/home' | '/inscribir-clase' | '/mis-clases' | '/perfil';
};

const OPCIONES: Opcion[] = [
  { clave: 'home', texto: 'Inicio', ruta: '/home' },
  { clave: 'inscribir', texto: 'Clases', ruta: '/inscribir-clase' },
  { clave: 'mis-clases', texto: 'Mis clases', ruta: '/mis-clases' },
  { clave: 'perfil', texto: 'Perfil', ruta: '/perfil' },
];

export default function BarraUsuario({ activa }: Props) {
  return (
    <View style={styles.contenedor}>
      {OPCIONES.map((opcion) => (
        <Pressable
          key={opcion.clave}
          style={[styles.boton, activa === opcion.clave ? styles.botonActivo : null]}
          onPress={() => router.replace(opcion.ruta)}>
          <Text style={[styles.texto, activa === opcion.clave ? styles.textoActivo : null]}>
            {opcion.texto}
          </Text>
        </Pressable>
      ))}
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
    paddingVertical: 9,
  },
  botonActivo: {
    borderColor: '#22c55e',
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
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
