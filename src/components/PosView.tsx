import React, { useState, useRef } from 'react';
import {
  Check, AlertCircle, DollarSign, UserPlus, Trash2, Wrench, Barcode, Minus, Plus
} from 'lucide-react';
import { Client, Product, User, ServiceType } from '../types';
import QuickClientModal from './QuickClientModal';

interface PosViewProps {
  clients: Client[];
  products: Product[];
  currentUser: User | null;
  onAddSale: (saleData: any) => Promise<boolean>;
  onAddQuickClient: (clientData: any) => Promise<any> | any;
  canCreateSale: boolean;
  serviceTypes: ServiceType[];
}

interface PosCartItem {
  type: 'PRODUCTO' | 'SERVICIO';
  product?: Product;
  service?: ServiceType;
  qty: number;
  descripcion?: string;
  precio?: number;
  material?: string;
  ancho?: number;
  alto?: number;
  espesor?: number;
  textoGrabar?: string;
  tipoFuente?: string;
  direccionInstalacion?: string;
  altura?: number;
  tipoSuperficie?: string;
  tipoArchivo?: string;
  acabado?: string;
  referencias?: string;
  formatoEntrega?: string;
}

export default function PosView({
  clients,
  products = [],
  currentUser,
  onAddSale,
  onAddQuickClient,
  canCreateSale,
  serviceTypes,
}: PosViewProps) {
  const [posCart, setPosCart] = useState<PosCartItem[]>([]);
  const [posSearch, setPosSearch] = useState('');
  const [posBarcodeBuf, setPosBarcodeBuf] = useState('');
  const [posClient, setPosClient] = useState('');
  const [posPayModal, setPosPayModal] = useState(false);
  const [posPaymentMode, setPosPaymentMode] = useState<'full' | 'partial' | 'none'>('full');
  const [posMonto, setPosMonto] = useState('');
  const [posMetodo, setPosMetodo] = useState<'Efectivo' | 'Tarjeta' | 'Transferencia'>('Efectivo');
  const posSearchRef = useRef<HTMLInputElement>(null);
  const [posAplicarISV, setPosAplicarISV] = useState(true);
  const [posDescuento, setPosDescuento] = useState(0);
  const [posConRtn, setPosConRtn] = useState(false);
  const [posRtn, setPosRtn] = useState('');
  const posBarcodeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [posManualProduct, setPosManualProduct] = useState('');
  const [posManualQty, setPosManualQty] = useState(1);
  const [serviceModal, setServiceModal] = useState<{ open: boolean; service?: ServiceType }>({ open: false });
  const [serviceForm, setServiceForm] = useState<Record<string, any>>({});

  // Quick client modal
  const [isOpenClientModal, setIsOpenClientModal] = useState(false);
  const [quickNombre, setQuickNombre] = useState('');
  const [quickTelefono, setQuickTelefono] = useState('');
  const [quickEmail, setQuickEmail] = useState('');
  const [quickDept, setQuickDept] = useState('Cortes');
  const [quickCiudad, setQuickCiudad] = useState('');
  const [quickRtn, setQuickRtn] = useState('');

  const SERVICE_FIELDS_MAP: Record<string, { key: string; label: string; type: 'text' | 'number' | 'textarea'; required: boolean }[]> = {
    'Corte Laser': [{ key: 'descripcion', label: 'Descripción del trabajo', type: 'textarea', required: true }],
    'Laser CO2': [{ key: 'descripcion', label: 'Descripción del trabajo', type: 'textarea', required: true }],
    'Router CNC': [{ key: 'descripcion', label: 'Descripción del trabajo', type: 'textarea', required: true }],
    'Grabado': [{ key: 'descripcion', label: 'Texto o diseño a grabar', type: 'textarea', required: true }],
    'Instalacion': [{ key: 'descripcion', label: 'Detalles de la instalación', type: 'textarea', required: true }],
    'Diseno': [{ key: 'descripcion', label: 'Descripción del diseño', type: 'textarea', required: true }],
    'Otros': [{ key: 'descripcion', label: 'Descripción del trabajo', type: 'textarea', required: true }],
    'Mantenimiento': [{ key: 'descripcion', label: 'Descripción del mantenimiento', type: 'textarea', required: true }],
  };

  const fmtVal = (v: number) => 'L. ' + Number(v).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handlePosBarcodeKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const code = posBarcodeBuf.trim();
      if (!code) return;
      const prod = products.find(p => p.Codigo === code || p.ID === code);
      if (prod) {
        setPosCart(prev => {
          const existing = prev.findIndex(i => i.type === 'PRODUCTO' && i.product?.ID === prod.ID);
          if (existing >= 0) {
            const updated = [...prev];
            updated[existing] = { ...updated[existing], qty: updated[existing].qty + 1 };
            return updated;
          }
          return [...prev, { type: 'PRODUCTO', product: prod, qty: 1 }];
        });
      }
      setPosBarcodeBuf('');
    }
  };

  const handlePosSearchEnter = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && posSearch.trim()) {
      e.preventDefault();
      const term = posSearch.trim().toLowerCase();
      const prod = products.find(p =>
        p.Codigo.toLowerCase() === term ||
        p.ID.toLowerCase() === term ||
        p.Nombre.toLowerCase() === term
      );
      if (prod) {
        setPosCart(prev => {
          const existing = prev.findIndex(i => i.type === 'PRODUCTO' && i.product?.ID === prod!.ID);
          if (existing >= 0) {
            const updated = [...prev];
            updated[existing] = { ...updated[existing], qty: updated[existing].qty + 1 };
            return updated;
          }
          return [...prev, { type: 'PRODUCTO', product: prod!, qty: 1 }];
        });
        setPosSearch('');
        posSearchRef.current?.focus();
      }
    }
  };

  const handlePosAddManual = () => {
    if (!posManualProduct) return;
    const prod = products.find(p => p.ID === posManualProduct);
    if (!prod) return;
    setPosCart(prev => {
      const existing = prev.findIndex(i => i.type === 'PRODUCTO' && i.product?.ID === prod!.ID);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { ...updated[existing], qty: updated[existing].qty + (posManualQty || 1) };
        return updated;
      }
      return [...prev, { type: 'PRODUCTO', product: prod!, qty: posManualQty || 1 }];
    });
    setPosManualProduct('');
    setPosManualQty(1);
    posSearchRef.current?.focus();
  };

  const posItemPrice = (i: PosCartItem) => {
    if (i.type === 'PRODUCTO' && i.product) return i.product['Precio Venta'] * i.qty;
    return (i.precio || 0) * i.qty;
  };

  const round2 = (n: number) => Math.round(n * 100) / 100;

  const posTotal = () => {
    const sum = posCart.reduce((a, i) => a + posItemPrice(i), 0);
    const dto = sum * (posDescuento / 100);
    const sub = sum - dto;
    return round2(posAplicarISV ? sub * 1.15 : sub);
  };

  const posCambio = () => {
    const monto = Number(posMonto) || 0;
    return Math.max(0, monto - posTotal());
  };

  const handlePosCheckout = async () => {
    if (!posClient) { alert('Seleccione un cliente'); return; }
    if (posCart.length === 0) { alert('Agregue productos al carrito'); return; }
    const clientObj = clients.find(c => c.ID === posClient);
    if (!clientObj) return;
    const total = posTotal();
    console.log('=== POS CART ITEMS ===', JSON.stringify(posCart.map(ci => ({ type: ci.type, precioVenta: ci.product?.['Precio Venta'], product: ci.product ? { ID: ci.product.ID, Nombre: ci.product.Nombre, PV: ci.product['Precio Venta'] } : null, qty: ci.qty }))));
    const mappedItems = posCart.map(ci => {
      if (ci.type === 'PRODUCTO') return {
        tipoItem: 'PRODUCTO',
        productoId: ci.product!.ID,
        descripcion: ci.product!.Nombre,
        cantidad: ci.qty,
        precioUnitario: ci.product!['Precio Venta'],
        descuento: ci.product!['Precio Venta'] * ci.qty * (posDescuento / 100),
        isv: posAplicarISV ? 15 : 0,
      };
      return {
        tipoItem: 'SERVICIO',
        servicioId: ci.service?.id || undefined,
        descripcion: ci.descripcion || ci.service?.nombre || 'Servicio',
        cantidad: ci.qty,
        precioUnitario: (ci.precio || 0) / ci.qty,
        descuento: 0,
        isv: posAplicarISV ? 15 : 0,
      };
    });
    const pagoInicial = posPaymentMode === 'full' ? total : (posPaymentMode === 'partial' ? (Number(posMonto) || 0) : 0);
    const change = Math.max(0, (Number(posMonto) || 0) - total);
    const success = await onAddSale({
      clienteId: posClient,
      clienteNombre: clientObj.Nombre,
      rtn: posRtn || clientObj.RTN || '',
      conRtn: !!posConRtn,
      items: mappedItems,
      precio: total,
      pagoInicial,
      metodoPago: posPaymentMode !== 'none' ? posMetodo : undefined,
      descuento: posDescuento,
      isvAplicado: posAplicarISV ? 15 : 0,
      observaciones: `POS:Desc:${posDescuento}% ISV:${posAplicarISV ? 15 : 0}%${posPaymentMode === 'full' ? ` Cambio:${change}` : ''}${posPaymentMode === 'none' ? ' SinPago' : ''} | Venta POS`,
      vendedorId: currentUser?.ID || 'USR0001'
    });
    if (success) {
      setPosCart([]);
      setPosSearch('');
      setPosMonto('');
      setPosDescuento(0);
      setPosAplicarISV(true);
      setPosConRtn(false);
      setPosRtn('');
      setPosPayModal(false);
    }
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
      setPosClient(newCl.ID);
      setQuickNombre('');
      setQuickTelefono('');
      setQuickEmail('');
      setQuickCiudad('');
      setQuickRtn('');
      setIsOpenClientModal(false);
    }
  };

  if (!canCreateSale) {
    return (
      <div className="space-y-6">
        <div className="text-center py-16 text-textD border border-cyber-purple/20 bg-cyber-panel rounded-xl">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-cyber-purple" />
          <p className="font-orbitron text-xs font-bold uppercase tracking-wider">Sin permisos de venta</p>
          <p className="text-xs mt-2">Solo Administradores y Vendedores pueden usar el POS.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Cart + Product search */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Barcode className="absolute left-3.5 top-3 text-cyber-purple w-4 h-4" />
              <input ref={posSearchRef} type="text" placeholder="🔍 Buscar producto..."
                value={posSearch} onChange={e => setPosSearch(e.target.value)} onKeyDown={handlePosSearchEnter}
                className="w-full pl-10 pr-4 py-3 bg-cyber-purple/10 border border-cyber-purple/40 text-text font-mono text-sm rounded-lg outline-none focus:border-cyber-cyan transition-all" />
            </div>
            <input type="text" placeholder="Código barras" autoFocus value={posBarcodeBuf}
              onChange={e => setPosBarcodeBuf(e.target.value)} onKeyDown={handlePosBarcodeKey}
              className="w-36 bg-cyber-purple/10 border border-cyber-purple/40 text-text font-mono text-sm rounded-lg outline-none focus:border-amber-400 transition-all px-3 py-3" />
          </div>

          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="block text-[9px] uppercase font-bold text-cyber-cyan mb-1 tracking-wider">Agregar producto manualmente</label>
              <select value={posManualProduct} onChange={e => { setPosManualProduct(e.target.value); }}
                className="w-full bg-cyber-purple/10 border border-cyber-purple/40 rounded p-2.5 text-text text-xs outline-none">
                <option value="">— Seleccionar del catálogo —</option>
                {products.filter(p => p['Stock Actual'] > 0).map(p => (
                  <option key={p.ID} value={p.ID}>{p.Nombre} (Stock: {p['Stock Actual']} · L.{p['Precio Venta']})</option>
                ))}
              </select>
            </div>
            <div className="w-20">
              <label className="block text-[9px] uppercase font-bold text-cyber-cyan mb-1 tracking-wider">Cant</label>
              <input type="number" min="1" value={posManualQty} onChange={e => setPosManualQty(Math.max(1, Number(e.target.value) || 1))}
                className="w-full bg-cyber-purple/10 border border-cyber-purple/40 rounded p-2.5 text-text text-xs text-center outline-none" />
            </div>
            <button onClick={handlePosAddManual} disabled={!posManualProduct}
              className="px-4 py-2.5 rounded bg-amber-600/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold uppercase tracking-wider hover:bg-amber-600 hover:text-white transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
              + Agregar
            </button>
          </div>

          <div className="border border-cyber-purple/20 bg-cyber-panel rounded-xl overflow-hidden">
            <div className="px-5 py-3 bg-cyber-purple/10 border-b border-cyber-purple/20 flex items-center justify-between">
              <span className="font-orbitron text-xs font-bold text-cyber-cyan tracking-wider">CARRITO</span>
              <span className="text-textD text-xs">{posCart.reduce((a, i) => a + i.qty, 0)} items</span>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {posCart.length === 0 ? (
                <div className="text-center py-12 text-textD text-xs">Carrito vacío. Agregue productos o escoja un servicio.</div>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[9px] uppercase tracking-wider text-textD border-b border-cyber-purple/10">
                      <th className="px-3 py-2 font-semibold">Item</th>
                      <th className="px-3 py-2 text-center">Cant</th>
                      <th className="px-3 py-2 text-right">Precio</th>
                      <th className="px-3 py-2 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cyber-purple/10">
                    {posCart.map((ci, idx) => {
                      const name = ci.type === 'PRODUCTO' ? ci.product!.Nombre : (ci.service?.nombre || 'Servicio');
                      const price = ci.type === 'PRODUCTO' ? ci.product!['Precio Venta'] : (ci.precio || 0);
                      return (
                      <tr key={idx} className="hover:bg-cyber-purple/5 transition-all text-text text-xs">
                        <td className="px-3 py-3">
                          <div className="font-bold text-[11px]">{name}</div>
                          {ci.type === 'SERVICIO' && ci.descripcion && <div className="text-[8px] text-textD truncate max-w-[120px]">{ci.descripcion}</div>}
                          {ci.type === 'PRODUCTO' && ci.product?.Codigo && <div className="text-[8px] text-textD font-mono">{ci.product.Codigo}</div>}
                          <span className={`text-[8px] px-1 py-0.5 rounded ${ci.type === 'PRODUCTO' ? 'bg-amber-500/10 text-amber-400' : 'bg-cyber-purple/10 text-cyber-purple'}`}>
                            {ci.type === 'PRODUCTO' ? 'PROD' : 'SERV'}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => {
                              if (ci.qty <= 1) { setPosCart(prev => prev.filter((_, j) => j !== idx)); }
                              else { setPosCart(prev => prev.map((item, j) => j === idx ? { ...item, qty: item.qty - 1 } : item)); }
                            }}
                              className="p-0.5 rounded bg-cyber-purple/20 text-textD hover:text-red-400 cursor-pointer border-none"><Minus className="w-3 h-3" /></button>
                            <span className="w-5 text-center font-mono text-sm font-bold text-cyber-cyan">{ci.qty}</span>
                            <button onClick={() => setPosCart(prev => prev.map((item, j) => j === idx ? { ...item, qty: item.qty + 1 } : item))}
                              className="p-0.5 rounded bg-cyber-purple/20 text-textD hover:text-green-400 cursor-pointer border-none"><Plus className="w-3 h-3" /></button>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-right font-mono">{fmtVal(price)}</td>
                        <td className="px-3 py-3 text-center">
                          <button onClick={() => setPosCart(prev => prev.filter((_, j) => j !== idx))}
                            className="p-1 rounded bg-rose-950/20 text-rose-400 border border-rose-500/30 hover:bg-rose-600 hover:text-white transition-all cursor-pointer"><Trash2 className="w-3 h-3" /></button>
                        </td>
                      </tr>
                    );})}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Center: Service Cards */}
        <div className="space-y-4">
          <div className="border border-cyber-purple/20 bg-cyber-panel rounded-xl p-4">
            <h3 className="font-orbitron text-xs font-bold text-cyber-cyan tracking-wider uppercase mb-3 flex items-center gap-2">
              <Wrench className="w-4 h-4" /> Servicios
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {serviceTypes.filter(st => st.activo).map(st => (
                <button key={st.id} onClick={() => {
                  setServiceForm({ precio: st.precioSugerido || 0, cantidad: 1 });
                  setServiceModal({ open: true, service: st });
                }}
                  className="flex flex-col items-center justify-center p-3 rounded-xl border bg-cyber-purple/5 border-cyber-purple/30 hover:border-cyber-cyan/50 hover:bg-cyber-purple/15 transition-all cursor-pointer text-center group">
                  <span className="text-2xl mb-1">{st.icono || '⚙️'}</span>
                  <span className="text-[10px] font-bold text-textD group-hover:text-cyber-cyan transition-colors">{st.nombre}</span>
                  {st.precioSugerido > 0 && <span className="text-[8px] text-amber-400 font-mono mt-0.5">desde L.{st.precioSugerido}</span>}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Totals + Checkout */}
        <div className="space-y-4">
          <div className="border border-cyber-purple/20 bg-cyber-panel rounded-xl p-4 space-y-3">
            <label className="block text-[10px] uppercase font-bold text-cyber-cyan tracking-wider">Cliente</label>
            <select value={posClient} onChange={e => { setPosClient(e.target.value); const c = clients.find(cl => cl.ID === e.target.value); if (c?.RTN) { setPosRtn(c.RTN); setPosConRtn(true); } }}
              className="w-full bg-cyber-purple/10 border border-cyber-purple/30 rounded p-2.5 text-text text-xs outline-none">
              <option value="">— Seleccionar —</option>
              {clients.map(c => <option key={c.ID} value={c.ID}>{c.Nombre}</option>)}
            </select>
            {posConRtn && <div className="text-[10px] text-amber-400 font-mono">RTN: {posRtn}</div>}
            <button onClick={() => setIsOpenClientModal(true)}
              className="text-[10px] text-cyber-pink hover:underline uppercase flex items-center gap-1 border-none bg-transparent cursor-pointer font-bold font-mono">
              <UserPlus className="w-3 h-3" /> + Nuevo cliente
            </button>
          </div>

          <div className="border border-cyber-purple/20 bg-cyber-panel rounded-xl p-4 space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between text-textD">
              <span>Subtotal</span>
              <span>{fmtVal(posCart.reduce((a, i) => a + posItemPrice(i), 0))}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <span className="text-textD">Dto.</span>
                <input type="number" min="0" max="100" value={posDescuento} onChange={e => setPosDescuento(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                  className="w-12 bg-cyber-purple/10 border border-cyber-purple/30 rounded px-1.5 py-0.5 text-text text-[10px] text-center" />
                <span className="text-textD">%</span>
              </div>
              <span className="text-rose-400">-{fmtVal(posCart.reduce((a, i) => a + posItemPrice(i), 0) * posDescuento / 100)}</span>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1 text-textD cursor-pointer">
                <input type="checkbox" checked={posAplicarISV} onChange={e => setPosAplicarISV(e.target.checked)}
                  className="w-3 h-3 accent-amber-500" />
                ISV 15%
              </label>
              <span className="text-rose-400">{posAplicarISV ? fmtVal((posCart.reduce((a, i) => a + posItemPrice(i), 0) * (1 - posDescuento / 100)) * 0.15) : 'L. 0.00'}</span>
            </div>
            <div className="flex items-center justify-between border-t border-cyber-purple/20 pt-2">
              <span className="text-green-400 font-bold uppercase text-[10px]">TOTAL</span>
              <span className="text-green-400 font-black text-lg font-orbitron">{fmtVal(posTotal())}</span>
            </div>
          </div>

          <button onClick={() => { setPosMonto(String(posTotal())); setPosPaymentMode('full'); setPosPayModal(true); }} disabled={posCart.length === 0}
            className="w-full py-4 bg-gradient-to-r from-amber-600 to-amber-500 text-white font-orbitron font-bold text-sm tracking-widest rounded-xl shadow-[0_0_20px_rgba(235,180,44,0.5)] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-[0_0_30px_rgba(235,180,44,0.7)] transition-all border-none flex items-center justify-center gap-2">
            <DollarSign className="w-5 h-5" />
            COBRAR L. {(posTotal()).toFixed(2)}
          </button>
        </div>
      </div>

      {/* SERVICE CONFIG MODAL */}
      {serviceModal.open && serviceModal.service && (() => {
        const svc = serviceModal.service;
        const fields = SERVICE_FIELDS_MAP[svc.nombre] || SERVICE_FIELDS_MAP['Otros'];
        const requiredFields = fields.filter(f => f.required);
        const missingRequired = requiredFields.some(f => !serviceForm[f.key] && serviceForm[f.key] !== 0);
        return (
        <div className="modal-overlay open z-[60]">
          <div className="modal w-full max-w-lg bg-cyber-panel border border-cyber-purple rounded-xl text-text font-sans">
            <div className="modalHeader border-b border-cyber-purple/25 p-5 flex items-center justify-between">
              <h3 className="font-orbitron text-xs font-bold text-cyber-cyan tracking-wider uppercase flex items-center gap-2">
                <Wrench className="w-4 h-4 text-cyber-purple" />
                {svc.icono} {svc.nombre}
              </h3>
              <button type="button" onClick={() => setServiceModal({ open: false })} className="text-textD hover:text-red-400 text-lg cursor-pointer bg-none border-none">✕</button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (missingRequired) return;
              const price = Number(serviceForm.precio) || 0;
              const qty = Number(serviceForm.cantidad) || 1;
              const item: PosCartItem = {
                type: 'SERVICIO',
                service: svc,
                qty,
                precio: price * qty,
                descripcion: serviceForm.descripcion || svc.nombre,
                material: serviceForm.material,
                ancho: serviceForm.ancho,
                alto: serviceForm.alto,
                espesor: serviceForm.espesor,
                textoGrabar: serviceForm.textoGrabar,
                tipoFuente: serviceForm.tipoFuente,
                direccionInstalacion: serviceForm.direccionInstalacion,
                altura: serviceForm.altura,
                tipoSuperficie: serviceForm.tipoSuperficie,
                tipoArchivo: serviceForm.tipoArchivo,
                acabado: serviceForm.acabado,
                referencias: serviceForm.referencias,
                formatoEntrega: serviceForm.formatoEntrega,
              };
              setPosCart(prev => [...prev, item]);
              setServiceModal({ open: false });
            }}>
              <div className="modalBody p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                {fields.map(f => (
                  <div key={f.key}>
                    <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1">
                      {f.label} {f.required && <span className="text-red-400">*</span>}
                    </label>
                    {f.type === 'textarea' ? (
                      <textarea value={serviceForm[f.key] || ''} onChange={e => setServiceForm({ ...serviceForm, [f.key]: e.target.value })}
                        className="w-full bg-cyber-purple/10 border border-cyber-purple/30 rounded p-3 text-text text-xs outline-none min-h-[60px]" required={f.required} />
                    ) : (
                      <input type={f.type} value={serviceForm[f.key] || ''} onChange={e => setServiceForm({ ...serviceForm, [f.key]: e.target.value })}
                        className="w-full bg-cyber-purple/10 border border-cyber-purple/30 rounded p-3 text-text text-xs outline-none" required={f.required} placeholder={f.label} />
                    )}
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1">Precio (L.) *</label>
                    <input type="number" min="0" step="0.01" required value={serviceForm.precio || ''} onChange={e => setServiceForm({ ...serviceForm, precio: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-cyber-purple/10 border border-cyber-purple/30 rounded p-3 text-text text-xs outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1">Cantidad</label>
                    <input type="number" min="1" value={serviceForm.cantidad || 1} onChange={e => setServiceForm({ ...serviceForm, cantidad: Math.max(1, Number(e.target.value) || 1) })}
                      className="w-full bg-cyber-purple/10 border border-cyber-purple/30 rounded p-3 text-text text-xs outline-none" />
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 bg-cyber-bg border-t border-b border-cyber-purple/20 flex justify-between items-center font-mono text-xs">
                <span className="text-textD uppercase text-[10px] tracking-wider">Total servicio:</span>
                <span className="text-cyber-cyan font-black text-sm font-orbitron">{fmtVal((Number(serviceForm.precio) || 0) * (Number(serviceForm.cantidad) || 1))}</span>
              </div>
              <div className="modalFooter p-5 flex justify-end gap-3 text-xs">
                <button type="button" onClick={() => setServiceModal({ open: false })}
                  className="px-5 py-2.5 bg-cyber-bg2 border border-cyber-purple/20 rounded hover:bg-cyber-purple/10 text-text cursor-pointer">Cancelar</button>
                <button type="submit" disabled={missingRequired}
                  className="px-5 py-2.5 bg-gradient-to-r from-cyber-purple to-cyber-cyan text-white font-orbitron font-bold rounded shadow-[0_0_12px_rgba(0,255,255,0.6)] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
                  Agregar al Carrito
                </button>
              </div>
            </form>
          </div>
        </div>
      );})()}

      {/* POS PAYMENT MODAL */}
      {posPayModal && (
        <div className="modal-overlay open">
          <div className="modal w-full max-w-md bg-cyber-panel border border-cyber-purple rounded-xl text-text font-sans">
            <div className="modalHeader border-b border-cyber-purple/25 p-5 flex items-center justify-between">
              <h3 className="font-orbitron text-xs font-bold text-cyber-cyan tracking-wider uppercase flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-amber-400" />
                COBRO POS
              </h3>
              <button onClick={() => setPosPayModal(false)} className="text-textD hover:text-red-400 text-lg cursor-pointer bg-none border-none">✕</button>
            </div>
            <div className="modalBody p-6 space-y-5">
              {/* Total */}
              <div className="bg-cyber-bg2 border border-cyber-purple/20 rounded-lg p-4 font-mono">
                <div className="text-center">
                  <div className="text-[10px] uppercase text-textD tracking-wider">Total a cobrar</div>
                  <div className="text-3xl font-black text-green-400 font-orbitron mt-1">{fmtVal(posTotal())}</div>
                </div>
              </div>

              {/* Payment mode selector */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { mode: 'full' as const, label: 'Completo', icon: '💰', desc: 'Pagar todo' },
                  { mode: 'partial' as const, label: 'Anticipo', icon: '💵', desc: 'Abono parcial' },
                  { mode: 'none' as const, label: 'Sin pago', icon: '📋', desc: 'Solo registrar' },
                ].map(opt => (
                  <button key={opt.mode} type="button" onClick={() => { setPosPaymentMode(opt.mode); if (opt.mode === 'full') setPosMonto(String(posTotal())); else if (opt.mode === 'none') setPosMonto(''); }}
                    className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all cursor-pointer ${posPaymentMode === opt.mode ? 'bg-amber-500/20 border-amber-400 shadow-[0_0_10px_rgba(235,180,44,0.3)]' : 'bg-cyber-purple/5 border-cyber-purple/30 hover:border-cyber-cyan/40'}`}>
                    <span className="text-lg">{opt.icon}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${posPaymentMode === opt.mode ? 'text-amber-400' : 'text-textD'}`}>{opt.label}</span>
                    <span className="text-[8px] text-textD">{opt.desc}</span>
                  </button>
                ))}
              </div>

              {/* Payment fields (hidden for 'none' mode) */}
              {posPaymentMode !== 'none' && (
                <>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1">Método de pago</label>
                    <select value={posMetodo} onChange={(e: any) => setPosMetodo(e.target.value)}
                      className="w-full bg-cyber-purple/10 border border-cyber-purple/30 rounded p-3 text-text text-xs outline-none">
                      <option value="Efectivo">Efectivo</option>
                      <option value="Tarjeta">Tarjeta</option>
                      <option value="Transferencia">Transferencia</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1">
                      {posPaymentMode === 'full' ? 'Monto recibido (L.)' : 'Monto del anticipo (L.)'}
                    </label>
                    <input type="number" value={posMonto} onChange={e => setPosMonto(e.target.value)} placeholder={String(posTotal())}
                      className="w-full bg-cyber-purple/10 border border-cyber-purple/30 rounded p-3 text-text text-xs outline-none text-lg font-bold font-orbitron text-center" />
                  </div>
                  {posPaymentMode === 'full' && Number(posMonto) >= posTotal() && Number(posMonto) > 0 && (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 text-center font-mono">
                      <div className="text-[10px] uppercase text-green-400">Cambio</div>
                      <div className="text-xl font-black text-green-400 font-orbitron">{fmtVal(Number(posMonto) - posTotal())}</div>
                    </div>
                  )}
                  {posPaymentMode === 'full' && Number(posMonto) > 0 && Number(posMonto) < posTotal() && (
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-center font-mono">
                      <div className="text-[10px] uppercase text-amber-400">⚠ Pago insuficiente</div>
                      <div className="text-sm text-amber-400">Faltan {fmtVal(posTotal() - Number(posMonto))}</div>
                    </div>
                  )}
                  {posPaymentMode === 'partial' && (
                    <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3 text-center font-mono">
                      <div className="text-[10px] uppercase text-cyber-cyan">Anticipo registrado</div>
                      <div className="text-sm text-cyber-cyan mt-1">
                        Pagará {fmtVal(Number(posMonto) || 0)} ahora — Saldo pendiente {fmtVal(posTotal() - (Number(posMonto) || 0))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* SIN PAGO message */}
              {posPaymentMode === 'none' && (
                <div className="bg-cyber-purple/10 border border-cyber-purple/30 rounded-lg p-4 text-center font-mono">
                  <div className="text-[10px] uppercase text-cyber-purple tracking-wider">Venta sin pago</div>
                  <div className="text-sm text-textD mt-1">La venta se registrará como <span className="text-amber-400 font-bold">Pendiente</span> de pago.</div>
                </div>
              )}

              {/* RTN */}
              <div>
                <label className="flex items-center gap-2 text-[10px] text-textD cursor-pointer">
                  <input type="checkbox" checked={posConRtn} onChange={e => setPosConRtn(e.target.checked)} className="w-3 h-3 accent-amber-500" />
                  Facturar con RTN
                </label>
                {posConRtn && (
                  <input type="text" placeholder="RTN (14 dígitos)" value={posRtn} onChange={e => setPosRtn(e.target.value)} maxLength={14}
                    className="w-full mt-2 bg-cyber-purple/10 border border-amber-500/30 rounded p-2.5 text-text text-xs outline-none font-mono" />
                )}
              </div>
            </div>
            <div className="modalFooter p-5 flex justify-end gap-3 text-xs">
              <button onClick={() => setPosPayModal(false)}
                className="px-5 py-2.5 bg-cyber-bg2 border border-cyber-purple/20 rounded hover:bg-cyber-purple/10 text-text cursor-pointer">CANCELAR</button>
              <button onClick={handlePosCheckout}
                disabled={posPaymentMode === 'full' ? Number(posMonto) < posTotal() : posPaymentMode === 'partial' ? (!posMonto || Number(posMonto) <= 0) : false}
                className={`px-6 py-2.5 font-orbitron font-bold rounded cursor-pointer flex items-center gap-2 border-none transition-all ${(posPaymentMode === 'full' && Number(posMonto) >= posTotal()) || posPaymentMode === 'partial' || posPaymentMode === 'none' ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-[0_0_12px_rgba(235,180,44,0.5)]' : 'bg-cyber-bg2 text-textD cursor-not-allowed'}`}>
                <Check className="w-4 h-4" />
                {posPaymentMode === 'full' ? `COBRAR ${fmtVal(posTotal())}` : posPaymentMode === 'partial' ? `ANTICIPO ${fmtVal(Number(posMonto) || 0)}` : 'REGISTRAR VENTA'}
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
