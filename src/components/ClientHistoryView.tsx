import React, { useState } from 'react';
import { Search, User, ShoppingCart, DollarSign, AlertTriangle, FileText, Download, Phone, Mail, MapPin, CreditCard } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { Client, Sale, Payment } from '../types';

interface ClientHistoryViewProps {
  clients: Client[];
  sales: Sale[];
  payments: Payment[];
}

export default function ClientHistoryView({ clients, sales, payments }: ClientHistoryViewProps) {
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

  const generateReportPDF = () => {
    if (!selectedClient) return;
    const doc = new jsPDF();
    const gold = [235, 180, 44] as const, dark = [28, 25, 23] as const, gray = [120, 120, 120] as const;

    doc.setFillColor(28, 25, 23); doc.rect(0, 0, 210, 45, 'F');
    doc.setFillColor(...gold); doc.rect(0, 43, 210, 3, 'F');
    doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(22);
    doc.text('EL PATRON HN', 14, 20);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(200, 200, 200);
    doc.text('Tecnología de Personalizados · Grabado Láser · Impresión · Rotulación', 14, 28);
    doc.setFontSize(10); doc.setTextColor(...gold);
    doc.text('HISTORIAL DEL CLIENTE', 14, 37);

    doc.setFont('helvetica', 'bold'); doc.setFontSize(14); doc.setTextColor(...dark);
    doc.text(selectedClient.Nombre, 14, 58);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...gray);
    doc.text(`ID: ${selectedClient.ID}`, 14, 65);
    doc.text(`Tel: ${selectedClient.Teléfono || '—'}`, 14, 72);
    doc.text(`Email: ${selectedClient.Email || '—'}`, 14, 79);
    doc.text(`${selectedClient.Ciudad || ''}, ${selectedClient.Departamento || ''}`, 14, 86);
    doc.text(`Clasificación: ${selectedClient.Clasificación}`, 14, 93);

    doc.setDrawColor(...gold); doc.line(14, 100, 196, 100);

    let y = 110;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...dark);
    doc.text('RESUMEN', 14, y); y += 8;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...gray);
    doc.text(`Total compras: ${fmt(totalPurchases)}`, 20, y); y += 6;
    doc.text(`Total pagado: ${fmt(totalPaid)}`, 20, y); y += 6;
    doc.text(`Saldo pendiente: ${fmt(totalDebt)}`, 20, y); y += 6;
    doc.text(`Trabajos realizados: ${clientSales.length}`, 20, y); y += 12;

    if (clientSales.length > 0) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...dark);
      doc.text('COMPRAS REALIZADAS', 14, y); y += 8;
      doc.setDrawColor(235, 180, 44, 0.3); doc.line(14, y, 196, y); y += 5;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...gray);
      doc.text('Venta', 14, y); doc.text('Fecha', 40, y); doc.text('Producto', 65, y); doc.text('Total', 192, y, { align: 'right' }); y += 5;
      doc.setDrawColor(240, 240, 240); doc.line(14, y, 196, y); y += 4;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...dark);
      clientSales.slice(0, 20).forEach(s => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.text(s.ID, 14, y); doc.text(s.Fecha, 40, y);
        const prod = s.Producto.length > 25 ? s.Producto.substring(0, 23) + '..' : s.Producto;
        doc.text(prod, 65, y);
        doc.setFont('helvetica', 'bold'); doc.text(fmt(Number(s.Precio)), 192, y, { align: 'right' });
        doc.setFont('helvetica', 'normal');
        y += 5;
      });
      y += 6;
    }

    if (clientPayments.length > 0) {
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...dark);
      doc.text('PAGOS REGISTRADOS', 14, y); y += 8;
      doc.setDrawColor(235, 180, 44, 0.3); doc.line(14, y, 196, y); y += 5;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...gray);
      doc.text('ID', 14, y); doc.text('Fecha', 40, y); doc.text('Venta', 70, y); doc.text('Método', 110, y); doc.text('Monto', 192, y, { align: 'right' }); y += 5;
      doc.setDrawColor(240, 240, 240); doc.line(14, y, 196, y); y += 4;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...dark);
      clientPayments.slice(0, 30).forEach(p => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.text(p.ID, 14, y); doc.text(p.Fecha, 40, y); doc.text(p['Venta ID'], 70, y); doc.text(p.Método, 110, y);
        doc.setFont('helvetica', 'bold'); doc.text(fmt(Number(p.Monto)), 192, y, { align: 'right' });
        doc.setFont('helvetica', 'normal');
        y += 5;
      });
      y += 6;
    }

    if (debtSales.length > 0) {
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(239, 68, 68);
      doc.text('DEUDAS PENDIENTES', 14, y); y += 8;
      doc.setDrawColor(239, 68, 68, 0.3); doc.line(14, y, 196, y); y += 5;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...gray);
      doc.text('Venta', 14, y); doc.text('Fecha', 50, y); doc.text('Total', 120, y); doc.text('Saldo', 192, y, { align: 'right' }); y += 5;
      doc.setDrawColor(240, 240, 240); doc.line(14, y, 196, y); y += 4;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...dark);
      debtSales.forEach(s => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.text(s.ID, 14, y); doc.text(s.Fecha, 50, y); doc.text(fmt(Number(s.Precio)), 120, y);
        doc.setFont('helvetica', 'bold'); doc.setTextColor(239, 68, 68);
        doc.text(fmt(s.saldo), 192, y, { align: 'right' });
        doc.setFont('helvetica', 'normal'); doc.setTextColor(...dark);
        y += 5;
      });
    }

    doc.setDrawColor(180, 180, 180); doc.line(14, 280, 196, 280);
    doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(110, 110, 110);
    doc.text(`Reporte generado el ${new Date().toLocaleDateString('es-HN')} - EL PATRON HN`, 14, 286);

    doc.save(`PATRON_HN_Historial_${selectedClient.ID}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-3.5 text-cyber-purple w-4 h-4" />
          <input type="text" placeholder="Buscar cliente por nombre, ID o teléfono..." value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-cyber-purple/10 border border-cyber-purple/40 text-text text-sm rounded-lg outline-none focus:border-cyber-cyan transition-all" />
        </div>
        {selectedClient && (
          <button onClick={generateReportPDF}
            className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-yellow-500 text-white font-orbitron font-bold text-[10px] tracking-wider rounded-lg shadow-[0_0_12px_rgba(235,180,44,0.4)] cursor-pointer flex items-center gap-2 shrink-0">
            <Download className="w-3.5 h-3.5" /> DESCARGAR PDF
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Client List */}
        <div className="xl:col-span-1 border border-cyber-purple/20 bg-cyber-panel rounded-xl overflow-hidden">
          <div className="border-b border-cyber-purple/20 px-5 py-3">
            <h4 className="font-orbitron font-bold text-xs text-cyber-cyan tracking-wider uppercase">Clientes</h4>
          </div>
          <div className="max-h-[70vh] overflow-y-auto divide-y divide-cyber-purple/10">
            {filteredClients.map(c => (
              <button key={c.ID} onClick={() => setSelectedClient(c)}
                className={`w-full text-left px-4 py-3.5 hover:bg-cyber-purple/5 transition-all cursor-pointer ${selectedClient?.ID === c.ID ? 'bg-cyber-cyan/5 border-l-2 border-cyber-cyan' : ''}`}>
                <div className="font-bold text-sm text-text">{c.Nombre}</div>
                <div className="flex items-center gap-3 text-[10px] text-textD mt-1">
                  <span className="font-mono">{c.ID}</span>
                  {c.Teléfono && <span>{c.Teléfono}</span>}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${c.Clasificación === 'VIP' ? 'bg-amber-500/10 text-amber-400' : c.Clasificación === 'Deudor' ? 'bg-red-500/10 text-red-400' : c.Clasificación === 'Frecuente' ? 'bg-green-500/10 text-green-400' : 'bg-cyber-cyan/10 text-cyber-cyan'}`}>{c.Clasificación}</span>
                  <span className={`text-[9px] ${c.Estado === 'Activo' ? 'text-green-400' : 'text-red-400'}`}>{c.Estado}</span>
                </div>
              </button>
            ))}
            {filteredClients.length === 0 && <div className="text-center py-10 text-textD text-xs">Sin resultados.</div>}
          </div>
        </div>

        {/* Client Detail */}
        <div className="xl:col-span-2 space-y-6">
          {selectedClient ? (
            <>
              {/* Client Header */}
              <div className="border border-cyber-purple/20 bg-cyber-panel rounded-xl p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyber-purple to-indigo-600 flex items-center justify-center">
                      <User className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h2 className="font-orbitron font-bold text-lg text-text">{selectedClient.Nombre}</h2>
                      <div className="flex items-center gap-4 text-[11px] text-textD mt-1 flex-wrap">
                        <span className="font-mono text-cyber-cyan">{selectedClient.ID}</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${selectedClient.Clasificación === 'VIP' ? 'bg-amber-500/10 text-amber-400' : selectedClient.Clasificación === 'Deudor' ? 'bg-red-500/10 text-red-400' : selectedClient.Clasificación === 'Frecuente' ? 'bg-green-500/10 text-green-400' : 'bg-cyber-cyan/10 text-cyber-cyan'}`}>{selectedClient.Clasificación}</span>
                      </div>
                    </div>
                  </div>
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
                  { label: 'Compras Realizadas', value: clientSales.length, icon: ShoppingCart, color: 'text-cyber-cyan', bg: 'bg-cyber-cyan/10' },
                  { label: 'Total Comprado', value: fmt(totalPurchases), icon: DollarSign, color: 'text-green-400', bg: 'bg-green-500/10' },
                  { label: 'Total Pagado', value: fmt(totalPaid), icon: CreditCard, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                  { label: 'Deuda Actual', value: fmt(totalDebt), icon: AlertTriangle, color: totalDebt > 0 ? 'text-red-400' : 'text-green-400', bg: totalDebt > 0 ? 'bg-red-500/10' : 'bg-green-500/10' },
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

              {/* Purchase History */}
              <div className="border border-cyber-purple/20 bg-cyber-panel rounded-xl overflow-hidden">
                <div className="border-b border-cyber-purple/20 px-5 py-3">
                  <h4 className="font-orbitron font-bold text-xs text-cyber-cyan tracking-wider uppercase flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4" /> Historial de Compras ({clientSales.length})
                  </h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-cyber-purple/10 text-cyber-cyan font-orbitron text-[9px] tracking-wider border-b border-cyber-purple/20">
                        <th className="px-4 py-3">VENTA</th>
                        <th className="px-4 py-3">FECHA</th>
                        <th className="px-4 py-3">PRODUCTO</th>
                        <th className="px-4 py-3 text-center">ESTADO</th>
                        <th className="px-4 py-3 text-center">PAGO</th>
                        <th className="px-4 py-3 text-right">TOTAL</th>
                        <th className="px-4 py-3 text-right">SALDO</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cyber-purple/10 font-mono text-xs">
                      {clientSales.map(s => {
                        const paid = clientPayments.filter(p => p['Venta ID'] === s.ID).reduce((acc, p) => acc + Number(p.Monto), 0);
                        const saldo = Number(s.Precio) - paid;
                        return <tr key={s.ID} className="hover:bg-cyber-purple/5 transition-all text-text">
                          <td className="px-4 py-3.5 text-cyber-cyan font-bold">{s.ID}</td>
                          <td className="px-4 py-3.5 text-textD">{s.Fecha}</td>
                          <td className="px-4 py-3.5 font-bold">{s.Producto}</td>
                          <td className="px-4 py-3.5 text-center">
                            <span className={`text-[9px] px-2 py-0.5 rounded font-bold ${s.Estado === 'Terminado' ? 'bg-green-500/10 text-green-400' : s.Estado === 'En proceso' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-cyber-purple/10 text-cyber-cyan'}`}>{s.Estado}</span>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <span className={`text-[9px] px-2 py-0.5 rounded font-bold ${s['Estado Pago'] === 'Pagado' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>{s['Estado Pago']}</span>
                          </td>
                          <td className="px-4 py-3.5 text-right font-bold">{fmt(Number(s.Precio))}</td>
                          <td className={`px-4 py-3.5 text-right font-bold ${saldo > 0 ? 'text-red-400' : 'text-green-400'}`}>{saldo > 0 ? fmt(saldo) : '—'}</td>
                        </tr>;
                      })}
                      {clientSales.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-textD text-xs">Sin compras registradas.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payment History */}
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
                        </tr>
                      ))}
                      {clientPayments.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-textD text-xs">Sin pagos registrados.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Current Debts */}
              {debtSales.length > 0 && (
                <div className="border border-red-500/20 bg-red-500/5 rounded-xl overflow-hidden">
                  <div className="border-b border-red-500/20 px-5 py-3">
                    <h4 className="font-orbitron font-bold text-xs text-red-400 tracking-wider uppercase flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" /> Deudas Pendientes ({fmt(totalDebt)})
                    </h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-red-500/5 text-red-400 font-orbitron text-[9px] tracking-wider border-b border-red-500/10">
                          <th className="px-4 py-3">VENTA</th>
                          <th className="px-4 py-3">FECHA</th>
                          <th className="px-4 py-3">PRODUCTO</th>
                          <th className="px-4 py-3 text-right">TOTAL</th>
                          <th className="px-4 py-3 text-right">PAGADO</th>
                          <th className="px-4 py-3 text-right">SALDO</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-red-500/5 font-mono text-xs">
                        {debtSales.map(s => (
                          <tr key={s.ID} className="hover:bg-red-500/5 transition-all text-text">
                            <td className="px-4 py-3.5 text-cyber-cyan font-bold">{s.ID}</td>
                            <td className="px-4 py-3.5 text-textD">{s.Fecha}</td>
                            <td className="px-4 py-3.5 font-bold">{s.Producto}</td>
                            <td className="px-4 py-3.5 text-right text-text">{fmt(Number(s.Precio))}</td>
                            <td className="px-4 py-3.5 text-right text-green-400">{fmt(s.pagado)}</td>
                            <td className="px-4 py-3.5 text-right font-bold text-red-400">{fmt(s.saldo)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="border border-cyber-purple/20 bg-cyber-panel rounded-xl flex items-center justify-center h-96">
              <div className="text-center text-textD">
                <User className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-sm font-bold">Selecciona un cliente</p>
                <p className="text-xs mt-1">para ver su historial completo</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
