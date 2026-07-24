import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Power, PowerOff, X, Check } from 'lucide-react';
import { ServiceType } from '../types';

interface ServiceTypesViewProps {
  serviceTypes: ServiceType[];
  onAdd: (data: any) => void;
  onUpdate: (id: string, data: any) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function ServiceTypesView({
  serviceTypes,
  onAdd,
  onUpdate,
  onToggle,
  onDelete
}: ServiceTypesViewProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ nombre: '', icono: '', descripcion: '', precioSugerido: '' });

  const handleCreate = () => {
    onAdd({ ...form, precioSugerido: form.precioSugerido ? Number(form.precioSugerido) : 0 });
    setForm({ nombre: '', icono: '', descripcion: '', precioSugerido: '' });
    setIsCreateModalOpen(false);
  };

  const handleUpdate = (id: string) => {
    onUpdate(id, { ...form, precioSugerido: form.precioSugerido ? Number(form.precioSugerido) : 0 });
    setEditingId(null);
    setForm({ nombre: '', icono: '', descripcion: '', precioSugerido: '' });
  };

  const openEdit = (st: ServiceType) => {
    setForm({ nombre: st.nombre, icono: st.icono || '', descripcion: st.descripcion || '', precioSugerido: st.precioSugerido ? String(st.precioSugerido) : '' });
    setEditingId(st.id);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xxs font-orbitron font-bold uppercase tracking-[0.2em] text-cyber-cyan">Tipos de Servicio</h2>
          <p className="text-[10px] text-textD mt-1">Gestiona los tipos de servicio disponibles en ventas y cotizaciones</p>
        </div>
        <button
          onClick={() => { setForm({ nombre: '', icono: '', descripcion: '', precioSugerido: '' }); setIsCreateModalOpen(true); }}
          className="flex items-center gap-1.5 px-3 py-2 bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/30 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-cyber-cyan/30 transition-all"
        >
          <Plus className="w-3.5 h-3.5" /> Nuevo
        </button>
      </div>

      <div className="bg-cyber-bg/50 border border-cyber-purple/20 rounded-xl overflow-hidden">
        <table className="w-full text-left text-[11px]">
          <thead>
            <tr className="border-b border-cyber-purple/20 text-textD uppercase tracking-wider text-[9px]">
              <th className="px-4 py-3 font-bold">Icono</th>
              <th className="px-4 py-3 font-bold">Nombre</th>
              <th className="px-4 py-3 font-bold">Precio Sug.</th>
              <th className="px-4 py-3 font-bold">Descripción</th>
              <th className="px-4 py-3 font-bold">Estado</th>
              <th className="px-4 py-3 font-bold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {serviceTypes.map(st => (
              <tr key={st.id} className="border-b border-cyber-purple/10 hover:bg-cyber-purple/5 transition-colors">
                <td className="px-4 py-3 text-lg">{st.icono || '⚙️'}</td>
                <td className="px-4 py-3 font-bold text-text">{st.nombre}</td>
                <td className="px-4 py-3 text-textD">L. {Number(st.precioSugerido || 0).toLocaleString()}</td>
                <td className="px-4 py-3 text-textD">{st.descripcion || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${st.activo ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {st.activo ? <Power className="w-3 h-3" /> : <PowerOff className="w-3 h-3" />}
                    {st.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => openEdit(st)}
                      className="p-1.5 rounded-lg hover:bg-cyber-purple/20 text-textD hover:text-cyber-cyan transition-all"
                      title="Editar"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onToggle(st.id)}
                      className={`p-1.5 rounded-lg hover:bg-cyber-purple/20 transition-all ${st.activo ? 'text-orange-400 hover:text-orange-300' : 'text-green-400 hover:text-green-300'}`}
                      title={st.activo ? 'Desactivar' : 'Activar'}
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`¿Eliminar "${st.nombre}"?`)) onDelete(st.id);
                      }}
                      className="p-1.5 rounded-lg hover:bg-red-500/20 text-textD hover:text-red-400 transition-all"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {serviceTypes.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-textD text-xs">No hay tipos de servicio registrados</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setIsCreateModalOpen(false)}>
          <div className="bg-cyber-surface border border-cyber-purple/30 rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-orbitron font-bold uppercase tracking-wider text-cyber-cyan">Nuevo Tipo de Servicio</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="p-1 hover:bg-cyber-purple/20 rounded-lg transition-colors">
                <X className="w-4 h-4 text-textD" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1">Nombre *</label>
                <input type="text" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  className="w-full px-3 py-2 bg-cyber-bg border border-cyber-purple/30 rounded-lg text-xs text-text placeholder-textD/40 outline-none focus:border-cyber-cyan/60 transition-all"
                  placeholder="Ej: Corte Láser" />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1">Icono (emoji)</label>
                <input type="text" value={form.icono} onChange={e => setForm(f => ({ ...f, icono: e.target.value }))}
                  className="w-full px-3 py-2 bg-cyber-bg border border-cyber-purple/30 rounded-lg text-xs text-text placeholder-textD/40 outline-none focus:border-cyber-cyan/60 transition-all"
                  placeholder="Ej: ⚙️" />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1">Precio Sugerido (L.)</label>
                <input type="number" value={form.precioSugerido} onChange={e => setForm(f => ({ ...f, precioSugerido: e.target.value }))}
                  className="w-full px-3 py-2 bg-cyber-bg border border-cyber-purple/30 rounded-lg text-xs text-text placeholder-textD/40 outline-none focus:border-cyber-cyan/60 transition-all"
                  placeholder="0" min="0" step="0.01" />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1">Descripción</label>
                <textarea value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                  className="w-full px-3 py-2 bg-cyber-bg border border-cyber-purple/30 rounded-lg text-xs text-text placeholder-textD/40 outline-none focus:border-cyber-cyan/60 transition-all resize-none"
                  rows={2} placeholder="Descripción opcional" />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-textD hover:text-text transition-all">Cancelar</button>
              <button onClick={handleCreate} disabled={!form.nombre.trim()}
                className="px-4 py-2 bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/30 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-cyber-cyan/30 transition-all disabled:opacity-40">
                <Check className="w-3.5 h-3.5 inline mr-1" /> Crear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => { setEditingId(null); setForm({ nombre: '', icono: '', descripcion: '', precioSugerido: '' }); }}>
          <div className="bg-cyber-surface border border-cyber-purple/30 rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-orbitron font-bold uppercase tracking-wider text-cyber-cyan">Editar Tipo de Servicio</h3>
              <button onClick={() => { setEditingId(null); setForm({ nombre: '', icono: '', descripcion: '', precioSugerido: '' }); }} className="p-1 hover:bg-cyber-purple/20 rounded-lg transition-colors">
                <X className="w-4 h-4 text-textD" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1">Nombre *</label>
                <input type="text" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  className="w-full px-3 py-2 bg-cyber-bg border border-cyber-purple/30 rounded-lg text-xs text-text placeholder-textD/40 outline-none focus:border-cyber-cyan/60 transition-all" />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1">Icono (emoji)</label>
                <input type="text" value={form.icono} onChange={e => setForm(f => ({ ...f, icono: e.target.value }))}
                  className="w-full px-3 py-2 bg-cyber-bg border border-cyber-purple/30 rounded-lg text-xs text-text placeholder-textD/40 outline-none focus:border-cyber-cyan/60 transition-all" />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1">Precio Sugerido (L.)</label>
                <input type="number" value={form.precioSugerido} onChange={e => setForm(f => ({ ...f, precioSugerido: e.target.value }))}
                  className="w-full px-3 py-2 bg-cyber-bg border border-cyber-purple/30 rounded-lg text-xs text-text placeholder-textD/40 outline-none focus:border-cyber-cyan/60 transition-all"
                  min="0" step="0.01" />
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1">Descripción</label>
                <textarea value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                  className="w-full px-3 py-2 bg-cyber-bg border border-cyber-purple/30 rounded-lg text-xs text-text placeholder-textD/40 outline-none focus:border-cyber-cyan/60 transition-all resize-none"
                  rows={2} />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => { setEditingId(null); setForm({ nombre: '', icono: '', descripcion: '', precioSugerido: '' }); }} className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-textD hover:text-text transition-all">Cancelar</button>
              <button onClick={() => handleUpdate(editingId)} disabled={!form.nombre.trim()}
                className="px-4 py-2 bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/30 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-cyber-cyan/30 transition-all disabled:opacity-40">
                <Check className="w-3.5 h-3.5 inline mr-1" /> Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
