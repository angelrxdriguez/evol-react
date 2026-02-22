import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  ToastAndroid,
  View,
} from 'react-native';

import BarraUsuario from '@/components/barra-usuario';
import { leerJsonSeguro, URL_API } from '@/constants/api';
import { leerUsuarioSesion } from '@/constants/sesion';

type IdClase = string | { $oid?: string };
type IdUsuario = string | { $oid?: string };

type ClaseApi = {
  _id?: IdClase;
  nombre?: string;
  descripcion?: string;
  fechaHora?: string;
  plazasMaximas?: number;
  imagen?: string;
  inscritos?: IdUsuario[];
};

type RespuestaClases = {
  ok?: boolean;
  error?: string;
  clases?: ClaseApi[];
};

type RespuestaInscripcion = {
  ok?: boolean;
  error?: string;
  yaInscrito?: boolean;
};

function obtenerFechaLocalSinHora(valor: string | Date | undefined) {
  const fecha = new Date(valor || '');

  if (Number.isNaN(fecha.getTime())) {
    return '';
  }

  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');

  return `${anio}-${mes}-${dia}`;
}

function obtenerHoraLocal(valor?: string) {
  const fecha = new Date(valor || '');

  if (Number.isNaN(fecha.getTime())) {
    return '-';
  }

  return fecha.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function fechaEntendible(valor?: string) {
  const fecha = new Date(valor || '');

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

function normalizarId(valor: IdClase | IdUsuario | undefined) {
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

function obtenerPlazasMaximas(clase: ClaseApi) {
  const plazasMaximas = Number(clase?.plazasMaximas);

  if (!Number.isFinite(plazasMaximas) || plazasMaximas <= 0) {
    return 0;
  }

  return plazasMaximas;
}

function contarInscritos(clase: ClaseApi) {
  if (!Array.isArray(clase?.inscritos)) {
    return 0;
  }

  return clase.inscritos.length;
}

function obtenerPlazasRestantes(clase: ClaseApi) {
  const maximas = obtenerPlazasMaximas(clase);
  const inscritos = contarInscritos(clase);
  return Math.max(0, maximas - inscritos);
}

function obtenerRutaImagen(nombreImagen?: string) {
  const nombre = String(nombreImagen || '').trim();

  if (!nombre) {
    return '';
  }

  return `${URL_API}/uploads/${encodeURIComponent(nombre)}`;
}

export default function InscribirClaseScreen() {
  const usuario = leerUsuarioSesion();
  const usuarioId = String(usuario?.id || '').trim();
  const [clases, setClases] = useState<ClaseApi[]>([]);
  const [cargando, setCargando] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [okMsg, setOkMsg] = useState('');
  const [clasesInscribiendo, setClasesInscribiendo] = useState<string[]>([]);

  useEffect(() => {
    if (!usuarioId) {
      router.replace('/');
      return;
    }

    void cargarClasesHoy();
  }, [usuarioId]);

  const clasesHoy = useMemo(() => {
    const hoy = obtenerFechaLocalSinHora(new Date());
    const lista = clases.filter((clase) => obtenerFechaLocalSinHora(clase?.fechaHora) === hoy);
    lista.sort((a, b) => new Date(a.fechaHora || '').getTime() - new Date(b.fechaHora || '').getTime());
    return lista;
  }, [clases]);

  function usuarioYaInscrito(clase: ClaseApi) {
    if (!usuarioId) {
      return false;
    }

    const inscritos = Array.isArray(clase?.inscritos) ? clase.inscritos : [];

    for (const idInscrito of inscritos) {
      if (normalizarId(idInscrito) === usuarioId) {
        return true;
      }
    }

    return false;
  }

  function estaInscribiendo(idClase: string) {
    return clasesInscribiendo.includes(idClase);
  }

  async function cargarClasesHoy() {
    setErrorMsg('');
    setCargando(true);

    try {
      const response = await fetch(`${URL_API}/clases`);
      const data = await leerJsonSeguro<RespuestaClases>(response);

      if (!response.ok || data?.ok === false) {
        setErrorMsg(data?.error || 'No se pudieron cargar las clases');
        setClases([]);
        return;
      }

      if (Array.isArray(data?.clases)) {
        setClases(data.clases);
      } else {
        setClases([]);
      }
    } catch {
      setErrorMsg('Error de red al cargar clases');
      setClases([]);
    } finally {
      setCargando(false);
    }
  }

  async function inscribirse(clase: ClaseApi) {
    setErrorMsg('');
    setOkMsg('');

    const idClase = obtenerIdClase(clase);

    if (!usuarioId) {
      setErrorMsg('Debes iniciar sesion para inscribirte');
      return;
    }

    if (!idClase) {
      setErrorMsg('Clase invalida');
      return;
    }

    if (usuarioYaInscrito(clase) || estaInscribiendo(idClase)) {
      return;
    }

    setClasesInscribiendo((anterior) => [...anterior, idClase]);

    try {
      const response = await fetch(`${URL_API}/clases/${encodeURIComponent(idClase)}/inscribirse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuarioId }),
      });

      const data = await leerJsonSeguro<RespuestaInscripcion>(response);

      if (!response.ok || data?.ok === false) {
        setErrorMsg(data?.error || 'No se pudo completar la inscripcion');
        return;
      }

      if (data?.yaInscrito) {
        setOkMsg('Ya estabas inscrito en esta clase');
      } else {
        setOkMsg('Inscripcion realizada');
        ToastAndroid.show('Inscrito correctamente !', ToastAndroid.SHORT);
      }

      await cargarClasesHoy();
    } catch {
      setErrorMsg('Error de red al inscribirse');
    } finally {
      setClasesInscribiendo((anterior) => anterior.filter((valor) => valor !== idClase));
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
        <Text style={styles.titulo}>Clases Disponibles</Text>

        {okMsg ? <Text style={styles.estadoOk}>{okMsg}</Text> : null}
        {cargando ? (
          <View style={styles.carga}>
            <ActivityIndicator color="#22c55e" />
            <Text style={styles.estado}>Cargando clases...</Text>
          </View>
        ) : null}
        {!cargando && !!errorMsg ? <Text style={styles.estadoError}>{errorMsg}</Text> : null}
        {!cargando && !errorMsg && !clasesHoy.length ? (
          <Text style={styles.estado}>Hoy no hay clases activas.</Text>
        ) : null}

        {!cargando && !errorMsg && !!clasesHoy.length
          ? clasesHoy.map((clase, indice) => {
              const idClase = obtenerIdClase(clase);
              const rutaImagen = obtenerRutaImagen(clase.imagen);
              const ocupado = usuarioYaInscrito(clase) || estaInscribiendo(idClase);

              return (
                <View key={idClase || `${String(clase.nombre || '')}-${indice}`} style={styles.tarjeta}>
                  {rutaImagen ? <Image source={{ uri: rutaImagen }} style={styles.imagen} /> : null}

                  <View style={styles.info}>
                    <Text style={styles.nombreClase}>{clase.nombre || 'Clase'}</Text>
                    <Text style={styles.descripcion}>{clase.descripcion || 'Sin descripcion'}</Text>

                    <View style={styles.fechaCaja}>
                      <Text style={styles.fechaEtiqueta}>Fecha de la clase</Text>
                      <Text style={styles.fechaValor}>{fechaEntendible(clase.fechaHora)}</Text>
                      <Text style={styles.fechaHora}>Hora: {obtenerHoraLocal(clase.fechaHora)}</Text>
                    </View>

                    <Text style={styles.dato}>Plazas: {clase.plazasMaximas ?? '-'}</Text>
                    <Text style={styles.restantes}>
                      {obtenerPlazasRestantes(clase)} RESTANTES
                    </Text>

                    <Pressable
                      style={[styles.botonInscribirse, ocupado ? styles.botonDeshabilitado : null]}
                      onPress={() => inscribirse(clase)}
                      disabled={ocupado}>
                      <Text style={styles.textoBotonInscribirse}>
                        {usuarioYaInscrito(clase)
                          ? 'Inscrito'
                          : estaInscribiendo(idClase)
                            ? 'Inscribiendo...'
                            : 'Inscribirse'}
                      </Text>
                    </Pressable>

                    <Text style={styles.subtexto}>
                      Controla tu asistencia en{' '}
                      <Text style={styles.subenlace} onPress={() => router.replace('/mis-clases')}>
                        Mis clases
                      </Text>
                    </Text>
                  </View>
                </View>
              );
            })
          : null}
      </ScrollView>
      <BarraUsuario activa="inscribir" />
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
  dato: {
    marginBottom: 8,
    color: '#c7d2df',
    fontSize: 14,
  },
  fechaCaja: {
    marginBottom: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ffffff',
    borderRadius: 4,
    backgroundColor: '#172338',
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
  restantes: {
    marginBottom: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    color: '#22c55e',
    backgroundColor: '#172338',
    fontWeight: '700',
    textAlign: 'center',
  },
  botonInscribirse: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#22c55e',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    marginBottom: 8,
  },
  botonDeshabilitado: {
    opacity: 0.55,
  },
  textoBotonInscribirse: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  subtexto: {
    color: '#d9e4f0',
    fontSize: 12,
  },
  subenlace: {
    color: '#22c55e',
    textDecorationLine: 'underline',
  },
});
