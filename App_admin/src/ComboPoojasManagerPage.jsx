import { useState, useEffect, useRef } from 'react';
import { Edit3, Trash2, Check, AlertTriangle, Upload, Loader2, Save, Send, Plus, X, ArrowLeft, ShoppingCart, Search, Share2, Star, ChevronDown, ChevronUp, Bell } from 'lucide-react';
import { supabase } from './lib/supabase';
import { uploadToR2 } from './lib/r2';

const DEFAULT_IMAGE_LEFT = 'https://images.unsplash.com/photo-1609137144814-6c3614275f7e?auto=format&fit=crop&w=600&q=80';
const DEFAULT_IMAGE_RIGHT = 'https://images.unsplash.com/photo-1545128485-c400e7702796?auto=format&fit=crop&w=600&q=80';

const MOCK_COMBOS = [
  {
    id: 'mock-1',
    title: 'Rudrabhishek + Kashi Vishwanath Prasad',
    tagline: 'Achieve supreme cosmic protection & Kashi blessings in a single combined ritual.',
    original_price: '₹1,100',
    price: '₹501',
    rating: '4.9',
    reviews: '1,200',
    provider: 'Kashi Vishwanath Trust & Priests',
    tag: 'Maha Combo',
    devotees_count: 'Ordered by 1.2k+ families today',
    benefits: '• Protects your household from negative influences, legal disputes & sudden losses\n• Chanting of Shiva Stotrams purifies domestic environment and blocks negative planetary forces\n• Directly brings Kashi Swayambhu shrine blessings into your living room',
    steps: '• Sankalp with client Name, Gotra & family details chanted in Kashi\n• Maha Rudrabhishek Abhishek done on holy lingam with milk & honey\n• Flower shringar tribute & standard evening Ganga Aarti dedication\n• High-energy chanting of 1,008 Shiv Shasranama verses',
    samagri: 'Holy Gangajal water, pure honey, raw milk, bilvapatra leaves, white chandan, and fresh marigold garlands.',
    pandit: 'Acharya Raman Shastri (Varanasi Gurukul, 15+ years experience)',
    temple: 'Holy Ganges bank & Kashi Vishwanath, Uttar Pradesh',
    prasad: 'Pure Kashi Vishwanath Lal Peda prasad box, energized iron Shiva pocket card, and raw sacred Gangajal bottle.',
    other_info: 'Your customized double Sankalp represents spiritual shielding. A short clip of your specific puja and name chant at Varanasi will be messaged to your phone.',
    single_title: 'Single Sankalp',
    single_description: 'Individual name & gotra Sankalp + Holy Prasad transit box.',
    family_title: 'Family Pariwar',
    family_description: 'Full household (4 names) Sankalps + Consecrated copper yantra shield.',
    is_active: true,
    sort_order: 1
  }
];

// --- Subcomponents for Live Preview --- //

