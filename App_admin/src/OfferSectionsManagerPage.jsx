import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Edit3, Trash2, ArrowUp, ArrowDown, Upload, Loader2, Save, Send, Eye, EyeOff, 
  Settings, Check, AlertTriangle, ArrowLeft, Star, ShoppingCart, Search, Share2, 
  ChevronDown, ChevronUp, Bell, Image as ImageIcon, Sparkles, BookOpen, Layers, Info
} from 'lucide-react';
import { supabase } from './lib/supabase';
import { uploadToR2 } from './lib/r2';

const DEFAULT_BG = 'https://images.unsplash.com/photo-1608976328321-2f9b229f3e08?auto=format&fit=crop&w=800&q=80';
const DEFAULT_THUMB = 'https://images.unsplash.com/photo-1567591974574-e852636b14a3?auto=format&fit=crop&w=300&q=80';

// Helper to auto-generate unique slug
const slugify = (text) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
};

// --- Subcomponent: Sacred Tilak Icon matching the premium Vedic design ---
const SacredTilak = () => (
  <div style={{
    width: '10px', height: '12px', borderLeft: '1.5px solid #f97316', borderRight: '1.5px solid #f97316',
    borderBottom: '1.5px solid #f97316', borderBottomLeftRadius: '5px', borderBottomRightRadius: '5px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2px', marginRight: '2px',
    flexShrink: 0, position: 'relative'
  }}>
    <div style={{ width: '3.5px', height: '5px', borderRadius: '1.75px', backgroundColor: '#dc2626', marginTop: '-2px' }} />
  </div>
);

// --- Subcomponent: Simulator Bottom Navigation Mock ---
const SimulatorBottomNav = () => (
  <div style={{
    position: 'absolute', bottom: 0, left: 0, right: 0, height: '48px',
    backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0', display: 'flex',
    justifyContent: 'space-around', alignItems: 'center', zIndex: 100, paddingBottom: '2px'
  }}>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
      <span style={{ fontSize: '14px', color: '#64748b' }}>🏠</span>
      <span style={{ fontSize: '8px', color: '#64748b', fontWeight: 'bold', marginTop: '1px' }}>Home</span>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
      <span style={{ fontSize: '14px', color: '#ea580c', textShadow: '0 0 6px rgba(234,88,12,0.3)' }}>🔸</span>
      <span style={{ fontSize: '8px', color: '#ea580c', fontWeight: '900', marginTop: '1px' }}>Puja</span>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
      <span style={{ fontSize: '14px', color: '#64748b' }}>🕉️</span>
      <span style={{ fontSize: '8px', color: '#64748b', fontWeight: 'bold', marginTop: '1px' }}>God</span>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
      <span style={{ fontSize: '14px', color: '#64748b' }}>🌙</span>
      <span style={{ fontSize: '8px', color: '#64748b', fontWeight: 'bold', marginTop: '1px' }}>Astro</span>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
      <span style={{ fontSize: '14px', color: '#64748b' }}>🎵</span>
      <span style={{ fontSize: '8px', color: '#64748b', fontWeight: 'bold', marginTop: '1px' }}>Music</span>
    </div>
  </div>
);

