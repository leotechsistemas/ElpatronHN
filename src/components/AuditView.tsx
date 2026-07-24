import React, { useState, useEffect } from 'react';
import { Shield, Search, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../services/api';

interface AuditEntry {
  id: number;
  usuario: string;
  accion: string;
  entidad: string;
  entidadId: string;
  detalle: string;
  ip: string;
  creadoEn: string;
}

export default function AuditView() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async (p: number) => {
    setLoading(true);
    try {
      const r = await api.getAuditLogs(p);
      setLogs(r.content || []);
      setTotalPages(r.totalPages || 0);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(page); }, [page]);

  const filtered = search
    ? logs.filter(l =>
        (l.usuario || '').toLowerCase().includes(search.toLowerCase()) ||
        (l.entidad || '').toLowerCase().includes(search.toLowerCase()) ||
        (l.accion || '').toLowerCase().includes(search.toLowerCase()) ||
        (l.entidadId || '').toLowerCase().includes(search.toLowerCase()))
    : logs;

  const badgeColor = (a: string) => {
    switch (a) {
      case 'CREAR': return 'bg-green-900/40 text-green-300 border-green-600/40';
      case 'EDITAR': case 'PATCH': return 'bg-amber-900/40 text-amber-300 border-amber-600/40';
      case 'ELIMINAR': return 'bg-red-900/40 text-red-300 border-red-600/40';
      default: return 'bg-cyber-purple/30 text-cyber-cyan border-cyber-purple/40';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-orbitron font-black cyber-gradient-text tracking-wider flex items-center gap-3">
          <Shield className="w-6 h-6" /> Auditoría de Cambios
        </h2>
        <button onClick={() => load(page)} className="btn bg-cyber-purple/20 border border-cyber-purple/40 text-cyber-cyan px-4 py-2 rounded-lg text-xs font-bold tracking-wider hover:bg-cyber-purple/30 transition-all flex items-center gap-2 cursor-pointer">
          <RefreshCw className="w-3.5 h-3.5" /> Actualizar
        </button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textD" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por usuario, entidad, acción..."
          className="w-full bg-cyber-bg2 border border-cyber-purple/20 rounded-lg pl-10 pr-4 py-2.5 text-sm font-mono text-text outline-none focus:border-cyber-cyan transition-all" />
      </div>

      <div className="bg-cyber-bg2 border border-cyber-purple/20 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="bg-cyber-purple/10 border-b border-cyber-purple/20">
                <th className="text-left px-4 py-3 text-textD font-bold tracking-wider uppercase">Fecha</th>
                <th className="text-left px-4 py-3 text-textD font-bold tracking-wider uppercase">Usuario</th>
                <th className="text-left px-4 py-3 text-textD font-bold tracking-wider uppercase">Acción</th>
                <th className="text-left px-4 py-3 text-textD font-bold tracking-wider uppercase">Entidad</th>
                <th className="text-left px-4 py-3 text-textD font-bold tracking-wider uppercase">ID</th>
                <th className="text-left px-4 py-3 text-textD font-bold tracking-wider uppercase">Método</th>
                <th className="text-left px-4 py-3 text-textD font-bold tracking-wider uppercase">IP</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8 text-textD">Cargando...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-textD">Sin registros de auditoría</td></tr>
              ) : filtered.map(l => (
                <tr key={l.id} className="border-b border-cyber-purple/10 hover:bg-cyber-purple/5 transition-colors">
                  <td className="px-4 py-2.5 text-textD whitespace-nowrap">{l.creadoEn?.replace('T', ' ').slice(0, 19)}</td>
                  <td className="px-4 py-2.5 text-cyber-cyan">{l.usuario}</td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${badgeColor(l.accion)}`}>
                      {l.accion}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-text">{l.entidad}</td>
                  <td className="px-4 py-2.5 text-textD">{l.entidadId}</td>
                  <td className="px-4 py-2.5 text-textD max-w-[200px] truncate">{l.detalle}</td>
                  <td className="px-4 py-2.5 text-textD">{l.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-4">
          <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
            className="btn bg-cyber-purple/20 border border-cyber-purple/30 text-cyber-cyan px-3 py-1.5 rounded text-xs font-bold disabled:opacity-30 cursor-pointer disabled:cursor-default hover:bg-cyber-purple/30 transition-all flex items-center gap-1">
            <ChevronLeft className="w-3.5 h-3.5" /> Anterior
          </button>
          <span className="text-xs text-textD font-mono">Pág. {page + 1} de {totalPages}</span>
          <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
            className="btn bg-cyber-purple/20 border border-cyber-purple/30 text-cyber-cyan px-3 py-1.5 rounded text-xs font-bold disabled:opacity-30 cursor-pointer disabled:cursor-default hover:bg-cyber-purple/30 transition-all flex items-center gap-1">
            Siguiente <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
