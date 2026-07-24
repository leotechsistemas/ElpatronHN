import React, { useState } from 'react';
import { Save, Image, Globe, Facebook, Instagram, Music2, MessageCircle, Youtube, Linkedin, Phone, MapPin, Mail, DollarSign, Percent } from 'lucide-react';
import { CompanySettings } from '../types';

interface CompanyViewProps {
  settings: CompanySettings;
  onUpdate: (data: any) => Promise<boolean>;
}

export default function CompanyView({ settings, onUpdate }: CompanyViewProps) {
  const [form, setForm] = useState({ ...settings });
  const [saving, setSaving] = useState(false);

  const handleChange = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onUpdate(form);
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="panel border border-cyber-purple/20 bg-cyber-panel rounded-xl p-6">
        <h2 className="font-orbitron font-bold text-sm text-cyber-cyan tracking-wider uppercase mb-6">Configuracion de la Empresa</h2>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Identidad */}
          <div>
            <h3 className="font-orbitron text-xs font-bold text-cyber-purple tracking-wider uppercase mb-4 flex items-center gap-2">
              <Image className="w-4 h-4" /> Identidad Corporativa
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="field text-xs">
                <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1">Nombre de la Empresa</label>
                <input type="text" value={form.company_name} onChange={e => handleChange('company_name', e.target.value)}
                  className="w-full p-2.5 rounded font-mono" />
              </div>
              <div className="field text-xs">
                <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1">Slogan</label>
                <input type="text" value={form.slogan} onChange={e => handleChange('slogan', e.target.value)}
                  className="w-full p-2.5 rounded font-mono" />
              </div>
            </div>
            <div className="field text-xs mt-4">
              <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1">Logo (URL o Base64)</label>
              <input type="text" value={form.logo} onChange={e => handleChange('logo', e.target.value)}
                className="w-full p-2.5 rounded font-mono text-xs" />
              {form.logo && (
                <div className="mt-2 p-2 bg-cyber-bg2 border border-cyber-purple/20 rounded inline-block">
                  <img src={form.logo} alt="preview" className="h-16 object-contain" onError={e => (e.target as HTMLImageElement).style.display = 'none'} />
                </div>
              )}
            </div>
          </div>

          {/* Moneda e ISV */}
          <div>
            <h3 className="font-orbitron text-xs font-bold text-cyber-purple tracking-wider uppercase mb-4 flex items-center gap-2">
              <DollarSign className="w-4 h-4" /> Moneda e Impuestos
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="field text-xs">
                <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1">Moneda</label>
                <select value={form.currency} onChange={e => handleChange('currency', e.target.value)}
                  className="w-full p-2.5 rounded">
                  <option value="HNL">HNL - Lempira Hondureño</option>
                  <option value="USD">USD - Dólar Americano</option>
                  <option value="EUR">EUR - Euro</option>
                </select>
              </div>
              <div className="field text-xs">
                <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1">Símbolo Moneda</label>
                <input type="text" value={form.currency_symbol} onChange={e => handleChange('currency_symbol', e.target.value)}
                  className="w-full p-2.5 rounded font-mono text-center" maxLength={5} />
              </div>
              <div className="field text-xs">
                <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1">
                  <Percent className="w-3 h-3 inline mr-1" />ISV (%)
                </label>
                <input type="number" step="0.01" min="0" max="100" value={form.isv}
                  onChange={e => handleChange('isv', parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 rounded font-mono text-center" />
              </div>
            </div>
          </div>

          {/* Contacto */}
          <div>
            <h3 className="font-orbitron text-xs font-bold text-cyber-purple tracking-wider uppercase mb-4 flex items-center gap-2">
              <Phone className="w-4 h-4" /> Información de Contacto
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="field text-xs">
                <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1">Teléfono</label>
                <input type="text" value={form.phone} onChange={e => handleChange('phone', e.target.value)}
                  className="w-full p-2.5 rounded font-mono" />
              </div>
              <div className="field text-xs">
                <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1">Correo Electrónico</label>
                <input type="email" value={form.email} onChange={e => handleChange('email', e.target.value)}
                  className="w-full p-2.5 rounded font-mono" />
              </div>
            </div>
            <div className="field text-xs mt-4">
              <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1">Dirección</label>
              <textarea value={form.address} onChange={e => handleChange('address', e.target.value)}
                className="w-full p-2.5 rounded font-mono text-xs" rows={2} />
            </div>
          </div>

          {/* Redes Sociales */}
          <div>
            <h3 className="font-orbitron text-xs font-bold text-cyber-purple tracking-wider uppercase mb-4 flex items-center gap-2">
              <Globe className="w-4 h-4" /> Redes Sociales / Community
            </h3>
            <p className="text-[10px] text-textD mb-4">Estos enlaces aparecerán en el panel Community y en los PDFs generados.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="field text-xs">
                <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1 flex items-center gap-1">
                  <Facebook className="w-3 h-3 text-blue-400" /> Facebook
                </label>
                <input type="url" placeholder="https://facebook.com/tupagina" value={form.facebook}
                  onChange={e => handleChange('facebook', e.target.value)} className="w-full p-2.5 rounded font-mono text-xs" />
              </div>
              <div className="field text-xs">
                <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1 flex items-center gap-1">
                  <Instagram className="w-3 h-3 text-pink-400" /> Instagram
                </label>
                <input type="url" placeholder="https://instagram.com/tuusuario" value={form.instagram}
                  onChange={e => handleChange('instagram', e.target.value)} className="w-full p-2.5 rounded font-mono text-xs" />
              </div>
              <div className="field text-xs">
                <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1 flex items-center gap-1">
                  <Music2 className="w-3 h-3 text-cyan-400" /> TikTok
                </label>
                <input type="url" placeholder="https://tiktok.com/@tuusuario" value={form.tiktok}
                  onChange={e => handleChange('tiktok', e.target.value)} className="w-full p-2.5 rounded font-mono text-xs" />
              </div>
              <div className="field text-xs">
                <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1 flex items-center gap-1">
                  <MessageCircle className="w-3 h-3 text-green-400" /> WhatsApp
                </label>
                <input type="text" placeholder="50425521400 (solo números)" value={form.whatsapp}
                  onChange={e => handleChange('whatsapp', e.target.value)} className="w-full p-2.5 rounded font-mono text-xs" />
              </div>
              <div className="field text-xs">
                <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1 flex items-center gap-1">
                  <Youtube className="w-3 h-3 text-red-400" /> YouTube
                </label>
                <input type="url" placeholder="https://youtube.com/@tucanal" value={form.youtube}
                  onChange={e => handleChange('youtube', e.target.value)} className="w-full p-2.5 rounded font-mono text-xs" />
              </div>
              <div className="field text-xs">
                <label className="block text-[10px] uppercase font-bold text-cyber-cyan mb-1 flex items-center gap-1">
                  <Linkedin className="w-3 h-3 text-blue-500" /> LinkedIn
                </label>
                <input type="url" placeholder="https://linkedin.com/company/tuempresa" value={form.linkedin}
                  onChange={e => handleChange('linkedin', e.target.value)} className="w-full p-2.5 rounded font-mono text-xs" />
              </div>
            </div>
          </div>

          {/* Vista previa de Community */}
          {form.facebook || form.instagram || form.tiktok || form.whatsapp || form.youtube || form.linkedin ? (
            <div>
              <h3 className="font-orbitron text-xs font-bold text-cyber-purple tracking-wider uppercase mb-4">Vista Previa - Panel Community</h3>
              <div className="flex flex-wrap gap-3 p-4 bg-cyber-bg2 border border-cyber-purple/20 rounded-lg">
                {form.facebook && (
                  <a href={form.facebook} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-600 hover:text-white transition-all text-xs font-bold">
                    <Facebook className="w-4 h-4" /> Facebook
                  </a>
                )}
                {form.instagram && (
                  <a href={form.instagram} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-pink-600/20 text-pink-400 border border-pink-500/30 rounded-lg hover:bg-pink-600 hover:text-white transition-all text-xs font-bold">
                    <Instagram className="w-4 h-4" /> Instagram
                  </a>
                )}
                {form.tiktok && (
                  <a href={form.tiktok} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded-lg hover:bg-cyan-600 hover:text-white transition-all text-xs font-bold">
                    <Music2 className="w-4 h-4" /> TikTok
                  </a>
                )}
                {form.whatsapp && (
                  <a href={`https://wa.me/${form.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-green-600/20 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-600 hover:text-white transition-all text-xs font-bold">
                    <MessageCircle className="w-4 h-4" /> WhatsApp
                  </a>
                )}
                {form.youtube && (
                  <a href={form.youtube} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-red-600/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-600 hover:text-white transition-all text-xs font-bold">
                    <Youtube className="w-4 h-4" /> YouTube
                  </a>
                )}
                {form.linkedin && (
                  <a href={form.linkedin} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-800/20 text-blue-300 border border-blue-700/30 rounded-lg hover:bg-blue-700 hover:text-white transition-all text-xs font-bold">
                    <Linkedin className="w-4 h-4" /> LinkedIn
                  </a>
                )}
              </div>
            </div>
          ) : null}

          <div className="flex justify-end pt-4 border-t border-cyber-purple/20">
            <button type="submit" disabled={saving}
              className="px-8 py-3 bg-gradient-to-r from-cyber-purple to-indigo-600 text-white font-orbitron font-bold text-xs tracking-wider rounded-lg shadow-[0_0_12px_rgba(138,43,226,0.5)] hover:shadow-[0_0_18px_rgba(138,43,226,0.8)] transition-all cursor-pointer disabled:opacity-40 flex items-center gap-2">
              <Save className="w-4 h-4" /> {saving ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
