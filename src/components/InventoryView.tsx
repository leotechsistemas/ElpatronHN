import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Archive, AlertTriangle, ArrowUpCircle, ClipboardList, Pencil, Package, DollarSign, BarChart3, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Product, Provider, StockLog, User } from '../types';
import { api } from '../services/api';

interface InventoryViewProps {
  products: Product[];
  providers: Provider[];
  stockLogs: StockLog[];
  currentUser: User | null;
  onAddProduct: (prodData: any) => Promise<boolean>;
  onUpdateProduct?: (productId: string, prodData: any) => Promise<boolean>;
  onDeleteProduct?: (productId: string) => void;
  onAddStockIn: (restockData: any) => Promise<boolean>;
  canAddProduct: boolean;
}

const CATEGORIES = ['Materia Prima', 'Producto Final', 'Insumo', 'Empaque'];

export default function InventoryView({
  products, providers, stockLogs, currentUser,
  onAddProduct, onUpdateProduct, onDeleteProduct, onAddStockIn, canAddProduct
}: InventoryViewProps) {
  const [activeTab, setActiveTab] = useState<'catalog' | 'restock' | 'logs'>('catalog');
  const [searchTerm, setSearchTerm] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Pagination state (catalog tab)
  const PAGE_SIZE = 20;
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [paginatedProducts, setPaginatedProducts] = useState<Product[]>([]);
  const [isLoadingPage, setIsLoadingPage] = useState(false);

  const mapProduct = (p: any): Product => ({
    ID: p.id, Codigo: p.codigo || '', Nombre: p.nombre, Categoría: p.categoria,
    'Stock Inicial': p.stock_inicial, Entradas: p.entradas, Salidas: p.salidas,
    'Stock Actual': p.stock_actual, 'Precio Costo': p.precio_costo,
    'Precio Venta': p.precio_venta, Observaciones: p.observaciones || '',
    Material: p.material || '', 'Proveedor ID': p.proveedor_id || '',
    'Alerta Stock': p.alerta_stock
  });

  const fetchProductsPage = useCallback(async (page: number, search: string, cat: string) => {
    setIsLoadingPage(true);
    try {
      const res = await api.getProducts(page, PAGE_SIZE, search || undefined, cat || undefined);
      setPaginatedProducts(((res as any).content || []).map(mapProduct));
      setTotalPages((res as any).total_pages || 1);
      setTotalElements((res as any).total_elements || 0);
    } catch {
      setPaginatedProducts([]);
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
  useEffect(() => {
    if (activeTab === 'catalog') {
      fetchProductsPage(currentPage, searchInput, catFilter);
    }
  }, [currentPage, searchInput, catFilter, activeTab]);
  const [editProduct, setEditProduct] = useState<Product | null>(null);

  const [prodCodigo, setProdCodigo] = useState('');
  const [prodNombre, setProdNombre] = useState('');
  const [prodCategoria, setProdCategoria] = useState('Materia Prima');
  const [prodStock, setProdStock] = useState('10');
  const [prodCosto, setProdCosto] = useState('');
  const [prodVenta, setProdVenta] = useState('');
  const [prodObs, setProdObs] = useState('');
  const [prodProveedor, setProdProveedor] = useState('');
  const [prodAlerta, setProdAlerta] = useState('5');

  const [restockProduct, setRestockProduct] = useState('');
  const [restockCantidad, setRestockCantidad] = useState('10');
  const [restockCosto, setRestockCosto] = useState('');
  const [restockRef, setRestockRef] = useState('');

  const filteredProducts = paginatedProducts;

  const lowStockCount = products.filter(p => Number(p['Stock Actual']) <= Number(p['Alerta Stock'])).length;
  const totalValuation = products.reduce((acc, p) => acc + (p['Stock Actual'] * p['Precio Costo']), 0);
  const totalVenta = products.reduce((acc, p) => acc + (p['Stock Actual'] * p['Precio Venta']), 0);

  const handleSubmitNewProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodNombre.trim() || !prodCosto || !prodVenta) return;
    if (editProduct) {
      if (!onUpdateProduct) return;
      const success = await onUpdateProduct(editProduct.ID, {
        codigo: prodCodigo.trim() || null, nombre: prodNombre.trim(), categoria: prodCategoria,
        precioCosto: Number(prodCosto), precioVenta: Number(prodVenta),
        alertaStock: Number(prodAlerta || 5),
        observaciones: prodObs, proveedorId: prodProveedor || null
      });
      if (success) { setShowAddModal(false); setEditProduct(null); fetchProductsPage(currentPage, searchInput, catFilter); }
    } else {
      const data = {
        codigo: prodCodigo.trim() || null, nombre: prodNombre.trim(), categoria: prodCategoria,
        stockInicial: Number(prodStock || 0), precioCosto: Number(prodCosto),
        precioVenta: Number(prodVenta), alertaStock: Number(prodAlerta || 5),
        proveedorId: prodProveedor || null, observaciones: prodObs,
        requesterId: currentUser?.ID || 'USR0001'
      };
      const success = await onAddProduct(data);
      if (success) {
        setShowAddModal(false); setEditProduct(null);
        setProdCodigo(''); setProdNombre(''); setProdCosto(''); setProdVenta(''); setProdObs(''); setProdStock('10');
        fetchProductsPage(0, searchInput, catFilter);
      }
    }
  };

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockProduct || !restockCantidad || Number(restockCantidad) <= 0) return;
    const selectedProd = products.find(p => p.ID === restockProduct);
    const costUnit = restockCosto ? Number(restockCosto) : selectedProd?.['Precio Costo'] || 0;
    const success = await onAddStockIn({
      productoId: restockProduct, cantidad: Number(restockCantidad),
      costoUnitario: costUnit, referencia: restockRef || 'Reposición de stock',
      userId: currentUser?.ID || 'USR0001'
    });
    if (success) {
      setRestockProduct(''); setRestockCantidad('10'); setRestockCosto(''); setRestockRef('');
      setActiveTab('catalog');
      fetchProductsPage(0, searchInput, catFilter);
    }
  };

  const openEditProduct = (p: Product) => {
    setEditProduct(p);
    setProdCodigo(p.Codigo);
    setProdNombre(p.Nombre);
    setProdCategoria(p.Categoría);
    setProdStock(String(p['Stock Actual']));
    setProdCosto(String(p['Precio Costo']));
    setProdVenta(String(p['Precio Venta']));
    setProdObs(p.Observaciones || '');
    setProdProveedor('');
    setProdAlerta(String(p['Alerta Stock']));
    setShowAddModal(true);
  };

  const fmt = (n: number) => 'L. ' + Number(n).toLocaleString('es-HN', { minimumFractionDigits: 2 });
  const marginPct = (costo: number, venta: number) => costo > 0 ? ((venta - costo) / costo * 100).toFixed(0) : '—';

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex border-b border-cyber-purple/20">
        {[
          { key: 'catalog' as const, label: 'CATÁLOGO', icon: Archive },
          { key: 'restock' as const, label: 'REPOSICIÓN', icon: ArrowUpCircle },
          { key: 'logs' as const, label: 'MOVIMIENTOS', icon: ClipboardList },
        ].map(t => {
          const Icon = t.icon;
          return <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-5 py-3 font-orbitron text-xs font-bold tracking-wider cursor-pointer transition-all border-b-2 flex items-center gap-2 ${activeTab === t.key ? 'border-cyber-cyan text-cyber-cyan' : 'border-transparent text-textD hover:text-text'}`}>
            <Icon className="w-4 h-4" /> {t.label}
          </button>;
        })}
      </div>

      {/* ═══════════════════ CATALOG ═══════════════════ */}
      {activeTab === 'catalog' && <>
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'PRODUCTOS', value: products.length, icon: Package, color: 'text-cyber-cyan', bg: 'bg-cyber-cyan/10', border: 'border-cyber-cyan/20' },
            { label: 'VALOR INVENTARIO', value: fmt(totalValuation), icon: DollarSign, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
            { label: 'VALOR VENTA', value: fmt(totalVenta), icon: BarChart3, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
            { label: 'STOCK BAJO', value: lowStockCount, icon: AlertTriangle, color: lowStockCount > 0 ? 'text-red-400' : 'text-green-400', bg: lowStockCount > 0 ? 'bg-red-500/10' : 'bg-green-500/10', border: lowStockCount > 0 ? 'border-red-500/20' : 'border-green-500/20' },
          ].map(c => {
            const Icon = c.icon;
            return <div key={c.label} className={`${c.bg} ${c.border} border rounded-xl p-4 flex items-center gap-4`}>
              <div className={`${c.bg} p-2.5 rounded-lg`}><Icon className={`w-5 h-5 ${c.color}`} /></div>
              <div>
                <div className="text-[9px] text-textD uppercase tracking-wider font-orbitron font-bold">{c.label}</div>
                <div className={`font-orbitron font-black text-sm ${c.color}`}>{c.value}</div>
              </div>
            </div>;
          })}
        </div>

        {/* Search + Filter + Add */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-3 text-cyber-purple w-4 h-4" />
              <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar producto..."
                className="w-full pl-10 pr-4 py-2.5 bg-cyber-purple/10 border border-cyber-purple/30 text-text text-xs rounded-lg outline-none" />
            </div>
            <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
              className="bg-cyber-purple/10 border border-cyber-purple/30 rounded-lg px-3 py-2.5 text-text text-xs outline-none">
              <option value="">Todas</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          {canAddProduct && <button onClick={() => { setEditProduct(null); setProdCodigo(''); setProdNombre(''); setProdCosto(''); setProdVenta(''); setProdStock('10'); setProdAlerta('5'); setProdObs(''); setProdProveedor(''); setShowAddModal(true); }}
            className="px-4 py-2.5 bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan/30 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-cyber-cyan hover:text-white transition-all cursor-pointer flex items-center gap-2 shrink-0">
            <Plus className="w-4 h-4" /> Nuevo Producto
          </button>}
        </div>

        {/* Product Table */}
        <div className="border border-cyber-purple/20 bg-cyber-panel rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-cyber-purple/10 text-cyber-cyan font-orbitron text-[9px] tracking-wider border-b border-cyber-purple/20">
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">CÓDIGO</th>
                  <th className="px-4 py-3">PRODUCTO</th>
                  <th className="px-4 py-3">CATEGORÍA</th>
                  <th className="px-4 py-3 text-center">STOCK</th>
                  <th className="px-4 py-3 text-center">ALERTA</th>
                  <th className="px-4 py-3 text-right">COSTO</th>
                  <th className="px-4 py-3 text-right">VENTA</th>
                  <th className="px-4 py-3 text-right">MARGEN</th>
                  <th className="px-4 py-3 text-right">VALOR</th>
                  <th className="px-4 py-3 text-center">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyber-purple/10 font-mono text-xs">
                {filteredProducts.map(p => {
                  const isLow = Number(p['Stock Actual']) <= Number(p['Alerta Stock']);
                  const stockPct = Math.min(100, Math.round(Number(p['Stock Actual']) / Math.max(1, Number(p['Alerta Stock']) * 3) * 100));
                  return <tr key={p.ID} className="hover:bg-cyber-purple/5 transition-all text-text group">
                    <td className="px-4 py-3.5 text-cyber-cyan font-bold text-[10px] font-mono">{p.ID}</td>
                    <td className="px-4 py-3.5 text-textD text-[10px] font-mono">{p.Codigo || '—'}</td>
                    <td className="px-4 py-3.5 font-bold">
                      <div>{p.Nombre}</div>
                      {p.Observaciones && <div className="text-[9px] text-textD font-normal mt-0.5 truncate max-w-48">{p.Observaciones}</div>}
                    </td>
                    <td className="px-4 py-3.5 text-textD text-[10px]">{p.Categoría}</td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center gap-2 justify-center">
                        <span className={`font-bold text-sm font-orbitron ${isLow ? 'text-red-400' : 'text-green-400'}`}>{p['Stock Actual']}</span>
                        <div className="w-12 h-1.5 bg-cyber-bg2 rounded-full overflow-hidden hidden sm:block">
                          <div className={`h-full rounded-full transition-all ${isLow ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${stockPct}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center text-yellow-500 font-bold text-[10px]">{p['Alerta Stock']}</td>
                    <td className="px-4 py-3.5 text-right text-textD">{fmt(p['Precio Costo'])}</td>
                    <td className="px-4 py-3.5 text-right text-green-400 font-bold">{fmt(p['Precio Venta'])}</td>
                    <td className="px-4 py-3.5 text-right font-bold" style={{ color: Number(marginPct(p['Precio Costo'], p['Precio Venta'])) >= 50 ? '#22c55e' : Number(marginPct(p['Precio Costo'], p['Precio Venta'])) >= 20 ? '#eab308' : '#ef4444' }}>
                      {marginPct(p['Precio Costo'], p['Precio Venta'])}%
                    </td>
                    <td className="px-4 py-3.5 text-right text-amber-400 font-bold">{fmt(p['Stock Actual'] * p['Precio Costo'])}</td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openEditProduct(p)}
                          className="p-1.5 rounded bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan/20 hover:bg-cyber-cyan hover:text-white transition-all cursor-pointer" title="Editar">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        {onDeleteProduct && <button onClick={() => { if (window.confirm(`Eliminar ${p.Nombre}?`)) { onDeleteProduct(p.ID); fetchProductsPage(0, searchInput, catFilter); } }}
                          className="p-1.5 rounded bg-rose-950/20 text-rose-400 border border-rose-500/30 hover:bg-rose-600 hover:text-white transition-all cursor-pointer" title="Eliminar">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>}
                      </div>
                    </td>
                  </tr>;
                })}
              </tbody>
            </table>
            {filteredProducts.length === 0 && <div className="text-center py-12 text-textD text-xs">No se encontraron productos.</div>}
          </div>
          {/* Pagination */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-cyber-purple/20 text-xs font-mono">
            <div className="text-textD">
              {totalElements > 0 ? `${totalElements} registros · Página ${currentPage + 1} de ${totalPages}` : 'Sin resultados'}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                disabled={currentPage === 0 || isLoadingPage}
                className="px-3 py-1.5 rounded bg-cyber-purple/10 text-cyber-cyan border border-cyber-purple/30 hover:bg-cyber-purple/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer">
                <ChevronLeft className="w-3.5 h-3.5 inline" /> Anterior
              </button>
              <span className="px-3 py-1.5 text-textD">{currentPage + 1} / {totalPages || 1}</span>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage >= totalPages - 1 || isLoadingPage}
                className="px-3 py-1.5 rounded bg-cyber-purple/10 text-cyber-cyan border border-cyber-purple/30 hover:bg-cyber-purple/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer">
                Siguiente <ChevronRight className="w-3.5 h-3.5 inline" />
              </button>
            </div>
          </div>
        </div>
      </>}

      {/* ═══════════════════ RESTOCK ═══════════════════ */}
      {activeTab === 'restock' && <>
        <div className="border border-cyber-purple/20 bg-cyber-panel rounded-xl max-w-lg mx-auto">
          <div className="border-b border-cyber-purple/20 px-5 py-4">
            <h4 className="font-orbitron font-bold text-xs text-cyber-cyan tracking-wider uppercase flex items-center gap-2">
              <ArrowUpCircle className="w-4 h-4 text-green-400" /> Registrar Entrada de Stock
            </h4>
          </div>
          <div className="p-6">
            <form onSubmit={handleRestockSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1">Producto *</label>
                <select value={restockProduct} onChange={e => { setRestockProduct(e.target.value); const prod = products.find(p => p.ID === e.target.value); if (prod) setRestockCosto(String(prod['Precio Costo'])); }}
                  className="w-full bg-cyber-purple/10 border border-cyber-purple/30 rounded-lg p-3 text-text text-xs" required>
                  <option value="">— Seleccionar —</option>
                  {products.map(p => <option key={p.ID} value={p.ID}>{p.Nombre} (Stock: {p['Stock Actual']})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1">Cantidad *</label>
                  <input type="number" value={restockCantidad} onChange={e => setRestockCantidad(e.target.value)}
                    className="w-full bg-cyber-purple/10 border border-cyber-purple/30 rounded-lg p-3 text-text text-xs" min="1" required />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1">Costo Unitario (L.)</label>
                  <input type="number" value={restockCosto} onChange={e => setRestockCosto(e.target.value)}
                    className="w-full bg-cyber-purple/10 border border-cyber-purple/30 rounded-lg p-3 text-text text-xs" placeholder="0.00" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1">Referencia / Factura</label>
                <input type="text" value={restockRef} onChange={e => setRestockRef(e.target.value)}
                  className="w-full bg-cyber-purple/10 border border-cyber-purple/30 rounded-lg p-3 text-text text-xs" placeholder="Ej: Factura #225" />
              </div>
              {restockProduct && Number(restockCantidad) > 0 && <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-4 flex items-center justify-between text-xs">
                <div>
                  <div className="text-textD uppercase text-[9px]">Nuevo Stock</div>
                  <div className="font-orbitron font-bold text-base text-cyber-cyan">{(products.find(p => p.ID === restockProduct)?.['Stock Actual'] || 0) + Number(restockCantidad)} uds</div>
                </div>
                <div className="text-right">
                  <div className="text-textD uppercase text-[9px]">Inversión</div>
                  <div className="font-orbitron font-bold text-base text-yellow-500">{fmt(Number(restockCantidad) * (Number(restockCosto) || 0))}</div>
                </div>
              </div>}
              <div className="flex justify-end pt-2">
                <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-green-500 text-white font-orbitron font-bold text-[10px] tracking-wider rounded-lg shadow-[0_0_12px_rgba(16,185,129,0.4)] cursor-pointer">
                  Registrar Entrada
                </button>
              </div>
            </form>
          </div>
        </div>
      </>}

      {/* ═══════════════════ LOGS ═══════════════════ */}
      {activeTab === 'logs' && <>
        <div className="border border-cyber-purple/20 bg-cyber-panel rounded-xl overflow-hidden">
          <div className="border-b border-cyber-purple/20 px-5 py-3">
            <h4 className="font-orbitron font-bold text-xs text-cyber-cyan tracking-wider uppercase">Historial de Movimientos</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-cyber-purple/10 font-orbitron text-[9px] tracking-wider text-cyber-cyan border-b border-cyber-purple/20">
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">PRODUCTO</th>
                  <th className="px-4 py-3">FECHA</th>
                  <th className="px-4 py-3 text-center">TIPO</th>
                  <th className="px-4 py-3 text-center">CANT</th>
                  <th className="px-4 py-3 text-right">C. UNIT</th>
                  <th className="px-4 py-3 text-right">C. TOTAL</th>
                  <th className="px-4 py-3">REFERENCIA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyber-purple/10 font-mono text-xs">
                {[...stockLogs].reverse().map(log => <tr key={log.ID} className="hover:bg-cyber-purple/5 transition-all text-text">
                  <td className="px-4 py-3.5 text-cyber-cyan font-bold text-[10px]">{log.ID}</td>
                  <td className="px-4 py-3.5 font-bold">{log.Producto}</td>
                  <td className="px-4 py-3.5 text-textD">{log.Fecha}</td>
                  <td className="px-4 py-3.5 text-center">
                    {log.Tipo === 'entrada'
                      ? <span className="bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded text-[9px] font-bold">+ Entrada</span>
                      : <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded text-[9px] font-bold">− Salida</span>}
                  </td>
                  <td className={`px-4 py-3.5 text-center font-bold ${log.Tipo === 'entrada' ? 'text-green-400' : 'text-red-400'}`}>
                    {log.Tipo === 'entrada' ? '+' : '−'}{log.Cantidad}
                  </td>
                  <td className="px-4 py-3.5 text-right text-textD">{fmt(log['Costo Unitario'])}</td>
                  <td className="px-4 py-3.5 text-right text-yellow-500 font-bold">{fmt(log['Costo Total'])}</td>
                  <td className="px-4 py-3.5 text-textD text-[10px]">{log.Referencia || '—'}</td>
                </tr>)}
              </tbody>
            </table>
            {stockLogs.length === 0 && <div className="text-center py-12 text-textD text-xs">Sin movimientos registrados.</div>}
          </div>
        </div>
      </>}

      {/* ═══════════════════ NEW/EDIT PRODUCT MODAL ═══════════════════ */}
      {showAddModal && <div className="modal-overlay open" onClick={() => setShowAddModal(false)}>
        <div className="modal w-full max-w-lg bg-cyber-panel border border-cyber-purple rounded-xl" onClick={e => e.stopPropagation()}>
          <div className="modalHeader border-b border-cyber-purple/25 p-5 flex items-center justify-between">
            <h3 className="font-orbitron text-xs font-bold text-cyber-cyan tracking-wider uppercase flex items-center gap-2">
              {editProduct ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {editProduct ? 'EDITAR PRODUCTO' : 'NUEVO PRODUCTO'}
            </h3>
            <button onClick={() => setShowAddModal(false)} className="text-textD hover:text-red-400 text-lg cursor-pointer bg-none border-none">✕</button>
          </div>
          <form onSubmit={handleSubmitNewProduct}>
            <div className="modalBody p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1">Código / Barras</label>
                  <input type="text" value={prodCodigo} onChange={e => setProdCodigo(e.target.value)}
                    className="w-full bg-cyber-purple/10 border border-cyber-purple/30 rounded p-3 text-text text-xs" placeholder="Opcional" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1">Nombre *</label>
                  <input type="text" value={prodNombre} onChange={e => setProdNombre(e.target.value)}
                    className="w-full bg-cyber-purple/10 border border-cyber-purple/30 rounded p-3 text-text text-xs" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1">Categoría</label>
                  <select value={prodCategoria} onChange={e => setProdCategoria(e.target.value)}
                    className="w-full bg-cyber-purple/10 border border-cyber-purple/30 rounded p-3 text-text text-xs">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1">Stock Inicial</label>
                  <input type="number" value={prodStock} onChange={e => setProdStock(e.target.value)}
                    className="w-full bg-cyber-purple/10 border border-cyber-purple/30 rounded p-3 text-text text-xs" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1">Alerta Mínimo</label>
                  <input type="number" value={prodAlerta} onChange={e => setProdAlerta(e.target.value)}
                    className="w-full bg-cyber-purple/10 border border-cyber-purple/30 rounded p-3 text-text text-xs" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1">Costo Compra (L.) *</label>
                  <input type="number" value={prodCosto} onChange={e => setProdCosto(e.target.value)}
                    className="w-full bg-cyber-purple/10 border border-cyber-purple/30 rounded p-3 text-text text-xs" required />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1">Precio Venta (L.) *</label>
                  <input type="number" value={prodVenta} onChange={e => setProdVenta(e.target.value)}
                    className="w-full bg-cyber-purple/10 border border-cyber-purple/30 rounded p-3 text-text text-xs" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1">Proveedor</label>
                  <select value={prodProveedor} onChange={e => setProdProveedor(e.target.value)}
                    className="w-full bg-cyber-purple/10 border border-cyber-purple/30 rounded p-3 text-text text-xs">
                    <option value="">Sin asignar</option>
                    {providers.map(p => <option key={p.ID} value={p.ID}>{p.Nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1">Margen Estimado</label>
                  <div className="h-[42px] flex items-center text-xs font-mono font-bold" style={{ color: Number(prodCosto) && Number(prodVenta) ? (Number(prodVenta) >= Number(prodCosto) * 1.5 ? '#22c55e' : '#eab308') : '#9CA3AF' }}>
                    {Number(prodCosto) && Number(prodVenta) ? `${((Number(prodVenta) - Number(prodCosto)) / Number(prodCosto) * 100).toFixed(0)}%` : '—'}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1">Observaciones</label>
                <textarea value={prodObs} onChange={e => setProdObs(e.target.value)}
                  className="w-full bg-cyber-purple/10 border border-cyber-purple/30 rounded p-3 text-text text-xs" rows={2} />
              </div>
            </div>
            <div className="modalFooter border-t border-cyber-purple/20 p-5 flex justify-end gap-3 text-xs">
              <button type="button" onClick={() => setShowAddModal(false)}
                className="px-5 py-2.5 bg-cyber-bg2 text-text border border-cyber-purple/20 rounded hover:bg-cyber-purple/10 cursor-pointer">Cancelar</button>
              <button type="submit"
                className="px-5 py-2.5 bg-gradient-to-r from-cyber-purple to-indigo-600 text-white font-orbitron font-bold rounded shadow-[0_0_12px_rgba(138,43,226,0.5)] cursor-pointer">
                {editProduct ? 'Guardar Cambios' : 'Crear Producto'}
              </button>
            </div>
          </form>
        </div>
      </div>}
    </div>
  );
}
