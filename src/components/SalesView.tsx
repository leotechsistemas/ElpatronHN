import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search, Plus, FileText, Check, AlertCircle,
  Clock, ArrowRight, DollarSign, UserPlus, ShoppingCart, Download, Trash2,
  Archive, Wrench, ChevronLeft, ChevronRight, Eye, CreditCard, BarChart3, TrendingUp, Users
} from 'lucide-react';
import { Sale, Client, Product, User, QuotationItem, ServiceType } from '../types';
import { api } from '../services/api';
import { jsPDF } from 'jspdf';
import QuickClientModal from './QuickClientModal';

interface SalesViewProps {
  sales: Sale[];
  clients: Client[];
  products: Product[];
  currentUser: User | null;
  onAddSale: (saleData: any) => Promise<boolean>;
  onAddQuickClient: (clientData: any) => Promise<any> | any;
  onUpdateClient?: (clientId: string, clientData: any) => Promise<boolean>;
  onOpenPayModal: (saleId: string) => void;
  canCreateSale: boolean;
  canPay: boolean;
  canInvoice: boolean;
  productionTasks: any[];
  serviceTypes: ServiceType[];
  onUpdateTaskStatus: (taskId: string, estado: string) => void;
  onDeleteSale?: (saleId: string) => void;
}

