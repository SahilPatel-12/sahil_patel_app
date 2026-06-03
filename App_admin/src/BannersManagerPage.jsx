import { useState, useEffect, useRef } from 'react';
import { 
  Edit3, Trash2, Check, AlertTriangle, Upload, Loader2, Save, Plus, X, 
  ArrowLeft, ArrowUp, ArrowDown, Image as ImageIcon, Link as LinkIcon, Sparkles
} from 'lucide-react';
import { supabase } from './lib/supabase';
import { uploadToR2 } from './lib/r2';

const DEFAULT_BANNER = 'https://images.unsplash.com/photo-1608976328321-2f9b229f3e08?auto=format&fit=crop&w=1200&q=80';

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

export default function BannersManagerPage() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Form states
  const [isEditingId, setIsEditingId] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const initialFormState = {
    title: '',
    redirect_url: '',
    image_url: '',
    sort_order: 0
  };

  const [formData, setFormData] = useState(initialFormState);

  // File Ref
  const imageInputRef = useRef(null);

  // Simulated auto-scroll carousel index for Phone Preview
  const [simulatedIndex, setSimulatedIndex] = useState(0);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const { data, error: fetchErr } = await supabase
        .from('banners')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (fetchErr) throw fetchErr;
      setBanners(data || []);
    } catch (err) {
      console.error('Error fetching banners:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  // Simulator auto scroll effect
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setSimulatedIndex(prev => (prev + 1) % banners.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [banners.length]);

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
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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
      showMessage('Uploading banner image to Cloudflare R2...');
      const publicUrl = await uploadToR2(file, 'banner');
      setFormData(prev => ({
        ...prev,
        image_url: publicUrl
      }));
      showMessage('Banner image uploaded successfully!');
    } catch (err) {
      console.error('Image upload error:', err);
      showMessage(`Image upload failed: ${err.message}`, true);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.image_url) return showMessage('A banner image file must be uploaded.', true);

    const payload = {
      title: formData.title.trim() || null,
      redirect_url: formData.redirect_url.trim() || null,
      image_url: formData.image_url,
      sort_order: parseInt(formData.sort_order) || 0
    };

    try {
      if (isEditingId) {
        // Edit Mode
        const { error: updateErr } = await supabase
          .from('banners')
          .update(payload)
          .eq('id', isEditingId);

        if (updateErr) throw updateErr;
        showMessage('Banner details updated successfully!');
      } else {
        // Create Mode
        const { error: insertErr } = await supabase
          .from('banners')
          .insert([payload]);

        if (insertErr) throw insertErr;
        showMessage('New promotion banner added successfully!');
      }

      // Reset form
      setFormData(initialFormState);
      setIsEditingId(null);
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
      title: banner.title || '',
      redirect_url: banner.redirect_url || '',
      image_url: banner.image_url,
      sort_order: banner.sort_order
    });
    // Scroll form into view
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this banner?')) return;

    try {
      const { error: delErr } = await supabase
        .from('banners')
        .delete()
        .eq('id', id);

      if (delErr) throw delErr;
      showMessage('Banner deleted successfully.');
      fetchBanners();
    } catch (err) {
      console.error('Delete error:', err);
      showMessage(err.message, true);
    }
  };

  const handleMove = async (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= banners.length) return;

    const list = [...banners];
    const target = list[index];
    const currentSort = target.sort_order;
    const swapWith = list[newIndex];
    const swapSort = swapWith.sort_order;

    // Swap sorting order in database
    try {
      const { error: err1 } = await supabase
        .from('banners')
        .update({ sort_order: swapSort })
        .eq('id', target.id);
      
      const { error: err2 } = await supabase
        .from('banners')
        .update({ sort_order: currentSort })
        .eq('id', swapWith.id);

      if (err1 || err2) throw err1 || err2;
      fetchBanners();
    } catch (err) {
      console.error('Reordering failed:', err);
      showMessage('Failed to swap banner sequence.', true);
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
        <h1 className="gradient-text">App Banners Manager</h1>
        <p>Manage dynamic promotional banners rendered in the homepage carousel. Upload to Cloudflare R2 and sync in Supabase.</p>
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
              <ImageIcon size={20} color="#6366f1" />
              {isEditingId ? 'Edit Banner Details' : 'Add New Promotional Banner'}
            </h3>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="form-group">
                <label>Banner Title (Optional)</label>
                <input 
                  type="text" 
                  name="title" 
                  placeholder="e.g. Navratri Maha Puja Special Offer"
                  className="input-field"
                  value={formData.title}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Redirect Link / Target Screen URL (Optional)</label>
                <input 
                  type="text" 
                  name="redirect_url" 
                  placeholder="e.g. /puja-details/combo-offer or https://..."
                  className="input-field"
                  value={formData.redirect_url}
                  onChange={handleInputChange}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  If specified, clicking the banner in the mobile app redirects the user to this screen/destination.
                </span>
              </div>

              {/* R2 Direct Banner Image Upload */}
              <div className="form-group" style={{ border: '1px dashed var(--border)', borderRadius: 'var(--radius)', padding: '1.25rem', background: 'rgba(255,255,255,0.01)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
                  <ImageIcon size={16} color="#6366f1" />
                  Banner Image File *
                </label>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Choose a gorgeous banner image. **Preferred Size: 1029 x 399 pixels (Aspect Ratio ~2.58:1)**.
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
                    {formData.image_url ? 'Change Banner Image' : 'Choose Banner Image'}
                  </button>
                  {formData.image_url && (
                    <span style={{ fontSize: '0.8rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Check size={14} /> Image file uploaded.
                    </span>
                  )}
                </div>
                
                {formData.image_url && (
                  <div style={{ display: 'flex', gap: '12px', marginTop: '12px', alignItems: 'center' }}>
                    <img 
                      src={formData.image_url} 
                      alt="Banner Preview" 
                      style={{ width: '120px', height: '46px', borderRadius: '6px', objectFit: 'cover', border: '1px solid var(--border)' }} 
                    />
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '280px' }}>
                      <strong>R2 Location:</strong> {formData.image_url}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'center' }}>
                <div className="form-group">
                  <label>Sequence Priority / Sort Order (lower order renders first)</label>
                  <input 
                    type="number" 
                    name="sort_order" 
                    className="input-field"
                    value={formData.sort_order}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-actions" style={{ marginTop: '0.5rem' }}>
                {isEditingId && (
                  <button 
                    type="button" 
                    className="btn-secondary" 
                    onClick={clearForm}
                    style={{ marginRight: '8px' }}
                  >
                    Cancel Edit
                  </button>
                )}
                <button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={uploadingImage}
                >
                  <Save size={16} />
                  {isEditingId ? 'Update Banner Details' : 'Publish Banner'}
                </button>
              </div>
            </form>
          </div>

          {/* Banners List Table */}
          <div className="glass-card" style={{ flex: 1 }}>
            <h3 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ImageIcon size={20} color="#6366f1" />
              Active Promotion Banners ({banners.length})
            </h3>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem', gap: '12px' }}>
                <Loader2 size={32} className="animate-spin" color="#6366f1" />
                <span style={{ color: 'var(--text-muted)' }}>Loading active banners...</span>
              </div>
            ) : banners.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                No promotional banners have been uploaded yet. Publish your first banner above!
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}>Seq</th>
                      <th style={{ width: '130px' }}>Banner Preview</th>
                      <th>Title & Target Target</th>
                      <th style={{ width: '130px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {banners.map((banner, idx) => (
                      <tr key={banner.id} style={{ background: isEditingId === banner.id ? 'rgba(99,102,241,0.06)' : 'transparent' }}>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <button 
                              type="button" 
                              onClick={() => handleMove(idx, 'up')}
                              disabled={idx === 0}
                              style={{ color: idx === 0 ? 'rgba(255,255,255,0.1)' : 'var(--text-muted)', cursor: idx === 0 ? 'not-allowed' : 'pointer' }}
                            >
                              <ArrowUp size={14} />
                            </button>
                            <span style={{ fontSize: '11px', fontWeight: 'bold', margin: '2px 0' }}>{banner.sort_order}</span>
                            <button 
                              type="button" 
                              onClick={() => handleMove(idx, 'down')}
                              disabled={idx === banners.length - 1}
                              style={{ color: idx === banners.length - 1 ? 'rgba(255,255,255,0.1)' : 'var(--text-muted)', cursor: idx === banners.length - 1 ? 'not-allowed' : 'pointer' }}
                            >
                              <ArrowDown size={14} />
                            </button>
                          </div>
                        </td>
                        <td>
                          <img 
                            src={banner.image_url || DEFAULT_BANNER} 
                            alt="Banner Preview"
                            style={{ width: '110px', height: '42px', borderRadius: '6px', objectFit: 'cover', border: '1px solid var(--border)', background: '#1e293b' }}
                          />
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
                            <span style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>{banner.title || 'Untitled Banner'}</span>
                            {banner.redirect_url ? (
                              <span style={{ fontSize: '0.75rem', color: '#6366f1', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <LinkIcon size={11} /> {banner.redirect_url}
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No redirect link</span>
                            )}
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

        {/* Right Side - Live Mobile Phone Simulator */}
        <div className="manager-preview-section">
          <div style={{ marginBottom: '14px', width: '100%', textAlign: 'center' }}>
            <h4 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <ImageIcon size={16} color="#ea580c" />
              Live Mobile App Simulator
            </h4>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Displays live promo banner carousel in real-time</span>
          </div>

          <div className="phone-simulator">
            <div className="phone-notch"></div>
            <div className="phone-content" style={{ backgroundColor: '#ffffff', height: '100%', padding: '36px 14px 16px 14px', display: 'flex', flexDirection: 'column' }}>
              
              {/* Header Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '11px', backgroundColor: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '0.5px solid #fed7aa' }}>
                    <span style={{ fontSize: '11px' }}>🌸</span>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#ea580c' }}>MantraPuja</span>
                </div>
                <div style={{ width: '16px', height: '16px', borderRadius: '8px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '9px' }}>👤</span>
                </div>
              </div>

              {/* Title Section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <SacredTilak />
                  <span style={{ color: '#0f172a', fontSize: '14px', fontWeight: '800' }}>Life Problem Solution</span>
                </div>
                <span style={{ color: '#64748b', fontSize: '10px', paddingLeft: '14px' }}>Consult our expert priests to solve issues</span>
              </div>

              {/* Main Banner Carousel Stub inside phone simulator */}
              <div style={{ position: 'relative', width: '100%', height: '106px', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                {banners.length === 0 ? (
                  <div style={{ width: '100%', height: '100%', backgroundColor: '#f1f5f9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px', border: '1px dashed #cbd5e1', borderRadius: '14px' }}>
                    <ImageIcon size={18} color="#94a3b8" />
                    <span style={{ fontSize: '9.5px', color: '#94a3b8', fontWeight: 'bold' }}>No promo banners uploaded</span>
                  </div>
                ) : (() => {
                  const targetBanner = banners[simulatedIndex % banners.length];
                  return (
                    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                      <img 
                        src={targetBanner.image_url} 
                        alt="Mobile Mockup Banner"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      
                      {/* Gradient overlay */}
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(to top, rgba(0,0,0,0.4), transparent)'
                      }} />

                      {/* Display title overlay in banner if set */}
                      {targetBanner.title && (
                        <div style={{ position: 'absolute', bottom: '10px', left: '10px', right: '10px', textAlign: 'left' }}>
                          <span style={{ color: '#ffffff', fontSize: '9px', fontWeight: 'bold', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                            {targetBanner.title}
                          </span>
                        </div>
                      )}

                      {/* Slider Index indicators inside phone mockup */}
                      <div style={{ position: 'absolute', top: '8px', right: '8px', backgroundColor: 'rgba(0,0,0,0.5)', padding: '2px 5px', borderRadius: '8px', display: 'flex', alignItems: 'center' }}>
                        <span style={{ color: '#ffffff', fontSize: '7.5px', fontWeight: '800' }}>
                          {simulatedIndex + 1}/{banners.length}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Dots list stub */}
              {banners.length > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginTop: '10px', marginBottom: '14px' }}>
                  {banners.map((_, dotIdx) => (
                    <div 
                      key={dotIdx}
                      style={{
                        width: (simulatedIndex % banners.length) === dotIdx ? '10px' : '4px',
                        height: '4px',
                        borderRadius: '2px',
                        backgroundColor: (simulatedIndex % banners.length) === dotIdx ? '#ea580c' : '#cbd5e1',
                        transition: 'all 0.3s ease'
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Rest of mock app screen stub */}
              <div style={{ borderTop: '0.5px solid #f1f5f9', paddingTop: '10px', textAlign: 'left', flex: 1 }}>
                <span style={{ color: '#94a3b8', fontSize: '8px', fontWeight: '800', display: 'block', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Most Booked Combo Puja Sevas
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ flex: 1, backgroundColor: '#f8fafc', border: '0.5px solid #e2e8f0', borderRadius: '10px', padding: '6px' }}>
                    <div style={{ width: '100%', height: '40px', borderRadius: '6px', backgroundColor: '#e2e8f0', overflow: 'hidden' }}>
                      <img src="https://images.unsplash.com/photo-1602631985686-1bb0e6a8696e?auto=format&fit=crop&w=120&q=80" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <span style={{ fontSize: '8px', fontWeight: 'bold', display: 'block', marginTop: '4px', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Rudrabhishek Puja</span>
                  </div>
                  <div style={{ flex: 1, backgroundColor: '#f8fafc', border: '0.5px solid #e2e8f0', borderRadius: '10px', padding: '6px' }}>
                    <div style={{ width: '100%', height: '40px', borderRadius: '6px', backgroundColor: '#e2e8f0', overflow: 'hidden' }}>
                      <img src="https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=120&q=80" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <span style={{ fontSize: '8px', fontWeight: 'bold', display: 'block', marginTop: '4px', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Maha Laxmi Yajna</span>
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
