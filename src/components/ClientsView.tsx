import React, { useState, useEffect, useCallback } from 'react';
import { Search, Users, MessageSquare, Bell, Plus, CheckCircle, Star, ArrowUpRight, Send, Mail, Phone, Pencil, Trash2, ChevronLeft, ChevronRight, Clock, DollarSign as DollarSignIcon, FileText as FileTextIcon, MapPin, CreditCard, AlertTriangle } from 'lucide-react';
import { Client, Interaction, Reminder, Sale, Payment } from '../types';
import { api } from '../services/api';

interface ClientsViewProps {
  clients: Client[];
  interactions: Interaction[];
  reminders: Reminder[];
  sales: Sale[];
  payments: Payment[];
  currentUser: { Nombre: string; Rol: string };
  onAddClient: (clientData: any) => Promise<any>;
  onAddInteraction: (intData: any) => Promise<boolean>;
  onAddReminder: (remData: any) => Promise<boolean>;
  onCompleteReminder: (remId: string) => void;
  onUpdateClient?: (clientId: string, clientData: any) => Promise<boolean>;
  onDeleteClient?: (clientId: string) => void;
  canCreateClient: boolean;
  onNavigate?: (page: string, clientId?: string) => void;
}

// All 18 departments of Honduras
const DEPARTAMENTOS_HN = [
  'Cortes', 'Francisco Morazan', 'Atlantida', 'Choluteca', 'Copan',
  'Colon', 'Comayagua', 'El Paraiso', 'Gracias a Dios', 'Intibuca',
  'Islas de la Bahia', 'La Paz', 'Lempira', 'Ocotepeque', 'Olancho',
  'Santa Barbara', 'Valle', 'Yoro'
];

