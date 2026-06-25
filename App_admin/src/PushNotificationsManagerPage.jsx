import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Edit3, Trash2, Bell, Sparkles, Save, Check, X, ArrowLeft,
  RefreshCw, Loader2, Upload, AlertTriangle, Image as ImageIcon, Coins, Globe, Send,
  Music, Play, Pause, Clock
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

  // Sounds Management
  const [sounds, setSounds] = useState([
    { id: 'default', name: 'Default System Chime', filename: 'default', file_url: '' },
    { id: 'bell_sound', name: 'Temple Bell Chime', filename: 'bell_sound', file_url: 'https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/notifications/bell_sound.mp3' },
    { id: 'shankh_sound', name: 'Sacred Shankh (Conch)', filename: 'shankh_sound', file_url: 'https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/notifications/shankh_sound.mp3' },
    { id: 'flute_sound', name: 'Mantra Flute Tune', filename: 'flute_sound', file_url: 'https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/notifications/flute_sound.mp3' }
  ]);
  const [playingSoundId, setPlayingSoundId] = useState(null);
  const audioRef = useRef(null);

  // Sound uploads form states
  const [newSoundName, setNewSoundName] = useState('');
  const [newSoundFilename, setNewSoundFilename] = useState('');
  const [soundFile, setSoundFile] = useState(null);
  const [uploadingSound, setUploadingSound] = useState(false);
  const soundFileInputRef = useRef(null);

  // Countdown timer state
  const [countdownText, setCountdownText] = useState('');

  // Drag and drop / database column states
  const [isDraggingSound, setIsDraggingSound] = useState(false);
  const [hasRecurringColumn, setHasRecurringColumn] = useState(true);

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
    scheduled_time: getNextHourTimeString(),
    sound_name: 'default',
    sound_url: '',
    is_recurring: false,
    preferred_ratio: '2:1',
    is_gif: false
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

  // Fetch custom notification sounds
  const fetchSounds = async () => {
    try {
      const { data, error: dbErr } = await supabase
        .from('notification_sounds')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (!dbErr && data && data.length > 0) {
        setSounds(data);
      }
    } catch (err) {
      console.warn('Could not load custom sounds from database, using seeded fallback list.', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchVratPool();
    fetchSounds();
  }, []);

  // Update real-time countdown timer in push simulator
  useEffect(() => {
    const updateCountdown = () => {
      if (!formData.scheduled_date || !formData.scheduled_time) {
        setCountdownText('');
        return;
      }
      try {
        const scheduledStr = `${formData.scheduled_date}T${formData.scheduled_time}`;
        const scheduledTime = new Date(scheduledStr).getTime();
        const now = new Date().getTime();
        const diff = scheduledTime - now;

        if (diff <= 0) {
          setCountdownText('Triggering immediately (Scheduled time passed)');
        } else {
          const secs = Math.floor((diff % (1000 * 60)) / 1000);
          const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));

          const pad = (num) => String(num).padStart(2, '0');

          if (days > 0) {
            setCountdownText(`Trigger in: ${days}d ${pad(hours)}h ${pad(mins)}m ${pad(secs)}s`);
          } else {
            setCountdownText(`Trigger in: ${pad(hours)}h ${pad(mins)}m ${pad(secs)}s`);
          }
        }
      } catch (e) {
        setCountdownText('');
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [formData.scheduled_date, formData.scheduled_time]);

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
      showMessage('Please select a valid image file or animated GIF.', true);
      return;
    }

    const isGif = file.type === 'image/gif';
    const localUrl = URL.createObjectURL(file);
    
    // Instantly update UI with local blob URL for immediate feedback
    setFormData(prev => ({
      ...prev,
      image_url: localUrl,
      is_gif: isGif
    }));

    setUploadingImage(true);
    try {
      showMessage('Uploading attachment to Cloudflare R2...');
      const publicUrl = await uploadToR2(file, 'notifications');
      setFormData(prev => ({
        ...prev,
        image_url: publicUrl,
        is_gif: isGif
      }));
      showMessage('Notification banner asset uploaded successfully!');
    } catch (err) {
      console.error('Image upload error:', err);
      showMessage(`Image upload failed: ${err.message}`, true);
      // Revert if upload fails
      setFormData(prev => ({
        ...prev,
        image_url: '',
        is_gif: false
      }));
    } finally {
      setUploadingImage(false);
    }
  };

  // Audio Preview Controller
  const togglePlaySound = (sound) => {
    if (!sound.file_url) return;
    
    if (playingSoundId === sound.id) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingSoundId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(sound.file_url);
      audioRef.current.play().catch(e => console.error('Audio play failed:', e));
      setPlayingSoundId(sound.id);
      audioRef.current.onended = () => {
        setPlayingSoundId(null);
      };
    }
  };

  // Save new custom sound
  const handleSoundUpload = async (e) => {
    e.preventDefault();
    if (!newSoundName.trim()) return showMessage('Sound Display Name is required.', true);
    if (!newSoundFilename.trim()) return showMessage('Native Asset Filename is required.', true);
    if (!soundFile) return showMessage('Please choose an MP3 audio file to upload.', true);

    setUploadingSound(true);
    try {
      showMessage('Uploading sound asset to Cloudflare R2...');
      const publicUrl = await uploadToR2(soundFile, 'notifications/sounds');
      
      const payload = {
        name: newSoundName.trim(),
        filename: newSoundFilename.trim(),
        file_url: publicUrl
      };

      const { data, error: insertErr } = await supabase
        .from('notification_sounds')
        .insert([payload])
        .select('*');

      if (insertErr) throw insertErr;
      
      if (data && data.length > 0) {
        setSounds(prev => [...prev, data[0]]);
      }
      
      setNewSoundName('');
      setNewSoundFilename('');
      setSoundFile(null);
      if (soundFileInputRef.current) soundFileInputRef.current.value = '';
      showMessage('Custom notification chime uploaded and registered successfully!');
    } catch (err) {
      console.error('Sound upload error:', err);
      showMessage(`Sound upload failed: ${err.message}`, true);
    } finally {
      setUploadingSound(false);
    }
  };

  // Delete custom sound
  const handleDeleteSound = async (soundId) => {
    if (['default', 'bell_sound', 'shankh_sound', 'flute_sound'].includes(soundId)) {
      showMessage('Built-in system sounds cannot be deleted.', true);
      return;
    }
    if (!window.confirm('Are you sure you want to permanently delete this custom sound?')) return;

    try {
      const { error: delErr } = await supabase
        .from('notification_sounds')
        .delete()
        .eq('id', soundId);

      if (delErr) throw delErr;
      
      setSounds(prev => prev.filter(s => s.id !== soundId));
      showMessage('Custom chime deleted successfully.');
    } catch (err) {
      console.error('Delete sound error:', err);
      showMessage(err.message, true);
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
      sound_name: formData.sound_name,
      sound_url: formData.sound_url || null,
      status: 'pending'
    };

    if (hasRecurringColumn) {
      payload.is_recurring = formData.is_recurring;
    }

    setSaving(true);
    try {
      if (isEditingId) {
        // Edit Mode
        const { error: updateErr } = await supabase
          .from('push_notifications')
          .update(payload)
          .eq('id', isEditingId);

        if (updateErr) {
          if (updateErr.message?.includes('is_recurring') || updateErr.code === '42703') {
            setHasRecurringColumn(false);
            const fallbackPayload = { ...payload };
            delete fallbackPayload.is_recurring;
            const { error: retryErr } = await supabase
              .from('push_notifications')
              .update(fallbackPayload)
              .eq('id', isEditingId);
            if (retryErr) throw retryErr;
            showMessage('Notification schedule updated (Recurring daily disabled; please apply the database migration).', false);
          } else {
            throw updateErr;
          }
        } else {
          showMessage('Notification schedule updated successfully!');
        }
      } else {
        // Create Mode
        const { error: insertErr } = await supabase
          .from('push_notifications')
          .insert([payload]);

        if (insertErr) {
          if (insertErr.message?.includes('is_recurring') || insertErr.code === '42703') {
            setHasRecurringColumn(false);
            const fallbackPayload = { ...payload };
            delete fallbackPayload.is_recurring;
            const { error: retryErr } = await supabase
              .from('push_notifications')
              .insert([fallbackPayload]);
            if (retryErr) throw retryErr;
            showMessage('Notification scheduled (Recurring daily disabled; please apply the database migration).', false);
          } else {
            throw insertErr;
          }
        } else {
          showMessage('New push notification scheduled successfully!');
        }
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

    const isGif = !!(noti.image_url && noti.image_url.toLowerCase().includes('gif'));

    setFormData({
      title: noti.title,
      body: noti.body,
      image_url: noti.image_url || '',
      notification_type: noti.notification_type,
      target_vrat_id: noti.target_vrat_id || '',
      coin_amount: noti.coin_amount || 50,
      scheduled_date: noti.scheduled_date,
      scheduled_time: formattedTime,
      sound_name: noti.sound_name || 'default',
      sound_url: noti.sound_url || '',
      is_recurring: noti.is_recurring || false,
      preferred_ratio: '2:1',
      is_gif: isGif
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
          <p>Create, schedule, edit and manage global notifications, vrat/fast reminders, custom sounds, or coin alerts.</p>
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
        
        {/* Left Side: CRUD Form, Sounds Manager & History */}
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

              {/* Notification Sound Selection */}
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
                  <Music size={16} color="#FF9500" />
                  Notification Sound Selection *
                </label>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Drag any sound chip from the tray below and drop it into the target zone, or click it directly to assign.
                </p>

                {/* Drag-and-Drop Target Zone */}
                <div 
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingSound(true);
                  }}
                  onDragLeave={() => setIsDraggingSound(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingSound(false);
                    const soundFilename = e.dataTransfer.getData('text/plain');
                    const selectedSound = sounds.find(s => s.filename === soundFilename);
                    if (selectedSound) {
                      setFormData(prev => ({
                        ...prev,
                        sound_name: selectedSound.filename,
                        sound_url: selectedSound.file_url || ''
                      }));
                      showMessage(`Assigned sound: ${selectedSound.name}`);
                    }
                  }}
                  style={{
                    border: isDraggingSound ? '2px dashed #FF9500' : '2px dashed var(--border)',
                    background: isDraggingSound ? 'rgba(255, 149, 0, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '12px',
                    padding: '16px',
                    textAlign: 'center',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '12px'
                  }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 149, 0, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FF9500'
                  }}>
                    <Music size={20} className={playingSoundId ? 'animate-pulse' : ''} />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-main)' }}>
                      Active: {sounds.find(s => s.filename === formData.sound_name)?.name || 'Default Chime'}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {formData.sound_name === 'default' ? 'System Default Chime' : `${formData.sound_name}.mp3`}
                    </div>
                  </div>
                  {formData.sound_url && (
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        const currentSound = sounds.find(s => s.filename === formData.sound_name);
                        if (currentSound) togglePlaySound(currentSound);
                      }}
                      style={{ padding: '4px 12px', fontSize: '11px', marginTop: '4px', display: 'inline-flex', gap: '4px', alignItems: 'center' }}
                    >
                      {playingSoundId && sounds.find(s => s.id === playingSoundId)?.filename === formData.sound_name ? (
                        <>
                          <Pause size={12} />
                          <span>Pause Preview</span>
                        </>
                      ) : (
                        <>
                          <Play size={12} />
                          <span>Test Chime</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Draggable Sounds Tray */}
                <div style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: '8px', 
                  padding: '10px', 
                  background: 'rgba(255, 255, 255, 0.01)', 
                  borderRadius: '10px', 
                  border: '1px solid var(--border)' 
                }}>
                  {sounds.map((sound) => {
                    const isSelected = formData.sound_name === sound.filename;
                    return (
                      <div
                        key={sound.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', sound.filename);
                        }}
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            sound_name: sound.filename,
                            sound_url: sound.file_url || ''
                          }));
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          background: isSelected ? 'rgba(255, 149, 0, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                          border: isSelected ? '1px solid #FF9500' : '1px solid var(--border)',
                          borderRadius: '20px',
                          cursor: 'grab',
                          userSelect: 'none',
                          fontSize: '12px',
                          fontWeight: isSelected ? 'bold' : 'normal',
                          transition: 'all 0.15s ease'
                        }}
                        title="Drag this sound to dropzone or click to select"
                      >
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>⣿</span>
                        <span>{sound.name}</span>
                        {sound.file_url && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePlaySound(sound);
                            }}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              color: isSelected ? '#FF9500' : 'var(--text-muted)',
                              padding: '2px',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            {playingSoundId === sound.id ? <Pause size={12} /> : <Play size={12} />}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* R2 Image / GIF Upload & Preferred Ratio Selector */}
              <div className="form-group" style={{ border: '1px dashed var(--border)', borderRadius: 'var(--radius)', padding: '1.25rem', background: 'rgba(255,255,255,0.01)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
                  <ImageIcon size={16} color="#FF9500" />
                  Attachment Image or Animated GIF (Optional)
                </label>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Upload a beautiful card image or animated GIF. Supports JPG, PNG, and GIF.
                </p>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                  <input 
                    type="file" 
                    accept="image/png, image/jpeg, image/gif" 
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
                    {formData.image_url ? 'Change Media File' : 'Choose Image / GIF'}
                  </button>
                  {formData.image_url && (
                    <span style={{ fontSize: '0.8rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Check size={14} /> Upload completed.
                    </span>
                  )}
                </div>

                {/* Aspect Ratio Selector */}
                <div style={{ marginTop: '12px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 'bold', display: 'block', marginBottom: '4px' }}>Preferred Display Aspect Ratio</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[
                      { value: '2:1', label: '2:1 Banner', desc: 'Standard lockscreen' },
                      { value: '16:9', label: '16:9 Landscape', desc: 'Wide app banner' },
                      { value: '1:1', label: '1:1 Square', desc: 'Thumbnail preview' }
                    ].map((ratio) => {
                      const isSelected = formData.preferred_ratio === ratio.value;
                      return (
                        <button
                          key={ratio.value}
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              preferred_ratio: ratio.value
                            }));
                          }}
                          style={{
                            flex: 1,
                            padding: '6px',
                            borderRadius: '8px',
                            border: isSelected ? '1.5px solid #FF9500' : '1px solid var(--border)',
                            background: isSelected ? 'rgba(255, 149, 0, 0.08)' : 'rgba(255,255,255,0.02)',
                            color: isSelected ? '#FF9500' : 'var(--text-main)',
                            textAlign: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ fontSize: '11px', fontWeight: 'bold' }}>{ratio.label}</div>
                          <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '1px' }}>{ratio.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                {formData.image_url && (
                  <div style={{ display: 'flex', gap: '12px', marginTop: '12px', alignItems: 'center' }}>
                    <img 
                      src={formData.image_url} 
                      alt="Notification preview" 
                      style={{ 
                        width: '80px', 
                        aspectRatio: formData.preferred_ratio === '2:1' ? '2/1' : formData.preferred_ratio === '16:9' ? '16/9' : '1/1',
                        borderRadius: '6px', 
                        objectFit: 'cover', 
                        border: '1px solid var(--border)' 
                      }} 
                    />
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px' }}>
                      <strong>URL:</strong> {formData.image_url}
                      {formData.image_url.toLowerCase().endsWith('.gif') && <span style={{ marginLeft: '6px', color: '#10b981', fontWeight: 'bold' }}>[GIF Animation]</span>}
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Delay Presets */}
              <div className="form-group" style={{ background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--border)', borderRadius: '10px', padding: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                  <Clock size={14} color="#FF9500" />
                  Quick Dispatch Delay Presets
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                  {[
                    { label: 'Send Immediately', minutes: 0 },
                    { label: 'In 5 Min', minutes: 5 },
                    { label: 'In 15 Min', minutes: 15 },
                    { label: 'In 30 Min', minutes: 30 },
                    { label: 'In 1 Hour', minutes: 60 }
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        const now = new Date();
                        if (preset.minutes > 0) {
                          now.setMinutes(now.getMinutes() + preset.minutes);
                        }
                        const yyyy = now.getFullYear();
                        const mm = String(now.getMonth() + 1).padStart(2, '0');
                        const dd = String(now.getDate()).padStart(2, '0');
                        const hh = String(now.getHours()).padStart(2, '0');
                        const min = String(now.getMinutes()).padStart(2, '0');
                        
                        setFormData(prev => ({
                          ...prev,
                          scheduled_date: `${yyyy}-${mm}-${dd}`,
                          scheduled_time: `${hh}:${min}`
                        }));
                        showMessage(`Time set to: ${preset.label} (${hh}:${min})`);
                      }}
                      style={{ fontSize: '11px', padding: '4px 10px', flex: '1 0 auto' }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
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
                  <label>Scheduled Time *</label>
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

              {/* Recurring Schedule Switch */}
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', borderRadius: '10px' }}>
                <input
                  type="checkbox"
                  id="is_recurring"
                  name="is_recurring"
                  checked={formData.is_recurring}
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      is_recurring: e.target.checked
                    }));
                  }}
                  style={{
                    width: '16px',
                    height: '16px',
                    accentColor: '#FF9500',
                    cursor: 'pointer'
                  }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', cursor: 'pointer' }}>
                  <label htmlFor="is_recurring" style={{ margin: 0, cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    🔁 Repeat Daily (Daily Notification Loop)
                  </label>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    If enabled, this notification will repeat every single day at the specified time automatically.
                  </span>
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

          {/* Custom Notification Sounds Manager */}
          <div className="glass-card">
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Music size={20} color="#FF9500" />
              Custom Notification Sounds Manager
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Upload and manage custom `.mp3` notification chime sounds. These filenames correspond to native assets inside your mobile app project.
            </p>

            {/* List of Sounds */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1.5rem' }}>
              {sounds.map((sound) => (
                <div 
                  key={sound.id} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    padding: '8px 12px', 
                    background: 'rgba(255,255,255,0.02)', 
                    border: '1px solid var(--border)', 
                    borderRadius: '10px' 
                  }}
                >
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: '600', fontSize: '13px' }}>{sound.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Asset Name: <code style={{ color: '#FF9500' }}>{sound.filename}</code>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {sound.file_url && (
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => togglePlaySound(sound)}
                        style={{ padding: '6px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}
                      >
                        {playingSoundId === sound.id ? <Pause size={12} /> : <Play size={12} />}
                        <span>{playingSoundId === sound.id ? 'Pause' : 'Play'}</span>
                      </button>
                    )}
                    {!['default', 'bell_sound', 'shankh_sound', 'flute_sound'].includes(sound.id) && (
                      <button
                        type="button"
                        onClick={() => handleDeleteSound(sound.id)}
                        style={{ padding: '6px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Upload form */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
              <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', color: 'var(--text-main)' }}>Upload New Custom Sound</h4>
              <form onSubmit={handleSoundUpload} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="input-grid-2">
                  <div className="form-group">
                    <label style={{ fontSize: '0.75rem' }}>Sound Display Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Divine Shankh Chime"
                      className="input-field"
                      value={newSoundName}
                      onChange={(e) => setNewSoundName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '0.75rem' }}>Native Asset Filename *</label>
                    <input
                      type="text"
                      placeholder="e.g. shankh_sound (no extension)"
                      className="input-field"
                      value={newSoundFilename}
                      onChange={(e) => setNewSoundFilename(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '0.75rem' }}>Select MP3 Audio File *</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="file"
                      accept="audio/mpeg, audio/mp3"
                      ref={soundFileInputRef}
                      onChange={(e) => setSoundFile(e.target.files?.[0] || null)}
                      style={{ display: 'none' }}
                    />
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => soundFileInputRef.current?.click()}
                      style={{ fontSize: '12px', display: 'inline-flex', gap: '6px', alignItems: 'center' }}
                    >
                      <Upload size={14} />
                      {soundFile ? 'Change Audio' : 'Choose Audio File'}
                    </button>
                    {soundFile && (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-main)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        🎵 {soundFile.name}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={uploadingSound}
                  style={{ alignSelf: 'flex-start', fontSize: '12px', padding: '8px 16px', backgroundColor: '#FF9500', borderColor: '#FF9500' }}
                >
                  {uploadingSound ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                  <span style={{ marginLeft: '6px' }}>Upload & Save Sound</span>
                </button>
              </form>
            </div>
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
                          
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '6px', alignItems: 'center' }}>
                            {noti.image_url && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <img src={noti.image_url} alt="thumbnail" style={{ width: '36px', height: '18px', borderRadius: '4px', objectFit: 'cover', border: '1px solid var(--border)' }} />
                                <span style={{ fontSize: '10px', color: '#10b981' }}>Asset Attached</span>
                              </div>
                            )}
                            {noti.sound_name && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'rgba(255,255,255,0.04)', padding: '2px 6px', borderRadius: '6px', border: '1px solid var(--border)' }}>
                                <Music size={10} color="#FF9500" />
                                <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Sound: {noti.sound_name}</span>
                              </div>
                            )}
                          </div>

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
                          {noti.is_recurring && (
                            <div style={{ fontSize: '10px', color: '#3b82f6', marginTop: '4px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '3px' }}>
                              🔁 Daily Recurring Schedule
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
              
              {/* Digital Clock Mockup with Countdown Timer */}
              <div style={{ zIndex: 1, color: '#ffffff', textAlign: 'center', marginTop: '24px', marginBottom: '20px' }}>
                <span style={{ fontSize: '32px', fontWeight: '300', fontFamily: 'monospace' }}>
                  {formData.scheduled_time || '12:00'}
                </span>
                <div style={{ fontSize: '10px', fontWeight: '500', color: 'rgba(255,255,255,0.7)', marginTop: '4px' }}>
                  Thursday, June 11
                </div>
                {countdownText && (
                  <div style={{ 
                    fontSize: '9px', 
                    fontWeight: 'bold', 
                    color: '#ffffff', 
                    marginTop: '6px',
                    backgroundColor: 'rgba(255, 149, 0, 0.7)',
                    padding: '3px 8px',
                    borderRadius: '8px',
                    display: 'inline-block',
                    boxShadow: '0 2px 8px rgba(255,149,0,0.3)',
                    maxWidth: '90%',
                    wordWrap: 'break-word'
                  }}>
                    ⏱️ {countdownText}
                  </div>
                )}
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
                  {formData.image_url && formData.preferred_ratio === '1:1' && (
                    <div style={{ position: 'relative', alignSelf: 'center', flexShrink: 0 }}>
                      <img 
                        src={formData.image_url} 
                        alt="mock notification banner"
                        style={{ 
                          width: '44px',
                          height: '44px',
                          borderRadius: '6px', 
                          objectFit: 'cover', 
                          border: '1.5px solid rgba(255, 255, 255, 0.1)' 
                        }}
                      />
                      {formData.is_gif && (
                        <span style={{
                          position: 'absolute',
                          bottom: '2px',
                          right: '2px',
                          backgroundColor: 'rgba(0,0,0,0.8)',
                          color: '#10b981',
                          fontSize: '7px',
                          fontWeight: 'bold',
                          padding: '1px 3px',
                          borderRadius: '3px'
                        }}>
                          GIF
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {formData.image_url && formData.preferred_ratio !== '1:1' && (
                  <div style={{ position: 'relative', width: '100%', marginTop: '6px', borderRadius: '8px', overflow: 'hidden' }}>
                    <img 
                      src={formData.image_url} 
                      alt="mock notification banner"
                      style={{ 
                        width: '100%',
                        aspectRatio: formData.preferred_ratio === '2:1' ? '2/1' : '16/9',
                        objectFit: 'cover', 
                        border: '1.5px solid rgba(255, 255, 255, 0.1)',
                        display: 'block'
                      }}
                    />
                    {formData.is_gif && (
                      <span style={{
                        position: 'absolute',
                        bottom: '4px',
                        right: '4px',
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        color: '#10b981',
                        fontSize: '8px',
                        fontWeight: 'bold',
                        padding: '2px 4px',
                        borderRadius: '3px'
                      }}>
                        GIF
                      </span>
                    )}
                  </div>
                )}

                {/* Selected Custom Chime Sound Banner */}
                {formData.sound_name && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'rgba(255, 255, 255, 0.06)', padding: '4px 8px', borderRadius: '8px', alignSelf: 'flex-start', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <Music size={10} color="#FF9500" />
                    <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '8.5px', fontWeight: '500' }}>
                      Chime: {formData.sound_name === 'default' ? 'System Default' : `${formData.sound_name}.mp3`}
                    </span>
                  </div>
                )}

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

                {formData.is_recurring && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'rgba(59, 130, 246, 0.12)', padding: '4px 8px', borderRadius: '8px', alignSelf: 'flex-start' }}>
                    <span style={{ color: '#3b82f6', fontSize: '8.5px', fontWeight: 'bold' }}>
                      🔁 Recurring Daily
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
