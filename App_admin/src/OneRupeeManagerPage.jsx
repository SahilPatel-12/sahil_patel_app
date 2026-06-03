import { useState, useEffect, useRef } from 'react';
import { Edit3, Trash2, Check, AlertTriangle, Upload, Loader2, Save, Send, Plus, X, ArrowLeft, ShoppingCart, Search, Share2, Star, ChevronDown, ChevronUp, Bell } from 'lucide-react';
import { supabase } from './lib/supabase';
import { uploadToR2, deleteFromR2 } from './lib/r2';

// --- Default Images --- //
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1609137144814-6c3614275f7e?auto=format&fit=crop&w=600&q=80';
const DEFAULT_COMBO_IMAGE = 'https://images.unsplash.com/photo-1545128485-c400e7702796?auto=format&fit=crop&w=600&q=80';

const MOCK_POOJAS = [
  {
    id: 'mock-1',
    title: 'Ganesh Puja Special',
    original_price: '₹501',
    offer_price: '₹1',
    rating: '4.8',
    reviews: '120',
    provider: 'Siddhi Vinayak Temple',
    image_url: 'https://images.unsplash.com/photo-1567591974574-e852636b14a3?auto=format&fit=crop&w=300&q=80',
    tag: 'Special',
    tagline: 'Removes all obstacles and brings success to your work and life.',
    benefits: '• Removes all obstacles from career & business\n• Brings wisdom, fortune & intellectual growth\n• Invites auspicious new beginnings',
    steps: '1. Holy Ganesha Sankalp\n2. Modak & Durva Grass Offering\n3. Sacred Ganapati Atharvashirsha Recitation',
    samagri: 'Sacred Durva grass, Fresh yellow marigold flowers, Pure Ladoo offerings, Chandan paste',
    pandit: 'Acharya Vinayak Shastri - Siddhi Vinayak Temple Senior Pandit',
    temple: 'Prabhadevi Siddhi Vinayak Mandir, Mumbai',
    prasad: 'Pure Besan Modak Prasad directly from temple shrine, Holy thread, Ganesha photo',
    other_info: 'Video proof of your personalized sankalp will be shared on WhatsApp within 24 hours.'
  },
  {
    id: 'mock-2',
    title: 'Tirupati Balaji Kalyan',
    original_price: '₹1200',
    offer_price: '₹1',
    rating: '4.9',
    reviews: '312',
    provider: 'Tirumala Devasthanam',
    image_url: 'https://images.unsplash.com/photo-1545128485-c400e7702796?auto=format&fit=crop&w=300&q=80',
    tag: 'Blessings',
    tagline: 'Bestows divine protection, health, and extreme wealth blessings.',
    benefits: '• Bestows divine protection and spiritual peace\n• Grants wish fulfillment & health blessings\n• Removes negatives & family discords',
    steps: '1. Venkateswara Archana\n2. Sacred Kalyanotsavam Hymns\n3. Pushpa Yagam Flower offering',
    samagri: 'Sacred tulsi leaves, Pure sandalwood paste, Camphor, Coconut & banana offerings',
    pandit: 'Swami Venkatesh Acharya - Senior Tirumala Devotee priest',
    temple: 'Sacred Shrine of Tirumala Hills, Andhra Pradesh',
    prasad: 'Authentic Tirupati Laddu Prasad, Consecrated Tulsi leaves, Holy yellow thread',
    other_info: 'Original laddu prasad shipped in vacuum-sealed transit box to preserve freshness.'
  },
  {
    id: 'mock-3',
    title: 'Maha Mrityunjay Puja',
    original_price: '₹1100',
    offer_price: '₹1',
    rating: '4.9',
    reviews: '340',
    provider: 'Kashi Vishwanath Temple',
    image_url: 'https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?auto=format&fit=crop&w=300&q=80',
    tag: 'Health',
    tagline: 'Bestows perfect health, protects against sudden illness & evil eye.',
    benefits: '• Bestows perfect health and extreme longevity\n• Protects against sudden illnesses & evil eye\n• Establishes mental peace & divine security',
    steps: '1. Shiv-Panchakshari Japa\n2. Rudrabhishek with Ganga jal, Honey & Milk\n3. Maha Mrityunjaya Havan',
    samagri: 'Bilva leaves, Sacred ashes (Bhasma), Honey, Milk, Ganga water, Kusha grass',
    pandit: 'Pandit Somnath Vyas - Kashi Vishwanath Distinguished Priest',
    temple: 'Sacred Kashi Vishwanath Dham, Varanasi',
    prasad: 'Holy Gangajal bottle, Consecrated Rudraksha Bead, Bhasma packet, Shiva locket',
    other_info: 'Rudraksha is energized during live Shiv-sankalp and certified from the temple.'
  },
  {
    id: 'mock-4',
    title: 'Kedarnath Shravan Puja',
    original_price: '₹999',
    offer_price: '₹1',
    rating: '4.8',
    reviews: '210',
    provider: 'Kedarnath Dham',
    image_url: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=300&q=80',
    tag: 'General',
    tagline: 'Cleanses past karmas and connects your soul directly with Lord Shiva.',
    benefits: '• Cleanses past karmic blockages & sins\n• Bestows absolute inner calm & clarity\n• Connects soul directly with Lord Shiva',
    steps: '1. Kedarnath Dhyan Sankalp\n2. Abhishek with Himalayan herbs\n3. Aarti at the sacred Jyotirlinga',
    samagri: 'Himalayan wild herbs, Bilva patra, Ganga jal, Pure camphor, Kasturi chandan',
    pandit: 'Rawal Bhimsen - Head Priest of Sri Kedarnath temple lineage',
    temple: 'Sri Kedarnath Temple, Uttarakhand Himalayas',
    prasad: 'Sacred Himalayan water, Consecrated dry apple prasad, Holy chandan wood',
    other_info: 'Performed during Sri Shravan Somvar with traditional Vedic chants.'
  },
  {
    id: 'mock-5',
    title: 'Mahakal Shiv Puja',
    original_price: '₹850',
    offer_price: '₹1',
    rating: '4.9',
    reviews: '420',
    provider: 'Mahakaleshwar Ujjain',
    image_url: 'https://images.unsplash.com/photo-1590076215667-873d96c8ab13?auto=format&fit=crop&w=300&q=80',
    tag: 'General',
    tagline: 'Overcomes all fear, destroys negative forces, brings business victory.',
    benefits: '• Overcomes all fear of death & temporal blocks\n• Destroys negative energies & curses\n• Brings absolute professional & business victory',
    steps: '1. Bhasma Aarti Sankalp\n2. Rudra Chamakam Recitation\n3. Mahakal Havan with sacred wood',
    samagri: 'Sacred Bhasma ash from cremation ground, Bilvapatra, Honey, Milk, Ganga water',
    pandit: 'Acharya Radhe Shyam Vyas - Mahakaleshwar Jyotirlinga Priest',
    temple: 'Shree Mahakaleshwar Temple, Ujjain',
    prasad: 'Mahakal Temple Dry Fruit Ladoo, Bhasma packet, Shiva protection thread',
    other_info: 'Sankalp is taken under the direct lineage of Ujjain Mahakal priests.'
  }
];

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
const CardPreview = ({ data }) => {
  const displayImage = data.image_url || DEFAULT_IMAGE;
  return (
    <div style={{
      width: '110px',
      flexShrink: 0,
      fontFamily: '"Outfit", -apple-system, sans-serif',
      textAlign: 'left'
    }}>
      {/* Image with saffron soft border & rounded corners */}
      <div style={{ 
        position: 'relative', width: '110px', height: '110px', borderRadius: '16px', overflow: 'hidden', 
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
        
        {/* Price Row: strike original, yellow badge for ₹1 with pop shadow */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px' }}>
          <span style={{ fontSize: '10.5px', color: '#94a3b8', textDecoration: 'line-through', fontWeight: '500' }}>
            {data.original_price || '₹751'}
          </span>
          <div style={{ 
            backgroundColor: '#ffd60a', padding: '1px 5px', borderRadius: '2px', border: '1px solid #000',
            boxShadow: '1px 1px 0px #000000'
          }}>
            <span style={{ fontSize: '10.5px', fontWeight: '800', color: '#000' }}>
              {data.offer_price || '₹1'}
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
            ★ {data.rating || '4.9'} ({data.reviews || '280'})
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
  const displaySinglePrice = data.single_price || '₹1';
  const displaySingleOriginalPrice = data.single_original_price || '₹751';

  const familyTitleText = data.family_title || 'Family Pariwar';
  const familyDescText = data.family_description || 'Full household (4 names) Sankalps + Consecrated copper yantra shield.';
  const displayFamilyPrice = data.family_price || '₹2';
  const displayFamilyOriginalPrice = data.family_original_price || '₹1502';

  const singlePriceVal = parseInt(displaySinglePrice.replace(/[^0-9]/g, '')) || 1;
  const singleOriginalPriceVal = parseInt(displaySingleOriginalPrice.replace(/[^0-9]/g, '')) || 751;
  const familyPriceVal = parseInt(displayFamilyPrice.replace(/[^0-9]/g, '')) || 2;
  const familyOriginalPriceVal = parseInt(displayFamilyOriginalPrice.replace(/[^0-9]/g, '')) || 1502;

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
        padding: '24px 20px 24px 20px', position: 'relative', zIndex: 5,
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
            {data.reviews || '280'} blessed devotees joined
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
                 <span style={{ fontSize: '9.5px', fontWeight: '800', color: '#000' }}>SAVED 99%</span>
              </div>
            </div>
          </div>
          {/* Saffron Theme Quantity Pill */}
          <div style={{ backgroundColor: '#ea580c', borderRadius: '12px', padding: '4px', display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '16px' }}>
            <button 
              type="button"
              onClick={() => comboQuantity > 1 && setComboQuantity(comboQuantity - 1)}
              style={{ width: '28px', height: '28px', backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}
            >
              -
            </button>
            <span style={{ fontSize: '14px', fontWeight: '700', color: 'white', minWidth: '16px', textAlign: 'center' }}>
              {comboQuantity}
            </span>
            <button 
              type="button"
              onClick={() => setComboQuantity(comboQuantity + 1)}
              style={{ width: '28px', height: '28px', backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}
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

        {/* 1. Divine Combined Benefits Accordion */}
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

        {/* 2. Combo Ritual steps & Materials Accordion */}
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
              <h5 style={{ margin: '0 0 4px 0', fontSize: '11px', fontWeight: 'bold', color: '#ea580c', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Auspicious Samagri (Ritual materials):</h5>
              <div style={{ fontSize: '12px', color: '#475569', lineHeight: '18px', whiteSpace: 'pre-wrap', fontWeight: '500' }}>
                {data.samagri || 'Pure sandalwood, incense, flowers, and holy thread.'}
              </div>
            </div>
          )}
        </div>

        {/* 3. Vedic Pandit & Sacred Shrine Accordion */}
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

        {/* 4. Prasad Shipping & Video Proof Accordion */}
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

// --- Main Component --- //
const OneRupeeManagerPage = () => {
  const [poojas, setPoojas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  
  const [previewMode, setPreviewMode] = useState('detail'); // 'home', 'store', 'detail'
  const [formTab, setFormTab] = useState('basic'); // 'basic', 'detail', 'packages', 'combo', 'faqs'

  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingComboImage, setUploadingComboImage] = useState(false);
  const [isEditingId, setIsEditingId] = useState(null);

  // Package Simulator State inside simulator viewport
  const [simSelectedPackage, setSimSelectedPackage] = useState('single');
  const [simComboQuantity, setSimComboQuantity] = useState(1);

  // File Upload refs to prevent absolute click overlap bug
  const mainImageInputRef = useRef(null);
  const comboImageInputRef = useRef(null);

  const initialFormState = {
    title: '',
    original_price: '₹501',
    offer_price: '₹1',
    rating: '4.9',
    reviews: '120',
    provider: '',
    image_url: '',
    tag: 'Prasad',
    requirement: 'Book Puja to claim',
    category: 'General',
    is_active_on_home: true,
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
    translations: {},
    combo_offer: {
      title: '',
      description: '',
      original_price: '',
      offer_price: '',
      image_url: ''
    },
    faqs: [],
    sort_order_home: '',
    sort_order_puja: '',
    sort_order_store: '',
    // Custom Package Fields
    single_title: 'Single Sankalp',
    single_description: 'Individual name & gotra Sankalp + Holy Prasad transit box.',
    single_price: '₹1',
    single_original_price: '₹751',
    family_title: 'Family Pariwar',
    family_description: 'Full household (4 names) Sankalps + Consecrated copper yantra shield.',
    family_price: '₹2',
    family_original_price: '₹1502'
  };

  const [formData, setFormData] = useState(initialFormState);

  const fetchPoojas = async () => {
    setLoading(true);
    try {
      const { data, error: fetchErr } = await supabase
        .from('one_rupee_poojas')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchErr) throw fetchErr;
      setPoojas(data || []);
    } catch (err) {
      console.error('Error fetching poojas:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPoojas();
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

  const handleComboChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      combo_offer: {
        ...prev.combo_offer,
        [name]: value
      }
    }));
  };

  const handleFaqChange = (index, field, value) => {
    const newFaqs = [...formData.faqs];
    newFaqs[index] = { ...newFaqs[index], [field]: value };
    setFormData(prev => ({ ...prev, faqs: newFaqs }));
  };

  const addFaq = () => {
    setFormData(prev => ({ ...prev, faqs: [...prev.faqs, { q: '', a: '' }] }));
  };

  const removeFaq = (index) => {
    const newFaqs = [...formData.faqs];
    newFaqs.splice(index, 1);
    setFormData(prev => ({ ...prev, faqs: newFaqs }));
  };

  const handleImageUpload = async (e, type = 'main') => {
    const file = e.target.files[0];
    if (!file) return;

    if (type === 'main') setUploadingImage(true);
    else setUploadingComboImage(true);

    try {
      const publicUrl = await uploadToR2(file, 'one-rupee-poojas');
      if (type === 'main') {
        setFormData(prev => ({ ...prev, image_url: publicUrl }));
      } else {
        setFormData(prev => ({
          ...prev,
          combo_offer: { ...prev.combo_offer, image_url: publicUrl }
        }));
      }
      showMessage('Image uploaded successfully!');
    } catch (err) {
      console.error('Upload error:', err);
      showMessage(err.message || 'Failed to upload image.', true);
    } finally {
      if (type === 'main') setUploadingImage(false);
      else setUploadingComboImage(false);
    }
  };

  const savePooja = async (statusOverride) => {
    if (!formData.title || !formData.provider) {
      showMessage('Title and Provider are required.', true);
      return;
    }

    const finalStatus = statusOverride || formData.status;
    const dataToSave = { 
      ...formData, 
      status: finalStatus,
      sort_order_home: formData.sort_order_home !== '' && formData.sort_order_home !== null && formData.sort_order_home !== undefined ? parseInt(formData.sort_order_home, 10) : null,
      sort_order_puja: formData.sort_order_puja !== '' && formData.sort_order_puja !== null && formData.sort_order_puja !== undefined ? parseInt(formData.sort_order_puja, 10) : null,
      sort_order_store: formData.sort_order_store !== '' && formData.sort_order_store !== null && formData.sort_order_store !== undefined ? parseInt(formData.sort_order_store, 10) : null
    };
    
    try {
      const isUuid = isEditingId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(isEditingId);
      if (isEditingId && isUuid) {
        const { error: saveErr } = await supabase
          .from('one_rupee_poojas')
          .update(dataToSave)
          .eq('id', isEditingId);
        
        if (saveErr) throw saveErr;
        showMessage(`Pooja updated as ${finalStatus}!`);
      } else {
        const { id, ...insertData } = dataToSave;
        const { error: saveErr } = await supabase
          .from('one_rupee_poojas')
          .insert([insertData]);
        
        if (saveErr) throw saveErr;
        showMessage(`New Pooja added as ${finalStatus}!`);
      }
      
      setFormData(initialFormState);
      setIsEditingId(null);
      fetchPoojas();
    } catch (err) {
      console.error('Save error:', err);
      showMessage(err.message, true);
    }
  };

  const handleEdit = (pooja) => {
    setFormData({
      ...initialFormState,
      ...pooja,
      translations: pooja.translations || {},
      combo_offer: pooja.combo_offer || { title: '', description: '', original_price: '', offer_price: '', image_url: '' },
      faqs: pooja.faqs || [],
      // Packages columns fallback
      single_title: pooja.single_title || 'Single Sankalp',
      single_description: pooja.single_description || 'Individual name & gotra Sankalp + Holy Prasad transit box.',
      single_price: pooja.single_price || '₹1',
      single_original_price: pooja.single_original_price || '₹751',
      family_title: pooja.family_title || 'Family Pariwar',
      family_description: pooja.family_description || 'Full household (4 names) Sankalps + Consecrated copper yantra shield.',
      family_price: pooja.family_price || '₹2',
      family_original_price: pooja.family_original_price || '₹1502',
      sort_order_home: pooja.sort_order_home !== null && pooja.sort_order_home !== undefined ? pooja.sort_order_home : '',
      sort_order_puja: pooja.sort_order_puja !== null && pooja.sort_order_puja !== undefined ? pooja.sort_order_puja : '',
      sort_order_store: pooja.sort_order_store !== null && pooja.sort_order_store !== undefined ? pooja.sort_order_store : ''
    });
    setIsEditingId(pooja.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getMergedSimulatorData = (targetView) => {
    let items = [...poojas];
    
    let isEditingFound = false;
    if (isEditingId) {
      items = items.map(p => {
        if (p.id === isEditingId) {
          isEditingFound = true;
          return { ...p, ...formData };
        }
        return p;
      });
    }
    
    if (!isEditingFound && formData.title) {
      items.unshift({ id: 'temp-preview-id', ...formData });
    }

    if (targetView === 'home') {
      items = items.filter(p => p.is_active_on_home && p.status === 'published');
      items.sort((a, b) => {
        const orderA = a.sort_order_home !== undefined && a.sort_order_home !== null && a.sort_order_home !== '' ? Number(a.sort_order_home) : Infinity;
        const orderB = b.sort_order_home !== undefined && b.sort_order_home !== null && b.sort_order_home !== '' ? Number(b.sort_order_home) : Infinity;
        if (orderA !== orderB) return orderA - orderB;
        return new Date(b.created_at || Date.now()) - new Date(a.created_at || Date.now());
      });
    } else if (targetView === 'puja') {
      items = items.filter(p => p.is_active && p.status === 'published');
      items.sort((a, b) => {
        const orderA = a.sort_order_puja !== undefined && a.sort_order_puja !== null && a.sort_order_puja !== '' ? Number(a.sort_order_puja) : Infinity;
        const orderB = b.sort_order_puja !== undefined && b.sort_order_puja !== null && b.sort_order_puja !== '' ? Number(b.sort_order_puja) : Infinity;
        if (orderA !== orderB) return orderA - orderB;
        return new Date(b.created_at || Date.now()) - new Date(a.created_at || Date.now());
      });
    } else if (targetView === 'store') {
      items = items.filter(p => p.is_active && p.status === 'published');
      items.sort((a, b) => {
        const orderA = a.sort_order_store !== undefined && a.sort_order_store !== null && a.sort_order_store !== '' ? Number(a.sort_order_store) : Infinity;
        const orderB = b.sort_order_store !== undefined && b.sort_order_store !== null && b.sort_order_store !== '' ? Number(b.sort_order_store) : Infinity;
        if (orderA !== orderB) return orderA - orderB;
        return new Date(b.created_at || Date.now()) - new Date(a.created_at || Date.now());
      });
    }

    if (items.length < 6) {
      const needed = 6 - items.length;
      for (let i = 0; i < needed; i++) {
        const mockPooja = MOCK_POOJAS[i % MOCK_POOJAS.length];
        items.push({
          ...mockPooja,
          id: `mock-pad-${i}`,
          is_placeholder: true
        });
      }
    }

    return items;
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this Pooja?')) return;
    try {
      const isUuid = id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      if (isUuid) {
        // Find the puja item to delete its images before deleting the row
        const poojaToDelete = poojas.find(p => p.id === id);

        const { error: delErr } = await supabase.from('one_rupee_poojas').delete().eq('id', id);
        if (delErr) throw delErr;

        // Clean up Cloudflare R2 images if database delete succeeded
        if (poojaToDelete) {
          if (poojaToDelete.image_url) {
            await deleteFromR2(poojaToDelete.image_url);
          }
          if (poojaToDelete.combo_offer && poojaToDelete.combo_offer.image_url) {
            await deleteFromR2(poojaToDelete.combo_offer.image_url);
          }
        }
      }
      showMessage('Pooja deleted successfully from Supabase and Cloudflare R2!');
      fetchPoojas();
    } catch (err) {
      showMessage(err.message, true);
    }
  };

  return (
    <div className="page-container" style={{ color: '#f8fafc', padding: '24px' }}>
      {/* Dynamic Slide up CSS */}
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

      <div className="page-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '28px', fontWeight: '800', margin: 0 }}>₹1 Poojas Manager</h1>
          <p className="page-subtitle" style={{ fontSize: '14px', color: '#94a3b8', marginTop: '4px' }}>Sync Cloudflare images, Supabase data, and previews live</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => savePooja('draft')} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#334155', color: 'white', padding: '10px 20px', borderRadius: '10px', fontWeight: 'bold' }}>
            <Save size={18} /> Save Draft
          </button>
          <button onClick={() => savePooja('published')} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#ea580c', color: 'white', padding: '10px 20px', borderRadius: '10px', fontWeight: 'bold' }}>
            <Send size={18} /> Publish Now
          </button>
        </div>
      </div>

      {error && <div className="alert error" style={{ display: 'flex', gap: '8px', padding: '12px', backgroundColor: 'rgba(239,68,68,0.15)', border: '1px solid #ef4444', borderRadius: '8px', marginBottom: '16px', color: '#f87171' }}><AlertTriangle size={18} /><span>{error}</span></div>}
      {successMsg && <div className="alert success" style={{ display: 'flex', gap: '8px', padding: '12px', backgroundColor: 'rgba(16,185,129,0.15)', border: '1px solid #10b981', borderRadius: '8px', marginBottom: '16px', color: '#34d399' }}><Check size={18} /><span>{successMsg}</span></div>}

      <div className="manager-split-layout">
        {/* Left Side: Form Editor with Tabs */}
        <div className="manager-form-section" style={{ flex: 1 }}>
          <div className="glass-card" style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '24px', backgroundColor: '#161622', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
            
            {/* Header / Cancel Edit */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 className="card-title" style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>
                {isEditingId ? 'Edit Pooja Details' : 'Create New Pooja'}
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

            {/* Custom Tab Switcher inside the form */}
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '24px', gap: '8px', overflowX: 'auto' }}>
              <button 
                type="button"
                onClick={() => setFormTab('basic')}
                style={{ 
                  padding: '10px 16px', borderBottom: formTab === 'basic' ? '3px solid #ea580c' : '3px solid transparent', 
                  color: formTab === 'basic' ? '#ffffff' : '#94a3b8', fontWeight: '700', fontSize: '14px', whiteSpace: 'nowrap'
                }}
              >
                1. Basic Info
              </button>
              <button 
                type="button"
                onClick={() => setFormTab('detail')}
                style={{ 
                  padding: '10px 16px', borderBottom: formTab === 'detail' ? '3px solid #ea580c' : '3px solid transparent', 
                  color: formTab === 'detail' ? '#ffffff' : '#94a3b8', fontWeight: '700', fontSize: '14px', whiteSpace: 'nowrap'
                }}
              >
                2. Puja Details
              </button>
              <button 
                type="button"
                onClick={() => setFormTab('packages')}
                style={{ 
                  padding: '10px 16px', borderBottom: formTab === 'packages' ? '3px solid #ea580c' : '3px solid transparent', 
                  color: formTab === 'packages' ? '#ffffff' : '#94a3b8', fontWeight: '700', fontSize: '14px', whiteSpace: 'nowrap'
                }}
              >
                3. Packages
              </button>
              <button 
                type="button"
                onClick={() => setFormTab('combo')}
                style={{ 
                  padding: '10px 16px', borderBottom: formTab === 'combo' ? '3px solid #ea580c' : '3px solid transparent', 
                  color: formTab === 'combo' ? '#ffffff' : '#94a3b8', fontWeight: '700', fontSize: '14px', whiteSpace: 'nowrap'
                }}
              >
                4. Combo Offer
              </button>
              <button 
                type="button"
                onClick={() => setFormTab('faqs')}
                style={{ 
                  padding: '10px 16px', borderBottom: formTab === 'faqs' ? '3px solid #ea580c' : '3px solid transparent', 
                  color: formTab === 'faqs' ? '#ffffff' : '#94a3b8', fontWeight: '700', fontSize: '14px', whiteSpace: 'nowrap'
                }}
              >
                5. Divine FAQs
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '12px' }}>
              
              {/* Tab 1: Basic Info */}
              {formTab === 'basic' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div className="form-group">
                      <label>Title *</label>
                      <input type="text" name="title" value={formData.title} onChange={handleInputChange} className="input-field" placeholder="e.g. Ganesh Puja Special" />
                    </div>
                    <div className="form-group">
                      <label>Sacred Provider (Temple) *</label>
                      <input type="text" name="provider" value={formData.provider} onChange={handleInputChange} className="input-field" placeholder="e.g. Siddhi Vinayak Temple" />
                    </div>
                    <div className="form-group">
                      <label>Original Strike Price</label>
                      <input type="text" name="original_price" value={formData.original_price} onChange={handleInputChange} className="input-field" />
                    </div>
                    <div className="form-group">
                      <label>Special Offer Price</label>
                      <input type="text" name="offer_price" value={formData.offer_price} onChange={handleInputChange} className="input-field" />
                    </div>
                    <div className="form-group">
                      <label>Category (filter pill name)</label>
                      <input type="text" name="category" value={formData.category} onChange={handleInputChange} className="input-field" />
                    </div>
                    <div className="form-group">
                      <label>Tag (e.g. Special, Blessings)</label>
                      <input type="text" name="tag" value={formData.tag} onChange={handleInputChange} className="input-field" />
                    </div>
                    <div className="form-group">
                      <label>Rating (e.g. 4.9)</label>
                      <input type="text" name="rating" value={formData.rating} onChange={handleInputChange} className="input-field" />
                    </div>
                    <div className="form-group">
                      <label>Reviews Count (blessed devotees)</label>
                      <input type="text" name="reviews" value={formData.reviews} onChange={handleInputChange} className="input-field" />
                    </div>
                  </div>

                  {/* Main Image Upload Box - Programmatic triggering */}
                  <div className="form-group">
                    <label>Main Pooja Image *</label>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginTop: '4px' }}>
                      <button 
                        type="button" 
                        onClick={() => mainImageInputRef.current.click()}
                        style={{ padding: '10px 16px', borderRadius: '8px', background: '#334155', color: 'white', display: 'flex', gap: '8px', alignItems: 'center', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        {uploadingImage ? <Loader2 size={16} className="spinner animate-spin" /> : <Upload size={16} />}
                        Upload Image
                      </button>
                      <input 
                        type="file" 
                        ref={mainImageInputRef}
                        accept="image/*" 
                        onChange={(e) => handleImageUpload(e, 'main')} 
                        style={{ display: 'none' }} 
                      />
                      {formData.image_url ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Check size={16} color="#10b981" />
                          <span style={{ fontSize: '12px', color: '#10b981' }}>Main Image Ready!</span>
                        </div>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>Preview fallback loaded.</span>
                      )}
                    </div>
                  </div>

                  {/* Card Display Sorting Numbering */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginTop: '8px' }}>
                    <div className="form-group">
                      <label>Home Page Numbering</label>
                      <input 
                        type="number" 
                        name="sort_order_home" 
                        value={formData.sort_order_home} 
                        onChange={handleInputChange} 
                        className="input-field" 
                        placeholder="e.g. 1 (first), 2..." 
                      />
                    </div>
                    <div className="form-group">
                      <label>Puja Tab Numbering</label>
                      <input 
                        type="number" 
                        name="sort_order_puja" 
                        value={formData.sort_order_puja} 
                        onChange={handleInputChange} 
                        className="input-field" 
                        placeholder="e.g. 1 (first), 2..." 
                      />
                    </div>
                    <div className="form-group">
                      <label>Store Page Numbering</label>
                      <input 
                        type="number" 
                        name="sort_order_store" 
                        value={formData.sort_order_store} 
                        onChange={handleInputChange} 
                        className="input-field" 
                        placeholder="e.g. 1 (first), 2..." 
                      />
                    </div>
                  </div>

                  {/* Active Page status */}
                  <div className="form-group checkbox-group" style={{ display: 'flex', gap: '24px', marginTop: '12px' }}>
                    <label style={{ display: 'flex', gap: '8px', alignItems: 'center', cursor: 'pointer', color: '#d1d5db', fontSize: '14px' }}>
                      <input type="checkbox" name="is_active_on_home" checked={formData.is_active_on_home} onChange={handleInputChange} style={{ width: '16px', height: '16px', accentColor: '#ea580c' }} />
                      Show on Home Page
                    </label>
                    <label style={{ display: 'flex', gap: '8px', alignItems: 'center', cursor: 'pointer', color: '#d1d5db', fontSize: '14px' }}>
                      <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleInputChange} style={{ width: '16px', height: '16px', accentColor: '#ea580c' }} />
                      Show on Store / View All Page
                    </label>
                  </div>
                </div>
              )}

              {/* Tab 2: Puja Details */}
              {formTab === 'detail' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="form-group">
                    <label>Tagline (Short description below title)</label>
                    <input type="text" name="tagline" value={formData.tagline} onChange={handleInputChange} className="input-field" placeholder="Attracts financial growth and clears outstanding debts." />
                  </div>
                  <div className="form-group">
                    <label>Divine Combined Benefits (Separate lines with • bullet point)</label>
                    <textarea name="benefits" value={formData.benefits} onChange={handleInputChange} className="input-field" rows="4" placeholder="• Unlocks new wealth avenues&#10;• Cleanses negative financial blocks" />
                  </div>
                  <div className="form-group">
                    <label>Combo Ritual Steps (Process description)</label>
                    <textarea name="steps" value={formData.steps} onChange={handleInputChange} className="input-field" rows="3" placeholder="1. Personalized Ganesha Sankalp&#10;2. Holy Havan Offering" />
                  </div>
                  <div className="form-group">
                    <label>Auspicious Samagri (Ritual materials)</label>
                    <textarea name="samagri" value={formData.samagri} onChange={handleInputChange} className="input-field" rows="2" placeholder="Durva grass, marigold flowers, cow ghee, chandan" />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div className="form-group">
                      <label>Assigned Pandit (Vedic Acharya)</label>
                      <input type="text" name="pandit" value={formData.pandit} onChange={handleInputChange} className="input-field" placeholder="Acharya Vinayak Shastri" />
                    </div>
                    <div className="form-group">
                      <label>Consecrated Temple</label>
                      <input type="text" name="temple" value={formData.temple} onChange={handleInputChange} className="input-field" placeholder="Siddhi Vinayak Mandir, Mumbai" />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Prasad Shipping Details</label>
                    <textarea name="prasad" value={formData.prasad} onChange={handleInputChange} className="input-field" rows="2" placeholder="Vacuum-sealed box containing modak, sacred thread, and locket." />
                  </div>
                  <div className="form-group">
                    <label>Other Info / Disclaimer (Video Recording proof details)</label>
                    <input type="text" name="other_info" value={formData.other_info} onChange={handleInputChange} className="input-field" placeholder="Video clip of personalized sankalp sent within 24 hours." />
                  </div>
                </div>
              )}

              {/* Tab 3: Packages */}
              {formTab === 'packages' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  {/* Single Package configuration */}
                  <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#ea580c', marginBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>1. Single Package Configuration</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div className="form-group">
                        <label>Single Package Title</label>
                        <input type="text" name="single_title" value={formData.single_title} onChange={handleInputChange} className="input-field" placeholder="Single Sankalp" />
                      </div>
                      <div className="form-group">
                        <label>Single Package Description</label>
                        <textarea name="single_description" value={formData.single_description} onChange={handleInputChange} className="input-field" rows="2" placeholder="Individual name & gotra Sankalp + Holy Prasad transit box." />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="form-group">
                          <label>Single Offer Price</label>
                          <input type="text" name="single_price" value={formData.single_price} onChange={handleInputChange} className="input-field" placeholder="₹1" />
                        </div>
                        <div className="form-group">
                          <label>Single Original Strike Price</label>
                          <input type="text" name="single_original_price" value={formData.single_original_price} onChange={handleInputChange} className="input-field" placeholder="₹751" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Family Package configuration */}
                  <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <h4 style={{ fontSize: '15px', fontWeight: '800', color: '#ea580c', marginBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>2. Family Package Configuration</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div className="form-group">
                        <label>Family Package Title</label>
                        <input type="text" name="family_title" value={formData.family_title} onChange={handleInputChange} className="input-field" placeholder="Family Pariwar" />
                      </div>
                      <div className="form-group">
                        <label>Family Package Description</label>
                        <textarea name="family_description" value={formData.family_description} onChange={handleInputChange} className="input-field" rows="2" placeholder="Full household (4 names) Sankalps + Consecrated copper yantra shield." />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="form-group">
                          <label>Family Offer Price</label>
                          <input type="text" name="family_price" value={formData.family_price} onChange={handleInputChange} className="input-field" placeholder="₹2" />
                        </div>
                        <div className="form-group">
                          <label>Family Original Strike Price</label>
                          <input type="text" name="family_original_price" value={formData.family_original_price} onChange={handleInputChange} className="input-field" placeholder="₹1502" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Combo Offer */}
              {formTab === 'combo' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="form-group">
                    <label>Combo Title</label>
                    <input type="text" name="title" value={formData.combo_offer?.title || ''} onChange={handleComboChange} className="input-field" placeholder="e.g. Navratri Special Holy Combo" />
                  </div>
                  <div className="form-group">
                    <label>Combo Description</label>
                    <textarea name="description" value={formData.combo_offer?.description || ''} onChange={handleComboChange} className="input-field" rows="3" placeholder="Includes full family blessings with consecrated copper Shree Yantra." />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div className="form-group">
                      <label>Combo Original Price</label>
                      <input type="text" name="original_price" value={formData.combo_offer?.original_price || ''} onChange={handleComboChange} className="input-field" placeholder="e.g. ₹1501" />
                    </div>
                    <div className="form-group">
                      <label>Combo Offer Price</label>
                      <input type="text" name="offer_price" value={formData.combo_offer?.offer_price || ''} onChange={handleComboChange} className="input-field" placeholder="e.g. ₹501" />
                    </div>
                  </div>
                  
                  {/* Combo Image Upload - Programmatic triggering */}
                  <div className="form-group">
                    <label>Combo Image</label>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginTop: '4px' }}>
                      <button 
                        type="button" 
                        onClick={() => comboImageInputRef.current.click()}
                        style={{ padding: '10px 16px', borderRadius: '8px', background: '#334155', color: 'white', display: 'flex', gap: '8px', alignItems: 'center', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        {uploadingComboImage ? <Loader2 size={16} className="spinner animate-spin" /> : <Upload size={16} />}
                        Upload Combo Image
                      </button>
                      <input 
                        type="file" 
                        ref={comboImageInputRef}
                        accept="image/*" 
                        onChange={(e) => handleImageUpload(e, 'combo')} 
                        style={{ display: 'none' }} 
                      />
                      {formData.combo_offer?.image_url && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Check size={16} color="#10b981" />
                          <span style={{ fontSize: '12px', color: '#10b981' }}>Combo Image Ready!</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 5: Divine FAQs */}
              {formTab === 'faqs' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ margin: 0, fontSize: '14px', color: '#94a3b8' }}>Define Frequently Asked Questions:</h4>
                    <button 
                      type="button" 
                      onClick={addFaq} 
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#ea580c', color: 'white', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      <Plus size={14} /> Add FAQ
                    </button>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {formData.faqs.length === 0 && (
                      <p style={{ color: '#94a3b8', fontSize: '13px', fontStyle: 'italic', padding: '12px', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '8px', textAlign: 'center' }}>
                        No FAQs added yet. Click "Add FAQ" to start.
                      </p>
                    )}
                    {formData.faqs.map((faq, index) => (
                      <div key={index} style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', position: 'relative' }}>
                        <button 
                          type="button"
                          onClick={() => removeFaq(index)} 
                          style={{ position: 'absolute', top: '12px', right: '12px', color: '#ef4444', cursor: 'pointer' }}
                        >
                          <X size={16} />
                        </button>
                        <div className="form-group" style={{ marginBottom: '10px' }}>
                          <label style={{ fontSize: '12px', color: '#cbd5e1' }}>Question {index + 1}</label>
                          <input type="text" value={faq.q} onChange={(e) => handleFaqChange(index, 'q', e.target.value)} className="input-field" placeholder="e.g. When will I get the link?" />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label style={{ fontSize: '12px', color: '#cbd5e1' }}>Answer</label>
                          <textarea value={faq.a} onChange={(e) => handleFaqChange(index, 'a', e.target.value)} className="input-field" rows="2" placeholder="e.g. We will send the personalized link on WhatsApp..." />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* Right Side: High-Fidelity Phone Simulator Preview */}
        <div className="manager-preview-section" style={{ width: '400px', flexShrink: 0 }}>
          {/* Preview Tab Selector */}
          <div className="preview-toggle" style={{ display: 'flex', width: '100%', marginBottom: '16px', gap: '4px' }}>
            <button className={previewMode === 'home' ? 'active' : ''} onClick={() => setPreviewMode('home')} style={{ flex: 1, padding: '8px 4px', fontSize: '12px', fontWeight: 'bold' }}>Home Tab</button>
            <button className={previewMode === 'puja' ? 'active' : ''} onClick={() => setPreviewMode('puja')} style={{ flex: 1, padding: '8px 4px', fontSize: '12px', fontWeight: 'bold' }}>Puja Tab</button>
            <button className={previewMode === 'store' ? 'active' : ''} onClick={() => setPreviewMode('store')} style={{ flex: 1, padding: '8px 4px', fontSize: '12px', fontWeight: 'bold' }}>Store Tab</button>
            <button className={previewMode === 'detail' ? 'active' : ''} onClick={() => setPreviewMode('detail')} style={{ flex: 1, padding: '8px 4px', fontSize: '12px', fontWeight: 'bold' }}>Details Tab</button>
          </div>
          
          <div className="phone-simulator" style={{ width: '320px', height: '650px', background: '#f8fafc', borderRadius: '40px', border: '8px solid #1e293b', position: 'relative', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
            <div className="phone-notch" style={{ height: '22px', backgroundColor: '#1e293b', width: '120px', position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', borderBottomLeftRadius: '14px', borderBottomRightRadius: '14px', zIndex: 100 }}></div>
            
            <div className="phone-content" style={{ height: '100%', position: 'relative', backgroundColor: (previewMode === 'home' || previewMode === 'puja') ? '#ffffff' : (previewMode === 'store' ? '#ffffff' : '#f8fafc'), overflow: 'hidden' }}>
              
              {/* --- PREVIEW MODE: HOME --- */}
              {previewMode === 'home' && (
                <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff', height: '100%', overflowY: 'auto', paddingTop: '22px', fontFamily: '"Outfit", -apple-system, sans-serif' }}>
                  {/* Mock App Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '16px', backgroundColor: '#fed7aa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold', color: '#c2410c' }}>SP</div>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#0f172a' }}>Sahil Patel</div>
                        <div style={{ fontSize: '9px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <span style={{ width: '5px', height: '5px', borderRadius: '2.5px', backgroundColor: '#10b981', display: 'inline-block' }}></span>
                          ONLINE
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', color: '#475569' }}>
                      <Search size={16} />
                      <Share2 size={16} />
                      <Bell size={16} />
                    </div>
                  </div>

                  {/* Category Circles (What's on your mind?) */}
                  <div style={{ padding: '16px 14px', textAlign: 'left' }}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>What's on your mind?</h4>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <div style={{ width: '45px', height: '45px', borderRadius: '22.5px', backgroundColor: '#fff7ed', border: '1px solid #fed7aa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🛍️</div>
                        <span style={{ fontSize: '10px', fontWeight: '600', color: '#475569' }}>Shop</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <div style={{ width: '45px', height: '45px', borderRadius: '22.5px', backgroundColor: '#fff7ed', border: '1px solid #fed7aa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>🗺️</div>
                        <span style={{ fontSize: '10px', fontWeight: '600', color: '#475569' }}>Kundli</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <div style={{ width: '45px', height: '45px', borderRadius: '22.5px', backgroundColor: '#fff7ed', border: '1px solid #fed7aa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>📖</div>
                        <span style={{ fontSize: '10px', fontWeight: '600', color: '#475569' }}>Panchang</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <div style={{ width: '45px', height: '45px', borderRadius: '22.5px', backgroundColor: '#fff7ed', border: '1px solid #fed7aa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>📜</div>
                        <span style={{ fontSize: '10px', fontWeight: '600', color: '#475569' }}>Rashi</span>
                      </div>
                    </div>
                  </div>

                  {/* Saffron Bordered Cream Container (₹1 Puja Box) */}
                  <div style={{ 
                    margin: '0 16px 20px 16px', padding: '16px 0', backgroundColor: '#fff7ed',
                    borderRadius: '24px', border: '1.5px solid #ffedd5', boxShadow: '0 4px 12px rgba(249,115,22,0.03)'
                  }}>
                    {/* Header Row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: '14px', marginBottom: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ backgroundColor: '#ea580c', color: 'white', borderRadius: '6px', padding: '2px 6px', fontWeight: '800', fontSize: '12px' }}>₹1</div>
                        <span style={{ fontSize: '14px', fontWeight: '800', color: '#0f172a' }}>Puja</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', color: '#ea580c', fontSize: '11px', fontWeight: '700', gap: '2px' }}>
                        <span>View All</span>
                        <span>❯</span>
                      </div>
                    </div>

                    {/* Checkmark subheader */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', paddingHorizontal: '14px', marginBottom: '14px', textAlign: 'left' }}>
                      <span style={{ color: '#ea580c', fontSize: '12px', fontWeight: 'bold' }}>✓</span>
                      <span style={{ fontSize: '11px', color: '#475569', fontWeight: '500' }}>
                        Pujas at ₹1 <strong style={{ color: '#ea580c', fontWeight: '700' }}>+ Divine Blessings</strong>
                      </span>
                    </div>

                    {/* Horizontal Scroll list of cards */}
                    <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingHorizontal: '14px', paddingBottom: '4px' }}>
                      {getMergedSimulatorData('home').map(item => (
                        <CardPreview key={item.id} data={item} />
                      ))}
                    </div>
                  </div>

                  {/* Life Problem Solution Mock */}
                  <div style={{ padding: '0 16px 20px 16px', textAlign: 'left' }}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>Life Problem Solution</h4>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <div style={{ flex: 1, height: '70px', borderRadius: '12px', backgroundColor: '#fff1f2', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #ffe4e6', color: '#e11d48', fontWeight: '700', fontSize: '11px' }}>HEALTH</div>
                      <div style={{ flex: 1, height: '70px', borderRadius: '12px', backgroundColor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #fde68a', color: '#d97706', fontWeight: '700', fontSize: '11px' }}>WEALTH</div>
                      <div style={{ flex: 1, height: '70px', borderRadius: '12px', backgroundColor: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #d1fae5', color: '#059669', fontWeight: '700', fontSize: '11px' }}>CAREER</div>
                    </div>
                  </div>
                </div>
              )}

              {/* --- PREVIEW MODE: STORE (VIEW ALL) --- */}
              {previewMode === 'store' && (
                <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff', height: '100%', overflowY: 'auto', paddingTop: '22px', fontFamily: '"Outfit", -apple-system, sans-serif', position: 'relative' }}>
                  {/* Top Banner Image with Action Overlays */}
                  <div style={{ width: '100%', height: '140px', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
                    <img src="/banner.png" alt="Store Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.src = DEFAULT_COMBO_IMAGE; }} />
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.1)' }} />
                    
                    {/* Floating Navigation Circle Buttons over banner */}
                    <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 5 }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '14px', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.15)' }}>
                        <ArrowLeft size={14} color="#000000" />
                      </div>
                    </div>
                    <div style={{ position: 'absolute', top: '10px', right: '10px', display: 'flex', gap: '6px', zIndex: 5 }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '14px', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.15)' }}>
                        <Search size={12} color="#000000" />
                      </div>
                      <div style={{ width: '28px', height: '28px', borderRadius: '14px', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.15)' }}>
                        <Share2 size={12} color="#000000" />
                      </div>
                      <div style={{ width: '28px', height: '28px', borderRadius: '14px', backgroundColor: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.15)' }}>
                        <ShoppingCart size={12} color="#000000" />
                      </div>
                    </div>

                    {/* Slogan Text on Banner */}
                    <div style={{ position: 'absolute', bottom: '8px', left: '12px', right: '12px', textAlign: 'left' }}>
                      <span style={{ fontSize: '10px', color: '#ffd60a', fontWeight: '900', textTransform: 'uppercase', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>₹1 Puja Special</span>
                      <p style={{ margin: 0, fontSize: '11px', color: '#ffffff', fontWeight: '700', lineHeight: '13px', textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                        Unlock 1 item for ₹1 when you shop for ₹199 on Instamart
                      </p>
                    </div>
                  </div>

                  {/* Store Title Section */}
                  <div style={{ padding: '16px 16px 8px 16px', textAlign: 'left', flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ backgroundColor: '#ea580c', color: 'white', borderRadius: '4px', padding: '1px 6px', fontWeight: '800', fontSize: '13px' }}>₹1</div>
                      <span style={{ fontSize: '15px', fontWeight: '800', color: '#000000', textTransform: 'lowercase' }}>store</span>
                    </div>
                    {/* Bullet indicator */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                      <span style={{ color: '#ea580c', fontSize: '12px', fontWeight: 'bold' }}>✓</span>
                      <span style={{ fontSize: '11px', color: '#475569', fontWeight: '500' }}>
                        Pujas at ₹1 <strong style={{ color: '#ea580c', fontWeight: '700' }}>+ Divine Blessings</strong>
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Scroll category filter pills */}
                  <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingHorizontal: '16px', marginBottom: '16px', flexShrink: 0 }}>
                    <div style={{ padding: '6px 12px', borderRadius: '16px', backgroundColor: '#ea580c', color: 'white', fontSize: '11px', fontWeight: '800', border: '1px solid #ea580c', whiteSpace: 'nowrap' }}>All</div>
                    <div style={{ padding: '6px 12px', borderRadius: '16px', backgroundColor: '#f1f5f9', color: '#475569', fontSize: '11px', fontWeight: '600', border: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>Special</div>
                    <div style={{ padding: '6px 12px', borderRadius: '16px', backgroundColor: '#f1f5f9', color: '#475569', fontSize: '11px', fontWeight: '600', border: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>Wealth</div>
                    <div style={{ padding: '6px 12px', borderRadius: '16px', backgroundColor: '#f1f5f9', color: '#475569', fontSize: '11px', fontWeight: '600', border: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>Health</div>
                    <div style={{ padding: '6px 12px', borderRadius: '16px', backgroundColor: '#f1f5f9', color: '#475569', fontSize: '11px', fontWeight: '600', border: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>Career</div>
                  </div>

                  {/* Stunning 3-Column Grid representing real store */}
                  <div style={{ 
                    display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px 8px', 
                    paddingHorizontal: '12px', paddingBottom: '80px' 
                  }}>
                    {getMergedSimulatorData('store').map(item => (
                      <CardPreview key={item.id} data={item} />
                    ))}
                  </div>

                  {/* Floating delivery pill footer (Teal theme) */}
                  <div style={{ 
                    position: 'absolute', bottom: '16px', left: '16px', right: '16px',
                    backgroundColor: '#f0fdfa', border: '1px solid #ccfbf1', borderRadius: '24px',
                    padding: '8px 12px', boxShadow: '0 4px 6px rgba(15, 118, 110, 0.08)', zIndex: 10
                  }}>
                    <p style={{ margin: 0, fontSize: '10.5px', color: '#0f766e', fontWeight: '600', letterSpacing: '0.2px' }}>
                      <strong style={{ fontWeight: '800' }}>FREE DELIVERY</strong> on orders above <strong style={{ fontWeight: '800' }}>₹149</strong>
                    </p>
                  </div>
                </div>
              )}

              {/* --- PREVIEW MODE: PUJA TAB (2-ROW HORIZONTAL SWIPE GRID) --- */}
              {previewMode === 'puja' && (
                <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff', height: '100%', overflowY: 'auto', paddingTop: '22px', fontFamily: '"Outfit", -apple-system, sans-serif' }}>
                  {/* Mock App Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '16px', backgroundColor: '#fed7aa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold', color: '#c2410c' }}>SP</div>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: '11px', fontWeight: '700', color: '#0f172a' }}>Sahil Patel</div>
                        <div style={{ fontSize: '9px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <span style={{ width: '5px', height: '5px', borderRadius: '2.5px', backgroundColor: '#10b981', display: 'inline-block' }}></span>
                          ONLINE
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', color: '#475569' }}>
                      <Search size={16} />
                      <Share2 size={16} />
                      <Bell size={16} />
                    </div>
                  </div>

                  {/* Categories / Banner spacer */}
                  <div style={{ padding: '16px', textAlign: 'left', background: 'linear-gradient(135deg, #f97316, #ea580c)', borderBottomLeftRadius: '20px', borderBottomRightRadius: '20px', color: 'white', marginBottom: '16px' }}>
                    <span style={{ fontSize: '10px', textTransform: 'uppercase', opacity: 0.8, fontWeight: '800' }}>Vedic Seva Deals</span>
                    <h2 style={{ margin: '4px 0 0 0', fontSize: '16px', fontWeight: '900' }}>Divine blessings starting at ₹29</h2>
                  </div>

                  {/* Puja under ₹1 Section Title */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: '16px', marginBottom: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '13px', fontWeight: '900', color: '#0f172a' }}>Puja under ₹1</h3>
                    <span style={{ fontSize: '10.5px', color: '#ea580c', fontWeight: 'bold', cursor: 'pointer' }}>View all &gt;</span>
                  </div>

                  <p style={{ margin: '0 16px 12px 16px', fontSize: '11px', color: '#475569', textAlign: 'left', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ color: '#ea580c', fontWeight: 'bold' }}>✓</span> Pujas at ₹1 <strong style={{ color: '#ea580c', fontWeight: '700' }}>+ Divine Blessings</strong>
                  </p>

                  {/* Two-Row Horizontal Scroll Simulator */}
                  <div style={{ 
                    overflowX: 'auto', paddingBottom: '30px', width: '100%'
                  }}>
                    <div style={{
                      display: 'flex', flexDirection: 'column', gap: '16px', 
                      paddingLeft: '16px', paddingRight: '16px', width: 'max-content'
                    }}>
                      {/* Row 1 */}
                      <div style={{ display: 'flex', gap: '12px' }}>
                        {getMergedSimulatorData('puja').filter((_, idx) => idx % 2 === 0).map(item => (
                          <CardPreview key={item.id} data={item} />
                        ))}
                      </div>

                      {/* Row 2 */}
                      <div style={{ display: 'flex', gap: '12px' }}>
                        {getMergedSimulatorData('puja').filter((_, idx) => idx % 2 !== 0).map(item => (
                          <CardPreview key={item.id} data={item} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* --- PREVIEW MODE: DETAIL (MODAL SLIDE-UP ANIMATED & VIEWPORT SCROLL) --- */}
              {previewMode === 'detail' && (
                <div className="detail-slide-anim" style={{ height: '100%', position: 'relative', overflow: 'hidden', paddingTop: '22px' }}>
                  
                  {/* Floating Header Actions - Fixed Overlay */}
                  <div style={{ position: 'absolute', top: '30px', left: '16px', right: '16px', display: 'flex', justifyContent: 'space-between', zIndex: 50 }}>
                    <div style={{ width: '38px', height: '38px', backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '19px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.08)', cursor: 'pointer' }}>
                      <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b' }}>←</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <div style={{ width: '38px', height: '38px', backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '19px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.08)', position: 'relative', cursor: 'pointer' }}>
                         <ShoppingCart size={16} color="#1e293b" />
                         <div style={{ position: 'absolute', top: '-4px', right: '-4px', backgroundColor: '#ef4444', width: '14px', height: '14px', borderRadius: '8px', border: '1px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '7.5px', fontWeight: 'bold' }}>2</div>
                      </div>
                    </div>
                  </div>

                  {/* Scrollable Viewport where Hero image slides up out of view */}
                  <DetailPreview 
                    data={formData} 
                    selectedPackage={simSelectedPackage}
                    setSelectedPackage={setSimSelectedPackage}
                    comboQuantity={simComboQuantity}
                    setComboQuantity={setSimComboQuantity}
                  />

                  {/* Saffron Primary Buy Button - Fixed Overlay */}
                  <div style={{ 
                    position: 'absolute', bottom: '0', left: '0', right: '0', padding: '12px 16px', 
                    backgroundColor: '#ffffff', borderTop: '1px solid #f1f5f9', zIndex: 50,
                    boxShadow: '0 -4px 6px rgba(0,0,0,0.05)'
                  }}>
                    <div style={{ 
                      backgroundColor: '#ea580c', color: 'white', height: '48px', borderRadius: '24px', 
                      display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px',
                      boxShadow: '0 4px 6px rgba(234, 88, 12, 0.25)', cursor: 'pointer'
                    }}>
                      <span style={{ fontSize: '14px', fontWeight: '700', letterSpacing: '0.5px' }}>
                        ADD PUJA TO DEVOTIONAL CART
                      </span> 
                      <span>→</span>
                    </div>
                  </div>

                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* Database Listing Table */}
      <div className="glass-card" style={{ marginTop: '24px', backgroundColor: '#161622', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', padding: '24px' }}>
        <div className="card-header" style={{ marginBottom: '16px' }}>
          <h2 className="card-title" style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>All Active ₹1 Poojas</h2>
        </div>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
            <Loader2 className="spinner animate-spin" style={{ margin: '0 auto 8px auto' }} />
            <span>Loading database records...</span>
          </div>
        ) : poojas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontStyle: 'italic' }}>
            No records found. Complete the form and click "Publish Now" to add your first Pooja.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', fontSize: '13px' }}>
                  <th style={{ padding: '12px' }}>Pooja Title / Provider</th>
                  <th style={{ padding: '12px' }}>Prices</th>
                  <th style={{ padding: '12px' }}>Active Pages</th>
                  <th style={{ padding: '12px' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {poojas.map(pooja => (
                  <tr key={pooja.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '14px' }}>
                    <td style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img 
                        src={pooja.image_url || DEFAULT_IMAGE} 
                        alt="puja" 
                        style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.08)' }} 
                      />
                      <div>
                        <div style={{ fontWeight: '700', color: '#ffffff' }}>{pooja.title}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>{pooja.provider}</div>
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ color: '#ffd60a', fontWeight: 'bold' }}>{pooja.offer_price}</span>
                      <span style={{ fontSize: '11px', color: '#94a3b8', textDecoration: 'line-through', marginLeft: '6px' }}>{pooja.original_price}</span>
                    </td>
                    <td style={{ padding: '12px', fontSize: '12px' }}>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <span>Home: {pooja.is_active_on_home ? '✅' : '❌'}</span>
                        <span>Store: {pooja.is_active ? '✅' : '❌'}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ 
                        padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '800',
                        backgroundColor: pooja.status === 'published' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: pooja.status === 'published' ? '#34d399' : '#fbbf24' 
                      }}>
                        {pooja.status?.toUpperCase() || 'DRAFT'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '12px' }}>
                        <button 
                          onClick={() => handleEdit(pooja)} 
                          style={{ color: '#60a5fa', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Edit3 size={15} /> Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(pooja.id)} 
                          style={{ color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Trash2 size={15} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OneRupeeManagerPage;
