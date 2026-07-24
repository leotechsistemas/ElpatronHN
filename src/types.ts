export type Cents = number;

export interface User {
  ID: string;
  Nombre: string;
  Correo: string;
  Rol: 'Admin' | 'Vendedor' | 'Produccion' | 'Analista';
  Activo: 'TRUE' | 'FALSE';
}

export interface Employee {
  id: string;
  nombre: string;
  correo: string;
  rol: string;
  activo: boolean;
  dni?: string;
  telefono?: string;
  direccion?: string;
  puesto?: string;
  departamento?: string;
  salario?: Cents; // cents
  fechaContratacion?: string;
  fechaNacimiento?: string;
  contactoEmergencia?: string;
  telefonoEmergencia?: string;
}

export interface Product {
  ID: string;
  Codigo: string;
  Nombre: string;
  Categoría: string;
  'Stock Inicial': number;
  Entradas: number;
  Salidas: number;
  'Stock Actual': number;
  'Precio Costo': Cents; // cents
  'Precio Venta': Cents; // cents
  Observaciones: string;
  Material: string;
  'Proveedor ID': string;
  'Alerta Stock': number;
}

export interface Sale {
  ID: string;
  Fecha: string;
  'Cliente ID': string;
  Cliente: string;
  RTN: string;
  ConRTN: boolean;
  'Producto ID': string;
  Producto: string;
  'Tipo Trabajo': string;
  Precio: Cents; // cents
  Estado: 'Pendiente' | 'En proceso' | 'Terminado';
  'Pago Inicial': Cents; // cents
  'Estado Pago': 'Pendiente' | 'Pagado';
  Observaciones: string;
  'Vendedor ID': string;
}

export interface Payment {
  ID: string;
  'Venta ID': string;
  'Cliente ID': string;
  Cliente: string;
  Fecha: string;
  Monto: Cents; // cents
  Método: 'Efectivo' | 'Tarjeta' | 'Transferencia' | '';
  Estado: 'Pendiente' | 'Pagado' | 'Anulado';
  Observaciones: string;
  'Registrado Por': string;
}

export interface PaymentItem {
  id: number;
  venta_id: string;
  monto_asignado: Cents; // cents
  producto?: string;
}

export interface PaymentFull {
  id: string;
  cliente_id: string;
  cliente: string;
  fecha: string;
  monto_total: Cents; // cents
  metodo: string;
  estado: string;
  observaciones: string;
  registrado_por: string;
  created_at: string;
  ventas_count: number;
  items: PaymentItem[];
}

export interface Client {
  ID: string;
  Nombre: string;
  RTN: string;
  Teléfono: string;
  Email: string;
  Estado: 'Activo' | 'Inactivo';
  Observaciones: string;
  Clasificación: 'Nuevo' | 'Frecuente' | 'VIP' | 'Deudor';
  'Fecha Registro': string;
  LTV: Cents; // cents
  'RFM Score': number;
  Departamento?: string;
  Ciudad?: string;
}

export interface Interaction {
  ID: string;
  'Cliente ID': string;
  Cliente: string;
  Fecha: string;
  Tipo: 'Llamada' | 'WhatsApp' | 'Email' | 'Visita';
  Resultado: string;
  Observaciones: string;
}

export interface Reminder {
  ID: string;
  'Cliente ID': string;
  Cliente: string;
  Fecha: string;
  Descripción: string;
  Prioridad: 'Alta' | 'Media' | 'Baja';
  Completado: 'TRUE' | 'FALSE';
}

export interface Provider {
  ID: string;
  Nombre: string;
  Contacto: string;
  Teléfono: string;
  Email: string;
  Observaciones: string;
}

export interface StockLog {
  ID: string;
  'Producto ID': string;
  Producto: string;
  Fecha: string;
  Tipo: 'entrada' | 'salida';
  Cantidad: number;
  'Costo Unitario': Cents; // cents
  'Costo Total': Cents; // cents
  Referencia: string;
  Usuario: string;
}

export interface DashboardData {
  todaySalesCount: number;
  todaySalesTotal: Cents; // cents
  totalRevenue: Cents; // cents
  ticketProm: Cents; // cents
  tendencia: number;
  lowStockCount: number;
  lowStockItems: Product[];
  newClientsCount: number;
  pendingPayments: any[];
  totalDeuda: Cents; // cents
  aging: {
    d0_30: Cents; // cents
    d31_60: Cents; // cents
    d61_90: Cents; // cents
    d90plus: Cents; // cents
  };
  topProducts: { name: string; count: number }[];
  clientRanking: { name: string; ltv: Cents; score: number }[];
  topTipos: { name: string; total: Cents }[];
  salesByStatus: {
    pendiente: number;
    en_proceso: number;
    terminado: number;
  };
  paymentsByMethod: {
    efectivo: Cents; // cents
    tarjeta: Cents; // cents
    transferencia: Cents; // cents
  };
}

