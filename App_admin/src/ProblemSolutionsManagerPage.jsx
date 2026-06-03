import { useState, useEffect, useRef } from 'react';
import { Edit3, Trash2, Check, AlertTriangle, Upload, Loader2, Save, Send, Plus, X, ArrowLeft, ShoppingCart, Search, Share2, Star, ChevronDown, ChevronUp, Bell, Activity, Sparkles, Gift } from 'lucide-react';
import { supabase } from './lib/supabase';
import { uploadToR2 } from './lib/r2';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1609137144814-6c3614275f7e?auto=format&fit=crop&w=600&q=80';
const DEFAULT_COMBO_IMAGE = 'https://images.unsplash.com/photo-1545128485-c400e7702796?auto=format&fit=crop&w=600&q=80';

// --- Subcomponent: Sacred Tilak Icon --- //
const SacredTilak = () => (
  <div style={{
    width: '10px', height: '12px', borderLeft: '1.5px solid #f97316', borderRight: '1.5px solid #f97316',
    borderBottom: '1.5px solid #f97316', borderTop: '0px', borderBottomLeftRadius: '5px', borderBottomRightRadius: '5px',
    display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2px', marginRight: '2px', flexShrink: 0, position: 'relative'
  }}>
    <div style={{ width: '3.5px', height: '5px', borderRadius: '1.75px', backgroundColor: '#dc2626', marginTop: '-2px' }} />
  </div>
);

// --- Simulator Preview: Product Card Component --- //
const CardPreview = ({ data, width = '100%', imgHeight = '90px', onClick, viewType = 'feed', cart = {}, setCart }) => {
  const displayImage = data.image_url || DEFAULT_IMAGE;
  const isGrid = viewType === 'grid';
  const qty = cart[data.id] || 0;

  const handleAdd = (e) => {
    e.stopPropagation();
    if (setCart) {
      setCart(prev => ({ ...prev, [data.id]: 1 }));
    }
  };

  const handleInc = (e) => {
    e.stopPropagation();
    if (setCart) {
      setCart(prev => ({ ...prev, [data.id]: qty + 1 }));
    }
  };

  const handleDec = (e) => {
    e.stopPropagation();
    if (setCart) {
      setCart(prev => {
        const next = { ...prev };
        if (qty <= 1) {
          delete next[data.id];
        } else {
          next[data.id] = qty - 1;
        }
        return next;
      });
    }
  };

  return (
    <div 
      onClick={onClick}
      style={{ width: width, flexShrink: 0, fontFamily: '"Outfit", -apple-system, sans-serif', textAlign: 'left', cursor: onClick ? 'pointer' : 'default' }}
    >
      {/* Image with saffron soft border & rounded corners */}
      <div style={{ 
        position: 'relative', width: '100%', height: imgHeight, borderRadius: isGrid ? '12px' : '16px', overflow: 'hidden', 
        marginBottom: '6px', border: isGrid ? 'none' : '1px solid #fed7aa', backgroundColor: '#e2e8f0' 
      }}>
        <img src={displayImage} alt="Puja" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        
        {/* Floating Add Saffron Plus Button / Quantity Toggle */}
        {qty === 0 ? (
          <div 
            onClick={handleAdd}
            style={{
              position: 'absolute', bottom: '5px', right: '5px', backgroundColor: '#ea580c',
              width: '22px', height: '22px', borderRadius: '11px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#ffffff', fontSize: '14px', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(234, 88, 12, 0.3)',
              cursor: 'pointer', zIndex: 12
            }}
          >
            +
          </div>
        ) : (
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute', bottom: '5px', right: '5px', backgroundColor: '#ea580c',
              borderRadius: '10px', height: '20px', display: 'flex', alignItems: 'center', 
              gap: '6px', padding: '0 4px', boxShadow: '0 2px 4px rgba(234, 88, 12, 0.3)',
              zIndex: 12
            }}
          >
            <span 
              onClick={handleDec} 
              style={{ color: '#ffffff', fontSize: '13px', fontWeight: '900', cursor: 'pointer', padding: '0 3px' }}
            >
              -
            </span>
            <span style={{ color: '#ffffff', fontSize: '10px', fontWeight: '850', minWidth: '8px', textAlign: 'center' }}>
              {qty}
            </span>
            <span 
              onClick={handleInc} 
              style={{ color: '#ffffff', fontSize: '13px', fontWeight: '900', cursor: 'pointer', padding: '0 3px' }}
            >
              +
            </span>
          </div>
        )}
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
        {/* Tilak + Title */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px', minHeight: isGrid ? '28px' : '34px' }}>
          <SacredTilak />
          <h3 style={{ 
            margin: 0, fontSize: isGrid ? '10px' : '12px', fontWeight: '750', color: '#0f172a', lineHeight: isGrid ? '13px' : '15px', 
            overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' 
          }}>
            {data.title || 'Maha Laxmi Puja'}
          </h3>
        </div>
        
        {/* Price Row: strike original, yellow badge for current price */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
          <span style={{ fontSize: '10.5px', color: '#94a3b8', textDecoration: 'line-through', fontWeight: '500' }}>
            {data.original_price || '₹1,501'}
          </span>
          <div style={{ 
            backgroundColor: '#ffd60a', padding: '1px 5px', borderRadius: '2px', border: '1px solid #000',
            boxShadow: '1px 1px 0px #000000'
          }}>
            <span style={{ fontSize: '10.5px', fontWeight: '800', color: '#000' }}>
              {data.offer_price || '₹501'}
            </span>
          </div>
        </div>

        {/* Rating Badge (warm amber bg, saffron star) */}
        <div style={{ 
          display: 'inline-flex', alignItems: 'center', backgroundColor: '#fff7ed', 
          padding: '2px 6px', borderRadius: '4px', alignSelf: 'flex-start',
          border: '0.5px solid #ffedd5', marginBottom: '2px'
        }}>
          <span style={{ color: '#ea580c', fontSize: '8.5px', fontWeight: 'bold' }}>
            ★ {data.rating || '4.9'} ({data.reviews || '120'})
          </span>
        </div>

        {/* Soft Saffron Divider */}
        <div style={{ width: '20px', height: '1.5px', backgroundColor: '#fed7aa', margin: '2px 0', borderRadius: '1px' }}></div>

        {/* Sacred Temple Name */}
        <p style={{ 
          margin: 0, fontSize: '9px', color: '#c2410c', fontWeight: '600', 
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' 
        }}>
          {data.provider || 'Mahalakshmi Temple'}
        </p>
      </div>
    </div>
  );
};

// --- Simulator Preview: Detailed View Component (Scrollable Viewport) --- //
// --- Helper: get problem icon based on category/title --- //
const getProblemIcon = (title = '', imageUrl = '') => {
  if (imageUrl) return imageUrl;
  const lower = title.toLowerCase();
  if (lower.includes('health')) return '🏥';
  if (lower.includes('wealth') || lower.includes('money')) return '💰';
  if (lower.includes('job') || lower.includes('career')) return '💼';
  if (lower.includes('marriage') || lower.includes('love') || lower.includes('relation')) return '💍';
  if (lower.includes('grah') || lower.includes('shanti') || lower.includes('dosh')) return '🪐';
  return '✨';
};

