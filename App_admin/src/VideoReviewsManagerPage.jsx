import { useState, useEffect, useRef } from 'react';
import { 
  Edit3, Trash2, Check, AlertTriangle, Upload, Loader2, Save, Plus, X, 
  ArrowLeft, Star, ArrowUp, ArrowDown, Video, Image as ImageIcon, MessageSquare, Play
} from 'lucide-react';
import { supabase } from './lib/supabase';
import { uploadToR2 } from './lib/r2';

const DEFAULT_THUMBNAIL = 'https://images.unsplash.com/photo-1609137144814-6c3614275f7e?auto=format&fit=crop&w=600&q=80';

// --- Subcomponent: Sacred Tilak for Devotional Premium Vibe --- //
const SacredTilak = () => (
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

// --- High-Fidelity Video Review Card Mock for Phone Simulator --- //
const VideoReviewCardMock = ({ data }) => {
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
        alt={data.devotee_name || 'Review'} 
        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
      />

      {/* Saffron and Dark Gradient Overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.4) 60%, rgba(0,0,0,0.85))'
      }} />

      {/* Floating Video Duration Tag */}
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

      {/* Centered Glowing Saffron Play Button */}
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

      {/* Devotee Info overlay at the bottom */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '10px 8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        textAlign: 'left'
      }}>
        {/* Rating & Location */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '1px' }}>
          <div style={{
            backgroundColor: '#d1fae5',
            padding: '1px 4px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '2px'
          }}>
            <Star size={7} fill="#065f46" stroke="none" />
            <span style={{ fontSize: '8px', fontWeight: 'bold', color: '#065f46' }}>
              {data.rating || '5.0'}
            </span>
          </div>
          <span style={{ color: '#e2e8f0', fontSize: '8.5px', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80px' }}>
            {data.location || 'India'}
          </span>
        </div>

        {/* Devotee Name */}
        <span style={{ color: 'white', fontSize: '11px', fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {data.devotee_name || 'Blessed Devotee'}
        </span>

        {/* Blessed Puja */}
        <span style={{ color: '#fdba74', fontSize: '9px', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {data.puja_name || 'Vedic Pooja'}
        </span>
      </div>
    </div>
  );
};

export default function VideoReviewsManagerPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Form states
  const [isEditingId, setIsEditingId] = useState(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);

  const initialFormState = {
    devotee_name: '',
    location: '',
    puja_name: '',
    rating: '5.0',
    duration: '1:00',
    video_url: '',
    thumbnail_url: '',
    sort_order: 0
  };

  const [formData, setFormData] = useState(initialFormState);

  // File Refs
  const videoInputRef = useRef(null);
  const thumbnailInputRef = useRef(null);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const { data, error: fetchErr } = await supabase
        .from('video_reviews')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (fetchErr) throw fetchErr;
      setReviews(data || []);
    } catch (err) {
      console.error('Error fetching video reviews:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
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
      showMessage('Uploading video review to Cloudflare R2...');
      const publicUrl = await uploadToR2(file, 'video-reviews/videos');
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
      showMessage('Uploading custom thumbnail to Cloudflare R2...');
      const publicUrl = await uploadToR2(file, 'video-reviews/thumbnails');
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
    if (!formData.devotee_name.trim()) return showMessage('Devotee Name is required.', true);
    if (!formData.location.trim()) return showMessage('Location is required.', true);
    if (!formData.puja_name.trim()) return showMessage('Puja Name is required.', true);
    if (!formData.video_url) return showMessage('A customer video file must be uploaded.', true);

    const payload = {
      devotee_name: formData.devotee_name.trim(),
      location: formData.location.trim(),
      puja_name: formData.puja_name.trim(),
      rating: parseFloat(formData.rating) || 5.0,
      duration: formData.duration.trim() || '1:00',
      video_url: formData.video_url,
      thumbnail_url: formData.thumbnail_url || null,
      sort_order: parseInt(formData.sort_order) || 0
    };

    try {
      if (isEditingId) {
        // Edit Mode
        const { error: updateErr } = await supabase
          .from('video_reviews')
          .update(payload)
          .eq('id', isEditingId);

        if (updateErr) throw updateErr;
        showMessage('Video Review updated successfully!');
      } else {
        // Create Mode
        const { error: insertErr } = await supabase
          .from('video_reviews')
          .insert([payload]);

        if (insertErr) throw insertErr;
        showMessage('New Video Review added successfully!');
      }

      // Reset form
      setFormData(initialFormState);
      setIsEditingId(null);
      if (videoInputRef.current) videoInputRef.current.value = '';
      if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';
      fetchReviews();
    } catch (err) {
      console.error('Form submit error:', err);
      showMessage(err.message, true);
    }
  };

  const handleEdit = (review) => {
    setIsEditingId(review.id);
    setFormData({
      devotee_name: review.devotee_name,
      location: review.location,
      puja_name: review.puja_name,
      rating: review.rating.toString(),
      duration: review.duration,
      video_url: review.video_url,
      thumbnail_url: review.thumbnail_url || '',
      sort_order: review.sort_order
    });
    // Scroll form into view
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this customer video review?')) return;

    try {
      const { error: delErr } = await supabase
        .from('video_reviews')
        .delete()
        .eq('id', id);

      if (delErr) throw delErr;
      showMessage('Video Review deleted successfully.');
      fetchReviews();
    } catch (err) {
      console.error('Delete error:', err);
      showMessage(delErr.message, true);
    }
  };

  const handleMove = async (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= reviews.length) return;

    const list = [...reviews];
    const target = list[index];
    const currentSort = target.sort_order;
    const swapWith = list[newIndex];
    const swapSort = swapWith.sort_order;

    // Swap sorting order in local and database
    try {
      const { error: err1 } = await supabase
        .from('video_reviews')
        .update({ sort_order: swapSort })
        .eq('id', target.id);
      
      const { error: err2 } = await supabase
        .from('video_reviews')
        .update({ sort_order: currentSort })
        .eq('id', swapWith.id);

      if (err1 || err2) throw err1 || err2;
      fetchReviews();
    } catch (err) {
      console.error('Reordering failed:', err);
      showMessage('Failed to swap video order.', true);
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
        <h1 className="gradient-text">Devotee Video Reviews</h1>
        <p>Manage customer video testimonials, upload review clips to R2, and sync metadata in Supabase.</p>
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
              <MessageSquare size={20} color="#6366f1" />
              {isEditingId ? 'Edit Video Review Details' : 'Add New Customer Video Review'}
            </h3>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Devotee Name *</label>
                  <input 
                    type="text" 
                    name="devotee_name" 
                    placeholder="e.g. Priyesh Patel or Ramesh & Family"
                    className="input-field"
                    value={formData.devotee_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Location / City *</label>
                  <input 
                    type="text" 
                    name="location" 
                    placeholder="e.g. Ahmedabad or Delhi NCR"
                    className="input-field"
                    value={formData.location}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Blessed Puja / Tag *</label>
                  <input 
                    type="text" 
                    name="puja_name" 
                    placeholder="e.g. Ganesh Puja Special"
                    className="input-field"
                    value={formData.puja_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Rating *</label>
                  <select 
                    name="rating" 
                    className="input-field"
                    value={formData.rating}
                    onChange={handleInputChange}
                  >
                    <option value="5.0">★★★★★ (5.0)</option>
                    <option value="4.9">★★★★☆ (4.9)</option>
                    <option value="4.8">★★★★☆ (4.8)</option>
                    <option value="4.7">★★★★☆ (4.7)</option>
                    <option value="4.6">★★★★☆ (4.6)</option>
                    <option value="4.5">★★★★☆ (4.5)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Video Duration</label>
                  <input 
                    type="text" 
                    name="duration" 
                    placeholder="e.g. 1:45"
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
                  Devotee Video File Upload *
                </label>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Select a video file (.mp4, .mov, or WebM) of the customer review to upload securely to Cloudflare R2.
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
                    {formData.video_url ? 'Change Video File' : 'Choose Video Review File'}
                  </button>
                  {formData.video_url && (
                    <span style={{ fontSize: '0.8rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Check size={14} /> Video uploaded and linked.
                    </span>
                  )}
                </div>
                {formData.video_url && (
                  <div style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--glass)', padding: '6px 10px', borderRadius: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <strong>R2 URL:</strong> {formData.video_url}
                  </div>
                )}
              </div>

              {/* Optional R2 Thumbnail Upload */}
              <div className="form-group" style={{ border: '1px dashed var(--border)', borderRadius: 'var(--radius)', padding: '1.25rem', background: 'rgba(255,255,255,0.01)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
                  <ImageIcon size={16} color="#6366f1" />
                  Custom Video Thumbnail (Optional)
                </label>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Provide a customized thumbnail image file. If left empty, a standard video preview placeholder will default.
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
                      <Check size={14} /> Custom thumbnail active.
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
                  {isEditingId ? 'Update Video Review' : 'Publish Video Review'}
                </button>
              </div>
            </form>
          </div>

          {/* Active Reviews Table List */}
          <div className="glass-card" style={{ flex: 1 }}>
            <h3 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Video size={20} color="#6366f1" />
              Active Devotee Reviews ({reviews.length})
            </h3>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem', gap: '12px' }}>
                <Loader2 size={32} className="animate-spin" color="#6366f1" />
                <span style={{ color: 'var(--text-muted)' }}>Loading active reviews...</span>
              </div>
            ) : reviews.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                No video reviews have been added yet. Use the form above to post your first video testimonial!
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}>Seq</th>
                      <th style={{ width: '60px' }}>Thumbnail</th>
                      <th>Devotee Details</th>
                      <th>Puja / Tag</th>
                      <th>Length</th>
                      <th>Rating</th>
                      <th style={{ width: '130px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviews.map((review, idx) => (
                      <tr key={review.id} style={{ background: isEditingId === review.id ? 'rgba(99,102,241,0.06)' : 'transparent' }}>
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
                            <span style={{ fontSize: '11px', fontWeight: 'bold', margin: '2px 0' }}>{review.sort_order}</span>
                            <button 
                              type="button" 
                              onClick={() => handleMove(idx, 'down')}
                              disabled={idx === reviews.length - 1}
                              style={{ color: idx === reviews.length - 1 ? 'rgba(255,255,255,0.1)' : 'var(--text-muted)', cursor: idx === reviews.length - 1 ? 'not-allowed' : 'pointer' }}
                            >
                              <ArrowDown size={14} />
                            </button>
                          </div>
                        </td>
                        <td>
                          <img 
                            src={review.thumbnail_url || DEFAULT_THUMBNAIL} 
                            alt="Mockup Thumbnail"
                            style={{ width: '42px', height: '60px', borderRadius: '6px', objectFit: 'cover', border: '1px solid var(--border)', background: '#1e293b' }}
                          />
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>{review.devotee_name}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>📍 {review.location}</span>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.85rem', color: '#fdba74', fontWeight: '600' }}>{review.puja_name}</span>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>⏱️ {review.duration}</span>
                        </td>
                        <td>
                          <span style={{ color: '#fbbf24', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.85rem' }}>
                            ★ {review.rating}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            <button 
                              type="button"
                              className="action-btn-primary"
                              onClick={() => handleEdit(review)}
                              style={{ padding: '0.4rem 0.8rem' }}
                            >
                              <Edit3 size={13} /> Edit
                            </button>
                            <button 
                              type="button"
                              className="action-btn-danger"
                              onClick={() => handleDelete(review.id)}
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
              <Video size={16} color="#f97316" />
              Live Mobile App Simulator
            </h4>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Renders active video carousel reviews in real-time</span>
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

              {/* Devotee reviews mock header inside simulator */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <SacredTilak />
                  <span style={{ color: '#0f172a', fontSize: '14px', fontWeight: '800' }}>Devotee Video Reviews</span>
                </div>
                <span style={{ color: '#64748b', fontSize: '10px', fontWeight: '500', paddingLeft: '14px' }}>
                  Listen to the divine experiences of our blessed families
                </span>
              </div>

              {/* Devotee Reviews scrolling container */}
              <div style={{
                display: 'flex',
                overflowX: 'auto',
                padding: '6px 0 16px 0',
                scrollBehavior: 'smooth',
                width: '100%'
              }}>
                {reviews.length === 0 ? (
                  <div style={{ width: '100%', textAlign: 'center', padding: '24px 0', color: '#94a3b8', fontSize: '11px', border: '1px dashed #cbd5e1', borderRadius: '12px' }}>
                    No reviews active. Draft one on the left panel!
                  </div>
                ) : (
                  reviews.map((item) => (
                    <VideoReviewCardMock key={item.id} data={item} />
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