export interface QuotationItem {
  tipoTrabajo: string;
  precio: Cents; // cents
  productId?: string;
  productName?: string;
  cantidad?: number;
  serviceId?: string;
  descripcion?: string;
}

export interface ProductionTask {
  id: string;
  venta_id: string;
  cliente_id: string;
  cliente: string;
  descripcion: string;
  tipo: string;
  estado: 'Pendiente' | 'En Proceso' | 'Completada';
  creado_en: string;
  inicio_en: string | null;
  completado_en: string | null;
  vendedor_id: string;
}

export interface ServiceType {
  id: string;
  nombre: string;
  descripcion: string;
  precioSugerido: Cents; // cents
  icono: string;
  activo: boolean;
}

export interface CompanySettings {
  id: string;
  company_name: string;
  slogan: string;
  logo: string;
  currency: string;
  currency_symbol: string;
  isv: number;
  phone: string;
  address: string;
  email: string;
  facebook: string;
  instagram: string;
  tiktok: string;
  whatsapp: string;
  youtube: string;
  linkedin: string;
}

export interface InvoiceItem {
  id: string;
  venta_id: string;
  tipo_item: 'PRODUCTO' | 'SERVICIO';
  producto_id: string | null;
  servicio_id: string | null;
  descripcion: string;
  cantidad: number;
  precio_unitario: Cents; // cents
  descuento: Cents; // cents
  isv: Cents; // cents
  subtotal: Cents; // cents
  total_linea: Cents; // cents
}

export interface AccountCatalog {
  id: string;
  codigo: string;
  nombre: string;
  tipo: 'Activo' | 'Pasivo' | 'Patrimonio' | 'Ingreso' | 'Gasto';
  nivel: number;
  padre_id?: string;
  acepta_asientos: boolean;
  activo: boolean;
  hijos?: AccountCatalog[];
}

export interface AccountingEntryItem {
  id: number;
  asiento_id: string;
  cuenta_id: string;
  cuenta_codigo: string;
  cuenta_nombre: string;
  debe: Cents; // cents
  haber: Cents; // cents
  glosa: string;
}

export interface AccountingEntry {
  id: string;
  numero_asiento: string;
  fecha: string;
  concepto: string;
  tipo: string;
  referencia_tipo?: string;
  referencia_id?: string;
  creado_por?: string;
  created_at?: string;
  total_debe: Cents; // cents
  total_haber: Cents; // cents
  reversado: boolean;
  items?: AccountingEntryItem[];
}

export interface PeriodoContable {
  id: number;
  codigo: string;
  fecha_inicio: string;
  fecha_fin: string;
  cerrado: boolean;
}

export interface LedgerItem {
  fecha: string;
  concepto: string;
  asiento_id: string;
  numero_asiento: string;
  referencia_tipo: string;
  referencia_id: string;
  debe: Cents; // cents
  haber: Cents; // cents
  saldo: Cents; // cents
}

export interface LedgerResponse {
  cuenta_id: string;
  cuenta_codigo: string;
  cuenta_nombre: string;
  saldo_inicial: Cents; // cents
  total_debe: Cents; // cents
  total_haber: Cents; // cents
  saldo_final: Cents; // cents
  movimientos: LedgerItem[];
}

export interface BalanceItem {
  cuenta_id: string;
  cuenta_codigo: string;
  cuenta_nombre: string;
  saldo: Cents; // cents
}

export interface BalanceResponse {
  fecha: string;
  total_activos: Cents; // cents
  total_pasivos: Cents; // cents
  total_patrimonio: Cents; // cents
  activos: BalanceItem[];
  pasivos: BalanceItem[];
  patrimonio: BalanceItem[];
}

export interface IncomeItem {
  cuenta_id: string;
  cuenta_codigo: string;
  cuenta_nombre: string;
  saldo: Cents; // cents
}

export interface IncomeStatementResponse {
  fecha: string;
  total_ingresos: Cents; // cents
  total_gastos: Cents; // cents
  resultado_neto: Cents; // cents
  ingresos: IncomeItem[];
  gastos: IncomeItem[];
}

export interface Quotation {
  ID: string;
  Fecha: string;
  'Fecha Expiracion': string;
  'Cliente ID': string;
  Cliente: string;
  RTN: string;
  ConRTN: boolean;
  Items: string;
  PrecioTotal: Cents; // cents
  Descuento: Cents; // cents
  ISV: Cents; // cents
  Estado: 'Pendiente' | 'Convertido' | 'Vencida';
  Observaciones: string;
  'Vendedor ID': string;
}