function ClientHistoryInner({ clients, sales, payments }: { clients: Client[]; sales: Sale[]; payments: Payment[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const filteredClients = clients.filter(c =>
    c.Nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.ID.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.Teléfono && c.Teléfono.includes(searchTerm))
  );
  const clientSales = selectedClient
    ? sales.filter(s => s['Cliente ID'] === selectedClient.ID).sort((a, b) => b.Fecha.localeCompare(a.Fecha))
    : [];
  const clientPayments = selectedClient
    ? payments.filter(p => p['Cliente ID'] === selectedClient.ID).sort((a, b) => b.Fecha.localeCompare(a.Fecha))
    : [];
  const debtSales = clientSales.map(s => {
    const paid = clientPayments.filter(p => p['Venta ID'] === s.ID).reduce((acc, p) => acc + Number(p.Monto), 0);
    return { ...s, pagado: paid, saldo: Number(s.Precio) - paid };
  }).filter(s => s.saldo > 0.1);
  const totalDebt = debtSales.reduce((acc, s) => acc + s.saldo, 0);
  const totalPaid = clientPayments.reduce((acc, p) => acc + Number(p.Monto), 0);
  const totalPurchases = clientSales.reduce((acc, s) => acc + Number(s.Precio), 0);
  const fmt = (n: number) => 'L. ' + n.toLocaleString('es-HN', { minimumFractionDigits: 2 });
  return (
    <div className="space-y-4">
      {!selectedClient ? (
        <>
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textD" />
              <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar cliente por nombre, ID o teléfono..."
                className="w-full bg-cyber-bg border border-cyber-purple/20 rounded-lg pl-9 pr-3 py-2.5 text-xs font-mono text-text outline-none focus:border-cyber-cyan" />
            </div>
          </div>
          <div className="grid gap-2.5">
            {filteredClients.map(c => (
              <div key={c.ID} onClick={() => setSelectedClient(c)}
                className="bg-cyber-bg2 border border-cyber-purple/15 rounded-lg px-4 py-3 flex items-center justify-between cursor-pointer hover:border-cyber-cyan/40 transition-all">
                <div>
                  <div className="text-sm font-bold text-text">{c.Nombre}</div>
                  <div className="text-[10px] text-textD font-mono mt-0.5">{c.ID} · {c.Teléfono || 'Sin teléfono'}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-textD" />
              </div>
            ))}
            {filteredClients.length === 0 && <p className="text-textD text-xs text-center py-8">No se encontraron clientes.</p>}
          </div>
        </>
      ) : (
        <div>
          <button onClick={() => setSelectedClient(null)}
            className="text-[10px] text-cyber-cyan hover:underline font-mono mb-4 flex items-center gap-1">
            <ChevronLeft className="w-3 h-3" /> Volver a lista
          </button>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-cyber-bg2 border border-cyber-purple/15 rounded-lg p-3">
              <div className="text-[9px] text-textD font-mono uppercase tracking-wider">Total Comprado</div>
              <div className="text-sm font-bold text-cyber-cyan mt-1">{fmt(totalPurchases)}</div>
            </div>
            <div className="bg-cyber-bg2 border border-cyber-purple/15 rounded-lg p-3">
              <div className="text-[9px] text-textD font-mono uppercase tracking-wider">Total Pagado</div>
              <div className="text-sm font-bold text-emerald-400 mt-1">{fmt(totalPaid)}</div>
            </div>
            <div className="bg-cyber-bg2 border border-cyber-purple/15 rounded-lg p-3">
              <div className="text-[9px] text-textD font-mono uppercase tracking-wider">Saldo Pendiente</div>
              <div className="text-sm font-bold text-red-400 mt-1">{fmt(totalDebt)}</div>
            </div>
          </div>
          {clientSales.length === 0 ? (
            <p className="text-textD text-xs text-center py-8">Este cliente no tiene ventas registradas.</p>
          ) : (
            <div className="space-y-2">
              {clientSales.map(s => {
                const paid = clientPayments.filter(p => p['Venta ID'] === s.ID).reduce((acc, p) => acc + Number(p.Monto), 0);
                const balance = Number(s.Precio) - paid;
                return (
                  <div key={s.ID} className="bg-cyber-bg2 border border-cyber-purple/15 rounded-lg px-4 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-text">{s.ID}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${s.Estado === 'Pendiente' ? 'bg-yellow-500/10 text-yellow-400' : s.Estado === 'En proceso' ? 'bg-cyber-cyan/10 text-cyber-cyan' : s.Estado === 'Terminado' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-cyber-cyan/10 text-cyber-cyan'}`}>{s.Estado}</span>
                    </div>
                    <div className="text-[10px] text-textD font-mono">{s.Fecha} · {s.Producto || s['Tipo Trabajo']}</div>
                    <div className="flex items-center gap-4 mt-1.5 text-[10px] font-mono">
                      <span className="text-text">{fmt(Number(s.Precio))}</span>
                      <span className="text-emerald-400">Pagado: {fmt(paid)}</span>
                      {balance > 0.1 && <span className="text-red-400">Saldo: {fmt(balance)}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ClientsView({
  clients,
  interactions,
  reminders,
  sales,
  payments,
  currentUser,
  onAddClient,
  onAddInteraction,
  onAddReminder,
  onCompleteReminder,
  onUpdateClient,
  onDeleteClient,
  canCreateClient,
  onNavigate
}: ClientsViewProps) {
  const [activeTab, setActiveTab] = useState<'clients' | 'interactions' | 'reminders' | 'campaigns' | 'history'>('clients');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination state (clients tab only)
  const PAGE_SIZE = 20;
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [paginatedClients, setPaginatedClients] = useState<Client[]>([]);
  const [isLoadingPage, setIsLoadingPage] = useState(false);

  const mapClient = (c: any): Client => ({
    ID: c.id, Nombre: c.nombre, RTN: c.rtn || '', Teléfono: c.telefono || '', Email: c.email || '',
    Estado: c.estado, Observaciones: c.observaciones || '', Clasificación: c.clasificacion,
    'Fecha Registro': c.fecha_registro, LTV: c.ltv || 0, 'RFM Score': c.rfm_score || 5,
    Departamento: c.departamento || '', Ciudad: c.ciudad || ''
  });

  const fetchClientsPage = useCallback(async (page: number, search: string) => {
    setIsLoadingPage(true);
    try {
      const res = await api.getClients(page, PAGE_SIZE, search || undefined);
      setPaginatedClients(((res as any).content || []).map(mapClient));
      setTotalPages((res as any).total_pages || 1);
      setTotalElements((res as any).total_elements || 0);
    } catch {
      setPaginatedClients([]);
    }
    setIsLoadingPage(false);
  }, []);

  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(0);
      setSearchInput(searchTerm);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);
  const [refreshKey, setRefreshKey] = useState(0);
  useEffect(() => {
    if (activeTab === 'clients') {
      fetchClientsPage(currentPage, searchInput !== '' ? searchInput : '');
    }
  }, [currentPage, searchInput, activeTab, refreshKey]);

  // Modals toggles
  const [showAddClient, setShowAddClient] = useState(false);
  const [showAddInt, setShowAddInt] = useState(false);
  const [showAddRem, setShowAddRem] = useState(false);
  const [selectedClientDetail, setSelectedClientDetail] = useState<Client | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  // Client form states
  const [cliNombre, setCliNombre] = useState('');
  const [cliRtn, setCliRtn] = useState('');
  const [cliTel, setCliTel] = useState('');
  const [cliEmail, setCliEmail] = useState('');
  const [cliClasificacion, setCliClasificacion] = useState<'Nuevo' | 'Frecuente' | 'VIP' | 'Deudor'>('Nuevo');
  const [cliObs, setCliObs] = useState('');
  const [cliDepto, setCliDepto] = useState('Cortes');
  const [cliCiudad, setCliCiudad] = useState('');

  // Interaction form states
  const [intClient, setIntClient] = useState('');
  const [intTipo, setIntTipo] = useState<'Llamada' | 'WhatsApp' | 'Email' | 'Visita'>('Llamada');
  const [intResultado, setIntResultado] = useState('');
  const [intObs, setIntObs] = useState('');

  // Reminder form states
  const [remClient, setRemClient] = useState('');
  const [remFecha, setRemFecha] = useState('');
  const [remDesc, setRemDesc] = useState('');
  const [remPrio, setRemPrio] = useState<'Alta' | 'Media' | 'Baja'>('Media');

  // Marketing Campaign form states
  const [campTarget, setCampTarget] = useState<'Todos' | 'VIP' | 'Frecuente' | 'Deudor' | 'Nuevo'>('Todos');
  const [campCanal, setCampCanal] = useState<'WhatsApp' | 'Email' | 'Ambos'>('WhatsApp');
  const [campPlantilla, setCampPlantilla] = useState<'promocion' | 'cobranza' | 'agradecimiento'>('promocion');
  const [campMensajeCustom, setCampMensajeCustom] = useState(
    'Estimado cliente de EL Patron HN, le informamos que tenemos descuentos exclusivos del 15% en grabado CO2 y corte de acrílicos en este mes. ¡Contáctenos!'
  );
  const [campAsunto, setCampAsunto] = useState('Campañas Especiales EL Patron HN');
  const [campLogs, setCampLogs] = useState<string[]>([]);
  const [isSendingCampCode, setIsSendingCampCode] = useState(false);
  const [campIndexProgress, setCampIndexProgress] = useState(0);
  const [campTotalProgress, setCampTotalProgress] = useState(0);

  const filteredClients = paginatedClients;

  const filteredInts = interactions.filter(i => 
    i.Cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.Observaciones.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredReminders = reminders.filter(r => 
    r.Cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.Descripción.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmitClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliNombre.trim()) return;

    const data = {
      nombre: cliNombre.trim(),
      rtn: cliRtn.trim(),
      telefono: cliTel.trim(),
      email: cliEmail.trim(),
      estado: 'Activo',
      clasificacion: cliClasificacion,
      observaciones: cliObs,
      departamento: cliDepto,
      ciudad: cliCiudad.trim() || 'San Pedro Sula'
    };

    let success = false;
    if (editingClient) {
      if (onUpdateClient) success = await onUpdateClient(editingClient.ID, data);
    } else {
      success = await onAddClient(data);
    }
    if (success) {
      setShowAddClient(false);
      setEditingClient(null);
      setCliNombre('');
      setCliRtn('');
      setCliTel('');
      setCliEmail('');
      setCliObs('');
      setCliCiudad('');
      setCliDepto('Cortes');
      setRefreshKey(k => k + 1);
    }
  };

  const openEditClient = (client: Client) => {
    setEditingClient(client);
    setCliNombre(client.Nombre);
    setCliRtn(client.RTN || '');
    setCliTel(client.Teléfono || '');
    setCliEmail(client.Email || '');
    setCliCiudad(client.Ciudad || '');
    setCliDepto(client.Departamento || 'Cortes');
    setCliClasificacion((client.Clasificación as any) || 'Nuevo');
    setCliObs(client.Observaciones || '');
    setShowAddClient(true);
  };

  const handleDeleteClick = async (client: Client) => {
    if (window.confirm(`¿Está seguro de eliminar a "${client.Nombre}" (${client.ID})?`)) {
      await onDeleteClient?.(client.ID);
      setRefreshKey(k => k + 1);
    }
  };

  const handleAddIntSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!intClient || !intResultado) return;

    const targetCli = clients.find(c => c.ID === intClient);

    const success = await onAddInteraction({
      clienteId: intClient,
      clienteNombre: targetCli?.Nombre || '—',
      tipo: intTipo,
      resultado: intResultado.trim(),
      observaciones: intObs
    });

    if (success) {
      setShowAddInt(false);
      setIntClient('');
      setIntResultado('');
      setIntObs('');
    }
  };

  const handleAddRemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!remClient || !remFecha || !remDesc) return;

    const targetCli = clients.find(c => c.ID === remClient);

    const success = await onAddReminder({
      clienteId: remClient,
      clienteNombre: targetCli?.Nombre || '—',
      fecha: remFecha,
      descripcion: remDesc.trim(),
      prioridad: remPrio
    });

    if (success) {
      setShowAddRem(false);
      setRemClient('');
      setRemFecha('');
      setRemDesc('');
    }
  };

  const handleTemplateChange = (plantilla: 'promocion' | 'cobranza' | 'agradecimiento') => {
    setCampPlantilla(plantilla);
    if (plantilla === 'promocion') {
      setCampMensajeCustom('Estimado cliente de EL Patron HN, le informamos que tenemos descuentos exclusivos del 15% en grabado de termos de fibra y corte láser en este mes. ¡Escríbanos!');
      setCampAsunto('¡15% Descuento Especial en Grabado y Corte Láser! - EL Patron HN');
    } else if (plantilla === 'cobranza') {
      setCampMensajeCustom('Hola {Nombre}, quisiéramos recordarle amablemente que posee un saldo pendiente de pago con nosotros en EL Patron HN. Le agradecemos realizar su abono a la brevedad.');
      setCampAsunto('Recordatorio Amigable: Cuenta de Crédito Pendiente - EL Patron HN');
    } else {
      setCampMensajeCustom('¡Muchas gracias {Nombre} por confiar sus trabajos personalizados y grabado en EL Patron HN! Es un placer servirle de manera oportuna con la máxima tecnología de corte y grabado de Honduras.');
      setCampAsunto('Agradecimiento Especial por su Preferencia - EL Patron HN');
    }
  };

  const handleLaunchCampaignSimulator = async () => {
    setIsSendingCampCode(true);
    setCampIndexProgress(0);
    setCampTotalProgress(0);
    setCampLogs([]);

    try {
      const res = await api.sendCampaign({
        segmento: campTarget,
        canal: campCanal,
        plantilla: campPlantilla,
        asunto: campAsunto,
        mensaje: campMensajeCustom,
      });

      const logs: string[] = res.logs || [];
      setCampTotalProgress(logs.length);

      // Animate logs one by one
      for (let i = 0; i < logs.length; i++) {
        setCampLogs(prev => [...prev, logs[i]]);
        setCampIndexProgress(i + 1);
        await new Promise(r => setTimeout(r, 150));
      }

      setCampLogs(prev => [...prev, `🟢 [FIN] Campaña finalizada con éxito. Se enviaron ${res.enviados_count} de ${logs.length} mensajes.`]);
    } catch (err: any) {
      setCampLogs(prev => [...prev, `🔴 [ERROR] ${err.message || 'Error al enviar campaña'}`]);
    } finally {
      setIsSendingCampCode(false);
    }
  };

  const generateWhatsAppLink = (client: Client, customMessage?: string) => {
    const rawPhone = client.Teléfono || '';
    // Strip non digits
    let cleanPhone = rawPhone.replace(/\D/g, '');
    if (!cleanPhone) return '#';
    // If no country code, add 504
    if (cleanPhone.length === 8) {
      cleanPhone = '504' + cleanPhone;
    }
    const message = customMessage || `Estimado ${client.Nombre}, le saludamos de EL Patron HN para informarle de su saldo o trabajos pendientes. Feliz día.`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  const getBadgeColor = (clasif: string) => {
    switch (clasif) {
      case 'VIP': return 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/30';
      case 'Frecuente': return 'bg-cyber-purple/15 text-cyber-purple border border-cyber-purple/35';
      case 'Deudor': return 'bg-red-500/10 text-red-500 border border-red-500/30';
      default: return 'bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan/30';
    }
  };

  const fmt = (n: number) => 'L. ' + Number(n).toLocaleString('es-HN', { minimumFractionDigits: 2 });

  return (
    <div className="space-y-6">
      {/* CRM Dynamic Navigation Categories */}
      <div className="flex flex-wrap border-b border-cyber-purple/20">
        <button
          onClick={() => setActiveTab('clients')}
          className={`px-5 py-3 font-orbitron text-xs font-bold tracking-wider select-none cursor-pointer transition-all border-b-2 flex items-center gap-2 ${activeTab === 'clients' ? 'border-cyber-cyan text-cyber-cyan' : 'border-transparent text-textD hover:text-text'}`}
        >
          <Users className="w-4 h-4" />
          CLIENTES
        </button>
        <button
          onClick={() => setActiveTab('interactions')}
          className={`px-5 py-3 font-orbitron text-xs font-bold tracking-wider select-none cursor-pointer transition-all border-b-2 flex items-center gap-2 ${activeTab === 'interactions' ? 'border-cyber-cyan text-cyber-cyan' : 'border-transparent text-textD hover:text-text'}`}
        >
          <MessageSquare className="w-4 h-4" />
          LOG DE INTERACCIONES
        </button>
        <button
          onClick={() => setActiveTab('reminders')}
          className={`px-5 py-3 font-orbitron text-xs font-bold tracking-wider select-none cursor-pointer transition-all border-b-2 flex items-center gap-2 ${activeTab === 'reminders' ? 'border-cyber-cyan text-cyber-cyan' : 'border-transparent text-textD hover:text-text'}`}
        >
          <Bell className="w-4 h-4" />
          ALERTAS DE COBRO
        </button>
        <button
          onClick={() => setActiveTab('campaigns')}
          className={`px-5 py-3 font-orbitron text-xs font-bold tracking-wider select-none cursor-pointer transition-all border-b-2 flex items-center gap-2 ${activeTab === 'campaigns' ? 'border-cyber-cyan text-cyber-cyan' : 'border-transparent text-textD hover:text-text'}`}
        >
          <Send className="w-4 h-4 text-cyber-pink" />
          CAMPAÑAS DE MARKETING
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-5 py-3 font-orbitron text-xs font-bold tracking-wider select-none cursor-pointer transition-all border-b-2 flex items-center gap-2 ${activeTab === 'history' ? 'border-cyber-cyan text-cyber-cyan' : 'border-transparent text-textD hover:text-text'}`}
        >
          <Clock className="w-4 h-4" />
          HISTORIAL
        </button>
      </div>

      {/* Main filters & Add Buttons */}
      {activeTab !== 'campaigns' && (
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-3.5 text-cyber-purple w-4 h-4" />
            <input
              type="text"
              placeholder={
                activeTab === 'clients' 
                  ? "🔍 Filtrar por nombre, depto o código..." 
                  : activeTab === 'interactions'
                  ? "🔍 Buscar interacciones..."
                  : "🔍 Buscar alertas de cobros..."
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="searchBox w-full pl-10 pr-4 py-3 bg-cyber-purple/10 border border-cyber-purple/40 text-text font-mono text-sm rounded-lg outline-none focus:border-cyber-cyan transition-all"
            />
          </div>

          <div className="flex gap-2 w-full sm:w-auto justify-end">
            {activeTab === 'clients' && canCreateClient && (
              <button
                onClick={() => setShowAddClient(true)}
                className="btn bg-gradient-to-r from-cyber-purple to-indigo-600 text-white font-orbitron font-bold text-xs tracking-wider px-6 py-3 rounded-lg shadow-[0_0_12px_rgba(138,43,226,0.5)] hover:shadow-[0_0_18px_rgba(138,43,226,0.8)] hover:scale-[1.01] transition-all cursor-pointer"
              >
                + NUEVO CLIENTE
              </button>
            )}
            {activeTab === 'interactions' && (
              <button
                onClick={() => setShowAddInt(true)}
                className="btn bg-[#005555] hover:bg-cyber-cyan text-cyber-cyan hover:text-cyber-bg border border-cyber-cyan/30 font-orbitron font-bold text-xs tracking-wider px-6 py-3 rounded-lg transition-all cursor-pointer"
              >
                + AGREGAR INTERACCIÓN
              </button>
            )}
            {activeTab === 'reminders' && (
              <button
                onClick={() => setShowAddRem(true)}
                className="btn bg-gradient-to-r from-cyber-purple to-indigo-600 text-white font-orbitron font-bold text-xs tracking-wider px-6 py-3 rounded-lg hover:scale-[1.01] transition-all cursor-pointer"
              >
                + NUEVO RECORDATORIO
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── CLIENT REGISTER TAB ── */}
      {activeTab === 'clients' && (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* ── LEFT PANEL: Client List ── */}
          <div className="w-full lg:w-[340px] xl:w-[380px] shrink-0">
            <div className="border border-cyber-purple/20 bg-cyber-panel rounded-xl overflow-hidden shadow-2xl">
              <div className="bg-gradient-to-r from-cyber-purple/20 to-indigo-600/10 border-b border-cyber-purple/20 px-4 py-3 flex items-center justify-between relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:bg-gradient-to-r before:from-cyber-cyan before:via-cyber-purple before:to-cyber-pink">
                <h4 className="font-orbitron font-bold text-[10px] text-cyber-cyan tracking-wider uppercase flex items-center gap-2 relative z-10">
                  <Users className="w-3.5 h-3.5" />
                  REGISTRO DE SOCIOS
                </h4>
                <span className="text-[9px] text-textD font-mono bg-cyber-bg/50 px-2 py-0.5 rounded">{totalElements} socios</span>
              </div>
              <div className="p-3 border-b border-cyber-purple/10 bg-gradient-to-r from-cyber-bg/50 to-transparent">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-cyber-purple" />
                  <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Buscar por nombre, ID o teléfono..."
                    className="w-full bg-cyber-bg border border-cyber-purple/30 rounded-lg pl-9 pr-3 py-2 text-[10px] font-mono text-text outline-none focus:border-cyber-cyan focus:shadow-[0_0_8px_rgba(0,255,255,0.15)] transition-all" />
                </div>
              </div>
              <div className="overflow-y-auto max-h-[calc(100vh-300px)]">
                {filteredClients.map((c, idx) => {
                  const cSales = sales.filter(s => s['Cliente ID'] === c.ID);
                  const cPays = payments.filter(p => p['Cliente ID'] === c.ID);
                  const cPaid = cPays.reduce((a, p) => a + Number(p.Monto), 0);
                  const cTotal = cSales.reduce((a, s) => a + Number(s.Precio), 0);
                  const cDebt = cTotal - cPaid;
                  const gradientColors = ['from-cyber-purple/20', 'from-cyber-cyan/10', 'from-cyber-pink/10', 'from-indigo-600/10'];
                  return (
                    <div key={c.ID} onClick={() => { setSelectedClientDetail(c); }}
                      className={`px-4 py-3 border-b border-cyber-purple/5 cursor-pointer transition-all hover:bg-gradient-to-r ${gradientColors[idx % gradientColors.length]} hover:to-transparent ${selectedClientDetail?.ID === c.ID ? 'bg-gradient-to-r from-cyber-cyan/10 to-transparent border-l-2 border-cyber-cyan shadow-[inset_0_0_12px_rgba(0,255,255,0.05)]' : ''}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${selectedClientDetail?.ID === c.ID ? 'bg-cyber-cyan/20 text-cyber-cyan' : 'bg-cyber-purple/20 text-cyber-purple'}`}>
                            <Users className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-text truncate flex items-center gap-1.5">
                              {c.Nombre}
                              <span className={`badge text-[7px] px-1 py-0.5 rounded uppercase font-bold ${getBadgeColor(c.Clasificación)}`}>
                                {c.Clasificación || 'Nuevo'}
                              </span>
                            </div>
                            <div className="text-[9px] text-textD font-mono truncate">{c.ID} · {c.Teléfono || 'Sin teléfono'}</div>
                          </div>
                        </div>
                        <div className="shrink-0 ml-2">
                          {cDebt > 0.1 ? (
                            <span className="text-[9px] text-red-400 font-bold font-mono bg-red-500/10 px-1.5 py-0.5 rounded">{fmt(cDebt)}</span>
                          ) : (
                            <span className="text-[9px] text-green-500 font-mono">✓</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {filteredClients.length === 0 && (
                  <div className="p-8 text-center text-textD text-[10px]">No se encontraron clientes.</div>
                )}
              </div>
              {/* Pagination */}
              <div className="flex items-center justify-between px-4 py-2.5 border-t border-cyber-purple/10 text-[10px] font-mono bg-gradient-to-r from-cyber-bg/50 to-transparent">
                <button onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                  disabled={currentPage === 0 || isLoadingPage}
                  className="px-2 py-1 rounded bg-cyber-purple/10 text-cyber-cyan border border-cyber-purple/30 hover:bg-cyber-purple/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer">
                  <ChevronLeft className="w-3 h-3 inline" />
                </button>
                <span className="text-textD">{currentPage + 1}/{totalPages || 1}</span>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={currentPage >= totalPages - 1 || isLoadingPage}
                  className="px-2 py-1 rounded bg-cyber-purple/10 text-cyber-cyan border border-cyber-purple/30 hover:bg-cyber-purple/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer">
                  <ChevronRight className="w-3 h-3 inline" />
                </button>
              </div>
            </div>
          </div>

          {/* ── RIGHT PANEL: Client Detail ── */}
          <div className="flex-1 min-w-0">
            {selectedClientDetail ? (
              <div className="space-y-5">
                {/* Client Header */}
                <div className="border border-cyber-purple/20 bg-cyber-panel rounded-xl overflow-hidden shadow-2xl relative before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:bg-gradient-to-r before:from-cyber-cyan before:via-cyber-purple before:to-cyber-pink">
                  <div className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyber-purple to-indigo-600 flex items-center justify-center shadow-[0_0_15px_rgba(138,43,226,0.3)]">
                          <Users className="w-7 h-7 text-white" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-orbitron font-black text-base text-text truncate">{selectedClientDetail.Nombre}</h3>
                            <span className={`badge text-[8px] px-2 py-0.5 rounded uppercase font-bold ${getBadgeColor(selectedClientDetail.Clasificación)}`}>
                              {selectedClientDetail.Clasificación || 'Nuevo'}
                            </span>
                          </div>
                          <div className="text-[10px] text-textD font-mono space-y-0.5">
                            <span className="text-cyber-cyan font-bold">{selectedClientDetail.ID}</span>
                            <span className="mx-1.5 text-cyber-purple/50">|</span>
                            <span className="text-text">{selectedClientDetail.Teléfono || 'Sin teléfono'}</span>
                            {selectedClientDetail.Email && <><span className="mx-1.5 text-cyber-purple/50">|</span><span className="text-cyber-cyan">{selectedClientDetail.Email}</span></>}
                          </div>
                          <div className="text-[9px] text-textD font-mono mt-0.5">
                            <MapPin className="w-3 h-3 inline mr-1 text-cyber-purple" />
                            {selectedClientDetail.Departamento || 'Cortes'}{selectedClientDetail.Ciudad ? `, ${selectedClientDetail.Ciudad}` : ''}
                            {selectedClientDetail.RTN && <><span className="mx-1.5 text-cyber-purple/50">|</span>RTN: <span className="text-cyber-cyan">{selectedClientDetail.RTN}</span></>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button onClick={() => openEditClient(selectedClientDetail)}
                          className="p-2 rounded-lg bg-cyber-purple/20 text-cyber-cyan border border-cyber-purple/30 hover:bg-gradient-to-r hover:from-cyber-purple hover:to-indigo-600 hover:text-white transition-all cursor-pointer" title="Modificar">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        {onDeleteClient && (
                          <button onClick={() => handleDeleteClick(selectedClientDetail)}
                            className="p-2 rounded-lg bg-red-900/20 text-red-400 border border-red-500/30 hover:bg-gradient-to-r hover:from-red-600 hover:to-red-800 hover:text-white transition-all cursor-pointer" title="Eliminar">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <a href={generateWhatsAppLink(selectedClientDetail)} target="_blank" rel="noreferrer"
                          className="p-2 rounded-lg bg-green-600/20 text-green-400 border border-green-500/30 hover:bg-gradient-to-r hover:from-green-600 hover:to-emerald-700 hover:text-white transition-all cursor-pointer" title="WhatsApp">
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                    {/* KPIs */}
                    {(() => {
                      const cSales = sales.filter(s => s['Cliente ID'] === selectedClientDetail.ID);
                      const cPays = payments.filter(p => p['Cliente ID'] === selectedClientDetail.ID);
                      const totalPurchases = cSales.reduce((a, s) => a + Number(s.Precio), 0);
                      const totalPaid = cPays.reduce((a, p) => a + Number(p.Monto), 0);
                      const debtSales = cSales.map(s => {
                        const paid = cPays.filter(p => p['Venta ID'] === s.ID).reduce((a, p) => a + Number(p.Monto), 0);
                        return { ...s, pagado: paid, saldo: Number(s.Precio) - paid };
                      });
                      const totalDebt = debtSales.reduce((a, s) => a + s.saldo, 0);
                      return (
                        <div className="grid grid-cols-3 gap-4 mt-5">
                          <div className="bg-gradient-to-br from-cyber-cyan/10 to-transparent border border-cyber-cyan/20 rounded-xl p-4 relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-gradient-to-r before:from-cyber-cyan before:to-transparent">
                            <div className="flex items-center gap-2 mb-2">
                              <DollarSignIcon className="w-4 h-4 text-cyber-cyan" />
                              <div className="text-[8px] text-cyber-cyan font-orbitron font-bold uppercase tracking-wider">Total Comprado</div>
                            </div>
                            <div className="text-lg font-black text-white font-orbitron">{fmt(totalPurchases)}</div>
                          </div>
                          <div className="bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-xl p-4 relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-gradient-to-r before:from-emerald-400 before:to-transparent">
                            <div className="flex items-center gap-2 mb-2">
                              <CreditCard className="w-4 h-4 text-emerald-400" />
                              <div className="text-[8px] text-emerald-400 font-orbitron font-bold uppercase tracking-wider">Total Pagado</div>
                            </div>
                            <div className="text-lg font-black text-emerald-400 font-orbitron">{fmt(totalPaid)}</div>
                          </div>
                          <div className={`bg-gradient-to-br ${totalDebt > 0.1 ? 'from-red-500/10 to-transparent border-red-500/20 before:from-red-400' : 'from-textD/10 to-transparent border-textD/20 before:from-textD'} rounded-xl p-4 relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-gradient-to-r before:to-transparent border`}>
                            <div className="flex items-center gap-2 mb-2">
                              <AlertTriangle className={`w-4 h-4 ${totalDebt > 0.1 ? 'text-red-400' : 'text-textD'}`} />
                              <div className={`text-[8px] font-orbitron font-bold uppercase tracking-wider ${totalDebt > 0.1 ? 'text-red-400' : 'text-textD'}`}>Saldo Pendiente</div>
                            </div>
                            <div className={`text-lg font-black font-orbitron ${totalDebt > 0.1 ? 'text-red-400' : 'text-textD'}`}>{fmt(Math.max(0, totalDebt))}</div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Sales History */}
                <div className="border border-cyber-purple/20 bg-cyber-panel rounded-xl overflow-hidden shadow-2xl relative before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-gradient-to-r before:from-cyber-purple before:via-cyber-pink before:to-transparent">
                  <div className="bg-gradient-to-r from-cyber-purple/10 to-transparent border-b border-cyber-purple/20 px-5 py-3">
                    <h4 className="font-orbitron font-bold text-[10px] text-cyber-cyan tracking-wider uppercase flex items-center gap-2">
                      <FileTextIcon className="w-3.5 h-3.5 text-cyber-pink" />
                      HISTORIAL DE VENTAS
                    </h4>
                  </div>
                  <div className="p-0">
                    {(() => {
                      const cSales = sales.filter(s => s['Cliente ID'] === selectedClientDetail.ID).sort((a, b) => b.Fecha.localeCompare(a.Fecha));
                      const cPays = payments.filter(p => p['Cliente ID'] === selectedClientDetail.ID);
                      if (cSales.length === 0) return <div className="text-center py-8 text-textD text-[10px]">Este cliente no tiene ventas registradas.</div>;
                      return (
                        <div className="divide-y divide-cyber-purple/10">
                          {cSales.map((s, idx) => {
                            const paid = cPays.filter(p => p['Venta ID'] === s.ID).reduce((a, p) => a + Number(p.Monto), 0);
                            const balance = Number(s.Precio) - paid;
                            const rowColors = ['from-cyber-purple/5', 'from-transparent'];
                            return (
                              <div key={s.ID} className={`px-5 py-3.5 hover:bg-gradient-to-r ${rowColors[idx % 2]} hover:to-transparent transition-all`}>
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-cyber-cyan">{s.ID}</span>
                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${s.Estado === 'Pendiente' ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20' : s.Estado === 'En proceso' ? 'bg-cyber-cyan/15 text-cyber-cyan border border-cyber-cyan/20' : s.Estado === 'Terminado' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-cyber-cyan/15 text-cyber-cyan border border-cyber-cyan/20'}`}>{s.Estado}</span>
                                  </div>
                                  {s['Estado Pago'] === 'Pagado' ? (
                                    <span className="bg-green-500/10 text-green-400 text-[8px] px-1.5 py-0.5 rounded font-bold border border-green-500/20">✓ PAGADO</span>
                                  ) : (
                                    <span className="bg-red-500/10 text-red-400 text-[8px] px-1.5 py-0.5 rounded font-bold border border-red-500/20">PENDIENTE</span>
                                  )}
                                </div>
                                <div className="text-[10px] text-textD font-mono">{s.Fecha} · {s.Producto || s['Tipo Trabajo']}</div>
                                <div className="flex items-center gap-4 mt-1.5 text-[10px] font-mono">
                                  <span className="text-cyber-cyan font-bold">{fmt(Number(s.Precio))}</span>
                                  <span className="text-emerald-400">Pagado: {fmt(paid)}</span>
                                  {balance > 0.1 ? (
                                    <span className="text-red-400 font-bold bg-red-500/10 px-1.5 py-0.5 rounded">Saldo: {fmt(balance)}</span>
                                  ) : (
                                    <span className="text-green-500">✓ Cancelado</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Contact Actions */}
                <div className="border border-cyber-purple/20 bg-cyber-panel rounded-xl overflow-hidden shadow-2xl relative before:absolute before:inset-x-0 before:top-0 before:h-[1px] before:bg-gradient-to-r before:from-emerald-400 before:via-cyber-cyan before:to-cyber-purple">
                  <div className="bg-gradient-to-r from-emerald-500/5 via-cyber-cyan/5 to-cyber-purple/5 border-b border-cyber-purple/20 px-5 py-3">
                    <h4 className="font-orbitron font-bold text-[10px] text-cyber-cyan tracking-wider uppercase flex items-center gap-2">
                      <Send className="w-3.5 h-3.5 text-emerald-400" />
                      CANALES DE CONTACTO
                    </h4>
                  </div>
                  <div className="p-5">
                    <div className="grid grid-cols-2 gap-4">
                      <a href={generateWhatsAppLink(selectedClientDetail)} target="_blank" rel="noreferrer"
                        className="group bg-gradient-to-br from-[#0F5F2F] to-[#0A4A22] hover:from-green-600 hover:to-emerald-700 border border-green-500/30 rounded-xl p-4 text-center transition-all hover:scale-[1.01] hover:shadow-[0_0_20px_rgba(16,185,129,0.2)] cursor-pointer">
                        <Phone className="w-6 h-6 text-green-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                        <div className="text-[10px] font-bold text-green-400 uppercase tracking-wider">Enviar WhatsApp</div>
                        <div className="text-[8px] text-green-500/60 mt-0.5">Mensaje directo al cliente</div>
                      </a>
                      <a href={selectedClientDetail.Email ? `mailto:${selectedClientDetail.Email}?subject=${encodeURIComponent('Estado de Cuenta - EL Patron HN')}&body=${encodeURIComponent(`Estimado representante de ${selectedClientDetail.Nombre},\n\nLe saludamos cordialmente de EL Patron HN para notificarle de su estado de cuenta corriente pendiente.\n\nAgradecemos realizar sus transferencias a las cuentas de EL Patron HN.\n\nAtentamente, Departamento de Cobranza.`)}` : '#'}
                        className={`group bg-gradient-to-br from-cyber-purple/30 to-indigo-600/20 hover:from-cyber-purple hover:to-indigo-700 border border-cyber-purple/30 rounded-xl p-4 text-center transition-all hover:scale-[1.01] hover:shadow-[0_0_20px_rgba(138,43,226,0.2)] cursor-pointer ${!selectedClientDetail.Email ? 'opacity-40 pointer-events-none' : ''}`}>
                        <Mail className={`w-6 h-6 mx-auto mb-2 ${selectedClientDetail.Email ? 'text-cyber-cyan group-hover:scale-110 transition-transform' : 'text-textD'}`} />
                        <div className="text-[10px] font-bold text-cyber-cyan uppercase tracking-wider">Enviar Correo</div>
                        <div className="text-[8px] text-cyber-purple/60 mt-0.5">Notificación por email</div>
                      </a>
                    </div>
                    {selectedClientDetail.Observaciones && (
                      <div className="mt-5 p-4 border border-cyber-purple/10 bg-gradient-to-r from-cyber-purple/5 to-transparent rounded-xl font-sans text-textD leading-relaxed text-[10px] relative overflow-hidden before:absolute before:inset-y-0 before:left-0 before:w-[2px] before:bg-gradient-to-b before:from-cyber-cyan before:to-cyber-purple">
                        <span className="font-bold text-cyber-cyan block mb-1 text-[10px] uppercase tracking-wider">📋 Notas del socio:</span>
                        {selectedClientDetail.Observaciones}
                      </div>
                    )}
                    <div className="mt-4 flex items-center gap-4 text-[9px] text-textD font-mono">
                      <span>LTV: <span className="text-green-400 font-bold">{fmt(selectedClientDetail.LTV)}</span></span>
                      <span>RFM: <span className="text-cyber-cyan font-bold">{selectedClientDetail['RFM Score'] || 0}/10</span></span>
                      <span>Registro: <span className="text-text">{selectedClientDetail['Fecha Registro']}</span></span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border border-cyber-purple/20 bg-cyber-panel rounded-xl overflow-hidden shadow-2xl h-full flex items-center justify-center relative before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:bg-gradient-to-r before:from-cyber-cyan before:via-cyber-purple before:to-cyber-pink">
                <div className="text-center p-8">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyber-purple/20 to-indigo-600/20 flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-cyber-purple/50" />
                  </div>
                  <p className="text-textD text-xs">Seleccione un socio de la lista para ver su información.</p>
                  <p className="text-textD/50 text-[10px] mt-1">Panel de gestión de socios · EL PATRON HN</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── INTERACTIONS LIST TAB ── */}
      {activeTab === 'interactions' && (
        <div className="panel border border-cyber-purple/20 bg-cyber-panel rounded-xl overflow-hidden shadow-2xl">
          <div className="panelBody p-0">
            <div className="tableWrap overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-cyber-purple/15 text-cyber-cyan font-orbitron text-[9px] tracking-wider border-b border-cyber-purple/20">
                    <th className="px-5 py-3">CÓDIGO</th>
                    <th className="px-5 py-3">SOCIO ADQUIRIDO</th>
                    <th className="px-5 py-3">FECHA CORTE</th>
                    <th className="px-5 py-3 text-center">VÍA CONTACTO</th>
                    <th className="px-5 py-3">RESULTADO OBTENIDO</th>
                    <th className="px-5 py-3">OBSERVACIONES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyber-purple/10 font-mono text-xs">
                  {filteredInts.map((i) => (
                    <tr className="hover-item-comfort text-text" key={i.ID}>
                      <td className="px-5 py-4 text-cyber-cyan font-bold">{i.ID}</td>
                      <td className="px-5 py-4 font-bold">{i.Cliente}</td>
                      <td className="px-5 py-4 text-textD">{i.Fecha}</td>
                      <td className="px-5 py-4 text-center">
                        <span className="badge bg-cyber-purple/10 text-cyber-cyan border border-cyber-purple/35 px-2.5 py-0.5 rounded text-[10px]">
                          {i.Tipo}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-bold text-yellow-400">{i.Resultado}</td>
                      <td className="px-5 py-4 text-textD text-xs leading-relaxed max-w-xs truncate">{i.Observaciones || '—'}</td>
                    </tr>
                  ))}
                  {filteredInts.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center p-8 text-textD">No se registraron interacciones históricas.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── REMINDERS / DEBTS TAB ── */}
      {activeTab === 'reminders' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pending actions */}
            <div className="panel border border-yellow-500/20 bg-cyber-panel rounded-xl overflow-hidden shadow-2xl">
              <div className="panelHeader bg-yellow-500/5 border-b border-yellow-500/20 px-5 py-4">
                <h4 className="font-orbitron font-bold text-xs text-yellow-400 tracking-wider uppercase">⏳ ACCIONES DE COBRANZA PENDIENTES</h4>
              </div>
              <div className="panelBody p-4 divide-y divide-cyber-purple/10">
                {filteredReminders.filter(r => r.Completado !== 'TRUE').length ? (
                  filteredReminders.filter(r => r.Completado !== 'TRUE').map(r => (
                    <div className="py-3 flex justify-between items-start gap-4 font-mono text-xs" key={r.ID}>
                      <div>
                        <div className="font-bold text-text mb-0.5">{r.Cliente}</div>
                        <div className="text-textD leading-relaxed text-xs mb-1">{r.Descripción}</div>
                        <div className="text-[10px] text-textD">Vierte: {r.Fecha} · <span className={r.Prioridad === 'Alta' ? 'text-red-400' : 'text-yellow-400'}>Prioridad {r.Prioridad}</span></div>
                      </div>
                      <div className="flex gap-1.5 shrink-0 align-middle mt-1.5">
                        {/* Instant WhatsApp reminder */}
                        <a
                          href={`https://wa.me/${(clients.find(c => c.Nombre === r.Cliente)?.Teléfono || '').replace(/\D/g, '')}?text=${encodeURIComponent(`Estimado ${r.Cliente}, le saludamos de EL Patron HN para recordarle amablemente de su saldo: "${r.Descripción}". Quedamos atentos.`)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-1 bg-green-600/20 text-green-400 hover:bg-green-600 hover:text-white border border-green-500/30 text-[10px] font-bold rounded hover:scale-[1.05] transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Phone className="w-3 h-3" /> WA
                        </a>
                        <button
                          onClick={() => onCompleteReminder(r.ID)}
                          className="bg-sky-600/20 text-sky-400 hover:bg-sky-600 hover:text-white border border-sky-500/30 px-2 py-1 text-[10px] font-bold rounded cursor-pointer transition-all"
                        >
                          ✓ COMPLETAR
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-green-400 font-mono text-xs">
                    🌌 No se encontraron alertas o pendientes para cobrar o alertar.
                  </div>
                )}
              </div>
            </div>

            {/* Resolved records */}
            <div className="panel border border-cyber-purple/20 bg-cyber-panel rounded-xl overflow-hidden shadow-2xl">
              <div className="panelHeader bg-cyber-purple/5 border-b border-cyber-purple/20 px-5 py-4">
                <h4 className="font-orbitron font-bold text-xs text-green-400 tracking-wider uppercase">✅ CONTROLADOS DE COBROS REALIZADOS</h4>
              </div>
              <div className="panelBody p-4 divide-y divide-cyber-purple/10">
                {filteredReminders.filter(r => r.Completado === 'TRUE').map(r => (
                  <div className="py-3 font-mono text-xs opacity-60" key={r.ID}>
                    <div className="font-bold text-textD text-xs line-through">{r.Cliente}</div>
                    <div className="text-textD leading-relaxed text-[11px] line-through">{r.Descripción}</div>
                    <div className="text-[9px] text-green-400 mt-1">Saneador registrado y liquidado con éxito ✓</div>
                  </div>
                ))}
                {filteredReminders.filter(r => r.Completado === 'TRUE').length === 0 && (
                  <div className="py-8 text-center text-textD">Ningún recordatorio marcado como resuelto hoy.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── NEW MARKETING CAMPAIGNS TAB ── */}
      {activeTab === 'campaigns' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Campaign Form Panel */}
          <div className="panel border border-cyber-purple/30 bg-cyber-panel rounded-xl p-5 lg:col-span-1 space-y-4">
            <div className="border-b border-cyber-purple/20 pb-3 mb-2">
              <h4 className="font-orbitron font-bold text-xs text-cyber-cyan tracking-wider uppercase">📊 CONFIGURAR NUEVA CAMPANA DE DIFUSION</h4>
              <p className="text-[10px] text-textD mt-1">Envíe notificaciones masivas de mercadeo o cobranza a sus contactos</p>
            </div>

            <div className="field text-xs">
              <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1.5">1. Segmento de Destinatarios</label>
              <select value={campTarget} onChange={(e: any) => setCampTarget(e.target.value)} className="w-full bg-cyber-purple/10 border border-cyber-purple/30 rounded p-2.5 text-text">
                <option value="Todos">Todos los clientes registrados ({clients.length})</option>
                <option value="VIP">Miembros VIP de EL Patron HN ({clients.filter(c => c.Clasificación === 'VIP').length})</option>
                <option value="Frecuente">Clientes Frecuentes ({clients.filter(c => c.Clasificación === 'Frecuente').length})</option>
                <option value="Deudor">Clientes Reportados en Mora / Deudores ({clients.filter(c => c.Clasificación === 'Deudor').length})</option>
                <option value="Nuevo">Socio Nuevos del Mes ({clients.filter(c => c.Clasificación === 'Nuevo').length})</option>
              </select>
            </div>

            <div className="field text-xs">
              <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1.5">2. Canal de Difusión Principal</label>
              <select value={campCanal} onChange={(e: any) => setCampCanal(e.target.value)} className="w-full bg-cyber-purple/10 border border-cyber-purple/30 rounded p-2.5 text-text">
                <option value="WhatsApp">📱 Mensajes de WhatsApp (wa.me API Honduras)</option>
                <option value="Email">✉️ Correo Electrónico Corporativo PDF</option>
                <option value="Ambos">🔄 Multicanal (WhatsApp + Correo Simultáneo)</option>
              </select>
            </div>

            <div className="field text-xs">
              <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1.5">3. Escoger Plantilla Base</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleTemplateChange('promocion')}
                  className={`flex-1 py-1.5 px-1 text-[10px] font-bold rounded border ${campPlantilla === 'promocion' ? 'bg-cyber-cyan/15 border-cyber-cyan text-cyber-cyan' : 'bg-transparent border-cyber-purple/20 text-textD hover:text-text'}`}
                >
                  PROMO %
                </button>
                <button
                  type="button"
                  onClick={() => handleTemplateChange('cobranza')}
                  className={`flex-1 py-1.5 px-1 text-[10px] font-bold rounded border ${campPlantilla === 'cobranza' ? 'bg-cyber-pink/15 border-cyber-pink text-cyber-pink' : 'bg-transparent border-cyber-purple/20 text-textD hover:text-text'}`}
                >
                  COBRANZA
                </button>
                <button
                  type="button"
                  onClick={() => handleTemplateChange('agradecimiento')}
                  className={`flex-1 py-1.5 px-1 text-[10px] font-bold rounded border ${campPlantilla === 'agradecimiento' ? 'bg-yellow-500/15 border-yellow-500 text-yellow-400' : 'bg-transparent border-cyber-purple/20 text-textD hover:text-text'}`}
                >
                  AGRADECER
                </button>
              </div>
            </div>

            {campCanal !== 'WhatsApp' && (
              <div className="field text-xs font-mono">
                <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1.5">Asunto del Correo Electrónico</label>
                <input type="text" value={campAsunto} onChange={(e) => setCampAsunto(e.target.value)} className="w-full bg-cyber-purple/10 border border-cyber-purple/30 rounded p-2 text-text font-mono" />
              </div>
            )}

            <div className="field text-xs font-sans">
              <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1.5">
                4. Redactar Mensaje Dinámico 
                <span className="text-textD block text-[9px] lowercase normal-case">Use {`{Nombre}`} para insertar el nombre del cliente</span>
              </label>
              <textarea
                value={campMensajeCustom}
                onChange={(e) => setCampMensajeCustom(e.target.value)}
                className="w-full bg-cyber-purple/10 border border-cyber-purple/30 p-2.5 rounded text-xs font-mono"
                style={{ minHeight: '110px' }}
              />
            </div>

            <button
              onClick={handleLaunchCampaignSimulator}
              disabled={isSendingCampCode}
              className="w-full btn bg-gradient-to-r from-cyber-purple to-cyber-pink hover:to-indigo-600 text-white font-orbitron font-bold text-xs tracking-widest py-3.5 rounded-lg hover:shadow-[0_0_15px_rgba(255,0,255,0.4)] transition-all cursor-pointer disabled:opacity-40 uppercase"
            >
              {isSendingCampCode ? '📡 EJECUTANDO CAMPAÑA...' : '🚀 DISPARAR CAMPAÑA MASIVA'}
            </button>
          </div>

          {/* Progress Logs & Interactive Simulation Results */}
          <div className="panel border border-cyber-purple/30 bg-cyber-panel rounded-xl p-5 lg:col-span-2 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="border-b border-cyber-purple/20 pb-3 flex items-center justify-between">
                <div>
                  <h4 className="font-orbitron font-bold text-xs text-cyber-cyan tracking-wider uppercase">🖥️ MONITOR DE SATELLITE & LOG DE SALIDA</h4>
                  <p className="text-[10px] text-textD mt-0.5">Reportes en tiempo real del motor de telecomunicaciones</p>
                </div>
                <span className="text-[10px] font-mono text-cyber-pink px-2.5 py-0.5 bg-cyber-pink/10 border border-cyber-pink/20 rounded-full animate-pulse">PATRON HN SENDER</span>
              </div>

              {/* Progress bar container */}
              {campTotalProgress > 0 && (
                <div className="bg-cyber-bg2 border border-cyber-purple/20 rounded p-4 font-mono text-xs space-y-2">
                  <div className="flex justify-between text-[11px] font-bold text-cyber-cyan">
                    <span>Progreso del Disparo Masivo:</span>
                    <span>{campIndexProgress} / {campTotalProgress} Procesados ({Math.round((campIndexProgress/campTotalProgress)*100)}%)</span>
                  </div>
                  <div className="w-full bg-cyber-bg border border-cyber-purple/10 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-cyber-cyan to-cyber-pink h-full transition-all duration-300"
                      style={{ width: `${(campIndexProgress / campTotalProgress) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Logs area */}
              <div className="bg-cyber-bg2/55 border border-cyber-purple/15 rounded-lg p-4 font-mono text-[11px] leading-relaxed overflow-y-auto max-h-80 h-80 space-y-2 text-textD shadow-inner">
                {campLogs.length ? (
                  campLogs.map((log, i) => (
                    <div className="border-b border-cyber-purple/5 pb-1" key={i}>
                      <span className="text-cyber-cyan mr-1.5">[{new Date().toLocaleTimeString('es-HN')}]</span>
                      <span className={log.includes('FIN') ? 'text-green-400 font-bold' : log.includes('📱') ? 'text-[#E0E0FF]' : 'text-yellow-400'}>{log}</span>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex flex-col justify-center items-center text-center space-y-2 opacity-50 p-6">
                    <Send className="w-8 h-8 text-cyber-purple" />
                    <div>Pronto para lanzar difusión...</div>
                    <div className="text-[10px] max-w-xs leading-normal">Seleccione los filtros a la izquierda y presione "Disparar Campaña Masiva" para probar el motor de envío.</div>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-cyber-purple/15 text-[10px] font-mono text-textD flex items-center justify-between">
              <span>* Servicios de mensajería configurados bajo estándar internacional para EL Patron HN.</span>
              <span>ESTADO: LISTO</span>
            </div>
          </div>
        </div>
      )}

      {/* ── CLIENT FORM MODAL ── */}
      {showAddClient && (
        <div className="modal-overlay open">
          <div className="modal w-full max-w-md">
            <div className="modalHeader">
              <h3 className="font-orbitron text-xs font-bold text-cyber-cyan tracking-wider uppercase">{editingClient ? `EDITAR: ${editingClient.Nombre}` : 'CRM: NUEVO CLIENTE RESIDENTE'}</h3>
                <button onClick={() => { setShowAddClient(false); setEditingClient(null); }} className="text-textD hover:text-red-400 text-lg cursor-pointer bg-none border-none">✕</button>
            </div>
            <form onSubmit={handleSubmitClient}>
              <div className="modalBody p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="field text-xs">
                    <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1">Nombre o Razón Social *</label>
                    <input type="text" placeholder="Corporación Sula..." value={cliNombre} onChange={(e) => setCliNombre(e.target.value)} className="w-full p-2.5 rounded" required />
                  </div>
                  <div className="field text-xs">
                    <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1">Celular / Teléfono</label>
                    <input type="text" placeholder="+504 9481-2233" value={cliTel} onChange={(e) => setCliTel(e.target.value)} className="w-full p-2.5 rounded" />
                  </div>
                </div>

                <div className="field text-xs">
                  <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1">RTN (Registro Tributario Nacional)</label>
                  <input type="text" placeholder="08019000123456" value={cliRtn} onChange={(e) => setCliRtn(e.target.value)} className="w-full p-2.5 rounded font-mono" maxLength={14} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="field text-xs">
                    <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1">Departamento (Honduras)</label>
                    <select value={cliDepto} onChange={(e) => setCliDepto(e.target.value)} className="w-full p-2.5 rounded">
                      {DEPARTAMENTOS_HN.map(d => (
                        <option value={d} key={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div className="field text-xs font-mono">
                    <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1">Ciudad *</label>
                    <input type="text" placeholder="San Pedro Sula / Tegucigalpa" value={cliCiudad} onChange={(e) => setCliCiudad(e.target.value)} className="w-full p-2.5 rounded font-mono" required />
                  </div>
                </div>

                <div className="field text-xs font-mono">
                  <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1">Correo Electrónico (Remisiones PDF)</label>
                  <input type="email" placeholder="correo@empresa.com" value={cliEmail} onChange={(e) => setCliEmail(e.target.value)} className="w-full p-2.5 rounded font-mono" />
                </div>

                <div className="field text-xs">
                  <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1">Nivel de Clasificación</label>
                  <select value={cliClasificacion} onChange={(e: any) => setCliClasificacion(e.target.value)} className="w-full p-2.5 rounded">
                    <option value="Nuevo">Socio Nuevo</option>
                    <option value="Frecuente">Comprador Frecuente</option>
                    <option value="VIP">Miembro Premium VIP 🏆</option>
                    <option value="Deudor">Reporte de Deudor Moroso / Deuda</option>
                  </select>
                </div>

                <div className="field text-xs font-sans">
                  <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1">Condición Tributaria / Notas</label>
                  <textarea value={cliObs} onChange={(e) => setCliObs(e.target.value)} className="w-full p-2.5 rounded" style={{ minHeight: '62px' }} />
                </div>
              </div>
              <div className="modalFooter">
                <button type="button" onClick={() => { setShowAddClient(false); setEditingClient(null); }} className="px-5 py-2.5 border border-cyber-purple/20 rounded hover:bg-cyber-purple/15 text-text hover-item-comfort cursor-pointer">CANCELAR</button>
                <button type="submit" className="px-6 py-2.5 bg-gradient-to-r from-cyber-purple to-indigo-600 text-white font-orbitron font-bold rounded shadow-[0_0_12px_rgba(138,43,226,0.6)] cursor-pointer hover:scale-[1.01] transition-all">{editingClient ? '✓ ACTUALIZAR SOCIO' : '+ REGISTRAR SOCIO'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── INTERACTION FORM MODAL ── */}
      {showAddInt && (
        <div className="modal-overlay open">
          <div className="modal w-full max-w-sm">
            <div className="modalHeader border-b border-cyber-cyan/25 pb-4">
              <h3 className="font-orbitron text-xs font-bold text-cyber-cyan tracking-wider uppercase">CRM: LOG DE COMPROMISOS</h3>
              <button onClick={() => setShowAddInt(false)} className="text-textD hover:text-red-400 text-lg cursor-pointer bg-none border-none">✕</button>
            </div>
            <form onSubmit={handleAddIntSubmit}>
              <div className="modalBody p-5 space-y-4 text-xs font-sans">
                <div className="field">
                  <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1">Asignar Cliente Relativo *</label>
                  <select value={intClient} onChange={(e) => setIntClient(e.target.value)} className="w-full rounded p-2.5" required>
                    <option value="">— Elegir Socio —</option>
                    {clients.map(c => (
                      <option value={c.ID} key={c.ID}>{c.Nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="field">
                    <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1">Vía de Contacto</label>
                    <select value={intTipo} onChange={(e: any) => setIntTipo(e.target.value)} className="w-full rounded p-2.5">
                      <option value="Llamada">Llamada de voz</option>
                      <option value="WhatsApp">Soporte WhatsApp</option>
                      <option value="Email">Correo Electrónico</option>
                      <option value="Visita">Visita Comercial</option>
                    </select>
                  </div>
                  <div className="field">
                    <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1">Resultado de la Acción *</label>
                    <input type="text" placeholder="Ej: Aceptó montos" value={intResultado} onChange={(e) => setIntResultado(e.target.value)} className="w-full rounded p-2.5 font-bold" required />
                  </div>
                </div>
                <div className="field">
                  <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1 font-sans">Próximos Pasos / Observaciones</label>
                  <textarea value={intObs} onChange={(e) => setIntObs(e.target.value)} className="w-full p-2.5 rounded" style={{ minHeight: '62px' }} />
                </div>
              </div>
              <div className="modalFooter border-t border-cyber-cyan/15 pt-4">
                <button type="button" onClick={() => setShowAddInt(false)} className="px-4 py-2 border border-cyber-cyan/25 rounded hover:bg-cyber-cyan/10 text-text cursor-pointer transition-all">CANCELAR</button>
                <button type="submit" className="px-5 py-2 bg-cyan-700 hover:bg-cyber-cyan text-white hover:text-cyber-bg font-bold font-orbitron rounded shadow-[0_0_8px_rgba(0,255,255,0.4)] cursor-pointer transition-all">GUARDAR LOG</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── REMINDER FORM MODAL ── */}
      {showAddRem && (
        <div className="modal-overlay open">
          <div className="modal w-full max-w-sm">
            <div className="modalHeader border-b border-cyber-purple/20 pb-4">
              <h3 className="font-orbitron text-xs font-bold text-cyber-pink tracking-wider uppercase">CRM: REGISTRAR ALERTA DE COBRO</h3>
              <button onClick={() => setShowAddRem(false)} className="text-textD hover:text-red-400 text-lg cursor-pointer bg-none border-none">✕</button>
            </div>
            <form onSubmit={handleAddRemSubmit}>
              <div className="modalBody p-5 space-y-4 text-xs font-sans">
                <div className="field">
                  <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1">Elegir Cliente Moroso *</label>
                  <select value={remClient} onChange={(e) => setRemClient(e.target.value)} className="w-full p-2.5 rounded" required>
                    <option value="">— Elegir Socio —</option>
                    {clients.map(c => (
                      <option value={c.ID} key={c.ID}>{c.Nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="field">
                    <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1">Fecha Límite Pago *</label>
                    <input type="date" value={remFecha} onChange={(e) => setRemFecha(e.target.value)} className="w-full p-2 rounded" required />
                  </div>
                  <div className="field">
                    <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1">Prioridad Alerta</label>
                    <select value={remPrio} onChange={(e: any) => setRemPrio(e.target.value)} className="w-full p-2 rounded">
                      <option value="Baja">Baja</option>
                      <option value="Media">Media</option>
                      <option value="Alta">Alta Morosidad ⚠️</option>
                    </select>
                  </div>
                </div>
                <div className="field">
                  <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1">Acción / Saldo Pendiente *</label>
                  <input type="text" placeholder="Monto o factura adeudada..." value={remDesc} onChange={(e) => setRemDesc(e.target.value)} className="w-full p-2.5 rounded" required />
                </div>
              </div>
              <div className="modalFooter">
                <button type="button" onClick={() => setShowAddRem(false)} className="px-4 py-2 border rounded hover:bg-cyber-purple/10 text-text cursor-pointer">CANCELAR</button>
                <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-cyber-purple to-indigo-600 text-white font-bold font-orbitron rounded shadow-[0_0_8px_rgba(138,43,226,0.4)] cursor-pointer hover:scale-[1.01] transition-all">+ REGISTRAR ALERTA</button>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* ── HISTORIAL TAB ── */}
      {activeTab === 'history' && (
        <ClientHistoryInner clients={clients} sales={sales} payments={payments} />
      )}
    </div>
  );
}
