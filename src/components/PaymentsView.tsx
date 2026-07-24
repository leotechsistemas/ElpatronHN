import React, { useState, useEffect } from 'react';
import { Search, DollarSign, Clock, CheckCircle2, AlertTriangle, Printer, User as UserIcon, Phone, Mail, MapPin, CreditCard, TrendingDown, ArrowRight, History, Eye, Trash2, X, List, BarChart3, RotateCcw, FileText, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { Sale, Payment, Client, User, PaymentFull } from '../types';
import { api } from '../services/api';

interface PaymentsViewProps {
  sales: Sale[];
  payments: Payment[];
  clients: Client[];
  currentUser: User | null;
  onAddPayment: (payData: any) => Promise<boolean>;
  onLiquidarAllDeudas: (clientId: string, metodo: string) => Promise<boolean>;
  canPay: boolean;
  onRefreshData?: () => Promise<void>;
}

export default function PaymentsView({
  sales, payments, clients, currentUser, onAddPayment, onLiquidarAllDeudas, canPay, onRefreshData
}: PaymentsViewProps) {
  const [activeTab, setActiveTab] = useState<'debtors' | 'history'>('debtors');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [targetVentaId, setTargetVentaId] = useState('');
  const [payMonto, setPayMonto] = useState('');
  const [payMetodo, setPayMetodo] = useState<'Efectivo' | 'Tarjeta' | 'Transferencia'>('Efectivo');
  const [payObs, setPayObs] = useState('');
  const [bulkMetodo, setBulkMetodo] = useState<'Efectivo' | 'Tarjeta' | 'Transferencia'>('Efectivo');
  const [showLiquidarConfirm, setShowLiquidarConfirm] = useState(false);
  const [paymentFull, setPaymentFull] = useState<PaymentFull[]>([]);
  const [showPaymentDetail, setShowPaymentDetail] = useState<string | null>(null);
  const [showSalePayDetail, setShowSalePayDetail] = useState<string | null>(null);
  const [invoiceSaleId, setInvoiceSaleId] = useState<string | null>(null);
  const [invoiceItems, setInvoiceItems] = useState<any[]>([]);
  const [invoicePayments, setInvoicePayments] = useState<any[]>([]);
  const [activeAgingFilter, setActiveAgingFilter] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'history') {
      api.getPaymentsFull().then((res: any) => {
        if (res?.success && Array.isArray(res.data)) setPaymentFull(res.data);
      }).catch(() => {});
    }
  }, [activeTab, payments.length]);

  const fmt = (n: number) => 'L. ' + Number(n).toLocaleString('es-HN', { minimumFractionDigits: 2 });

  // Build debt map
  const debtClientsMap: Record<string, { id: string; nombre: string; totalDeuda: number; trabajos: number; email: string }> = {};
  sales.forEach(sale => {
    if (sale['Estado Pago'] === 'Pagado') return;
    const paidViaPayments = payments.filter(p => p['Venta ID'] === sale.ID).reduce((acc, p) => acc + (Number(p.Monto) || 0), 0);
    const pagoInicial = Number(sale['Pago Inicial']) || 0;
    const paid = paidViaPayments > 0 ? paidViaPayments : pagoInicial;
    const saldo = Number(sale.Precio || 0) - paid;
    if (saldo <= 0.01) return;
    const cId = sale['Cliente ID'];
    const cr = clients.find(c => c.ID === cId);
    if (!debtClientsMap[cId]) {
      debtClientsMap[cId] = { id: cId, nombre: sale.Cliente, totalDeuda: 0, trabajos: 0, email: cr?.Email || '' };
    }
    debtClientsMap[cId].totalDeuda += saldo;
    debtClientsMap[cId].trabajos++;
  });

  const debtors = Object.values(debtClientsMap).sort((a, b) => b.totalDeuda - a.totalDeuda);
  const filteredDebtors = debtors.filter(d => {
    const nameMatch = d.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    if (!nameMatch) return false;
    if (!activeAgingFilter) return true;
    const clientAging = sales.filter(s => s['Cliente ID'] === d.id).map(s => {
      const paid = payments.filter(p => p['Venta ID'] === s.ID).reduce((a, p) => a + (Number(p.Monto) || 0), 0);
      const saldo = Number(s.Precio || 0) - paid;
      if (saldo <= 0.1) return -1;
      const fecha = s.Fecha || s['Fecha Entrega'] || '';
      const parts = fecha.split('/');
      const f = parts.length === 3 ? new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0])) : new Date(fecha);
      return Math.floor((Date.now() - f.getTime()) / 864e5);
    }).filter(d => d > 0);
    if (clientAging.length === 0) return false;
    const maxDias = Math.max(...clientAging);
    if (activeAgingFilter === '0-30') return maxDias <= 30;
    if (activeAgingFilter === '31-60') return maxDias > 30 && maxDias <= 60;
    if (activeAgingFilter === '61-90') return maxDias > 60 && maxDias <= 90;
    if (activeAgingFilter === '90+') return maxDias > 90;
    return true;
  });
  const totalGlobalDeuda = debtors.reduce((acc, d) => acc + d.totalDeuda, 0);

  const selectedClient = clients.find(c => c.ID === selectedClientId);

  const parseDate = (str: string) => {
    const parts = str.split('/');
    if (parts.length === 3) return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
    return new Date(str);
  };

  const clientSales = selectedClient
    ? sales.filter(s => s['Cliente ID'] === selectedClient.ID).sort((a, b) => b.Fecha.localeCompare(a.Fecha))
    : [];

  const clientPayments = selectedClient
    ? payments.filter(p => p['Cliente ID'] === selectedClient.ID).sort((a, b) => b.Fecha.localeCompare(a.Fecha))
    : [];

  const clientDebtJobs = clientSales.map(s => {
    const paid = clientPayments.filter(p => p['Venta ID'] === s.ID).reduce((acc, p) => acc + Number(p.Monto), 0);
    const saldo = Number(s.Precio) - paid;
    const dias = Math.floor((Date.now() - parseDate(s.Fecha).getTime()) / 86400000);
    return { ...s, pagado: paid, saldo, dias };
  }).filter(s => s.saldo > 0.1);

  const totalDebt = clientDebtJobs.reduce((acc, s) => acc + s.saldo, 0);
  const totalPaid = clientPayments.reduce((acc, p) => acc + Number(p.Monto), 0);
  const totalPurchases = clientSales.reduce((acc, s) => acc + Number(s.Precio), 0);

  let ag0_30 = 0, ag31_60 = 0, ag61_90 = 0, ag90plus = 0;
  clientDebtJobs.forEach(j => {
    if (j.dias <= 30) ag0_30 += j.saldo;
    else if (j.dias <= 60) ag31_60 += j.saldo;
    else if (j.dias <= 90) ag61_90 += j.saldo;
    else ag90plus += j.saldo;
  });

  const handleOpenIndividualPay = (ventaId: string, saldo: number) => {
    setTargetVentaId(ventaId);
    setPayMonto(String(saldo.toFixed(2)));
    setPayObs('');
    setShowPayModal(true);
  };

  const handleSubmitIndividualPay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetVentaId || !payMonto || Number(payMonto) <= 0) return;
    const success = await onAddPayment({
      ventaId: targetVentaId, monto: String(payMonto), metodo: payMetodo,
      observaciones: payObs || 'Pago registrado vía panel de cobranza.', userId: currentUser?.ID || 'USR0001'
    });
    if (success) {
      setShowPayModal(false);
      if (onRefreshData) onRefreshData();
    }
  };

  const handleLiquidarTodo = async (clientId: string) => {
    const success = await onLiquidarAllDeudas(clientId, bulkMetodo);
    if (success) { setShowLiquidarConfirm(false); setSelectedClientId(null); }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!window.confirm('¿Está seguro de anular este pago? Se revertirán los saldos de las ventas afectadas.')) return;
    try {
      await api.anularPayment(paymentId);
      setShowPaymentDetail(null);
      setPaymentFull(prev => prev.map(p => p.id === paymentId ? { ...p, estado: 'Anulado' } : p));
      if (onRefreshData) onRefreshData();
    } catch (err) {
      console.error(err);
      alert('Error al anular el pago.');
    }
  };

  const fetchSaleInvoice = async (saleId: string) => {
    try {
      const [itemsRes, paysRes] = await Promise.all([
        api.getInvoiceItems(saleId),
        api.getPayments()
      ]);
      setInvoiceItems(itemsRes?.success && Array.isArray(itemsRes.data) ? itemsRes.data : []);
      const allPays = paysRes?.success && Array.isArray(paysRes.data) ? paysRes.data : [];
      setInvoicePayments(allPays.filter((p: any) => p['Venta ID'] === saleId));
    } catch {
      setInvoiceItems([]);
      setInvoicePayments([]);
    }
  };

  const generatePaymentReceipt = (payData: { ventaId: string; monto: string; metodo: string; observaciones?: string }) => {
    const doc = new jsPDF();
    const gold = [235, 180, 44] as const, dark = [28, 25, 23] as const, gray = [120, 120, 120] as const;
    doc.setFillColor(28, 25, 23); doc.rect(0, 0, 210, 45, 'F');
    doc.setFillColor(...gold); doc.rect(0, 43, 210, 3, 'F');
    doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(24);
    doc.text('EL PATRON HN', 14, 20);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(200, 200, 200);
    doc.text('Tecnología de Personalizados · Grabado Láser · Impresión · Rotulación', 14, 28);
    doc.setFontSize(10); doc.setTextColor(...gold);
    doc.text('COMPROBANTE DE PAGO', 14, 37);
    const now = new Date();
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...dark);
    doc.text(`Fecha: ${now.toLocaleDateString('es-HN')}`, 14, 60);
    doc.text(`Hora: ${now.toLocaleTimeString('es-HN')}`, 14, 67);
    doc.text(`Venta: ${payData.ventaId}`, 14, 74);
    doc.text(`Registrado por: ${currentUser?.Nombre || 'Sistema'}`, 14, 81);
    doc.setDrawColor(...gold); doc.line(14, 88, 196, 88);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
    doc.text('DETALLE DEL PAGO', 14, 98);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...gray);
    doc.text('Método de pago:', 14, 108);
    doc.setFont('helvetica', 'bold'); doc.setTextColor(...dark);
    doc.text(payData.metodo.toUpperCase(), 14, 115);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...gray);
    doc.text('Monto recibido:', 120, 108);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor(34, 197, 94);
    doc.text(fmt(Number(payData.monto)), 120, 116);
    if (payData.observaciones) {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...gray);
      doc.text('Observaciones:', 14, 130);
      doc.setFont('helvetica', 'italic'); doc.setFontSize(8); doc.setTextColor(...dark);
      doc.text(payData.observaciones, 14, 137);
    }
    doc.setDrawColor(180, 180, 180); doc.line(14, 252, 196, 252);
    doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(110, 110, 110);
    doc.text('Este documento es un comprobante de pago emitido por EL PATRON HN.', 14, 258);
    doc.text('Conserve este comprobante como respaldo de su transacción.', 14, 263);
    doc.save(`PATRON_HN_Comprobante_${payData.ventaId}.pdf`);
  };

  const generateDebtExtractPDF = (client: Client) => {
    const doc = new jsPDF();
    const gold = [235, 180, 44] as const, dark = [28, 25, 23] as const, gray = [120, 120, 120] as const, light = [200, 200, 200] as const;
    // Header
    doc.setFillColor(...dark); doc.rect(0, 0, 210, 42, 'F');
    doc.setFillColor(...gold); doc.rect(0, 40, 210, 2, 'F');
    doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(22);
    doc.text('EL PATRON HN', 14, 18);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...light);
    doc.text('Tecnologia de Personalizados · Grabado Laser · Impresion · Rotulacion', 14, 25);
    doc.setFontSize(10); doc.setTextColor(...gold);
    doc.text('EXTRACTO DE CUENTA', 14, 34);
    doc.setFontSize(7); doc.setTextColor(...light);
    doc.text(new Date().toLocaleDateString('es-HN'), 196, 34, { align: 'right' });
    // Client info
    doc.setDrawColor(...gold); doc.setLineWidth(0.3);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...dark);
    doc.text('CLIENTE', 14, 58);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...gray);
    doc.text(client.Nombre, 14, 64);
    let lineY = 64;
    if (client.Teléfono) { lineY += 5; doc.text(`Tel: ${client.Teléfono}`, 14, lineY); }
    if (client.Email) { lineY += 5; doc.text(`Email: ${client.Email}`, 14, lineY); }
    if (client.RTN) { lineY += 5; doc.text(`RTN: ${client.RTN}`, 14, lineY); }
    doc.text(`${client.Ciudad || ''}${client.Ciudad && client.Departamento ? ', ' : ''}${client.Departamento || ''}`, 14, lineY + 5);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...dark);
    doc.text('RESUMEN', 130, 58);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...gray);
    doc.text(`Deuda Total: L. ${totalDebt.toFixed(2)}`, 130, 64);
    doc.text(`Total Comprado: L. ${totalPurchases.toFixed(2)}`, 130, 70);
    doc.text(`Total Pagado: L. ${totalPaid.toFixed(2)}`, 130, 76);
    doc.text(`Cuentas Pendientes: ${clientDebtJobs.length}`, 130, 82);
    // Divider
    doc.setDrawColor(220, 215, 205); doc.line(14, lineY + 12, 196, lineY + 12);
    let curY = lineY + 20;
    // Debt table
    if (clientDebtJobs.length > 0) {
      doc.setFillColor(...dark); doc.rect(14, curY, 182, 7, 'F');
      doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(6);
      doc.text('VENTA', 18, curY + 5); doc.text('FECHA', 48, curY + 5);
      doc.text('PRODUCTO', 78, curY + 5); doc.text('DIAS', 110, curY + 5, { align: 'center' });
      doc.text('TOTAL', 130, curY + 5, { align: 'right' }); doc.text('PAGADO', 155, curY + 5, { align: 'right' });
      doc.text('SALDO', 180, curY + 5, { align: 'right' }); curY += 10;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...dark);
      clientDebtJobs.forEach((j, i) => {
        if (curY > 265) { doc.addPage(); curY = 20; }
        if (i % 2 === 0) { doc.setFillColor(248, 246, 240); doc.rect(14, curY - 3, 182, 8, 'F'); }
        doc.text(j.ID, 18, curY); doc.text(j.Fecha, 48, curY);
        const desc = (j.Producto || j['Tipo Trabajo'] || '').substring(0, 14);
        doc.text(desc, 78, curY);
        doc.text(String(j.dias), 110, curY, { align: 'center' });
        doc.text(`L. ${Number(j.Precio).toFixed(2)}`, 130, curY, { align: 'right' });
        doc.text(`L. ${j.pagado.toFixed(2)}`, 155, curY, { align: 'right' });
        doc.setFont('helvetica', 'bold'); doc.text(`L. ${j.saldo.toFixed(2)}`, 180, curY, { align: 'right' });
        doc.setFont('helvetica', 'normal');
        curY += 8;
      });
      curY += 4;
    }
    // Aging section
    if (totalDebt > 0) {
      if (curY > 240) { doc.addPage(); curY = 20; }
      doc.setDrawColor(...gold); doc.line(14, curY, 196, curY); curY += 6;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...dark);
      doc.text('EXTRACTO POR ANTIGÜEDAD', 14, curY); curY += 6;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...gray);
      const agingItems = [
        { label: '0-30 Dias', value: ag0_30, color: 'green' },
        { label: '31-60 Dias', value: ag31_60, color: 'yellow' },
        { label: '61-90 Dias', value: ag61_90, color: 'pink' },
        { label: '+90 Dias', value: ag90plus, color: 'red' },
      ];
      agingItems.forEach(a => {
        const pct = totalDebt > 0 ? Math.round((a.value / totalDebt) * 100) : 0;
        const col: [number, number, number] = a.color === 'green' ? [34, 197, 94] : a.color === 'yellow' ? [234, 179, 8] : a.color === 'pink' ? [244, 114, 182] : [239, 68, 68];
        doc.setTextColor(...col);
        doc.text(`${a.label}: L. ${a.value.toFixed(2)} (${pct}%)`, 18, curY);
        doc.setDrawColor(...col); doc.setLineWidth(3);
        doc.line(80, curY - 1, 80 + pct * 0.7, curY - 1);
        curY += 5;
      });
      curY += 4;
    }
    // Foot
    doc.setDrawColor(200, 195, 185); doc.line(14, curY + 2, 196, curY + 2);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(110, 110, 110);
    doc.text('EL PATRON HN · RTN: 08019015239084 · Col. Altiplano, San Pedro Sula · Tel: 9999-9999', 105, curY + 9, { align: 'center' });
    doc.text('Documento generado electronicamente · Extracto de cuenta al corte de la fecha', 105, curY + 13, { align: 'center' });
    doc.save(`Extracto_${client.Nombre.replace(/\s+/g, '_')}_${client.ID}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-cyber-purple/20">
        <button onClick={() => { setActiveTab('debtors'); setActiveAgingFilter(null); }}
          className={`px-5 py-3 text-[10px] font-orbitron font-bold tracking-wider uppercase transition-all cursor-pointer ${activeTab === 'debtors' ? 'text-cyber-cyan border-b-2 border-cyber-cyan' : 'text-textD hover:text-text'}`}>
          <List className="w-3.5 h-3.5 inline mr-1.5 mb-0.5" />Deudores
        </button>
        <button onClick={() => setActiveTab('history')}
          className={`px-5 py-3 text-[10px] font-orbitron font-bold tracking-wider uppercase transition-all cursor-pointer ${activeTab === 'history' ? 'text-cyber-cyan border-b-2 border-cyber-cyan' : 'text-textD hover:text-text'}`}>
          <History className="w-3.5 h-3.5 inline mr-1.5 mb-0.5" />Historial de Pagos
        </button>
      </div>

      {activeTab === 'debtors' ? <React.Fragment>
      {/* Aging KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div onClick={() => setActiveAgingFilter(activeAgingFilter === null ? null : null)}
          className="bg-cyber-panel border border-red-500/50 rounded-xl p-5 relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:bg-gradient-to-r before:from-red-500 before:to-transparent cursor-pointer hover:brightness-110 transition-all">
          <h5 className="text-[9px] text-textD tracking-wider uppercase mb-1.5">Total Cartera</h5>
          <div className="text-lg font-bold text-red-400 font-orbitron">{fmt(totalGlobalDeuda)}</div>
          <div className="text-[10px] text-textD mt-1">{debtors.length} deudores</div>
        </div>
        <div onClick={() => setActiveAgingFilter(activeAgingFilter === '0-30' ? null : '0-30')}
          className={`bg-cyber-panel border rounded-xl p-5 relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:bg-gradient-to-r before:from-green-400 before:to-transparent cursor-pointer hover:brightness-110 transition-all ${activeAgingFilter === '0-30' ? 'border-green-400 ring-1 ring-green-400/50' : 'border-green-500/30'}`}>
          <h5 className="text-[9px] text-textD tracking-wider uppercase mb-1.5">0-30 Días</h5>
          <div className="text-base font-semibold text-green-400 font-orbitron">{fmt(ag0_30)}</div>
        </div>
        <div onClick={() => setActiveAgingFilter(activeAgingFilter === '31-60' ? null : '31-60')}
          className={`bg-cyber-panel border rounded-xl p-5 relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:bg-gradient-to-r before:from-yellow-400 before:to-transparent cursor-pointer hover:brightness-110 transition-all ${activeAgingFilter === '31-60' ? 'border-yellow-400 ring-1 ring-yellow-400/50' : 'border-yellow-500/30'}`}>
          <h5 className="text-[9px] text-textD tracking-wider uppercase mb-1.5">31-60 Días</h5>
          <div className="text-base font-semibold text-yellow-500 font-orbitron">{fmt(ag31_60)}</div>
        </div>
        <div onClick={() => setActiveAgingFilter(activeAgingFilter === '61-90' ? null : '61-90')}
          className={`bg-cyber-panel border rounded-xl p-5 relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:bg-gradient-to-r before:from-pink-400 before:to-transparent cursor-pointer hover:brightness-110 transition-all ${activeAgingFilter === '61-90' ? 'border-pink-400 ring-1 ring-pink-400/50' : 'border-pink-500/30'}`}>
          <h5 className="text-[9px] text-textD tracking-wider uppercase mb-1.5">61-90 Días</h5>
          <div className="text-base font-semibold text-pink-400 font-orbitron">{fmt(ag61_90)}</div>
        </div>
        <div onClick={() => setActiveAgingFilter(activeAgingFilter === '90+' ? null : '90+')}
          className={`bg-cyber-panel border rounded-xl p-5 relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:bg-gradient-to-r before:from-red-600 before:to-transparent cursor-pointer hover:brightness-110 transition-all ${activeAgingFilter === '90+' ? 'border-red-600 ring-1 ring-red-600/50' : 'border-red-600/50'}`}>
          <h5 className="text-[9px] text-textD tracking-wider uppercase mb-1.5">+90 Días</h5>
          <div className="text-base font-bold text-red-500 font-orbitron">{fmt(ag90plus)}</div>
        </div>
      </div>

      <div className="relative w-full sm:w-80">
        <Search className="absolute left-3.5 top-3.5 text-cyber-purple w-4 h-4" />
        <input type="text" placeholder="Buscar cliente deudor..." value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-cyber-purple/10 border border-cyber-purple/40 text-text text-sm rounded-lg outline-none focus:border-cyber-cyan transition-all" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Panel — Client List */}
        <div className="xl:col-span-1 border border-cyber-purple/20 bg-cyber-panel rounded-xl overflow-hidden">
          <div className="border-b border-cyber-purple/20 px-5 py-3">
            <h4 className="font-orbitron font-bold text-xs text-cyber-cyan tracking-wider uppercase">Deudores</h4>
          </div>
          <div className="max-h-[70vh] overflow-y-auto divide-y divide-cyber-purple/10">
            {filteredDebtors.length > 0 ? filteredDebtors.map(d => {
              const isSelected = selectedClientId === d.id;
              return (
                <button key={d.id} onClick={() => setSelectedClientId(d.id)}
                  className={`w-full text-left px-4 py-3.5 hover:bg-cyber-purple/5 transition-all cursor-pointer ${isSelected ? 'bg-cyber-cyan/5 border-l-2 border-cyber-cyan' : ''}`}>
                  <div className="font-bold text-sm text-text">{d.nombre}</div>
                  <div className="flex items-center gap-3 text-[10px] text-textD mt-1">
                    <span className="font-mono">{d.id}</span>
                    <span className={`font-bold ${d.totalDeuda > 0 ? 'text-red-400' : 'text-green-400'}`}>{fmt(d.totalDeuda)}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="bg-yellow-500/10 text-yellow-400 text-[9px] px-1.5 py-0.5 rounded font-bold">{d.trabajos} trabajo(s)</span>
                  </div>
                </button>
              );
            }) : (
              <div className="text-center text-green-400 p-10 text-xs">No se reportan saldos vencidos.</div>
            )}
          </div>
        </div>

        {/* Right Panel — Client Detail */}
        <div className="xl:col-span-2 space-y-6">
          {selectedClient ? (
            <>
              {/* Client Header */}
              <div className="border border-cyber-purple/20 bg-cyber-panel rounded-xl p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-500 to-red-800 flex items-center justify-center">
                        <UserIcon className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <h2 className="font-orbitron font-bold text-lg text-text">{selectedClient.Nombre}</h2>
                        <div className="flex items-center gap-4 text-[11px] text-textD mt-1 flex-wrap">
                          <span className="font-mono text-cyber-cyan">{selectedClient.ID}</span>
                          <span className="bg-red-500/10 text-red-400 px-2 py-0.5 rounded text-[9px] font-bold">DEUDOR</span>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => generateDebtExtractPDF(selectedClient)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan/30 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-cyber-cyan hover:text-white transition-all cursor-pointer shrink-0">
                      <Printer className="w-3.5 h-3.5" />
                      DESCARGAR EXTRACTO PDF
                    </button>
                  </div>
                <div className="flex flex-wrap gap-6 mt-4 text-xs font-mono">
                  {selectedClient.Teléfono && <div className="flex items-center gap-2 text-textD"><Phone className="w-3.5 h-3.5 text-cyber-cyan" />{selectedClient.Teléfono}</div>}
                  {selectedClient.Email && <div className="flex items-center gap-2 text-textD"><Mail className="w-3.5 h-3.5 text-cyber-cyan" />{selectedClient.Email}</div>}
                  <div className="flex items-center gap-2 text-textD"><MapPin className="w-3.5 h-3.5 text-cyber-cyan" />{selectedClient.Ciudad || ''}{selectedClient.Ciudad && selectedClient.Departamento ? ', ' : ''}{selectedClient.Departamento || '—'}</div>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Deuda Total', value: fmt(totalDebt), icon: TrendingDown, color: 'text-red-400', bg: 'bg-red-500/10' },
                  { label: 'Total Comprado', value: fmt(totalPurchases), icon: DollarSign, color: 'text-cyber-cyan', bg: 'bg-cyber-cyan/10' },
                  { label: 'Total Pagado', value: fmt(totalPaid), icon: CreditCard, color: 'text-green-400', bg: 'bg-green-500/10' },
                  { label: 'Cuentas Pendientes', value: clientDebtJobs.length, icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
                ].map(c => {
                  const Icon = c.icon;
                  return <div key={c.label} className={`${c.bg} border border-cyber-purple/20 rounded-xl p-4`}>
                    <div className="flex items-center gap-3">
                      <div className={`${c.bg} p-2 rounded-lg`}><Icon className={`w-4 h-4 ${c.color}`} /></div>
                      <div>
                        <div className="text-[9px] text-textD uppercase tracking-wider font-orbitron font-bold">{c.label}</div>
                        <div className={`font-orbitron font-black text-sm ${c.color}`}>{c.value}</div>
                      </div>
                    </div>
                  </div>;
                })}
              </div>

              {/* Liquidación Total */}
              {canPay && (
                <div className="bg-red-500/5 border border-red-500/25 rounded-xl p-5">
                  <div className="font-orbitron text-[10px] font-bold tracking-widest text-red-500 mb-4">LIQUIDACIÓN TOTAL</div>
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <div className="text-[9px] text-textD uppercase">Saldo total de cartera</div>
                      <div className="text-xl font-bold font-orbitron text-red-400">{fmt(totalDebt)}</div>
                      {clientDebtJobs.length > 0 && (
                        <div className="text-[9px] text-textD mt-1">{clientDebtJobs.length} cuenta(s) pendiente(s)</div>
                      )}
                    </div>
                    {clientDebtJobs.length > 0 && (
                      <div className="flex items-center gap-2">
                        <select value={bulkMetodo} onChange={(e: any) => setBulkMetodo(e.target.value)}
                          className="bg-cyber-bg border border-red-500/20 rounded p-2 text-xs font-mono text-white outline-none">
                          <option value="Efectivo">Efectivo</option>
                          <option value="Tarjeta">Tarjeta</option>
                          <option value="Transferencia">Transferencia</option>
                        </select>
                        <button onClick={() => setShowLiquidarConfirm(true)}
                          className="px-4 py-2 bg-red-950/30 text-red-400 border border-red-500/30 rounded text-xs font-orbitron font-bold hover:bg-red-500 hover:text-white transition-all cursor-pointer">
                          LIQUIDAR TODO
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Debt Extract Table */}
              <div className="border border-cyber-purple/20 bg-cyber-panel rounded-xl overflow-hidden">
                <div className="border-b border-cyber-purple/20 px-5 py-3">
                  <h4 className="font-orbitron font-bold text-xs text-cyber-cyan tracking-wider uppercase flex items-center gap-2">
                    <TrendingDown className="w-4 h-4" /> Extracto de Deuda ({clientDebtJobs.length})
                  </h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-cyber-purple/10 text-cyber-cyan font-orbitron text-[9px] tracking-wider border-b border-cyber-purple/20">
                        <th className="px-4 py-3">VENTA</th>
                        <th className="px-4 py-3">FECHA</th>
                        <th className="px-4 py-3">PRODUCTO</th>
                        <th className="px-4 py-3 text-center">DIAS</th>
                        <th className="px-4 py-3 text-right">TOTAL</th>
                        <th className="px-4 py-3 text-right">PAGADO</th>
                        <th className="px-4 py-3 text-right">SALDO</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cyber-purple/10 font-mono text-xs">
                      {clientDebtJobs.map(j => {
                        const agingColor = j.dias > 90 ? 'text-red-500' : j.dias > 60 ? 'text-pink-400' : j.dias > 30 ? 'text-yellow-400' : 'text-green-400';
                        const pct = Math.round((j.pagado / j.Precio) * 100);
                        return <tr key={j.ID} onClick={() => { setInvoiceSaleId(j.ID); fetchSaleInvoice(j.ID); }}
                          className="hover:bg-cyber-purple/10 transition-all text-text cursor-pointer">
                          <td className="px-4 py-3.5 text-cyber-cyan font-bold">{j.ID}</td>
                          <td className="px-4 py-3.5 text-textD">{j.Fecha}</td>
                          <td className="px-4 py-3.5 font-bold">{j.Producto}</td>
                          <td className={`px-4 py-3.5 text-center font-bold ${agingColor}`}>{j.dias}</td>
                          <td className="px-4 py-3.5 text-right">{fmt(Number(j.Precio))}</td>
                          <td className="px-4 py-3.5 text-right text-green-400">{fmt(j.pagado)}</td>
                          <td className="px-4 py-3.5 text-right font-bold text-red-400">{fmt(j.saldo)}</td>
                        </tr>;
                      })}
                      {clientDebtJobs.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-green-400 text-xs">Sin deudas pendientes.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payment History */}
              {clientPayments.length > 0 && (
                <div className="border border-cyber-purple/20 bg-cyber-panel rounded-xl overflow-hidden">
                  <div className="border-b border-cyber-purple/20 px-5 py-3">
                    <h4 className="font-orbitron font-bold text-xs text-cyber-cyan tracking-wider uppercase flex items-center gap-2">
                      <DollarSign className="w-4 h-4" /> Pagos Realizados ({clientPayments.length})
                    </h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-cyber-purple/10 text-cyber-cyan font-orbitron text-[9px] tracking-wider border-b border-cyber-purple/20">
                          <th className="px-4 py-3">ID</th>
                          <th className="px-4 py-3">FECHA</th>
                          <th className="px-4 py-3">VENTA</th>
                          <th className="px-4 py-3 text-center">MÉTODO</th>
                          <th className="px-4 py-3 text-right">MONTO</th>
                          <th className="px-4 py-3">OBSERVACIONES</th>
                          <th className="px-4 py-3 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-cyber-purple/10 font-mono text-xs">
                        {clientPayments.map(p => (
                          <tr key={p.ID} className="hover:bg-cyber-purple/5 transition-all text-text">
                            <td className="px-4 py-3.5 text-cyber-cyan font-bold">{p.ID}</td>
                            <td className="px-4 py-3.5 text-textD">{p.Fecha}</td>
                            <td className="px-4 py-3.5 font-bold">{p['Venta ID']}</td>
                            <td className="px-4 py-3.5 text-center">
                              <span className="bg-cyber-purple/10 text-cyber-cyan border border-cyber-cyan/20 px-2 py-0.5 rounded text-[9px]">{p.Método.toUpperCase()}</span>
                            </td>
                            <td className="px-4 py-3.5 text-right font-bold text-green-400">{fmt(Number(p.Monto))}</td>
                            <td className="px-4 py-3.5 text-textD text-[10px] max-w-40 truncate">{p.Observaciones || '—'}</td>
                            <td className="px-4 py-3.5 text-center">
                              <button onClick={() => generatePaymentReceipt({ ventaId: p['Venta ID'], monto: String(p.Monto), metodo: p.Método, observaciones: p.Observaciones || '' })}
                                className="p-1.5 rounded bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan/20 hover:bg-cyber-cyan hover:text-white transition-all cursor-pointer" title="Comprobante">
                                <Printer className="w-3 h-3" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Extracto por Antigüedad */}
              {totalDebt > 0 && (
                <div className="border border-cyber-purple/20 bg-cyber-panel rounded-xl p-5">
                  <h4 className="font-orbitron font-bold text-xs text-cyber-cyan tracking-wider uppercase mb-1">Extracto por Antigüedad</h4>
                  <p className="text-[8px] text-textD mb-4">Distribución de la deuda por tiempo de vencimiento — útil para priorizar cobranza</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: '0-30 Días', value: ag0_30, color: 'text-green-400', bar: 'bg-green-400', desc: 'Deuda reciente, gestión normal' },
                      { label: '31-60 Días', value: ag31_60, color: 'text-yellow-400', bar: 'bg-yellow-400', desc: 'Atención requerida' },
                      { label: '61-90 Días', value: ag61_90, color: 'text-pink-400', bar: 'bg-pink-400', desc: 'Cobranza intensiva' },
                      { label: '+90 Días', value: ag90plus, color: 'text-red-500', bar: 'bg-red-500', desc: 'Riesgo de incobrabilidad' },
                    ].map(a => {
                      const pct = totalDebt > 0 ? Math.round((a.value / totalDebt) * 100) : 0;
                      return <div key={a.label} className="bg-cyber-bg2/40 border border-cyber-purple/10 rounded-lg p-3">
                        <div className="text-[9px] text-textD uppercase tracking-wider font-orbitron font-bold">{a.label}</div>
                        <div className={`font-orbitron font-black text-sm mt-1 ${a.color}`}>{fmt(a.value)}</div>
                        <div className="mt-2 bg-cyber-bg rounded-full h-1.5 overflow-hidden">
                          <div className={`${a.bar} h-full rounded-full`} style={{ width: `${pct}%` }} />
                        </div>
                        <div className="text-[9px] text-textD mt-1">{pct}%</div>
                        <div className="text-[7px] text-textD/60 mt-1">{a.desc}</div>
                      </div>;
                    })}
                  </div>
                </div>
              )}

            </>
          ) : (
            <div className="border border-cyber-purple/20 bg-cyber-panel rounded-xl flex items-center justify-center h-96">
              <div className="text-center text-textD">
                <UserIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-sm font-bold">Selecciona un cliente</p>
                <p className="text-xs mt-1">para ver su extracto de deuda</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Individual Pay Modal (lightweight, solo para el cobro) */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
          <div className="w-full max-w-sm bg-cyber-panel border border-green-500 rounded-xl">
            <div className="border-b border-green-500/20 p-5 flex items-center justify-between">
              <h3 className="font-orbitron text-xs font-bold text-green-400 tracking-wider uppercase">REGISTRAR ABONO</h3>
              <button onClick={() => setShowPayModal(false)} className="text-textD hover:text-red-400 text-lg cursor-pointer bg-none border-none">✕</button>
            </div>
            <form onSubmit={handleSubmitIndividualPay}>
              <div className="p-5 space-y-4 font-mono text-xs text-text">
                <div className="bg-green-500/10 border border-green-500/10 rounded-lg p-3 flex justify-between items-center">
                  <div>
                    <div className="text-[9px] text-textD uppercase">Venta</div>
                    <div className="font-bold text-cyber-cyan text-sm">{targetVentaId}</div>
                  </div>
                  <div>
                    <div className="text-[9px] text-textD uppercase">Saldo</div>
                    <div className="text-xs text-red-400 font-bold">
                      {fmt(Number(clientDebtJobs.find(j => j.ID === targetVentaId)?.saldo || 0))}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] uppercase mb-1 font-bold text-green-400">Monto a cobrar</label>
                    <input type="number" step="0.01" min="0.01" value={payMonto} onChange={(e: any) => setPayMonto(e.target.value)}
                      className="w-full bg-cyber-purple/10 border border-cyber-purple/30 rounded p-2.5 text-xl font-orbitron font-black text-green-400 tracking-wider [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase mb-1 font-bold text-green-400">Método</label>
                    <select value={payMetodo} onChange={(e: any) => setPayMetodo(e.target.value)}
                      className="w-full bg-cyber-purple/10 border border-cyber-purple/30 rounded p-2.5 text-text">
                      <option value="Efectivo">Efectivo</option>
                      <option value="Tarjeta">Tarjeta</option>
                      <option value="Transferencia">Transferencia</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[9px] uppercase mb-1 font-bold text-green-400">Observaciones</label>
                  <input type="text" value={payObs} onChange={e => setPayObs(e.target.value)}
                    placeholder="Factura, cheque, etc..." className="w-full bg-cyber-purple/10 border border-cyber-purple/30 rounded p-2.5 text-text" />
                </div>
              </div>
              <div className="border-t border-green-500/10 p-4 flex justify-end gap-2 text-xs">
                <button type="button" onClick={() => setShowPayModal(false)}
                  className="px-5 py-2.5 bg-gray-800 border border-gray-600/50 text-gray-300 rounded hover:bg-gray-700 hover:text-white transition-all text-[10px] font-orbitron font-bold tracking-wider cursor-pointer">CANCELAR</button>
                <button type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-green-500 text-white font-orbitron font-bold text-[10px] rounded shadow-[0_0_8px_rgba(16,185,129,0.4)] cursor-pointer">CONFIRMAR COBRO</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Liquidar Todo Confirmation Modal */}
      {showLiquidarConfirm && selectedClient && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
          <div className="w-full max-w-sm bg-cyber-panel border border-red-500/40 rounded-xl">
            <div className="border-b border-red-500/20 p-5">
              <h3 className="font-orbitron text-xs font-bold text-red-400 tracking-wider uppercase">Confirmar Liquidación Total</h3>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-red-500/5 border border-red-500/10 rounded-lg p-4 text-center">
                <div className="text-[9px] text-textD uppercase tracking-wider mb-1">Cliente</div>
                <div className="font-bold text-text text-sm">{selectedClient.Nombre}</div>
              </div>
              <div className="bg-cyber-bg border border-cyber-purple/20 rounded-lg p-4 text-center">
                <div className="text-[9px] text-textD uppercase tracking-wider mb-1">Monto Total a Cobrar</div>
                <div className="text-2xl font-orbitron font-black text-red-400">{fmt(totalDebt)}</div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-center text-[10px]">
                <div className="bg-cyber-bg2/40 border border-cyber-purple/10 rounded-lg p-2">
                  <div className="text-textD uppercase tracking-wider font-orbitron font-bold">Trabajos</div>
                  <div className="font-bold text-text text-sm">{clientDebtJobs.length}</div>
                </div>
                <div className="bg-cyber-bg2/40 border border-cyber-purple/10 rounded-lg p-2">
                  <div className="text-textD uppercase tracking-wider font-orbitron font-bold">Método</div>
                  <div className="font-bold text-cyber-cyan text-sm">{bulkMetodo}</div>
                </div>
              </div>
            </div>
            <div className="border-t border-red-500/10 p-4 flex justify-end gap-2 text-xs">
              <button onClick={() => setShowLiquidarConfirm(false)}
                className="px-5 py-2.5 bg-gray-800 border border-gray-600/50 text-gray-300 rounded hover:bg-gray-700 hover:text-white transition-all text-[10px] font-orbitron font-bold tracking-wider cursor-pointer">CANCELAR</button>
              <button onClick={() => handleLiquidarTodo(selectedClient.ID)}
                className="px-5 py-2.5 bg-gradient-to-r from-red-700 to-red-600 text-white font-orbitron font-bold text-[10px] rounded shadow-[0_0_8px_rgba(220,38,38,0.4)] cursor-pointer">
                CONFIRMAR LIQUIDACIÓN
              </button>
            </div>
          </div>
        </div>
      )}
    </React.Fragment> : (
      <div className="space-y-6">
        {/* Payment Detail Modal for history */}
        {showPaymentDetail && (() => {
          const pay = paymentFull.find(p => p.id === showPaymentDetail);
          if (!pay) return null;
          return (
            <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center" onClick={() => setShowPaymentDetail(null)}>
              <div className="w-full max-w-xl bg-cyber-panel border border-cyber-cyan/30 rounded-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                  <div className="border-b border-cyber-cyan/20 p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h3 className="font-orbitron text-xs font-bold text-cyber-cyan tracking-wider uppercase">Detalle del Pago</h3>
                      {pay.estado === 'Anulado' && (
                        <span className="text-[9px] px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/30 font-bold">ANULADO</span>
                      )}
                    </div>
                    <button onClick={() => setShowPaymentDetail(null)} className="text-textD hover:text-text cursor-pointer"><X className="w-4 h-4" /></button>
                  </div>
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-cyber-bg/40 border border-cyber-purple/10 rounded-lg p-3">
                      <div className="text-[9px] text-textD uppercase tracking-wider mb-1">ID Pago</div>
                      <div className="font-mono text-sm text-cyber-cyan font-bold">{pay.id}</div>
                    </div>
                    <div className="bg-cyber-bg/40 border border-cyber-purple/10 rounded-lg p-3">
                      <div className="text-[9px] text-textD uppercase tracking-wider mb-1">Cliente</div>
                      <div className="font-bold text-sm text-text">{pay.cliente}</div>
                    </div>
                    <div className="bg-cyber-bg/40 border border-cyber-purple/10 rounded-lg p-3">
                      <div className="text-[9px] text-textD uppercase tracking-wider mb-1">Fecha</div>
                      <div className="text-sm text-text">{pay.fecha}</div>
                    </div>
                    <div className="bg-cyber-bg/40 border border-cyber-purple/10 rounded-lg p-3">
                      <div className="text-[9px] text-textD uppercase tracking-wider mb-1">Método</div>
                      <div className="text-sm text-cyber-cyan font-semibold">{pay.metodo}</div>
                    </div>
                  </div>
                  <div className="bg-cyber-bg/40 border border-cyber-purple/10 rounded-lg p-4 text-center">
                    <div className="text-[9px] text-textD uppercase tracking-wider mb-1">Monto Total</div>
                    <div className="text-2xl font-orbitron font-black text-green-400">{fmt(pay.monto_total)}</div>
                  </div>
                  {pay.observaciones && (
                    <div className="bg-cyber-bg/40 border border-cyber-purple/10 rounded-lg p-3">
                      <div className="text-[9px] text-textD uppercase tracking-wider mb-1">Observaciones</div>
                      <div className="text-sm text-text">{pay.observaciones}</div>
                    </div>
                  )}
                  {(pay.items || []).length > 0 && (
                    <div>
                      <h4 className="font-orbitron text-[10px] font-bold text-textD tracking-wider uppercase mb-3">Ventas Asociadas</h4>
                      <table className="w-full text-[11px]">
                        <thead>
                          <tr className="border-b border-cyber-purple/10 text-textD text-[9px] tracking-wider uppercase">
                            <th className="px-3 py-2 text-left">Venta</th>
                            <th className="px-3 py-2 text-left">Producto</th>
                            <th className="px-3 py-2 text-right">Monto</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-cyber-purple/5">
                          {pay.items.map(item => (
                            <tr key={item.id} className="text-text">
                              <td className="px-3 py-2 font-mono text-cyber-cyan">{item.venta_id}</td>
                              <td className="px-3 py-2 text-textD text-[10px]">{item.producto || '—'}</td>
                              <td className="px-3 py-2 text-right font-orbitron font-bold text-green-400">{fmt(item.monto_asignado)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <div className="pt-3 border-t border-cyber-purple/10 flex justify-between items-center">
                    <button onClick={() => generatePaymentReceipt({ ventaId: pay.items?.[0]?.venta_id || '', monto: String(pay.monto_total), metodo: pay.metodo })}
                      className="px-4 py-2 bg-cyber-purple/10 border border-cyber-purple/30 text-cyber-cyan hover:bg-cyber-cyan/10 rounded text-[10px] font-orbitron font-bold tracking-wider transition-all cursor-pointer flex items-center gap-2">
                      <Printer className="w-3.5 h-3.5" /> IMPRIMIR
                    </button>
                    {currentUser?.Rol === 'Admin' && pay.estado !== 'Anulado' && (
                      <button onClick={() => handleDeletePayment(pay.id)}
                        className="px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white rounded text-[10px] font-orbitron font-bold tracking-wider transition-all cursor-pointer">
                        ANULAR PAGO
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
        {/* Payment History Table */}
        {paymentFull.length > 0 ? (
          <div className="border border-cyber-purple/20 bg-cyber-panel rounded-xl overflow-hidden">
            <div className="border-b border-cyber-purple/20 px-5 py-3">
              <h4 className="font-orbitron font-bold text-xs text-cyber-cyan tracking-wider uppercase">Historial de Pagos</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b border-cyber-purple/10 text-textD text-[9px] tracking-wider uppercase">
                    <th className="px-4 py-3 text-left">ID</th>
                    <th className="px-4 py-3 text-left">Cliente</th>
                    <th className="px-4 py-3 text-left">Detalle</th>
                    <th className="px-4 py-3 text-left">Fecha</th>
                    <th className="px-4 py-3 text-right">Monto</th>
                    <th className="px-4 py-3 text-left">Método</th>
                    <th className="px-4 py-3 text-center">Estado</th>
                    <th className="px-4 py-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyber-purple/10">
                  {paymentFull.map(p => (
                    <tr key={p.id} className="hover:bg-cyber-purple/5 transition-all text-text">
                      <td className="px-4 py-3 font-mono text-[10px] text-cyber-cyan">{p.id}</td>
                      <td className="px-4 py-3 font-semibold">{p.cliente}</td>
                      <td className="px-4 py-3 text-textD text-[10px]">
                        {p.ventas_count} trabajo(s)
                      </td>
                      <td className="px-4 py-3 text-textD">{p.fecha}</td>
                      <td className="px-4 py-3 text-right font-orbitron font-bold text-green-400">{fmt(p.monto_total)}</td>
                      <td className="px-4 py-3 text-textD">{p.metodo}</td>
                      <td className="px-4 py-3 text-center">
                        {p.estado === 'Anulado' ? (
                          <span className="text-[9px] px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/30 font-bold">ANULADO</span>
                        ) : (
                          <span className="text-[9px] px-2 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/30 font-bold">PAGADO</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => setShowPaymentDetail(p.id)}
                          className="p-1.5 text-cyber-cyan hover:text-white hover:bg-cyber-cyan/10 rounded transition-all cursor-pointer" title="Ver detalle">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => generatePaymentReceipt({ ventaId: p.items?.[0]?.venta_id || '', monto: String(p.monto_total), metodo: p.metodo })}
                          className="p-1.5 text-amber-400 hover:text-white hover:bg-amber-500/10 rounded transition-all cursor-pointer ml-1" title="Ver PDF">
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="border border-cyber-purple/20 bg-cyber-panel rounded-xl overflow-hidden">
            <div className="border-b border-cyber-purple/20 px-5 py-3">
              <h4 className="font-orbitron font-bold text-xs text-cyber-cyan tracking-wider uppercase">Historial de Pagos</h4>
            </div>
            <div className="px-5 py-10 text-center text-textD text-xs">No hay pagos registrados.</div>
          </div>
        )}
      </div>
    )}

      {/* Invoice Modal */}
      {invoiceSaleId && (() => {
        const sale = sales.find(s => s.ID === invoiceSaleId);
        if (!sale) return null;
        const client = clients.find(c => c.ID === sale['Cliente ID']);
        const totalPagado = invoicePayments.reduce((a: number, p: any) => a + Number(p.Monto || p.monto || 0), 0);
        const saldo = Math.max(0, sale.Precio - totalPagado);
        const subTotal = invoiceItems.reduce((a: number, i: any) => a + Number(i.subtotal || 0), 0);
        const totalIsv = invoiceItems.reduce((a: number, i: any) => a + (Number(i.isv || 0) || Number(i.total_linea || 0) - Number(i.subtotal || 0)), 0);
        return (
          <div className="modal-overlay open z-[60]">
            <div className="modal w-full max-w-2xl bg-cyber-panel border border-cyber-purple rounded-xl text-text font-sans">
              <div className="modalHeader border-b border-cyber-purple/25 p-5 flex items-center justify-between">
                <h3 className="font-orbitron text-xs font-bold text-cyber-cyan tracking-wider uppercase flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyber-purple" />
                  FACTURA · {invoiceSaleId}
                </h3>
                <button onClick={() => setInvoiceSaleId(null)} className="text-textD hover:text-red-400 text-lg cursor-pointer bg-none border-none">✕</button>
              </div>
              <div className="modalBody p-6 overflow-y-auto max-h-[70vh]" id="invoice-print-area">
                <div className="text-center mb-6 pb-6 border-b border-cyber-purple/20">
                  <h2 className="font-orbitron text-lg font-black text-cyber-cyan tracking-wider">EL PATRON HN</h2>
                  <p className="text-[10px] text-textD mt-1">Tecnología de Personalizados · Grabado Láser · Impresión · Rotulación</p>
                  <p className="text-[10px] text-textD">RTN: 08019015239084 · Col. Altiplano, San Pedro Sula · Tel: 9999-9999</p>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-6 pb-6 border-b border-cyber-purple/20 text-[11px]">
                  <div>
                    <p className="text-[9px] uppercase tracking-wider text-textD mb-1">Cliente</p>
                    <p className="font-bold text-cyber-cyan">{client?.Nombre || sale.Cliente}</p>
                    <p className="text-textD">RTN: {sale.RTN || 'No registrado'}</p>
                    {client?.Teléfono && <p className="text-textD">Tel: {client.Teléfono}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] uppercase tracking-wider text-textD mb-1">Factura</p>
                    <p className="font-bold text-cyber-cyan">{invoiceSaleId}</p>
                    <p className="text-textD">Fecha: {sale.Fecha}</p>
                    <p className="text-textD">Estado Pago: <span className={`font-bold ${sale['Estado Pago'] === 'Pagado' ? 'text-green-400' : 'text-red-400'}`}>{sale['Estado Pago']}</span></p>
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
                  {invoicePayments.length > 0 ? (
                    <div className="space-y-1">
                      {invoicePayments.map((p: any, i: number) => (
                        <div key={i} className="flex justify-between text-textD">
                          <span>{p.Fecha || p.fecha} · {p.Método || p.metodo}</span>
                          <span>L {Number(p.Monto ?? p.monto ?? 0).toFixed(2)}</span>
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

              <div className="modalFooter p-5 flex justify-between gap-3 text-xs">
                <div className="flex gap-3">
                  {canPay && saldo > 0 && (
                    <button onClick={() => { setInvoiceSaleId(null); handleOpenIndividualPay(invoiceSaleId, saldo); }}
                      className="px-5 py-2.5 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded font-orbitron font-bold hover:bg-emerald-600 hover:text-white transition-all cursor-pointer flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5" />
                      ABONAR
                    </button>
                  )}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => {
                    const doc = new jsPDF();
const gold = [235, 180, 44] as const, dark = [28, 25, 23] as const, gray = [120, 120, 120] as const, light = [200, 200, 200] as const, white = [255, 255, 255] as const;
                    doc.setFillColor(...dark); doc.rect(0, 0, 210, 42, 'F');
                    doc.setFillColor(...gold); doc.rect(0, 40, 210, 2, 'F');
                    doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(22);
                    doc.text('EL PATRON HN', 14, 18);
                    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...light);
                    doc.text('Tecnologia de Personalizados · Grabado Laser · Impresion · Rotulacion', 14, 25);
                    doc.setFontSize(10); doc.setTextColor(...gold);
                    doc.text(`FACTURA  ·  ${invoiceSaleId}`, 14, 34);
                    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...dark);
                    doc.text('CLIENTE', 14, 58);
                    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...gray);
                    const cliName = client?.Nombre || sale.Cliente;
                    doc.text(cliName, 14, 64);
                    if (client?.Teléfono) doc.text(`Tel: ${client.Teléfono}`, 14, 69);
                    if (sale.RTN) doc.text(`RTN: ${sale.RTN}`, 14, 74);
                    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...dark);
                    doc.text('FACTURA', 130, 58);
                    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...gray);
                    doc.text(invoiceSaleId, 130, 64);
                    doc.text(`Fecha: ${sale.Fecha}`, 130, 69);
                    doc.setDrawColor(220, 215, 205); doc.line(14, 82, 196, 82);
                    let curY = 92;
                    doc.setFillColor(...dark); doc.rect(14, curY, 182, 8, 'F');
                    doc.setTextColor(...white); doc.setFont('helvetica', 'bold'); doc.setFontSize(7);
                    doc.text('ITEM', 18, curY + 5.5); doc.text('DESCRIPCION', 35, curY + 5.5);
                    doc.text('CANT.', 120, curY + 5.5); doc.text('P. UNIT.', 145, curY + 5.5);
                    doc.text('SUBTOTAL', 192, curY + 5.5, { align: 'right' });
                    curY += 13;
                    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...dark);
                    invoiceItems.forEach((item: any, idx: number) => {
                      if (idx % 2 === 1) { doc.setFillColor(250, 248, 242); doc.rect(14, curY - 4, 182, 10, 'F'); }
                      doc.text(String(idx + 1).padStart(2, '0'), 18, curY);
                      const desc = item.descripcion || '';
                      doc.text(desc.length > 28 ? desc.substring(0, 26) + '..' : desc, 35, curY);
                      doc.text(String(item.cantidad || 1), 120, curY);
                      doc.text(`L. ${Number(item.precio_unitario).toFixed(2)}`, 145, curY);
                      doc.setFont('helvetica', 'bold');
                      doc.text(`L. ${Number(item.subtotal).toFixed(2)}`, 192, curY, { align: 'right' });
                      doc.setFont('helvetica', 'normal');
                      doc.setDrawColor(235, 230, 222); doc.line(14, curY + 4, 196, curY + 4);
                      curY += 10;
                    });
                    curY += 6;
                    const boxX = 120, boxW = 76;
                    doc.setFillColor(250, 248, 242); doc.rect(boxX, curY, boxW, totalIsv > 0 ? 28 : 20, 'F');
                    doc.setDrawColor(...gold); doc.rect(boxX, curY, boxW, totalIsv > 0 ? 28 : 20, 'S');
                    let lineY = curY + 6;
                    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...gray);
                    doc.text('Subtotal', boxX + 5, lineY); doc.text(`L. ${subTotal.toFixed(2)}`, boxX + boxW - 5, lineY, { align: 'right' }); lineY += 7;
                    if (totalIsv > 0) { doc.text('ISV 15%', boxX + 5, lineY); doc.text(`L. ${totalIsv.toFixed(2)}`, boxX + boxW - 5, lineY, { align: 'right' }); lineY += 7; }
                    doc.setDrawColor(...gold); doc.line(boxX + 5, lineY - 1, boxX + boxW - 5, lineY - 1);
                    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...dark);
                    doc.text('TOTAL', boxX + 5, lineY + 1); doc.text(`L. ${sale.Precio.toFixed(2)}`, boxX + boxW - 5, lineY + 1, { align: 'right' });
                    curY = Math.max(curY + 36, lineY + 20);
                    doc.setFillColor(245, 243, 237); doc.rect(14, curY, 182, 14, 'F');
                    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...dark);
                    doc.text('PAGADO:', 18, curY + 9); doc.text(`L. ${totalPagado.toFixed(2)}`, 65, curY + 9);
                    if (saldo > 0) {
                      doc.setTextColor(180, 60, 60);
                      doc.text('SALDO:', 120, curY + 9); doc.text(`L. ${saldo.toFixed(2)}`, 155, curY + 9);
                    } else {
                      doc.setTextColor(40, 150, 70);
                      doc.text('CANCELADO', 150, curY + 9);
                    }
                    doc.setDrawColor(200, 195, 185); doc.line(14, 275, 196, 275);
                    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...gray);
                    doc.text('EL PATRON HN · RTN: 08019015239084 · Col. Altiplano, San Pedro Sula · Tel: 9999-9999', 105, 281, { align: 'center' });
                    doc.save(`Factura_${invoiceSaleId}.pdf`);
                  }}
                    className="btn bg-amber-500/10 border border-amber-500/30 text-amber-400 px-5 py-2.5 hover:bg-amber-500 hover:text-white transition-all cursor-pointer flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    DESCARGAR PDF
                  </button>
                  <button onClick={() => window.print()}
                    className="btn bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan px-5 py-2.5 hover:bg-cyber-cyan hover:text-white transition-all cursor-pointer flex items-center gap-1.5">
                    <Printer className="w-3.5 h-3.5" />
                    IMPRIMIR
                  </button>
                  <button onClick={() => setInvoiceSaleId(null)}
                    className="btn bg-cyber-bg2 border border-cyber-purple/20 px-5 py-2.5 hover:bg-cyber-purple/10 text-text cursor-pointer">
                    CERRAR
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
