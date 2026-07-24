import React, { useState, useEffect, useCallback } from 'react';
import {
  Warehouse, Shield, Users, Archive, FileText, LogOut, Loader2, ShoppingCart, DollarSign,
  Truck, Menu, Wrench, MessageSquare, BookOpen, CreditCard
} from 'lucide-react';

import DashboardView from './components/DashboardView';
import SalesView from './components/SalesView';
import PosView from './components/PosView';
import { jsPDF } from 'jspdf';
import PaymentsView from './components/PaymentsView';
import ClientsView from './components/ClientsView';
import InventoryView from './components/InventoryView';
import ReportsView from './components/ReportsView';
import EmployeesView from './components/EmployeesView';
import QuotationsView from './components/QuotationsView';
import ProductionView from './components/ProductionView';
import CompanyView from './components/CompanyView';
import ServiceTypesView from './components/ServiceTypesView';
import { LOGO_BASE64 } from './logo';
import { api } from './services/api';
import LandingPage from './pages/LandingPage';

import {
  User, Product, Sale, Payment, Client,
  Interaction, Reminder, Provider, StockLog, Quotation, CompanySettings, ServiceType
} from './types';
import LeadsView from './components/LeadsView';
import AccountingView from './components/AccountingView';
import AuditView from './components/AuditView';

