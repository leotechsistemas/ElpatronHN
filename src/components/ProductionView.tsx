import React, { useState } from 'react';
import { Search, Eye, X, Calendar, Clock, User, AlertTriangle, BarChart3, Plus, Save } from 'lucide-react';

interface Task {
  id: string; venta_id: string; cliente_id: string; cliente: string;
  descripcion: string; tipo: string; estado: string;
  creado_en: string; inicio_en: string; completado_en: string;
  vendedor_id: string; prioridad: string; asignado_a: string; notas_internas: string;
}

interface Props {
  tasks: Task[];
  users: any[];
  onUpdateStatus: (id: string, estado: string) => void;
  onUpdateTask: (id: string, data: any) => void;
  onAddTask: (data: any) => void;
}

const TIPO_COLORS: Record<string, string> = {
  'Corte Láser': 'border-l-amber-500 bg-amber-500/10',
  'Láser CO2': 'border-l-cyan-500 bg-cyan-500/10',
  'Router CNC': 'border-l-violet-500 bg-violet-500/10',
  'Grabado': 'border-l-pink-500 bg-pink-500/10',
  'Instalación': 'border-l-green-500 bg-green-500/10',
};
const PRIO_COLORS: Record<string, string> = { Alta: 'text-red-400', Media: 'text-yellow-400', Baja: 'text-green-400' };