// --- Subcomponent: Simulator Top Header Bar Mock ---
const SimulatorTopHeader = () => (
  <div style={{
    height: '42px', width: '100%', backgroundColor: '#ffffff',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '0 12px', borderBottom: '1px solid #f1f5f9', zIndex: 100, position: 'relative'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <div style={{
        width: '26px', height: '26px', borderRadius: '50%',
        background: 'linear-gradient(135deg, #fed7aa 0%, #ffedd5 100%)',
        border: '1.5px solid #ea580c', overflow: 'hidden', display: 'flex',
        alignItems: 'center', justifyContent: 'center'
      }}>
        <span style={{ fontSize: '12px' }}>👦</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '9px', fontWeight: '900', color: '#1e293b', lineHeight: '10px' }}>Sahil Patel</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginTop: '1px' }}>
          <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#22c55e' }} />
          <span style={{ fontSize: '7.5px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>Online</span>
        </div>
      </div>
    </div>

    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <span style={{ fontSize: '12px', color: '#475569', cursor: 'pointer' }}>🛒</span>
      <span style={{ fontSize: '12px', color: '#475569', cursor: 'pointer' }}>💼</span>
      <span style={{ fontSize: '12px', color: '#475569', cursor: 'pointer' }}>🔗</span>
      <div style={{ position: 'relative' }}>
        <span style={{ fontSize: '12px', color: '#475569', cursor: 'pointer' }}>🔔</span>
        <div style={{ position: 'absolute', top: '-1px', right: '-1px', width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#dc2626' }} />
      </div>
    </div>
  </div>
);

// --- Subcomponent: Live Curated Feed Page (Demo 1) ---
const SectionPreview = ({ section, pujas, onSelectPuja }) => {
  const bgImg = section.background_image_url || DEFAULT_BG;

  // Static Days list matching mobile app details precisely
  const DAYS_MOCKS = [
    { name: 'SHIVA', day: 'Mon', symbol: '🔱', color: '#2563eb', bg: '#eff6ff', glow: '#bfdbfe', pill: 'Peace & Blessings' },
    { name: 'HANUMAN', day: 'Tue', symbol: '📿', color: '#ea580c', bg: '#fff7ed', glow: '#fed7aa', pill: 'Strength' },
    { name: 'GANESHA', day: 'Wed', symbol: '🐘', color: '#e11d48', bg: '#fff1f2', glow: '#fecdd3', pill: 'Vighna' },
    { name: 'VISHNU', day: 'Thu', symbol: '🎡', color: '#ca8a04', bg: '#fefce8', glow: '#fef08a', pill: 'Auspicious' }
  ];

  return (
    <div style={{
      width: '100%', height: 'calc(100% - 48px)', display: 'flex', flexDirection: 'column',
      background: '#ffffff', fontFamily: '"Outfit", sans-serif', overflowY: 'auto',
      paddingBottom: '24px', position: 'relative'
    }}>
      {/* Mock Header profile + icons */}
      <SimulatorTopHeader />

      {/* Mock Top Item Banner Card */}
      <div style={{ padding: '8px 12px 0 12px', textAlign: 'left' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
          <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#ef4444' }}>🔸 Maha Laxmi Puja</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '10px', color: '#94a3b8', textDecoration: 'line-through' }}>₹751</span>
            <div style={{ backgroundColor: '#ffd60a', padding: '0px 3px', borderRadius: '2px', border: '0.5px solid #000', boxShadow: '1px 1px 0px #000' }}>
              <span style={{ fontSize: '8px', fontWeight: '900', color: '#000' }}>₹1</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginLeft: 'auto' }}>
              <span style={{ fontSize: '8px', color: '#f59e0b' }}>★</span>
              <span style={{ fontSize: '8.5px', color: '#64748b', fontWeight: 'bold' }}>4.9 (280)</span>
            </div>
          </div>
          <span style={{ fontSize: '8px', color: '#ea580c', fontWeight: 'bold', marginTop: '1px' }}>Mahalakshmi Temple</span>
        </div>
      </div>

      {/* Main Curated Section Feed Banner matching the exact reference image */}
      <div style={{
        marginTop: '10px', width: '100%', minHeight: '235px',
        backgroundColor: '#cbd5e1',
        position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
        padding: '16px 12px 14px 12px', overflow: 'hidden'
      }}>
        {bgImg && (
          <img 
            src={bgImg} 
            alt="Section Background" 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              zIndex: 0
            }}
          />
        )}
        {/* Dynamic Dark Gradient Overlay matching public.offer_sections */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'linear-gradient(to bottom, rgba(0, 18, 31, 0.4) 0%, rgba(0, 18, 31, 0.8) 100%)',
          zIndex: 1
        }} />

        {/* Section Live Badges */}
        <div style={{
          position: 'absolute', top: '10px', right: '10px',
          background: section.status === 'published' ? 'rgba(16, 185, 129, 0.9)' : 'rgba(234, 88, 12, 0.9)',
          backdropFilter: 'blur(4px)', color: 'white', padding: '2px 6px',
          borderRadius: '10px', fontSize: '7.5px', fontWeight: 'bold', zIndex: 10,
          letterSpacing: '0.05em'
        }}>
          {section.status === 'published' ? 'LIVE SYNCED' : 'LOCAL DRAFT'}
        </div>

        {/* Dynamic Header Texts */}
        <div style={{ zIndex: 2, display: 'flex', flexDirection: 'column', gap: '3px', textAlign: 'left', marginBottom: '8px' }}>
          <h2 style={{ 
            margin: 0, fontSize: '19px', fontWeight: '900', color: '#ffffff', 
            textShadow: '0 2px 4px rgba(0,0,0,0.6)', letterSpacing: '-0.3px', lineHeight: '22px'
          }}>
            {section.title || 'Mangal Dosh Special Puja'}
          </h2>
          <p style={{ 
            margin: 0, fontSize: '10px', color: 'rgba(255,255,255,0.95)', 
            fontWeight: '600', opacity: 0.9, lineHeight: '13px', width: '85%' 
          }}>
            {section.subtitle || 'Special rituals for marriage obstacles and Mangal Grah peace'}
          </p>
        </div>

        {/* Horizontal White Card Scroller MATCHING REFERENCE IMAGE */}
        <div style={{ zIndex: 5, marginTop: '8px', width: '100%' }}>
          <div style={{
            display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px',
            scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch'
          }}>
            {pujas && pujas.length > 0 ? (
              pujas.map((p, idx) => (
                <div 
                  key={idx}
                  onClick={() => onSelectPuja(p, idx)}
                  style={{
                    width: '98px', height: '102px', flexShrink: 0, cursor: 'pointer',
                    backgroundColor: '#ffffff', borderRadius: '10px', overflow: 'hidden',
                    border: '1px solid #ffffff', display: 'flex', flexDirection: 'column',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.15)', transform: 'translateZ(0)'
                  }}
                >
                  {/* Top Image */}
                  <div style={{ width: '100%', height: '70px', backgroundColor: '#e2e8f0', overflow: 'hidden', position: 'relative' }}>
                    <img 
                      src={p.thumbnail_url || DEFAULT_THUMB} 
                      alt="Puja Card" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                    {p.badge_text && (
                      <div style={{
                        position: 'absolute', top: '3px', left: '3px', backgroundColor: '#dc2626',
                        color: '#ffffff', padding: '1px 3px', borderRadius: '2px', fontSize: '6.5px', fontWeight: 'bold'
                      }}>
                        {p.badge_text}
                      </div>
                    )}
                  </div>
                  {/* Bottom White Label */}
                  <div style={{
                    width: '100%', flex: 1, backgroundColor: '#ffffff', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', padding: '2px 4px'
                  }}>
                    <span style={{
                      fontSize: '8px', fontWeight: '900', color: '#1e293b', textAlign: 'center',
                      lineHeight: '9.5px', overflow: 'hidden', display: '-webkit-box',
                      WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'
                    }}>
                      {p.title || 'Mangal Puja'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '10px', padding: '12px 0', textAlign: 'center', width: '100%' }}>
                No active cards. Click 'Add Puja Card' below!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RITUALS OF THE DAY Section - Exactly Matching Layout below Curated Banner */}
      <div style={{ padding: '16px 12px 0 12px', textAlign: 'left' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontSize: '13px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.2px' }}>
            RITUALS OF THE DAY
          </span>
          <div style={{ 
            backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', 
            borderRadius: '12px', padding: '3px 8px', display: 'flex', alignItems: 'center' 
          }}>
            <span style={{ color: '#2563eb', fontSize: '7.5px', fontWeight: '900' }}>
              Today's Energy: Shiva ✨
            </span>
          </div>
        </div>

        {/* Days circle icons display */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '4px', overflowX: 'auto', paddingBottom: '4px' }}>
          {DAYS_MOCKS.map((d, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', flexShrink: 0, width: '64px' }}>
              <div style={{
                width: '42px', height: '42px', borderRadius: '50%', backgroundColor: d.bg,
                border: `1.5px solid ${d.glow}`, display: 'flex', alignItems: 'center',
                justifyContent: 'center', boxShadow: `0 2px 6px ${d.glow}`, position: 'relative'
              }}>
                <span style={{ fontSize: '18px' }}>{d.symbol}</span>
                {i === 0 && (
                  <div style={{
                    position: 'absolute', top: '-6px', backgroundColor: '#ef4444',
                    color: 'white', fontSize: '6px', fontWeight: 'bold', padding: '1px 3.5px', borderRadius: '6px'
                  }}>Today</div>
                )}
              </div>
              <span style={{ fontSize: '8px', fontWeight: '900', color: '#1e293b', marginTop: '1px' }}>{d.name}</span>
              <span style={{ fontSize: '7px', color: '#64748b', fontWeight: '600' }}>{d.day}</span>
              <div style={{
                backgroundColor: d.bg, padding: '1.5px 4px', borderRadius: '6px',
                border: `0.5px solid ${d.glow}`, marginTop: '1px'
              }}>
                <span style={{ fontSize: '6px', fontWeight: 'bold', color: d.color }}>{d.pill}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- Subcomponent: Live Puja Detailed View Page (Demo 2) ---
const PujaDetailPreview = ({ puja, onBack }) => {
  const bannerImg = puja.hero_banner_url || puja.thumbnail_url || DEFAULT_THUMB;
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div style={{
      width: '100%', height: 'calc(100% - 48px)', background: '#f8fafc',
      fontFamily: '"Outfit", sans-serif', color: '#1e293b', overflowY: 'auto', textAlign: 'left',
      position: 'relative', paddingBottom: '24px'
    }}>
      {/* Immersive Hero Header */}
      <div style={{ height: '150px', width: '100%', position: 'relative', backgroundColor: '#cbd5e1' }}>
        <img src={bannerImg} alt="Hero Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '40px',
          background: 'linear-gradient(to top, rgba(248, 250, 252, 1) 0%, rgba(248, 250, 252, 0) 100%)'
        }} />
        
        {/* Floating Back Action */}
        <button 
          onClick={onBack}
          style={{
            position: 'absolute', top: '10px', left: '10px',
            backgroundColor: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: '50%',
            width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)', cursor: 'pointer', color: '#1e293b'
          }}
        >
          <ArrowLeft size={15} />
        </button>

        {/* Live Status Tag */}
        <div style={{
          position: 'absolute', top: '10px', right: '10px',
          backgroundColor: '#ea580c', color: 'white', padding: '2px 5px',
          borderRadius: '4px', fontSize: '7px', fontWeight: 'bold',
          boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
        }}>
          DETAIL PREVIEW
        </div>
      </div>

      {/* Consecrated Indicator Box */}
      <div style={{ padding: '0 12px', marginTop: '-6px', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '3px' }}>
          <SacredTilak />
          <span style={{ color: '#ea580c', fontSize: '8px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
            Pure Vedic Devotional Seva
          </span>
        </div>
        <h1 style={{ fontSize: '15px', fontWeight: '900', margin: '2px 0', color: '#0f172a', lineHeight: '18px' }}>
          {puja.title || 'Dynamic Puja'}
        </h1>
        <p style={{ margin: '0 0 8px 0', fontSize: '9.5px', color: '#64748b', lineHeight: '13px' }}>
          {puja.short_description || 'Personalized Sankalp and blessed temple Prasad.'}
        </p>

        {/* Rating Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
          <div style={{ backgroundColor: '#ea580c', color: 'white', padding: '1.5px 4.5px', borderRadius: '3px', display: 'flex', alignItems: 'center', gap: '2px' }}>
            <Star size={8} fill="white" stroke="none" />
            <span style={{ fontSize: '8.5px', fontWeight: 'bold' }}>4.9</span>
          </div>
          <span style={{ fontSize: '9px', color: '#64748b', fontWeight: '500' }}>
            280+ devotees joined
          </span>
        </div>

        {/* Accordions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
          {/* Overview */}
          <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div 
              onClick={() => setActiveTab(activeTab === 'overview' ? '' : 'overview')}
              style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' }}
            >
              <span>Divine Overview</span>
              <span>{activeTab === 'overview' ? '▲' : '▼'}</span>
            </div>
            {activeTab === 'overview' && (
              <div style={{ padding: '0 12px 10px 12px', fontSize: '9.5px', color: '#475569', lineHeight: '13.5px', borderTop: '0.5px solid #f1f5f9', paddingTop: '6px' }}>
                {puja.overview || 'Overview details represent the Vedic context of the ritual.'}
              </div>
            )}
          </div>

          {/* Benefits */}
          <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div 
              onClick={() => setActiveTab(activeTab === 'benefits' ? '' : 'benefits')}
              style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' }}
            >
              <span>Auspicious Benefits</span>
              <span>{activeTab === 'benefits' ? '▲' : '▼'}</span>
            </div>
            {activeTab === 'benefits' && (
              <div style={{ padding: '0 12px 10px 12px', fontSize: '9.5px', color: '#475569', lineHeight: '13.5px', borderTop: '0.5px solid #f1f5f9', paddingTop: '6px', whiteSpace: 'pre-wrap' }}>
                {puja.benefits || '• Bestows blessings for wealth & fortune.\n• Clears planetary doshas.'}
              </div>
            )}
          </div>

          {/* Rituals */}
          <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div 
              onClick={() => setActiveTab(activeTab === 'rituals' ? '' : 'rituals')}
              style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' }}
            >
              <span>Rituals & Steps</span>
              <span>{activeTab === 'rituals' ? '▲' : '▼'}</span>
            </div>
            {activeTab === 'rituals' && (
              <div style={{ padding: '0 12px 10px 12px', fontSize: '9.5px', color: '#475569', lineHeight: '13.5px', borderTop: '0.5px solid #f1f5f9', paddingTop: '6px', whiteSpace: 'pre-wrap' }}>
                {puja.rituals || '1. Sankalp Recitation.\n2. Altar Flower offering.'}
              </div>
            )}
          </div>

          {/* Samagri */}
          <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div 
              onClick={() => setActiveTab(activeTab === 'samagri' ? '' : 'samagri')}
              style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' }}
            >
              <span>Vedic Samagri</span>
              <span>{activeTab === 'samagri' ? '▲' : '▼'}</span>
            </div>
            {activeTab === 'samagri' && (
              <div style={{ padding: '0 12px 10px 12px', fontSize: '9.5px', color: '#475569', lineHeight: '13.5px', borderTop: '0.5px solid #f1f5f9', paddingTop: '6px' }}>
                {puja.samagri || 'Pure sandalwood, fresh marigold, holy thread, and incense.'}
              </div>
            )}
          </div>

          {/* FAQs */}
          <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div 
              onClick={() => setActiveTab(activeTab === 'faqs' ? '' : 'faqs')}
              style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px' }}
            >
              <span>FAQs</span>
              <span>{activeTab === 'faqs' ? '▲' : '▼'}</span>
            </div>
            {activeTab === 'faqs' && (
              <div style={{ padding: '0 12px 10px 12px', borderTop: '0.5px solid #f1f5f9', paddingTop: '6px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {puja.faq_json && puja.faq_json.length > 0 ? (
                  puja.faq_json.map((f, i) => (
                    <div key={i} style={{ marginBottom: '4px' }}>
                      <div style={{ fontWeight: '700', fontSize: '10px', color: '#0f172a' }}>Q: {f.q}</div>
                      <div style={{ fontSize: '9px', color: '#64748b', marginTop: '1px' }}>A: {f.a}</div>
                    </div>
                  ))
                ) : (
                  <span style={{ fontSize: '9px', color: '#64748b' }}>No FAQs provided.</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Pricing Selection Area inside Detail Demo */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', background: '#ffffff', borderRadius: '8px', padding: '10px', border: '1.5px solid #fed7aa', marginBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '10.5px', fontWeight: '900', color: '#1e293b' }}>Single Sankalp Seva</span>
              <p style={{ margin: 0, fontSize: '8px', color: '#64748b' }}>1 devotee name & gotra Sankalp</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '9px', color: '#94a3b8', textDecoration: 'line-through' }}>{puja.price || '₹751'}</span>
              <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#ea580c' }}>{puja.discounted_price || '₹1'}</span>
            </div>
          </div>
          <button style={{
            background: 'linear-gradient(90deg, #f97316 0%, #ea580c 100%)', border: 'none',
            color: 'white', padding: '5px 0', borderRadius: '6px', fontSize: '9px', fontWeight: '900',
            cursor: 'pointer', textAlign: 'center'
          }}>
            BOOK SINGLE SANKALP
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main CMS Manager Page Component ---
export default function OfferSectionsManagerPage() {
  const [sections, setSections] = useState([]);
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [activeSection, setActiveSection] = useState(null);
  
  // Dynamic locally edited cards containing basic card fields + detail layouts
  const [localCards, setLocalCards] = useState([]);

  // Existing Pujas list for auto-fill dropdown
  const [existingPujasPool, setExistingPujasPool] = useState([]);
  const [selectedPoolId, setSelectedPoolId] = useState('');

  // Loading & Submitting states
  const [loading, setLoading] = useState(true);
  const [savingSection, setSavingSection] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [uploadingBg, setUploadingBg] = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  // Tab & Form Navigation states
  const [formTab, setFormTab] = useState('basic'); // 'basic', 'detail', 'faqs'
  const [editingPuja, setEditingPuja] = useState(null); // Local card being edited in popup
  const [editingCardIndex, setEditingCardIndex] = useState(-1); // -1 for adding new card

  // Simulator Viewport states
  const [selectedSimPuja, setSelectedSimPuja] = useState(null); // The card tapped inside the simulator
  const [simViewMode, setSimViewMode] = useState('feed'); // 'feed' (Demo 1) or 'detail' (Demo 2)

  const bgInputRef = useRef(null);
  const thumbInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  // Section Form state
  const [sectionForm, setSectionForm] = useState({
    title: '',
    subtitle: '',
    description: '',
    background_image_url: '',
    cta_text: 'BOOK NOW',
    cta_link: '',
    is_active: true,
    sort_order: 0
  });

  const fetchSections = async (keepActiveId = null) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('offer_sections')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch card counts for all sections
      const { data: countData } = await supabase
        .from('offer_pujas')
        .select('section_id');

      const cardCounts = {};
      if (countData) {
        countData.forEach(p => {
          if (p.section_id) {
            cardCounts[p.section_id] = (cardCounts[p.section_id] || 0) + 1;
          }
        });
      }

      const sectionsWithCounts = (data || []).map(s => ({
        ...s,
        cardCount: cardCounts[s.id] || 0
      }));

      setSections(sectionsWithCounts);
      
      const targetId = keepActiveId || selectedSectionId;
      const found = sectionsWithCounts.find(s => s.id === targetId);

      if (found) {
        setSelectedSectionId(found.id);
        setActiveSection(found);
        loadSectionDetails(found);
      } else if (sectionsWithCounts.length > 0) {
        const firstSec = sectionsWithCounts[0];
        setSelectedSectionId(firstSec.id);
        setActiveSection(firstSec);
        loadSectionDetails(firstSec);
      } else {
        resetSectionForm();
        setLocalCards([]);
      }
    } catch (err) {
      console.error('Error fetching offer sections:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingPujasPool = async () => {
    try {
      const { data: genData } = await supabase.from('general_poojas').select('*');
      const { data: oneData } = await supabase.from('one_rupee_poojas').select('*');
      
      const pool = [
        ...(genData || []).map(p => ({ ...p, source: 'general' })),
        ...(oneData || []).map(p => ({ ...p, source: 'one_rupee' }))
      ];
      setExistingPujasPool(pool);
    } catch (err) {
      console.error('Error loading existing pujas pool:', err);
    }
  };

  const loadSectionDetails = async (section) => {
    setSectionForm({
      title: section.title || '',
      subtitle: section.subtitle || '',
      description: section.description || '',
      background_image_url: section.background_image_url || '',
      cta_text: section.cta_text || 'BOOK NOW',
      cta_link: section.cta_link || '',
      is_active: section.is_active ?? true,
      sort_order: section.sort_order || 0
    });

    try {
      const { data: cards, error: errCards } = await supabase
        .from('offer_pujas')
        .select('*')
        .eq('section_id', section.id)
        .order('sort_order', { ascending: true });

      if (errCards) throw errCards;

      if (cards && cards.length > 0) {
        const cardIds = cards.map(c => c.id);
        const { data: details, error: errDetails } = await supabase
          .from('puja_details')
          .select('*')
          .in('puja_id', cardIds);

        if (errDetails) throw errDetails;

        const merged = cards.map(c => {
          const det = (details || []).find(d => d.puja_id === c.id) || {};
          return {
            id: c.id,
            section_id: c.section_id,
            slug: c.slug,
            title: c.title,
            short_description: c.short_description || '',
            thumbnail_url: c.thumbnail_url || '',
            badge_text: c.badge_text || '',
            price: c.price || '₹751',
            discounted_price: c.discounted_price || '₹1',
            duration: c.duration || '45 mins',
            is_featured: c.is_featured ?? false,
            is_active: c.is_active ?? true,
            sort_order: c.sort_order || 0,
            
            // Detail layout fields merged inline for easy local array tracking
            detail_id: det.id || null,
            hero_banner_url: det.hero_banner_url || '',
            overview: det.overview || '',
            benefits: det.benefits || '',
            rituals: det.rituals || '',
            samagri: det.samagri || '',
            faq_json: det.faq_json || [],
            gallery_json: det.gallery_json || [],
            temple_name: det.temple_name || '',
            priest_details: det.priest_details || '',
            seo_title: det.seo_title || '',
            seo_description: det.seo_description || ''
          };
        });
        setLocalCards(merged);
      } else {
        setLocalCards([]);
      }

      setEditingPuja(null);
      setEditingCardIndex(-1);
      setSelectedSimPuja(null);
      setSimViewMode('feed');
    } catch (err) {
      console.error('Error loading section child cards:', err);
    }
  };

  useEffect(() => {
    fetchSections();
    fetchExistingPujasPool();
  }, []);

  const handleSectionSelect = (e) => {
    const id = e.target.value;
    setSelectedSectionId(id);
    if (id === 'new') {
      resetSectionForm();
      setActiveSection(null);
      setLocalCards([]);
      setEditingPuja(null);
      setEditingCardIndex(-1);
      setSelectedSimPuja(null);
      setSimViewMode('feed');
    } else {
      const found = sections.find(s => s.id === id);
      if (found) {
        setActiveSection(found);
        loadSectionDetails(found);
      }
    }
  };

  const resetSectionForm = () => {
    setSectionForm({
      title: '',
      subtitle: '',
      description: '',
      background_image_url: '',
      cta_text: 'BOOK NOW',
      cta_link: '',
      is_active: true,
      sort_order: 0
    });
  };

  const handleSectionInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSectionForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSectionBgUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const dataUrl = reader.result;
      setSectionForm(prev => ({
        ...prev,
        background_image_url: dataUrl
      }));

      setUploadingBg(true);
      try {
        const publicUrl = await uploadToR2(file, 'sections');
        setSectionForm(prev => ({
          ...prev,
          background_image_url: publicUrl
        }));
      } catch (err) {
        console.error('Bg upload error:', err);
        alert('Background upload failed: ' + err.message);
      } finally {
        setUploadingBg(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // --- Unified Transactional Save and Publish Process ---
  const handleUnifiedSave = async (isPublishing = false) => {
    if (!sectionForm.title) {
      alert('Section Heading is required to save.');
      return;
    }

    setSavingSection(true);
    const status = isPublishing ? 'published' : 'draft';
    const sectionPayload = {
      ...sectionForm,
      status
    };

    try {
      let sectionId = '';
      
      // 1. Save or Update parent offer_sections row
      if (activeSection) {
        sectionId = activeSection.id;
        const { error } = await supabase
          .from('offer_sections')
          .update(sectionPayload)
          .eq('id', sectionId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('offer_sections')
          .insert([sectionPayload])
          .select();
        if (error) throw error;
        sectionId = data[0].id;
      }

      // If we are publishing, set all OTHER sections to draft
      if (isPublishing) {
        // Set all other sections to draft
        await supabase
          .from('offer_sections')
          .update({ status: 'draft' })
          .neq('id', sectionId);

        // Set all other offer_pujas to draft
        await supabase
          .from('offer_pujas')
          .update({ status: 'draft' })
          .neq('section_id', sectionId);

        // Set all other puja_details to draft
        const { data: otherPujas } = await supabase
          .from('offer_pujas')
          .select('id')
          .neq('section_id', sectionId);
        if (otherPujas && otherPujas.length > 0) {
          const otherPujaIds = otherPujas.map(p => p.id);
          await supabase
            .from('puja_details')
            .update({ status: 'draft' })
            .in('puja_id', otherPujaIds);
        }
      }

      // 2. Clear old children cards to prevent dangling rows in database
      const { error: deleteErr } = await supabase
        .from('offer_pujas')
        .delete()
        .eq('section_id', sectionId);
      if (deleteErr) throw deleteErr;

      // 3. Sequentially insert all localCards into databases
      for (let i = 0; i < localCards.length; i++) {
        const card = localCards[i];
        
        // Save offer_pujas row
        const pujaPayload = {
          section_id: sectionId,
          slug: card.slug || slugify(card.title),
          title: card.title,
          short_description: card.short_description || '',
          thumbnail_url: card.thumbnail_url || '',
          badge_text: card.badge_text || '',
          price: card.price || '₹751',
          discounted_price: card.discounted_price || '₹1',
          duration: card.duration || '45 mins',
          status,
          is_featured: card.is_featured ?? false,
          is_active: card.is_active ?? true,
          sort_order: i
        };

        const { data: newPujaData, error: pujaErr } = await supabase
          .from('offer_pujas')
          .insert([pujaPayload])
          .select();
        if (pujaErr) throw pujaErr;
        const newPujaId = newPujaData[0].id;

        // Save 1:1 puja_details row
        const detailsPayload = {
          puja_id: newPujaId,
          hero_banner_url: card.hero_banner_url || '',
          overview: card.overview || '',
          benefits: card.benefits || '',
          rituals: card.rituals || '',
          samagri: card.samagri || '',
          faq_json: card.faq_json || [],
          gallery_json: card.gallery_json || [],
          temple_name: card.temple_name || '',
          priest_details: card.priest_details || '',
          seo_title: card.seo_title || '',
          seo_description: card.seo_description || '',
          status
        };

        const { error: detailsErr } = await supabase
          .from('puja_details')
          .insert([detailsPayload]);
        if (detailsErr) throw detailsErr;
      }

      alert(isPublishing 
        ? 'Offer section published and go live successfully! Real-time app screens synchronized instantly.' 
        : 'Offer section saved as draft successfully!'
      );

      // Reload lists and keep the newly saved section active
      fetchSections(sectionId);
    } catch (err) {
      console.error('Save all transaction failed:', err);
      alert('Save failed: ' + err.message);
    } finally {
      setSavingSection(false);
    }
  };

  const handleDeleteSection = async () => {
    if (!activeSection) return;
    if (!window.confirm('Are you sure you want to delete this offer section along with all its cards? This cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('offer_sections')
        .delete()
        .eq('id', activeSection.id);
      if (error) throw error;
      alert('Section deleted successfully.');
      fetchSections();
    } catch (err) {
      console.error('Delete section error:', err);
      alert('Delete failed: ' + err.message);
    }
  };

  const handleDuplicateSection = async (section) => {
    if (!window.confirm(`Are you sure you want to duplicate the section "${section.title}"? This will create a new draft copy of all cards.`)) return;
    
    setSavingSection(true);
    try {
      // 1. Fetch all cards and details of the section we are duplicating
      const { data: cards } = await supabase
        .from('offer_pujas')
        .select('*')
        .eq('section_id', section.id)
        .order('sort_order', { ascending: true });

      let details = [];
      if (cards && cards.length > 0) {
        const cardIds = cards.map(c => c.id);
        const { data: detData } = await supabase
          .from('puja_details')
          .select('*')
          .in('puja_id', cardIds);
        details = detData || [];
      }

      // 2. Insert new parent section copy as Draft
      const newSectionPayload = {
        title: `${section.title} (Copy)`,
        subtitle: section.subtitle,
        description: section.description,
        background_image_url: section.background_image_url,
        cta_text: section.cta_text,
        cta_link: section.cta_link,
        status: 'draft',
        is_active: true,
        sort_order: section.sort_order
      };

      const { data: newSecData, error: secErr } = await supabase
        .from('offer_sections')
        .insert([newSectionPayload])
        .select();

      if (secErr) throw secErr;
      const newSecId = newSecData[0].id;

      // 3. Insert new copies of all cards and details
      if (cards && cards.length > 0) {
        for (let i = 0; i < cards.length; i++) {
          const card = cards[i];
          const matchedDetail = details.find(d => d.puja_id === card.id) || {};

          // Insert new card copy
          const pujaPayload = {
            section_id: newSecId,
            slug: `${card.slug}-copy-${Math.floor(Math.random() * 1000)}`, // avoid unique slug constraint just in case it's still active
            title: card.title,
            short_description: card.short_description,
            thumbnail_url: card.thumbnail_url,
            badge_text: card.badge_text,
            price: card.price,
            discounted_price: card.discounted_price,
            duration: card.duration,
            status: 'draft',
            is_featured: card.is_featured,
            is_active: card.is_active,
            sort_order: card.sort_order
          };

          const { data: newPujaData, error: pujaErr } = await supabase
            .from('offer_pujas')
            .insert([pujaPayload])
            .select();
          if (pujaErr) throw pujaErr;
          const newPujaId = newPujaData[0].id;

          // Insert new detail copy
          const detailsPayload = {
            puja_id: newPujaId,
            hero_banner_url: matchedDetail.hero_banner_url,
            overview: matchedDetail.overview,
            benefits: matchedDetail.benefits,
            rituals: matchedDetail.rituals,
            samagri: matchedDetail.samagri,
            faq_json: matchedDetail.faq_json || [],
            gallery_json: matchedDetail.gallery_json || [],
            temple_name: matchedDetail.temple_name,
            priest_details: matchedDetail.priest_details,
            seo_title: matchedDetail.seo_title,
            seo_description: matchedDetail.seo_description,
            status: 'draft'
          };

          const { error: detailsErr } = await supabase
            .from('puja_details')
            .insert([detailsPayload]);
          if (detailsErr) throw detailsErr;
        }
      }

      alert('Section duplicated successfully as Draft! Reloading sections.');
      await fetchSections(newSecId);
    } catch (err) {
      console.error('Error duplicating section:', err);
      alert('Duplication failed: ' + err.message);
    } finally {
      setSavingSection(false);
    }
  };

  const handleTogglePublishSection = async (section) => {
    const nextStatus = section.status === 'published' ? 'draft' : 'published';
    const confirmMsg = nextStatus === 'published' 
      ? `Are you sure you want to publish the section "${section.title}" and sync it to live devices?`
      : `Are you sure you want to unpublish the section "${section.title}" and return it to Draft status?`;
      
    if (!window.confirm(confirmMsg)) return;

    setPublishing(true);
    try {
      // If setting nextStatus to published, unpublish all other sections first!
      if (nextStatus === 'published') {
        // Set all other sections to draft
        await supabase
          .from('offer_sections')
          .update({ status: 'draft' })
          .neq('id', section.id);

        // Set all other offer_pujas to draft
        await supabase
          .from('offer_pujas')
          .update({ status: 'draft' })
          .neq('section_id', section.id);

        // Set all other puja_details to draft
        const { data: otherPujas } = await supabase
          .from('offer_pujas')
          .select('id')
          .neq('section_id', section.id);
        if (otherPujas && otherPujas.length > 0) {
          const otherPujaIds = otherPujas.map(p => p.id);
          await supabase
            .from('puja_details')
            .update({ status: 'draft' })
            .in('puja_id', otherPujaIds);
        }
      }

      // 1. Update parent status
      const { error: secErr } = await supabase
        .from('offer_sections')
        .update({ status: nextStatus })
        .eq('id', section.id);

      if (secErr) throw secErr;

      // 2. Update child cards status
      const { error: pujaErr } = await supabase
        .from('offer_pujas')
        .update({ status: nextStatus })
        .eq('section_id', section.id);

      if (pujaErr) throw pujaErr;

      // 3. Update child details status
      const { data: cards } = await supabase
        .from('offer_pujas')
        .select('id')
        .eq('section_id', section.id);

      if (cards && cards.length > 0) {
        const cardIds = cards.map(c => c.id);
        const { error: detailsErr } = await supabase
          .from('puja_details')
          .update({ status: nextStatus })
          .in('puja_id', cardIds);

        if (detailsErr) throw detailsErr;
      }

      alert(`Section "${section.title}" status changed to ${nextStatus.toUpperCase()} successfully!`);
      await fetchSections(section.id);
    } catch (err) {
      console.error('Toggle status error:', err);
      alert('Failed to change status: ' + err.message);
    } finally {
      setPublishing(false);
    }
  };

  // --- Local Card Operations (No DB writing until Save/Publish is clicked) ---
  const handleAddNewPujaLocal = () => {
    const newPuja = {
      slug: '',
      title: '',
      short_description: '',
      thumbnail_url: '',
      badge_text: '₹1 offer',
      price: '₹751',
      discounted_price: '₹1',
      duration: '45 mins',
      is_featured: false,
      is_active: true,
      
      // Inline detailed layout properties
      hero_banner_url: '',
      overview: '',
      benefits: '',
      rituals: '',
      samagri: '',
      faq_json: [],
      gallery_json: [],
      temple_name: '',
      priest_details: '',
      seo_title: '',
      seo_description: ''
    };
    setEditingPuja(newPuja);
    setEditingCardIndex(-1);
    setFormTab('basic');
    setSimViewMode('feed'); // Reset view mode
    setSelectedPoolId('');
  };

  const handleEditPujaLocal = (idx) => {
    setEditingPuja({ ...localCards[idx] });
    setEditingCardIndex(idx);
    setFormTab('basic');
    setSimViewMode('feed'); // Reset view mode
    setSelectedPoolId('');
  };

  const handleDeletePujaLocal = (idx) => {
    if (!window.confirm('Are you sure you want to remove this puja card from this local offer? Changes are finalized when you click Save/Publish.')) return;
    const updated = [...localCards];
    updated.splice(idx, 1);
    setLocalCards(updated);
  };

  const handleMoveCardLocal = (idx, direction) => {
    const updated = [...localCards];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= updated.length) return;

    // Swap elements in the array
    const temp = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = temp;

    setLocalCards(updated);
  };

  const handlePujaInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditingPuja(prev => {
      const updated = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      };
      // Auto-slugify for new cards
      if (name === 'title') {
        updated.slug = slugify(value);
      }
      return updated;
    });
  };

  const handleDetailInputChange = (e) => {
    const { name, value } = e.target;
    setEditingPuja(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // --- Auto-Fill Import from Database Pool ---
  const handleImportSelect = (e) => {
    const poolId = e.target.value;
    setSelectedPoolId(poolId);
    if (!poolId) return;

    const matched = existingPujasPool.find(p => p.id === poolId);
    if (matched) {
      setEditingPuja(prev => ({
        ...prev,
        title: matched.title || prev.title,
        slug: slugify(matched.title) || prev.slug,
        short_description: matched.tagline || matched.provider || prev.short_description,
        thumbnail_url: matched.image_url || prev.thumbnail_url,
        badge_text: matched.tag || prev.badge_text,
        price: matched.original_price || prev.price,
        discounted_price: matched.offer_price || prev.discounted_price,
        duration: matched.time || prev.duration,
        
        // Dynamic detailed views
        hero_banner_url: matched.image_url || prev.hero_banner_url,
        overview: matched.tagline || prev.overview,
        benefits: matched.benefits || prev.benefits,
        rituals: matched.steps || prev.rituals,
        samagri: matched.samagri || prev.samagri,
        temple_name: matched.temple || matched.provider || prev.temple_name,
        priest_details: matched.pandit || 'Assigned Vedic Acharya',
        faq_json: matched.faqs || prev.faq_json || [],
        seo_title: `${matched.title} - Online Puja Seva`,
        seo_description: `Book a personalized ${matched.title} at ${matched.temple || matched.provider}. Complete video sankalp and sacred prasad box included.`
      }));
    }
  };

  const handleThumbUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const dataUrl = reader.result;
      setEditingPuja(prev => ({
        ...prev,
        thumbnail_url: dataUrl
      }));

      setUploadingThumb(true);
      try {
        const publicUrl = await uploadToR2(file, 'thumbnails');
        setEditingPuja(prev => ({
          ...prev,
          thumbnail_url: publicUrl
        }));
      } catch (err) {
        console.error('Thumb upload error:', err);
        alert('Thumbnail upload failed: ' + err.message);
      } finally {
        setUploadingThumb(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const dataUrl = reader.result;
      setEditingPuja(prev => ({
        ...prev,
        hero_banner_url: dataUrl
      }));

      setUploadingBanner(true);
      try {
        const publicUrl = await uploadToR2(file, 'banners');
        setEditingPuja(prev => ({
          ...prev,
          hero_banner_url: publicUrl
        }));
      } catch (err) {
        console.error('Banner upload error:', err);
        alert('Banner upload failed: ' + err.message);
      } finally {
        setUploadingBanner(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // --- FAQ management inside local editor ---
  const handleFaqChange = (idx, field, val) => {
    const list = [...editingPuja.faq_json];
    list[idx] = { ...list[idx], [field]: val };
    setEditingPuja(prev => ({ ...prev, faq_json: list }));
  };

  const addFaq = () => {
    const list = editingPuja.faq_json ? [...editingPuja.faq_json] : [];
    list.push({ q: '', a: '' });
    setEditingPuja(prev => ({ ...prev, faq_json: list }));
  };

  const removeFaq = (idx) => {
    const list = [...editingPuja.faq_json];
    list.splice(idx, 1);
    setEditingPuja(prev => ({ ...prev, faq_json: list }));
  };

  const handleConfirmSaveLocal = () => {
    if (!editingPuja.title || !editingPuja.slug) {
      alert('Puja Title and URL Slug are required.');
      return;
    }

    const updated = [...localCards];
    if (editingCardIndex >= 0) {
      updated[editingCardIndex] = editingPuja;
    } else {
      updated.push(editingPuja);
    }
    
    setLocalCards(updated);
    setEditingPuja(null);
    setEditingCardIndex(-1);
  };

  // --- Compute current preview list of cards displayed in simulator in real-time ---
  const getDisplayedCardsInSim = () => {
    const list = [...localCards];
    if (editingPuja) {
      if (editingCardIndex >= 0) {
        list[editingCardIndex] = editingPuja;
      } else {
        list.push(editingPuja);
      }
    }
    return list;
  };

  // Get active detail layout card for detailed view page simulator render
  const getActiveSimPujaToRender = () => {
    if (editingPuja) return editingPuja;
    if (selectedSimPuja) return selectedSimPuja;
    if (localCards.length > 0) return localCards[0];
    return null;
  };

  // Automatically alternate simulator view mode based on what tab they click inside Card editor
  const handleFormTabChange = (tabName) => {
    setFormTab(tabName);
    if (tabName === 'basic') {
      setSimViewMode('feed');
    } else {
      setSimViewMode('detail');
    }
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="gradient-text">Offer + Puja Cards CMS</h1>
        <p>Dynamically manage premium Vedic sections, dynamic cards, detail views, and real-time live previews.</p>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1.2fr 0.8fr', 
        gap: '2rem',
        marginTop: '1rem'
      }}>
        
        {/* Left Side: CMS Form controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Section Picker & Basic Settings Card */}
          <div className="glass-card page-card" style={{ height: 'fit-content', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Layers className="text-orange" size={22} />
                <h3 style={{ margin: 0 }}>Vedic Section Management</h3>
              </div>
              <select 
                value={selectedSectionId} 
                onChange={handleSectionSelect}
                style={{
                  padding: '0.5rem 1rem', borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: 'white', fontWeight: 'bold', cursor: 'pointer'
                }}
              >
                <option value="new">+ Create New Section</option>
                {sections.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.title} ({s.status === 'published' ? 'Live' : 'Draft'})
                  </option>
                ))}
              </select>
            </div>

            <form onSubmit={(e) => e.preventDefault()} className="settings-form">
              <div className="form-group">
                <label>Section Heading *</label>
                <input 
                  type="text" 
                  name="title"
                  value={sectionForm.title}
                  onChange={handleSectionInputChange}
                  placeholder="e.g. Mangal Dosh Special Puja"
                  required
                />
              </div>

              <div className="form-group">
                <label>Subheading / Tagline Description</label>
                <input 
                  type="text" 
                  name="subtitle"
                  value={sectionForm.subtitle}
                  onChange={handleSectionInputChange}
                  placeholder="e.g. Special rituals for marriage obstacles and Grah Shanti"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div className="form-group">
                  <label>CTA Button Title</label>
                  <input 
                    type="text" 
                    name="cta_text"
                    value={sectionForm.cta_text}
                    onChange={handleSectionInputChange}
                    placeholder="e.g. BOOK NOW"
                  />
                </div>
                <div className="form-group">
                  <label>CTA Redirection Screen Link</label>
                  <input 
                    type="text" 
                    name="cta_link"
                    value={sectionForm.cta_link}
                    onChange={handleSectionInputChange}
                    placeholder="e.g. /puja_detail?slug=mangal-puja"
                  />
                </div>
              </div>

              {/* R2 Background Uploader */}
              <div className="form-group">
                <label>Section Immersive Background Image</label>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => bgInputRef.current?.click()}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      padding: '0.75rem 1.25rem', borderRadius: '8px',
                      background: '#ea580c', color: 'white', cursor: 'pointer',
                      fontWeight: 'bold', border: 'none', boxShadow: '0 4px 6px rgba(234,88,12,0.2)'
                    }}
                    disabled={uploadingBg}
                  >
                    {uploadingBg ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                    <span>Choose Image</span>
                  </button>
                  <input 
                    type="file" 
                    ref={bgInputRef}
                    accept="image/*"
                    onChange={handleSectionBgUpload}
                    style={{ display: 'none' }}
                  />
                  {sectionForm.background_image_url ? (
                    <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 'bold' }}>
                      ✓ Image loaded and cached successfully
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>
                      No image uploaded yet. Default image will be used.
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', alignItems: 'center' }}>
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => handleUnifiedSave(false)}
                  disabled={savingSection}
                >
                  <Save size={16} style={{ marginRight: '6px' }} />
                  Save Draft
                </button>

                <button 
                  type="button" 
                  className="btn-primary"
                  onClick={() => handleUnifiedSave(true)}
                  disabled={publishing || savingSection}
                >
                  <Send size={16} style={{ marginRight: '6px' }} />
                  Publish & Go Live
                </button>

                {activeSection && (
                  <button 
                    type="button" 
                    className="action-btn-danger"
                    onClick={handleDeleteSection}
                    style={{ marginLeft: 'auto', padding: '0.65rem' }}
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Puja Card Editor Form Panel */}
          {editingPuja ? (
            <div className="glass-card page-card" style={{ height: 'fit-content', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sparkles className="text-orange" size={22} />
                  <h3 style={{ margin: 0 }}>
                    {editingCardIndex >= 0 ? `Edit Local Card #${editingCardIndex + 1}` : 'Create New Puja Card'}
                  </h3>
                </div>
                <button 
                  className="btn-secondary" 
                  onClick={() => { setEditingPuja(null); setEditingCardIndex(-1); }}
                  style={{ padding: '0.35rem 0.75rem', fontSize: '11px' }}
                >
                  Cancel
                </button>
              </div>

              {/* 1-Click Existing Puja Auto-Fill Loader */}
              <div className="form-group" style={{ 
                marginBottom: '1.5rem', background: 'rgba(234, 88, 12, 0.08)', 
                padding: '12px', borderRadius: '8px', border: '1px solid rgba(234, 88, 12, 0.25)' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <Sparkles size={16} className="text-orange" />
                  <span style={{ fontSize: '11.5px', fontWeight: 'bold', color: 'white' }}>1-Click Database Auto-Fill Seeder</span>
                </div>
                <select
                  value={selectedPoolId}
                  onChange={handleImportSelect}
                  style={{
                    width: '100%', padding: '0.45rem 0.75rem', borderRadius: '6px',
                    background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'white', fontSize: '12px', cursor: 'pointer'
                  }}
                >
                  <option value="">-- Choose from existing general / ₹1 pujas in your DB --</option>
                  {existingPujasPool.map(p => (
                    <option key={p.id} value={p.id}>{p.title} ({p.source === 'general' ? 'General' : '₹1 Pooja'})</option>
                  ))}
                </select>
                {selectedPoolId && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                    <Info size={12} className="text-green" />
                    <span style={{ fontSize: '9.5px', color: '#10b981', fontWeight: 'bold' }}>
                      ✓ All descriptions, steps, samagri, and FAQs imported. Customize details below!
                    </span>
                  </div>
                )}
              </div>

              {/* Form Navigation Tabs */}
              <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '1.5rem', paddingBottom: '4px' }}>
                {['Basic settings', 'Details layout', 'FAQs list'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      if (tab.includes('Basic')) handleFormTabChange('basic');
                      else if (tab.includes('Details')) handleFormTabChange('detail');
                      else handleFormTabChange('faqs');
                    }}
                    style={{
                      background: 'none', border: 'none',
                      color: ((formTab === 'basic' && tab.includes('Basic')) ||
                              (formTab === 'detail' && tab.includes('Details')) ||
                              (formTab === 'faqs' && tab.includes('FAQs'))) ? '#ea580c' : 'rgba(255,255,255,0.6)',
                      fontWeight: 'bold', fontSize: '12.5px', padding: '6px 12px', cursor: 'pointer',
                      borderBottom: ((formTab === 'basic' && tab.includes('Basic')) ||
                                    (formTab === 'detail' && tab.includes('Details')) ||
                                    (formTab === 'faqs' && tab.includes('FAQs'))) ? '2px solid #ea580c' : 'none'
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <form onSubmit={(e) => e.preventDefault()} className="settings-form">
                
                {formTab === 'basic' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label>Puja Card Title *</label>
                        <input 
                          type="text" 
                          name="title"
                          value={editingPuja.title}
                          onChange={handlePujaInputChange}
                          placeholder="e.g. Mangal Dosh Puja"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Unique URL Slug *</label>
                        <input 
                          type="text" 
                          name="slug"
                          value={editingPuja.slug}
                          onChange={handlePujaInputChange}
                          placeholder="e.g. mangal-dosh-puja"
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Short Feed Description</label>
                      <input 
                        type="text" 
                        name="short_description"
                        value={editingPuja.short_description}
                        onChange={handlePujaInputChange}
                        placeholder="e.g. by Kashi Acharyas"
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label>Original Price</label>
                        <input 
                          type="text" 
                          name="price"
                          value={editingPuja.price}
                          onChange={handlePujaInputChange}
                          placeholder="e.g. ₹751"
                        />
                      </div>
                      <div className="form-group">
                        <label>Discounted Promo Price</label>
                        <input 
                          type="text" 
                          name="discounted_price"
                          value={editingPuja.discounted_price}
                          onChange={handlePujaInputChange}
                          placeholder="e.g. ₹1"
                        />
                      </div>
                      <div className="form-group">
                        <label>Badge Highlight Text</label>
                        <input 
                          type="text" 
                          name="badge_text"
                          value={editingPuja.badge_text}
                          onChange={handlePujaInputChange}
                          placeholder="e.g. ₹1 offer"
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label>Duration / Duration Range</label>
                        <input 
                          type="text" 
                          name="duration"
                          value={editingPuja.duration}
                          onChange={handlePujaInputChange}
                          placeholder="e.g. 45-60 mins"
                        />
                      </div>
                      <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.75rem' }}>
                        <input 
                          id="isFeaturedCard"
                          type="checkbox" 
                          name="is_featured"
                          checked={editingPuja.is_featured}
                          onChange={handlePujaInputChange}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <label htmlFor="isFeaturedCard" style={{ cursor: 'pointer', margin: 0 }}>
                          Highlight as Featured Card
                        </label>
                      </div>
                    </div>

                    {/* Thumbnail Uploader */}
                    <div className="form-group">
                      <label>Thumbnail Image Picker</label>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '0.5rem' }}>
                        <button
                          type="button"
                          onClick={() => thumbInputRef.current?.click()}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            padding: '0.65rem 1.15rem', borderRadius: '8px',
                            background: '#ea580c', color: 'white', cursor: 'pointer',
                            fontWeight: 'bold', border: 'none', fontSize: '12px'
                          }}
                          disabled={uploadingThumb}
                        >
                          {uploadingThumb ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                          <span>Upload Thumbnail</span>
                        </button>
                        <input 
                          type="file" 
                          ref={thumbInputRef}
                          accept="image/*"
                          onChange={handleThumbUpload}
                          style={{ display: 'none' }}
                        />
                        {editingPuja.thumbnail_url ? (
                          <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 'bold' }}>✓ Thumbnail Loaded</span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )}

                {formTab === 'detail' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    
                    {/* Hero Banner Uploader */}
                    <div className="form-group">
                      <label>Dynamic Hero Banner Image</label>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '0.5rem' }}>
                        <button
                          type="button"
                          onClick={() => bannerInputRef.current?.click()}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            padding: '0.65rem 1.15rem', borderRadius: '8px',
                            background: '#ea580c', color: 'white', cursor: 'pointer',
                            fontWeight: 'bold', border: 'none', fontSize: '12px'
                          }}
                          disabled={uploadingBanner}
                        >
                          {uploadingBanner ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                          <span>Upload Banner</span>
                        </button>
                        <input 
                          type="file" 
                          ref={bannerInputRef}
                          accept="image/*"
                          onChange={handleBannerUpload}
                          style={{ display: 'none' }}
                        />
                        {editingPuja.hero_banner_url ? (
                          <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 'bold' }}>✓ Banner Loaded</span>
                        ) : null}
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Divine Overview / Tagline Text</label>
                      <textarea 
                        name="overview"
                        value={editingPuja.overview}
                        onChange={handleDetailInputChange}
                        placeholder="e.g. Removes obstacle delays and Bestows marital harmony"
                        style={{ width: '100%', minHeight: '60px', padding: '0.5rem', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                      />
                    </div>

                    <div className="form-group">
                      <label>Auspicious Benefits (Bulleted Markdown / Text)</label>
                      <textarea 
                        name="benefits"
                        value={editingPuja.benefits}
                        onChange={handleDetailInputChange}
                        placeholder="• Unlocks family peace & growth&#10;• Clears Mangal Graha shanti barriers"
                        style={{ width: '100%', minHeight: '80px', padding: '0.5rem', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                      />
                    </div>

                    <div className="form-group">
                      <label>Rituals & Steps (Sequential steps)</label>
                      <textarea 
                        name="rituals"
                        value={editingPuja.rituals}
                        onChange={handleDetailInputChange}
                        placeholder="1. Personalized Ganesha Sankalp&#10;2. Holy Abhishek of Shivling ground"
                        style={{ width: '100%', minHeight: '80px', padding: '0.5rem', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                      />
                    </div>

                    <div className="form-group">
                      <label>Vedic Samagri (Materials List)</label>
                      <input 
                        type="text" 
                        name="samagri"
                        value={editingPuja.samagri}
                        onChange={handleDetailInputChange}
                        placeholder="Durva, red flowers, vermillion, saffron seeds..."
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label>Sacred Temple Location</label>
                        <input 
                          type="text" 
                          name="temple_name"
                          value={editingPuja.temple_name}
                          onChange={handleDetailInputChange}
                          placeholder="e.g. Mahalakshmi Mandir, Kolhapur"
                        />
                      </div>
                      <div className="form-group">
                        <label>Assigned Priest Details</label>
                        <input 
                          type="text" 
                          name="priest_details"
                          value={editingPuja.priest_details}
                          onChange={handleDetailInputChange}
                          placeholder="e.g. Pandit Ramesh Chaturvedi (12+ years experience)"
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label>SEO Meta Title</label>
                        <input 
                          type="text" 
                          name="seo_title"
                          value={editingPuja.seo_title}
                          onChange={handleDetailInputChange}
                          placeholder="e.g. Mangal Puja Vedic Seva - Mantra Puja"
                        />
                      </div>
                      <div className="form-group">
                        <label>SEO Meta Description</label>
                        <input 
                          type="text" 
                          name="seo_description"
                          value={editingPuja.seo_description}
                          onChange={handleDetailInputChange}
                          placeholder="Meta description for mobile crawlers"
                        />
                      </div>
                    </div>

                  </div>
                )}

                {formTab === 'faqs' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Puja FAQ Configurations</span>
                      <button 
                        type="button" 
                        onClick={addFaq}
                        style={{
                          backgroundColor: 'rgba(255, 255, 255, 0.08)', border: 'none', color: '#f97316',
                          padding: '4px 10px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: 'bold'
                        }}
                      >
                        + Add FAQ Item
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto', paddingRight: '4px' }}>
                      {editingPuja.faq_json && editingPuja.faq_json.length > 0 ? (
                        editingPuja.faq_json.map((faq, idx) => (
                          <div key={idx} style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)', position: 'relative' }}>
                            <button
                              type="button"
                              onClick={() => removeFaq(idx)}
                              style={{ position: 'absolute', top: '8px', right: '8px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '12px' }}
                            >
                              ✕
                            </button>
                            <div className="form-group" style={{ marginBottom: '8px', width: '90%' }}>
                              <label style={{ fontSize: '10px' }}>Question *</label>
                              <input 
                                type="text" 
                                value={faq.q} 
                                onChange={(e) => handleFaqChange(idx, 'q', e.target.value)}
                                placeholder="e.g. How will I join the Puja live?"
                                required
                              />
                            </div>
                            <div className="form-group" style={{ margin: 0 }}>
                              <label style={{ fontSize: '10px' }}>Answer *</label>
                              <textarea 
                                value={faq.a} 
                                onChange={(e) => handleFaqChange(idx, 'a', e.target.value)}
                                placeholder="Answer description..."
                                style={{ width: '100%', minHeight: '50px', padding: '0.4rem', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', fontSize: '11.5px' }}
                                required
                              />
                            </div>
                          </div>
                        ))
                      ) : (
                        <div style={{ textAlign: 'center', padding: '24px', color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>
                          No FAQs config added. Tap Add FAQ.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
                  <button 
                    type="button" 
                    className="btn-secondary"
                    onClick={() => { setEditingPuja(null); setEditingCardIndex(-1); }}
                  >
                    Back to cards list
                  </button>

                  <button 
                    type="button" 
                    className="btn-primary"
                    onClick={handleConfirmSaveLocal}
                    style={{ marginLeft: 'auto' }}
                  >
                    <Check size={15} style={{ marginRight: '4px' }} />
                    Add / Update in Offer Section
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Puja Cards Grid List Manager Panel */
            <div className="glass-card table-card" style={{ textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <div>
                  <h3 style={{ margin: 0 }}>Dynamic Offer Puja Cards</h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                    Add, edit, or reorder cards locally. Changes are synchronized to database when you save the main section.
                  </p>
                </div>
                <button 
                  className="btn-primary"
                  onClick={handleAddNewPujaLocal}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0.45rem 1rem', fontSize: '12px' }}
                >
                  <Plus size={16} />
                  <span>Add Puja Card</span>
                </button>
              </div>

              {localCards.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
                  No puja cards added to this offer yet. Tap 'Add Puja Card' above to configure one locally!
                </div>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}>Thumb</th>
                      <th>Title</th>
                      <th>Slug</th>
                      <th>Promo Pricing</th>
                      <th style={{ textAlign: 'center', width: '80px' }}>Reorder</th>
                      <th style={{ textAlign: 'right', width: '80px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {localCards.map((p, idx) => (
                      <tr key={idx}>
                        <td>
                          <img 
                            src={p.thumbnail_url || DEFAULT_THUMB} 
                            alt="Card" 
                            style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }}
                          />
                        </td>
                        <td>
                          <div style={{ fontWeight: '600', fontSize: '13px' }}>{p.title}</div>
                          {p.badge_text && (
                            <span className="badge-status info" style={{ fontSize: '8px', padding: '1px 4px', marginTop: '2px', display: 'inline-block' }}>
                              {p.badge_text}
                            </span>
                          )}
                        </td>
                        <td style={{ fontSize: '12px', fontFamily: 'monospace' }}>{p.slug}</td>
                        <td style={{ fontSize: '12.5px', fontWeight: '500' }}>
                          <span style={{ textDecoration: 'line-through', color: 'rgba(255,255,255,0.4)', marginRight: '6px' }}>{p.price}</span>
                          <span style={{ color: '#ffd60a' }}>{p.discounted_price}</span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '2px', justifyContent: 'center' }}>
                            <button 
                              type="button" 
                              onClick={() => handleMoveCardLocal(idx, 'up')}
                              disabled={idx === 0}
                              style={{ padding: '2px 4px', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '4px', cursor: idx === 0 ? 'not-allowed' : 'pointer', color: idx === 0 ? 'rgba(255,255,255,0.2)' : 'white' }}
                            >
                              <ArrowUp size={12} />
                            </button>
                            <button 
                              type="button" 
                              onClick={() => handleMoveCardLocal(idx, 'down')}
                              disabled={idx === localCards.length - 1}
                              style={{ padding: '2px 4px', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '4px', cursor: idx === localCards.length - 1 ? 'not-allowed' : 'pointer', color: idx === localCards.length - 1 ? 'rgba(255,255,255,0.2)' : 'white' }}
                            >
                              <ArrowDown size={12} />
                            </button>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                            <button 
                              className="action-btn-primary" 
                              onClick={() => handleEditPujaLocal(idx)}
                              style={{ padding: '4px' }}
                            >
                              <Edit3 size={13} />
                            </button>
                            <button 
                              className="action-btn-danger" 
                              onClick={() => handleDeletePujaLocal(idx)}
                              style={{ padding: '4px' }}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

        </div>

        {/* Right Side: Interactive Mobile Device Simulator Preview with Top Toggle Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', position: 'sticky', top: '1.5rem', height: 'fit-content' }}>
          
          {/* Active Demo Mode Select Tab Buttons */}
          <div style={{
            display: 'flex', gap: '4px', backgroundColor: 'rgba(255, 255, 255, 0.05)', 
            padding: '3px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <button
              onClick={() => { setSimViewMode('feed'); setSelectedSimPuja(null); }}
              style={{
                backgroundColor: simViewMode === 'feed' ? '#ea580c' : 'transparent',
                border: 'none', color: 'white', padding: '6px 12px', borderRadius: '8px',
                fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', display: 'flex',
                alignItems: 'center', gap: '4px'
              }}
            >
              <Layers size={13} />
              <span>Puja Page Feed</span>
            </button>
            <button
              onClick={() => {
                const renderable = getActiveSimPujaToRender();
                if (renderable) {
                  setSelectedSimPuja(renderable);
                  setSimViewMode('detail');
                } else {
                  alert('Please configure at least one Puja Card in the list below to preview its detailed layout!');
                }
              }}
              style={{
                backgroundColor: simViewMode === 'detail' ? '#ea580c' : 'transparent',
                border: 'none', color: 'white', padding: '6px 12px', borderRadius: '8px',
                fontSize: '11px', fontWeight: 'bold', cursor: 'pointer', display: 'flex',
                alignItems: 'center', gap: '4px'
              }}
            >
              <BookOpen size={13} />
              <span>Puja Detail Page</span>
            </button>
          </div>

          <div style={{
            width: '320px', height: '568px', background: '#ffffff',
            borderRadius: '36px', border: '10px solid #1e293b',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
            overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column'
          }}>
            {/* Speaker Camera Notch */}
            <div style={{
              width: '120px', height: '18px', background: '#1e293b',
              borderRadius: '0 0 12px 12px', position: 'absolute', top: 0, left: '50%',
              transform: 'translateX(-50%)', zIndex: 9999, display: 'flex',
              justifyContent: 'center', alignItems: 'center'
            }}>
              <div style={{ width: '40px', height: '4px', background: '#090d16', borderRadius: '2px' }} />
            </div>

            {/* Simulated Content viewport */}
            <div style={{ width: '100%', height: '100%', paddingTop: '18px', position: 'relative' }}>
              
              {simViewMode === 'detail' && getActiveSimPujaToRender() ? (
                <PujaDetailPreview 
                  puja={getActiveSimPujaToRender()}
                  onBack={() => {
                    setSimViewMode('feed');
                    setSelectedSimPuja(null);
                  }}
                />
              ) : (
                <SectionPreview 
                  section={{
                    title: sectionForm.title,
                    subtitle: sectionForm.subtitle,
                    background_image_url: sectionForm.background_image_url,
                    status: activeSection ? activeSection.status : 'draft'
                  }}
                  pujas={getDisplayedCardsInSim()}
                  onSelectPuja={(p, idx) => {
                    // Tapping a card in the scroll list transitions the simulator to Demo 2 instantly
                    setSelectedSimPuja(p);
                    setSimViewMode('detail');
                  }}
                />
              )}

              {/* Bottom Nav Bar Mock */}
              <SimulatorBottomNav />
            </div>
          </div>
        </div>

      </div>

      {/* 🕉️ Offer Sections Dashboard */}
      <div className="glass-card page-card" style={{ marginTop: '2rem', textAlign: 'left' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Layers className="text-orange" size={24} />
            <h3 style={{ margin: 0, fontSize: '1.25rem' }}>🕉️ Offer Sections Dashboard</h3>
          </div>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
            Total Sections: {sections.length} | Published: {sections.filter(s => s.status === 'published').length} | Drafts: {sections.filter(s => s.status === 'draft').length}
          </span>
        </div>

        {sections.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.4)' }}>
            No offer sections configured yet. Create a new section using the form above!
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {sections.map((sec) => (
              <div 
                key={sec.id} 
                className="glass-card" 
                style={{ 
                  background: 'rgba(255, 255, 255, 0.02)', 
                  border: activeSection?.id === sec.id ? '1.5px solid #ea580c' : '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column',
                  transition: 'all 0.2s ease-in-out', boxShadow: activeSection?.id === sec.id ? '0 0 15px rgba(234, 88, 12, 0.15)' : 'none'
                }}
              >
                {/* Header background image preview */}
                <div style={{ 
                  height: '100px', width: '100%', 
                  backgroundImage: `url(${sec.background_image_url || DEFAULT_BG})`, 
                  backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' 
                }}>
                  <div style={{ 
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.7) 100%)' 
                  }} />
                  <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10 }}>
                    <span style={{
                      backgroundColor: sec.status === 'published' ? '#10b981' : '#ea580c',
                      color: 'white', padding: '3.5px 9px', borderRadius: '12px',
                      fontSize: '9px', fontWeight: 'bold', display: 'inline-block',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.25)', letterSpacing: '0.02em'
                    }}>
                      {sec.status === 'published' ? '● LIVE ON APP' : '● DRAFT'}
                    </span>
                  </div>
                  <div style={{ position: 'absolute', bottom: '8px', left: '12px', zIndex: 10 }}>
                    <h4 style={{ margin: 0, color: 'white', fontSize: '14px', fontWeight: 'bold' }}>{sec.title}</h4>
                  </div>
                </div>

                {/* Info and content fields */}
                <div style={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '8px' }}>
                  <p style={{ margin: 0, fontSize: '11px', color: 'rgba(255,255,255,0.6)', lineHeight: '14px', minHeight: '28px' }}>
                    {sec.subtitle || 'No subtitle configured.'}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10.5px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold', color: '#ffd60a' }}>
                      🕉️ {sec.cardCount || 0} {sec.cardCount === 1 ? 'Puja Card' : 'Puja Cards'}
                    </span>
                    <span>Order: {sec.sort_order}</span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <button
                      onClick={() => {
                        setSelectedSectionId(sec.id);
                        setActiveSection(sec);
                        loadSectionDetails(sec);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      style={{
                        flex: 1, padding: '6px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold',
                        background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)',
                        color: 'white', cursor: 'pointer', textAlign: 'center'
                      }}
                    >
                      Load & Edit
                    </button>
                    <button
                      onClick={() => handleTogglePublishSection(sec)}
                      style={{
                        flex: 1, padding: '6px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold',
                        background: sec.status === 'published' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                        border: sec.status === 'published' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(34, 197, 94, 0.3)',
                        color: sec.status === 'published' ? '#ef4444' : '#22c55e', cursor: 'pointer', textAlign: 'center'
                      }}
                    >
                      {sec.status === 'published' ? 'Unpublish' : 'Go Live'}
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
                    <button
                      onClick={() => handleDuplicateSection(sec)}
                      style={{
                        flex: 1, padding: '5px', borderRadius: '6px', fontSize: '10px', fontWeight: '600',
                        background: 'transparent', border: '1px solid rgba(234, 88, 12, 0.4)',
                        color: '#f97316', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px'
                      }}
                    >
                      <Sparkles size={11} />
                      Clone Draft
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to delete "${sec.title}"?`)) {
                          supabase.from('offer_sections').delete().eq('id', sec.id).then(() => {
                            alert('Deleted successfully.');
                            fetchSections();
                          });
                        }
                      }}
                      style={{
                        padding: '5px 8px', borderRadius: '6px',
                        background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)',
                        color: '#ef4444', cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
