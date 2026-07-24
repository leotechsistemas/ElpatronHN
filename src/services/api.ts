const API_URL = '/api';

const MONETARY_FIELDS = new Set([
  'precio', 'precio_costo', 'precio_venta', 'precio_sugerido', 'precio_total', 'precio_unitario',
  'monto', 'monto_total', 'monto_asignado',
  'total_debe', 'total_haber', 'debe', 'haber', 'saldo',
  'subtotal', 'total_linea', 'descuento',
  'ltv', 'salario', 'costo_unitario', 'costo_total', 'pago_inicial',
  'today_sales_total', 'total_revenue', 'ticket_prom', 'total_deuda',
  'd0_30', 'd31_60', 'd61_90', 'd90plus', 'pagado',
]);

function isMonetaryKey(k: string): boolean {
  const snake = k.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
  return MONETARY_FIELDS.has(k) || MONETARY_FIELDS.has(snake) || snake.endsWith('_price') || snake.endsWith('_amount') || snake.endsWith('_total');
}

function transformMonetaries(obj: any, dir: 'toCents' | 'toAmount'): any {
  if (obj === null || obj === undefined || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(v => transformMonetaries(v, dir));
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [
      k,
      isMonetaryKey(k) && typeof v === 'number'
        ? (dir === 'toCents' ? Math.round(v * 100) : v / 100)
        : transformMonetaries(v, dir)
    ])
  );
}

function toSnakeCase(obj: any): any {
  if (obj === null || obj === undefined || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(toSnakeCase);
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [
      k.replace(/([a-z])([A-Z])/g, '$1_$2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2').toLowerCase(),
      toSnakeCase(v)
    ])
  );
}

async function request(path: string, options?: RequestInit): Promise<any> {
  let body = options?.body;
  if (typeof body === 'string') {
    try {
      let parsed = JSON.parse(body);
      if (parsed && typeof parsed === 'object') {
        parsed = transformMonetaries(parsed, 'toCents');
        body = JSON.stringify(toSnakeCase(parsed));
        console.log('=== ACTUAL PAYLOAD ===', body);
      }
    } catch {}
  }
  const res = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    method: options?.method,
    body,
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error || `Error ${res.status}: ${res.statusText}`);
  }
  if (res.status === 204) return null;
  const data = await res.json();
  return transformMonetaries(data, 'toAmount');
}

function listWrapper(data: any) {
  return { success: true, data };
}

function singleWrapper(data: any) {
  return { success: true, ...data };
}

function flattenPayments(data: any[]): any[] {
  return (data || []).flatMap((p: any) => {
    if (p.items && Array.isArray(p.items) && p.items.length > 0) {
      return p.items.map((item: any) => ({
        ID: `${p.id}-${item.venta_id}`,
        'Venta ID': item.venta_id,
        'Cliente ID': p.cliente_id,
        Cliente: p.cliente,
        Fecha: p.fecha,
        Monto: item.monto_asignado,
        Método: p.metodo || '',
        Estado: p.estado || 'Pagado',
        Observaciones: p.observaciones || '',
        'Registrado Por': p.registrado_por || '',
      }));
    }
    // Legacy flat format
    return [{
      ID: p.id || p.ID,
      'Venta ID': p.venta_id || p['Venta ID'],
      'Cliente ID': p.cliente_id || p['Cliente ID'],
      Cliente: p.cliente || p.Cliente,
      Fecha: p.fecha || p.Fecha,
      Monto: p.monto ?? p.Monto ?? 0,
      Método: p.metodo || p.Método || '',
      Estado: p.estado || p.Estado || 'Pagado',
      Observaciones: p.observaciones || p.Observaciones || '',
      'Registrado Por': p.registrado_por || p['Registrado Por'] || '',
    }];
  });
}

