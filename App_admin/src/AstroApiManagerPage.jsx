import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit3, Trash2, Server, KeyRound, Save, Check, X,
  RefreshCw, Loader2, AlertTriangle, Globe, ShieldCheck, Activity
} from 'lucide-react';
import { supabase } from './lib/supabase';

export default function AstroApiManagerPage() {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Form states
  const [isEditingId, setIsEditingId] = useState(null);
  const [friendlyName, setFriendlyName] = useState('');
  const [providerKey, setProviderKey] = useState('astrology_api');
  const [baseUrl, setBaseUrl] = useState('https://json.astrologyapi.com/v1');
  const [apiUsername, setApiUsername] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [testingStatus, setTestingStatus] = useState(null); // { status: 'loading' | 'success' | 'error', message: string }

  const handleTestConnection = async (testProvider, testUrl, testUsername, testPasswordOrKey, isExisting = false) => {
    setTestingStatus({ status: 'loading', message: 'Testing connection to endpoint...' });
    
    let resolvedKey = testPasswordOrKey;

    try {
      // If it's an existing configuration and password is empty, decrypt it from DB
      if (isExisting && !resolvedKey) {
        const encryptionKey = import.meta.env.VITE_ENCRYPTION_KEY;
        if (!encryptionKey) {
          throw new Error('VITE_ENCRYPTION_KEY is missing in environment config.');
        }
        const { data: decryptedKey, error: decryptErr } = await supabase.rpc('get_decrypted_api_key', {
          p_provider: testProvider,
          p_encryption_key: encryptionKey
        });
        if (decryptErr || !decryptedKey) {
          throw new Error('Failed to decrypt credentials from DB: ' + (decryptErr?.message || 'Key missing'));
        }
        resolvedKey = decryptedKey;
      }

      // Determine test path
      const cleanUrl = testUrl.replace(/\/+$/, '');
      let testEndpoint = `${cleanUrl}/advanced_panchang`;
      let payload = {
        day: 12,
        month: 6,
        year: 2026,
        hour: 12,
        min: 0,
        lat: 28.6139,
        lon: 77.2090,
        tzone: 5.5
      };

      if (testProvider === 'kundli_api') {
        testEndpoint = `${cleanUrl}/planets`;
      } else if (testProvider === 'rashifal_api') {
        testEndpoint = `${cleanUrl}/sun_sign_prediction/daily/aries`;
        payload = { timezone: 5.5 };
      }

      const headers = {
        'Content-Type': 'application/json'
      };

      if (testUsername && resolvedKey) {
        headers['Authorization'] = `Basic ${btoa(`${testUsername}:${resolvedKey}`)}`;
      }
      if (resolvedKey) {
        headers['x-astrologyapi-key'] = resolvedKey;
      }

      console.log(`[Test Connection] Fetching ${testEndpoint}...`);
      const response = await fetch(testEndpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const resData = await response.json();
        // AstrologyAPI sometimes returns error inside 200 payload
        if (resData.error || (resData.status === 'error')) {
          throw new Error(resData.msg || resData.message || 'API internal error');
        }
        setTestingStatus({ 
          status: 'success', 
          message: `Success! Endpoint responded with HTTP ${response.status}. Connection verified successfully.` 
        });
      } else {
        let errMsg = `HTTP Error ${response.status}`;
        try {
          const errData = await response.json();
          if (errData.msg || errData.message) errMsg += `: ${errData.msg || errData.message}`;
        } catch (e) {}
        setTestingStatus({ status: 'error', message: errMsg });
      }
    } catch (err) {
      console.error('[Test Connection] Failed:', err);
      setTestingStatus({ 
        status: 'error', 
        message: `Connection failed: ${err.message}. (Note: direct browser fetch might be blocked by CORS; check console for details.)` 
      });
    }

    // Auto clear status after 12 seconds
    setTimeout(() => setTestingStatus(null), 12000);
  };

  // Fetch configs
  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const { data, error: rpcError } = await supabase.rpc('get_api_configs');
      if (rpcError) throw rpcError;
      
      // Filter only astrology related configs or allow any config in this screen
      // Typically providers containing 'api' or 'astrology'
      const astrologyProviders = ['astrology_api', 'panchang_api', 'kundli_api', 'rashifal_api'];
      const filtered = (data || []).filter(c => astrologyProviders.includes(c.provider));
      setConfigs(filtered);
    } catch (err) {
      console.error('Error fetching API configs:', err);
      setError('Failed to load configurations: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
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

  const handleApplyPreset = (presetType) => {
    if (presetType === 'astrology_api') {
      setFriendlyName('General AstrologyAPI Config');
      setProviderKey('astrology_api');
      setBaseUrl('https://json.astrologyapi.com/v1');
      setApiUsername('651550');
      setApiKey('');
      setIsActive(true);
      showMessage('AstrologyAPI preset loaded! Please input your API key/password.');
    } else if (presetType === 'panchang_api') {
      setFriendlyName('Dedicated Panchang Endpoint');
      setProviderKey('panchang_api');
      setBaseUrl('https://json.astrologyapi.com/v1');
      setApiUsername('');
      setApiKey('');
      setIsActive(true);
    } else if (presetType === 'kundli_api') {
      setFriendlyName('Dedicated Kundli Endpoint');
      setProviderKey('kundli_api');
      setBaseUrl('https://json.astrologyapi.com/v1');
      setApiUsername('');
      setApiKey('');
      setIsActive(true);
    } else if (presetType === 'rashifal_api') {
      setFriendlyName('Dedicated Rashifal Endpoint');
      setProviderKey('rashifal_api');
      setBaseUrl('https://json.astrologyapi.com/v1');
      setApiUsername('');
      setApiKey('');
      setIsActive(true);
    }
  };

  const handleEdit = (config) => {
    setIsEditingId(config.id);
    setFriendlyName(config.name);
    setProviderKey(config.provider);
    setBaseUrl(config.base_url || 'https://json.astrologyapi.com/v1');
    setApiUsername(config.api_username || '');
    setApiKey(''); // Always clear on edit for security
    setIsActive(config.is_active !== false);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (providerCode) => {
    if (!window.confirm(`Are you sure you want to delete the configuration for provider "${providerCode}"? This will revert this service to process environment variables.`)) {
      return;
    }

    try {
      const { error: delError } = await supabase.rpc('delete_api_config', {
        p_provider: providerCode
      });
      if (delError) throw delError;

      showMessage('Configuration deleted successfully.');
      fetchConfigs();
    } catch (err) {
      console.error('Delete error:', err);
      showMessage(err.message, true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!friendlyName.trim()) return showMessage('Friendly Name is required', true);
    if (!providerKey) return showMessage('Provider Key is required', true);
    if (!baseUrl.trim()) return showMessage('Base URL/IP is required', true);

    const isConfigured = configs.some(c => c.provider === providerKey && c.is_configured);

    const encryptionKey = import.meta.env.VITE_ENCRYPTION_KEY;
    if (!encryptionKey || encryptionKey.length < 12) {
      return showMessage('VITE_ENCRYPTION_KEY is missing or invalid in environment configs (must be at least 12 characters)', true);
    }

    setSaving(true);
    try {
      // We will perform the insert/upsert calling set_api_config RPC
      const { error: rpcError } = await supabase.rpc('set_api_config', {
        p_name: friendlyName.trim(),
        p_provider: providerKey,
        p_api_key: apiKey || '', // Left empty to preserve old key on edit
        p_encryption_key: encryptionKey,
        p_base_url: baseUrl.trim(),
        p_api_username: apiUsername.trim() || null
      });

      if (rpcError) throw rpcError;

      // Update active status directly in database table since set_api_config focuses on keys and base details
      const { error: updateErr } = await supabase
        .from('api_configs')
        .update({ is_active: isActive })
        .eq('provider', providerKey);

      if (updateErr) {
        console.warn('Status update warning (might require table columns access):', updateErr.message);
      }

      showMessage('Astrology API configuration saved successfully!');
      clearForm();
      fetchConfigs();
    } catch (err) {
      console.error('Save config error:', err);
      showMessage(err.message, true);
    } finally {
      setSaving(false);
    }
  };

  const clearForm = () => {
    setIsEditingId(null);
    setFriendlyName('');
    setProviderKey('astrology_api');
    setBaseUrl('https://json.astrologyapi.com/v1');
    setApiUsername('');
    setApiKey('');
    setIsActive(true);
  };

  const getProviderLabel = (key) => {
    const labels = {
      astrology_api: 'General Astrology API (Fallback)',
      panchang_api: 'Dedicated Vedic Panchang API',
      kundli_api: 'Dedicated Janam Kundli API',
      rashifal_api: 'Dedicated Rashifal/Horoscope API'
    };
    return labels[key] || key;
  };

  // Check which configurations are currently active/mapped
  const getActiveConfig = (providerCode) => {
    const spec = configs.find(c => c.provider === providerCode && c.is_active);
    if (spec) return spec;
    const fallback = configs.find(c => c.provider === 'astrology_api' && c.is_active);
    if (fallback) return { ...fallback, is_fallback: true };
    return { provider: 'environment_variables', name: 'Server Environment Configs', base_url: 'https://json.astrologyapi.com/v1', is_env: true };
  };

  return (
    <div className="page-content" style={{ fontFamily: '"Outfit", sans-serif' }}>
      <div className="page-header">
        <div>
          <h1 className="gradient-text">Astrology APIs Control Panel</h1>
          <p>Dynamically manage endpoint URLs, domain names/IPs, credentials, and security keys for Panchang, Kundli, and Rashi services.</p>
        </div>
        {!isEditingId && (
          <button className="primary-btn flex items-center gap-2" onClick={clearForm}>
            <Plus size={16} />
            <span>Reset Fields</span>
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
        
        {/* Left Side: CRUD Form & Active Configurations Table */}
        <div className="manager-form-section" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Editor Form */}
          <div className="glass-card">
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Server size={20} color="#ea580c" />
              {isEditingId ? 'Edit API Connection' : 'Register New API Configuration'}
            </h3>
            
            <div style={{ marginBottom: '1.25rem', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span className="badge-preset" onClick={() => handleApplyPreset('astrology_api')}>
                🌐 Load General API Preset
              </span>
              <span className="badge-preset" onClick={() => handleApplyPreset('panchang_api')}>
                🕉️ Load Panchang Preset
              </span>
              <span className="badge-preset" onClick={() => handleApplyPreset('kundli_api')}>
                ✨ Load Kundli Preset
              </span>
              <span className="badge-preset" onClick={() => handleApplyPreset('rashifal_api')}>
                ♈ Load Rashifal Preset
              </span>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="input-grid-2">
                <div className="form-group">
                  <label>Astro Service Provider Key *</label>
                  <select 
                    value={providerKey}
                    className="input-field"
                    onChange={(e) => setProviderKey(e.target.value)}
                    disabled={isEditingId !== null}
                  >
                    <option value="astrology_api">General Astrology API (astrology_api)</option>
                    <option value="panchang_api">Vedic Panchang API (panchang_api)</option>
                    <option value="kundli_api">Janam Kundli API (kundli_api)</option>
                    <option value="rashifal_api">Rashifal/Horoscope API (rashifal_api)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Friendly Name *</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Official AstrologyAPI Server"
                    className="input-field"
                    value={friendlyName}
                    onChange={(e) => setFriendlyName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Base URL / Endpoint Host (IP or Domain) *</label>
                <div className="input-with-icon">
                  <Globe size={18} className="input-icon" />
                  <input 
                    type="text" 
                    placeholder="e.g. https://json.astrologyapi.com/v1 or http://34.126.219.127/v1"
                    className="input-field"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    required
                  />
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Provide the root address including protocol and api version. Do not append trailing slashes (e.g. `/v1`).
                </p>
              </div>

              <div className="input-grid-2">
                <div className="form-group">
                  <label>API User ID / Username</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 651550"
                    className="input-field"
                    value={apiUsername}
                    onChange={(e) => setApiUsername(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>
                    API Key / Password (Optional)
                  </label>
                  <div className="input-with-icon">
                    <KeyRound size={18} className="input-icon" />
                    <input 
                      type="password" 
                      placeholder={isEditingId ? '•••••••••••••••• (Configured - leave blank to keep)' : 'Enter API Key (if required)'}
                      className="input-field"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <input 
                  id="isActive"
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="isActive" style={{ cursor: 'pointer', margin: 0 }}>
                  Enable this API Configuration immediately
                </label>
              </div>

              <div className="form-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {isEditingId && (
                  <button type="button" className="btn-secondary" onClick={clearForm}>
                    Cancel Edit
                  </button>
                )}
                <button type="submit" className="btn-primary" disabled={saving} style={{ backgroundColor: '#ea580c', borderColor: '#ea580c' }}>
                  {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  <span>{isEditingId ? 'Save Changes' : 'Register Config'}</span>
                </button>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  style={{ border: '1px solid var(--border)', display: 'inline-flex', gap: '6px', alignItems: 'center' }}
                  onClick={() => handleTestConnection(providerKey, baseUrl, apiUsername, apiKey)}
                >
                  Test Connection
                </button>
              </div>
            </form>

            {testingStatus && (
              <div style={{
                marginTop: '1rem',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                border: '1px solid',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: testingStatus.status === 'loading' ? 'rgba(99, 102, 241, 0.1)' : testingStatus.status === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                borderColor: testingStatus.status === 'loading' ? '#6366f1' : testingStatus.status === 'success' ? '#10b981' : '#ef4444',
                color: testingStatus.status === 'loading' ? '#94a3b8' : testingStatus.status === 'success' ? '#10b981' : '#ef4444'
              }}>
                {testingStatus.status === 'loading' && <Loader2 size={16} className="animate-spin" />}
                <span>{testingStatus.message}</span>
              </div>
            )}
          </div>

          {/* Configs Table */}
          <div className="glass-card">
            <h3 style={{ marginBottom: '1rem' }}>Configured Astrology API Sources</h3>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem', gap: '8px' }}>
                <Loader2 size={24} className="animate-spin" color="#ea580c" />
                <span style={{ color: 'var(--text-muted)' }}>Loading API configurations...</span>
              </div>
            ) : configs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                No database configurations created. Currently running entirely on server default environment credentials.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Service Key</th>
                      <th>Friendly Name</th>
                      <th>Base Endpoint</th>
                      <th>Credentials Status</th>
                      <th>State</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {configs.map((c) => (
                      <tr key={c.id} style={{ background: isEditingId === c.id ? 'rgba(234, 88, 12, 0.05)' : 'transparent' }}>
                        <td style={{ textAlign: 'left', fontWeight: 'bold' }}>{c.provider}</td>
                        <td style={{ textAlign: 'left' }}>{c.name}</td>
                        <td style={{ textAlign: 'left', fontSize: '12px', color: 'var(--text-muted)' }}>{c.base_url}</td>
                        <td style={{ textAlign: 'left' }}>
                          <span style={{
                            fontSize: '9px',
                            fontWeight: 'bold',
                            padding: '3px 6px',
                            borderRadius: '4px',
                            background: c.is_configured ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: c.is_configured ? '#10b981' : '#ef4444'
                          }}>
                            {c.is_configured ? 'KEY CONFIGURED' : 'KEY MISSING'}
                          </span>
                        </td>
                        <td>
                          <span className={`badge-status ${c.is_active ? 'success' : 'warning'}`}>
                            {c.is_active ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            <button 
                              type="button"
                              className="action-btn-primary"
                              onClick={() => handleTestConnection(c.provider, c.base_url, c.api_username, '', true)}
                              title="Test API Connection"
                              style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', backgroundColor: 'rgba(99,102,241,0.15)', color: '#6366f1' }}
                            >
                              Test
                            </button>
                            <button className="action-btn-primary" onClick={() => handleEdit(c)}>
                              <Edit3 size={13} />
                            </button>
                            <button className="action-btn-danger" onClick={() => handleDelete(c.provider)}>
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

        {/* Right Side: Visual Router State Preview & Debug Mockup */}
        <div className="manager-preview-section" style={{ gap: '20px' }}>
          <div style={{ textAlign: 'center' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', margin: 0 }}>
              <Activity size={18} color="#ea580c" />
              API Route Director
            </h4>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Live backend request redirection status</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
            
            {/* Route Mappings Mock */}
            {['panchang_api', 'kundli_api', 'rashifal_api'].map((srv) => {
              const active = getActiveConfig(srv);
              let srvLabel = srv === 'panchang_api' ? 'Vedic Panchang' : srv === 'kundli_api' ? 'Janam Kundli' : 'Rashifal / Horoscope';
              
              return (
                <div key={srv} className="glass-card" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px', border: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '13px' }}>{srvLabel}</span>
                    {active.is_env ? (
                      <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', fontWeight: 'bold' }}>
                        ENV FALLBACK
                      </span>
                    ) : active.is_fallback ? (
                      <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', fontWeight: 'bold' }}>
                        fallback (astrology_api)
                      </span>
                    ) : (
                      <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', fontWeight: 'bold' }}>
                        DB DIRECT
                      </span>
                    )}
                  </div>
                  
                  <div style={{ fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '2px', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                    <div>
                      <strong>Host:</strong> {active.base_url}
                    </div>
                    <div>
                      <strong>User:</strong> {active.api_username || 'default'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981', marginTop: '2px' }}>
                      <ShieldCheck size={12} />
                      Connection healthy
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Path Preview Mock */}
            <div className="glass-card" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', border: '1px dashed var(--border)', background: 'rgba(255,255,255,0.01)' }}>
              <span style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Sample Request Headers</span>
              <pre style={{ margin: 0, padding: '8px', borderRadius: '6px', background: '#090d16', fontSize: '10px', overflowX: 'auto', fontFamily: 'monospace', color: '#10b981' }}>
{`POST ${getActiveConfig(providerKey).base_url}/${providerKey === 'panchang_api' ? 'advanced_panchang' : providerKey === 'kundli_api' ? 'planets' : 'sun_sign_prediction/daily/aries'}
Authorization: Basic ${btoa(`${getActiveConfig(providerKey).api_username || '651550'}:api_key`)}
Content-Type: application/json

{
  "day": 12,
  "month": 6,
  "year": 2026,
  "timezone": 5.5
}`}
              </pre>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
