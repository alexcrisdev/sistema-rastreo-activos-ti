import { useState, useMemo, useEffect, type CSSProperties } from "react";
import { apiRequest } from "./api/client";
import type {
  AreaMapa,
  Activo as ActivoBackend,
  ActivosActualizadosMessage,
  AlertaActivo,
  MapaDatos,
  LoginResponse,
  Responsable,
  TipoActivo,
  UbicacionHistorial,
} from "./types/backend";

const WS_URL = import.meta.env.VITE_WS_URL ?? "ws://127.0.0.1:8000/ws/activos";
/* ===============================================================
   DESIGN TOKENS - TEMA OSCURO (DEFAULT)
=============================================================== */
const DARK_THEME = {
  bg0:    "#060d1a",
  bg1:    "#0b1629",
  bg2:    "#0f1e35",
  bg3:    "#142440",
  border: "#1a2e4a",
  text1:  "#e8f4fd",
  text2:  "#7a9bbf",
  text3:  "#3a5570",
  accent: "#3b9eff",
  green:  "#22d17a",
  yellow: "#f5a623",
  red:    "#f05252",
  gray:   "#3a5570",
};

const LIGHT_THEME = {
  bg0:    "#f0f4f8",
  bg1:    "#ffffff",
  bg2:    "#f8fafc",
  bg3:    "#e2e8f0",
  border: "#cbd5e1",
  text1:  "#0f172a",
  text2:  "#334155",
  text3:  "#64748b",
  accent: "#3b82f6",
  green:  "#10b981",
  yellow: "#f59e0b",
  red:    "#ef4444",
  gray:   "#94a3b8",
};

type ThemeColors = typeof DARK_THEME;
type Theme = "dark" | "light";

/* ===============================================================
   TYPES
=============================================================== */
type Page = "dashboard" | "inventario" | "registros" | "mantenimiento" | "reportes";

interface Area {
  id: string; name: string;
  activos: number; operativos: number; mantenimiento: number;
  top: string; left: string; width: string; height: string;
  boxes?: Array<{ top: string; left: string; width: string; height: string }>;
  tieneActivos: boolean;
}

const MAPA_ANCHO = 1000;
const MAPA_ALTO = 600;

type AreaVisualBox = { x: number; y: number; w: number; h: number };

const AREA_VISUAL_BOXES: Record<string, AreaVisualBox | AreaVisualBox[]> = {
  almacen: { x: 3, y: 4, w: 144, h: 215 },
  gerencia: { x: 147, y: 4, w: 266, h: 233 },
  contabilidad: { x: 419, y: 4, w: 209, h: 233 },
  rrhh: { x: 628, y: 4, w: 195, h: 236 },
  sala_de_reuniones: { x: 823, y: 4, w: 171, h: 239 },
  pasillo: [
    { x: 6, y: 222, w: 141, h: 18 },
    { x: 0, y: 246, w: 994, h: 85 },
  ],
  ventas: { x: 3, y: 337, w: 168, h: 254 },
  ti_sistemas: { x: 177, y: 337, w: 162, h: 257 },
  banos: { x: 345, y: 337, w: 136, h: 257 },
  recepcion: { x: 484, y: 337, w: 192, h: 257 },
  area_comun: { x: 676, y: 337, w: 197, h: 257 },
  escaleras: { x: 876, y: 337, w: 121, h: 257 },
};

function normalizarNombreArea(nombre: string): string {
  return nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s*\/\s*/g, "_")
    .replace(/\s+/g, "_")
    .toLowerCase();
}

function convertirBoxVisual(box: AreaVisualBox) {
  return {
    top: `${(box.y / MAPA_ALTO) * 100}%`,
    left: `${(box.x / MAPA_ANCHO) * 100}%`,
    width: `${(box.w / MAPA_ANCHO) * 100}%`,
    height: `${(box.h / MAPA_ALTO) * 100}%`,
  };
}

function obtenerBoxesVisuales(nombreArea: string, area: AreaMapa) {
  const visualBox = AREA_VISUAL_BOXES[normalizarNombreArea(nombreArea)];
  const boxes = visualBox
    ? Array.isArray(visualBox)
      ? visualBox
      : [visualBox]
    : [
        {
          x: area.coord_x_inicio,
          y: area.coord_y_inicio,
          w: area.coord_x_fin - area.coord_x_inicio,
          h: area.coord_y_fin - area.coord_y_inicio,
        },
      ];

  return boxes.map(convertirBoxVisual);
}

function adaptarAreasBackend(
  areasBackend: AreaMapa[],
  activosBackend: ActivoBackend[],
): Area[] {
  const areas = areasBackend.map((area) => {
    const activosArea = activosBackend.filter(
      (activo) => activo.id_area === area.id_area,
    );
    const mantenimiento = activosArea.filter(
      (activo) => activo.estado === "mantenimiento",
    ).length;
    const boxes = obtenerBoxesVisuales(area.nombre, area);
    const principal = boxes[0];

    return {
      id: String(area.id_area),
      name: area.nombre.toUpperCase(),
      activos: activosArea.length,
      operativos: activosArea.length - mantenimiento,
      mantenimiento,
      top: principal.top,
      left: principal.left,
      width: principal.width,
      height: principal.height,
      boxes,
      tieneActivos: activosArea.length > 0,
    };
  });

  if (!areas.some((area) => area.id === "escaleras")) {
    const boxes = [convertirBoxVisual(AREA_VISUAL_BOXES.escaleras as AreaVisualBox)];

    areas.push({
      id: "escaleras",
      name: "ESCALERAS",
      activos: 0,
      operativos: 0,
      mantenimiento: 0,
      top: boxes[0].top,
      left: boxes[0].left,
      width: boxes[0].width,
      height: boxes[0].height,
      boxes,
      tieneActivos: false,
    });
  }

  return areas;
}

/* ===============================================================
   ZONAS DEL PLANO
=============================================================== */
const AREAS: Area[] = [
  { id:"almacen",        name:"ALMACÉN",              activos:25, operativos:20, mantenimiento:5,  top:"1.5%",  left:"0.8%",  width:"12.8%", height:"38.5%", tieneActivos:true  },
  { id:"gerencia",       name:"GERENCIA",             activos:12, operativos:11, mantenimiento:1,  top:"1.5%",  left:"13.6%", width:"25%",   height:"38.5%", tieneActivos:true  },
  { id:"contabilidad",   name:"CONTABILIDAD",         activos:18, operativos:16, mantenimiento:2,  top:"1.5%",  left:"38.6%", width:"19.5%", height:"38.5%", tieneActivos:true  },
  { id:"rrhh",           name:"RECURSOS HUMANOS",     activos:10, operativos:9,  mantenimiento:1,  top:"1.5%",  left:"58.1%", width:"17.5%", height:"38.5%", tieneActivos:true  },
  { id:"sala_reuniones", name:"SALA DE REUNIONES",    activos:6,  operativos:6,  mantenimiento:0,  top:"1.5%",  left:"75.6%", width:"23.6%", height:"38.5%", tieneActivos:true  },
  { id:"pasillo",        name:"PASILLO",              activos:0,  operativos:0,  mantenimiento:0,  top:"40%",   left:"0%",    width:"100%",  height:"15%",   tieneActivos:false },
  { id:"ventas",         name:"VENTAS Y MARKETING",   activos:14, operativos:12, mantenimiento:2,  top:"55%",   left:"0.8%",  width:"13.8%", height:"44%",   tieneActivos:true  },
  { id:"ti",             name:"TI / SISTEMAS",        activos:35, operativos:30, mantenimiento:5,  top:"55%",   left:"14.6%", width:"16.5%", height:"44%",   tieneActivos:true  },
  { id:"banos",          name:"BAÑOS",                activos:0,  operativos:0,  mantenimiento:0,  top:"55%",   left:"31.1%", width:"15%",   height:"44%",   tieneActivos:false },
  { id:"recepcion",      name:"RECEPCIÓN",            activos:8,  operativos:8,  mantenimiento:0,  top:"55%",   left:"46.1%", width:"21%",   height:"44%",   tieneActivos:true  },
  { id:"area_comun",     name:"ÁREA COMÚN (DESCANSO)",activos:4,  operativos:4,  mantenimiento:0,  top:"55%",   left:"67.1%", width:"16.7%", height:"44%",   tieneActivos:true  },
  { id:"escaleras",      name:"ESCALERAS",            activos:0,  operativos:0,  mantenimiento:0,  top:"55%",   left:"83.8%", width:"15.4%", height:"44%",   tieneActivos:false },
];

/* ===============================================================
   HELPERS
=============================================================== */
function areaColor(a: Area, T: ThemeColors): string {
  if (!a.tieneActivos) return T.gray;
  if (a.mantenimiento >= 5) return T.red;
  if (a.mantenimiento > 0) return T.yellow;
  return T.green;
}

function areaLabel(a: Area): string {
  if (!a.tieneActivos) return "Sin activos TI";
  if (a.mantenimiento >= 5) return "Atención requerida";
  if (a.mantenimiento > 0) return "En mantenimiento";
  return "Todo operativo";
}

/* ===============================================================
   THEME TOGGLE BUTTON
=============================================================== */
function ThemeToggle({ theme, onToggle }: { theme: Theme; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      aria-label="Cambiar tema"
      style={{
        position: "fixed",
        top: 16,
        right: 16,
        zIndex: 1000,
        width: 44,
        height: 44,
        borderRadius: 44,
        background: "var(--bg2, #0f1e35)",
        border: "1px solid var(--border, #1a2e4a)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 20,
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
        backdropFilter: "blur(10px)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "scale(1.1)";
        e.currentTarget.style.boxShadow = "0 6px 16px rgba(0,0,0,0.3)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
      }}
    >
      {theme === "dark" ? "☀" : "◐"}
    </button>
  );
}

/* ===============================================================
   ICONS
=============================================================== */
const ic = (on: boolean, T: ThemeColors): string => on ? T.accent : T.text3;

interface IconProps {
  on: boolean;
  T: ThemeColors;
}

const IcoHome = ({ on, T }: IconProps) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={ic(on, T)} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);

const IcoList = ({ on, T }: IconProps) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={ic(on, T)} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
    <circle cx="3" cy="6" r="1" fill={ic(on, T)}/><circle cx="3" cy="12" r="1" fill={ic(on, T)}/><circle cx="3" cy="18" r="1" fill={ic(on, T)}/>
  </svg>
);

const IcoWrench = ({ on, T }: IconProps) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={ic(on, T)} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
  </svg>
);

const IcoChart = ({ on, T }: IconProps) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={ic(on, T)} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
  </svg>
);

