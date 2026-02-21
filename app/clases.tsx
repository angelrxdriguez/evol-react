import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

import { leerJsonSeguro, URL_API } from '@/constants/api';

type IdClase = string | { $oid?: string };

type ClaseApi = {
  _id?: IdClase;
  nombre?: string;
  descripcion?: string;
  fechaHora?: string;
  plazasMaximas?: number;
  inscritos?: unknown[];
};

type RespuestaClases = {
  ok?: boolean;
  error?: string;
  clases?: ClaseApi[];
};

type RespuestaCrearClase = {
  ok?: boolean;
  error?: string;
};

type RespuestaInscritos = {
  ok?: boolean;
  error?: string;
  usuarios?: string[];
};

type FormularioClase = {
  nombre: string;
  descripcion: string;
  fecha: string;
  hora: string;
  plazasMaximas: string;
};

const FORMULARIO_INICIAL: FormularioClase = {
  nombre: '',
  descripcion: '',
  fecha: '',
  hora: '',
  plazasMaximas: '20',
};

function obtenerIdClase(clase: ClaseApi) {
  const id = clase?._id;

  if (typeof id === 'string') {
    return id.trim();
  }

  if (id && typeof id === 'object' && typeof id.$oid === 'string') {
    return id.$oid.trim();
  }

  return '';
}

function obtenerPlazasMaximas(clase: ClaseApi) {
  const plazas = Number(clase.plazasMaximas);

  if (!Number.isFinite(plazas) || plazas <= 0) {
    return 0;
  }

  return plazas;
}

function contarInscritos(clase: ClaseApi) {
  if (!Array.isArray(clase.inscritos)) {
    return 0;
  }

  return clase.inscritos.length;
}

function obtenerPlazasRestantes(clase: ClaseApi) {
  const maximas = obtenerPlazasMaximas(clase);
  const inscritos = contarInscritos(clase);
  return Math.max(0, maximas - inscritos);
}

function crearFechaHoraIso(fecha: string, hora: string) {
  if (!fecha || !hora) {
    return '';
  }

  const fechaHora = new Date(`${fecha}T${hora}`);

  if (Number.isNaN(fechaHora.getTime())) {
    return '';
  }

  return fechaHora.toISOString();
}

function formatearFechaInput(fecha: Date) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

function formatearHoraInput(fecha: Date) {
  const horas = String(fecha.getHours()).padStart(2, '0');
  const minutos = String(fecha.getMinutes()).padStart(2, '0');
  return `${horas}:${minutos}`;
}

function obtenerFechaBaseFormulario(formulario: FormularioClase) {
  const fecha = formulario.fecha.trim();
  const hora = formulario.hora.trim() || '00:00';

  if (!fecha) {
    return new Date();
  }

  const fechaBase = new Date(`${fecha}T${hora}`);
  return Number.isNaN(fechaBase.getTime()) ? new Date() : fechaBase;
}

async function leerImagenEjemploBase64() {
  const asset = Asset.fromModule(require('@/assets/images/banner_login.jpg'));
  await asset.downloadAsync();
  const uri = asset.localUri || asset.uri;

  if (!uri) {
    return '';
  }

  return FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
}

