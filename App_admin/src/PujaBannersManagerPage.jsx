import { useState, useEffect, useRef } from 'react';
import { 
  Edit3, Trash2, Check, AlertTriangle, Upload, Loader2, Save, X, 
  Layers, Palette, Type, Heart
} from 'lucide-react';
import { supabase } from './lib/supabase';
import { uploadToR2 } from './lib/r2';

const DEFAULT_BANNER_IMAGE = 'https://images.unsplash.com/photo-1608976328321-2f9b229f3e08?auto=format&fit=crop&w=600&q=80';

// --- Subcomponent: Sacred Tilak for Devotional Vibe --- //
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

export default function PujaBannersManagerPage() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Form and uploading states
  const [isEditingId, setIsEditingId] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const initialFormState = {
    small_title: 'MANTRAPUJA',
    main_title: 'DEALS',
    subtitle: 'Divine blessing packs starting at ₹29',
    button_text: 'BOOK NOW',
    image_url: '',
    gradient_start: '#f97316',
    gradient_end: '#ea580c',
    is_active: true
  };

  const [formData, setFormData] = useState(initialFormState);

  // File Input Ref
  const imageInputRef = useRef(null);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const { data, error: fetchErr } = await supabase
        .from('puja_banners')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchErr) throw fetchErr;
      setBanners(data || []);
      
      // Auto-populate active configuration in the form if any is currently active
      if (data && data.length > 0 && !isEditingId) {
        const activeItem = data.find(b => b.is_active);
        if (activeItem) {
          setFormData({
            small_title: activeItem.small_title || 'MANTRAPUJA',
            main_title: activeItem.main_title || 'DEALS',
            subtitle: activeItem.subtitle || 'Divine blessing packs starting at ₹29',
            button_text: activeItem.button_text || 'BOOK NOW',
            image_url: activeItem.image_url || '',
            gradient_start: activeItem.gradient_start || '#f97316',
            gradient_end: activeItem.gradient_end || '#ea580c',
            is_active: activeItem.is_active
          });
          setIsEditingId(activeItem.id);
        }
      }
    } catch (err) {
      console.error('Error fetching puja banners:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
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

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showMessage('Please select a valid image file.', true);
      return;
    }

    setUploadingImage(true);
    try {
      showMessage('Uploading arched illustration graphic to Cloudflare R2...');
      const publicUrl = await uploadToR2(file, 'banner');
      setFormData(prev => ({
        ...prev,
        image_url: publicUrl
      }));
      showMessage('Image uploaded successfully!');
    } catch (err) {
      console.error('Image upload error:', err);
      showMessage(`Image upload failed: ${err.message}`, true);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      small_title: formData.small_title.trim() || 'MANTRAPUJA',
      main_title: formData.main_title.trim() || 'DEALS',
      subtitle: formData.subtitle.trim() || 'Divine blessing packs starting at ₹29',
      button_text: formData.button_text.trim() || 'BOOK NOW',
      image_url: formData.image_url || null,
      gradient_start: formData.gradient_start || '#f97316',
      gradient_end: formData.gradient_end || '#ea580c',
      is_active: formData.is_active
    };

    try {
      // If we are marking this banner as active, we must set all other puja banners as is_active = false
      if (payload.is_active) {
        await supabase
          .from('puja_banners')
          .update({ is_active: false })
          .neq('id', isEditingId || '00000000-0000-0000-0000-000000000000');
      }

      if (isEditingId) {
        // Edit Mode
        const { error: updateErr } = await supabase
          .from('puja_banners')
          .update(payload)
          .eq('id', isEditingId);

        if (updateErr) throw updateErr;
        showMessage('Puja screen header banner updated successfully!');
      } else {
        // Create Mode
        const { error: insertErr } = await supabase
          .from('puja_banners')
          .insert([payload]);

        if (insertErr) throw insertErr;
        showMessage('New Puja screen banner configuration published!');
      }

      setIsEditingId(null);
      setFormData(initialFormState);
      if (imageInputRef.current) imageInputRef.current.value = '';
      fetchBanners();
    } catch (err) {
      console.error('Form submit error:', err);
      showMessage(err.message, true);
    }
  };

  const handleEdit = (banner) => {
    setIsEditingId(banner.id);
    setFormData({
      small_title: banner.small_title || 'MANTRAPUJA',
      main_title: banner.main_title || 'DEALS',
      subtitle: banner.subtitle || 'Divine blessing packs starting at ₹29',
      button_text: banner.button_text || 'BOOK NOW',
      image_url: banner.image_url || '',
      gradient_start: banner.gradient_start || '#f97316',
      gradient_end: banner.gradient_end || '#ea580c',
      is_active: banner.is_active
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this banner configuration?')) return;

    try {
      const { error: delErr } = await supabase
        .from('puja_banners')
        .delete()
        .eq('id', id);

      if (delErr) throw delErr;
      showMessage('Puja banner deleted successfully.');
      
      if (isEditingId === id) {
        setIsEditingId(null);
        setFormData(initialFormState);
      }
      fetchBanners();
    } catch (err) {
      console.error('Delete error:', err);
      showMessage(err.message, true);
    }
  };

  const toggleActiveStatus = async (banner) => {
    try {
      // Deactivate all first
      await supabase
        .from('puja_banners')
        .update({ is_active: false })
        .neq('id', banner.id);

      // Toggle target banner active status
      const { error: toggleErr } = await supabase
        .from('puja_banners')
        .update({ is_active: !banner.is_active })
        .eq('id', banner.id);

      if (toggleErr) throw toggleErr;
      showMessage(`Banner config ${!banner.is_active ? 'Activated' : 'Deactivated'} successfully.`);
      fetchBanners();
    } catch (err) {
      console.error('Toggle error:', err);
      showMessage(err.message, true);
    }
  };

  const clearForm = () => {
    setFormData(initialFormState);
    setIsEditingId(null);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  return (
    <div className="page-content" style={{ fontFamily: '"Outfit", sans-serif' }}>
      <div className="page-header">
        <h1 className="gradient-text">Puja Page Banner Manager</h1>
        <p>Dynamize the arched hero banner on the Puja screen, edit backgrounds, arched illustrations, branding overlay title, and details.</p>
      </div>

      {error && (
        <div className="login-error" style={{ marginBottom: '20px' }}>
          <AlertTriangle size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
          {error}
        </div>
      )}

      {successMsg && (
        <div className="settings-success" style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <Check size={18} />
          {successMsg}
        </div>
      )}

      <div className="manager-split-layout">
        
        {/* Left Side - CRUD Panel */}
        <div className="manager-form-section" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* CRUD Form */}
          <div className="glass-card">
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Layers size={20} color="#6366f1" />
              {isEditingId ? 'Edit Puja Page Banner Details' : 'Add New Puja Header Configuration'}
            </h3>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Small Branding Title (Default: MANTRAPUJA)</label>
                  <input 
                    type="text" 
                    name="small_title" 
                    className="input-field"
                    value={formData.small_title}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label>Main Deals Title (Default: DEALS)</label>
                  <input 
                    type="text" 
                    name="main_title" 
                    className="input-field"
                    value={formData.main_title}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Subtitle / Description (highlight price using ₹ symbol)</label>
                <input 
                  type="text" 
                  name="subtitle" 
                  className="input-field"
                  value={formData.subtitle}
                  onChange={handleInputChange}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '1rem', alignItems: 'center' }}>
                <div className="form-group">
                  <label>CTA Button Text (Default: BOOK NOW)</label>
                  <input 
                    type="text" 
                    name="button_text" 
                    className="input-field"
                    value={formData.button_text}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Color Pickers */}
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Palette size={13} color="#6366f1" />
                    Color Start
                  </label>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <input 
                      type="color" 
                      name="gradient_start" 
                      value={formData.gradient_start}
                      onChange={handleInputChange}
                      style={{ border: 'none', width: '28px', height: '28px', cursor: 'pointer', background: 'transparent' }}
                    />
                    <span style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>{formData.gradient_start}</span>
                  </div>
                </div>

                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Palette size={13} color="#6366f1" />
                    Color End
                  </label>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <input 
                      type="color" 
                      name="gradient_end" 
                      value={formData.gradient_end}
                      onChange={handleInputChange}
                      style={{ border: 'none', width: '28px', height: '28px', cursor: 'pointer', background: 'transparent' }}
                    />
                    <span style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>{formData.gradient_end}</span>
                  </div>
                </div>
              </div>

              {/* R2 Image upload */}
              <div className="form-group" style={{ border: '1px dashed var(--border)', borderRadius: 'var(--radius)', padding: '1.25rem', background: 'rgba(255,255,255,0.01)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
                  <Upload size={16} color="#6366f1" />
                  Arched Frame Illustration *
                </label>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Provide a transparent PNG file so it frames beautifully inside the arched display container.
                </p>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <input 
                    type="file" 
                    accept="image/*" 
                    ref={imageInputRef}
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                  <button 
                    type="button" 
                    className="btn-secondary" 
                    disabled={uploadingImage}
                    onClick={() => imageInputRef.current?.click()}
                    style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}
                  >
                    {uploadingImage ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                    {formData.image_url ? 'Change Illustration Image' : 'Choose PNG Illustration'}
                  </button>
                  {formData.image_url && (
                    <span style={{ fontSize: '0.8rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Check size={14} /> Illustration uploaded.
                    </span>
                  )}
                </div>
                {formData.image_url && (
                  <div style={{ display: 'flex', gap: '12px', marginTop: '12px', alignItems: 'center' }}>
                    <div style={{ width: '56px', height: '64px', borderRadius: '12px 12px 0 0', overflow: 'hidden', border: '1px solid var(--border)', background: '#f97316' }}>
                      <img 
                        src={formData.image_url} 
                        alt="Arched Preview" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px' }}>
                      <strong>Cloudflare R2 link:</strong> {formData.image_url}
                    </div>
                  </div>
                )}
              </div>

              {/* Status checkbox */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
                <input 
                  type="checkbox" 
                  id="is_active" 
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="is_active" style={{ fontSize: '0.85rem', color: 'var(--text-main)', cursor: 'pointer', fontWeight: 'bold' }}>
                  Set this configuration as ACTIVE on the app immediately
                </label>
              </div>

              <div className="form-actions" style={{ marginTop: '0.5rem' }}>
                {isEditingId && (
                  <button 
                    type="button" 
                    className="btn-secondary" 
                    onClick={clearForm}
                    style={{ marginRight: '8px' }}
                  >
                    Clear Form / Add New
                  </button>
                )}
                <button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={uploadingImage}
                >
                  <Save size={16} />
                  {isEditingId ? 'Update Configuration' : 'Publish configuration'}
                </button>
              </div>
            </form>
          </div>

          {/* Configs List Table */}
          <div className="glass-card" style={{ flex: 1 }}>
            <h3 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={20} color="#6366f1" />
              Saved Puja Header Configurations ({banners.length})
            </h3>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem', gap: '12px' }}>
                <Loader2 size={32} className="animate-spin" color="#6366f1" />
                <span style={{ color: 'var(--text-muted)' }}>Loading saved templates...</span>
              </div>
            ) : banners.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                No custom configurations saved yet. Draft your first dynamic design above!
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ width: '70px' }}>Status</th>
                      <th style={{ width: '60px' }}>Graphic</th>
                      <th>Deals Titles</th>
                      <th>Description</th>
                      <th style={{ width: '130px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {banners.map((banner) => (
                      <tr key={banner.id} style={{ background: isEditingId === banner.id ? 'rgba(99,102,241,0.06)' : 'transparent' }}>
                        <td>
                          <button 
                            onClick={() => toggleActiveStatus(banner)}
                            className={`badge-status ${banner.is_active ? 'success' : 'warning'}`}
                            style={{ cursor: 'pointer', border: 'none', fontInherit: 'true', outline: 'none' }}
                          >
                            {banner.is_active ? 'Active' : 'Inactive'}
                          </button>
                        </td>
                        <td>
                          <div style={{ 
                            width: '32px', 
                            height: '38px', 
                            borderRadius: '8px 8px 0 0', 
                            background: `linear-gradient(135deg, ${banner.gradient_start}, ${banner.gradient_end})`, 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            overflow: 'hidden',
                            border: '1px solid var(--border)'
                          }}>
                            {banner.image_url ? (
                              <img src={banner.image_url} alt="Mockup" style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
                            ) : (
                              <span style={{ fontSize: '10px' }}>🌸</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
                            <span style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>{banner.main_title}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{banner.small_title}</span>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>{banner.subtitle}</span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Button: {banner.button_text}</span>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            <button 
                              type="button"
                              className="action-btn-primary"
                              onClick={() => handleEdit(banner)}
                              style={{ padding: '0.4rem 0.8rem' }}
                            >
                              <Edit3 size={13} /> Edit
                            </button>
                            <button 
                              type="button"
                              className="action-btn-danger"
                              onClick={() => handleDelete(banner.id)}
                              style={{ padding: '0.4rem' }}
                            >
                              <Trash2 size={13} />
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

        {/* Right Side - Interactive Mobile Phone Simulator */}
        <div className="manager-preview-section">
          <div style={{ marginBottom: '14px', width: '100%', textAlign: 'center' }}>
            <h4 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Layers size={16} color="#ea580c" />
              Live Mobile App Simulator
            </h4>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Renders the curved Puja Page header banner in real-time</span>
          </div>

          <div className="phone-simulator">
            <div className="phone-notch"></div>
            <div className="phone-content" style={{ backgroundColor: '#ffffff', height: '100%', padding: '36px 0px 16px 0px', display: 'flex', flexDirection: 'column' }}>
              
              {/* Premium Header Banner exactly matching mobile JSX and CSS */}
              <div style={{ 
                width: '100%', 
                height: '240px', 
                background: `linear-gradient(135deg, ${formData.gradient_start}, ${formData.gradient_end})`, 
                position: 'relative',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderRadius: '0 0 28px 28px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}>
                
                {/* Floating Search Bar */}
                <div style={{ display: 'flex', backgroundColor: '#ffffff', borderRadius: '24px', padding: '8px 14px', gap: '8px', alignItems: 'center', width: '100%', boxShadow: '0 2px 6px rgba(0,0,0,0.06)', marginTop: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>🔍</span>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>Search for 'Puja'</span>
                </div>

                {/* Content Row split into left text and right illustration */}
                <div style={{ display: 'flex', flex: 1, alignItems: 'flex-end', justifyContent: 'space-between', marginTop: '14px', width: '100%' }}>
                  
                  {/* Left Side: Dynamic Branding Texts and Button */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '50%', textAlign: 'left', paddingBottom: '10px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.4)' }} />
                        <span style={{ fontSize: '7.5px', fontFamily: '"Outfit", sans-serif', fontWeight: 'bold', color: 'rgba(255,255,255,0.85)', letterSpacing: '0.8px' }}>
                          {formData.small_title}
                        </span>
                        <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.4)' }} />
                      </div>
                      <span style={{ fontSize: '28px', fontWeight: '900', color: '#ffffff', letterSpacing: '-1px', lineHeight: '30px' }}>
                        {formData.main_title}
                      </span>
                    </div>

                    <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'rgba(255,255,255,0.9)', lineHeight: '14px' }}>
                      {/* Highlight numbers in price text */}
                      {formData.subtitle.split(/(\d+)/).map((p, idx) => (
                        /\d+/.test(p) ? <strong key={idx} style={{ color: '#fef08a', fontSize: '11px' }}>{p}</strong> : p
                      ))}
                    </span>

                    <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', padding: '6px 12px', width: 'fit-content', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', display: 'inline-block', marginTop: '4px' }}>
                      <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#ea580c', textTransform: 'uppercase' }}>
                        {formData.button_text}
                      </span>
                    </div>
                  </div>

                  {/* Right Side: Curved Arched Graphic Frame */}
                  <div style={{ width: '46%', height: '148px', position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                    {/* Arch container */}
                    <div style={{ 
                      width: '104px', 
                      height: '140px', 
                      borderRadius: '52px 52px 0 0', 
                      backgroundColor: 'rgba(255,255,255,0.2)', 
                      border: '1px solid rgba(255,255,255,0.35)', 
                      overflow: 'hidden',
                      position: 'relative'
                    }}>
                      <img 
                        src={formData.image_url || 'https://images.unsplash.com/photo-1608976328321-2f9b229f3e08?auto=format&fit=crop&w=300&q=80'} 
                        alt="Arch Illustration"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>

                    {/* Floating hearts surrounding the illustration exactly matching mobile layout positioning */}
                    <Heart size={16} color="#ff3b30" fill="#ff3b30" style={{ position: 'absolute', top: '16px', left: '0px', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.15))' }} />
                    <Heart size={13} color="#ff3b30" fill="#ff3b30" style={{ position: 'absolute', bottom: '48px', left: '-12px', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.15))' }} />
                    <Heart size={20} color="#ff3b30" fill="#ff3b30" style={{ position: 'absolute', top: '32px', right: '8px', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.15))' }} />
                    <Heart size={11} color="#ff3b30" fill="#ff3b30" style={{ position: 'absolute', bottom: '16px', right: '28px', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.15))' }} />
                  </div>

                </div>

              </div>

              {/* Scrollable grid preview in mobile frame */}
              <div style={{ flex: 1, padding: '16px 14px 0 14px', textAlign: 'left' }}>
                {/* Deity days listing */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', overflowX: 'auto', width: '100%' }}>
                  {['Mon', 'Tue', 'Wed', 'Thu'].map((day, idx) => (
                    <div key={idx} style={{ minWidth: '46px', height: '56px', borderRadius: '12px', border: idx === 1 ? '1px solid #fed7aa' : '1px solid #f1f5f9', backgroundColor: idx === 1 ? '#fff7ed' : '#f8fafc', padding: '6px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '8px', fontWeight: 'bold', color: idx === 1 ? '#ea580c' : '#64748b' }}>{day}</span>
                      <span style={{ fontSize: '10px', color: '#1e293b', marginTop: '2px' }}>🌸</span>
                    </div>
                  ))}
                </div>

                {/* Section title */}
                <span style={{ fontSize: '9px', fontWeight: '800', color: '#94a3b8', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                  PUJAS & HOMAS SEVAS
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div style={{ backgroundColor: '#f8fafc', border: '0.5px solid #e2e8f0', borderRadius: '12px', padding: '8px' }}>
                    <div style={{ width: '100%', height: '56px', borderRadius: '8px', backgroundColor: '#e2e8f0', overflow: 'hidden' }}>
                      <img src="https://images.unsplash.com/photo-1608976328321-2f9b229f3e08?auto=format&fit=crop&w=120&q=80" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <span style={{ fontSize: '9px', fontWeight: 'bold', display: 'block', marginTop: '6px', color: '#0f172a' }}>Ganesh Yajna</span>
                  </div>
                  <div style={{ backgroundColor: '#f8fafc', border: '0.5px solid #e2e8f0', borderRadius: '12px', padding: '8px' }}>
                    <div style={{ width: '100%', height: '56px', borderRadius: '8px', backgroundColor: '#e2e8f0', overflow: 'hidden' }}>
                      <img src="https://images.unsplash.com/photo-1602631985686-1bb0e6a8696e?auto=format&fit=crop&w=120&q=80" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <span style={{ fontSize: '9px', fontWeight: 'bold', display: 'block', marginTop: '6px', color: '#0f172a' }}>Shiva Abhishek</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