// --- Simulator Preview: Detailed View Component (Scrollable Viewport) --- //
const DetailPreview = ({ data, selectedPackage, setSelectedPackage, comboQuantity, setComboQuantity, onBack }) => {
  const displayImage = data.image_url || DEFAULT_IMAGE;

  // Custom package defaults
  const singleTitleText = data.single_title || 'Single Sankalp';
  const singleDescText = data.single_description || 'Individual name & gotra Sankalp + Holy Prasad transit box.';
  const displaySinglePrice = data.single_price || '₹501';
  const displaySingleOriginalPrice = data.single_original_price || '₹1,501';

  const familyTitleText = data.family_title || 'Family Pariwar';
  const familyDescText = data.family_description || 'Full household (4 names) Sankalps + Consecrated copper yantra shield.';
  const displayFamilyPrice = data.family_price || '₹1,001';
  const displayFamilyOriginalPrice = data.family_original_price || '₹3,001';

  const singlePriceVal = parseInt(displaySinglePrice.toString().replace(/[^0-9]/g, '')) || 501;
  const singleOriginalPriceVal = parseInt(displaySingleOriginalPrice.toString().replace(/[^0-9]/g, '')) || 1501;
  const familyPriceVal = parseInt(displayFamilyPrice.toString().replace(/[^0-9]/g, '')) || 1001;
  const familyOriginalPriceVal = parseInt(displayFamilyOriginalPrice.toString().replace(/[^0-9]/g, '')) || 3001;

  // Interactive local accordion states
  const [expandedSection, setExpandedSection] = useState('benefits'); // 'benefits', 'steps', 'samagri', 'pandit', 'prasad'

  const toggleSection = (sectionName) => {
    setExpandedSection(expandedSection === sectionName ? '' : sectionName);
  };

  return (
    <div style={{ 
      height: '100%', overflowY: 'auto', backgroundColor: '#f8fafc',
      fontFamily: '"Outfit", -apple-system, sans-serif', paddingBottom: '90px',
      position: 'relative'
    }}>
      {/* Floating Header Overlay */}
      <div style={{ 
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px' 
      }}>
        <div 
          onClick={onBack}
          style={{ width: '30px', height: '30px', borderRadius: '15px', backgroundColor: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', cursor: 'pointer' }}
        >
          <ArrowLeft size={14} color="#0f172a" />
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <div style={{ width: '30px', height: '30px', borderRadius: '15px', backgroundColor: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <span style={{ fontSize: '12px', color: '#0f172a' }}>🔖</span>
          </div>
          <div style={{ width: '30px', height: '30px', borderRadius: '15px', backgroundColor: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <ShoppingCart size={14} color="#0f172a" />
          </div>
          <div style={{ width: '30px', height: '30px', borderRadius: '15px', backgroundColor: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <Share2 size={14} color="#0f172a" />
          </div>
        </div>
      </div>

      {/* Hero Image Section */}
      <div style={{ height: '220px', position: 'relative', flexShrink: 0, backgroundColor: '#fff' }}>
        <img src={displayImage} alt="Puja Detail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        {/* Dark overlay fade at bottom */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40px', background: 'linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 100%)' }}></div>
      </div>

      {/* Core Content Card - slides up smoothly in a white arched curve */}
      <div style={{
        marginTop: '-24px', backgroundColor: '#ffffff', borderTopLeftRadius: '28px', borderTopRightRadius: '28px',
        padding: '20px 16px', position: 'relative', zIndex: 5,
        boxShadow: '0 -4px 15px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9'
      }}>
        {/* Vedic Indicator badge */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
           <div style={{ width: '11px', height: '11px', border: '1.5px solid #f97316', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '5px' }}>
             <div style={{ width: '5px', height: '5px', backgroundColor: '#f97316', borderRadius: '2.5px' }}></div>
           </div>
           <span style={{ color: '#ea580c', fontSize: '10px', fontWeight: '800', letterSpacing: '0.2px', textTransform: 'uppercase' }}>
             {data.tag || '100% Pure Vedic Holy Seva'}
           </span>
        </div>

        <h2 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 4px 0', color: '#0f172a', lineHeight: '22px', textAlign: 'left' }}>
          {data.title || 'Maha Laxmi Puja'}
        </h2>
        <p style={{ margin: '0 0 12px 0', fontSize: '11.5px', color: '#64748b', lineHeight: '16px', fontWeight: '500', textAlign: 'left' }}>
          {data.tagline || 'Attracts financial abundance, clears outstanding debts, and brings luck to your home.'}
        </p>

        <div style={{ width: '100%', height: '1px', backgroundColor: '#f1f5f9', marginBottom: '12px' }}></div>
        
        {/* Rating and Devotees Block */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ backgroundColor: '#ea580c', color: 'white', padding: '2px 6px', borderRadius: '5px', display: 'flex', alignItems: 'center', gap: '3px', marginRight: '8px' }}>
            <Star size={10} fill="white" stroke="none" />
            <span style={{ fontSize: '10.5px', fontWeight: 'bold' }}>{data.rating || '4.9'}</span>
          </div>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '500' }}>
            {data.reviews || '120'} blessed devotees joined
          </span>
        </div>

        {/* Ritual Level Selection */}
        <div style={{ marginBottom: '20px', textAlign: 'left' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '10px', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.5px' }}>
            SELECT RITUAL LEVEL
          </h4>

          <div style={{ display: 'flex', gap: '8px' }}>
             {/* Single Sankalp */}
             <div 
               onClick={() => setSelectedPackage('single')}
               style={{ 
                 flex: 1, cursor: 'pointer',
                 backgroundColor: selectedPackage === 'single' ? '#fff7ed' : '#ffffff', 
                 border: selectedPackage === 'single' ? '1.5px solid #ea580c' : '1.5px solid #e2e8f0', 
                 borderRadius: '16px', padding: '10px',
                 boxShadow: '0 2px 4px rgba(0,0,0,0.01)',
                 transition: 'all 0.2s'
               }}
             >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ color: selectedPackage === 'single' ? '#ea580c' : '#1e293b', fontWeight: '800', fontSize: '12px' }}>
                    {singleTitleText}
                  </span>
                  <div style={{ 
                    width: '14px', height: '14px', borderRadius: '7px', 
                    border: selectedPackage === 'single' ? '1.5px solid #ea580c' : '1.5px solid #94a3b8', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center' 
                  }}>
                    {selectedPackage === 'single' && <div style={{ width: '6px', height: '6px', backgroundColor: '#ea580c', borderRadius: '3px' }}></div>}
                  </div>
                </div>
                <p style={{ fontSize: '9px', color: '#64748b', margin: '0 0 8px 0', lineHeight: '12px', minHeight: '36px', fontWeight: '500' }}>
                  {singleDescText}
                </p>
                <div style={{ width: '100%', height: '0.5px', backgroundColor: '#cbd5e1', marginBottom: '8px' }}></div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
                   <span style={{ fontSize: '14px', fontWeight: '800', color: selectedPackage === 'single' ? '#ea580c' : '#1e293b' }}>
                     {displaySinglePrice}
                   </span>
                   <span style={{ fontSize: '10px', color: '#94a3b8', textDecoration: 'line-through', fontWeight: '500' }}>
                     {displaySingleOriginalPrice}
                   </span>
                </div>
             </div>

             {/* Family Package */}
             <div 
               onClick={() => setSelectedPackage('family')}
               style={{ 
                 flex: 1, cursor: 'pointer',
                 backgroundColor: selectedPackage === 'family' ? '#fff7ed' : '#ffffff', 
                 border: selectedPackage === 'family' ? '1.5px solid #ea580c' : '1.5px solid #e2e8f0', 
                 borderRadius: '16px', padding: '10px',
                 boxShadow: '0 2px 4px rgba(0,0,0,0.01)',
                 transition: 'all 0.2s'
               }}
             >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ color: selectedPackage === 'family' ? '#ea580c' : '#1e293b', fontWeight: '800', fontSize: '12px' }}>
                    {familyTitleText}
                  </span>
                  <div style={{ 
                    width: '14px', height: '14px', borderRadius: '7px', 
                    border: selectedPackage === 'family' ? '1.5px solid #ea580c' : '1.5px solid #94a3b8', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center' 
                  }}>
                    {selectedPackage === 'family' && <div style={{ width: '6px', height: '6px', backgroundColor: '#ea580c', borderRadius: '3px' }}></div>}
                  </div>
                </div>
                <p style={{ fontSize: '9px', color: '#64748b', margin: '0 0 8px 0', lineHeight: '12px', minHeight: '36px', fontWeight: '500' }}>
                  {familyDescText}
                </p>
                <div style={{ width: '100%', height: '0.5px', backgroundColor: '#cbd5e1', marginBottom: '8px' }}></div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
                   <span style={{ fontSize: '14px', fontWeight: '800', color: selectedPackage === 'family' ? '#ea580c' : '#1e293b' }}>
                     {displayFamilyPrice}
                   </span>
                   <span style={{ fontSize: '10px', color: '#94a3b8', textDecoration: 'line-through', fontWeight: '500' }}>
                     {displayFamilyOriginalPrice}
                   </span>
                </div>
             </div>
          </div>
        </div>

        {/* Combined Pricing Block */}
        <div style={{ 
          backgroundColor: '#ffffff', borderRadius: '16px', padding: '12px', 
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
          boxShadow: '0 4px 8px rgba(0,0,0,0.02)', border: '1px solid #f1f5f9', marginBottom: '20px',
          textAlign: 'left'
        }}>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '9px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>
              Combo Special Offer
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ fontSize: '17px', fontWeight: '800', color: '#0f172a' }}>
                ₹{(selectedPackage === 'single' ? singlePriceVal : familyPriceVal) * comboQuantity}
              </span>
              <span style={{ fontSize: '11px', color: '#94a3b8', textDecoration: 'line-through', fontWeight: '500' }}>
                ₹{(selectedPackage === 'single' ? singleOriginalPriceVal : familyOriginalPriceVal) * comboQuantity}
              </span>
              <div style={{ backgroundColor: '#ffd60a', padding: '1px 4px', borderRadius: '3px', border: '0.5px solid #000' }}>
                 <span style={{ fontSize: '8px', fontWeight: '800', color: '#000' }}>SAVED 66%</span>
              </div>
            </div>
          </div>
          {/* Saffron Theme Quantity Pill */}
          <div style={{ backgroundColor: '#ea580c', borderRadius: '10px', padding: '3px', display: 'flex', alignItems: 'center', gap: '10px', marginLeft: '12px' }}>
            <button 
              type="button"
              onClick={() => comboQuantity > 1 && setComboQuantity(comboQuantity - 1)}
              style={{ width: '22px', height: '22px', backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', border: 'none' }}
            >
              -
            </button>
            <span style={{ fontSize: '12.5px', fontWeight: '700', color: 'white', minWidth: '12px', textAlign: 'center' }}>
              {comboQuantity}
            </span>
            <button 
              type="button"
              onClick={() => setComboQuantity(comboQuantity + 1)}
              style={{ width: '22px', height: '22px', backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', border: 'none' }}
            >
              +
            </button>
          </div>
        </div>

        {/* Benefits Accordion */}
        <div style={{ 
          backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', 
          marginBottom: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.01)', textAlign: 'left',
          overflow: 'hidden'
        }}>
          <div 
            onClick={() => toggleSection('benefits')}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', cursor: 'pointer' }}
          >
            <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>Divine Combined Benefits</h4>
            <span style={{ color: '#64748b', fontSize: '10px' }}>
              {expandedSection === 'benefits' ? '▲' : '▼'}
            </span>
          </div>
          {expandedSection === 'benefits' && (
            <div style={{ padding: '0 16px 12px 16px', borderTop: '0.5px solid #f1f5f9', paddingTop: '10px' }}>
              <div style={{ fontSize: '11.5px', color: '#475569', lineHeight: '17px', whiteSpace: 'pre-wrap', fontWeight: '500' }}>
                {data.benefits || '• Attracts abundance and clearing outstanding debts.'}
              </div>
            </div>
          )}
        </div>

        {/* Steps Accordion */}
        <div style={{ 
          backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', 
          marginBottom: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.01)', textAlign: 'left',
          overflow: 'hidden'
        }}>
          <div 
            onClick={() => toggleSection('steps')}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', cursor: 'pointer' }}
          >
            <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>Ritual steps</h4>
            <span style={{ color: '#64748b', fontSize: '10px' }}>
              {expandedSection === 'steps' ? '▲' : '▼'}
            </span>
          </div>
          {expandedSection === 'steps' && (
            <div style={{ padding: '0 16px 12px 16px', borderTop: '0.5px solid #f1f5f9', paddingTop: '10px' }}>
              <div style={{ fontSize: '11.5px', color: '#475569', lineHeight: '17px', whiteSpace: 'pre-wrap', fontWeight: '500' }}>
                {data.steps || 'Step 1. Sankalp\nStep 2. Chanting\nStep 3. Aarti'}
              </div>
            </div>
          )}
        </div>

        {/* Samagri Accordion */}
        <div style={{ 
          backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', 
          marginBottom: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.01)', textAlign: 'left',
          overflow: 'hidden'
        }}>
          <div 
            onClick={() => toggleSection('samagri')}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', cursor: 'pointer' }}
          >
            <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>Auspicious Samagri</h4>
            <span style={{ color: '#64748b', fontSize: '10px' }}>
              {expandedSection === 'samagri' ? '▲' : '▼'}
            </span>
          </div>
          {expandedSection === 'samagri' && (
            <div style={{ padding: '0 16px 12px 16px', borderTop: '0.5px solid #f1f5f9', paddingTop: '10px' }}>
              <div style={{ fontSize: '11.5px', color: '#475569', lineHeight: '17px', whiteSpace: 'pre-wrap', fontWeight: '500' }}>
                {data.samagri || 'Incense, Ghee, flowers, sacred gangajal threads.'}
              </div>
            </div>
          )}
        </div>

        {/* Pandit / Temple Accordion */}
        <div style={{ 
          backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', 
          marginBottom: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.01)', textAlign: 'left',
          overflow: 'hidden'
        }}>
          <div 
            onClick={() => toggleSection('pandit')}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', cursor: 'pointer' }}
          >
            <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>Pandit & Temple info</h4>
            <span style={{ color: '#64748b', fontSize: '10px' }}>
              {expandedSection === 'pandit' ? '▲' : '▼'}
            </span>
          </div>
          {expandedSection === 'pandit' && (
            <div style={{ padding: '0 16px 12px 16px', borderTop: '0.5px solid #f1f5f9', paddingTop: '10px' }}>
              <div style={{ fontSize: '11.5px', color: '#475569', lineHeight: '17px', fontWeight: '500' }}>
                <div style={{ marginBottom: '6px' }}><strong>Pandit:</strong> {data.pandit || 'Acharya Priests'}</div>
                <div><strong>Temple:</strong> {data.temple || 'Sacred Temple Altar'}</div>
              </div>
            </div>
          )}
        </div>

        {/* Prasad Shipping Accordion */}
        <div style={{ 
          backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', 
          marginBottom: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.01)', textAlign: 'left',
          overflow: 'hidden'
        }}>
          <div 
            onClick={() => toggleSection('prasad')}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', cursor: 'pointer' }}
          >
            <h4 style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>Prasad & Shipping</h4>
            <span style={{ color: '#64748b', fontSize: '10px' }}>
              {expandedSection === 'prasad' ? '▲' : '▼'}
            </span>
          </div>
          {expandedSection === 'prasad' && (
            <div style={{ padding: '0 16px 12px 16px', borderTop: '0.5px solid #f1f5f9', paddingTop: '10px' }}>
              <div style={{ fontSize: '11.5px', color: '#475569', lineHeight: '17px', fontWeight: '500' }}>
                {data.prasad || 'Prasad shipping boxes are shipped to your doorstep via premium cargo service.'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Static Fallbacks for Instant Simulator Preview --- //
const STATIC_PROBLEMS = [
  {
    id: '1',
    title: 'HEALTH\nPROBLEMS',
    color: '#b91c1c',
    gradient_start: '#fee2e2',
    gradient_end: '#fecaca',
    image_url: 'https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/health_problem.png',
    sort_order: 1
  },
  {
    id: '2',
    title: 'WEALTH &\nMONEY',
    color: '#a16207',
    gradient_start: '#fef9c3',
    gradient_end: '#fef08a',
    image_url: 'https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/Welth&Money.png',
    sort_order: 2
  },
  {
    id: '3',
    title: 'JOB &\nCAREER',
    color: '#1d4ed8',
    gradient_start: '#dbeafe',
    gradient_end: '#bfdbfe',
    image_url: 'https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/Job&career.png',
    sort_order: 3
  },
  {
    id: '4',
    title: 'MARRIAGE\n& LOVE',
    color: '#be185d',
    gradient_start: '#fce7f3',
    gradient_end: '#fbcfe8',
    image_url: 'https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/Marriage&Love.png',
    sort_order: 4
  },
  {
    id: '5',
    title: 'GRAH DOSH\n& SHANTI',
    color: '#6d28d9',
    gradient_start: '#f3e8ff',
    gradient_end: '#e9d5ff',
    image_url: 'https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/grah_dosh.png',
    sort_order: 5
  }
];

const STATIC_POOJAS = [
  {
    id: '1',
    title: 'Shiv Puja',
    original_price: '₹999',
    offer_price: '₹351',
    rating: '4.7',
    reviews: '190',
    provider: 'Omkareshwar Dham',
    image_url: 'https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/Omkarashwar.png',
    tag: 'Vedic Seva',
    problem_category: 'Health',
    requirement: '30-45 mins',
    status: 'published',
    sort_order: 1,
    tagline: 'Bestows perfect health, protects against sudden illness & negative forces.',
    benefits: '• Bestows perfect health and extreme longevity\n• Protects against sudden illnesses & evil eye\n• Establishes mental peace & divine security',
    steps: '• Personalized Shiv Sankalp with Name & Gotra\n• Rudrabhishek of Shiva Lingam with pure cow milk and honey\n• Recitation of Shiva Tandava Stotra by temple acharyas',
    samagri: 'Bilva leaves, sacred ashes (Bhasma), raw honey, gangajal, kusha grass',
    pandit: 'Acharya Vishwanath Dwivedi',
    temple: 'Omkareshwar Dham, Madhya Pradesh',
    prasad: 'Blessed Shiva Rudraksha bead, Mahadev Bhasma pack, sacred black thread.',
    other_info: 'Video proof of Sankalp shared on WhatsApp within 24 hours.',
    single_title: 'Single Sankalp',
    single_description: 'Individual name & gotra Sankalp + Holy Prasad transit box.',
    single_price: '₹351',
    single_original_price: '₹999',
    family_title: 'Family Pariwar',
    family_description: 'Full household (4 names) Sankalps + Consecrated copper yantra shield.',
    family_price: '₹700',
    family_original_price: '₹2,000'
  },
  {
    id: '2',
    title: 'Shanti Path',
    original_price: '₹499',
    offer_price: '₹151',
    rating: '4.9',
    reviews: '150',
    provider: 'Haridwar Acharyas',
    image_url: 'https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/god1.png',
    tag: 'Vedic Seva',
    problem_category: 'Health',
    requirement: '30 mins',
    status: 'published',
    sort_order: 2,
    tagline: 'Brings absolute mental peace, family harmony, and removes home stress.',
    benefits: '• Resolves severe family stress, arguments, and hot tempers\n• Bestows absolute mental peace, sleep, and emotional balance\n• Cleanses negative home vibes (vastu blocks)',
    steps: '• Personalized Shanti Sankalp with Name & Gotra\n• Shanti Mantra chanting and Vedic peace prayers\n• Offering of sacred grains into the holy fire',
    samagri: 'White sandalwood, sacred grains, cow ghee, gangajal, pure incense',
    pandit: 'Acharya Ramanand Shastri',
    temple: 'Ganga Ghat Altar, Haridwar',
    prasad: 'Holy gangajal bottle, sacred white thread, crystal sphatik bead.',
    other_info: 'Video proof of Sankalp shared on WhatsApp within 24 hours.',
    single_title: 'Single Sankalp',
    single_description: 'Individual name & gotra Sankalp + Holy Prasad transit box.',
    single_price: '₹151',
    single_original_price: '₹499',
    family_title: 'Family Pariwar',
    family_description: 'Full household (4 names) Sankalps + Consecrated copper yantra shield.',
    family_price: '₹300',
    family_original_price: '₹1,000'
  },
  {
    id: '3',
    title: 'Laxmi Puja',
    original_price: '₹3,100',
    offer_price: '₹1,100',
    rating: '4.9',
    reviews: '280',
    provider: 'Mahalakshmi Priests',
    image_url: 'https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/Jai_Mahalakshmi.jpeg',
    tag: 'Wealth',
    problem_category: 'Wealth',
    requirement: '60-90 mins',
    status: 'published',
    sort_order: 1,
    tagline: 'Attracts financial abundance, clears outstanding debts, and brings luck to your home.',
    benefits: '• Unlocks new wealth avenues, business growth, and professional success\n• Cleanses negative financial blocks and helps in debt clearance\n• Welcomes lasting household abundance and luxury',
    steps: '• Personalized Laxmi Sankalp with Name & Gotra\n• Chanting of Sri Suktam and Lakshmi Ashtothra Shatanamavali\n• Shringar offering with red lotus flowers and dry fruits',
    samagri: 'Lotus seed kamalgatta, fresh red lotus, yellow cowries, pure cow ghee',
    pandit: 'Pandit Ramesh Chaturvedi',
    temple: 'Mahalakshmi Temple, Mumbai',
    prasad: 'Saffron-infused sweets, blessed red thread, golden Lakshmi-Kuber card.',
    other_info: 'Video proof of Sankalp shared on WhatsApp within 24 hours.',
    single_title: 'Single Sankalp',
    single_description: 'Individual name & gotra Sankalp + Holy Prasad transit box.',
    single_price: '₹1,100',
    single_original_price: '₹3,100',
    family_title: 'Family Pariwar',
    family_description: 'Full household (4 names) Sankalps + Consecrated copper yantra shield.',
    family_price: '₹2,200',
    family_original_price: '₹6,200'
  },
  {
    id: '4',
    title: 'Tirupati Puja',
    original_price: '₹5,100',
    offer_price: '₹2,100',
    rating: '5.0',
    reviews: '420',
    provider: 'Tirumala Devasthanam',
    image_url: 'https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/Lord_Venkateswara.png',
    tag: 'Wealth',
    problem_category: 'Wealth',
    requirement: '120 mins',
    status: 'published',
    sort_order: 2,
    tagline: 'Bestows divine protection, health, and extreme wealth blessings.',
    benefits: '• Bestows divine protection and family peace\n• Grants extreme wealth, property, and career abundance\n• Removes negatives, curses, and legal discords',
    steps: '• Personalized Tirupati Sankalp with Name & Gotra\n• Venkateswara Archana and Kalyanotsavam chants\n• Pushpa Yagam flower offering to the deity',
    samagri: 'Sacred tulsi leaves, chandan, camphor, coconut, banana offerings',
    pandit: 'Swami Venkatesh Acharya',
    temple: 'Tirumala Hills Shrine, Andhra Pradesh',
    prasad: 'Authentic Tirupati Laddu, consecrated Tulsi leaves, holy yellow thread.',
    other_info: 'Video proof of Sankalp shared on WhatsApp within 24 hours.',
    single_title: 'Single Sankalp',
    single_description: 'Individual name & gotra Sankalp + Holy Prasad transit box.',
    single_price: '₹2,100',
    single_original_price: '₹5,100',
    family_title: 'Family Pariwar',
    family_description: 'Full household (4 names) Sankalps + Consecrated copper yantra shield.',
    family_price: '₹4,200',
    family_original_price: '₹10,200'
  },
  {
    id: '5',
    title: 'Ganesh Puja',
    original_price: '₹1,501',
    offer_price: '₹501',
    rating: '4.8',
    reviews: '120',
    provider: 'Siddhi Vinayak Mandir',
    image_url: 'https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/god.png',
    tag: 'Vedic Seva',
    problem_category: 'Job & Career',
    requirement: '45-60 mins',
    status: 'published',
    sort_order: 1,
    tagline: 'Removes all obstacles and brings success, peace, and auspicious beginnings.',
    benefits: '• Bestows divine blessings of Lord Ganesha for success in all ventures\n• Clears negative vibes and obstacles from your career or business\n• Brings home peace, harmony, and infinite prosperity',
    steps: '• Personalized Ganesha Sankalp with Name & Gotra\n• Recitation of Ganapati Atharvashirsha by Kashi Pandits\n• Sweet modak and red flower offerings at temple shrine',
    samagri: 'Sacred Durva grass, fresh modaks, red hibiscus, raw saffron, gangajal',
    pandit: 'Acharya Ramachandra Shastri',
    temple: 'Siddhi Vinayak Temple, Mumbai',
    prasad: 'Special modak prasad box, blessed raksha sutra, Ganesha pocket photo.',
    other_info: 'Video proof of Sankalp shared on WhatsApp within 24 hours.',
    single_title: 'Single Sankalp',
    single_description: 'Individual name & gotra Sankalp + Holy Prasad transit box.',
    single_price: '₹501',
    single_original_price: '₹1,501',
    family_title: 'Family Pariwar',
    family_description: 'Full household (4 names) Sankalps + Consecrated copper yantra shield.',
    family_price: '₹1,001',
    family_original_price: '₹3,001'
  },
  {
    id: '6',
    title: 'Navgrah Homa',
    original_price: '₹4,500',
    offer_price: '₹1,500',
    rating: '4.7',
    reviews: '175',
    provider: 'Kashi Vedic Pandits',
    image_url: 'https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/god5.jpeg',
    tag: 'Protection',
    problem_category: 'Grah Dosh',
    requirement: '90 mins',
    status: 'published',
    sort_order: 1,
    tagline: 'Balances all 9 planets in your birth chart, removing doshas & obstacles.',
    benefits: '• Calms down unfavorable planets (Rahu, Ketu, Shani) in chart\n• Unlocks massive career, marriage, and financial opportunities\n• Protects against unexpected accidents and blockages',
    steps: '• Personalized Navgrah Sankalp with Name & Gotra\n• Vedic chants for all 9 planets performed by 3 Kashi Pandits\n• Dynamic Navgrah Havan ritual using planetary herbs',
    samagri: '9 types of sacred grains (Navadhanya), planet-specific herbs, ghee',
    pandit: 'Pandit Somnath Dwivedi',
    temple: 'Sacred Altar of Kashi, Varanasi',
    prasad: 'Energized Navgrah copper yantra, planet-blessed black thread, dry fruit mewa.',
    other_info: 'Video proof of Sankalp shared on WhatsApp within 24 hours.',
    single_title: 'Single Sankalp',
    single_description: 'Individual name & gotra Sankalp + Holy Prasad transit box.',
    single_price: '₹1,500',
    single_original_price: '₹4,500',
    family_title: 'Family Pariwar',
    family_description: 'Full household (4 names) Sankalps + Consecrated copper yantra shield.',
    family_price: '₹3,000',
    family_original_price: '₹9,000'
  },
  {
    id: '7',
    title: 'Hanuman Puja',
    original_price: '₹799',
    offer_price: '₹251',
    rating: '4.9',
    reviews: '230',
    provider: 'Bajrang Dham',
    image_url: 'https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/Mahakal_Ujjain.png',
    tag: 'Protection',
    problem_category: 'Grah Dosh',
    requirement: '45 mins',
    status: 'published',
    sort_order: 2,
    tagline: 'Overcomes all fear, destroys negative forces, and brings victory.',
    benefits: '• Overcomes fear, anxiety, and internal psychological blockages\n• Destroys negative energies, curses, and evil eye blocks\n• Bestows absolute physical strength and career victory',
    steps: '• Personalized Hanuman Sankalp with Name & Gotra\n• Recitation of Hanuman Chalisa & Bajrang Baan 11 times\n• Sindoor & jasmine oil offering to Lord Hanuman',
    samagri: 'Orange vermilion sindoor, jasmine oil, basil leaves, red flowers, coconut',
    pandit: 'Pandit Somnath Vyas',
    temple: 'Bajrang Dham Temple',
    prasad: 'Hanuman protection thread, consecrated orange vermilion pack, Hanuman locket.',
    other_info: 'Video proof of Sankalp shared on WhatsApp within 24 hours.',
    single_title: 'Single Sankalp',
    single_description: 'Individual name & gotra Sankalp + Holy Prasad transit box.',
    single_price: '₹251',
    single_original_price: '₹799',
    family_title: 'Family Pariwar',
    family_description: 'Full household (4 names) Sankalps + Consecrated copper yantra shield.',
    family_price: '₹500',
    family_original_price: '₹1,600'
  }
];

// --- Main CRUD Page Component --- //
const ProblemSolutionsManagerPage = () => {
  const [problems, setProblems] = useState([]);
  const [poojas, setPoojas] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // High Level Mode: 'problems' or 'poojas'
  const [managerMode, setManagerMode] = useState('problems');
  
  // Editor and Form State
  const [formTab, setFormTab] = useState('basic'); // 'basic', 'detail', 'packages'
  const [isEditingId, setIsEditingId] = useState(null);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  
  // Simulator State
  const [previewMode, setPreviewMode] = useState('home'); // 'home', 'puja', 'detail'
  const [simSelectedCategory, setSimSelectedCategory] = useState('Health');
  const [simSelectedPackage, setSimSelectedPackage] = useState('single');
  const [simComboQuantity, setSimComboQuantity] = useState(1);
  const [simPujaSubTab, setSimPujaSubTab] = useState('Pujas'); // 'Pujas' or 'Problems'
  const [simCart, setSimCart] = useState({});

  // Image uploads refs & state
  const mainImageInputRef = useRef(null);
  const iconInputRef = useRef(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Initial Form Data Templates
  const initialProblemState = {
    title: '',
    color: '#b91c1c',
    gradient_start: '#fee2e2',
    gradient_end: '#fecaca',
    image_url: '',
    sort_order: ''
  };

  const initialPoojaState = {
    title: '',
    original_price: '₹1,501',
    offer_price: '₹501',
    rating: '4.9',
    reviews: '120',
    provider: '',
    image_url: '',
    tag: 'Vedic Seva',
    problem_category: 'Health',
    requirement: '45-60 mins',
    is_active: true,
    status: 'published',
    tagline: '',
    benefits: '',
    steps: '',
    samagri: '',
    pandit: '',
    temple: '',
    prasad: '',
    other_info: '',
    single_title: 'Single Sankalp',
    single_description: 'Individual name & gotra Sankalp + Holy Prasad transit box.',
    single_price: '₹501',
    single_original_price: '₹1,501',
    family_title: 'Family Pariwar',
    family_description: 'Full household (4 names) Sankalps + Consecrated copper yantra shield.',
    family_price: '₹1,001',
    family_original_price: '₹3,001',
    sort_order: ''
  };

  const [problemForm, setProblemForm] = useState(initialProblemState);
  const [poojaForm, setPoojaForm] = useState(initialPoojaState);

  const showMessage = (msg, isError = false) => {
    if (isError) {
      setError(msg);
      setTimeout(() => setError(null), 4000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: probData, error: probErr } = await supabase
        .from('life_problems')
        .select('*')
        .order('sort_order', { ascending: true });
      if (probErr) throw probErr;
      setProblems(probData || []);

      const { data: poojaData, error: poojaErr } = await supabase
        .from('problem_poojas')
        .select('*')
        .order('sort_order', { ascending: true });
      if (poojaErr) throw poojaErr;
      setPoojas(poojaData || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      showMessage(err.message, true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Input Change Handlers --- //
  const handleProblemChange = (e) => {
    const { name, value } = e.target;
    setProblemForm(prev => ({ ...prev, [name]: value }));
  };

  const handlePoojaChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPoojaForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // --- Cloudflare R2 Uploaders --- //
  const triggerImageUpload = async (e, type = 'pooja') => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const folder = type === 'pooja' ? 'problem-poojas' : 'life-problems';
      const publicUrl = await uploadToR2(file, folder);
      if (type === 'pooja') {
        setPoojaForm(prev => ({ ...prev, image_url: publicUrl }));
      } else {
        setProblemForm(prev => ({ ...prev, image_url: publicUrl }));
      }
      showMessage('Image uploaded successfully to Cloudflare!');
    } catch (err) {
      console.error('R2 upload failed:', err);
      showMessage(err.message || 'R2 Upload error', true);
    } finally {
      setUploadingImage(false);
    }
  };

  // --- CRUD Actions: Life Problems --- //
  const saveProblem = async () => {
    if (!problemForm.title) {
      showMessage('Problem Title is required.', true);
      return;
    }
    const cleanData = {
      ...problemForm,
      sort_order: problemForm.sort_order !== '' && problemForm.sort_order !== null ? parseInt(problemForm.sort_order, 10) : null
    };

    try {
      const isUuid = isEditingId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(isEditingId);
      if (isEditingId && isUuid) {
        const { error: err } = await supabase.from('life_problems').update(cleanData).eq('id', isEditingId);
        if (err) throw err;
        showMessage('Homepage Problem card updated successfully!');
      } else {
        const { id, ...insertData } = cleanData;
        const { error: err } = await supabase.from('life_problems').insert([insertData]);
        if (err) throw err;
        showMessage('New Homepage Problem card added!');
      }
      setProblemForm(initialProblemState);
      setIsEditingId(null);
      fetchData();
    } catch (err) {
      showMessage(err.message, true);
    }
  };

  const deleteProblem = async (id) => {
    if (!window.confirm('Delete this problem card? This will remove it from the home page.')) return;
    try {
      const isUuid = id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      if (isUuid) {
        const { error: err } = await supabase.from('life_problems').delete().eq('id', id);
        if (err) throw err;
      }
      showMessage('Problem card deleted.');
      fetchData();
    } catch (err) {
      showMessage(err.message, true);
    }
  };

  // --- CRUD Actions: Problem Pujas --- //
  const savePooja = async (statusOverride) => {
    if (!poojaForm.title || !poojaForm.provider) {
      showMessage('Title and Provider are required.', true);
      return;
    }
    const finalStatus = statusOverride || poojaForm.status;
    const cleanData = {
      ...poojaForm,
      status: finalStatus,
      sort_order: poojaForm.sort_order !== '' && poojaForm.sort_order !== null ? parseInt(poojaForm.sort_order, 10) : null
    };

    try {
      const isUuid = isEditingId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(isEditingId);
      if (isEditingId && isUuid) {
        const { error: err } = await supabase.from('problem_poojas').update(cleanData).eq('id', isEditingId);
        if (err) throw err;
        showMessage(`Problem Puja updated as ${finalStatus}!`);
      } else {
        const { id, ...insertData } = cleanData;
        const { error: err } = await supabase.from('problem_poojas').insert([insertData]);
        if (err) throw err;
        showMessage(`New Problem Puja added as ${finalStatus}!`);
      }
      setPoojaForm(initialPoojaState);
      setIsEditingId(null);
      fetchData();
    } catch (err) {
      showMessage(err.message, true);
    }
  };

  const deletePooja = async (id) => {
    if (!window.confirm('Delete this problem Puja?')) return;
    try {
      const isUuid = id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      if (isUuid) {
        const { error: err } = await supabase.from('problem_poojas').delete().eq('id', id);
        if (err) throw err;
      }
      showMessage('Problem Puja deleted.');
      fetchData();
    } catch (err) {
      showMessage(err.message, true);
    }
  };

  const handleEditInit = (item, type = 'problem') => {
    setIsEditingId(item.id);
    if (type === 'problem') {
      setProblemForm({
        ...initialProblemState,
        ...item,
        sort_order: item.sort_order !== null ? item.sort_order : ''
      });
      setManagerMode('problems');
    } else {
      setPoojaForm({
        ...initialPoojaState,
        ...item,
        sort_order: item.sort_order !== null ? item.sort_order : ''
      });
      setManagerMode('poojas');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- Realtime Simulator Data Mergers --- //
  const getSimProblems = () => {
    let items = [...STATIC_PROBLEMS];
    if (problems.length > 0) {
      const normalize = (t) => t?.replace(/[^a-zA-Z]/g, '').toLowerCase() || '';
      problems.forEach(dbProb => {
        const dbNorm = normalize(dbProb.title);
        const index = items.findIndex(item => normalize(item.title) === dbNorm);
        if (index !== -1) {
          items[index] = { ...items[index], ...dbProb };
        } else {
          items.push(dbProb);
        }
      });
    }

    let isEditingFound = false;
    if (managerMode === 'problems' && isEditingId) {
      items = items.map(p => {
        if (p.id === isEditingId) {
          isEditingFound = true;
          return { ...p, ...problemForm };
        }
        return p;
      });
      if (!isEditingFound) {
        items.push({ id: isEditingId, ...problemForm });
      }
    }

    if (managerMode === 'problems' && !isEditingId && problemForm.title) {
      items.push({ id: 'temp-problem-id', ...problemForm });
    }

    items.sort((a, b) => {
      const orderA = a.sort_order !== undefined && a.sort_order !== null && a.sort_order !== '' ? Number(a.sort_order) : Infinity;
      const orderB = b.sort_order !== undefined && b.sort_order !== null && b.sort_order !== '' ? Number(b.sort_order) : Infinity;
      return orderA - orderB;
    });

    return items;
  };

  const getSimPujas = (categoryFilter) => {
    let dbItems = poojas.filter(p => 
      p.problem_category?.toLowerCase().includes(categoryFilter.toLowerCase()) && 
      p.status === 'published'
    );
    
    let baseItems = dbItems.length > 0 ? dbItems : STATIC_POOJAS.filter(p => 
      p.problem_category?.toLowerCase().includes(categoryFilter.toLowerCase())
    );
    
    let items = [...baseItems];
    let isEditingFound = false;

    if (managerMode === 'poojas' && isEditingId) {
      if (poojaForm.problem_category?.toLowerCase().includes(categoryFilter.toLowerCase())) {
        items = items.map(p => {
          if (p.id === isEditingId) {
            isEditingFound = true;
            return { ...p, ...poojaForm };
          }
          return p;
        });
        
        if (!isEditingFound) {
          items = items.filter(p => p.id !== isEditingId);
          items.unshift({ id: isEditingId, ...poojaForm });
          isEditingFound = true;
        }
      } else {
        items = items.filter(p => p.id !== isEditingId);
      }
    }

    if (managerMode === 'poojas' && !isEditingId && poojaForm.title) {
      if (poojaForm.problem_category?.toLowerCase().includes(categoryFilter.toLowerCase())) {
        items.unshift({ id: 'temp-pooja-id', ...poojaForm });
      }
    }

    items.sort((a, b) => {
      const orderA = a.sort_order !== undefined && a.sort_order !== null && a.sort_order !== '' ? Number(a.sort_order) : Infinity;
      const orderB = b.sort_order !== undefined && b.sort_order !== null && b.sort_order !== '' ? Number(b.sort_order) : Infinity;
      return orderA - orderB;
    });

    return items;
  };

  const handlePreviewModeChange = (mode) => {
    setPreviewMode(mode);
    if (mode === 'home') {
      setManagerMode('problems');
      const currentProbs = getSimProblems();
      if (currentProbs.length > 0) {
        const exists = currentProbs.find(p => p.id === isEditingId);
        if (!exists) {
          handleEditInit(currentProbs[0], 'problem');
        }
      }
    } else {
      setManagerMode('poojas');
      const currentPujas = getSimPujas(simSelectedCategory);
      if (currentPujas.length > 0) {
        const exists = currentPujas.find(p => p.id === isEditingId);
        if (!exists) {
          handleEditInit(currentPujas[0], 'pooja');
        }
      }
    }
  };

  const handleSimCategoryChange = (cat) => {
    setSimSelectedCategory(cat);
    const matchingPujas = getSimPujas(cat);
    if (matchingPujas.length > 0) {
      handleEditInit(matchingPujas[0], 'pooja');
    } else {
      setIsEditingId(null);
      setPoojaForm({
        ...initialPoojaState,
        problem_category: cat
      });
    }
  };

  const renderTabBar = () => {
    return (
      <div style={{ 
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '48px', 
        backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0', display: 'flex', 
        justifyContent: 'space-around', alignItems: 'center', zIndex: 10 
      }}>
        <span 
          style={{ fontSize: '18px', color: previewMode === 'home' ? '#ea580c' : '#94a3b8', cursor: 'pointer' }} 
          onClick={() => handlePreviewModeChange('home')}
        >
          🏠
        </span>
        <span 
          style={{ fontSize: '18px', color: previewMode === 'puja' ? '#ea580c' : '#94a3b8', cursor: 'pointer' }} 
          onClick={() => handlePreviewModeChange('puja')}
        >
          🕉️
        </span>
        <span 
          style={{ fontSize: '18px', color: previewMode === 'view_all' ? '#ea580c' : '#94a3b8', cursor: 'pointer' }} 
          onClick={() => handlePreviewModeChange('view_all')}
        >
          🛍️
        </span>
        <span style={{ fontSize: '18px', color: '#94a3b8', cursor: 'default' }}>👤</span>
      </div>
    );
  };

  return (
    <div className="page-container" style={{ color: '#f8fafc', padding: '24px' }}>
      <div className="page-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '28px', fontWeight: '800', margin: 0 }}>Life Problem Solution Manager</h1>
          <p className="page-subtitle" style={{ fontSize: '14px', color: '#94a3b8', marginTop: '4px' }}>Sync Homepage problems and dynamic problem Pujas dynamically</p>
        </div>

        {/* Global mode switcher */}
        <div style={{ display: 'flex', gap: '8px', backgroundColor: '#1e293b', padding: '4px', borderRadius: '10px' }}>
          <button 
            onClick={() => { 
              setManagerMode('problems'); 
              setPreviewMode('home'); 
              const currentProbs = getSimProblems();
              if (currentProbs.length > 0) {
                handleEditInit(currentProbs[0], 'problem');
              } else {
                setIsEditingId(null);
                setProblemForm(initialProblemState);
              }
            }}
            style={{ 
              padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px',
              backgroundColor: managerMode === 'problems' ? '#ea580c' : 'transparent',
              color: '#ffffff'
            }}
          >
            1. Home Problem Cards
          </button>
          <button 
            onClick={() => { 
              setManagerMode('poojas'); 
              setPreviewMode('puja'); 
              const currentPujas = getSimPujas(simSelectedCategory);
              if (currentPujas.length > 0) {
                handleEditInit(currentPujas[0], 'pooja');
              } else {
                setIsEditingId(null);
                setPoojaForm(initialPoojaState);
              }
            }}
            style={{ 
              padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px',
              backgroundColor: managerMode === 'poojas' ? '#ea580c' : 'transparent',
              color: '#ffffff'
            }}
          >
            2. Problem Pujas
          </button>
        </div>
      </div>

      {error && <div className="alert error" style={{ display: 'flex', gap: '8px', padding: '12px', backgroundColor: 'rgba(239,68,68,0.15)', border: '1px solid #ef4444', borderRadius: '8px', marginBottom: '16px', color: '#f87171' }}><AlertTriangle size={18} /><span>{error}</span></div>}
      {successMsg && <div className="alert success" style={{ display: 'flex', gap: '8px', padding: '12px', backgroundColor: 'rgba(16,185,129,0.15)', border: '1px solid #10b981', borderRadius: '8px', marginBottom: '16px', color: '#34d399' }}><Check size={18} /><span>{successMsg}</span></div>}

      <div className="manager-split-layout" style={{ display: 'flex', gap: '24px' }}>
        {/* Left Side: Editor Section */}
        <div className="manager-form-section" style={{ flex: 1 }}>
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', padding: '24px', backgroundColor: '#161622', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
            
            {/* Form Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 className="card-title" style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>
                {isEditingId ? 'Edit Record' : 'Add New Record'} ({managerMode === 'problems' ? 'Life Problem Card' : 'Problem Puja'})
              </h2>
              {isEditingId && (
                <button 
                  onClick={() => { setIsEditingId(null); setProblemForm(initialProblemState); setPoojaForm(initialPoojaState); }}
                  style={{ color: '#f87171', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <X size={14} /> Cancel Edit
                </button>
              )}
            </div>

            {/* --- FORM A: HOME PROBLEMS --- */}
            {managerMode === 'problems' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div className="form-group">
                    <label>Problem Card Title *</label>
                    <input type="text" name="title" value={problemForm.title} onChange={handleProblemChange} className="input-field" placeholder="e.g. HEALTH\nPROBLEMS" />
                    <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px', display: 'block' }}>Use \n for double line breaks</span>
                  </div>
                  <div className="form-group">
                    <label>Sort Order Index</label>
                    <input type="number" name="sort_order" value={problemForm.sort_order} onChange={handleProblemChange} className="input-field" placeholder="e.g. 1, 2..." />
                  </div>
                  <div className="form-group">
                    <label>Text Tag Color</label>
                    <input type="text" name="color" value={problemForm.color} onChange={handleProblemChange} className="input-field" placeholder="Hex color e.g. #b91c1c" />
                  </div>
                  <div className="form-group">
                    <label>Gradient Start Theme</label>
                    <input type="text" name="gradient_start" value={problemForm.gradient_start} onChange={handleProblemChange} className="input-field" placeholder="Hex e.g. #fee2e2" />
                  </div>
                  <div className="form-group">
                    <label>Gradient End Theme</label>
                    <input type="text" name="gradient_end" value={problemForm.gradient_end} onChange={handleProblemChange} className="input-field" placeholder="Hex e.g. #fecaca" />
                  </div>

                  {/* Icon Upload Box */}
                  <div className="form-group" style={{ gridColumn: 'span 2' }}>
                    <label>Visual Card Icon * <span style={{ fontSize: '11.5px', color: '#ea580c', fontWeight: 'bold', marginLeft: '5px' }}>(Recommended: 380 x 280 px, 4:3 ratio)</span></label>
                    <p style={{ fontSize: '11px', color: '#94a3b8', margin: '2px 0 8px 0', lineHeight: '14px' }}>
                      Images are automatically cropped and fitted to fully cover the colored block in both the app and the live simulator preview.
                    </p>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginTop: '4px', marginBottom: '8px' }}>
                      <button 
                        type="button" 
                        onClick={() => iconInputRef.current.click()}
                        style={{ padding: '10px 16px', borderRadius: '8px', background: '#334155', color: 'white', display: 'flex', gap: '8px', alignItems: 'center', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        {uploadingImage ? <Loader2 size={16} className="spinner animate-spin" /> : <Upload size={16} />}
                        Upload Icon (Cloudflare)
                      </button>
                      <input 
                        type="file" 
                        ref={iconInputRef}
                        accept="image/*" 
                        onChange={(e) => triggerImageUpload(e, 'problem')} 
                        style={{ display: 'none' }} 
                      />
                      {problemForm.image_url && <span style={{ fontSize: '12px', color: '#10b981' }}>Icon Uploaded!</span>}
                    </div>
                    <label style={{ marginTop: '6px', display: 'block' }}>Or Icon Image URL</label>
                    <input 
                      type="text" 
                      name="image_url" 
                      value={problemForm.image_url || ''} 
                      onChange={handleProblemChange} 
                      className="input-field" 
                      placeholder="Paste icon image URL directly" 
                    />
                  </div>
                </div>

                <button onClick={saveProblem} style={{ backgroundColor: '#ea580c', color: 'white', padding: '12px', borderRadius: '10px', fontWeight: 'bold', display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center', marginTop: '12px' }}>
                  <Save size={18} /> {isEditingId ? 'Save Problem Card' : 'Add Problem Card'}
                </button>
              </div>
            )}

            {/* --- FORM B: PROBLEM PUJAS --- */}
            {managerMode === 'poojas' && (
              <div>
                {/* Form Tabs Switcher */}
                <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '20px', gap: '8px' }}>
                  <button type="button" onClick={() => setFormTab('basic')} style={{ padding: '10px 16px', borderBottom: formTab === 'basic' ? '3px solid #ea580c' : '3px solid transparent', color: formTab === 'basic' ? '#ffffff' : '#94a3b8', fontWeight: '700', fontSize: '13px' }}>1. Basic Info</button>
                  <button type="button" onClick={() => setFormTab('detail')} style={{ padding: '10px 16px', borderBottom: formTab === 'detail' ? '3px solid #ea580c' : '3px solid transparent', color: formTab === 'detail' ? '#ffffff' : '#94a3b8', fontWeight: '700', fontSize: '13px' }}>2. Details & Accordions</button>
                  <button type="button" onClick={() => setFormTab('packages')} style={{ padding: '10px 16px', borderBottom: formTab === 'packages' ? '3px solid #ea580c' : '3px solid transparent', color: formTab === 'packages' ? '#ffffff' : '#94a3b8', fontWeight: '700', fontSize: '13px' }}>3. Packages Config</button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', maxH: '450px', paddingRight: '6px' }}>
                  {formTab === 'basic' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div className="form-group">
                          <label>Puja Title *</label>
                          <input type="text" name="title" value={poojaForm.title} onChange={handlePoojaChange} className="input-field" placeholder="e.g. Shiv Puja" />
                        </div>
                        <div className="form-group">
                          <label>Problem Category Mapping *</label>
                          <select name="problem_category" value={poojaForm.problem_category} onChange={handlePoojaChange} className="input-field" style={{ backgroundColor: '#1e293b' }}>
                            <option value="Health">Health Problems</option>
                            <option value="Wealth">Wealth & Money</option>
                            <option value="Job & Career">Job & Career</option>
                            <option value="Marriage & Love">Marriage & Love</option>
                            <option value="Grah Dosh">Grah Dosh & Shanti</option>
                            <option value="Education">Education & Focus</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Strike Price</label>
                          <input type="text" name="original_price" value={poojaForm.original_price} onChange={handlePoojaChange} className="input-field" />
                        </div>
                        <div className="form-group">
                          <label>Offer Price</label>
                          <input type="text" name="offer_price" value={poojaForm.offer_price} onChange={handlePoojaChange} className="input-field" />
                        </div>
                        <div className="form-group">
                          <label>Sacred Temple Provider *</label>
                          <input type="text" name="provider" value={poojaForm.provider} onChange={handlePoojaChange} className="input-field" placeholder="e.g. Omkareshwar Dham" />
                        </div>
                        <div className="form-group">
                          <label>Puja Duration Tag</label>
                          <input type="text" name="requirement" value={poojaForm.requirement} onChange={handlePoojaChange} className="input-field" placeholder="e.g. 45 mins" />
                        </div>
                        <div className="form-group">
                          <label>Sort Order Index</label>
                          <input type="number" name="sort_order" value={poojaForm.sort_order} onChange={handlePoojaChange} className="input-field" />
                        </div>
                        <div className="form-group">
                          <label>Rating (e.g. 4.9)</label>
                          <input type="text" name="rating" value={poojaForm.rating} onChange={handlePoojaChange} className="input-field" placeholder="e.g. 4.9" />
                        </div>
                        <div className="form-group">
                          <label>Reviews Count (e.g. 120)</label>
                          <input type="text" name="reviews" value={poojaForm.reviews} onChange={handlePoojaChange} className="input-field" placeholder="e.g. 120" />
                        </div>
                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                          <label>Vedic Tag (shows on top of Detail Page)</label>
                          <input type="text" name="tag" value={poojaForm.tag} onChange={handlePoojaChange} className="input-field" placeholder="e.g. 100% Pure Vedic Holy Seva" />
                        </div>
                        <div className="form-group" style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '10px', gridColumn: 'span 2' }}>
                          <input type="checkbox" name="is_active" checked={poojaForm.is_active} onChange={handlePoojaChange} id="is_active" style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                          <label htmlFor="is_active" style={{ margin: 0, cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>Is Active (visible in app)</label>
                        </div>
                      </div>

                      {/* Main Image Upload Box */}
                      <div className="form-group" style={{ gridColumn: 'span 2', marginTop: '10px' }}>
                        <label>Main Puja Image *</label>
                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginTop: '4px', marginBottom: '8px' }}>
                          <button 
                            type="button" 
                            onClick={() => mainImageInputRef.current.click()}
                            style={{ padding: '10px 16px', borderRadius: '8px', background: '#334155', color: 'white', display: 'flex', gap: '8px', alignItems: 'center', cursor: 'pointer', fontWeight: 'bold' }}
                          >
                            {uploadingImage ? <Loader2 size={16} className="spinner animate-spin" /> : <Upload size={16} />}
                            Upload Puja Image (Cloudflare)
                          </button>
                          <input 
                            type="file" 
                            ref={mainImageInputRef}
                            accept="image/*" 
                            onChange={(e) => triggerImageUpload(e, 'pooja')} 
                            style={{ display: 'none' }} 
                          />
                          {poojaForm.image_url && <span style={{ fontSize: '12px', color: '#10b981' }}>Image Uploaded!</span>}
                        </div>
                        <label>Or Puja Image URL</label>
                        <input 
                          type="text" 
                          name="image_url" 
                          value={poojaForm.image_url || ''} 
                          onChange={handlePoojaChange} 
                          className="input-field" 
                          placeholder="Paste image URL directly" 
                        />
                      </div>
                    </div>
                  )}

                  {formTab === 'detail' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                      <div className="form-group">
                        <label>Tagline (Short subtitle below title)</label>
                        <input type="text" name="tagline" value={poojaForm.tagline} onChange={handlePoojaChange} className="input-field" />
                      </div>
                      <div className="form-group">
                        <label>Divine Combined Benefits (Separate lines with • bullet point)</label>
                        <textarea name="benefits" value={poojaForm.benefits} onChange={handlePoojaChange} className="input-field" rows="4" placeholder="• Bestows long health&#10;• Removes evil eye curses" />
                      </div>
                      <div className="form-group">
                        <label>Ritual steps</label>
                        <textarea name="steps" value={poojaForm.steps} onChange={handlePoojaChange} className="input-field" rows="3" />
                      </div>
                      <div className="form-group">
                        <label>Auspicious Samagri</label>
                        <textarea name="samagri" value={poojaForm.samagri} onChange={handlePoojaChange} className="input-field" rows="2" />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="form-group">
                          <label>Vedic Pandit Name</label>
                          <input type="text" name="pandit" value={poojaForm.pandit} onChange={handlePoojaChange} className="input-field" />
                        </div>
                        <div className="form-group">
                          <label>Consecrated Temple Name</label>
                          <input type="text" name="temple" value={poojaForm.temple} onChange={handlePoojaChange} className="input-field" />
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Prasad Shipping Details</label>
                        <input type="text" name="prasad" value={poojaForm.prasad} onChange={handlePoojaChange} className="input-field" />
                      </div>
                      <div className="form-group">
                        <label>Other Info / Proof Details</label>
                        <input type="text" name="other_info" value={poojaForm.other_info} onChange={handlePoojaChange} className="input-field" />
                      </div>
                    </div>
                  )}

                  {formTab === 'packages' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      {/* Single Package */}
                      <div style={{ padding: '14px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: '#ea580c', marginBottom: '10px' }}>1. Single Package Configuration</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <input type="text" name="single_title" value={poojaForm.single_title} onChange={handlePoojaChange} className="input-field" placeholder="Package Title" />
                          <textarea name="single_description" value={poojaForm.single_description} onChange={handlePoojaChange} className="input-field" rows="2" placeholder="Description" />
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <input type="text" name="single_price" value={poojaForm.single_price} onChange={handlePoojaChange} className="input-field" placeholder="Offer Price" />
                            <input type="text" name="single_original_price" value={poojaForm.single_original_price} onChange={handlePoojaChange} className="input-field" placeholder="Original Strike Price" />
                          </div>
                        </div>
                      </div>

                      {/* Family Package */}
                      <div style={{ padding: '14px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: '#ea580c', marginBottom: '10px' }}>2. Family Package Configuration</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          <input type="text" name="family_title" value={poojaForm.family_title} onChange={handlePoojaChange} className="input-field" placeholder="Package Title" />
                          <textarea name="family_description" value={poojaForm.family_description} onChange={handlePoojaChange} className="input-field" rows="2" placeholder="Description" />
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <input type="text" name="family_price" value={poojaForm.family_price} onChange={handlePoojaChange} className="input-field" placeholder="Offer Price" />
                            <input type="text" name="family_original_price" value={poojaForm.family_original_price} onChange={handlePoojaChange} className="input-field" placeholder="Original Strike Price" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                  <button onClick={() => savePooja('draft')} style={{ flex: 1, backgroundColor: '#334155', color: 'white', padding: '12px', borderRadius: '10px', fontWeight: 'bold' }}>
                    Save Draft
                  </button>
                  <button onClick={() => savePooja('published')} style={{ flex: 1, backgroundColor: '#ea580c', color: 'white', padding: '12px', borderRadius: '10px', fontWeight: 'bold' }}>
                    Publish Now
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Phone Simulator Preview */}
        <div className="manager-preview-section" style={{ width: '380px', flexShrink: 0 }}>
          {/* Preview Tab Selector */}
          <div className="preview-toggle" style={{ display: 'flex', width: '100%', marginBottom: '16px', gap: '4px', backgroundColor: '#1e293b', padding: '4px', borderRadius: '10px' }}>
            <button 
              className={previewMode === 'home' ? 'active' : ''} 
              onClick={() => handlePreviewModeChange('home')} 
              style={{
                flex: 1, padding: '10px 4px', fontSize: '11px', fontWeight: '800', borderRadius: '8px', border: 'none', cursor: 'pointer',
                backgroundColor: previewMode === 'home' ? '#ea580c' : 'transparent', color: '#ffffff', transition: 'all 0.2s'
              }}
            >
              1. Home
            </button>
            <button 
              className={previewMode === 'puja' ? 'active' : ''} 
              onClick={() => { handlePreviewModeChange('puja'); setSimPujaSubTab('Problems'); }} 
              style={{
                flex: 1, padding: '10px 4px', fontSize: '11px', fontWeight: '800', borderRadius: '8px', border: 'none', cursor: 'pointer',
                backgroundColor: previewMode === 'puja' ? '#ea580c' : 'transparent', color: '#ffffff', transition: 'all 0.2s'
              }}
            >
              2. Puja Feed
            </button>
            <button 
              className={previewMode === 'view_all' ? 'active' : ''} 
              onClick={() => handlePreviewModeChange('view_all')} 
              style={{
                flex: 1, padding: '10px 4px', fontSize: '11px', fontWeight: '800', borderRadius: '8px', border: 'none', cursor: 'pointer',
                backgroundColor: previewMode === 'view_all' ? '#ea580c' : 'transparent', color: '#ffffff', transition: 'all 0.2s'
              }}
            >
              3. View All
            </button>
            <button 
              className={previewMode === 'detail' ? 'active' : ''} 
              onClick={() => handlePreviewModeChange('detail')} 
              style={{
                flex: 1, padding: '10px 4px', fontSize: '11px', fontWeight: '800', borderRadius: '8px', border: 'none', cursor: 'pointer',
                backgroundColor: previewMode === 'detail' ? '#ea580c' : 'transparent', color: '#ffffff', transition: 'all 0.2s'
              }}
            >
              4. Detail
            </button>
          </div>

          <div className="phone-simulator" style={{ width: '320px', height: '650px', background: '#f8fafc', borderRadius: '40px', border: '8px solid #1e293b', position: 'relative', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
            <div className="phone-notch" style={{ height: '20px', backgroundColor: '#1e293b', width: '110px', position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', borderBottomLeftRadius: '14px', borderBottomRightRadius: '14px', zIndex: 100 }}></div>
            
            <div className="phone-content" style={{ height: '100%', position: 'relative', backgroundColor: '#f8fafc', overflow: 'hidden' }}>
              
              {/* --- SCREEN 1: HOME PAGE --- */}
              {previewMode === 'home' && (
                <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff', height: '100%', paddingTop: '20px', fontFamily: '"Outfit", -apple-system, sans-serif' }}>
                  {/* Mock App Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '30px', height: '30px', borderRadius: '15px', backgroundColor: '#fed7aa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold', color: '#c2410c' }}>SP</div>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#0f172a' }}>Sahil Patel</div>
                        <div style={{ fontSize: '8.5px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: '600' }}>
                          <span style={{ width: '4px', height: '4px', borderRadius: '2px', backgroundColor: '#10b981', display: 'inline-block' }}></span>
                          ONLINE
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', color: '#475569' }}>
                      <Search size={14} />
                      <Share2 size={14} />
                      <Bell size={14} />
                    </div>
                  </div>

                  {/* Home Scrollable Body */}
                  <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '60px' }}>
                    {/* Mock Hero Banner */}
                    <div style={{ 
                      margin: '12px 14px', padding: '14px', borderRadius: '16px', 
                      background: 'linear-gradient(135deg, #c2410c 0%, #ea580c 100%)',
                      color: 'white', textAlign: 'left', position: 'relative', overflow: 'hidden'
                    }}>
                      <div style={{ position: 'absolute', right: '-10px', bottom: '-10px', opacity: 0.15, fontSize: '64px' }}>🕉️</div>
                      <span style={{ fontSize: '8px', fontWeight: '800', backgroundColor: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Daily Seva</span>
                      <h4 style={{ margin: '6px 0 2px 0', fontSize: '14px', fontWeight: '900' }}>Maha Aarti & Sankalp</h4>
                      <p style={{ margin: 0, fontSize: '9px', opacity: 0.9 }}>Blessings from historic altars shipped directly to your house.</p>
                    </div>

                    {/* Life Problem Solution Section */}
                    <div style={{ padding: '0 14px', textAlign: 'left' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                        <h3 style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Life Problem Solution</h3>
                        <span style={{ fontSize: '10px', color: '#ea580c', fontWeight: 'bold', cursor: 'pointer' }} onClick={() => handlePreviewModeChange('view_all')}>View All &gt;</span>
                      </div>
                      <p style={{ margin: '0 0 12px 0', fontSize: '9.5px', color: '#94a3b8', fontWeight: '500' }}>Select your worry to trigger instant divine remedies</p>
                      
                      <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '10px', paddingHorizontal: '4px' }}>
                        {getSimProblems().map((item) => {
                          const iconVal = getProblemIcon(item.title || '', item.image_url);
                          const isR2Url = iconVal.startsWith('http');
                          return (
                            <div 
                              key={item.id} 
                              onClick={() => {
                                handleEditInit(item, 'problem');
                              }}
                              style={{ 
                                width: '95px', height: '125px', backgroundColor: '#ffffff', borderRadius: '16px',
                                border: isEditingId === item.id ? '2.5px solid #ea580c' : '1px solid #e2e8f0',
                                paddingTop: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                                alignItems: 'center', overflow: 'hidden', flexShrink: 0, cursor: 'pointer',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                              }}
                            >
                              {/* Title at top */}
                              <span style={{ 
                                fontSize: '10.5px', fontWeight: '800', color: item.color || '#b91c1c', 
                                lineHeight: '13px', whiteSpace: 'pre-wrap', textAlign: 'center', paddingHorizontal: '6px'
                              }}>
                                {(item.title || 'PROBLEM').replace('\\n', '\n')}
                              </span>

                              {/* Gradient Container at bottom */}
                              <div style={{ width: '100%', height: '70px', overflow: 'hidden' }}>
                                <div style={{ 
                                  width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  background: `linear-gradient(to bottom, ${item.gradient_start || '#fee2e2'}, ${item.gradient_end || '#fecaca'})`
                                }}>
                                  {isR2Url ? (
                                    <img src={iconVal} alt="icon" style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.05)' }} />
                                  ) : (
                                    <span style={{ fontSize: '26px' }}>{iconVal}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Mock App Tab bar */}
                  {renderTabBar()}
                </div>
              )}

              {/* --- SCREEN 2: PUJA SCREEN (Shifted feed) --- */}
              {previewMode === 'puja' && (
                <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff', height: '100%', paddingTop: '20px', fontFamily: '"Outfit", -apple-system, sans-serif' }}>
                  
                  {/* Premium Banner Section with Floating Search Bar */}
                  <div style={{ 
                    height: '140px', 
                    background: 'linear-gradient(135deg, #c2410c 0%, #ea580c 100%)', 
                    padding: '12px 14px', 
                    color: 'white', 
                    textAlign: 'left', 
                    position: 'relative', 
                    overflow: 'hidden', 
                    flexShrink: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ position: 'absolute', right: '-15px', bottom: '-15px', opacity: 0.2, fontSize: '80px', pointerEvents: 'none' }}>🪔</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', border: '1px solid rgba(255,255,255,0.4)', padding: '1px 4px', borderRadius: '4px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '7px', fontWeight: '900', letterSpacing: '0.5px' }}>MANTRAPUJA DEALS</span>
                        </div>
                        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '900', lineHeight: '18px' }}>Vedic Remedy Portal</h3>
                        <p style={{ margin: 0, fontSize: '8.5px', opacity: 0.9 }}>Blessings starting at just ₹29</p>
                      </div>
                      <div style={{ backgroundColor: '#ffffff', color: '#ea580c', padding: '4px 8px', borderRadius: '12px', fontSize: '8px', fontWeight: '900', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                        BOOK NOW
                      </div>
                    </div>

                    {/* Floating Search Bar */}
                    <div style={{ 
                      height: '32px', backgroundColor: '#ffffff', borderRadius: '16px', 
                      display: 'flex', alignItems: 'center', padding: '0 10px', gap: '6px',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.08)', border: '1px solid #fed7aa',
                      marginBottom: '-4px', zIndex: 5
                    }}>
                      <Search size={12} color="#94a3b8" />
                      <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '500' }}>Search for 'Puja'...</span>
                    </div>
                  </div>

                  {/* Scrollable Feed Container */}
                  <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '60px', paddingTop: '8px' }}>
                    
                    {/* Simplified Tab Section */}
                    <div style={{ 
                      display: 'flex', padding: '10px 14px', alignItems: 'center', gap: '8px', 
                      backgroundColor: '#ffffff', borderBottom: '1px solid #f1f5f9', minHeight: '106px' 
                    }}>
                      {/* Left: Active Tab Categories list */}
                      <div style={{ flex: 1, overflow: 'hidden', textAlign: 'left' }}>
                        <span style={{ fontSize: '10px', fontWeight: '800', color: '#71717a', textTransform: 'uppercase', display: 'block', marginBottom: '6px', letterSpacing: '0.3px' }}>
                          Browse {simPujaSubTab === 'Pujas' ? 'Blessings' : 'Worries'}
                        </span>
                        
                        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
                          {simPujaSubTab === 'Pujas' ? (
                            // General Pujas rounded square categories
                            STATIC_POOJAS.map(p => (
                              <div key={p.id} style={{ flexShrink: 0, width: '48px', textAlign: 'center' }}>
                                <div style={{ 
                                  width: '42px', height: '42px', borderRadius: '10px', margin: '0 auto 4px auto',
                                  border: '1.5px solid #e4e4e7', backgroundColor: '#fafafa',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
                                }}>
                                  <img src={p.image_url} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                                <div style={{ fontSize: '8px', fontWeight: 'bold', color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {p.title}
                                </div>
                              </div>
                            ))
                          ) : (
                            // Problems worries landscape categories
                            getSimProblems().map(prob => {
                              const iconVal = getProblemIcon(prob.title || '', prob.image_url);
                              const isR2Url = iconVal.startsWith('http');
                              const displayTitle = (prob.title || 'PROBLEM').replace('\\n', ' ').replace('\n', ' ');
                              const isSelected = simSelectedCategory.toLowerCase() === displayTitle.toLowerCase() || (simSelectedCategory === 'Marriage & Love' && displayTitle.toLowerCase().includes('marriage')) || (simSelectedCategory === 'Grah Dosh' && displayTitle.toLowerCase().includes('grah'));
                              
                              return (
                                <div 
                                  key={prob.id}
                                  onClick={() => {
                                    if (displayTitle.toLowerCase().includes('health')) handleSimCategoryChange('Health');
                                    else if (displayTitle.toLowerCase().includes('wealth') || displayTitle.toLowerCase().includes('money')) handleSimCategoryChange('Wealth');
                                    else if (displayTitle.toLowerCase().includes('job') || displayTitle.toLowerCase().includes('career')) handleSimCategoryChange('Job & Career');
                                    else if (displayTitle.toLowerCase().includes('marriage') || displayTitle.toLowerCase().includes('love')) handleSimCategoryChange('Marriage & Love');
                                    else if (displayTitle.toLowerCase().includes('grah') || displayTitle.toLowerCase().includes('dosh')) handleSimCategoryChange('Grah Dosh');
                                    else handleSimCategoryChange(displayTitle);
                                  }}
                                  style={{ flexShrink: 0, width: '75px', textAlign: 'center', cursor: 'pointer' }}
                                >
                                  <div style={{ 
                                    width: '68px', height: '44px', borderRadius: '8px', margin: '0 auto 4px auto',
                                    border: isSelected ? '2px solid #ea580c' : '1.5px solid #e4e4e7',
                                    backgroundColor: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
                                  }}>
                                    {isR2Url ? (
                                      <img src={iconVal} alt="icon" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                      <span style={{ fontSize: '18px' }}>{iconVal}</span>
                                    )}
                                  </div>
                                  <div style={{ fontSize: '7.5px', fontWeight: 'bold', color: isSelected ? '#ea580c' : '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: '9px' }}>
                                    {displayTitle}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>

                      {/* Right: Premium Toggler Switch Card */}
                      <div 
                        onClick={() => setSimPujaSubTab(simPujaSubTab === 'Pujas' ? 'Problems' : 'Pujas')}
                        style={{ 
                          width: '76px', height: '82px', borderRadius: '14px', 
                          border: '1.5px solid #e2e8f0', overflow: 'hidden', display: 'flex', flexDirection: 'column', 
                          cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.06)', flexShrink: 0,
                          position: 'relative'
                        }}
                      >
                        {/* Background Gradient */}
                        <div style={{
                          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                          background: simPujaSubTab === 'Pujas' 
                            ? 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)' 
                            : 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)'
                        }}></div>
                        
                        {/* Content Overlay */}
                        <div style={{
                          position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column',
                          alignItems: 'center', justifyContent: 'center', padding: '4px', gap: '3px'
                        }}>
                          {/* Icon Container */}
                          <div style={{
                            width: '24px', height: '24px', borderRadius: '12px',
                            backgroundColor: simPujaSubTab === 'Pujas' ? '#ffedd5' : '#dbeafe',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1px',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                          }}>
                            {simPujaSubTab === 'Pujas' ? (
                              <span style={{ fontSize: '12px', lineHeight: 1 }}>🔥</span>
                            ) : (
                              <span style={{ fontSize: '12px', lineHeight: 1 }}>✨</span>
                            )}
                          </div>
                          
                          {/* Label */}
                          <span style={{ 
                            fontSize: '9px', fontWeight: '800', 
                            color: simPujaSubTab === 'Pujas' ? '#c2410c' : '#1e40af',
                            textAlign: 'center', letterSpacing: '0.2px'
                          }}>
                            {simPujaSubTab === 'Pujas' ? 'Problems' : 'Pujas'}
                          </span>
                          
                          {/* SWITCH Button Badge */}
                          <div style={{
                            padding: '2px 6px', borderRadius: '5px', marginTop: '2px',
                            backgroundColor: simPujaSubTab === 'Pujas' ? '#ea580c' : '#1d4ed8',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                          }}>
                            <span style={{ color: 'white', fontSize: '6.5px', fontWeight: '900', letterSpacing: '0.4px' }}>
                              SWITCH
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Divider Line */}
                    <div style={{ width: '100%', height: '4px', backgroundColor: '#f1f5f9', margin: '8px 0' }}></div>

                    {simPujaSubTab === 'Pujas' ? (
                      /* Pujas under 1 Rupees 2-row Stacked list */
                      <div style={{ padding: '0 14px', textAlign: 'left' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <span style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>Puja under ₹1</span>
                          <span style={{ fontSize: '10px', color: '#ea580c', fontWeight: 'bold', cursor: 'pointer' }} onClick={() => handlePreviewModeChange('view_all')}>View all &gt;</span>
                        </div>

                        {/* 2-Row Stacked Scroll */}
                        <div style={{ display: 'flex', overflowX: 'auto', gap: '12px', paddingBottom: '10px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {/* Row 1 */}
                            <div style={{ display: 'flex', gap: '12px' }}>
                              {getSimPujas('Health').slice(0, 4).map(p => (
                                <div key={p.id} style={{ width: '110px', flexShrink: 0 }}>
                                  <CardPreview 
                                    data={p} 
                                    width="110px" 
                                    imgHeight="110px" 
                                    viewType="feed"
                                    cart={simCart}
                                    setCart={setSimCart}
                                    onClick={() => {
                                      handleEditInit(p, 'pooja');
                                      handlePreviewModeChange('detail');
                                    }}
                                  />
                                </div>
                              ))}
                            </div>
                            {/* Row 2 */}
                            <div style={{ display: 'flex', gap: '12px' }}>
                              {getSimPujas('Wealth').slice(0, 4).map(p => (
                                <div key={p.id} style={{ width: '110px', flexShrink: 0 }}>
                                  <CardPreview 
                                    data={p} 
                                    width="110px" 
                                    imgHeight="110px" 
                                    viewType="feed"
                                    cart={simCart}
                                    setCart={setSimCart}
                                    onClick={() => {
                                      handleEditInit(p, 'pooja');
                                      handlePreviewModeChange('detail');
                                    }}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Problem Pujas feed under Problems */
                      <div style={{ textAlign: 'left' }}>
                        {/* Title Row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingHorizontal: '14px', marginBottom: '10px' }}>
                          <SacredTilak />
                          <h3 style={{ fontSize: '13px', fontWeight: '900', color: '#0f172a', margin: 0 }}>Problem Pujas</h3>
                          <span style={{ fontSize: '10px', color: '#ea580c', fontWeight: 'bold', marginLeft: 'auto', cursor: 'pointer' }} onClick={() => handlePreviewModeChange('view_all')}>View all &gt;</span>
                        </div>

                        {/* Sub-tab Category Capsules */}
                        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingHorizontal: '14px', marginBottom: '12px' }}>
                          {['Health', 'Wealth', 'Job & Career', 'Marriage & Love', 'Grah Dosh'].map((cat) => (
                            <span 
                              key={cat}
                              onClick={() => handleSimCategoryChange(cat)}
                              style={{ 
                                flexShrink: 0, padding: '4px 10px', borderRadius: '15px', fontSize: '10px', fontWeight: 'bold',
                                backgroundColor: simSelectedCategory === cat ? '#ea580c' : '#f1f5f9',
                                color: simSelectedCategory === cat ? 'white' : '#475569',
                                border: simSelectedCategory === cat ? 'none' : '0.5px solid #cbd5e1',
                                cursor: 'pointer'
                              }}
                            >
                              {cat} Puja
                            </span>
                          ))}
                        </div>

                        {/* Category Feed list */}
                        <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingHorizontal: '14px', paddingBottom: '10px' }}>
                          {getSimPujas(simSelectedCategory).length === 0 ? (
                            <div style={{ fontSize: '10px', color: '#94a3b8', fontStyle: 'italic', padding: '16px 0', width: '100%', textAlign: 'center' }}>
                              No Puja registered in {simSelectedCategory}...
                            </div>
                          ) : (
                            getSimPujas(simSelectedCategory).map(p => (
                              <div key={p.id} style={{ width: '110px', flexShrink: 0 }}>
                                <CardPreview 
                                  data={p} 
                                  width="110px" 
                                  imgHeight="110px" 
                                  viewType="feed"
                                  cart={simCart}
                                  setCart={setSimCart}
                                  onClick={() => {
                                    handleEditInit(p, 'pooja');
                                    handlePreviewModeChange('detail');
                                  }}
                                />
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Mock App Tab bar */}
                  {renderTabBar()}
                </div>
              )}

              {/* --- SCREEN 3: VIEW ALL PROBLEM PUJAS --- */}
              {previewMode === 'view_all' && (
                <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc', height: '100%', paddingTop: '20px', fontFamily: '"Outfit", -apple-system, sans-serif' }}>
                  {/* Header Bar */}
                  <div style={{ 
                    backgroundColor: '#ea580c', color: 'white', padding: '12px 14px', 
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ArrowLeft size={16} onClick={() => handlePreviewModeChange('puja')} style={{ cursor: 'pointer' }} />
                      <span style={{ fontSize: '12.5px', fontWeight: '800' }}>All Problem Pujas</span>
                    </div>
                    {/* Double Badge (Veg + Vedic) */}
                    <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#22c55e', padding: '1px 5px', borderRadius: '3px' }}>
                      <span style={{ fontSize: '7.5px', fontWeight: '900', color: 'white' }}>100% VEDIC</span>
                    </div>
                  </div>

                  {/* Horizontal Scroll categories */}
                  <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', padding: '10px 14px', backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
                    {['Health', 'Wealth', 'Job & Career', 'Marriage & Love', 'Grah Dosh'].map((cat) => (
                      <span 
                        key={cat}
                        onClick={() => handleSimCategoryChange(cat)}
                        style={{ 
                          flexShrink: 0, padding: '4px 8px', borderRadius: '6px', fontSize: '9.5px', fontWeight: 'bold',
                          backgroundColor: simSelectedCategory === cat ? '#fff7ed' : 'transparent',
                          color: simSelectedCategory === cat ? '#ea580c' : '#475569',
                          border: simSelectedCategory === cat ? '1px solid #ea580c' : '1px solid #e2e8f0',
                          cursor: 'pointer'
                        }}
                      >
                        {cat}
                      </span>
                    ))}
                  </div>

                  {/* 3-Column Grid */}
                  <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px 60px 14px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                      {getSimPujas(simSelectedCategory).length === 0 ? (
                        <div style={{ gridColumn: 'span 3', fontSize: '10px', color: '#94a3b8', fontStyle: 'italic', padding: '24px 0', textAlign: 'center' }}>
                          No results registered for {simSelectedCategory}.
                        </div>
                      ) : (
                        getSimPujas(simSelectedCategory).map(p => (
                          <div 
                            key={p.id} 
                            style={{ 
                              backgroundColor: '#ffffff', borderRadius: '16px', padding: '6px', 
                              border: isEditingId === p.id ? '2.5px solid #ea580c' : '1px solid #f1f5f9',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                              cursor: 'pointer'
                            }}
                            onClick={() => {
                              handleEditInit(p, 'pooja');
                              handlePreviewModeChange('detail');
                            }}
                          >
                            <CardPreview 
                              data={p} 
                              width="100%" 
                              imgHeight="95px"
                              viewType="grid"
                              cart={simCart}
                              setCart={setSimCart}
                            />
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Mock App Tab bar */}
                  {renderTabBar()}
                </div>
              )}

              {/* --- SCREEN 4: DETAILED PUJA PAGE --- */}
              {previewMode === 'detail' && (
                <div style={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
                  <DetailPreview 
                    data={poojaForm}
                    selectedPackage={simSelectedPackage}
                    setSelectedPackage={setSimSelectedPackage}
                    comboQuantity={simComboQuantity}
                    setComboQuantity={setSimComboQuantity}
                    onBack={() => handlePreviewModeChange('puja')}
                  />
                  {/* Sticky Footer */}
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '8px 14px', backgroundColor: 'white', borderTop: '1px solid #e2e8f0', zIndex: 100 }}>
                    <div style={{ 
                      backgroundColor: '#ea580c', color: 'white', padding: '10px', borderRadius: '24px', 
                      fontSize: '11px', fontWeight: '900', textAlign: 'center', cursor: 'pointer',
                      boxShadow: '0 4px 6px rgba(234, 88, 12, 0.25)'
                    }}>
                      ADD SEVA TO CART ➔
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* --- BOTTOM TABLES SECTION --- */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '24px', marginTop: '24px' }}>
        
        {/* Table 1: Homepage problem cards */}
        <div className="glass-card" style={{ backgroundColor: '#161622', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', padding: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '14px' }}>Home Cards Table</h3>
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}>
                  <th style={{ padding: '8px' }}>Card / Order</th>
                  <th style={{ padding: '8px' }}>Theme Colors</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {problems.map((prob) => (
                  <tr key={prob.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '4px', backgroundColor: prob.gradient_start, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                        {prob.image_url ? <img src={prob.image_url} alt="icon" style={{ width: '70%' }} /> : '✨'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 'bold' }}>{(prob.title || 'PROBLEM').replace('\\n', ' ')}</div>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>Order: {prob.sort_order || 'none'}</div>
                      </div>
                    </td>
                    <td style={{ padding: '8px' }}>
                      <span style={{ color: prob.color }}>● {prob.color}</span>
                    </td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <Edit3 size={14} color="#60a5fa" onClick={() => handleEditInit(prob, 'problem')} style={{ cursor: 'pointer' }} />
                        <Trash2 size={14} color="#f87171" onClick={() => deleteProblem(prob.id)} style={{ cursor: 'pointer' }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 2: Problem Pujas */}
        <div className="glass-card" style={{ backgroundColor: '#161622', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', padding: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '14px' }}>Problem Pujas Database</h3>
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}>
                  <th style={{ padding: '8px' }}>Pooja / Category</th>
                  <th style={{ padding: '8px' }}>Prices</th>
                  <th style={{ padding: '8px' }}>Status</th>
                  <th style={{ padding: '8px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {poojas.map((pooja) => (
                  <tr key={pooja.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <img src={pooja.image_url || DEFAULT_IMAGE} alt="puj" style={{ width: '30px', height: '30px', borderRadius: '6px', objectFit: 'cover' }} />
                      <div>
                        <div style={{ fontWeight: 'bold' }}>{pooja.title}</div>
                        <div style={{ fontSize: '10.5px', color: '#94a3b8' }}>Mapped: <span style={{ color: '#fbbf24', fontWeight: '600' }}>{pooja.problem_category}</span> (order {pooja.sort_order || 'none'})</div>
                      </div>
                    </td>
                    <td style={{ padding: '8px' }}>
                      <span style={{ color: '#ffd60a', fontWeight: 'bold' }}>{pooja.offer_price}</span>
                      <span style={{ fontSize: '10.5px', textDecoration: 'line-through', color: '#94a3b8', marginLeft: '4px' }}>{pooja.original_price}</span>
                    </td>
                    <td style={{ padding: '8px' }}>
                      <span style={{ 
                        padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: 'bold',
                        backgroundColor: pooja.status === 'published' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: pooja.status === 'published' ? '#34d399' : '#fbbf24'
                      }}>{pooja.status?.toUpperCase() || 'DRAFT'}</span>
                    </td>
                    <td style={{ padding: '8px', textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <Edit3 size={14} color="#60a5fa" onClick={() => handleEditInit(pooja, 'pooja')} style={{ cursor: 'pointer' }} />
                        <Trash2 size={14} color="#f87171" onClick={() => deletePooja(pooja.id)} style={{ cursor: 'pointer' }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProblemSolutionsManagerPage;
