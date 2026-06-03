import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Edit3, Trash2, ArrowUp, ArrowDown, Upload, Loader2, Save, Check, 
  ChevronRight, Calendar, Sparkles, BookOpen, Layers, Info, ArrowLeft, Star
} from 'lucide-react';
import { supabase } from './lib/supabase';
import { uploadToR2 } from './lib/r2';

const DEFAULT_BG = 'https://images.unsplash.com/photo-1608976328321-2f9b229f3e08?auto=format&fit=crop&w=800&q=80';
const DEFAULT_THUMB = 'https://images.unsplash.com/photo-1567591974574-e852636b14a3?auto=format&fit=crop&w=300&q=80';

const DAYS_OF_WEEK = [
  { val: 1, name: 'Monday', deity: 'SHIVA', symbol: '🔱', color: '#2563eb', bg: '#eff6ff', glow: '#bfdbfe', pill: 'Peace & Blessings' },
  { val: 2, name: 'Tuesday', deity: 'HANUMAN', symbol: '📿', color: '#ea580c', bg: '#fff7ed', glow: '#fed7aa', pill: 'Strength' },
  { val: 3, name: 'Wednesday', deity: 'GANESHA', symbol: '🐘', color: '#e11d48', bg: '#fff1f2', glow: '#fecdd3', pill: 'Vighna' },
  { val: 4, name: 'Thursday', deity: 'VISHNU', symbol: '🎡', color: '#ca8a04', bg: '#fefce8', glow: '#fef08a', pill: 'Auspicious' },
  { val: 5, name: 'Friday', deity: 'LAXMI', symbol: '🌸', color: '#ec4899', bg: '#fdf2f8', glow: '#fbcfe8', pill: 'Prosperity' },
  { val: 6, name: 'Saturday', deity: 'SHANI', symbol: '⚖️', color: '#6366f1', bg: '#faf5ff', glow: '#e9d5ff', pill: 'Discipline' },
  { val: 0, name: 'Sunday', deity: 'SURYA', symbol: '☀️', color: '#f59e0b', bg: '#fffbeb', glow: '#fed7aa', pill: 'Positive Energy' }
];

const slugify = (text) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
};

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

// --- Simulator Header & Navigation ---
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
      <span style={{ fontSize: '12px', color: '#475569' }}>🛒</span>
      <span style={{ fontSize: '12px', color: '#475569' }}>🔔</span>
    </div>
  </div>
);

const SimulatorBottomNav = () => (
  <div style={{
    position: 'absolute', bottom: 0, left: 0, right: 0, height: '48px',
    backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0', display: 'flex',
    justifyContent: 'space-around', alignItems: 'center', zIndex: 100, paddingBottom: '2px'
  }}>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
      <span style={{ fontSize: '14px', color: '#64748b' }}>🏠</span>
      <span style={{ fontSize: '8px', color: '#64748b', fontWeight: 'bold' }}>Home</span>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
      <span style={{ fontSize: '14px', color: '#ea580c' }}>🔸</span>
      <span style={{ fontSize: '8px', color: '#ea580c', fontWeight: '900' }}>Puja</span>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
      <span style={{ fontSize: '14px', color: '#64748b' }}>🕉️</span>
      <span style={{ fontSize: '8px', color: '#64748b', fontWeight: 'bold' }}>God</span>
    </div>
  </div>
);

