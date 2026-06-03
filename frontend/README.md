# 🖥️ SIGA-TI - Sistema de Gestión de Activos TI

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![React](https://img.shields.io/badge/React-18.2.0-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript)
![License](https://img.shields.io/badge/license-MIT-green)

Sistema interactivo de gestión de inventario y mantenimiento de activos tecnológicos para **MC Contratistas Mineros S.A.C.**

## ✨ Características

- 📊 **Dashboard interactivo** con mapa de oficinas y estado de activos en tiempo real
- 📋 **Inventario completo** con búsqueda y filtros avanzados
- 🔧 **Gestión de mantenimiento** con seguimiento de equipos fuera de servicio
- 📈 **Reportes y analíticas** con gráficos de distribución y estado general
- 🌓 **Modo oscuro/claro** persistente
- 📱 **Diseño responsive** adaptable a diferentes dispositivos

## 🚀 Tecnologías

- **Frontend:** React 18 + TypeScript
- **Estilos:** CSS-in-JS (objetos de estilo)
- **Estado:** Hooks de React (useState, useMemo, useEffect)
- **Build Tool:** Vite (recomendado)

## 📦 Instalación

1. Clona el repositorio:
\`\`\`bash
git clone https://github.com/tuusuario/siga-ti.git
cd siga-ti
\`\`\`

2. Instala las dependencias:
\`\`\`bash
npm install
\`\`\`

3. Inicia el servidor de desarrollo:
\`\`\`bash
npm run dev
\`\`\`

4. Abre [http://localhost:5173](http://localhost:5173) en tu navegador.

## 📁 Estructura del Proyecto

\`\`\`
src/
├── App.tsx                 # Componente principal
├── components/            # Componentes reutilizables
├── data/                  # Datos mock y constantes
├── hooks/                 # Custom hooks
├── styles/                # Tokens de diseño y temas
├── types/                 # Definiciones de TypeScript
└── utils/                 # Funciones utilitarias
\`\`\`

## 🎨 Temas

El sistema incluye dos temas completos:

| Tema Oscuro | Tema Claro |
|-------------|------------|
| ![Dark](screenshots/dark.png) | ![Light](screenshots/light.png) |

## 📊 Estados de Activos

- 🟢 **Operativo:** Equipo funcionando correctamente
- 🟡 **Mantenimiento:** Requiere reparación o revisión
- 🔴 **Atención requerida:** Múltiples equipos en mantenimiento (>5)
- ⚪ **Sin activos:** Área sin equipos TI registrados

## 🔜 Próximas Mejoras

- [ ] Backend con API REST
- [ ] Base de datos PostgreSQL
- [ ] Autenticación de usuarios
- [ ] Exportación de reportes a PDF/Excel
- [ ] Notificaciones en tiempo real
- [ ] Tests unitarios con Jest

## 📝 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 👨‍💻 Autor

**Tu Nombre**
- GitHub: [@tuusuario](https://github.com/tuusuario)
- LinkedIn: [Tu Perfil](https://linkedin.com/in/tuperfil)

---

Desarrollado con ❤️ para MC Contratistas Mineros S.A.C.