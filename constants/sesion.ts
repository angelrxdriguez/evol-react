export type UsuarioSesion = {
  id: string;
  nombreUsuario: string;
  nombre: string;
  apellidos: string;
  es_admin: number;
  rol: string;
};

let usuarioSesion: UsuarioSesion | null = null;

export function guardarUsuarioSesion(usuario: UsuarioSesion) {
  usuarioSesion = usuario;
}

export function leerUsuarioSesion() {
  return usuarioSesion;
}

export function limpiarUsuarioSesion() {
  usuarioSesion = null;
}