// --- Live Viewport (Feed View) ---
const SectionPreview = ({ selectedDayVal, dayData, dayCards, onSelectCard, onSwitchDay }) => {
  const currentDayInfo = DAYS_OF_WEEK.find(d => d.val === selectedDayVal) || DAYS_OF_WEEK[0];

  return (
    <div style={{
      width: '100%', height: 'calc(100% - 48px)', display: 'flex', flexDirection: 'column',
      background: '#ffffff', fontFamily: '"Outfit", sans-serif', overflowY: 'auto',
      paddingBottom: '24px', position: 'relative'
    }}>
      <SimulatorTopHeader />

      {/* Deity Circle list matching the visual header in mobile view */}
      <div style={{ padding: '16px 12px 0 12px', textAlign: 'left', background: '#ffffff', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontSize: '13px', fontWeight: '900', color: '#0f172a', letterSpacing: '-0.2px' }}>
            RITUALS OF THE DAY
          </span>
          <div style={{ 
            backgroundColor: currentDayInfo.bg, border: `1px solid ${currentDayInfo.glow}`, 
            borderRadius: '12px', padding: '3px 8px'
          }}>
            <span style={{ color: currentDayInfo.color, fontSize: '7.5px', fontWeight: '900' }}>
              Energy: {currentDayInfo.deity} ✨
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '4px', overflowX: 'auto', paddingBottom: '8px' }}>
          {DAYS_OF_WEEK.map((d) => {
            const isSelected = d.val === selectedDayVal;
            return (
              <div 
                key={d.val} 
                onClick={() => onSwitchDay(d.val)}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', flexShrink: 0, width: '60px', cursor: 'pointer' }}
              >
                <div style={{
                  width: '38px', height: '38px', borderRadius: '50%', backgroundColor: d.bg,
                  border: isSelected ? `2.5px solid ${d.color}` : `1.5px solid ${d.glow}`, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', position: 'relative', transition: 'all 0.2s',
                  boxShadow: isSelected ? `0 4px 8px ${d.glow}` : 'none'
                }}>
                  <span style={{ fontSize: '16px' }}>{d.symbol}</span>
                  {d.val === 1 && (
                    <div style={{
                      position: 'absolute', top: '-6px', backgroundColor: '#ef4444',
                      color: 'white', fontSize: '5px', fontWeight: 'bold', padding: '1px 3px', borderRadius: '6px'
                    }}>Mon</div>
                  )}
                </div>
                <span style={{ fontSize: '8px', fontWeight: '900', color: '#1e293b' }}>{d.deity}</span>
                <span style={{ fontSize: '7px', color: '#64748b', fontWeight: '600' }}>{d.name.substring(0,3)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dynamic Curated Banner Section matching the layout selected */}
      <div style={{
        width: '100%', minHeight: '235px',
        backgroundImage: `url(${dayData.background_image_url || DEFAULT_BG})`, backgroundSize: 'cover', backgroundPosition: 'center',
        position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
        padding: '16px 12px 14px 12px', overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'linear-gradient(to bottom, rgba(0, 18, 31, 0.3) 0%, rgba(0, 18, 31, 0.8) 100%)',
          zIndex: 1
        }} />

        <div style={{ zIndex: 2, display: 'flex', flexDirection: 'column', gap: '3px', textAlign: 'left', marginBottom: '8px' }}>
          <h2 style={{ 
            margin: 0, fontSize: '18px', fontWeight: '900', color: '#ffffff', 
            textShadow: '0 2px 4px rgba(0,0,0,0.6)', lineHeight: '21px'
          }}>
            {dayData.title || 'Dynamic Ritual Puja'}
          </h2>
          <p style={{ 
            margin: 0, fontSize: '10px', color: 'rgba(255,255,255,0.95)', 
            fontWeight: '600', lineHeight: '13px', width: '90%' 
          }}>
            {dayData.subtitle || 'Vedic rituals and planetary shanti Seva.'}
          </p>
        </div>

        {/* Curated White Cards Scroller */}
        <div style={{ zIndex: 5, marginTop: '8px', width: '100%' }}>
          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
            {dayCards && dayCards.length > 0 ? (
              dayCards.map((c, idx) => (
                <div 
                  key={idx}
                  onClick={() => onSelectCard(c)}
                  style={{
                    width: '98px', height: '102px', flexShrink: 0, cursor: 'pointer',
                    backgroundColor: '#ffffff', borderRadius: '10px', overflow: 'hidden',
                    border: '1px solid #ffffff', display: 'flex', flexDirection: 'column',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.15)'
                  }}
                >
                  <div style={{ width: '100%', height: '70px', backgroundColor: '#e2e8f0', position: 'relative' }}>
                    <img 
                      src={c.thumbnail_url || DEFAULT_THUMB} 
                      alt="Thumbnail" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                    {c.badge_text && (
                      <div style={{
                        position: 'absolute', top: '3px', left: '3px', backgroundColor: '#dc2626',
                        color: '#ffffff', padding: '1px 3.5px', borderRadius: '2px', fontSize: '6px', fontWeight: 'bold'
                      }}>
                        {c.badge_text}
                      </div>
                    )}
                  </div>
                  <div style={{
                    width: '100%', flex: 1, backgroundColor: '#ffffff', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', padding: '2px 4px'
                  }}>
                    <span style={{
                      fontSize: '8px', fontWeight: '900', color: '#1e293b', textAlign: 'center',
                      lineHeight: '9.5px', overflow: 'hidden', display: '-webkit-box',
                      WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'
                    }}>
                      {c.title || 'Dynamic Seva'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '10px', padding: '12px 0', textAlign: 'center', width: '100%' }}>
                No active cards. Click 'Add Card' to seed.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Live Viewport (Detail View) ---
const PujaDetailPreview = ({ puja, onBack }) => {
  const bannerImg = puja.hero_banner_url || puja.thumbnail_url || DEFAULT_THUMB;
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div style={{
      width: '100%', height: 'calc(100% - 48px)', background: '#f8fafc',
      fontFamily: '"Outfit", sans-serif', color: '#1e293b', overflowY: 'auto', textAlign: 'left',
      position: 'relative', paddingBottom: '24px'
    }}>
      <div style={{ height: '150px', width: '100%', position: 'relative', backgroundColor: '#cbd5e1' }}>
        <img src={bannerImg} alt="Hero Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '40px',
          background: 'linear-gradient(to top, rgba(248, 250, 252, 1) 0%, rgba(248, 250, 252, 0) 100%)'
        }} />
        
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

        <div style={{
          position: 'absolute', top: '10px', right: '10px',
          backgroundColor: '#ea580c', color: 'white', padding: '2px 5px',
          borderRadius: '4px', fontSize: '7px', fontWeight: 'bold'
        }}>
          RITUAL DETAIL PREVIEW
        </div>
      </div>

      <div style={{ padding: '0 12px', marginTop: '-6px', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '3px' }}>
          <SacredTilak />
          <span style={{ color: '#ea580c', fontSize: '8px', fontWeight: '800', textTransform: 'uppercase' }}>
            Pure Vedic Devotional Seva
          </span>
        </div>
        <h1 style={{ fontSize: '15px', fontWeight: '900', margin: '2px 0', color: '#0f172a', lineHeight: '18px' }}>
          {puja.title || 'Dynamic Daily Ritual'}
        </h1>
        <p style={{ margin: '0 0 8px 0', fontSize: '9.5px', color: '#64748b', lineHeight: '13px' }}>
          {puja.short_description || 'Personalized Sankalp and blessed temple Prasad.'}
        </p>

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
                {puja.overview || 'Overview details represent the Vedic context of the daily ritual.'}
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
                {puja.benefits || '• Bestows blessings.\n• Clears planetary doshas.'}
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
                {puja.rituals || '1. Sankalp Recitation.\n2. Altar flower offering.'}
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
                {puja.samagri || 'Sandalwood, marigold, holy thread, and incense.'}
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
      </div>
    </div>
  );
};

export default function DailyRitualsManagerPage() {
  const [selectedDayVal, setSelectedDayVal] = useState(1); // 1 = Monday
  const [dayData, setDayData] = useState({
    title: '',
    subtitle: '',
    background_image_url: ''
  });
  const [localCards, setLocalCards] = useState([]);

  // Auto-fill dropdown pool
  const [existingPujasPool, setExistingPujasPool] = useState([]);
  const [selectedPoolId, setSelectedPoolId] = useState('');

  // Editing local card details
  const [editingPuja, setEditingPuja] = useState(null);
  const [editingCardIndex, setEditingCardIndex] = useState(-1);

  // Layout Tab selection
  const [formTab, setFormTab] = useState('basic'); // 'basic', 'detail', 'faqs'

  // Async states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingBg, setUploadingBg] = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  // Simulator View details
  const [selectedSimPuja, setSelectedSimPuja] = useState(null);
  const [simViewMode, setSimViewMode] = useState('feed'); // 'feed', 'detail'

  const bgInputRef = useRef(null);
  const thumbInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  const fetchDailySectionData = async (dayVal) => {
    setLoading(true);
    try {
      // 1. Get section header details
      const { data: section, error: secErr } = await supabase
        .from('daily_sections')
        .select('*')
        .eq('day_of_week', dayVal)
        .maybeSingle();

      if (secErr) throw secErr;

      if (section) {
        setDayData({
          title: section.title || '',
          subtitle: section.subtitle || '',
          background_image_url: section.background_image_url || ''
        });
      } else {
        // Fallback default details from day info
        const dayInfo = DAYS_OF_WEEK.find(d => d.val === dayVal);
        setDayData({
          title: dayInfo ? `${dayInfo.name} ${dayInfo.deity} Special Puja` : 'Daily Special Puja',
          subtitle: dayInfo ? `${dayInfo.pill} and celestial blessings` : '',
          background_image_url: ''
        });
      }

      // 2. Get section child cards
      const { data: cards, error: cardsErr } = await supabase
        .from('daily_pujas')
        .select('*')
        .eq('day_of_week', dayVal)
        .order('sort_order', { ascending: true });

      if (cardsErr) throw cardsErr;

      if (cards && cards.length > 0) {
        const cardIds = cards.map(c => c.id);
        const { data: details, error: detErr } = await supabase
          .from('daily_puja_details')
          .select('*')
          .in('puja_id', cardIds);

        if (detErr) throw detErr;

        const merged = cards.map(c => {
          const det = (details || []).find(d => d.puja_id === c.id) || {};
          return {
            id: c.id,
            slug: c.slug,
            title: c.title,
            short_description: c.short_description || '',
            thumbnail_url: c.thumbnail_url || '',
            badge_text: c.badge_text || '',
            price: c.price || '₹751',
            discounted_price: c.discounted_price || '₹1',
            duration: c.duration || '45 mins',
            is_active: c.is_active ?? true,

            // Nested detail properties
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
      console.error('Error fetching daily section details:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingPujasPool = async () => {
    try {
      const { data: gen } = await supabase.from('general_poojas').select('*');
      const { data: one } = await supabase.from('one_rupee_poojas').select('*');
      
      const pool = [
        ...(gen || []).map(p => ({ ...p, source: 'general' })),
        ...(one || []).map(p => ({ ...p, source: 'one_rupee' }))
      ];
      setExistingPujasPool(pool);
    } catch (err) {
      console.error('Error fetching pool data:', err);
    }
  };

  useEffect(() => {
    fetchDailySectionData(selectedDayVal);
  }, [selectedDayVal]);

  useEffect(() => {
    fetchExistingPujasPool();
  }, []);

  const handleDaySwitch = (dayVal) => {
    setSelectedDayVal(dayVal);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDayData(prev => ({ ...prev, [name]: value }));
  };

  const handleBgUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const localUrl = URL.createObjectURL(file);
    setDayData(prev => ({ ...prev, background_image_url: localUrl }));

    setUploadingBg(true);
    try {
      const publicUrl = await uploadToR2(file, 'daily-sections');
      setDayData(prev => ({ ...prev, background_image_url: publicUrl }));
    } catch (err) {
      console.error('Background upload failed:', err);
      alert('Upload failed: ' + err.message);
    } finally {
      setUploadingBg(false);
    }
  };

  // --- Local Card Operations ---
  const handleAddCardLocal = () => {
    setEditingPuja({
      slug: '',
      title: '',
      short_description: '',
      thumbnail_url: '',
      badge_text: 'Vedic Seva',
      price: '₹751',
      discounted_price: '₹1',
      duration: '45 mins',
      is_active: true,

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
    });
    setEditingCardIndex(-1);
    setFormTab('basic');
    setSelectedPoolId('');
  };

  const handleEditCardLocal = (idx) => {
    setEditingPuja({ ...localCards[idx] });
    setEditingCardIndex(idx);
    setFormTab('basic');
    setSelectedPoolId('');
  };

  const handleDeleteCardLocal = (idx) => {
    if (!window.confirm('Remove this card? Changes are saved to database when you click Save Section.')) return;
    const updated = [...localCards];
    updated.splice(idx, 1);
    setLocalCards(updated);
  };

  const handleMoveCardLocal = (idx, direction) => {
    const updated = [...localCards];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= updated.length) return;

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
      if (name === 'title') {
        updated.slug = slugify(value);
      }
      return updated;
    });
  };

  const handleDetailInputChange = (e) => {
    const { name, value } = e.target;
    setEditingPuja(prev => ({ ...prev, [name]: value }));
  };

  // --- Auto Fill Seeder ---
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

        hero_banner_url: matched.image_url || prev.hero_banner_url,
        overview: matched.tagline || prev.overview,
        benefits: matched.benefits || prev.benefits,
        rituals: matched.steps || prev.rituals,
        samagri: matched.samagri || prev.samagri,
        temple_name: matched.temple || matched.provider || prev.temple_name,
        priest_details: matched.pandit || 'Assigned Vedic Pandits',
        faq_json: matched.faqs || prev.faq_json || [],
        seo_title: `${matched.title} - Daily Special Seva`,
        seo_description: `Join personalized ${matched.title} at ${matched.temple || matched.provider}. Holy sankalp and prasad Transit box included.`
      }));
    }
  };

  const handleThumbUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const localUrl = URL.createObjectURL(file);
    setEditingPuja(prev => ({ ...prev, thumbnail_url: localUrl }));

    setUploadingThumb(true);
    try {
      const publicUrl = await uploadToR2(file, 'daily-thumbnails');
      setEditingPuja(prev => ({ ...prev, thumbnail_url: publicUrl }));
    } catch (err) {
      console.error('Thumbnail upload failed:', err);
      alert('Upload failed: ' + err.message);
    } finally {
      setUploadingThumb(false);
    }
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const localUrl = URL.createObjectURL(file);
    setEditingPuja(prev => ({ ...prev, hero_banner_url: localUrl }));

    setUploadingBanner(true);
    try {
      const publicUrl = await uploadToR2(file, 'daily-banners');
      setEditingPuja(prev => ({ ...prev, hero_banner_url: publicUrl }));
    } catch (err) {
      console.error('Banner upload failed:', err);
      alert('Upload failed: ' + err.message);
    } finally {
      setUploadingBanner(false);
    }
  };

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

  const handleConfirmSaveCard = () => {
    if (!editingPuja.title || !editingPuja.slug) {
      alert('Title and URL slug are required.');
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

  // --- Master Transaction Save ---
  const handleSaveSection = async () => {
    if (!dayData.title) {
      alert('Section Heading is required.');
      return;
    }

    setSaving(true);
    try {
      // 1. Insert or update parent daily_sections row
      const { error: secErr } = await supabase
        .from('daily_sections')
        .upsert([{
          day_of_week: selectedDayVal,
          title: dayData.title,
          subtitle: dayData.subtitle,
          background_image_url: dayData.background_image_url
        }]);

      if (secErr) throw secErr;

      // 2. Clear old cards for the day to avoid dangling keys
      const { error: deleteErr } = await supabase
        .from('daily_pujas')
        .delete()
        .eq('day_of_week', selectedDayVal);

      if (deleteErr) throw deleteErr;

      // 3. Insert local cards sequentially
      for (let i = 0; i < localCards.length; i++) {
        const card = localCards[i];
        
        const cardPayload = {
          day_of_week: selectedDayVal,
          slug: card.slug || slugify(card.title),
          title: card.title,
          short_description: card.short_description || '',
          thumbnail_url: card.thumbnail_url || '',
          badge_text: card.badge_text || '',
          price: card.price || '₹751',
          discounted_price: card.discounted_price || '₹1',
          duration: card.duration || '45 mins',
          sort_order: i,
          is_active: card.is_active ?? true
        };

        const { data: newCard, error: cardErr } = await supabase
          .from('daily_pujas')
          .insert([cardPayload])
          .select();

        if (cardErr) throw cardErr;
        const newCardId = newCard[0].id;

        const detailsPayload = {
          puja_id: newCardId,
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
          seo_description: card.seo_description || ''
        };

        const { error: detErr } = await supabase
          .from('daily_puja_details')
          .insert([detailsPayload]);

        if (detErr) throw detErr;
      }

      alert('Daily Rituals Section saved and published successfully!');
      fetchDailySectionData(selectedDayVal);
    } catch (err) {
      console.error('Master save failed:', err);
      alert('Save failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

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

  const getActiveSimPujaToRender = () => {
    if (editingPuja) return editingPuja;
    if (selectedSimPuja) return selectedSimPuja;
    if (localCards.length > 0) return localCards[0];
    return null;
  };

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
        <h1 className="gradient-text">Rituals of the Day CMS</h1>
        <p>Edit day-wise special Deity banners, circular deity navigators, and recommended Puja cards.</p>
      </div>

      {/* Visual Day Picker Tabs */}
      <div style={{
        display: 'flex', gap: '8px', overflowX: 'auto', padding: '6px',
        backgroundColor: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.06)', marginBottom: '1.5rem'
      }}>
        {DAYS_OF_WEEK.map((d) => (
          <button
            key={d.val}
            onClick={() => handleDaySwitch(d.val)}
            style={{
              flex: 1, padding: '10px 14px', borderRadius: '10px', display: 'flex',
              alignItems: 'center', gap: '6px', justifyContent: 'center', fontWeight: 'bold',
              fontSize: '12.5px', transition: 'all 0.2s', whiteSpace: 'nowrap',
              background: selectedDayVal === d.val ? '#ea580c' : 'transparent',
              color: selectedDayVal === d.val ? 'white' : 'rgba(255,255,255,0.7)',
              boxShadow: selectedDayVal === d.val ? '0 4px 10px rgba(234, 88, 12, 0.2)' : 'none'
            }}
          >
            <span style={{ fontSize: '15px' }}>{d.symbol}</span>
            <span>{d.name}</span>
          </button>
        ))}
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1.2fr 0.8fr', 
        gap: '2rem',
        marginTop: '1rem'
      }}>
        
        {/* Left Side: CMS controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Main Day settings */}
          <div className="glass-card page-card" style={{ height: 'fit-content', textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <Calendar className="text-orange" size={22} />
              <h3 style={{ margin: 0 }}>
                {DAYS_OF_WEEK.find(d => d.val === selectedDayVal)?.name} Banner settings
              </h3>
            </div>

            <form onSubmit={(e) => e.preventDefault()} className="settings-form">
              <div className="form-group">
                <label>Banner Heading *</label>
                <input 
                  type="text" 
                  name="title"
                  value={dayData.title}
                  onChange={handleInputChange}
                  placeholder="e.g. Monday Shiva Special Puja"
                  required
                />
              </div>

              <div className="form-group">
                <label>Banner Subheading / Tagline Description</label>
                <input 
                  type="text" 
                  name="subtitle"
                  value={dayData.subtitle}
                  onChange={handleInputChange}
                  placeholder="e.g. Divine Shiva rituals for peace and spiritual blessings"
                />
              </div>

              {/* R2 Background picker */}
              <div className="form-group">
                <label>Banner Background Image</label>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => bgInputRef.current?.click()}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      padding: '0.75rem 1.25rem', borderRadius: '8px',
                      background: '#ea580c', color: 'white', cursor: 'pointer',
                      fontWeight: 'bold', border: 'none'
                    }}
                    disabled={uploadingBg}
                  >
                    {uploadingBg ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                    <span>Choose Banner Image</span>
                  </button>
                  <input 
                    type="file" 
                    ref={bgInputRef}
                    accept="image/*"
                    onChange={handleBgUpload}
                    style={{ display: 'none' }}
                  />
                  {dayData.background_image_url ? (
                    <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 'bold' }}>
                      ✓ Image uploaded successfully
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>
                      No image uploaded. Unsplash default will be used.
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button 
                  type="button" 
                  className="btn-primary"
                  onClick={handleSaveSection}
                  disabled={saving}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  <span>Save and Publish Section</span>
                </button>
              </div>
            </form>
          </div>

          {/* Child Puja Card Editor Panel */}
          {editingPuja ? (
            <div className="glass-card page-card" style={{ height: 'fit-content', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sparkles className="text-orange" size={22} />
                  <h3 style={{ margin: 0 }}>
                    {editingCardIndex >= 0 ? `Edit Card #${editingCardIndex + 1}` : 'Create Daily Puja Card'}
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
                  <option value="">-- Choose from existing general / ₹1 pujas --</option>
                  {existingPujasPool.map(p => (
                    <option key={p.id} value={p.id}>{p.title} ({p.source === 'general' ? 'General' : '₹1 Puja'})</option>
                  ))}
                </select>
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
                          placeholder="e.g. Rudrabhishek Puja"
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
                          placeholder="e.g. rudrabhishek-puja"
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

                    {/* Thumbnail uploader */}
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
                          <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 'bold' }}>✓ Loaded</span>
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
                          <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 'bold' }}>✓ Loaded</span>
                        ) : null}
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Divine Overview / Tagline Text</label>
                      <textarea 
                        name="overview"
                        value={editingPuja.overview}
                        onChange={handleDetailInputChange}
                        placeholder="Overview details..."
                        style={{ width: '100%', minHeight: '60px', padding: '0.5rem', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                      />
                    </div>

                    <div className="form-group">
                      <label>Auspicious Benefits (Bulleted text)</label>
                      <textarea 
                        name="benefits"
                        value={editingPuja.benefits}
                        onChange={handleDetailInputChange}
                        placeholder="• Bestows blessings..."
                        style={{ width: '100%', minHeight: '80px', padding: '0.5rem', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                      />
                    </div>

                    <div className="form-group">
                      <label>Rituals & Steps</label>
                      <textarea 
                        name="rituals"
                        value={editingPuja.rituals}
                        onChange={handleDetailInputChange}
                        placeholder="1. Sankalp Recitation..."
                        style={{ width: '100%', minHeight: '80px', padding: '0.5rem', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                      />
                    </div>

                    <div className="form-group">
                      <label>Vedic Samagri</label>
                      <input 
                        type="text" 
                        name="samagri"
                        value={editingPuja.samagri}
                        onChange={handleDetailInputChange}
                        placeholder="Durva, sandalwood, fresh flowers..."
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
                          placeholder="e.g. Kashi Vishwanath, Varanasi"
                        />
                      </div>
                      <div className="form-group">
                        <label>Assigned Priest Details</label>
                        <input 
                          type="text" 
                          name="priest_details"
                          value={editingPuja.priest_details}
                          onChange={handleDetailInputChange}
                          placeholder="e.g. Pandit Ramesh Shastri (12+ years experience)"
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

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto' }}>
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
                    onClick={handleConfirmSaveCard}
                    style={{ marginLeft: 'auto' }}
                  >
                    <Check size={15} style={{ marginRight: '4px' }} />
                    Add / Update Card
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* Cards List Grid */
            <div className="glass-card table-card" style={{ textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <div>
                  <h3 style={{ margin: 0 }}>Recommended Puja Cards</h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                    Add, edit, or reorder cards for {DAYS_OF_WEEK.find(d => d.val === selectedDayVal)?.name}.
                  </p>
                </div>
                <button 
                  className="btn-primary"
                  onClick={handleAddCardLocal}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0.45rem 1rem', fontSize: '12px' }}
                >
                  <Plus size={16} />
                  <span>Add Puja Card</span>
                </button>
              </div>

              {localCards.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
                  No puja cards added to this day yet. Click 'Add Puja Card' above to configure one locally!
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
                              onClick={() => handleEditCardLocal(idx)}
                              style={{ padding: '4px' }}
                            >
                              <Edit3 size={13} />
                            </button>
                            <button 
                              className="action-btn-danger" 
                              onClick={() => handleDeleteCardLocal(idx)}
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

        {/* Right Side: Visual Phone Simulator */}
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
                  alert('Configure at least one Puja Card to preview its detailed layout!');
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
                  selectedDayVal={selectedDayVal}
                  dayData={{
                    title: dayData.title,
                    subtitle: dayData.subtitle,
                    background_image_url: dayData.background_image_url
                  }}
                  dayCards={getDisplayedCardsInSim()}
                  onSelectCard={(c) => {
                    setSelectedSimPuja(c);
                    setSimViewMode('detail');
                  }}
                  onSwitchDay={(dayVal) => {
                    setSelectedDayVal(dayVal);
                  }}
                />
              )}

              {/* Bottom Nav Bar Mock */}
              <SimulatorBottomNav />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
