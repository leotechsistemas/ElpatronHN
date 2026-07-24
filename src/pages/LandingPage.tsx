import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Menu, X, ChevronRight, ChevronLeft, MessageCircle,
  Factory, Palette, Printer, Wrench, Droplets, Star,
  MapPin, Mail, Phone, ChevronDown, Instagram, Facebook,
  Linkedin, Youtube, Award, Clock, Users, Zap
} from 'lucide-react';
import { LOGO_BASE64 } from '../logo';
import { api } from '../services/api';

interface Props { onEnter: () => void }

const slides = [
  {
    img: '/images/hero_rotulacion.png',
    title: 'Rotulación y Publicidad\nCorporativa',
    subtitle: 'Rótulos luminosos, letreros 3D, vinilos decorativos y señalética premium para tu negocio.',
    tag: 'Rotulación',
  },
  {
    img: '/images/hero_impresion.png',
    title: 'Impresión Publicitaria\nde Alto Impacto',
    subtitle: 'Vallas, banners, volantes, catálogos y material promocional con la más alta calidad.',
    tag: 'Impresión',
  },
  {
    img: '/images/hero_laser.png',
    title: 'Corte y Grabado\nLáser de Precisión',
    subtitle: 'Tecnología CO2 y fibra sobre acrílico, madera, metal y más materiales.',
    tag: 'Láser',
  },
  {
    img: '/images/hero_insumos.png',
    title: 'Maquinaria e Insumos\nIndustriales',
    subtitle: 'Equipos, tintas, repuestos y servicio técnico especializado para la industria.',
    tag: 'Maquinaria',
  },
];

const services = [
  {
    img: '/images/svc_impresion.png',
    title: 'Impresión Publicitaria',
    desc: 'Vallas, banners, volantes, catálogos y todo tipo de material promocional con la más alta calidad de impresión digital.',
    glow: 'rgba(245,158,11,0.3)',
    tag: 'Impresión',
  },
  {
    img: '/images/svc_rotulacion.png',
    title: 'Rotulación Corporativa',
    desc: 'Rótulos luminosos, letreros 3D, vinilos decorativos y señalética corporativa para destacar tu negocio.',
    glow: 'rgba(217,119,6,0.3)',
    tag: 'Rotulación',
  },
  {
    img: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&q=85',
    title: 'Maquinaria Industrial',
    desc: 'Venta e importación de maquinaria para impresión, corte láser, grabado y acabados publicitarios de nivel industrial.',
    glow: 'rgba(120,113,108,0.3)',
    tag: 'Maquinaria',
  },
  {
    img: 'https://images.unsplash.com/photo-1602576666092-bf6447a729fc?w=600&q=85',
    title: 'Tintas e Insumos',
    desc: 'Tintas solventes, ecosolventes, UV y látex para impresoras de gran formato. Contamos con las mejores marcas del mercado.',
    glow: 'rgba(14,165,233,0.3)',
    tag: 'Insumos',
  },
  {
    img: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&q=85',
    title: 'Repuestos y Soporte',
    desc: 'Repuestos originales y genéricos para equipos de impresión, más servicio técnico especializado en tu negocio.',
    glow: 'rgba(16,185,129,0.3)',
    tag: 'Soporte',
  },
];

const stats = [
  { icon: Users, value: 500, suffix: '+', label: 'Clientes satisfechos' },
  { icon: Clock, value: 12, suffix: ' Años', label: 'De experiencia' },
  { icon: Award, value: 50, suffix: '+', label: 'Marcas representadas' },
  { icon: Zap, value: 3, suffix: '', label: 'Sucursales en Honduras' },
];

const testimonials = [
  { name: 'Carlos Mendoza', company: 'Grupo Inmobiliario del Norte', text: 'EL PATRÓN transformó nuestra imagen corporativa. La calidad de sus rótulos es incomparable en el mercado hondureño.', rating: 5 },
  { name: 'María Fernanda López', company: 'Publicidad Creativa HN', text: 'Trabajamos con ellos desde hace 5 años. Sus tintas y materiales siempre llegan a tiempo y con excelente calidad.', rating: 5 },
  { name: 'José Antonio Rivera', company: 'Talleres Gráficos Rivera', text: 'La maquinaria que nos vendieron superó todas nuestras expectativas. El servicio postventa es verdaderamente excelente.', rating: 5 },
  { name: 'Ana Patricia Flores', company: 'Agencia Visual HN', text: 'El corte láser que hacen es precisión pura. Siempre confiables, cumplidos y con una atención al cliente de primer nivel.', rating: 5 },
  { name: 'Roberto García', company: 'Industrias García S.A.', text: 'Llevamos 3 años comprando tintas e insumos con ellos. Calidad consistente y los mejores precios del mercado.', rating: 5 },
  { name: 'Karla Rivera', company: 'Creativos HN Studio', text: 'Nos resolvieron un pedido urgente de rotulación en 24 horas. Increíble servicio y compromiso con el cliente.', rating: 5 },
];

const COMPANY_DEFAULTS = {
  name: 'EL PATRÓN HN',
  slogan: 'Tecnología de Personalizados desde 2012',
  email: 'info@elpatron.hn',
  phone: '+504 2552-1400',
  address: 'Tegucigalpa, Francisco Morazán',
  whatsapp: '50425521400',
  facebook: '#',
  instagram: '#',
  linkedin: '#',
  youtube: '#',
};

