import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Edit3, Trash2, Bell, Sparkles, Save, Check, X, ArrowLeft,
  RefreshCw, Loader2, Upload, AlertTriangle, Image as ImageIcon, Coins, Globe, Send
} from 'lucide-react';
import { supabase } from './lib/supabase';
import { uploadToR2 } from './lib/r2';

export default function PushNotificationsManagerPage() {
  const [notifications, setNotifications] = useState([]);
  const [vratPool, setVratPool] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Form states
  const [isEditingId, setIsEditingId] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const imageInputRef = useRef(null);

  // Set default scheduled date/time to today and current hour
  const getTodayDateString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const getNextHourTimeString = () => {
    const today = new Date();
    const nextHour = (today.getHours() + 1) % 24;
    return `${String(nextHour).padStart(2, '0')}:00`;
  };

  const initialFormState = {
    title: '',
    body: '',
    image_url: '',
    notification_type: 'generic',
    target_vrat_id: '',
    coin_amount: 50,
    scheduled_date: getTodayDateString(),
    scheduled_time: getNextHourTimeString()
  };

  const [formData, setFormData] = useState(initialFormState);

  // Fetch scheduled notifications
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data, error: fetchErr } = await supabase
        .from('push_notifications')
        .select('*')
        .order('scheduled_date', { ascending: false })
        .order('scheduled_time', { ascending: false });

      if (fetchErr) throw fetchErr;
      setNotifications(data || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to load notifications: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Vrats pool for targeted notification link
  const fetchVratPool = async () => {
    try {
      const { data, error: vratErr } = await supabase
        .from('spiritual_calendar')
        .select('date_key, title, deity_label')
        .order('date_key', { ascending: true });

      if (vratErr) throw vratErr;
      setVratPool(data || []);
    } catch (err) {
      console.error('Error loading vrats list:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchVratPool();
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

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showMessage('Please select a valid image file.', true);
      return;
    }

    setUploadingImage(true);
    try {
      showMessage('Uploading image to Cloudflare R2...');
      const publicUrl = await uploadToR2(file, 'notifications');
      setFormData(prev => ({
        ...prev,
        image_url: publicUrl
      }));
      showMessage('Notification banner image uploaded successfully!');
    } catch (err) {
      console.error('Image upload error:', err);
      showMessage(`Image upload failed: ${err.message}`, true);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return showMessage('Notification Title is required.', true);
    if (!formData.body.trim()) return showMessage('Notification Body description is required.', true);
    if (!formData.scheduled_date) return showMessage('A scheduled date is required.', true);
    if (!formData.scheduled_time) return showMessage('A scheduled time is required.', true);

    const payload = {
      title: formData.title.trim(),
      body: formData.body.trim(),
      image_url: formData.image_url || null,
      notification_type: formData.notification_type,
      target_vrat_id: formData.notification_type === 'vrat' && formData.target_vrat_id ? formData.target_vrat_id : null,
      coin_amount: formData.notification_type === 'coins' ? parseInt(formData.coin_amount) || 0 : null,
      scheduled_date: formData.scheduled_date,
      scheduled_time: formData.scheduled_time + (formData.scheduled_time.split(':').length === 2 ? ':00' : ''),
      status: 'pending'
    };

    setSaving(true);
    try {
      if (isEditingId) {
        // Edit Mode
        const { error: updateErr } = await supabase
          .from('push_notifications')
          .update(payload)
          .eq('id', isEditingId);

        if (updateErr) throw updateErr;
        showMessage('Notification schedule updated successfully!');
      } else {
        // Create Mode
        const { error: insertErr } = await supabase
          .from('push_notifications')
          .insert([payload]);

        if (insertErr) throw insertErr;
        showMessage('New push notification scheduled successfully!');
      }

      clearForm();
      fetchNotifications();
    } catch (err) {
      console.error('Save notification error:', err);
      showMessage(err.message, true);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (noti) => {
    setIsEditingId(noti.id);
    
    // Format scheduled_time into HH:MM for input fields
    const formattedTime = noti.scheduled_time ? noti.scheduled_time.substring(0, 5) : '';

    setFormData({
      title: noti.title,
      body: noti.body,
      image_url: noti.image_url || '',
      notification_type: noti.notification_type,
      target_vrat_id: noti.target_vrat_id || '',
      coin_amount: noti.coin_amount || 50,
      scheduled_date: noti.scheduled_date,
      scheduled_time: formattedTime
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this scheduled notification?')) return;

    try {
      const { error: delErr } = await supabase
        .from('push_notifications')
        .delete()
        .eq('id', id);

      if (delErr) throw delErr;
      showMessage('Notification deleted successfully.');
      fetchNotifications();
    } catch (err) {
      console.error('Delete error:', err);
      showMessage(err.message, true);
    }
  };

  const clearForm = () => {
    setFormData(initialFormState);
    setIsEditingId(null);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  // Convert time to 12 Hour format for display
  const getFormattedTime = (timeStr) => {
    if (!timeStr) return '';
    try {
      const parts = timeStr.split(':');
      const hour = parseInt(parts[0]);
      const min = parts[1];
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const formattedHour = hour % 12 || 12;
      return `${formattedHour}:${min} ${ampm}`;
    } catch (e) {
      return timeStr;
    }
  };

  return (
    <div className="page-content" style={{ fontFamily: '"Outfit", sans-serif' }}>
      <div className="page-header">
        <div>
          <h1 className="gradient-text">Push Notifications Scheduler</h1>
          <p>Create, schedule, edit and manage global notifications, vrat/fast reminders, or coin alerts.</p>
        </div>
        {!isEditingId && (
          <button className="primary-btn flex items-center gap-2" onClick={clearForm}>
            <Plus size={16} />
            <span>Create New Schedule</span>
          </button>
        )}
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
        
        {/* Left Side: CRUD Form & History */}
        <div className="manager-form-section" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Form */}
          <div className="glass-card">
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Bell size={20} color="#FF9500" />
              {isEditingId ? 'Edit Push Notification' : 'Schedule New Push Notification'}
            </h3>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="input-grid-2">
                <div className="form-group">
                  <label>Notification Type / Target Group *</label>
                  <select 
                    name="notification_type"
                    className="input-field"
                    value={formData.notification_type}
                    onChange={handleInputChange}
                  >
                    <option value="generic">Generic Notification 📢</option>
                    <option value="global">Global Push Alert 🌐</option>
                    <option value="vrat">Spiritual Vrat Reminder 📅</option>
                    <option value="coins">Reward Coins Announcement 💰</option>
                  </select>
                </div>

                {formData.notification_type === 'vrat' && (
                  <div className="form-group">
                    <label>Select Vrat/Fast Reference *</label>
                    <select
                      name="target_vrat_id"
                      className="input-field"
                      value={formData.target_vrat_id}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">-- Choose Vrat from Calendar --</option>
                      {vratPool.map((vrat) => (
                        <option key={vrat.date_key} value={vrat.date_key}>
                          {vrat.title} ({vrat.date_key})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {formData.notification_type === 'coins' && (
                  <div className="form-group">
                    <label>Bonus Coins Reward Amount *</label>
                    <input
                      type="number"
                      name="coin_amount"
                      className="input-field"
                      value={formData.coin_amount}
                      onChange={handleInputChange}
                      min="1"
                      required
                    />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Notification Title *</label>
                <input 
                  type="text" 
                  name="title" 
                  placeholder="e.g. Cleanse your soul on Nirjala Ekadashi today!"
                  className="input-field"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Notification Body / Message Description *</label>
                <textarea 
                  name="body" 
                  placeholder="e.g. Nirjala Ekadashi fast is today. Perform Vishnu Puja, read details, and book your personal Homa to unlock ultimate benefits."
                  className="input-field"
                  value={formData.body}
                  onChange={handleInputChange}
                  rows={3}
                  required
                />
              </div>

              {/* R2 Image Upload */}
              <div className="form-group" style={{ border: '1px dashed var(--border)', borderRadius: 'var(--radius)', padding: '1.25rem', background: 'rgba(255,255,255,0.01)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
                  <ImageIcon size={16} color="#FF9500" />
                  Attachment Image (Optional)
                </label>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Upload a beautiful card image to be attached. Will be securely stored in Cloudflare R2 CDN.
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
                    {formData.image_url ? 'Change Image' : 'Choose Notification Image'}
                  </button>
                  {formData.image_url && (
                    <span style={{ fontSize: '0.8rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Check size={14} /> Upload completed.
                    </span>
                  )}
                </div>
                
                {formData.image_url && (
                  <div style={{ display: 'flex', gap: '12px', marginTop: '12px', alignItems: 'center' }}>
                    <img 
                      src={formData.image_url} 
                      alt="Notification preview" 
                      style={{ width: '80px', height: '50px', borderRadius: '6px', objectFit: 'cover', border: '1px solid var(--border)' }} 
                    />
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px' }}>
                      <strong>URL:</strong> {formData.image_url}
                    </div>
                  </div>
                )}
              </div>

              {/* Date / Time Scheduler */}
              <div className="input-grid-2">
                <div className="form-group">
                  <label>Scheduled Date *</label>
                  <input 
                    type="date" 
                    name="scheduled_date"
                    className="input-field"
                    value={formData.scheduled_date}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Scheduled Time (Time-wise trigger) *</label>
                  <input 
                    type="time" 
                    name="scheduled_time"
                    className="input-field"
                    value={formData.scheduled_time}
                    onChange={handleInputChange}
                    required
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
                  disabled={saving || uploadingImage}
                  style={{ display: 'inline-flex', gap: '8px', alignItems: 'center', backgroundColor: '#FF9500', borderColor: '#FF9500' }}
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  <span>{isEditingId ? 'Save Changes' : 'Schedule Notification'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Notifications Schedule History */}
          <div className="glass-card" style={{ flex: 1 }}>
            <h3 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bell size={20} color="#FF9500" />
              Notification Dispatch Queue ({notifications.length})
            </h3>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem', gap: '12px' }}>
                <Loader2 size={32} className="animate-spin" color="#FF9500" />
                <span style={{ color: 'var(--text-muted)' }}>Retrieving scheduled queues...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                No notifications scheduled in the queue. Create your first dispatch above!
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Schedule Time</th>
                      <th style={{ width: '80px' }}>Type</th>
                      <th>Content & Payload Details</th>
                      <th style={{ width: '100px' }}>Status</th>
                      <th style={{ width: '130px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {notifications.map((noti) => (
                      <tr key={noti.id} style={{ background: isEditingId === noti.id ? 'rgba(255,149,0,0.06)' : 'transparent' }}>
                        <td style={{ textAlign: 'left', fontSize: '12px', whiteSpace: 'nowrap' }}>
                          <div><strong>📅 {noti.scheduled_date}</strong></div>
                          <div style={{ color: '#FF9500', marginTop: '2px' }}>⏱️ {getFormattedTime(noti.scheduled_time)}</div>
                        </td>
                        <td>
                          <span className="badge-preset" style={{ textTransform: 'uppercase', fontSize: '9px', fontWeight: 'bold' }}>
                            {noti.notification_type}
                          </span>
                        </td>
                        <td style={{ textAlign: 'left' }}>
                          <div style={{ fontWeight: 'bold', color: 'var(--text-main)', fontSize: '13px' }}>{noti.title}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', lineHeight: '14px' }}>{noti.body}</div>
                          {noti.image_url && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                              <img src={noti.image_url} alt="thumbnail" style={{ width: '36px', height: '22px', borderRadius: '4px', objectFit: 'cover', border: '1px solid var(--border)' }} />
                              <span style={{ fontSize: '10px', color: '#10b981' }}>Image attached</span>
                            </div>
                          )}
                          {noti.notification_type === 'vrat' && noti.target_vrat_id && (
                            <div style={{ fontSize: '10px', color: '#FF9500', marginTop: '4px', fontWeight: '600' }}>
                              🎯 Vrat Date: {noti.target_vrat_id}
                            </div>
                          )}
                          {noti.notification_type === 'coins' && noti.coin_amount && (
                            <div style={{ fontSize: '10px', color: '#eab308', marginTop: '4px', fontWeight: '600' }}>
                              🪙 Reward: {noti.coin_amount} Coins
                            </div>
                          )}
                        </td>
                        <td>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '9px',
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                            backgroundColor: noti.status === 'sent' ? 'rgba(16, 185, 129, 0.12)' : noti.status === 'failed' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(255, 149, 0, 0.12)',
                            color: noti.status === 'sent' ? '#10b981' : noti.status === 'failed' ? '#ef4444' : '#FF9500'
                          }}>
                            {noti.status}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            <button 
                              type="button"
                              className="action-btn-primary"
                              onClick={() => handleEdit(noti)}
                              style={{ padding: '0.4rem 0.8rem', backgroundColor: '#FF9500', color: '#ffffff' }}
                              disabled={noti.status === 'sent'}
                            >
                              <Edit3 size={13} /> Edit
                            </button>
                            <button 
                              type="button"
                              className="action-btn-danger"
                              onClick={() => handleDelete(noti.id)}
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

        {/* Right Side: Push Notification Phone Simulator Mockup */}
        <div className="manager-preview-section">
          <div style={{ marginBottom: '14px', width: '100%', textAlign: 'center' }}>
            <h4 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Bell size={16} color="#FF9500" />
              Live Push Notification Simulator
            </h4>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>See how the push message appears on the user's mobile screen</span>
          </div>

          <div className="phone-simulator" style={{ border: '4px solid #1f2937', borderRadius: '36px', width: '280px', height: '550px', backgroundColor: '#1e1b4b', overflow: 'hidden', position: 'relative' }}>
            <div className="phone-notch" style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '120px', height: '18px', backgroundColor: '#1f2937', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px', zIndex: 10 }}></div>
            
            {/* Phone Lock Screen Content */}
            <div style={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', padding: '36px 14px 16px 14px', boxSizing: 'border-box', position: 'relative' }}>
              
              {/* Wallpaper Background */}
              <div style={{ position: 'absolute', inset: 0, backgroundColor: '#111827', opacity: 0.85, zIndex: 0 }} />
              
              {/* Digital Clock Mockup */}
              <div style={{ zIndex: 1, color: '#ffffff', textAlign: 'center', marginTop: '24px', marginBottom: '32px' }}>
                <span style={{ fontSize: '32px', fontWeight: '300', fontFamily: 'monospace' }}>
                  {formData.scheduled_time || '12:00'}
                </span>
                <div style={{ fontSize: '10px', fontWeight: '500', color: 'rgba(255,255,255,0.7)', marginTop: '4px' }}>
                  Thursday, June 11
                </div>
              </div>

              {/* Dynamic Notification Dispatch Card Mockup */}
              <div style={{
                zIndex: 2,
                backgroundColor: 'rgba(30, 41, 59, 0.92)',
                borderRadius: '16px',
                padding: '12px',
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.1)',
                boxShadow: '0 8px 20px rgba(0,0,0,0.5)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '18px', height: '18px', borderRadius: '4px', backgroundColor: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '10px' }}>🌸</span>
                    </div>
                    <span style={{ fontSize: '10.5px', fontWeight: 'bold', color: '#FF9500', textTransform: 'uppercase', letterSpacing: '0.5px' }}>MantraPuja</span>
                  </div>
                  <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)' }}>now</span>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ color: '#ffffff', fontSize: '11.5px', fontWeight: 'bold', lineHeight: '14px' }}>
                      {formData.title || 'Exquisite Spiritual Title'}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '10px', lineHeight: '13px', marginTop: '3px' }}>
                      {formData.body || 'Type your notification message in the form fields to see a real-time preview of the alert text body.'}
                    </div>
                  </div>
                  {formData.image_url && (
                    <img 
                      src={formData.image_url} 
                      alt="mock notification banner"
                      style={{ width: '42px', height: '42px', borderRadius: '6px', objectFit: 'cover', border: '1.5px solid rgba(255, 255, 255, 0.1)' }}
                    />
                  )}
                </div>

                {formData.notification_type === 'coins' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'rgba(234, 179, 8, 0.12)', padding: '4px 8px', borderRadius: '8px', alignSelf: 'flex-start' }}>
                    <Coins size={10} color="#eab308" />
                    <span style={{ color: '#eab308', fontSize: '8.5px', fontWeight: 'bold' }}>
                      +{formData.coin_amount} Coins Reward Attached
                    </span>
                  </div>
                )}

                {formData.notification_type === 'vrat' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'rgba(255, 149, 0, 0.12)', padding: '4px 8px', borderRadius: '8px', alignSelf: 'flex-start' }}>
                    <Sparkles size={10} color="#FF9500" />
                    <span style={{ color: '#FF9500', fontSize: '8.5px', fontWeight: 'bold' }}>
                      Vrat Guide Attachment Linked
                    </span>
                  </div>
                )}
              </div>

              {/* Unlock Tip */}
              <div style={{ zIndex: 1, marginTop: 'auto', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '9px' }}>
                Swipe up to unlock
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
