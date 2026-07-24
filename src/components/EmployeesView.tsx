import React, { useState, useEffect } from 'react';
import { Shield, Plus, Pencil, Users, Briefcase, DollarSign, Calendar, Phone, MapPin, UserCircle } from 'lucide-react';
import { User, Employee } from '../types';
import { api } from '../services/api';

interface EmployeesViewProps {
  users: User[];
  currentUser: User | null;
  onAddUser: (userData: any) => Promise<boolean>;
  onUpdateUser: (userId: string, userData: any) => Promise<boolean>;
  onToggleUser: (userId: string, currentActive: boolean) => void;
  onDeleteUser?: (userId: string) => void;
}

const DEPARTMENTS = ['Ventas', 'Producción', 'Diseño', 'Administración', 'Gerencia'];
const POSITIONS = ['Gerente General', 'Vendedor', 'Diseñador Gráfico', 'Operador CNC', 'Operador Laser', 'Instalador', 'Administrador', 'Asistente'];

export default function EmployeesView({
  users, currentUser,
  onAddUser, onUpdateUser, onToggleUser, onDeleteUser,
}: EmployeesViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tab, setTab] = useState<'list' | 'stats'>('list');
  const [deptStats, setDeptStats] = useState<Record<string, number>>({});
  const [posStats, setPosStats] = useState<Record<string, number>>({});

  useEffect(() => {
    api.getDepartmentStats().then(r => r && setDeptStats(r)).catch(() => {});
    api.getPositionStats().then(r => r && setPosStats(r)).catch(() => {});
  }, [users]);

  const [form, setForm] = useState({
    nombre: '', correo: '', contrasena: '', rol: 'Vendedor',
    dni: '', telefono: '', direccion: '', puesto: '', departamento: '',
    salario: 0, fechaContratacion: '', fechaNacimiento: '',
    contactoEmergencia: '', telefonoEmergencia: '',
  });

  const openCreate = () => {
    setEditingId(null);
    setForm({ nombre: '', correo: '', contrasena: '', rol: 'Vendedor', dni: '', telefono: '', direccion: '', puesto: '', departamento: '', salario: 0, fechaContratacion: '', fechaNacimiento: '', contactoEmergencia: '', telefonoEmergencia: '' });
    setShowModal(true);
  };

  const openEdit = (u: User) => {
    setEditingId(u.ID);
    setForm({
      nombre: u.Nombre, correo: u.Correo, contrasena: '', rol: u.Rol,
      dni: (u as any).dni || '', telefono: (u as any).telefono || '', direccion: (u as any).direccion || '',
      puesto: (u as any).puesto || '', departamento: (u as any).departamento || '',
      salario: (u as any).salario || 0, fechaContratacion: (u as any).fechaContratacion || '',
      fechaNacimiento: (u as any).fechaNacimiento || '',
      contactoEmergencia: (u as any).contactoEmergencia || '', telefonoEmergencia: (u as any).telefonoEmergencia || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim() || !form.correo.trim()) return;

    const payload = {
      nombre: form.nombre.trim(), correo: form.correo.trim(),
      contrasena: form.contrasena || undefined, rol: form.rol,
      dni: form.dni || undefined, telefono: form.telefono || undefined,
      direccion: form.direccion || undefined, puesto: form.puesto || undefined,
      departamento: form.departamento || undefined,
      salario: form.salario > 0 ? form.salario : undefined,
      fechaContratacion: form.fechaContratacion || undefined,
      fechaNacimiento: form.fechaNacimiento || undefined,
      contactoEmergencia: form.contactoEmergencia || undefined,
      telefonoEmergencia: form.telefonoEmergencia || undefined,
    };

    let success = false;
    if (editingId) {
      success = await onUpdateUser(editingId, payload);
    } else {
      success = await onAddUser(payload);
    }
    if (success) { setShowModal(false); setEditingId(null); }
  };

  const activeUsers = users.filter(u => u.Activo === 'TRUE');

  const filteredUsers = users.filter(u =>
    u.Nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.Correo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ((u as any).dni || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    ((u as any).puesto || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const today = new Date();
  const getSeniority = (dateStr?: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    const diff = today.getTime() - d.getTime();
    const months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30.44));
    if (months < 12) return `${months}m`;
    const years = Math.floor(months / 12);
    return `${years}a ${months % 12}m`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex gap-4 flex-1">
          <div className="bg-cyber-panel border border-cyber-purple/20 rounded-xl px-4 py-3 min-w-[100px]">
            <div className="text-[9px] text-textD uppercase tracking-wider font-bold">Empleados</div>
            <div className="text-lg font-bold text-cyber-cyan font-mono">{users.length}</div>
          </div>
          <div className="bg-cyber-panel border border-cyber-purple/20 rounded-xl px-4 py-3 min-w-[100px]">
            <div className="text-[9px] text-textD uppercase tracking-wider font-bold">Activos</div>
            <div className="text-lg font-bold text-green-400 font-mono">{activeUsers.length}</div>
          </div>
          <div className="bg-cyber-panel border border-cyber-purple/20 rounded-xl px-4 py-3 min-w-[100px]">
            <div className="text-[9px] text-textD uppercase tracking-wider font-bold">Inactivos</div>
            <div className="text-lg font-bold text-red-400 font-mono">{users.length - activeUsers.length}</div>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setTab(tab === 'list' ? 'stats' : 'list')}
            className={`px-4 py-2 rounded-lg border text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all ${tab === 'stats' ? 'bg-cyber-cyan/10 text-cyber-cyan border-cyber-cyan/30' : 'bg-cyber-purple/10 text-textD border-cyber-purple/20 hover:border-cyber-cyan/50'}`}>
            {tab === 'list' ? 'Reportes' : 'Listado'}
          </button>
          <button onClick={openCreate}
            className="px-5 py-2 bg-gradient-to-r from-cyber-purple to-indigo-600 text-white font-orbitron font-bold text-[10px] tracking-wider rounded-lg shadow-[0_0_12px_rgba(138,43,226,0.5)] cursor-pointer flex items-center gap-2">
            <Plus className="w-3.5 h-3.5" /> NUEVO EMPLEADO
          </button>
        </div>
      </div>

      {tab === 'list' ? (
        <>
          <div className="relative w-full sm:w-80">
            <input type="text" placeholder="Buscar por nombre, correo, DNI o puesto..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-4 py-3 bg-cyber-purple/10 border border-cyber-purple/40 text-text text-xs rounded-lg outline-none" />
          </div>

          <div className="border border-cyber-purple/20 bg-cyber-panel rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-cyber-purple/15 text-cyber-cyan font-orbitron text-[9px] tracking-wider border-b border-cyber-purple/20">
                    <th className="px-3 py-3">ID</th>
                    <th className="px-3 py-3">NOMBRE</th>
                    <th className="px-3 py-3">DNI</th>
                    <th className="px-3 py-3">PUESTO</th>
                    <th className="px-3 py-3">DPTO</th>
                    <th className="px-3 py-3">TELÉFONO</th>
                    <th className="px-3 py-3 text-center">ROL</th>
                    <th className="px-3 py-3 text-right">SALARIO</th>
                    <th className="px-3 py-3 text-center">ANTIGÜEDAD</th>
                    <th className="px-3 py-3 text-center">ESTADO</th>
                    <th className="px-3 py-3 text-right">ACCIONES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyber-purple/10 font-mono text-xs">
                  {filteredUsers.map(u => {
                    const emp = u as any;
                    return (
                      <tr className="hover:bg-cyber-purple/5 transition-all text-text" key={u.ID}>
                        <td className="px-3 py-3 text-cyber-cyan font-bold">{u.ID}</td>
                        <td className="px-3 py-3">
                          <div className="font-bold">{u.Nombre}</div>
                          <div className="text-[9px] text-textD">{u.Correo}</div>
                        </td>
                        <td className="px-3 py-3 text-textD">{emp.dni || '-'}</td>
                        <td className="px-3 py-3">{emp.puesto || '-'}</td>
                        <td className="px-3 py-3">
                          {emp.departamento ? <span className="bg-cyber-purple/10 text-cyber-cyan border border-cyber-cyan/20 px-2 py-0.5 rounded text-[9px]">{emp.departamento}</span> : '-'}
                        </td>
                        <td className="px-3 py-3 text-textD">{emp.telefono || '-'}</td>
                        <td className="px-3 py-3 text-center">
                          <span className="bg-cyber-purple/10 text-cyber-cyan border border-cyber-cyan/30 px-2 py-0.5 rounded text-[9px]">{u.Rol}</span>
                        </td>
                        <td className="px-3 py-3 text-right font-mono">
                          {emp.salario ? `L. ${Number(emp.salario).toLocaleString()}` : '-'}
                        </td>
                        <td className="px-3 py-3 text-center text-textD">{getSeniority(emp.fechaContratacion)}</td>
                        <td className="px-3 py-3 text-center">
                          {u.Activo === 'TRUE'
                            ? <span className="bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded text-[9px]">ACTIVO</span>
                            : <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded text-[9px]">BAJA</span>}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => openEdit(u)}
                              className="px-2 py-1 rounded bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan/20 text-[9px] font-bold hover:bg-cyber-cyan hover:text-white transition-all cursor-pointer flex items-center gap-1">
                              <Pencil className="w-3 h-3" />
                            </button>
                            {u.ID !== currentUser?.ID && (
                              <button onClick={() => onToggleUser(u.ID, u.Activo === 'TRUE')}
                                className={`px-2 py-1 rounded text-[9px] font-bold transition-all cursor-pointer border ${u.Activo === 'TRUE' ? 'bg-red-900/20 text-red-400 border-red-500/30 hover:bg-red-500 hover:text-white' : 'bg-emerald-600/10 text-green-400 border-green-500/20 hover:bg-green-500 hover:text-cyber-bg'}`}>
                                {u.Activo === 'TRUE' ? 'DAR BAJA' : 'REACTIVAR'}
                              </button>
                            )}
                            {onDeleteUser && u.ID !== currentUser?.ID &&
                              <button onClick={() => { if (window.confirm(`Eliminar permanentemente a ${u.Nombre}?`)) onDeleteUser(u.ID); }}
                                className="px-2 py-1 rounded bg-rose-950/20 text-rose-400 border border-rose-500/30 text-[9px] font-bold hover:bg-rose-600 hover:text-white transition-all cursor-pointer">
                                ELIMINAR
                              </button>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredUsers.length === 0 && <div className="text-center py-12 text-textD text-xs">No hay empleados registrados.</div>}
            </div>
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-cyber-purple/20 bg-cyber-panel rounded-xl p-5">
            <h3 className="font-orbitron text-xs font-bold text-cyber-cyan tracking-wider uppercase mb-4 flex items-center gap-2">
              <Users className="w-4 h-4" /> Empleados por Departamento
            </h3>
            <div className="space-y-3">
              {Object.entries(deptStats).length === 0 && <p className="text-textD text-xs">Sin datos de departamentos.</p>}
              {Object.entries(deptStats).map(([dept, count]) => (
                <div key={dept} className="flex items-center justify-between py-2 border-b border-cyber-purple/10 last:border-0">
                  <span className="text-xs font-bold">{dept}</span>
                  <span className="text-sm font-mono text-cyber-cyan font-bold">{count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="border border-cyber-purple/20 bg-cyber-panel rounded-xl p-5">
            <h3 className="font-orbitron text-xs font-bold text-cyber-cyan tracking-wider uppercase mb-4 flex items-center gap-2">
              <Briefcase className="w-4 h-4" /> Empleados por Puesto
            </h3>
            <div className="space-y-3">
              {Object.entries(posStats).length === 0 && <p className="text-textD text-xs">Sin datos de puestos.</p>}
              {Object.entries(posStats).map(([pos, count]) => (
                <div key={pos} className="flex items-center justify-between py-2 border-b border-cyber-purple/10 last:border-0">
                  <span className="text-xs font-bold">{pos}</span>
                  <span className="text-sm font-mono text-cyber-cyan font-bold">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {(showModal) && (
        <div className="modal-overlay open" onClick={() => { setShowModal(false); setEditingId(null); }}>
          <div className="modal w-full max-w-2xl bg-cyber-panel border border-cyber-purple rounded-xl" onClick={e => e.stopPropagation()}>
            <div className="modalHeader border-b border-cyber-purple/25 p-5 flex items-center justify-between">
              <h3 className="font-orbitron text-xs font-bold text-cyber-cyan tracking-wider uppercase flex items-center gap-2">
                {editingId ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {editingId ? 'EDITAR EMPLEADO' : 'NUEVO EMPLEADO'}
              </h3>
              <button onClick={() => { setShowModal(false); setEditingId(null); }} className="text-textD hover:text-red-400 text-lg cursor-pointer bg-none border-none">✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modalBody p-6 space-y-5 max-h-[60vh] overflow-y-auto">
                <div>
                  <h4 className="text-[9px] font-bold text-cyber-purple tracking-widest uppercase mb-3 flex items-center gap-2"><UserCircle className="w-3 h-3" /> Datos del Empleado</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1">Nombre Completo *</label>
                      <input type="text" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} className="w-full bg-cyber-purple/10 border border-cyber-purple/30 rounded p-3 text-text text-xs" required />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1">DNI / Identidad</label>
                      <input type="text" value={form.dni} onChange={e => setForm({ ...form, dni: e.target.value })} className="w-full bg-cyber-purple/10 border border-cyber-purple/30 rounded p-3 text-text text-xs" placeholder="0801-2000-12345" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1">Correo Electrónico *</label>
                      <input type="email" value={form.correo} onChange={e => setForm({ ...form, correo: e.target.value })} className="w-full bg-cyber-purple/10 border border-cyber-purple/30 rounded p-3 text-text text-xs" required />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1"><Phone className="w-3 h-3 inline" /> Teléfono</label>
                      <input type="text" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} className="w-full bg-cyber-purple/10 border border-cyber-purple/30 rounded p-3 text-text text-xs" placeholder="9999-9999" />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1"><Calendar className="w-3 h-3 inline" /> Fecha Nacimiento</label>
                      <input type="date" value={form.fechaNacimiento} onChange={e => setForm({ ...form, fechaNacimiento: e.target.value })} className="w-full bg-cyber-purple/10 border border-cyber-purple/30 rounded p-3 text-text text-xs" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1"><MapPin className="w-3 h-3 inline" /> Dirección</label>
                    <input type="text" value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} className="w-full bg-cyber-purple/10 border border-cyber-purple/30 rounded p-3 text-text text-xs" placeholder="Colonia, calle, casa #" />
                  </div>
                </div>

                <div>
                  <h4 className="text-[9px] font-bold text-cyber-purple tracking-widest uppercase mb-3 flex items-center gap-2"><Briefcase className="w-3 h-3" /> Datos Laborales</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1">Puesto</label>
                      <input type="text" value={form.puesto} onChange={e => setForm({ ...form, puesto: e.target.value })} list="positions" className="w-full bg-cyber-purple/10 border border-cyber-purple/30 rounded p-3 text-text text-xs" placeholder="Ej: Vendedor, Diseñador..." />
                      <datalist id="positions">{POSITIONS.map(p => <option key={p} value={p} />)}</datalist>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1">Departamento</label>
                      <select value={form.departamento} onChange={e => setForm({ ...form, departamento: e.target.value })} className="w-full bg-cyber-purple/10 border border-cyber-purple/30 rounded p-3 text-text text-xs">
                        <option value="">Seleccionar...</option>
                        {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1"><DollarSign className="w-3 h-3 inline" /> Salario (L.)</label>
                      <input type="number" step="0.01" min="0" value={form.salario || ''} onChange={e => setForm({ ...form, salario: parseFloat(e.target.value) || 0 })} className="w-full bg-cyber-purple/10 border border-cyber-purple/30 rounded p-3 text-text text-xs" placeholder="0.00" />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1"><Calendar className="w-3 h-3 inline" /> Fecha Contratación</label>
                      <input type="date" value={form.fechaContratacion} onChange={e => setForm({ ...form, fechaContratacion: e.target.value })} className="w-full bg-cyber-purple/10 border border-cyber-purple/30 rounded p-3 text-text text-xs" />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1">Rol Sistema</label>
                      <select value={form.rol} onChange={e => setForm({ ...form, rol: e.target.value })} className="w-full bg-cyber-purple/10 border border-cyber-purple/30 rounded p-3 text-text text-xs">
                        <option value="Vendedor">Vendedor</option>
                        <option value="Produccion">Producción</option>
                        <option value="Analista">Analista</option>
                        <option value="Admin">Admin</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-[9px] font-bold text-cyber-purple tracking-widest uppercase mb-3">Contacto de Emergencia</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1">Nombre Contacto</label>
                      <input type="text" value={form.contactoEmergencia} onChange={e => setForm({ ...form, contactoEmergencia: e.target.value })} className="w-full bg-cyber-purple/10 border border-cyber-purple/30 rounded p-3 text-text text-xs" placeholder="Nombre del familiar/amigo" />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1"><Phone className="w-3 h-3 inline" /> Teléfono Emergencia</label>
                      <input type="text" value={form.telefonoEmergencia} onChange={e => setForm({ ...form, telefonoEmergencia: e.target.value })} className="w-full bg-cyber-purple/10 border border-cyber-purple/30 rounded p-3 text-text text-xs" placeholder="9999-9999" />
                    </div>
                  </div>
                </div>

                {!editingId && (
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1">Contraseña {editingId ? '(dejar vacío para no cambiar)' : '* (temporal)'}</label>
                    <input type="password" value={form.contrasena} onChange={e => setForm({ ...form, contrasena: e.target.value })}
                      className="w-full bg-cyber-purple/10 border border-cyber-purple/30 rounded p-3 text-text text-xs"
                      placeholder={editingId ? "•••••••• (opcional)" : "Temp123!"} />
                  </div>
                )}
              </div>
              <div className="modalFooter border-t border-cyber-purple/20 p-5 flex justify-end gap-3 text-xs">
                <button type="button" onClick={() => { setShowModal(false); setEditingId(null); }}
                  className="px-5 py-2.5 bg-cyber-bg2 border border-cyber-purple/20 rounded hover:bg-cyber-purple/10 text-text cursor-pointer">Cancelar</button>
                <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-cyber-purple to-indigo-600 text-white font-orbitron font-bold rounded shadow-[0_0_12px_rgba(138,43,226,0.6)] cursor-pointer">
                  {editingId ? 'Guardar Cambios' : 'Crear Empleado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