function mapApiProduct(p: any): Product {
  return { ID: p.id, Codigo: p.codigo || '', Nombre: p.nombre, Categoría: p.categoria, 'Stock Inicial': p.stock_inicial, Entradas: p.entradas, Salidas: p.salidas, 'Stock Actual': p.stock_actual, 'Precio Costo': p.precio_costo, 'Precio Venta': p.precio_venta, Observaciones: p.observaciones || '', Material: p.material || '', 'Proveedor ID': p.proveedor_id || '', 'Alerta Stock': p.alerta_stock };
}
function mapApiSale(s: any): Sale {
  return { ID: s.id, Fecha: s.fecha, 'Cliente ID': s.cliente_id, Cliente: s.cliente, RTN: s.rtn || '', ConRTN: s.con_rtn !== false, 'Producto ID': s.producto_id || '', Producto: s.producto || '', 'Tipo Trabajo': s.tipo_trabajo, Precio: s.precio, Estado: s.estado, 'Pago Inicial': s.pago_inicial, 'Estado Pago': s.estado_pago, Observaciones: s.observaciones || '', 'Vendedor ID': s.vendedor_id || '' };
}
function mapApiPayment(p: any): Payment {
  const item = p.items && p.items.length > 0 ? p.items[0] : null;
  return {
    ID: p.id,
    'Venta ID': p.venta_id || (item ? item.venta_id : ''),
    'Cliente ID': p.cliente_id,
    Cliente: p.cliente,
    Fecha: p.fecha,
    Monto: p.monto_total ?? (item ? item.monto_asignado : 0),
    Método: p.metodo || '',
    Estado: p.estado,
    Observaciones: p.observaciones || '',
    'Registrado Por': p.registrado_por || '',
  };
}
function mapApiClient(c: any): Client {
  return { ID: c.id, Nombre: c.nombre, RTN: c.rtn || '', Teléfono: c.telefono || '', Email: c.email || '', Estado: c.estado, Observaciones: c.observaciones || '', Clasificación: c.clasificacion, 'Fecha Registro': c.fecha_registro, LTV: c.ltv || 0, 'RFM Score': c.rfm_score || 5, Departamento: c.departamento || '', Ciudad: c.ciudad || '' };
}
function mapApiInteraction(i: any): Interaction {
  return { ID: i.id, 'Cliente ID': i.cliente_id, Cliente: i.cliente, Fecha: i.fecha, Tipo: i.tipo, Resultado: i.resultado || '', Observaciones: i.observaciones || '' };
}
function mapApiReminder(r: any): Reminder {
  return { ID: r.id, 'Cliente ID': r.cliente_id || '', Cliente: r.cliente || '', Fecha: r.fecha, Descripción: r.descripcion, Prioridad: r.prioridad || 'Media', Completado: r.completado };
}
function mapApiProvider(p: any): Provider {
  return { ID: p.id, Nombre: p.nombre, Contacto: p.contacto || '', Teléfono: p.telefono || '', Email: p.email || '', Observaciones: p.observaciones || '' };
}
function mapApiStockLog(l: any): StockLog {
  return { ID: l.id, 'Producto ID': l.producto_id, Producto: l.producto, Fecha: l.fecha, Tipo: l.tipo, Cantidad: l.cantidad, 'Costo Unitario': l.costo_unitario || 0, 'Costo Total': l.costo_total || 0, Referencia: l.referencia || '', Usuario: l.usuario || '' };
}
function mapApiQuotation(q: any): Quotation {
  return { ID: q.id, Fecha: q.fecha, 'Fecha Expiracion': q.fecha_expiracion || '', 'Cliente ID': q.cliente_id, Cliente: q.cliente, RTN: q.rtn || '', ConRTN: q.con_rtn !== false, Items: q.items, PrecioTotal: q.precio_total, Descuento: q.descuento || 0, ISV: q.isv ?? 15, Estado: q.estado, Observaciones: q.observaciones || '', 'Vendedor ID': q.vendedor_id || '' };
}
function mapApiUser(u: any): User {
  return { ID: u.id, Nombre: u.nombre, Correo: u.correo, Rol: u.rol, Activo: u.activo === true || u.activo === 1 || u.activo === 'TRUE' ? 'TRUE' : 'FALSE' };
}
function mapApiLead(l: any): any {
  return {
    id: l.id, nombre: l.nombre, correo: l.correo, telefono: l.telefono,
    empresa: l.empresa, categoria: l.categoria, descripcion: l.descripcion,
    detalles: l.detalles, ipAddress: l.ip_address, userAgent: l.user_agent,
    referer: l.referer, pageUrl: l.page_url, createdAt: l.created_at,
  };
}
function mapApiProductionTask(t: any): any {
  return {
    id: t.id, venta_id: t.venta_id, cliente_id: t.cliente_id, cliente: t.cliente,
    descripcion: t.descripcion, tipo: t.tipo, estado: t.estado,
    creado_en: t.creado_en, inicio_en: t.inicio_en, completado_en: t.completado_en,
    vendedor_id: t.vendedor_id, prioridad: t.prioridad || 'Media',
    asignado_a: t.asignado_a, notas_internas: t.notas_internas,
  };
}
function mapApiServiceType(st: any): ServiceType {
  return { id: st.id, nombre: st.nombre, descripcion: st.descripcion || '', precioSugerido: st.precio_sugerido || 0, icono: st.icono || '🔧', activo: st.activo !== false };
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [activePage, setActiveTab] = useState<string>('pos');
  const [prefillClientId, setPrefillClientId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isApiReady, setIsApiReady] = useState(false);
  const [isRestoringSession, setIsRestoringSession] = useState(true);
  const [alerts, setAlerts] = useState<{ id: string; msg: string; type: 'success' | 'error' | 'info' | 'warning' }[]>([]);
  const [themeMode, setThemeMode] = useState<string>(() => sessionStorage.getItem('patron-theme') || 'oro-oscuro');
  const [themeOpen, setThemeOpen] = useState(false);
  const [clockTime, setClockTime] = useState<string>('--:--:--');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [page, setPage] = useState<'landing' | 'erp'>(() => window.location.pathname.startsWith('/app') ? 'erp' : 'landing');

  const navigateTo = (to: 'landing' | 'erp') => {
    window.history.pushState({}, '', to === 'erp' ? '/app' : '/');
    setPage(to);
  };

  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [stockLogs, setStockLogs] = useState<StockLog[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [productionTasks, setProductionTasks] = useState<any[]>([]);
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [leads, setLeads] = useState<any[]>([]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light-theme', 'theme-oro-oscuro', 'theme-oro-claro', 'theme-platino', 'theme-zafiro', 'theme-esmeralda', 'theme-pizarra', 'theme-rosa', 'theme-rubi', 'theme-onix', 'theme-cobalto', 'theme-menta', 'theme-terrazo', 'theme-cobre', 'theme-vino', 'theme-moka', 'theme-hueso', 'theme-durazno', 'theme-miel', 'theme-canela');
    if (themeMode !== 'oro-oscuro') root.classList.add(themeMode === 'oro-claro' ? 'light-theme' : 'theme-' + themeMode);
    sessionStorage.setItem('patron-theme', themeMode);
  }, [themeMode]);

  useEffect(() => {
    const timer = setInterval(() => setClockTime(new Date().toLocaleTimeString('es-HN')), 1000);
    return () => clearInterval(timer);
  }, []);

  const addAlert = (msg: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const id = Date.now().toString() + Math.random();
    setAlerts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setAlerts(prev => prev.filter(a => a.id !== id)), 4500);
  };

  const loadAllFromApi = useCallback(async () => {
    const res = await api.ping();
    if (!res?.success) return false;
    return true;
  }, []);

  const safeCall = useCallback(async (fn: () => Promise<any>, fallback: any = []) => {
    try { return (await fn()) || fallback; } catch { return fallback; }
  }, []);

  const loadDataFromApi = useCallback(async () => {
    const [u, p, s, py, c, i, r, pr, l, pt, cs, st, ld] = await Promise.all([
      safeCall(() => api.getUsers()),
      safeCall(() => api.getProducts()),
      safeCall(() => api.getSales()),
      safeCall(() => api.getPayments()),
      safeCall(() => api.getClients()),
      safeCall(() => api.getInteractions()),
      safeCall(() => api.getReminders()),
      safeCall(() => api.getProviders()),
      safeCall(() => api.getStockLogs()),
      safeCall(() => api.getProductionTasks()),
      safeCall(() => api.getCompanySettings()),
      safeCall(() => api.getServiceTypes()),
      safeCall(() => api.getLeads()),
    ]);
    return {
      users: u?.success ? u.data.map(mapApiUser) : [],
      products: p?.success ? p.data.map(mapApiProduct) : [],
      sales: s?.success ? s.data.map(mapApiSale) : [],
      payments: py?.success ? py.data : [],
      clients: c?.success ? c.data.map(mapApiClient) : [],
      interactions: i?.success ? i.data.map(mapApiInteraction) : [],
      reminders: r?.success ? r.data.map(mapApiReminder) : [],
      providers: pr?.success ? pr.data.map(mapApiProvider) : [],
      stockLogs: l?.success ? l.data.map(mapApiStockLog) : [],
      productionTasks: pt?.success ? pt.data.map(mapApiProductionTask) : [],
      companySettings: cs?.id ? cs : null,
      serviceTypes: st?.success ? st.data.map(mapApiServiceType) : [],
      leads: ld?.success ? ld.data.map(mapApiLead) : [],
    };
  }, [safeCall]);

  useEffect(() => {
    checkApiAndLoad();
    async function checkApiAndLoad() {
      try {
        const ok = await loadAllFromApi();
        setIsApiReady(ok);
        if (ok) {
          try {
            const me = await api.getMe();
            if (me?.success && me.user) {
              setCurrentUser({ ID: me.user.id || '', Nombre: me.user.nombre, Correo: me.user.correo, Rol: me.user.rol, Activo: 'TRUE' });
              const setters = await loadDataFromApi();
              Object.entries(setters).forEach(([k, v]: any) => { if (k === 'users') setUsers(v); else if (k === 'products') setProducts(v); else if (k === 'sales') setSales(v); else if (k === 'payments') setPayments(v); else if (k === 'clients') setClients(v); else if (k === 'interactions') setInteractions(v); else if (k === 'reminders') setReminders(v); else if (k === 'providers') setProviders(v); else if (k === 'stockLogs') setStockLogs(v); else if (k === 'productionTasks') setProductionTasks(v); else if (k === 'companySettings') setCompanySettings(v); else if (k === 'serviceTypes') setServiceTypes(v); else if (k === 'leads') setLeads(v); });
            }
          } catch { }
        }
      } catch { }
      setIsRestoringSession(false);
    }
  }, [loadAllFromApi]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPass) { addAlert('Ingresa credenciales de acceso.', 'warning'); return; }
    setIsLoading(true);
    if (isApiReady) {
      try {
        const res = await api.login(loginEmail.trim(), loginPass);
        setIsLoading(false);
        if (res.success && res.user) {
          setCurrentUser({ ID: res.user.id, Nombre: res.user.nombre, Correo: res.user.correo, Rol: res.user.rol as any, Activo: 'TRUE' });
          addAlert(`Acceso exitoso. Rol: ${res.user.rol}`, 'success');
          const setters = await loadDataFromApi();
          if (setters.users) setUsers(setters.users);
          if (setters.products) setProducts(setters.products);
          if (setters.sales) setSales(setters.sales);
          if (setters.payments) setPayments(setters.payments);
          if (setters.clients) setClients(setters.clients);
          if (setters.interactions) setInteractions(setters.interactions);
          if (setters.reminders) setReminders(setters.reminders);
          if (setters.providers) setProviders(setters.providers);
          if (setters.stockLogs) setStockLogs(setters.stockLogs);
          if (setters.productionTasks) setProductionTasks(setters.productionTasks);
          if (setters.companySettings) setCompanySettings(setters.companySettings);
          if (setters.serviceTypes) setServiceTypes(setters.serviceTypes);
          if (setters.leads) setLeads(setters.leads);
        }
      } catch (error: any) {
        setIsLoading(false);
        addAlert(error.message || 'Credenciales incorrectas.', 'error');
      }
    } else {
      setIsLoading(false);
      addAlert('Servidor no disponible. Inicia el servidor API.', 'error');
    }
  };

  const handleLogout = async () => { try { await api.logout(); } catch {} setCurrentUser(null); setActiveTab('pos'); addAlert('Sesión finalizada.', 'info'); };

  const handleAddNewSale = async (saleData: any) => {
    if (!isApiReady) { addAlert('Servidor no disponible', 'error'); return false; }
    setIsLoading(true);
    try {
      const items = (saleData.items || []).map((item: any) => ({
        tipoItem: (item.productoId || item.productId) ? 'PRODUCTO' : 'SERVICIO',
        productoId: item.productoId || item.productId || null,
        servicioId: item.servicioId || item.serviceId || null,
        descripcion: item.descripcion || item.tipoTrabajo || item.productName || 'Item',
        cantidad: item.cantidad || 1,
        precioUnitario: item.precioUnitario || item.precio || 0,
        descuento: item.descuento || 0,
        isv: item.isv != null ? item.isv : 15,
      }));

      const request: any = {
        clienteId: saleData.clienteId,
        cliente: saleData.clienteNombre,
        rtn: saleData.rtn || '',
        conRtn: saleData.conRtn !== false,
        observaciones: saleData.observaciones || '',
        vendedorId: currentUser?.ID || 'USR-0001',
        items,
      };
      if (saleData.pagoInicial > 0) {
        request.pagoInicial = {
          monto: saleData.pagoInicial,
          metodo: saleData.metodoPago || 'Efectivo',
        };
      }

      console.log('=== REQUEST SENT ===', JSON.stringify(request, null, 2));
      const response = await api.createSaleComplete(request);
      const s = response.sale;
      console.log('=== RESPONSE ===', JSON.stringify(response, null, 2));

      // Update RTN if provided
      if (saleData.rtn && saleData.clienteId && !saleData.clienteId.includes('TEMP')) {
        api.updateClient(saleData.clienteId, { rtn: saleData.rtn }).catch(() => {});
      }

      // Update local state from authoritative backend response
      const newSale: Sale = {
        ID: s.id, Fecha: s.fecha,
        'Cliente ID': s.cliente_id, Cliente: s.cliente,
        RTN: s.rtn || '', ConRTN: s.con_rtn !== false,
        'Producto ID': s.producto_id || '', Producto: s.producto || '',
        'Tipo Trabajo': s.tipo_trabajo, Precio: s.precio,
        Estado: s.estado, 'Pago Inicial': s.pago_inicial || 0,
        'Estado Pago': s.estado_pago,
        Observaciones: s.observaciones || '', 'Vendedor ID': s.vendedor_id || ''
      };
      setSales(prev => [newSale, ...prev]);

      if (response.production_tasks) {
        setProductionTasks(prev => [...response.production_tasks, ...prev]);
      }

      if (response.payment) {
        setPayments(prev => [mapApiPayment(response.payment), ...prev]);
      }

      setIsLoading(false);
      addAlert(`Venta ${s.id} registrada exitosamente`, 'success');
      return true;
    } catch (e: any) {
      setIsLoading(false);
      addAlert(`Error al registrar venta: ${e.message || 'desconocido'}`, 'error');
      return false;
    }
  };

  const handleAddQuickClient = async (clientData: any) => {
    if (!isApiReady) { addAlert('Servidor no disponible', 'error'); return null; }
    try {
      const created = await api.createClient({ ...clientData, estado: 'Activo', clasificacion: 'Nuevo' });
      const id = created.id;
      const newClient: Client = {
        ID: id, Nombre: clientData.nombre, RTN: clientData.rtn || '', Teléfono: clientData.telefono || '', Email: clientData.email || '',
        Estado: 'Activo', Observaciones: clientData.observaciones || '', Clasificación: clientData.clasificacion || 'Nuevo',
        'Fecha Registro': new Date().toLocaleDateString('es-HN'), LTV: 0, 'RFM Score': 5,
        Departamento: clientData.departamento || 'Cortés', Ciudad: clientData.ciudad || 'S.P.S.'
      };
      setClients(prev => [...prev, newClient]);
      addAlert(`Cliente ${clientData.nombre} registrado`, 'success');
      return newClient;
    } catch (e: any) {
      addAlert(`Error al crear cliente: ${e.message || 'desconocido'}`, 'error');
      return null;
    }
  };

  const handleUpdateClient = async (clientId: string, clientData: any) => {
    const existing = clients.find(c => c.ID === clientId);
    let backendId = clientId;
    const fullData = {
      nombre: existing?.Nombre || '', rtn: clientData.rtn ?? existing?.RTN ?? '',
      telefono: existing?.Teléfono || '', email: existing?.Email || '',
      estado: existing?.Estado || '', observaciones: existing?.Observaciones || '',
      clasificacion: existing?.Clasificación || '',
      fechaRegistro: existing?.['Fecha Registro'] || '',
      ltv: existing?.LTV || 0, rfmScore: existing?.['RFM Score'] || 5,
      departamento: existing?.Departamento || '', ciudad: existing?.Ciudad || ''
    };
    try {
      if (isApiReady) {
        await api.updateClient(clientId, fullData);
      }
    } catch (e: any) {
      if (isApiReady && e.message?.includes?.('no encontrado')) {
        try {
          const created = await api.createClient(fullData);
          if (created?.id) backendId = created.id;
        } catch (e2: any) {
          addAlert(`Error en servidor: ${e2.message}`, 'error');
        }
      } else {
        addAlert(`Error en servidor: ${e.message}`, 'error');
      }
    }
    setClients(prev => prev.map(c => c.ID === clientId ? {
      ...c, Nombre: c.Nombre, RTN: clientData.rtn ?? c.RTN,
      Teléfono: c.Teléfono, Email: c.Email,
      Departamento: c.Departamento, Ciudad: c.Ciudad,
      Clasificación: c.Clasificación, Observaciones: c.Observaciones
    } : c));
    if (backendId !== clientId) {
      setClients(prev => prev.map(c => c.ID === clientId ? { ...c, ID: backendId } : c));
    }
    addAlert('Cliente actualizado ✓', 'success');
    return true;
  };

  const handleDeleteClient = async (clientId: string) => {
    try {
      if (isApiReady) await api.deleteClient(clientId);
      setClients(prev => prev.filter(c => c.ID !== clientId));
      addAlert('Cliente eliminado ✓', 'success');
    } catch { addAlert('Error al eliminar cliente ✗', 'error'); }
  };

  const handleAddNewQuotation = async (quoteData: any) => {
    if (!isApiReady) { addAlert('Servidor no disponible', 'error'); return false; }
    const fecha = new Date().toLocaleDateString('es-HN');
    const expDate = new Date();
    expDate.setDate(expDate.getDate() + 15);
    const fechaExp = expDate.toLocaleDateString('es-HN');
    try {
      const created = await api.createQuotation({
        ...quoteData, cliente: quoteData.clienteNombre, items: JSON.stringify(quoteData.items),
        fecha, fechaExpiracion: fechaExp, estado: 'Pendiente', rtn: quoteData.rtn || '',
        conRtn: quoteData.conRtn !== false, vendedorId: currentUser?.ID || 'USR-0001'
      });
      const id = created.id;
      if (quoteData.rtn && quoteData.clienteId && !quoteData.clienteId.includes('TEMP')) {
        try { await api.updateClient(quoteData.clienteId, { rtn: quoteData.rtn }); } catch (e: any) { addAlert(`Error al actualizar RTN: ${e.message}`, 'warning'); }
      }
      addAlert(`Cotización ${id} registrada`, 'success');
      return true;
    } catch (e: any) {
      addAlert(`Error al crear cotización: ${e.message || 'desconocido'}`, 'error');
      return false;
    }
  };

  const handleConvertQuotationToSale = async (quote: Quotation, pagoInicial = 0, metodoPago: any = 'Efectivo') => {
    if (!isApiReady) { addAlert('Servidor no disponible', 'error'); return; }
    if (quote.Estado === 'Convertido') { addAlert('Ya fue convertida.', 'warning'); return; }
    let items: any[] = [];
    try { items = JSON.parse(quote.Items); } catch { items = []; }
    if (!items.length) { addAlert('Sin trabajos.', 'error'); return; }

    setIsLoading(true);
    try {
      const response = await api.convertQuotationToSale(quote.ID, {
        pagoInicial, metodoPago,
        vendedorId: currentUser?.ID || 'USR-0001',
      });
      const s = response.sale;
      const serviceCount = response.production_tasks?.length || 0;

      const newSale: Sale = {
        ID: s.id, Fecha: s.fecha, 'Cliente ID': s.cliente_id, Cliente: s.cliente,
        RTN: s.rtn || '', ConRTN: s.con_rtn !== false,
        'Producto ID': s.producto_id || '', Producto: s.producto || '',
        'Tipo Trabajo': s.tipo_trabajo, Precio: s.precio,
        Estado: s.estado, 'Pago Inicial': s.pago_inicial || 0,
        'Estado Pago': s.estado_pago,
        Observaciones: s.observaciones || '', 'Vendedor ID': s.vendedor_id || ''
      };
      setSales(prev => [newSale, ...prev]);

      if (response.production_tasks) {
        setProductionTasks(prev => [...response.production_tasks, ...prev]);
      }

      if (response.payment) {
        setPayments(prev => [mapApiPayment(response.payment), ...prev]);
      }

      setIsLoading(false);
      addAlert(`Cotización ${quote.ID} convertida a venta ${s.id} con ${serviceCount} tarea(s) de taller`, 'success');
      setActiveTab('sales');
    } catch (e: any) {
      setIsLoading(false);
      addAlert(`Error al convertir cotización: ${e.message || 'desconocido'}`, 'error');
    }
  };

  const handleAddPayment = async (payData: any) => {
    if (!isApiReady) { addAlert('Servidor no disponible', 'error'); return false; }
    try {
      const targetSale = sales.find(s => s.ID === payData.ventaId);
      if (!targetSale) { addAlert('Venta no encontrada.', 'error'); return false; }
      const monto = Number(payData.monto);
      const clienteId = targetSale['Cliente ID'];
      const clienteNombre = targetSale.Cliente;
      const response = await api.createPayment({
        cliente_id: clienteId, cliente: clienteNombre, metodo: payData.metodo,
        observaciones: payData.observaciones || '',
        registrado_por: currentUser?.ID || 'USR-0001',
        items: [{ venta_id: payData.ventaId, monto }]
      });
      // Update local state from response items
      const items = response?.items || [{ venta_id: payData.ventaId, monto_asignado: monto }];
      for (const item of items) {
        const paidBefore = payments.filter(p => p['Venta ID'] === item.venta_id).reduce((a, p) => a + Number(p.Monto), 0);
        const itemMonto = item.monto_asignado ?? monto;
        const totalPaid = paidBefore + itemMonto;
        const sale = sales.find(s => s.ID === item.venta_id);
        const nuevoEstado = totalPaid >= (Number(sale?.Precio) || 0) - 0.1 ? 'Pagado' : 'Pendiente';
        setPayments(prev => [{
          ID: `${response?.id || 'PAG'}-${item.venta_id}`,
          'Venta ID': item.venta_id,
          'Cliente ID': clienteId,
          Cliente: clienteNombre,
          Fecha: response?.fecha || new Date().toISOString().split('T')[0],
          Monto: itemMonto,
          Método: payData.metodo,
          Estado: 'Pagado',
          Observaciones: payData.observaciones || '',
          'Registrado Por': currentUser?.ID || '',
        }, ...prev]);
        setSales(prev => prev.map(x => x.ID === item.venta_id ? { ...x, 'Estado Pago': nuevoEstado, Estado: nuevoEstado === 'Pagado' && x.Estado === 'Pendiente' ? 'Terminado' : x.Estado } : x));
      }
      setClients(prev => prev.map(c => c.ID === clienteId ? { ...c, LTV: c.LTV + monto } : c));
      addAlert(`Cobro por L. ${monto} registrado (${response?.id || 'OK'})`, 'success');
      return true;
    } catch (e: any) {
      addAlert(`Error al registrar el cobro: ${e.message || 'desconocido'}`, 'error');
      return false;
    }
  };

  const handleLiquidarAllDeudas = async (clientId: string, metodo: string) => {
    const clientSales = sales.filter(s => s['Cliente ID'] === clientId);
    const items: { venta_id: string; monto: number }[] = [];
    let totalLiquidado = 0;
    const clienteNombre = clients.find(c => c.ID === clientId)?.Nombre || clientSales[0]?.Cliente || '';
    for (const s of clientSales) {
      const paid = payments.filter(p => p['Venta ID'] === s.ID).reduce((a, p) => a + Number(p.Monto), 0);
      const saldo = Math.max(0, s.Precio - paid);
      if (saldo <= 0.1) continue;
      items.push({ venta_id: s.ID, monto: saldo });
      totalLiquidado += saldo;
    }
    if (items.length === 0) { addAlert('Sin deudas pendientes.', 'warning'); return false; }
    try {
      const response = await api.createPayment({
        cliente_id: clientId, cliente: clienteNombre, metodo,
        observaciones: 'Liquidación total', registrado_por: currentUser?.ID || 'USR-0001',
        items
      });
      // Update local state from response items
      const respItems = response?.items || items;
      for (const item of respItems) {
        const sale = clientSales.find(s => s.ID === item.venta_id);
        if (!sale) continue;
        const monto = item.monto_asignado ?? item.monto;
        const paidBefore = payments.filter(p => p['Venta ID'] === sale.ID).reduce((a, p) => a + Number(p.Monto), 0);
        const totalPaid = paidBefore + monto;
        const nuevoEstado = totalPaid >= (Number(sale.Precio) || 0) - 0.1 ? 'Pagado' : 'Pendiente';
        setPayments(prev => [{
          ID: `${response?.id || 'PAG'}-${item.venta_id}`,
          'Venta ID': item.venta_id,
          'Cliente ID': clientId,
          Cliente: clienteNombre,
          Fecha: response?.fecha || new Date().toISOString().split('T')[0],
          Monto: monto,
          Método: metodo as any,
          Estado: 'Pagado',
          Observaciones: 'Liquidación total',
          'Registrado Por': currentUser?.ID || '',
        }, ...prev]);
        setSales(prev => prev.map(x => x.ID === item.venta_id ? { ...x, 'Estado Pago': nuevoEstado, Estado: nuevoEstado === 'Pagado' && x.Estado === 'Pendiente' ? 'Terminado' : x.Estado } : x));
      }
      setClients(prev => prev.map(c => c.ID === clientId ? { ...c, LTV: c.LTV + totalLiquidado } : c));
      addAlert(`Liquidación de L. ${totalLiquidado.toLocaleString()} procesada ✓`, 'success');
      return true;
    } catch (e: any) {
      addAlert(`Error al liquidar: ${e.message || 'desconocido'}`, 'error');
      return false;
    }
  };

  const handleRefreshData = useCallback(async () => {
    const settlers = await loadDataFromApi();
    Object.entries(settlers).forEach(([k, v]: any) => {
      if (k === 'sales') setSales(v);
      else if (k === 'payments') setPayments(v);
      else if (k === 'clients') setClients(v);
    });
  }, [loadDataFromApi]);

  const handleAddNewProduct = async (prodData: any) => {
    if (!isApiReady) { addAlert('Servidor no disponible', 'error'); return false; }
    try {
      const created = await api.createProduct(prodData);
      const id = created.id;
      const newProd: Product = {
        ID: id, Codigo: prodData.codigo || '', Nombre: prodData.nombre, Categoría: prodData.categoria,
        'Stock Inicial': prodData.stockInicial || 0, Entradas: 0, Salidas: 0,
        'Stock Actual': prodData.stockInicial || 0, 'Precio Costo': prodData.precioCosto || 0,
        'Precio Venta': prodData.precioVenta || 0, Observaciones: prodData.observaciones || '',
        Material: prodData.material || '', 'Proveedor ID': prodData.proveedorId || '',
        'Alerta Stock': prodData.alertaStock || 5
      };
      setProducts(prev => [...prev, newProd]);
      addAlert(`Producto ${id} creado ✓`, 'success');
      return true;
    } catch (e: any) {
      addAlert(`Error al crear producto: ${e.message || 'desconocido'}`, 'error');
      return false;
    }
  };

  const handleUpdateProduct = async (productId: string, prodData: any) => {
    try {
      if (isApiReady) await api.updateProduct(productId, prodData);
      setProducts(prev => prev.map(p => p.ID === productId ? {
        ...p, Codigo: prodData.codigo ?? p.Codigo,
        Nombre: prodData.nombre || p.Nombre,
        Categoría: prodData.categoria || p.Categoría,
        'Precio Costo': prodData.precioCosto ?? p['Precio Costo'],
        'Precio Venta': prodData.precioVenta ?? p['Precio Venta'],
        'Alerta Stock': prodData.alertaStock ?? p['Alerta Stock'],
        Observaciones: prodData.observaciones ?? p.Observaciones
      } : p));
      addAlert('Producto actualizado ✓', 'success');
      return true;
    } catch { addAlert('Error al actualizar producto ✗', 'error'); return false; }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      if (isApiReady) await api.deleteProduct(productId);
      setProducts(prev => prev.filter(p => p.ID !== productId));
      addAlert('Producto eliminado ✓', 'success');
    } catch { addAlert('Error al eliminar producto ✗', 'error'); }
  };

  const handleAddStockIn = async (restockData: any) => {
    const idx = products.findIndex(p => p.ID === restockData.productoId);
    if (idx < 0) return false;
    const updated = [...products];
    const qty = Number(restockData.cantidad);
    updated[idx]['Stock Actual'] += qty;
    updated[idx].Entradas += qty;
    if (restockData.costoUnitario) updated[idx]['Precio Costo'] = restockData.costoUnitario;
    setProducts(updated);
    addAlert('Abastecimiento completado.', 'success');
    return true;
  };

  const handleAddNewUser = async (userData: any) => {
    if (!isApiReady) { addAlert('Servidor no disponible', 'error'); return false; }
    try {
      const created = await api.createUser(userData);
      const id = created.id;
      setUsers(prev => [...prev, { ID: id, Nombre: created.nombre || userData.nombre, Correo: created.correo || userData.correo, Rol: created.rol || userData.rol, Activo: 'TRUE', ...created }]);
      addAlert(`Empleado ${id} registrado`, 'success');
      return true;
    } catch (e: any) {
      addAlert(`Error al crear empleado: ${e.message || 'desconocido'}`, 'error');
      return false;
    }
  };

  const handleToggleUser = async (userId: string, currentActive: boolean) => {
    const target = !currentActive;
    if (isApiReady) await api.toggleUser(userId, target);
    setUsers(prev => prev.map(u => u.ID === userId ? { ...u, Activo: target ? 'TRUE' : 'FALSE' } : u));
    addAlert('Estado de usuario modificado.', 'success');
  };

  const handleUpdateUser = async (userId: string, userData: any) => {
    try {
      const updated = isApiReady ? await api.updateUser(userId, userData) : null;
      setUsers(prev => prev.map(u => u.ID === userId ? { ...u, Nombre: userData.nombre || u.Nombre, Correo: userData.correo || u.Correo, Rol: userData.rol || u.Rol, ...updated } : u));
      addAlert('Empleado actualizado.', 'success');
      return true;
    } catch { addAlert('Error al actualizar empleado.', 'error'); return false; }
  };

  const handleDeleteUser = async (userId: string) => {
    if (isApiReady) await api.deleteUser(userId);
    setUsers(prev => prev.filter(u => u.ID !== userId));
    addAlert(`Usuario ${userId} eliminado permanentemente.`, 'success');
  };

  const handleUpdateCompanySettings = async (data: any): Promise<boolean> => {
    if (isApiReady) {
      const res = await api.updateCompanySettings(data);
      if (!res?.success) { addAlert('Error al guardar configuración.', 'error'); return false; }
    }
    setCompanySettings(data);
    addAlert('Configuración guardada exitosamente.', 'success');
    return true;
  };

  const handleDeleteSale = async (saleId: string) => {
    if (isApiReady) {
      try { await api.deleteSale(saleId); } catch { addAlert('Error al eliminar venta.', 'error'); return; }
    }
    addAlert(`Venta ${saleId} eliminada.`, 'success');
  };

  const handleDeleteQuotation = async (quoteId: string) => {
    if (isApiReady) {
      try { await api.deleteQuotation(quoteId); } catch { addAlert('Error al eliminar cotización.', 'error'); return; }
    }
    addAlert(`Cotización ${quoteId} eliminada.`, 'success');
  };

  const handleAddNewProvider = async (provData: any) => {
    if (!isApiReady) { addAlert('Servidor no disponible', 'error'); return false; }
    try {
      const created = await api.createProvider(provData);
      const id = created.id;
      setProviders(prev => [...prev, { ID: id, Nombre: provData.nombre, Contacto: provData.contacto || '', Teléfono: provData.telefono || '', Email: provData.email || '', Observaciones: provData.observaciones || '' }]);
      addAlert(`Proveedor ${id} registrado`, 'success');
      return true;
    } catch (e: any) {
      addAlert(`Error al crear proveedor: ${e.message || 'desconocido'}`, 'error');
      return false;
    }
  };

  const handleUpdateProductionTaskStatus = async (taskId: string, estado: string) => {
    const task = productionTasks.find((t: any) => t.id === taskId);
    const saleId = task?.venta_id;
    if (isApiReady) {
      try {
        const updated = await api.updateProductionTaskStatus(taskId, estado);
        if (updated?.success) {
          setProductionTasks(prev => prev.map(t => t.id === taskId ? { ...t, estado: updated.estado, inicio_en: updated.inicio_en || t.inicio_en, completado_en: updated.completado_en || t.completado_en } : t));
        }
        if (saleId) {
          const recalc = await api.recalcSaleStatus(saleId);
          setSales(prev => prev.map(s => s.ID === saleId ? { ...s, Estado: recalc.estado, 'Estado Pago': recalc.estado_pago } : s));
        }
        return;
      } catch (e: any) {
        addAlert(`Error al actualizar tarea: ${e.message || 'desconocido'}`, 'error');
        return;
      }
    }
    setProductionTasks(prev => prev.map(t => t.id === taskId ? { ...t, estado } : t));
  };

  const handleUpdateProductionTask = async (taskId: string, data: any) => {
    if (isApiReady) {
      try { await api.updateProductionTask(taskId, data); } catch (e: any) {
        addAlert(`Error al actualizar tarea: ${e.message || 'desconocido'}`, 'error');
        return;
      }
    }
    setProductionTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...data } : t));
    addAlert('Tarea actualizada', 'success');
  };

  const handleAddProductionTask = async (data: any) => {
    if (!isApiReady) { addAlert('Servidor no disponible', 'error'); return; }
    try {
      const created = await api.createProductionTask(data);
      if (created?.success) {
        const mapped = mapApiProductionTask(created);
        setProductionTasks(prev => [mapped, ...prev]);
        addAlert('Tarea de producción creada', 'success');
      }
    } catch (e: any) {
      addAlert(`Error al crear tarea: ${e.message || 'desconocido'}`, 'error');
    }
  };

  const handleAddServiceType = async (data: any) => {
    if (isApiReady) await api.createServiceType(data);
    const setters = await loadDataFromApi();
    if (setters.serviceTypes) setServiceTypes(setters.serviceTypes);
    addAlert('Tipo de servicio creado', 'success');
  };

  const handleUpdateServiceType = async (id: string, data: any) => {
    if (isApiReady) await api.updateServiceType(id, data);
    const setters = await loadDataFromApi();
    if (setters.serviceTypes) setServiceTypes(setters.serviceTypes);
    addAlert('Tipo de servicio actualizado', 'success');
  };

  const handleToggleServiceType = async (id: string) => {
    if (isApiReady) await api.toggleServiceType(id);
    const setters = await loadDataFromApi();
    if (setters.serviceTypes) setServiceTypes(setters.serviceTypes);
  };

  const handleDeleteServiceType = async (id: string) => {
    if (isApiReady) await api.deleteServiceType(id);
    setServiceTypes(prev => prev.filter(st => st.id !== id));
    addAlert('Tipo de servicio eliminado', 'success');
  };

  const handleDeleteLead = async (id: number) => {
    if (isApiReady) await api.deleteLead(id);
    setLeads(prev => prev.filter((l: any) => l.id !== id));
    addAlert('Lead eliminado', 'success');
  };

  const handleAddNewInteraction = async (intData: any) => {
    if (!isApiReady) { addAlert('Servidor no disponible', 'error'); return false; }
    try {
      const created = await api.createInteraction(intData);
      const id = created.id;
      setInteractions(prev => [{ ID: id, 'Cliente ID': intData.clienteId, Cliente: intData.clienteNombre, Fecha: new Date().toLocaleDateString('es-HN'), Tipo: intData.tipo, Resultado: intData.resultado || '', Observaciones: intData.observaciones || '' }, ...prev]);
      addAlert('Interacción registrada.', 'success');
      return true;
    } catch (e: any) {
      addAlert(`Error al registrar interacción: ${e.message || 'desconocido'}`, 'error');
      return false;
    }
  };

  const handleAddNewReminder = async (remData: any) => {
    if (!isApiReady) { addAlert('Servidor no disponible', 'error'); return false; }
    try {
      const created = await api.createReminder(remData);
      const id = created.id;
      setReminders(prev => [{ ID: id, 'Cliente ID': remData.clienteId, Cliente: remData.clienteNombre, Fecha: new Date(remData.fecha).toLocaleDateString('es-HN'), Descripción: remData.descripcion, Prioridad: remData.prioridad || 'Media', Completado: 'FALSE' }, ...prev]);
      addAlert('Recordatorio registrado.', 'success');
      return true;
    } catch (e: any) {
      addAlert(`Error al registrar recordatorio: ${e.message || 'desconocido'}`, 'error');
      return false;
    }
  };

  const handleCompleteReminder = async (remId: string) => {
    if (isApiReady) await api.completeReminder(remId);
    setReminders(prev => prev.map(r => r.ID === remId ? { ...r, Completado: 'TRUE' } : r));
    addAlert('Completado.', 'success');
  };

  const handleGenerateInvoice = (saleId: string) => {
    const sale = sales.find(s => s.ID === saleId);
    if (!sale) { addAlert('Venta no encontrada.', 'error'); return; }
    const client = clients.find(c => c.ID === sale['Cliente ID']);
    const salePays = payments.filter(p => p['Venta ID'] === saleId);
    const totalPagado = salePays.reduce((a, p) => a + Number(p.Monto), 0);
    const saldo = Math.max(0, sale.Precio - totalPagado);
    const doc = new jsPDF();
    const gold = [235, 180, 44] as const, dark = [28, 25, 23] as const, gray = [120, 120, 120] as const, lightGray = [245, 245, 247] as const;
    const goldBg = [252, 248, 235] as const;

    doc.setFillColor(28, 25, 23); doc.rect(0, 0, 210, 50, 'F');
    doc.setFillColor(...gold); doc.rect(0, 48, 210, 3, 'F');
    doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(24);
    doc.text('EL PATRON HN', 14, 22);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(200, 200, 200);
    doc.text('Tecnología de Personalizados · Grabado Láser · Impresión · Rotulación', 14, 30);
    doc.setFontSize(9); doc.setTextColor(...gold);
    doc.text(`FACTURA · ${sale.ID}`, 14, 38);

    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...dark);
    doc.text('Cliente', 14, 66); doc.text('Venta', 130, 66);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...gray);
    doc.text(sale.Cliente, 14, 72); doc.text(`Fecha: ${sale.Fecha}`, 130, 72);
    doc.text(client?.Email || '—', 14, 78); doc.text(`Vendedor: ${currentUser?.Nombre || '—'}`, 130, 78);
    doc.text(client?.Teléfono || '—', 14, 84); doc.text(`Estado: ${sale.Estado} · ${sale['Estado Pago']}`, 130, 84);
    doc.setDrawColor(235, 180, 44, 0.3); doc.line(14, 90, 196, 90);

    let curY = 100;
    doc.setFillColor(...goldBg); doc.rect(14, curY, 182, 9, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...dark);
    doc.text('DESCRIPCIÓN', 18, curY + 6); doc.text('PRODUCTO', 90, curY + 6);
    doc.text('TOTAL (HNL)', 192, curY + 6, { align: 'right' }); curY += 12;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...dark);
    doc.text(sale['Tipo Trabajo'], 18, curY); doc.text(sale.Producto || '—', 90, curY);
    doc.setFont('helvetica', 'bold');
    doc.text(`L. ${Number(sale.Precio).toLocaleString('es-HN', { minimumFractionDigits: 2 })}`, 192, curY, { align: 'right' });
    doc.setDrawColor(230, 230, 230); doc.line(14, curY + 4, 196, curY + 4); curY += 14;

    if (salePays.length) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...dark);
      doc.text('Pagos registrados', 14, curY); doc.line(14, curY + 2, 196, curY + 2); curY += 8;
      doc.setFillColor(...lightGray); doc.rect(14, curY, 182, 7, 'F');
      doc.setFontSize(7.5); doc.text('FECHA', 18, curY + 5); doc.text('MÉTODO', 80, curY + 5);
      doc.text('MONTO (HNL)', 192, curY + 5, { align: 'right' }); curY += 9;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
      salePays.forEach(p => {
        doc.text(String(p.Fecha || '—'), 18, curY); doc.text(String(p.Método || '—'), 80, curY);
        doc.setFont('helvetica', 'bold');
        doc.text(`L. ${Number(p.Monto).toLocaleString('es-HN', { minimumFractionDigits: 2 })}`, 192, curY, { align: 'right' });
        doc.setFont('helvetica', 'normal'); doc.setDrawColor(240, 240, 240);
        doc.line(14, curY + 2, 196, curY + 2); curY += 7;
      });
    }

    curY += 4;
    doc.setFillColor(...goldBg); doc.rect(120, curY, 76, 28, 'F');
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...gray);
    doc.text('Total venta', 125, curY + 8);
    doc.setFont('helvetica', 'bold'); doc.setTextColor(...dark);
    doc.text(`L. ${Number(sale.Precio).toLocaleString('es-HN', { minimumFractionDigits: 2 })}`, 192, curY + 8, { align: 'right' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...gray);
    doc.text('Total pagado', 125, curY + 15);
    doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 130, 0);
    doc.text(`L. ${totalPagado.toLocaleString('es-HN', { minimumFractionDigits: 2 })}`, 192, curY + 15, { align: 'right' });
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
    doc.setTextColor(saldo > 0 ? 180 : 0, saldo > 0 ? 60 : 130, saldo > 0 ? 0 : 0);
    doc.text('SALDO PENDIENTE', 125, curY + 23);
    doc.text(`L. ${saldo.toLocaleString('es-HN', { minimumFractionDigits: 2 })}`, 192, curY + 23, { align: 'right' });

    if (sale.Observaciones) {
      curY += 34;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...dark);
      doc.text('Observaciones', 14, curY);
      doc.setFont('helvetica', 'italic'); doc.setFontSize(7.5); doc.setTextColor(...gray);
      doc.text(sale.Observaciones, 14, curY + 5);
    }

    doc.setDrawColor(...gold); doc.line(14, 258, 196, 258);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...gray);
    doc.text('Este documento es una factura oficial de EL PATRÓN HN.', 14, 264);
    doc.text(`Generado por ${currentUser?.Nombre || 'Sistema'} · ${new Date().toLocaleDateString('es-HN')}`, 14, 269);
    doc.line(140, 278, 192, 278); doc.setFontSize(7.5); doc.text('Firma / Sello', 143, 283);
    doc.save(`PATRON_HN_Factura_${sale.ID}.pdf`);
    addAlert(`Factura ${sale.ID} descargada ✓`, 'success');
  };

  if (page === 'landing') return <LandingPage onEnter={() => navigateTo('erp')} />;

  return (
    <div className="min-h-screen bg-cyber-bg text-text cyber-crt-effect relative pb-10">
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-2.5 max-w-sm w-full">
        {alerts.map(a => (
          <div key={a.id}
            className={`px-4 py-3.5 rounded-lg border-l-4 text-xs font-mono select-none shadow-[0_4px_12px_rgba(0,0,0,0.5)] flex justify-between items-center gap-2 transform translate-x-0 animate-slide-in duration-300
              ${a.type === 'success' ? 'bg-emerald-500/10 border-green-400 text-green-400 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                : a.type === 'error' ? 'bg-red-500/10 border-red-500 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.15)]'
                  : a.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500 text-yellow-500'
                    : 'bg-cyber-purple/10 border-cyber-cyan text-cyber-cyan'}`}>
            <span>{a.msg}</span>
            <button onClick={() => setAlerts(prev => prev.filter(al => al.id !== a.id))}
              className="text-[10px] text-textD hover:text-white cursor-pointer bg-none border-none font-bold">✕</button>
          </div>
        ))}
      </div>

      {isLoading && (
        <div className="fixed inset-0 z-[9999] bg-cyber-bg/75 backdrop-blur-[2px] flex flex-col justify-center items-center gap-3">
          <Loader2 className="w-10 h-10 text-cyber-cyan animate-spin" />
          <span className="font-orbitron font-bold text-xs text-cyber-cyan tracking-widest animate-pulse">CARGANDO...</span>
        </div>
      )}

      {isRestoringSession && !currentUser ? (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-cyber-bg">
          <div className="text-center space-y-3">
            <Loader2 className="w-10 h-10 text-cyber-cyan animate-spin mx-auto" />
            <p className="font-orbitron font-bold text-xs text-cyber-cyan tracking-widest animate-pulse">RESTAURANDO SESIÓN...</p>
          </div>
        </div>
      ) : !currentUser ? (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="loginBox bg-cyber-panel border border-cyber-purple/30 rounded-xl p-10 w-96 max-w-[90%] shadow-[0_0_25px_rgba(0,0,0,0.4)] relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyber-purple/50 to-transparent" />
            <div className="loginLogo text-center mb-8">
              <img src={LOGO_BASE64} alt="Logo EL PATRON" className="w-24 h-24 mx-auto mb-4 object-contain" />
              <h1 className="font-orbitron font-extrabold text-3xl cyber-gradient-text tracking-widest uppercase">EL PATRON HN</h1>
              <p className="text-[11px] text-textD font-bold tracking-widest uppercase mt-1 font-orbitron">TECNOLOGIA DE PERSONALIZADOS</p>
            </div>
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div className="field">
                <label className="block text-[10px] uppercase font-bold text-cyber-cyan tracking-widest mb-1.5">Correo Electrónico</label>
                <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
                  className="w-full bg-cyber-purple/10 border border-cyber-purple/35 rounded-lg px-4 py-3 text-text font-mono text-sm outline-none focus:border-cyber-cyan" required />
              </div>
              <div className="field">
                <label className="block text-[10px] uppercase font-bold text-cyber-cyan tracking-widest mb-1.5">Contraseña</label>
                <input type="password" value={loginPass} onChange={e => setLoginPass(e.target.value)}
                  className="w-full bg-cyber-purple/10 border border-cyber-purple/35 rounded-lg px-4 py-3 text-text font-mono text-sm outline-none focus:border-cyber-cyan" required />
              </div>
              <button type="submit"
                className="w-full bg-gradient-to-r from-cyber-purple to-indigo-600 text-white font-orbitron font-bold text-xs tracking-widest py-3.5 rounded-lg shadow-[0_0_12px_rgba(138,43,226,0.5)] cursor-pointer hover:shadow-[0_0_20px_rgba(138,43,226,0.85)] transition-all uppercase">
                Ingresar
              </button>
            </form>

          </div>
        </div>
      ) : (
        <div className="flex min-h-screen relative">
          {isSidebarOpen && <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 md:hidden" onClick={() => setIsSidebarOpen(false)} />}
          <aside className={`bg-cyber-bg2 border-r border-cyber-purple/20 flex flex-col shrink-0 z-50 transition-all duration-300 md:static ${isSidebarOpen ? 'fixed inset-y-0 left-0 w-56' : 'hidden md:flex w-56'}`}>
              <div className="p-4 border-b border-cyber-purple/20 shrink-0 text-center">
                <img src={LOGO_BASE64} alt="Logo EL PATRON"
                  className="w-full max-h-28 object-contain mb-3" />
                <h2 className="font-orbitron font-black text-sm tracking-widest cyber-gradient-text uppercase">EL PATRON HN</h2>
                <span className="text-[9px] text-textD uppercase tracking-widest block font-bold font-orbitron mt-0.5">Tecnología de Personalizados</span>
              </div>
              <div className="m-4 p-3 bg-cyber-purple/10 border border-cyber-purple/20 rounded-lg text-xs font-mono shrink-0">
                <div className="font-bold text-cyber-cyan truncate">{currentUser.Nombre}</div>
                <div className="text-[10px] text-cyber-purple uppercase mt-0.5 font-bold tracking-widest">{currentUser.Rol}</div>
              </div>
              <nav className="px-2 py-3 space-y-1.5 text-xs flex-1 overflow-y-auto">
                {/* Comercial — Admin, Vendedor y Analista (solo lectura) */}
                {['Admin', 'Vendedor', 'Analista'].includes(currentUser.Rol) && <>
                  <div className="px-3 py-1.5 text-[9px] font-bold text-cyber-purple tracking-widest uppercase pt-3">Comercial</div>
                  <button onClick={() => { setActiveTab('pos'); setIsSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded font-bold uppercase tracking-wider text-left transition-all ${activePage === 'pos' ? 'bg-cyber-cyan/10 text-cyber-cyan border-l-2 border-cyber-cyan' : 'text-textD hover:bg-cyber-purple/5 hover:text-text'}`}>
                    <CreditCard className="w-4 h-4" /> POS
                  </button>
                  {['Admin', 'Analista'].includes(currentUser.Rol) && <button onClick={() => { setActiveTab('clients'); setIsSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded font-bold uppercase tracking-wider text-left transition-all ${activePage === 'clients' ? 'bg-cyber-cyan/10 text-cyber-cyan border-l-2 border-cyber-cyan' : 'text-textD hover:bg-cyber-purple/5 hover:text-text'}`}>
                    <Users className="w-4 h-4" /> Clientes
                  </button>}
                  <button onClick={() => { setActiveTab('quotations'); setIsSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded font-bold uppercase tracking-wider text-left transition-all ${activePage === 'quotations' ? 'bg-cyber-cyan/10 text-cyber-cyan border-l-2 border-cyber-cyan' : 'text-textD hover:bg-cyber-purple/5 hover:text-text'}`}>
                    <FileText className="w-4 h-4" /> Cotizaciones
                  </button>
                  <button onClick={() => { setActiveTab('sales'); setIsSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded font-bold uppercase tracking-wider text-left transition-all ${activePage === 'sales' ? 'bg-cyber-cyan/10 text-cyber-cyan border-l-2 border-cyber-cyan' : 'text-textD hover:bg-cyber-purple/5 hover:text-text'}`}>
                    <ShoppingCart className="w-4 h-4" /> Ventas
                  </button>
                  <button onClick={() => { setActiveTab('payments'); setIsSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded font-bold uppercase tracking-wider text-left transition-all ${activePage === 'payments' ? 'bg-cyber-cyan/10 text-cyber-cyan border-l-2 border-cyber-cyan' : 'text-textD hover:bg-cyber-purple/5 hover:text-text'}`}>
                    <DollarSign className="w-4 h-4" /> Pagos
                  </button>
                </>}

                {/* Operaciones */}
                <div className="px-3 py-1.5 text-[9px] font-bold text-cyber-purple tracking-widest uppercase pt-3">Operaciones</div>

                {/* Dashboard — Admin only */}
                {currentUser.Rol === 'Admin' && <button onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded font-bold uppercase tracking-wider text-left transition-all ${activePage === 'dashboard' ? 'bg-cyber-cyan/10 text-cyber-cyan border-l-2 border-cyber-cyan' : 'text-textD hover:bg-cyber-purple/5 hover:text-text'}`}>
                  <Warehouse className="w-4 h-4" /> Dashboard
                </button>}

                {/* Taller — Producción y Admin */}
                {['Admin', 'Produccion'].includes(currentUser.Rol) && <>
                  <button onClick={() => { setActiveTab('production'); setIsSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded font-bold uppercase tracking-wider text-left transition-all ${activePage === 'production' ? 'bg-cyber-cyan/10 text-cyber-cyan border-l-2 border-cyber-cyan' : 'text-textD hover:bg-cyber-purple/5 hover:text-text'}`}>
                    <Wrench className="w-4 h-4" /> Taller
                  </button>
                </>}

                {/* Compras — Admin only */}
                {currentUser.Rol === 'Admin' && <>
                  <div className="w-full flex items-center gap-3 px-3 py-2.5 rounded font-bold uppercase tracking-wider text-left opacity-40 cursor-default select-none">
                    <ShoppingCart className="w-4 h-4" /> Compras
                  </div>
                </>}

                {/* Inventario — todos */}
                <button onClick={() => { setActiveTab('inventory'); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded font-bold uppercase tracking-wider text-left transition-all ${activePage === 'inventory' ? 'bg-cyber-cyan/10 text-cyber-cyan border-l-2 border-cyber-cyan' : 'text-textD hover:bg-cyber-purple/5 hover:text-text'}`}>
                  <Archive className="w-4 h-4" /> Inventario
                </button>

                {/* Financiero — Admin only */}
                {currentUser.Rol === 'Admin' && <>
                  <div className="px-3 py-1.5 text-[9px] font-bold text-cyber-purple tracking-widest uppercase pt-3">Financiero</div>
                  <button onClick={() => { setActiveTab('contabilidad'); setIsSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded font-bold uppercase tracking-wider text-left transition-all ${activePage === 'contabilidad' ? 'bg-cyber-cyan/10 text-cyber-cyan border-l-2 border-cyber-cyan' : 'text-textD hover:bg-cyber-purple/5 hover:text-text'}`}>
                    <BookOpen className="w-4 h-4" /> Contabilidad
                  </button>
                </>}

                {/* Reportes BI — Admin y Analista */}
                {['Admin', 'Analista'].includes(currentUser.Rol) && <>
                  <button onClick={() => { setActiveTab('reports'); setIsSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded font-bold uppercase tracking-wider text-left transition-all ${activePage === 'reports' ? 'bg-cyber-cyan/10 text-cyber-cyan border-l-2 border-cyber-cyan' : 'text-textD hover:bg-cyber-purple/5 hover:text-text'}`}>
                    <FileText className="w-4 h-4" /> Reportes BI
                  </button>
                  <button onClick={() => { setActiveTab('leads'); setIsSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded font-bold uppercase tracking-wider text-left transition-all ${activePage === 'leads' ? 'bg-cyber-cyan/10 text-cyber-cyan border-l-2 border-cyber-cyan' : 'text-textD hover:bg-cyber-purple/5 hover:text-text'}`}>
                    <MessageSquare className="w-4 h-4" /> Leads
                  </button>
                </>}

                {/* Sistema — Admin only */}
                {currentUser.Rol === 'Admin' && <>
                  <div className="px-3 py-1.5 text-[9px] font-bold text-cyber-purple tracking-widest uppercase pt-3">Sistema</div>
                  <button onClick={() => { setActiveTab('company'); setIsSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded font-bold uppercase tracking-wider text-left transition-all ${activePage === 'company' ? 'bg-cyber-cyan/10 text-cyber-cyan border-l-2 border-cyber-cyan' : 'text-textD hover:bg-cyber-purple/5 hover:text-text'}`}>
                    <Warehouse className="w-4 h-4" /> Empresa
                  </button>
                  <button onClick={() => { setActiveTab('service-types'); setIsSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded font-bold uppercase tracking-wider text-left transition-all ${activePage === 'service-types' ? 'bg-cyber-cyan/10 text-cyber-cyan border-l-2 border-cyber-cyan' : 'text-textD hover:bg-cyber-purple/5 hover:text-text'}`}>
                    <Wrench className="w-4 h-4" /> Servicios
                  </button>
                  <button onClick={() => { setActiveTab('employees'); setIsSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded font-bold uppercase tracking-wider text-left transition-all ${activePage === 'employees' ? 'bg-cyber-cyan/10 text-cyber-cyan border-l-2 border-cyber-cyan' : 'text-textD hover:bg-cyber-purple/5 hover:text-text'}`}>
                    <Users className="w-4 h-4" /> Empleados
                  </button>
                  <button onClick={() => { setActiveTab('audit'); setIsSidebarOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded font-bold uppercase tracking-wider text-left transition-all ${activePage === 'audit' ? 'bg-cyber-cyan/10 text-cyber-cyan border-l-2 border-cyber-cyan' : 'text-textD hover:bg-cyber-purple/5 hover:text-text'}`}>
                    <Shield className="w-4 h-4" /> Auditoría
                  </button>
                </>}
              </nav>
            <div className="p-4 border-t border-cyber-purple/20 shrink-0">
              <button onClick={handleLogout}
                className="w-full btn bg-red-950/20 text-red-400 border border-red-500/30 font-orbitron font-semibold uppercase text-[10px] py-2 rounded hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer">
                <LogOut className="w-3.5 h-3.5" /> SALIR
              </button>
            </div>
          </aside>
          <main className="flex-1 min-h-screen flex flex-col">
            <header className="px-4 md:px-6 py-4 bg-cyber-bg2 border-b border-cyber-purple/20 flex items-center justify-between sticky top-0 z-40">
              <div className="flex items-center gap-3">
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="p-1.5 rounded-lg border border-cyber-purple/30 bg-cyber-bg hover:border-cyber-cyan text-text md:hidden cursor-pointer">
                  <Menu className="w-4 h-4 text-cyber-cyan" />
                </button>
                <h3 className="font-orbitron font-extrabold text-xs md:text-sm tracking-widest text-cyber-cyan uppercase">{activePage.toUpperCase()}</h3>
              </div>
              <div className="flex items-center gap-5">
                <button onClick={handleLogout}
                  className="md:hidden px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-950/20 text-red-400 hover:bg-red-500 hover:text-white transition-all flex items-center gap-2 cursor-pointer text-xs font-mono font-bold">
                  <LogOut className="w-3.5 h-3.5" /> SALIR
                </button>
                <div className="relative">
                  <button onClick={() => setThemeOpen(!themeOpen)}
                    className="px-3 py-1.5 rounded-lg border border-cyber-purple/35 bg-cyber-bg2/40 text-text hover:border-cyber-cyan transition-all flex items-center gap-2 cursor-pointer text-xs font-mono font-bold">
                    <div className="w-3.5 h-3.5 rounded-full border border-current" style={{
                      background: themeMode === 'oro-oscuro' ? '#1C1C20' :
                        themeMode === 'oro-claro' ? '#FAF9F6' :
                        themeMode === 'platino' ? '#27272B' :
                        themeMode === 'zafiro' ? '#0F172A' :
                        themeMode === 'esmeralda' ? '#0C1F12' :
                        themeMode === 'pizarra' ? '#F1F5F9' :
                        themeMode === 'rosa' ? '#332A2F' :
                        themeMode === 'rubi' ? '#2E1A1A' :
                        themeMode === 'onix' ? '#1C1C1C' :
                        themeMode === 'cobalto' ? '#182748' :
                        themeMode === 'menta' ? '#FFFFFF' :
                        themeMode === 'terrazo' ? '#30241E' :
                        themeMode === 'cobre' ? '#2E261C' :
                        themeMode === 'vino' ? '#2E1A22' :
                        themeMode === 'moka' ? '#2C241E' :
                        themeMode === 'hueso' ? '#FFFFFF' :
                        themeMode === 'durazno' ? '#FFFFFF' :
                        themeMode === 'miel' ? '#FFFFFF' :
                        themeMode === 'canela' ? '#FFFFFF' :
                        '#1C1C20'
                    }} />
                    TEMA
                  </button>
                  {themeOpen && <>
                    <div className="fixed inset-0 z-40" onClick={() => setThemeOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 w-44 bg-cyber-panel border border-cyber-purple/30 rounded-lg shadow-xl z-50 overflow-hidden font-mono text-xs">
                      {[
                        { id: 'oro-oscuro', label: 'Oro Oscuro', desc: 'Gold oscuro profesional' },
                        { id: 'oro-claro', label: 'Oro Claro', desc: 'Gold claro elegante' },
                        { id: 'platino', label: 'Platino', desc: 'Plata/cromo oscuro' },
                        { id: 'zafiro', label: 'Zafiro', desc: 'Azul navy corporativo' },
                        { id: 'esmeralda', label: 'Esmeralda', desc: 'Verde oscuro premium' },
                        { id: 'pizarra', label: 'Pizarra', desc: 'Gris claro moderno' },
                        { id: 'rosa', label: 'Rosa', desc: 'Rosado pastel femenino' },
                        { id: 'rubi', label: 'Rubí', desc: 'Rojo rubí intenso' },
                        { id: 'onix', label: 'Ónix', desc: 'Negro puro minimalista' },
                        { id: 'cobalto', label: 'Cobalto', desc: 'Azul industrial' },
                        { id: 'menta', label: 'Menta', desc: 'Verde fresco claro' },
                        { id: 'terrazo', label: 'Terrazo', desc: 'Terracota cálido oscuro' },
                        { id: 'cobre', label: 'Cobre', desc: 'Bronce cobrizo oscuro' },
                        { id: 'vino', label: 'Vino', desc: 'Borgoña / vino tinto' },
                        { id: 'moka', label: 'Moka', desc: 'Café oscuro cálido' },
                        { id: 'hueso', label: 'Hueso', desc: 'Marfil / hueso claro' },
                        { id: 'durazno', label: 'Durazno', desc: 'Melocotón suave claro' },
                        { id: 'miel', label: 'Miel', desc: 'Dorado miel claro' },
                        { id: 'canela', label: 'Canela', desc: 'Canela / nude claro' },
                      ].map(t => (
                        <button key={t.id} onClick={() => { setThemeMode(t.id); setThemeOpen(false); }}
                          className={`w-full text-left px-3 py-2.5 flex items-center gap-2.5 transition-all hover:bg-cyber-purple/10 ${themeMode === t.id ? 'bg-cyber-purple/15 text-cyber-cyan font-bold' : 'text-textD'}`}>
                          <div className="w-3 h-3 rounded-full border border-current shrink-0" style={{
                            background: t.id === 'oro-oscuro' ? '#1C1C20' :
                              t.id === 'oro-claro' ? '#FAF9F6' :
                              t.id === 'platino' ? '#27272B' :
                              t.id === 'zafiro' ? '#0F172A' :
                              t.id === 'esmeralda' ? '#0C1F12' :
                              t.id === 'pizarra' ? '#F1F5F9' :
                              t.id === 'rosa' ? '#332A2F' :
                              t.id === 'rubi' ? '#2E1A1A' :
                              t.id === 'onix' ? '#1C1C1C' :
                              t.id === 'cobalto' ? '#182748' :
                              t.id === 'menta' ? '#FFFFFF' :
                              t.id === 'terrazo' ? '#30241E' :
                              t.id === 'cobre' ? '#2E261C' :
                              t.id === 'vino' ? '#2E1A22' :
                              t.id === 'moka' ? '#2C241E' :
                              t.id === 'hueso' ? '#FFFFFF' :
                              t.id === 'durazno' ? '#FFFFFF' :
                              t.id === 'miel' ? '#FFFFFF' :
                              t.id === 'canela' ? '#FFFFFF' :
                              '#1C1C20'
                          }} />
                          <div>
                            <div className="text-[11px]">{t.label}</div>
                            <div className="text-[9px] text-textD opacity-60">{t.desc}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </>}
                </div>
                <span className="text-xs text-textD font-mono tracking-widest font-bold text-cyber-cyan">{clockTime}</span>
              </div>
            </header>
            <div className="p-6 flex-1 bg-cyber-bg">
              {activePage === 'dashboard' && currentUser.Rol === 'Admin' && <DashboardView products={products} sales={sales} payments={payments} clients={clients} productionTasks={productionTasks} canPay={['Admin', 'Vendedor'].includes(currentUser.Rol)} onOpenPayModal={() => setActiveTab('payments')} onNavigate={p => setActiveTab(p)} />}
              {activePage === 'pos' && ['Admin', 'Vendedor', 'Analista'].includes(currentUser.Rol) && <PosView clients={clients} products={products} currentUser={currentUser} onAddSale={handleAddNewSale} onAddQuickClient={handleAddQuickClient} canCreateSale={['Admin', 'Vendedor'].includes(currentUser.Rol)} serviceTypes={serviceTypes} />}
              {activePage === 'sales' && <SalesView sales={sales} clients={clients} products={products} currentUser={currentUser} onAddSale={handleAddNewSale} onAddQuickClient={handleAddQuickClient} onOpenPayModal={() => setActiveTab('payments')} canCreateSale={['Admin', 'Vendedor'].includes(currentUser.Rol)} canPay={['Admin', 'Vendedor'].includes(currentUser.Rol)} canInvoice={currentUser.Rol === 'Admin'} productionTasks={productionTasks} serviceTypes={serviceTypes} onUpdateTaskStatus={handleUpdateProductionTaskStatus} onDeleteSale={handleDeleteSale} onUpdateClient={handleUpdateClient} />}
              {activePage === 'payments' && ['Admin', 'Vendedor', 'Analista'].includes(currentUser.Rol) && <PaymentsView sales={sales} payments={payments} clients={clients} currentUser={currentUser} onAddPayment={handleAddPayment} onLiquidarAllDeudas={handleLiquidarAllDeudas} canPay={['Admin', 'Vendedor'].includes(currentUser.Rol)} onRefreshData={handleRefreshData} />}
              {activePage === 'inventory' && <InventoryView products={products} providers={providers} stockLogs={stockLogs} currentUser={currentUser} onAddProduct={handleAddNewProduct} onUpdateProduct={handleUpdateProduct} onDeleteProduct={handleDeleteProduct} onAddStockIn={handleAddStockIn} canAddProduct={currentUser.Rol === 'Admin'} />}
              {activePage === 'clients' && ['Admin', 'Analista'].includes(currentUser.Rol) && <ClientsView clients={clients} interactions={interactions} reminders={reminders} sales={sales} payments={payments} currentUser={currentUser} onAddClient={handleAddQuickClient} onAddInteraction={handleAddNewInteraction} onAddReminder={handleAddNewReminder} onCompleteReminder={handleCompleteReminder} onUpdateClient={handleUpdateClient} onDeleteClient={handleDeleteClient} canCreateClient={['Admin', 'Vendedor'].includes(currentUser.Rol)} onNavigate={(page, clientId) => { setPrefillClientId(clientId); setActiveTab(page); }} />}
              {activePage === 'quotations' && <QuotationsView clients={clients} products={products} currentUser={currentUser} onAddQuotation={handleAddNewQuotation} onConvertQuotationToSale={handleConvertQuotationToSale} onAddQuickClient={handleAddQuickClient} onUpdateClient={handleUpdateClient} prefillClientId={prefillClientId} serviceTypes={serviceTypes} onDeleteQuotation={handleDeleteQuotation} />}
              {activePage === 'reports' && <ReportsView sales={sales} payments={payments} clients={clients} products={products} />}
              {activePage === 'leads' && ['Admin', 'Analista'].includes(currentUser.Rol) && <LeadsView leads={leads} onDelete={handleDeleteLead} />}
              {activePage === 'company' && (companySettings ? <CompanyView settings={companySettings} onUpdate={handleUpdateCompanySettings} /> : <div className="flex items-center justify-center h-64 text-textD text-xs">No se pudo cargar la configuración. Verifica la conexión con el servidor.</div>)}
              {activePage === 'employees' && <EmployeesView users={users} currentUser={currentUser} onAddUser={handleAddNewUser} onUpdateUser={handleUpdateUser} onToggleUser={handleToggleUser} onDeleteUser={handleDeleteUser} />}
              {activePage === 'production' && <ProductionView tasks={productionTasks} users={users} onUpdateStatus={handleUpdateProductionTaskStatus} onUpdateTask={handleUpdateProductionTask} onAddTask={handleAddProductionTask} />}
              {activePage === 'service-types' && currentUser.Rol === 'Admin' && <ServiceTypesView serviceTypes={serviceTypes} onAdd={handleAddServiceType} onUpdate={handleUpdateServiceType} onToggle={handleToggleServiceType} onDelete={handleDeleteServiceType} />}
              {activePage === 'contabilidad' && currentUser.Rol === 'Admin' && <AccountingView />}
              {activePage === 'audit' && currentUser.Rol === 'Admin' && <AuditView />}
            </div>
          </main>
        </div>
      )}
    </div>
  );
}
