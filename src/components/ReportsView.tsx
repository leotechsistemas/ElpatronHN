import React, { useState } from 'react';
import { 
  AreaChart, TrendingUp, Calendar, ArrowDownRight, Award, BadgeIcon, 
  FileText, Download, Briefcase, Plus, AlertCircle, Percent, DollarSign, Wallet
} from 'lucide-react';
import { Sale, Payment, Client, Product } from '../types';
import { jsPDF } from 'jspdf';

interface ReportsViewProps {
  sales: Sale[];
  payments: Payment[];
  clients: Client[];
  products: Product[];
}

export default function ReportsView({
  sales,
  payments,
  clients,
  products
}: ReportsViewProps) {
  const currentYear = new Date().getFullYear();
  const currentMonthIdx = new Date().getMonth();

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthIdx); // 0-based index

  const years = [currentYear, currentYear - 1, currentYear - 2];
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const inPeriod = (fechaStr: string) => {
    let parts = fechaStr.split('/');
    let y: number, m: number;
    if (parts.length === 3) {
      y = Number(parts[2]); m = Number(parts[1]) - 1;
    } else {
      const d = new Date(fechaStr);
      if (isNaN(d.getTime())) return false;
      y = d.getFullYear(); m = d.getMonth();
    }
    if (selectedMonth === -1) return y === selectedYear;
    return y === selectedYear && m === selectedMonth;
  };

  const fSales = sales.filter(s => inPeriod(s.Fecha));
  const fPayments = payments.filter(p => inPeriod(p.Fecha) && Number(p.Monto) > 0);
  const fClients = clients.filter(c => inPeriod(c['Fecha Registro']));

  const totalSalesCount = fSales.length;
  const totalSalesSum = fSales.reduce((acc, s) => acc + Number(s.Precio || 0), 0);
  const totalCollectedSum = fPayments.reduce((acc, p) => acc + Number(p.Monto || 0), 0);
  
  // Outstanding accounts receivable in selected timeframe
  const periodReceivable = Math.max(0, totalSalesSum - totalCollectedSum);
  const ticketProm = totalSalesCount ? totalSalesSum / totalSalesCount : 0;
  
  // Categorization (by type of work done)
  const byTipo: Record<string, { count: number; total: number }> = {};
  fSales.forEach(s => {
    const t = s['Tipo Trabajo'] || 'Corte Láser General';
    if (!byTipo[t]) byTipo[t] = { count: 0, total: 0 };
    byTipo[t].count++;
    byTipo[t].total += Number(s.Precio || 0);
  });
  const sortedTipos = Object.entries(byTipo).sort((a, b) => b[1].total - a[1].total);
  const maxTipoTotal = sortedTipos[0]?.[1]?.total || 1;

  // Payments by channel in timeframe
  const byMethod = { Efectivo: 0, Tarjeta: 0, Transferencia: 0 };
  fPayments.forEach(p => {
    if (p.Método && byMethod[p.Método as keyof typeof byMethod] !== undefined) {
      byMethod[p.Método as keyof typeof byMethod] += Number(p.Monto || 0);
    }
  });

  // Top products in period
  const prodSalesMap: Record<string, { count: number; total: number }> = {};
  fSales.forEach(s => {
    if (s.Producto) {
      if (!prodSalesMap[s.Producto]) prodSalesMap[s.Producto] = { count: 0, total: 0 };
      prodSalesMap[s.Producto].count++;
      prodSalesMap[s.Producto].total += Number(s.Precio || 0);
    }
  });
  const sortedProds = Object.entries(prodSalesMap).sort((a, b) => b[1].total - a[1].total).slice(0, 5);

  const fmt = (n: number) => 'L. ' + Number(n).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // ── GENERATE PDF REPORT ──
  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const rangeText = selectedMonth === -1 ? `Año ${selectedYear}` : `${months[selectedMonth]} de ${selectedYear}`;
    
    // Header Banner
    doc.setFillColor(26, 26, 46); // Brand Deep Blue/Charcoal
    doc.rect(0, 0, 210, 38, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("EL PATRON HN", 14, 18);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(64, 224, 208); // Cyan Accent
    doc.text("SERVICIO INTEGRAL DE ACABADO, PERSONALIZADOS Y GRABADO DIGITAL LÁSER", 14, 25);
    doc.text(`AUDITORÍA FINANCIERA DE NEGOCIOS - PERIODO: ${rangeText.toUpperCase()}`, 14, 30);
    
    // Section 1: Balance Sheet
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text("1. BALANCE DE EXPLOTACIÓN Y LIQUIDEZ MENSUAL", 14, 48);
    
    doc.setDrawColor(220, 220, 220);
    doc.line(14, 51, 196, 51);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    // Subgrid data
    let curY = 60;
    const writeRow = (title: string, value: string, isBold = false) => {
      doc.setFont("helvetica", isBold ? "bold" : "normal");
      doc.text(title, 14, curY);
      doc.text(value, 150, curY, { align: 'right' });
      curY += 8;
    };
    
    writeRow("Ventas Brutas Totales (Personalizados + Catálogos):", fmt(totalSalesSum));
    writeRow("Caja Recaudado Total (Efectivo real en banco):", fmt(totalCollectedSum));
    writeRow("Cartera Activa por Cobrar (Deuda acumulada):", fmt(periodReceivable));
    writeRow("Costo de Operación Estimado (Materiales 35%):", fmt(totalSalesSum * 0.35));
    doc.setDrawColor(240, 240, 240);
    doc.line(14, curY - 2, 196, curY - 2);
    writeRow("UTILIDAD BRUTA ESTIMADA OPERACIONAL (Margen 65%):", fmt(totalSalesSum * 0.65), true);
    
    // Section 2: Breakdown of work types
    curY += 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("2. DESGLOSE PORMENORIZADO POR TIPO DE TRABAJO REALIZADO", 14, curY);
    doc.line(14, curY + 3, 196, curY + 3);
    curY += 10;

    // Table Header
    doc.setFillColor(242, 243, 248);
    doc.rect(14, curY, 182, 8, 'F');
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("TIPO DE TRABAJO / PERSONALIZADO", 18, curY + 5.5);
    doc.text("ÓRDENES", 110, curY + 5.5, { align: 'center' });
    doc.text("TOTAL VALOR FACTURADO", 192, curY + 5.5, { align: 'right' });
    
    curY += 8;
    doc.setFont("helvetica", "normal");
    
    if (sortedTipos.length > 0) {
      sortedTipos.forEach(([tipo, stats]) => {
        curY += 6;
        doc.text(tipo, 18, curY);
        doc.text(`${stats.count} órdenes`, 110, curY, { align: 'center' });
        doc.setFont("helvetica", "bold");
        doc.text(fmt(stats.total), 192, curY, { align: 'right' });
        doc.setFont("helvetica", "normal");
        
        doc.setDrawColor(240, 240, 240);
        doc.line(14, curY + 2.5, 196, curY + 2.5);
        curY += 3;
      });
    } else {
      curY += 8;
      doc.text("No se registran órdenes ni trabajos personalizados en este periodo.", 18, curY);
    }

    // Section 3: Catalog products
    if (sortedProds.length > 0 && curY < 210) {
      curY += 15;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.text("3. VENTAS DE CATÁLOGO Y PRODUCTOR COLECTADOS", 14, curY);
      doc.line(14, curY + 3, 196, curY + 3);
      curY += 10;

      doc.setFillColor(242, 243, 248);
      doc.rect(14, curY, 182, 8, 'F');
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("DESCRIPCIÓN DEL ARTÍCULO", 18, curY + 5.5);
      doc.text("DESPACHADO", 110, curY + 5.5, { align: 'center' });
      doc.text("TOTAL IMPORTADO", 192, curY + 5.5, { align: 'right' });
      
      curY += 8;
      doc.setFont("helvetica", "normal");

      sortedProds.forEach(([name, stats]) => {
        curY += 6;
        doc.text(name, 18, curY);
        doc.text(`${stats.count} unidades`, 110, curY, { align: 'center' });
        doc.setFont("helvetica", "bold");
        doc.text(fmt(stats.total), 192, curY, { align: 'right' });
        doc.setFont("helvetica", "normal");

        doc.line(14, curY + 2.5, 196, curY + 2.5);
        curY += 3;
      });
    }

    // Signature Area
    doc.setDrawColor(180, 180, 180);
    doc.line(14, 255, 196, 255);
    
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text("EL Patron HN. Sincronización continua de Trabajos Personalizados en San Pedro Sula y Tegucigalpa.", 14, 261);
    doc.text("Este balance es auditable y se genera automáticamente basándose en los registros contables activos.", 14, 265);
    
    doc.text("Validación Auditoría:", 145, 272);
    doc.line(145, 283, 192, 283);
    doc.text("Firma de Control Interno", 152, 287);

    doc.save(`PATRON_HN_Reporte_Financiero_Mensual_${selectedYear}_${selectedMonth + 1}.pdf`);
  };

  return (
    <div className="space-y-6">
      
      {/* ── SELECTOR BENTO ── */}
      <div className="panel border border-cyber-purple/20 bg-cyber-panel p-5 rounded-xl shadow-xl flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyber-cyan/10 flex items-center justify-center border border-cyber-cyan/35">
            <Calendar className="text-cyber-cyan w-5 h-5" />
          </div>
          <div>
            <h3 className="font-orbitron font-black text-sm tracking-widest text-cyber-cyan uppercase">REPORTES FINANCIEROS Y BALANCE GENERAL</h3>
            <p className="text-[10px] text-textD">Seleccione año y mes para generar desglose mercantil auditable.</p>
          </div>
        </div>

        <div className="flex gap-2.5 items-center flex-wrap">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-cyber-bg border border-cyber-purple/35 rounded-lg px-3 py-2 text-xs font-mono text-white outline-none focus:border-cyber-cyan cursor-pointer"
          >
            {years.map(y => <option value={y} key={y}>{y}</option>)}
          </select>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="bg-cyber-bg border border-cyber-purple/35 rounded-lg px-3 py-2 text-xs font-mono text-white outline-none focus:border-cyber-cyan cursor-pointer"
          >
            <option value="-1">Año Completo</option>
            {months.map((m, idx) => <option value={idx} key={idx}>{m}</option>)}
          </select>
          
          <button
            onClick={handleDownloadPDF}
            className="btn btn-primary bg-gradient-to-r from-cyber-purple to-cyber-cyan text-white hover:shadow-[0_0_15px_rgba(138,43,226,0.6)] px-4 py-2 text-xs font-bold font-orbitron rounded-lg transition-all flex items-center gap-2 cursor-pointer border-none"
          >
            <Download className="w-4 h-4" />
            EXPORTAR PDF
          </button>
        </div>
      </div>

      {/* ── STATS KPI FLASH GRID ── */}
      <div className="statsGrid grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="statCard panel bg-cyber-panel border border-cyber-cyan/30 rounded-xl p-5 relative overflow-hidden transition-all hover:border-cyber-cyan hover:shadow-[0_0_12px_rgba(0,255,255,0.15)]">
          <h5 className="statLabel text-[9px] text-textD tracking-wider uppercase">Trabajos Hechos</h5>
          <div className="statVal text-2xl font-black text-cyber-cyan font-orbitron mt-1">{totalSalesCount}</div>
          <div className="statSub text-[10px] text-textD mt-1">Órdenes registradas</div>
        </div>

        <div className="statCard panel bg-cyber-panel border border-cyber-purple/30 rounded-xl p-5 relative overflow-hidden transition-all hover:border-cyber-purple hover:shadow-[0_0_12px_rgba(138,43,226,0.15)]">
          <h5 className="statLabel text-[9px] text-textD tracking-wider uppercase">Ingresos Operativos</h5>
          <div className="statVal text-2xl font-black text-cyber-purple font-orbitron mt-1 truncate">{fmt(totalSalesSum).replace('L. ', '')}</div>
          <div className="statSub text-[10px] text-textD mt-1">Facturado bruto</div>
        </div>

        <div className="statCard panel bg-cyber-panel border border-emerald-500/30 rounded-xl p-5 relative overflow-hidden transition-all hover:border-emerald-500 hover:shadow-[0_0_12px_rgba(16,185,129,0.15)]">
          <h5 className="statLabel text-[9px] text-textD tracking-wider uppercase">Caja Real Cobrada</h5>
          <div className="statVal text-2xl font-black text-green-400 font-orbitron mt-1 truncate">{fmt(totalCollectedSum).replace('L. ', '')}</div>
          <div className="statSub text-[10px] text-textD mt-1">Liquidez líquida</div>
        </div>

        <div className="statCard panel bg-cyber-panel border border-yellow-500/30 rounded-xl p-5 relative overflow-hidden transition-all hover:border-yellow-500 hover:shadow-[0_0_12px_rgba(234,179,8,0.15)]">
          <h5 className="statLabel text-[9px] text-textD tracking-wider uppercase">Exigible Activo (Mora)</h5>
          <div className="statVal text-2xl font-black text-yellow-400 font-orbitron mt-1 truncate">{fmt(periodReceivable).replace('L. ', '')}</div>
          <div className="statSub text-[10px] text-textD mt-1">Falta recaudar</div>
        </div>
      </div>

      {/* ── GRID: BALANCE SPREADSHEET & WORK TYPES ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Real Dynamic Balance General Widget */}
        <div className="panel border border-cyber-purple/20 bg-cyber-panel rounded-xl overflow-hidden shadow-2xl">
          <div className="panelHeader bg-cyber-purple/5 border-b border-cyber-purple/20 px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-cyber-cyan" />
              <h4 className="font-orbitron font-bold text-xs text-cyber-cyan tracking-wider uppercase">📊 BALANCE GENERAL DE EXPLOTACIÓN</h4>
            </div>
            <span className="text-[10px] text-textD font-mono font-bold">Lempiras HNL</span>
          </div>
          
          <div className="panelBody p-0 divide-y divide-cyber-purple/15 font-mono text-xs">
            <div className="p-4 bg-cyber-bg2/40 flex justify-between items-center text-[11px] font-bold text-cyber-cyan tracking-wider">
              <span>CUENTA ACTIVA CONTABLE</span>
              <span>VALOR LIQUIDABLE CORRIENTE</span>
            </div>
            
            {/* Rows */}
            <div className="p-4 flex justify-between items-center">
              <span className="text-text font-bold">Activo Circulante (Efectivo & Bancos)</span>
              <span className="text-green-400 font-bold">{fmt(totalCollectedSum)}</span>
            </div>
            
            <div className="p-4 flex justify-between items-center">
              <span className="text-text font-bold">Activo Exigible (Cuentas por Cobrar Clientes)</span>
              <span className="text-yellow-400 font-bold">{fmt(periodReceivable)}</span>
            </div>

            <div className="p-4 flex justify-between items-center bg-cyber-bg2/10">
              <span className="text-textD">Ventas de Explotación Brutas (Ingresos)</span>
              <span className="text-white font-bold">{fmt(totalSalesSum)}</span>
            </div>

            <div className="p-4 flex justify-between items-center">
              <span className="text-text">Costo Estimado de Producción directos (Materias primas 35%)</span>
              <span className="text-red-400">{fmt(totalSalesSum * 0.35)}</span>
            </div>

            <div className="p-4 flex justify-between items-center bg-cyber-purple/5">
              <span className="text-cyber-cyan font-bold font-orbitron uppercase text-[10px]">Utilidad Bruta de Ejercicio Operativo (Margen 65%)</span>
              <span className="text-cyber-cyan font-black text-sm">{fmt(totalSalesSum * 0.65)}</span>
            </div>
          </div>
        </div>

        {/* Work Done Type breaks (Desglose por tipo de trabajo) */}
        <div className="panel border border-cyber-purple/20 bg-cyber-panel rounded-xl overflow-hidden shadow-2xl">
          <div className="panelHeader bg-cyber-purple/5 border-b border-cyber-purple/20 px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-cyber-cyan" />
              <h4 className="font-orbitron font-bold text-xs text-cyber-cyan tracking-wider uppercase">⚡ DESGLOSE DE TRABAJOS Y PEDIDOS PERSONALIZADOS</h4>
            </div>
            <span className="text-[10px] text-textD font-mono">VALORES SEGÚN ORDENES</span>
          </div>
          <div className="panelBody p-5 space-y-4">
            {sortedTipos.length ? (
              sortedTipos.map(([t, v]) => {
                const pct = maxTipoTotal ? Math.round((v.total / maxTipoTotal) * 100) : 0;
                return (
                  <div className="barRow flex items-center gap-4 text-xs font-mono" key={t}>
                    <span className="w-32 text-textD truncate" title={t}>{t}</span>
                    <div className="flex-1 bg-cyber-bg border border-cyber-purple/15 rounded h-3 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-cyber-purple to-cyber-cyan rounded transition-all duration-750" 
                        style={{ width: `${pct}%` }} 
                      />
                    </div>
                    <div className="w-24 text-right flex flex-col items-end">
                      <span className="font-bold text-cyber-cyan">{fmt(v.total).replace('L. ', '')}</span>
                      <span className="text-[10px] text-textD font-normal">{v.count} órdenes</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-textD p-4 text-center">Sin datos de trabajo en el período seleccionado.</p>
            )}
          </div>
        </div>

      </div>

      {/* ── ADDITIONAL DETAILS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Payments concentration */}
        <div className="panel border border-cyber-purple/20 bg-cyber-panel rounded-xl overflow-hidden shadow-2xl mr-1">
          <div className="panelHeader bg-cyber-purple/5 border-b border-cyber-purple/20 px-5 py-4">
            <h4 className="font-orbitron font-bold text-xs text-cyber-pink tracking-wider uppercase">💳 CANALES DE REVERSA Y COBRO DE CAJA</h4>
          </div>
          <div className="panelBody p-5 space-y-4">
            {Object.entries(byMethod).map(([m, val]) => {
              const maxVal = Math.max(...Object.values(byMethod)) || 1;
              const pct = Math.round((val / maxVal) * 100);
              return (
                <div className="barRow flex items-center gap-4 text-xs font-mono" key={m}>
                  <span className="w-28 text-textD">{m}</span>
                  <div className="flex-1 bg-cyber-bg border border-cyber-purple/15 rounded h-3 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-cyber-purple to-cyber-pink rounded transition-all duration-750" 
                      style={{ width: `${pct}%` }} 
                    />
                  </div>
                  <span className="w-24 text-right font-black text-green-400">{fmt(val).replace('L. ', '')}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Preference Catalog Item */}
        <div className="panel border border-cyber-purple/20 bg-cyber-panel rounded-xl overflow-hidden shadow-2xl">
          <div className="panelHeader bg-cyber-purple/5 border-b border-cyber-purple/20 px-5 py-4">
            <h4 className="font-orbitron font-bold text-xs text-cyber-cyan tracking-wider uppercase">🥇 PREFERENCIA EN MATERIALES / ARTÍCULOS</h4>
          </div>
          <div className="panelBody p-5">
            {sortedProds.length ? (
              <div className="space-y-4 font-mono text-xs">
                {sortedProds.map(([name, stat], idx) => {
                  const maxVal = sortedProds[0][1].total || 1;
                  const pct = Math.round((stat.total / maxVal) * 100);
                  return (
                    <div className="flex items-center gap-4 border-b border-cyber-purple/5 pb-2 last:border-none" key={name}>
                      <span className="w-6 font-bold text-cyber-purple font-orbitron">{idx+1}°</span>
                      <div className="flex-1">
                        <div className="text-text font-bold mb-1">{name}</div>
                        <div className="flex items-center gap-4 text-[10px] text-textD font-normal">
                          <span>Importe: <b className="text-green-400">{fmt(stat.total)}</b></span>
                          <span>Cantidad: <b>{stat.count} uds</b></span>
                        </div>
                      </div>
                      <div className="w-32 bg-cyber-bg border border-cyber-purple/10 rounded h-1.5 overflow-hidden">
                        <div className="bg-gradient-to-r from-cyber-purple to-cyber-cyan h-full rounded" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-textD font-mono py-4 text-center">Sin consumos o productos específicos en este período.</p>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
