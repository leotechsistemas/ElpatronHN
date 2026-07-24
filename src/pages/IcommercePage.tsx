import { useState } from 'react';
import { ChevronRight, Check, Building2, Phone, Mail, Package, Menu, X } from 'lucide-react';
import { LOGO_BASE64 } from '../logo';
import { api } from '../services/api';

const categories = [
  { id: 'rotulacion', label: 'Rotulación Corporativa', desc: 'Rótulos luminosos, letreros 3D, vinilos' },
  { id: 'impresion', label: 'Impresión Publicitaria', desc: 'Vallas, banners, volantes, catálogos' },
  { id: 'maquinaria', label: 'Maquinaria Industrial', desc: 'Corte láser, grabado, impresión' },
  { id: 'tintas', label: 'Tintas e Insumos', desc: 'Solventes, UV, látex y repuestos' },
  { id: 'repuestos', label: 'Repuestos y Mantenimiento', desc: 'Partes y servicio técnico' },
  { id: 'otro', label: 'Otro', desc: 'Otro tipo de servicio o producto' },
];

interface Props {
  onEnter: () => void;
}

export default function IcommercePage({ onEnter }: Props) {
  const [step, setStep] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({ nombre: '', correo: '', telefono: '', empresa: '', categoria: '', descripcion: '', detalles: '' });

  const update = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  const canContinue = step === 0 ? form.nombre.trim() && form.correo.trim() : form.categoria && form.descripcion.trim();

  const handleSubmit = async () => {
    setLoading(true);
    const res = await api.requestQuote(form);
    setLoading(false);
    if (res?.success) setDone(true);
  };

  if (done) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-amber-600" />
          </div>
          <h2 className="text-2xl font-bold text-stone-800 mb-3">Solicitud recibida</h2>
          <p className="text-stone-500 mb-6">Gracias {form.nombre}, hemos recibido tu solicitud. Un asesor se pondrá en contacto contigo en las próximas horas para brindarte una cotización personalizada.</p>
          <button onClick={() => { setDone(false); setStep(0); setForm({ nombre: '', correo: '', telefono: '', empresa: '', categoria: '', descripcion: '', detalles: '' }); }}
            className="text-amber-600 hover:text-amber-700 font-medium text-sm">Enviar otra solicitud</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-stone-800">
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src={LOGO_BASE64} alt="EL PATRON HN" className="w-8 h-8 object-contain" />
            <span className="font-bold text-sm tracking-widest uppercase">EL PATRÓN HN</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <button onClick={onEnter}
              className="text-stone-500 hover:text-amber-600 transition-colors uppercase tracking-wider text-xs">Acceso interno</button>
          </div>
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 text-stone-600">
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {menuOpen && (
          <div className="md:hidden bg-white border-t border-stone-200 px-4 py-4">
            <button onClick={onEnter} className="text-stone-600 py-2 text-sm w-full text-left">Acceso interno</button>
          </div>
        )}
      </nav>

      <section className="bg-gradient-to-br from-stone-900 via-stone-800 to-amber-900 text-white py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 text-xs font-medium text-amber-300 mb-6 border border-white/10">
            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
            Tecnología de Personalizados
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-4">Solicita tu cotización</h1>
          <p className="text-stone-300 max-w-xl mx-auto">Cuéntanos qué necesitas y te enviaremos una cotización personalizada en las próximas horas.</p>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex items-center justify-center gap-2 mb-10">
            {[0, 1, 2].map(i => (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step >= i ? 'bg-amber-600 text-white' : 'bg-stone-200 text-stone-400'}`}>{i + 1}</div>
                <span className={`text-xs hidden sm:block ${step >= i ? 'text-amber-600 font-medium' : 'text-stone-400'}`}>
                  {i === 0 ? 'Tus datos' : i === 1 ? 'Tu solicitud' : 'Revisar'}
                </span>
                {i < 2 && <div className={`w-8 h-px ${step > i ? 'bg-amber-600' : 'bg-stone-200'}`} />}
              </div>
            ))}
          </div>

          {step === 0 && (
            <div className="bg-stone-50 rounded-xl p-8 border border-stone-200">
              <h2 className="font-bold text-lg text-stone-800 mb-6">Datos de contacto</h2>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-stone-600 mb-1 uppercase tracking-wider">Nombre completo *</label>
                    <div className="relative">
                      <input value={form.nombre} onChange={e => update('nombre', e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-lg border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent" placeholder="Tu nombre" />
                      <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-600 mb-1 uppercase tracking-wider">Correo electrónico *</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <input type="email" value={form.correo} onChange={e => update('correo', e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-lg border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent" placeholder="correo@ejemplo.com" />
                    </div>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-stone-600 mb-1 uppercase tracking-wider">Teléfono</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <input value={form.telefono} onChange={e => update('telefono', e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-lg border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent" placeholder="+504 9999-0000" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-stone-600 mb-1 uppercase tracking-wider">Empresa</label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <input value={form.empresa} onChange={e => update('empresa', e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-lg border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent" placeholder="Nombre de tu empresa" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="bg-stone-50 rounded-xl p-8 border border-stone-200">
              <h2 className="font-bold text-lg text-stone-800 mb-6">¿Qué necesitas?</h2>
              <label className="block text-xs font-medium text-stone-600 mb-3 uppercase tracking-wider">Categoría *</label>
              <div className="grid md:grid-cols-2 gap-3 mb-6">
                {categories.map(c => (
                  <button key={c.id} onClick={() => update('categoria', c.id)}
                    className={`text-left p-4 rounded-lg border-2 transition-all ${form.categoria === c.id ? 'border-amber-500 bg-amber-50' : 'border-stone-200 bg-white hover:border-stone-300'}`}>
                    <div className="font-medium text-sm text-stone-800">{c.label}</div>
                    <div className="text-xs text-stone-500 mt-0.5">{c.desc}</div>
                  </button>
                ))}
              </div>
              <label className="block text-xs font-medium text-stone-600 mb-1 uppercase tracking-wider">Describe lo que necesitas *</label>
              <textarea value={form.descripcion} onChange={e => update('descripcion', e.target.value)} rows={3} className="w-full px-4 py-3 rounded-lg border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent" placeholder="Ej: Necesito un rótulo luminoso de 2m x 1m para la fachada de mi negocio..." />
              <label className="block text-xs font-medium text-stone-600 mt-4 mb-1 uppercase tracking-wider">Detalles adicionales</label>
              <textarea value={form.detalles} onChange={e => update('detalles', e.target.value)} rows={2} className="w-full px-4 py-3 rounded-lg border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent" placeholder="Cantidades, medidas, colores, plazo deseado..." />
            </div>
          )}

          {step === 2 && (
            <div className="bg-stone-50 rounded-xl p-8 border border-stone-200">
              <h2 className="font-bold text-lg text-stone-800 mb-6">Revisa tu solicitud</h2>
              <div className="space-y-4 text-sm">
                <div className="bg-white rounded-lg p-4 border border-stone-200">
                  <div className="text-xs text-stone-500 uppercase tracking-wider mb-2">Tus datos</div>
                  <div className="space-y-1">
                    <p><span className="font-medium">Nombre:</span> {form.nombre}</p>
                    <p><span className="font-medium">Correo:</span> {form.correo}</p>
                    {form.telefono && <p><span className="font-medium">Teléfono:</span> {form.telefono}</p>}
                    {form.empresa && <p><span className="font-medium">Empresa:</span> {form.empresa}</p>}
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-stone-200">
                  <div className="text-xs text-stone-500 uppercase tracking-wider mb-2">Tu solicitud</div>
                  <div className="space-y-1">
                    <p><span className="font-medium">Categoría:</span> {categories.find(c => c.id === form.categoria)?.label || form.categoria}</p>
                    <p><span className="font-medium">Descripción:</span> {form.descripcion}</p>
                    {form.detalles && <p><span className="font-medium">Detalles:</span> {form.detalles}</p>}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between mt-8">
            {step > 0 ? (
              <button onClick={() => setStep(s => s - 1)}
                className="px-6 py-3 border border-stone-300 rounded-lg text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors">Atrás</button>
            ) : <div />}
            {step < 2 ? (
              <button onClick={() => setStep(s => s + 1)} disabled={!canContinue}
                className={`px-6 py-3 rounded-lg text-sm font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${canContinue ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-md' : 'bg-stone-200 text-stone-400 cursor-not-allowed'}`}>
                Siguiente <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={loading}
                className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-3 rounded-lg text-sm font-bold uppercase tracking-widest transition-all shadow-md flex items-center gap-2 disabled:opacity-50">
                {loading ? 'Enviando...' : 'Enviar solicitud'} <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </section>

      <footer className="bg-stone-900 text-stone-400 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <img src={LOGO_BASE64} alt="EL PATRON HN" className="w-6 h-6 object-contain brightness-200" />
            <span className="font-bold tracking-widest uppercase text-white">EL PATRÓN HN</span>
          </div>
          <div className="text-stone-500">Tegucigalpa, Honduras</div>
          <button onClick={onEnter} className="text-stone-600 hover:text-amber-400 transition-colors">Acceso interno</button>
        </div>
      </footer>
    </div>
  );
}

function UserIcon({ className }: { className?: string }) {
  return <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
}