export default function ClasesScreen() {
  const [listaClases, setListaClases] = useState<ClaseApi[]>([]);
  const [cargandoClases, setCargandoClases] = useState(false);
  const [guardandoClase, setGuardandoClase] = useState(false);
  const [mensajeError, setMensajeError] = useState('');
  const [mensajeOk, setMensajeOk] = useState('');
  const [formulario, setFormulario] = useState<FormularioClase>(FORMULARIO_INICIAL);
  const [modalVisible, setModalVisible] = useState(false);
  const [tituloModal, setTituloModal] = useState('Inscritos');
  const [listaInscritos, setListaInscritos] = useState<string[]>([]);
  const [cargandoInscritos, setCargandoInscritos] = useState(false);
  const [mensajeErrorInscritos, setMensajeErrorInscritos] = useState('');
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerModo, setPickerModo] = useState<'date' | 'time'>('date');
  const [pickerValor, setPickerValor] = useState(new Date());

  const formateadorFecha = useMemo(
    () =>
      new Intl.DateTimeFormat('es-ES', {
        dateStyle: 'short',
        timeStyle: 'short',
      }),
    []
  );

  function formatearFecha(fechaIso?: string) {
    if (!fechaIso) {
      return '-';
    }

    const fecha = new Date(fechaIso);

    if (Number.isNaN(fecha.getTime())) {
      return '-';
    }

    return formateadorFecha.format(fecha);
  }

  function limpiarMensajes() {
    setMensajeError('');
    setMensajeOk('');
  }

  function reiniciarFormulario() {
    setFormulario(FORMULARIO_INICIAL);
  }

  function abrirPicker(modo: 'date' | 'time') {
    setPickerModo(modo);
    setPickerValor(obtenerFechaBaseFormulario(formulario));
    setPickerVisible(true);
  }

  function manejarCambioPicker(event: DateTimePickerEvent, fechaSeleccionada?: Date) {
    if (!fechaSeleccionada || event.type === 'dismissed') {
      setPickerVisible(false);
      return;
    }

    setPickerValor(fechaSeleccionada);
    setFormulario((anterior) => ({
      ...anterior,
      fecha: pickerModo === 'date' ? formatearFechaInput(fechaSeleccionada) : anterior.fecha,
      hora: pickerModo === 'time' ? formatearHoraInput(fechaSeleccionada) : anterior.hora,
    }));
    setPickerVisible(false);
  }

  const cargarClases = useCallback(async () => {
    limpiarMensajes();
    setCargandoClases(true);

    try {
      const response = await fetch(`${URL_API}/clases`);
      const data = await leerJsonSeguro<RespuestaClases>(response);

      if (!response.ok || data.ok === false) {
        setMensajeError(data.error || 'No se pudieron cargar las clases');
        setListaClases([]);
        return;
      }

      if (Array.isArray(data.clases)) {
        setListaClases(data.clases);
        return;
      }

      setListaClases([]);
    } catch {
      setMensajeError('Error de red al cargar clases');
      setListaClases([]);
    } finally {
      setCargandoClases(false);
    }
  }, []);

  useEffect(() => {
    void cargarClases();
  }, [cargarClases]);

  function validarFormulario() {
    const nombre = formulario.nombre.trim();
    const descripcion = formulario.descripcion.trim();
    const fecha = formulario.fecha.trim();
    const hora = formulario.hora.trim();
    const plazas = Number(formulario.plazasMaximas);

    if (!nombre) {
      return 'El nombre es obligatorio';
    }

    if (!descripcion) {
      return 'La descripcion es obligatoria';
    }

    if (!fecha) {
      return 'La fecha es obligatoria';
    }

    if (!hora) {
      return 'La hora es obligatoria';
    }

    if (!Number.isInteger(plazas) || plazas <= 0) {
      return 'Plazas maximas debe ser un entero mayor que 0';
    }

    const fechaIso = crearFechaHoraIso(fecha, hora);

    if (!fechaIso) {
      return 'La fecha y hora no es valida';
    }

    return '';
  }

  async function crearClase() {
    if (guardandoClase) {
      return;
    }

    limpiarMensajes();

    const errorValidacion = validarFormulario();

    if (errorValidacion) {
      setMensajeError(errorValidacion);
      return;
    }

    setGuardandoClase(true);

    try {
      const fechaHoraIso = crearFechaHoraIso(formulario.fecha, formulario.hora);

      if (!fechaHoraIso) {
        setMensajeError('La fecha y hora no es valida');
        return;
      }

      const imagenContenido = await leerImagenEjemploBase64();

      if (!imagenContenido) {
        setMensajeError('No se pudo preparar la imagen de ejemplo');
        return;
      }

      const response = await fetch(`${URL_API}/clases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: formulario.nombre.trim(),
          descripcion: formulario.descripcion.trim(),
          fechaHora: fechaHoraIso,
          plazasMaximas: Number(formulario.plazasMaximas),
          imagen: 'banner_login.jpg',
          imagenContenido,
        }),
      });

      const data = await leerJsonSeguro<RespuestaCrearClase>(response);

      if (!response.ok || data.ok === false) {
        setMensajeError(data.error || 'No se pudo crear la clase');
        return;
      }

      setMensajeOk('Clase creada correctamente');
      reiniciarFormulario();
      await cargarClases();
    } catch {
      setMensajeError('Error al crear clase');
    } finally {
      setGuardandoClase(false);
    }
  }

  async function abrirModalInscritos(clase: ClaseApi) {
    const nombreClase = String(clase?.nombre || '').trim();
    setTituloModal(nombreClase ? `Inscritos en ${nombreClase}` : 'Inscritos');
    setListaInscritos([]);
    setMensajeErrorInscritos('');
    setModalVisible(true);
    setCargandoInscritos(true);

    try {
      const idClase = obtenerIdClase(clase);

      if (!idClase) {
        setMensajeErrorInscritos('Clase invalida');
        return;
      }

      const response = await fetch(`${URL_API}/clases/${encodeURIComponent(idClase)}/inscritos`);
      const data = await leerJsonSeguro<RespuestaInscritos>(response);

      if (!response.ok || data.ok === false) {
        setMensajeErrorInscritos(data.error || 'No se pudieron cargar los inscritos');
        return;
      }

      if (Array.isArray(data.usuarios)) {
        setListaInscritos(data.usuarios);
        return;
      }

      setListaInscritos([]);
    } catch {
      setMensajeErrorInscritos('Error de red al cargar inscritos');
    } finally {
      setCargandoInscritos(false);
    }
  }

  return (
    <SafeAreaView style={styles.pagina}>
      <ScrollView contentContainerStyle={styles.contenedor} keyboardShouldPersistTaps="handled">
        <View style={styles.cabecera}>
          <Text style={styles.textoAdmin}>AREA ADMIN</Text>
          <Text style={styles.titulo}>Gestion de clases</Text>
          <Text style={styles.subtitulo}>Visualiza y crea clases de forma rapida.</Text>
        </View>

        <View style={styles.panel}>
          <Text style={styles.tituloPanel}>Nueva clase</Text>

          <Text style={styles.etiqueta}>Nombre</Text>
          <TextInput
            style={styles.input}
            value={formulario.nombre}
            onChangeText={(valor) => setFormulario((anterior) => ({ ...anterior, nombre: valor }))}
            placeholder="Ej: Spinning - Nivel Medio"
            placeholderTextColor="#8392a7"
          />

          <Text style={styles.etiqueta}>Fecha</Text>
          <Pressable style={styles.inputSelector} onPress={() => abrirPicker('date')}>
            <Text style={formulario.fecha ? styles.textoSelector : styles.textoSelectorPlaceholder}>
              {formulario.fecha || 'Seleccionar fecha'}
            </Text>
          </Pressable>

          <Text style={styles.etiqueta}>Hora</Text>
          <Pressable style={styles.inputSelector} onPress={() => abrirPicker('time')}>
            <Text style={formulario.hora ? styles.textoSelector : styles.textoSelectorPlaceholder}>
              {formulario.hora || 'Seleccionar hora'}
            </Text>
          </Pressable>

          {pickerVisible ? (
            <DateTimePicker
              value={pickerValor}
              mode={pickerModo}
              is24Hour
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={manejarCambioPicker}
            />
          ) : null}

          <Text style={styles.etiqueta}>Plazas maximas</Text>
          <TextInput
            style={styles.input}
            value={formulario.plazasMaximas}
            onChangeText={(valor) =>
              setFormulario((anterior) => ({ ...anterior, plazasMaximas: valor }))
            }
            placeholder="20"
            placeholderTextColor="#8392a7"
            keyboardType="numeric"
          />

          <Text style={styles.etiqueta}>Descripcion</Text>
          <TextInput
            style={[styles.input, styles.inputDescripcion]}
            value={formulario.descripcion}
            onChangeText={(valor) =>
              setFormulario((anterior) => ({ ...anterior, descripcion: valor }))
            }
            placeholder="Descripcion de la clase"
            placeholderTextColor="#8392a7"
            multiline
            textAlignVertical="top"
          />

          <Text style={styles.textoAyuda}>La clase se creara con la imagen banner_login.jpg</Text>

          <Pressable style={styles.botonPrincipal} onPress={crearClase} disabled={guardandoClase}>
            <Text style={styles.textoBoton}>
              {guardandoClase ? 'Guardando...' : 'Crear clase'}
            </Text>
          </Pressable>

          {mensajeError ? <Text style={styles.mensajeError}>{mensajeError}</Text> : null}
          {mensajeOk ? <Text style={styles.mensajeOk}>{mensajeOk}</Text> : null}
        </View>

        <View style={styles.panel}>
          <View style={styles.cabeceraListado}>
            <View style={styles.titulosListado}>
              <Text style={styles.tituloPanel}>Listado de clases</Text>
              <Text style={styles.subtituloListado}>Clases activas e historicas.</Text>
            </View>
            <Pressable style={styles.botonSecundario} onPress={cargarClases} disabled={cargandoClases}>
              <Text style={styles.textoBotonSecundario}>
                {cargandoClases ? 'Cargando...' : 'Recargar'}
              </Text>
            </Pressable>
          </View>

          {cargandoClases ? (
            <View style={styles.bloqueCargando}>
              <ActivityIndicator color="#22c55e" />
              <Text style={styles.textoCargando}>Cargando clases...</Text>
            </View>
          ) : null}

          {!cargandoClases && !listaClases.length ? (
            <Text style={styles.textoVacio}>No hay clases registradas.</Text>
          ) : null}

          {listaClases.map((clase, indice) => (
            <View
              key={obtenerIdClase(clase) || `${String(clase.nombre || '')}-${indice}`}
              style={styles.tarjetaClase}>
              <Text style={styles.nombreClase}>{clase.nombre || '-'}</Text>
              <Text style={styles.descripcionClase}>{clase.descripcion || '-'}</Text>
              <Text style={styles.detalleClase}>Fecha y hora: {formatearFecha(clase.fechaHora)}</Text>
              <Text style={styles.detalleClase}>Plazas: {obtenerPlazasMaximas(clase)}</Text>
              <Text style={styles.detalleClase}>Restantes: {obtenerPlazasRestantes(clase)}</Text>

              <Pressable
                style={styles.botonSecundario}
                onPress={() => abrirModalInscritos(clase)}
                disabled={cargandoInscritos}>
                <Text style={styles.textoBotonSecundario}>VER INSCRITOS</Text>
              </Pressable>
            </View>
          ))}
        </View>
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.fondoModal}>
          <View style={styles.cajaModal}>
            <Text style={styles.tituloModal}>{tituloModal}</Text>

            {cargandoInscritos ? <Text style={styles.textoModal}>Cargando inscritos...</Text> : null}
            {!cargandoInscritos && mensajeErrorInscritos ? (
              <Text style={styles.mensajeError}>{mensajeErrorInscritos}</Text>
            ) : null}
            {!cargandoInscritos && !mensajeErrorInscritos && !listaInscritos.length ? (
              <Text style={styles.textoModal}>No hay inscritos en esta clase.</Text>
            ) : null}

            {!cargandoInscritos && !mensajeErrorInscritos && !!listaInscritos.length ? (
              <ScrollView style={styles.listaInscritos}>
                {listaInscritos.map((nombre, indice) => (
                  <Text key={`${nombre}-${indice}`} style={styles.itemInscrito}>
                    {nombre}
                  </Text>
                ))}
              </ScrollView>
            ) : null}

            <Pressable style={styles.botonPrincipal} onPress={() => setModalVisible(false)}>
              <Text style={styles.textoBoton}>Cerrar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pagina: {
    flex: 1,
    backgroundColor: '#0b0f1a',
  },
  contenedor: {
    padding: 16,
    paddingBottom: 28,
    gap: 14,
  },
  cabecera: {
    paddingTop: 8,
  },
  textoAdmin: {
    color: '#22c55e',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 5,
  },
  titulo: {
    color: '#22c55e',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitulo: {
    color: '#cbd5e1',
    fontSize: 14,
  },
  panel: {
    backgroundColor: 'rgba(12, 20, 32, 0.92)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(72, 96, 130, 0.45)',
  },
  tituloPanel: {
    color: '#22c55e',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
  },
  etiqueta: {
    color: '#d3dae4',
    marginBottom: 5,
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    width: '100%',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(127, 180, 151, 0.28)',
    backgroundColor: '#f2f5f8',
    color: '#000000',
    paddingHorizontal: 10,
    paddingVertical: 9,
    marginBottom: 10,
    fontSize: 14,
  },
  inputDescripcion: {
    minHeight: 90,
  },
  inputSelector: {
    width: '100%',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(127, 180, 151, 0.28)',
    backgroundColor: '#f2f5f8',
    paddingHorizontal: 10,
    paddingVertical: 12,
    marginBottom: 10,
  },
  textoSelector: {
    color: '#000000',
    fontSize: 14,
  },
  textoSelectorPlaceholder: {
    color: '#8392a7',
    fontSize: 14,
  },
  textoAyuda: {
    color: '#93a4ba',
    fontSize: 12,
    marginTop: -1,
    marginBottom: 10,
  },
  botonPrincipal: {
    backgroundColor: '#22c55e',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    marginTop: 2,
  },
  textoBoton: {
    color: '#0b0f1a',
    fontSize: 15,
    fontWeight: '700',
  },
  mensajeError: {
    marginTop: 10,
    color: '#ffb4b4',
    fontSize: 14,
  },
  mensajeOk: {
    marginTop: 10,
    color: '#22c55e',
    fontSize: 14,
  },
  cabeceraListado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  titulosListado: {
    flex: 1,
  },
  subtituloListado: {
    color: '#9eabbd',
    fontSize: 13,
  },
  botonSecundario: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#22c55e',
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textoBotonSecundario: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 12,
  },
  bloqueCargando: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  textoCargando: {
    color: '#cbd5e1',
    fontSize: 13,
  },
  textoVacio: {
    color: '#93a4ba',
    textAlign: 'center',
    paddingVertical: 8,
  },
  tarjetaClase: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    backgroundColor: 'rgba(10, 16, 26, 0.72)',
    gap: 5,
  },
  nombreClase: {
    color: '#22c55e',
    fontSize: 16,
    fontWeight: '700',
  },
  descripcionClase: {
    color: '#d6dbe4',
    fontSize: 14,
    marginBottom: 4,
  },
  detalleClase: {
    color: '#c5cfdb',
    fontSize: 13,
  },
  fondoModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
  },
  cajaModal: {
    width: '100%',
    backgroundColor: '#0f1724',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 12,
    padding: 14,
    maxHeight: '80%',
  },
  tituloModal: {
    color: '#22c55e',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
  },
  textoModal: {
    color: '#e5ebf3',
    fontSize: 14,
    marginBottom: 10,
  },
  listaInscritos: {
    maxHeight: 240,
    marginBottom: 10,
  },
  itemInscrito: {
    color: '#ffffff',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
});
