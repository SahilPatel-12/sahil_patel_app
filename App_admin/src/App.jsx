import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Users, 
  BarChart3, 
  Settings, 
  Bell, 
  Search, 
  LogOut,
  ChevronRight,
  TrendingUp,
  Package,
  Activity,
  User,
  Lock,
  KeyRound,
  Loader2,
  Server,
  MessageSquare,
  Trash2,
  Edit3,
  Check,
  ShieldCheck,
  AlertTriangle,
  Image,
  Video,
  Upload,
  ShoppingCart,
  Layers,
  Calendar
} from 'lucide-react'
import { supabase } from './lib/supabase'
import { uploadToR2 } from './lib/r2'
import OneRupeeManagerPage from './OneRupeeManagerPage'
import GeneralPoojasManagerPage from './GeneralPoojasManagerPage'
import WebsiteProductsManagerPage from './WebsiteProductsManagerPage'
import ProblemSolutionsManagerPage from './ProblemSolutionsManagerPage'
import ComboPoojasManagerPage from './ComboPoojasManagerPage'
import OfferSectionsManagerPage from './OfferSectionsManagerPage'
import DailyRitualsManagerPage from './DailyRitualsManagerPage'
import OrdersManagerPage from './OrdersManagerPage'
import VideoReviewsManagerPage from './VideoReviewsManagerPage'
import PanditVideosManagerPage from './PanditVideosManagerPage'
import BannersManagerPage from './BannersManagerPage'
import PujaBannersManagerPage from './PujaBannersManagerPage'
import './App.css'

// --- Components ---

