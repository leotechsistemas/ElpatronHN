import React from 'react';
import { UserPlus } from 'lucide-react';

interface QuickClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  quickNombre: string;
  setQuickNombre: (v: string) => void;
  quickTelefono: string;
  setQuickTelefono: (v: string) => void;
  quickEmail: string;
  setQuickEmail: (v: string) => void;
  quickDept: string;
  setQuickDept: (v: string) => void;
  quickCiudad: string;
  setQuickCiudad: (v: string) => void;
  quickRtn: string;
  setQuickRtn: (v: string) => void;
}

const hondurasDeptos = [
  'Cortes', 'Francisco Morazan', 'Atlantida', 'Yoro', 'Olancho', 'Colon',
  'Gracias a Dios', 'El Paraiso', 'Choluteca', 'Valle', 'La Paz', 'Intibuca',
  'Lempira', 'Ocotepeque', 'Copan', 'Santa Barbara', 'Comayagua', 'Islas de la Bahia'
];

export default function QuickClientModal({
  isOpen, onClose, onSubmit,
  quickNombre, setQuickNombre,
  quickTelefono, setQuickTelefono,
  quickEmail, setQuickEmail,
  quickDept, setQuickDept,
  quickCiudad, setQuickCiudad,
  quickRtn, setQuickRtn
}: QuickClientModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay open z-[70]">
      <div className="modal w-full max-w-md bg-cyber-panel border border-cyber-pink rounded-xl text-text font-sans">
        <div className="modalHeader border-b border-cyber-pink/25 p-5 flex items-center justify-between">
          <h3 className="font-orbitron text-xs font-bold text-cyber-pink tracking-wider uppercase flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-cyber-pink" />
            REGISTRAR CLIENTE NUEVO
          </h3>
          <button type="button" onClick={onClose} className="text-textD hover:text-red-400 text-lg cursor-pointer bg-none border-none">✕</button>
        </div>

        <form onSubmit={onSubmit}>
          <div className="modalBody p-6 space-y-4">
            {/* Nombre Completo */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-cyber-pink mb-1 font-sans">Nombre Completo / Razón Social *</label>
              <input
                type="text"
                required
                placeholder="Ej. Inversiones SPS..."
                value={quickNombre}
                onChange={(e) => setQuickNombre(e.target.value)}
                className="w-full bg-cyber-purple/10 border border-cyber-pink/30 rounded p-3 text-text text-xs outline-none focus:border-cyber-pink/60 transition-all font-mono"
              />
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-cyber-pink mb-1 font-sans">Teléfono</label>
              <input
                type="text"
                placeholder="Ej. +504 9988-7766"
                value={quickTelefono}
                onChange={(e) => setQuickTelefono(e.target.value)}
                className="w-full bg-cyber-purple/10 border border-cyber-pink/30 rounded p-3 text-text text-xs outline-none focus:border-cyber-pink/60 transition-all font-mono"
              />
            </div>

            {/* Grid for depto and city */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-cyber-pink mb-1 font-sans">Departamento *</label>
                <select
                  value={quickDept}
                  onChange={(e) => setQuickDept(e.target.value)}
                  className="w-full bg-cyber-purple/10 border border-cyber-pink/30 rounded p-3 text-text text-xs outline-none focus:border-cyber-pink/60 transition-all"
                >
                  {hondurasDeptos.map(d => <option value={d} key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase font-bold text-cyber-pink mb-1 font-sans">Ciudad</label>
                <input
                  type="text"
                  placeholder="Ej. San Pedro Sula"
                  value={quickCiudad}
                  onChange={(e) => setQuickCiudad(e.target.value)}
                  className="w-full bg-cyber-purple/10 border border-cyber-pink/30 rounded p-3 text-text text-xs outline-none focus:border-cyber-pink/60 transition-all font-mono"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-cyber-pink mb-1 font-sans">Email de Contacto</label>
              <input
                type="email"
                placeholder="ejemplo@correo.hn"
                value={quickEmail}
                onChange={(e) => setQuickEmail(e.target.value)}
                className="w-full bg-cyber-purple/10 border border-cyber-pink/30 rounded p-3 text-text text-xs outline-none focus:border-cyber-pink/60 transition-all font-mono"
              />
            </div>

            {/* RTN */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-cyber-pink mb-1 font-sans">RTN (Registro Tributario Nacional)</label>
              <input
                type="text"
                placeholder="Ej. 08019001234567"
                value={quickRtn}
                onChange={(e) => setQuickRtn(e.target.value)}
                className="w-full bg-cyber-purple/10 border border-cyber-pink/30 rounded p-3 text-text text-xs outline-none focus:border-cyber-pink/60 transition-all font-mono"
                maxLength={14}
              />
            </div>
          </div>

          <div className="modalFooter p-5 border-t border-cyber-pink/15 flex justify-end gap-3 text-xs">
            <button 
              type="button" 
              onClick={onClose} 
              className="btn bg-cyber-bg2 border border-cyber-pink/20 px-5 py-2.5 hover:bg-cyber-pink/10 text-text cursor-pointer"
            >
              CANCELAR
            </button>
            <button 
              type="submit" 
              disabled={!quickNombre.trim()}
              className="btn btn-primary bg-gradient-to-r from-cyber-pink to-cyber-purple text-white font-orbitron font-bold px-6 py-3 rounded shadow-[0_0_12px_rgba(236,72,153,0.4)] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              REGISTRAR CLIENTE
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