export default function SalesView({
  sales,
  clients,
  products = [],
  currentUser,
  onAddSale,
  onAddQuickClient,
  onUpdateClient,
  onOpenPayModal,
  canCreateSale,
  canPay,
  canInvoice,
  productionTasks,
  serviceTypes,
  onUpdateTaskStatus,
  onDeleteSale
}: SalesViewProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history'>('dashboard');

  // ── History states ──
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const PAGE_SIZE = 25;
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [paginatedSales, setPaginatedSales] = useState<Sale[]>(sales);
  const [isLoadingPage, setIsLoadingPage] = useState(false);

  const mapSale = (s: any): Sale => ({
    ID: s.id, Fecha: s.fecha,
    'Cliente ID': s.cliente_id, Cliente: s.cliente, RTN: s.rtn || '', ConRTN: s.con_rtn !== false,
    'Producto ID': s.producto_id || '', Producto: s.producto || '',
    'Tipo Trabajo': s.tipo_trabajo, Precio: s.precio, Estado: s.estado,
    'Pago Inicial': s.pago_inicial, 'Estado Pago': s.estado_pago,
    Observaciones: s.observaciones || '', 'Vendedor ID': s.vendedor_id || ''
  });

  const fetchSalesPage = useCallback(async (page: number, search: string) => {
    setIsLoadingPage(true);
    try {
      const res = await api.getSales(page, PAGE_SIZE, search || undefined);
      setPaginatedSales(((res as any).content || []).map(mapSale));
      setTotalPages((res as any).total_pages || 1);
      setTotalElements((res as any).total_elements || 0);
    } catch {
      setPaginatedSales([]);
    }
    setIsLoadingPage(false);
  }, []);

  const fetchInvoiceData = async (saleId: string) => {
    try {
      const [itemsRes, paysRes] = await Promise.all([
        api.getInvoiceItems(saleId),
        api.getPayments()
      ]);
      setInvoiceItems(itemsRes?.data || []);
      const allPays = paysRes?.data || [];
      setSalePayments(allPays.filter((p: any) => p.venta_id === saleId));
    } catch {
      setInvoiceItems([]);
      setSalePayments([]);
    }
  };

  const handleDownloadInvoicePDF = (sale: Sale) => {
    const client = clients.find(c => c.ID === sale['Cliente ID']);
    const totalPagado = salePayments.reduce((a: number, p: any) => a + Number(p.monto), 0);
    const saldo = Math.max(0, sale.Precio - totalPagado);
    const doc = new jsPDF();

    const bgDark = [28, 25, 23] as const;
    const accent = [196, 150, 30] as const;
    const textDark = [40, 38, 36] as const;
    const textGray = [130, 130, 130] as const;
    const textLight = [180, 180, 180] as const;
    const rowEven = [250, 248, 242] as const;
    const white = [255, 255, 255] as const;

    doc.setFillColor(...bgDark); doc.rect(0, 0, 210, 42, 'F');
    doc.setFillColor(...accent); doc.rect(0, 40, 210, 2, 'F');
    doc.setTextColor(...white); doc.setFont('helvetica', 'bold'); doc.setFontSize(20);
    doc.text('EL PATRON HN', 14, 18);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...textLight);
    doc.text('Tecnologia de Personalizados · Grabado Laser · Impresion · Rotulacion', 14, 25);
    doc.setFontSize(9); doc.setTextColor(...accent);
    doc.text(`FACTURA  ·  ${sale.ID}`, 14, 33);

    doc.setDrawColor(...accent); doc.setLineWidth(0.3);

    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...textDark);
    doc.text('CLIENTE', 14, 58);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...textGray);
    doc.text(sale.Cliente, 14, 64);
    if (client?.Teléfono) doc.text(`Tel: ${client.Teléfono}`, 14, 69);
    if (sale.RTN) doc.text(`RTN: ${sale.RTN}`, 14, 74);

    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...textDark);
    doc.text('FACTURA', 130, 58);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...textGray);
    doc.text(sale.ID, 130, 64);
    doc.text(`Fecha: ${sale.Fecha}`, 130, 69);
    doc.text(`Estado: ${sale.Estado}`, 130, 74);

    doc.setDrawColor(220, 215, 205); doc.line(14, 82, 196, 82);

    let curY = 92;
    doc.setFillColor(...bgDark); doc.rect(14, curY, 182, 8, 'F');
    doc.setTextColor(...white); doc.setFont('helvetica', 'bold'); doc.setFontSize(7);
    doc.text('ITEM', 18, curY + 5.5);
    doc.text('DESCRIPCION', 35, curY + 5.5);
    doc.text('CANT.', 115, curY + 5.5);
    doc.text('P. UNIT.', 145, curY + 5.5);
    doc.text('SUBTOTAL', 192, curY + 5.5, { align: 'right' });
    curY += 13;

    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...textDark);
    if (invoiceItems.length > 0) {
      invoiceItems.forEach((item, idx) => {
        if (idx % 2 === 1) { doc.setFillColor(...rowEven); doc.rect(14, curY - 4, 182, 10, 'F'); }
        doc.text(String(idx + 1).padStart(2, '0'), 18, curY);
        const desc = item.descripcion || '';
        doc.text(desc.length > 28 ? desc.substring(0, 26) + '..' : desc, 35, curY);
        doc.text(String(item.cantidad || 1), 115, curY);
        doc.text(`L. ${Number(item.precio_unitario).toFixed(2)}`, 145, curY);
        doc.setFont('helvetica', 'bold');
        doc.text(`L. ${Number(item.subtotal).toFixed(2)}`, 192, curY, { align: 'right' });
        doc.setFont('helvetica', 'normal');
        doc.setDrawColor(235, 230, 222); doc.line(14, curY + 4, 196, curY + 4);
        curY += 10;
      });
    }
    curY += 6;

    const subTotal = invoiceItems.reduce((a: number, i: any) => a + Number(i.subtotal), 0);
    const totalIsv = invoiceItems.reduce((a: number, i: any) => a + Number(i.isv), 0);
    const boxX = 120, boxW = 76;
    doc.setFillColor(250, 248, 242); doc.rect(boxX, curY, boxW, totalIsv > 0 ? 28 : 20, 'F');
    doc.setDrawColor(...accent); doc.rect(boxX, curY, boxW, totalIsv > 0 ? 28 : 20, 'S');
    let lineY = curY + 6;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...textGray);
    doc.text('Subtotal', boxX + 5, lineY); doc.text(`L. ${subTotal.toFixed(2)}`, boxX + boxW - 5, lineY, { align: 'right' }); lineY += 7;
    if (totalIsv > 0) { doc.text('ISV 15%', boxX + 5, lineY); doc.text(`L. ${totalIsv.toFixed(2)}`, boxX + boxW - 5, lineY, { align: 'right' }); lineY += 7; }
    doc.setDrawColor(...accent); doc.line(boxX + 5, lineY - 1, boxX + boxW - 5, lineY - 1);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...bgDark);
    doc.text('TOTAL', boxX + 5, lineY + 1); doc.text(`L. ${sale.Precio.toFixed(2)}`, boxX + boxW - 5, lineY + 1, { align: 'right' });

    curY = Math.max(curY + 36, lineY + 20);
    doc.setFillColor(245, 243, 237); doc.rect(14, curY, 182, 14, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...textDark);
    doc.text('PAGADO:', 18, curY + 9); doc.text(`L. ${totalPagado.toFixed(2)}`, 55, curY + 9);
    if (saldo > 0) {
      doc.setTextColor(180, 60, 60);
      doc.text('SALDO PENDIENTE:', 105, curY + 9);
      doc.text(`L. ${saldo.toFixed(2)}`, 155, curY + 9);
    } else {
      doc.setTextColor(40, 150, 70);
      doc.text('CANCELADO', 150, curY + 9);
    }

    doc.setDrawColor(200, 195, 185); doc.line(14, 275, 196, 275);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...textGray);
    doc.text('EL PATRON HN · RTN: 08019015239084 · Col. Altiplano, San Pedro Sula · Tel: 9999-9999', 105, 281, { align: 'center' });
    doc.text('Correo: info@elpatron.hn · Documento generado electronicamente', 105, 285, { align: 'center' });

    doc.save(`Factura-${sale.ID}.pdf`);
  };

  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(0);
      setSearchInput(searchTerm);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);
  useEffect(() => {
    fetchSalesPage(currentPage, searchInput !== '' ? searchInput : undefined);
  }, [currentPage, searchInput]);

  // New multi-item Sale form states
  const [selectedClient, setSelectedClient] = useState('');

  useEffect(() => {
    const c = clients.find(cl => cl.ID === selectedClient);
    setRtnCliente(c?.RTN || '');
    setIsEditingRtn(false);
  }, [selectedClient]);
  const [items, setItems] = useState<QuotationItem[]>([]);
  const [observaciones, setObservaciones] = useState('');
  const [descuentoPct, setDescuentoPct] = useState(0);
  const [aplicarISV, setAplicarISV] = useState(true);
  const [payNow, setPayNow] = useState(false);
  const [metodoPago, setMetodoPago] = useState<'Efectivo' | 'Tarjeta' | 'Transferencia'>('Efectivo');
  const [pagoInicial, setPagoInicial] = useState('');
  const [conRtn, setConRtn] = useState(true);
  const [rtnCliente, setRtnCliente] = useState('');
  const [isEditingRtn, setIsEditingRtn] = useState(false);
  const rtnOriginalRef = useRef('');

  const [productoSeleccionado, setProductoSeleccionado] = useState('');
  const [cantidadProducto, setCantidadProducto] = useState(1);
  const [precioProducto, setPrecioProducto] = useState(0);

  const [isOpenJobModal, setIsOpenJobModal] = useState(false);
  const [jobProductId, setJobProductId] = useState('');
  const [jobProductName, setJobProductName] = useState('');
  const [jobTipoTrabajo, setJobTipoTrabajo] = useState('Personalizado');
  const [jobPrecio, setJobPrecio] = useState('');
  const [jobObservaciones, setJobObservaciones] = useState('');
  const [jobCategoria, setJobCategoria] = useState<string>('');
  const [jobServiceId, setJobServiceId] = useState<string>('');
  const [jobDescripcion, setJobDescripcion] = useState<string>('');

  const [isOpenClientModal, setIsOpenClientModal] = useState(false);
  const [quickNombre, setQuickNombre] = useState('');
  const [quickTelefono, setQuickTelefono] = useState('');
  const [quickEmail, setQuickEmail] = useState('');
  const [quickDept, setQuickDept] = useState('Cortes');
  const [quickCiudad, setQuickCiudad] = useState('');
  const [quickRtn, setQuickRtn] = useState('');

  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [progressSaleId, setProgressSaleId] = useState<string | null>(null);

  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoiceSaleId, setInvoiceSaleId] = useState<string | null>(null);
  const [invoiceItems, setInvoiceItems] = useState<any[]>([]);
  const [salePayments, setSalePayments] = useState<any[]>([]);

  const hondurasDeptos = [
    'Cortes', 'Francisco Morazan', 'Atlantida', 'Yoro', 'Olancho', 'Colon',
    'Gracias a Dios', 'El Paraiso', 'Choluteca', 'Valle', 'La Paz', 'Intibuca',
    'Lempira', 'Ocotepeque', 'Copan', 'Santa Barbara', 'Comayagua', 'Islas de la Bahia'
  ];

  const filteredSales = paginatedSales;

  const handleOpenJobModal = () => {
    setJobProductId('');
    setJobProductName('');
    setJobTipoTrabajo(serviceTypes.length > 0 ? serviceTypes[0].nombre : 'Corte Láser');
    setJobPrecio('');
    setJobObservaciones('');
    setJobCategoria(serviceTypes.length > 0 ? serviceTypes[0].nombre : 'Corte Láser');
    setJobServiceId(serviceTypes.length > 0 ? serviceTypes[0].id : '');
    setJobDescripcion('');
    setIsOpenJobModal(true);
  };

  const handleAddProductToSale = () => {
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
    };
    setItems([...items, newItem]);
    setProductoSeleccionado('');
    setCantidadProducto(1);
    setPrecioProducto(0);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.precio || 0), 0);
  };

  const totalSum = calculateTotal();
  const round2 = (n: number) => Math.round(n * 100) / 100;
  const subtotalConDto = round2(totalSum * (1 - descuentoPct / 100));
  const isvMonto = round2(aplicarISV ? subtotalConDto * 0.15 : 0);
  const finalTotal = round2(subtotalConDto + isvMonto);
  const initialPay = payNow ? Number(pagoInicial) || 0 : 0;
  const saldoCalculado = Math.max(0, finalTotal - initialPay);

  // Compute KPIs
  const totalSales = sales.length;
  const totalRevenue = sales.reduce((sum, s) => sum + (s.Precio || 0), 0);
  const pendingPayments = sales.filter(s => s['Estado Pago'] !== 'Pagado').length;
  const avgSale = totalSales > 0 ? totalRevenue / totalSales : 0;

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

  const handleSubmitSale = async (e: React.FormEvent) => {
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
    const clientRtn = rtnCliente || clientObj.RTN || '';
    if (rtnCliente && rtnCliente !== (clientObj.RTN || '') && onUpdateClient) {
      await onUpdateClient(selectedClient, { rtn: rtnCliente }).catch(() => {});
    }
    const mappedItems = filteredItems.map(item => {
      const isProduct = !!item.productId;
      const basePrice = item.precio || 0;
      const cant = item.cantidad || 1;
      const discountFactor = 1 - descuentoPct / 100;
      const discountedUnitPrice = basePrice / cant * discountFactor;
      const dtoItem = basePrice - discountedUnitPrice * cant;
      const subtotal = discountedUnitPrice * cant;
      const isvItem = aplicarISV ? 15 : 0;
      const impuesto = subtotal * isvItem / 100;
      const totalLinea = subtotal + impuesto;
      return {
        tipoTrabajo: item.tipoTrabajo,
        precio: basePrice,
        productId: item.productId,
        productName: item.productName,
        cantidad: cant,
        precioUnitario: basePrice / cant,
        descuento: dtoItem,
        isv: isvItem,
        subtotal,
        totalLinea,
        serviceId: item.serviceId,
        descripcion: item.descripcion || item.tipoTrabajo,
      };
    });
    const totalAll = round2(mappedItems.reduce((s, i) => s + i.totalLinea, 0));
    const initialPay = round2(payNow ? Number(pagoInicial) || 0 : 0);
    const success = await onAddSale({
      clienteId: selectedClient,
      clienteNombre: clientObj.Nombre,
      rtn: clientRtn,
      conRtn,
      items: mappedItems,
      precio: totalAll,
      pagoInicial: initialPay,
      metodoPago: initialPay > 0 ? metodoPago : '',
      descuento: descuentoPct,
      isvAplicado: aplicarISV ? 15 : 0,
      observaciones: `Desc:${descuentoPct}% ISV:${aplicarISV ? 15 : 0}% | ${observaciones || 'Registro manual de ventas'}`,
      vendedorId: currentUser?.ID || 'USR0001'
    });
    if (success) {
      setShowAddModal(false);
      setSelectedClient('');
      setItems([]);
      setObservaciones('');
      setDescuentoPct(0);
      setAplicarISV(true);
      setPayNow(false);
      setPagoInicial('');
      setConRtn(true);
      setRtnCliente('');
      fetchSalesPage(currentPage, searchInput);
    }
  };

  const fmtVal = (v: number) => 'L. ' + Number(v).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="space-y-6">
      {/* ── Tab Navigation ── */}
      <div className="flex border-b border-cyber-purple/20">
        <button onClick={() => setActiveTab('dashboard')}
          className={`px-5 py-3 font-orbitron text-xs font-bold tracking-wider cursor-pointer transition-all border-b-2 flex items-center gap-2 ${activeTab === 'dashboard' ? 'border-cyber-cyan text-cyber-cyan' : 'border-transparent text-textD hover:text-text'}`}>
          <BarChart3 className="w-4 h-4" /> RESUMEN
        </button>
        <button onClick={() => setActiveTab('history')}
          className={`px-5 py-3 font-orbitron text-xs font-bold tracking-wider cursor-pointer transition-all border-b-2 flex items-center gap-2 ${activeTab === 'history' ? 'border-cyber-cyan text-cyber-cyan' : 'border-transparent text-textD hover:text-text'}`}>
          <Archive className="w-4 h-4" /> HISTORIAL
        </button>
      </div>

      {/* ═══ DASHBOARD TAB ═══ */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-cyber-panel border border-cyber-purple/20 rounded-xl p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-textD font-bold">Ventas Totales</span>
                <ShoppingCart className="w-5 h-5 text-cyber-cyan" />
              </div>
              <div className="text-2xl font-black text-cyber-cyan font-orbitron">{totalSales}</div>
              <div className="text-[9px] text-textD">Órdenes registradas</div>
            </div>

            <div className="bg-cyber-panel border border-cyber-purple/20 rounded-xl p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-textD font-bold">Ingresos Totales</span>
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
              <div className="text-2xl font-black text-green-400 font-orbitron">{fmtVal(totalRevenue)}</div>
              <div className="text-[9px] text-textD">Facturación acumulada</div>
            </div>

            <div className="bg-cyber-panel border border-cyber-purple/20 rounded-xl p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-textD font-bold">Pagos Pendientes</span>
                <DollarSign className="w-5 h-5 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-amber-400 font-orbitron">{pendingPayments}</div>
              <div className="text-[9px] text-textD">Ventas por cobrar</div>
            </div>

            <div className="bg-cyber-panel border border-cyber-purple/20 rounded-xl p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-textD font-bold">Ticket Promedio</span>
                <BarChart3 className="w-5 h-5 text-purple-400" />
              </div>
              <div className="text-2xl font-black text-purple-400 font-orbitron">{fmtVal(avgSale)}</div>
              <div className="text-[9px] text-textD">Valor medio por venta</div>
            </div>
          </div>

          {/* Recent sales mini-table */}
          <div className="border border-cyber-purple/20 bg-cyber-panel rounded-xl overflow-hidden">
            <div className="px-5 py-3 bg-cyber-purple/10 border-b border-cyber-purple/20 flex items-center justify-between">
              <span className="font-orbitron text-xs font-bold text-cyber-cyan tracking-wider">ÚLTIMAS VENTAS</span>
              <button onClick={() => setActiveTab('history')}
                className="text-[10px] text-cyber-pink hover:underline uppercase border-none bg-transparent cursor-pointer font-bold font-mono">
                Ver todas →
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[9px] uppercase tracking-wider text-textD border-b border-cyber-purple/10">
                    <th className="px-5 py-3 font-semibold">ID</th>
                    <th className="px-5 py-3 font-semibold">Cliente</th>
                    <th className="px-5 py-3 font-semibold">Tipo</th>
                    <th className="px-5 py-3 text-right font-semibold">Total</th>
                    <th className="px-5 py-3 text-center font-semibold">Pago</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyber-purple/10 font-mono text-xs">
                  {sales.slice(0, 10).map(s => (
                    <tr key={s.ID} className="hover:bg-cyber-purple/5 transition-all text-text">
                      <td className="px-5 py-3 text-cyber-cyan font-bold">{s.ID}</td>
                      <td className="px-5 py-3">{s.Cliente}</td>
                      <td className="px-5 py-3">
                        <span className={`text-[9px] px-2 py-0.5 rounded ${s['Tipo Trabajo']?.startsWith('Producto') ? 'bg-amber-500/10 text-amber-400' : 'bg-cyber-purple/10 text-cyber-purple'}`}>
                          {s['Tipo Trabajo']?.replace('Producto - ', '') || 'N/A'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right text-green-400 font-bold">{fmtVal(s.Precio)}</td>
                      <td className="px-5 py-3 text-center">
                        <span className={`text-[9px] px-2 py-0.5 rounded-full ${
                          s['Estado Pago'] === 'Pagado' ? 'bg-emerald-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'
                        }`}>
                          {s['Estado Pago'] === 'Pagado' ? '✓ Pagado' : 'Pendiente'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {sales.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center text-textD py-10 text-xs">Sin ventas registradas</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══ HISTORY TAB ═══ */}
      {activeTab === 'history' && <>
      <div className="relative w-full sm:w-80">
        <Search className="absolute left-3.5 top-3.5 text-cyber-purple w-4 h-4" />
        <input
          type="text"
          placeholder="🔍 Buscar venta (Cód, Cliente, Tipo...)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="searchBox w-full pl-10 pr-4 py-3 bg-cyber-purple/10 border border-cyber-purple/40 text-text font-mono text-sm rounded-lg outline-none focus:border-cyber-cyan focus:shadow-[0_0_10px_rgba(235,180,44,0.2)] transition-all"
        />
      </div>

      <div className="panel border border-cyber-purple/20 bg-cyber-panel rounded-xl overflow-hidden shadow-2xl">
        <div className="panelBody p-0">
          <div className="tableWrap overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-cyber-purple/15 text-cyber-cyan font-orbitron text-[9px] tracking-wider border-b border-cyber-purple/20">
                  <th className="px-5 py-3">ID COD</th>
                  <th className="px-5 py-3">FECHA</th>
                  <th className="px-5 py-3">COMERCIANTE / CLIENTE</th>
                  <th className="px-5 py-3">TIPO TRABAJO</th>
                  <th className="px-5 py-3 text-right">TOTAL</th>
                  <th className="px-5 py-3 text-center">TRABAJO STATUS</th>
                  <th className="px-5 py-3 text-right">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyber-purple/10 font-mono text-xs">
                {filteredSales.length ? (
                  filteredSales.map((s) => (
                    <tr className="hover:bg-cyber-purple/5 transition-all text-text" key={s.ID}>
                      <td className="px-5 py-4 text-cyber-cyan font-bold">{s.ID}</td>
                      <td className="px-5 py-4 text-textD">{s.Fecha}</td>
                      <td className="px-5 py-4 font-bold">
                        <div>{s.Cliente}</div>
                        {s.Producto && <div className="text-[10px] text-textD font-normal">{s.Producto}</div>}
                      </td>
                      <td className="px-5 py-4">
                        {s['Tipo Trabajo']?.startsWith('Producto') ? (
                          <span className="badge bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2.5 py-0.5 rounded text-[10px] font-orbitron font-bold">
                            {s['Tipo Trabajo'].replace('Producto - ', '')}
                          </span>
                        ) : (
                          <span className="badge bg-cyber-purple/10 text-cyber-purple border border-cyber-purple/30 px-2.5 py-0.5 rounded text-[10px] font-orbitron font-bold">
                            {s['Tipo Trabajo']}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right font-bold text-green-400">
                        {fmtVal(s.Precio)}
                      </td>
                      <td className="px-5 py-4 text-center">
                        {productionTasks.filter((t: any) => t.venta_id === s.ID).length === 0 ? (
                          <span className="text-textD text-[10px]">—</span>
                        ) : (
                          <span
                            className={`badge px-2.5 py-1 rounded-full text-[10px] font-bold ${
                               s.Estado === 'Terminado'
                                ? 'bg-emerald-500/10 text-green-400 border border-green-400/20'
                                : s.Estado === 'En proceso'
                                ? 'bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan/20'
                                : 'bg-yellow-500/10 text-yellow-400 border border-yellow-400/20'
                            }`}
                          >
                            {s.Estado}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2 justify-end">
                          {productionTasks.filter((t: any) => t.venta_id === s.ID).length > 0 && (
                            <button
                              onClick={() => { setProgressSaleId(s.ID); setIsProgressModalOpen(true); }}
                              className="bg-cyber-purple/15 text-cyber-cyan border border-cyber-purple/40 hover:bg-cyber-cyan/15 rounded p-1.5 transition-all cursor-pointer"
                              title="Ver progreso de trabajos en el taller"
                            >
                              <Wrench className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {canPay && s['Estado Pago'] !== 'Pagado' && (
                            <button
                              onClick={() => onOpenPayModal(s.ID)}
                              className="bg-[#574400] text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/20 rounded p-1.5 transition-all cursor-pointer"
                              title="Pagar venta"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {canInvoice && (
                            <button
                              onClick={() => { setInvoiceSaleId(s.ID); setIsInvoiceModalOpen(true); fetchInvoiceData(s.ID); }}
                              className="bg-cyber-purple/15 text-cyber-cyan border border-cyber-purple/40 hover:bg-cyber-cyan/15 rounded p-1.5 transition-all cursor-pointer"
                              title="Ver factura de la venta"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {onDeleteSale && currentUser?.Rol === 'Admin' && (
                            <button
                              onClick={() => { if (window.confirm(`¿Eliminar venta ${s.ID}?`)) { onDeleteSale(s.ID); } }}
                              className="bg-red-950/30 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white rounded p-1.5 transition-all cursor-pointer"
                              title="Eliminar venta"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="text-center text-textD py-10">
                      Sin registros de venta en el sistema.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-cyber-purple/20 text-xs font-mono">
          <div className="text-textD">
            {totalElements > 0 ? `${totalElements} registros · Página ${currentPage + 1} de ${totalPages}` : 'Sin resultados'}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
              disabled={currentPage === 0 || isLoadingPage}
              className="px-3 py-1.5 rounded bg-cyber-purple/10 text-cyber-cyan border border-cyber-purple/30 hover:bg-cyber-purple/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5 inline" /> Anterior
            </button>
            <span className="px-3 py-1.5 text-textD">
              {currentPage + 1} / {totalPages || 1}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage >= totalPages - 1 || isLoadingPage}
              className="px-3 py-1.5 rounded bg-cyber-purple/10 text-cyber-cyan border border-cyber-purple/30 hover:bg-cyber-purple/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              Siguiente <ChevronRight className="w-3.5 h-3.5 inline" />
            </button>
          </div>
        </div>
      </div>
      </>}

      {/* ── MULTI-ITEM SALE MODAL ── */}
      {showAddModal && (
        <div className="modal-overlay open">
          <div className="modal w-full max-w-2xl bg-cyber-panel border border-cyber-purple rounded-xl text-text font-sans">
            <div className="modalHeader border-b border-cyber-purple/25 p-5 flex items-center justify-between">
              <h3 className="font-orbitron text-xs font-bold text-cyber-cyan tracking-wider uppercase flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-cyber-purple" />
                CONFECCIONAR NUEVA ORDEN DE VENTA
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-textD hover:text-red-400 text-lg cursor-pointer bg-none border-none">✕</button>
            </div>

            <form onSubmit={handleSubmitSale}>
              <div className="modalBody p-6 space-y-5 overflow-y-auto max-h-[65vh]">
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
                    <button type="button" onClick={handleAddProductToSale}
                      className="px-3 py-2.5 rounded bg-amber-600/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold uppercase tracking-wider hover:bg-amber-600 hover:text-white transition-all cursor-pointer whitespace-nowrap">
                      + Agregar
                    </button>
                  </div>
                </div>

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
                            {item.descripcion || item.tipoTrabajo}
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

                <div className="p-4 bg-cyber-bg2 border border-cyber-purple/20 rounded-lg space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-textD uppercase text-[10px] tracking-wider">Subtotal:</span>
                    <span className="text-cyber-cyan font-black text-sm font-orbitron">{fmtVal(totalSum)}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-cyber-purple/10 pt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-textD text-[10px]">Descuento:</span>
                      <input type="number" min="0" max="100" value={descuentoPct} onChange={e => setDescuentoPct(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                        className="w-16 bg-cyber-purple/10 border border-cyber-purple/30 rounded px-2 py-1 text-text text-xs text-center" />
                      <span className="text-textD text-[10px]">%</span>
                    </div>
                    <span className="text-cyber-pink font-black text-sm font-orbitron">-{fmtVal(totalSum * descuentoPct / 100)}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-cyber-purple/10 pt-2">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="isvToggleSale" checked={aplicarISV} onChange={e => setAplicarISV(e.target.checked)}
                        className="w-3.5 h-3.5 accent-amber-500 cursor-pointer" />
                      <label htmlFor="isvToggleSale" className="text-textD text-[10px] cursor-pointer select-none">ISV 15%</label>
                    </div>
                    <span className="text-cyber-pink font-black text-sm font-orbitron">{aplicarISV ? fmtVal(isvMonto) : 'L. 0.00'}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-cyber-purple/15 pt-2">
                    <span className="text-green-400 uppercase text-[10px] tracking-wider font-bold">Total{aplicarISV ? ' (+ISV)' : ''}:</span>
                    <span className="text-green-400 font-black text-base font-orbitron">{fmtVal(finalTotal)}</span>
                  </div>
                </div>

                <div className="bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 p-4 rounded-lg space-y-4">
                  <div className="font-orbitron text-[10px] font-bold tracking-widest text-emerald-400 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5" />
                    AMORTIZACIÓN / PAGO AL INSTANTE
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="field font-sans">
                      <label className="block text-[10px] uppercase mb-1 font-bold text-emerald-400">¿Registrar pago ahora?</label>
                      <div className="grid grid-cols-2 border border-emerald-500/20 rounded-lg overflow-hidden divide-x border-emerald-500/20 font-mono">
                        <label className={`text-center py-2 text-xs cursor-pointer select-none transition-all ${payNow ? 'bg-emerald-500/20 text-white font-bold' : 'text-textD bg-transparent'}`}>
                          <input type="radio" checked={payNow} onChange={() => setPayNow(true)} className="hidden" />
                          Sí
                        </label>
                        <label className={`text-center py-2 text-xs cursor-pointer select-none transition-all ${!payNow ? 'bg-red-500/20 text-white font-bold' : 'text-textD bg-transparent'}`}>
                          <input type="radio" checked={!payNow} onChange={() => setPayNow(false)} className="hidden" />
                          No
                        </label>
                      </div>
                    </div>
                    <div className="field">
                      <label className="block text-[10px] uppercase mb-1 font-bold text-emerald-400">Método de Pago</label>
                      <select
                        value={metodoPago}
                        onChange={(e: any) => setMetodoPago(e.target.value)}
                        disabled={!payNow}
                        className="w-full bg-cyber-bg border border-emerald-500/20 rounded-lg p-2 text-xs text-white disabled:opacity-30 outline-none h-[38px]"
                      >
                        <option value="Efectivo">Efectivo (Efe.)</option>
                        <option value="Tarjeta">Tarjeta (T.C.)</option>
                        <option value="Transferencia">Transferencia (ACH)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="field">
                      <label className="block text-[10px] uppercase mb-1 font-bold text-emerald-400">Monto del anticipo (L.) *</label>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={pagoInicial}
                        onChange={(e) => setPagoInicial(e.target.value)}
                        disabled={!payNow}
                        className="w-full bg-cyber-bg border border-emerald-500/20 rounded-lg p-2 text-xs text-white disabled:opacity-30 outline-none"
                      />
                    </div>
                    <div className="flex flex-col justify-end font-mono">
                      <div className="text-[9px] uppercase text-textD">Saldo por pagar restante:</div>
                      <div className={`font-orbitron font-bold text-sm ${saldoCalculado > 0 ? 'text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'text-green-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`}>
                        {fmtVal(saldoCalculado)}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1 font-sans">Condiciones complementarias / Notas</label>
                  <textarea
                    placeholder="Notas de entrega, requerimientos especiales del trabajo..."
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    className="w-full bg-cyber-purple/10 border border-cyber-purple/30 p-3 rounded text-text text-xs outline-none"
                    style={{ minHeight: '60px' }}
                  />
                </div>
              </div>

              <div className="px-6 py-4 bg-cyber-bg border-t border-b border-cyber-purple/20 flex justify-between items-center font-mono text-xs">
                <span className="text-textD uppercase text-[10px] tracking-wider">TOTAL FINAL:</span>
                <span className="text-green-400 font-black text-sm font-orbitron">{fmtVal(finalTotal)}</span>
              </div>

              <div className="modalFooter p-5 flex justify-end gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn bg-cyber-bg2 border border-cyber-purple/20 px-5 py-2.5 hover:bg-cyber-purple/10 text-text cursor-pointer"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  disabled={items.length === 0}
                  className="btn btn-primary bg-gradient-to-r from-cyber-purple to-cyber-cyan text-white font-orbitron font-bold px-6 py-3 rounded shadow-[0_0_12px_rgba(0,255,255,0.4)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  REGISTRAR VENTA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── SECONDARY NESTED WORK CONFIRMATION MODAL ── */}
      {isOpenJobModal && (
        <div className="modal-overlay open z-[60]">
          <div className="modal w-full max-w-lg bg-cyber-panel border border-cyber-purple rounded-xl text-text font-sans">
            <div className="modalHeader border-b border-cyber-purple/25 p-5 flex items-center justify-between">
              <h3 className="font-orbitron text-xs font-bold text-cyber-cyan tracking-wider uppercase flex items-center gap-2">
                <Plus className="w-4 h-4 text-cyber-purple" />
                CONFECCIONAR DETALLE DE TRABAJO
              </h3>
              <button type="button" onClick={() => setIsOpenJobModal(false)} className="text-textD hover:text-red-400 text-lg cursor-pointer bg-none border-none">✕</button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (!jobDescripcion.trim()) { alert('Debe agregar una descripción detallada del trabajo'); return; }
              const newItem: QuotationItem = {
                tipoTrabajo: jobTipoTrabajo || 'Servicio',
                precio: Number(jobPrecio) || 0,
                serviceId: jobServiceId || undefined,
                descripcion: jobDescripcion.trim(),
              };
              setItems([...items, newItem]);
              setIsOpenJobModal(false);
            }}>
              <div className="modalBody p-6 space-y-4 overflow-y-auto max-h-[70vh]">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1.5 font-sans">Tipo de Servicio *</label>
                  <div className="grid grid-cols-3 gap-2 font-mono mb-3">
                    {serviceTypes.filter(st => st.activo).map((cat) => {
                      const isActive = jobCategoria === cat.nombre;
                      return (
                        <button type="button" key={cat.id} onClick={() => { setJobCategoria(cat.nombre); setJobTipoTrabajo(cat.nombre); setJobServiceId(cat.id); setJobDescripcion(''); }}
                          className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-center transition-all cursor-pointer ${isActive ? 'bg-cyber-purple/25 border-cyber-cyan text-white font-bold' : 'bg-cyber-purple/5 border-cyber-purple/30 text-textD hover:border-cyber-purple/60 hover:bg-cyber-purple/10'}`}>
                          <span className="text-xs mb-0.5">{cat.icono || '⚙️'}</span>
                          <span className="text-[9px]">{cat.nombre}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1 font-sans">Tipo de trabajo *</label>
                  <input type="text" required placeholder="Ej. Grabado, Instalación, Corte..."
                    value={jobTipoTrabajo} onChange={(e) => setJobTipoTrabajo(e.target.value)}
                    className="w-full bg-cyber-purple/10 border border-cyber-purple/30 rounded p-3 text-text text-xs outline-none" />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-amber-400 mb-1 font-sans">Descripción detallada del trabajo *</label>
                  <textarea
                    required
                    placeholder="Ej. Instalación de rótulo para cooperativa da vivienda, Grabado de placa conmemorativa..."
                    value={jobDescripcion}
                    onChange={(e) => setJobDescripcion(e.target.value)}
                    className="w-full bg-cyber-purple/10 border border-cyber-purple/30 rounded p-3 text-text text-xs outline-none"
                    style={{ minHeight: '70px' }}
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1 font-sans">Precio *</label>
                  <input type="number" required placeholder="0.00" value={jobPrecio}
                    onChange={(e) => setJobPrecio(e.target.value)}
                    className="w-full bg-cyber-purple/10 border border-cyber-purple/30 rounded p-3 text-text text-xs outline-none" />
                </div>
              </div>

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

      {/* ── INVOICE MODAL ── */}
      {isInvoiceModalOpen && invoiceSaleId && (() => {
        const sale = sales.find(s => s.ID === invoiceSaleId);
        if (!sale) return null;
        const client = clients.find(c => c.ID === sale['Cliente ID']);
        const totalPagado = salePayments.reduce((a: number, p: any) => a + Number(p.Monto), 0);
        const saldo = Math.max(0, sale.Precio - totalPagado);
        const subTotal = invoiceItems.reduce((a: number, i: any) => a + Number(i.subtotal), 0);
        const totalIsv = invoiceItems.reduce((a: number, i: any) => a + Number(i.isv), 0);
        return (
          <div className="modal-overlay open z-[60]">
            <div className="modal w-full max-w-2xl bg-cyber-panel border border-cyber-purple rounded-xl text-text font-sans">
              <div className="modalHeader border-b border-cyber-purple/25 p-5 flex items-center justify-between">
                <h3 className="font-orbitron text-xs font-bold text-cyber-cyan tracking-wider uppercase flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyber-purple" />
                  FACTURA · {invoiceSaleId}
                </h3>
                <button onClick={() => setIsInvoiceModalOpen(false)} className="text-textD hover:text-red-400 text-lg cursor-pointer bg-none border-none">✕</button>
              </div>
              <div className="modalBody p-6 overflow-y-auto max-h-[70vh]" id="invoice-print-area">
                <div className="text-center mb-6 pb-6 border-b border-cyber-purple/20">
                  <h2 className="font-orbitron text-lg font-black text-cyber-cyan tracking-wider">EL PATRON HN</h2>
                  <p className="text-[10px] text-textD mt-1">Tecnología de Personalizados · Grabado Láser · Impresión · Rotulación</p>
                  <p className="text-[10px] text-textD">RTN: 08019015239084 · Col. Altiplano, San Pedro Sula · Tel: 9999-9999</p>
                  <p className="text-[10px] text-textD">Correo: info@elpatron.hn</p>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-6 pb-6 border-b border-cyber-purple/20 text-[11px]">
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-textD mb-1">Cliente</p>
                    <p className="font-bold text-cyber-cyan">{client?.Nombre || sale.Cliente}</p>
                    <p className="text-textD">{client?.Ciudad ? `${client.Ciudad}, ${client.Departamento || ''}` : ''}</p>
                    <p className="text-textD">RTN: {sale.RTN || 'No registrado'}</p>
                    {client?.Teléfono && <p className="text-textD">Tel: {client.Teléfono}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] uppercase tracking-wider text-textD mb-1">Factura</p>
                    <p className="font-bold text-cyber-cyan">{invoiceSaleId}</p>
                    <p className="text-textD">Fecha: {sale.Fecha}</p>
                    <p className="text-textD">Vendedor: {sale['Vendedor ID']}</p>
                  </div>
                </div>

                <table className="w-full text-[11px] mb-6">
                  <thead>
                    <tr className="border-b border-cyber-purple/20 text-[9px] uppercase tracking-wider text-textD">
                      <th className="text-left pb-2 font-semibold">Descripción</th>
                      <th className="text-right pb-2 font-semibold">Cant.</th>
                      <th className="text-right pb-2 font-semibold">P. Unit.</th>
                      <th className="text-right pb-2 font-semibold">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceItems.length > 0 ? invoiceItems.map((item: any, i: number) => (
                      <tr key={i} className="border-b border-cyber-purple/10">
                        <td className="py-2 pr-2">{item.descripcion}</td>
                        <td className="py-2 text-right">{item.cantidad}</td>
                        <td className="py-2 text-right">L {Number(item.precio_unitario).toFixed(2)}</td>
                        <td className="py-2 text-right">L {Number(item.subtotal).toFixed(2)}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={4} className="py-4 text-center text-textD text-[10px]">
                          {invoiceItems.length === 0 ? 'Cargando items...' : 'Sin items registrados'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                <div className="flex justify-end mb-6 pb-6 border-b border-cyber-purple/20">
                  <div className="text-right text-[11px] space-y-1">
                    <div className="flex justify-between gap-8">
                      <span className="text-textD">Subtotal:</span>
                      <span>L {subTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between gap-8">
                      <span className="text-textD">ISV (15%):</span>
                      <span>L {totalIsv.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between gap-8 text-base font-bold text-cyber-cyan border-t border-cyber-purple/20 pt-1 mt-1">
                      <span>TOTAL:</span>
                      <span>L {sale.Precio.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="mb-2 text-[11px]">
                  <p className="text-[9px] uppercase tracking-wider text-textD mb-2">Resumen de Pagos</p>
                  {salePayments.length > 0 ? (
                    <div className="space-y-1">
                      {salePayments.map((p: any, i: number) => (
                        <div key={i} className="flex justify-between text-textD">
                          <span>{p.fecha} · {p.metodo}</span>
                          <span>L {Number(p.monto).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-textD text-[10px]">Sin pagos registrados</p>
                  )}
                  <div className="flex justify-between mt-2 pt-2 border-t border-cyber-purple/20 font-bold">
                    <span className="text-green-400">Pagado: L {totalPagado.toFixed(2)}</span>
                    {saldo > 0 && <span className="text-red-400">Saldo: L {saldo.toFixed(2)}</span>}
                  </div>
                </div>
              </div>

              <div className="modalFooter p-5 flex justify-end gap-3 text-xs">
                <button
                  onClick={() => setIsInvoiceModalOpen(false)}
                  className="btn bg-cyber-bg2 border border-cyber-purple/20 px-5 py-2.5 hover:bg-cyber-purple/10 text-text cursor-pointer"
                >
                  CERRAR
                </button>
                <button
                  onClick={() => handleDownloadInvoicePDF(sale)}
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

      {/* ── PROGRESS MODAL ── */}
      {isProgressModalOpen && progressSaleId && (
        <div className="modal-overlay open z-[60]">
          <div className="modal w-full max-w-lg bg-cyber-panel border border-cyber-purple rounded-xl text-text font-sans">
            <div className="modalHeader border-b border-cyber-purple/25 p-5 flex items-center justify-between">
              <h3 className="font-orbitron text-xs font-bold text-cyber-cyan tracking-wider uppercase flex items-center gap-2">
                <Wrench className="w-4 h-4 text-cyber-purple" />
                PROGRESO · Venta {progressSaleId}
              </h3>
              <button onClick={() => setIsProgressModalOpen(false)} className="text-textD hover:text-red-400 text-lg cursor-pointer bg-none border-none">✕</button>
            </div>
            <div className="modalBody p-6 overflow-y-auto max-h-[60vh]">
              {(() => {
                const saleTasks = productionTasks.filter((t: any) => t.venta_id === progressSaleId);
                if (saleTasks.length === 0) {
                  return <div className="text-center py-8 text-textD text-xs">Esta venta no tiene trabajos en el taller</div>;
                }
                return (
                  <div className="space-y-3">
                    {saleTasks.map((task: any) => (
                      <div key={task.id} className="p-4 rounded-lg bg-cyber-bg2 border border-cyber-purple/20">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-cyber-cyan text-xs mb-0.5">{task.tipo}</div>
                            <div className="text-text text-xs font-mono truncate">{task.descripcion}</div>
                          </div>
                          <span className={`ml-3 px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap ${
                            task.estado === 'Completada'
                              ? 'bg-emerald-500/10 text-green-400 border border-green-400/20'
                              : task.estado === 'En Proceso'
                              ? 'bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan/20'
                              : 'bg-yellow-500/10 text-yellow-400 border border-yellow-400/20'
                          }`}>
                            {task.estado}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          {task.estado === 'Pendiente' && (
                            <button onClick={() => onUpdateTaskStatus(task.id, 'En Proceso')} className="px-2.5 py-1 rounded bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 text-[9px] font-bold uppercase tracking-wider hover:bg-cyan-600 hover:text-white transition-all cursor-pointer">Iniciar</button>
                          )}
                          {task.estado === 'En Proceso' && (
                            <button onClick={() => onUpdateTaskStatus(task.id, 'Completada')} className="px-2.5 py-1 rounded bg-green-600/20 text-green-400 border border-green-500/30 text-[9px] font-bold uppercase tracking-wider hover:bg-green-600 hover:text-white transition-all cursor-pointer">Completar</button>
                          )}
                          {task.estado === 'Completada' && (
                            <button onClick={() => onUpdateTaskStatus(task.id, 'Pendiente')} className="px-2.5 py-1 rounded bg-amber-600/20 text-amber-400 border border-amber-500/30 text-[9px] font-bold uppercase tracking-wider hover:bg-amber-600 hover:text-white transition-all cursor-pointer">Reabrir</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
            <div className="modalFooter p-5 flex justify-end">
              <button onClick={() => setIsProgressModalOpen(false)} className="btn bg-cyber-bg2 border border-cyber-purple/20 px-5 py-2.5 hover:bg-cyber-purple/10 text-text cursor-pointer text-xs">
                CERRAR
              </button>
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
}