const Sidebar = ({ onLogout }) => {
  const location = useLocation();
  
  const menuItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Orders', path: '/orders', icon: <ShoppingCart size={20} /> },
    { name: 'Homepage Hero', path: '/hero', icon: <Image size={20} /> },
    { name: 'App Banners', path: '/banners', icon: <Image size={20} /> },
    { name: 'Puja Banner', path: '/puja-banner', icon: <Layers size={20} /> },
    { name: 'Video Reviews', path: '/video-reviews', icon: <MessageSquare size={20} /> },
    { name: 'Pandit Videos', path: '/pandit-videos', icon: <Video size={20} /> },
    { name: 'Users', path: '/users', icon: <Users size={20} /> },
    { name: '₹1 Poojas', path: '/one-rupee-poojas', icon: <Package size={20} /> },
    { name: 'Vedic Pujas', path: '/general-poojas', icon: <Package size={20} /> },
    { name: 'Website Products', path: '/website-products', icon: <Package size={20} /> },
    { name: 'Problem Solutions', path: '/problem-solutions', icon: <Activity size={20} /> },
    { name: 'Combo Pujas', path: '/combo-poojas', icon: <Package size={20} /> },
    { name: 'Offer Sections', path: '/offer-sections', icon: <Layers size={20} /> },
    { name: 'Daily Rituals', path: '/daily-rituals', icon: <Calendar size={20} /> },
    { name: 'Analytics', path: '/analytics', icon: <BarChart3 size={20} /> },
    { name: 'Settings', path: '/settings', icon: <Settings size={20} /> },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">M</div>
        <span className="logo-text">Mantra Admin</span>
      </div>
      
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <Link 
            key={item.name} 
            to={item.path} 
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            {item.icon}
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="nav-item logout" onClick={onLogout}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

const Header = () => {
  const adminUsername = localStorage.getItem('admin_username') || 'Sahil Patel';
  
  return (
    <header className="header">
      <div className="header-search">
        <Search size={18} className="search-icon" />
        <input type="text" placeholder="Search for data, users, logs..." />
      </div>
      
      <div className="header-actions">
        <button className="icon-btn">
          <Bell size={20} />
          <span className="badge"></span>
        </button>
        <div className="user-profile">
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" alt="Admin" />
          <div className="user-info">
            <span className="user-name">{adminUsername}</span>
            <span className="user-role">Super Admin</span>
          </div>
        </div>
      </div>
    </header>
  );
};

// --- Pages ---

const LoginPage = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { data, error: rpcError } = await supabase.rpc('verify_admin_login', {
        p_username: username,
        p_password: password
      });

      if (rpcError) {
        throw rpcError;
      }

      if (data === true) {
        localStorage.setItem('admin_session', 'true');
        localStorage.setItem('admin_username', username);
        onLoginSuccess();
      } else {
        setError('Invalid username or password');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'An error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="glass-card login-card">
        <div className="login-header">
          <div className="login-logo-icon">M</div>
          <h2>Mantra Admin</h2>
          <p>Sign in to access the administrator panel</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error ? <div className="login-error">{error}</div> : null}

          <div className="form-group">
            <label htmlFor="username">Username</label>
            <div className="input-with-icon">
              <User size={18} className="input-icon" />
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                disabled={isLoading}
              />
            </div>
          </div>

          <button type="submit" className="login-btn" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <KeyRound size={18} />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const stats = [
    { name: 'Total Users', value: '12,450', trend: '+12%', icon: <Users />, color: '#6366f1' },
    { name: 'Revenue', value: '$45,200', trend: '+8%', icon: <TrendingUp />, color: '#10b981' },
    { name: 'Active Sessions', value: '1,205', trend: '+5%', icon: <Activity />, color: '#f59e0b' },
    { name: 'Total Orders', value: '450', trend: '+15%', icon: <Package />, color: '#ec4899' },
  ];

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="gradient-text">Dashboard Overview</h1>
        <p>Welcome back, here's what's happening today.</p>
      </div>

      <div className="stats-grid">
        {stats.map((stat, i) => (
          <div key={i} className="glass-card stat-card">
            <div className="stat-icon" style={{ backgroundColor: `${stat.color}15`, color: stat.color }}>
              {stat.icon}
            </div>
            <div className="stat-info">
              <span className="stat-label">{stat.name}</span>
              <span className="stat-value">{stat.value}</span>
              <span className="stat-trend">{stat.trend} from last month</span>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-main-grid">
        <div className="glass-card table-card">
          <div className="card-header">
            <h3>Recent Activities</h3>
            <button className="text-btn">View All</button>
          </div>
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Action</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5].map((_, i) => (
                <tr key={i}>
                  <td>
                    <div className="td-user">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`} alt="user" />
                      <span>User {i + 1}</span>
                    </div>
                  </td>
                  <td>Subscription Renewal</td>
                  <td><span className="badge-status success">Completed</span></td>
                  <td>May 0{i + 1}, 2026</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="glass-card chart-preview">
          <h3>Quick Stats</h3>
          <div className="chart-placeholder">
            <div className="bar-container">
              {[60, 40, 80, 50, 90, 70].map((h, i) => (
                <div key={i} className="bar" style={{ height: `${h}%` }}></div>
              ))}
            </div>
            <div className="chart-labels">
              <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const initData = async () => {
    setLoading(true);
    try {
      // Fetch synced profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch all orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('user_id, total_amount');

      if (ordersError) throw ordersError;

      setUsers(profilesData || []);
      setOrders(ordersData || []);
    } catch (err) {
      console.error('Error fetching admin users/profiles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initData();
  }, []);

  // Aggregate user stats in memory
  const userStats = {};
  orders.forEach(o => {
    if (!userStats[o.user_id]) {
      userStats[o.user_id] = { count: 0, spend: 0 };
    }
    userStats[o.user_id].count += 1;
    userStats[o.user_id].spend += Number(o.total_amount || 0);
  });

  const filteredUsers = users.filter(u => {
    const name = u.full_name || '';
    const phone = u.phone || '';
    const email = u.email || '';
    const searchString = `${name} ${phone} ${email}`.toLowerCase();
    return searchString.includes(search.toLowerCase());
  });

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="gradient-text">Registered Devotees</h1>
          <p>View registered clients, OTP signup history, and their total spiritual order contributions.</p>
        </div>
        <button className="primary-btn flex items-center gap-2" onClick={initData}>
          <RefreshCw size={16} />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Stats overview */}
      <div className="stats-grid">
        <div className="glass-card stat-card">
          <div className="stat-icon orange"><Users size={24} /></div>
          <div className="stat-info">
            <h3>{users.length}</h3>
            <p>Total Registered Users</p>
          </div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-icon green"><ShieldCheck size={24} /></div>
          <div className="stat-info">
            <h3>{users.filter(u => u.full_name).length}</h3>
            <p>Completed Vedic Profiles</p>
          </div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-icon blue"><ShoppingCart size={24} /></div>
          <div className="stat-info">
            <h3>
              {orders.length}
            </h3>
            <p>Total Placed Orders</p>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="glass-card filter-card">
        <div className="search-bar-container w-full">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search devotees by full name, phone number, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Devotees Grid Table */}
      <div className="glass-card table-card">
        {loading ? (
          <div className="loader-container">
            <RefreshCw className="animate-spin text-orange-500" size={32} />
            <p>Loading devotees list...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="empty-state">
            <p>No devotees match your search parameters.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Avatar</th>
                  <th>Devotee Name</th>
                  <th>Phone Coordinates</th>
                  <th>Email ID</th>
                  <th>Joined Date</th>
                  <th>Placed Orders</th>
                  <th>Spiritual Contribution</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((userItem) => {
                  const stats = userStats[userItem.id] || { count: 0, spend: 0 };
                  const avatarUrl = userItem.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userItem.phone}`;

                  return (
                    <tr key={userItem.id}>
                      <td>
                        <img 
                          src={avatarUrl} 
                          alt="Devotee Avatar" 
                          style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#fff7ed' }} 
                        />
                      </td>
                      <td className="font-semibold">{userItem.full_name || 'Anonymous Guest'}</td>
                      <td className="font-mono text-sm">{userItem.phone}</td>
                      <td>{userItem.email || <span className="text-gray-400 text-xs">No email</span>}</td>
                      <td>{new Date(userItem.created_at).toLocaleDateString()}</td>
                      <td className="font-bold text-center">{stats.count}</td>
                      <td className="font-bold text-orange-600">₹{stats.spend}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const AnalyticsPage = () => (
  <div className="page-content">
    <div className="page-header">
      <h1 className="gradient-text">Analytics</h1>
      <p>Detailed performance metrics and reports.</p>
    </div>
    <div className="glass-card">
      <p>Detailed charts and data visualization...</p>
    </div>
  </div>
);

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [configs, setConfigs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Editing state
  const [editingProvider, setEditingProvider] = useState(null);
  const [friendlyName, setFriendlyName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableProviders = [
    {
      providerKey: 'whatsapp_otp',
      defaultName: 'WhatsApp OTP Integration',
      description: 'Used for sending OTP verification messages to application users.',
      icon: <MessageSquare size={24} />,
      status: 'active'
    },
    {
      providerKey: 'firebase_fcm',
      defaultName: 'Firebase Cloud Messaging',
      description: 'Used for system alerts and sending transactional push notifications.',
      icon: <Bell size={24} />,
      status: 'upcoming'
    },
    {
      providerKey: 'stripe_pay',
      defaultName: 'Stripe Payment Gateway',
      description: 'Collect client payments and process transactions.',
      icon: <Package size={24} />,
      status: 'upcoming'
    }
  ];

  const fetchConfigs = async () => {
    setIsLoading(true);
    try {
      const { data, error: rpcError } = await supabase.rpc('get_api_configs');
      if (rpcError) throw rpcError;
      setConfigs(data || []);
    } catch (err) {
      console.error('Error fetching API configs:', err);
      setError('Failed to load API configurations.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const isAlreadyConfigured = (providerKey) => {
    return configs.some(c => c.provider === providerKey && c.is_configured);
  };

  const getConfigDetails = (providerKey) => {
    return configs.find(c => c.provider === providerKey);
  };

  const handleEditClick = (provider) => {
    setError('');
    setSuccessMsg('');
    const config = getConfigDetails(provider.providerKey) || {};
    setEditingProvider(provider);
    setFriendlyName(config.name || provider.defaultName);
    setApiKey(''); // Always clear on edit for security
  };

  const handleCancelEdit = () => {
    setEditingProvider(null);
    setFriendlyName('');
    setApiKey('');
    setError('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!friendlyName) {
      setError('Friendly name is required');
      return;
    }

    const isConfigured = isAlreadyConfigured(editingProvider.providerKey);
    if (!apiKey && !isConfigured) {
      setError('API key is required');
      return;
    }

    const encryptionKey = import.meta.env.VITE_ENCRYPTION_KEY;
    if (!encryptionKey || encryptionKey.length < 16) {
      setError('VITE_ENCRYPTION_KEY is missing or invalid in your .env configuration (must be at least 16 digits/characters)');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccessMsg('');

    try {
      const { error: rpcError } = await supabase.rpc('set_api_config', {
        p_name: friendlyName,
        p_provider: editingProvider.providerKey,
        p_api_key: apiKey || '', 
        p_encryption_key: encryptionKey
      });

      if (rpcError) throw rpcError;

      setSuccessMsg(`Successfully saved config for ${friendlyName}`);
      setEditingProvider(null);
      await fetchConfigs();
    } catch (err) {
      console.error('Error saving API config:', err);
      setError(err.message || 'An error occurred while saving the configuration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (providerKey) => {
    if (!window.confirm('Are you sure you want to remove this configuration? This will disable this API integration.')) {
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const { error: rpcError } = await supabase.rpc('delete_api_config', {
        p_provider: providerKey
      });

      if (rpcError) throw rpcError;

      setSuccessMsg('Integration removed successfully.');
      await fetchConfigs();
    } catch (err) {
      console.error('Error deleting API config:', err);
      setError('Failed to remove integration.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="gradient-text">Settings</h1>
        <p>Configure system preferences, API credentials, and integrations.</p>
      </div>

      <div className="settings-layout">
        {/* Settings Navigation Tabs */}
        <div className="settings-nav glass-card">
          <button 
            className={`settings-tab-btn ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => { setActiveTab('general'); handleCancelEdit(); }}
          >
            <Settings size={18} />
            <span>General Settings</span>
          </button>
          <button 
            className={`settings-tab-btn ${activeTab === 'integrations' ? 'active' : ''}`}
            onClick={() => { setActiveTab('integrations'); handleCancelEdit(); }}
          >
            <Server size={18} />
            <span>API Integrations</span>
          </button>
        </div>

        {/* Settings Content Area */}
        <div className="settings-content">
          {error ? <div className="login-error" style={{ marginBottom: '1.5rem' }}>{error}</div> : null}
          {successMsg ? <div className="settings-success" style={{ marginBottom: '1.5rem' }}>{successMsg}</div> : null}

          {activeTab === 'general' && (
            <div className="glass-card page-card">
              <h3>General Preferences</h3>
              <p className="card-description">Configure general administration dashboard controls.</p>
              
              <div className="settings-form-stub">
                <div className="form-group">
                  <label>System Email Address</label>
                  <input type="email" defaultValue="admin@mantrapuja.com" disabled />
                </div>
                <div className="form-group">
                  <label>Refresh Interval (seconds)</label>
                  <input type="number" defaultValue="30" disabled />
                </div>
                <p className="hint-text">Note: General system configurations will be editable in a future release.</p>
              </div>
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className="integrations-section">
              {!editingProvider ? (
                <div className="integrations-grid">
                  {availableProviders.map((provider) => {
                    const configured = isAlreadyConfigured(provider.providerKey);
                    const details = getConfigDetails(provider.providerKey);

                    return (
                      <div key={provider.providerKey} className="glass-card integration-card">
                        <div className="integration-icon-wrapper">
                          {provider.icon}
                        </div>
                        <div className="integration-details">
                          <div className="integration-title-row">
                            <h4>{details?.name || provider.defaultName}</h4>
                            {provider.status === 'upcoming' ? (
                              <span className="badge-status info">Upcoming</span>
                            ) : configured ? (
                              <span className="badge-status success">Configured</span>
                            ) : (
                              <span className="badge-status warning">Not Configured</span>
                            )}
                          </div>
                          <p>{provider.description}</p>
                          {configured && details?.updated_at && (
                            <span className="integration-updated">
                              Last updated: {new Date(details.updated_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <div className="integration-actions">
                          {provider.status === 'active' ? (
                            <>
                              <button 
                                className="action-btn-primary"
                                onClick={() => handleEditClick(provider)}
                              >
                                <Edit3 size={16} />
                                <span>{configured ? 'Edit' : 'Configure'}</span>
                              </button>
                              {configured && (
                                <button 
                                  className="action-btn-danger"
                                  onClick={() => handleDelete(provider.providerKey)}
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </>
                          ) : (
                            <button className="action-btn-disabled" disabled>
                              <span>Locked</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Config/Edit Form Card */
                <div className="glass-card page-card">
                  <div className="form-header">
                    <h3>Configure {editingProvider.defaultName}</h3>
                    <p className="card-description">
                      Add your API credentials. Keys are encrypted with AES-256 using the encryption key defined in your environment configs.
                    </p>
                  </div>

                  <form onSubmit={handleSave} className="settings-form">
                    <div className="form-group">
                      <label>Provider Type</label>
                      <input 
                        type="text" 
                        value={editingProvider.providerKey} 
                        disabled 
                        className="input-disabled"
                      />
                    </div>

                    <div className="form-group">
                      <label>Friendly Name *</label>
                      <input 
                        type="text" 
                        value={friendlyName} 
                        onChange={(e) => setFriendlyName(e.target.value)}
                        placeholder="e.g. WhatsApp OTP verification"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>
                        API Key {isAlreadyConfigured(editingProvider.providerKey) ? '(Leave blank to keep existing key)' : '*'}
                      </label>
                      <div className="input-with-icon">
                        <Lock size={18} className="input-icon" />
                        <input 
                          type="password" 
                          value={apiKey} 
                          onChange={(e) => setApiKey(e.target.value)}
                          placeholder={
                            isAlreadyConfigured(editingProvider.providerKey) 
                              ? "•••••••••••••••• (Configured - enter new key to replace)" 
                              : "Enter your WhatsApp API key"
                          }
                          required={!isAlreadyConfigured(editingProvider.providerKey)}
                        />
                      </div>
                    </div>

                    <div className="form-actions">
                      <button 
                        type="button" 
                        className="btn-secondary"
                        onClick={handleCancelEdit}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className="btn-primary"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <Check size={16} />
                            <span>Save Configuration</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const HeroManagerPage = () => {
  const [heroes, setHeroes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form states
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [dateText, setDateText] = useState('');
  const [buttonText, setButtonText] = useState('');
  const [buttonLink, setButtonLink] = useState('');
  const [backgroundImage, setBackgroundImage] = useState('');
  const [pendingFile, setPendingFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isActive, setIsActive] = useState(true);

  const fetchHeroes = async () => {
    setIsLoading(true);
    try {
      const { data, error: dbError } = await supabase
        .from('homepage_hero')
        .select('*')
        .order('created_at', { ascending: false });

      if (dbError) throw dbError;
      setHeroes(data || []);
    } catch (err) {
      console.error('Error fetching heroes:', err);
      setError('Failed to load hero configurations.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHeroes();
  }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setSuccessMsg('');

    // Revoke previous local preview url to avoid memory leaks
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const localUrl = URL.createObjectURL(file);
    setPendingFile(file);
    setPreviewUrl(localUrl);
    setBackgroundImage(localUrl);
    setSuccessMsg('Local preview loaded! Verify it on the device preview simulator. Changes are NOT yet uploaded to Cloudflare.');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title || !backgroundImage) {
      setError('Title and Background Image are required');
      return;
    }

    setIsSubmitting(true);
    setError('');
    setSuccessMsg('');

    let finalImageUrl = backgroundImage;

    try {
      // Upload the local preview file to Cloudflare R2 on Save
      if (pendingFile) {
        setIsUploading(true);
        console.log('[Cloudflare R2] Commencing direct Cloudflare upload for confirmed banner background.');
        finalImageUrl = await uploadToR2(pendingFile, 'hero');
        setIsUploading(false);
      }

      const payload = {
        title,
        subtitle,
        date_text: dateText,
        button_text: buttonText,
        button_link: buttonLink,
        background_image: finalImageUrl,
        is_active: isActive
      };

      if (editingId) {
        // Update
        const { error: dbError } = await supabase
          .from('homepage_hero')
          .update(payload)
          .eq('id', editingId);

        if (dbError) throw dbError;
        setSuccessMsg('Hero banner updated and uploaded to Cloudflare successfully!');
      } else {
        // Insert
        const { error: dbError } = await supabase
          .from('homepage_hero')
          .insert([payload]);

        if (dbError) throw dbError;
        setSuccessMsg('New Hero banner created and uploaded to Cloudflare successfully!');
      }

      // Reset Form
      handleReset();
      await fetchHeroes();
    } catch (err) {
      console.error('Error saving hero:', err);
      setError(err.message || 'Failed to save configuration.');
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  const handleEdit = (hero) => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPendingFile(null);
    setPreviewUrl('');

    setEditingId(hero.id);
    setTitle(hero.title);
    setSubtitle(hero.subtitle || '');
    setDateText(hero.date_text || '');
    setButtonText(hero.button_text || '');
    setButtonLink(hero.button_link || '');
    setBackgroundImage(hero.background_image || '');
    setIsActive(hero.is_active);
    setError('');
    setSuccessMsg('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this hero banner config?')) return;

    setIsLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const { error: dbError } = await supabase
        .from('homepage_hero')
        .delete()
        .eq('id', id);

      if (dbError) throw dbError;
      setSuccessMsg('Hero configuration deleted successfully.');
      await fetchHeroes();
    } catch (err) {
      console.error('Error deleting hero:', err);
      setError('Failed to delete configuration.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (hero) => {
    setIsLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const nextActiveState = !hero.is_active;

      const { error: dbError } = await supabase
        .from('homepage_hero')
        .update({ is_active: nextActiveState })
        .eq('id', hero.id);

      if (dbError) throw dbError;
      
      setSuccessMsg(nextActiveState ? 'Banner activated successfully! (Other banners deactivated)' : 'Banner deactivated.');
      await fetchHeroes();
    } catch (err) {
      console.error('Error toggling active state:', err);
      setError('Failed to update active state.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPendingFile(null);
    setPreviewUrl('');

    setEditingId(null);
    setTitle('');
    setSubtitle('');
    setDateText('');
    setButtonText('');
    setButtonLink('');
    setBackgroundImage('');
    setIsActive(true);
  };

  return (
    <div className="page-content">
      <style>{`
        @keyframes preview-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.98); }
        }
      `}</style>
      <div className="page-header">
        <h1 className="gradient-text">Homepage Hero Manager</h1>
        <p>Design and customize the top showcase banner of your mobile application dynamically.</p>
      </div>

      {error ? <div className="login-error" style={{ marginBottom: '1.5rem' }}>{error}</div> : null}
      {successMsg ? <div className="settings-success" style={{ marginBottom: '1.5rem' }}>{successMsg}</div> : null}

      <div className="settings-layout" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '2rem' }}>
        
        {/* Editor Form */}
        <div className="glass-card page-card" style={{ height: 'fit-content' }}>
          <h3>{editingId ? 'Edit Showcase Banner' : 'Create Showcase Banner'}</h3>
          <p className="card-description">Configure the texts, images, and quick call-to-actions.</p>

          <form onSubmit={handleSave} className="settings-form" style={{ marginTop: '1.5rem' }}>
            
            <div className="form-group">
              <label>Banner Title *</label>
              <input 
                type="text" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Saturday Kalashtami Special"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label>Subtitle / Description</label>
              <textarea 
                value={subtitle} 
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="e.g. For liberation from the sins of past births & for attaining family happiness"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  resize: 'vertical',
                  minHeight: '80px'
                }}
              />
            </div>

            <div className="form-group">
              <label>Highlight Date Text</label>
              <input 
                type="text" 
                value={dateText} 
                onChange={(e) => setDateText(e.target.value)}
                placeholder="e.g. 9 May 2026, Saturday"
                disabled={isSubmitting}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>CTA Button Text</label>
                <input 
                  type="text" 
                  value={buttonText} 
                  onChange={(e) => setButtonText(e.target.value)}
                  placeholder="e.g. Book Puja"
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-group">
                <label>CTA Button Screen Link</label>
                <input 
                  type="text" 
                  value={buttonLink} 
                  onChange={(e) => setButtonLink(e.target.value)}
                  placeholder="e.g. /puja_detail?id=2"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Banner Background Image *</label>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginTop: '0.5rem' }}>
                <label 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.25rem',
                    borderRadius: '8px',
                    background: '#ea580c',
                    color: 'white',
                    cursor: 'pointer',
                    fontWeight: '500',
                    transition: 'all 0.2s',
                    boxShadow: '0 4px 6px -1px rgba(234, 88, 12, 0.2)'
                  }}
                >
                  <Upload size={16} />
                  <span>Choose Image File</span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageUpload} 
                    style={{ display: 'none' }}
                    disabled={isUploading || isSubmitting}
                  />
                </label>

                {isUploading && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f59e0b' }}>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Uploading to Cloudflare...</span>
                  </div>
                )}

                {pendingFile ? (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.8rem',
                    background: 'rgba(245, 158, 11, 0.15)',
                    color: '#f59e0b',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '16px',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    fontWeight: '500',
                    animation: 'preview-pulse 2s infinite ease-in-out'
                  }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }}></span>
                    Live Preview Active (Unsaved)
                  </span>
                ) : backgroundImage ? (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.8rem',
                    background: 'rgba(16, 185, 129, 0.15)',
                    color: '#10b981',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '16px',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    fontWeight: '500'
                  }}>
                    ✓ Saved in Cloudflare R2
                  </span>
                ) : null}
              </div>

              {backgroundImage && (
                <div style={{ marginTop: '1rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: '0.5rem' }}>
                    {pendingFile ? 'Temporary Local Preview URL:' : 'Cloudflare R2 Public CDN URL:'}
                  </span>
                  <input 
                    type="text" 
                    value={pendingFile ? '[Local File Selected - Will upload to Cloudflare on save]' : backgroundImage} 
                    readOnly 
                    className="input-disabled"
                    style={{ fontSize: '0.85rem', color: pendingFile ? '#f59e0b' : 'white' }}
                  />
                </div>
              )}
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1rem' }}>
              <input 
                id="isActive"
                type="checkbox" 
                checked={isActive} 
                onChange={(e) => setIsActive(e.target.checked)}
                disabled={isSubmitting}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <label htmlFor="isActive" style={{ cursor: 'pointer', margin: 0 }}>
                Set as Active Showcase Banner (Deactivates other active banners)
              </label>
            </div>

            <div className="form-actions" style={{ marginTop: '2rem' }}>
              <button 
                type="button" 
                className="btn-secondary"
                onClick={handleReset}
                disabled={isSubmitting}
              >
                Clear Form
              </button>
              <button 
                type="submit" 
                className="btn-primary"
                disabled={isSubmitting || isUploading}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    <span>{editingId ? 'Update Banner' : 'Create Banner'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Dynamic Mobile Simulator Live Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h4 style={{ margin: 0, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '0.05em' }}>
            Live Device Preview
          </h4>
          
          <div 
            style={{
              width: '320px',
              height: '568px', // iPhone 5/SE aspect ratio
              background: '#090d16',
              borderRadius: '32px',
              border: '8px solid #1e293b',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              overflow: 'hidden',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Simulator Speaker & Camera Notch */}
            <div style={{
              width: '120px',
              height: '18px',
              background: '#1e293b',
              borderRadius: '0 0 12px 12px',
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 9999,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <div style={{ width: '40px', height: '4px', background: '#090d16', borderRadius: '2px' }}></div>
            </div>

            {/* Immersive Top Banner */}
            <div 
              style={{
                height: '240px',
                width: '100%',
                backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '1.25rem 1rem 1rem 1rem'
              }}
            >
              {/* Gradient Overlay */}
              <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.9) 100%)',
                zIndex: 1
              }}></div>

              {/* Dynamic Local Preview Glass Badge */}
              {pendingFile && (
                <div style={{
                  position: 'absolute',
                  top: '40px',
                  right: '12px',
                  background: 'rgba(245, 158, 11, 0.85)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '12px',
                  padding: '4px 8px',
                  fontSize: '0.55rem',
                  fontWeight: 'bold',
                  color: 'white',
                  zIndex: 20,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.25)',
                  animation: 'preview-pulse 1.5s infinite ease-in-out'
                }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'white', display: 'inline-block' }}></span>
                  PREVIEW (UNSAVED)
                </div>
              )}

              {/* Top Status & Search Mock */}
              <div style={{ zIndex: 10, width: '100%', marginTop: '0.5rem' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(10px)',
                  padding: '0.4rem 0.75rem',
                  borderRadius: '20px',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  <Search size={14} color="rgba(255,255,255,0.7)" style={{ marginRight: '0.5rem' }} />
                  <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>Search for Chadhava...</span>
                </div>
              </div>

              {/* Dynamic Text Contents */}
              <div style={{ zIndex: 10, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.65rem', color: '#ea580c', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {dateText || '9 May 2026, Saturday'}
                </span>
                <h4 style={{ margin: 0, color: 'white', fontSize: '1.15rem', fontWeight: '800', lineHeight: '1.2' }}>
                  {title || 'Saturday Kalashtami Special'}
                </h4>
                <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', fontSize: '0.65rem', lineHeight: '1.3' }}>
                  {subtitle || 'For liberation from the sins of past births & attaining happiness.'}
                </p>

                {buttonText && (
                  <div style={{ marginTop: '0.5rem', display: 'flex' }}>
                    <div style={{
                      background: 'linear-gradient(to right, #f97316, #ea580c)',
                      color: 'white',
                      padding: '0.4rem 0.85rem',
                      borderRadius: '6px',
                      fontSize: '0.7rem',
                      fontWeight: 'bold',
                      boxShadow: '0 4px 6px -1px rgba(234, 88, 12, 0.3)',
                      display: 'inline-block'
                    }}>
                      {buttonText}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Scrollable Quick Actions Mock */}
            <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'rgba(255,255,255,0.8)' }}>What's on your mind?</span>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {['Shop', 'Kundli', 'Panchang', 'Rashi'].map((label, idx) => (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', flex: 1 }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '0.85rem' }}>🕉️</span>
                    </div>
                    <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.6)' }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
            
          </div>
        </div>

      </div>

      {/* Configurations List Grid */}
      <div className="glass-card table-card" style={{ marginTop: '2rem' }}>
        <div className="card-header">
          <h3>Showcase Banner Configurations</h3>
          <p className="card-description">View, activate, and manage your homepage banners.</p>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '3rem', gap: '0.5rem', color: 'rgba(255,255,255,0.5)' }}>
            <Loader2 className="animate-spin" />
            <span>Loading banner data...</span>
          </div>
        ) : heroes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.5)' }}>
            No banner configurations found. Create your first banner using the form above!
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Title</th>
                <th>Highlight Date</th>
                <th>CTA Link</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {heroes.map((hero) => (
                <tr key={hero.id}>
                  <td>
                    <img 
                      src={hero.background_image} 
                      alt="Banner Preview" 
                      style={{ width: '60px', height: '35px', borderRadius: '4px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                  </td>
                  <td>
                    <div style={{ fontWeight: '500' }}>{hero.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {hero.subtitle}
                    </div>
                  </td>
                  <td>{hero.date_text || '—'}</td>
                  <td>
                    {hero.button_text ? (
                      <span className="badge-status info" style={{ fontSize: '0.7rem' }}>
                        {hero.button_text} ➔ {hero.button_link || '—'}
                      </span>
                    ) : '—'}
                  </td>
                  <td>
                    <button 
                      onClick={() => handleToggleActive(hero)}
                      className={`badge-status ${hero.is_active ? 'success' : 'warning'}`}
                      style={{ cursor: 'pointer', border: 'none', fontInherit: 'true', outline: 'none' }}
                      title="Click to toggle active status"
                    >
                      {hero.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button 
                        className="action-btn-primary" 
                        onClick={() => handleEdit(hero)}
                        style={{ padding: '0.4rem' }}
                      >
                        <Edit3 size={14} />
                      </button>
                      <button 
                        className="action-btn-danger" 
                        onClick={() => handleDelete(hero.id)}
                        style={{ padding: '0.4rem' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const session = localStorage.getItem('admin_session');
    if (session === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('admin_session');
    localStorage.removeItem('admin_username');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <Router>
      <div className="app-container">
        <Sidebar onLogout={handleLogout} />
        <main className="main-content">
          <Header />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/orders" element={<OrdersManagerPage />} />
            <Route path="/hero" element={<HeroManagerPage />} />
            <Route path="/banners" element={<BannersManagerPage />} />
            <Route path="/puja-banner" element={<PujaBannersManagerPage />} />
            <Route path="/video-reviews" element={<VideoReviewsManagerPage />} />
            <Route path="/pandit-videos" element={<PanditVideosManagerPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/one-rupee-poojas" element={<OneRupeeManagerPage />} />
            <Route path="/general-poojas" element={<GeneralPoojasManagerPage />} />
            <Route path="/website-products" element={<WebsiteProductsManagerPage />} />
            <Route path="/problem-solutions" element={<ProblemSolutionsManagerPage />} />
            <Route path="/combo-poojas" element={<ComboPoojasManagerPage />} />
            <Route path="/offer-sections" element={<OfferSectionsManagerPage />} />
            <Route path="/daily-rituals" element={<DailyRitualsManagerPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
