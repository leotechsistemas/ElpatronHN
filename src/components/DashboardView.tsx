import React, { useState, useMemo } from 'react';
import { ShoppingCart, DollarSign, Package, Users, AlertTriangle, MapPin, Download, TrendingUp } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { Product, Sale, Payment, Client, ProductionTask } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardViewProps {
  products: Product[];
  sales: Sale[];
  payments: Payment[];
  clients: Client[];
  productionTasks: ProductionTask[];
  onNavigate: (page: string) => void;
  canPay: boolean;
  onOpenPayModal: (saleId: string) => void;
}

export default function DashboardView({
  products,
  sales,
  payments,
  clients,
  productionTasks,
  onNavigate,
  canPay,
  onOpenPayModal
}: DashboardViewProps) {
  // Period filter state: 'all' | 'month' | 'quarter' | 'year'
  const [period, setPeriod] = useState<'all' | 'month' | 'quarter' | 'year'>('year');
  
  // Highlight state for Honduras Map
  const [hoveredDepto, setHoveredDepto] = useState<string | null>(null);
  const [selectedDepto, setSelectedDepto] = useState<string | null>('Francisco Morazan');

  // Helper date parsing func
  const parseDate = (str: string) => {
    const parts = str.split('/');
    if (parts.length === 3) {
      return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
    }
    return new Date(str);
  };

  const now = new Date();
  
  // ── FILTER BY SELECTED PERIOD ──
  const filteredSales = sales.filter(s => {
    if (period === 'all') return true;
    const saleDate = parseDate(s.Fecha);
    
    if (period === 'month') {
      return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
    } else if (period === 'quarter') {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(now.getMonth() - 3);
      return saleDate >= threeMonthsAgo;
    } else if (period === 'year') {
      return saleDate.getFullYear() === now.getFullYear();
    }
    return true;
  });

  const filteredPayments = payments.filter(p => {
    if (period === 'all') return true;
    const payDate = parseDate(p.Fecha || '');
    
    if (period === 'month') {
      return payDate.getMonth() === now.getMonth() && payDate.getFullYear() === now.getFullYear();
    } else if (period === 'quarter') {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(now.getMonth() - 3);
      return payDate >= threeMonthsAgo;
    } else if (period === 'year') {
      return payDate.getFullYear() === now.getFullYear();
    }
    return true;
  });

  // Calculate KPIs under filtered values
  const todayStr = now.toISOString().slice(0, 10);
  
  const todaySales = filteredSales.filter(s => s.Fecha.startsWith(todayStr) || s.Fecha === now.toLocaleDateString('es-HN'));
  const todaySalesCount = todaySales.length;
  const todaySalesTotal = todaySales.reduce((a, s) => a + Number(s.Precio || 0), 0);

  // Total collected cash for the period
  const totalRevenue = filteredPayments
    .filter(p => Number(p.Monto) > 0)
    .reduce((a, p) => a + Number(p.Monto || 0), 0);

  // Low stock products alert count (static database level trigger)
  const lowStockItems = products.filter(p => Number(p['Stock Actual']) <= Number(p['Alerta Stock']));
  const lowStockCount = lowStockItems.length;

  // New clients registered in selected period
  const newClientsInPeriod = clients.filter(c => {
    if (period === 'all') return true;
    const cliDate = parseDate(c['Fecha Registro'] || '');
    if (period === 'month') {
      return cliDate.getMonth() === now.getMonth() && cliDate.getFullYear() === now.getFullYear();
    } else if (period === 'quarter') {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(now.getMonth() - 3);
      return cliDate >= threeMonthsAgo;
    } else if (period === 'year') {
      return cliDate.getFullYear() === now.getFullYear();
    }
    return true;
  }).length;

  // Debts and Aging bucket calculations
  const aging = { d0_30: 0, d31_60: 0, d61_90: 0, d90plus: 0 };
  const pendingPayments: any[] = [];

  // Use all sales for overall debt, but let's highlight based on period optionally or keep overall
  sales.forEach(sale => {
    const salePays = payments.filter(p => p['Venta ID'] === sale.ID);
    const pagado = salePays.reduce((acc, p) => acc + (Number(p.Monto) || 0), 0);
    const saldo = Number(sale.Precio || 0) - pagado;
    
    if (saldo <= 0.1) return;

    const sDate = parseDate(sale.Fecha);
    const dias = Math.max(0, Math.floor((Date.now() - sDate.getTime()) / 86400000));

    if (dias <= 30) aging.d0_30 += saldo;
    else if (dias <= 60) aging.d31_60 += saldo;
    else if (dias <= 90) aging.d61_90 += saldo;
    else aging.d90plus += saldo;

    pendingPayments.push({ ...sale, saldo, dias });
  });

  const totalDeuda = Object.values(aging).reduce((a, v) => a + v, 0);

  // Production tasks filtered by period
  const filteredTasks = productionTasks.filter(t => {
    if (period === 'all') return true;
    const taskDate = new Date(t.creado_en);
    if (period === 'month') {
      return taskDate.getMonth() === now.getMonth() && taskDate.getFullYear() === now.getFullYear();
    } else if (period === 'quarter') {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(now.getMonth() - 3);
      return taskDate >= threeMonthsAgo;
    } else if (period === 'year') {
      return taskDate.getFullYear() === now.getFullYear();
    }
    return true;
  });

  // Task status counts (taller / workshop)
  const salesByStatus = {
    pendiente: filteredTasks.filter(t => t.estado === 'Pendiente').length,
    en_proceso: filteredTasks.filter(t => t.estado === 'En Proceso').length,
    terminado: filteredTasks.filter(t => t.estado === 'Completada').length,
  };

  // Payments by method for the filtered period
  const paymentsByMethod = {
    efectivo: filteredPayments.filter(p => p.Método === 'Efectivo').reduce((a, p) => a + Number(p.Monto || 0), 0),
    tarjeta: filteredPayments.filter(p => p.Método === 'Tarjeta').reduce((a, p) => a + Number(p.Monto || 0), 0),
    transferencia: filteredPayments.filter(p => p.Método === 'Transferencia').reduce((a, p) => a + Number(p.Monto || 0), 0),
  };

  // ── TREND vs PREVIOUS PERIOD ──
  const prevSales = sales.filter(s => {
    const sd = parseDate(s.Fecha);
    if (period === 'month') { const pm = new Date(); pm.setMonth(pm.getMonth() - 1); return sd.getMonth() === pm.getMonth() && sd.getFullYear() === pm.getFullYear(); }
    if (period === 'quarter') { const pq = new Date(); pq.setMonth(pq.getMonth() - 6); return sd >= pq; }
    if (period === 'year') { return sd.getFullYear() === now.getFullYear() - 1; }
    return false;
  });
  const prevPayments = payments.filter(p => { const pd = parseDate(p.Fecha || ''); if (period === 'month') { const pm = new Date(); pm.setMonth(pm.getMonth() - 1); return pd.getMonth() === pm.getMonth() && pd.getFullYear() === pm.getFullYear(); } if (period === 'quarter') { const pq = new Date(); pq.setMonth(pq.getMonth() - 6); return pd >= pq; } if (period === 'year') { return pd.getFullYear() === now.getFullYear() - 1; } return false; });
  const prevRev = prevPayments.filter(p => Number(p.Monto) > 0).reduce((a, p) => a + Number(p.Monto || 0), 0);
  const prevSalesCount = prevSales.length;
  const prevClientsCount = clients.filter(c => {
    const cd = parseDate(c['Fecha Registro'] || '');
    if (period === 'month') { const pm = new Date(); pm.setMonth(pm.getMonth() - 1); return cd.getMonth() === pm.getMonth() && cd.getFullYear() === pm.getFullYear(); }
    if (period === 'quarter') { const pq = new Date(); pq.setMonth(pq.getMonth() - 6); return cd >= pq; }
    if (period === 'year') { return cd.getFullYear() === now.getFullYear() - 1; }
    return false;
  }).length;
  const trend = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? 'up' : 'flat';
    const pct = ((curr - prev) / prev) * 100;
    return pct > 5 ? 'up' : pct < -5 ? 'down' : 'flat';
  };
  const trendPct = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? '+100%' : '0%';
    const pct = ((curr - prev) / prev) * 100;
    return (pct > 0 ? '+' : '') + pct.toFixed(0) + '%';
  };

  // Top Products calculations for the period
  const prodMap: Record<string, number> = {};
  filteredSales.forEach(s => {
    if (s.Producto) {
      prodMap[s.Producto] = (prodMap[s.Producto] || 0) + 1;
    }
  });
  const topProducts = Object.entries(prodMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  // Top Clients LTV
  const clientRanking = [...clients]
    .sort((a, b) => Number(b.LTV || 0) - Number(a.LTV || 0))
    .slice(0, 5)
    .map(c => ({ name: c.Nombre, ltv: Number(c.LTV || 0), score: Number(c['RFM Score'] || 0) }));

  // Group clients by Honduras Department for calculations
  const totalClientsWithDepto = clients.length || 1;
  const normalizeDepto = (name: string) =>
    name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const clientsByDepto: Record<string, { count: number; pct: number; clients: string[]; ltv: number }> = {};
  
  clients.forEach(c => {
    const depto = normalizeDepto(c.Departamento || 'Otro/Sin Asignar');
    if (!clientsByDepto[depto]) {
      clientsByDepto[depto] = { count: 0, pct: 0, clients: [], ltv: 0 };
    }
    clientsByDepto[depto].count += 1;
    clientsByDepto[depto].ltv += Number(c.LTV || 0);
    clientsByDepto[depto].clients.push(c.Nombre);
  });

  Object.keys(clientsByDepto).forEach(depto => {
    clientsByDepto[depto].pct = Math.round((clientsByDepto[depto].count / totalClientsWithDepto) * 100);
  });

  const departmentRanking = Object.entries(clientsByDepto)
    .sort((a, b) => b[1].count - a[1].count)
    .map(([depto, info]) => ({ depto, ...info }));

  const deptoFill = (name: string) => {
    if (hoveredDepto === name) return 'var(--cy-pink)';
    if (selectedDepto === name) return 'rgba(255,215,0,0.4)';
    return clientsByDepto[name] ? 'rgba(0, 255, 255, 0.6)' : 'rgba(138, 43, 226, 0.08)';
  };
  const deptoStroke = (name: string) => {
    if (hoveredDepto === name) return '#FF00FF';
    if (selectedDepto === name) return '#FFD700';
    return 'var(--cy-purple)';
  };
  const activeDepto = hoveredDepto || selectedDepto;
  const handleMapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const target = e.target as SVGElement;
    const depto = target.getAttribute('data-depto') || target.closest('[data-depto]')?.getAttribute('data-depto');
    if (depto) setSelectedDepto(depto);
  };

  // Format Helper
  const fmt = (n: number) => 'L. ' + Number(n).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const trendArrow = (dir: string, label: string) =>
    dir === 'up' ? <span className="text-green-400 font-bold flex items-center gap-0.5">↑ {label}</span> :
    dir === 'down' ? <span className="text-red-400 font-bold flex items-center gap-0.5">↓ {label}</span> :
    <span className="text-stone-500 flex items-center gap-0.5">→ {label}</span>;

  const renderBarRow = (label: string, val: number, max: number, isMoney = false, colorClass = '') => {
    const pct = max ? Math.round((val / max) * 100) : 0;
    return (
      <div className="barRow flex items-center gap-4 text-xs font-mono" key={label}>
        <span className="w-28 text-textD truncate" title={label}>{label}</span>
        <div className="flex-1 bg-cyber-bg2 border border-cyber-purple/10 rounded-full h-2.5 overflow-hidden">
          <div 
            className={`h-full rounded-full bg-gradient-to-r ${colorClass || 'from-cyber-purple to-cyber-cyan'} shadow-[0_0_8px_rgba(0,255,255,0.2)] transition-all duration-700`} 
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="w-16 text-right font-bold text-cyber-cyan">
          {isMoney ? val.toLocaleString('es-HN', { maximumFractionDigits: 0 }) : val}
        </span>
      </div>
    );
  };

  // ── PDF Export of dashboard data with active filters ──
  const exportDashboardPDF = () => {
    const doc = new jsPDF();
    const gold = [235, 180, 44] as const, dark = [28, 25, 23] as const, gray = [120, 120, 120] as const, goldBg = [252, 248, 235] as const;
    const periodLabel = period === 'month' ? 'Este Mes' : period === 'quarter' ? 'Trimestre' : period === 'year' ? 'Este Año' : 'Histórico';

    doc.setFillColor(28, 25, 23); doc.rect(0, 0, 210, 46, 'F');
    doc.setFillColor(...gold); doc.rect(0, 44, 210, 3, 'F');
    doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(22);
    doc.text('EL PATRON HN', 14, 20);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(200, 200, 200);
    doc.text('Reporte de Dashboard · Inteligencia de Negocio', 14, 28);
    doc.setFontSize(8); doc.setTextColor(...gold);
    doc.text(`Período: ${periodLabel} · Generado: ${new Date().toLocaleDateString('es-HN')} ${new Date().toLocaleTimeString('es-HN')}`, 14, 36);

    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(...dark);
    doc.text('Indicadores Clave', 14, 58);
    doc.setDrawColor(...gold); doc.line(14, 60, 196, 60);

    const kpiData = [
      ['Ventas en período', String(filteredSales.length)],
      ['Ingresos cobrados', fmt(totalRevenue)],
      ['Ventas de hoy', String(todaySalesCount)],
      ['Total hoy', fmt(todaySalesTotal)],
      ['Clientes nuevos', String(newClientsInPeriod)],
      ['Stock crítico', String(lowStockCount) + ' productos'],
      ['Créditos activos', String(pendingPayments.length)],
    ];

    doc.setFillColor(...goldBg);
    kpiData.forEach(([label, value], i) => {
      const y = 66 + i * 7;
      if (i % 2 === 0) doc.rect(14, y - 4, 182, 7, 'F');
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...gray);
      doc.text(label, 18, y);
      doc.setFont('helvetica', 'bold'); doc.setTextColor(...dark);
      doc.text(value, 192, y, { align: 'right' });
    });

    let y = 66 + kpiData.length * 7 + 8;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...dark);
    doc.text('Estado de Trabajos', 14, y);
    doc.setDrawColor(230, 230, 230); doc.line(14, y + 2, 196, y + 2); y += 8;
    doc.setFontSize(8.5);
    ([['Pendientes', salesByStatus.pendiente], ['En Proceso', salesByStatus.en_proceso], ['Terminados', salesByStatus.terminado]] as [string, number][]).forEach(([label, count], i) => {
      if (i % 2 === 0) { doc.setFillColor(...goldBg); doc.rect(14, y - 3, 182, 6, 'F'); }
      doc.setFont('helvetica', 'normal'); doc.setTextColor(...gray);
      doc.text(label, 18, y);
      doc.setFont('helvetica', 'bold'); doc.setTextColor(...dark);
      doc.text(String(count), 100, y);
      y += 8;
    });

    // Top Products
    if (topProducts.length > 0) {
      y += 6;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(30, 30, 30);
      doc.text('TOP PRODUCTOS / TRABAJOS', 14, y);
      doc.line(14, y + 2, 196, y + 2);
      y += 10;
      doc.setFontSize(9);
      topProducts.forEach((p, i) => {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80, 80, 80);
        doc.text(`${i + 1}. ${p.name}`, 16, y);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 30, 30);
        doc.text(`${p.count} ventas`, 160, y);
        y += 8;
        if (y > 270) { doc.addPage(); y = 20; }
      });
    }

    // Top Clients
    if (clientRanking.length > 0) {
      y += 6;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(30, 30, 30);
      doc.text('RANKING DE CLIENTES (LTV)', 14, y);
      doc.line(14, y + 2, 196, y + 2);
      y += 10;
      doc.setFontSize(9);
      clientRanking.forEach((c, i) => {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80, 80, 80);
        doc.text(`${i + 1}. ${c.name}`, 16, y);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 30, 30);
        doc.text(fmt(c.ltv), 160, y);
        y += 8;
        if (y > 270) { doc.addPage(); y = 20; }
      });
    }

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.text(`El Patron HN — Reporte Dashboard ${periodLabel} — Página ${i} de ${pageCount}`, 14, 290);
    }

    doc.save(`ElPatronHN_Dashboard_${periodLabel.replace(' ', '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* ── BI PERIOD FILTERS ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-cyber-panel border border-cyber-purple/20 p-4 rounded-xl shadow-lg">
        <div>
          <h2 className="font-orbitron font-extrabold text-sm tracking-widest text-cyber-cyan uppercase">📊 PANEL METRICAS INTELIGENCIA DE NEGOCIO</h2>
          <p className="text-[10px] text-textD mt-1">Sistema de gestión comercial — El Patron HN</p>
        </div>
        
        {/* Modern Filter Switches */}
        <div className="flex bg-cyber-bg border border-cyber-purple/35 rounded-lg overflow-hidden p-1 gap-1">
          <button
            onClick={() => setPeriod('month')}
            className={`px-3 py-1.5 text-[10px] font-bold font-orbitron tracking-wider rounded select-none transition-all cursor-pointer ${period === 'month' ? 'bg-cyber-cyan text-cyber-bg' : 'text-textD hover:text-text'}`}
          >
            ESTE MES
          </button>
          <button
            onClick={() => setPeriod('quarter')}
            className={`px-3 py-1.5 text-[10px] font-bold font-orbitron tracking-wider rounded select-none transition-all cursor-pointer ${period === 'quarter' ? 'bg-cyber-cyan text-cyber-bg' : 'text-textD hover:text-text'}`}
          >
            TRIMESTRE
          </button>
          <button
            onClick={() => setPeriod('year')}
            className={`px-3 py-1.5 text-[10px] font-bold font-orbitron tracking-wider rounded select-none transition-all cursor-pointer ${period === 'year' ? 'bg-cyber-cyan text-cyber-bg' : 'text-textD hover:text-text'}`}
          >
            ESTE AÑO
          </button>
          <button
            onClick={() => setPeriod('all')}
            className={`px-3 py-1.5 text-[10px] font-bold font-orbitron tracking-wider rounded select-none transition-all cursor-pointer ${period === 'all' ? 'bg-cyber-cyan text-cyber-bg' : 'text-textD hover:text-text'}`}
          >
            HISTÓRICO
          </button>
        </div>

        {/* PDF Export Button */}
        <button
          id="btn-export-dashboard-pdf"
          onClick={exportDashboardPDF}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyber-purple to-indigo-600 text-white font-orbitron font-bold text-[10px] tracking-wider rounded-lg shadow-[0_0_12px_rgba(138,43,226,0.4)] hover:shadow-[0_0_20px_rgba(138,43,226,0.7)] hover:scale-[1.02] transition-all cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          EXPORTAR PDF
        </button>
      </div>

      {/* ── STATS GRID KPI CARDS ── */}
      <div className="statsGrid grid grid-cols-5 gap-3">
        <div className="statCard panel bg-cyber-panel border border-cyber-cyan/35 rounded-xl p-3 relative overflow-hidden transition-all duration-300 hover:border-cyber-cyan hover:shadow-[0_0_15px_rgba(0,255,255,0.25)] before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:bg-gradient-to-r before:from-cyber-cyan before:to-transparent">
          <h5 className="statLabel text-[9px] text-textD tracking-widest uppercase mb-1 flex items-center gap-1">
            <ShoppingCart className="w-3 h-3 text-cyber-cyan" /> Ventas
          </h5>
          <div className="statVal text-lg font-black text-cyber-cyan font-orbitron tracking-tighter">{filteredSales.length}</div>
          <div className="statSub text-[10px] text-textD mt-0.5 flex items-center gap-1">{trendArrow(trend(filteredSales.length, prevSalesCount), trendPct(filteredSales.length, prevSalesCount))}</div>
        </div>
        <div className="statCard panel bg-cyber-panel border border-cyber-purple/35 rounded-xl p-3 relative overflow-hidden transition-all duration-300 hover:border-cyber-purple hover:shadow-[0_0_15px_rgba(138,43,226,0.25)] before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:bg-gradient-to-r before:from-cyber-purple before:to-transparent">
          <h5 className="statLabel text-[9px] text-textD tracking-widest uppercase mb-1 flex items-center gap-1">
            <DollarSign className="w-3 h-3 text-cyber-purple" /> Facturado
          </h5>
          <div className="statVal text-sm lg:text-base font-black text-cyber-purple font-orbitron tracking-tighter truncate">{fmt(totalRevenue).replace('L. ', '')}</div>
          <div className="statSub text-[10px] text-textD mt-0.5 flex items-center gap-1">{trendArrow(trend(totalRevenue, prevRev), trendPct(totalRevenue, prevRev))}</div>
        </div>
        <div className="statCard panel bg-cyber-panel border border-cyber-pink/35 rounded-xl p-3 relative overflow-hidden transition-all duration-300 hover:border-cyber-pink hover:shadow-[0_0_15px_rgba(255,0,255,0.25)] before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:bg-gradient-to-r before:from-cyber-pink before:to-transparent">
          <h5 className="statLabel text-[9px] text-textD tracking-widest uppercase mb-1 flex items-center gap-1">
            <Package className="w-3 h-3 text-cyber-pink" /> Inventario
          </h5>
          <div className="statVal text-lg font-black text-cyber-pink font-orbitron tracking-tighter">{lowStockCount}</div>
          <div className="statSub text-[10px] text-textD mt-0.5">Stock bajo</div>
        </div>
        <div className="statCard panel bg-cyber-panel border border-green-500/35 rounded-xl p-3 relative overflow-hidden transition-all duration-300 hover:border-green-550 hover:shadow-[0_0_15px_rgba(0,255,136,0.25)] before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:bg-gradient-to-r before:from-green-400 before:to-transparent">
          <h5 className="statLabel text-[9px] text-textD tracking-widest uppercase mb-1 flex items-center gap-1">
            <Users className="w-3 h-3 text-green-400" /> Socios
          </h5>
          <div className="statVal text-lg font-black text-green-400 font-orbitron tracking-tighter">{newClientsInPeriod}</div>
          <div className="statSub text-[10px] text-textD mt-0.5 flex items-center gap-1">{trendArrow(trend(newClientsInPeriod, prevClientsCount), trendPct(newClientsInPeriod, prevClientsCount))}</div>
        </div>
        <div className="statCard panel bg-cyber-panel border border-yellow-500/35 rounded-xl p-3 relative overflow-hidden transition-all duration-300 hover:border-yellow-500 hover:shadow-[0_0_15px_rgba(255,215,0,0.25)] before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:bg-gradient-to-r before:from-yellow-400 before:to-transparent">
          <h5 className="statLabel text-[9px] text-textD tracking-widest uppercase mb-1 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-yellow-400" /> Créditos
          </h5>
          <div className="statVal text-lg font-black text-yellow-400 font-orbitron tracking-tighter">{pendingPayments.length}</div>
          <div className="statSub text-[10px] text-textD mt-0.5">Saldo pendiente</div>
        </div>
      </div>

      {/* ── SALES OVER TIME LINE CHART ── */}
      {(() => {
        const monthlyMap: Record<string, { month: string; ventas: number; ingresos: number }> = {};
        const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
        sales.forEach(s => {
          const d = parseDate(s.Fecha);
          const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
          const label = months[d.getMonth()] + ' ' + d.getFullYear();
          if (!monthlyMap[key]) monthlyMap[key] = { month: label, ventas: 0, ingresos: 0 };
          monthlyMap[key].ventas += 1;
          monthlyMap[key].ingresos += s.Precio || 0;
        });
        const chartData = Object.entries(monthlyMap)
          .sort(([a], [b]) => a.localeCompare(b))
          .slice(-12)
          .map(([, v]) => v);
        const maxIng = Math.max(...chartData.map(d => d.ingresos), 1);
        return (
        <div className="panel border border-cyber-purple/20 bg-cyber-panel rounded-xl overflow-hidden shadow-2xl">
          <div className="panelHeader bg-cyber-purple/5 border-b border-cyber-purple/20 px-5 py-4 flex items-center justify-between">
            <h4 className="font-orbitron font-bold text-xs text-cyber-cyan tracking-wider uppercase flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-400" /> VENTAS EN EL TIEMPO
            </h4>
            <span className="text-[10px] text-textD font-mono">REAL TIME</span>
          </div>
          <div className="panelBody p-5">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(138,43,226,0.15)" />
                <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={{ stroke: 'rgba(138,43,226,0.2)' }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickFormatter={(v: number) => `L${v >= 1000 ? (v/1000).toFixed(1)+'k' : v.toFixed(0)}`} />
                <Tooltip
                  contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(138,43,226,0.3)', borderRadius: 8, color: '#e2e8f0', fontSize: 12 }}
                  formatter={(value: number, name: string) => [`L. ${value.toLocaleString('es-HN', {minimumFractionDigits:2})}`, name === 'ingresos' ? 'Ingresos' : 'Ventas']}
                />
                <Line type="monotone" dataKey="ingresos" stroke="#10b981" strokeWidth={2.5} dot={{ fill: '#10b981', r: 4 }} activeDot={{ r: 6, fill: '#34d399' }} name="ingresos" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        );
      })()}

      {/* ── HONDURAS MAP & DEMOGRAPHIC CRM CARDS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Interactive map card */}
        <div className="panel border border-cyber-purple/20 bg-cyber-panel rounded-xl overflow-hidden shadow-2xl lg:col-span-2">
          <div className="panelHeader bg-cyber-purple/5 border-b border-cyber-purple/20 px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="text-cyber-cyan w-4 h-4" />
              <h4 className="font-orbitron font-bold text-xs text-cyber-cyan tracking-wider uppercase">🗺️ MAPA TERRITORIAL DE HONDURAS (DENSIDAD DE CLIENTES)</h4>
            </div>
            <span className="text-[9px] text-textD font-mono font-bold tracking-widest bg-cyber-purple/10 border border-cyber-purple/20 px-2.5 py-0.5 rounded-full uppercase">Pase el puntero para auditar</span>
          </div>
          
          <div className="panelBody p-5 flex flex-col md:flex-row items-center gap-6">
            {/* SVG Interactive Map */}
            <div className="relative w-full md:w-1/2 flex justify-center py-4 bg-cyber-bg2/45 rounded-lg border border-cyber-purple/10">
              <svg 
                viewBox="0 0 711 522" 
                className="w-full max-w-[420px] h-auto drop-shadow-[0_4px_12px_rgba(138,43,226,0.15)]"
              >
                
                {/* Atlantida */}
                <path 
                  d="m 199.73094,176.71213 -0.22,0.56 -0.67,0.29 -1.17,1.28 -1.08,0.26 0.44,1.87 0.86,1.67 3.1,3.57 0.28,0.49 4.37,3.8 3.17,1.9 0.22,0.2 4.31,1.37 3.1,-0.16 1.24,-0.75 1.36,-1.73 0.1,-1.28 2.72,0 1.55,-0.52 0.86,-1.14 1.24,-1.41 -0.06,-0.88 4.85,1.6 2.88,0.52 10.26,3.21 7.7,1.41 0.79,0.13 5.64,0.29 4.91,1.28 3.61,-0.06 0.82,0.1 2.09,0.92 3.49,0.85 6.46,0.72 2.69,-1.01 5.92,-0.42 0.98,-0.78 0.86,-0.42 1.24,-0.39 1.39,-1.37 1.52,-0.79 0.35,1.08 1.01,-1.05 0.95,0.23 0.89,0.43 3.39,0.56 5.16,0.13 2.82,-0.49 1.74,-0.69 4.53,0 8.05,-1.08 1.55,-0.82 0,0 0.13,0.9 1.15,1 0.77,0.08 2.87,2.25 0.04,0.36 -0.92,0.16 -0.11,0.44 1,5.06 2.36,1.15 1.19,0.12 1.3,1.42 0.35,3.16 0.92,-0.08 0.46,0.55 1.34,-0.16 0.65,0.75 0.31,3.72 -0.31,0.24 0,2.25 0.27,0.59 -0.23,1.22 -1.32,0.68 -4.37,0.96 -1.31,1.49 0,0 -3.18,-0.75 -0.97,-0.72 -1.34,-0.38 -1.03,0.01 -0.3,0.62 -1.89,-0.02 -1.05,0.56 -0.81,-0.24 -0.07,0.39 -0.43,0.12 -1.43,-1.28 -2.14,0.11 -2.35,0.61 -7.51,-1.99 -6.38,2.46 -4.02,2.68 -3.13,0.87 -0.87,0.79 -4.07,-0.64 -0.5,-0.77 -0.47,-0.08 -0.58,0.15 -1.56,1.43 -1.59,-0.87 -1.15,0.13 -0.29,-2.03 -0.78,-0.15 -1.19,0.86 -1.44,-0.06 -1.73,0.61 -1.29,-0.52 -2.34,1.73 -1.95,-0.2 -3.27,0.21 -0.89,-0.29 -0.46,-0.66 -1.81,1.77 -0.97,1.56 -1.31,0.66 -0.98,1.13 -1.55,0.54 0.02,0.64 -0.78,0.63 0.02,1.41 -2.89,1.69 -1.92,0.12 -1.67,1.88 -2.04,0.16 -2.97,-0.36 -1.97,2.38 -0.21,1.29 -0.75,0.94 -0.98,-0.07 -0.6,-0.7 -1.06,0.44 -1.72,-0.02 -3.47,-1.55 -1.16,0.29 -0.52,-0.51 -1.01,0.08 -0.69,-0.94 -1.19,-0.37 -2.52,0.83 -1.09,-1.43 -1.07,0.11 -0.86,-0.63 -0.87,0.37 -1.19,1.2 -1.9,0.63 0.03,-0.26 -0.58,-0.07 -0.24,-0.46 0.2,-0.27 -0.6,0.07 0.11,-0.8 -0.89,0.4 -0.02,-0.4 -0.35,0.07 0.31,-0.48 -0.72,-0.29 -0.35,0.24 -0.32,-0.64 -0.39,0.18 -0.18,-0.72 -0.46,0.16 0.15,-0.81 -0.36,-0.91 -1.3,-0.81 0.67,-0.69 -0.88,-0.97 0.19,-0.88 -0.22,-0.58 0.52,-0.18 -0.16,-0.6 0.39,-0.08 -0.34,-0.58 0.25,-0.9 -1.54,-0.17 -1.19,-1.54 -0.45,0.5 -1.2,0.01 -1.37,1.73 -2.49,0.76 -0.47,0.51 -0.61,-0.93 -0.76,-0.13 -0.89,0.24 -0.68,0.61 -0.58,0.11 -0.45,-0.33 -1.1,0.43 0.04,0.27 -1.69,0.32 -4.36,0.23 -1.36,-0.33 -0.9,-0.93 -0.86,-1.79 -1.02,-0.28 -0.8,-1.44 -0.9,-0.25 -0.15,-0.85 -0.77,-1.21 0.14,-0.36 -0.48,-0.62 0.24,-0.38 -0.13,-0.85 -0.46,-0.97 0.25,-1.18 -0.47,-1.62 -0.02,-3.57 -1.37,-1.01 -0.25,-1.41 -0.85,0.27 0.01,-0.52 -1.66,-0.15 -0.7,-0.89 -0.77,-0.21 -0.1,-0.34 -0.46,0.06 -1.12,-1.91 -2.8,-0.44 -0.35,-0.55 0.3,-0.92 -0.15,-0.64 0,0 -0.08,-1.11 1.98,-0.11 0.18,-0.54 -0.99,-1.15 0.02,-1.58 -0.99,-1.53 -0.47,0.24 -0.47,1.37 -0.46,-0.11 0.56,-1.7 -0.78,-0.82 -0.17,-0.75 -1.24,-0.06 0.67,-1.01 -0.15,-1.61 0.55,-0.06 0.59,0.57 0.47,-0.14 0.18,-0.5 -0.4,-1.77 1.05,0.67 0.48,-0.04 -0.35,-0.48 0.14,-2.04 0.67,-0.52 -0.67,-0.65 -0.09,-0.84 1.56,-1.46 0.99,-1.48 1.13,0.45 1.06,-0.69 0.06,-1.92 0.44,-0.44 0.51,-1.92 0,0 1.04,0 0.13,0.36 0.86,-0.13 3.52,2.1 0.44,0.26 2.6,0.88 0.19,-0.2 0.79,-0.39 -0.6,1.57 0.67,0.72 0.7,0.13 0.67,-0.36 -0.03,-1.54 -0.32,-0.23 0.19,-0.56 -0.35,-1.01 0.73,0.13 0.25,-0.56 -0.28,-0.16 0.79,-0.79 0.63,-0.33 0.57,0.2 1.45,-1.08 z" 
                  {...{fill: deptoFill('Atlantida'), stroke: deptoStroke('Atlantida'), 'data-depto': 'Atlantida'}}
                  strokeWidth="1.2"
                  className="cursor-pointer transition-all duration-200 hover:opacity-90"
                    onMouseEnter={() => setHoveredDepto('Atlantida')}
                    onMouseLeave={() => setHoveredDepto(selectedDepto)}
                    onClick={() => setSelectedDepto('Atlantida')}
                  />
                  {/* Choluteca */}
                <path 
                  d="m 215.25094,479.56213 0.7,0.26 0.48,0.65 0.73,0.1 0.42,1.94 -0.1,0.39 -0.54,0.16 -0.48,1.42 -0.41,0.13 -0.09,1.88 -0.35,0.55 -0.85,-0.45 -0.22,-2.04 -0.54,-1.45 0.67,-0.19 0.38,-0.9 0.19,-1.26 -0.32,-1.07 0.33,-0.12 z m 0.44,-38.45 -0.12,-0.88 -0.62,-0.88 0.64,-1.32 -0.01,-1.96 0.77,-0.77 -0.15,-0.57 0.42,-0.59 -0.59,-0.98 -0.12,-1.93 0.38,-0.43 1.55,-0.36 2.22,0.21 1.03,0.72 1.29,0.35 0.66,-0.47 1.54,0.1 -0.12,0.77 -0.73,0.64 -0.11,0.87 -0.52,0.47 -0.05,2.01 0.8,-0.12 0.1,0.81 0.94,1.26 0.91,0.54 0.9,0.06 0.23,1.61 3.49,-0.29 0.48,0.24 1.42,-0.54 1.57,0.74 0.08,0.37 1.92,0.17 3.27,-1.01 4.82,2.24 0,0 -1.3,6.02 2.72,0.19 0.56,1.39 0.4,0.09 0.81,1.02 -0.29,1.04 0.36,0.59 0.03,1.81 1.82,1.65 1.37,-0.49 1.66,0.67 3.65,-0.84 -0.42,2.36 0.76,0.91 0.13,1.37 0.67,0.69 1.93,0.78 0.24,-0.07 0.06,-0.93 1.59,1.01 1.22,-0.7 0.56,-1.44 1.2,-0.39 0.54,0.24 1.09,-0.22 0.12,-1.77 1.48,-0.81 0.38,-0.57 -0.18,-2.04 0.55,-0.68 1.52,-1.18 1.89,-0.04 0.5,-0.7 1.17,-0.58 2.11,-2.31 1.07,-2.12 -0.16,-0.99 0.3,-2.03 0.43,0.26 0.35,1 2.37,0.06 1.66,-0.7 -0.08,0.59 0.45,0.38 3.9,-1.86 1.28,-1.71 2.26,-0.11 0.7,0.82 0.83,0.06 0.31,-1.52 1.43,-1.85 0.51,0.64 0.61,-0.42 1.41,-0.08 0,0 -1.47,2.79 -0.15,1.49 0.65,0.7 2.71,1.07 0.48,0.65 -1.81,6.04 -0.1,1.3 0.14,0.34 1.82,0.88 0.61,1.39 0.96,8.44 1.37,3.08 0.37,2.07 -0.03,1.03 -2,2.63 -0.33,1.14 0.75,1.5 2.66,0.89 0.3,0.35 0.89,5.2 -0.23,2.88 -0.22,0.54 -3.88,2.83 -1.8,0.48 -7.18,-4.58 -1.09,0.1 -4.08,1.31 -0.68,0.65 -0.72,1.6 -3.54,2.15 0.3,1.17 -0.65,2.84 -0.61,0.74 -0.01,1.46 -1.43,2.41 0.05,1.34 1.17,2.93 -0.87,0.47 0.29,0.91 -1.13,1.47 1.7,3.7 -3.89,3.54 -0.9,3.29 -0.59,0.08 -1.37,1.15 -1.5,0.23 -2.47,1.81 -1.09,-0.4 -0.66,2.01 -0.43,0.24 -1.97,0.25 -2.04,-1.46 -2.12,-0.16 -4.27,0.03 -18.08,1.52 -3.16,-0.31 -0.29,-0.33 0.28,-0.52 -0.7,-0.29 1.01,-0.68 1.01,-1.71 2.35,-0.84 0.13,-0.19 -0.38,0.03 -3.71,0.61 -3.9,-2.55 -2.66,-4.33 1.62,-0.9 1.52,-0.29 1.33,-0.94 -0.13,-0.16 -0.22,0.16 -2.5,0.71 -0.25,-0.81 -1.3,0 -0.38,-0.48 -1.14,-0.35 -1.05,-0.74 -1.27,0.45 -0.6,-0.23 -0.51,-0.16 -1.43,-0.16 0,0.45 -0.41,0.1 0.25,-2.65 -0.35,-1.26 -0.16,-0.29 0,-1.62 -1.21,-3.59 -1.01,-2.2 -0.95,-1.1 0.19,-0.74 0.76,-0.52 1.08,0.1 -0.13,-0.74 -1.2,0.16 -0.13,0 -0.32,0.29 -2.22,-2.81 -1.14,-0.71 -0.51,-0.26 -1.77,-0.81 -0.95,0.29 -0.09,-0.9 0.38,-1.26 1.17,-1.46 1.01,0.13 0.63,-0.58 0.16,-0.23 0.35,0.06 0.41,0.74 0.79,2.46 0.76,0.26 0.76,-0.42 0.41,-1.45 0.7,-0.61 0.1,-0.87 0.89,-1.29 0.25,-0.13 0.63,0.74 0.48,0.03 0.63,-0.71 -0.25,-0.35 -0.03,0.39 -0.6,0.45 -0.73,-0.74 -0.56,-0.1 -0.23,-0.27 -0.25,-0.97 -0.22,-1.12 -0.7,0.26 -0.44,-0.68 0,-1.58 1.96,0.03 0.13,-0.23 0.92,0.62 0.73,0.03 1.65,-2.01 2.35,0.16 0.57,-0.91 -0.14,-0.98 0.33,-0.51 0,0 0.31,-0.22 -0.27,-0.37 0.27,-0.48 0.27,-0.19 0.68,0.28 1.93,-0.9 0.57,-2.02 0.65,-0.69 -0.13,-1.12 0.45,-0.35 -2.92,-4.35 -0.12,-1.17 0.57,-1.39 0.18,-2.3 -3.43,-1.61 -1.08,-1.18 -1.68,-3.26 0.34,-0.75 -0.53,-0.98 -1.42,-0.55 1.82,-5.29 -1.6,-1.19 -3.08,-1.47 -0.83,-1.61 z" 
                  {...{fill: deptoFill('Choluteca'), stroke: deptoStroke('Choluteca'), 'data-depto': 'Choluteca'}}
                  strokeWidth="1.2"
                  className="cursor-pointer transition-all duration-200 hover:opacity-90"
                    onMouseEnter={() => setHoveredDepto('Choluteca')}
                    onMouseLeave={() => setHoveredDepto(selectedDepto)}
                    onClick={() => setSelectedDepto('Choluteca')}
                  />
                  {/* Colon */}
                <path 
                  d="m 382.86094,164.85213 8.46,1.67 6.05,0.59 10.11,2.62 2.79,0.92 1.52,1.15 0.35,0.33 0.44,0.62 0.35,0 0.67,-0.88 0.54,0 3.01,1.24 0.54,0.56 0.03,0.98 0.63,0.03 0.16,-0.59 7.6,4.81 11.69,4.98 2.63,0.69 3.99,0.13 1.62,-0.33 1.39,-1.18 2.22,-0.2 0.95,-0.46 9.06,0.23 5.45,-0.46 4.81,-0.95 3.45,-1.08 3.01,-1.37 6.34,-5.37 2.95,-1.87 2.63,-1.21 0.51,-0.23 2.47,-0.46 3.1,0.16 0.44,0.16 0.35,-0.1 1.93,0.62 0,0 -0.35,0.12 -0.11,0.77 0.47,107.1 0,0 -11.44,-13.14 -15.63,-3.88 -9.71,-12.54 -6.43,-9.75 -16.03,-5.87 -2.68,-1.91 -6.82,-7.19 -12.44,-6.19 -1.49,0.56 -0.64,0.93 -0.76,0.33 -1.35,-0.26 -1.37,-1.68 -0.67,-0.3 -1.13,0.8 -1.38,0.21 -0.17,0.73 0.37,1.16 -0.21,0.48 -0.79,0.52 -2.07,0.54 -2,2.2 -0.55,1.05 -1.19,-0.12 -0.87,-0.53 -1.07,0.01 -0.59,-0.88 -2.21,0.19 -0.9,0.95 0.56,2.34 -4.75,4.71 -0.34,0.21 -1.05,-0.2 -0.47,0.3 -2.02,2.28 -0.43,1.89 -0.88,0.32 -0.58,0.81 -1.17,-0.11 -0.45,0.95 -1.3,-0.1 -0.48,0.83 -1.4,-0.23 -0.58,0.51 -0.24,0.89 -1.38,0.27 -1.07,-1.24 -4.1,-0.46 -0.49,1.43 -1.33,-0.57 -1.28,1.32 -1.4,0.67 -1.38,-0.08 -0.91,0.63 -0.5,-0.02 -1.83,-0.39 -7.54,-4.63 0,0 0.09,-3.5 -1.05,-1.32 0.54,-0.94 0.93,-0.37 -0.58,-1.47 0.57,-0.52 -0.29,-0.92 0.57,-1.83 -1.34,-2.52 0.93,-0.75 -2.51,0.19 0.29,0.93 -0.45,0.15 -0.74,-0.78 -0.34,0.46 -0.91,-0.69 -0.06,-0.61 -0.86,-0.08 -0.3,-0.46 -1.51,0.09 -0.59,-0.48 -1.63,-0.04 -0.23,-0.46 -0.46,0.35 -0.34,-0.41 -3.37,0.42 -0.99,-0.18 -0.84,0.82 -3.18,0.32 -0.71,-0.47 -0.33,-0.81 -1.62,-0.83 -1.67,-1.44 -2.52,-0.75 0,0 1.31,-1.49 4.37,-0.96 1.32,-0.68 0.23,-1.22 -0.27,-0.59 0,-2.25 0.31,-0.24 -0.31,-3.72 -0.65,-0.75 -1.34,0.16 -0.46,-0.55 -0.92,0.08 -0.34,-3.16 -1.3,-1.42 -1.19,-0.12 -2.35,-1.15 -1,-5.06 0.12,-0.44 0.92,-0.16 -0.04,-0.36 -2.87,-2.25 -0.77,-0.08 -1.14,-1 -0.12,-0.9 0,0 0.92,-0.33 1.33,0.1 5.77,3.31 3.23,1.15 1.14,-0.16 1.01,-0.82 2.66,0.72 1.39,-0.06 0.95,-0.62 0.54,-0.95 1.11,-0.29 0.41,-0.62 2.5,-0.26 2.88,-1.05 1.24,-1.37 1.36,-0.59 0.86,-1.54 1.08,-0.39 0.7,-1.18 2,-1.77 1.17,-0.36 1.2,-0.85 2,-0.39 0.44,-0.46 2.34,-0.03 1.77,-0.92 1.49,-0.2 0.82,-0.79 1.24,0.59 5.26,0.3 8.74,-0.89 2.85,-1.63 2.85,-0.92 1.68,-1.96 0.98,-0.03 1.3,-1.18 0.47,-0.76 1.62,0.92 1.05,1.31 0.73,0.36 2.57,-0.72 0.92,-1.37 0.22,-0.16 0.7,-1.57 1.49,0.13 0.38,-0.43 -0.22,-1.28 -1.74,-0.46 -2.63,-1.25 -1.3,0.39 -0.13,-0.29 -0.95,-0.2 -1.24,0.72 0.13,0.52 -0.48,0.39 0.13,0.26 0.29,0.16 0.13,0.72 -1.46,0.69 -1.88,2.58 -0.6,0 0.81,-1.92 0.34,-2.13 -0.19,-1.47 -0.76,-1.21 -2.06,-0.75 -1.52,0.36 -1.36,-0.13 -0.95,0.56 -1.27,-0.03 -1.33,-1.28 -1.93,-0.82 0.19,-0.49 1.37,-0.19 z" 
                  {...{fill: deptoFill('Colon'), stroke: deptoStroke('Colon'), 'data-depto': 'Colon'}}
                  strokeWidth="1.2"
                  className="cursor-pointer transition-all duration-200 hover:opacity-90"
                  onMouseEnter={() => setHoveredDepto('Colon')}
                  onMouseLeave={() => setHoveredDepto(selectedDepto)}
                  onClick={() => setSelectedDepto('Colon')}
                />

                {/* Comayagua */}
                <path 
                  d="m 183.57094,285.26213 1.7,0.45 1.75,-0.52 0.92,0.21 0.9,-0.75 0.56,0.44 1.2,-0.79 0.47,0.12 0.37,-0.55 0.91,0.59 0.87,-0.17 0.51,0.25 0.42,-0.47 1.06,-0.04 1.22,1.31 0.52,0.17 1.19,-1.55 2.79,-0.44 0.14,-0.38 -0.8,-0.84 0.13,-0.22 0.89,-0.23 0.79,0.23 1.14,-1.6 1.14,0.12 1.08,-0.56 1.14,1.22 0.64,0.01 0.73,0.63 0.25,0.81 0.98,1.11 0.5,1.27 -0.41,0.52 0.1,2.02 0.79,0.66 0.05,0.82 1.05,0.81 1.04,-0.13 -0.23,1.03 1.39,-0.07 -0.1,0.83 0.38,1.21 -0.45,0.93 0.45,0.87 0.74,0.31 -0.64,1.02 0.55,0.36 -0.23,1.26 0.52,0.69 1.13,-0.01 0.28,0.32 0.34,-0.22 0.85,0.54 1.61,-0.71 0.93,0.17 0.46,-0.93 2.57,-2.4 1.93,-0.38 0.22,0.47 1.47,0.75 2.26,-0.06 0.49,0.34 0.66,-0.47 1.6,2.06 0.52,-0.23 0.67,-1.24 1.44,-0.05 1.46,2.19 1.16,0.76 1.22,0.31 1.08,0.84 1.69,0.31 0.17,0.71 0,0 -0.61,0.36 -0.18,0.52 0.73,0.1 0.77,1.05 -0.19,1.46 -1.61,0.55 -2.09,-0.2 -0.8,0.63 -0.39,1.15 -0.78,0.66 -0.28,1.55 0.62,0.34 0.18,1.18 1,1.37 -0.28,2.05 0.41,0.34 0.12,1.16 -0.13,1.34 -0.64,0.73 -0.04,1.29 -1.31,0.15 0.19,1.67 -0.52,0.44 0.59,0.83 -1.1,0.32 -0.06,0.56 -0.55,0.21 -0.98,-0.21 0.16,0.65 -0.72,0.23 -0.96,1 -1.24,0 -0.16,0.96 0.65,0.56 -0.17,0.31 -0.85,0.06 -0.11,-0.71 -0.63,0.06 -0.17,0.57 0.54,1.09 0.06,0.93 -0.73,0.75 0.53,0.72 -0.49,0.05 -0.51,0.85 0.25,1.15 -0.48,0.53 0.1,0.48 -2.4,0.06 -0.87,-0.49 -0.05,-0.69 -1.39,0.31 -2.23,-0.85 -0.89,0.38 0.36,1.44 -0.82,1.91 0.25,1.95 -0.41,0.06 -0.89,1.35 -5.56,4.91 1.82,5.34 1.59,0.3 1.07,1.21 1.11,0.27 0.54,0.85 1.49,0.06 -0.01,2.14 -0.52,0.54 -1.23,0.34 -0.08,0.32 2.61,0.43 0.47,1.53 0.82,0.33 -0.35,1.56 -1.91,4.58 -3.4,0.92 -0.52,0.4 -3.31,5.19 1.12,2.89 1.84,1.16 2.1,0.75 0.15,0.56 1.41,0.26 -0.32,0.53 -0.96,0.2 0.61,0.79 -0.4,0.36 0.23,0.28 -0.44,0.09 0.03,0.39 -1.54,-0.02 -2.89,1.17 -0.79,1.14 -0.17,1.23 -0.71,1.53 -2.37,1.15 -4.85,3.62 -4.24,-0.74 -1.1,0.58 -3.06,3.74 0.02,2.65 0,0 -3.08,-0.25 -0.74,0.27 -0.64,0.56 -0.19,0.95 -1.92,1.58 -0.19,0.8 -0.97,0.63 -0.19,-0.56 0.33,-0.14 -0.31,-0.16 0.02,-1.08 -0.33,-0.31 0.33,-0.12 -0.02,-1.55 0.41,-0.24 -1.15,-2.58 -1.78,1.14 -2.59,-4.24 -2.25,-0.07 -2.81,-0.71 -0.01,-1.79 1.76,-1.11 -1.95,-3.12 -4.02,-1.15 -0.07,-1.53 -0.83,-1.1 0.4,-0.73 1.28,-0.68 0.14,0.65 3.81,-1.72 0.59,1.02 0.49,-0.26 0.69,0.18 0.91,-0.53 1.5,0.33 0.67,-1.09 1.14,-0.18 0.25,-0.37 1.01,-0.3 1.38,0.26 1.78,-1.26 0.24,-0.5 0.3,0.8 0.84,-0.57 0.19,0.65 0.63,-1.09 0.64,0.39 0.26,-0.62 0.51,0.75 1.25,-0.7 -0.31,-1.29 0.77,0.29 0.43,-1.1 0.48,0.21 -0.57,-2.13 -0.52,-0.14 0.96,-1.05 -1.13,-0.48 0.15,-0.82 -0.38,-0.1 0.17,-0.31 -0.27,-0.55 0.63,-1.2 -0.4,-0.04 -0.26,-0.49 0.05,-1.1 -0.5,-0.7 -0.35,-0.02 0.25,-1.3 -0.33,0.48 -0.79,-0.47 -0.34,0.62 -0.28,-0.26 -4.21,2.62 -1.24,-1.13 -2.23,-0.27 -2.24,-1.26 -3.02,-0.2 -0.57,-0.95 -0.2,-1.17 -1.33,0.02 -1.2,-0.42 -2.3,0.14 -0.87,-2.3 -1.17,-1.45 0,0 0.98,-0.78 -0.49,-1.77 -0.84,-0.46 -0.08,-0.52 -2.71,-2.98 -0.65,-1.49 -1.38,-0.74 -0.34,-1.28 0.53,-1.19 -0.52,-1.21 -3.1,-1.32 -1.05,0.14 -0.24,-0.24 -0.84,-2.91 -0.01,-1.72 -1.26,-1.47 0.05,-1.81 -1.47,-0.46 -1.21,0.4 -1.03,-1.19 -6.01,-1.66 -2.16,0.34 -0.63,-0.73 -0.33,-1.31 -0.86,-0.83 0,0 2.64,-2.29 -2.08,-3.22 -1.28,-0.26 -0.03,-0.75 4.3,-4.79 2.32,-0.96 3.72,-3.89 0,0 1.5,-0.06 1.1,-1.39 8.52,-5.53 1.75,-1.36 0.96,-1.52 1.75,-0.99 -0.13,-0.7 1.44,-1.4 1.64,-0.08 0.29,-0.63 0.83,0.01 0.35,-0.83 0.58,0.42 0.89,-0.7 0.24,-1.44 1.6,0.46 0.04,-1.2 0.6,-0.78 3.28,-1 1.37,-1.7 -0.08,-0.59 0.36,-0.66 -0.28,-0.97 -0.64,-0.12 -0.19,-0.7 0.32,-0.76 -0.27,-0.54 z" 
                  {...{fill: deptoFill('Comayagua'), stroke: deptoStroke('Comayagua'), 'data-depto': 'Comayagua'}}
                  strokeWidth="1.2"
                  className="cursor-pointer transition-all duration-200 hover:opacity-90"
                  onMouseEnter={() => setHoveredDepto('Comayagua')}
                  onMouseLeave={() => setHoveredDepto(selectedDepto)}
                  onClick={() => setSelectedDepto('Comayagua')}
                />

                {/* Copan */}
                <path 
                  d="m 67.520942,251.84213 6.27,6.62 -1.27,3.12 1.3,0.6 1.39,1.85 0.98,0.4 0.63,2.12 0.67,0.81 1.08,-0.04 2.52,1.75 -1.36,0.9 -0.44,1.4 -0.09,2.33 2.25,2.24 0.26,1.31 0.66,0.93 -0.1,0.74 -0.6,0.63 -1.5,0.22 -2.18,2.28 -0.59,5.59 -0.74,0.8 -1.81,4.81 1.56,3.55 1.48,0.21 1.94,-1.13 1.25,-0.01 0.75,0.49 -0.33,0.83 0,0 0.72,2.32 -1.23,1.92 0.17,1.2 0.54,0.87 -1.13,-0.09 -0.4,0.94 0.44,1.53 -1.97,1.28 -0.98,2.23 0.23,1.2 -0.53,2.21 0.21,0.46 1.32,0.55 0.37,2.55 0.6,0.55 -0.55,0.93 0.51,0.2 0.33,1.12 0.47,0.37 -0.06,1.23 -0.45,0.13 -0.01,-0.45 -0.53,-0.13 -0.46,0.54 -0.12,-0.47 -0.74,0.24 -0.86,-0.45 -1.15,1.25 -1.56,-0.14 -3.21,0.68 -2.69,-0.88 -2.1,0.19 -1.72,-0.77 -0.61,0.61 -0.14,1.17 -0.47,0.13 2.79,5.91 1.67,0.32 0.81,0.68 2.27,3.74 -2.09,1.82 -0.74,0.16 -1.57,2.96 -0.66,2.23 0,0 -2.51,0.74 -1.68,1.23 -1.59,-0.49 -0.71,0.31 0.11,1 0.53,0.77 -0.43,0.88 0.58,1.24 -2.44,0.66 -0.83,-1.77 -4.67,-0.86 -2.35,-2.7 0.36,-1.82 -1.42,-0.04 -0.75,-0.63 0.66,-0.39 -0.19,-1.36 0.49,-0.69 -0.24,-0.79 0.53,-0.16 0.02,-0.71 -4.25,-3.95 -2.75,-1.38 -1.46,-1.69 -0.64,-1.15 0.14,-1.3 -0.79,-1.51 0.2,-0.84 -0.69,-2 -0.76,0.16 -1.28,-0.56 -2.46,0.37 -1.87,-0.28 -1.87,-1.2 -0.59,0.37 -1.38,-0.03 -2.56,0.79 -1.7,0.79 0,0 0.82,-2.06 -3.79,-2.06 -0.39,-5.19 -3.85,-3.9 -2.46,-3.46 -0.4,-3.02 0.38,-2.51 3.49,-1.91 0.59,-0.68 1.2,-1.47 0.67,-1.21 -0.27,-1.21 0.95,-0.61 0.54,-2.61 0.51,-1.14 -0.02,-0.61 -1.15,-0.23 -0.16,-0.74 -1.14,-0.38 -0.37,-1.04 -0.46,0.02 0.23,-1.08 0.76,-0.8 0.18,-1.55 1.33,-2.22 0.47,-1.45 0.75,-0.59 20.61,-7.83 16.08,-13.88 3.19,-1.42 z" 
                  {...{fill: deptoFill('Copan'), stroke: deptoStroke('Copan'), 'data-depto': 'Copan'}}
                  strokeWidth="1.2"
                  className="cursor-pointer transition-all duration-200 hover:opacity-90"
                  onMouseEnter={() => setHoveredDepto('Copan')}
                  onMouseLeave={() => setHoveredDepto(selectedDepto)}
                  onClick={() => setSelectedDepto('Copan')}
                />

                {/* Cortes */}
                <path 
                  d="m 185.01094,177.59213 -0.51,1.92 -0.44,0.44 -0.06,1.92 -1.06,0.69 -1.13,-0.45 -0.99,1.48 -1.55,1.46 0.09,0.85 0.67,0.65 -0.67,0.52 -0.14,2.04 0.35,0.48 -0.48,0.05 -1.05,-0.67 0.4,1.77 -0.18,0.5 -0.47,0.14 -0.59,-0.57 -0.55,0.06 0.15,1.61 -0.67,1.01 1.24,0.06 0.17,0.75 0.78,0.82 -0.56,1.7 0.46,0.11 0.47,-1.37 0.47,-0.24 0.99,1.53 -0.02,1.58 0.99,1.15 -0.18,0.54 -1.98,0.11 0.08,1.11 0,0 -0.2,0.86 -0.78,0.52 -1.29,-1.55 -0.9,-0.13 -0.45,2.22 -2.24,0.88 -1.38,1.71 0.94,-0.2 1.03,0.33 0.96,-0.69 0.6,-0.05 0,0.85 -1.23,-0.08 -0.73,0.56 -0.55,1.65 0.19,0.88 0.99,0.57 0.78,-1.26 0.65,-0.02 0.14,0.61 -0.7,1.02 0.25,0.82 1.2,0.66 1.69,-0.44 0.91,0.16 0.36,0.76 -0.31,1.65 1.1,1.13 -0.07,2.05 -1.42,-0.43 -0.61,0.46 1.35,2.33 -0.24,0.67 -0.7,0.14 -0.56,-0.95 -1.08,-0.68 -0.76,-0.09 -0.38,0.42 0.73,2.3 -0.59,0.61 -1.01,0.21 -0.26,0.59 0.22,1.58 0.99,1 -0.14,0.77 -0.71,0.08 -1.27,-1.16 -0.81,0.31 0.55,1.45 -0.93,1.21 -0.02,0.59 1.44,1.04 -0.49,1.79 1.88,0.79 0.32,0.68 -0.12,1.02 -1.68,2.19 -0.63,-0.27 -0.52,-2.1 -2.47,0.13 -0.78,0.49 0.25,0.7 1.76,0.45 2.45,1.47 0.62,2.12 -0.08,1.21 -0.54,0.42 -1.58,-0.39 -0.98,3.33 -1.19,1.49 -2.17,1.49 0.06,0.6 1.54,0.29 -0.19,0.81 -0.74,0.05 -1.2,-1.02 -0.37,0.46 -0.21,1.67 -0.51,0.49 -1.34,-0.32 -1.14,0.28 -0.02,0.74 1.12,1 0.09,0.47 -1.81,0.09 -0.52,1.2 0.26,0.32 1.59,0.4 -0.16,1.35 -0.67,0.36 -1.24,-0.27 -0.46,0.18 0.2,1.11 -0.57,1.39 0.35,2.02 1.52,-1.01 -0.47,1.27 0.76,1.04 -0.63,1.13 0.71,0.6 -0.58,0.52 0.15,0.45 1.23,0.19 1.57,0.95 2.01,-0.45 1.48,0.17 0.75,1.52 1.25,0.49 -0.29,1.08 0.42,0.5 0.58,0.19 2.33,-0.44 0.7,1.1 1.32,-0.64 0.74,0.94 -0.08,0.66 -0.36,0.18 0.16,0.31 1.87,0.32 1.28,-0.81 1.54,0.93 0.18,0.78 1.44,1.47 0.95,0.35 -0.73,1.18 0.41,0.55 -0.23,0.68 0.54,0.42 -0.03,0.35 -0.33,0.64 -0.95,0.55 0.01,1.88 -0.5,1.22 0.76,2.55 0.97,0.86 -0.72,0.76 0,0 0,0 0,0 -0.23,0.95 0.27,0.54 -0.32,0.77 0.19,0.69 0.63,0.13 0.28,0.97 -0.35,0.65 0.08,0.59 -1.37,1.7 -3.27,1 -0.6,0.77 -0.04,1.21 -1.6,-0.46 -0.23,1.45 -0.9,0.69 -0.58,-0.42 -0.35,0.84 -0.83,-0.01 -0.28,0.64 -1.65,0.08 -1.44,1.4 0.13,0.71 -1.75,0.99 -0.96,1.52 -1.75,1.36 -8.52,5.53 -1.1,1.39 -1.5,0.06 0,0 -0.77,-1.36 -0.54,-1.99 0.31,-3.36 0.73,-2.76 -1.17,-0.96 -1.14,0.13 -1.1,-0.29 0.44,-0.11 0.22,-0.75 -0.32,-0.78 -0.64,-0.52 0.21,-1.06 -0.57,0.65 -0.21,-0.1 0.18,-0.34 -0.46,0.24 0.12,-1.15 0.53,-0.19 -0.11,-0.4 0.81,-0.71 -0.04,-0.35 -3.58,1.01 1.29,-7.82 1.06,-1.04 0.24,-5.07 0.65,-0.9 0.27,-1.31 -1.56,-1.77 -2.87,-0.32 -0.6,-0.87 -1.59,-0.07 -2.26,-2.01 -1.79,-2.68 1.92,-2.88 0.86,-0.4 0.69,-1.31 0.83,-0.51 0.04,-1.12 1.5,-1.27 0.07,-1.37 0.44,-0.77 -4.57,-0.59 -1.09,-3.69 -1.55,-1.83 -0.84,-12.79 -1.82,-0.75 -1.98,0.69 -1.77,-1.4 -0.67,-0.14 -0.97,-1.58 -2.72,-1.08 -1.5,-0.25 -0.96,-2.2 -0.4,-0.2 0.21,-0.7 -0.32,-0.56 0.6,-1.78 -0.49,-1.51 0.08,-0.96 0.85,-1.23 -0.34,-1.09 -22.56,-6.51 0,0 9.07,-7.31 2.98,-3.67 1.28,-2.2 -0.15,-1.85 0.77,-0.29 0.47,-0.85 0.85,1.04 2.21,-0.58 0.82,-0.86 2.03,-0.14 1.53,-0.84 0.42,-0.6 0.09,-1.81 -0.77,-1.05 2.86,-0.25 3.74,3.04 3.07,1.57 2.35,0.2 2.03,-0.56 2.19,-2.29 0,-1.08 -0.57,0.29 -0.13,-0.49 1.05,-1.63 1.62,-0.26 0.57,-0.49 0.51,-1.37 0.73,-0.1 0.41,-0.62 0.79,-0.07 1.3,-1.01 0.22,-1.28 -0.38,-0.59 0.16,-0.33 0.35,-0.07 0.32,-0.16 4.88,-0.23 2.35,-1.21 0.35,-0.72 1.27,0.03 1.3,-0.39 1.52,-1.05 0.51,-0.59 0.16,-0.98 0.79,0.03 0.35,-0.78 0.76,0.62 1.24,-0.42 1.43,-2.72 -0.85,0.59 -0.09,-0.29 0.54,-0.52 -0.19,-0.16 -1.65,0.13 -1.99,2 0.37,1.08 -0.22,0.23 -0.44,-0.1 0.06,-0.52 -0.41,-0.56 -3.04,-0.42 0.06,-1.01 1.08,-1.34 1.68,-0.2 3.8,0.26 0.76,-0.29 1.17,-1.31 2.09,-1.44 1.93,0.07 1.17,-0.29 1.17,-0.92 1.65,0.03 0.51,-0.36 1.87,0.16 0.54,0.43 0.63,-0.2 2.28,0.56 1.14,-0.06 1.24,-0.43 1.58,-2.88 z" 
                  {...{fill: deptoFill('Cortes'), stroke: deptoStroke('Cortes'), 'data-depto': 'Cortes'}}
                  strokeWidth="1.2"
                  className="cursor-pointer transition-all duration-200 hover:opacity-90"
                  onMouseEnter={() => setHoveredDepto('Cortes')}
                  onMouseLeave={() => setHoveredDepto(selectedDepto)}
                  onClick={() => setSelectedDepto('Cortes')}
                />

                {/* El Paraiso */}
                <path 
                  d="m 299.45094,354.69213 4.85,1.47 0.51,0.89 1.02,0.36 0.42,-0.09 0.56,-1.14 0.84,0.38 1.24,-0.21 0.5,0.85 1.31,0.94 0.08,1.24 0.61,0.97 1.25,-0.93 8.52,1.9 0.87,1.23 0.65,0.04 0.88,1.93 4.23,0.38 0.5,1.02 1.38,1.09 0.82,2.94 8.5,0.77 1.14,0.01 0.78,-0.57 0.82,0.25 1.54,-1.21 2.96,-1.54 2.04,-1.96 1.97,-0.49 0.72,-0.99 4.77,-1.34 6.24,-0.44 3.99,9.39 8.35,2.23 0.25,-0.14 -0.27,-0.47 0.15,-1.38 0.9,-0.76 0.99,0.1 0.22,0.4 1.68,0.44 0.62,-0.09 1.45,3.31 1.6,2.11 0.39,0.89 0.27,2.24 1.13,1.53 1.86,0.68 2.62,0.41 1.99,2.52 0.58,1.39 1.43,0.89 2.62,0 1.03,-1.77 0.1,-1.84 0.59,-0.95 4.12,-1.94 3.04,2.14 2.12,0.45 0.96,-0.99 1.76,-3.17 0.73,-0.06 0.77,1.19 0.79,0.24 3.4,-0.75 3.56,0.92 1.39,0.78 0.83,-0.04 0.36,-1.53 0.7,-0.37 1.96,2.72 1.94,0.85 0.63,0.82 -0.07,0.51 0.57,1.22 0.83,0.85 -0.27,1.23 -0.96,1.19 0.3,1.49 2.39,1.4 0.33,0.51 1.34,0.3 0.74,1.23 0.08,0.75 0,0 -0.85,1.99 -0.64,0.42 -0.84,-0.09 -1.44,2.04 -1.58,0.47 -1.19,1.18 -2.42,-0.42 -0.93,0.25 -0.68,2.63 -1.71,1.38 -1.92,-0.93 -1.5,-0.2 -0.81,0.45 -1.54,1.71 -0.92,0.47 -1.45,0.07 -0.6,0.77 0.15,5.29 -0.84,3.67 2.51,1.71 0.5,1.48 -0.55,1.68 -1.35,0.93 -0.87,-1.19 -0.89,-0.3 -2.31,0.63 -2.28,-0.1 -0.8,-0.36 -0.48,-1 -0.66,-0.27 -0.53,-1.45 -1.33,-1.25 0.08,-3.03 -0.85,-1.18 -1.42,-0.71 -2.76,-0.32 -0.76,0.91 -0.17,1.25 -0.57,0.43 -2.17,-0.93 -0.94,-1.52 -2.2,-2.09 -7.74,-5.95 -0.89,-2.08 0.25,-1.8 1.33,-2.49 0.52,-1.75 -0.42,-1.86 -1.06,-0.15 -1.88,0.9 -3.37,-0.05 -0.92,0.45 -2.33,0.17 -1.19,0.54 -2.18,1.76 -3.25,1.37 -0.16,1.4 1.82,1.4 -0.18,0.89 -2.42,1.71 -3.13,0.48 -0.26,0.32 -0.18,0.74 0.47,2.09 -1.09,0.57 -0.76,1.49 -2.29,1.18 -0.86,1.92 -1.43,1.07 -1.12,2.06 -2.7,1.78 -0.5,1.58 -2.31,1.16 -0.27,0.45 0.49,1.71 -0.32,1.51 -1.34,1.53 -0.95,2.3 -2.83,2.26 -0.67,0.26 -1.44,-0.18 -0.89,-0.96 -0.43,-0.05 -1.23,1.07 -0.8,0.18 -2.9,-0.31 -1.52,0.35 -0.67,-0.41 -0.7,-1.97 -0.72,-0.44 -2.61,1.35 -2.86,0.24 -1.99,-0.83 -2.04,-2.51 -0.58,-0.24 -2.43,-0.09 -1.86,1.41 -3.87,0.88 -2.33,-0.28 -1.16,0.57 -1.37,0.09 -1.51,-0.59 -5.52,-0.49 -1.04,0.29 -1.95,1.21 -2.43,0.13 -0.61,2.71 0.72,3.39 -1.01,3.2 0,0 -1.41,0.09 -0.61,0.42 -0.52,-0.63 -1.42,1.84 -0.31,1.52 -0.83,-0.06 -0.7,-0.81 -2.26,0.11 -1.28,1.71 -3.9,1.86 -0.46,-0.38 0.09,-0.59 -1.67,0.71 -2.36,-0.06 -0.35,-0.99 -0.43,-0.26 -0.31,2.03 0.16,0.99 -1.07,2.12 -2.1,2.3 -1.17,0.59 -0.5,0.7 -1.89,0.04 -1.51,1.18 -0.55,0.69 0.18,2.03 -0.38,0.58 -1.47,0.81 -0.13,1.77 -1.09,0.22 -0.54,-0.24 -1.2,0.39 -0.56,1.45 -1.22,0.7 -1.59,-1.02 -0.07,0.94 -0.23,0.07 -1.93,-0.78 -0.67,-0.69 -0.13,-1.37 -0.76,-0.91 0.42,-2.36 -3.65,0.84 -1.66,-0.66 -1.37,0.49 -1.81,-1.65 -0.03,-1.81 -0.36,-0.59 0.29,-1.04 -0.8,-1.03 -0.4,-0.08 -0.56,-1.39 -2.72,-0.19 1.3,-6.02 0,0 3.1,-2.07 4.8,2.91 0.36,-0.09 1.44,0.99 0.39,-0.14 -0.83,-2.13 1.81,-3.13 1.71,-1.11 -1.47,-1.88 -0.67,-1.88 -1.15,-1.03 0.09,-5.28 0.79,-0.19 -0.04,-1.01 0.79,-0.33 1,0.71 2.23,1.73 0.75,1.43 1.39,0.02 1.57,0.54 1.95,-0.09 0.96,-0.33 1.26,-1.29 1.72,-3.43 0.54,-0.42 0.63,-3.07 -0.6,-1.39 0.9,-3.13 -0.4,-1.63 -0.78,-1.14 0.19,-0.91 1.59,-1.78 -0.41,-0.56 -0.68,-2.86 0.53,-0.49 0.17,0.49 0.72,0.35 2.06,0.3 0.65,0.74 0.46,0.01 3.9,-4.33 -0.56,-1.32 0.99,-0.07 0.03,-5.77 -4,-1.48 -0.28,-2.55 -2.64,-1.72 -1.96,-2.95 1.53,-2.02 2.85,0.26 1.86,0.94 0.03,-0.29 0.46,0.37 1.63,0.12 0.07,-0.84 1.81,-2.63 -1.7,-1.16 -1.21,-0.24 -0.54,0.34 -0.24,-0.59 0.59,-1.29 1.79,-0.81 0.86,-0.98 -0.5,-1.09 0.69,-0.58 0.01,-2.12 1.01,-0.26 0.49,-0.84 2.5,-2.22 2.09,-3.64 1.51,0.03 0.2,-0.4 -0.45,-4.23 6.91,-5.83 z" 
                  {...{fill: deptoFill('El Paraiso'), stroke: deptoStroke('El Paraiso'), 'data-depto': 'El Paraiso'}}
                  strokeWidth="1.2"
                  className="cursor-pointer transition-all duration-200 hover:opacity-90"
                  onMouseEnter={() => setHoveredDepto('El Paraiso')}
                  onMouseLeave={() => setHoveredDepto(selectedDepto)}
                  onClick={() => setSelectedDepto('El Paraiso')}
                />

                {/* Francisco Morazan */}
                <path 
                  d="m 240.89094,301.30213 0.67,0.68 1.04,0.01 0.08,-0.82 0.62,-0.8 -0.63,-1.05 0.31,-0.89 -1.96,-0.48 -0.09,-0.64 0.5,-0.41 -0.02,-0.39 -1.14,-1.09 -0.07,-0.96 2.26,-2.54 1.01,-0.27 0.63,-0.66 -0.18,-2.29 0.25,-1.06 -0.27,-1.26 1.49,-1.8 1.05,0.03 0.85,-0.55 2.04,0.06 0.46,-0.69 0.81,0.4 2.19,-0.26 1.63,1.24 1.55,0.63 1.48,-0.28 1.24,-0.68 1.52,0.12 1.91,-0.36 4.66,1.06 0,0 0.67,1.24 1.69,1.86 0.62,1.65 3.43,0.86 0.33,0.34 0.09,1.14 3.33,1.6 -0.98,0.47 -1.33,2.13 0,1.1 -1.17,0.81 -0.11,0.4 0.58,1.72 -0.12,1.38 1.63,0.99 1.31,3.07 0.33,1.69 -0.62,0.21 0.02,1.49 2.18,1.15 -1.09,3.4 2.63,2.84 1.1,4.59 1.75,4.36 1.93,1.07 1.73,2.28 2.71,0.01 0.5,0.54 0.34,1.44 3.14,1.92 0.74,1.02 0.26,1.3 1.85,1.12 -0.88,3.74 -0.06,1.7 0.81,2.5 1.43,0.41 0.08,1.85 -0.51,1.22 2.63,5.37 -0.3,1.41 0,0 -6.23,4.75 -6.91,5.83 0.45,4.23 -0.2,0.4 -1.51,-0.03 -2.09,3.64 -2.5,2.22 -0.49,0.84 -1.01,0.26 -0.01,2.12 -0.69,0.58 0.5,1.09 -0.86,0.98 -1.79,0.81 -0.59,1.29 0.24,0.59 0.54,-0.34 1.21,0.24 1.7,1.16 -1.81,2.63 -0.07,0.84 -1.63,-0.12 -0.46,-0.37 -0.03,0.29 -1.86,-0.94 -2.85,-0.26 -1.53,2.02 1.96,2.95 2.64,1.72 0.28,2.55 4,1.48 -0.03,5.77 -0.99,0.07 0.56,1.32 -3.9,4.33 -0.46,-0.01 -0.65,-0.74 -2.06,-0.3 -0.72,-0.35 -0.17,-0.49 -0.53,0.49 0.68,2.86 0.41,0.56 -1.59,1.78 -0.19,0.91 0.78,1.14 0.4,1.63 -0.9,3.13 0.6,1.39 -0.63,3.07 -0.54,0.42 -1.72,3.43 -1.26,1.29 -0.96,0.33 -1.95,0.09 -1.57,-0.54 -1.39,-0.02 -0.75,-1.43 -2.23,-1.73 -1,-0.71 -0.79,0.33 0.04,1.01 -0.79,0.19 -0.09,5.28 1.15,1.03 0.67,1.88 1.47,1.88 -1.71,1.11 -1.81,3.13 0.83,2.13 -0.39,0.14 -1.44,-0.99 -0.36,0.09 -4.8,-2.91 -3.1,2.07 0,0 -4.82,-2.24 -3.27,1.01 -1.92,-0.17 -0.08,-0.37 -1.57,-0.74 -1.41,0.54 -0.48,-0.23 -3.49,0.29 -0.22,-1.61 -0.91,-0.06 -0.9,-0.54 -0.94,-1.27 -0.11,-0.81 -0.8,0.12 0.06,-2.01 0.52,-0.46 0.11,-0.87 0.73,-0.64 0.11,-0.78 -1.54,-0.1 -0.66,0.47 -1.29,-0.35 -1.03,-0.72 -2.22,-0.22 -1.55,0.36 -0.38,0.43 0.13,1.93 0.58,0.98 -0.42,0.58 0.15,0.58 -0.77,0.77 0.02,1.96 -0.64,1.32 0.62,0.88 0.11,0.88 0,0 -1.1,-0.1 -0.81,-0.94 -0.86,-0.04 -0.54,-0.39 -0.27,0.19 -0.37,-0.46 -2.81,-0.75 -0.58,-0.78 -2.36,-1.47 -0.27,-0.9 -4.52,0.45 -1.7,-0.68 -3.51,-2.43 -1.29,-0.1 -1.07,0.59 0.25,-3.45 0.43,-0.82 -0.35,-2.96 0.19,-2.56 0,0 0.51,-1.31 1.71,-1.53 0.8,-1.78 -0.11,-2.11 1.51,-1.09 -0.2,-1.51 0.63,-1.77 -0.19,-2.07 0.8,-2.14 -0.09,-0.53 -0.55,-0.41 0.6,-1.13 -1.44,-2.15 0.05,-3.76 -1.19,-6.12 0,0 -0.02,-2.65 3.06,-3.74 1.1,-0.58 4.24,0.74 4.85,-3.62 2.37,-1.15 0.71,-1.53 0.17,-1.23 0.79,-1.14 2.89,-1.17 1.54,0.02 -0.03,-0.39 0.44,-0.09 -0.23,-0.28 0.4,-0.36 -0.61,-0.79 0.96,-0.2 0.32,-0.53 -1.41,-0.26 -0.15,-0.56 -2.1,-0.75 -1.84,-1.16 -1.12,-2.89 3.31,-5.19 0.52,-0.4 3.4,-0.92 1.91,-4.58 0.35,-1.56 -0.82,-0.33 -0.47,-1.53 -2.61,-0.43 0.08,-0.32 1.23,-0.34 0.52,-0.54 0.01,-2.14 -1.49,-0.06 -0.54,-0.85 -1.11,-0.27 -1.07,-1.21 -1.59,-0.3 -1.82,-5.34 5.56,-4.91 0.89,-1.35 0.41,-0.06 -0.25,-1.95 0.82,-1.91 -0.36,-1.44 0.89,-0.38 2.23,0.85 1.39,-0.31 0.05,0.69 0.87,0.49 2.4,-0.06 -0.1,-0.48 0.48,-0.53 -0.25,-1.15 0.51,-0.85 0.49,-0.05 -0.53,-0.72 0.73,-0.75 -0.06,-0.93 -0.54,-1.09 0.17,-0.57 0.63,-0.06 0.11,0.71 0.85,-0.06 0.17,-0.31 -0.65,-0.56 0.16,-0.96 1.24,0 0.96,-1 0.72,-0.23 -0.16,-0.65 0.98,0.21 0.55,-0.21 0.06,-0.56 1.1,-0.32 -0.59,-0.83 0.52,-0.44 -0.19,-1.67 1.31,-0.15 0.04,-1.29 0.64,-0.73 0.13,-1.34 -0.12,-1.16 -0.41,-0.34 0.28,-2.05 -1,-1.37 -0.18,-1.18 -0.62,-0.34 0.28,-1.55 0.78,-0.66 0.39,-1.15 0.8,-0.63 2.09,0.2 1.61,-0.55 0.19,-1.46 -0.77,-1.05 -0.73,-0.1 0.18,-0.52 z" 
                  {...{fill: deptoFill('Francisco Morazan'), stroke: deptoStroke('Francisco Morazan'), 'data-depto': 'Francisco Morazan'}}
                  strokeWidth="1.2"
                  className="cursor-pointer transition-all duration-200 hover:opacity-90"
                  onMouseEnter={() => setHoveredDepto('Francisco Morazan')}
                  onMouseLeave={() => setHoveredDepto(selectedDepto)}
                  onClick={() => setSelectedDepto('Francisco Morazan')}
                />

                {/* Gracias a Dios */}
                <path 
                  d="m 601.38094,228.98213 0.84,0.68 1.97,0.58 0.44,2.74 1.58,3.82 -1.42,1.54 -0.47,-0.2 0.28,-1.7 -1.17,-2.06 0.19,-1.47 -1.39,-2.19 -1.08,-0.26 -0.28,-0.42 0.17,-0.94 0.34,-0.12 z m -104.23,-58.39 7.67,2.65 0.48,0.1 4.62,2.42 11.34,4.35 11.15,3.18 3.01,0.49 0.86,0.72 -0.76,0.23 -0.67,0.92 -0.47,3.44 -0.32,0.1 -0.22,0.69 0.06,0.85 0.95,2.39 1.9,1.67 1.87,-0.2 1.68,-1.18 0.16,-0.82 -0.73,-1.5 0,-0.56 0.54,-0.62 2.12,1.7 0.51,1.51 0.76,0.92 0.86,0.26 1.9,-0.46 0.7,0.39 -0.35,0.56 0.86,0.36 -0.22,-1.01 0.82,-0.13 1.14,0.1 0.54,-0.33 -0.41,-0.92 -0.63,-0.29 0.73,-0.52 -0.13,-0.46 1.05,-1.08 0.7,0.49 -0.73,0.36 -0.09,0.59 1.17,0 0.35,-0.39 -0.03,-0.72 1.11,0.26 -0.25,-0.98 0.35,-0.16 0,-0.72 -1.43,-0.26 -1.33,-0.98 0.19,-0.39 -0.29,-0.2 -12.35,-2.78 -1.27,-0.33 0.13,-0.2 21.98,4.58 6.81,0.66 9.79,0.36 1.36,1.57 0.45,-0.16 4.97,3.93 17.61,14.75 10.68,10.3 12.61,10.94 3.99,2.81 5.64,3.14 3.9,1.54 5.01,1.14 -1.42,2.19 -1.96,0.47 -5.92,-4.99 -2.88,-1.47 -2.88,-0.52 -2.72,-1.37 -2.19,0.33 -2.44,-0.52 -1.46,-1.37 1.52,0.29 -0.16,-1.37 -0.51,-1.04 -1.27,-1.24 -2.15,-1.24 -0.44,-1.5 -0.79,1.01 0.26,0.52 -1.27,0.16 0,-0.52 0.51,-0.06 -3.14,-0.88 -1.55,-1.5 -1.52,0.07 -1.33,-1.11 -0.35,0.29 -1.68,2.81 -1.39,0.92 -0.03,1.21 -1.36,-0.75 -0.57,0.43 -0.13,0.72 -0.76,0.56 -2.76,-0.16 0.32,1.5 1.49,1.73 0.16,1.37 -0.35,0.72 -1.17,0.59 -1.11,-0.72 -1.3,0.72 0.38,0.56 -0.19,0.13 1.24,1.05 -0.22,0.72 -0.98,0.16 -0.54,-0.33 0.13,1.11 2,3.69 2.38,2.78 2.41,1.01 2.88,-0.2 -0.13,0.65 0.41,-0.06 0.98,0.91 0.57,-0.03 0.89,-0.72 0,-1.6 -1.39,-2.42 0.13,-0.69 -1.08,-1.08 0.19,-1.44 2.79,-0.65 0.1,-0.16 0.22,-0.78 3.87,0.69 0.95,-0.13 1.2,0.43 1.17,0.59 1.45,1.35 2,0.94 1.65,1.86 2,0.65 2.15,2.42 1.9,1.01 2.09,-0.03 0.41,0.56 0.76,-0.33 0.98,1.7 1.2,0.91 1.4,0.52 -0.35,1.14 -2.03,1.01 -0.41,0.69 2.38,-0.03 1.33,-0.75 -0.13,-0.49 0.54,-0.13 -0.06,-0.59 0.28,-0.13 0,0.36 0.51,0.1 0.44,0.85 1.2,1.01 0.28,0.98 -0.28,0.36 0.16,1.18 -0.98,0.85 -0.19,0.82 1.17,2.58 -0.76,0.59 0.44,1.04 0.51,-0.46 0.16,-0.98 0.28,0.98 0.95,-0.06 -0.57,-0.46 0.22,-0.75 3.04,1.4 1.74,-0.78 0,-2.15 0.67,-1.47 0.51,-0.1 0.86,-0.88 2.31,-0.39 0.41,-1.14 1.01,0.07 1.27,-0.75 0.79,-1.44 -0.35,-0.59 -0.03,-1.4 1.87,-1.63 0.16,0.43 -0.38,0.65 0.25,0.46 1.24,-0.42 0.7,0.42 0.73,-0.29 1.49,0.58 0.63,-0.52 0.22,1.21 0.54,-0.33 1.65,0.33 0.44,-0.56 0.54,0.49 0.54,-0.23 0.41,0.62 0.35,-1.44 -0.51,-0.52 -1.93,0.42 -0.06,-1.47 -1.08,-0.26 -0.79,0.36 -1.11,-1.24 -0.38,0.29 -1.04,-0.03 -0.41,1.01 -1.61,0.52 -0.28,-1.01 -2.25,-0.62 -0.54,-1.01 -0.25,-0.16 -0.76,1.18 -0.47,-0.75 0.1,-0.49 -0.57,-0.85 -0.73,-0.39 -1.33,-0.82 -0.6,0.07 -1.3,-0.98 -3.42,-0.65 -0.41,-0.59 0.41,-1.38 0.63,-0.78 0.67,-0.16 0.54,-1.96 0.6,0.03 1.24,1.54 2.12,1.6 7.67,4.18 4.72,1.76 12.64,3.79 4.02,1.47 4.63,2.22 1.01,1.01 3.01,5.02 1.9,6.49 1.49,3.33 2.28,3.78 1.52,1.66 3.36,2.8 4.4,2.54 7.41,2.48 1.81,0.29 0.63,-0.33 0.25,0.33 -0.25,0.59 0.98,-0.2 0.13,0.23 -0.66,1.14 -1.56,-0.2 -0.21,-0.4 -2.22,0.65 -4.66,-0.38 -3.16,1.46 -1.87,-0.46 -2.39,0.08 -0.71,1.14 -0.37,-0.01 -1.01,-0.71 1.51,-1.32 0.1,-0.67 -0.28,-0.22 -2.54,0.5 -3.14,-1.51 -1.6,-0.38 -0.32,0.1 -0.24,1.46 -0.67,0.17 -1.24,-1.69 -1.23,-0.52 -1.36,-0.02 -0.92,-1.11 -0.86,-0.16 -0.28,0.54 0.11,1.65 -2.12,2.17 -1.69,0.06 -1.81,1.25 -1.42,0.3 -1.81,-1.4 0.03,-1.52 -0.95,-0.47 -0.69,0.13 -0.97,0.49 -0.8,0.95 -0.48,1.23 -1.26,-1.12 -0.33,0.41 0.16,1.24 0.53,1.02 -0.46,0.13 -1.36,-0.94 -0.43,0.77 0.04,0.64 1.11,2.08 -0.28,0.22 -1.41,-0.76 -0.28,0.18 0.84,1.43 -0.24,0.45 -1.32,-0.3 -0.46,0.27 -0.28,3.06 -1.09,-0.43 -1.43,0.52 -1.24,-0.76 -0.56,0.63 0.54,0.7 -0.1,0.32 -2.35,0.69 -0.01,0.5 0.54,0.65 -1.13,1.54 0.35,1.24 -0.42,0.22 -0.63,-0.61 0.06,-1.1 -0.4,-0.42 -1.55,-0.26 -0.78,-0.01 -0.6,0.54 -1.37,-0.07 -2.08,1.25 -0.86,-0.75 -0.41,0.08 0.11,1.51 -0.69,0.54 -0.92,0.08 -0.42,0.54 1.64,0.67 -0.33,0.82 0.13,0.6 -0.69,-0.01 -1.04,-0.75 -0.92,0.26 -1.19,-0.16 -0.37,0.18 0.63,0.83 0.08,0.82 -2.41,-0.91 -0.65,0.86 0.17,1.06 -0.24,0.59 -1.23,-0.2 -1.26,-1.26 -0.33,0.31 -0.02,1.14 -0.78,0.49 -2.27,-0.95 -0.51,0.27 0.13,0.37 2.54,1.6 -0.37,0.22 -1.99,-0.22 -2.12,0.38 -1.82,1.98 -1.37,-0.11 -1.57,0.71 -0.52,-1.88 -0.82,-0.24 -0.39,1.5 0.31,0.55 -1.06,0.4 -2.17,-1.54 -0.65,0.54 -1.46,-0.07 -0.23,0.32 0.93,2.21 -0.19,0.45 -0.91,-0.06 -1.13,-0.84 -0.55,-0.01 -2.9,1.23 -2.63,-1.09 -2.72,1.28 -1.87,-0.49 -0.55,-2.57 -0.41,-0.05 -2.9,1.46 -0.55,-0.1 -0.27,-0.32 0,-2.61 -0.27,-0.42 -1.37,-0.39 -1.65,0.16 -0.47,0.63 -0.06,0.96 1.32,3.18 0.84,0.64 0.08,1.79 -3.47,-0.42 -1.24,0.53 -0.74,0.9 -3.85,0.67 -2.96,-0.91 -1.44,-1.3 -1.13,-0.52 0.72,-2 -0.77,-0.6 -1.1,-0.11 -2.82,1.97 -0.47,0.63 -0.16,1.55 1.11,2.49 -0.35,1.87 0.9,0.84 -2.78,2.29 -2,-0.62 -0.45,-0.46 -0.34,-1.47 -0.68,-0.56 -0.87,0.31 -0.42,0.73 -0.69,0.22 -1.64,-0.16 -0.82,-0.42 -0.31,-0.37 0.01,-0.78 0.9,-1.86 -1.23,-0.29 -1.22,-0.89 -0.42,0.36 0.08,0.78 -1.12,1.31 -0.66,1.59 -2.88,2.75 -0.18,1.23 -2.64,1.34 -2.81,0.19 -0.95,1.72 -0.34,0.12 -3.3,-0.76 -0.89,-0.66 -0.14,-0.79 -0.45,-0.12 -1.17,0.51 -1.5,0.17 -0.28,-1.5 1.02,-0.32 0.53,-0.7 -0.14,-0.41 -3.34,0.37 -0.76,0.52 -1,-0.84 -1.43,0.39 -0.96,-0.88 -0.94,0.36 -1.9,-0.78 -1.99,-0.1 -0.55,-1.21 -2.52,0.53 -1.27,-0.69 -0.67,-0.72 0.12,-0.64 -0.63,-0.2 -1.69,3.05 -1.05,-0.09 -0.82,-3.16 -1.2,-0.28 -2.74,-2.4 -0.43,-1.66 0.54,-1.38 -0.36,-0.83 -1.36,0.66 -0.64,-0.16 -0.55,-0.79 0.69,-0.7 1.01,0.2 0.5,-0.71 -0.29,-1.05 -3.16,-2.03 -0.81,-1.17 -0.39,-1.84 -0.64,-0.16 -0.51,-0.79 -0.83,-0.01 -1.08,-0.65 -2.15,0.41 -2.45,1.49 -2.35,-0.37 -2.59,0.29 -2.63,4.2 -0.28,1.64 -3.71,0.78 -1.79,1.65 -1.22,0.31 -0.92,1.16 0,0 -0.13,-21.24 0.35,-18.22 0,0 -0.47,-107.1 0.11,-0.77 0.35,-0.12 0,0 -0.02,-0.09 z m 125.44,-170.1000008 0.44,0.43 -0.38,0.36 -2.19,0.3 1.43,-1.02 0.7,-0.07 z m -3.45,-0.17 0.32,0.83 0.73,0.2 0.03,0.3 -1.11,0.03 -0.57,0.46 -0.51,-0.26 -1.14,0.59 -0.16,-0.66 0.28,-0.59 1.14,0 0.28,-0.63 0.71,-0.27 z" 
                  {...{fill: deptoFill('Gracias a Dios'), stroke: deptoStroke('Gracias a Dios'), 'data-depto': 'Gracias a Dios'}}
                  strokeWidth="1.2"
                  className="cursor-pointer transition-all duration-200 hover:opacity-90"
                  onMouseEnter={() => setHoveredDepto('Gracias a Dios')}
                  onMouseLeave={() => setHoveredDepto(selectedDepto)}
                  onClick={() => setSelectedDepto('Gracias a Dios')}
                />

                {/* Intibuca */}
                <path 
                  d="m 145.93094,327.14213 0.86,0.83 0.33,1.31 0.63,0.73 2.16,-0.34 6.01,1.66 1.03,1.19 1.21,-0.4 1.47,0.46 -0.05,1.81 1.26,1.47 0.01,1.72 0.84,2.91 0.24,0.24 1.05,-0.14 3.1,1.32 0.52,1.21 -0.53,1.19 0.34,1.28 1.38,0.74 0.65,1.49 2.71,2.98 0.08,0.52 0.84,0.46 0.49,1.77 -0.98,0.78 0,0 -0.98,0.73 -0.7,1.06 -3.8,2.19 -1.4,1.39 -0.81,0.06 -0.45,-0.34 -0.62,0.3 -1.79,-0.21 -0.11,-0.55 -0.95,-0.11 -0.09,1.25 0.36,0.61 -0.94,0.93 0.57,0.17 -0.14,0.41 0.26,0.1 -0.23,1.35 0.49,-0.01 0.41,0.85 -0.42,0.62 0.17,0.81 -0.37,0.15 0.3,0.29 -2.11,0.75 0.08,1.53 -0.58,0.6 -0.36,1.19 -0.48,-0.26 -2.29,1.25 -0.55,1.36 0.26,0.44 -0.44,1.9 -4.59,-0.11 -1.69,0.88 -0.62,0.82 -4.43,3.21 -0.08,2.14 -1.05,0.86 -0.39,1.42 -1.33,0.37 -0.02,0.52 -0.57,-0.17 -0.2,0.37 -1,0.03 -1.15,0.57 -0.55,1.03 -0.38,0 -0.58,0.87 -0.5,-0.07 -0.35,0.5 -0.49,0.01 -1.66,3.06 -0.62,0.13 -0.29,1.07 -0.9,0.04 -0.48,0.41 -0.76,1.61 -0.43,-0.49 -0.53,0.38 -0.45,-0.07 0.15,0.97 0.73,1.04 1.71,0.98 0.97,0.97 -1.19,6.51 0,0 -0.59,3.49 0.17,2.44 -4.52,3.89 -11.2,3.74 -2.7,-1.99 -4.81,0.38 -1.04,0.37 -1.24,1.66 -2.78,-0.06 -0.35,1.39 -1.819998,-0.82 -1.4,-0.2 -0.13,-2.29 -1.85,-3.74 0.38,-0.79 -0.35,-0.8 0.46,-1.76 0,0 1.25,-0.1 -0.1,-1.33 0.78,0.21 0.47,-1.3 1.299998,-0.52 -0.399998,-1.51 1.329998,-0.33 0.67,-1.49 2.02,-0.18 0.78,-0.97 1.33,-0.11 2.81,-1.84 2.08,-0.4 0.24,-0.6 1.99,-1.08 1.57,-2.48 2.48,-0.21 0.29,-0.44 -0.63,-1.81 0.64,-0.99 1.32,-0.51 -0.81,-3.21 0.55,-1.66 -0.11,-0.78 -1.05,-0.93 0.03,-2.32 0.44,-0.67 -0.02,-1.25 0.61,-0.79 -0.03,-0.77 -1,-0.68 -0.42,-0.91 -4.2,-0.58 -1.74,0.22 -0.6,-0.54 -1.39,-0.37 -0.32,-0.51 -1.78,-0.67 -0.3,-1.47 1.61,-2.78 -0.72,-4.86 -1.12,-4.32 -1.12,-0.55 -1.47,0.53 -0.61,-0.09 -3.949998,-3.23 -1.16,-1.72 0.53,-0.54 -0.59,-2.86 0.34,-1.21 0.05,-0.61 -0.33,-0.43 0.19,-0.26 2.559998,-1.64 2.69,-0.95 0.75,-0.03 1.61,0.71 5.7,-0.34 3.99,-3.27 0.27,-1.48 -0.53,-1.54 2.02,-2.66 0.79,-1.62 -0.72,-6.12 -2.03,-3.8 0.46,-0.32 0,0 6.43,0.89 4.12,0.14 2.42,-1.12 8.22,-0.45 6.72,1.76 1.32,-1.83 z" 
                  {...{fill: deptoFill('Intibuca'), stroke: deptoStroke('Intibuca'), 'data-depto': 'Intibuca'}}
                  strokeWidth="1.2"
                  className="cursor-pointer transition-all duration-200 hover:opacity-90"
                  onMouseEnter={() => setHoveredDepto('Intibuca')}
                  onMouseLeave={() => setHoveredDepto(selectedDepto)}
                  onClick={() => setSelectedDepto('Intibuca')}
                />

                {/* Islas de la Bahia */}
                <path 
                  d="m 325.46094,172.16213 0.38,1.08 -0.28,0.59 -0.35,0 -0.73,-0.52 0.06,-0.26 0.57,-0.03 0.35,-0.86 z m 2.53,-1.84 0.95,0.62 -0.79,1.51 -0.54,-0.43 0.13,-0.72 -0.82,-0.16 0.25,-0.33 0.63,-0.03 0.19,-0.46 z m -47.01,-16.77 1.24,0.23 0.67,0.56 -0.22,1.11 -0.98,0.85 0.13,1.02 -0.79,0.59 -0.51,-0.06 0.13,-0.56 -0.44,-0.52 -0.98,0.26 -1.68,0.52 -0.16,0.36 0.67,-0.06 -0.47,0.56 -2.63,0.75 -1.55,0.89 -1.27,-0.1 -0.44,-0.75 -2.19,-0.62 0.03,-1.25 1.01,-1.02 1.01,0 0.13,-0.49 1.55,-0.52 0.38,0.46 1.11,-0.29 0.86,-1.57 0.89,-0.1 0.63,0.56 1.39,0.26 0.79,-0.69 1.69,-0.38 z m 69.82,-36.3 1.93,0.72 2.12,-0.33 1.93,0.43 3.07,-0.66 0.86,0.92 -1.55,-0.2 -2.57,1.84 -0.38,-1.02 -1.04,-0.43 -2.25,0.46 -0.28,-0.03 -0.82,-0.33 -0.7,1.02 -0.7,-0.2 -1.74,-0.23 -0.41,0.92 -2,0.33 -0.41,1.15 -0.95,0.26 -0.92,-0.2 -0.63,-0.16 -0.13,0.39 -0.85,0.26 -0.41,0.16 -0.95,0.2 -0.44,-0.16 -0.51,0.16 -0.54,-0.66 -0.44,0.1 0.54,1.08 -0.82,0.49 -0.38,-0.75 -0.25,0.03 0.25,1.02 -0.76,1.12 -0.76,-0.56 -0.44,0.13 0.32,0.36 -0.44,0.1 -1.05,-0.26 0.19,0.46 -0.25,0.39 -0.73,0.16 -1.42,0.13 0.1,-0.49 -0.38,-0.03 -0.63,0.72 -1.43,0.3 0.03,0.49 -0.95,0.2 -1.58,1.02 -0.16,0.13 -1.08,0.36 0.44,0.62 -0.28,0.1 -0.09,0.69 -1.3,0.23 -0.09,-1.02 -1.08,1.12 -0.6,-0.1 -2.19,1.15 -1.04,-0.36 -0.67,0.07 -0.57,0.16 -0.41,0.85 -2.88,2.85 -2.12,1.74 -0.41,0 0.86,-3.05 0.1,-2.16 0.76,-0.75 0.35,-0.1 4.34,-3.18 1.74,-0.46 0.79,-0.79 0.63,-0.07 0.35,0.13 0.44,0.23 1.58,-0.82 0.25,-0.72 1.14,0.2 2.85,-1.67 0.82,0.43 1.49,-0.33 1.49,-1.41 0.79,0.1 0.51,-0.59 1.14,-0.23 -0.09,-0.43 0.92,-0.66 0.03,0.36 0.48,0.07 0.6,-0.66 3.71,-1.18 1.71,-0.56 0.86,0.07 2.03,-0.56 1.14,-0.36 1.77,0.07 1.5,-0.33 z m 15.24,-1.91 0.48,0.36 1.46,-0.2 0.44,0.26 -2.12,1.67 -1.08,-0.69 -1.71,0.92 -0.28,-0.13 0.13,-0.72 0.92,-0.82 1.76,-0.65 z m 32.78,-8.21 1.59,0.39 0.06,0.46 -0.13,0.36 1.3,0.43 0.98,-0.69 0,0.79 0.76,0.36 -0.28,0.79 -1.52,0.85 -1.71,0.2 -0.22,0.39 -0.19,1.02 0.32,0.39 -1.52,1.9 -0.51,-0.16 -0.86,-0.46 -1.9,0.99 -0.54,0.76 -1.08,0.07 0.7,0.53 -1.84,1.02 -0.82,1.02 -0.76,0.13 -0.7,1.08 -2.03,0.99 0.6,-1.8 1.08,-1.61 -0.28,-0.52 0.79,-1.28 0.13,-0.89 0.86,-0.2 0.92,0.39 0.03,-1.58 1.08,-1.25 -0.19,-0.66 0.82,-0.03 1.08,-1.9 0.67,-0.59 0.79,-0.2 1.08,0.62 0.32,-0.43 -0.19,-0.79 1.31,-0.89 z" 
                  {...{fill: deptoFill('Islas de la Bahia'), stroke: deptoStroke('Islas de la Bahia'), 'data-depto': 'Islas de la Bahia'}}
                  strokeWidth="1.2"
                  className="cursor-pointer transition-all duration-200 hover:opacity-90"
                  onMouseEnter={() => setHoveredDepto('Islas de la Bahia')}
                  onMouseLeave={() => setHoveredDepto(selectedDepto)}
                  onClick={() => setSelectedDepto('Islas de la Bahia')}
                />

                {/* La Paz */}
                <path 
                  d="m 171.58094,354.33213 1.17,1.45 0.87,2.3 2.3,-0.14 1.2,0.42 1.33,-0.02 0.2,1.17 0.57,0.95 3.02,0.2 2.24,1.26 2.23,0.27 1.24,1.13 4.21,-2.62 0.28,0.26 0.34,-0.62 0.79,0.47 0.33,-0.48 -0.25,1.3 0.35,0.02 0.5,0.7 -0.05,1.1 0.26,0.49 0.4,0.04 -0.63,1.2 0.27,0.55 -0.17,0.31 0.38,0.1 -0.15,0.82 1.13,0.48 -0.96,1.05 0.52,0.14 0.57,2.13 -0.48,-0.21 -0.43,1.1 -0.77,-0.29 0.31,1.29 -1.25,0.7 -0.51,-0.75 -0.26,0.62 -0.64,-0.39 -0.63,1.09 -0.19,-0.65 -0.84,0.57 -0.3,-0.8 -0.24,0.5 -1.78,1.26 -1.38,-0.26 -1.01,0.3 -0.25,0.37 -1.14,0.18 -0.67,1.09 -1.5,-0.33 -0.91,0.53 -0.69,-0.18 -0.49,0.26 -0.59,-1.02 -3.81,1.72 -0.14,-0.65 -1.28,0.68 -0.4,0.73 0.83,1.1 0.07,1.53 4.02,1.15 1.95,3.12 -1.76,1.11 0.01,1.79 2.81,0.71 2.25,0.07 2.59,4.24 1.78,-1.14 1.15,2.58 -0.41,0.24 0.02,1.55 -0.33,0.12 0.33,0.31 -0.02,1.08 0.31,0.16 -0.33,0.14 0.19,0.56 0.97,-0.63 0.19,-0.8 1.92,-1.58 0.19,-0.95 0.64,-0.56 0.74,-0.27 3.08,0.25 0,0 1.19,6.12 -0.05,3.76 1.44,2.15 -0.6,1.13 0.55,0.41 0.09,0.53 -0.8,2.14 0.19,2.07 -0.63,1.77 0.2,1.51 -1.51,1.09 0.11,2.11 -0.8,1.78 -1.71,1.53 -0.51,1.31 0,0 -2.68,-0.01 -0.93,-1.18 -1.37,-0.58 -0.36,-0.58 -2.84,0.11 -2.63,0.93 0,0 -0.58,-2.85 -2.81,-1.32 -2.84,-2.25 -2.28,0.66 -1.1,-0.05 -2.33,-0.81 -2.71,-0.24 -1.07,-0.75 -0.94,0.4 -1.83,-0.35 -2.52,1.45 -1.58,-0.78 -0.86,0.29 -0.87,-0.8 -5.96,3.41 -0.55,-2.11 -5.91,-8.48 -0.04,-2.26 -2.88,-0.19 -1.35,-0.74 -3.02,1.2 -1.47,-0.2 -0.4,0.62 -1.25,0.28 -0.21,-0.4 -1.02,0.13 -0.34,-0.67 -0.43,0.02 -1.55,-0.07 -0.44,-0.68 -2.05,0.34 0,0 1.19,-6.51 -0.97,-0.97 -1.71,-0.98 -0.73,-1.04 -0.15,-0.97 0.45,0.07 0.53,-0.38 0.43,0.49 0.76,-1.61 0.48,-0.41 0.9,-0.04 0.29,-1.07 0.62,-0.13 1.66,-3.06 0.49,-0.01 0.35,-0.5 0.5,0.07 0.58,-0.87 0.38,0 0.55,-1.03 1.15,-0.57 1,-0.03 0.2,-0.37 0.57,0.17 0.02,-0.52 1.33,-0.37 0.39,-1.42 1.05,-0.86 0.08,-2.14 4.43,-3.21 0.62,-0.82 1.69,-0.88 4.59,0.11 0.44,-1.9 -0.26,-0.44 0.55,-1.36 2.29,-1.25 0.48,0.26 0.36,-1.19 0.58,-0.6 -0.08,-1.53 2.11,-0.75 -0.3,-0.29 0.37,-0.15 -0.17,-0.81 0.42,-0.62 -0.41,-0.85 -0.49,0.01 0.23,-1.35 -0.26,-0.1 0.14,-0.41 -0.57,-0.17 0.94,-0.93 -0.36,-0.61 0.09,-1.25 0.95,0.11 0.11,0.55 1.79,0.21 0.62,-0.3 0.45,0.34 0.81,-0.06 1.4,-1.39 3.8,-2.19 0.7,-1.06 z" 
                  {...{fill: deptoFill('La Paz'), stroke: deptoStroke('La Paz'), 'data-depto': 'La Paz'}}
                  strokeWidth="1.2"
                  className="cursor-pointer transition-all duration-200 hover:opacity-90"
                  onMouseEnter={() => setHoveredDepto('La Paz')}
                  onMouseLeave={() => setHoveredDepto(selectedDepto)}
                  onClick={() => setSelectedDepto('La Paz')}
                />

                {/* Lempira */}
                <path 
                  d="m 81.500942,297.19213 1.91,0.39 0.84,-0.21 1.15,-1.09 -0.33,-0.82 0.6,-1.43 2.55,1.06 3.04,0.72 0.55,-0.26 2.56,7.28 4.95,7.11 2.049998,-0.79 1.67,-3.99 1.39,-0.72 2.86,1 0.89,1.57 0.81,0.11 0.9,-0.51 2.03,0.25 1.74,1.64 -0.94,2.86 -1.94,3.36 1.38,2.05 0.48,1.93 2.12,1.76 4.24,-1.73 -0.36,5.73 -2.97,3.58 0,0 -0.46,0.32 2.03,3.8 0.72,6.12 -0.79,1.62 -2.02,2.66 0.53,1.54 -0.27,1.48 -3.99,3.27 -5.7,0.34 -1.61,-0.71 -0.75,0.03 -2.69,0.95 -2.559998,1.64 -0.19,0.26 0.33,0.43 -0.05,0.61 -0.34,1.21 0.59,2.86 -0.53,0.54 1.16,1.72 3.949998,3.23 0.61,0.09 1.47,-0.53 1.12,0.55 1.12,4.32 0.72,4.86 -1.61,2.78 0.3,1.47 1.78,0.67 0.32,0.51 1.39,0.37 0.6,0.54 1.74,-0.22 4.2,0.58 0.42,0.91 1,0.68 0.03,0.77 -0.61,0.79 0.02,1.25 -0.44,0.67 -0.03,2.32 1.05,0.93 0.11,0.78 -0.55,1.66 0.81,3.21 -1.32,0.51 -0.64,0.99 0.63,1.81 -0.29,0.44 -2.48,0.21 -1.57,2.48 -1.99,1.08 -0.24,0.6 -2.08,0.4 -2.81,1.84 -1.33,0.11 -0.78,0.97 -2.02,0.18 -0.67,1.49 -1.329998,0.33 0.399998,1.51 -1.299998,0.52 -0.47,1.3 -0.78,-0.21 0.1,1.33 -1.25,0.1 0,0 1.16,-2.01 -0.02,-0.62 -1.12,-1.17 -1.89,-1.07 -1.52,-0.24 -3.13,0.51 -0.51,-0.25 -2.24,-3 -0.69,-0.12 -0.82,0.51 -0.59,-0.02 -2.39,-1.82 -0.89,0.03 -0.4,0.51 -1.13,-0.16 -0.43,0.4 -0.96,-0.37 -1.45,0.86 -0.76,-0.34 -3.45,-3.13 -2.5,-3.7 -2.08,-1.79 -5.9,0.82 -1.51,-0.37 -4.09,-7.73 -1.38,-3.63 -3.85,-1.63 -1.14,-1.34 -5.44,0.1 -1.18,-0.92 0,0 0.44,-1.02 -0.7,-3.17 0.79,-1.65 -1.7,-3.36 1.24,-0.18 1.68,-1.2 -0.2,-0.51 0.68,-0.56 0.57,-2.27 4.43,-0.52 2.38,-1.11 1.15,-2.05 0.07,-4.07 2.18,0.36 0.28,1.04 2.14,1.5 3.49,-0.08 -2.21,-2.11 0.54,-1.26 0.18,-1.61 2.69,1.64 4.66,-1.77 0.73,-0.42 0.73,-1.13 0.6,0.25 -0.27,-1.73 0.73,-0.53 -0.17,-1.64 0.64,-0.72 0.65,-2.67 0.63,-1.04 -0.16,-1.23 0.41,-1.46 -1.03,-1.05 -2.11,-0.14 -1.21,0.5 -2.81,-1.02 0,0 0.66,-2.23 1.57,-2.96 0.74,-0.16 2.09,-1.82 -2.27,-3.74 -0.81,-0.68 -1.67,-0.32 -2.79,-5.91 0.47,-0.13 0.14,-1.17 0.61,-0.61 1.72,0.77 2.1,-0.19 2.69,0.88 3.21,-0.68 1.56,0.14 1.15,-1.25 0.86,0.45 0.74,-0.24 0.12,0.47 0.46,-0.54 0.53,0.13 0.01,0.45 0.45,-0.13 0.06,-1.23 -0.47,-0.37 -0.33,-1.12 -0.51,-0.2 0.55,-0.93 -0.6,-0.55 -0.37,-2.55 -1.32,-0.55 -0.21,-0.46 0.53,-2.21 -0.23,-1.2 0.98,-2.23 1.97,-1.28 -0.44,-1.53 0.4,-0.94 1.13,0.09 -0.54,-0.87 -0.17,-1.2 1.23,-1.92 z" 
                  {...{fill: deptoFill('Lempira'), stroke: deptoStroke('Lempira'), 'data-depto': 'Lempira'}}
                  strokeWidth="1.2"
                  className="cursor-pointer transition-all duration-200 hover:opacity-90"
                  onMouseEnter={() => setHoveredDepto('Lempira')}
                  onMouseLeave={() => setHoveredDepto(selectedDepto)}
                  onClick={() => setSelectedDepto('Lempira')}
                />

                {/* Ocotepeque */}
                <path 
                  d="m 24.980942,321.24213 1.7,-0.79 2.56,-0.79 1.38,0.03 0.59,-0.37 1.87,1.2 1.87,0.28 2.46,-0.37 1.28,0.56 0.76,-0.16 0.69,2 -0.2,0.84 0.79,1.51 -0.14,1.3 0.64,1.15 1.46,1.69 2.75,1.38 4.25,3.95 -0.02,0.71 -0.53,0.16 0.24,0.79 -0.49,0.69 0.19,1.36 -0.66,0.39 0.75,0.63 1.42,0.04 -0.36,1.82 2.35,2.7 4.67,0.86 0.83,1.77 2.44,-0.66 -0.58,-1.24 0.43,-0.88 -0.53,-0.77 -0.11,-1 0.71,-0.31 1.59,0.49 1.68,-1.23 2.51,-0.74 0,0 2.81,1.02 1.21,-0.5 2.11,0.14 1.03,1.05 -0.41,1.46 0.16,1.23 -0.63,1.04 -0.65,2.67 -0.64,0.72 0.17,1.64 -0.73,0.53 0.27,1.73 -0.6,-0.25 -0.73,1.13 -0.73,0.42 -4.66,1.77 -2.69,-1.64 -0.18,1.61 -0.54,1.26 2.21,2.11 -3.49,0.08 -2.14,-1.5 -0.28,-1.04 -2.18,-0.36 -0.07,4.07 -1.15,2.05 -2.38,1.11 -4.43,0.52 -0.57,2.27 -0.68,0.56 0.2,0.51 -1.68,1.2 -1.24,0.18 1.7,3.36 -0.79,1.65 0.7,3.17 -0.44,1.02 0,0 -1.08,-0.25 -0.26,-0.5 0.44,-0.96 -1.81,-2.97 -4.23,-2.7 -0.3,-0.64 0.72,-1.18 -0.3,-2.29 -0.52,-1.15 -1.42,-0.99 -1.05,-0.08 -4.32,-2.14 -5.22,1.09 -3.59,-0.37 -0.98,-0.39 -3.5,-3.12 -1.21,-0.67 -4.73,-0.53 -4.4800002,-1.16 -3.76,-1.9 -2.10999998,-1.88 -0.12,-4.08 0.26,-1 3.76999998,-1.74 2.18,-1.58 -0.21,-1.24 2.01,-1.5 0.83,-2.24 2.0400002,-1.76 0.72,-1.89 1.02,-0.95 1.46,-0.78 1.11,-0.1 4.55,1.5 1.04,0.15 1.5,-0.31 1.04,-3.54 -0.76,-7.07 z" 
                  {...{fill: deptoFill('Ocotepeque'), stroke: deptoStroke('Ocotepeque'), 'data-depto': 'Ocotepeque'}}
                  strokeWidth="1.2"
                  className="cursor-pointer transition-all duration-200 hover:opacity-90"
                  onMouseEnter={() => setHoveredDepto('Ocotepeque')}
                  onMouseLeave={() => setHoveredDepto(selectedDepto)}
                  onClick={() => setSelectedDepto('Ocotepeque')}
                />

                {/* Olancho */}
                <path 
                  d="m 356.04094,237.33213 7.54,4.63 1.83,0.39 0.5,0.01 0.9,-0.63 1.38,0.09 1.4,-0.67 1.27,-1.32 1.33,0.57 0.49,-1.42 4.1,0.46 1.07,1.23 1.38,-0.27 0.24,-0.89 0.57,-0.51 1.41,0.23 0.48,-0.83 1.3,0.1 0.45,-0.95 1.17,0.11 0.57,-0.81 0.88,-0.31 0.43,-1.9 2.03,-2.28 0.47,-0.29 1.05,0.19 0.34,-0.21 4.76,-4.71 -0.56,-2.33 0.9,-0.95 2.21,-0.2 0.59,0.89 1.08,-0.01 0.87,0.52 1.19,0.12 0.55,-1.04 2.01,-2.2 2.07,-0.54 0.79,-0.52 0.21,-0.48 -0.36,-1.16 0.17,-0.72 1.38,-0.22 1.13,-0.8 0.67,0.3 1.38,1.69 1.35,0.26 0.76,-0.32 0.64,-0.93 1.49,-0.56 12.45,6.19 6.82,7.19 2.67,1.91 16.03,5.86 6.43,9.75 9.71,12.54 15.63,3.88 11.44,13.14 0,0 -0.34,18.22 0.13,21.25 0,0 -1.8,1.23 -1.88,1.89 -0.06,1.07 0.61,0.52 -0.97,1.8 -1.31,-0.13 -0.76,0.56 -0.22,0.64 0.29,0.89 2.11,1.43 0.53,1.08 -0.28,0.78 -1.55,1.56 0.21,0.41 1.59,0.18 0.15,0.46 -2.27,3.47 -1.73,0.84 -0.98,1.28 -1.42,-0.12 -0.95,0.71 -0.57,-0.08 -1.01,-0.98 -1.19,-1.87 -1.45,-0.69 -1.24,1.04 -1.3,0.12 -0.24,0.43 1.19,2.16 -0.42,1.19 0.56,1.21 0.04,1.75 -0.7,0.75 -0.63,1.98 -3.15,3.31 -1.07,3.7 -0.89,1.23 -1.28,3.43 -2.14,2.67 0.66,0.86 1.8,0.34 0.3,2.35 1.25,1.3 1.05,-0.31 0.32,2.58 0.21,0.3 1.4,0.28 0.72,0.87 -2.93,5.02 -0.38,0.34 -0.59,-0.06 -0.58,-1.05 -1.51,0.49 -1.29,-0.43 -1.22,0.4 -1.63,-0.54 -3.62,0.04 -2.08,1.01 -1.22,-0.66 -1.14,-0.02 -1.26,0.86 -1.17,0.31 -0.32,1.44 -1.82,2.16 -1.19,-0.18 -0.31,-1.11 -1.03,0.24 -0.24,0.67 0.79,0.97 -0.12,1.61 -0.6,0.75 0.39,1.05 -0.19,0.48 -2.36,2.28 0.36,2.32 -0.7,0.45 -0.25,0.88 -1.08,0.47 -0.36,0.62 -0.8,0.04 -0.39,1.05 -0.94,-0.15 -0.7,0.37 -0.9,-1.03 -0.62,0.11 -0.28,0.8 -1.02,0.53 -0.28,1.04 -0.99,-0.14 -0.34,1.42 -1.27,-1.47 -0.26,1.8 -0.64,-0.11 -0.53,-0.87 -0.44,0.56 -0.39,2.28 -0.81,0.21 -0.39,1.63 -3.81,-0.21 -0.62,-0.46 0.06,-1.53 -1.54,0.29 0,0 -0.08,-0.75 -0.74,-1.23 -1.34,-0.3 -0.33,-0.51 -2.39,-1.4 -0.3,-1.49 0.96,-1.19 0.27,-1.23 -0.83,-0.85 -0.57,-1.22 0.07,-0.51 -0.63,-0.82 -1.94,-0.85 -1.96,-2.72 -0.7,0.37 -0.36,1.53 -0.83,0.04 -1.39,-0.78 -3.56,-0.92 -3.4,0.75 -0.79,-0.24 -0.77,-1.19 -0.73,0.06 -1.76,3.17 -0.96,0.99 -2.12,-0.45 -3.04,-2.14 -4.12,1.94 -0.59,0.95 -0.1,1.84 -1.03,1.77 -2.62,0 -1.43,-0.89 -0.58,-1.39 -1.99,-2.52 -2.62,-0.41 -1.86,-0.68 -1.13,-1.53 -0.27,-2.24 -0.39,-0.89 -1.6,-2.11 -1.45,-3.31 -0.62,0.09 -1.68,-0.44 -0.22,-0.4 -0.99,-0.1 -0.9,0.76 -0.15,1.38 0.27,0.47 -0.25,0.14 -8.35,-2.23 -3.99,-9.39 -6.24,0.44 -4.77,1.34 -0.72,0.99 -1.97,0.49 -2.04,1.96 -2.96,1.54 -1.54,1.21 -0.82,-0.25 -0.78,0.57 -1.14,-0.01 -8.5,-0.77 -0.82,-2.94 -1.38,-1.09 -0.5,-1.02 -4.23,-0.38 -0.88,-1.93 -0.65,-0.04 -0.87,-1.23 -8.52,-1.9 -1.25,0.93 -0.61,-0.97 -0.08,-1.24 -1.31,-0.94 -0.5,-0.85 -1.24,0.21 -0.84,-0.38 -0.56,1.14 -0.42,0.09 -1.02,-0.36 -0.51,-0.89 -4.85,-1.47 0,0 0.3,-1.41 -2.63,-5.37 0.51,-1.22 -0.08,-1.85 -1.43,-0.41 -0.81,-2.5 0.06,-1.7 0.88,-3.74 -1.85,-1.12 -0.26,-1.3 -0.74,-1.02 -3.14,-1.92 -0.34,-1.44 -0.5,-0.54 -2.71,-0.01 -1.73,-2.28 -1.93,-1.07 -1.75,-4.36 -1.1,-4.59 -2.63,-2.84 1.09,-3.4 -2.18,-1.15 -0.02,-1.49 0.62,-0.21 -0.33,-1.69 -1.31,-3.07 -1.63,-0.99 0.12,-1.38 -0.58,-1.72 0.11,-0.4 1.17,-0.81 0,-1.1 1.33,-2.13 0.98,-0.47 -3.33,-1.6 -0.09,-1.14 -0.33,-0.34 -3.43,-0.86 -0.62,-1.65 -1.69,-1.86 -0.67,-1.24 0,0 1.39,-2.23 1.08,-1.08 1.05,-0.37 2,0.57 1.16,-0.35 0.89,0.42 0.35,-0.62 -0.01,-1.92 0.28,-0.73 1.68,-0.53 0.87,-0.88 1.16,0.35 0.56,-0.47 -0.36,-2.53 0.61,-0.18 -0.08,-1.88 0.45,-0.67 0.79,-0.42 0.14,-0.49 0.48,-0.15 0.26,-1.05 -0.72,-0.37 1.07,-1.66 0.02,-1.99 -0.91,-2.06 -0.67,-4.34 0.41,-1.98 0.97,-1.02 1.04,-0.03 1.39,-1.21 1.8,-0.43 0.33,-1.68 2.67,0.86 0.15,-0.44 1.12,-0.5 0.77,-1.24 1.58,0.89 0.22,1.17 0.71,0.97 1.91,0.56 1.78,-0.31 2.21,0.37 3.08,-1.91 1,-0.29 0.14,-1.08 1.63,-1.27 0.27,-3.9 1.79,-0.61 0.71,0.57 0.93,0.04 1.36,-0.76 0.71,-1.07 3.93,-1.92 1.47,-0.09 0.62,-0.93 2.78,-1.63 1.2,-0.07 0.68,0.63 1.07,-0.97 1.58,-0.32 0.3,-0.31 -0.11,-0.83 4.14,1.09 0.52,1.48 0.77,0.6 -0.2,0.61 0.49,-0.04 -0.16,0.39 0.99,-0.06 0.7,0.5 0.28,-0.45 0.34,0.11 0.87,1.05 1.36,4.31 1.21,0.19 1.25,-0.33 3.96,-2.1 8.39,-4.98 0.7,-0.02 z" 
                  {...{fill: deptoFill('Olancho'), stroke: deptoStroke('Olancho'), 'data-depto': 'Olancho'}}
                  strokeWidth="1.2"
                  className="cursor-pointer transition-all duration-200 hover:opacity-90"
                  onMouseEnter={() => setHoveredDepto('Olancho')}
                  onMouseLeave={() => setHoveredDepto(selectedDepto)}
                  onClick={() => setSelectedDepto('Olancho')}
                />

                {/* Santa Barbara */}
                <path 
                  d="m 104.75094,222.13213 22.56,6.52 0.34,1.09 -0.84,1.23 -0.08,0.95 0.48,1.52 -0.59,1.78 0.31,0.57 -0.2,0.7 0.4,0.2 0.96,2.2 1.5,0.25 2.71,1.09 0.97,1.58 0.68,0.14 1.77,1.4 1.98,-0.69 1.82,0.75 0.84,12.79 1.55,1.83 1.09,3.69 4.57,0.59 -0.44,0.77 -0.07,1.37 -1.5,1.27 -0.04,1.12 -0.82,0.5 -0.69,1.31 -0.86,0.4 -1.92,2.88 1.79,2.68 2.26,2.02 1.59,0.07 0.6,0.88 2.87,0.32 1.56,1.77 -0.27,1.31 -0.65,0.9 -0.24,5.08 -1.07,1.04 -1.28,7.82 3.58,-1.01 0.04,0.35 -0.8,0.71 0.1,0.41 -0.53,0.19 -0.11,1.15 0.46,-0.24 -0.18,0.34 0.22,0.1 0.57,-0.65 -0.21,1.06 0.64,0.52 0.32,0.78 -0.23,0.75 -0.43,0.11 1.1,0.29 1.14,-0.13 1.18,0.96 -0.73,2.76 -0.31,3.36 0.54,1.99 0.77,1.36 0,0 -3.72,3.89 -2.32,0.96 -4.3,4.79 0.03,0.75 1.28,0.26 2.08,3.22 -2.64,2.29 0,0 -1.03,0.29 -1.32,1.83 -6.72,-1.76 -8.22,0.45 -2.42,1.12 -4.12,-0.14 -6.43,-0.89 0,0 2.97,-3.58 0.36,-5.73 -4.24,1.73 -2.12,-1.76 -0.48,-1.93 -1.38,-2.05 1.94,-3.36 0.94,-2.86 -1.74,-1.64 -2.03,-0.25 -0.9,0.51 -0.81,-0.11 -0.89,-1.57 -2.86,-1 -1.39,0.72 -1.67,3.99 -2.049998,0.79 -4.95,-7.11 -2.56,-7.28 -0.55,0.26 -3.04,-0.72 -2.55,-1.06 -0.6,1.43 0.33,0.82 -1.15,1.09 -0.84,0.21 -1.91,-0.39 0,0 0.33,-0.83 -0.75,-0.49 -1.25,0.01 -1.94,1.13 -1.48,-0.21 -1.56,-3.55 1.81,-4.81 0.74,-0.8 0.59,-5.59 2.18,-2.28 1.5,-0.22 0.6,-0.63 0.1,-0.74 -0.66,-0.93 -0.26,-1.31 -2.25,-2.24 0.09,-2.33 0.44,-1.4 1.36,-0.9 -2.52,-1.75 -1.08,0.04 -0.67,-0.81 -0.63,-2.12 -0.98,-0.4 -1.39,-1.85 -1.3,-0.6 1.27,-3.12 -6.27,-6.62 0,0 8.67,-5.55 4.91,-4.13 4.6,-4.83 2.14,-1.39 0.51,0.26 1.14,-0.63 z" 
                  {...{fill: deptoFill('Santa Barbara'), stroke: deptoStroke('Santa Barbara'), 'data-depto': 'Santa Barbara'}}
                  strokeWidth="1.2"
                  className="cursor-pointer transition-all duration-200 hover:opacity-90"
                  onMouseEnter={() => setHoveredDepto('Santa Barbara')}
                  onMouseLeave={() => setHoveredDepto(selectedDepto)}
                  onClick={() => setSelectedDepto('Santa Barbara')}
                />

                {/* Valle */}
                <path 
                  d="m 195.23094,484.61213 0.63,0.58 0.82,0 0.38,0.61 0.63,-0.39 0.41,0.22 0.28,0.89 -0.44,0.41 0.67,0.52 -0.44,1.94 -2.06,1.03 -2.98,-0.26 -0.51,-1.13 0.31,-1.24 -0.41,-0.51 -0.38,0 0.07,-0.33 0.44,0.2 0.41,-0.23 -0.18,-0.48 0.5,-0.45 0,-0.84 0.67,-0.26 0.25,0.23 0.93,-0.51 z m -3.83,-3.79 0.76,0.98 0.1,0.65 -1.11,0.55 0.19,0.58 -0.47,0.45 -0.16,-0.74 -0.51,-0.48 0.34,-0.16 0.16,-0.84 0.7,-0.99 z m 10.92,-3.41 1.28,0.35 0.67,-0.06 0.47,1.1 1.36,0.28 0.48,0.56 -0.57,0.52 -3.2,0.29 -0.04,-0.65 0.38,-0.61 -0.24,-0.36 -1.01,-0.26 -0.75,-0.47 1.17,-0.69 z m -2.11,-2.25 1.01,0.36 0.76,-0.26 1.01,0.26 0.44,0.45 -0.38,0.16 0.22,0.46 1.05,0.29 -0.38,0.68 -1.68,-0.39 -0.95,0.58 -0.79,0.03 0.76,0.81 1.55,0.55 -0.51,0.81 0.44,1.61 -0.82,0.65 0.13,1.33 -0.98,0.23 -0.32,-0.36 -0.57,-0.42 -0.31,0.39 -0.92,0.03 -0.28,-0.35 -0.63,0.58 -3.39,-1.26 -0.28,-0.89 -1.29,-1.06 -0.13,-1.39 0.89,-0.42 -0.44,-0.52 0.03,-1.29 0.92,0.42 0.63,-1.29 0.79,-0.16 0.63,1.03 1.05,0.16 1.43,-0.68 0.41,-0.88 0.9,-0.25 z m 15.65,-3.02 0.22,0.47 -0.29,0.69 0.63,0.48 0.83,-0.39 0.44,1.1 1.46,0.1 -1.17,1.26 -1.46,-0.23 -1.36,0.49 -1.33,-1.59 0.35,-1.68 0.38,0.13 1.3,-0.83 z m 0.22,-1.12 1.41,0.29 0.03,0.35 -0.8,0.2 -0.1,0.62 0.54,0.29 1.49,-0.1 0.6,1.39 -1.24,0.2 -0.33,-0.3 -0.16,-0.87 -0.52,0 -0.53,0.49 -0.47,-0.33 0.3,-0.69 -0.39,-1.24 0.17,-0.3 z m 1.64,0.97 -0.13,-0.87 -1.49,-0.26 -0.35,0.13 -0.25,1.13 -0.38,0.23 -0.85,-0.03 -0.27,0.3 -0.39,1.61 -0.28,-0.61 -0.16,0.29 1.01,2.4 0.03,0.78 -0.41,0.74 -1.17,-0.19 -0.06,-0.46 -1.08,-1.16 -1.24,-0.36 1.11,-1.2 -0.41,0.06 -0.89,0.75 0.01,0.25 -0.26,0.01 -0.41,-0.19 0.35,1.03 1.36,-0.23 -0.03,1.59 -0.92,0.49 -0.25,-0.61 -0.41,0.61 -0.28,-0.06 -0.06,0.71 -1.74,0.58 -1.14,-0.91 -1.27,-0.19 -0.38,-0.68 0.57,-1.03 0.76,-0.48 -0.16,-0.03 -1.28,0.55 -0.98,-0.37 0.19,-0.3 -0.56,-0.61 -1.11,-0.27 -1.54,-0.1 0.67,-0.61 -1.78,0.42 -1.04,0.81 -0.51,0.03 0.06,-0.81 0.57,-0.58 0.1,-0.61 0.82,-0.36 0.26,-1.16 -0.73,0.49 -0.51,-0.74 -2.03,-0.71 0.28,-0.71 0.98,0.19 -0.48,-0.55 0.44,-1.16 -0.53,-0.29 0.22,-0.97 0.25,-0.26 -0.09,-0.45 0.73,-0.43 0.13,-0.51 -0.95,0.07 -0.09,-0.23 0.6,-0.26 -0.22,-0.32 -0.67,-0.29 -0.89,0.23 -0.22,0.1 -0.73,0.39 -0.54,0.52 -1.14,0.29 0.13,0.68 -0.32,0.65 -0.35,0.06 -0.09,0.65 1.01,0.2 0.38,2.14 -0.73,1.46 -0.7,0 0.44,0.61 0.13,0.46 -0.25,0.58 -0.85,-0.42 -0.76,0.26 0.06,0.97 -0.42,0.14 0.01,0.91 -0.38,0.39 -0.66,0.19 -0.97,-0.42 -0.04,0.71 -2.57,0.26 -0.13,0.78 -2.44,0.03 -0.82,-0.06 -0.63,-0.23 -1.49,-1.94 -0.66,-0.29 -1.46,0.22 -0.22,-0.32 -0.6,-0.26 -0.95,-0.42 0,-0.65 -0.31,-0.16 -0.35,-0.23 -0.73,-1.07 1.9,-0.08 0.96,-1.46 1.47,-0.09 0.27,-0.58 1.68,-1.22 0.75,0.33 1.12,-0.97 1.68,0.04 0.84,-2.65 -0.75,-2.8 0.29,-1.72 -2.1,-0.77 -0.91,0.39 -0.54,-0.86 -1.39,1.05 -1.21,-0.49 -0.64,0.14 -0.17,-0.8 -0.86,-0.51 -0.05,-0.38 0.73,-0.92 -0.5,-1.08 0.18,-1.89 0.79,-1 -0.63,-0.62 1.08,-0.4 0.25,-1.12 2.03,-2.49 0.03,-3.27 0.55,-3.11 -0.34,-2.56 0.16,-1.12 0.45,-0.85 1.86,-1.85 0.69,-1.81 -0.09,-0.63 -0.7,-0.56 -0.05,-0.75 0.48,-1.09 0.97,-0.91 1.21,-1.96 0.09,-4.05 -1.07,-0.67 -1.05,-0.14 -1.42,-1.13 -0.45,-0.8 0,0 2.64,-0.93 2.83,-0.11 0.36,0.58 1.37,0.59 0.93,1.17 2.68,0.02 0,0 -0.19,2.55 0.34,2.96 -0.43,0.82 -0.25,3.45 1.07,-0.58 1.28,0.1 3.51,2.43 1.7,0.68 4.52,-0.45 0.27,0.9 2.35,1.47 0.58,0.79 2.81,0.75 0.38,0.46 0.27,-0.19 0.53,0.39 0.86,0.04 0.81,0.94 1.1,0.1 0,0 0.72,1.51 3.08,1.47 1.6,1.19 -1.82,5.29 1.43,0.55 0.53,0.98 -0.34,0.75 1.68,3.26 1.08,1.18 3.43,1.61 -0.18,2.3 -0.57,1.39 0.12,1.17 2.92,4.35 -0.45,0.35 0.14,1.12 -0.65,0.69 -0.57,2.02 -1.93,0.9 -0.68,-0.28 -0.27,0.19 -0.26,0.48 0.27,0.37 -0.31,0.22 0,0 -0.54,0.2 -0.14,1.45 -0.42,0.44 -1.25,-0.17 -0.41,-0.13 -0.92,0.36 -1.08,1.49 -0.38,-0.71 0.06,-1.39 0.98,-3.33 1.33,0.71 0.95,-0.42 0.19,-0.06 0.79,0.32 0.1,-0.23 -0.29,-0.36 -1.39,0.07 0.48,-0.39 -0.1,-1.07 -0.6,-0.19 -0.73,0.74 0.1,-1.16 -1.3,0.81 0.35,0.26 -1.05,1.88 -0.82,-0.94 -0.83,-0.41 z" 
                  {...{fill: deptoFill('Valle'), stroke: deptoStroke('Valle'), 'data-depto': 'Valle'}}
                  strokeWidth="1.2"
                  className="cursor-pointer transition-all duration-200 hover:opacity-90"
                  onMouseEnter={() => setHoveredDepto('Valle')}
                  onMouseLeave={() => setHoveredDepto(selectedDepto)}
                  onClick={() => setSelectedDepto('Valle')}
                />

                {/* Yoro */}
                <path 
                  d="m 183.57094,285.26213 0.72,-0.75 -0.98,-0.87 -0.76,-2.55 0.5,-1.21 -0.01,-1.88 0.95,-0.55 0.34,-0.64 0.02,-0.35 -0.53,-0.42 0.22,-0.67 -0.4,-0.55 0.73,-1.18 -0.95,-0.35 -1.44,-1.47 -0.17,-0.78 -1.54,-0.93 -1.28,0.8 -1.87,-0.31 -0.16,-0.31 0.36,-0.18 0.08,-0.66 -0.74,-0.94 -1.32,0.65 -0.69,-1.11 -2.34,0.44 -0.58,-0.18 -0.42,-0.5 0.29,-1.08 -1.25,-0.49 -0.75,-1.52 -1.48,-0.17 -2.01,0.45 -1.57,-0.95 -1.23,-0.19 -0.14,-0.45 0.57,-0.52 -0.71,-0.6 0.63,-1.13 -0.76,-1.04 0.48,-1.27 -1.52,1.01 -0.35,-2.03 0.57,-1.38 -0.19,-1.11 0.46,-0.18 1.24,0.27 0.66,-0.36 0.16,-1.34 -1.59,-0.4 -0.26,-0.32 0.52,-1.2 1.81,-0.09 -0.09,-0.48 -1.12,-0.99 0.02,-0.74 1.14,-0.28 1.33,0.32 0.51,-0.49 0.21,-1.67 0.37,-0.46 1.2,1.02 0.74,-0.05 0.19,-0.81 -1.54,-0.28 -0.05,-0.6 2.17,-1.48 1.19,-1.5 0.99,-3.32 1.58,0.39 0.54,-0.42 0.08,-1.21 -0.63,-2.12 -2.45,-1.47 -1.76,-0.45 -0.24,-0.7 0.78,-0.48 2.47,-0.13 0.52,2.1 0.63,0.27 1.68,-2.2 0.13,-1.02 -0.32,-0.67 -1.89,-0.79 0.49,-1.79 -1.44,-1.04 0.02,-0.59 0.93,-1.21 -0.55,-1.45 0.81,-0.31 1.27,1.17 0.71,-0.08 0.14,-0.77 -0.99,-1 -0.22,-1.58 0.26,-0.59 1.01,-0.22 0.59,-0.6 -0.73,-2.31 0.38,-0.42 0.76,0.09 1.08,0.69 0.56,0.95 0.7,-0.15 0.24,-0.67 -1.35,-2.33 0.61,-0.46 1.42,0.43 0.07,-2.05 -1.1,-1.13 0.3,-1.65 -0.36,-0.75 -0.91,-0.16 -1.68,0.43 -1.2,-0.65 -0.25,-0.82 0.7,-1.03 -0.14,-0.61 -0.65,0.02 -0.78,1.27 -0.99,-0.57 -0.19,-0.88 0.55,-1.65 0.73,-0.55 1.23,0.08 -0.01,-0.85 -0.6,0.04 -0.95,0.69 -1.04,-0.33 -0.94,0.2 1.39,-1.71 2.24,-0.88 0.45,-2.22 0.9,0.13 1.28,1.56 0.79,-0.52 0.2,-0.86 0,0 0.16,0.64 -0.3,0.92 0.35,0.55 2.8,0.44 1.12,1.91 0.47,-0.06 0.1,0.34 0.77,0.21 0.7,0.89 1.66,0.15 -0.01,0.52 0.85,-0.28 0.25,1.41 1.37,1.01 0.03,3.56 0.47,1.62 -0.25,1.18 0.47,0.97 0.13,0.85 -0.24,0.39 0.48,0.62 -0.14,0.36 0.77,1.2 0.15,0.85 0.91,0.25 0.8,1.45 1.02,0.28 0.86,1.79 0.9,0.93 1.36,0.34 4.36,-0.23 1.68,-0.32 -0.03,-0.27 1.09,-0.43 0.45,0.33 0.58,-0.11 0.68,-0.61 0.89,-0.24 0.75,0.13 0.61,0.93 0.47,-0.51 2.49,-0.76 1.37,-1.73 1.2,-0.01 0.45,-0.5 1.2,1.54 1.54,0.18 -0.25,0.9 0.34,0.58 -0.4,0.08 0.16,0.6 -0.51,0.18 0.22,0.58 -0.19,0.88 0.88,0.97 -0.66,0.69 1.3,0.81 0.37,0.91 -0.16,0.81 0.47,-0.16 0.18,0.72 0.39,-0.18 0.31,0.65 0.35,-0.24 0.73,0.29 -0.31,0.48 0.35,-0.08 0.02,0.4 0.89,-0.4 -0.1,0.8 0.6,-0.06 -0.2,0.27 0.24,0.46 0.58,0.07 -0.03,0.26 1.9,-0.63 1.19,-1.2 0.87,-0.37 0.86,0.63 1.07,-0.1 1.1,1.43 2.52,-0.84 1.19,0.37 0.69,0.94 1.01,-0.08 0.51,0.51 1.17,-0.29 3.47,1.54 1.72,0.02 1.07,-0.44 0.59,0.71 0.98,0.07 0.75,-0.94 0.21,-1.29 1.97,-2.38 2.98,0.36 2.04,-0.16 1.67,-1.88 1.91,-0.11 2.89,-1.69 -0.02,-1.41 0.79,-0.63 -0.03,-0.64 1.55,-0.54 0.98,-1.13 1.3,-0.67 0.97,-1.56 1.81,-1.77 0.46,0.66 0.89,0.29 3.27,-0.21 1.95,0.2 2.34,-1.73 1.29,0.52 1.73,-0.61 1.44,0.07 1.19,-0.86 0.78,0.15 0.29,2.03 1.15,-0.13 1.59,0.87 1.56,-1.43 0.59,-0.15 0.47,0.08 0.49,0.78 4.07,0.64 0.87,-0.8 3.14,-0.86 4.02,-2.68 6.37,-2.47 7.51,2 2.35,-0.61 2.15,-0.12 1.42,1.29 0.44,-0.12 0.07,-0.39 0.81,0.24 1.05,-0.56 1.89,0.03 0.3,-0.62 1.03,-0.01 1.34,0.38 0.97,0.72 3.18,0.74 0,0 2.53,0.76 1.66,1.44 1.62,0.83 0.33,0.81 0.71,0.46 3.19,-0.32 0.84,-0.82 0.99,0.18 3.36,-0.43 0.34,0.42 0.46,-0.35 0.23,0.46 1.63,0.04 0.59,0.48 1.51,-0.09 0.31,0.46 0.86,0.08 0.06,0.61 0.91,0.69 0.34,-0.46 0.74,0.78 0.45,-0.15 -0.28,-0.93 2.5,-0.19 -0.92,0.75 1.34,2.51 -0.56,1.83 0.29,0.93 -0.57,0.52 0.58,1.47 -0.93,0.37 -0.54,0.94 1.05,1.33 -0.09,3.49 0,0 -5.91,3.95 -0.7,0.02 -8.39,4.98 -3.96,2.1 -1.25,0.33 -1.21,-0.19 -1.36,-4.31 -0.87,-1.05 -0.34,-0.11 -0.28,0.45 -0.7,-0.5 -0.99,0.06 0.16,-0.39 -0.49,0.04 0.2,-0.61 -0.77,-0.6 -0.52,-1.48 -4.14,-1.09 0.11,0.83 -0.3,0.31 -1.58,0.32 -1.07,0.97 -0.68,-0.63 -1.2,0.07 -2.78,1.63 -0.62,0.93 -1.47,0.09 -3.93,1.92 -0.71,1.07 -1.36,0.76 -0.93,-0.04 -0.71,-0.57 -1.79,0.61 -0.27,3.9 -1.63,1.27 -0.14,1.08 -1,0.29 -3.08,1.91 -2.21,-0.37 -1.78,0.31 -1.91,-0.56 -0.71,-0.97 -0.22,-1.17 -1.58,-0.89 -0.77,1.24 -1.12,0.5 -0.15,0.44 -2.67,-0.86 -0.33,1.68 -1.8,0.43 -1.39,1.21 -1.04,0.03 -0.97,1.02 -0.41,1.98 0.67,4.34 0.91,2.06 -0.02,1.99 -1.07,1.66 0.72,0.37 -0.26,1.05 -0.48,0.15 -0.14,0.49 -0.79,0.42 -0.45,0.67 0.08,1.88 -0.61,0.18 0.36,2.53 -0.56,0.47 -1.16,-0.35 -0.87,0.88 -1.68,0.53 -0.28,0.73 0.01,1.92 -0.35,0.62 -0.89,-0.42 -1.16,0.35 -2,-0.57 -1.05,0.37 -1.08,1.08 -1.39,2.23 0,0 -4.66,-1.06 -1.91,0.36 -1.52,-0.12 -1.24,0.68 -1.48,0.28 -1.55,-0.63 -1.63,-1.24 -2.19,0.26 -0.81,-0.4 -0.46,0.69 -2.04,-0.06 -0.85,0.55 -1.05,-0.03 -1.49,1.8 0.27,1.26 -0.25,1.06 0.18,2.29 -0.63,0.66 -1.01,0.27 -2.26,2.54 0.07,0.96 1.14,1.09 0.02,0.39 -0.5,0.41 0.09,0.64 1.96,0.48 -0.31,0.89 0.63,1.05 -0.62,0.8 -0.08,0.82 -1.04,-0.01 -0.67,-0.68 0,0 -0.17,-0.71 -1.69,-0.31 -1.08,-0.84 -1.22,-0.31 -1.16,-0.76 -1.46,-2.19 -1.44,0.05 -0.67,1.24 -0.52,0.23 -1.6,-2.06 -0.66,0.47 -0.49,-0.34 -2.26,0.06 -1.47,-0.75 -0.22,-0.47 -1.93,0.38 -2.57,2.4 -0.46,0.93 -0.93,-0.17 -1.61,0.71 -0.85,-0.54 -0.34,0.22 -0.28,-0.32 -1.13,0.01 -0.52,-0.69 0.23,-1.26 -0.55,-0.36 0.64,-1.02 -0.74,-0.31 -0.45,-0.87 0.45,-0.93 -0.38,-1.21 0.1,-0.83 -1.39,0.07 0.23,-1.03 -1.04,0.13 -1.05,-0.81 -0.05,-0.82 -0.79,-0.66 -0.1,-2.02 0.41,-0.52 -0.5,-1.27 -0.98,-1.11 -0.25,-0.81 -0.73,-0.63 -0.64,-0.01 -1.14,-1.22 -1.08,0.56 -1.14,-0.12 -1.14,1.6 -0.79,-0.23 -0.89,0.23 -0.13,0.22 0.8,0.84 -0.14,0.38 -2.79,0.44 -1.19,1.55 -0.52,-0.17 -1.22,-1.31 -1.06,0.04 -0.42,0.47 -0.51,-0.25 -0.87,0.17 -0.91,-0.59 -0.37,0.55 -0.47,-0.12 -1.2,0.79 -0.56,-0.44 -0.9,0.75 -0.92,-0.21 -1.75,0.52 z" 
                  {...{fill: deptoFill('Yoro'), stroke: deptoStroke('Yoro'), 'data-depto': 'Yoro'}}
                  strokeWidth="1.2"
                  className="cursor-pointer transition-all duration-200 hover:opacity-90"
                  onMouseEnter={() => setHoveredDepto('Yoro')}
                  onMouseLeave={() => setHoveredDepto(selectedDepto)}
                  onClick={() => setSelectedDepto('Yoro')}
                />
              </svg>
            </div>

            {/* Live Interactive Explanatory Panel of Honduras departments */}
            <div className="flex-1 space-y-4">
              <div className="bg-cyber-bg2/40 border border-cyber-purple/15 p-4 rounded-lg font-mono text-xs">
                <h5 className="font-bold text-cyber-cyan mb-2 uppercase text-[11px] font-orbitron flex items-center gap-1.5 border-b border-cyber-purple/15 pb-1.5">
                  🔍 Auditoría Territorial: {activeDepto || 'Coloque el cursor'}
                </h5>
                {activeDepto ? (
                  clientsByDepto[activeDepto] ? (
                    <div className="space-y-2 text-center">
                      <div className="text-5xl font-black text-cyber-pink font-orbitron drop-shadow-[0_0_15px_rgba(255,0,255,0.5)]">{clientsByDepto[activeDepto].pct}%</div>
                      <div className="text-[10px] text-textD uppercase tracking-widest">de los clientes</div>
                      <div className="flex justify-between text-xs pt-2 border-t border-cyber-purple/10">
                        <span className="text-textD">Clientes:</span>
                        <span className="text-white font-bold">{clientsByDepto[activeDepto].count}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-textD">LTV total:</span>
                        <span className="text-green-400 font-bold">{fmt(clientsByDepto[activeDepto].ltv)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="py-4 text-center text-textD">
                      No poseemos actualmente clientes registrados en esta provincia de Honduras.
                    </div>
                  )
                ) : (
                  <div className="py-4 text-center text-textD text-[11px] leading-relaxed">
                    Pase el mouse por cualquiera de los departamentos del mapa interactivo para ver los porcentajes y aportes de cartera en ese sector de Honduras.
                  </div>
                )}
              </div>

              {/* General Highlights */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-cyber-bg border border-cyber-purple/10 rounded p-3 text-center">
                  <div className="text-[10px] text-textD uppercase">Zona Liderazgo</div>
                  <div className="text-sm font-black text-cyber-cyan font-orbitron mt-0.5">Cortes (SPS)</div>
                </div>
                <div className="bg-cyber-bg border border-cyber-purple/10 rounded p-3 text-center">
                  <div className="text-[10px] text-textD uppercase">Total Cobertura</div>
                  <div className="text-sm font-black text-cyber-pink font-orbitron mt-0.5">
                    {Object.keys(clientsByDepto).length} Deptos de HN
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Client percentage list column */}
        <div className="panel border border-cyber-purple/20 bg-cyber-panel rounded-xl overflow-hidden shadow-2xl lg:col-span-1">
          <div className="panelHeader bg-cyber-purple/5 border-b border-cyber-purple/20 px-5 py-4">
            <h4 className="font-orbitron font-bold text-xs text-cyber-pink tracking-wider uppercase">📈 % CLIENTES POR DEPARTAMENTO</h4>
          </div>
          <div className="panelBody p-5 space-y-4 max-h-[420px] overflow-y-auto">
            {departmentRanking.map(dr => (
              <div key={dr.depto} className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="font-bold text-text hover:text-cyber-cyan transition-all cursor-pointer" onMouseEnter={() => setHoveredDepto(dr.depto)} onMouseLeave={() => setHoveredDepto(selectedDepto)}>{dr.depto}</span>
                  <span className="text-cyber-cyan font-bold">{dr.count} ({dr.pct}%)</span>
                </div>
                <div className="w-full bg-cyber-bg2 border border-cyber-purple/10 rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-cyber-purple to-cyber-pink rounded-full transition-all duration-700"
                    style={{ width: `${dr.pct}%` }}
                  />
                </div>
                <div className="text-[9px] text-textD font-mono flex justify-between">
                  <span>Socio principal: {dr.clients[0]}</span>
                  <span className="text-green-500 font-bold">LTV: {fmt(dr.ltv)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── CHARTS BLOCK ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="panel border border-cyber-purple/20 bg-cyber-panel rounded-xl overflow-hidden shadow-2xl">
          <div className="panelHeader bg-cyber-purple/5 border-b border-cyber-purple/20 px-5 py-4 flex items-center justify-between">
            <h4 className="font-orbitron font-bold text-xs text-cyber-cyan tracking-wider uppercase">📦 ESTADOS DE TRABAJO EN ESTE PERÍODO</h4>
            <span className="text-[10px] text-textD font-mono">TALLER ACTIVO</span>
          </div>
          <div className="panelBody p-5 space-y-4 font-sans">
            {renderBarRow('Trabajos Pendientes', salesByStatus.pendiente, Math.max(salesByStatus.pendiente, salesByStatus.en_proceso, salesByStatus.terminado) || 1, false, 'from-cyber-purple to-indigo-600')}
            {renderBarRow('En Proceso de Fabricación', salesByStatus.en_proceso, Math.max(salesByStatus.pendiente, salesByStatus.en_proceso, salesByStatus.terminado) || 1, false, 'from-yellow-500 to-yellow-300')}
            {renderBarRow('Terminados para Retiro', salesByStatus.terminado, Math.max(salesByStatus.pendiente, salesByStatus.en_proceso, salesByStatus.terminado) || 1, false, 'from-green-500 to-emerald-300')}
          </div>
        </div>

        <div className="panel border border-cyber-purple/20 bg-cyber-panel rounded-xl overflow-hidden shadow-2xl">
          <div className="panelHeader bg-cyber-purple/5 border-b border-cyber-purple/20 px-5 py-4 flex items-center justify-between">
            <h4 className="font-orbitron font-bold text-xs text-cyber-cyan tracking-wider uppercase">💳 CANALES DE REVERSA (INGRESOS DE CAJA)</h4>
            <span className="text-[10px] text-textD font-mono">FINANZAS RECTAS</span>
          </div>
          <div className="panelBody p-5 space-y-4">
            {renderBarRow('Efectivo', paymentsByMethod.efectivo, Math.max(paymentsByMethod.efectivo, paymentsByMethod.tarjeta, paymentsByMethod.transferencia) || 1, true)}
            {renderBarRow('Tarjeta de Crédito', paymentsByMethod.tarjeta, Math.max(paymentsByMethod.efectivo, paymentsByMethod.tarjeta, paymentsByMethod.transferencia) || 1, true)}
            {renderBarRow('Transferencia Bancaria', paymentsByMethod.transferencia, Math.max(paymentsByMethod.efectivo, paymentsByMethod.tarjeta, paymentsByMethod.transferencia) || 1, true)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="panel border border-cyber-purple/20 bg-cyber-panel rounded-xl overflow-hidden shadow-2xl">
          <div className="panelHeader bg-cyber-purple/5 border-b border-cyber-purple/20 px-5 py-4 flex items-center justify-between">
            <h4 className="font-orbitron font-bold text-xs text-cyber-cyan tracking-wider uppercase">🏆 TOP TRABAJOS Y MATERIAS MÁS VENDIDAS</h4>
            <span className="text-[9px] text-textD px-2.5 py-0.5 bg-cyber-bg border border-cyber-purple/15 rounded">Corte y Grabado</span>
          </div>
          <div className="panelBody p-5">
            {topProducts.length ? (
              <div className="space-y-4">
                {topProducts.map(p => renderBarRow(p.name, p.count, topProducts[0].count || 1))}
              </div>
            ) : (
              <p className="text-xs text-textD font-mono">Sin datos de venta o trabajos en este período.</p>
            )}
          </div>
        </div>

        <div className="panel border border-cyber-purple/20 bg-cyber-panel rounded-xl overflow-hidden shadow-2xl">
          <div className="panelHeader bg-cyber-purple/5 border-b border-cyber-purple/20 px-5 py-4">
            <h4 className="font-orbitron font-bold text-xs text-cyber-cyan tracking-wider uppercase">🏆 TOP CLIENTES DE EL PATRON HN POR ADQUISICIÓN CORRIENTE</h4>
          </div>
          <div className="panelBody p-5">
            {clientRanking.length ? (
              <div className="space-y-4">
                {clientRanking.map(c => renderBarRow(c.name, c.ltv, clientRanking[0].ltv || 1, true))}
              </div>
            ) : (
              <p className="text-xs text-textD font-mono">Sin historial registrado en el CRM.</p>
            )}
          </div>
        </div>
      </div>

      {/* LOW STOCK ALERT PANEL */}
      {lowStockCount > 0 && (
        <div className="panel border border-red-500/30 bg-cyber-panel rounded-xl overflow-hidden shadow-2xl">
          <div className="panelHeader bg-red-500/5 border-b border-red-500/20 px-5 py-3.5 flex items-center gap-2">
            <AlertTriangle className="text-red-500 w-4 h-4" />
            <h4 className="font-orbitron font-bold text-xs text-red-400 tracking-wider uppercase">ALERTAS CRÍTICAS DE STOCK BAJO (RESTAURACIÓN RÁPIDA)</h4>
          </div>
          <div className="panelBody p-5 divide-y divide-cyber-purple/10">
            {lowStockItems.map(p => (
              <div className="py-2.5 flex justify-between items-center text-xs font-mono" key={p.ID}>
                <span className="text-text font-bold">{p.Nombre}</span>
                <div className="flex items-center gap-4">
                  <span className="text-red-400 font-bold">Stock Actual: {p['Stock Actual']} uds</span>
                  <span className="text-yellow-400">Min. Alerta: {p['Alerta Stock']}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
