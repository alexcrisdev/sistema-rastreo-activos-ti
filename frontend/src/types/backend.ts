export type AreaMapa = {
  id_area: number;
  nombre: string;
  coord_x_inicio: number;
  coord_y_inicio: number;
  coord_x_fin: number;
  coord_y_fin: number;
};

export type Activo = {
  id_activo: number;
  codigo: string;
  nombre: string;
  marca: string | null;
  modelo: string | null;
  numero_serie: string | null;
  estado: string;
  estado_conexion: string;
  fuera_empresa: boolean;
  id_tipo_activo: number;
  id_responsable: number;
  id_area: number;
  es_movil: boolean;
  coord_x_actual: number;
  coord_y_actual: number;
  fecha_registro: string;
  fecha_actualizacion: string;
};

export type AlertaActivo = {
  id_activo: number;
  codigo: string;
  responsable: string;
  estado_conexion: string;
  mensaje: string;
};

export type MapaDatos = {
  areas: AreaMapa[];
  activos: Activo[];
  alertas: AlertaActivo[];
};

export type ActivoActualizadoWs = {
  id_activo: number;
  codigo: string;
  id_area: number;
  coord_x_actual: number;
  coord_y_actual: number;
  tipo_movimiento: string;
};

export type ActivosActualizadosMessage = {
  type: "activos_actualizados";
  data: ActivoActualizadoWs[];
};

export type LoginResponse = {
  access_token: string;
  token_type: string;
};

export type Responsable = {
  id_responsable: number;
  nombres: string;
  apellidos: string;
  correo: string;
  telefono: string | null;
  estado: string;
};

export type TipoActivo = {
  id_tipo_activo: number;
  nombre: string;
};

export type UbicacionHistorial = {
  id_historial: number;
  id_activo: number;
  id_area: number;
  coord_x: number;
  coord_y: number;
  fecha_hora: string;
  tipo_movimiento: string;
};