export const api = {
  ping: () => request('/ping').catch(() => ({ success: false })),

  login: (email: string, password: string) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
      .then(r => ({
        success: true,
        user: { id: r.id, nombre: r.name, correo: r.email, rol: r.role },
      })),

  logout: () => request('/auth/logout', { method: 'POST' }),

  getMe: () =>
    request('/auth/me').then(r => ({
      success: true,
      user: { id: r.id, nombre: r.name, correo: r.email, rol: r.role },
    })),

  getUsers: () => request('/users').then(listWrapper),
  createUser: (data: any) => request('/users', { method: 'POST', body: JSON.stringify(data) }).then(singleWrapper),
  updateUser: (id: string, data: any) => request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }).then(singleWrapper),
  toggleUser: (id: string, activo: boolean) =>
    request(`/users/${id}/toggle`, { method: 'PUT', body: JSON.stringify({ activo }) }).then(singleWrapper),
  deleteUser: (id: string) => request(`/users/${id}`, { method: 'DELETE' }),

  getActiveUsers: () => request('/users/active').then(listWrapper),
  getDepartmentStats: () => request('/users/stats/departments'),
  getPositionStats: () => request('/users/stats/positions'),
  getActiveUserCount: () => request('/users/stats/active-count'),

  getProducts: (page?: number, size = 50, search?: string, categoria?: string) => {
    const params = new URLSearchParams();
    if (page !== undefined) { params.set('page', String(page)); params.set('size', String(size)); }
    if (search) params.set('search', search);
    if (categoria) params.set('categoria', categoria);
    const qs = params.toString();
    return request(`/products${qs ? '?' + qs : ''}`).then(page !== undefined ? (r => r) : listWrapper);
  },
  createProduct: (data: any) => request('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id: string, data: any) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id: string) => request(`/products/${id}`, { method: 'DELETE' }),

  getClients: (page?: number, size = 50, search?: string, clasificacion?: string) => {
    const params = new URLSearchParams();
    if (page !== undefined) { params.set('page', String(page)); params.set('size', String(size)); }
    if (search) params.set('search', search);
    if (clasificacion) params.set('clasificacion', clasificacion);
    const qs = params.toString();
    return request(`/clients${qs ? '?' + qs : ''}`).then(page !== undefined ? (r => r) : listWrapper);
  },
  createClient: (data: any) => request('/clients', { method: 'POST', body: JSON.stringify(data) }),
  updateClient: (id: string, data: any) => request(`/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteClient: (id: string) => request(`/clients/${id}`, { method: 'DELETE' }),

  createSaleComplete: (data: any) => request('/sales/complete', { method: 'POST', body: JSON.stringify(data) }),

  getSales: (page?: number, size = 50, search?: string, estado?: string, estadoPago?: string, clienteId?: string) => {
    const params = new URLSearchParams();
    if (page !== undefined) { params.set('page', String(page)); params.set('size', String(size)); }
    if (search) params.set('search', search);
    if (estado) params.set('estado', estado);
    if (estadoPago) params.set('estadoPago', estadoPago);
    if (clienteId) params.set('clienteId', clienteId);
    const qs = params.toString();
    return request(`/sales${qs ? '?' + qs : ''}`).then(page !== undefined ? (r => r) : listWrapper);
  },
  createSale: (data: any) => request('/sales', { method: 'POST', body: JSON.stringify(data) }).then(singleWrapper),
  updateSaleStatus: (id: string, estado: string) =>
    request(`/sales/${id}`, { method: 'PATCH', body: JSON.stringify({ estado }) }).then(singleWrapper),
  recalcSaleStatus: (id: string) => request(`/sales/${id}/recalc-status`, { method: 'PATCH' }),
  convertQuotationToSale: (quoteId: string, data: any) =>
    request(`/sales/convert-from-quotation/${quoteId}`, { method: 'POST', body: JSON.stringify(data) }),
  deleteSale: (id: string) => request(`/sales/${id}`, { method: 'DELETE' }),

   getPayments: (page?: number, size = 50, search?: string, metodo?: string, estado?: string) => {
    const params = new URLSearchParams();
    if (page !== undefined) { params.set('page', String(page)); params.set('size', String(size)); }
    if (search) params.set('search', search);
    if (metodo) params.set('metodo', metodo);
    if (estado) params.set('estado', estado);
    const qs = params.toString();
    return request(`/payments${qs ? '?' + qs : ''}`).then(page !== undefined ? (r: any) => {
      if (r?.content) r.content = flattenPayments(r.content);
      return r;
    } : (r: any) => listWrapper(flattenPayments(r)));
  },
  getPaymentsFull: () => request('/payments').then(listWrapper),
  createPayment: (data: any) => request('/payments', { method: 'POST', body: JSON.stringify(data) }),

  getProviders: () => request('/providers').then(listWrapper),
  createProvider: (data: any) => request('/providers', { method: 'POST', body: JSON.stringify(data) }).then(singleWrapper),

  getInteractions: () => request('/interactions').then(listWrapper),
  createInteraction: (data: any) => request('/interactions', { method: 'POST', body: JSON.stringify(data) }).then(singleWrapper),

  getReminders: () => request('/reminders').then(listWrapper),
  createReminder: (data: any) => request('/reminders', { method: 'POST', body: JSON.stringify(data) }).then(singleWrapper),
  completeReminder: (id: string) => request(`/reminders/${id}/complete`, { method: 'PUT' }),

  getStockLogs: () => request('/stock-logs').then(listWrapper),
  createStockLog: (data: any) => request('/stock-logs', { method: 'POST', body: JSON.stringify(data) }).then(singleWrapper),

  getQuotations: (estado?: string, page = 0, size = 50) => {
    const params = new URLSearchParams();
    if (estado) params.set('estado', estado);
    params.set('page', String(page));
    params.set('size', String(size));
    return request(`/quotations?${params.toString()}`);
  },
  createQuotation: (data: any) => request('/quotations', { method: 'POST', body: JSON.stringify(data) }).then(singleWrapper),
  updateQuotation: (id: string, data: any) => request(`/quotations/${id}`, { method: 'PUT', body: JSON.stringify(data) }).then(singleWrapper),
  patchQuotation: (id: string, data: any) => request(`/quotations/${id}`, { method: 'PATCH', body: JSON.stringify(data) }).then(singleWrapper),
  deleteQuotation: (id: string) => request(`/quotations/${id}`, { method: 'DELETE' }),

  getProductionTasks: () => request('/production-tasks').then(listWrapper),
  createProductionTask: (data: any) => request('/production-tasks', { method: 'POST', body: JSON.stringify(data) }).then(singleWrapper),
  updateProductionTaskStatus: (id: string, estado: string) =>
    request(`/production-tasks/${id}/estado`, { method: 'PATCH', body: JSON.stringify({ estado }) }).then(singleWrapper),
  updateProductionTask: (id: string, data: any) =>
    request(`/production-tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }).then(singleWrapper),
  getProductionTaskStats: () => request('/production-tasks/estadisticas'),

  getCompanySettings: () => request('/company-settings'),

  updateCompanySettings: (data: any) => request('/company-settings', { method: 'PUT', body: JSON.stringify(data) }).then(singleWrapper),

  getServiceTypes: () => request('/service-types').then(listWrapper),
  getActiveServiceTypes: () => request('/service-types/activos').then(listWrapper),
  createServiceType: (data: any) => request('/service-types', { method: 'POST', body: JSON.stringify(data) }).then(singleWrapper),
  updateServiceType: (id: string, data: any) => request(`/service-types/${id}`, { method: 'PUT', body: JSON.stringify(data) }).then(singleWrapper),
  deleteServiceType: (id: string) => request(`/service-types/${id}`, { method: 'DELETE' }),
  toggleServiceType: (id: string) => request(`/service-types/${id}/toggle`, { method: 'PATCH' }).then(singleWrapper),

  getInvoiceItems: (ventaId: string) => request(`/invoice-items/by-sale/${ventaId}`).then(listWrapper),
  createInvoiceItem: (data: any) => request('/invoice-items', { method: 'POST', body: JSON.stringify(data) }).then(singleWrapper),
  updateInvoiceItem: (id: string, data: any) => request(`/invoice-items/${id}`, { method: 'PUT', body: JSON.stringify(data) }).then(singleWrapper),
  deleteInvoiceItem: (id: string) => request(`/invoice-items/${id}`, { method: 'DELETE' }),
  deleteInvoiceItemsBySale: (ventaId: string) => request(`/invoice-items/by-sale/${ventaId}`, { method: 'DELETE' }),

  getLeads: () => request('/leads').then(listWrapper),
  deleteLead: (id: number) => request(`/leads/${id}`, { method: 'DELETE' }),

  getDashboard: () => request('/dashboard'),

  requestQuote: (data: any) => request('/public/request-quote', { method: 'POST', body: JSON.stringify(data) }),

  deletePayment: (id: string) => request(`/payments/${id}`, { method: 'DELETE' }),
  anularPayment: (id: string) => request(`/payments/${id}`, { method: 'DELETE' }),

  sendCampaign: (data: any) => request('/campaigns/send', { method: 'POST', body: JSON.stringify(data) }),

  getAccountCatalog: () => request('/accounting/catalog').then(listWrapper),
  createAccount: (data: any) => request('/accounting/catalog', { method: 'POST', body: JSON.stringify(data) }),
  updateAccount: (id: string, data: any) => request(`/accounting/catalog/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  toggleAccount: (id: string) => request(`/accounting/catalog/${id}/toggle`, { method: 'PATCH' }),

  getAccountingEntries: (page?: number, size = 50, search?: string, tipo?: string) => {
    const params = new URLSearchParams();
    if (page !== undefined) { params.set('page', String(page)); params.set('size', String(size)); }
    if (search) params.set('search', search);
    if (tipo) params.set('tipo', tipo);
    const qs = params.toString();
    return request(`/accounting/entries${qs ? '?' + qs : ''}`);
  },
  getAccountingEntry: (id: string) => request(`/accounting/entries/${id}`),
  createAccountingEntry: (data: any) =>
    request('/accounting/entries', { method: 'POST', body: JSON.stringify(data) }),
  revertAccountingEntry: (id: string, usuario: string) => request(`/accounting/entries/${id}/revert?usuario=${usuario}`, { method: 'POST' }),

  getLedger: (cuentaId: string, desde?: string, hasta?: string) => {
    const params = new URLSearchParams();
    if (desde) params.set('desde', desde);
    if (hasta) params.set('hasta', hasta);
    const qs = params.toString();
    return request(`/accounting/ledger/${cuentaId}${qs ? '?' + qs : ''}`);
  },
  getBalanceGeneral: () => request('/accounting/balance'),
  getIncomeStatement: () => request('/accounting/income-statement'),
  getPeriodos: () => request('/accounting/periodos'),
  closePeriod: (codigo: string, usuario: string) => request(`/accounting/close-period?codigo=${codigo}&usuario=${usuario}`, { method: 'POST' }),

  getAuditLogs: (page = 0, size = 100) => request(`/audit?page=${page}&size=${size}`),
};