function ActivoTipoIcon({ tipo, color }: { tipo: string; color: string }) {
  const nombre = normalizarNombreArea(tipo);
  const common = {
    width: 16,
    height: 16,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (nombre === "pc") {
    return (
      <svg {...common}>
        <rect x="4" y="5" width="16" height="11" rx="1.5" />
        <path d="M9 20h6" />
        <path d="M12 16v4" />
      </svg>
    );
  }

  if (nombre === "laptop") {
    return (
      <svg {...common}>
        <rect x="5" y="5" width="14" height="9" rx="1.5" />
        <path d="M3 18h18" />
        <path d="M8 14l-2 4" />
        <path d="M16 14l2 4" />
      </svg>
    );
  }

  if (nombre === "impresora") {
    return (
      <svg {...common}>
        <path d="M7 8V4h10v4" />
        <rect x="5" y="8" width="14" height="8" rx="2" />
        <path d="M8 16h8v4H8z" />
        <path d="M17 12h.01" />
      </svg>
    );
  }

  if (nombre === "router") {
    return (
      <svg {...common}>
        <rect x="4" y="12" width="16" height="7" rx="2" />
        <path d="M8 12V8" />
        <path d="M16 12V8" />
        <path d="M7 6c3-2 7-2 10 0" />
        <path d="M10 9c1.3-.7 2.7-.7 4 0" />
      </svg>
    );
  }

  if (nombre === "celular") {
    return (
      <svg {...common}>
        <rect x="8" y="3" width="8" height="18" rx="2" />
        <path d="M11 18h2" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="7" />
      <path d="M12 8v4l3 2" />
    </svg>
  );
}

/* ===============================================================
   SIDEBAR
=============================================================== */
const NAV: { id: Page; label: string; Ico: React.ComponentType<IconProps> }[] = [
  { id: "dashboard", label: "Vista General", Ico: IcoHome },
  { id: "inventario", label: "Inventario", Ico: IcoList },
  { id: "registros", label: "Registros", Ico: IcoWrench },
  { id: "mantenimiento", label: "Mantenimiento", Ico: IcoWrench },
  { id: "reportes", label: "Reportes", Ico: IcoChart },
];

function Sidebar({
  page,
  onChange,
  T,
  mantenimientoCount,
  onLogout,
}: {
  page: Page;
  onChange: (p: Page) => void;
  T: ThemeColors;
  mantenimientoCount: number;
  onLogout: () => void;
}) {
  return (
    <aside style={{
      width: 240,
      flexShrink: 0,
      height: "100%",
      background: T.bg1,
      borderRight: `1px solid ${T.border}`,
      display: "flex",
      flexDirection: "column",
      transition: "all 0.3s ease",
    }}>
      {/* Logo y empresa */}
      <div style={{ padding: "20px 16px", borderBottom: `1px solid ${T.border}`, textAlign: "center" }}>
        <div style={{
          width: 56,
          height: 56,
          margin: "0 auto 12px",
          background: `linear-gradient(135deg, ${T.accent}20, ${T.accent}08)`,
          borderRadius: 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: `1px solid ${T.accent}30`,
        }}>
          <img src="/logo.png" alt="MC" style={{ width: 40, height: 40, objectFit: "contain" }} onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
            (e.target as HTMLImageElement).parentElement!.innerHTML = "MC";
          }}/>
        </div>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: T.text1 }}>MC Contratistas</p>
        <p style={{ margin: "4px 0 0", fontSize: 10, color: T.text3, letterSpacing: "1px" }}>MINEROS S.A.C.</p>
      </div>

      {/* Navegación */}
      <div style={{ padding: "16px 12px", flex: 1 }}>
        <p style={{ margin: "0 8px 12px", fontSize: 10, color: T.text3, letterSpacing: "1.5px", fontWeight: 600, textTransform: "uppercase" }}>Módulos</p>
        {NAV.map(({ id, label, Ico }) => {
          const active = page === id;
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                width: "100%",
                padding: "10px 12px",
                marginBottom: 4,
                borderRadius: 10,
                cursor: "pointer",
                textAlign: "left",
                background: active ? `${T.accent}15` : "transparent",
                border: active ? `1px solid ${T.accent}30` : "1px solid transparent",
                color: active ? T.accent : T.text2,
                fontSize: 13,
                fontWeight: active ? 600 : 400,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = `${T.text3}10`;
                  e.currentTarget.style.transform = "translateX(4px)";
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.transform = "translateX(0)";
                }
              }}
            >
              <Ico on={active} T={T} />
              <span style={{ flex: 1 }}>{label}</span>
              {id === "mantenimiento" && mantenimientoCount > 0 && (
                <span style={{
                  background: T.yellow,
                  color: T.bg0,
                  fontSize: 10,
                  fontWeight: 800,
                  borderRadius: 20,
                  padding: "2px 8px",
                  minWidth: 24,
                  textAlign: "center",
                }}>
                  {mantenimientoCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ padding: "16px", borderTop: `1px solid ${T.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: T.green,
            boxShadow: `0 0 8px ${T.green}`,
            display: "inline-block",
            animation: "pulse 2s infinite",
          }}/>
          <span style={{ fontSize: 11, color: T.green, fontWeight: 500 }}>Sistema activo</span>
        </div>
        <button
          type="button"
          onClick={onLogout}
          style={{
            width: "100%",
            marginBottom: 10,
            background: T.bg2,
            border: `1px solid ${T.border}`,
            borderRadius: 8,
            color: T.text2,
            padding: "8px 12px",
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          Cerrar sesión
        </button>
        <p style={{ margin: 0, fontSize: 10, color: T.text3 }}>SIGA-TI v2.0 · 2025</p>
      </div>
    </aside>
  );
}

/* ===============================================================
   TOPBAR
=============================================================== */
interface Kpi {
  label: string;
  value: number;
  color: string;
}

function Topbar({ title, sub, kpis, T }: { title: string; sub: string; kpis?: Kpi[]; T: ThemeColors }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "12px 24px",
      background: T.bg1,
      borderBottom: `1px solid ${T.border}`,
      flexShrink: 0,
      gap: 16,
      flexWrap: "wrap",
    }}>
      <div>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: T.text1, letterSpacing: "-0.3px" }}>{title}</h1>
        <p style={{ margin: "4px 0 0", fontSize: 12, color: T.text3 }}>{sub}</p>
      </div>
      {kpis && (
        <div style={{ display: "flex", gap: 12 }}>
          {kpis.map((k) => (
            <div
              key={k.label}
              style={{
                background: `${k.color}10`,
                border: `1px solid ${k.color}30`,
                borderRadius: 12,
                padding: "8px 18px",
                textAlign: "center",
                minWidth: 90,
                transition: "all 0.3s ease",
                cursor: "default",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow = `0 6px 16px ${k.color}20`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div style={{ fontSize: 24, fontWeight: 800, color: k.color, lineHeight: 1.2 }}>{k.value}</div>
              <div style={{ fontSize: 9, color: T.text3, marginTop: 4, textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 500 }}>{k.label}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ===============================================================
   PAGE 1 - DASHBOARD
=============================================================== */
function DashboardPage({
  T,
  areas,
  activos,
  alertas,
  tipos,
  responsables,
  token,
  onRefresh,
}: {
  T: ThemeColors;
  areas: Area[];
  activos: ActivoBackend[];
  alertas: AlertaActivo[];
  tipos: TipoActivo[];
  responsables: Responsable[];
  token: string;
  onRefresh: () => void;
}) {
  const [hovered, setHovered] = useState<Area | null>(null);
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [selectedActivo, setSelectedActivo] = useState<ActivoBackend | null>(null);
  const [codigoBusqueda, setCodigoBusqueda] = useState("");
  const [mensajeBusqueda, setMensajeBusqueda] = useState("");
  const [simulacionActiva, setSimulacionActiva] = useState(false);
  const [mensajeSimulacion, setMensajeSimulacion] = useState("");
  const [historialActivo, setHistorialActivo] = useState<UbicacionHistorial[]>([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const totalActivos = areas.reduce((s, a) => s + a.activos, 0);
  const totalOperativos = areas.reduce((s, a) => s + a.operativos, 0);
  const totalMantenimiento = areas.reduce((s, a) => s + a.mantenimiento, 0);
  const tiposPorId = new Map(tipos.map((tipo) => [tipo.id_tipo_activo, tipo.nombre]));
  const areaDetalle = selectedArea ?? hovered;
  const areasPorId = new Map(
    areas.map((area) => [Number(area.id), area.name]),
  );
  const responsablesPorId = new Map(
    responsables.map((responsable) => [
      responsable.id_responsable,
      `${responsable.nombres} ${responsable.apellidos}`,
    ]),
  );

  useEffect(() => {
    if (!selectedActivo) return;

    const activoActualizado = activos.find(
      (activo) => activo.id_activo === selectedActivo.id_activo,
    );

    if (activoActualizado) {
      setSelectedActivo(activoActualizado);
    }
  }, [activos, selectedActivo?.id_activo]);

  useEffect(() => {
    if (!selectedActivo) {
      setHistorialActivo([]);
      return;
    }

    setCargandoHistorial(true);
    apiRequest<UbicacionHistorial[]>(`/activos/${selectedActivo.id_activo}/historial`)
      .then((historial) => setHistorialActivo(historial.slice(0, 5)))
      .catch(() => setHistorialActivo([]))
      .finally(() => setCargandoHistorial(false));
  }, [selectedActivo?.id_activo]);

  async function cargarEstadoSimulacion() {
    try {
      const estado = await apiRequest<{ activa: boolean }>("/simulacion/estado");
      setSimulacionActiva(estado.activa);
    } catch (error) {
      setMensajeSimulacion(error instanceof Error ? error.message : "No se pudo obtener el estado de simulación");
    }
  }

  useEffect(() => {
    cargarEstadoSimulacion();
  }, []);

  async function buscarActivo() {
    const codigo = codigoBusqueda.trim();
    if (!codigo) return;

    try {
      const activo = await apiRequest<ActivoBackend>(`/activos/buscar?codigo=${encodeURIComponent(codigo)}`);
      setSelectedActivo(activo);
      setMensajeBusqueda(
        activo.fuera_empresa || activo.estado_conexion === "desconectado"
          ? "Activo registrado, pero fuera de la empresa."
          : "Activo encontrado y resaltado en el mapa.",
      );
    } catch (error) {
      setSelectedActivo(null);
      setMensajeBusqueda(error instanceof Error ? error.message : "Activo no encontrado");
    }
  }

  async function iniciarSimulacion() {
    try {
      const response = await apiRequest<{ message: string; activa: boolean }>("/simulacion/iniciar", {
        method: "POST",
        token,
      });
      setSimulacionActiva(response.activa);
      setMensajeSimulacion(response.message);
    } catch (error) {
      setMensajeSimulacion(error instanceof Error ? error.message : "No se pudo iniciar la simulación");
    }
  }

  async function detenerSimulacion() {
    try {
      const response = await apiRequest<{ message: string; activa: boolean }>("/simulacion/detener", {
        method: "POST",
        token,
      });
      setSimulacionActiva(response.activa);
      setMensajeSimulacion(response.message);
    } catch (error) {
      setMensajeSimulacion(error instanceof Error ? error.message : "No se pudo detener la simulación");
    }
  }

  async function ejecutarReglas() {
    try {
      const response = await apiRequest<{ message: string; total_movidos: number }>("/simulacion/ejecutar-reglas", {
        method: "POST",
        token,
      });
      setMensajeSimulacion(`${response.message}. Activos movidos: ${response.total_movidos}`);
      onRefresh();
    } catch (error) {
      setMensajeSimulacion(error instanceof Error ? error.message : "No se pudieron ejecutar las reglas");
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      <Topbar
        T={T}
        title="Vista General"
        sub="Mapa interactivo de activos TI · MC Contratistas Mineros S.A.C."
        kpis={[
          { label: "Total activos", value: totalActivos, color: T.accent },
          { label: "Operativos", value: totalOperativos, color: T.green },
          { label: "Mantenimiento", value: totalMantenimiento, color: T.yellow },
        ]}
      />

      <div style={{ display: "flex", gap: 10, padding: "12px 16px 0", alignItems: "center", flexWrap: "wrap" }}>
        <input
          value={codigoBusqueda}
          onChange={(event) => setCodigoBusqueda(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") buscarActivo();
          }}
          placeholder="Buscar activo por código"
          style={{
            background: T.bg2,
            border: `1px solid ${T.border}`,
            borderRadius: 8,
            color: T.text1,
            padding: "9px 12px",
            minWidth: 240,
            outline: "none",
          }}
        />
        <button
          onClick={buscarActivo}
          style={{
            background: T.accent,
            border: "none",
            borderRadius: 8,
            color: "white",
            fontWeight: 700,
            padding: "9px 14px",
          }}
        >
          Buscar
        </button>
        {mensajeBusqueda && (
          <span style={{ fontSize: 12, color: T.text2 }}>{mensajeBusqueda}</span>
        )}
      </div>

      <div style={{ display: "flex", gap: 10, padding: "10px 16px 0", alignItems: "center", flexWrap: "wrap" }}>
        <span style={{
          fontSize: 11,
          fontWeight: 800,
          color: simulacionActiva ? T.green : T.text3,
          background: T.bg2,
          border: `1px solid ${simulacionActiva ? T.green : T.border}`,
          borderRadius: 999,
          padding: "7px 10px",
          textTransform: "uppercase",
        }}>
          Simulación: {simulacionActiva ? "activa" : "detenida"}
        </span>
        <button type="button" onClick={iniciarSimulacion} style={secondaryButton(T.green)}>Iniciar</button>
        <button type="button" onClick={detenerSimulacion} style={secondaryButton(T.red)}>Detener</button>
        <button type="button" onClick={ejecutarReglas} style={secondaryButton(T.accent)}>Ejecutar reglas</button>
        <button type="button" onClick={cargarEstadoSimulacion} style={secondaryButton(T.text2)}>Ver estado</button>
        <button type="button" onClick={onRefresh} style={secondaryButton(T.text2)}>Actualizar mapa</button>
        {alertas.length > 0 && (
          <span style={{
            fontSize: 11,
            fontWeight: 800,
            color: T.red,
            background: `${T.red}12`,
            border: `1px solid ${T.red}45`,
            borderRadius: 999,
            padding: "7px 10px",
          }}>
            {alertas.length} fuera de empresa
          </span>
        )}
        {mensajeSimulacion && (
          <span style={{ fontSize: 12, color: T.text2 }}>{mensajeSimulacion}</span>
        )}
      </div>

      <div style={{ display: "flex", flex: 1, minHeight: 0, gap: 12, padding: 16 }}>
        {/* Panel lateral de detalle */}
        <div style={{ width: 260, flexShrink: 0, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{
            flex: 1,
            background: T.bg2,
            border: `1px solid ${T.border}`,
            borderRadius: 16,
            padding: "18px",
            display: "flex",
            flexDirection: "column",
            overflow: "auto",
          }}>
            <SectionLabel T={T}>Detalle del Área</SectionLabel>
            {areaDetalle ? (
              <div style={{ marginTop: 12, animation: "fadeInUp 0.3s ease" }}>
                <span style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 12px",
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 600,
                  marginBottom: 12,
                  background: `${areaColor(areaDetalle, T)}20`,
                  color: areaColor(areaDetalle, T),
                  border: `1px solid ${areaColor(areaDetalle, T)}40`,
                }}>
                  <span>●</span> {areaLabel(areaDetalle)}
                </span>

                <h2 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 700, color: T.text1 }}>{areaDetalle.name}</h2>
                {selectedArea && (
                  <button type="button" onClick={() => setSelectedArea(null)} style={{ ...secondaryButton(T.text2), marginBottom: 12 }}>
                    Limpiar selección
                  </button>
                )}

                {areaDetalle.tieneActivos ? (
                  <>
                    <SRow icon="■" label="Total activos" value={areaDetalle.activos} T={T} />
                    <SRow icon="✓" label="Operativos" value={areaDetalle.operativos} vc={T.green} T={T} />
                    <SRow icon="!" label="Mantenimiento" value={areaDetalle.mantenimiento} vc={T.yellow} T={T} />
                    <div style={{ marginTop: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 11, color: T.text3 }}>Estado operativo</span>
                        <span style={{ fontSize: 12, color: T.text1, fontWeight: 700 }}>
                          {Math.round((areaDetalle.operativos / areaDetalle.activos) * 100)}%
                        </span>
                      </div>
                      <div style={{ background: T.bg3, borderRadius: 99, height: 6, overflow: "hidden" }}>
                        <div style={{
                          height: 6,
                          borderRadius: 99,
                          width: `${(areaDetalle.operativos / areaDetalle.activos) * 100}%`,
                          background: areaColor(areaDetalle, T),
                          transition: "width 0.5s ease",
                          boxShadow: `0 0 8px ${areaColor(areaDetalle, T)}`,
                        }}/>
                      </div>
                    </div>
                  </>
                ) : (
                  <p style={{ color: T.text3, fontSize: 12, marginTop: 16 }}>Esta zona no tiene activos TI registrados.</p>
                )}
              </div>
            ) : (
              <div style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                opacity: 0.4,
              }}>
                <span style={{ fontSize: 40 }}>Mapa</span>
                <p style={{ color: T.text3, fontSize: 12, textAlign: "center", margin: 0, lineHeight: 1.5 }}>
                  Pasa el cursor sobre<br />una zona del plano
                </p>
              </div>
            )}
            {selectedActivo && (
              <div style={{ marginTop: 16, borderTop: `1px solid ${T.border}`, paddingTop: 14 }}>
                <SectionLabel T={T}>Ficha del activo</SectionLabel>
                <h3 style={{ margin: "10px 0 6px", fontSize: 16, color: T.text1 }}>
                  {selectedActivo.codigo}
                </h3>
                <p style={{ margin: "0 0 10px", fontSize: 12, color: T.text2, lineHeight: 1.4 }}>
                  {selectedActivo.nombre}
                </p>
                <div style={{ display: "grid", gap: 7, marginTop: 10, fontSize: 11.5, color: T.text3 }}>
                  <FichaDato label="Tipo" value={tiposPorId.get(selectedActivo.id_tipo_activo) ?? `Tipo ${selectedActivo.id_tipo_activo}`} T={T} />
                  <FichaDato label="Responsable" value={responsablesPorId.get(selectedActivo.id_responsable) ?? `Responsable ${selectedActivo.id_responsable}`} T={T} />
                  <FichaDato label="Área actual" value={areasPorId.get(selectedActivo.id_area) ?? `Área ${selectedActivo.id_area}`} T={T} />
                  <FichaDato label="Estado" value={selectedActivo.estado} T={T} />
                  <FichaDato label="Conexión" value={selectedActivo.estado_conexion} T={T} />
                  <FichaDato label="Coordenadas" value={`${selectedActivo.coord_x_actual.toFixed(2)}, ${selectedActivo.coord_y_actual.toFixed(2)}`} T={T} />
                  <FichaDato label="Registro" value={selectedActivo.fecha_registro.slice(0, 10)} T={T} />
                  <FichaDato label="Última actualización" value={selectedActivo.fecha_actualizacion.slice(0, 19).replace("T", " ")} T={T} />
                </div>

                <div style={{ marginTop: 14, borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>
                  <SectionLabel T={T}>Últimos movimientos</SectionLabel>
                  {cargandoHistorial ? (
                    <p style={{ margin: "10px 0 0", color: T.text3, fontSize: 11 }}>Cargando historial...</p>
                  ) : historialActivo.length === 0 ? (
                    <p style={{ margin: "10px 0 0", color: T.text3, fontSize: 11 }}>Sin movimientos registrados.</p>
                  ) : (
                    <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                      {historialActivo.map((item) => (
                        <div key={item.id_historial} style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 8, padding: 8 }}>
                          <p style={{ margin: "0 0 4px", color: T.text1, fontSize: 11.5, fontWeight: 700 }}>{item.tipo_movimiento}</p>
                          <p style={{ margin: 0, color: T.text3, fontSize: 10.5 }}>
                            {areasPorId.get(item.id_area) ?? `Área ${item.id_area}`} · {item.fecha_hora.slice(0, 19).replace("T", " ")}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Leyenda */}
          <div style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 16, padding: "16px" }}>
            <SectionLabel T={T}>Leyenda</SectionLabel>
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                [T.green, "Todo operativo", "✓"],
                [T.yellow, "Tiene mantenimiento", "!"],
                [T.red, "Atención requerida", "●"],
                [T.gray, "Sin activos TI", "○"]
              ].map(([c, l, e]) => (
                <div key={l} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 14 }}>{e}</span>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: c as string, display: "inline-block", flexShrink: 0, boxShadow: `0 0 6px ${c}` }}/>
                  <span style={{ fontSize: 11.5, color: T.text2 }}>{l}</span>
                </div>
              ))}
            </div>
            {tipos.length > 0 && (
              <>
                <SectionLabel T={T}>Tipos de activo</SectionLabel>
                <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {tipos.map((tipo) => (
                    <div key={tipo.id_tipo_activo} style={{ display: "flex", alignItems: "center", gap: 8, color: T.text2, fontSize: 11.5 }}>
                      <ActivoTipoIcon tipo={tipo.nombre} color={T.accent} />
                      <span>{tipo.nombre}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 16, padding: "16px", maxHeight: 180, overflow: "auto" }}>
            <SectionLabel T={T}>Alertas</SectionLabel>
            {alertas.length === 0 ? (
              <p style={{ margin: "12px 0 0", fontSize: 12, color: T.text3 }}>Sin activos fuera de empresa.</p>
            ) : (
              <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
                {alertas.map((alerta) => (
                  <div key={alerta.id_activo} style={{ border: `1px solid ${T.red}40`, background: `${T.red}12`, borderRadius: 8, padding: 10 }}>
                    <div style={{ color: T.red, fontWeight: 800, fontSize: 12 }}>{alerta.codigo}</div>
                    <div style={{ color: T.text2, fontSize: 11, marginTop: 4 }}>{alerta.responsable}</div>
                    <div style={{ color: T.yellow, fontSize: 10.5, marginTop: 4, textTransform: "uppercase", fontWeight: 700 }}>
                      {alerta.estado_conexion}
                    </div>
                    <div style={{ color: T.text3, fontSize: 10.5, marginTop: 4 }}>{alerta.mensaje}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mapa */}
        <div style={{
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          background: T.bg2,
          border: `1px solid ${T.border}`,
          borderRadius: 16,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}>
          <div
            style={{
              position: "relative",
              width: "100%",
              maxHeight: "100%",
              aspectRatio: `${MAPA_ANCHO} / ${MAPA_ALTO}`,
            }}
          >
            <img
              src="/plano.png"
              alt="Plano de oficinas"
              style={{ width: "100%", height: "100%", display: "block", userSelect: "none" }}
              draggable={false}
              onError={(e) => {
                (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Crect width='800' height='600' fill='%231a2e4a'/%3E%3Ctext x='400' y='300' text-anchor='middle' fill='%237a9bbf' font-size='16'%3EPlano no disponible%3C/text%3E%3C/svg%3E";
              }}
            />
            {areas.map((area) => {
              const active = hovered?.id === area.id || selectedArea?.id === area.id;
              const col = areaColor(area, T);
              return (
                (area.boxes ?? [{ top: area.top, left: area.left, width: area.width, height: area.height }]).map((box, index) => (
                  <div
                    key={`${area.id}-${index}`}
                    onMouseEnter={() => setHovered(area)}
                    onMouseLeave={() => setHovered(null)}
                    onClick={() => setSelectedArea(area)}
                    style={{
                      position: "absolute",
                      top: box.top,
                      left: box.left,
                      width: box.width,
                      height: box.height,
                      cursor: area.tieneActivos ? "pointer" : "default",
                      border: active ? `2px solid ${col}` : "2px solid transparent",
                      background: active ? `${col}15` : "transparent",
                      borderRadius: 4,
                      transition: "all 0.2s ease",
                      boxSizing: "border-box",
                    }}
                  >
                    {active && area.tieneActivos && index === 0 && (
                      <span style={{
                        position: "absolute",
                        bottom: 6,
                        left: "50%",
                        transform: "translateX(-50%)",
                        background: T.bg0,
                        color: T.text1,
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "4px 12px",
                        borderRadius: 20,
                        whiteSpace: "nowrap",
                        border: `1px solid ${col}66`,
                        boxShadow: `0 4px 12px rgba(0,0,0,0.3)`,
                        pointerEvents: "none",
                      }}>
                        {area.activos} activos
                      </span>
                    )}
                  </div>
                ))
              );
            })}
            {activos.filter((activo) => !activo.fuera_empresa).map((activo) => {
              const selected = selectedActivo?.id_activo === activo.id_activo;
              const isMaintenance = activo.estado === "mantenimiento";
              const color = isMaintenance ? T.yellow : T.accent;
              const tipoActivo = tiposPorId.get(activo.id_tipo_activo) ?? "Activo";

              return (
                <button
                  key={activo.id_activo}
                  type="button"
                  title={`${activo.codigo} - ${tipoActivo}`}
                  onClick={() => setSelectedActivo(activo)}
                  style={{
                    position: "absolute",
                    left: `${(activo.coord_x_actual / MAPA_ANCHO) * 100}%`,
                    top: `${(activo.coord_y_actual / MAPA_ALTO) * 100}%`,
                    width: selected ? 30 : 26,
                    height: selected ? 30 : 26,
                    transform: "translate(-50%, -50%)",
                    borderRadius: 8,
                    border: `2px solid ${T.bg0}`,
                    background: T.bg1,
                    boxShadow: selected
                      ? `0 0 0 5px ${color}30, 0 0 16px ${color}`
                      : `0 0 10px ${color}`,
                    padding: 0,
                    cursor: "pointer",
                    zIndex: selected ? 6 : 5,
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <ActivoTipoIcon tipo={tipoActivo} color={color} />
                  <span
                    style={{
                      position: "absolute",
                      left: "50%",
                      bottom: "calc(100% + 6px)",
                      transform: "translateX(-50%)",
                      background: T.bg0,
                      color: T.text1,
                      border: `1px solid ${color}66`,
                      borderRadius: 6,
                      padding: "3px 7px",
                      fontSize: 10,
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                      opacity: selected ? 1 : 0,
                      pointerEvents: "none",
                    }}
                  >
                    {activo.codigo}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===============================================================
   PAGE 2 - INVENTARIO
=============================================================== */
function InventarioPage({
  T,
  activos,
  areas,
  tipos,
  responsables,
}: {
  T: ThemeColors;
  activos: ActivoBackend[];
  areas: AreaMapa[];
  tipos: TipoActivo[];
  responsables: Responsable[];
}) {
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("Todos");
  const [filtroArea, setFiltroArea] = useState("Todas");

  const nombreArea = (idArea: number) => areas.find((area) => area.id_area === idArea)?.nombre ?? `Área ${idArea}`;
  const nombreTipo = (idTipo: number) => tipos.find((tipo) => tipo.id_tipo_activo === idTipo)?.nombre ?? `Tipo ${idTipo}`;
  const nombreResponsable = (idResponsable: number) => {
    const responsable = responsables.find((item) => item.id_responsable === idResponsable);
    return responsable ? `${responsable.nombres} ${responsable.apellidos}` : `Responsable ${idResponsable}`;
  };
  const areasUnicas = ["Todas", ...areas.map((area) => area.nombre)];
  const filtered = useMemo(() => activos.filter(a => {
    const q = search.toLowerCase();
    const area = nombreArea(a.id_area);
    const tipo = nombreTipo(a.id_tipo_activo);
    const responsable = nombreResponsable(a.id_responsable);
    return (a.nombre.toLowerCase().includes(q) || a.codigo.toLowerCase().includes(q) || tipo.toLowerCase().includes(q) || responsable.toLowerCase().includes(q) || (a.marca ?? "").toLowerCase().includes(q))
      && (filtroEstado === "Todos" || a.estado === filtroEstado)
      && (filtroArea === "Todas" || area === filtroArea);
  }), [activos, search, filtroEstado, filtroArea, areas, tipos, responsables]);

  const estadoStyle = (estado: string): CSSProperties => {
    if (estado === "mantenimiento") return { background: `${T.yellow}15`, color: T.yellow, border: `1px solid ${T.yellow}40` };
    if (estado === "baja" || estado === "pendiente_reasignacion") return { background: `${T.text3}15`, color: T.text3, border: `1px solid ${T.border}` };
    return { background: `${T.green}15`, color: T.green, border: `1px solid ${T.green}40` };
  };

  const inputStyle: CSSProperties = {
    background: T.bg3,
    border: `1px solid ${T.border}`,
    borderRadius: 10,
    padding: "8px 14px",
    color: T.text1,
    fontSize: 12,
    outline: "none",
    fontFamily: "inherit",
    transition: "all 0.2s ease",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      <Topbar T={T} title="Inventario de Activos TI" sub={`${filtered.length} de ${activos.length} activos registrados`} />

      <div style={{ display: "flex", gap: 10, padding: "12px 20px", background: T.bg1, borderBottom: `1px solid ${T.border}`, flexShrink: 0, flexWrap: "wrap" }}>
        <input
          placeholder="Buscar nombre, código, tipo, responsable o marca..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...inputStyle, flex: 1, minWidth: 200 }}
        />
        <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} style={inputStyle}>
          {["Todos", "activo", "mantenimiento", "baja", "pendiente_reasignacion"].map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={filtroArea} onChange={e => setFiltroArea(e.target.value)} style={inputStyle}>
          {areasUnicas.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "0 20px 20px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 16 }}>
          <thead>
            <tr style={{ position: "sticky", top: 0, background: T.bg1, zIndex: 1 }}>
              {["Código", "Nombre", "Tipo", "Área", "Responsable", "Estado", "Conexión", "Marca", "Registro"].map(h => (
                <th key={h} style={{ padding: "12px 14px", textAlign: "left", fontSize: 10, fontWeight: 700, color: T.text3, letterSpacing: "1px", textTransform: "uppercase", borderBottom: `1px solid ${T.border}`, whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: 60, textAlign: "center", color: T.text3, fontSize: 14 }}>
                  <span style={{ fontSize: 48, display: "block", marginBottom: 12 }}>Buscar</span>
                  Sin resultados para los filtros seleccionados
                </td>
              </tr>
            ) : (
              filtered.map((a, i) => (
                <tr
                  key={a.id_activo}
                  style={{
                    background: i % 2 ? `${T.bg2}80` : "transparent",
                    borderBottom: `1px solid ${T.border}20`,
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = `${T.bg3}80`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = i % 2 ? `${T.bg2}80` : "transparent"; }}
                >
                  <td style={{ ...cellStyle, color: T.accent }}><code style={{ fontSize: 11, color: "inherit", fontFamily: "monospace" }}>{a.codigo}</code></td>
                  <td style={cellStyle}>
                    <div style={{ color: T.text1, fontSize: 12.5, fontWeight: 500 }}>{a.nombre}</div>
                    {a.numero_serie && <div style={{ color: T.text3, fontSize: 10.5, marginTop: 4 }}>Serie: {a.numero_serie}</div>}
                  </td>
                  <td style={cellStyle}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 10.5, color: T.text2, background: T.bg3, padding: "3px 10px", borderRadius: 6, border: `1px solid ${T.border}`, whiteSpace: "nowrap" }}>
                      <ActivoTipoIcon tipo={nombreTipo(a.id_tipo_activo)} color={T.accent} />
                      {nombreTipo(a.id_tipo_activo)}
                    </span>
                  </td>
                  <td style={cellStyle}><span style={{ fontSize: 10.5, color: T.text3, background: T.bg3, padding: "3px 10px", borderRadius: 6, border: `1px solid ${T.border}`, whiteSpace: "nowrap" }}>{nombreArea(a.id_area)}</span></td>
                  <td style={cellStyle}><span style={{ fontSize: 11.5, color: T.text3, whiteSpace: "nowrap" }}>{nombreResponsable(a.id_responsable)}</span></td>
                  <td style={cellStyle}><span style={{ ...estadoStyle(a.estado), display: "inline-block", padding: "3px 12px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{a.estado}</span></td>
                  <td style={cellStyle}><span style={{ fontSize: 11.5, color: a.estado_conexion === "desconectado" ? T.red : T.green }}>{a.estado_conexion}</span></td>
                  <td style={cellStyle}><span style={{ fontSize: 11.5, color: T.text3 }}>{a.marca ?? "-"}</span></td>
                  <td style={cellStyle}><span style={{ fontSize: 11, color: T.text3, fontFamily: "monospace" }}>{a.fecha_registro.slice(0, 10)}</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const cellStyle: CSSProperties = { padding: "12px 14px", verticalAlign: "top" };

function LoginPage({ T, onLogin }: { T: ThemeColors; onLogin: (token: string) => void }) {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const response = await apiRequest<LoginResponse>("/auth/login", {
        method: "POST",
        body: { usuario, password },
      });
      localStorage.setItem("token", response.access_token);
      onLogin(response.access_token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesión");
    }
  }

  return (
    <div style={{ minHeight: "100%", display: "grid", placeItems: "center", background: T.bg0, color: T.text1, padding: 20 }}>
      <form onSubmit={submit} style={{ width: "min(380px, 100%)", background: T.bg1, border: `1px solid ${T.border}`, borderRadius: 14, padding: 24 }}>
        <h1 style={{ margin: "0 0 6px", fontSize: 22 }}>Sistema de Activos TI</h1>
        <p style={{ margin: "0 0 20px", color: T.text3, fontSize: 13 }}>Ingresa con tu usuario autorizado.</p>
        <input value={usuario} onChange={(e) => setUsuario(e.target.value)} placeholder="Usuario" style={formInput(T)} />
        <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña" type="password" style={formInput(T)} />
        {error && <p style={{ color: T.red, fontSize: 12, margin: "0 0 12px" }}>{error}</p>}
        <button style={primaryButton(T)}>Ingresar</button>
      </form>
    </div>
  );
}

function formInput(T: ThemeColors): CSSProperties {
  return {
    width: "100%",
    background: T.bg2,
    border: `1px solid ${T.border}`,
    borderRadius: 8,
    color: T.text1,
    padding: "10px 12px",
    marginBottom: 12,
    outline: "none",
  };
}

function primaryButton(T: ThemeColors): CSSProperties {
  return {
    width: "100%",
    background: T.accent,
    border: "none",
    borderRadius: 8,
    color: "white",
    fontWeight: 800,
    padding: "10px 14px",
  };
}

function secondaryButton(color: string): CSSProperties {
  return {
    background: `${color}18`,
    border: `1px solid ${color}55`,
    borderRadius: 8,
    color,
    fontSize: 12,
    fontWeight: 800,
    padding: "8px 12px",
    cursor: "pointer",
  };
}

function RegistrosPage({ T, token, onRefresh }: { T: ThemeColors; token: string; onRefresh: () => void }) {
  const [responsables, setResponsables] = useState<Responsable[]>([]);
  const [areas, setAreas] = useState<AreaMapa[]>([]);
  const [tipos, setTipos] = useState<TipoActivo[]>([]);
  const [mensaje, setMensaje] = useState("");
  const [pasoActivo, setPasoActivo] = useState<"responsable" | "asignacion" | "activo" | "usuario">("responsable");
  const [ultimoResponsable, setUltimoResponsable] = useState<Responsable | null>(null);
  const [ultimaAsignacion, setUltimaAsignacion] = useState<{ id_area: number; fecha_inicio: string } | null>(null);
  const [ultimoActivo, setUltimoActivo] = useState<ActivoBackend | null>(null);
  const [responsable, setResponsable] = useState({ nombres: "", apellidos: "", correo: "", telefono: "", estado: "laborando" });
  const [asignacion, setAsignacion] = useState({ id_responsable: "", id_area: "", fecha_inicio: new Date().toISOString().slice(0, 10), fecha_fin: "", estado: "activo" });
  const [usuario, setUsuario] = useState({ usuario: "", password: "", codigo_registro: "", id_responsable: "" });
  const [activo, setActivo] = useState({ codigo: "", nombre: "", marca: "", modelo: "", numero_serie: "", estado: "activo", estado_conexion: "conectado", fuera_empresa: false, id_tipo_activo: "", id_responsable: "", id_area: "", es_movil: true });
  const areasRegistroInicial = areas.filter((area) => normalizarNombreArea(area.nombre) !== "banos");
  const responsablesLaborando = responsables.filter((item) => item.estado !== "fuera_de_labores");
  const responsablesSistemas = responsablesLaborando;

  function cargarCatalogos() {
    Promise.all([
      apiRequest<Responsable[]>("/responsables"),
      apiRequest<AreaMapa[]>("/areas-mapa"),
      apiRequest<TipoActivo[]>("/tipos-activo"),
    ]).then(([r, a, t]) => {
      setResponsables(r);
      setAreas(a);
      setTipos(t);
    }).catch((err) => setMensaje(err instanceof Error ? err.message : "Error cargando datos"));
  }

  useEffect(() => {
    cargarCatalogos();
  }, []);

  async function crearResponsable(event: React.FormEvent) {
    event.preventDefault();
    try {
      const nuevoResponsable = await apiRequest<Responsable>("/responsables", { method: "POST", token, body: responsable });
      setUltimoResponsable(nuevoResponsable);
      setAsignacion((actual) => ({ ...actual, id_responsable: String(nuevoResponsable.id_responsable) }));
      setActivo((actual) => ({ ...actual, id_responsable: String(nuevoResponsable.id_responsable) }));
      setUsuario((actual) => ({ ...actual, id_responsable: String(nuevoResponsable.id_responsable) }));
      setMensaje("Responsable registrado. Continúa con su asignación laboral.");
      setResponsable({ nombres: "", apellidos: "", correo: "", telefono: "", estado: "laborando" });
      setPasoActivo("asignacion");
      cargarCatalogos();
    } catch (error) {
      setMensaje(error instanceof Error ? error.message : "No se pudo registrar el responsable");
    }
  }

  async function crearAsignacion(event: React.FormEvent) {
    event.preventDefault();
    try {
      await apiRequest("/asignaciones-trabajo", {
        method: "POST",
        token,
        body: { ...asignacion, id_responsable: Number(asignacion.id_responsable), id_area: Number(asignacion.id_area), fecha_fin: asignacion.fecha_fin || null },
      });
      setUltimaAsignacion({ id_area: Number(asignacion.id_area), fecha_inicio: asignacion.fecha_inicio });
      setActivo((actual) => ({ ...actual, id_area: asignacion.id_area, id_responsable: asignacion.id_responsable }));
      setMensaje("Asignación registrada. Ahora puedes registrar un activo para ese responsable.");
      setPasoActivo("activo");
      cargarCatalogos();
    } catch (error) {
      setMensaje(error instanceof Error ? error.message : "No se pudo registrar la asignación");
    }
  }

  async function crearActivo(event: React.FormEvent) {
    event.preventDefault();
    try {
      const nuevoActivo = await apiRequest<ActivoBackend>("/activos", {
        method: "POST",
        token,
        body: { ...activo, id_tipo_activo: Number(activo.id_tipo_activo), id_responsable: Number(activo.id_responsable), id_area: Number(activo.id_area) },
      });
      setUltimoActivo(nuevoActivo);
      setMensaje("Activo registrado en el mapa. Si corresponde, crea un usuario del sistema.");
      setActivo({ codigo: "", nombre: "", marca: "", modelo: "", numero_serie: "", estado: "activo", estado_conexion: "conectado", fuera_empresa: false, id_tipo_activo: "", id_responsable: "", id_area: "", es_movil: true });
      setPasoActivo("usuario");
      cargarCatalogos();
      onRefresh();
    } catch (error) {
      setMensaje(error instanceof Error ? error.message : "No se pudo registrar el activo");
    }
  }

  async function crearUsuario(event: React.FormEvent) {
    event.preventDefault();
    try {
      await apiRequest("/auth/register", {
        method: "POST",
        body: { ...usuario, id_responsable: Number(usuario.id_responsable) },
      });
      setMensaje("Usuario registrado. El flujo principal quedó completo.");
      setUsuario({ usuario: "", password: "", codigo_registro: "", id_responsable: "" });
    } catch (error) {
      setMensaje(error instanceof Error ? error.message : "No se pudo crear el usuario");
    }
  }

  const pasos = [
    { id: "responsable", numero: 1, titulo: "Responsable", ayuda: "Registra a la persona que tendrá activos asignados." },
    { id: "asignacion", numero: 2, titulo: "Asignación", ayuda: "Define el área laboral del responsable." },
    { id: "activo", numero: 3, titulo: "Activo TI", ayuda: "Registra el equipo y el sistema generará su ubicación." },
    { id: "usuario", numero: 4, titulo: "Usuario", ayuda: "Crea acceso solo para responsables autorizados." },
  ] as const;
  const areaUltimaAsignacion = ultimaAsignacion
    ? areas.find((area) => area.id_area === ultimaAsignacion.id_area)
    : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      <Topbar T={T} title="Registros" sub="Flujo recomendado: responsable, asignación laboral, activo y usuario del sistema" />
      <div style={{ overflow: "auto", padding: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 280px", gap: 16 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ ...panelStyle(T), marginBottom: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 10 }}>
                {pasos.map((paso) => {
                  const active = pasoActivo === paso.id;
                  return (
                    <button
                      key={paso.id}
                      type="button"
                      onClick={() => setPasoActivo(paso.id)}
                      style={{
                        background: active ? `${T.accent}22` : T.bg3,
                        border: `1px solid ${active ? T.accent : T.border}`,
                        borderRadius: 8,
                        color: active ? T.accent : T.text2,
                        padding: "10px 8px",
                        textAlign: "left",
                        cursor: "pointer",
                      }}
                    >
                      <span style={{ display: "block", fontSize: 10, fontWeight: 800, marginBottom: 4 }}>Paso {paso.numero}</span>
                      <span style={{ display: "block", fontSize: 13, fontWeight: 800 }}>{paso.titulo}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {mensaje && <div style={{ ...panelStyle(T), color: T.accent, fontSize: 13, marginBottom: 16 }}>{mensaje}</div>}

            {pasoActivo === "responsable" && (
              <form onSubmit={crearResponsable} style={panelStyle(T)}>
                <SectionLabel T={T}>1. Registrar responsable</SectionLabel>
                <p style={{ margin: "0 0 14px", color: T.text3, fontSize: 12 }}>Primero registra a la persona que tendrá asignaciones laborales y activos TI.</p>
                <input required placeholder="Nombres" value={responsable.nombres} onChange={(e) => setResponsable({ ...responsable, nombres: e.target.value })} style={formInput(T)} />
                <input required placeholder="Apellidos" value={responsable.apellidos} onChange={(e) => setResponsable({ ...responsable, apellidos: e.target.value })} style={formInput(T)} />
                <input required type="email" placeholder="Correo institucional" value={responsable.correo} onChange={(e) => setResponsable({ ...responsable, correo: e.target.value })} style={formInput(T)} />
                <input placeholder="Teléfono" value={responsable.telefono} onChange={(e) => setResponsable({ ...responsable, telefono: e.target.value })} style={formInput(T)} />
                <button style={primaryButton(T)}>Guardar responsable y continuar</button>
              </form>
            )}

            {pasoActivo === "asignacion" && (
              <form onSubmit={crearAsignacion} style={panelStyle(T)}>
                <SectionLabel T={T}>2. Crear asignación laboral</SectionLabel>
                <p style={{ margin: "0 0 14px", color: T.text3, fontSize: 12 }}>La asignación laboral indica dónde trabaja el responsable. No representa la ubicación física del activo.</p>
                <select required value={asignacion.id_responsable} onChange={(e) => setAsignacion({ ...asignacion, id_responsable: e.target.value })} style={formInput(T)}>
                  <option value="">Responsable</option>
                  {responsablesLaborando.map((r) => <option key={r.id_responsable} value={r.id_responsable}>{r.nombres} {r.apellidos} - {r.estado}</option>)}
                </select>
                <select required value={asignacion.id_area} onChange={(e) => setAsignacion({ ...asignacion, id_area: e.target.value })} style={formInput(T)}>
                  <option value="">Área laboral</option>
                  {areas.map((a) => <option key={a.id_area} value={a.id_area}>{a.nombre}</option>)}
                </select>
                <input required type="date" value={asignacion.fecha_inicio} onChange={(e) => setAsignacion({ ...asignacion, fecha_inicio: e.target.value })} style={formInput(T)} />
                <button style={primaryButton(T)}>Guardar asignación y continuar</button>
              </form>
            )}

            {pasoActivo === "activo" && (
              <form onSubmit={crearActivo} style={panelStyle(T)}>
                <SectionLabel T={T}>3. Registrar activo TI</SectionLabel>
                <p style={{ margin: "0 0 14px", color: T.text3, fontSize: 12 }}>Selecciona el área inicial; el sistema generará coordenadas automáticamente dentro del mapa.</p>
                <input required placeholder="Código del activo" value={activo.codigo} onChange={(e) => setActivo({ ...activo, codigo: e.target.value })} style={formInput(T)} />
                <input required placeholder="Nombre del activo" value={activo.nombre} onChange={(e) => setActivo({ ...activo, nombre: e.target.value })} style={formInput(T)} />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
                  <input placeholder="Marca" value={activo.marca} onChange={(e) => setActivo({ ...activo, marca: e.target.value })} style={formInput(T)} />
                  <input placeholder="Modelo" value={activo.modelo} onChange={(e) => setActivo({ ...activo, modelo: e.target.value })} style={formInput(T)} />
                  <input placeholder="Número de serie" value={activo.numero_serie} onChange={(e) => setActivo({ ...activo, numero_serie: e.target.value })} style={formInput(T)} />
                </div>
                <select required value={activo.id_tipo_activo} onChange={(e) => setActivo({ ...activo, id_tipo_activo: e.target.value })} style={formInput(T)}>
                  <option value="">Tipo de activo</option>
                  {tipos.map((t) => <option key={t.id_tipo_activo} value={t.id_tipo_activo}>{t.nombre}</option>)}
                </select>
                <select required value={activo.id_responsable} onChange={(e) => setActivo({ ...activo, id_responsable: e.target.value })} style={formInput(T)}>
                  <option value="">Responsable</option>
                  {responsablesLaborando.map((r) => <option key={r.id_responsable} value={r.id_responsable}>{r.nombres} {r.apellidos}</option>)}
                </select>
                <select required value={activo.id_area} onChange={(e) => setActivo({ ...activo, id_area: e.target.value })} style={formInput(T)}>
                  <option value="">Área inicial</option>
                  {areasRegistroInicial.map((a) => <option key={a.id_area} value={a.id_area}>{a.nombre}</option>)}
                </select>
                <p style={{ margin: "-6px 0 12px", fontSize: 11, color: T.text3 }}>Baños no se permite como área inicial de registro.</p>
                <button style={primaryButton(T)}>Registrar activo en el mapa</button>
              </form>
            )}

            {pasoActivo === "usuario" && (
              <form onSubmit={crearUsuario} style={panelStyle(T)}>
                <SectionLabel T={T}>4. Crear usuario del sistema</SectionLabel>
                <p style={{ margin: "0 0 14px", color: T.text3, fontSize: 12 }}>Solo crea usuario para personal autorizado a ingresar al sistema.</p>
                <input required placeholder="Usuario" value={usuario.usuario} onChange={(e) => setUsuario({ ...usuario, usuario: e.target.value })} style={formInput(T)} />
                <input required placeholder="Contraseña" type="password" value={usuario.password} onChange={(e) => setUsuario({ ...usuario, password: e.target.value })} style={formInput(T)} />
                <input required placeholder="Código de registro" value={usuario.codigo_registro} onChange={(e) => setUsuario({ ...usuario, codigo_registro: e.target.value })} style={formInput(T)} />
                <select required value={usuario.id_responsable} onChange={(e) => setUsuario({ ...usuario, id_responsable: e.target.value })} style={formInput(T)}>
                  <option value="">Responsable de TI / Sistemas</option>
                  {responsablesSistemas.map((r) => <option key={r.id_responsable} value={r.id_responsable}>{r.nombres} {r.apellidos}</option>)}
                </select>
                <button style={primaryButton(T)}>Crear usuario del sistema</button>
              </form>
            )}
          </div>

          <aside style={{ ...panelStyle(T), position: "sticky", top: 20, alignSelf: "start" }}>
            <SectionLabel T={T}>Contexto del registro</SectionLabel>
            <RegistroResumen label="Responsable" value={ultimoResponsable ? `${ultimoResponsable.nombres} ${ultimoResponsable.apellidos}` : "Pendiente"} T={T} />
            <RegistroResumen label="Área laboral" value={areaUltimaAsignacion?.nombre ?? "Pendiente"} T={T} />
            <RegistroResumen label="Último activo" value={ultimoActivo ? `${ultimoActivo.codigo} - ${ultimoActivo.nombre}` : "Pendiente"} T={T} />
            <div style={{ marginTop: 14, padding: 12, borderRadius: 8, background: T.bg3, border: `1px solid ${T.border}` }}>
              <p style={{ margin: 0, color: T.text3, fontSize: 11, lineHeight: 1.5 }}>
                Para bajas, mantenimiento o reasignaciones usa la pestaña Mantenimiento. Así el registro de datos nuevos queda separado de la gestión posterior.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function panelStyle(T: ThemeColors): CSSProperties {
  return { background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16 };
}

function RegistroResumen({ label, value, T }: { label: string; value: string; T: ThemeColors }) {
  return (
    <div style={{ padding: "12px 0", borderBottom: `1px solid ${T.border}` }}>
      <p style={{ margin: "0 0 4px", color: T.text3, fontSize: 10, fontWeight: 800, textTransform: "uppercase" }}>{label}</p>
      <p style={{ margin: 0, color: T.text1, fontSize: 13, fontWeight: 700 }}>{value}</p>
    </div>
  );
}

function FichaDato({ label, value, T }: { label: string; value: string; T: ThemeColors }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "90px minmax(0, 1fr)", gap: 8 }}>
      <span style={{ color: T.text3 }}>{label}</span>
      <span style={{ color: T.text1, fontWeight: 700, overflowWrap: "anywhere" }}>{value}</span>
    </div>
  );
}

/* ===============================================================
   PAGE 3 - MANTENIMIENTO
=============================================================== */
function MantenimientoPage({
  T,
  activos,
  areas,
  tipos,
  responsables,
  token,
  onRefresh,
}: {
  T: ThemeColors;
  activos: ActivoBackend[];
  areas: AreaMapa[];
  tipos: TipoActivo[];
  responsables: Responsable[];
  token: string;
  onRefresh: () => void;
}) {
  const [actualizandoId, setActualizandoId] = useState<number | null>(null);
  const [estadoResponsable, setEstadoResponsable] = useState({ id_responsable: "", estado: "fuera_de_labores" });
  const [reasignacion, setReasignacion] = useState({ id_activo: "", id_responsable: "", id_area: "" });
  const [mensajeMantenimiento, setMensajeMantenimiento] = useState("");
  const nombreArea = (idArea: number) => areas.find((area) => area.id_area === idArea)?.nombre ?? `Área ${idArea}`;
  const nombreTipo = (idTipo: number) => tipos.find((tipo) => tipo.id_tipo_activo === idTipo)?.nombre ?? `Tipo ${idTipo}`;
  const nombreResponsable = (idResponsable: number) => {
    const responsable = responsables.find((item) => item.id_responsable === idResponsable);
    return responsable ? `${responsable.nombres} ${responsable.apellidos}` : `Responsable ${idResponsable}`;
  };
  const estadosMantenimiento = ["mantenimiento", "baja", "pendiente_reasignacion"];
  const items = activos.filter((activo) => estadosMantenimiento.includes(activo.estado));
  const activosPendientes = activos.filter((activo) => activo.estado === "pendiente_reasignacion");
  const responsablesLaborando = responsables.filter((responsable) => responsable.estado !== "fuera_de_labores");
  const areasReasignacion = areas.filter((area) => normalizarNombreArea(area.nombre) !== "banos");
  const colorEstado = (estado: string) => {
    if (estado === "mantenimiento") return T.yellow;
    if (estado === "baja") return T.red;
    return T.accent;
  };
  const textoEstado = (estado: string) => {
    if (estado === "pendiente_reasignacion") return "Pendiente de reasignación";
    return estado.charAt(0).toUpperCase() + estado.slice(1);
  };
  async function cambiarEstado(idActivo: number, estado: string) {
    setActualizandoId(idActivo);
    setMensajeMantenimiento("");

    try {
      await apiRequest(`/activos/${idActivo}/estado`, {
        method: "PUT",
        token,
        body: { estado },
      });
      onRefresh();
      setMensajeMantenimiento("Estado del activo actualizado.");
    } catch (error) {
      setMensajeMantenimiento(error instanceof Error ? error.message : "No se pudo actualizar el activo");
    } finally {
      setActualizandoId(null);
    }
  }
  async function cambiarEstadoResponsable(event: React.FormEvent) {
    event.preventDefault();
    setMensajeMantenimiento("");

    try {
      await apiRequest(`/responsables/${estadoResponsable.id_responsable}/estado`, {
        method: "PUT",
        token,
        body: { estado: estadoResponsable.estado },
      });
      setMensajeMantenimiento("Estado del responsable actualizado.");
      setEstadoResponsable({ id_responsable: "", estado: "fuera_de_labores" });
      onRefresh();
    } catch (error) {
      setMensajeMantenimiento(error instanceof Error ? error.message : "No se pudo actualizar el responsable");
    }
  }
  async function reasignarActivo(event: React.FormEvent) {
    event.preventDefault();
    setMensajeMantenimiento("");

    try {
      await apiRequest(`/activos/${reasignacion.id_activo}/reasignar`, {
        method: "PUT",
        token,
        body: {
          id_responsable: Number(reasignacion.id_responsable),
          id_area: Number(reasignacion.id_area),
        },
      });
      setMensajeMantenimiento("Activo reasignado correctamente.");
      setReasignacion({ id_activo: "", id_responsable: "", id_area: "" });
      onRefresh();
    } catch (error) {
      setMensajeMantenimiento(error instanceof Error ? error.message : "No se pudo reasignar el activo");
    }
  }
  const byArea = areas
    .map((area) => ({
      id: area.id_area,
      nombre: area.nombre,
      total: items.filter((activo) => activo.id_area === area.id_area).length,
    }))
    .filter((area) => area.total > 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      <Topbar T={T} title="Gestión de Mantenimiento" sub={`${items.length} activos requieren revisión, baja o reasignación`} />

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", padding: "12px 20px", background: T.bg1, borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
        {byArea.length === 0 ? (
          <span style={{ fontSize: 12, color: T.text3 }}>No hay activos que requieran revisión.</span>
        ) : (
          byArea.map((area) => (
            <div key={area.id} style={{ display: "flex", alignItems: "center", gap: 8, background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 10, padding: "6px 14px" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: T.yellow, display: "inline-block", boxShadow: `0 0 6px ${T.yellow}` }}/>
              <span style={{ fontSize: 11.5, color: T.text2 }}>{area.nombre.toUpperCase()}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: T.yellow }}>{area.total}</span>
            </div>
          ))
        )}
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: 20 }}>
        <div style={{ ...panelStyle(T), marginBottom: 16 }}>
          <SectionLabel T={T}>Estado de responsable</SectionLabel>
          <p style={{ margin: "0 0 12px", color: T.text3, fontSize: 12 }}>
            Si un responsable deja de laborar, su usuario se deshabilita y sus activos quedan pendientes de reasignación.
          </p>
          {mensajeMantenimiento && <p style={{ margin: "0 0 12px", color: T.accent, fontSize: 12 }}>{mensajeMantenimiento}</p>}
          <form onSubmit={cambiarEstadoResponsable} style={{ display: "grid", gridTemplateColumns: "minmax(220px, 1fr) 200px 180px", gap: 10, alignItems: "start" }}>
            <select required value={estadoResponsable.id_responsable} onChange={(e) => setEstadoResponsable({ ...estadoResponsable, id_responsable: e.target.value })} style={formInput(T)}>
              <option value="">Responsable</option>
              {responsables.map((r) => <option key={r.id_responsable} value={r.id_responsable}>{r.nombres} {r.apellidos} - {r.estado}</option>)}
            </select>
            <select required value={estadoResponsable.estado} onChange={(e) => setEstadoResponsable({ ...estadoResponsable, estado: e.target.value })} style={formInput(T)}>
              <option value="laborando">Laborando</option>
              <option value="fuera_de_labores">Fuera de labores</option>
            </select>
            <button style={primaryButton(T)}>Actualizar responsable</button>
          </form>
        </div>

        <div style={{ ...panelStyle(T), marginBottom: 16 }}>
          <SectionLabel T={T}>Reasignación de activo</SectionLabel>
          <p style={{ margin: "0 0 12px", color: T.text3, fontSize: 12 }}>
            Usa este flujo cuando un activo quede pendiente por salida o cambio de responsable.
          </p>
          <form onSubmit={reasignarActivo} style={{ display: "grid", gridTemplateColumns: "minmax(220px, 1fr) minmax(180px, 1fr) minmax(160px, 1fr) 160px", gap: 10, alignItems: "start" }}>
            <select required value={reasignacion.id_activo} onChange={(e) => setReasignacion({ ...reasignacion, id_activo: e.target.value })} style={formInput(T)}>
              <option value="">Activo pendiente</option>
              {activosPendientes.map((activo) => <option key={activo.id_activo} value={activo.id_activo}>{activo.codigo} - {activo.nombre}</option>)}
            </select>
            <select required value={reasignacion.id_responsable} onChange={(e) => setReasignacion({ ...reasignacion, id_responsable: e.target.value })} style={formInput(T)}>
              <option value="">Nuevo responsable</option>
              {responsablesLaborando.map((responsable) => <option key={responsable.id_responsable} value={responsable.id_responsable}>{responsable.nombres} {responsable.apellidos}</option>)}
            </select>
            <select required value={reasignacion.id_area} onChange={(e) => setReasignacion({ ...reasignacion, id_area: e.target.value })} style={formInput(T)}>
              <option value="">Nueva área</option>
              {areasReasignacion.map((area) => <option key={area.id_area} value={area.id_area}>{area.nombre}</option>)}
            </select>
            <button style={primaryButton(T)}>Reasignar</button>
          </form>
        </div>

        {items.length === 0 ? (
          <div style={{ color: T.text3, fontSize: 14, textAlign: "center", padding: 60 }}>
            No existen activos registrados con estado mantenimiento, baja o pendiente de reasignación.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 14 }}>
            {items.map((activo) => (
              <div
                key={activo.id_activo}
                style={{
                  background: T.bg2,
                  border: `1px solid ${T.border}`,
                  borderRadius: 14,
                  padding: "16px",
                  borderLeft: `4px solid ${colorEstado(activo.estado)}`,
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,0,0,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <code style={{ fontSize: 11, color: T.accent, fontWeight: 600 }}>{activo.codigo}</code>
                  <span style={{
                    background: `${colorEstado(activo.estado)}15`,
                    color: colorEstado(activo.estado),
                    border: `1px solid ${colorEstado(activo.estado)}40`,
                    display: "inline-block",
                    padding: "3px 12px",
                    borderRadius: 20,
                    fontSize: 10.5,
                    fontWeight: 600,
                  }}>
                    {textoEstado(activo.estado)}
                  </span>
                </div>
                <h3 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 600, color: T.text1 }}>{activo.nombre}</h3>
                <p style={{ margin: "0 0 10px", fontSize: 11.5, color: T.text3 }}>{nombreTipo(activo.id_tipo_activo)} · {nombreArea(activo.id_area)}</p>
                <div style={{ background: T.bg3, border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 12px", marginBottom: 10 }}>
                  <span style={{ fontSize: 11.5, color: T.text2 }}>
                    Estado de conexión: {activo.estado_conexion}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                  <button
                    type="button"
                    disabled={actualizandoId === activo.id_activo}
                    onClick={() => cambiarEstado(activo.id_activo, "activo")}
                    style={secondaryButton(T.green)}
                  >
                    Marcar operativo
                  </button>
                  <button
                    type="button"
                    disabled={actualizandoId === activo.id_activo}
                    onClick={() => cambiarEstado(activo.id_activo, "mantenimiento")}
                    style={secondaryButton(T.yellow)}
                  >
                    En mantenimiento
                  </button>
                  <button
                    type="button"
                    disabled={actualizandoId === activo.id_activo}
                    onClick={() => cambiarEstado(activo.id_activo, "baja")}
                    style={secondaryButton(T.red)}
                  >
                    Dar de baja
                  </button>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, paddingTop: 8, borderTop: `1px solid ${T.border}40` }}>
                  <span style={{ fontSize: 10.5, color: T.text3 }}>{nombreResponsable(activo.id_responsable)}</span>
                  <span style={{ fontSize: 10.5, color: T.text3 }}>{activo.marca ?? "-"} · {activo.fecha_registro.slice(0, 10)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ===============================================================
   PAGE 4 - REPORTES
=============================================================== */
function ReportesPage({
  T,
  activos,
  areas,
  tipos,
}: {
  T: ThemeColors;
  activos: ActivoBackend[];
  areas: AreaMapa[];
  tipos: TipoActivo[];
}) {
  const tiposPorId = new Map(tipos.map((tipo) => [tipo.id_tipo_activo, tipo.nombre]));
  const totalActivos = activos.length;
  const totalMantenimiento = activos.filter((activo) => activo.estado === "mantenimiento").length;
  const totalOperativos = Math.max(totalActivos - totalMantenimiento, 0);
  const areasConActivos = areas
    .map((area) => {
      const activosArea = activos.filter((activo) => activo.id_area === area.id_area);
      const mantenimiento = activosArea.filter((activo) => activo.estado === "mantenimiento").length;

      return {
        id: area.id_area,
        nombre: area.nombre.toUpperCase(),
        activos: activosArea.length,
        operativos: activosArea.length - mantenimiento,
        mantenimiento,
      };
    })
    .filter((area) => area.activos > 0);
  const maxVal = Math.max(1, ...areasConActivos.map((area) => area.activos));

  const tipoMap = (() => {
    const m: Record<string, number> = {};
    activos.forEach((activo) => {
      const tipo = tiposPorId.get(activo.id_tipo_activo) ?? `Tipo ${activo.id_tipo_activo}`;
      m[tipo] = (m[tipo] || 0) + 1;
    });
    return Object.entries(m).sort((x, y) => y[1] - x[1]);
  })();

  const R = 48, C2 = 2 * Math.PI * R;
  const opPct = totalActivos > 0 ? totalOperativos / totalActivos : 0;
  const mantPct = totalActivos > 0 ? totalMantenimiento / totalActivos : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      <Topbar T={T} title="Reportes y Analítica" sub="Estado consolidado del parque tecnológico" />
      <div style={{ flex: 1, overflow: "auto", padding: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>

          {/* Activos por área */}
          <div style={{ gridColumn: "1 / -1", background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 16, padding: 20 }}>
            <SectionLabel T={T}>Activos por Área</SectionLabel>
            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              {areasConActivos.length === 0 ? (
                <p style={{ margin: 0, color: T.text3, fontSize: 13 }}>No hay activos registrados para reportar.</p>
              ) : areasConActivos.map((area) => (
                <div key={area.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 11, color: T.text3, width: 180, flexShrink: 0, textAlign: "right", fontWeight: 500 }}>{area.nombre}</span>
                  <div style={{ flex: 1, background: T.bg3, borderRadius: 6, height: 20, overflow: "hidden", position: "relative" }}>
                    <div style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      height: "100%",
                      width: `${(area.operativos / maxVal) * 100}%`,
                      background: T.green,
                      borderRadius: 6,
                      transition: "width 0.5s ease",
                    }} />
                    <div style={{
                      position: "absolute",
                      left: `${(area.operativos / maxVal) * 100}%`,
                      top: 0,
                      height: "100%",
                      width: `${(area.mantenimiento / maxVal) * 100}%`,
                      background: T.yellow,
                      borderRadius: 6,
                      transition: "width 0.5s ease",
                    }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: T.text1, width: 30, textAlign: "right" }}>{area.activos}</span>
                </div>
              ))}
              <div style={{ display: "flex", gap: 20, marginTop: 12, paddingLeft: 192 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 12, height: 12, background: T.green, borderRadius: 3, display: "inline-block" }} />
                  <span style={{ fontSize: 11, color: T.text3 }}>Operativo</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 12, height: 12, background: T.yellow, borderRadius: 3, display: "inline-block" }} />
                  <span style={{ fontSize: 11, color: T.text3 }}>Mantenimiento</span>
                </div>
              </div>
            </div>
          </div>

          {/* Estado General - Donut Chart */}
          <div style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 16, padding: 20 }}>
            <SectionLabel T={T}>Estado General</SectionLabel>
            <div style={{ display: "flex", alignItems: "center", gap: 24, marginTop: 20 }}>
              <svg width="130" height="130" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r={R} fill="none" stroke={T.bg3} strokeWidth="12" />
                <circle
                  cx="60" cy="60" r={R} fill="none" stroke={T.green} strokeWidth="12"
                  strokeDasharray={`${opPct * C2} ${C2}`} strokeDashoffset={0} transform="rotate(-90 60 60)"
                  style={{ filter: `drop-shadow(0 0 6px ${T.green})`, transition: "stroke-dasharray 0.8s ease" }}
                />
                <circle
                  cx="60" cy="60" r={R} fill="none" stroke={T.yellow} strokeWidth="12"
                  strokeDasharray={`${mantPct * C2} ${C2}`} strokeDashoffset={-(opPct * C2)} transform="rotate(-90 60 60)"
                  style={{ filter: `drop-shadow(0 0 6px ${T.yellow})`, transition: "stroke-dasharray 0.8s ease" }}
                />
                <text x="60" y="56" textAnchor="middle" fill={T.text1} fontSize="18" fontWeight="800">{Math.round(opPct * 100)}%</text>
                <text x="60" y="72" textAnchor="middle" fill={T.text3} fontSize="9">operativo</text>
              </svg>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
                {[
                  { label: "Operativos", value: totalOperativos, color: T.green },
                  { label: "Mantenimiento", value: totalMantenimiento, color: T.yellow }
                ].map(x => (
                  <div key={x.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: x.color, display: "inline-block", boxShadow: `0 0 8px ${x.color}` }} />
                    <span style={{ fontSize: 12.5, color: T.text2, flex: 1 }}>{x.label}</span>
                    <span style={{ fontSize: 20, fontWeight: 800, color: x.color }}>{x.value}</span>
                  </div>
                ))}
                <div style={{ marginTop: 8, background: T.bg3, borderRadius: 10, padding: "10px 14px", textAlign: "center" }}>
                  <span style={{ fontSize: 11, color: T.text3 }}>Total registrados</span>
                  <span style={{ fontSize: 22, fontWeight: 800, color: T.accent, marginLeft: 12 }}>{totalActivos}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Por tipo de equipo */}
          <div style={{ background: T.bg2, border: `1px solid ${T.border}`, borderRadius: 16, padding: 20 }}>
            <SectionLabel T={T}>Por Tipo de Equipo</SectionLabel>
            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
              {tipoMap.length === 0 ? (
                <p style={{ margin: 0, color: T.text3, fontSize: 13 }}>No hay tipos con activos registrados.</p>
              ) : tipoMap.map(([tipo, count]) => {
                const maxCount = tipoMap[0][1];
                return (
                  <div key={tipo} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontSize: 12, color: T.text2, width: 90, flexShrink: 0, fontWeight: 500 }}>{tipo}</span>
                    <div style={{ flex: 1, background: T.bg3, borderRadius: 8, height: 14, overflow: "hidden" }}>
                      <div style={{
                        height: "100%",
                        borderRadius: 8,
                        background: `linear-gradient(90deg, ${T.accent}, ${T.accent}cc)`,
                        width: `${(count / maxCount) * 100}%`,
                        boxShadow: `0 0 8px ${T.accent}80`,
                        transition: "width 0.5s ease",
                      }} />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: T.text2, width: 30, textAlign: "right" }}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===============================================================
   MICRO-COMPONENTS
=============================================================== */
function SectionLabel({ children, T }: { children: React.ReactNode; T: ThemeColors }) {
  return (
    <p style={{
      margin: 0,
      fontSize: 10,
      fontWeight: 700,
      color: T.text3,
      letterSpacing: "2px",
      textTransform: "uppercase",
    }}>
      {children}
    </p>
  );
}

interface SRowProps {
  icon: string;
  label: string;
  value: number;
  vc?: string;
  T: ThemeColors;
}

function SRow({ icon, label, value, vc, T }: SRowProps) {
  const color = vc || T.text1;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${T.border}30` }}>
      <span style={{ fontSize: 13 }}>{icon}</span>
      <span style={{ flex: 1, fontSize: 12, color: T.text2 }}>{label}</span>
      <span style={{ fontSize: 15, fontWeight: 700, color }}>{value}</span>
    </div>
  );
}

