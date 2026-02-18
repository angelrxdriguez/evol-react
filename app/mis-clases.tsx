import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import BarraUsuario from '@/components/barra-usuario';
import { leerJsonSeguro, URL_API } from '@/constants/api';
import { leerUsuarioSesion } from '@/constants/sesion';

type IdGeneral = string | { $oid?: string };

type ClaseApi = {
  _id?: IdGeneral;
  nombre?: string;
  descripcion?: string;
  fechaHora?: string;
  imagen?: string;
  cancelaciones?: IdGeneral[];
};

type RespuestaMisClases = {
  ok?: boolean;
  error?: string;
  clases?: ClaseApi[];
};

type RespuestaCancelar = {
  ok?: boolean;
  error?: string;
  cancelada?: boolean;
  cancelacionFueraDePlazo?: boolean;
};

function normalizarId(valor: IdGeneral | undefined) {
  if (typeof valor === 'string') {
    return valor.trim();
  }

  if (valor && typeof valor === 'object' && typeof valor.$oid === 'string') {
    return valor.$oid.trim();
  }

  return '';
}

function obtenerIdClase(clase: ClaseApi) {
  return normalizarId(clase._id);
}

function obtenerHoraLocal(fechaHora?: string) {
  const fecha = new Date(fechaHora || '');

  if (Number.isNaN(fecha.getTime())) {
    return '-';
  }

  return fecha.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function obtenerFechaHumana(fechaHora?: string) {
  const fecha = new Date(fechaHora || '');

  if (Number.isNaN(fecha.getTime())) {
    return '-';
  }

  const textoFecha = fecha.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return textoFecha.charAt(0).toUpperCase() + textoFecha.slice(1);
}

function faltan15(fechaHora?: string) {
  const fechaClase = new Date(fechaHora || '');

  if (Number.isNaN(fechaClase.getTime())) {
    return false;
  }

  const ahora = new Date();
  const diferenciaMs = fechaClase.getTime() - ahora.getTime();
  const quinceMinutosMs = 15 * 60 * 1000;

  return diferenciaMs > quinceMinutosMs;
}

function obtenerRutaImagen(nombreImagen?: string) {
  const nombre = String(nombreImagen || '').trim();

  if (!nombre) {
    return '';
  }

  return `${URL_API}/uploads/${encodeURIComponent(nombre)}`;
}

export default function MisClasesScreen() {
  const usuario = leerUsuarioSesion();
  const usuarioId = String(usuario?.id || '').trim();
  const [listaClases, setListaClases] = useState<ClaseApi[]>([]);
  const [cargando, setCargando] = useState(false);
  const [mensajeErrorCarga, setMensajeErrorCarga] = useState('');
  const [mensajeOk, setMensajeOk] = useState('');
  const [listaClasesCancelando, setListaClasesCancelando] = useState<string[]>([]);

  function estaCancelando(idClase: string) {
    return listaClasesCancelando.includes(idClase);
  }

  function usuarioEstaEnCancelaciones(clase: ClaseApi) {
    if (!usuarioId) {
      return false;
    }

    const cancelaciones = Array.isArray(clase?.cancelaciones) ? clase.cancelaciones : [];

    for (const idCancelacion of cancelaciones) {
      if (normalizarId(idCancelacion) === usuarioId) {
        return true;
      }
    }

    return false;
  }

  const cargarMisClases = useCallback(async () => {
    setMensajeErrorCarga('');
    setCargando(true);

    try {
      const response = await fetch(`${URL_API}/clases/usuario/${encodeURIComponent(usuarioId)}`);
      const data = await leerJsonSeguro<RespuestaMisClases>(response);

      if (!response.ok || data?.ok === false) {
        setMensajeErrorCarga(data?.error || 'No se pudieron cargar tus clases');
        setListaClases([]);
        return;
      }

      if (Array.isArray(data?.clases)) {
        setListaClases(data.clases);
      } else {
        setListaClases([]);
      }
    } catch {
      setMensajeErrorCarga('Error de red al cargar tus clases');
      setListaClases([]);
    } finally {
      setCargando(false);
    }
  }, [usuarioId]);

  useEffect(() => {
    if (!usuarioId) {
      router.replace('/');
      return;
    }

    void cargarMisClases();
  }, [usuarioId, cargarMisClases]);

  async function cancelarInscripcion(clase: ClaseApi) {
    setMensajeOk('');

    const idClase = obtenerIdClase(clase);

    if (!usuarioId || !idClase || estaCancelando(idClase)) {
      return;
    }

    const cancelacionFueraDePlazo = !faltan15(clase?.fechaHora);
    setListaClasesCancelando((anterior) => [...anterior, idClase]);

    try {
      const response = await fetch(
        `${URL_API}/clases/${encodeURIComponent(idClase)}/cancelar-inscripcion`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            usuarioId,
            cancelacionFueraDePlazo,
          }),
        }
      );

      const data = await leerJsonSeguro<RespuestaCancelar>(response);

      if (!response.ok || data?.ok === false) {
        return;
      }

      if (data?.cancelada && !data?.cancelacionFueraDePlazo) {
        setMensajeOk('Inscripcion cancelada');
      } else if (!data?.cancelacionFueraDePlazo) {
        setMensajeOk('No estabas inscrito en esta clase');
      }

      await cargarMisClases();
    } catch {
      return;
    } finally {
      setListaClasesCancelando((anterior) => anterior.filter((valor) => valor !== idClase));
    }
  }

  if (!usuarioId) {
    return null;
  }

  return (
    <SafeAreaView style={styles.pagina}>
      <View style={styles.nav}>
        <Image source={require('@/assets/images/evol_negativo-zoom2.png')} style={styles.logo} />
      </View>

      <ScrollView contentContainerStyle={styles.contenido}>
        <Text style={styles.titulo}>Mis clases</Text>

        {mensajeOk ? <Text style={styles.estadoOk}>{mensajeOk}</Text> : null}
        {cargando ? (
          <View style={styles.carga}>
            <ActivityIndicator color="#22c55e" />
            <Text style={styles.estado}>Cargando clases...</Text>
          </View>
        ) : null}
        {!cargando && !!mensajeErrorCarga ? <Text style={styles.estadoError}>{mensajeErrorCarga}</Text> : null}
        {!cargando && !mensajeErrorCarga && !listaClases.length ? (
          <Text style={styles.estado}>No tienes clases inscritas.</Text>
        ) : null}

        {!cargando && !mensajeErrorCarga && !!listaClases.length
          ? listaClases.map((clase, indice) => {
              const idClase = obtenerIdClase(clase);
              const rutaImagen = obtenerRutaImagen(clase.imagen);
              const cancelando = estaCancelando(idClase);

              return (
                <View key={idClase || `${String(clase.nombre || '')}-${indice}`} style={styles.tarjeta}>
                  {rutaImagen ? <Image source={{ uri: rutaImagen }} style={styles.imagen} /> : null}

                  <View style={styles.info}>
                    <Text style={styles.nombreClase}>{clase.nombre || 'Clase'}</Text>
                    <Text style={styles.descripcion}>{clase.descripcion || 'Sin descripcion'}</Text>

                    <View style={styles.fechaCaja}>
                      <Text style={styles.fechaEtiqueta}>Fecha de la clase</Text>
                      <Text style={styles.fechaValor}>{obtenerFechaHumana(clase.fechaHora)}</Text>
                      <Text style={styles.fechaHora}>Hora: {obtenerHoraLocal(clase.fechaHora)}</Text>
                    </View>

                    {usuarioEstaEnCancelaciones(clase) ? (
                      <Text style={styles.textoCancelada}>Cancelacion efectuada</Text>
                    ) : (
                      <Pressable
                        style={[styles.botonCancelar, cancelando ? styles.botonDeshabilitado : null]}
                        onPress={() => cancelarInscripcion(clase)}
                        disabled={cancelando}>
                        <Text style={styles.textoBotonCancelar}>
                          {cancelando ? 'Cancelando...' : 'Cancelar'}
                        </Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              );
            })
          : null}
      </ScrollView>
      <BarraUsuario activa="mis-clases" />
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
  logo: {
    width: 95,
    height: 38,
    resizeMode: 'contain',
  },
  contenido: {
    padding: 16,
    paddingBottom: 88,
  },
  titulo: {
    marginTop: 2,
    marginBottom: 14,
    color: '#22c55e',
    fontSize: 28,
    fontWeight: '700',
  },
  estado: {
    marginBottom: 10,
    color: '#d9e4f0',
    fontSize: 15,
  },
  estadoError: {
    marginBottom: 10,
    color: '#ffb4b4',
    fontSize: 15,
  },
  estadoOk: {
    marginBottom: 10,
    color: '#22c55e',
    fontSize: 15,
  },
  carga: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tarjeta: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 14,
  },
  imagen: {
    width: '100%',
    height: 180,
    backgroundColor: '#101827',
  },
  info: {
    padding: 14,
  },
  nombreClase: {
    marginBottom: 8,
    color: '#22c55e',
    fontSize: 18,
    fontWeight: '700',
  },
  descripcion: {
    marginBottom: 8,
    color: '#f4f8ff',
    lineHeight: 18,
  },
  fechaCaja: {
    marginBottom: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ffffff',
    borderRadius: 4,
    backgroundColor: 'rgb(16, 19, 32)',
  },
  fechaEtiqueta: {
    marginBottom: 4,
    color: '#c5c5c5',
    fontSize: 11,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  fechaValor: {
    marginBottom: 4,
    color: '#9dc7ff',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  fechaHora: {
    color: '#c5c5c5',
    fontSize: 13,
  },
  textoCancelada: {
    marginBottom: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#ffffff',
    borderRadius: 6,
    color: '#22c55e',
    textAlign: 'center',
  },
  botonCancelar: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ffffff',
    borderRadius: 6,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  botonDeshabilitado: {
    opacity: 0.65,
  },
  textoBotonCancelar: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
