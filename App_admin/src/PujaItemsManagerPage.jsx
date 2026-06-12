import { useState, useEffect, useRef } from 'react';
import { 
  Edit3, Trash2, Check, AlertTriangle, Upload, Loader2, Save, X, 
  Sparkles, Layers, RefreshCw, Flame, ArrowUp, ArrowDown
} from 'lucide-react';
import { supabase } from './lib/supabase';
import { uploadToR2, deleteFromR2 } from './lib/r2';

export default function PujaItemsManagerPage() {
  const [activeTab, setActiveTab] = useState('flowers'); // 'flowers' or 'thalis'
  const [flowers, setFlowers] = useState([]);
  const [thalis, setThalis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Form & Upload states
  const [isEditingId, setIsEditingId] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const initialFlowerForm = {
    name: '',
    image_url: '',
    blossom_timing: 4000,
    shower_duration: 10000,
    sort_order: 0,
    unlock_cost: 0
  };

  const initialThaliForm = {
    name: '',
    image_url: '',
    sort_order: 0,
    unlock_cost: 0
  };

  const [flowerForm, setFlowerForm] = useState(initialFlowerForm);
  const [thaliForm, setThaliForm] = useState(initialThaliForm);

  const fileInputRef = useRef(null);

  const fetchFlowers = async () => {
    try {
      const { data, error: err } = await supabase
        .from('god_flowers')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (err) throw err;
      setFlowers(data || []);
    } catch (err) {
      console.error('Error fetching flowers:', err);
      setError(err.message);
    }
  };

  const fetchThalis = async () => {
    try {
      const { data, error: err } = await supabase
        .from('god_thalis')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (err) throw err;
      setThalis(data || []);
    } catch (err) {
      console.error('Error fetching thalis:', err);
      setError(err.message);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    await Promise.all([fetchFlowers(), fetchThalis()]);
    setLoading(false);
  };

  useEffect(() => {
    loadAllData();
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

  const handleFlowerFormChange = (e) => {
    const { name, value } = e.target;
    setFlowerForm(prev => ({
      ...prev,
      [name]: name === 'blossom_timing' || name === 'shower_duration' || name === 'sort_order' || name === 'unlock_cost' ? parseInt(value) || 0 : value
    }));
  };

  const handleThaliFormChange = (e) => {
    const { name, value } = e.target;
    setThaliForm(prev => ({
      ...prev,
      [name]: name === 'sort_order' || name === 'unlock_cost' ? parseInt(value) || 0 : value
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
    setUploadProgress(0);
    const folder = activeTab === 'flowers' ? 'flowers' : 'thalis';

    try {
      showMessage(`Uploading ${activeTab === 'flowers' ? 'flower' : 'thali'} image to Cloudflare R2...`);
      const publicUrl = await uploadToR2(file, folder, (progress) => {
        setUploadProgress(progress);
      });

      if (activeTab === 'flowers') {
        setFlowerForm(prev => ({ ...prev, image_url: publicUrl }));
      } else {
        setThaliForm(prev => ({ ...prev, image_url: publicUrl }));
      }
      showMessage('Image uploaded successfully to Cloudflare!');
    } catch (err) {
      console.error('Upload error:', err);
      showMessage(`Upload failed: ${err.message}`, true);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFlowerSubmit = async (e) => {
    e.preventDefault();
    if (!flowerForm.name.trim()) return showMessage('Please provide a name.', true);
    
    // We can allow blank image_url initially (falls back to local asset in the app)
    const payload = {
      name: flowerForm.name.trim(),
      image_url: flowerForm.image_url,
      blossom_timing: parseInt(flowerForm.blossom_timing) || 4000,
      shower_duration: parseInt(flowerForm.shower_duration) || 10000,
      sort_order: parseInt(flowerForm.sort_order) || 0,
      unlock_cost: parseInt(flowerForm.unlock_cost) || 0
    };

    try {
      if (isEditingId) {
        const { error: err } = await supabase
          .from('god_flowers')
          .update(payload)
          .eq('id', isEditingId);

        if (err) throw err;
        showMessage('Flower updated successfully!');
      } else {
        const { error: err } = await supabase
          .from('god_flowers')
          .insert([payload]);

        if (err) throw err;
        showMessage('New flower created successfully!');
      }

      clearForm();
      fetchFlowers();
    } catch (err) {
      console.error('Flower form submission error:', err);
      showMessage(err.message, true);
    }
  };

  const handleThaliSubmit = async (e) => {
    e.preventDefault();
    if (!thaliForm.name.trim()) return showMessage('Please provide a name.', true);

    const payload = {
      name: thaliForm.name.trim(),
      image_url: thaliForm.image_url,
      sort_order: parseInt(thaliForm.sort_order) || 0,
      unlock_cost: parseInt(thaliForm.unlock_cost) || 0
    };

    try {
      if (isEditingId) {
        const { error: err } = await supabase
          .from('god_thalis')
          .update(payload)
          .eq('id', isEditingId);

        if (err) throw err;
        showMessage('Thali updated successfully!');
      } else {
        const { error: err } = await supabase
          .from('god_thalis')
          .insert([payload]);

        if (err) throw err;
        showMessage('New thali created successfully!');
      }

      clearForm();
      fetchThalis();
    } catch (err) {
      console.error('Thali form submission error:', err);
      showMessage(err.message, true);
    }
  };

  const handleEdit = (item) => {
    setIsEditingId(item.id);
    if (activeTab === 'flowers') {
      setFlowerForm({
        name: item.name || '',
        image_url: item.image_url || '',
        blossom_timing: item.blossom_timing || 4000,
        shower_duration: item.shower_duration || 10000,
        sort_order: item.sort_order || 0,
        unlock_cost: item.unlock_cost || 0
      });
    } else {
      setThaliForm({
        name: item.name || '',
        image_url: item.image_url || '',
        sort_order: item.sort_order || 0,
        unlock_cost: item.unlock_cost || 0
      });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id, itemUrl) => {
    if (!window.confirm(`Are you sure you want to permanently delete this ${activeTab === 'flowers' ? 'flower' : 'thali'}?`)) return;

    try {
      const table = activeTab === 'flowers' ? 'god_flowers' : 'god_thalis';
      const { error: delErr } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (delErr) throw delErr;

      // Clean up asset in Cloudflare R2 if it contains public url
      if (itemUrl) {
        await deleteFromR2(itemUrl);
      }

      showMessage(`${activeTab === 'flowers' ? 'Flower' : 'Thali'} deleted successfully.`);
      
      if (isEditingId === id) {
        clearForm();
      }

      if (activeTab === 'flowers') fetchFlowers();
      else fetchThalis();
    } catch (err) {
      console.error('Delete error:', err);
      showMessage(err.message, true);
    }
  };

  const clearForm = () => {
    setIsEditingId(null);
    setFlowerForm(initialFlowerForm);
    setThaliForm(initialThaliForm);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    clearForm();
  };

  return (
    <div className="page-content" style={{ fontFamily: '"Outfit", sans-serif' }}>
      <div className="page-header">
        <h1 className="gradient-text">Puja Offerings Manager</h1>
        <p>Dynamically manage the selectable flowers and aarti thalis available on the deity screen, including custom graphics and flower blossom timings.</p>
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

      {/* Tabs Layout */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <button
          onClick={() => handleTabChange('flowers')}
          className={`btn-secondary`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: activeTab === 'flowers' ? 'rgba(234, 88, 12, 0.15)' : 'rgba(255,255,255,0.03)',
            borderColor: activeTab === 'flowers' ? '#ea580c' : 'rgba(255,255,255,0.1)',
            color: activeTab === 'flowers' ? '#ea580c' : 'var(--text-muted)',
            fontWeight: '600'
          }}
        >
          <Sparkles size={16} />
          Flowers Configuration
        </button>
        <button
          onClick={() => handleTabChange('thalis')}
          className={`btn-secondary`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: activeTab === 'thalis' ? 'rgba(234, 88, 12, 0.15)' : 'rgba(255,255,255,0.03)',
            borderColor: activeTab === 'thalis' ? '#ea580c' : 'rgba(255,255,255,0.1)',
            color: activeTab === 'thalis' ? '#ea580c' : 'var(--text-muted)',
            fontWeight: '600'
          }}
        >
          <Flame size={16} />
          Aarti Thali Configuration
        </button>
      </div>

      <div className="manager-split-layout">
        
        {/* CRUD Form Column */}
        <div className="manager-form-section" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-card">
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              {activeTab === 'flowers' ? <Sparkles size={20} color="#ea580c" /> : <Flame size={20} color="#ea580c" />}
              {isEditingId 
                ? `Edit ${activeTab === 'flowers' ? 'Flower' : 'Thali'} Configuration`
                : `Add New ${activeTab === 'flowers' ? 'Flower' : 'Thali'} Offering`
              }
            </h3>

            {activeTab === 'flowers' ? (
              // Flowers Form
              <form onSubmit={handleFlowerSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Flower Name *</label>
                    <input
                      type="text"
                      name="name"
                      className="input-field"
                      placeholder="e.g. Marigold, Rose, Lotus"
                      value={flowerForm.name}
                      onChange={handleFlowerFormChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Sort Order</label>
                    <input
                      type="number"
                      name="sort_order"
                      className="input-field"
                      value={flowerForm.sort_order}
                      onChange={handleFlowerFormChange}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Blossom Shower Speed Timing (baseline duration in milliseconds) *</label>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    Adjust how fast or slow the flower falls. Lower values fall faster (e.g. 3000ms), higher values fall slower (e.g. 6000ms).
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input
                      type="range"
                      name="blossom_timing"
                      min="1500"
                      max="10000"
                      step="500"
                      value={flowerForm.blossom_timing}
                      onChange={handleFlowerFormChange}
                      style={{ flex: 1, accentColor: '#ea580c', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '0.9rem', fontFamily: 'monospace', fontWeight: 'bold', minWidth: '60px' }}>
                      {flowerForm.blossom_timing} ms
                    </span>
                  </div>
                </div>

                <div className="form-group">
                  <label>Active Shower Duration (in seconds) *</label>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    Adjust how long the flower shower continues falling before automatically stopping.
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input
                      type="range"
                      name="shower_duration"
                      min="3000"
                      max="30000"
                      step="1000"
                      value={flowerForm.shower_duration}
                      onChange={handleFlowerFormChange}
                      style={{ flex: 1, accentColor: '#ea580c', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '0.9rem', fontFamily: 'monospace', fontWeight: 'bold', minWidth: '60px' }}>
                      {Math.round(flowerForm.shower_duration / 1000)}s ({flowerForm.shower_duration} ms)
                    </span>
                  </div>
                </div>

                <div className="form-group">
                  <label>Unlock Cost (in coins) *</label>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    Set how many coins a user must spend to unlock this flower. Set to 0 to make it free (e.g. Marigold).
                  </p>
                  <input
                    type="number"
                    name="unlock_cost"
                    className="input-field"
                    placeholder="e.g. 50, 70, 90"
                    value={flowerForm.unlock_cost}
                    onChange={handleFlowerFormChange}
                    min="0"
                    required
                  />
                </div>

                {/* Cloudflare R2 Upload block */}
                <div className="form-group" style={{ border: '1px dashed var(--border)', borderRadius: 'var(--radius)', padding: '1.25rem', background: 'rgba(255,255,255,0.01)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
                    <Upload size={16} color="#ea580c" />
                    Flower Graphic Asset
                  </label>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    Upload a high resolution transparent PNG representing the falling flower asset.
                  </p>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <input 
                      type="file" 
                      accept="image/*" 
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                    />
                    <button 
                      type="button" 
                      className="btn-secondary" 
                      disabled={uploadingImage}
                      onClick={() => fileInputRef.current?.click()}
                      style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}
                    >
                      {uploadingImage ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                      {flowerForm.image_url ? 'Change Image' : 'Choose PNG Graphic'}
                    </button>
                    {flowerForm.image_url && (
                      <span style={{ fontSize: '0.8rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Check size={14} /> Image loaded
                      </span>
                    )}
                  </div>
                  {flowerForm.image_url && (
                    <div style={{ display: 'flex', gap: '12px', marginTop: '12px', alignItems: 'center' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '6px' }}>
                        <img 
                          src={flowerForm.image_url} 
                          alt="Preview" 
                          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
                        />
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px' }}>
                        <strong>R2 Domain URL:</strong> {flowerForm.image_url}
                      </div>
                    </div>
                  )}
                </div>

                <div className="form-actions" style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  {isEditingId && (
                    <button type="button" className="btn-secondary" onClick={clearForm}>
                      Cancel Edit
                    </button>
                  )}
                  <button type="submit" className="btn-primary" disabled={uploadingImage}>
                    <Save size={16} />
                    {isEditingId ? 'Update Flower' : 'Save Offering'}
                  </button>
                </div>
              </form>
            ) : (
              // Thalis Form
              <form onSubmit={handleThaliSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Thali / Aarti Plate Name *</label>
                    <input
                      type="text"
                      name="name"
                      className="input-field"
                      placeholder="e.g. Silver Thali, Golden Plate"
                      value={thaliForm.name}
                      onChange={handleThaliFormChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Sort Order</label>
                    <input
                      type="number"
                      name="sort_order"
                      className="input-field"
                      value={thaliForm.sort_order}
                      onChange={handleThaliFormChange}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Unlock Cost (in coins) *</label>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    Set how many coins a devotee must spend to unlock this thali. Set to 0 to make it free (e.g. Brass Thali).
                  </p>
                  <input
                    type="number"
                    name="unlock_cost"
                    className="input-field"
                    placeholder="e.g. 50, 70, 90"
                    value={thaliForm.unlock_cost}
                    onChange={handleThaliFormChange}
                    min="0"
                    required
                  />
                </div>

                {/* Cloudflare R2 Upload block */}
                <div className="form-group" style={{ border: '1px dashed var(--border)', borderRadius: 'var(--radius)', padding: '1.25rem', background: 'rgba(255,255,255,0.01)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
                    <Upload size={16} color="#ea580c" />
                    Thali Image (GIF or transparent PNG)
                  </label>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    Provide a transparent image of the Aarti thali plate. Supports GIFs for flaming animations.
                  </p>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <input 
                      type="file" 
                      accept="image/*" 
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                    />
                    <button 
                      type="button" 
                      className="btn-secondary" 
                      disabled={uploadingImage}
                      onClick={() => fileInputRef.current?.click()}
                      style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}
                    >
                      {uploadingImage ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                      {thaliForm.image_url ? 'Change Image' : 'Choose Graphic File'}
                    </button>
                    {thaliForm.image_url && (
                      <span style={{ fontSize: '0.8rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Check size={14} /> Image loaded
                      </span>
                    )}
                  </div>
                  {thaliForm.image_url && (
                    <div style={{ display: 'flex', gap: '12px', marginTop: '12px', alignItems: 'center' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4px' }}>
                        <img 
                          src={thaliForm.image_url} 
                          alt="Preview" 
                          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
                        />
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px' }}>
                        <strong>R2 Domain URL:</strong> {thaliForm.image_url}
                      </div>
                    </div>
                  )}
                </div>

                <div className="form-actions" style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  {isEditingId && (
                    <button type="button" className="btn-secondary" onClick={clearForm}>
                      Cancel Edit
                    </button>
                  )}
                  <button type="submit" className="btn-primary" disabled={uploadingImage}>
                    <Save size={16} />
                    {isEditingId ? 'Update Thali' : 'Save Offering'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Saved Items Table Column */}
        <div className="manager-preview-section" style={{ flex: 1.5 }}>
          <div className="glass-card" style={{ height: '100%' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Layers size={20} color="#ea580c" />
                  Saved {activeTab === 'flowers' ? 'Flowers' : 'Thalis'} Listing
                </h3>
                <p className="card-description">Configure the layout order and visuals appearing in the mobile sheet.</p>
              </div>
              <button onClick={loadAllData} className="action-btn-primary" style={{ padding: '0.5rem' }} title="Sync database data">
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '5rem', gap: '12px' }}>
                <Loader2 size={32} className="animate-spin" color="#ea580c" />
                <span style={{ color: 'var(--text-muted)' }}>Synchronizing offerings...</span>
              </div>
            ) : (activeTab === 'flowers' ? flowers.length === 0 : thalis.length === 0) ? (
              <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-muted)' }}>
                No custom {activeTab === 'flowers' ? 'flowers' : 'thalis'} registered yet. Set up your first offering in the form!
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px' }}>Graphic</th>
                      <th style={{ textAlign: 'left' }}>Offering Details</th>
                      {activeTab === 'flowers' && <th style={{ textAlign: 'left' }}>Blossom Speed</th>}
                      {activeTab === 'flowers' && <th style={{ textAlign: 'left' }}>Shower Duration</th>}
                      <th style={{ textAlign: 'left' }}>Unlock Cost</th>
                      <th style={{ width: '70px', textAlign: 'left' }}>Sort Order</th>
                      <th style={{ width: '130px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(activeTab === 'flowers' ? flowers : thalis).map((item) => (
                      <tr key={item.id} style={{ background: isEditingId === item.id ? 'rgba(234,88,12,0.06)' : 'transparent' }}>
                        <td>
                          <div style={{ 
                            width: '40px', 
                            height: '40px', 
                            borderRadius: '8px', 
                            background: 'rgba(255, 255, 255, 0.03)', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            overflow: 'hidden',
                            border: '1px solid var(--border)',
                            padding: '4px'
                          }}>
                            {item.image_url ? (
                              <img src={item.image_url} alt="Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                            ) : (
                              <span style={{ fontSize: '14px' }}>{activeTab === 'flowers' ? '🌸' : '🪔'}</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
                            <span style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>{item.name}</span>
                            {item.image_url ? (
                              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                R2 CDN linked
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.65rem', color: '#f59e0b', fontWeight: 'bold' }}>
                                App Local Fallback Asset
                              </span>
                            )}
                          </div>
                        </td>
                        {activeTab === 'flowers' && (
                          <td>
                            <span className="badge-status info" style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>
                              {item.blossom_timing || 4000} ms
                            </span>
                          </td>
                        )}
                        {activeTab === 'flowers' && (
                          <td>
                            <span className="badge-status success" style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>
                              {Math.round((item.shower_duration || 10000) / 1000)}s
                            </span>
                          </td>
                        )}
                        <td>
                          <span className="badge-status" style={{ 
                            fontSize: '0.75rem', 
                            fontFamily: 'monospace', 
                            backgroundColor: item.unlock_cost > 0 ? '#ea580c' : 'rgba(255,255,255,0.05)', 
                            color: '#fff' 
                          }}>
                            {item.unlock_cost > 0 ? `${item.unlock_cost} Coins` : 'Free'}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontWeight: '500', color: 'var(--text-main)' }}>{item.sort_order}</span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            <button 
                              type="button"
                              className="action-btn-primary"
                              onClick={() => handleEdit(item)}
                              style={{ padding: '0.4rem 0.8rem' }}
                            >
                              <Edit3 size={13} /> Edit
                            </button>
                            <button 
                              type="button"
                              className="action-btn-danger"
                              onClick={() => handleDelete(item.id, item.image_url)}
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

      </div>
    </div>
  );
}