/* ===============================================================
   ROOT APP
=============================================================== */
export default function App() {
  const [page, setPage] = useState<Page>("dashboard");
  const [mapaDatos, setMapaDatos] = useState<MapaDatos | null>(null);
  const [tiposActivo, setTiposActivo] = useState<TipoActivo[]>([]);
  const [responsables, setResponsables] = useState<Responsable[]>([]);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem("theme") as Theme;
    return saved || "dark";
  });
  const T = theme === "dark" ? DARK_THEME : LIGHT_THEME;

  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.documentElement.style.setProperty("--bg2", T.bg2);
    document.documentElement.style.setProperty("--border", T.border);
    document.documentElement.style.setProperty("--accent", T.accent);
  }, [theme, T]);

  const toggleTheme = () => {
    setTheme(prev => prev === "dark" ? "light" : "dark");
  };

  function cargarMapa() {
    if (!token) return;

    Promise.all([
      apiRequest<MapaDatos>("/mapa/datos"),
      apiRequest<TipoActivo[]>("/tipos-activo"),
      apiRequest<Responsable[]>("/responsables"),
    ])
      .then(([datosMapa, tipos, responsablesData]) => {
        setMapaDatos(datosMapa);
        setTiposActivo(tipos);
        setResponsables(responsablesData);
      })
      .catch((error) => {
        console.error("Error cargando datos del mapa:", error);
      });
  }

  useEffect(() => {
    cargarMapa();
  }, [token]);

  useEffect(() => {
    if (!token) return;

    const socket = new WebSocket(WS_URL);

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as ActivosActualizadosMessage;

        if (message.type !== "activos_actualizados") return;

        setMapaDatos((actual) => {
          if (!actual) return actual;

          const actualizaciones = new Map(
            message.data.map((activo) => [activo.id_activo, activo]),
          );

          return {
            ...actual,
            activos: actual.activos.map((activo) => {
              const activoActualizado = actualizaciones.get(activo.id_activo);

              if (!activoActualizado) return activo;

              return {
                ...activo,
                id_area: activoActualizado.id_area,
                coord_x_actual: activoActualizado.coord_x_actual,
                coord_y_actual: activoActualizado.coord_y_actual,
              };
            }),
          };
        });

        cargarMapa();
      } catch (error) {
        console.error("Mensaje WebSocket inválido:", error);
      }
    };

    socket.onerror = (error) => {
      console.error("Error en WebSocket de activos:", error);
    };

    return () => {
      socket.close();
    };
  }, [token]);

  const areasMapa = mapaDatos
    ? adaptarAreasBackend(mapaDatos.areas, mapaDatos.activos)
    : AREAS;
  const activosMapa = mapaDatos?.activos ?? [];
  const alertasMapa = mapaDatos?.alertas ?? [];
  const mantenimientoCount = activosMapa.filter((activo) =>
    ["mantenimiento", "baja", "pendiente_reasignacion"].includes(activo.estado)
  ).length;

  function logout() {
    localStorage.removeItem("token");
    setMapaDatos(null);
    setTiposActivo([]);
    setResponsables([]);
    setPage("dashboard");
    setToken(null);
  }

  // Agregar animación global al documento
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      @keyframes fadeInUp {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  if (!token) {
    return <LoginPage T={T} onLogin={setToken} />;
  }

  return (
    <div style={{
      display: "flex",
      width: "100%",
      height: "100%",
      background: T.bg0,
      color: T.text1,
      overflow: "hidden",
      transition: "background 0.3s ease, color 0.3s ease",
    }}>
      <ThemeToggle theme={theme} onToggle={toggleTheme} />
      <Sidebar page={page} onChange={setPage} T={T} mantenimientoCount={mantenimientoCount} onLogout={logout} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, minHeight: 0, overflow: "hidden" }}>
        {page === "dashboard" && <DashboardPage T={T} areas={areasMapa} activos={activosMapa} alertas={alertasMapa} tipos={tiposActivo} responsables={responsables} token={token} onRefresh={cargarMapa} />}
        {page === "inventario" && <InventarioPage T={T} activos={activosMapa} areas={mapaDatos?.areas ?? []} tipos={tiposActivo} responsables={responsables} />}
        {page === "registros" && <RegistrosPage T={T} token={token} onRefresh={cargarMapa} />}
        {page === "mantenimiento" && <MantenimientoPage T={T} activos={activosMapa} areas={mapaDatos?.areas ?? []} tipos={tiposActivo} responsables={responsables} token={token} onRefresh={cargarMapa} />}
        {page === "reportes" && <ReportesPage T={T} activos={activosMapa} areas={mapaDatos?.areas ?? []} tipos={tiposActivo} />}
      </div>
    </div>
  );
}



