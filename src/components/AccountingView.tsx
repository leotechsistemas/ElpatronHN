import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { api } from '../services/api';
import { DollarSign, Plus, RotateCcw, X, FileText, BookOpen, BarChart3, Search, Loader2, CheckCircle, Download } from 'lucide-react';

type Tab = 'catalog' | 'entries' | 'balance' | 'income';

export default function AccountingView() {
  const [tab, setTab] = useState<Tab>('catalog');
  const [catalog, setCatalog] = useState<any[]>([]);
  const [entries, setEntries] = useState<any[]>([]);
  const [balance, setBalance] = useState<any>(null);
  const [income, setIncome] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // Modal state for entry creation
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [entryForm, setEntryForm] = useState<any>({ fecha: new Date().toISOString().split('T')[0], concepto: '', tipo: 'Diario', items: [{ cuentaId: '', debe: 0, haber: 0, glosa: '' }] });

  // Modal state for account creation
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [accountForm, setAccountForm] = useState<any>({ codigo: '', nombre: '', tipo: 'Activo', nivel: 1, padreId: '', aceptaAsientos: true });

  const loadCatalog = async () => {
    try {
      const res = await api.getAccountCatalog();
      if (res?.success) setCatalog(res.data);
    } catch { setError('Error al cargar catálogo'); }
  };

  const loadEntries = async () => {
    try {
      const res = await api.getAccountingEntries();
      setEntries(res || []);
    } catch { setError('Error al cargar asientos'); }
  };

  const loadBalance = async () => {
    try {
      setBalance(await api.getBalanceGeneral());
    } catch { setError('Error al cargar balance'); }
  };

  const loadIncome = async () => {
    try {
      setIncome(await api.getIncomeStatement());
    } catch { setError('Error al cargar estado resultados'); }
  };

  useEffect(() => {
    if (tab === 'catalog') loadCatalog();
    else if (tab === 'entries') loadEntries();
    else if (tab === 'balance') loadBalance();
    else if (tab === 'income') loadIncome();
  }, [tab]);

  const format = (n: number) => 'L. ' + (n || 0).toLocaleString('es-HN', { minimumFractionDigits: 2 });

  const handleCreateAccount = async () => {
    try {
      await api.createAccount(accountForm);
      setShowAccountModal(false);
      setAccountForm({ codigo: '', nombre: '', tipo: 'Activo', nivel: 1, padreId: '', aceptaAsientos: true });
      loadCatalog();
    } catch (e: any) { setError(e.message || 'Error al crear cuenta'); }
  };

  const handleToggleAccount = async (id: string) => {
    try {
      await api.toggleAccount(id);
      loadCatalog();
    } catch { setError('Error al cambiar estado'); }
  };

  const handleCreateEntry = async () => {
    const totalDebe = entryForm.items.reduce((a: number, i: any) => a + Number(i.debe || 0), 0);
    const totalHaber = entryForm.items.reduce((a: number, i: any) => a + Number(i.haber || 0), 0);
    if (Math.abs(totalDebe - totalHaber) > 0.01) {
      setError(`El asiento no cuadra: Debe ${format(totalDebe)} ≠ Haber ${format(totalHaber)}`);
      return;
    }
    try {
      await api.createAccountingEntry(entryForm);
      setShowEntryModal(false);
      setEntryForm({ fecha: new Date().toISOString().split('T')[0], concepto: '', tipo: 'Diario', items: [{ cuentaId: '', debe: 0, haber: 0, glosa: '' }] });
      setError('');
      loadEntries();
    } catch (e: any) { setError(e.message || 'Error al crear asiento'); }
  };

  const handleRevertEntry = async (id: string) => {
    const usuario = prompt('Ingrese su nombre de usuario para autorizar la reversión:');
    if (!usuario) return;
    if (!window.confirm('¿Está seguro de reversar este asiento? Se creará un nuevo asiento con los valores invertidos.')) return;
    try {
      await api.revertAccountingEntry(id, usuario);
      setError('');
      loadEntries();
    } catch (e: any) { setError(e.message || 'Error al reversar asiento'); }
  };

  const addEntryItem = () => {
    setEntryForm({ ...entryForm, items: [...entryForm.items, { cuentaId: '', debe: 0, haber: 0, glosa: '' }] });
  };

  const removeEntryItem = (idx: number) => {
    if (entryForm.items.length <= 1) return;
    setEntryForm({ ...entryForm, items: entryForm.items.filter((_: any, i: number) => i !== idx) });
  };

  const updateEntryItem = (idx: number, field: string, value: any) => {
    const items = [...entryForm.items];
    items[idx] = { ...items[idx], [field]: value };
    setEntryForm({ ...entryForm, items });
  };

  const filteredEntries = entries.filter((e: any) =>
    !search || e.concepto?.toLowerCase().includes(search.toLowerCase())
  );

  // ── PDF Download Helpers ──

  const gold = [235, 180, 44] as const;
  const dark = [28, 25, 23] as const;
  const gray = [120, 120, 120] as const;

  function pdfHeader(doc: jsPDF, title: string) {
    doc.setFillColor(dark[0], dark[1], dark[2]); doc.rect(0, 0, 210, 42, 'F');
    doc.setFillColor(gold[0], gold[1], gold[2]); doc.rect(0, 40, 210, 3, 'F');
    doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(18);
    doc.text('EL PATRON HN', 14, 18);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(200, 200, 200);
    doc.text('Tecnología de Personalizados · Grabado Láser · Impresión · Rotulación', 14, 25);
    doc.setFontSize(10); doc.setTextColor(gold[0], gold[1], gold[2]);
    doc.text(title, 14, 34);
  }

  function pdfFooter(doc: jsPDF) {
    doc.setDrawColor(gold[0], gold[1], gold[2]); doc.line(14, 280, 196, 280);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(gray[0], gray[1], gray[2]);
    doc.text('EL PATRÓN HN · Documento generado por el sistema contable', 14, 286);
    doc.text(new Date().toLocaleDateString('es-HN') + ' ' + new Date().toLocaleTimeString('es-HN'), 196, 286, { align: 'right' });
  }

  function pdfTable(doc: jsPDF, headers: string[], rows: string[][], startY: number, colWidths?: number[]) {
    const cw = colWidths || headers.map(() => 180 / headers.length);
    let y = startY;
    doc.setFillColor(252, 248, 235); doc.rect(14, y, 182, 7, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(dark[0], dark[1], dark[2]);
    let x = 14;
    headers.forEach((h, i) => { doc.text(h, x + 1, y + 5); x += cw[i]; });
    y += 9;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(dark[0], dark[1], dark[2]);
    rows.forEach((row, ri) => {
      if (y > 270) { pdfFooter(doc); doc.addPage(); pdfHeader(doc, ''); y = 50; doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); }
      x = 14;
      row.forEach((cell, ci) => {
        const align: 'left' | 'right' = ci >= row.length - 2 ? 'right' : 'left';
        doc.text(String(cell), x + (align === 'right' ? cw[ci] - 1 : 1), y + 3, { align });
        x += cw[ci];
      });
      doc.setDrawColor(240, 240, 240); doc.line(14, y + 4, 196, y + 4);
      y += 7;
    });
    return y;
  }

  function downloadCatalog() {
    const doc = new jsPDF();
    pdfHeader(doc, 'CATÁLOGO DE CUENTAS');
    const rows = catalog.map((c: any) => [c.codigo, c.nombre, c.tipo, String(c.nivel), c.acepta_asientos ? 'Sí' : 'No', c.activo ? 'Activo' : 'Inactivo']);
    pdfTable(doc, ['CÓDIGO', 'NOMBRE', 'TIPO', 'NIVEL', 'ASIENTOS', 'ESTADO'], rows, 48);
    pdfFooter(doc);
    doc.save('PatronHN_Catalogo_Cuentas.pdf');
  }

  function downloadEntries() {
    const doc = new jsPDF();
    pdfHeader(doc, 'LIBRO DIARIO');
    const data = filteredEntries.length ? filteredEntries : entries;
    const rows = data.map((e: any) => [e.numero_asiento || e.id, e.fecha || '', e.concepto || '', e.tipo || '', e.referencia_tipo ? e.referencia_tipo+' '+e.referencia_id : '—', format(e.total_debe), format(e.total_haber), e.reversado ? 'REVERSADO' : '']);
    pdfTable(doc, ['Nº ASIENTO', 'FECHA', 'CONCEPTO', 'TIPO', 'REF', 'DEBE', 'HABER', 'ESTADO'], rows, 48, [22, 16, 44, 14, 20, 22, 22, 20]);
    pdfFooter(doc);
    doc.save('PatronHN_Libro_Diario.pdf');
  }

  function downloadBalance() {
    if (!balance) return;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pw = 297, ph = 210;
    const leftX = 12, rightX = 152, colW = 133;
    const midX = 148;

    // Header
    doc.setFillColor(dark[0], dark[1], dark[2]); doc.rect(0, 0, pw, 35, 'F');
    doc.setFillColor(gold[0], gold[1], gold[2]); doc.rect(0, 33, pw, 3, 'F');
    doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
    doc.text('EL PATRON HN', pw / 2, 14, { align: 'center' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(200, 200, 200);
    doc.text('Tecnología de Personalizados · Grabado Láser · Impresión · Rotulación', pw / 2, 21, { align: 'center' });
    doc.setFontSize(10); doc.setTextColor(gold[0], gold[1], gold[2]);
    doc.text('BALANCE GENERAL AL ' + balance.fecha, pw / 2, 29, { align: 'center' });

    let y = 44, lineH = 5.2;
    const colH = 22;

    // Column headers
    doc.setFillColor(252, 248, 235); doc.rect(leftX, y, colW, colH, 'F'); doc.rect(rightX, y, colW, colH, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(dark[0], dark[1], dark[2]);

    // Left header: ACTIVOS
    doc.text('ACTIVOS', leftX + 2, y + 4);
    doc.setFontSize(6.5); doc.setTextColor(gray[0], gray[1], gray[2]);
    doc.text('Cuenta', leftX + 2, y + 11);
    doc.text('Valor (HNL)', leftX + colW - 2, y + 11, { align: 'right' });
    doc.setDrawColor(gold[0], gold[1], gold[2]); doc.line(leftX, y + colH, leftX + colW, y + colH);

    // Right header: PASIVOS + PATRIMONIO
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(dark[0], dark[1], dark[2]);
    doc.text('PASIVOS', rightX + 2, y + 4);
    doc.setFontSize(6.5); doc.setTextColor(gray[0], gray[1], gray[2]);
    doc.text('Cuenta', rightX + 2, y + 11);
    doc.text('Valor (HNL)', rightX + colW - 2, y + 11, { align: 'right' });
    doc.setDrawColor(gold[0], gold[1], gold[2]); doc.line(rightX, y + colH, rightX + colW, y + colH);
    y += colH + 2;

    // Find max rows between left and right
    const activos = balance.activos || [];
    const pasivos = balance.pasivos || [];
    const patrimonio = balance.patrimonio || [];
    const rightItems = [
      ...pasivos.map((i: any) => ({ ...i, section: 'Pasivos' })),
      ...patrimonio.map((i: any) => ({ ...i, section: 'Patrimonio' })),
    ];
    const maxRows = Math.max(activos.length, rightItems.length);
    const totalPasPat = (balance.total_pasivos || 0) + (balance.total_patrimonio || 0);

    for (let i = 0; i < maxRows; i++) {
      if (y > ph - 25) { doc.addPage(); y = 20; }

      // Left side: Activo
      if (i < activos.length) {
        const a = activos[i];
        doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(dark[0], dark[1], dark[2]);
        doc.text(a.cuenta_codigo + '  ' + a.cuenta_nombre, leftX + 2, y + 3);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5);
        doc.text(format(a.saldo), leftX + colW - 2, y + 3, { align: 'right' });
      }
      // Right side: Pasivos + Patrimonio
      if (i < rightItems.length) {
        const ri = rightItems[i];
        doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
        if (i === pasivos.length) {
          // Separator before patrimonio
          doc.setDrawColor(200, 200, 200); doc.line(rightX, y - 1, rightX + colW, y - 1);
          doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(0, 100, 180);
          doc.text('PATRIMONIO', rightX + 2, y + 2);
          y += lineH;
          if (y > ph - 25) { doc.addPage(); y = 20; }
          doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(dark[0], dark[1], dark[2]);
        }
        doc.text(ri.cuenta_codigo + '  ' + ri.cuenta_nombre, rightX + 2, y + 3);
        doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5);
        doc.text(format(ri.saldo), rightX + colW - 2, y + 3, { align: 'right' });
      }
      y += lineH;
    }

    y += 2;
    if (y > ph - 25) { doc.addPage(); y = 20; }

    // Totals row
    doc.setDrawColor(gold[0], gold[1], gold[2]);
    doc.line(leftX, y, leftX + colW, y);
    doc.line(rightX, y, rightX + colW, y);
    y += 2;
    if (y > ph - 25) { doc.addPage(); y = 20; }

    // Left total
    doc.setFillColor(252, 248, 235); doc.rect(leftX, y, colW, 7, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(dark[0], dark[1], dark[2]);
    doc.text('TOTAL ACTIVOS', leftX + 2, y + 5);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(0, 130, 0);
    doc.text(format(balance.total_activos || 0), leftX + colW - 2, y + 5, { align: 'right' });

    // Right total
    doc.setFillColor(252, 248, 235); doc.rect(rightX, y, colW, 7, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(dark[0], dark[1], dark[2]);
    doc.text('TOTAL PASIVOS', rightX + 2, y + 5);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(180, 120, 0);
    doc.text(format(balance.total_pasivos || 0), rightX + colW - 2, y + 5, { align: 'right' });
    y += 7;

    // Patrimonio row on right
    doc.setFillColor(252, 248, 235); doc.rect(rightX, y, colW, 7, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(dark[0], dark[1], dark[2]);
    doc.text('TOTAL PATRIMONIO', rightX + 2, y + 5);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(0, 100, 180);
    doc.text(format(balance.total_patrimonio || 0), rightX + colW - 2, y + 5, { align: 'right' });
    y += 7;

    // Final balancing row on right
    doc.setFillColor(dark[0], dark[1], dark[2]); doc.rect(rightX, y, colW, 8, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(gold[0], gold[1], gold[2]);
    doc.text('TOTAL PASIVOS + PATRIMONIO', rightX + 2, y + 5.5);
    doc.text(format(totalPasPat), rightX + colW - 2, y + 5.5, { align: 'right' });

    // Bottom equation
    y += 14;
    if (y > ph - 18) { doc.addPage(); y = 20; }
    doc.setDrawColor(gold[0], gold[1], gold[2]); doc.line(leftX, y, pw - leftX, y); y += 5;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(dark[0], dark[1], dark[2]);
    const eq = `${format(balance.total_activos || 0)}  =  ${format(balance.total_pasivos || 0)}  +  ${format(balance.total_patrimonio || 0)}`;
    doc.text(eq, pw / 2, y, { align: 'center' });

    // Footer
    doc.setDrawColor(gold[0], gold[1], gold[2]); doc.line(leftX, ph - 10, pw - leftX, ph - 10);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(6); doc.setTextColor(gray[0], gray[1], gray[2]);
    doc.text('EL PATRÓN HN · Documento generado por el sistema contable', leftX, ph - 4);
    doc.text(new Date().toLocaleDateString('es-HN') + ' ' + new Date().toLocaleTimeString('es-HN'), pw - leftX, ph - 4, { align: 'right' });
    doc.save('PatronHN_Balance_General.pdf');
  }

  function downloadIncome() {
    if (!income) return;
    const doc = new jsPDF();
    pdfHeader(doc, 'ESTADO DE RESULTADOS AL ' + income.fecha);
    let y = 50;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(0, 130, 0);
    doc.text('INGRESOS', 14, y); y += 6;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...dark);
    for (const i of (income.ingresos || [])) {
      doc.text(i.cuenta_codigo + ' - ' + i.cuenta_nombre, 18, y);
      doc.text(format(i.saldo), 196, y, { align: 'right' });
      y += 5;
    }
    doc.setDrawColor(200, 200, 200); doc.line(14, y + 1, 196, y + 1);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
    doc.text('Total Ingresos', 18, y + 6); doc.text(format(income.total_ingresos), 196, y + 6, { align: 'right' });
    y += 14;

    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(180, 0, 0);
    doc.text('GASTOS', 14, y); y += 6;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(...dark);
    for (const i of (income.gastos || [])) {
      doc.text(i.cuenta_codigo + ' - ' + i.cuenta_nombre, 18, y);
      doc.text(format(i.saldo), 196, y, { align: 'right' });
      y += 5;
    }
    doc.setDrawColor(200, 200, 200); doc.line(14, y + 1, 196, y + 1);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
    doc.text('Total Gastos', 18, y + 6); doc.text(format(income.total_gastos), 196, y + 6, { align: 'right' });
    y += 14;

    if (y > 260) { doc.addPage(); y = 20; }
    doc.setDrawColor(...gold); doc.line(14, y, 196, y); y += 6;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
    const neto = income.resultado_neto || 0;
    doc.setTextColor(neto >= 0 ? 0 : 180, neto >= 0 ? 130 : 0, 0);
    doc.text('Resultado Neto: ' + format(neto), 105, y, { align: 'center' });
    pdfFooter(doc);
    doc.save('PatronHN_Estado_Resultados.pdf');
  }

  const catalogByTipo = (tipo: string) => catalog.filter((c: any) => c.tipo === tipo && c.nivel <= 2);

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-4">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2 text-xs text-red-400 flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-400 hover:text-white cursor-pointer bg-none border-none"><X className="w-3 h-3" /></button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-cyber-purple/20 pb-2">
        {([
          { id: 'catalog' as Tab, label: 'Catálogo de Cuentas', icon: BookOpen },
          { id: 'entries' as Tab, label: 'Libro Diario', icon: FileText },
          { id: 'balance' as Tab, label: 'Balance General', icon: BarChart3 },
          { id: 'income' as Tab, label: 'Estado Resultados', icon: DollarSign },
        ]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-t text-xs font-bold uppercase tracking-wider transition-all cursor-pointer
              ${tab === t.id ? 'bg-cyber-cyan/10 text-cyber-cyan border-b-2 border-cyber-cyan' : 'text-textD hover:text-text'}`}>
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {/* ── CATALOG ── */}
      {tab === 'catalog' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="font-orbitron text-xs font-bold text-cyber-cyan uppercase tracking-widest">Plan de Cuentas</h4>
            <div className="flex gap-2">
              <button onClick={downloadCatalog}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-cyber-purple/30 text-textD text-xs font-bold uppercase tracking-wider hover:bg-cyber-purple/10 transition-all cursor-pointer">
                <Download className="w-3 h-3" /> PDF
              </button>
              <button onClick={() => setShowAccountModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan/30 text-xs font-bold uppercase tracking-wider hover:bg-cyber-cyan/20 transition-all cursor-pointer">
                <Plus className="w-3 h-3" /> Nueva Cuenta
              </button>
            </div>
          </div>
          <div className="bg-cyber-panel border border-cyber-purple/20 rounded-lg overflow-hidden">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="bg-cyber-purple/10 border-b border-cyber-purple/20">
                  <th className="text-left px-3 py-2 text-cyber-cyan font-bold uppercase tracking-wider">Código</th>
                  <th className="text-left px-3 py-2 text-cyber-cyan font-bold uppercase tracking-wider">Nombre</th>
                  <th className="text-left px-3 py-2 text-cyber-cyan font-bold uppercase tracking-wider">Tipo</th>
                  <th className="text-center px-3 py-2 text-cyber-cyan font-bold uppercase tracking-wider">Nivel</th>
                  <th className="text-center px-3 py-2 text-cyber-cyan font-bold uppercase tracking-wider">Asientos</th>
                  <th className="text-center px-3 py-2 text-cyber-cyan font-bold uppercase tracking-wider">Activo</th>
                </tr>
              </thead>
              <tbody>
                {catalog.map((c: any) => (
                  <tr key={c.id} className="border-b border-cyber-purple/10 hover:bg-cyber-purple/5">
                    <td className="px-3 py-2 font-bold" style={{ paddingLeft: `${12 + (c.nivel - 1) * 16}px` }}>{c.codigo}</td>
                    <td className="px-3 py-2">{c.nombre}</td>
                    <td className="px-3 py-2">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider
                        ${c.tipo === 'Activo' ? 'bg-emerald-500/10 text-emerald-400' :
                          c.tipo === 'Pasivo' ? 'bg-yellow-500/10 text-yellow-400' :
                          c.tipo === 'Patrimonio' ? 'bg-blue-500/10 text-blue-400' :
                          c.tipo === 'Ingreso' ? 'bg-green-500/10 text-green-400' :
                          'bg-red-500/10 text-red-400'}`}>{c.tipo}</span>
                    </td>
                    <td className="px-3 py-2 text-center">{c.nivel}</td>
                    <td className="px-3 py-2 text-center">
                      {c.acepta_asientos ? <CheckCircle className="w-3.5 h-3.5 text-green-400 inline" /> : <span className="text-textD">—</span>}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button onClick={() => handleToggleAccount(c.id)}
                        className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase cursor-pointer border-none
                          ${c.activo ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        {c.activo ? 'Sí' : 'No'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── ENTRIES (LIBRO DIARIO) ── */}
      {tab === 'entries' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <h4 className="font-orbitron text-xs font-bold text-cyber-cyan uppercase tracking-widest">Asientos Contables</h4>
              <div className="flex items-center gap-1.5 bg-cyber-bg border border-cyber-purple/20 rounded px-2 py-1">
                <Search className="w-3 h-3 text-textD" />
                <input type="text" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)}
                  className="bg-transparent border-none outline-none text-xs text-text w-40" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={downloadEntries}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-cyber-purple/30 text-textD text-xs font-bold uppercase tracking-wider hover:bg-cyber-purple/10 transition-all cursor-pointer">
                <Download className="w-3 h-3" /> PDF
              </button>
              <button onClick={() => setShowEntryModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan/30 text-xs font-bold uppercase tracking-wider hover:bg-cyber-cyan/20 transition-all cursor-pointer">
                <Plus className="w-3 h-3" /> Nuevo Asiento
              </button>
            </div>
          </div>
          <div className="bg-cyber-panel border border-cyber-purple/20 rounded-lg overflow-hidden">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="bg-cyber-purple/10 border-b border-cyber-purple/20">
                  <th className="text-left px-3 py-2 text-cyber-cyan font-bold uppercase">Nº Asiento</th>
                  <th className="text-left px-3 py-2 text-cyber-cyan font-bold uppercase">ID</th>
                  <th className="text-left px-3 py-2 text-cyber-cyan font-bold uppercase">Fecha</th>
                  <th className="text-left px-3 py-2 text-cyber-cyan font-bold uppercase">Concepto</th>
                  <th className="text-left px-3 py-2 text-cyber-cyan font-bold uppercase">Tipo</th>
                  <th className="text-left px-3 py-2 text-cyber-cyan font-bold uppercase">Ref</th>
                  <th className="text-right px-3 py-2 text-cyber-cyan font-bold uppercase">Debe</th>
                  <th className="text-right px-3 py-2 text-cyber-cyan font-bold uppercase">Haber</th>
                  <th className="text-center px-3 py-2 text-cyber-cyan font-bold uppercase">Estado</th>
                  <th className="px-3 py-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((e: any) => (
                  <tr key={e.id} className="border-b border-cyber-purple/10 hover:bg-cyber-purple/5">
                    <td className="px-3 py-2 font-mono text-cyber-cyan">{e.numero_asiento || '—'}</td>
                    <td className="px-3 py-2 text-textD text-[9px]">{e.id}</td>
                    <td className="px-3 py-2">{e.fecha}</td>
                    <td className="px-3 py-2 max-w-[180px] truncate">{e.concepto}</td>
                    <td className="px-3 py-2">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase
                        ${e.tipo === 'Ingreso' ? 'bg-green-500/10 text-green-400' :
                          e.tipo === 'Egreso' ? 'bg-red-500/10 text-red-400' :
                          'bg-blue-500/10 text-blue-400'}`}>{e.tipo}</span>
                    </td>
                    <td className="px-3 py-2 text-textD text-[9px]">
                      {e.referencia_tipo ? `${e.referencia_tipo} ${e.referencia_id}` : '—'}
                    </td>
                    <td className="px-3 py-2 text-right font-bold">{format(e.total_debe)}</td>
                    <td className="px-3 py-2 text-right font-bold">{format(e.total_haber)}</td>
                    <td className="px-3 py-2 text-center">
                      {e.reversado ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-yellow-500/10 text-yellow-400">Rever.</span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-green-500/10 text-green-400">Activo</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {!e.reversado && (
                        <button onClick={() => handleRevertEntry(e.id)}
                          className="text-amber-400 hover:text-amber-300 cursor-pointer bg-none border-none"
                          title="Reversar asiento">
                          <RotateCcw className="w-3 h-3" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredEntries.length === 0 && (
                  <tr><td colSpan={10} className="text-center py-8 text-textD">No hay asientos registrados</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── BALANCE ── */}
      {tab === 'balance' && balance && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-orbitron text-xs font-bold text-cyber-cyan uppercase tracking-widest">Balance General al {balance.fecha}</h4>
            <button onClick={downloadBalance}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-cyber-purple/30 text-textD text-xs font-bold uppercase tracking-wider hover:bg-cyber-purple/10 transition-all cursor-pointer">
              <Download className="w-3 h-3" /> PDF
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: 'Activos', items: balance.activos || [], total: balance.total_activos, color: 'text-emerald-400' },
              { title: 'Pasivos', items: balance.pasivos || [], total: balance.total_pasivos, color: 'text-yellow-400' },
              { title: 'Patrimonio', items: balance.patrimonio || [], total: balance.total_patrimonio, color: 'text-blue-400' },
            ].map(section => (
              <div key={section.title} className="bg-cyber-panel border border-cyber-purple/20 rounded-lg p-4">
                <h5 className="text-xs font-bold text-cyber-cyan uppercase tracking-wider mb-3">{section.title}</h5>
                <div className="space-y-1.5">
                  {section.items.map((i: any) => (
                    <div key={i.cuenta_id} className="flex justify-between text-xs font-mono">
                      <span className="text-text">{i.cuenta_codigo} - {i.cuenta_nombre}</span>
                      <span className={`font-bold ${section.color}`}>{format(i.saldo)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-cyber-purple/20 mt-3 pt-2 flex justify-between text-xs font-bold font-mono">
                  <span className="text-textD">Total {section.title}</span>
                  <span className={`font-bold ${section.color}`}>{format(section.total)}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-cyber-panel border border-cyber-purple/20 rounded-lg p-4 text-center">
            <div className="text-xs font-mono">
              <span className="text-textD">Ecuación contable: </span>
              <span className="text-emerald-400 font-bold">{format(balance.total_activos)}</span>
              <span className="text-textD"> = </span>
              <span className="text-yellow-400 font-bold">{format(balance.total_pasivos)}</span>
              <span className="text-textD"> + </span>
              <span className="text-blue-400 font-bold">{format(balance.total_patrimonio)}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── INCOME STATEMENT ── */}
      {tab === 'income' && income && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="font-orbitron text-xs font-bold text-cyber-cyan uppercase tracking-widest">Estado de Resultados al {income.fecha}</h4>
            <button onClick={downloadIncome}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-cyber-purple/30 text-textD text-xs font-bold uppercase tracking-wider hover:bg-cyber-purple/10 transition-all cursor-pointer">
              <Download className="w-3 h-3" /> PDF
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-cyber-panel border border-cyber-purple/20 rounded-lg p-4">
              <h5 className="text-xs font-bold text-green-400 uppercase tracking-wider mb-3">Ingresos</h5>
              <div className="space-y-1.5">
                {(income.ingresos || []).map((i: any) => (
                  <div key={i.cuenta_id} className="flex justify-between text-xs font-mono">
                    <span className="text-text">{i.cuenta_codigo} - {i.cuenta_nombre}</span>
                    <span className="font-bold text-green-400">{format(i.saldo)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-cyber-purple/20 mt-3 pt-2 flex justify-between text-xs font-bold font-mono">
                <span className="text-textD">Total Ingresos</span>
                <span className="text-green-400">{format(income.total_ingresos)}</span>
              </div>
            </div>
            <div className="bg-cyber-panel border border-cyber-purple/20 rounded-lg p-4">
              <h5 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-3">Gastos</h5>
              <div className="space-y-1.5">
                {(income.gastos || []).map((i: any) => (
                  <div key={i.cuenta_id} className="flex justify-between text-xs font-mono">
                    <span className="text-text">{i.cuenta_codigo} - {i.cuenta_nombre}</span>
                    <span className="font-bold text-red-400">{format(i.saldo)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-cyber-purple/20 mt-3 pt-2 flex justify-between text-xs font-bold font-mono">
                <span className="text-textD">Total Gastos</span>
                <span className="text-red-400">{format(income.total_gastos)}</span>
              </div>
            </div>
          </div>
          <div className="bg-cyber-panel border border-cyber-purple/20 rounded-lg p-4 text-center">
            <div className="text-sm font-mono">
              <span className="text-textD">Resultado Neto: </span>
              <span className={`font-bold ${income.resultado_neto >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {format(income.resultado_neto)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── NEW ENTRY MODAL ── */}
      {showEntryModal && (
        <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-cyber-panel border border-cyber-purple/30 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-orbitron text-xs font-bold text-cyber-cyan uppercase tracking-widest">Nuevo Asiento</h3>
              <button onClick={() => setShowEntryModal(false)} className="text-textD hover:text-white cursor-pointer bg-none border-none"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[9px] uppercase font-bold text-textD tracking-wider block mb-1">Fecha</label>
                <input type="date" value={entryForm.fecha} onChange={e => setEntryForm({...entryForm, fecha: e.target.value})}
                  className="w-full bg-cyber-bg border border-cyber-purple/20 rounded px-2 py-1.5 text-xs text-text font-mono" />
              </div>
              <div>
                <label className="text-[9px] uppercase font-bold text-textD tracking-wider block mb-1">Tipo</label>
                <select value={entryForm.tipo} onChange={e => setEntryForm({...entryForm, tipo: e.target.value})}
                  className="w-full bg-cyber-bg border border-cyber-purple/20 rounded px-2 py-1.5 text-xs text-text font-mono">
                  <option>Diario</option><option>Ingreso</option><option>Egreso</option><option>Traslado</option>
                </select>
              </div>
              <div>
                <label className="text-[9px] uppercase font-bold text-textD tracking-wider block mb-1">Creado Por</label>
                <input type="text" value={entryForm.creadoPor || ''} onChange={e => setEntryForm({...entryForm, creadoPor: e.target.value})}
                  className="w-full bg-cyber-bg border border-cyber-purple/20 rounded px-2 py-1.5 text-xs text-text font-mono" />
              </div>
            </div>
            <div>
              <label className="text-[9px] uppercase font-bold text-textD tracking-wider block mb-1">Concepto</label>
              <input type="text" value={entryForm.concepto} onChange={e => setEntryForm({...entryForm, concepto: e.target.value})}
                className="w-full bg-cyber-bg border border-cyber-purple/20 rounded px-2 py-1.5 text-xs text-text font-mono" />
            </div>

            {/* Items table */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[9px] uppercase font-bold text-textD tracking-wider">Partidas</span>
                <button onClick={addEntryItem}
                  className="text-[9px] text-cyber-cyan font-bold uppercase tracking-wider hover:underline cursor-pointer bg-none border-none">
                  + Agregar línea
                </button>
              </div>
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="bg-cyber-purple/10">
                    <th className="text-left px-2 py-1 text-cyber-cyan font-bold text-[9px] uppercase">Cuenta</th>
                    <th className="text-right px-2 py-1 text-cyber-cyan font-bold text-[9px] uppercase">Debe</th>
                    <th className="text-right px-2 py-1 text-cyber-cyan font-bold text-[9px] uppercase">Haber</th>
                    <th className="text-left px-2 py-1 text-cyber-cyan font-bold text-[9px] uppercase">Glosa</th>
                    <th className="px-2 py-1 w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {entryForm.items.map((item: any, idx: number) => (
                    <tr key={idx} className="border-b border-cyber-purple/10">
                      <td className="px-2 py-1">
                        <select value={item.cuentaId} onChange={e => updateEntryItem(idx, 'cuentaId', e.target.value)}
                          className="w-full bg-cyber-bg border border-cyber-purple/20 rounded px-1 py-1 text-xs text-text font-mono">
                          <option value="">Seleccionar...</option>
                          {catalog.filter(c => c.acepta_asientos).map(c => (
                            <option key={c.id} value={c.id}>{c.codigo} - {c.nombre}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-1">
                        <input type="number" step="0.01" value={item.debe} onChange={e => updateEntryItem(idx, 'debe', Number(e.target.value))}
                          className="w-full bg-cyber-bg border border-cyber-purple/20 rounded px-1 py-1 text-xs text-text text-right font-mono" />
                      </td>
                      <td className="px-2 py-1">
                        <input type="number" step="0.01" value={item.haber} onChange={e => updateEntryItem(idx, 'haber', Number(e.target.value))}
                          className="w-full bg-cyber-bg border border-cyber-purple/20 rounded px-1 py-1 text-xs text-text text-right font-mono" />
                      </td>
                      <td className="px-2 py-1">
                        <input type="text" value={item.glosa} onChange={e => updateEntryItem(idx, 'glosa', e.target.value)}
                          className="w-full bg-cyber-bg border border-cyber-purple/20 rounded px-1 py-1 text-xs text-text font-mono" />
                      </td>
                      <td className="px-2 py-1">
                        <button onClick={() => removeEntryItem(idx)}
                          className="text-red-400 hover:text-red-300 cursor-pointer bg-none border-none"><X className="w-3 h-3" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-cyber-purple/5">
                    <td className="px-2 py-1 text-[9px] font-bold uppercase text-textD">Totales</td>
                    <td className="px-2 py-1 text-right font-bold text-cyber-cyan">
                      {format(entryForm.items.reduce((a: number, i: any) => a + Number(i.debe || 0), 0))}
                    </td>
                    <td className="px-2 py-1 text-right font-bold text-cyber-cyan">
                      {format(entryForm.items.reduce((a: number, i: any) => a + Number(i.haber || 0), 0))}
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={() => setShowEntryModal(false)}
                className="px-4 py-2 rounded border border-cyber-purple/30 text-textD text-xs font-bold uppercase tracking-wider hover:bg-cyber-purple/10 transition-all cursor-pointer">
                Cancelar
              </button>
              <button onClick={handleCreateEntry}
                className="px-4 py-2 rounded bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan/30 text-xs font-bold uppercase tracking-wider hover:bg-cyber-cyan/20 transition-all cursor-pointer">
                Guardar Asiento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── NEW ACCOUNT MODAL ── */}
      {showAccountModal && (
        <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-cyber-panel border border-cyber-purple/30 rounded-xl w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-orbitron text-xs font-bold text-cyber-cyan uppercase tracking-widest">Nueva Cuenta</h3>
              <button onClick={() => setShowAccountModal(false)} className="text-textD hover:text-white cursor-pointer bg-none border-none"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] uppercase font-bold text-textD tracking-wider block mb-1">Código</label>
                <input type="text" value={accountForm.codigo} onChange={e => setAccountForm({...accountForm, codigo: e.target.value})}
                  className="w-full bg-cyber-bg border border-cyber-purple/20 rounded px-2 py-1.5 text-xs text-text font-mono" />
              </div>
              <div>
                <label className="text-[9px] uppercase font-bold text-textD tracking-wider block mb-1">Tipo</label>
                <select value={accountForm.tipo} onChange={e => setAccountForm({...accountForm, tipo: e.target.value})}
                  className="w-full bg-cyber-bg border border-cyber-purple/20 rounded px-2 py-1.5 text-xs text-text font-mono">
                  <option>Activo</option><option>Pasivo</option><option>Patrimonio</option><option>Ingreso</option><option>Gasto</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-[9px] uppercase font-bold text-textD tracking-wider block mb-1">Nombre</label>
              <input type="text" value={accountForm.nombre} onChange={e => setAccountForm({...accountForm, nombre: e.target.value})}
                className="w-full bg-cyber-bg border border-cyber-purple/20 rounded px-2 py-1.5 text-xs text-text font-mono" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] uppercase font-bold text-textD tracking-wider block mb-1">Nivel</label>
                <input type="number" value={accountForm.nivel} onChange={e => setAccountForm({...accountForm, nivel: Number(e.target.value)})}
                  className="w-full bg-cyber-bg border border-cyber-purple/20 rounded px-2 py-1.5 text-xs text-text font-mono" />
              </div>
              <div>
                <label className="text-[9px] uppercase font-bold text-textD tracking-wider block mb-1">Cuenta Padre</label>
                <select value={accountForm.padreId} onChange={e => setAccountForm({...accountForm, padreId: e.target.value})}
                  className="w-full bg-cyber-bg border border-cyber-purple/20 rounded px-2 py-1.5 text-xs text-text font-mono">
                  <option value="">Ninguna (raíz)</option>
                  {catalog.filter(c => !c.acepta_asientos).map(c => (
                    <option key={c.id} value={c.id}>{c.codigo} - {c.nombre}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="aceptaAsientos" checked={accountForm.aceptaAsientos}
                onChange={e => setAccountForm({...accountForm, aceptaAsientos: e.target.checked})}
                className="rounded border-cyber-purple/30" />
              <label htmlFor="aceptaAsientos" className="text-[9px] uppercase font-bold text-textD tracking-wider">Acepta Asientos</label>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowAccountModal(false)}
                className="px-4 py-2 rounded border border-cyber-purple/30 text-textD text-xs font-bold uppercase tracking-wider hover:bg-cyber-purple/10 transition-all cursor-pointer">
                Cancelar
              </button>
              <button onClick={handleCreateAccount}
                className="px-4 py-2 rounded bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan/30 text-xs font-bold uppercase tracking-wider hover:bg-cyber-cyan/20 transition-all cursor-pointer">
                Crear Cuenta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
