import { useState, useEffect, useRef } from 'react';
import { 
  Edit3, Trash2, Check, AlertTriangle, Upload, Loader2, Save, Plus, X, 
  ArrowLeft, ShoppingCart, Search, Share2, Star, ChevronDown, ChevronUp, 
  Image as ImageIcon, Eye, EyeOff, LayoutGrid, FileText, Layers, Home
} from 'lucide-react';
import { supabase } from './lib/supabase';
import { uploadToR2 } from './lib/r2';

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1609137144814-6c3614275f7e?auto=format&fit=crop&w=600&q=80';

// --- Subcomponent: Chandan/Kumkum Sacred Tilak --- //
const SacredTilak = () => {
  return (
    <div style={{
      width: '10px',
      height: '12px',
      borderLeft: '1.5px solid #f97316',
      borderRight: '1.5px solid #f97316',
      borderBottom: '1.5px solid #f97316',
      borderTop: '0px',
      borderBottomLeftRadius: '5px',
      borderBottomRightRadius: '5px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: '2px',
      marginRight: '2px',
      flexShrink: 0,
      position: 'relative'
    }}>
      <div style={{
        width: '3.5px',
        height: '5px',
        borderRadius: '1.75px',
        backgroundColor: '#dc2626',
        marginTop: '-2px'
      }} />
    </div>
  );
};