/* ─── Hooks ─── */
function useScrollReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const { ref, visible } = useScrollReveal(0.5);
  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const dur = 1500, step = 16;
    const inc = target / (dur / step);
    const timer = setInterval(() => {
      start += inc;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, step);
    return () => clearInterval(timer);
  }, [visible, target]);
  return <span ref={ref}>{visible ? count : 0}{suffix}</span>;
}

/* ─── Main Component ─── */
export default function LandingPage({ onEnter }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [slide, setSlide] = useState(0);
  const [form, setForm] = useState({ nombre: '', empresa: '', correo: '', telefono: '', mensaje: '' });
  const [sent, setSent] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [company, setCompany] = useState(COMPANY_DEFAULTS);
  const [tSlide, setTSlide] = useState(0);
  const [navbarCompact, setNavbarCompact] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    api.getCompanySettings().then((res: any) => {
      if (res) setCompany({
        name: res.company_name || COMPANY_DEFAULTS.name,
        slogan: res.slogan || COMPANY_DEFAULTS.slogan,
        email: res.email || COMPANY_DEFAULTS.email,
        phone: res.phone || COMPANY_DEFAULTS.phone,
        address: res.address || COMPANY_DEFAULTS.address,
        whatsapp: res.whatsapp?.replace(/[^0-9]/g, '') || COMPANY_DEFAULTS.whatsapp,
        facebook: res.facebook || COMPANY_DEFAULTS.facebook,
        instagram: res.instagram || COMPANY_DEFAULTS.instagram,
        linkedin: res.linkedin || COMPANY_DEFAULTS.linkedin,
        youtube: res.youtube || COMPANY_DEFAULTS.youtube,
      });
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setSlide(s => (s + 1) % slides.length), 5500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setTSlide(s => (s + 1) % testimonials.length), 4500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrollY(y);
      setNavbarCompact(y > 80);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = useCallback((id: string) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const prevSlide = () => setSlide(s => (s - 1 + slides.length) % slides.length);
  const nextSlide = () => setSlide(s => (s + 1) % slides.length);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setFormLoading(true);
    const res = await api.requestQuote({
      nombre: form.nombre, correo: form.correo, telefono: form.telefono || '',
      empresa: form.empresa || '', categoria: 'General',
      descripcion: form.mensaje, detalles: form.mensaje,
    });
    setFormLoading(false);
    if (res?.success) {
      setSent(true);
      setForm({ nombre: '', empresa: '', correo: '', telefono: '', mensaje: '' });
      setTimeout(() => setSent(false), 4000);
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: '#FAFAFA', color: '#1A1A1A', fontFamily: "'Inter', sans-serif" }}>

      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Inter:wght@300;400;500;600&display=swap');

        * { box-sizing: border-box; }

        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: #FAFAFA; }
        ::-webkit-scrollbar-thumb { background: #D4A017; border-radius: 3px; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes floatY {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-12px); }
        }
        @keyframes pulseGold {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50%       { opacity: 1;   transform: scale(1.2); }
        }
        @keyframes rotateSlow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-40px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes textReveal {
          from { opacity: 0; transform: translateY(20px); clip-path: inset(100% 0 0 0); }
          to   { opacity: 1; transform: translateY(0); clip-path: inset(0% 0 0 0); }
        }

        .gold-gradient-text {
          background: linear-gradient(135deg, #F5C842 0%, #D4A017 40%, #B8860B 70%, #F5C842 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 4s linear infinite;
        }
        .shimmer-btn::after {
          content: '';
          position: absolute;
          top: 0; left: -100%;
          width: 60%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
          transition: left 0.5s ease;
        }
        .shimmer-btn:hover::after { left: 150%; }

        .card-glow {
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .card-glow:hover {
          transform: translateY(-6px);
        }

        .nav-link::after {
          content: '';
          display: block;
          height: 2px;
          background: #D4A017;
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.3s ease;
          margin-top: 2px;
          border-radius: 2px;
        }
        .nav-link:hover::after { transform: scaleX(1); }

        .diagonal-bg {
          background-image: repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 40px,
            rgba(212,160,23,0.03) 40px,
            rgba(212,160,23,0.03) 41px
          );
        }

        .form-input {
          width: 100%;
          padding: 12px 16px;
          background: #FFFFFF;
          border: 1px solid rgba(0,0,0,0.1);
          border-radius: 10px;
          color: #111111;
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          outline: none;
          transition: all 0.3s ease;
        }
        .form-input::placeholder { color: rgba(10,10,10,0.4); }
        .form-input:focus {
          border-color: #D4A017;
          background: #FFFFFF;
          box-shadow: 0 0 0 3px rgba(212,160,23,0.12);
        }

        .testimonial-card {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .dot-pattern {
          background-image: radial-gradient(circle, rgba(212,160,23,0.12) 1px, transparent 1px);
          background-size: 28px 28px;
        }
      `}</style>

      {/* ── WHATSAPP FLOATING ── */}
      <a
        href={`https://wa.me/${company.whatsapp}?text=Hola%2C%20quiero%20informaci%C3%B3n%20sobre%20sus%20servicios`}
        target="_blank" rel="noopener noreferrer"
        style={{
          position: 'fixed', bottom: '28px', right: '28px', zIndex: 999,
          width: '58px', height: '58px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #25D366, #128C7E)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 32px rgba(37,211,102,0.4)',
          animation: 'floatY 3s ease-in-out infinite',
          transition: 'transform 0.2s ease',
        }}
        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.12)')}
        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
      >
        <MessageCircle style={{ width: '26px', height: '26px', color: '#fff' }} />
      </a>

      {/* ── NAVBAR ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: navbarCompact ? 'rgba(255,255,255,0.95)' : 'transparent',
        backdropFilter: navbarCompact ? 'blur(20px)' : 'none',
        borderBottom: navbarCompact ? '1px solid rgba(0,0,0,0.05)' : 'none',
        transition: 'all 0.4s ease',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: navbarCompact ? '62px' : '80px', transition: 'height 0.3s ease' }}>
          {/* Logo */}
          <button onClick={() => scrollTo('hero')} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'none', border: 'none', cursor: 'pointer' }}>
            <img src={LOGO_BASE64} alt={company.name} style={{ width: navbarCompact ? '34px' : '42px', height: navbarCompact ? '34px' : '42px', objectFit: 'contain', transition: 'all 0.3s ease', filter: navbarCompact ? 'brightness(0)' : 'none' }} />
            <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: navbarCompact ? '15px' : '17px', letterSpacing: '0.12em', color: navbarCompact ? '#111111' : '#F5F0E8', textTransform: 'uppercase', transition: 'all 0.3s ease' }}>
              {company.name}
            </span>
          </button>

          {/* Desktop links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '36px' }} className="desktop-nav">
            {['services', 'about', 'testimonials', 'contact'].map((id, i) => (
              <button key={id} onClick={() => scrollTo(id)} className="nav-link"
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: navbarCompact ? 'rgba(10,10,10,0.6)' : 'rgba(245,240,232,0.85)', padding: 0, transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#D4A017')}
                onMouseLeave={e => (e.currentTarget.style.color = navbarCompact ? 'rgba(10,10,10,0.6)' : 'rgba(245,240,232,0.85)')}>
                {['Servicios', 'Nosotros', 'Clientes', 'Contacto'][i]}
              </button>
            ))}
            <button onClick={() => scrollTo('contact')} className="shimmer-btn"
              style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, #D4A017, #B8860B)', color: '#FFFFFF', fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase', padding: '10px 22px', borderRadius: '8px', border: 'none', cursor: 'pointer', boxShadow: '0 4px 20px rgba(212,160,23,0.35)', transition: 'all 0.3s ease' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(212,160,23,0.5)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(212,160,23,0.35)'; }}>
              Cotizar Ahora
            </button>
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setMenuOpen(!menuOpen)}
            style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', color: navbarCompact ? '#111111' : '#F5F0E8', padding: '8px' }}
            className="mobile-menu-btn">
            {menuOpen ? <X style={{ width: '22px', height: '22px' }} /> : <Menu style={{ width: '22px', height: '22px' }} />}
          </button>
        </div>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div style={{ background: 'rgba(255,255,255,0.98)', borderTop: '1px solid rgba(0,0,0,0.05)', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {[['services', 'Servicios'], ['about', 'Nosotros'], ['testimonials', 'Clientes'], ['contact', 'Contacto']].map(([id, label]) => (
              <button key={id} onClick={() => scrollTo(id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '12px 0', fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 600, color: 'rgba(10,10,10,0.85)', borderBottom: '1px solid rgba(0,0,0,0.05)', letterSpacing: '0.05em' }}>
                {label}
              </button>
            ))}
            <button onClick={() => scrollTo('contact')}
              style={{ marginTop: '12px', background: 'linear-gradient(135deg, #D4A017, #B8860B)', color: '#FFFFFF', fontWeight: 700, fontFamily: "'Outfit', sans-serif", fontSize: '13px', letterSpacing: '0.1em', padding: '12px', borderRadius: '8px', border: 'none', cursor: 'pointer', textTransform: 'uppercase' }}>
              Cotizar Ahora
            </button>
          </div>
        )}

        <style>{`
          @media (max-width: 768px) {
            .desktop-nav { display: none !important; }
            .mobile-menu-btn { display: flex !important; }
          }
        `}</style>
      </nav>

      {/* ── HERO ── */}
      <section id="hero" style={{ position: 'relative', height: '100vh', overflow: 'hidden', minHeight: '600px' }}>
        {/* Slides */}
        {slides.map((s, i) => (
          <div key={i} style={{
            position: 'absolute', inset: 0,
            opacity: i === slide ? 1 : 0,
            transform: i === slide ? `scale(1) translateY(${scrollY * 0.25}px)` : 'scale(1.05)',
            transition: 'opacity 1.2s ease, transform 0.1s linear',
            pointerEvents: i === slide ? 'auto' : 'none',
          }}>
            <img src={s.img} alt={s.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            {/* Multi-layer overlay */}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(105deg, rgba(8,6,4,0.85) 0%, rgba(8,6,4,0.55) 55%, rgba(8,6,4,0.15) 100%)' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(8,6,4,0.6) 0%, transparent 50%)' }} />
          </div>
        ))}

        {/* Floating gold particles */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          {[...Array(10)].map((_, i) => (
            <div key={i} style={{
              position: 'absolute',
              width: i % 3 === 0 ? '3px' : '2px',
              height: i % 3 === 0 ? '3px' : '2px',
              borderRadius: '50%',
              background: `rgba(212,160,23,${0.2 + (i % 4) * 0.15})`,
              left: `${8 + i * 10}%`,
              top: `${15 + (i % 5) * 16}%`,
              animation: `pulseGold ${2.5 + (i % 3)}s ease-in-out infinite`,
              animationDelay: `${i * 0.4}s`,
            }} />
          ))}
          {/* Decorative ring */}
          <div style={{
            position: 'absolute', right: '10%', top: '15%',
            width: '320px', height: '320px', borderRadius: '50%',
            border: '1px solid rgba(212,160,23,0.08)',
            animation: 'rotateSlow 30s linear infinite',
          }} />
          <div style={{
            position: 'absolute', right: '12%', top: '17%',
            width: '260px', height: '260px', borderRadius: '50%',
            border: '1px solid rgba(212,160,23,0.05)',
            animation: 'rotateSlow 20s linear infinite reverse',
          }} />
        </div>

        {/* Hero content */}
        <div style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px', width: '100%' }}>
            <div style={{ maxWidth: '680px' }}>
              {/* Slide tag badge */}
              <div key={`badge-${slide}`} style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                background: 'rgba(212,160,23,0.12)', backdropFilter: 'blur(12px)',
                border: '1px solid rgba(212,160,23,0.25)',
                borderRadius: '100px', padding: '6px 16px',
                marginBottom: '24px', animation: 'fadeIn 0.6s ease-out',
              }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#F5C842', display: 'inline-block', animation: 'pulseGold 1.5s ease-in-out infinite' }} />
                <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '11px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#F5C842' }}>
                  {slides[slide].tag}
                </span>
              </div>

              {/* Headline */}
              <h1 key={`h1-${slide}`} style={{
                fontFamily: "'Outfit', sans-serif", fontWeight: 900,
                fontSize: 'clamp(36px, 5.5vw, 76px)', lineHeight: 1.08,
                color: '#F5F0E8', marginBottom: '20px',
                animation: 'fadeUp 0.7s ease-out',
                whiteSpace: 'pre-line',
              }}>
                {slides[slide].title.split('\n').map((line, li) => (
                  <span key={li}>
                    {li === 0 ? line : <span className="gold-gradient-text">{line}</span>}
                    {li === 0 && <br />}
                  </span>
                ))}
              </h1>

              {/* Subtitle */}
              <p key={`p-${slide}`} style={{
                fontFamily: "'Inter', sans-serif", fontSize: 'clamp(14px, 1.5vw, 18px)',
                color: 'rgba(245,240,232,0.7)', lineHeight: 1.7,
                marginBottom: '36px', maxWidth: '520px',
                animation: 'fadeUp 0.7s ease-out 0.15s both',
              }}>
                {slides[slide].subtitle}
              </p>

              {/* CTAs */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', animation: 'fadeUp 0.7s ease-out 0.3s both' }}>
                <button onClick={() => scrollTo('contact')} className="shimmer-btn"
                  style={{
                    position: 'relative', overflow: 'hidden',
                    background: 'linear-gradient(135deg, #F5C842 0%, #D4A017 60%, #B8860B 100%)',
                    color: '#0A0A0A', fontFamily: "'Outfit', sans-serif", fontWeight: 800,
                    fontSize: '13px', letterSpacing: '0.12em', textTransform: 'uppercase',
                    padding: '15px 32px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                    boxShadow: '0 8px 32px rgba(212,160,23,0.45)',
                    display: 'flex', alignItems: 'center', gap: '8px',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 14px 40px rgba(212,160,23,0.6)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(212,160,23,0.45)'; }}>
                  Solicitar Cotización <ChevronRight style={{ width: '16px', height: '16px' }} />
                </button>
                <button onClick={() => scrollTo('services')}
                  style={{
                    background: 'rgba(245,240,232,0.07)', backdropFilter: 'blur(12px)',
                    color: '#F5F0E8', fontFamily: "'Outfit', sans-serif", fontWeight: 600,
                    fontSize: '13px', letterSpacing: '0.08em',
                    padding: '15px 28px', borderRadius: '10px', border: '1px solid rgba(245,240,232,0.2)',
                    cursor: 'pointer', transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(245,240,232,0.12)'; e.currentTarget.style.borderColor = 'rgba(245,240,232,0.35)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(245,240,232,0.07)'; e.currentTarget.style.borderColor = 'rgba(245,240,232,0.2)'; }}>
                  Ver Servicios
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Slide controls */}
        {[{ fn: prevSlide, side: 'left', icon: <ChevronLeft style={{ width: '20px', height: '20px' }} /> },
          { fn: nextSlide, side: 'right', icon: <ChevronRight style={{ width: '20px', height: '20px' }} /> }].map(({ fn, side, icon }) => (
          <button key={side} onClick={fn} style={{
            position: 'absolute', [side]: '20px', top: '50%', transform: 'translateY(-50%)',
            width: '46px', height: '46px', borderRadius: '50%',
            background: 'rgba(245,240,232,0.08)', backdropFilter: 'blur(12px)',
            border: '1px solid rgba(245,240,232,0.15)', color: '#F5F0E8',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.25s ease',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(212,160,23,0.25)'; e.currentTarget.style.borderColor = 'rgba(212,160,23,0.5)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(245,240,232,0.08)'; e.currentTarget.style.borderColor = 'rgba(245,240,232,0.15)'; }}>
            {icon}
          </button>
        ))}

        {/* Slide indicators */}
        <div style={{ position: 'absolute', bottom: '36px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '8px', alignItems: 'center' }}>
          {slides.map((_, i) => (
            <button key={i} onClick={() => setSlide(i)} style={{
              borderRadius: '100px', border: 'none', cursor: 'pointer',
              background: i === slide ? '#F5C842' : 'rgba(245,240,232,0.3)',
              width: i === slide ? '28px' : '8px', height: '8px',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            }} />
          ))}
        </div>

        {/* Scroll down hint */}
        <div style={{ position: 'absolute', bottom: '36px', right: '32px' }}>
          <button onClick={() => scrollTo('stats')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(245,240,232,0.4)', animation: 'floatY 2s ease-in-out infinite' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(212,160,23,0.8)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(245,240,232,0.4)')}>
            <ChevronDown style={{ width: '24px', height: '24px' }} />
          </button>
        </div>
      </section>

      {/* ── STATS BAND ── */}
      <section id="stats" style={{ background: '#FFFFFF', borderTop: '1px solid rgba(0,0,0,0.05)', borderBottom: '1px solid rgba(0,0,0,0.05)', padding: '52px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0' }}>
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} style={{ textAlign: 'center', padding: '16px 24px', borderRight: i < stats.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(212,160,23,0.1)', border: '1px solid rgba(212,160,23,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon style={{ width: '20px', height: '20px', color: '#D4A017' }} />
                  </div>
                </div>
                <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: '38px', lineHeight: 1, color: '#D4A017', marginBottom: '8px' }}>
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(10,10,10,0.5)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section id="services" style={{ padding: '100px 24px', background: '#FAFAFA', position: 'relative' }}>
        {/* Subtle diagonal background */}
        <div className="diagonal-bg" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
          <RevealSection>
            <div style={{ textAlign: 'center', marginBottom: '64px' }}>
              <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '11px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#D4A017' }}>
                Nuestros Servicios
              </span>
              <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 'clamp(28px, 3.5vw, 48px)', lineHeight: 1.15, color: '#111111', margin: '14px 0 16px' }}>
                Todo lo que tu negocio<br /><span className="gold-gradient-text">necesita</span>
              </h2>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '15px', color: 'rgba(10,10,10,0.6)', maxWidth: '520px', margin: '0 auto', lineHeight: 1.7 }}>
                Soluciones completas para la industria publicitaria, desde insumos hasta maquinaria especializada.
              </p>
            </div>
          </RevealSection>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {services.map((svc, i) => {
              return (
                <RevealCard key={i} delay={i * 90}>
                  <div className="card-glow" style={{
                    background: '#FFFFFF',
                    border: '1px solid rgba(0,0,0,0.05)',
                    borderRadius: '18px',
                    height: '100%', position: 'relative', overflow: 'hidden',
                    cursor: 'default', display: 'flex', flexDirection: 'column',
                  }}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLDivElement;
                      el.style.border = `1px solid rgba(212,160,23,0.40)`;
                      el.style.boxShadow = `0 24px 64px ${svc.glow}`;
                      const img = el.querySelector('img') as HTMLImageElement;
                      if (img) img.style.transform = 'scale(1.07)';
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLDivElement;
                      el.style.border = '1px solid rgba(0,0,0,0.05)';
                      el.style.boxShadow = 'none';
                      const img = el.querySelector('img') as HTMLImageElement;
                      if (img) img.style.transform = 'scale(1)';
                    }}>
                    {/* Image header */}
                    <div style={{ position: 'relative', height: '200px', overflow: 'hidden', borderRadius: '18px 18px 0 0', flexShrink: 0 }}>
                      <img
                        src={svc.img}
                        alt={svc.title}
                        style={{
                          width: '100%', height: '100%', objectFit: 'cover',
                          transition: 'transform 0.55s cubic-bezier(0.4, 0, 0.2, 1)',
                        }}
                      />
                      {/* Dark gradient overlay */}
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.65) 100%)' }} />
                      {/* Tag badge */}
                      <div style={{
                        position: 'absolute', top: '14px', left: '14px',
                        background: 'rgba(212,160,23,0.9)', backdropFilter: 'blur(8px)',
                        borderRadius: '100px', padding: '4px 12px',
                        fontFamily: "'Outfit', sans-serif", fontSize: '10px', fontWeight: 700,
                        letterSpacing: '0.12em', textTransform: 'uppercase', color: '#0A0A0A',
                      }}>
                        {svc.tag}
                      </div>
                    </div>

                    {/* Text body */}
                    <div style={{ padding: '24px 26px 28px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: '17px', color: '#111111', marginBottom: '10px', lineHeight: 1.3 }}>
                        {svc.title}
                      </h3>
                      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13.5px', color: 'rgba(10,10,10,0.65)', lineHeight: 1.75, flex: 1 }}>
                        {svc.desc}
                      </p>
                    </div>
                    {/* Bottom gold line */}
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg, transparent, ${svc.glow.replace('0.3', '0.8')}, transparent)`, opacity: 0, transition: 'opacity 0.3s ease' }} />
                  </div>
                </RevealCard>
              );
            })}
          </div>

        </div>
      </section>

      {/* ── ABOUT ── */}
      <section id="about" className="diagonal-bg" style={{ padding: '100px 24px', background: '#FFFFFF', position: 'relative', overflow: 'hidden' }}>
        {/* Decorative blobs */}
        <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(212,160,23,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>
            {/* Left text */}
            <RevealSection>
              <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '11px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#D4A017' }}>Sobre Nosotros</span>
              <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 'clamp(26px, 3vw, 44px)', lineHeight: 1.15, color: '#111111', margin: '14px 0 20px' }}>
                Más de una década<br /><span className="gold-gradient-text">innovando la publicidad</span><br />en Honduras
              </h2>
              {/* Gold left-border quote */}
              <div style={{ borderLeft: '3px solid #D4A017', paddingLeft: '20px', marginBottom: '24px' }}>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '15px', fontStyle: 'italic', color: 'rgba(10,10,10,0.7)', lineHeight: 1.8 }}>
                  "Desde 2012, {company.name} se ha consolidado como referente en publicidad impresa y rotulación en Honduras."
                </p>
              </div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14.5px', color: 'rgba(10,10,10,0.6)', lineHeight: 1.8, marginBottom: '32px' }}>
                Representamos las mejores marcas internacionales en maquinaria, tintas e insumos. Nuestro equipo de profesionales está comprometido con brindar soluciones personalizadas a cada cliente.
              </p>
              <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
                {[{ n: 50, s: '+', l: 'Marcas' }, { n: 5, s: '', l: 'Líneas producto' }, { n: 3, s: '', l: 'Sucursales' }].map(({ n, s, l }) => (
                  <div key={l} style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: '40px', color: '#D4A017', lineHeight: 1 }}>
                      <AnimatedCounter target={n} suffix={s} />
                    </div>
                    <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: 'rgba(10,10,10,0.5)', marginTop: '6px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{l}</div>
                  </div>
                ))}
              </div>
            </RevealSection>

            {/* Right icon grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {[
                { icon: Factory, title: 'Maquinaria', desc: 'Importación y venta de equipos industriales de primera línea.' },
                { icon: Printer, title: 'Impresión', desc: 'Tecnología digital de punta en impresión gran formato.' },
                { icon: Palette, title: 'Rotulación', desc: 'Diseño y fabricación de rótulos corporativos únicos.' },
                { icon: Wrench, title: 'Soporte', desc: 'Mantenimiento preventivo, correctivo y repuestos.' },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <RevealCard key={i} delay={i * 100}>
                    <div style={{
                      background: '#FAFAFA', border: '1px solid rgba(0,0,0,0.05)',
                      borderRadius: '14px', padding: '24px 20px', transition: 'all 0.3s ease',
                    }}
                      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = '#FFFFFF'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(212,160,23,0.3)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 30px rgba(0,0,0,0.05)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = '#FAFAFA'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,0,0,0.05)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}>
                      <Icon style={{ width: '28px', height: '28px', color: '#D4A017', marginBottom: '12px' }} />
                      <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: '15px', color: '#111111', marginBottom: '6px' }}>{item.title}</div>
                      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '12.5px', color: 'rgba(10,10,10,0.6)', lineHeight: 1.6 }}>{item.desc}</div>
                    </div>
                  </RevealCard>
                );
              })}
            </div>
          </div>
        </div>

        <style>{`@media (max-width: 768px) { #about > div > div { grid-template-columns: 1fr !important; gap: 48px !important; } }`}</style>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" style={{ padding: '100px 24px', background: '#FAFAFA', position: 'relative', overflow: 'hidden' }}>
        <div className="dot-pattern" style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.6 }} />
        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
          <RevealSection>
            <div style={{ textAlign: 'center', marginBottom: '64px' }}>
              <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '11px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#D4A017' }}>Testimonios</span>
              <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 'clamp(26px, 3.5vw, 46px)', lineHeight: 1.15, color: '#111111', margin: '14px 0' }}>
                Lo que dicen nuestros <span className="gold-gradient-text">clientes</span>
              </h2>
            </div>
          </RevealSection>

          {/* Grid of 3 visible at a time */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '40px' }}>
            {[0, 1, 2].map(offset => {
              const t = testimonials[(tSlide + offset) % testimonials.length];
              return (
                <div key={`${tSlide}-${offset}`} className="testimonial-card" style={{
                  background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.05)',
                  borderRadius: '18px', padding: '32px 28px',
                  animation: 'fadeUp 0.5s ease-out both',
                  animationDelay: `${offset * 80}ms`,
                }}>
                  <div style={{ display: 'flex', gap: '3px', marginBottom: '18px' }}>
                    {[...Array(t.rating)].map((_, j) => (
                      <Star key={j} style={{ width: '16px', height: '16px', fill: '#F5C842', color: '#F5C842' }} />
                    ))}
                  </div>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(10,10,10,0.75)', lineHeight: 1.8, marginBottom: '24px', fontStyle: 'italic' }}>
                    "{t.text}"
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '42px', height: '42px', borderRadius: '50%',
                      background: 'linear-gradient(135deg, #D4A017, #B8860B)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: '18px', color: '#0A0A0A',
                      flexShrink: 0,
                    }}>
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: '14px', color: '#111111' }}>{t.name}</div>
                      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: '#D4A017' }}>{t.company}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center' }}>
            <button onClick={() => setTSlide(s => (s - 1 + testimonials.length) % testimonials.length)}
              style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.08)', color: '#111111', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(212,160,23,0.1)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(212,160,23,0.4)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,0.03)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(0,0,0,0.08)'; }}>
              <ChevronLeft style={{ width: '16px', height: '16px' }} />
            </button>
            {testimonials.map((_, i) => (
              <button key={i} onClick={() => setTSlide(i)} style={{
                borderRadius: '100px', border: 'none', cursor: 'pointer',
                background: i === tSlide ? '#F5C842' : 'rgba(0,0,0,0.15)',
                width: i === tSlide ? '24px' : '7px', height: '7px',
                transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
              }} />
            ))}
            <button onClick={() => setTSlide(s => (s + 1) % testimonials.length)}
              style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.08)', color: '#111111', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(212,160,23,0.1)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(212,160,23,0.4)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,0,0,0.03)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(0,0,0,0.08)'; }}>
              <ChevronRight style={{ width: '16px', height: '16px' }} />
            </button>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section style={{ background: 'linear-gradient(135deg, #D4A017 0%, #F5C842 40%, #B8860B 100%)', padding: '80px 24px', position: 'relative', overflow: 'hidden' }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: '-60px', left: '-60px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(0,0,0,0.06)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-80px', right: '-40px', width: '350px', height: '350px', borderRadius: '50%', background: 'rgba(0,0,0,0.05)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <RevealSection>
            <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '11px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(10,10,10,0.6)' }}>
              ¿Listo para empezar?
            </span>
            <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: 'clamp(28px, 4vw, 54px)', color: '#0A0A0A', lineHeight: 1.1, margin: '14px 0 20px' }}>
              Hagamos realidad tu<br />próximo proyecto
            </h2>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '16px', color: 'rgba(10,10,10,0.65)', marginBottom: '36px', lineHeight: 1.7 }}>
              Cotizaciones sin compromiso · Entrega a tiempo · Calidad garantizada
            </p>
            <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => scrollTo('contact')}
                style={{
                  background: '#0A0A0A', color: '#F5C842',
                  fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: '13px',
                  letterSpacing: '0.12em', textTransform: 'uppercase',
                  padding: '15px 32px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.25)', transition: 'all 0.3s ease',
                  display: 'flex', alignItems: 'center', gap: '8px',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 14px 36px rgba(0,0,0,0.35)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.25)'; }}>
                Solicitar Cotización <ChevronRight style={{ width: '16px', height: '16px' }} />
              </button>
              <a href={`https://wa.me/${company.whatsapp}?text=Hola%2C%20quiero%20una%20cotizaci%C3%B3n`}
                target="_blank" rel="noopener noreferrer"
                style={{
                  background: '#25D366', color: '#fff',
                  fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: '13px',
                  letterSpacing: '0.1em', textTransform: 'uppercase',
                  padding: '15px 28px', borderRadius: '10px',
                  boxShadow: '0 8px 24px rgba(37,211,102,0.35)', transition: 'all 0.3s ease',
                  display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)'; }}>
                <MessageCircle style={{ width: '18px', height: '18px' }} />
                WhatsApp
              </a>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact" style={{ padding: '100px 24px', background: '#FFFFFF', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(212,160,23,0.4), transparent)' }} />
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'start' }}>
            {/* Left */}
            <RevealSection>
              <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '11px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#D4A017' }}>Contacto</span>
              <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: 'clamp(26px, 3vw, 44px)', lineHeight: 1.15, color: '#111111', margin: '14px 0 20px' }}>
                Hablemos de tu<br /><span className="gold-gradient-text">próximo proyecto</span>
              </h2>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14.5px', color: 'rgba(10,10,10,0.65)', lineHeight: 1.8, marginBottom: '36px' }}>
                Estamos listos para asesorarte y brindarte la mejor solución. Cotizamos sin compromiso.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '36px' }}>
                {[
                  { icon: <Mail style={{ width: '18px', height: '18px' }} />, title: company.email, sub: 'Escríbenos en cualquier momento' },
                  { icon: <Phone style={{ width: '18px', height: '18px' }} />, title: company.phone, sub: 'Lun–Vie 8am – 5pm' },
                  { icon: <MapPin style={{ width: '18px', height: '18px' }} />, title: company.address, sub: 'Honduras, CA' },
                ].map((row, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
                      background: 'rgba(212,160,23,0.1)', border: '1px solid rgba(212,160,23,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D4A017',
                    }}>{row.icon}</div>
                    <div>
                      <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: '14px', color: '#111111' }}>{row.title}</div>
                      <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(10,10,10,0.55)', marginTop: '2px' }}>{row.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Social links */}
              <div style={{ display: 'flex', gap: '10px' }}>
                {[
                  { show: company.facebook !== '#', href: company.facebook, icon: <Facebook style={{ width: '17px', height: '17px' }} /> },
                  { show: company.instagram !== '#', href: company.instagram, icon: <Instagram style={{ width: '17px', height: '17px' }} /> },
                  { show: company.linkedin !== '#', href: company.linkedin, icon: <Linkedin style={{ width: '17px', height: '17px' }} /> },
                  { show: company.youtube !== '#', href: company.youtube, icon: <Youtube style={{ width: '17px', height: '17px' }} /> },
                ].filter(s => s.show).map((s, i) => (
                  <a key={i} href={s.href} target="_blank" rel="noopener noreferrer"
                    style={{
                      width: '40px', height: '40px', borderRadius: '10px',
                      background: 'rgba(212,160,23,0.08)', border: '1px solid rgba(212,160,23,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#D4A017', textDecoration: 'none', transition: 'all 0.25s ease',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(212,160,23,0.2)'; (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(212,160,23,0.08)'; (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)'; }}>
                    {s.icon}
                  </a>
                ))}
              </div>
            </RevealSection>

            {/* Right — form */}
            <RevealSection>
              <div style={{ background: '#FAFAFA', border: '1px solid rgba(0,0,0,0.05)', borderRadius: '20px', padding: '40px 36px' }}>
                {sent ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px', padding: '32px 0' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'floatY 2s ease-in-out infinite' }}>
                      <svg style={{ width: '32px', height: '32px', color: '#22C55E' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: '22px', color: '#111111' }}>¡Mensaje enviado!</div>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(10,10,10,0.65)' }}>Te contactaremos muy pronto. ¡Gracias!</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: '20px', color: '#111111', marginBottom: '4px' }}>
                      Solicita tu cotización
                    </div>
                    {[
                      { label: 'Nombre', key: 'nombre', placeholder: 'Tu nombre completo', req: true },
                      { label: 'Teléfono', key: 'telefono', placeholder: '+504 9999-9999', req: false },
                      { label: 'Empresa', key: 'empresa', placeholder: 'Nombre de tu empresa', req: false },
                      { label: 'Correo', key: 'correo', placeholder: 'correo@ejemplo.com', req: true, type: 'email' },
                    ].map(({ label, key, placeholder, req, type }) => (
                      <div key={key}>
                        <label style={{ display: 'block', fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(10,10,10,0.6)', marginBottom: '7px' }}>
                          {label} {req && <span style={{ color: '#D4A017' }}>*</span>}
                        </label>
                        <input required={req} type={type || 'text'}
                          value={(form as any)[key]}
                          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                          placeholder={placeholder}
                          className="form-input" />
                      </div>
                    ))}
                    <div>
                      <label style={{ display: 'block', fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(10,10,10,0.6)', marginBottom: '7px' }}>
                        Mensaje <span style={{ color: '#D4A017' }}>*</span>
                      </label>
                      <textarea required value={form.mensaje}
                        onChange={e => setForm(f => ({ ...f, mensaje: e.target.value }))}
                        rows={3} placeholder="¿En qué podemos ayudarte?"
                        className="form-input" style={{ resize: 'vertical', minHeight: '90px' }} />
                    </div>
                    <button type="submit" disabled={formLoading} className="shimmer-btn"
                      style={{
                        position: 'relative', overflow: 'hidden',
                        background: formLoading ? 'rgba(212,160,23,0.4)' : 'linear-gradient(135deg, #D4A017, #F5C842 50%, #B8860B)',
                        color: '#0A0A0A', fontFamily: "'Outfit', sans-serif", fontWeight: 800,
                        fontSize: '13px', letterSpacing: '0.12em', textTransform: 'uppercase',
                        padding: '14px', borderRadius: '10px', border: 'none', cursor: formLoading ? 'not-allowed' : 'pointer',
                        boxShadow: formLoading ? 'none' : '0 6px 24px rgba(212,160,23,0.35)',
                        transition: 'all 0.3s ease', marginTop: '4px',
                      }}>
                      {formLoading ? 'Enviando...' : 'Enviar Mensaje →'}
                    </button>
                  </form>
                )}
              </div>
            </RevealSection>
          </div>
        </div>
        <style>{`@media (max-width: 768px) { #contact > div > div { grid-template-columns: 1fr !important; gap: 48px !important; } }`}</style>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#050505', borderTop: '1px solid rgba(212,160,23,0.1)', padding: '64px 24px 32px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '48px', marginBottom: '48px' }}>
            {/* Brand */}
            <div style={{ gridColumn: 'span 1' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <img src={LOGO_BASE64} alt={company.name} style={{ width: '36px', height: '36px', objectFit: 'contain', filter: 'brightness(1.2)' }} />
                <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: '14px', letterSpacing: '0.12em', color: '#F5F0E8', textTransform: 'uppercase' }}>{company.name}</span>
              </div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12.5px', color: 'rgba(245,240,232,0.3)', lineHeight: 1.8 }}>
                {company.slogan}. Expertos en publicidad impresa, rotulación y maquinaria en Honduras.
              </p>
              {/* Gold divider */}
              <div style={{ width: '40px', height: '2px', background: 'linear-gradient(90deg, #D4A017, transparent)', marginTop: '20px', borderRadius: '2px' }} />
            </div>
            {/* Links */}
            <div>
              <h4 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#F5F0E8', marginBottom: '20px' }}>Navegación</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[['services', 'Servicios'], ['about', 'Nosotros'], ['testimonials', 'Clientes'], ['contact', 'Contacto']].map(([id, label]) => (
                  <button key={id} onClick={() => scrollTo(id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(245,240,232,0.35)', transition: 'color 0.2s', padding: 0 }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#D4A017')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(245,240,232,0.35)')}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {/* Contact */}
            <div>
              <h4 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#F5F0E8', marginBottom: '20px' }}>Contáctanos</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[company.email, company.phone, company.address].map((item, i) => (
                  <p key={i} style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(245,240,232,0.35)', margin: 0 }}>{item}</p>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div style={{ borderTop: '1px solid rgba(212,160,23,0.08)', paddingTop: '28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(245,240,232,0.2)' }}>
              © {new Date().getFullYear()} {company.name}. Todos los derechos reservados.
            </span>
            <button onClick={onEnter}
              style={{
                background: 'none', fontFamily: "'Inter', sans-serif", fontSize: '12px',
                color: 'rgba(245,240,232,0.2)', border: '1px solid rgba(245,240,232,0.08)',
                borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', transition: 'all 0.25s',
                letterSpacing: '0.05em',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#D4A017'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(212,160,23,0.3)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(245,240,232,0.2)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(245,240,232,0.08)'; }}>
              Acceso interno
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ─── Utility components ─── */
function RevealSection({ children }: { children: React.ReactNode }) {
  const { ref, visible } = useScrollReveal(0.08);
  return (
    <div ref={ref} style={{ transition: 'all 0.7s cubic-bezier(0.4, 0, 0.2, 1)', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(32px)' }}>
      {children}
    </div>
  );
}

function RevealCard({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, visible } = useScrollReveal(0.06);
  return (
    <div ref={ref} style={{ transition: `all 0.65s cubic-bezier(0.4, 0, 0.2, 1) ${delay}ms`, opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(28px)' }}>
      {children}
    </div>
  );
}
