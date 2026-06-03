import { useState, useEffect, useRef } from 'react';
import { 
  Edit3, Trash2, Check, AlertTriangle, Upload, Loader2, Save, Plus, X, 
  ArrowLeft, ArrowUp, ArrowDown, Video, Image as ImageIcon, Play
} from 'lucide-react';
import { supabase } from './lib/supabase';
import { uploadToR2 } from './lib/r2';

const DEFAULT_THUMBNAIL = 'https://images.unsplash.com/photo-1608976328321-2f9b229f3e08?auto=format&fit=crop&w=600&q=80';

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

// --- High-Fidelity Pandit Video Card Mock for Phone Simulator --- //
const PanditVideoCardMock = ({ data }) => {
  const displayThumbnail = data.thumbnail_url || DEFAULT_THUMBNAIL;
  return (
    <div style={{
      width: '140px',
      height: '220px',
      borderRadius: '16px',
      overflow: 'hidden',
      position: 'relative',
      marginRight: '12px',
      flexShrink: 0,
      boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
      backgroundColor: '#1e293b'
    }}>
      {/* Background Image / Thumbnail */}
      <img 
        src={displayThumbnail} 
        alt={data.pandit_name || 'Pandit Video'} 
        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
      />

      {/* Saffron and Dark Gradient Overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.85))'
      }} />

      {/* Floating Duration Tag */}
      <div style={{
        position: 'absolute',
        top: '8px',
        right: '8px',
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: '2px 6px',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '3px'
      }}>
        <Video size={8} color="white" />
        <span style={{ color: 'white', fontSize: '9px', fontWeight: 'bold' }}>
          {data.duration || '1:00'}
        </span>
      </div>

      {/* Centered Glowing Play Button */}
      <div style={{
        position: 'absolute',
        top: '40%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: '#ea580c',
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 0 12px rgba(234, 88, 12, 0.6)',
        border: '1.5px solid rgba(255,255,255,0.3)'
      }}>
        <Play size={12} fill="white" stroke="none" style={{ marginLeft: '2px' }} />
      </div>

      {/* Pandit Info overlay at the bottom */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '10px 8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '1px',
        textAlign: 'left'
      }}>
        {/* Temple Name / Location */}
        <span style={{ color: '#cbd5e1', fontSize: '8.5px', fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {data.temple || 'Shrine Temple'}
        </span>

        {/* Pandit Name */}
        <span style={{ color: 'white', fontSize: '11px', fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {data.pandit_name || 'Vedic Pandit'}
        </span>

        {/* Ritual Name */}
        <span style={{ color: '#fdba74', fontSize: '9px', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {data.ritual_name || 'Sacred Seva'}
        </span>
      </div>
    </div>
  );
};

export default function PanditVideosManagerPage() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Form states
  const [isEditingId, setIsEditingId] = useState(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);

  const initialFormState = {
    pandit_name: '',
    temple: '',
    ritual_name: '',
    duration: '5:00',
    video_url: '',
    thumbnail_url: '',
    sort_order: 0
  };

  const [formData, setFormData] = useState(initialFormState);

  // File Refs
  const videoInputRef = useRef(null);
  const thumbnailInputRef = useRef(null);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const { data, error: fetchErr } = await supabase
        .from('pandit_videos')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (fetchErr) throw fetchErr;
      setVideos(data || []);
    } catch (err) {
      console.error('Error fetching pandit videos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
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
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      showMessage('Please select a valid video file.', true);
      return;
    }

    setUploadingVideo(true);
    try {
      showMessage('Uploading pandit video review to Cloudflare R2...');
      const publicUrl = await uploadToR2(file, 'pandit-videos/videos');
      setFormData(prev => ({
        ...prev,
        video_url: publicUrl
      }));
      showMessage('Video uploaded successfully!');
    } catch (err) {
      console.error('Video upload error:', err);
      showMessage(`Video upload failed: ${err.message}`, true);
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleThumbnailUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showMessage('Please select a valid image file.', true);
      return;
    }

    setUploadingThumbnail(true);
    try {
      showMessage('Uploading thumbnail to Cloudflare R2...');
      const publicUrl = await uploadToR2(file, 'pandit-videos/thumbnails');
      setFormData(prev => ({
        ...prev,
        thumbnail_url: publicUrl
      }));
      showMessage('Thumbnail uploaded successfully!');
    } catch (err) {
      console.error('Thumbnail upload error:', err);
      showMessage(`Thumbnail upload failed: ${err.message}`, true);
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.pandit_name.trim()) return showMessage('Acharya/Pandit Name is required.', true);
    if (!formData.temple.trim()) return showMessage('Temple/Location is required.', true);
    if (!formData.ritual_name.trim()) return showMessage('Ritual/Pooja Name is required.', true);
    if (!formData.video_url) return showMessage('A ritual video file must be uploaded.', true);

    const payload = {
      pandit_name: formData.pandit_name.trim(),
      temple: formData.temple.trim(),
      ritual_name: formData.ritual_name.trim(),
      duration: formData.duration.trim() || '5:00',
      video_url: formData.video_url,
      thumbnail_url: formData.thumbnail_url || null,
      sort_order: parseInt(formData.sort_order) || 0
    };

    try {
      if (isEditingId) {
        // Edit Mode
        const { error: updateErr } = await supabase
          .from('pandit_videos')
          .update(payload)
          .eq('id', isEditingId);

        if (updateErr) throw updateErr;
        showMessage('Pandit Video updated successfully!');
      } else {
        // Create Mode
        const { error: insertErr } = await supabase
          .from('pandit_videos')
          .insert([payload]);

        if (insertErr) throw insertErr;
        showMessage('New Pandit Video added successfully!');
      }

      // Reset form
      setFormData(initialFormState);
      setIsEditingId(null);
      if (videoInputRef.current) videoInputRef.current.value = '';
      if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';
      fetchVideos();
    } catch (err) {
      console.error('Form submit error:', err);
      showMessage(err.message, true);
    }
  };

  const handleEdit = (video) => {
    setIsEditingId(video.id);
    setFormData({
      pandit_name: video.pandit_name,
      temple: video.temple,
      ritual_name: video.ritual_name,
      duration: video.duration,
      video_url: video.video_url,
      thumbnail_url: video.thumbnail_url || '',
      sort_order: video.sort_order
    });
    // Scroll form into view
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this pandit video recording?')) return;

    try {
      const { error: delErr } = await supabase
        .from('pandit_videos')
        .delete()
        .eq('id', id);

      if (delErr) throw delErr;
      showMessage('Pandit Video deleted successfully.');
      fetchVideos();
    } catch (err) {
      console.error('Delete error:', err);
      showMessage(delErr.message, true);
    }
  };

  const handleMove = async (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= videos.length) return;

    const list = [...videos];
    const target = list[index];
    const currentSort = target.sort_order;
    const swapWith = list[newIndex];
    const swapSort = swapWith.sort_order;

    // Swap sorting order in database
    try {
      const { error: err1 } = await supabase
        .from('pandit_videos')
        .update({ sort_order: swapSort })
        .eq('id', target.id);
      
      const { error: err2 } = await supabase
        .from('pandit_videos')
        .update({ sort_order: currentSort })
        .eq('id', swapWith.id);

      if (err1 || err2) throw err1 || err2;
      fetchVideos();
    } catch (err) {
      console.error('Reordering failed:', err);
      showMessage('Failed to swap video sequence.', true);
    }
  };

  const clearForm = () => {
    setFormData(initialFormState);
    setIsEditingId(null);
    if (videoInputRef.current) videoInputRef.current.value = '';
    if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';
  };

  return (
    <div className="page-content" style={{ fontFamily: '"Outfit", sans-serif' }}>
      <div className="page-header">
        <h1 className="gradient-text">Pandit Videos Manager</h1>
        <p>Manage ritual video clips by certified Acharyas/Pandits, upload to Cloudflare R2, and sync in Supabase.</p>
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
              <Video size={20} color="#6366f1" />
              {isEditingId ? 'Edit Pandit Video Details' : 'Add New Pandit Ritual Video'}
            </h3>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Acharya / Pandit Name *</label>
                  <input 
                    type="text" 
                    name="pandit_name" 
                    placeholder="e.g. Acharya Ramanand Shastri"
                    className="input-field"
                    value={formData.pandit_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Sacred Temple / Shrine Location *</label>
                  <input 
                    type="text" 
                    name="temple" 
                    placeholder="e.g. Kashi Vishwanath, Varanasi"
                    className="input-field"
                    value={formData.temple}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Vedic Ritual / Pooja Name *</label>
                  <input 
                    type="text" 
                    name="ritual_name" 
                    placeholder="e.g. Maha Rudrabhishek Havan"
                    className="input-field"
                    value={formData.ritual_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Duration / Length</label>
                  <input 
                    type="text" 
                    name="duration" 
                    placeholder="e.g. 5:20"
                    className="input-field"
                    value={formData.duration}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {/* R2 Direct Video File Upload */}
              <div className="form-group" style={{ border: '1px dashed var(--border)', borderRadius: 'var(--radius)', padding: '1.25rem', background: 'rgba(255,255,255,0.01)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
                  <Video size={16} color="#6366f1" />
                  Ritual Video File Upload *
                </label>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Select a video file of the ritual perform to upload securely to Cloudflare R2 bucket.
                </p>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <input 
                    type="file" 
                    accept="video/*" 
                    ref={videoInputRef}
                    onChange={handleVideoUpload}
                    style={{ display: 'none' }}
                  />
                  <button 
                    type="button" 
                    className="btn-secondary" 
                    disabled={uploadingVideo}
                    onClick={() => videoInputRef.current?.click()}
                    style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}
                  >
                    {uploadingVideo ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                    {formData.video_url ? 'Change Video File' : 'Choose Video File'}
                  </button>
                  {formData.video_url && (
                    <span style={{ fontSize: '0.8rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Check size={14} /> Ritual video uploaded.
                    </span>
                  )}
                </div>
                {formData.video_url && (
                  <div style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--glass)', padding: '6px 10px', borderRadius: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <strong>R2 URL:</strong> {formData.video_url}
                  </div>
                )}
              </div>

              {/* R2 Thumbnail Upload */}
              <div className="form-group" style={{ border: '1px dashed var(--border)', borderRadius: 'var(--radius)', padding: '1.25rem', background: 'rgba(255,255,255,0.01)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
                  <ImageIcon size={16} color="#6366f1" />
                  Custom Video Thumbnail (Optional)
                </label>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Provide an image thumbnail. If empty, a beautiful default shrine banner will fallback on screens.
                </p>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <input 
                    type="file" 
                    accept="image/*" 
                    ref={thumbnailInputRef}
                    onChange={handleThumbnailUpload}
                    style={{ display: 'none' }}
                  />
                  <button 
                    type="button" 
                    className="btn-secondary" 
                    disabled={uploadingThumbnail}
                    onClick={() => thumbnailInputRef.current?.click()}
                    style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}
                  >
                    {uploadingThumbnail ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                    {formData.thumbnail_url ? 'Change Thumbnail' : 'Choose Thumbnail Image'}
                  </button>
                  {formData.thumbnail_url && (
                    <span style={{ fontSize: '0.8rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Check size={14} /> Thumbnail active.
                    </span>
                  )}
                  {formData.thumbnail_url && (
                    <button 
                      type="button"
                      style={{ color: '#ef4444', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '2px', cursor: 'pointer' }}
                      onClick={() => setFormData(prev => ({ ...prev, thumbnail_url: '' }))}
                    >
                      <X size={12} /> Clear
                    </button>
                  )}
                </div>
                {formData.thumbnail_url && (
                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px', alignItems: 'center' }}>
                    <img 
                      src={formData.thumbnail_url} 
                      alt="Thumbnail Preview" 
                      style={{ width: '60px', height: '60px', borderRadius: '6px', objectFit: 'cover', border: '1px solid var(--border)' }} 
                    />
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px' }}>
                      <strong>R2 Image:</strong> {formData.thumbnail_url}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'center' }}>
                <div className="form-group">
                  <label>Sorting Priority Order (higher shows up later)</label>
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
                  disabled={uploadingVideo || uploadingThumbnail}
                >
                  <Save size={16} />
                  {isEditingId ? 'Update Pandit Video' : 'Publish Pandit Video'}
                </button>
              </div>
            </form>
          </div>

          {/* Active Videos Table List */}
          <div className="glass-card" style={{ flex: 1 }}>
            <h3 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Video size={20} color="#6366f1" />
              Active Pandit Videos ({videos.length})
            </h3>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem', gap: '12px' }}>
                <Loader2 size={32} className="animate-spin" color="#6366f1" />
                <span style={{ color: 'var(--text-muted)' }}>Loading active videos...</span>
              </div>
            ) : videos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                No ritual videos have been added yet. Use the form above to post your first pandit video recording!
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}>Seq</th>
                      <th style={{ width: '60px' }}>Thumbnail</th>
                      <th>Acharya & Temple</th>
                      <th>Ritual / Seva Name</th>
                      <th>Length</th>
                      <th style={{ width: '130px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {videos.map((video, idx) => (
                      <tr key={video.id} style={{ background: isEditingId === video.id ? 'rgba(99,102,241,0.06)' : 'transparent' }}>
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
                            <span style={{ fontSize: '11px', fontWeight: 'bold', margin: '2px 0' }}>{video.sort_order}</span>
                            <button 
                              type="button" 
                              onClick={() => handleMove(idx, 'down')}
                              disabled={idx === videos.length - 1}
                              style={{ color: idx === videos.length - 1 ? 'rgba(255,255,255,0.1)' : 'var(--text-muted)', cursor: idx === videos.length - 1 ? 'not-allowed' : 'pointer' }}
                            >
                              <ArrowDown size={14} />
                            </button>
                          </div>
                        </td>
                        <td>
                          <img 
                            src={video.thumbnail_url || DEFAULT_THUMBNAIL} 
                            alt="Mockup Thumbnail"
                            style={{ width: '42px', height: '60px', borderRadius: '6px', objectFit: 'cover', border: '1px solid var(--border)', background: '#1e293b' }}
                          />
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>{video.pandit_name}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>📍 {video.temple}</span>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.85rem', color: '#fdba74', fontWeight: '600' }}>{video.ritual_name}</span>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>⏱️ {video.duration}</span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            <button 
                              type="button"
                              className="action-btn-primary"
                              onClick={() => handleEdit(video)}
                              style={{ padding: '0.4rem 0.8rem' }}
                            >
                              <Edit3 size={13} /> Edit
                            </button>
                            <button 
                              type="button"
                              className="action-btn-danger"
                              onClick={() => handleDelete(video.id)}
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
              <Video size={16} color="#ea580c" />
              Live Mobile App Simulator
            </h4>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Renders certified pandit videos in real-time</span>
          </div>

          <div className="phone-simulator">
            <div className="phone-notch"></div>
            <div className="phone-content" style={{ backgroundColor: '#ffffff', height: '100%', padding: '36px 14px 16px 14px' }}>
              
              {/* Header Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '11px', backgroundColor: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '0.5px solid #fed7aa' }}>
                    <span style={{ fontSize: '11px' }}>🌸</span>
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#ea580c', fontFamily: '"Outfit", sans-serif' }}>MantraPuja</span>
                </div>
                <div style={{ width: '16px', height: '16px', borderRadius: '8px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '9px' }}>👤</span>
                </div>
              </div>

              {/* Pandit videos mock header inside simulator */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <SacredTilak />
                  <span style={{ color: '#0f172a', fontSize: '14px', fontWeight: '800' }}>Puja Videos by Our Pandits</span>
                </div>
                <span style={{ color: '#64748b', fontSize: '10px', fontWeight: '500', paddingLeft: '14px' }}>
                  Experience the divine energy of rituals performed by our certified acharyas
                </span>
              </div>

              {/* Pandit Videos scrolling container */}
              <div style={{
                display: 'flex',
                overflowX: 'auto',
                padding: '6px 0 16px 0',
                scrollBehavior: 'smooth',
                width: '100%'
              }}>
                {videos.length === 0 ? (
                  <div style={{ width: '100%', textAlign: 'center', padding: '24px 0', color: '#94a3b8', fontSize: '11px', border: '1px dashed #cbd5e1', borderRadius: '12px' }}>
                    No videos active. Draft one on the left panel!
                  </div>
                ) : (
                  videos.map((item) => (
                    <PanditVideoCardMock key={item.id} data={item} />
                  ))
                )}
              </div>

              {/* Rest of mock app screen stub to make it look premium */}
              <div style={{ borderTop: '0.5px solid #f1f5f9', paddingTop: '12px', textAlign: 'left' }}>
                <span style={{ color: '#94a3b8', fontSize: '9px', fontWeight: '800', display: 'block', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '8px' }}>
                  DAILY VEDIC UPDATES
                </span>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', backgroundColor: '#fffbeb', border: '1px solid #fef3c7', padding: '8px 10px', borderRadius: '12px' }}>
                  <span style={{ fontSize: '16px' }}>☀️</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#1e293b' }}>Surya Dev Panchang Special</span>
                    <span style={{ fontSize: '9px', color: '#ea580c', fontWeight: '600' }}>Active Muhurat: 11:45 AM - 12:35 PM</span>
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
