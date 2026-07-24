# Skill: UI/UX — POS Amigable para Usuario No Técnico

## Objetivo
Rediseñar la experiencia del POS (`SalesView.tsx`) para que un usuario sin conocimientos técnicos pueda agregar **productos** y **servicios** a una venta de forma intuitiva, visual y rápida.

## Stack Visual
- **Framework**: React 19 + TypeScript
- **Estilos**: Tailwind CSS v4 con temas cyberspace (clases: `cyber-bg`, `cyber-panel`, `cyber-cyan`, `cyber-purple`, `text-textD`, `text-cyber-cyan`, `font-orbitron`, `font-mono`)
- **Iconos**: lucide-react
- **Feedback visual**: `motion` para animaciones (framer-motion wrapper)
- **No se usa ninguna librería de UI ni componente externo**

## Problema Actual
1. **Servicios solo desde modal**: El POS solo tiene flujo para productos (inventario). Para agregar un servicio, el usuario debe abrir otra ventana ("Nueva Venta") y usar un modal anidado ("Confeccionar Detalle de Trabajo")
2. **Flujo confuso**: "Nueva Venta" → "+ Servicio" → modal con campos sueltos sin preview visual. Usuario no-técnico no sabe qué campos llenar para cada tipo de servicio
3. **Sin descubribilidad**: Los servicios no aparecen en la interfaz principal del POS

## Solución Propuesta: Cards de Servicios Expandibles

### Layout objetivo del POS (3 columnas)

```
┌─────────────────┬─────────────────┬─────────────────┐
│  LEFT           │  CENTER          │  RIGHT           │
│                 │                  │                  │
│  Buscar cliente │  [Servicios]     │  Totales         │
│  (autocomplete) │  ┌───┐ ┌───┐    │  - Subtotal      │
│                 │  │ C │ │ L │    │  - ISV           │
│  [Cliente info] │  │ o │ │ á │    │  - Descuento     │
│                 │  │ r │ │ s │    │  - Total         │
│  Carrito actual │  │ t │ │ e │    │                  │
│  ┌───┬───┬───┐  │  │ e │ │ r │    │  [CLIENTE]       │
│  │ P │ S │ P │  │  │   │ │   │    │  [PAGAR] btn    │
│  │ r │ e │ r │  │  └───┘ └───┘    │                  │
│  │ o │ r │ o │  │  Al hacer clic   │  [CAMBIAR]      │
│  │ d │ v │ d │  │  en card se      │                  │
│  │ 1 │ 1 │ 2 │  │  abre modal      │                  │
│  └───┴───┴───┘  │  con campos      │                  │
│                 │  del servicio     │                  │
└─────────────────┴─────────────────┴─────────────────┘
```

### Principios de Diseño

1. **Las cards de servicio SIEMPRE visibles**: En la columna central, mostrar todos los `serviceTypes` activos como cards visuales (ícono + nombre + precio sugerido)
2. **Click → Expandir**: Al hacer clic en una card de servicio, se abre un modal inline (no una navegación) con los campos específicos que ese servicio requiere
3. **Campos dinámicos por servicio**: Diferentes servicios requieren diferentes campos:
   - **Corte Laser / Laser CO2**: material, dimensiones (ancho x alto), cantidad, descripción
   - **Router CNC**: material, dimensiones, tipo de archivo (DXF, AI), acabado
   - **Grabado**: texto a grabar, tipo de fuente, material, tamaño
   - **Instalación**: dirección, altura, tipo de superficie
   - **Diseño**: descripción del diseño, referencias, formato entrega
   - **Impresión / Rótulo**: tamaño, material, cantidad, acabado
4. **Añadir sin refrescar**: Al confirmar el servicio, se agrega al carrito sin cerrar el POS
5. **Productos desde buscador**: La parte izquierda tiene buscador de productos + selector manual (actual), mientras que la central muestra servicios
6. **Checkout unificado**: Servicios + productos aparecen juntos en el carrito con su tipo visible

### Convenciones de Código

- **No modificar la lógica de negocio del backend** — solo cambios en `SalesView.tsx`
- Toda la UI vive en `SalesView.tsx` (archivo monolítico, ~1600 líneas)
- Usar `useState` para control local de modales y formularios
- Las cards de servicios usarán el array `serviceTypes` que ya viene en las props
- Agregar servicios al mismo `posCart[]` pero con un indicador `isService: true` y los campos específicos en un objeto `serviceData`
- No introducir nuevas dependencias npm

### Flujo de implementación

1. Agregar estado `posSelectedService` y `posServiceModal` para manejar la expansión de cards
2. Agregar `posCart` items con tipo (producto/servicio) para renderizado diferenciado
3. Componentes visuales (todo dentro del mismo archivo):
   - `ServiceCardGrid` — grilla de 3-4 columnas con los servicios activos
   - `ServiceConfigModal` — modal que muestra campos según el tipo de servicio
   - `CartItemRow` extendido para mostrar badge "PRODUCTO" vs "SERVICIO"
4. En `handlePosCheckout`, mapear items de servicio al formato `{ tipoItem: 'SERVICIO', servicioId, descripcion, ... }`

### Patrón de campos de servicio (ejemplo)

```typescript
interface ServiceFields {
  // Comunes
  descripcion?: string;
  precio: number;
  // Corte Laser / CNC
  material?: string;
  ancho?: number;
  alto?: number;
  espesor?: number;
  // Grabado
  textoGrabar?: string;
  tipoFuente?: string;
  // Instalacion
  direccionInstalacion?: string;
  altura?: number;
  // Generales
  cantidad?: number;
  observaciones?: string;
}

// Mapa de campos requeridos por servicio
const SERVICE_FIELDS: Record<string, { key: string; label: string; type: 'text' | 'number' | 'textarea'; required: boolean }[]> = {
  'Corte Laser': [
    { key: 'material', label: 'Material', type: 'text', required: true },
    { key: 'ancho', label: 'Ancho (cm)', type: 'number', required: true },
    { key: 'alto', label: 'Alto (cm)', type: 'number', required: true },
    { key: 'espesor', label: 'Espesor (mm)', type: 'number', required: false },
    { key: 'cantidad', label: 'Cantidad de piezas', type: 'number', required: true },
  ],
  'Grabado': [
    { key: 'textoGrabar', label: 'Texto a grabar', type: 'textarea', required: true },
    { key: 'material', label: 'Material', type: 'text', required: true },
    { key: 'tamano', label: 'Tamaño (cm)', type: 'text', required: false },
  ],
  // etc.
};
```

### Validación UX
- La card de servicio debe mostrar preview del precio basado en campos llenados
- Botón "Agregar al carrito" deshabilitado si faltan campos obligatorios
- Al agregar, animación breve en el carrito (vibrar el contador)
- Tooltip/hint en cada campo explicando qué poner (no texto técnico)
- Modo "vista rápida": desde la card se puede ver precio sugerido sin abrir modal

### Archivos relevantes
- `src/components/SalesView.tsx` — TODO el POS es aquí
- `src/types.ts` — `ServiceType` y `QuotationItem` existen
- `src/services/api.ts` — endpoints ya existentes
