import React, { useState } from 'react';
import { Shield, Plus, Pencil } from 'lucide-react';
import { User } from '../types';

interface AdminCoreViewProps {
  users: User[];
  currentUser: User | null;
  onAddUser: (userData: any) => Promise<boolean>;
  onUpdateUser?: (userId: string, userData: any) => Promise<boolean>;
  onToggleUser: (userId: string, currentActive: boolean) => void;
  onDeleteUser?: (userId: string) => void;
}

export default function AdminCoreView({
  users, currentUser,
  onAddUser, onUpdateUser, onToggleUser, onDeleteUser,
}: AdminCoreViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // User form states
  const [userNombre, setUserNombre] = useState('');
  const [userCorreo, setUserCorreo] = useState('');
  const [userPass, setUserPass] = useState('');
  const [userRol, setUserRol] = useState<'Admin' | 'Vendedor' | 'Produccion' | 'Analista'>('Vendedor');

  const filteredUsers = users.filter(u =>
    u.Nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.Correo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openEditUser = (u: User) => {
    setEditingUser(u);
    setUserNombre(u.Nombre);
    setUserCorreo(u.Correo);
    setUserRol(u.Rol as any);
    setUserPass('');
    setShowAddUser(true);
  };

  const handleSubmitNewUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userNombre.trim() || !userCorreo.trim()) return;

    if (editingUser) {
      if (!onUpdateUser) return;
      const success = await onUpdateUser(editingUser.ID, {
        nombre: userNombre.trim(), correo: userCorreo.trim(),
        rol: userRol, contrasena: userPass || undefined
      });
      if (success) { setShowAddUser(false); setEditingUser(null); setUserPass(''); }
    } else {
      if (!userPass) return;
      const success = await onAddUser({
        name: userNombre.trim(), email: userCorreo.trim(),
        password: userPass, role: userRol, requesterId: currentUser?.ID || 'USR0001'
      });
      if (success) {
        setShowAddUser(false); setUserNombre(''); setUserCorreo(''); setUserPass('');
      }
    }
  };

  return (
    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <input type="text" placeholder="Buscar usuario..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-4 py-3 bg-cyber-purple/10 border border-cyber-purple/40 text-text text-xs rounded-lg outline-none" />
        </div>
        <button onClick={() => setShowAddUser(true)}
          className="px-5 py-2.5 bg-gradient-to-r from-cyber-purple to-indigo-600 text-white font-orbitron font-bold text-[10px] tracking-wider rounded-lg shadow-[0_0_12px_rgba(138,43,226,0.5)] cursor-pointer flex items-center gap-2">
          <Plus className="w-3.5 h-3.5" /> CREAR USUARIO
        </button>
      </div>

      
        <div className="border border-cyber-purple/20 bg-cyber-panel rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-cyber-purple/15 text-cyber-cyan font-orbitron text-[9px] tracking-wider border-b border-cyber-purple/20">
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">USUARIO</th>
                  <th className="px-4 py-3">CORREO</th>
                  <th className="px-4 py-3 text-center">ROL</th>
                  <th className="px-4 py-3 text-center">ESTADO</th>
                  <th className="px-4 py-3 text-right">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyber-purple/10 font-mono text-xs">
                {filteredUsers.map(u => (
                  <tr className="hover:bg-cyber-purple/5 transition-all text-text" key={u.ID}>
                    <td className="px-4 py-3.5 text-cyber-cyan font-bold">{u.ID}</td>
                    <td className="px-4 py-3.5 font-bold">{u.Nombre}</td>
                    <td className="px-4 py-3.5 text-textD">{u.Correo}</td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="bg-cyber-purple/10 text-cyber-cyan border border-cyber-cyan/30 px-2.5 py-0.5 rounded text-[10px]">{u.Rol}</span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {u.Activo === 'TRUE'
                        ? <span className="bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded text-[10px]">ACTIVO</span>
                        : <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded text-[10px]">BAJA</span>}
                    </td>
                    <td className="px-4 py-3.5 text-right flex items-center justify-end gap-1.5">
                      {u.ID !== currentUser?.ID ? <>
                        <button onClick={() => openEditUser(u)}
                          className="px-2.5 py-1 rounded bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan/20 text-[9px] font-bold hover:bg-cyber-cyan hover:text-white transition-all cursor-pointer flex items-center gap-1">
                          <Pencil className="w-3 h-3" /> EDITAR
                        </button>
                        <button onClick={() => onToggleUser(u.ID, u.Activo === 'TRUE')}
                          className={`px-2.5 py-1 rounded text-[9px] font-bold transition-all cursor-pointer border ${u.Activo === 'TRUE' ? 'bg-red-900/20 text-red-400 border-red-500/30 hover:bg-red-500 hover:text-white' : 'bg-emerald-600/10 text-green-400 border-green-500/20 hover:bg-green-500 hover:text-cyber-bg'}`}>
                          {u.Activo === 'TRUE' ? 'DESACTIVAR' : 'ACTIVAR'}
                        </button>
                        {onDeleteUser && <button onClick={() => { if (window.confirm(`Eliminar ${u.Nombre}?`)) onDeleteUser(u.ID); }}
                          className="px-2.5 py-1 rounded bg-rose-950/20 text-rose-400 border border-rose-500/30 text-[9px] font-bold hover:bg-rose-600 hover:text-white transition-all cursor-pointer">
                          ELIMINAR
                        </button>}
                      </> : <span className="text-[10px] text-textD italic">Tu cuenta</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredUsers.length === 0 && <div className="text-center py-12 text-textD text-xs">Sin usuarios.</div>}
          </div>
        </div>

      {/* ── NEW/EDIT USER MODAL ── */}
      {(showAddUser) && (
        <div className="modal-overlay open" onClick={() => { setShowAddUser(false); setEditingUser(null); }}>
          <div className="modal w-full max-w-md bg-cyber-panel border border-cyber-purple rounded-xl" onClick={e => e.stopPropagation()}>
            <div className="modalHeader border-b border-cyber-purple/25 p-5 flex items-center justify-between">
              <h3 className="font-orbitron text-xs font-bold text-cyber-cyan tracking-wider uppercase flex items-center gap-2">
                {editingUser ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {editingUser ? 'EDITAR USUARIO' : 'NUEVO USUARIO'}
              </h3>
              <button onClick={() => { setShowAddUser(false); setEditingUser(null); }} className="text-textD hover:text-red-400 text-lg cursor-pointer bg-none border-none">✕</button>
            </div>
            <form onSubmit={handleSubmitNewUser}>
              <div className="modalBody p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1">Nombre *</label>
                    <input type="text" value={userNombre} onChange={e => setUserNombre(e.target.value)} className="w-full bg-cyber-purple/10 border border-cyber-purple/30 rounded p-3 text-text text-xs" required />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1">Rol</label>
                    <select value={userRol} onChange={(e: any) => setUserRol(e.target.value)} className="w-full bg-cyber-purple/10 border border-cyber-purple/30 rounded p-3 text-text text-xs">
                      <option value="Vendedor">Vendedor</option>
                      <option value="Produccion">Producción</option>
                      <option value="Analista">Analista</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1">Correo *</label>
                  <input type="email" value={userCorreo} onChange={e => setUserCorreo(e.target.value)} className="w-full bg-cyber-purple/10 border border-cyber-purple/30 rounded p-3 text-text text-xs" required />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1">
                    Contraseña {editingUser ? '(dejar vacío para no cambiar)' : '*'}
                  </label>
                  <input type="password" value={userPass} onChange={e => setUserPass(e.target.value)}
                    className="w-full bg-cyber-purple/10 border border-cyber-purple/30 rounded p-3 text-text text-xs"
                    required={!editingUser} placeholder={editingUser ? "•••••••• (opcional)" : "••••••••"} />
                </div>
              </div>
              <div className="modalFooter border-t border-cyber-purple/20 p-5 flex justify-end gap-3 text-xs">
                <button type="button" onClick={() => { setShowAddUser(false); setEditingUser(null); }}
                  className="px-5 py-2.5 bg-cyber-bg2 border border-cyber-purple/20 rounded hover:bg-cyber-purple/10 text-text cursor-pointer">Cancelar</button>
                <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-cyber-purple to-indigo-600 text-white font-orbitron font-bold rounded shadow-[0_0_12px_rgba(138,43,226,0.6)] cursor-pointer">
                  {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