const SacredTilak = () => (
  <div style={{
    width: '10px',
    height: '12px',
    borderLeft: '1.5px solid #ea580c',
    borderRight: '1.5px solid #ea580c',
    borderBottom: '1.5px solid #ea580c',
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

// Preview Component: Homepage Card representing a combo
const ComboCardPreview = ({ data }) => {
  const leftImg = data.left_image_url || DEFAULT_IMAGE_LEFT;
  const rightImg = data.right_image_url || DEFAULT_IMAGE_RIGHT;
  
  return (
    <div style={{
      width: '100%',
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      border: '1px solid #e2e8f0',
      overflow: 'hidden',
      fontFamily: '"Outfit", -apple-system, sans-serif',
      boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
      display: 'flex',
      flexDirection: 'column',
      textAlign: 'left'
    }}>
      {/* Side-by-Side Images */}
      <div style={{ position: 'relative', display: 'flex', width: '100%', height: '110px' }}>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <img src={leftImg} alt="Left Item" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <img src={rightImg} alt="Right Item" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        
        {/* Centered Saffron Floating Plus Button */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: '#ffffff',
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ea580c',
          fontSize: '18px',
          fontWeight: 'bold',
          border: '1.5px solid #f97316',
          boxShadow: '0 2px 5px rgba(234, 88, 12, 0.25)'
        }}>+</div>
      </div>

      {/* Card Content */}
      <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {/* Devotees order count with small veg box */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            width: '10px', height: '10px', border: '1px solid #c2410c',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#c2410c' }} />
          </div>
          <span style={{ fontSize: '9.5px', color: '#c2410c', fontWeight: 'bold' }}>
            {data.devotees_count || 'Ordered by 1.2k+ families today'}
          </span>
        </div>

        {/* Title */}
        <h3 style={{
          margin: 0, fontSize: '12px', fontWeight: '700', color: '#0f172a', lineHeight: '16px',
          minHeight: '32px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
        }}>
          {data.title || 'Rudrabhishek + Kashi Vishwanath Prasad'}
        </h3>

        <div style={{ height: '1px', backgroundColor: '#f1f5f9', margin: '4px 0' }} />

        {/* Price and CTA footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '9px', color: '#94a3b8', textDecoration: 'line-through' }}>
              {data.original_price || '₹1,100'}
            </span>
            <span style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a' }}>
              {data.price || '₹501'}
            </span>
          </div>
          <button style={{
            backgroundColor: '#ffffff',
            border: '1.5px solid #16a34a',
            color: '#16a34a',
            borderRadius: '6px',
            padding: '4px 8px',
            fontSize: '9px',
            fontWeight: 'bold',
            cursor: 'default'
          }}>Book Combo</button>
        </div>
      </div>
    </div>
  );
};

// Preview Component: Combo Detail Page
const ComboDetailPreview = ({ data, selectedPackage, setSelectedPackage }) => {
  const leftImg = data.left_image_url || DEFAULT_IMAGE_LEFT;
  const rightImg = data.right_image_url || DEFAULT_IMAGE_RIGHT;
  
  // Package definitions
  const singleTitle = data.single_title || 'Single Sankalp';
  const singleDesc = data.single_description || 'Individual name & gotra Sankalp + Holy Prasad transit box.';
  const familyTitle = data.family_title || 'Family Pariwar';
  const familyDesc = data.family_description || 'Full household (4 names) Sankalps + Consecrated copper yantra shield.';

  // Pricing calculations
  const parsedPrice = parseInt(data.price?.replace(/[^0-9]/g, '') || '501', 10);
  const parsedOriginalPrice = parseInt(data.original_price?.replace(/[^0-9]/g, '') || '1100', 10);

  const offerPriceVal = selectedPackage === 'single' ? parsedPrice : parsedPrice * 2;
  const originalPriceVal = selectedPackage === 'single' ? parsedOriginalPrice : parsedOriginalPrice * 2;

  // Accordion local state simulation
  const [activeTab, setActiveTab] = useState('benefits'); // 'benefits', 'details', 'pandit', 'prasad'

  return (
    <div style={{
      width: '100%',
      backgroundColor: '#f8fafc',
      fontFamily: '"Outfit", -apple-system, sans-serif',
      color: '#1e293b',
      borderRadius: '24px',
      overflow: 'hidden',
      boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
      textAlign: 'left',
      position: 'relative'
    }}>
      {/* Scrollable container viewport */}
      <div style={{ height: '520px', overflowY: 'auto', paddingBottom: '70px' }}>
        
        {/* Large Media Header Section with Dual Image */}
        <div style={{ position: 'relative', width: '100%', height: '190px', display: 'flex' }}>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <img src={leftImg} alt="Left" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <img src={rightImg} alt="Right" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>

          {/* Plus overlay badge */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(234, 88, 12, 0.95)',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontSize: '22px',
            fontWeight: 'bold',
            boxShadow: '0 0 10px rgba(234, 88, 12, 0.5)'
          }}>+</div>

          {/* Top buttons overlay */}
          <div style={{
            position: 'absolute', top: '12px', left: '12px', right: '12px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ArrowLeft size={16} /></div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Star size={14} color="#94a3b8" /></div>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ShoppingCart size={14} /></div>
              <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Share2 size={14} /></div>
            </div>
          </div>
        </div>

        {/* Details Card Content */}
        <div style={{ padding: '16px', backgroundColor: '#ffffff', marginTop: '-15px', borderTopLeftRadius: '16px', borderTopRightRadius: '16px', position: 'relative', boxShadow: '0 -4px 10px rgba(0,0,0,0.03)' }}>
          
          {/* Vedic Indicator badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <div style={{
              width: '10px', height: '10px', border: '1px solid #ea580c',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#ea580c' }} />
            </div>
            <span style={{ fontSize: '10px', color: '#ea580c', fontWeight: '800' }}>100% Pure Vedic Holy Combo</span>
          </div>

          {/* Title and Subtitle */}
          <h2 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: '0 0 4px 0', lineHeight: '20px' }}>
            {data.title || 'Rudrabhishek + Kashi Vishwanath Prasad'}
          </h2>
          <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 12px 0', lineHeight: '15px' }}>
            {data.tagline || 'Achieve supreme cosmic protection & Kashi blessings in a single combined ritual.'}
          </p>

          <div style={{ height: '1px', backgroundColor: '#f1f5f9', marginBottom: '10px' }} />

          {/* Rating */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <div style={{ backgroundColor: '#ea580c', color: 'white', display: 'flex', alignItems: 'center', gap: '3px', padding: '2px 6px', borderRadius: '6px', fontSize: '10px', fontWeight: 'bold' }}>
              ★ <span>{data.rating || '4.9'}</span>
            </div>
            <span style={{ fontSize: '10px', color: '#64748b' }}>{data.reviews || '1,200'} blessed devotees joined</span>
          </div>

          {/* Package Selector */}
          <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#94a3b8', display: 'block', marginBottom: '8px' }}>SELECT RITUAL LEVEL</span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
            {/* Single Option */}
            <div 
              onClick={() => setSelectedPackage('single')} 
              style={{
                border: selectedPackage === 'single' ? '1.5px solid #ea580c' : '1px solid #e2e8f0',
                borderRadius: '12px', padding: '10px', cursor: 'pointer', backgroundColor: selectedPackage === 'single' ? '#fff7ed' : '#ffffff',
                display: 'flex', flexDirection: 'column', gap: '4px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: selectedPackage === 'single' ? '#ea580c' : '#0f172a' }}>{singleTitle}</span>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {selectedPackage === 'single' && <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ea580c' }} />}
                </div>
              </div>
              <p style={{ fontSize: '9px', color: '#64748b', margin: 0, lineHeight: '12px', flex: 1 }}>{singleDesc}</p>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'baseline', marginTop: '4px' }}>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#ea580c' }}>₹{parsedPrice}</span>
                <span style={{ fontSize: '9px', color: '#94a3b8', textDecoration: 'line-through' }}>₹{parsedOriginalPrice}</span>
              </div>
            </div>

            {/* Family Option */}
            <div 
              onClick={() => setSelectedPackage('family')} 
              style={{
                border: selectedPackage === 'family' ? '1.5px solid #ea580c' : '1px solid #e2e8f0',
                borderRadius: '12px', padding: '10px', cursor: 'pointer', backgroundColor: selectedPackage === 'family' ? '#fff7ed' : '#ffffff',
                display: 'flex', flexDirection: 'column', gap: '4px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: selectedPackage === 'family' ? '#ea580c' : '#0f172a' }}>{familyTitle}</span>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {selectedPackage === 'family' && <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ea580c' }} />}
                </div>
              </div>
              <p style={{ fontSize: '9px', color: '#64748b', margin: 0, lineHeight: '12px', flex: 1 }}>{familyDesc}</p>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'baseline', marginTop: '4px' }}>
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#ea580c' }}>₹{parsedPrice * 2}</span>
                <span style={{ fontSize: '9px', color: '#94a3b8', textDecoration: 'line-through' }}>₹{parsedOriginalPrice * 2}</span>
              </div>
            </div>
          </div>

          {/* Pricing Block */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9', marginBottom: '16px' }}>
            <div>
              <span style={{ fontSize: '9px', color: '#ea580c', fontWeight: 'bold', display: 'block' }}>Combo Special Offer</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '2px' }}>
                <span style={{ fontSize: '16px', fontWeight: '800', color: '#ea580c' }}>₹{offerPriceVal}</span>
                <span style={{ fontSize: '11px', color: '#94a3b8', textDecoration: 'line-through' }}>₹{originalPriceVal}</span>
              </div>
            </div>
            {/* Quantity mock selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '4px 8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>-</span>
              <span style={{ fontSize: '11px', fontWeight: '800' }}>1</span>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>+</span>
            </div>
          </div>

          {/* Accordions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* 1. Benefits */}
            <div style={{ border: '1px solid #f1f5f9', borderRadius: '8px', overflow: 'hidden' }}>
              <div 
                onClick={() => setActiveTab(activeTab === 'benefits' ? '' : 'benefits')}
                style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: '#f8fafc', cursor: 'pointer', alignItems: 'center' }}
              >
                <span style={{ fontSize: '11px', fontWeight: '700' }}>1. Divine Benefits of Combo</span>
                <ChevronDown size={14} style={{ transform: activeTab === 'benefits' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </div>
              {activeTab === 'benefits' && (
                <div style={{ padding: '10px 12px', fontSize: '10px', color: '#475569', backgroundColor: '#ffffff', whiteSpace: 'pre-wrap', lineHeight: '14px' }}>
                  {data.benefits || 'No benefits defined.'}
                </div>
              )}
            </div>

            {/* 2. Steps & Samagri */}
            <div style={{ border: '1px solid #f1f5f9', borderRadius: '8px', overflow: 'hidden' }}>
              <div 
                onClick={() => setActiveTab(activeTab === 'details' ? '' : 'details')}
                style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: '#f8fafc', cursor: 'pointer', alignItems: 'center' }}
              >
                <span style={{ fontSize: '11px', fontWeight: '700' }}>2. Combo Ritual Steps & Materials</span>
                <ChevronDown size={14} style={{ transform: activeTab === 'details' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </div>
              {activeTab === 'details' && (
                <div style={{ padding: '10px 12px', fontSize: '10px', color: '#475569', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column', gap: '8px', lineHeight: '14px' }}>
                  <div>
                    <h5 style={{ margin: '0 0 3px 0', fontWeight: 'bold', color: '#ea580c' }}>Ritual Procedure:</h5>
                    <div style={{ whiteSpace: 'pre-wrap' }}>{data.steps || 'No steps defined.'}</div>
                  </div>
                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '6px' }}>
                    <h5 style={{ margin: '0 0 3px 0', fontWeight: 'bold', color: '#ea580c' }}>Samagri Checklist:</h5>
                    <p style={{ margin: 0 }}>{data.samagri || 'No samagri list defined.'}</p>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Pandit & Temple */}
            <div style={{ border: '1px solid #f1f5f9', borderRadius: '8px', overflow: 'hidden' }}>
              <div 
                onClick={() => setActiveTab(activeTab === 'pandit' ? '' : 'pandit')}
                style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: '#f8fafc', cursor: 'pointer', alignItems: 'center' }}
              >
                <span style={{ fontSize: '11px', fontWeight: '700' }}>3. Pandit & Temple Details</span>
                <ChevronDown size={14} style={{ transform: activeTab === 'pandit' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </div>
              {activeTab === 'pandit' && (
                <div style={{ padding: '10px 12px', fontSize: '10px', color: '#475569', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column', gap: '8px', lineHeight: '14px' }}>
                  <div>
                    <h5 style={{ margin: '0 0 3px 0', fontWeight: 'bold', color: '#ea580c' }}>Consecrated Temple:</h5>
                    <p style={{ margin: 0 }}>{data.temple || 'No temple defined.'}</p>
                  </div>
                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '6px' }}>
                    <h5 style={{ margin: '0 0 3px 0', fontWeight: 'bold', color: '#ea580c' }}>Vedic Acharya:</h5>
                    <p style={{ margin: 0 }}>{data.pandit || 'No pandit assigned.'}</p>
                  </div>
                </div>
              )}
            </div>

            {/* 4. Prasad & Info */}
            <div style={{ border: '1px solid #f1f5f9', borderRadius: '8px', overflow: 'hidden' }}>
              <div 
                onClick={() => setActiveTab(activeTab === 'prasad' ? '' : 'prasad')}
                style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: '#f8fafc', cursor: 'pointer', alignItems: 'center' }}
              >
                <span style={{ fontSize: '11px', fontWeight: '700' }}>4. Prasad & Shipping Details</span>
                <ChevronDown size={14} style={{ transform: activeTab === 'prasad' ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </div>
              {activeTab === 'prasad' && (
                <div style={{ padding: '10px 12px', fontSize: '10px', color: '#475569', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column', gap: '8px', lineHeight: '14px' }}>
                  <div>
                    <h5 style={{ margin: '0 0 3px 0', fontWeight: 'bold', color: '#ea580c' }}>Prasad Package Includes:</h5>
                    <p style={{ margin: 0 }}>{data.prasad || 'No prasad details defined.'}</p>
                  </div>
                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '6px' }}>
                    <h5 style={{ margin: '0 0 3px 0', fontWeight: 'bold', color: '#ea580c' }}>Ritual Proof & Other Info:</h5>
                    <p style={{ margin: 0 }}>{data.other_info || 'No details defined.'}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Bottom action bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '62px',
        backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0', display: 'flex',
        alignItems: 'center', justifyContent: 'center', padding: '0 16px', zIndex: 10
      }}>
        <div style={{
          backgroundColor: '#ea580c', color: 'white', borderRadius: '12px',
          width: '100%', height: '42px', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontWeight: '800', fontSize: '11px', cursor: 'default'
        }}>
          ADD COMBO TO DEVOTIONAL CART →
        </div>
      </div>
    </div>
  );
};

export default function ComboPoojasManagerPage() {
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  
  // Tab control
  const [formTab, setFormTab] = useState('basic'); // 'basic', 'detail', 'packages'
  const [previewMode, setPreviewMode] = useState('card'); // 'card' or 'detail'
  
  // Package toggle state for detail preview
  const [previewPackage, setPreviewPackage] = useState('single');

  // Editing state
  const [isEditingId, setIsEditingId] = useState(null);
  const [uploadingLeftImage, setUploadingLeftImage] = useState(false);
  const [uploadingRightImage, setUploadingRightImage] = useState(false);

  const leftImageInputRef = useRef(null);
  const rightImageInputRef = useRef(null);

  const initialFormState = {
    title: '',
    tagline: '',
    left_image_url: '',
    right_image_url: '',
    price: '₹501',
    original_price: '₹1,100',
    rating: '4.9',
    reviews: '1200',
    provider: '',
    tag: 'Maha Combo',
    devotees_count: 'Ordered by 1.2k+ families today',
    benefits: '',
    steps: '',
    samagri: '',
    pandit: '',
    temple: '',
    prasad: '',
    other_info: '',
    single_title: 'Single Sankalp',
    single_description: 'Individual name & gotra Sankalp + Holy Prasad transit box.',
    family_title: 'Family Pariwar',
    family_description: 'Full household (4 names) Sankalps + Consecrated copper yantra shield.',
    is_active: true,
    sort_order: 1,
    translations: {}
  };

  const [formData, setFormData] = useState(initialFormState);

  const fetchCombos = async () => {
    setLoading(true);
    try {
      const { data, error: fetchErr } = await supabase
        .from('combo_poojas')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (fetchErr) throw fetchErr;
      setCombos(data || []);
    } catch (err) {
      console.error('Error fetching combo poojas:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCombos();
  }, []);

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

  const handleImageUpload = async (e, side) => {
    const file = e.target.files[0];
    if (!file) return;

    if (side === 'left') setUploadingLeftImage(true);
    else setUploadingRightImage(true);

    try {
      const publicUrl = await uploadToR2(file, 'combos');
      if (side === 'left') {
        setFormData(prev => ({ ...prev, left_image_url: publicUrl }));
      } else {
        setFormData(prev => ({ ...prev, right_image_url: publicUrl }));
      }
      showMessage(`${side === 'left' ? 'Left' : 'Right'} image uploaded to Cloudflare successfully!`);
    } catch (err) {
      console.error('Upload error:', err);
      showMessage(err.message || 'Failed to upload image.', true);
    } finally {
      if (side === 'left') setUploadingLeftImage(false);
      else setUploadingRightImage(false);
    }
  };

  const saveCombo = async () => {
    if (!formData.title || !formData.provider) {
      showMessage('Title and Provider are required.', true);
      return;
    }

    const dataToSave = {
      ...formData,
      sort_order: formData.sort_order !== '' && formData.sort_order !== null && formData.sort_order !== undefined ? parseInt(formData.sort_order, 10) : 1
    };

    try {
      const isUuid = isEditingId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(isEditingId);
      if (isEditingId && isUuid) {
        const { error: saveErr } = await supabase
          .from('combo_poojas')
          .update(dataToSave)
          .eq('id', isEditingId);

        if (saveErr) throw saveErr;
        showMessage('Combo Puja updated successfully!');
      } else {
        const { id, ...insertData } = dataToSave;
        const { error: saveErr } = await supabase
          .from('combo_poojas')
          .insert([insertData]);

        if (saveErr) throw saveErr;
        showMessage('New Combo Puja added successfully!');
      }

      setFormData(initialFormState);
      setIsEditingId(null);
      fetchCombos();
    } catch (err) {
      console.error('Save error:', err);
      showMessage(err.message, true);
    }
  };

  const handleEdit = (combo) => {
    setFormData({
      ...initialFormState,
      ...combo,
      sort_order: combo.sort_order !== null && combo.sort_order !== undefined ? combo.sort_order : ''
    });
    setIsEditingId(combo.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this Combo?')) return;
    try {
      const isUuid = id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      if (isUuid) {
        const { error: delErr } = await supabase.from('combo_poojas').delete().eq('id', id);
        if (delErr) throw delErr;
      }
      showMessage('Combo Puja deleted successfully!');
      fetchCombos();
    } catch (err) {
      showMessage(err.message, true);
    }
  };

  const getMergedSimulatorData = () => {
    let items = [...combos];
    let isEditingFound = false;

    if (isEditingId) {
      items = items.map(c => {
        if (c.id === isEditingId) {
          isEditingFound = true;
          return { ...c, ...formData };
        }
        return c;
      });
    }

    if (!isEditingFound && (formData.title || formData.provider || formData.left_image_url || formData.right_image_url)) {
      items.unshift({ id: 'temp-preview-id', ...formData });
    }

    if (items.length === 0) {
      return MOCK_COMBOS;
    }

    return items;
  };

  const activeComboPreview = getMergedSimulatorData().find(c => c.id === isEditingId || c.id === 'temp-preview-id') || getMergedSimulatorData()[0] || MOCK_COMBOS[0];

  return (
    <div className="page-container" style={{ color: '#f8fafc', padding: '24px' }}>
      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0.8;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .detail-slide-anim {
          animation: slideUp 0.45s cubic-bezier(0.1, 0.76, 0.55, 0.94) forwards;
        }
      `}</style>

      {/* Header */}
      <div className="page-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '28px', fontWeight: '800', margin: 0 }}>Most Booked Combos Manager</h1>
          <p className="page-subtitle" style={{ fontSize: '14px', color: '#94a3b8', marginTop: '4px' }}>Dynamize Homepage Combos, Sync Cloudflare images and Preview live</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => saveCombo()} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#ea580c', color: 'white', padding: '10px 20px', borderRadius: '10px', fontWeight: 'bold' }}>
            <Save size={18} /> Save Combo
          </button>
        </div>
      </div>

      {error && <div className="alert error" style={{ display: 'flex', gap: '8px', padding: '12px', backgroundColor: 'rgba(239,68,68,0.15)', border: '1px solid #ef4444', borderRadius: '8px', marginBottom: '16px', color: '#f87171' }}><AlertTriangle size={18} /><span>{error}</span></div>}
      {successMsg && <div className="alert success" style={{ display: 'flex', gap: '8px', padding: '12px', backgroundColor: 'rgba(16,185,129,0.15)', border: '1px solid #10b981', borderRadius: '8px', marginBottom: '16px', color: '#34d399' }}><Check size={18} /><span>{successMsg}</span></div>}

      <div className="manager-split-layout" style={{ display: 'flex', gap: '24px', flexDirection: 'row', alignItems: 'flex-start' }}>
        
        {/* Left Side: Form Editor */}
        <div className="manager-form-section" style={{ flex: 1.2 }}>
          <div className="glass-card" style={{ padding: '24px', backgroundColor: '#161622', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 className="card-title" style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>
                {isEditingId ? 'Edit Combo Details' : 'Create New Combo'}
              </h2>
              {isEditingId && (
                <button 
                  onClick={() => { setFormData(initialFormState); setIsEditingId(null); }} 
                  style={{ color: '#f87171', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <X size={14} /> Cancel Edit
                </button>
              )}
            </div>

            {/* Form tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '24px', gap: '8px' }}>
              <button type="button" onClick={() => setFormTab('basic')} style={{ padding: '10px 16px', borderBottom: formTab === 'basic' ? '3px solid #ea580c' : '3px solid transparent', color: formTab === 'basic' ? '#ffffff' : '#94a3b8', fontWeight: '700', fontSize: '14px' }}>1. Basic Info</button>
              <button type="button" onClick={() => setFormTab('detail')} style={{ padding: '10px 16px', borderBottom: formTab === 'detail' ? '3px solid #ea580c' : '3px solid transparent', color: formTab === 'detail' ? '#ffffff' : '#94a3b8', fontWeight: '700', fontSize: '14px' }}>2. Combo Details</button>
              <button type="button" onClick={() => setFormTab('packages')} style={{ padding: '10px 16px', borderBottom: formTab === 'packages' ? '3px solid #ea580c' : '3px solid transparent', color: formTab === 'packages' ? '#ffffff' : '#94a3b8', fontWeight: '700', fontSize: '14px' }}>3. Package Options</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {formTab === 'basic' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div className="form-group">
                      <label>Combo Title *</label>
                      <input type="text" name="title" value={formData.title} onChange={handleInputChange} className="input-field" placeholder="e.g. Rudrabhishek + Kashi Vishwanath" />
                    </div>
                    <div className="form-group">
                      <label>Sacred Provider *</label>
                      <input type="text" name="provider" value={formData.provider} onChange={handleInputChange} className="input-field" placeholder="e.g. Kashi Vishwanath Trust" />
                    </div>
                    <div className="form-group">
                      <label>Original Price (Strikeout, e.g. ₹1,100)</label>
                      <input type="text" name="original_price" value={formData.original_price} onChange={handleInputChange} className="input-field" />
                    </div>
                    <div className="form-group">
                      <label>Offer Price (Single Offer, e.g. ₹501)</label>
                      <input type="text" name="price" value={formData.price} onChange={handleInputChange} className="input-field" />
                    </div>
                    <div className="form-group">
                      <label>Devotees Count Text</label>
                      <input type="text" name="devotees_count" value={formData.devotees_count} onChange={handleInputChange} className="input-field" placeholder="e.g. Ordered by 1.2k+ families today" />
                    </div>
                    <div className="form-group">
                      <label>Tag (e.g. Maha Combo, Protection)</label>
                      <input type="text" name="tag" value={formData.tag} onChange={handleInputChange} className="input-field" />
                    </div>
                    <div className="form-group">
                      <label>Rating (e.g. 4.9)</label>
                      <input type="text" name="rating" value={formData.rating} onChange={handleInputChange} className="input-field" />
                    </div>
                    <div className="form-group">
                      <label>Reviews Count</label>
                      <input type="text" name="reviews" value={formData.reviews} onChange={handleInputChange} className="input-field" />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    {/* Left Image */}
                    <div className="form-group" style={{ border: '1px dashed rgba(255,255,255,0.1)', padding: '12px', borderRadius: '10px' }}>
                      <label style={{ display: 'block', marginBottom: '8px' }}>Left Side Cover Image *</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button type="button" onClick={() => leftImageInputRef.current.click()} style={{ padding: '8px 12px', background: '#334155', color: '#fff', borderRadius: '6px', fontSize: '13px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                          {uploadingLeftImage ? <Loader2 size={14} className="spinner animate-spin" /> : <Upload size={14} />}
                          Upload Left
                        </button>
                        <input type="file" ref={leftImageInputRef} accept="image/*" onChange={(e) => handleImageUpload(e, 'left')} style={{ display: 'none' }} />
                        {formData.left_image_url && <span style={{ fontSize: '11px', color: '#10b981' }}>✓ Uploaded</span>}
                      </div>
                    </div>
                    
                    {/* Right Image */}
                    <div className="form-group" style={{ border: '1px dashed rgba(255,255,255,0.1)', padding: '12px', borderRadius: '10px' }}>
                      <label style={{ display: 'block', marginBottom: '8px' }}>Right Side Cover Image *</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button type="button" onClick={() => rightImageInputRef.current.click()} style={{ padding: '8px 12px', background: '#334155', color: '#fff', borderRadius: '6px', fontSize: '13px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                          {uploadingRightImage ? <Loader2 size={14} className="spinner animate-spin" /> : <Upload size={14} />}
                          Upload Right
                        </button>
                        <input type="file" ref={rightImageInputRef} accept="image/*" onChange={(e) => handleImageUpload(e, 'right')} style={{ display: 'none' }} />
                        {formData.right_image_url && <span style={{ fontSize: '11px', color: '#10b981' }}>✓ Uploaded</span>}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div className="form-group">
                      <label>Homepage Slide Position (numbering 1, 2, 3, etc.)</label>
                      <input type="number" name="sort_order" value={formData.sort_order} onChange={handleInputChange} className="input-field" placeholder="1 = First Slide, 2 = Second, etc." />
                    </div>
                    <div className="form-group checkbox-group" style={{ display: 'flex', alignItems: 'center', height: '100%', paddingTop: '28px' }}>
                      <label style={{ display: 'flex', gap: '8px', alignItems: 'center', cursor: 'pointer', color: '#d1d5db', fontSize: '14px' }}>
                        <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleInputChange} style={{ width: '16px', height: '16px', accentColor: '#ea580c' }} />
                        Show Active on Homepage
                      </label>
                    </div>
                  </div>
                </>
              )}

              {formTab === 'detail' && (
                <>
                  <div className="form-group">
                    <label>Combo Tagline (short line below title)</label>
                    <input type="text" name="tagline" value={formData.tagline} onChange={handleInputChange} className="input-field" placeholder="Achieve supreme protection & blessings..." />
                  </div>
                  <div className="form-group">
                    <label>Combined Benefits (Separate lines with • bullet point)</label>
                    <textarea name="benefits" value={formData.benefits} onChange={handleInputChange} className="input-field" rows="4" placeholder="• Protects your household&#10;• Purifies environment" />
                  </div>
                  <div className="form-group">
                    <label>Combo Ritual Steps</label>
                    <textarea name="steps" value={formData.steps} onChange={handleInputChange} className="input-field" rows="3" placeholder="• Sankalp text chanting in Kashi&#10;• Rudrabhishek on holy lingam" />
                  </div>
                  <div className="form-group">
                    <label>Ritual Samagri</label>
                    <textarea name="samagri" value={formData.samagri} onChange={handleInputChange} className="input-field" rows="2" placeholder="Honey, milk, gangajal, bilva leaves" />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div className="form-group">
                      <label>Consecrated Temple Altar</label>
                      <input type="text" name="temple" value={formData.temple} onChange={handleInputChange} className="input-field" placeholder="Kashi Vishwanath, Varanasi" />
                    </div>
                    <div className="form-group">
                      <label>Assigned Pandit (Vedic Scholar)</label>
                      <input type="text" name="pandit" value={formData.pandit} onChange={handleInputChange} className="input-field" placeholder="Acharya Raman Shastri" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Prasad Transit Box Details</label>
                    <textarea name="prasad" value={formData.prasad} onChange={handleInputChange} className="input-field" rows="2" placeholder="Lal peda boxes, gangajal bottle, sacred black thread" />
                  </div>
                  <div className="form-group">
                    <label>WhatsApp / Video Proof Details</label>
                    <input type="text" name="other_info" value={formData.other_info} onChange={handleInputChange} className="input-field" placeholder="Short clip of Sankalp sent within 24 hours" />
                  </div>
                </>
              )}

              {formTab === 'packages' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Single Package configs */}
                  <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '16px', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#ea580c', margin: '0 0 12px 0' }}>1. Single Sankalp Package Details</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div className="form-group">
                        <label>Single Option Title</label>
                        <input type="text" name="single_title" value={formData.single_title} onChange={handleInputChange} className="input-field" />
                      </div>
                      <div className="form-group">
                        <label>Single Option Description</label>
                        <textarea name="single_description" value={formData.single_description} onChange={handleInputChange} className="input-field" rows="2" />
                      </div>
                    </div>
                  </div>

                  {/* Family Package configs */}
                  <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '16px', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#ea580c', margin: '0 0 12px 0' }}>2. Family Pariwar Package Details</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div className="form-group">
                        <label>Family Option Title</label>
                        <input type="text" name="family_title" value={formData.family_title} onChange={handleInputChange} className="input-field" />
                      </div>
                      <div className="form-group">
                        <label>Family Option Description</label>
                        <textarea name="family_description" value={formData.family_description} onChange={handleInputChange} className="input-field" rows="2" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Live Simulator Previews */}
        <div className="manager-preview-section" style={{ flex: 0.8, position: 'sticky', top: '24px' }}>
          <div className="glass-card" style={{ padding: '24px', backgroundColor: '#161622', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0 }}>Live Simulator Preview</h2>
              {/* Preview Tab selectors */}
              <div style={{ display: 'flex', gap: '4px', backgroundColor: '#27272a', padding: '4px', borderRadius: '8px' }}>
                <button 
                  onClick={() => setPreviewMode('card')} 
                  style={{
                    padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold',
                    background: previewMode === 'card' ? '#ea580c' : 'transparent',
                    color: '#ffffff', border: 'none', cursor: 'pointer'
                  }}
                >Homepage Card</button>
                <button 
                  onClick={() => setPreviewMode('detail')} 
                  style={{
                    padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold',
                    background: previewMode === 'detail' ? '#ea580c' : 'transparent',
                    color: '#ffffff', border: 'none', cursor: 'pointer'
                  }}
                >Detail Page</button>
              </div>
            </div>

            {/* Mobile Viewport Wrapper */}
            <div style={{ display: 'flex', justifyContent: 'center', backgroundColor: '#09090b', padding: '16px', borderRadius: '24px', border: '6px solid #27272a' }}>
              {previewMode === 'card' ? (
                <div style={{ width: '280px', padding: '10px' }}>
                  <ComboCardPreview data={activeComboPreview} />
                </div>
              ) : (
                <div style={{ width: '290px' }}>
                  <ComboDetailPreview 
                    data={activeComboPreview} 
                    selectedPackage={previewPackage} 
                    setSelectedPackage={setPreviewPackage} 
                  />
                </div>
              )}
            </div>

            <div style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center' }}>
              * Make changes in left panel fields to see updates in the mobile app simulator in real-time.
            </div>
          </div>
        </div>
      </div>

      {/* Grid List of current dynamic combos */}
      <div className="glass-card" style={{ marginTop: '24px', padding: '24px', backgroundColor: '#161622', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '16px' }}>Existing Combos ({combos.length})</h2>
        
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <Loader2 className="spinner animate-spin" size={32} />
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            {combos.map(item => (
              <div 
                key={item.id} 
                style={{
                  border: isEditingId === item.id ? '2px solid #ea580c' : '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column',
                  backgroundColor: isEditingId === item.id ? 'rgba(234,88,12,0.05)' : 'rgba(255,255,255,0.01)',
                  position: 'relative'
                }}
              >
                {/* Floating Sort Badge */}
                <div style={{ position: 'absolute', top: '12px', right: '12px', backgroundColor: '#ea580c', color: '#fff', fontSize: '11px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '20px' }}>
                  Slide: {item.sort_order}
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  {/* Miniature previews */}
                  <div style={{ display: 'flex', width: '60px', height: '40px', borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <img src={item.left_image_url || DEFAULT_IMAGE_LEFT} style={{ width: '50%', height: '100%', objectFit: 'cover' }} />
                    <img src={item.right_image_url || DEFAULT_IMAGE_RIGHT} style={{ width: '50%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#ffffff' }}>{item.title}</h4>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>Price: {item.price} • {item.provider}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '16px', alignSelf: 'flex-end' }}>
                  <button onClick={() => handleEdit(item)} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#334155', color: '#fff', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>
                    <Edit3 size={14} /> Edit
                  </button>
                  <button onClick={() => handleDelete(item.id)} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#ef4444', color: '#fff', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', border: 'none', cursor: 'pointer' }}>
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            ))}

            {combos.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                No custom combo pujas found in Supabase. Seed default values or add a new one above.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