// --- Simulator Preview: Card Component --- //
const CardPreview = ({ data, width = '100%', imgHeight = '90px' }) => {
  const displayImage = data.image_url || DEFAULT_IMAGE;
  return (
    <div style={{
      width: width,
      flexShrink: 0,
      fontFamily: '"Outfit", -apple-system, sans-serif',
      textAlign: 'left'
    }}>
      {/* Image with saffron soft border & rounded corners */}
      <div style={{ 
        position: 'relative', width: '100%', height: imgHeight, borderRadius: '16px', overflow: 'hidden', 
        marginBottom: '6px', border: '1px solid #fed7aa', backgroundColor: '#e2e8f0' 
      }}>
        <img src={displayImage} alt="Puja" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        {/* Floating Add Saffron Plus Button */}
        <div style={{
          position: 'absolute', bottom: '5px', right: '5px', backgroundColor: '#ea580c',
          width: '22px', height: '22px', borderRadius: '11px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#ffffff', fontSize: '14px', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(234, 88, 12, 0.3)'
        }}>+</div>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
        {/* Tilak + Title */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px', minHeight: '34px' }}>
          <SacredTilak />
          <h3 style={{ 
            margin: 0, fontSize: '12px', fontWeight: '700', color: '#0f172a', lineHeight: '15px', 
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
const DetailPreview = ({ data, selectedPackage, setSelectedPackage, comboQuantity, setComboQuantity }) => {
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

  const singlePriceVal = parseInt(displaySinglePrice.replace(/[^0-9]/g, '')) || 501;
  const singleOriginalPriceVal = parseInt(displaySingleOriginalPrice.replace(/[^0-9]/g, '')) || 1501;
  const familyPriceVal = parseInt(displayFamilyPrice.replace(/[^0-9]/g, '')) || 1001;
  const familyOriginalPriceVal = parseInt(displayFamilyOriginalPrice.replace(/[^0-9]/g, '')) || 3001;

  // Interactive local accordion states
  const [expandedSection, setExpandedSection] = useState('benefits'); // 'benefits', 'details', 'pandit', 'prasad'
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  const toggleSection = (sectionName) => {
    setExpandedSection(expandedSection === sectionName ? '' : sectionName);
  };

  return (
    <div style={{ 
      height: '100%', overflowY: 'auto', backgroundColor: '#f8fafc',
      fontFamily: '"Outfit", -apple-system, sans-serif', paddingBottom: '90px'
    }}>
      {/* Hero Image Section */}
      <div style={{ height: '380px', position: 'relative', flexShrink: 0, backgroundColor: '#fff' }}>
        <img src={displayImage} alt="Puja Detail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        
        {/* Pure Vibrant Saffron Overlapping Badge */}
        <div style={{
          position: 'absolute', top: '42%', left: '50%', transform: 'translate(-50%, 0)',
          width: '44px', height: '44px', borderRadius: '22px', backgroundColor: '#ea580c', border: '3px solid white',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '20px',
          boxShadow: '0 4px 6px rgba(234, 88, 12, 0.3)', zIndex: 2
        }}>+</div>
      </div>

      {/* Core Content Card - slides up smoothly */}
      <div style={{
        marginTop: '-28px', backgroundColor: '#ffffff', borderTopLeftRadius: '32px', borderTopRightRadius: '32px',
        padding: '24px 20px', position: 'relative', zIndex: 5,
        boxShadow: '0 -4px 10px rgba(0,0,0,0.04)'
      }}>
        {/* Vedic Indicator badge */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
           <div style={{ width: '13px', height: '13px', border: '1.5px solid #f97316', borderRadius: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '6px' }}>
             <div style={{ width: '6px', height: '6px', backgroundColor: '#f97316', borderRadius: '3px' }}></div>
           </div>
           <span style={{ color: '#ea580c', fontSize: '11px', fontWeight: '700', letterSpacing: '0.2px', textTransform: 'uppercase' }}>
             {data.tag || '100% Pure Vedic Holy Combo'}
           </span>
        </div>

        <h2 style={{ fontSize: '22px', fontWeight: '800', margin: '0 0 6px 0', color: '#0f172a', lineHeight: '26px', textAlign: 'left' }}>
          {data.title || 'Maha Laxmi Puja'}
        </h2>
        <p style={{ margin: '0 0 14px 0', fontSize: '13px', color: '#64748b', lineHeight: '18px', fontWeight: '500', textAlign: 'left' }}>
          {data.tagline || 'Attracts financial abundance, clears outstanding debts, and brings luck to your home.'}
        </p>

        <div style={{ width: '100%', height: '1px', backgroundColor: '#f1f5f9', marginBottom: '14px' }}></div>
        
        {/* Rating and Devotees Block */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ backgroundColor: '#ea580c', color: 'white', padding: '3px 7px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '4px', marginRight: '10px' }}>
            <Star size={12} fill="white" stroke="none" />
            <span style={{ fontSize: '11.5px', fontWeight: 'bold' }}>{data.rating || '4.9'}</span>
          </div>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
            {data.reviews || '120'} blessed devotees joined
          </span>
        </div>

        {/* Ritual Level Selection */}
        <div style={{ marginBottom: '24px', textAlign: 'left' }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '11px', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.5px' }}>
            SELECT RITUAL LEVEL
          </h4>

          <div style={{ display: 'flex', gap: '12px' }}>
             {/* Single Sankalp */}
             <div 
               onClick={() => setSelectedPackage('single')}
               style={{ 
                 flex: 1, cursor: 'pointer',
                 backgroundColor: selectedPackage === 'single' ? '#fff7ed' : '#ffffff', 
                 border: selectedPackage === 'single' ? '1.5px solid #ea580c' : '1.5px solid #e2e8f0', 
                 borderRadius: '20px', padding: '14px',
                 boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                 transition: 'all 0.2s'
               }}
             >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ color: selectedPackage === 'single' ? '#ea580c' : '#1e293b', fontWeight: '800', fontSize: '13.5px' }}>
                    {singleTitleText}
                  </span>
                  <div style={{ 
                    width: '16px', height: '16px', borderRadius: '8px', 
                    border: selectedPackage === 'single' ? '1.5px solid #ea580c' : '1.5px solid #94a3b8', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center' 
                  }}>
                    {selectedPackage === 'single' && <div style={{ width: '8px', height: '8px', backgroundColor: '#ea580c', borderRadius: '4px' }}></div>}
                  </div>
                </div>
                <p style={{ fontSize: '10.5px', color: '#64748b', margin: '0 0 12px 0', lineHeight: '14px', minHeight: '42px', fontWeight: '500' }}>
                  {singleDescText}
                </p>
                <div style={{ width: '100%', height: '0.5px', backgroundColor: '#cbd5e1', marginBottom: '12px' }}></div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                   <span style={{ fontSize: '16px', fontWeight: '800', color: selectedPackage === 'single' ? '#ea580c' : '#1e293b' }}>
                     {displaySinglePrice}
                   </span>
                   <span style={{ fontSize: '11px', color: '#94a3b8', textDecoration: 'line-through', fontWeight: '500' }}>
                     {displaySingleOriginalPrice}
                   </span>
                </div>
             </div>

             {/* Family Pariwar */}
             <div 
               onClick={() => setSelectedPackage('family')}
               style={{ 
                 flex: 1, cursor: 'pointer',
                 backgroundColor: selectedPackage === 'family' ? '#fff7ed' : '#ffffff', 
                 border: selectedPackage === 'family' ? '1.5px solid #ea580c' : '1.5px solid #e2e8f0', 
                 borderRadius: '20px', padding: '14px',
                 boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                 transition: 'all 0.2s'
               }}
             >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ color: selectedPackage === 'family' ? '#ea580c' : '#1e293b', fontWeight: '800', fontSize: '13.5px' }}>
                    {familyTitleText}
                  </span>
                  <div style={{ 
                    width: '16px', height: '16px', borderRadius: '8px', 
                    border: selectedPackage === 'family' ? '1.5px solid #ea580c' : '1.5px solid #94a3b8', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center' 
                  }}>
                    {selectedPackage === 'family' && <div style={{ width: '8px', height: '8px', backgroundColor: '#ea580c', borderRadius: '4px' }}></div>}
                  </div>
                </div>
                <p style={{ fontSize: '10.5px', color: '#64748b', margin: '0 0 12px 0', lineHeight: '14px', minHeight: '42px', fontWeight: '500' }}>
                  {familyDescText}
                </p>
                <div style={{ width: '100%', height: '0.5px', backgroundColor: '#cbd5e1', marginBottom: '12px' }}></div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                   <span style={{ fontSize: '16px', fontWeight: '800', color: selectedPackage === 'family' ? '#ea580c' : '#1e293b' }}>
                     {displayFamilyPrice}
                   </span>
                   <span style={{ fontSize: '11px', color: '#94a3b8', textDecoration: 'line-through', fontWeight: '500' }}>
                     {displayFamilyOriginalPrice}
                   </span>
                </div>
             </div>
          </div>
        </div>

        {/* Combined Pricing Block */}
        <div style={{ 
          backgroundColor: '#ffffff', borderRadius: '20px', padding: '16px', 
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
          boxShadow: '0 4px 8px rgba(0,0,0,0.03)', border: '1px solid #f1f5f9', marginBottom: '24px',
          textAlign: 'left'
        }}>
          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '10px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>
              Combo Special Offer
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a' }}>
                ₹{(selectedPackage === 'single' ? singlePriceVal : familyPriceVal) * comboQuantity}
              </span>
              <span style={{ fontSize: '12.5px', color: '#94a3b8', textDecoration: 'line-through', fontWeight: '500' }}>
                ₹{(selectedPackage === 'single' ? singleOriginalPriceVal : familyOriginalPriceVal) * comboQuantity}
              </span>
              <div style={{ backgroundColor: '#ffd60a', padding: '1px 5px', borderRadius: '4px', border: '0.5px solid #000' }}>
                 <span style={{ fontSize: '9.5px', fontWeight: '800', color: '#000' }}>SAVED 66%</span>
              </div>
            </div>
          </div>
          {/* Saffron Theme Quantity Pill */}
          <div style={{ backgroundColor: '#ea580c', borderRadius: '12px', padding: '4px', display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '16px' }}>
            <button 
              type="button"
              onClick={() => comboQuantity > 1 && setComboQuantity(comboQuantity - 1)}
              style={{ width: '28px', height: '28px', backgroundColor: 'rgba(255, 255, 255, 0.25)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}
            >
              -
            </button>
            <span style={{ fontSize: '14px', fontWeight: '700', color: 'white', minWidth: '16px', textAlign: 'center' }}>
              {comboQuantity}
            </span>
            <button 
              type="button"
              onClick={() => setComboQuantity(comboQuantity + 1)}
              style={{ width: '28px', height: '28px', backgroundColor: 'rgba(255, 255, 255, 0.25)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}
            >
              +
            </button>
          </div>
        </div>

        {/* Combo Special Offer Details Card */}
        {data.combo_offer?.title && (
          <div style={{ marginBottom: '24px', textAlign: 'left' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '11px', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.5px' }}>
              COMBO SPECIAL OFFER
            </h4>
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
              {data.combo_offer.image_url ? (
                <img src={data.combo_offer.image_url} alt="Combo" style={{ width: '100%', height: '140px', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '140px', backgroundColor: '#fed7aa', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c2410c', fontSize: '14px' }}>Combo Image</div>
              )}
              <div style={{ padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <h5 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#0f172a', flex: 1 }}>{data.combo_offer.title}</h5>
                  <div style={{ backgroundColor: '#ea580c', padding: '3px 7px', borderRadius: '4px', marginLeft: '10px' }}>
                    <span style={{ color: 'white', fontSize: '9px', fontWeight: 'bold' }}>SAVE BUNDLE</span>
                  </div>
                </div>
                <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#64748b', lineHeight: '18px' }}>
                  {data.combo_offer.description || 'Exclusive bundle package for family blessings.'}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '18px', fontWeight: '800', color: '#ea580c' }}>{data.combo_offer.offer_price || '₹501'}</span>
                  <span style={{ fontSize: '13px', color: '#94a3b8', textDecoration: 'line-through' }}>{data.combo_offer.original_price || '₹1501'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Benefits Accordion */}
        <div style={{ 
          backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', 
          marginBottom: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.01)', textAlign: 'left',
          overflow: 'hidden'
        }}>
          <div 
            onClick={() => toggleSection('benefits')}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', cursor: 'pointer' }}
          >
            <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: '700', color: '#1e293b' }}>Divine Combined Benefits</h4>
            <span style={{ color: '#64748b', fontSize: '12px' }}>
              {expandedSection === 'benefits' ? '▲' : '▼'}
            </span>
          </div>
          {expandedSection === 'benefits' && (
            <div style={{ padding: '0 16px 16px 16px', borderTop: '0.5px solid #f1f5f9', paddingTop: '12px' }}>
              <div style={{ fontSize: '12px', color: '#475569', lineHeight: '18px', whiteSpace: 'pre-wrap', fontWeight: '500' }}>
                {data.benefits || '• Attracts abundance and clearing outstanding debts.'}
              </div>
            </div>
          )}
        </div>

        {/* Steps Accordion */}
        <div style={{ 
          backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', 
          marginBottom: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.01)', textAlign: 'left',
          overflow: 'hidden'
        }}>
          <div 
            onClick={() => toggleSection('details')}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', cursor: 'pointer' }}
          >
            <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: '700', color: '#1e293b' }}>Combo Ritual steps & Materials</h4>
            <span style={{ color: '#64748b', fontSize: '12px' }}>
              {expandedSection === 'details' ? '▲' : '▼'}
            </span>
          </div>
          {expandedSection === 'details' && (
            <div style={{ padding: '0 16px 16px 16px', borderTop: '0.5px solid #f1f5f9', paddingTop: '12px' }}>
              <h5 style={{ margin: '0 0 4px 0', fontSize: '11px', fontWeight: 'bold', color: '#ea580c', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Puja Ritual steps:</h5>
              <div style={{ fontSize: '12px', color: '#475569', lineHeight: '18px', whiteSpace: 'pre-wrap', fontWeight: '500', marginBottom: '12px' }}>
                {data.steps || 'Step-by-step personalized live Vedic sankalp rituals.'}
              </div>
              <h5 style={{ margin: '0 0 4px 0', fontSize: '11px', fontWeight: 'bold', color: '#ea580c', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Auspicious Samagri:</h5>
              <div style={{ fontSize: '12px', color: '#475569', lineHeight: '18px', whiteSpace: 'pre-wrap', fontWeight: '500' }}>
                {data.samagri || 'Pure sandalwood, incense, flowers, and holy thread.'}
              </div>
            </div>
          )}
        </div>

        {/* Pandit Accordion */}
        <div style={{ 
          backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', 
          marginBottom: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.01)', textAlign: 'left',
          overflow: 'hidden'
        }}>
          <div 
            onClick={() => toggleSection('pandit')}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', cursor: 'pointer' }}
          >
            <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: '700', color: '#1e293b' }}>Vedic Pandit & Sacred Shrine</h4>
            <span style={{ color: '#64748b', fontSize: '12px' }}>
              {expandedSection === 'pandit' ? '▲' : '▼'}
            </span>
          </div>
          {expandedSection === 'pandit' && (
            <div style={{ padding: '0 16px 16px 16px', borderTop: '0.5px solid #f1f5f9', paddingTop: '12px' }}>
              <h5 style={{ margin: '0 0 4px 0', fontSize: '11px', fontWeight: 'bold', color: '#ea580c', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sacred Consecrated Temple:</h5>
              <div style={{ fontSize: '12px', color: '#475569', lineHeight: '18px', whiteSpace: 'pre-wrap', fontWeight: '500', marginBottom: '12px' }}>
                {data.temple || 'Shrine of Haridwar / Kashi'}
              </div>
              <h5 style={{ margin: '0 0 4px 0', fontSize: '11px', fontWeight: 'bold', color: '#ea580c', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Assigned Vedic Acharya:</h5>
              <div style={{ fontSize: '12px', color: '#475569', lineHeight: '18px', whiteSpace: 'pre-wrap', fontWeight: '500' }}>
                {data.pandit || 'Senior Temple Archaka'}
              </div>
            </div>
          )}
        </div>

        {/* Prasad Accordion */}
        <div style={{ 
          backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', 
          marginBottom: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.01)', textAlign: 'left',
          overflow: 'hidden'
        }}>
          <div 
            onClick={() => toggleSection('prasad')}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', cursor: 'pointer' }}
          >
            <h4 style={{ margin: 0, fontSize: '13.5px', fontWeight: '700', color: '#1e293b' }}>Prasad Shipping & Video Proof</h4>
            <span style={{ color: '#64748b', fontSize: '12px' }}>
              {expandedSection === 'prasad' ? '▲' : '▼'}
            </span>
          </div>
          {expandedSection === 'prasad' && (
            <div style={{ padding: '0 16px 16px 16px', borderTop: '0.5px solid #f1f5f9', paddingTop: '12px' }}>
              <h5 style={{ margin: '0 0 4px 0', fontSize: '11px', fontWeight: 'bold', color: '#ea580c', textTransform: 'uppercase', letterSpacing: '0.5px' }}>How Prasad is Consecrated & Shipped:</h5>
              <div style={{ fontSize: '12px', color: '#475569', lineHeight: '18px', whiteSpace: 'pre-wrap', fontWeight: '500', marginBottom: '12px' }}>
                {data.prasad || 'Sanitized vacuum-sealed box containing sweets, thread, and yantra.'}
              </div>
              <h5 style={{ margin: '0 0 4px 0', fontSize: '11px', fontWeight: 'bold', color: '#ea580c', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Video Recording proof:</h5>
              <div style={{ fontSize: '12px', color: '#475569', lineHeight: '18px', whiteSpace: 'pre-wrap', fontWeight: '500' }}>
                {data.other_info || 'A personal sankalp video shared on WhatsApp.'}
              </div>
            </div>
          )}
        </div>

        {/* FAQs */}
        {data.faqs && data.faqs.length > 0 && (
          <div style={{ marginBottom: '24px', textAlign: 'left', marginTop: '16px' }}>
            <h4 style={{ margin: '12px 0 12px 0', fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>
              Divine FAQs
            </h4>
            <div style={{ borderWidth: '1px', borderColor: '#e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
              {data.faqs.map((faq, index) => (
                <div key={index} style={{ borderBottom: index !== data.faqs.length - 1 ? '1px solid #e2e8f0' : 'none' }}>
                  <div 
                    onClick={() => setOpenFaqIndex(openFaqIndex === index ? -1 : index)}
                    style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', cursor: 'pointer', backgroundColor: '#ffffff' }}
                  >
                    <h5 style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: '#1e293b', flex: 1, paddingRight: '10px' }}>
                      {faq.q || 'Frequently Asked Question'}
                    </h5>
                    <span style={{ color: '#ea580c', fontWeight: 'bold', fontSize: '12px' }}>
                      {openFaqIndex === index ? '▲' : '▼'}
                    </span>
                  </div>
                  {openFaqIndex === index && (
                    <div style={{ padding: '0 16px 16px 16px', backgroundColor: '#ffffff' }}>
                      <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: '18px' }}>
                        {faq.a || 'No answer provided yet.'}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function WebsiteProductsManagerPage() {
  const [products, setProducts] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  
  // Settings tab: 'products' list/edit OR 'view-all-settings' configuration OR 'homepage-categories'
  const [activeSettingsMode, setActiveSettingsMode] = useState('products'); // 'products', 'view-all-settings', 'homepage-categories'
  const [previewMode, setPreviewMode] = useState('store'); // 'store' (grid), 'detail' (product details)
  const [formTab, setFormTab] = useState('basic'); // 'basic', 'media', 'description', 'structured', 'marketing'

  const [homepageCategoryImages, setHomepageCategoryImages] = useState({});
  const [selectedCatForImage, setSelectedCatForImage] = useState('');
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [catImageUrl, setCatImageUrl] = useState('');
  const [uploadingCatIcon, setUploadingCatIcon] = useState(false);
  const catIconFileRef = useRef(null);

  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingPriestImage, setUploadingPriestImage] = useState(false);
  const [uploadingGalleryIdx, setUploadingGalleryIdx] = useState(null);
  const [uploadingViewAllBanner, setUploadingViewAllBanner] = useState(false);
  const [isEditingId, setIsEditingId] = useState(null);

  // Preview simulator loop states
  const [previewImageIndex, setPreviewImageIndex] = useState(0);
  const [simSelectedPackage, setSimSelectedPackage] = useState('single');
  const [simComboQuantity, setSimComboQuantity] = useState(1);

  // Accordion status inside simulator detail view
  const [expandedSection, setExpandedSection] = useState('benefits');
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  // File refs
  const mainImageRef = useRef(null);
  const bannerImageRef = useRef(null);
  const priestImageRef = useRef(null);
  const galleryImageRefs = useRef([]);
  const viewAllBannerRef = useRef(null);

  const defaultViewAllSettings = {
    banner_image: 'https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/banner/ChatGPT Image May 26, 2026, 12_19_59 PM.png',
    title: 'pujas',
    heading: 'ALL',
    subheading: 'Pure Vedic Seva + Divine Blessings'
  };

  const [viewAllSettings, setViewAllSettings] = useState(defaultViewAllSettings);

  const initialFormState = {
    name: '',
    sanskrit_name: '',
    short_name: '',
    slug: '',
    category: '',
    new_category_input: '',
    tags_input: '',
    subtitle: '',
    short_description: '',
    description: '',
    spiritual_significance: '',
    benefits_input: '',
    rituals_included: [], // array of { name, duration, description }
    samagri_list: [], // array of { name, quantity, description }
    priest_details: { name: '', qualification: '', experience: '', bio: '' },
    duration: '',
    ideal_occasions_input: '',
    temple_association: '',
    who_should_perform: '',
    price: '',
    original_price: '',
    offers_input: '',
    badges_input: '',
    rating: '4.9',
    reviews_count: 120,
    faqs: [], // array of { question, answer }
    booking_instructions: '',
    is_published: true,
    in_stock: true,
    image: '',
    banner_image: '',
    gallery_images: [], // array of { url, alt }
    ritual_images: [],
    priest_image: '',
    material: '',
    weight: '',
    dimensions: '',
    origin: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error: fetchErr } = await supabase
        .from('website_pooja_products')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchErr) throw fetchErr;
      setProducts(data || []);
    } catch (err) {
      console.error('Error fetching website pooja products:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettingsAndCategories = async () => {
    try {
      // 1. Fetch distinct categories from website_pooja_products
      let categories = [];
      const { data: prodData } = await supabase
        .from('website_pooja_products')
        .select('category');
      
      if (prodData && prodData.length > 0) {
        categories = [...new Set(prodData.map(p => p.category).filter(Boolean))];
      }
      
      // Fallback to store_categories setting if no categories exist in products yet
      if (categories.length === 0) {
        const { data: catData } = await supabase
          .from('website_settings')
          .select('*')
          .eq('key', 'store_categories')
          .maybeSingle();
        
        if (catData && Array.isArray(catData.value)) {
          categories = catData.value;
        }
      }
      setCategoriesList(categories);

      // 2. Fetch view all configurations
      const { data: settingsData } = await supabase
        .from('website_settings')
        .select('*')
        .eq('key', 'view_all_settings')
        .maybeSingle();

      if (settingsData && settingsData.value) {
        setViewAllSettings(settingsData.value);
      }

      // 3. Fetch homepage category images from category_by_product table
      const { data: homeCatData } = await supabase
        .from('category_by_product')
        .select('*');

      if (homeCatData) {
        const mapping = {};
        homeCatData.forEach(item => {
          mapping[item.category] = item.image_url;
        });
        setHomepageCategoryImages(mapping);
      }
    } catch (err) {
      console.error('Error fetching categories/settings:', err);
    }
  };

  const handleAddCategoryIcon = async (e) => {
    e.preventDefault();
    if (!selectedCatForImage) {
      showMessage('Please select a category.', true);
      return;
    }
    const finalCategory = selectedCatForImage === '__custom__' ? customCategoryInput.trim() : selectedCatForImage;
    if (!finalCategory) {
      showMessage('Please specify a category name.', true);
      return;
    }
    if (!catImageUrl) {
      showMessage('Please upload or enter an image URL.', true);
      return;
    }

    try {
      const { error: saveErr } = await supabase
        .from('category_by_product')
        .upsert({ category: finalCategory, image_url: catImageUrl }, { onConflict: 'category' });

      if (saveErr) throw saveErr;

      setHomepageCategoryImages(prev => ({
        ...prev,
        [finalCategory]: catImageUrl
      }));
      setSelectedCatForImage('');
      setCustomCategoryInput('');
      setCatImageUrl('');
      showMessage('Category icon saved successfully!');
    } catch (err) {
      console.error('Save homepage category icon error:', err);
      showMessage(err.message, true);
    }
  };

  const handleDeleteCategoryIcon = async (catName) => {
    if (!window.confirm(`Are you sure you want to remove the image configuration for ${catName}?`)) return;
    
    try {
      const { error: delErr } = await supabase
        .from('category_by_product')
        .delete()
        .eq('category', catName);

      if (delErr) throw delErr;

      setHomepageCategoryImages(prev => {
        const next = { ...prev };
        delete next[catName];
        return next;
      });
      showMessage('Category icon removed successfully!');
    } catch (err) {
      console.error('Delete category icon error:', err);
      showMessage(err.message, true);
    }
  };

  const uploadCatIcon = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCatIcon(true);
    try {
      const publicUrl = await uploadToR2(file, 'website-categories');
      setCatImageUrl(publicUrl);
      showMessage('Category icon uploaded successfully!');
    } catch (err) {
      console.error('Upload category icon error:', err);
      showMessage('Failed to upload image.', true);
    } finally {
      setUploadingCatIcon(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchSettingsAndCategories();
  }, []);

  // Automatic scrolling simulation for multiple gallery images in simulator
  useEffect(() => {
    if (previewMode === 'detail' && formData.gallery_images?.length > 1) {
      const interval = setInterval(() => {
        setPreviewImageIndex(prev => (prev + 1) % formData.gallery_images.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [previewMode, formData.gallery_images]);

  const showMessage = (msg, isError = false) => {
    if (isError) {
      setError(msg);
      setTimeout(() => setError(null), 5000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(null), 5000);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePriestChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      priest_details: {
        ...prev.priest_details,
        [name]: value
      }
    }));
  };

  const handleSaveViewAllSettings = async (e) => {
    e.preventDefault();
    try {
      const { error: saveErr } = await supabase
        .from('website_settings')
        .upsert({ key: 'view_all_settings', value: viewAllSettings });
      
      if (saveErr) throw saveErr;
      showMessage('View All page banner settings saved successfully!');
    } catch (err) {
      console.error('Save settings error:', err);
      showMessage(err.message, true);
    }
  };

  // Structured fields dynamic modifications
  const addGalleryImage = () => {
    setFormData(prev => ({
      ...prev,
      gallery_images: [...prev.gallery_images, { url: '', alt: '' }]
    }));
  };

  const removeGalleryImage = (index) => {
    setFormData(prev => ({
      ...prev,
      gallery_images: prev.gallery_images.filter((_, idx) => idx !== index)
    }));
  };

  const handleGalleryChange = (index, field, value) => {
    const nextGallery = [...formData.gallery_images];
    nextGallery[index] = { ...nextGallery[index], [field]: value };
    setFormData(prev => ({ ...prev, gallery_images: nextGallery }));
  };

  const addRitual = () => {
    setFormData(prev => ({
      ...prev,
      rituals_included: [...prev.rituals_included, { name: '', duration: '', description: '' }]
    }));
  };

  const removeRitual = (index) => {
    setFormData(prev => ({
      ...prev,
      rituals_included: prev.rituals_included.filter((_, idx) => idx !== index)
    }));
  };

  const handleRitualChange = (index, field, value) => {
    const nextRituals = [...formData.rituals_included];
    nextRituals[index] = { ...nextRituals[index], [field]: value };
    setFormData(prev => ({ ...prev, rituals_included: nextRituals }));
  };

  const addSamagri = () => {
    setFormData(prev => ({
      ...prev,
      samagri_list: [...prev.samagri_list, { name: '', quantity: '', description: '' }]
    }));
  };

  const removeSamagri = (index) => {
    setFormData(prev => ({
      ...prev,
      samagri_list: prev.samagri_list.filter((_, idx) => idx !== index)
    }));
  };

  const handleSamagriChange = (index, field, value) => {
    const nextSamagri = [...formData.samagri_list];
    nextSamagri[index] = { ...nextSamagri[index], [field]: value };
    setFormData(prev => ({ ...prev, samagri_list: nextSamagri }));
  };

  const addFaq = () => {
    setFormData(prev => ({
      ...prev,
      faqs: [...prev.faqs, { question: '', answer: '' }]
    }));
  };

  const removeFaq = (index) => {
    setFormData(prev => ({
      ...prev,
      faqs: prev.faqs.filter((_, idx) => idx !== index)
    }));
  };

  const handleFaqChange = (index, field, value) => {
    const nextFaqs = [...formData.faqs];
    nextFaqs[index] = { ...nextFaqs[index], [field]: value };
    setFormData(prev => ({ ...prev, faqs: nextFaqs }));
  };

  // Image Upload handler utilizing Direct Cloudflare R2
  const uploadImage = async (e, target) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (target === 'image') setUploadingImage(true);
    else if (target === 'banner') setUploadingBanner(true);
    else if (target === 'priest') setUploadingPriestImage(true);
    else if (target === 'view_all_banner') setUploadingViewAllBanner(true);
    else if (typeof target === 'number') setUploadingGalleryIdx(target);

    try {
      const publicUrl = await uploadToR2(file, 'website-products');
      
      if (target === 'image') {
        setFormData(prev => ({ ...prev, image: publicUrl }));
      } else if (target === 'banner') {
        setFormData(prev => ({ ...prev, banner_image: publicUrl }));
      } else if (target === 'priest') {
        setFormData(prev => ({ ...prev, priest_image: publicUrl }));
      } else if (target === 'view_all_banner') {
        setViewAllSettings(prev => ({ ...prev, banner_image: publicUrl }));
      } else if (typeof target === 'number') {
        const nextGallery = [...formData.gallery_images];
        nextGallery[target] = { ...nextGallery[target], url: publicUrl };
        setFormData(prev => ({ ...prev, gallery_images: nextGallery }));
      }
      showMessage('Asset uploaded to Cloudflare successfully!');
    } catch (err) {
      console.error('Asset upload error:', err);
      showMessage('Failed to upload image.', true);
    } finally {
      setUploadingImage(false);
      setUploadingBanner(false);
      setUploadingPriestImage(false);
      setUploadingGalleryIdx(null);
      setUploadingViewAllBanner(false);
    }
  };

  const saveProduct = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      showMessage('Product name is required.', true);
      return;
    }

    let finalCategory = formData.category;
    if (formData.category === 'new_category' && formData.new_category_input) {
      finalCategory = formData.new_category_input.trim();
      
      // Update categories settings array in Supabase
      if (!categoriesList.includes(finalCategory)) {
        try {
          const nextCatsList = [...categoriesList, finalCategory];
          await supabase
            .from('website_settings')
            .upsert({ key: 'store_categories', value: nextCatsList });
          setCategoriesList(nextCatsList);
        } catch (err) {
          console.error('Failed to sync new category:', err);
        }
      }
    }

    // Process lists and arrays
    const formattedData = {
      name: formData.name,
      sanskrit_name: formData.sanskrit_name || null,
      short_name: formData.short_name || null,
      slug: formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      category: finalCategory,
      tags: formData.tags_input ? formData.tags_input.split(',').map(t => t.trim()).filter(Boolean) : [],
      subtitle: formData.subtitle || null,
      short_description: formData.short_description || null,
      description: formData.description || null,
      spiritual_significance: formData.spiritual_significance || null,
      benefits: formData.benefits_input ? formData.benefits_input.split('\n').map(b => b.trim()).filter(Boolean) : [],
      rituals_included: formData.rituals_included || [],
      samagri_list: formData.samagri_list || [],
      priest_details: formData.priest_details || {},
      duration: formData.duration || null,
      ideal_occasions: formData.ideal_occasions_input ? formData.ideal_occasions_input.split(',').map(o => o.trim()).filter(Boolean) : [],
      temple_association: formData.temple_association || null,
      who_should_perform: formData.who_should_perform || null,
      price: formData.price !== '' ? parseFloat(formData.price) : null,
      original_price: formData.original_price !== '' ? parseFloat(formData.original_price) : null,
      offers: formData.offers_input ? formData.offers_input.split('\n').map(o => o.trim()).filter(Boolean) : [],
      badges: formData.badges_input ? formData.badges_input.split(',').map(b => b.trim()).filter(Boolean) : [],
      rating: formData.rating !== '' ? parseFloat(formData.rating) : 4.9,
      reviews_count: formData.reviews_count !== '' ? parseInt(formData.reviews_count, 10) : 120,
      faqs: formData.faqs || [],
      booking_instructions: formData.booking_instructions || null,
      is_published: formData.is_published,
      in_stock: formData.in_stock,
      image: formData.image || null,
      banner_image: formData.banner_image || null,
      gallery_images: formData.gallery_images || [],
      priest_image: formData.priest_image || null,
      material: formData.material || null,
      weight: formData.weight || null,
      dimensions: formData.dimensions || null,
      origin: formData.origin || null
    };

    try {
      if (isEditingId) {
        const { error: saveErr } = await supabase
          .from('website_pooja_products')
          .update(formattedData)
          .eq('id', isEditingId);

        if (saveErr) throw saveErr;
        showMessage('Product details updated successfully!');
      } else {
        const { error: saveErr } = await supabase
          .from('website_pooja_products')
          .insert([formattedData]);

        if (saveErr) throw saveErr;
        showMessage('New Product created successfully!');
      }

      handleReset();
      fetchProducts();
    } catch (err) {
      console.error('Save product error:', err);
      showMessage(err.message, true);
    }
  };

  const handleEdit = (p) => {
    setFormData({
      name: p.name || '',
      sanskrit_name: p.sanskrit_name || '',
      short_name: p.short_name || '',
      slug: p.slug || '',
      category: p.category || '',
      new_category_input: '',
      tags_input: p.tags ? p.tags.join(', ') : '',
      subtitle: p.subtitle || '',
      short_description: p.short_description || '',
      description: p.description || '',
      spiritual_significance: p.spiritual_significance || '',
      benefits_input: p.benefits ? p.benefits.join('\n') : '',
      rituals_included: p.rituals_included || [],
      samagri_list: p.samagri_list || [],
      priest_details: p.priest_details || { name: '', qualification: '', experience: '', bio: '' },
      duration: p.duration || '',
      ideal_occasions_input: p.ideal_occasions ? p.ideal_occasions.join(', ') : '',
      temple_association: p.temple_association || '',
      who_should_perform: p.who_should_perform || '',
      price: p.price !== null ? String(p.price) : '',
      original_price: p.original_price !== null ? String(p.original_price) : '',
      offers_input: p.offers ? p.offers.join('\n') : '',
      badges_input: p.badges ? p.badges.join(', ') : '',
      rating: p.rating !== null ? String(p.rating) : '4.9',
      reviews_count: p.reviews_count !== null ? String(p.reviews_count) : '120',
      faqs: p.faqs || [],
      booking_instructions: p.booking_instructions || '',
      is_published: p.is_published,
      in_stock: p.in_stock,
      image: p.image || '',
      banner_image: p.banner_image || '',
      gallery_images: p.gallery_images || [],
      ritual_images: p.ritual_images || [],
      priest_image: p.priest_image || '',
      material: p.material || '',
      weight: p.weight || '',
      dimensions: p.dimensions || '',
      origin: p.origin || ''
    });
    setIsEditingId(p.id);
    setActiveSettingsMode('products');
    setFormTab('basic');
    setPreviewImageIndex(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this product?')) return;
    try {
      const { error: delErr } = await supabase
        .from('website_pooja_products')
        .delete()
        .eq('id', id);

      if (delErr) throw delErr;
      showMessage('Product deleted successfully.');
      fetchProducts();
    } catch (err) {
      showMessage(err.message, true);
    }
  };

  const handleReset = () => {
    setFormData(initialFormState);
    setIsEditingId(null);
    setFormTab('basic');
    setPreviewImageIndex(0);
  };

  const handlePublishToggle = async (p) => {
    try {
      const nextPub = !p.is_published;
      const { error: toggleErr } = await supabase
        .from('website_pooja_products')
        .update({ is_published: nextPub })
        .eq('id', p.id);

      if (toggleErr) throw toggleErr;
      showMessage(nextPub ? 'Product published successfully!' : 'Product unpublished.');
      fetchProducts();
    } catch (err) {
      showMessage(err.message, true);
    }
  };

  const tempCat = selectedCatForImage === '__custom__' ? customCategoryInput.trim() : selectedCatForImage;
  const categoriesToRender = { ...homepageCategoryImages };
  if (tempCat && tempCat !== '__custom__' && catImageUrl) {
    categoriesToRender[tempCat] = catImageUrl;
  }

  return (
    <div className="page-content" style={{ fontFamily: '"Outfit", sans-serif' }}>
      <div className="page-header">
        <h1 className="gradient-text">Website Products Manager</h1>
        <p>Manage store products, inventory categories, and dynamic live previews for the mobile app.</p>
      </div>

      {error ? <div className="login-error" style={{ marginBottom: '1.5rem' }}>{error}</div> : null}
      {successMsg ? <div className="settings-success" style={{ marginBottom: '1.5rem' }}>{successMsg}</div> : null}

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.7fr', gap: '2rem', alignItems: 'flex-start' }}>
        
        {/* Left Side: Forms / Table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Mode Navigation buttons */}
          <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
            <button 
              className={`action-btn-primary ${activeSettingsMode === 'products' ? '' : 'btn-secondary'}`}
              onClick={() => {
                setActiveSettingsMode('products');
                setPreviewMode('store');
              }}
              style={{ padding: '0.65rem 1.25rem' }}
            >
              <LayoutGrid size={18} style={{ marginRight: '0.5rem' }} />
              <span>Manage Products</span>
            </button>
            <button 
              className={`action-btn-primary ${activeSettingsMode === 'view-all-settings' ? '' : 'btn-secondary'}`}
              onClick={() => {
                setActiveSettingsMode('view-all-settings');
                setPreviewMode('store');
              }}
              style={{ padding: '0.65rem 1.25rem' }}
            >
              <ImageIcon size={18} style={{ marginRight: '0.5rem' }} />
              <span>Edit Store Page Header/Banner</span>
            </button>
            <button 
              className={`action-btn-primary ${activeSettingsMode === 'homepage-categories' ? '' : 'btn-secondary'}`}
              onClick={() => {
                setActiveSettingsMode('homepage-categories');
                setPreviewMode('home');
              }}
              style={{ padding: '0.65rem 1.25rem' }}
            >
              <Layers size={18} style={{ marginRight: '0.5rem' }} />
              <span>Homepage Category Icons</span>
            </button>
          </div>

          {activeSettingsMode === 'view-all-settings' && (
            <div className="glass-card page-card">
              <h3>View All Page settings</h3>
              <p className="card-description">Edit the logo title, heading labels, and hero banner displayed on your mobile shop view all screen.</p>
              
              <form onSubmit={handleSaveViewAllSettings} className="settings-form" style={{ marginTop: '1.5rem' }}>
                <div className="form-group">
                  <label>Store Logo Text Badge</label>
                  <input 
                    type="text" 
                    value={viewAllSettings.heading} 
                    onChange={(e) => setViewAllSettings(prev => ({ ...prev, heading: e.target.value }))}
                    placeholder="e.g. ALL"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Store Title</label>
                  <input 
                    type="text" 
                    value={viewAllSettings.title} 
                    onChange={(e) => setViewAllSettings(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. pujas"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Store Subheading</label>
                  <input 
                    type="text" 
                    value={viewAllSettings.subheading} 
                    onChange={(e) => setViewAllSettings(prev => ({ ...prev, subheading: e.target.value }))}
                    placeholder="e.g. Pure Vedic Seva + Divine Blessings"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Store Banner Background Image</label>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '0.5rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.15rem', borderRadius: '8px', background: '#ea580c', color: 'white', cursor: 'pointer', fontWeight: '500' }}>
                      <Upload size={16} />
                      <span>Choose Banner Image</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => uploadImage(e, 'view_all_banner')} 
                        style={{ display: 'none' }}
                        disabled={uploadingViewAllBanner}
                      />
                    </label>
                    {uploadingViewAllBanner && <span style={{ color: '#ea580c' }}><Loader2 size={16} className="animate-spin" /> Uploading...</span>}
                  </div>
                  <input 
                    type="text" 
                    value={viewAllSettings.banner_image} 
                    onChange={(e) => setViewAllSettings(prev => ({ ...prev, banner_image: e.target.value }))}
                    style={{ marginTop: '0.75rem' }}
                    placeholder="Banner URL"
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-primary">
                    <Save size={16} />
                    <span>Save Settings</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeSettingsMode === 'homepage-categories' && (
            <div className="glass-card page-card">
              <h3>Homepage Category Icons</h3>
              <p className="card-description">Configure the backgroundless images for category cards displayed on the mobile home screen. Categories without an image will not be displayed on the home page category row.</p>
              
              {/* Form to add/update category icon */}
              <form onSubmit={handleAddCategoryIcon} className="settings-form" style={{ marginTop: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '2rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Select Category</label>
                    <select
                      value={selectedCatForImage}
                      onChange={(e) => {
                        setSelectedCatForImage(e.target.value);
                        if (e.target.value !== '__custom__') {
                          setCustomCategoryInput('');
                        }
                      }}
                      required
                    >
                      <option value="">-- Select Category --</option>
                      {categoriesList.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                      <option value="__custom__">-- Type Custom Category --</option>
                    </select>
                  </div>
                  
                  {selectedCatForImage === '__custom__' && (
                    <div className="form-group">
                      <label>Enter Custom Category Name</label>
                      <input 
                        type="text"
                        value={customCategoryInput}
                        onChange={(e) => setCustomCategoryInput(e.target.value)}
                        placeholder="e.g. Gemstones, Siddh Range"
                        required
                      />
                    </div>
                  )}
                  
                  <div className="form-group">
                    <label>Icon Image (Without Background)</label>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '0.5rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.15rem', borderRadius: '8px', background: '#ea580c', color: 'white', cursor: 'pointer', fontWeight: '500' }}>
                        <Upload size={16} />
                        <span>Upload Icon</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={uploadCatIcon} 
                          style={{ display: 'none' }}
                          disabled={uploadingCatIcon}
                          ref={catIconFileRef}
                        />
                      </label>
                      {uploadingCatIcon && <span style={{ color: '#ea580c' }}><Loader2 size={16} className="animate-spin" /> Uploading...</span>}
                    </div>
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label>Icon Image URL</label>
                  <input 
                    type="text" 
                    value={catImageUrl} 
                    onChange={(e) => setCatImageUrl(e.target.value)}
                    placeholder="e.g. https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/..."
                    required
                  />
                </div>

                <div className="form-actions" style={{ marginTop: '1.25rem' }}>
                  <button type="submit" className="btn-primary">
                    <Plus size={16} />
                    <span>Configure Category Icon</span>
                  </button>
                </div>
              </form>

              {/* Mapped Categories Grid/List */}
              <div style={{ marginTop: '2rem' }}>
                <h4 style={{ color: 'white', marginBottom: '1rem' }}>Configured Category Icons</h4>
                {Object.keys(homepageCategoryImages).length === 0 ? (
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>No categories configured yet. Use the form above to add your first backgroundless icon.</p>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
                    {Object.entries(homepageCategoryImages).map(([catName, imgUrl]) => (
                      <div 
                        key={catName} 
                        className="glass-card" 
                        style={{ 
                          padding: '1rem', 
                          display: 'flex', 
                          flexDirection: 'column', 
                          alignItems: 'center', 
                          position: 'relative',
                          border: '1px solid rgba(255,255,255,0.05)',
                          borderRadius: '12px',
                          background: 'rgba(255,255,255,0.02)'
                        }}
                      >
                        <button 
                          type="button"
                          onClick={() => handleDeleteCategoryIcon(catName)}
                          style={{
                            position: 'absolute', top: '8px', right: '8px',
                            background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444',
                            border: 'none', borderRadius: '50%', width: '28px', height: '28px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', outline: 'none'
                          }}
                          title="Remove from Homepage"
                        >
                          <Trash2 size={14} />
                        </button>
                        
                        <div style={{
                          width: '70px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden',
                          marginBottom: '0.75rem', border: '1px solid rgba(255,255,255,0.05)'
                        }}>
                          <img src={imgUrl} alt={catName} style={{ width: '85%', height: '85%', objectFit: 'contain' }} />
                        </div>
                        
                        <span style={{ color: 'white', fontWeight: 'bold', fontSize: '0.95rem' }}>{catName}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSettingsMode === 'products' && (
            <>
              {/* Product Creator/Editor Form */}
              <div className="glass-card page-card">
                <h3>{isEditingId ? `Edit Product: ${formData.name}` : 'Create New Pooja Product'}</h3>
                <p className="card-description">Configure basic product detail fields, media assets, pricing packages, FAQs, and benefits.</p>

                {/* Form Tabs */}
                <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem', marginTop: '1.25rem' }}>
                  {['basic', 'media', 'description', 'structured', 'marketing'].map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      className={`settings-tab-btn ${formTab === tab ? 'active' : ''}`}
                      onClick={() => setFormTab(tab)}
                      style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
                    >
                      <span style={{ textTransform: 'capitalize' }}>{tab}</span>
                    </button>
                  ))}
                </div>

                <form onSubmit={saveProduct} className="settings-form" style={{ marginTop: '1.5rem' }}>
                  
                  {formTab === 'basic' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      <div className="form-group">
                        <label>Product Name (English) *</label>
                        <input 
                          type="text" 
                          name="name"
                          value={formData.name} 
                          onChange={handleInputChange}
                          placeholder="e.g. Laxmi Puja"
                          required
                        />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group">
                          <label>Sanskrit Name</label>
                          <input 
                            type="text" 
                            name="sanskrit_name"
                            value={formData.sanskrit_name} 
                            onChange={handleInputChange}
                            placeholder="e.g. महालक्ष्मी पूजन"
                          />
                        </div>
                        <div className="form-group">
                          <label>Short Name</label>
                          <input 
                            type="text" 
                            name="short_name"
                            value={formData.short_name} 
                            onChange={handleInputChange}
                            placeholder="e.g. Laxmi Puja"
                          />
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group">
                          <label>Slug (Autogenerated if blank)</label>
                          <input 
                            type="text" 
                            name="slug"
                            value={formData.slug} 
                            onChange={handleInputChange}
                            placeholder="e.g. maha-laxmi-puja"
                          />
                        </div>
                        <div className="form-group">
                          <label>Category *</label>
                          <select 
                            name="category"
                            value={formData.category}
                            onChange={handleInputChange}
                            required
                          >
                            <option value="">-- Select Category --</option>
                            {categoriesList.map((cat) => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                            <option value="new_category">+ Add New Category</option>
                          </select>
                          {formData.category === 'new_category' && (
                            <input 
                              type="text"
                              name="new_category_input"
                              value={formData.new_category_input}
                              onChange={handleInputChange}
                              placeholder="Enter custom category name"
                              style={{ marginTop: '0.5rem' }}
                              required
                            />
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group">
                          <label>Original Price (without currency sign)</label>
                          <input 
                            type="number" 
                            name="original_price"
                            value={formData.original_price} 
                            onChange={handleInputChange}
                            placeholder="e.g. 3100"
                          />
                        </div>
                        <div className="form-group">
                          <label>Offer Price *</label>
                          <input 
                            type="number" 
                            name="price"
                            value={formData.price} 
                            onChange={handleInputChange}
                            placeholder="e.g. 1100"
                            required
                          />
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                        <div className="form-group">
                          <label>Rating</label>
                          <input 
                            type="text" 
                            name="rating"
                            value={formData.rating} 
                            onChange={handleInputChange}
                            placeholder="e.g. 4.9"
                          />
                        </div>
                        <div className="form-group">
                          <label>Reviews Count</label>
                          <input 
                            type="number" 
                            name="reviews_count"
                            value={formData.reviews_count} 
                            onChange={handleInputChange}
                            placeholder="e.g. 280"
                          />
                        </div>
                        <div className="form-group">
                          <label>Duration / Time</label>
                          <input 
                            type="text" 
                            name="duration"
                            value={formData.duration} 
                            onChange={handleInputChange}
                            placeholder="e.g. 2 Hours"
                          />
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Temple Association (Provider / Location)</label>
                        <input 
                          type="text" 
                          name="temple_association"
                          value={formData.temple_association} 
                          onChange={handleInputChange}
                          placeholder="e.g. Mahalakshmi Temple, Mumbai"
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '2rem', marginTop: '0.5rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                          <input 
                            type="checkbox" 
                            name="is_published"
                            checked={formData.is_published}
                            onChange={handleInputChange}
                            style={{ width: '18px', height: '18px' }}
                          />
                          <span>Publish Immediately</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                          <input 
                            type="checkbox" 
                            name="in_stock"
                            checked={formData.in_stock}
                            onChange={handleInputChange}
                            style={{ width: '18px', height: '18px' }}
                          />
                          <span>In Stock</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {formTab === 'media' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      <div className="form-group">
                        <label>Product Main Image URL</label>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '0.5rem' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.15rem', borderRadius: '8px', background: '#ea580c', color: 'white', cursor: 'pointer', fontWeight: '500' }}>
                            <Upload size={16} />
                            <span>Upload Main Image</span>
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={(e) => uploadImage(e, 'image')} 
                              style={{ display: 'none' }}
                              ref={mainImageRef}
                            />
                          </label>
                          {uploadingImage && <span style={{ color: '#ea580c' }}><Loader2 size={16} className="animate-spin" /> Uploading...</span>}
                        </div>
                        <input 
                          type="text" 
                          name="image"
                          value={formData.image} 
                          onChange={handleInputChange}
                          style={{ marginTop: '0.75rem' }}
                          placeholder="Main image public URL"
                        />
                      </div>

                      <div className="form-group">
                        <label>Product Banner Image URL</label>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '0.5rem' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.15rem', borderRadius: '8px', background: '#ea580c', color: 'white', cursor: 'pointer', fontWeight: '500' }}>
                            <Upload size={16} />
                            <span>Upload Banner Image</span>
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={(e) => uploadImage(e, 'banner')} 
                              style={{ display: 'none' }}
                              ref={bannerImageRef}
                            />
                          </label>
                          {uploadingBanner && <span style={{ color: '#ea580c' }}><Loader2 size={16} className="animate-spin" /> Uploading...</span>}
                        </div>
                        <input 
                          type="text" 
                          name="banner_image"
                          value={formData.banner_image} 
                          onChange={handleInputChange}
                          style={{ marginTop: '0.75rem' }}
                          placeholder="Banner background image URL"
                        />
                      </div>

                      {/* Product Gallery Images (Carousel) */}
                      <div className="form-group" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                          <label style={{ margin: 0 }}>Product Gallery Images (For Slide Carousel Preview)</label>
                          <button 
                            type="button" 
                            className="action-btn-primary" 
                            onClick={addGalleryImage}
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                          >
                            <Plus size={12} />
                            <span>Add Slide Image</span>
                          </button>
                        </div>

                        {formData.gallery_images?.length === 0 ? (
                          <div style={{ padding: '1rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '8px', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
                            No gallery images added yet. Click 'Add Slide Image' to begin.
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {formData.gallery_images.map((gImg, idx) => (
                              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px 30px', gap: '0.5rem', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '0.5rem', borderRadius: '8px' }}>
                                <input 
                                  type="text"
                                  placeholder="Image URL"
                                  value={gImg.url}
                                  onChange={(e) => handleGalleryChange(idx, 'url', e.target.value)}
                                  required
                                />
                                <input 
                                  type="text"
                                  placeholder="Alt Text (caption)"
                                  value={gImg.alt}
                                  onChange={(e) => handleGalleryChange(idx, 'alt', e.target.value)}
                                />
                                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', padding: '0.45rem', borderRadius: '4px', background: '#ea580c', color: 'white', cursor: 'pointer', fontSize: '0.75rem', margin: 0 }}>
                                  <Upload size={12} />
                                  <span>{uploadingGalleryIdx === idx ? '...' : 'Upload'}</span>
                                  <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={(e) => uploadImage(e, idx)} 
                                    style={{ display: 'none' }}
                                  />
                                </label>
                                <button 
                                  type="button" 
                                  className="action-btn-danger" 
                                  onClick={() => removeGalleryImage(idx)}
                                  style={{ padding: '0.45rem' }}
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {formTab === 'description' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      <div className="form-group">
                        <label>Subtitle (Short catchphrase label)</label>
                        <input 
                          type="text" 
                          name="subtitle"
                          value={formData.subtitle} 
                          onChange={handleInputChange}
                          placeholder="e.g. Energized Vedic worship for prosperity and health"
                        />
                      </div>
                      <div className="form-group">
                        <label>Short Description (Tagline)</label>
                        <input 
                          type="text" 
                          name="short_description"
                          value={formData.short_description} 
                          onChange={handleInputChange}
                          placeholder="e.g. Attracts financial abundance, clears outstanding debts..."
                        />
                      </div>
                      <div className="form-group">
                        <label>Full Description</label>
                        <textarea 
                          name="description"
                          value={formData.description} 
                          onChange={handleInputChange}
                          placeholder="Provide the complete ritual description..."
                          style={{ minHeight: '100px', width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                        />
                      </div>
                      <div className="form-group">
                        <label>Spiritual Significance</label>
                        <textarea 
                          name="spiritual_significance"
                          value={formData.spiritual_significance} 
                          onChange={handleInputChange}
                          placeholder="Explain what ancient scriptures say about this alignment..."
                          style={{ minHeight: '80px', width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                        />
                      </div>
                      <div className="form-group">
                        <label>Who Should Perform</label>
                        <input 
                          type="text" 
                          name="who_should_perform"
                          value={formData.who_should_perform} 
                          onChange={handleInputChange}
                          placeholder="e.g. Families seeking spiritual growth and obstacle clearance"
                        />
                      </div>
                      <div className="form-group">
                        <label>Booking Instructions (Plain Text steps)</label>
                        <textarea 
                          name="booking_instructions"
                          value={formData.booking_instructions} 
                          onChange={handleInputChange}
                          placeholder="1. Enter performer details..."
                          style={{ minHeight: '80px', width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                        />
                      </div>
                    </div>
                  )}

                  {formTab === 'structured' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      
                      {/* Benefits lines input */}
                      <div className="form-group">
                        <label>Spiritual Benefits (One benefit per line)</label>
                        <textarea 
                          name="benefits_input"
                          value={formData.benefits_input} 
                          onChange={handleInputChange}
                          placeholder="Bestows divine blessings&#10;Clears negative vibes from career&#10;Brings home peace and harmony"
                          style={{ minHeight: '100px', width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                        />
                      </div>

                      {/* Ritual steps included */}
                      <div className="form-group" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                          <label style={{ margin: 0 }}>Puja Ritual Steps Included</label>
                          <button 
                            type="button" 
                            className="action-btn-primary" 
                            onClick={addRitual}
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                          >
                            <Plus size={12} />
                            <span>Add Ritual Step</span>
                          </button>
                        </div>
                        {formData.rituals_included?.length === 0 ? (
                          <div style={{ padding: '1rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '8px', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
                            No ritual steps added. Click 'Add Ritual Step' to start.
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {formData.rituals_included.map((rit, idx) => (
                              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 30px', gap: '0.5rem', alignItems: 'center' }}>
                                  <input 
                                    type="text" 
                                    placeholder="Step Name (e.g. Ganesh Sthapana & Puja)"
                                    value={rit.name}
                                    onChange={(e) => handleRitualChange(idx, 'name', e.target.value)}
                                    required
                                  />
                                  <input 
                                    type="text" 
                                    placeholder="Duration (e.g. 15 Mins)"
                                    value={rit.duration}
                                    onChange={(e) => handleRitualChange(idx, 'duration', e.target.value)}
                                  />
                                  <button 
                                    type="button" 
                                    className="action-btn-danger" 
                                    onClick={() => removeRitual(idx)}
                                    style={{ padding: '0.45rem' }}
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                                <input 
                                  type="text" 
                                  placeholder="Description of what happens during this step"
                                  value={rit.description}
                                  onChange={(e) => handleRitualChange(idx, 'description', e.target.value)}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Samagri Materials included */}
                      <div className="form-group" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                          <label style={{ margin: 0 }}>Auspicious Samagri (Ritual materials)</label>
                          <button 
                            type="button" 
                            className="action-btn-primary" 
                            onClick={addSamagri}
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                          >
                            <Plus size={12} />
                            <span>Add Material</span>
                          </button>
                        </div>
                        {formData.samagri_list?.length === 0 ? (
                          <div style={{ padding: '1rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '8px', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
                            No samagri items added. Click 'Add Material'.
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {formData.samagri_list.map((sam, idx) => (
                              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr 30px', gap: '0.5rem', alignItems: 'center' }}>
                                  <input 
                                    type="text" 
                                    placeholder="Material Name (e.g. Gangajal)"
                                    value={sam.name}
                                    onChange={(e) => handleSamagriChange(idx, 'name', e.target.value)}
                                    required
                                  />
                                  <input 
                                    type="text" 
                                    placeholder="Quantity (e.g. 1 Bottle)"
                                    value={sam.quantity}
                                    onChange={(e) => handleSamagriChange(idx, 'quantity', e.target.value)}
                                  />
                                  <button 
                                    type="button" 
                                    className="action-btn-danger" 
                                    onClick={() => removeSamagri(idx)}
                                    style={{ padding: '0.45rem' }}
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                                <input 
                                  type="text" 
                                  placeholder="Short description/purpose"
                                  value={sam.description}
                                  onChange={(e) => handleSamagriChange(idx, 'description', e.target.value)}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Priest Details */}
                      <div className="form-group" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.25rem' }}>
                        <label>Assigned Priest Details</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
                          <input 
                            type="text" 
                            name="name"
                            value={formData.priest_details.name}
                            onChange={handlePriestChange}
                            placeholder="Priest Name (e.g. Acharya Rajesh Shastri)"
                          />
                          <input 
                            type="text" 
                            name="qualification"
                            value={formData.priest_details.qualification}
                            onChange={handlePriestChange}
                            placeholder="Qualification (e.g. Vedic Acharya)"
                          />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '1rem', marginTop: '0.75rem' }}>
                          <input 
                            type="text" 
                            name="experience"
                            value={formData.priest_details.experience}
                            onChange={handlePriestChange}
                            placeholder="Exp (e.g. 15+ Yrs)"
                          />
                          <input 
                            type="text" 
                            name="bio"
                            value={formData.priest_details.bio}
                            onChange={handlePriestChange}
                            placeholder="Short bio details/scholar credentials"
                          />
                        </div>
                        
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '1rem' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', borderRadius: '4px', background: '#ea580c', color: 'white', cursor: 'pointer', fontSize: '0.8rem', margin: 0 }}>
                            <Upload size={14} />
                            <span>Upload Priest Photo</span>
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={(e) => uploadImage(e, 'priest')} 
                              style={{ display: 'none' }}
                              ref={priestImageRef}
                            />
                          </label>
                          {uploadingPriestImage && <span style={{ color: '#ea580c', fontSize: '0.8rem' }}><Loader2 size={12} className="animate-spin" /> Uploading...</span>}
                          {formData.priest_image && <span style={{ color: '#10b981', fontSize: '0.8rem' }}>✓ Uploaded</span>}
                        </div>
                      </div>

                    </div>
                  )}

                  {formTab === 'marketing' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      <div className="form-group">
                        <label>Marketing Badges (Comma separated)</label>
                        <input 
                          type="text" 
                          name="badges_input"
                          value={formData.badges_input} 
                          onChange={handleInputChange}
                          placeholder="e.g. Vedic Blessed, Top-Rated, Live Sankalp"
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>Promo Offers (One offer per line)</label>
                        <textarea 
                          name="offers_input"
                          value={formData.offers_input} 
                          onChange={handleInputChange}
                          placeholder="Free energized Prasad box&#10;Live video call stream link"
                          style={{ minHeight: '80px', width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: 'white' }}
                        />
                      </div>

                      {/* FAQs section */}
                      <div className="form-group" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                          <label style={{ margin: 0 }}>Divine FAQs</label>
                          <button 
                            type="button" 
                            className="action-btn-primary" 
                            onClick={addFaq}
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                          >
                            <Plus size={12} />
                            <span>Add FAQ</span>
                          </button>
                        </div>
                        {formData.faqs?.length === 0 ? (
                          <div style={{ padding: '1rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '8px', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
                            No FAQs added. Click 'Add FAQ'.
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {formData.faqs.map((faq, idx) => (
                              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'rgba(255,255,255,0.02)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 30px', gap: '0.5rem', alignItems: 'center' }}>
                                  <input 
                                    type="text" 
                                    placeholder="Question"
                                    value={faq.question}
                                    onChange={(e) => handleFaqChange(idx, 'question', e.target.value)}
                                    required
                                  />
                                  <button 
                                    type="button" 
                                    className="action-btn-danger" 
                                    onClick={() => removeFaq(idx)}
                                    style={{ padding: '0.45rem' }}
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                                <input 
                                  type="text" 
                                  placeholder="Answer"
                                  value={faq.answer}
                                  onChange={(e) => handleFaqChange(idx, 'answer', e.target.value)}
                                  required
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>
                  )}

                  <div className="form-actions" style={{ marginTop: '2rem' }}>
                    <button 
                      type="button" 
                      className="btn-secondary" 
                      onClick={handleReset}
                    >
                      Reset Form
                    </button>
                    <button 
                      type="submit" 
                      className="btn-primary"
                    >
                      <Save size={16} />
                      <span>{isEditingId ? 'Update Product' : 'Create Product'}</span>
                    </button>
                  </div>

                </form>

              </div>

              {/* Products List Grid */}
              <div className="glass-card table-card">
                <div className="card-header">
                  <h3>Products Repository</h3>
                  <p className="card-description">View, delete, edit, and publish products listed in `website_pooja_products`.</p>
                </div>

                {loading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '3rem', gap: '0.5rem', color: 'rgba(255,255,255,0.5)' }}>
                    <Loader2 className="animate-spin" />
                    <span>Loading products repository...</span>
                  </div>
                ) : products.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.5)' }}>
                    No products found. Create your first product above.
                  </div>
                ) : (
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Thumbnail</th>
                        <th>Name</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((p) => (
                        <tr key={p.id}>
                          <td>
                            <img 
                              src={p.image && p.image.startsWith('http') ? p.image : DEFAULT_IMAGE} 
                              alt="Thumbnail" 
                              style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }}
                            />
                          </td>
                          <td>
                            <div style={{ fontWeight: '600' }}>{p.name}</div>
                            {p.sanskrit_name && <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>{p.sanskrit_name}</div>}
                          </td>
                          <td>
                            <span style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                              {p.category}
                            </span>
                          </td>
                          <td>
                            <div style={{ fontWeight: 'bold', color: '#ffd60a' }}>₹{p.price || '—'}</div>
                            {p.original_price && <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', textDecoration: 'line-through' }}>₹{p.original_price}</div>}
                          </td>
                          <td>
                            <button 
                              onClick={() => handlePublishToggle(p)}
                              className={`badge-status ${p.is_published ? 'success' : 'warning'}`}
                              style={{ cursor: 'pointer', border: 'none', background: 'none' }}
                              title="Click to toggle publish status"
                            >
                              {p.is_published ? 'Published' : 'Draft'}
                            </button>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                              <button 
                                className="action-btn-primary" 
                                onClick={() => handleEdit(p)}
                                style={{ padding: '0.4rem' }}
                              >
                                <Edit3 size={14} />
                              </button>
                              <button 
                                className="action-btn-danger" 
                                onClick={() => handleDelete(p.id)}
                                style={{ padding: '0.4rem' }}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}

        </div>

        {/* Right Side: High Fidelity Simulator Preview */}
        <div style={{ position: 'sticky', top: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
          
          {/* Preview selector button row */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '0.25rem', width: '320px' }}>
            <button 
              className={`settings-tab-btn ${previewMode === 'home' ? 'active' : ''}`}
              onClick={() => setPreviewMode('home')}
              style={{ flex: 1, padding: '0.4rem 0.2rem', fontSize: '0.75rem', background: previewMode === 'home' ? '#ea580c' : 'none', color: previewMode === 'home' ? 'white' : 'rgba(255,255,255,0.7)', borderRadius: '6px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem' }}
            >
              <Home size={12} />
              <span>Home Page</span>
            </button>
            <button 
              className={`settings-tab-btn ${previewMode === 'store' ? 'active' : ''}`}
              onClick={() => setPreviewMode('store')}
              style={{ flex: 1, padding: '0.4rem 0.2rem', fontSize: '0.75rem', background: previewMode === 'store' ? '#ea580c' : 'none', color: previewMode === 'store' ? 'white' : 'rgba(255,255,255,0.7)', borderRadius: '6px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem' }}
            >
              <LayoutGrid size={12} />
              <span>Store Grid</span>
            </button>
            <button 
              className={`settings-tab-btn ${previewMode === 'detail' ? 'active' : ''}`}
              onClick={() => setPreviewMode('detail')}
              style={{ flex: 1, padding: '0.4rem 0.2rem', fontSize: '0.75rem', background: previewMode === 'detail' ? '#ea580c' : 'none', color: previewMode === 'detail' ? 'white' : 'rgba(255,255,255,0.7)', borderRadius: '6px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem' }}
            >
              <FileText size={12} />
              <span>Product Details</span>
            </button>
          </div>

          <h4 style={{ margin: 0, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '0.05em' }}>
            Mobile Device Simulator
          </h4>

          {/* Simulator Viewport Container */}
          <div 
            style={{
              width: '320px',
              height: '568px', // SE aspect
              background: '#ffffff',
              borderRadius: '32px',
              border: '8px solid #1e293b',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              overflow: 'hidden',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Simulator Notch */}
            <div style={{
              width: '120px',
              height: '18px',
              background: '#1e293b',
              borderRadius: '0 0 12px 12px',
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 9999,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <div style={{ width: '40px', height: '4px', background: '#090d16', borderRadius: '2px' }}></div>
            </div>

            {/* Simulated Home Page View */}
            {previewMode === 'home' && (
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff', fontFamily: '"Outfit", -apple-system, sans-serif' }}>
                {/* Hero / Banner Header */}
                <div style={{ 
                  height: '180px', width: '100%', position: 'relative', flexShrink: 0,
                  backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.85)), url("https://images.unsplash.com/photo-1609137144814-6c3614275f7e?auto=format&fit=crop&w=600&q=80")',
                  backgroundSize: 'cover', backgroundPosition: 'center',
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '12px'
                }}>
                  {/* Mock search bar */}
                  <div style={{
                    display: 'flex', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    borderRadius: '100px', height: '32px', padding: '0 12px', border: '1px solid rgba(255, 255, 255, 0.3)',
                    marginTop: '16px'
                  }}>
                    <Search size={12} color="#ffffff" style={{ marginRight: '6px' }} />
                    <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '10px' }}>Search for Chadhava and Puja</span>
                  </div>

                  {/* Banner content */}
                  <div style={{ color: 'white', textAlign: 'left' }}>
                    <span style={{ fontSize: '9px', color: '#ffd60a', fontWeight: 'bold', display: 'block', marginBottom: '2px', textTransform: 'uppercase' }}>9 May 2026, Saturday</span>
                    <h3 style={{ margin: 0, fontSize: '13px', fontWeight: '800', color: 'white', lineHeight: '16px' }}>Saturday Kalashtami Special</h3>
                    <p style={{ margin: '2px 0 0 0', fontSize: '9px', color: '#e2e8f0', lineHeight: '12px' }}>For liberation from the sins of past births & attaining happiness</p>
                  </div>
                </div>

                {/* What's on your mind? */}
                <div style={{ padding: '12px 12px 6px 12px', textAlign: 'left' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '11px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.2px' }}>What's on your mind?</h4>
                  <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '4px' }}>
                    {[
                      { title: 'Shop', icon: '🛒', color: '#ffe7db' },
                      { title: 'Kundli', icon: '📝', color: '#fef3c7' },
                      { title: 'Panchang', icon: '📅', color: '#f0fdf4' },
                      { title: 'Rashi', icon: '☸️', color: '#e0f2fe' }
                    ].map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flexShrink: 0, width: '50px' }}>
                        <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
                          {item.icon}
                        </div>
                        <span style={{ fontSize: '9px', color: '#475569', fontWeight: '700' }}>{item.title}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shop by Category Section (Dynamic Highlight) */}
                <div style={{ 
                  padding: '12px', borderTop: '4px solid #f8fafc', borderBottom: '4px solid #f8fafc', 
                  backgroundColor: '#ffffff', textAlign: 'left' 
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h4 style={{ margin: 0, fontSize: '12px', fontWeight: '800', color: '#000000' }}>Shop by Category</h4>
                    <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#ea580c', cursor: 'pointer' }}>view all &gt;</span>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
                    {Object.keys(categoriesToRender).length === 0 ? (
                      // Render placeholder preview categories if none are configured yet
                      [
                        { name: 'Pooja Kits', bg: '#ffe7db' },
                        { name: 'Deity Idols', bg: '#fef3c7' },
                        { name: 'Sacred Malas', bg: '#f0fdf4' }
                      ].map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', width: '70px', flexShrink: 0 }}>
                          <div style={{ 
                            width: '70px', height: '70px', borderRadius: '50%', backgroundColor: item.bg,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px dashed #fdba74'
                          }}>
                            <span style={{ fontSize: '9px', color: '#c2410c', fontWeight: 'bold', textAlign: 'center', padding: '4px', lineHeight: '11px' }}>No Icon Added</span>
                          </div>
                          <span style={{ fontSize: '9px', color: '#64748b', fontWeight: '700', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>{item.name}</span>
                        </div>
                      ))
                    ) : (
                      Object.entries(categoriesToRender).map(([catName, imgUrl], idx) => {
                        const bgColors = ['#ffe7db', '#fef3c7', '#f0fdf4', '#e0f2fe', '#f3e8ff'];
                        const bg = bgColors[idx % bgColors.length];
                        return (
                          <div key={catName} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', width: '70px', flexShrink: 0 }}>
                            <div style={{ 
                              width: '70px', height: '70px', borderRadius: '50%', backgroundColor: bg,
                              display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                              border: '1px solid rgba(0,0,0,0.04)', boxShadow: '0 2px 4px rgba(0,0,0,0.01)'
                            }}>
                              <img src={imgUrl} alt={catName} style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
                            </div>
                            <span style={{ fontSize: '10px', color: '#334155', fontWeight: 'bold', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>{catName}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Life Problem Solution */}
                <div style={{ padding: '12px', textAlign: 'left' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '11px', fontWeight: '800', color: '#000000' }}>Life Problem Solution</h4>
                  <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                    {[
                      { title: 'HEALTH PROBLEMS', color: '#b91c1c', bg: '#fee2e2' },
                      { title: 'WEALTH & MONEY', color: '#a16207', bg: '#fef9c3' },
                      { title: 'JOB & CAREER', color: '#1d4ed8', bg: '#dbeafe' }
                    ].map((item, idx) => (
                      <div key={idx} style={{ 
                        flexShrink: 0, width: '90px', height: '65px', borderRadius: '12px', backgroundColor: item.bg,
                        padding: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                        border: '1px solid rgba(0,0,0,0.02)'
                      }}>
                        <span style={{ fontSize: '8px', fontWeight: '800', color: item.color, lineHeight: '10px' }}>{item.title}</span>
                        <span style={{ alignSelf: 'flex-end', fontSize: '12px' }}>🕉️</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Devotee Video Reviews */}
                <div style={{ padding: '12px', borderTop: '4px solid #f8fafc', textAlign: 'left' }}>
                  <h4 style={{ margin: '0 0 2px 0', fontSize: '11px', fontWeight: '800', color: '#000000' }}>Devotee Video Reviews</h4>
                  <p style={{ margin: '0 0 8px 0', fontSize: '8px', color: '#64748b', lineHeight: '10px' }}>Listen to the divine experiences of our blessed families</p>
                  <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                    {[
                      { name: 'Rajesh & Family', loc: 'Delhi NCR', rating: '5.0' },
                      { name: 'Anjali Sharma', loc: 'Mumbai', rating: '4.9' }
                    ].map((item, idx) => (
                      <div key={idx} style={{ 
                        flexShrink: 0, width: '110px', height: '150px', borderRadius: '12px',
                        backgroundImage: 'linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.8)), url("https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=200&q=80")',
                        backgroundSize: 'cover', padding: '8px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', color: 'white'
                      }}>
                        <div style={{ backgroundColor: 'rgba(0,0,0,0.5)', padding: '1px 4px', borderRadius: '8px', fontSize: '7px', alignSelf: 'flex-start' }}>▶ 1:45</div>
                        <div>
                          <div style={{ display: 'flex', gap: '3px', alignItems: 'center', marginBottom: '2px' }}>
                            <span style={{ fontSize: '7px', backgroundColor: '#e6f4ea', color: '#137333', padding: '0px 3px', borderRadius: '2px', fontWeight: 'bold' }}>★ {item.rating}</span>
                            <span style={{ fontSize: '7px', color: '#cbd5e1' }}>{item.loc}</span>
                          </div>
                          <span style={{ fontSize: '8px', fontWeight: 'bold', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Simulated Store View Grid */}
            {previewMode === 'store' && (
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff' }}>
                
                {/* Banner Header Image */}
                <div style={{ height: '160px', width: '100%', position: 'relative', flexShrink: 0 }}>
                  <img 
                    src={viewAllSettings.banner_image} 
                    alt="Store Banner" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                  {/* Overlaid mock buttons */}
                  <div style={{ position: 'absolute', top: '30px', left: '12px', width: '26px', height: '26px', borderRadius: '13px', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                    <ArrowLeft size={14} color="#000" />
                  </div>
                  <div style={{ position: 'absolute', top: '30px', right: '12px', display: 'flex', gap: '6px', zIndex: 10 }}>
                    <div style={{ width: '26px', height: '26px', borderRadius: '13px', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Search size={12} color="#000" />
                    </div>
                    <div style={{ width: '26px', height: '26px', borderRadius: '13px', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ShoppingCart size={12} color="#000" />
                    </div>
                  </div>
                </div>

                {/* Banner Labels Title / Subheading */}
                <div style={{ padding: '16px 12px 0 12px', textAlign: 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ backgroundColor: '#ea580c', borderRadius: '4px', padding: '1px 5px' }}>
                      <span style={{ color: 'white', fontSize: '9px', fontWeight: 'bold' }}>{viewAllSettings.heading}</span>
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#000', textTransform: 'lowercase' }}>{viewAllSettings.title}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginTop: '4px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '6px' }}>✓</div>
                    <span style={{ fontSize: '9px', color: '#64748b', fontWeight: '500' }}>
                      {viewAllSettings.subheading ? (
                        viewAllSettings.subheading.includes(' + ') ? (
                          <>
                            {viewAllSettings.subheading.split(' + ')[0]} <span style={{ color: '#ea580c', fontWeight: '700' }}>+ {viewAllSettings.subheading.split(' + ')[1]}</span>
                          </>
                        ) : (
                          viewAllSettings.subheading
                        )
                      ) : (
                        <>Pure Vedic Seva <span style={{ color: '#ea580c', fontWeight: '700' }}>+ Divine Blessings</span></>
                      )}
                    </span>
                  </div>
                </div>

                {/* Category selectors mock */}
                <div style={{ display: 'flex', gap: '6px', padding: '12px 12px 6px 12px', overflowX: 'auto', flexShrink: 0 }}>
                  {['All', formData.category || 'Rudraksha', 'Bracelet', 'Yantras'].map((c, idx) => (
                    <div key={idx} style={{ padding: '4px 10px', borderRadius: '12px', backgroundColor: idx === 0 ? '#ea580c' : '#f1f5f9', border: '1.5px solid #e2e8f0', flexShrink: 0 }}>
                      <span style={{ fontSize: '9px', color: idx === 0 ? 'white' : '#475569', fontWeight: 'bold' }}>{c}</span>
                    </div>
                  ))}
                </div>

                {/* Cards Grid */}
                <div style={{ padding: '10px 12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {/* Render simulated card based on current form input */}
                  <CardPreview 
                    data={{
                      title: formData.name || 'Sacred Maha Pooja',
                      original_price: formData.original_price ? '₹' + formData.original_price : '₹251',
                      offer_price: formData.price ? '₹' + formData.price : '₹151',
                      rating: formData.rating || '4.9',
                      reviews: formData.reviews_count || '12',
                      provider: formData.temple_association || 'Kashi Temple',
                      image_url: formData.image || DEFAULT_IMAGE
                    }} 
                    imgHeight="80px"
                  />
                  {/* Render standard dummy card for comparison */}
                  <CardPreview 
                    data={{
                      title: '7 Mukhi Rudraksha',
                      original_price: '₹999',
                      offer_price: '₹2,499',
                      rating: '5.0',
                      reviews: '420',
                      provider: 'Pure Nepal Origin',
                      image_url: 'https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/products/gallery/d7411413-0889-4b81-8623-0112820a4fea_r1.png'
                    }} 
                    imgHeight="80px"
                  />
                </div>

                {/* Simulated Floating Footer */}
                <div style={{ marginTop: 'auto', padding: '10px', width: '100%', flexShrink: 0, borderTop: '0.5px solid #f1f5f9', backgroundColor: '#f0fdfa' }}>
                  <span style={{ fontSize: '8px', color: '#0f766e', fontWeight: '500' }}>
                    <span style={{ fontWeight: 'bold' }}>FREE DELIVERY</span> on orders above <span style={{ fontWeight: 'bold' }}>₹149</span>
                  </span>
                </div>

              </div>
            )}

            {/* Simulated Product Details View */}
            {previewMode === 'detail' && (
              <DetailPreview 
                data={{
                  title: formData.name || 'Sacred Maha Pooja',
                  tagline: formData.short_description || 'Energized Vedic worship for prosperity and health',
                  rating: formData.rating || '4.9',
                  reviews: formData.reviews_count || '12',
                  tag: formData.badges_input?.split(',')[0]?.trim() || formData.subtitle || 'Vedic Blessed',
                  image_url: formData.gallery_images?.length > 0 ? formData.gallery_images[previewImageIndex]?.url : (formData.image || DEFAULT_IMAGE),
                  combo_offer: {
                    title: formData.name + ' & Kavash Shield',
                    description: 'Get double blessing energized protection combo box.',
                    original_price: formData.original_price ? '₹' + (parseFloat(formData.original_price) + 500) : '₹751',
                    offer_price: formData.price ? '₹' + (parseFloat(formData.price) + 200) : '₹351'
                  },
                  benefits: formData.benefits_input ? formData.benefits_input.split('\n').map(b => '• ' + b).join('\n') : '',
                  steps: formData.rituals_included?.map(r => `• ${r.name} (${r.duration}): ${r.description}`).join('\n') || '',
                  samagri: formData.samagri_list?.map(s => `${s.name} (${s.quantity})`).join(', ') || '',
                  temple: formData.temple_association || 'Sacred Vedic Shrine',
                  pandit: formData.priest_details?.name ? `${formData.priest_details.name} (${formData.priest_details.qualification}, ${formData.priest_details.experience} experience)` : '',
                  prasad: formData.offers_input ? formData.offers_input.split('\n').join('\n') : '',
                  other_info: formData.booking_instructions || '',
                  faqs: formData.faqs?.map(f => ({ q: f.question, a: f.answer })) || [],
                  single_title: 'Single Sankalp',
                  single_description: 'Individual name & gotra Sankalp + Holy Prasad transit box.',
                  single_price: formData.price ? '₹' + formData.price : '₹151',
                  single_original_price: formData.original_price ? '₹' + formData.original_price : '₹251',
                  family_title: 'Family Pariwar',
                  family_description: 'Full household (4 names) Sankalps + Consecrated copper yantra shield.',
                  family_price: formData.price ? '₹' + (parseFloat(formData.price) * 2) : '₹302',
                  family_original_price: formData.original_price ? '₹' + (parseFloat(formData.original_price) * 2) : '₹502'
                }}
                selectedPackage={simSelectedPackage}
                setSelectedPackage={setSimSelectedPackage}
                comboQuantity={simComboQuantity}
                setComboQuantity={setSimComboQuantity}
              />
            )}

            {/* Overlaid simulated details bottom booking bar */}
            {previewMode === 'detail' && (
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, height: '70px',
                backgroundColor: '#ffffff', borderTop: '1px solid #f1f5f9', display: 'flex',
                alignItems: 'center', justifyContent: 'center', padding: '0 16px', zIndex: 99
              }}>
                <button type="button" style={{
                  backgroundColor: '#ea580c', color: '#ffffff', border: 'none', outline: 'none',
                  width: '100%', height: '44px', borderRadius: '12px', fontSize: '11px',
                  fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  boxShadow: '0 4px 6px rgba(234, 88, 12, 0.25)'
                }}>
                  ADD PUJA TO DEVOTIONAL CART ➔
                </button>
              </div>
            )}

          </div>

          {/* Carousel Manual slide controls indicator */}
          {previewMode === 'detail' && formData.gallery_images?.length > 1 && (
            <div style={{ display: 'flex', gap: '6px', marginTop: '0.25rem' }}>
              {formData.gallery_images.map((_, idx) => (
                <div 
                  key={idx} 
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '3px',
                    backgroundColor: previewImageIndex === idx ? '#ea580c' : 'rgba(255,255,255,0.2)'
                  }}
                />
              ))}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
