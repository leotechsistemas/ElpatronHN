import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  FileText, Plus, Search, CheckCircle, ArrowRight, Trash2, UserPlus, 
  Download, Calendar, Briefcase, Mail, Phone, DollarSign, Clock, MapPin,
  Archive, Wrench, Eye
} from 'lucide-react';
import { Quotation, Client, User, QuotationItem, Product, ServiceType } from '../types';
import { api } from '../services/api';
import { jsPDF } from 'jspdf';
import QuickClientModal from './QuickClientModal';

interface QuotationsViewProps {
  clients: Client[];
  products?: Product[];
  currentUser: User | null;
  onAddQuotation: (quoteData: any) => Promise<boolean> | boolean;
  onConvertQuotationToSale: (quote: Quotation, pagoInicial?: number, metodoPago?: string) => void;
  onAddQuickClient: (clientData: any) => Promise<any> | any;
  onUpdateClient?: (clientId: string, clientData: any) => Promise<boolean>;
  prefillClientId?: string;
  serviceTypes: ServiceType[];
  onDeleteQuotation?: (quoteId: string) => void;
}

export default function QuotationsView({
  clients,
  products = [],
  currentUser,
  onAddQuotation,
  onConvertQuotationToSale,
  onAddQuickClient,
  onUpdateClient,
  prefillClientId,
  serviceTypes,
  onDeleteQuotation
}: QuotationsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [quotes, setQuotes] = useState<Quotation[]>([]);
  const [activeFilter, setActiveFilter] = useState<'pendiente' | 'convertido' | 'vencida'>('pendiente');
  const [isLoadingQuotes, setIsLoadingQuotes] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const [allQuotes, setAllQuotes] = useState<Quotation[]>([]);
  const [filterClientId, setFilterClientId] = useState('');

  const fetchQuotes = useCallback(async (filter: string) => {
    setIsLoadingQuotes(true);
    try {
      const res = await api.getQuotations(filter, 0, 100);
      const mapped = ((res as any).content || []).map(mapApiQuotation);
      setQuotes(mapped);
    } catch {
      setQuotes([]);
    }
    setIsLoadingQuotes(false);
  }, []);

  // Fetch all statuses for KPI metrics (once on mount)
  useEffect(() => {
    Promise.all([
      api.getQuotations('pendiente', 0, 200),
      api.getQuotations('convertido', 0, 200),
      api.getQuotations('vencida', 0, 200)
    ]).then(([pen, conv, ven]) => {
      const all = [
        ...((pen as any).content || []),
        ...((conv as any).content || []),
        ...((ven as any).content || [])
      ].map(mapApiQuotation);
      setAllQuotes(all);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    fetchQuotes(activeFilter);
  }, [activeFilter, fetchQuotes]);

  const filteredQuotes = quotes.filter(q => {
    const matchesSearch = 
      q.ID.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.Cliente.toLowerCase().includes(searchTerm.toLowerCase());
    if (filterClientId && q['Cliente ID'] !== filterClientId) return false;
    return matchesSearch;
  });

  const totalQuotes = allQuotes.length;
  const pendingCount = allQuotes.filter(q => q.Estado === 'Pendiente').length;
  const convertedCount = allQuotes.filter(q => q.Estado === 'Convertido').length;
  const expiredCount = allQuotes.filter(q => q.Estado === 'Vencida').length;

  const mapApiQuotation = (q: any): Quotation => ({
    ID: q.id, Fecha: q.fecha, 'Fecha Expiracion': q.fecha_expiracion || '',
    'Cliente ID': q.cliente_id, Cliente: q.cliente, RTN: q.rtn || '',
    ConRTN: q.con_rtn !== false, Items: q.items, PrecioTotal: q.precio_total,
    Descuento: q.descuento || 0, ISV: q.isv ?? 15, Estado: q.estado,
    Observaciones: q.observaciones || '', 'Vendedor ID': q.vendedor_id || ''
  });

  // Conversion configuration modal states
  const [conversionQuote, setConversionQuote] = useState<Quotation | null>(null);
  const [conversionMonto, setConversionMonto] = useState<string>('0');
  const [conversionMetodo, setConversionMetodo] = useState<'Efectivo' | 'Tarjeta' | 'Transferencia' | ''>('Efectivo');

  const [isQuoteDetailOpen, setIsQuoteDetailOpen] = useState(false);
  const [quoteDetail, setQuoteDetail] = useState<Quotation | null>(null);
  const quotePrintRef = useRef<HTMLDivElement>(null);

  // New Quotation modal
  const [isOpenForm, setIsOpenForm] = useState(false);
  const [selectedClient, setSelectedClient] = useState('');

  // Reset RTN when client changes
  useEffect(() => {
    const c = clients.find(cl => cl.ID === selectedClient);
    setRtnCliente(c?.RTN || '');
    setIsEditingRtn(false);
  }, [selectedClient]);

  const [items, setItems] = useState<QuotationItem[]>([]);
  const [observaciones, setObservaciones] = useState('');
  const [descuentoPct, setDescuentoPct] = useState(0);
  const [aplicarISV, setAplicarISV] = useState(true);

  // Product quick-add states
  const [productoSeleccionado, setProductoSeleccionado] = useState('');
  const [cantidadProducto, setCantidadProducto] = useState(1);
  const [precioProducto, setPrecioProducto] = useState(0);

  // Auto-open form with pre-selected client from CRM
  useEffect(() => {
    if (prefillClientId && clients.some(c => c.ID === prefillClientId)) {
      setSelectedClient(prefillClientId);
      setIsOpenForm(true);
    }
  }, [prefillClientId, clients]);

  // Secondary modal for configuring individual work detail
  const [isOpenJobModal, setIsOpenJobModal] = useState(false);
  const [jobProductId, setJobProductId] = useState('');
  const [jobProductName, setJobProductName] = useState('');
  const [jobTipoTrabajo, setJobTipoTrabajo] = useState('Personalizado');
  const [jobPrecio, setJobPrecio] = useState('');
  const [jobDescripcion, setJobDescripcion] = useState('');

  // Auxiliary quick client form inside modal
  const [isOpenClientModal, setIsOpenClientModal] = useState(false);
  const [jobCategoria, setJobCategoria] = useState<string>('');
  const [jobServiceId, setJobServiceId] = useState<string>('');
  const [quickNombre, setQuickNombre] = useState('');
  const [quickTelefono, setQuickTelefono] = useState('');
  const [quickEmail, setQuickEmail] = useState('');
  const [quickDept, setQuickDept] = useState('Cortes');
  const [quickCiudad, setQuickCiudad] = useState('');
  const [quickRtn, setQuickRtn] = useState('');
  const [conRtn, setConRtn] = useState(true);
  const [rtnCliente, setRtnCliente] = useState('');
  const [isEditingRtn, setIsEditingRtn] = useState(false);
  const rtnOriginalRef = useRef('');

  const hondurasDeptos = [
    'Cortes', 'Francisco Morazan', 'Atlantida', 'Yoro', 'Olancho', 'Colon',
    'Gracias a Dios', 'El Paraiso', 'Choluteca', 'Valle', 'La Paz', 'Intibuca',
    'Lempira', 'Ocotepeque', 'Copan', 'Santa Barbara', 'Comayagua', 'Islas de la Bahia'
  ];

  const handleOpenJobModal = () => {
    setJobProductId('');
    setJobProductName('');
    setJobTipoTrabajo(serviceTypes.length > 0 ? serviceTypes[0].nombre : 'Corte Láser');
    setJobPrecio('');
    setJobDescripcion('');
    setJobCategoria(serviceTypes.length > 0 ? serviceTypes[0].nombre : 'Corte Láser');
    setJobServiceId(serviceTypes.length > 0 ? serviceTypes[0].id : '');
    setIsOpenJobModal(true);
  };

  const handleAddProductToQuote = () => {
    if (!productoSeleccionado) return;
    const prod = products.find(p => p.ID === productoSeleccionado);
    if (!prod) return;
    const precio = precioProducto > 0 ? precioProducto : prod['Precio Venta'];
    const cant = cantidadProducto || 1;
    const newItem: QuotationItem = {
      tipoTrabajo: 'Producto - ' + prod.Nombre,
      precio: precio * cant,
      productId: prod.ID,
      productName: prod.Nombre,
      cantidad: cant,
      descripcion: prod.Nombre,
    };
    setItems([...items, newItem]);
    setProductoSeleccionado('');
    setCantidadProducto(1);
    setPrecioProducto(0);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.precio || 0), 0);
  };

  const handleQuickClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickNombre.trim()) return;

    const newCl = await onAddQuickClient({
      nombre: quickNombre.trim(),
      telefono: quickTelefono.trim(),
      email: quickEmail.trim(),
      departamento: quickDept,
      ciudad: quickCiudad.trim() || 'S.P.S.',
      rtn: quickRtn.trim()
    });

    if (newCl) {
      setSelectedClient(newCl.ID);
      // Reset quick client form
      setQuickNombre('');
      setQuickTelefono('');
      setQuickEmail('');
      setQuickCiudad('');
      setQuickRtn('');
      setIsOpenClientModal(false);
    }
  };

  const handleConfirmRtn = async () => {
    if (rtnCliente && selectedClient && onUpdateClient) {
      await onUpdateClient(selectedClient, { rtn: rtnCliente });
    }
    setIsEditingRtn(false);
  };

  const handleCancelRtn = () => {
    setRtnCliente(rtnOriginalRef.current);
    setIsEditingRtn(false);
  };

  const handleSaveQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) {
      alert('Favor seleccione un cliente');
      return;
    }

    const filteredItems = items.filter(item => item.tipoTrabajo.trim() !== '');
    if (filteredItems.length === 0) {
      alert('Debe agregar al menos un producto o servicio');
      return;
    }

    const clientObj = clients.find(c => c.ID === selectedClient);
    if (!clientObj) return;

    const totalVal = filteredItems.reduce((acc, curr) => acc + curr.precio, 0);

    const isvRate = aplicarISV ? 15 : 0;
    const subtotalConDto = totalVal * (1 - descuentoPct / 100);
    const finalTotal = isvRate > 0 ? subtotalConDto * 1.15 : subtotalConDto;
    const clientRtn = rtnCliente || clientObj.RTN || '';

    // Save RTN to client record if newly provided
    if (rtnCliente && rtnCliente !== (clientObj.RTN || '') && onUpdateClient) {
      await onUpdateClient(selectedClient, { rtn: rtnCliente }).catch(() => {});
    }

    const success = await onAddQuotation({
      clienteId: selectedClient,
      clienteNombre: clientObj.Nombre,
      rtn: clientRtn,
      conRtn,
      items: filteredItems,
      precioTotal: finalTotal,
      descuento: descuentoPct,
      isv: isvRate,
      observaciones
    });

    if (success) {
      setIsOpenForm(false);
      setSelectedClient('');
      setItems([]);
      setObservaciones('');
      setDescuentoPct(0);
      setAplicarISV(true);
      setConRtn(true);
      setRtnCliente('');
      fetchQuotes(activeFilter);
    }
  };

  const fmtVal = (v: number) => 'L. ' + Number(v).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleDownloadQuotationPDF = (quote: Quotation) => {
    const doc = new jsPDF();
    const bgDark = [28, 25, 23] as const;
    const accent = [196, 150, 30] as const;
    const textDark = [40, 38, 36] as const;
    const textGray = [130, 130, 130] as const;
    const textLight = [180, 180, 180] as const;
    const rowEven = [250, 248, 242] as const;
    const white = [255, 255, 255] as const;
    const clientObj = clients.find(c => c.ID === quote['Cliente ID']) || {
      Nombre: quote.Cliente, Email: 'contacto@cliente.com', Teléfono: '+504 9900-1122', Departamento: 'Francisco Morazan'
    };

    let itemsList: QuotationItem[] = [];
    try { itemsList = JSON.parse(quote.Items); } catch (e) { itemsList = []; }

    // === HEADER BANNER ===
    doc.setFillColor(...bgDark); doc.rect(0, 0, 210, 42, 'F');
    doc.setFillColor(...accent); doc.rect(0, 40, 210, 2, 'F');
    doc.setTextColor(...white); doc.setFont('helvetica', 'bold'); doc.setFontSize(20);
    doc.text('EL PATRON HN', 14, 18);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...textLight);
    doc.text('Tecnologia de Personalizados · Grabado Laser · Impresion · Rotulacion', 14, 25);
    doc.setFontSize(9); doc.setTextColor(...accent);
    doc.text(`COTIZACION  ·  ${quote.ID}`, 14, 33);

    // === CLIENT & QUOTE INFO ===
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...textDark);
    doc.text('CLIENTE', 14, 58);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...textGray);
    doc.text(quote.Cliente, 14, 64);
    if (clientObj.Teléfono) doc.text(`Tel: ${clientObj.Teléfono}`, 14, 69);
    if (quote.RTN) doc.text(`RTN: ${quote.RTN}`, 14, 74);
    else doc.text(clientObj.Email || '—', 14, 74);

    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...textDark);
    doc.text('COTIZACION', 130, 58);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...textGray);
    doc.text(quote.ID, 130, 64);
    doc.text(`Fecha: ${quote.Fecha}`, 130, 69);
    doc.text(`Vence: ${quote['Fecha Expiracion'] || '—'}`, 130, 74);
    doc.text(`Asesor: ${currentUser?.Nombre || 'Control Ventas'}`, 130, 79);
    doc.text(`Estado: ${quote.Estado.toUpperCase()}`, 130, 84);

    doc.setDrawColor(220, 215, 205); doc.line(14, 92, 196, 92);

    // === ITEMS TABLE HEADER ===
    let curY = 100;
    doc.setFillColor(...bgDark); doc.rect(14, curY, 182, 8, 'F');
    doc.setTextColor(...white); doc.setFont('helvetica', 'bold'); doc.setFontSize(7);
    doc.text('ITEM', 18, curY + 5.5);
    doc.text('DESCRIPCION DEL TRABAJO', 35, curY + 5.5);
    doc.text('PRECIO (HNL)', 192, curY + 5.5, { align: 'right' });
    curY += 13;

    // === ITEMS ROWS ===
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...textDark);
    if (itemsList.length > 0) {
      itemsList.forEach((item, idx) => {
        if (idx % 2 === 1) { doc.setFillColor(...rowEven); doc.rect(14, curY - 4, 182, 10, 'F'); }
        doc.text(String(idx + 1).padStart(2, '0'), 18, curY);
        doc.text(item.tipoTrabajo, 35, curY);
        if (item.descripcion) {
          doc.setFontSize(6.5); doc.setTextColor(...textGray);
          doc.text(item.descripcion, 35, curY + 4);
          doc.setFontSize(8); doc.setTextColor(...textDark);
        }
        doc.setFont('helvetica', 'bold');
        doc.text(fmtVal(item.precio), 192, curY, { align: 'right' });
        doc.setFont('helvetica', 'normal');
        doc.setDrawColor(235, 230, 222); doc.line(14, curY + 4, 196, curY + 4);
        curY += item.descripcion ? 14 : 10;
      });
    } else {
      doc.text('Sin items registrados.', 18, curY);
      curY += 6;
    }
    curY += 6;

    // === TOTALS BOX ===
    const descPct = quote.Descuento || 0;
    const isvPct = quote.ISV || 0;
    const totalConIsv = quote.PrecioTotal;
    const subtotalSinIsv = isvPct > 0 ? totalConIsv / (1 + isvPct / 100) : totalConIsv;
    const rawTotal = descPct > 0 ? subtotalSinIsv / (1 - descPct / 100) : subtotalSinIsv;
    const boxX = 120, boxW = 76;
    const rows = 1 + (descPct > 0 ? 1 : 0) + (isvPct > 0 ? 1 : 0) + 1;
    const boxH = rows * 7 + 4;
    doc.setFillColor(250, 248, 242); doc.rect(boxX, curY, boxW, boxH, 'F');
    doc.setDrawColor(...accent); doc.rect(boxX, curY, boxW, boxH, 'S');
    let lineY = curY + 6;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...textGray);
    doc.text('Subtotal', boxX + 5, lineY); doc.text(fmtVal(rawTotal), boxX + boxW - 5, lineY, { align: 'right' }); lineY += 7;
    if (descPct > 0) {
      doc.text(`Descuento (${descPct}%)`, boxX + 5, lineY);
      doc.setTextColor(180, 60, 60);
      doc.text(`-${fmtVal(rawTotal - subtotalSinIsv)}`, boxX + boxW - 5, lineY, { align: 'right' });
      doc.setTextColor(...textGray); lineY += 7;
    }
    if (isvPct > 0) {
      doc.text(`ISV (${isvPct}%)`, boxX + 5, lineY);
      doc.text(fmtVal(totalConIsv - subtotalSinIsv), boxX + boxW - 5, lineY, { align: 'right' }); lineY += 7;
    }
    doc.setDrawColor(...accent); doc.line(boxX + 5, lineY - 1, boxX + boxW - 5, lineY - 1);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...bgDark);
    doc.text('TOTAL', boxX + 5, lineY + 1); doc.text(fmtVal(totalConIsv), boxX + boxW - 5, lineY + 1, { align: 'right' });
    curY += boxH + 10;

    // === OBSERVATIONS ===
    if (quote.Observaciones) {
      doc.setDrawColor(220, 215, 205); doc.line(14, curY, 196, curY); curY += 5;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...textDark);
      doc.text('Observaciones:', 14, curY); curY += 4;
      doc.setFont('helvetica', 'italic'); doc.setFontSize(7.5); doc.setTextColor(...textGray);
      const lines = doc.splitTextToSize(quote.Observaciones, 175);
      doc.text(lines, 14, curY);
      curY += lines.length * 4 + 8;
    }

    // === FOOTER ===
    curY = Math.max(curY, 240);
    doc.setDrawColor(200, 195, 185); doc.line(14, curY, 196, curY); curY += 4;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...textGray);
    doc.text('Cotizacion valida por 15 dias. Precios sujetos a cambio sin previo aviso.', 105, curY, { align: 'center' }); curY += 4;
    doc.text('EL PATRON HN · RTN: 08019015239084 · Col. Altiplano, San Pedro Sula · Tel: 9999-9999', 105, curY, { align: 'center' }); curY += 4;
    doc.text('Correo: info@elpatron.hn · Documento generado electronicamente', 105, curY, { align: 'center' }); curY += 8;

    // === SIGNATURE LINE ===
    doc.setDrawColor(190, 185, 175); doc.line(145, curY, 192, curY); curY += 4;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...textGray);
    doc.text('Firma o Sello de Aceptacion', 168, curY, { align: 'center' });

    doc.save(`PATRON_HN_Cotizacion_${quote.ID}.pdf`);
  };

  return (
    <div className="space-y-6">

      {/* Quote KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div onClick={() => setActiveFilter('pendiente')}
          className={`bg-cyber-panel border rounded-xl p-5 relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:bg-gradient-to-r before:from-cyber-cyan before:to-transparent cursor-pointer hover:brightness-110 transition-all ${activeFilter === 'pendiente' ? 'border-cyber-cyan ring-1 ring-cyber-cyan/50' : 'border-cyber-purple/30'}`}>
          <h5 className="text-[9px] text-textD tracking-wider uppercase mb-1.5">Pendientes</h5>
          <div className="text-lg font-bold text-yellow-400 font-orbitron">{pendingCount}</div>
        </div>
        <div onClick={() => setActiveFilter('convertido')}
          className={`bg-cyber-panel border rounded-xl p-5 relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:bg-gradient-to-r before:from-green-400 before:to-transparent cursor-pointer hover:brightness-110 transition-all ${activeFilter === 'convertido' ? 'border-green-400 ring-1 ring-green-400/50' : 'border-green-500/30'}`}>
          <h5 className="text-[9px] text-textD tracking-wider uppercase mb-1.5">Convertidas</h5>
          <div className="text-lg font-bold text-green-400 font-orbitron">{convertedCount}</div>
        </div>
        <div onClick={() => setActiveFilter('vencida')}
          className={`bg-cyber-panel border rounded-xl p-5 relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:bg-gradient-to-r before:from-red-500 before:to-transparent cursor-pointer hover:brightness-110 transition-all ${activeFilter === 'vencida' ? 'border-red-500 ring-1 ring-red-500/50' : 'border-red-500/30'}`}>
          <h5 className="text-[9px] text-textD tracking-wider uppercase mb-1.5">Vencidas</h5>
          <div className="text-lg font-bold text-red-400 font-orbitron">{expiredCount}</div>
        </div>
        <div className="bg-cyber-panel border border-cyber-purple/20 rounded-xl p-5 relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:bg-gradient-to-r before:from-cyber-purple before:to-transparent">
          <h5 className="text-[9px] text-textD tracking-wider uppercase mb-1.5">Total</h5>
          <div className="text-lg font-bold text-cyber-cyan font-orbitron">{totalQuotes}</div>
        </div>
      </div>

      {/* Search + Filters + New Quote Button */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex flex-1 gap-3 items-center w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <span className="absolute inset-y-0 left-3 flex items-center text-textD">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Buscar cotización o cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-cyber-purple/10 border border-cyber-purple/40 text-text text-sm rounded-lg outline-none focus:border-cyber-cyan font-mono"
            />
          </div>
          <select
            value={filterClientId}
            onChange={(e) => setFilterClientId(e.target.value)}
            className="bg-cyber-purple/10 border border-cyber-purple/40 text-text text-sm rounded-lg px-3 py-2.5 outline-none focus:border-cyber-cyan font-mono"
          >
            <option value="">Todos los clientes</option>
            {clients.map(c => (
              <option key={c.ID} value={c.ID}>{c.Nombre}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => {
            setItems([]);
            setSelectedClient('');
            setObservaciones('');
            setIsOpenForm(true);
          }}
          className="btn btn-primary bg-gradient-to-r from-cyber-purple to-cyber-cyan text-white hover:shadow-[0_0_15px_rgba(138,43,226,0.5)] px-5 py-3 text-xs font-bold font-orbitron rounded-lg transition-all flex items-center gap-2 cursor-pointer border-none self-end"
        >
          <Plus className="w-4 h-4" />
          HACER NUEVA COTIZACIÓN
        </button>
      </div>

      {/* Table grid view */}
      <div className="panel border border-cyber-purple/20 bg-cyber-panel rounded-xl overflow-hidden shadow-2xl">
        <div className="panelBody p-0">
          <div className="tableWrap overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-cyber-purple/15 text-cyber-cyan font-orbitron text-[9px] tracking-wider border-b border-cyber-purple/20">
                  <th className="px-5 py-3">ID PRESUPUESTO</th>
                  <th className="px-5 py-3">FECHA</th>
                  <th className="px-5 py-3">VENCE</th>
                  <th className="px-5 py-3">CLIENTE SOLICITANTE</th>
                  <th className="px-5 py-3">TRABAJOS INCLUIDOS</th>
                  <th className="px-5 py-3 text-right">IMPORTE BRUTO</th>
                  <th className="px-5 py-3 text-center">ESTADOS</th>
                  <th className="px-5 py-3 text-right">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyber-purple/10 font-mono text-xs">
                {filteredQuotes.length > 0 ? (
                  filteredQuotes.map((q) => {
                    let itemsCount = 0;
                    try {
                      itemsCount = JSON.parse(q.Items).length;
                    } catch (e) {
                      itemsCount = 1;
                    }

                    return (
                      <tr key={q.ID} className={`hover:bg-cyber-purple/5 transition-all text-text ${q.Estado === 'Vencida' ? 'opacity-50' : ''}`}>
                        <td className="px-5 py-4 text-cyber-cyan font-bold">{q.ID}</td>
                        <td className="px-5 py-4 text-textD">{q.Fecha}</td>
                        <td className="px-5 py-4">
                          {q['Fecha Expiracion'] ? (
                            <span className={`text-[10px] font-mono ${q.Estado === 'Vencida' ? 'text-red-400' : 'text-textD'}`}>
                              {q['Fecha Expiracion']}
                            </span>
                          ) : (
                            <span className="text-[10px] text-textD">—</span>
                          )}
                        </td>
                        <td className="px-5 py-4 font-bold">{q.Cliente}</td>
                        <td className="px-5 py-4">
                          <span className="badge bg-cyber-purple/10 border border-cyber-purple/20 text-cyber-purple px-2 py-0.5 rounded text-[10px] font-bold">
                            📦 {itemsCount} {itemsCount === 1 ? 'Trabajo' : 'Trabajos'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <span className="font-black text-cyan-400">{fmtVal(q.PrecioTotal)}</span>
                          {q.Descuento > 0 && <span className="block text-[9px] text-cyber-pink">(-{q.Descuento}% dto)</span>}
                          {q.ISV > 0 && <span className="block text-[9px] text-amber-400">+{q.ISV}% ISV</span>}
                        </td>
                        <td className="px-5 py-4 text-center">
                          {q.Estado === 'Convertido' ? (
                            <span className="badge bg-green-550/10 text-green-400 border border-green-550/30 px-2 py-0.5 rounded text-[10px] font-orbitron font-bold uppercase">
                              CONVERTIDO ✓
                            </span>
                          ) : q.Estado === 'Vencida' ? (
                            <span className="badge bg-red-950/30 text-red-400 border border-red-500/40 px-2 py-0.5 rounded text-[10px] font-orbitron font-bold uppercase">
                              VENCIDA ✕
                            </span>
                          ) : (
                            <span className="badge bg-yellow-550/10 text-yellow-400 border border-yellow-550/35 px-2 py-0.5 rounded text-[10px] font-orbitron font-bold uppercase animate-pulse">
                              PENDIENTE
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right flex items-center justify-end gap-2 text-xs">
                          <button
                            onClick={() => {
                              setQuoteDetail(q);
                              setIsQuoteDetailOpen(true);
                            }}
                            className="bg-cyber-purple/15 text-cyber-cyan border border-cyber-purple/40 hover:bg-cyber-cyan/15 rounded p-1.5 transition-all cursor-pointer"
                            title="Ver cotización"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              let items: any[] = [];
                              try { items = JSON.parse(q.Items); } catch {}
                              const total = q.PrecioTotal;
                              const isvNote = q.ISV > 0 ? ` (+${q.ISV}% ISV)` : '';
                              const text = `Hola, soy ${q.Cliente}. Quisiera información sobre mi cotización ${q.ID}:\n${items.map(i => `- ${i.tipoTrabajo}: L. ${Number(i.precio).toLocaleString('es-HN')}`).join('\n')}\nTotal: L. ${Number(total).toLocaleString('es-HN')}${isvNote}`;
                              window.open(`https://wa.me/50425521400?text=${encodeURIComponent(text)}`, '_blank');
                            }}
                            className="bg-green-900/20 border border-green-500/30 text-green-400 hover:bg-green-600 hover:text-white rounded p-1.5 transition-all cursor-pointer"
                            title="Enviar por WhatsApp"
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                          </button>
                          {q.Estado === 'Pendiente' && currentUser && (currentUser.Rol === 'Admin' || currentUser.Rol === 'Vendedor') && (
                          <button
                            onClick={() => {
                              setConversionQuote(q);
                              setConversionMonto('0');
                              setConversionMetodo('Efectivo');
                              setConfirmingId(null);
                            }}
                            className="bg-amber-900/20 border border-amber-500/30 text-amber-400 hover:bg-amber-600 hover:text-white rounded p-1.5 transition-all cursor-pointer"
                            title="Convertir cotización a venta"
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                          )}
                          {onDeleteQuotation && currentUser?.Rol === 'Admin' && (
                            <button
                              onClick={() => { if (window.confirm(`Eliminar cotización ${q.ID}?`)) { onDeleteQuotation(q.ID); } }}
                              className="bg-red-950/30 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white rounded p-1.5 transition-all cursor-pointer"
                              title="Eliminar cotización"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-textD leading-relaxed">
                      No se han encontrado cotizaciones registradas para este criterio de búsqueda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── CREATE NEW QUOTATION MODAL ── */}
      {isOpenForm && (
        <div className="modal-overlay open" onClick={() => setIsOpenForm(false)}>
          <div className="modal w-full max-w-2xl bg-cyber-panel border border-cyber-purple rounded-xl" onClick={(e) => e.stopPropagation()}>
            <div className="modalHeader border-b border-cyber-purple/25 p-5 flex items-center justify-between">
              <h3 className="font-orbitron text-xs font-bold text-cyber-cyan tracking-wider uppercase flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyber-purple" />
                CONFECCIONAR PRESUPUESTO COMERCIAL
              </h3>
              <button onClick={() => setIsOpenForm(false)} className="text-textD hover:text-red-400 text-lg cursor-pointer bg-none border-none">✕</button>
            </div>

            <form onSubmit={handleSaveQuotation}>
              <div className="modalBody p-6 space-y-5">
                
                {/* Client selector row */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-[10px] uppercase font-bold text-cyber-cyan font-sans">Socio / Cliente solicitante *</label>
                    <button
                      type="button"
                      onClick={() => setIsOpenClientModal(true)}
                      className="text-[10px] text-cyber-pink hover:underline uppercase flex items-center gap-1 border-none bg-transparent cursor-pointer font-bold font-mono"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      + Registrar cliente nuevo
                    </button>
                  </div>

                  <select
                    value={selectedClient}
                    onChange={(e) => setSelectedClient(e.target.value)}
                    className="w-full bg-cyber-purple/10 border border-cyber-purple/30 rounded p-3 text-text text-xs outline-none hover:border-cyber-cyan/50 transition-all"
                    required
                  >
                    <option value="">— Seleccione un cliente de la cartera —</option>
                    {clients.map(c => (
                      <option value={c.ID} key={c.ID}>
                        {c.Nombre} ({c.ID} - {c.Departamento || 'Honduras'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* RTN / conRtn */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 border border-cyber-purple/20 rounded-lg overflow-hidden">
                    <label className={`text-[10px] uppercase font-bold px-3 py-2 cursor-pointer select-none transition-all ${conRtn ? 'bg-amber-500/20 text-amber-400' : 'text-textD bg-transparent'}`}>
                      <input type="radio" checked={conRtn} onChange={() => setConRtn(true)} className="hidden" />
                      CON RTN
                    </label>
                    <label className={`text-[10px] uppercase font-bold px-3 py-2 cursor-pointer select-none transition-all ${!conRtn ? 'bg-red-500/20 text-red-400' : 'text-textD bg-transparent'}`}>
                      <input type="radio" checked={!conRtn} onChange={() => setConRtn(false)} className="hidden" />
                      SIN RTN
                    </label>
                  </div>
                  {conRtn && (() => {
                    const selectedClientData = clients.find(c => c.ID === selectedClient);
                    const hasRtn = selectedClientData && !!selectedClientData.RTN;
                    const displayRtn = hasRtn ? selectedClientData!.RTN : (rtnCliente || '');
                    if (displayRtn && !isEditingRtn) {
                      return (
                        <span className="text-xs font-mono text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded px-3 py-2">{displayRtn}</span>
                      );
                    }
                    if (isEditingRtn) {
                      return (
                        <div className="flex-1 flex items-center gap-1">
                          <input type="text" placeholder="RTN del cliente (14 dígitos)"
                            value={rtnCliente}
                            onChange={(e) => setRtnCliente(e.target.value)}
                            maxLength={14}
                            className="flex-1 bg-cyber-purple/10 border border-amber-500/30 rounded p-2 text-text text-xs outline-none focus:border-amber-500/60 transition-all font-mono"
                          />
                          <button type="button" onClick={handleConfirmRtn}
                            className="text-green-400 hover:text-green-300 text-sm cursor-pointer bg-none border-none p-1">✓</button>
                          <button type="button" onClick={handleCancelRtn}
                            className="text-red-400 hover:text-red-300 text-sm cursor-pointer bg-none border-none p-1">✕</button>
                        </div>
                      );
                    }
                    if (!selectedClient) return null;
                    return (
                      <button type="button" onClick={() => { rtnOriginalRef.current = ''; setIsEditingRtn(true); setRtnCliente(''); }}
                        className="text-[10px] text-amber-400 hover:text-amber-300 border border-dashed border-amber-500/40 rounded px-3 py-2 bg-transparent cursor-pointer font-mono flex items-center gap-1">
                        + Agregar RTN
                      </button>
                    );
                  })()} 
                </div>

                {/* Productos Section — quick add from inventory */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-cyber-purple/15 pb-2">
                    <label className="block text-[10px] uppercase font-bold text-amber-400 font-sans flex items-center gap-1.5">
                      <Archive className="w-3.5 h-3.5" /> Productos
                    </label>
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <select value={productoSeleccionado} onChange={e => {
                        const p = products.find(pr => pr.ID === e.target.value);
                        setProductoSeleccionado(e.target.value);
                        setPrecioProducto(p ? p['Precio Venta'] : 0);
                      }} className="w-full bg-cyber-purple/10 border border-cyber-purple/30 rounded p-2.5 text-text text-xs outline-none">
                        <option value="">— Seleccionar producto —</option>
                        {products.filter(p => p['Stock Actual'] > 0).map(p => (
                          <option value={p.ID} key={p.ID}>{p.Nombre} (Stock: {p['Stock Actual']} · L. {p['Precio Venta']})</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-16">
                      <input type="number" min="1" value={cantidadProducto} onChange={e => setCantidadProducto(Math.max(1, Number(e.target.value) || 1))}
                        className="w-full bg-cyber-purple/10 border border-cyber-purple/30 rounded p-2.5 text-text text-xs text-center outline-none" placeholder="Cant" />
                    </div>
                    <div className="w-24">
                      <input type="number" min="0" step="0.01" value={precioProducto} onChange={e => setPrecioProducto(Number(e.target.value) || 0)}
                        className="w-full bg-cyber-purple/10 border border-cyber-purple/30 rounded p-2.5 text-text text-xs text-center outline-none" placeholder="Precio" />
                    </div>
                    <button type="button" onClick={handleAddProductToQuote}
                      className="px-3 py-2.5 rounded bg-amber-600/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold uppercase tracking-wider hover:bg-amber-600 hover:text-white transition-all cursor-pointer whitespace-nowrap">
                      + Agregar
                    </button>
                  </div>
                </div>

                {/* Servicios Section — production work via job modal */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-cyber-purple/15 pb-2">
                    <label className="block text-[10px] uppercase font-bold text-cyber-cyan font-sans flex items-center gap-1.5">
                      <Wrench className="w-3.5 h-3.5" /> Servicios / Trabajos
                    </label>
                    <button type="button" onClick={handleOpenJobModal}
                      className="text-[10px] text-cyber-cyan hover:underline uppercase flex items-center gap-1 border-none bg-transparent cursor-pointer font-bold font-mono">
                      <Plus className="w-4 h-4" />
                      + Agregar Servicio
                    </button>
                  </div>
                </div>

                {/* Unified items list */}
                <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                  {items.length === 0 ? (
                    <div className="text-center py-6 text-textD border border-dashed border-cyber-purple/20 rounded-lg text-xs">
                      ⚠️ No hay items agregados. Añada productos o servicios arriba.
                    </div>
                  ) : (
                    items.map((item, idx) => (
                      <div key={idx}
                        className={`flex items-center justify-between p-3.5 rounded-lg font-mono text-xs transition-all ${item.productId ? 'bg-amber-500/5 border border-amber-500/20 hover:border-amber-500/40' : 'bg-cyber-purple/10 border border-cyber-purple/25 hover:border-cyber-cyan/40'}`}>
                        <div className="flex-1 min-w-0 pr-4">
                          <div className="font-orbitron text-[10px] font-bold truncate flex items-center gap-1.5">
                            {item.productId ? <><Archive className="w-3 h-3 text-amber-400" /><span className="text-amber-400">{item.productName}</span></>
                              : <><Wrench className="w-3 h-3 text-cyber-cyan" /><span className="text-cyber-cyan">SERVICIO</span></>}
                          </div>
                          <div className="text-textD text-[11px] truncate mt-0.5">
                            {item.tipoTrabajo}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 flex-shrink-0">
                          <div className="font-bold text-green-400 font-orbitron">{fmtVal(item.precio)}</div>
                          <button type="button" onClick={() => setItems(items.filter((_, i) => i !== idx))}
                            className="text-textD hover:text-red-400 p-1 bg-transparent border-none cursor-pointer transition-all hover:scale-105" title="Eliminar">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Pricing / total indicator bar */}
                <div className="p-4 bg-cyber-bg2 border border-cyber-purple/20 rounded-lg space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-cyber-cyan animate-pulse" />
                      <span>Propuestas: <b className="text-white">{items.length} uds</b></span>
                    </div>
                    <div>
                      <span className="text-textD uppercase mr-2 text-[10px] tracking-wider">Subtotal:</span>
                      <span className="text-cyber-cyan font-black text-sm font-orbitron">{fmtVal(calculateTotal())}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-cyber-purple/10 pt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-textD text-[10px]">Descuento:</span>
                      <input type="number" min="0" max="100" value={descuentoPct} onChange={e => setDescuentoPct(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                        className="w-16 bg-cyber-purple/10 border border-cyber-purple/30 rounded px-2 py-1 text-text text-xs text-center" />
                      <span className="text-textD text-[10px]">%</span>
                    </div>
                    <div>
                      <span className="text-cyber-pink font-black text-sm font-orbitron">-{fmtVal(calculateTotal() * descuentoPct / 100)}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-cyber-purple/10 pt-2">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="isvToggle" checked={aplicarISV} onChange={e => setAplicarISV(e.target.checked)}
                        className="w-3.5 h-3.5 accent-amber-500 cursor-pointer" />
                      <label htmlFor="isvToggle" className="text-textD text-[10px] cursor-pointer select-none">ISV 15%</label>
                    </div>
                    <span className="text-cyber-pink font-black text-sm font-orbitron">{aplicarISV ? fmtVal(calculateTotal() * (1 - descuentoPct / 100) * 0.15) : 'L. 0.00'}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-cyber-purple/15 pt-2">
                    <span className="text-green-400 uppercase text-[10px] tracking-wider font-bold">Total{aplicarISV ? ' (+ISV)' : ''}:</span>
                    <span className="text-green-400 font-black text-base font-orbitron">{fmtVal(aplicarISV ? calculateTotal() * (1 - descuentoPct / 100) * 1.15 : calculateTotal() * (1 - descuentoPct / 100))}</span>
                  </div>
                </div>

                {/* Observations */}
                <div className="field">
                  <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1 leading-normal">Condiciones complementarias / Notas</label>
                  <textarea
                    placeholder="Validez temporal, condiciones de envío..."
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    className="w-full bg-cyber-purple/10 border border-cyber-purple/30 p-3 rounded text-text text-xs"
                    style={{ minHeight: '65px' }}
                  />
                </div>

              </div>

              <div className="modalFooter border-t border-cyber-purple/25 p-5 flex justify-end gap-3 text-xs">
                <button 
                  type="button" 
                  onClick={() => setIsOpenForm(false)} 
                  className="btn bg-cyber-bg2 border border-cyber-purple/20 px-5 py-2.5 hover:bg-cyber-purple/10 text-text cursor-pointer"
                >
                  CANCELAR
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary bg-gradient-to-r from-cyber-purple to-cyber-cyan text-white font-orbitron font-bold px-6 py-3 rounded shadow-[0_0_12px_rgba(0,255,255,0.4)] cursor-pointer"
                >
                  REGISTRAR PROPUESTA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── SECONDARY NESTED WORK CONFIRMATION MODAL ── */}
      {isOpenJobModal && (
        <div className="modal-overlay open z-[60]" onClick={() => setIsOpenJobModal(false)}>
          <div className="modal w-full max-w-lg bg-cyber-panel border border-cyber-purple rounded-xl text-text font-sans" onClick={(e) => e.stopPropagation()}>
            <div className="modalHeader border-b border-cyber-purple/25 p-5 flex items-center justify-between">
              <h3 className="font-orbitron text-xs font-bold text-cyber-cyan tracking-wider uppercase flex items-center gap-2">
                <Plus className="w-4 h-4 text-cyber-purple" />
                CONFECCIONAR DETALLE DE TRABAJO
              </h3>
              <button type="button" onClick={() => setIsOpenJobModal(false)} className="text-textD hover:text-red-400 text-lg cursor-pointer bg-none border-none">✕</button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const newItem: QuotationItem = {
                tipoTrabajo: jobTipoTrabajo || 'Servicio',
                precio: Number(jobPrecio) || 0,
                serviceId: jobServiceId || undefined,
                descripcion: jobDescripcion || jobTipoTrabajo || 'Servicio',
              };
              setItems([...items, newItem]);
              setIsOpenJobModal(false);
            }}>
              <div className="modalBody p-6 space-y-4 overflow-y-auto max-h-[70vh]">

                {/* Predefined Categories */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1.5 font-sans">Tipo de Servicio *</label>
                  <div className="grid grid-cols-3 gap-2 font-mono mb-3">
                    {serviceTypes.filter(st => st.activo).map((cat) => {
                      const isActive = jobCategoria === cat.nombre;
                      return (
                        <button type="button" key={cat.id} onClick={() => { setJobCategoria(cat.nombre); setJobTipoTrabajo(cat.nombre); setJobServiceId(cat.id); }}
                          className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-center transition-all cursor-pointer ${isActive ? 'bg-cyber-purple/25 border-cyber-cyan text-white font-bold' : 'bg-cyber-purple/5 border-cyber-purple/30 text-textD hover:border-cyber-purple/60 hover:bg-cyber-purple/10'}`}>
                          <span className="text-xs mb-0.5">{cat.icono || '⚙️'}</span>
                          <span className="text-[9px]">{cat.nombre}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Service Type (read-only) */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1 font-sans">Tipo de Trabajo</label>
                  <div className="w-full bg-cyber-purple/5 border border-cyber-purple/20 rounded p-3 text-cyber-cyan text-xs font-bold">
                    {jobTipoTrabajo}
                  </div>
                </div>

                {/* Detailed Description */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1 font-sans">Descripción Detallada *</label>
                  <textarea required placeholder="Ej. Grabado de trofeo, corte de letras en acrílico..."
                    value={jobDescripcion} onChange={(e) => setJobDescripcion(e.target.value)}
                    className="w-full bg-cyber-purple/10 border border-cyber-purple/30 rounded p-3 text-text text-xs outline-none min-h-[80px]" />
                </div>

                {/* Price */}
                <div>
                  <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1 font-sans">Precio *</label>
                  <input type="number" required placeholder="0.00" value={jobPrecio}
                    onChange={(e) => setJobPrecio(e.target.value)}
                    className="w-full bg-cyber-purple/10 border border-cyber-purple/30 rounded p-3 text-text text-xs outline-none" />
                </div>

              </div>

              {/* Total Summary Footer bar */}
              <div className="px-6 py-4 bg-cyber-bg border-t border-b border-cyber-purple/20 flex justify-between items-center font-mono text-xs">
                <span className="text-textD uppercase text-[10px] tracking-wider">Monto Estimado Trabajo:</span>
                <span className="text-cyber-cyan font-black text-sm font-orbitron">{fmtVal(Number(jobPrecio) || 0)}</span>
              </div>

              <div className="modalFooter p-5 flex justify-end gap-3 text-xs">
                <button 
                  type="button" 
                  onClick={() => setIsOpenJobModal(false)} 
                  className="btn bg-cyber-bg2 border border-cyber-purple/20 px-5 py-2.5 hover:bg-cyber-purple/10 text-text cursor-pointer"
                >
                  CANCELAR
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary bg-gradient-to-r from-cyber-purple to-cyber-cyan text-white font-orbitron font-bold px-6 py-3 rounded shadow-[0_0_12px_rgba(0,255,255,0.4)] cursor-pointer"
                >
                  AGREGAR TRABAJO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── QUOTATION DETAIL MODAL ── */}
      {isQuoteDetailOpen && quoteDetail && (() => {
        const q = quoteDetail;
        let itemsList: QuotationItem[] = [];
        try { itemsList = JSON.parse(q.Items); } catch {}
        const clientObj = clients.find(c => c.ID === q['Cliente ID']);
        const subTotal = itemsList.reduce((s, i) => s + Number(i.precio), 0);
        const desc = subTotal * (q.Descuento || 0) / 100;
        const base = subTotal - desc;
        const isvAmt = q.ISV ? base * q.ISV / 100 : 0;
        return (
          <div className="modal-overlay open z-[60]">
            <div className="modal w-full max-w-2xl bg-cyber-panel border border-cyber-purple rounded-xl text-text font-sans">
              <div className="modalHeader border-b border-cyber-purple/25 p-5 flex items-center justify-between">
                <h3 className="font-orbitron text-xs font-bold text-cyber-cyan tracking-wider uppercase flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyber-purple" />
                  COTIZACION · {q.ID}
                </h3>
                <button onClick={() => setIsQuoteDetailOpen(false)} className="text-textD hover:text-red-400 text-lg cursor-pointer bg-none border-none">✕</button>
              </div>
              <div className="modalBody p-6 overflow-y-auto max-h-[70vh]" ref={quotePrintRef}>
                {/* Company Header */}
                <div className="text-center mb-6 pb-6 border-b border-cyber-purple/20">
                  <h2 className="font-orbitron text-lg font-black text-cyber-cyan tracking-wider">EL PATRON HN</h2>
                  <p className="text-[10px] text-textD mt-1">Tecnología de Personalizados · Grabado Láser · Impresión · Rotulación</p>
                  <p className="text-[10px] text-textD">RTN: 08019015239084 · Col. Altiplano, San Pedro Sula · Tel: 9999-9999</p>
                  <p className="text-[10px] text-textD">Correo: info@elpatron.hn</p>
                </div>

                {/* Client & Quote Info */}
                <div className="grid grid-cols-2 gap-6 mb-6 pb-6 border-b border-cyber-purple/20 text-[11px]">
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-textD mb-1">Cliente</p>
                    <p className="font-bold text-cyber-cyan">{clientObj?.Nombre || q.Cliente}</p>
                    <p className="text-textD">{clientObj?.Ciudad ? `${clientObj.Ciudad}, ${clientObj.Departamento || ''}` : ''}</p>
                    <p className="text-textD">RTN: {q.RTN || 'No registrado'}</p>
                    {clientObj?.Teléfono && <p className="text-textD">Tel: {clientObj.Teléfono}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] uppercase tracking-wider text-textD mb-1">Cotización</p>
                    <p className="font-bold text-cyber-cyan">{q.ID}</p>
                    <p className="text-textD">Fecha: {q.Fecha}</p>
                    <p className="text-textD">Vence: {q['Fecha Expiracion'] || '—'}</p>
                    <p className="text-textD">Estado: {q.Estado}</p>
                  </div>
                </div>

                {/* Observations */}
                {q.Observaciones && (
                  <div className="mb-4 pb-4 border-b border-cyber-purple/20 text-[11px]">
                    <p className="text-[9px] uppercase tracking-wider text-textD mb-1">Observaciones</p>
                    <p className="text-text">{q.Observaciones}</p>
                  </div>
                )}

                {/* Items Table */}
                <table className="w-full text-[11px] mb-6">
                  <thead>
                    <tr className="border-b border-cyber-purple/20 text-[9px] uppercase tracking-wider text-textD">
                      <th className="text-left pb-2 font-semibold">Descripción</th>
                      <th className="text-right pb-2 font-semibold">Precio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemsList.map((item: any, i: number) => (
                      <tr key={i} className="border-b border-cyber-purple/10">
                        <td className="py-2 pr-2">
                          <div className="font-semibold text-cyber-cyan">{item.tipoTrabajo}</div>
                          {item.descripcion && <div className="text-textD text-[10px]">{item.descripcion}</div>}
                        </td>
                        <td className="py-2 text-right">{fmtVal(item.precio)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals */}
                <div className="flex justify-end mb-6 pb-6 border-b border-cyber-purple/20">
                  <div className="text-right text-[11px] space-y-1">
                    <div className="flex justify-between gap-8">
                      <span className="text-textD">Subtotal:</span>
                      <span>{fmtVal(subTotal)}</span>
                    </div>
                    {desc > 0 && (
                      <div className="flex justify-between gap-8">
                        <span className="text-textD">Descuento ({q.Descuento}%):</span>
                        <span className="text-red-400">-{fmtVal(desc)}</span>
                      </div>
                    )}
                    {isvAmt > 0 && (
                      <div className="flex justify-between gap-8">
                        <span className="text-textD">ISV ({q.ISV}%):</span>
                        <span>{fmtVal(isvAmt)}</span>
                      </div>
                    )}
                    <div className="flex justify-between gap-8 text-base font-bold text-cyber-cyan border-t border-cyber-purple/20 pt-1 mt-1">
                      <span>TOTAL:</span>
                      <span>{fmtVal(q.PrecioTotal)}</span>
                    </div>
                  </div>
                </div>

                {/* Validity info */}
                <p className="text-[9px] text-textD text-center">
                  Cotización válida hasta {q['Fecha Expiracion'] || 'la fecha indicada'}. 
                  Precios sujetos a cambio sin previo aviso.
                </p>
              </div>

              <div className="modalFooter p-5 flex justify-end gap-3 text-xs">
                <button
                  onClick={() => setIsQuoteDetailOpen(false)}
                  className="btn bg-cyber-bg2 border border-cyber-purple/20 px-5 py-2.5 hover:bg-cyber-purple/10 text-text cursor-pointer"
                >
                  CERRAR
                </button>
                <button
                  onClick={() => handleDownloadQuotationPDF(q)}
                  className="btn bg-cyber-purple/20 border border-cyber-purple/40 text-cyber-cyan hover:bg-cyber-purple/30 px-5 py-2.5 rounded cursor-pointer flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  DESCARGAR PDF
                </button>
                <button
                  onClick={() => window.print()}
                  className="btn bg-gradient-to-r from-cyber-purple to-cyber-cyan text-white font-orbitron font-bold px-6 py-3 rounded shadow-[0_0_12px_rgba(0,255,255,0.4)] cursor-pointer"
                >
                  IMPRIMIR
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      <QuickClientModal
        isOpen={isOpenClientModal}
        onClose={() => setIsOpenClientModal(false)}
        onSubmit={handleQuickClientSubmit}
        quickNombre={quickNombre} setQuickNombre={setQuickNombre}
        quickTelefono={quickTelefono} setQuickTelefono={setQuickTelefono}
        quickEmail={quickEmail} setQuickEmail={setQuickEmail}
        quickDept={quickDept} setQuickDept={setQuickDept}
        quickCiudad={quickCiudad} setQuickCiudad={setQuickCiudad}
        quickRtn={quickRtn} setQuickRtn={setQuickRtn}
      />

      {/* ── CONVERT QUOTATION TO SALE CON PAYMENT MODAL ── */}
      {conversionQuote && (
        <div className="modal-overlay open z-[75]" onClick={() => setConversionQuote(null)}>
          <div 
            className="modal w-full max-w-lg bg-cyber-panel border border-cyber-cyan rounded-xl text-text font-sans" 
            onClick={(e) => e.stopPropagation()}
            id="quotation-conversion-modal"
          >
            <div className="modalHeader border-b border-cyber-cyan/25 p-5 flex items-center justify-between">
              <h3 className="font-orbitron text-xs font-bold text-cyber-cyan tracking-wider uppercase flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-cyber-cyan" />
                CONVERTIR COTIZACIÓN A VENTA ({conversionQuote.ID})
              </h3>
              <button 
                type="button" 
                onClick={() => setConversionQuote(null)} 
                className="text-textD hover:text-red-400 text-lg cursor-pointer bg-none border-none"
              >
                ✕
              </button>
            </div>

            <div className="modalBody p-6 space-y-5">
              <div className="bg-cyber-purple/10 border border-cyber-purple/20 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-textD">CLIENTE REGISTRADO:</span>
                  <span className="font-bold text-white uppercase">{conversionQuote.Cliente}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-cyber-purple/10 pt-2 font-mono">
                  <span className="text-textD font-sans">IMPORTE BRUTO TOTAL:</span>
                  <span className="font-bold text-cyber-cyan text-base">
                    L. {Number(conversionQuote.PrecioTotal).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* OPCIONES DE PAGO RÁPIDO */}
              <div className="space-y-3">
                <label className="block text-[10px] uppercase font-bold text-cyber-cyan font-sans animate-pulse">
                  Configuración de Pago de la Venta
                </label>
                
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setConversionMonto('0');
                    }}
                    className={`p-3 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                      Number(conversionMonto) === 0
                        ? 'bg-cyber-purple/25 border-cyber-cyan text-white font-bold shadow-[0_0_10px_rgba(0,255,255,0.2)]'
                        : 'bg-cyber-purple/5 border-cyber-purple/30 text-textD hover:border-cyber-purple/60 hover:bg-cyber-purple/10'
                    }`}
                  >
                    <span className="text-base mb-1">⏳</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider">Añadir con Deuda Total</span>
                    <span className="text-[9px] text-textD mt-0.5">(Saldo Pendiente)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setConversionMonto(String(conversionQuote.PrecioTotal));
                    }}
                    className={`p-3 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                      Number(conversionMonto) === Number(conversionQuote.PrecioTotal)
                        ? 'bg-cyber-purple/25 border-cyber-cyan text-white font-bold shadow-[0_0_10px_rgba(0,255,255,0.2)]'
                        : 'bg-cyber-purple/5 border-cyber-purple/30 text-textD hover:border-cyber-purple/60 hover:bg-cyber-purple/10'
                    }`}
                  >
                    <span className="text-base mb-1">💳</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider">Pago de Contado Completo</span>
                    <span className="text-[9px] text-cyber-cyan mt-0.5">(Pagado al instante)</span>
                  </button>
                </div>
              </div>

              {/* DETALLES DE PAGO PERSONALIZADO */}
              <div className="border-t border-cyber-purple/15 pt-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Monto de Pago Inicial / Abono */}
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-textD mb-1">
                      Monto Pagado / Abono (L.)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-[10px] text-textD font-mono">L.</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        max={conversionQuote.PrecioTotal}
                        value={conversionMonto}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (Number(val) > Number(conversionQuote.PrecioTotal)) {
                            setConversionMonto(String(conversionQuote.PrecioTotal));
                          } else {
                            setConversionMonto(val);
                          }
                        }}
                        className="w-full bg-cyber-purple/10 border border-cyber-purple/30 rounded p-2.5 pl-7 text-text text-xs outline-none focus:border-cyber-cyan/50 font-mono"
                      />
                    </div>
                    <span className="text-[9px] text-textD">
                      Deuda resultante: L. {Math.max(0, Number(conversionQuote.PrecioTotal) - (Number(conversionMonto) || 0)).toLocaleString('es-HN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Método de Pago */}
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-textD mb-1">
                      Método de Pago
                    </label>
                    <select
                      disabled={Number(conversionMonto) <= 0}
                      value={conversionMetodo}
                      onChange={(e) => setConversionMetodo(e.target.value as any)}
                      className="w-full bg-cyber-purple/10 border border-cyber-purple/30 rounded p-2.5 text-text text-xs outline-none focus:border-cyber-cyan/50 disabled:opacity-40"
                    >
                      <option value="Efectivo">💵 Efectivo</option>
                      <option value="Transferencia">🏦 Transferencia Bancaria</option>
                      <option value="Tarjeta">💳 Tarjeta de Crédito/Débito</option>
                    </select>
                  </div>
                </div>
              </div>

            </div>

            <div className="modalFooter p-5 border-t border-cyber-purple/15 flex justify-end gap-3 text-xs">
              <button 
                type="button" 
                onClick={() => setConversionQuote(null)} 
                className="btn bg-cyber-bg2 border border-cyber-purple/20 px-5 py-2.5 hover:bg-cyber-purple/10 text-text cursor-pointer"
              >
                CANCELAR
              </button>
              <button 
                type="button"
                onClick={() => {
                  onConvertQuotationToSale(
                    conversionQuote, 
                    Number(conversionMonto) || 0, 
                    conversionMetodo
                  );
                  setConversionQuote(null);
                }}
                className="btn btn-primary bg-gradient-to-r from-cyber-cyan to-cyber-purple text-white font-orbitron font-bold px-6 py-3 rounded shadow-[0_0_12px_rgba(0,255,255,0.4)] cursor-pointer"
              >
                AUTORIZAR Y CREAR VENTA ✓
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
