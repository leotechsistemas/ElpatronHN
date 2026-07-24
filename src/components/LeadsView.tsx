import React, { useState } from 'react';
import { MessageSquare, Mail, Phone, Globe, Trash2, X, Eye, ExternalLink, Calendar } from 'lucide-react';

interface LeadData {
  id: number;
  nombre: string;
  correo: string;
  telefono: string;
  empresa: string;
  categoria: string;
  descripcion: string;
  detalles: string;
  ipAddress: string;
  userAgent: string;
  referer: string;
  pageUrl: string;
  createdAt: string;
}

interface LeadsViewProps {
  leads: LeadData[];
  onDelete: (id: number) => void;
}

export default function LeadsView({ leads, onDelete }: LeadsViewProps) {
  const [search, setSearch] = useState('');
  const [selectedLead, setSelectedLead] = useState<LeadData | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const filtered = leads.filter(l =>
    !search || (l.nombre && l.nombre.toLowerCase().includes(search.toLowerCase())) ||
    (l.correo && l.correo.toLowerCase().includes(search.toLowerCase())) ||
    (l.empresa && l.empresa.toLowerCase().includes(search.toLowerCase())) ||
    (l.categoria && l.categoria.toLowerCase().includes(search.toLowerCase()))
  );

  const fmtDate = (d: string) => {
    if (!d) return '-';
    const dt = new Date(d);
    return dt.toLocaleDateString('es-HN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center gap-3 bg-cyber-panel border border-cyber-purple/20 p-3 rounded-xl">
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre, correo, empresa o categoría..."
          className="flex-1 bg-cyber-bg border border-cyber-purple/20 rounded px-3 py-2 text-xs text-text placeholder:text-textD/40 outline-none focus:border-cyber-cyan transition-all font-mono"
        />
        <span className="text-[10px] text-textD font-mono">{filtered.length} de {leads.length}</span>
      </div>

      {/* Table */}
      <div className="bg-cyber-panel border border-cyber-purple/20 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-cyber-purple/20 bg-cyber-bg2/30">
                <th className="text-left p-3 text-[10px] text-textD uppercase tracking-widest">ID</th>
                <th className="text-left p-3 text-[10px] text-textD uppercase tracking-widest">Nombre</th>
                <th className="text-left p-3 text-[10px] text-textD uppercase tracking-widest">Contacto</th>
                <th className="text-left p-3 text-[10px] text-textD uppercase tracking-widest">Empresa</th>
                <th className="text-left p-3 text-[10px] text-textD uppercase tracking-widest">Categoría</th>
                <th className="text-left p-3 text-[10px] text-textD uppercase tracking-widest">Fecha</th>
                <th className="text-center p-3 text-[10px] text-textD uppercase tracking-widest">Acción</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="text-center p-8 text-textD text-xs">No hay leads registrados</td></tr>
              )}
              {filtered.map(l => (
                <tr key={l.id} className="border-b border-cyber-purple/10 hover:bg-cyber-purple/5 transition-colors">
                  <td className="p-3 text-cyber-cyan font-bold">#{l.id}</td>
                  <td className="p-3">
                    <button onClick={() => setSelectedLead(l)} className="text-left hover:text-cyber-cyan transition-colors cursor-pointer">
                      {l.nombre || 'Anónimo'}
                    </button>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-col gap-0.5">
                      {l.correo && <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-cyber-purple" />{l.correo}</span>}
                      {l.telefono && <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-cyber-cyan" />{l.telefono}</span>}
                    </div>
                  </td>
                  <td className="p-3">{l.empresa || '-'}</td>
                  <td className="p-3">
                    <span className="bg-cyber-purple/10 text-cyber-purple px-2 py-0.5 rounded text-[10px] font-bold">{l.categoria || 'General'}</span>
                  </td>
                  <td className="p-3 text-textD text-[10px]">{fmtDate(l.createdAt)}</td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => setSelectedLead(l)}
                        className="p-1.5 rounded bg-cyber-cyan/10 text-cyber-cyan hover:bg-cyber-cyan/20 transition-all cursor-pointer" title="Ver detalle">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      {confirmDelete === l.id ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => { onDelete(l.id); setConfirmDelete(null); }}
                            className="p-1.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all cursor-pointer text-[10px] font-bold">Sí</button>
                          <button onClick={() => setConfirmDelete(null)}
                            className="p-1.5 rounded bg-cyber-bg text-textD hover:text-text transition-all cursor-pointer text-[10px] font-bold">No</button>
                        </div>
                      ) : (
                        <button onClick={() => setConfirmDelete(l.id)}
                          className="p-1.5 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all cursor-pointer" title="Eliminar">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setSelectedLead(null)}>
          <div className="bg-cyber-panel border border-cyber-purple/30 rounded-xl w-full max-w-lg max-h-[80vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-cyber-purple/20">
              <h3 className="font-orbitron font-bold text-xs text-cyber-cyan uppercase tracking-widest">Lead #{selectedLead.id}</h3>
              <button onClick={() => setSelectedLead(null)} className="p-1 rounded hover:bg-cyber-bg transition-all cursor-pointer">
                <X className="w-4 h-4 text-textD" />
              </button>
            </div>
            <div className="p-4 space-y-3 text-xs font-mono">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-textD block text-[10px] mb-0.5">Nombre</span><span className="text-text">{selectedLead.nombre || '-'}</span></div>
                <div><span className="text-textD block text-[10px] mb-0.5">Empresa</span><span className="text-text">{selectedLead.empresa || '-'}</span></div>
                <div><span className="text-textD block text-[10px] mb-0.5">Correo</span>
                  <a href={`mailto:${selectedLead.correo}`} className="text-cyber-cyan hover:underline flex items-center gap-1">{selectedLead.correo || '-'} <Mail className="w-3 h-3" /></a>
                </div>
                <div><span className="text-textD block text-[10px] mb-0.5">Teléfono</span>
                  <a href={`tel:${selectedLead.telefono}`} className="text-cyber-cyan hover:underline flex items-center gap-1">{selectedLead.telefono || '-'} <Phone className="w-3 h-3" /></a>
                </div>
                <div><span className="text-textD block text-[10px] mb-0.5">Categoría</span><span className="bg-cyber-purple/10 text-cyber-purple px-2 py-0.5 rounded text-[10px] font-bold">{selectedLead.categoria || 'General'}</span></div>
                <div><span className="text-textD block text-[10px] mb-0.5">Fecha</span><span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-cyber-cyan" />{fmtDate(selectedLead.createdAt)}</span></div>
              </div>

              {selectedLead.descripcion && (
                <div><span className="text-textD block text-[10px] mb-0.5">Descripción</span><div className="bg-cyber-bg rounded p-2 text-text whitespace-pre-wrap">{selectedLead.descripcion}</div></div>
              )}
              {selectedLead.detalles && (
                <div><span className="text-textD block text-[10px] mb-0.5">Detalles</span><div className="bg-cyber-bg rounded p-2 text-text whitespace-pre-wrap">{selectedLead.detalles}</div></div>
              )}

              <hr className="border-cyber-purple/20" />
              <div className="grid grid-cols-2 gap-3 text-[10px]">
                <div><span className="text-textD block mb-0.5">IP</span><span className="text-textD/80">{selectedLead.ipAddress || '-'}</span></div>
                {selectedLead.pageUrl && <div><span className="text-textD block mb-0.5">Página</span><span className="text-textD/80 truncate block">{selectedLead.pageUrl}</span></div>}
                {selectedLead.referer && <div className="col-span-2"><span className="text-textD block mb-0.5">Referer</span><span className="text-textD/80 truncate block">{selectedLead.referer}</span></div>}
                {selectedLead.userAgent && <div className="col-span-2"><span className="text-textD block mb-0.5">User Agent</span><span className="text-textD/60 text-[9px] break-all">{selectedLead.userAgent}</span></div>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