function getColor(tipo: string): string {
  for (const [kw, c] of Object.entries(TIPO_COLORS)) { if (tipo.includes(kw)) return c; }
  return 'border-l-stone-500 bg-stone-500/10';
}
function fmtDate(d: string) { if (!d) return '-'; const dt = new Date(d); return dt.toLocaleDateString('es-HN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
function fmtDateShort(d: string) { if (!d) return '-'; const dt = new Date(d); return dt.toLocaleDateString('es-HN', { day: '2-digit', month: '2-digit', year: 'numeric' }); }
function calcDuration(start: string, end: string) {
  if (!start || !end) return null;
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms < 0) return null;
  const h = Math.floor(ms / 3600000); const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
function isCurrentWeek(d: string) {
  if (!d) return false;
  const dt = new Date(d); const now = new Date();
  const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  return dt >= startOfWeek;
}

function KanbanCard({ t, onStatus, onClick }: { t: Task; onStatus: (id: string, s: string) => void; onClick: () => void }) {
  const dur = calcDuration(t.inicio_en, t.completado_en);
  return (
    <div className={`p-3 rounded-lg border-l-4 ${getColor(t.tipo)} border border-cyber-purple/15 text-xs font-mono transition-all hover:border-cyber-purple/40 cursor-pointer`} onClick={onClick}>
      <div className="flex items-start justify-between gap-2 mb-1">
        <span className="font-bold text-cyber-cyan text-xs leading-tight">{t.cliente}</span>
        <span className={`text-[9px] font-bold shrink-0 ${PRIO_COLORS[t.prioridad] || 'text-textD'}`}>{t.prioridad || 'Media'}</span>
      </div>
      <div className="font-bold text-text text-[11px] mb-1 leading-snug line-clamp-2">{t.descripcion}</div>
      <div className="text-[10px] text-textD space-y-0.5">
        <div className="flex items-center gap-1.5"><span className="text-cyber-purple">{t.venta_id}</span></div>
        <div className="flex items-center gap-1"><Calendar className="w-3 h-3" />{fmtDateShort(t.creado_en)}</div>
        {t.asignado_a && <div className="flex items-center gap-1"><User className="w-3 h-3 text-cyber-cyan" />{t.asignado_a}</div>}
        {dur && <div className="flex items-center gap-1"><Clock className="w-3 h-3 text-green-400" />{dur}</div>}
      </div>
      <div className="flex gap-2 mt-2">
        {t.estado === 'Pendiente' && <button onClick={e => { e.stopPropagation(); onStatus(t.id, 'En Proceso'); }} className="px-2 py-1 rounded bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 text-[9px] font-bold uppercase tracking-wider hover:bg-cyan-600 hover:text-white transition-all cursor-pointer">Iniciar</button>}
        {t.estado === 'En Proceso' && <button onClick={e => { e.stopPropagation(); onStatus(t.id, 'Completada'); }} className="px-2 py-1 rounded bg-green-600/20 text-green-400 border border-green-500/30 text-[9px] font-bold uppercase tracking-wider hover:bg-green-600 hover:text-white transition-all cursor-pointer">Completar</button>}
        {t.estado === 'Completada' && <button onClick={e => { e.stopPropagation(); onStatus(t.id, 'Pendiente'); }} className="px-2 py-1 rounded bg-amber-600/20 text-amber-400 border border-amber-500/30 text-[9px] font-bold uppercase tracking-wider hover:bg-amber-600 hover:text-white transition-all cursor-pointer">Reabrir</button>}
      </div>
    </div>
  );
}

function KanbanColumn({ title, tasks, onStatus, onTaskClick, color }: { title: string; tasks: Task[]; onStatus: (id: string, s: string) => void; onTaskClick: (t: Task) => void; color: string }) {
  return (
    <div className="flex-1 min-w-[260px] bg-cyber-bg2/40 rounded-xl border border-cyber-purple/20 p-4">
      <h3 className="font-orbitron text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
        <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
        {title}
        <span className="text-textD text-[10px] font-mono ml-auto">{tasks.length}</span>
      </h3>
      <div className="space-y-3">
        {tasks.map(t => <KanbanCard key={t.id} t={t} onStatus={onStatus} onClick={() => onTaskClick(t)} />)}
        {tasks.length === 0 && <div className="text-center text-textD text-[10px] py-8 italic">Sin tareas</div>}
      </div>
    </div>
  );
}

function DetailModal({ t, users, onClose, onSave }: { t: Task; users: any[]; onClose: () => void; onSave: (id: string, data: any) => void }) {
  const [prioridad, setPrioridad] = useState(t.prioridad || 'Media');
  const [asignadoA, setAsignadoA] = useState(t.asignado_a || '');
  const [notas, setNotas] = useState(t.notas_internas || '');
  const dur = calcDuration(t.inicio_en, t.completado_en);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="bg-cyber-panel border border-cyber-purple/30 rounded-xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-cyber-purple/20">
          <h3 className="font-orbitron font-bold text-xs text-cyber-cyan uppercase tracking-widest">{t.venta_id} · {t.cliente}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-cyber-bg transition-all cursor-pointer"><X className="w-4 h-4 text-textD" /></button>
        </div>
        <div className="p-4 space-y-3 text-xs font-mono">
          <div className="grid grid-cols-2 gap-3">
            <div><span className="text-textD block text-[10px]">Cliente</span><span className="text-text">{t.cliente}</span></div>
            <div><span className="text-textD block text-[10px]">Venta</span><span className="text-cyber-cyan">{t.venta_id}</span></div>
            <div><span className="text-textD block text-[10px]">Tipo</span><span className="text-text">{t.tipo}</span></div>
            <div><span className="text-textD block text-[10px]">Estado</span><span className={`font-bold ${t.estado === 'Completada' ? 'text-green-400' : t.estado === 'En Proceso' ? 'text-cyan-400' : 'text-yellow-400'}`}>{t.estado}</span></div>
            <div><span className="text-textD block text-[10px]">Creado</span><span>{fmtDate(t.creado_en)}</span></div>
            <div><span className="text-textD block text-[10px]">Duración</span><span className={dur ? 'text-green-400' : 'text-textD'}>{dur || '—'}</span></div>
            {t.inicio_en && <div><span className="text-textD block text-[10px]">Inicio</span><span className="text-cyan-400">{fmtDate(t.inicio_en)}</span></div>}
            {t.completado_en && <div><span className="text-textD block text-[10px]">Completado</span><span className="text-green-400">{fmtDate(t.completado_en)}</span></div>}
          </div>
          <div><span className="text-textD block text-[10px] mb-0.5">Descripción</span><div className="bg-cyber-bg rounded p-2 text-text">{t.descripcion}</div></div>
          <hr className="border-cyber-purple/20" />
          <div className="grid grid-cols-2 gap-3">
            <div><span className="text-textD block text-[10px] mb-0.5">Prioridad</span>
              <select value={prioridad} onChange={e => setPrioridad(e.target.value)} className="w-full bg-cyber-bg border border-cyber-purple/20 rounded p-2 text-xs text-text">
                <option value="Alta">Alta</option><option value="Media">Media</option><option value="Baja">Baja</option>
              </select>
            </div>
            <div><span className="text-textD block text-[10px] mb-0.5">Asignado a</span>
              <select value={asignadoA} onChange={e => setAsignadoA(e.target.value)} className="w-full bg-cyber-bg border border-cyber-purple/20 rounded p-2 text-xs text-text">
                <option value="">Sin asignar</option>
                {users.filter(u => u.Rol === 'Produccion' || u.Rol === 'Admin').map(u => <option key={u.ID} value={u.Nombre}>{u.Nombre}</option>)}
              </select>
            </div>
          </div>
          <div><span className="text-textD block text-[10px] mb-0.5">Notas internas</span>
            <textarea value={notas} onChange={e => setNotas(e.target.value)} className="w-full bg-cyber-bg border border-cyber-purple/20 rounded p-2 text-xs text-text font-mono" rows={3} />
          </div>
          <button onClick={() => { onSave(t.id, { prioridad, asignado_a: asignadoA, notas_internas: notas }); onClose(); }}
            className="w-full py-2 rounded bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/30 font-bold text-xs uppercase tracking-wider hover:bg-cyber-cyan hover:text-white transition-all cursor-pointer flex items-center justify-center gap-2">
            <Save className="w-3.5 h-3.5" /> Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateTaskModal({ users, onClose, onSave }: { users: any[]; onClose: () => void; onSave: (data: any) => void }) {
  const [cliente, setCliente] = useState(''); const [descripcion, setDescripcion] = useState('');
  const [tipo, setTipo] = useState('Corte Láser'); const [prioridad, setPrioridad] = useState('Media');
  const [asignadoA, setAsignadoA] = useState(''); const [notas, setNotas] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div className="bg-cyber-panel border border-cyber-purple/30 rounded-xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-cyber-purple/20">
          <h3 className="font-orbitron font-bold text-xs text-cyber-cyan uppercase tracking-widest">Nueva tarea manual</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-cyber-bg transition-all cursor-pointer"><X className="w-4 h-4 text-textD" /></button>
        </div>
        <div className="p-4 space-y-3 text-xs font-mono">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><span className="text-textD block text-[10px] mb-0.5">Cliente *</span>
              <input value={cliente} onChange={e => setCliente(e.target.value)} className="w-full bg-cyber-bg border border-cyber-purple/20 rounded p-2 text-text" /></div>
            <div className="col-span-2"><span className="text-textD block text-[10px] mb-0.5">Descripción *</span>
              <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} className="w-full bg-cyber-bg border border-cyber-purple/20 rounded p-2 text-text font-mono" rows={2} /></div>
            <div><span className="text-textD block text-[10px] mb-0.5">Tipo</span>
              <select value={tipo} onChange={e => setTipo(e.target.value)} className="w-full bg-cyber-bg border border-cyber-purple/20 rounded p-2 text-text">
                <option value="Corte Láser">Corte Láser</option><option value="Láser CO2">Láser CO2</option>
                <option value="Router CNC">Router CNC</option><option value="Grabado">Grabado</option>
                <option value="Instalación">Instalación</option><option value="Otros">Otros</option>
              </select>
            </div>
            <div><span className="text-textD block text-[10px] mb-0.5">Prioridad</span>
              <select value={prioridad} onChange={e => setPrioridad(e.target.value)} className="w-full bg-cyber-bg border border-cyber-purple/20 rounded p-2 text-text">
                <option value="Alta">Alta</option><option value="Media">Media</option><option value="Baja">Baja</option>
              </select>
            </div>
            <div><span className="text-textD block text-[10px] mb-0.5">Asignar a</span>
              <select value={asignadoA} onChange={e => setAsignadoA(e.target.value)} className="w-full bg-cyber-bg border border-cyber-purple/20 rounded p-2 text-text">
                <option value="">Sin asignar</option>
                {users.filter(u => u.Rol === 'Produccion' || u.Rol === 'Admin').map(u => <option key={u.ID} value={u.Nombre}>{u.Nombre}</option>)}
              </select>
            </div>
            <div className="col-span-2"><span className="text-textD block text-[10px] mb-0.5">Notas internas</span>
              <textarea value={notas} onChange={e => setNotas(e.target.value)} className="w-full bg-cyber-bg border border-cyber-purple/20 rounded p-2 text-text font-mono" rows={2} /></div>
          </div>
          <button onClick={() => { if (!cliente.trim() || !descripcion.trim()) return; onSave({ cliente, descripcion, tipo, prioridad, asignado_a: asignadoA, notas_internas: notas, venta_id: 'MANUAL', cliente_id: '', vendedor_id: '' }); onClose(); }}
            className="w-full py-2 rounded bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/30 font-bold text-xs uppercase tracking-wider hover:bg-cyber-cyan hover:text-white transition-all cursor-pointer flex items-center justify-center gap-2">
            <Plus className="w-3.5 h-3.5" /> Crear tarea
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProductionView({ tasks, users, onUpdateStatus, onUpdateTask, onAddTask }: Props) {
  const [tab, setTab] = useState<'kanban' | 'historicos' | 'dashboard'>('kanban');
  const [search, setSearch] = useState(''); const [filterTipo, setFilterTipo] = useState('');
  const [filterPrio, setFilterPrio] = useState('');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [histFilter, setHistFilter] = useState<'week' | 'month' | 'year'>('week');

  const tipos = [...new Set(tasks.map(t => t.tipo))];

  const filtered = tasks.filter(t => {
    if (search && !t.cliente.toLowerCase().includes(search.toLowerCase()) && !t.descripcion.toLowerCase().includes(search.toLowerCase()) && !t.venta_id.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterTipo && t.tipo !== filterTipo) return false;
    if (filterPrio && t.prioridad !== filterPrio) return false;
    return true;
  });

  const kanbanTasks = filtered.filter(t => t.estado !== 'Completada' || isCurrentWeek(t.completado_en));
  const pending = kanbanTasks.filter(t => t.estado === 'Pendiente');
  const inProgress = kanbanTasks.filter(t => t.estado === 'En Proceso');
  const completed = kanbanTasks.filter(t => t.estado === 'Completada');

  const historicos = tasks.filter(t => t.estado === 'Completada');
  const filteredHistoricos = historicos.filter(t => {
    if (!t.completado_en) return false;
    const d = new Date(t.completado_en); const now = new Date();
    if (histFilter === 'week') { const sw = new Date(now); sw.setDate(now.getDate() - now.getDay()); sw.setHours(0,0,0,0); return d >= sw; }
    if (histFilter === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    return d.getFullYear() === now.getFullYear();
  });

  const stats = {
    total: tasks.length,
    pendientes: tasks.filter(t => t.estado === 'Pendiente').length,
    enProceso: tasks.filter(t => t.estado === 'En Proceso').length,
    completadas: tasks.filter(t => t.estado === 'Completada').length,
    altaPrio: tasks.filter(t => t.prioridad === 'Alta' && t.estado !== 'Completada').length,
    countByTipo: Object.entries(tasks.filter(t => t.estado === 'Completada').reduce((acc, t) => { acc[t.tipo] = (acc[t.tipo] || 0) + 1; return acc; }, {} as Record<string, number>)).sort((a, b) => b[1] - a[1]),
  };

  const durList = tasks.filter(t => t.estado === 'Completada' && t.inicio_en && t.completado_en).map(t => calcDuration(t.inicio_en, t.completado_en)).filter(Boolean);
  const avgDur = durList.length ? (() => { let totalMin = 0; durList.forEach(d => { const parts = d!.split(/[hm ]/); totalMin += parseInt(parts[0]) * 60 + (parseInt(parts[1]) || 0); }); const avg = Math.round(totalMin / durList.length); return avg > 60 ? `${Math.floor(avg/60)}h ${avg%60}m` : `${avg}m`; })() : '—';

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex items-center gap-2 bg-cyber-panel border border-cyber-purple/20 p-2 rounded-xl flex-wrap">
        <button onClick={() => setTab('kanban')} className={`px-4 py-2 rounded text-[10px] font-bold font-orbitron tracking-wider transition-all cursor-pointer ${tab === 'kanban' ? 'bg-cyber-cyan text-cyber-bg' : 'text-textD hover:text-text'}`}>
          <div className="flex items-center gap-2"><Eye className="w-3.5 h-3.5" /> Kanban</div>
        </button>
        <button onClick={() => setTab('historicos')} className={`px-4 py-2 rounded text-[10px] font-bold font-orbitron tracking-wider transition-all cursor-pointer ${tab === 'historicos' ? 'bg-cyber-cyan text-cyber-bg' : 'text-textD hover:text-text'}`}>
          <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /> Históricos</div>
        </button>
        <button onClick={() => setTab('dashboard')} className={`px-4 py-2 rounded text-[10px] font-bold font-orbitron tracking-wider transition-all cursor-pointer ${tab === 'dashboard' ? 'bg-cyber-cyan text-cyber-bg' : 'text-textD hover:text-text'}`}>
          <div className="flex items-center gap-2"><BarChart3 className="w-3.5 h-3.5" /> Dashboard</div>
        </button>
        <div className="flex-1" />
        <button onClick={() => setShowCreate(true)}
          className="px-4 py-2 rounded bg-cyber-purple/20 text-cyber-purple border border-cyber-purple/30 text-[10px] font-bold uppercase tracking-wider hover:bg-cyber-purple hover:text-white transition-all cursor-pointer flex items-center gap-2">
          <Plus className="w-3.5 h-3.5" /> Nueva tarea
        </button>
      </div>

      {/* Filters */}
      {tab !== 'dashboard' && <div className="flex items-center gap-3 bg-cyber-panel border border-cyber-purple/20 p-3 rounded-xl flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]"><Search className="w-3.5 h-3.5 text-textD" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por cliente, descripción o ID..." className="flex-1 bg-cyber-bg border border-cyber-purple/20 rounded px-3 py-1.5 text-xs text-text placeholder:text-textD/40 outline-none focus:border-cyber-cyan transition-all font-mono" />
        </div>
        <select value={filterTipo} onChange={e => setFilterTipo(e.target.value)} className="bg-cyber-bg border border-cyber-purple/20 rounded px-3 py-1.5 text-xs text-text">
          <option value="">Todos los tipos</option>{tipos.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filterPrio} onChange={e => setFilterPrio(e.target.value)} className="bg-cyber-bg border border-cyber-purple/20 rounded px-3 py-1.5 text-xs text-text">
          <option value="">Todas las prioridades</option><option value="Alta">Alta</option><option value="Media">Media</option><option value="Baja">Baja</option>
        </select>
        <span className="text-[10px] text-textD font-mono">{filtered.length} tareas</span>
      </div>}

      {/* Tab: Kanban */}
      {tab === 'kanban' && <div className="flex gap-4 overflow-x-auto pb-4">
        <KanbanColumn title="Pendientes" tasks={pending} onStatus={onUpdateStatus} onTaskClick={setSelectedTask} color="bg-amber-400" />
        <KanbanColumn title="En Proceso" tasks={inProgress} onStatus={onUpdateStatus} onTaskClick={setSelectedTask} color="bg-cyan-400" />
        <KanbanColumn title="Completadas (semana)" tasks={completed} onStatus={onUpdateStatus} onTaskClick={setSelectedTask} color="bg-green-400" />
      </div>}

      {/* Tab: Históricos */}
      {tab === 'historicos' && <div className="bg-cyber-panel border border-cyber-purple/20 rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 p-3 border-b border-cyber-purple/20">
          <span className="text-[10px] text-textD font-mono mr-2">Filtrar por:</span>
          {(['week', 'month', 'year'] as const).map(f => (
            <button key={f} onClick={() => setHistFilter(f)}
              className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${histFilter === f ? 'bg-cyber-cyan text-cyber-bg' : 'bg-cyber-bg text-textD hover:text-text'}`}>
              {f === 'week' ? 'Semana' : f === 'month' ? 'Mes' : 'Año'}
            </button>
          ))}
          <span className="text-[10px] text-textD font-mono ml-auto">{filteredHistoricos.length} completadas</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead><tr className="border-b border-cyber-purple/20 bg-cyber-bg2/30">
              <th className="text-left p-3 text-[10px] text-textD uppercase tracking-widest">ID</th>
              <th className="text-left p-3 text-[10px] text-textD uppercase tracking-widest">Cliente</th>
              <th className="text-left p-3 text-[10px] text-textD uppercase tracking-widest">Descripción</th>
              <th className="text-left p-3 text-[10px] text-textD uppercase tracking-widest">Tipo</th>
              <th className="text-left p-3 text-[10px] text-textD uppercase tracking-widest">Prioridad</th>
              <th className="text-left p-3 text-[10px] text-textD uppercase tracking-widest">Duración</th>
              <th className="text-left p-3 text-[10px] text-textD uppercase tracking-widest">Completado</th>
            </tr></thead>
            <tbody>
              {filteredHistoricos.length === 0 && <tr><td colSpan={7} className="text-center p-8 text-textD text-xs">No hay tareas completadas en este período</td></tr>}
              {filteredHistoricos.map(t => (
                <tr key={t.id} className="border-b border-cyber-purple/10 hover:bg-cyber-purple/5 transition-colors cursor-pointer" onClick={() => setSelectedTask(t)}>
                  <td className="p-3 text-cyber-cyan font-bold">{t.venta_id}</td>
                  <td className="p-3">{t.cliente}</td>
                  <td className="p-3 max-w-[200px] truncate">{t.descripcion}</td>
                  <td className="p-3"><span className="bg-cyber-purple/10 text-cyber-purple px-2 py-0.5 rounded text-[10px]">{t.tipo}</span></td>
                  <td className="p-3"><span className={`font-bold ${PRIO_COLORS[t.prioridad] || 'text-textD'}`}>{t.prioridad || 'Media'}</span></td>
                  <td className="p-3 text-green-400">{calcDuration(t.inicio_en, t.completado_en) || '—'}</td>
                  <td className="p-3 text-textD text-[10px]">{fmtDateShort(t.completado_en)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>}

      {/* Tab: Dashboard */}
      {tab === 'dashboard' && <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-cyber-panel border border-cyber-purple/20 rounded-xl p-5">
          <h4 className="font-orbitron text-[10px] text-cyber-cyan uppercase tracking-widest mb-4">Resumen</h4>
          <div className="space-y-3 text-xs font-mono">
            <div className="flex justify-between"><span className="text-textD">Total tareas</span><span className="font-bold text-text">{stats.total}</span></div>
            <div className="flex justify-between"><span className="text-yellow-400">Pendientes</span><span className="font-bold">{stats.pendientes}</span></div>
            <div className="flex justify-between"><span className="text-cyan-400">En Proceso</span><span className="font-bold">{stats.enProceso}</span></div>
            <div className="flex justify-between"><span className="text-green-400">Completadas</span><span className="font-bold">{stats.completadas}</span></div>
            {stats.altaPrio > 0 && <div className="flex justify-between text-red-400"><span><AlertTriangle className="w-3 h-3 inline" /> Alta prioridad</span><span className="font-bold">{stats.altaPrio}</span></div>}
          </div>
        </div>
        <div className="bg-cyber-panel border border-cyber-purple/20 rounded-xl p-5">
          <h4 className="font-orbitron text-[10px] text-cyber-cyan uppercase tracking-widest mb-4">Tiempo promedio</h4>
          <div className="text-3xl font-bold font-orbitron text-cyber-cyan text-center py-4">{avgDur}</div>
          <p className="text-[10px] text-textD text-center">por tarea completada</p>
        </div>
        <div className="bg-cyber-panel border border-cyber-purple/20 rounded-xl p-5">
          <h4 className="font-orbitron text-[10px] text-cyber-cyan uppercase tracking-widest mb-4">Por tipo de trabajo</h4>
          <div className="space-y-2 text-xs font-mono">
            {stats.countByTipo.length === 0 && <p className="text-textD text-[10px]">Sin datos</p>}
            {stats.countByTipo.map(([tipo, count]) => (
              <div key={tipo} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyber-purple" />
                <span className="flex-1 text-textD">{tipo}</span>
                <span className="font-bold text-text">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>}

      {/* Detail modal */}
      {selectedTask && <DetailModal t={selectedTask} users={users} onClose={() => setSelectedTask(null)} onSave={onUpdateTask} />}

      {/* Create modal */}
      {showCreate && <CreateTaskModal users={users} onClose={() => setShowCreate(false)} onSave={onAddTask} />}
    </div>
  );
}
