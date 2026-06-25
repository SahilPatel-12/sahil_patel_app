import { useState, useEffect, useRef } from 'react';
import { 
  Edit3, Trash2, Check, AlertTriangle, Upload, Loader2, Save, ArrowUp, ArrowDown, 
  Image as ImageIcon, Sparkles, Filter, Eye, RefreshCw, FolderPlus
} from 'lucide-react';
import { supabase } from './lib/supabase';
import { uploadToR2, deleteFromR2 } from './lib/r2';

// Dynamic client-side image compression utility
const compressImage = (file, maxWidth, maxHeight) => {
  return new Promise((resolve, reject) => {
    if (file.type === 'image/gif') {
      // Do not compress GIFs to preserve animations
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Adjust dimensions proportionally
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Export as transparent PNG
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas rendering failed'));
              return;
            }
            const compressedFile = new File([blob], file.name, {
              type: 'image/png',
              lastModified: Date.now()
            });
            resolve(compressedFile);
          },
          'image/png'
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

// Custom SVGs for a devotional preview vibe inside simulator
const TempleGateSVG = () => (
  <svg 
    viewBox="0 0 320 500" 
    style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: 2,
      pointerEvents: 'none'
    }}
  >
    {/* Golden Pillar Left */}
    <rect x="25" y="140" width="15" height="320" fill="url(#goldGrad)" rx="2" stroke="#d97706" strokeWidth="0.5" />
    <rect x="20" y="450" width="25" height="15" fill="url(#goldGrad)" rx="1" stroke="#d97706" strokeWidth="0.5" />
    <rect x="22" y="130" width="21" height="10" fill="url(#goldGrad)" rx="1" stroke="#d97706" strokeWidth="0.5" />
    
    {/* Golden Pillar Right */}
    <rect x="280" y="140" width="15" height="320" fill="url(#goldGrad)" rx="2" stroke="#d97706" strokeWidth="0.5" />
    <rect x="275" y="450" width="25" height="15" fill="url(#goldGrad)" rx="1" stroke="#d97706" strokeWidth="0.5" />
    <rect x="277" y="130" width="21" height="10" fill="url(#goldGrad)" rx="1" stroke="#d97706" strokeWidth="0.5" />

    {/* Arch / Top Dome */}
    <path 
      d="M 25 140 Q 160 30 295 140 L 280 140 Q 160 50 40 140 Z" 
      fill="url(#goldGrad)" 
      stroke="#d97706" 
      strokeWidth="0.5" 
    />
    
    {/* Decorative Temple Top Spire (Kalas) */}
    <path 
      d="M 150 45 L 160 10 L 170 45 L 165 47 L 160 38 L 155 47 Z" 
      fill="url(#goldGrad)" 
      stroke="#b45309" 
      strokeWidth="0.5" 
    />
    <circle cx="160" cy="22" r="4" fill="#ea580c" />
    <circle cx="160" cy="8" r="2.5" fill="#facc15" />
    
    {/* Arch inner ornaments */}
    <path 
      d="M 50 140 Q 160 70 270 140" 
      fill="none" 
      stroke="#b45309" 
      strokeWidth="1.5" 
      strokeDasharray="4 4" 
    />
    
    {/* Red/Saffron Arch Banner */}
    <path 
      d="M 40 140 L 280 140 L 270 152 Q 160 145 50 152 Z" 
      fill="#dc2626" 
      opacity="0.85" 
    />

    {/* Hanging Bells mockup inside SVG */}
    <circle cx="70" cy="170" r="3" fill="#facc15" />
    <line x1="70" y1="140" x2="70" y2="170" stroke="#facc15" strokeWidth="1" />
    
    <circle cx="250" cy="170" r="3" fill="#facc15" />
    <line x1="250" y1="140" x2="250" y2="170" stroke="#facc15" strokeWidth="1" />

    {/* Gradients */}
    <defs>
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="50%" stopColor="#eab308" />
        <stop offset="100%" stopColor="#ca8a04" />
      </linearGradient>
    </defs>
  </svg>
);

const getPreviewStyle = (category) => {
  let marginTop = 0;
  if (category === 'Shiv Ji') marginTop = -8;
  else if (category === 'Ma Laxmi') marginTop = -58;
  
  return {
    width: 'auto',
    height: 'auto',
    maxHeight: '85%',
    maxWidth: '80%',
    objectFit: 'contain',
    marginTop: `${marginTop}px`
  };
};

export default function GodImagesManagerPage() {
  const [activeTab, setActiveTab] = useState('images'); // 'images' or 'categories'
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  
  // Filtering & viewing states
  const [categoryFilter, setCategoryFilter] = useState('All Deities');
  const [selectedPreviewImage, setSelectedPreviewImage] = useState(null);

  // Images Form states
  const [isEditingId, setIsEditingId] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const initialFormState = {
    category: '',
    image_url: '',
    sort_order: 0
  };

  const [formData, setFormData] = useState(initialFormState);
  const imageInputRef = useRef(null);

  // Categories states
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [isEditingCategoryId, setIsEditingCategoryId] = useState(null);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [iconUploadProgress, setIconUploadProgress] = useState(0);

  const initialCategoryFormState = {
    name: '',
    icon_url: '',
    sort_order: 0
  };

  const [categoryFormData, setCategoryFormData] = useState(initialCategoryFormState);
  const categoryIconInputRef = useRef(null);

  // Pending files & image compression metadata states
  const [pendingImageFile, setPendingImageFile] = useState(null);
  const [pendingImagePreview, setPendingImagePreview] = useState('');
  const [compressingImage, setCompressingImage] = useState(false);
  const [imageSizes, setImageSizes] = useState({ original: 0, compressed: 0 });

  const [pendingIconFile, setPendingIconFile] = useState(null);
  const [pendingIconPreview, setPendingIconPreview] = useState('');
  const [compressingIcon, setCompressingIcon] = useState(false);
  const [iconSizes, setIconSizes] = useState({ original: 0, compressed: 0 });

  const fetchGodImages = async () => {
    setLoading(true);
    try {
      const { data, error: fetchErr } = await supabase
        .from('god_images')
        .select('*')
        .order('category', { ascending: true })
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (fetchErr) throw fetchErr;
      setImages(data || []);
      
      // Auto select first image for preview if nothing is selected
      if (data && data.length > 0 && !selectedPreviewImage) {
        setSelectedPreviewImage(data[0]);
      }
    } catch (err) {
      console.error('Error fetching god images:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    setCategoriesLoading(true);
    try {
      const { data, error: fetchErr } = await supabase
        .from('god_categories')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (fetchErr) throw fetchErr;
      setCategories(data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError(err.message);
    } finally {
      setCategoriesLoading(false);
    }
  };

  useEffect(() => {
    fetchGodImages();
    fetchCategories();
  }, []);

  // Set default category in images form once categories load
  useEffect(() => {
    if (categories.length > 0 && !formData.category) {
      setFormData(prev => ({ ...prev, category: categories[0].name }));
    }
  }, [categories]);

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

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showMessage('Please select a valid image file.', true);
      return;
    }

    if (pendingImagePreview) {
      URL.revokeObjectURL(pendingImagePreview);
    }

    setCompressingImage(true);
    try {
      showMessage('Compressing deity background image...');
      const compressedFile = await compressImage(file, 1080, 1728);
      setPendingImageFile(compressedFile);
      setPendingImagePreview(URL.createObjectURL(compressedFile));
      setImageSizes({
        original: file.size,
        compressed: compressedFile.size
      });
      showMessage('Image compressed successfully (Ready to publish on submit).');
    } catch (err) {
      console.error('Image compression error:', err);
      showMessage(`Compression failed: ${err.message}`, true);
    } finally {
      setCompressingImage(false);
    }
  };

  const handleIconSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showMessage('Please select a valid image file.', true);
      return;
    }

    if (pendingIconPreview) {
      URL.revokeObjectURL(pendingIconPreview);
    }

    setCompressingIcon(true);
    try {
      showMessage('Compressing category icon...');
      const compressedFile = await compressImage(file, 512, 512);
      setPendingIconFile(compressedFile);
      setPendingIconPreview(URL.createObjectURL(compressedFile));
      setIconSizes({
        original: file.size,
        compressed: compressedFile.size
      });
      showMessage('Icon compressed successfully (Ready to create category on submit).');
    } catch (err) {
      console.error('Icon compression error:', err);
      showMessage(`Compression failed: ${err.message}`, true);
    } finally {
      setCompressingIcon(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let imageUrl = formData.image_url;
    
    if (pendingImageFile) {
      setUploadingImage(true);
      setUploadProgress(0);
      try {
        imageUrl = await uploadToR2(pendingImageFile, 'hero', (progress) => {
          setUploadProgress(progress);
        });
        
        // Delete the old image from R2 if editing and updating image
        if (isEditingId) {
          const oldImg = images.find(img => img.id === isEditingId);
          if (oldImg && oldImg.image_url && oldImg.image_url !== imageUrl) {
            await deleteFromR2(oldImg.image_url);
          }
        }
      } catch (err) {
        console.error('Failed to upload deity image to R2:', err);
        showMessage(`Upload failed: ${err.message}`, true);
        setUploadingImage(false);
        return;
      } finally {
        setUploadingImage(false);
      }
    }
    
    if (!imageUrl) {
      return showMessage('Please select a deity image to compress and upload.', true);
    }
    
    if (!formData.category) return showMessage('Please select a deity category.', true);

    const payload = {
      category: formData.category,
      image_url: imageUrl,
      sort_order: parseInt(formData.sort_order) || 0
    };

    try {
      if (isEditingId) {
        // Edit Mode
        const { error: updateErr } = await supabase
          .from('god_images')
          .update(payload)
          .eq('id', isEditingId);

        if (updateErr) throw updateErr;
        showMessage('God image updated successfully!');
      } else {
        // Create Mode
        const { error: insertErr } = await supabase
          .from('god_images')
          .insert([payload]);

        if (insertErr) throw insertErr;
        showMessage('New God image added successfully!');
      }

      // Reset form and revoke blob URL
      if (pendingImagePreview) {
        URL.revokeObjectURL(pendingImagePreview);
      }
      setPendingImageFile(null);
      setPendingImagePreview('');
      setImageSizes({ original: 0, compressed: 0 });
      setUploadProgress(0);
      
      setFormData({
        category: categories[0]?.name || '',
        image_url: '',
        sort_order: 0
      });
      setIsEditingId(null);
      if (imageInputRef.current) imageInputRef.current.value = '';
      fetchGodImages();
    } catch (err) {
      console.error('Form submit error:', err);
      showMessage(err.message, true);
    }
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    if (!categoryFormData.name.trim()) return showMessage('Category name is required.', true);

    let iconUrl = categoryFormData.icon_url;

    if (pendingIconFile) {
      setUploadingIcon(true);
      setIconUploadProgress(0);
      try {
        iconUrl = await uploadToR2(pendingIconFile, 'categories', (progress) => {
          setIconUploadProgress(progress);
        });

        // Delete the old icon from R2 if editing and updating icon
        if (isEditingCategoryId) {
          const oldCat = categories.find(c => c.id === isEditingCategoryId);
          if (oldCat && oldCat.icon_url && oldCat.icon_url !== iconUrl) {
            await deleteFromR2(oldCat.icon_url);
          }
        }
      } catch (err) {
        console.error('Failed to upload category icon to R2:', err);
        showMessage(`Upload failed: ${err.message}`, true);
        setUploadingIcon(false);
        return;
      } finally {
        setUploadingIcon(false);
      }
    }

    const payload = {
      name: categoryFormData.name.trim(),
      icon_url: iconUrl,
      sort_order: parseInt(categoryFormData.sort_order) || 0
    };

    try {
      if (isEditingCategoryId) {
        // Edit Mode
        const { error: updateErr } = await supabase
          .from('god_categories')
          .update(payload)
          .eq('id', isEditingCategoryId);

        if (updateErr) throw updateErr;
        showMessage('Deity category updated successfully!');
      } else {
        // Create Mode
        const { error: insertErr } = await supabase
          .from('god_categories')
          .insert([payload]);

        if (insertErr) throw insertErr;
        showMessage('New deity category created successfully!');
      }

      // Reset Form and revoke blob URL
      if (pendingIconPreview) {
        URL.revokeObjectURL(pendingIconPreview);
      }
      setPendingIconFile(null);
      setPendingIconPreview('');
      setIconSizes({ original: 0, compressed: 0 });
      setIconUploadProgress(0);

      setCategoryFormData(initialCategoryFormState);
      setIsEditingCategoryId(null);
      if (categoryIconInputRef.current) categoryIconInputRef.current.value = '';
      fetchCategories();
      fetchGodImages(); // Refresh drop downs
    } catch (err) {
      console.error('Category form submit error:', err);
      showMessage(err.message, true);
    }
  };

  const handleEdit = (img) => {
    setIsEditingId(img.id);
    setFormData({
      category: img.category,
      image_url: img.image_url,
      sort_order: img.sort_order
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditCategory = (cat) => {
    setIsEditingCategoryId(cat.id);
    setCategoryFormData({
      name: cat.name,
      icon_url: cat.icon_url || '',
      sort_order: cat.sort_order
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this deity image?')) return;

    try {
      const imgToDelete = images.find(img => img.id === id);
      if (imgToDelete && imgToDelete.image_url) {
        showMessage('Deleting image file from Cloudflare R2...');
        await deleteFromR2(imgToDelete.image_url);
      }

      const { error: delErr } = await supabase
        .from('god_images')
        .delete()
        .eq('id', id);

      if (delErr) throw delErr;
      showMessage('God image deleted successfully from both Database & Cloudflare R2.');
      
      if (selectedPreviewImage?.id === id) {
        setSelectedPreviewImage(null);
      }
      
      fetchGodImages();
    } catch (err) {
      console.error('Delete error:', err);
      showMessage(err.message, true);
    }
  };

  const handleDeleteCategory = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete category "${name}"? This will delete all background images associated with it.`)) return;

    try {
      // 1. Delete all background images in R2 associated with this category
      const imagesToDelete = images.filter(img => img.category === name);
      if (imagesToDelete.length > 0) {
        showMessage(`Deleting ${imagesToDelete.length} deity background images from Cloudflare R2...`);
        for (const img of imagesToDelete) {
          if (img.image_url) {
            await deleteFromR2(img.image_url);
          }
        }
      }

      // 2. Delete the category's own icon from R2
      const catToDelete = categories.find(c => c.id === id);
      if (catToDelete && catToDelete.icon_url) {
        showMessage('Deleting category icon from Cloudflare R2...');
        await deleteFromR2(catToDelete.icon_url);
      }

      // 3. Delete associated background images from Supabase first explicitly
      await supabase.from('god_images').delete().eq('category', name);

      // 4. Delete the category from Supabase
      const { error: delErr } = await supabase
        .from('god_categories')
        .delete()
        .eq('id', id);

      if (delErr) throw delErr;
      showMessage('Deity category and all associated assets deleted from Database & Cloudflare R2.');
      
      // Reset images form to first category if the deleted one was selected
      if (formData.category === name) {
        const remaining = categories.filter(c => c.id !== id);
        setFormData(prev => ({ ...prev, category: remaining[0]?.name || '' }));
      }

      fetchCategories();
      fetchGodImages();
    } catch (err) {
      console.error('Category delete error:', err);
      showMessage(err.message, true);
    }
  };

  const handleMove = async (filteredList, index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= filteredList.length) return;

    const target = filteredList[index];
    const swapWith = filteredList[newIndex];

    const currentSort = target.sort_order;
    const swapSort = swapWith.sort_order;

    try {
      const { error: err1 } = await supabase
        .from('god_images')
        .update({ sort_order: swapSort })
        .eq('id', target.id);
      
      const { error: err2 } = await supabase
        .from('god_images')
        .update({ sort_order: currentSort })
        .eq('id', swapWith.id);

      if (err1 || err2) throw err1 || err2;
      fetchGodImages();
    } catch (err) {
      console.error('Reordering failed:', err);
      showMessage('Failed to swap image sequence.', true);
    }
  };

  const handleMoveCategory = async (filteredList, index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= filteredList.length) return;

    const target = filteredList[index];
    const swapWith = filteredList[newIndex];

    const currentSort = target.sort_order;
    const swapSort = swapWith.sort_order;

    try {
      const { error: err1 } = await supabase
        .from('god_categories')
        .update({ sort_order: swapSort })
        .eq('id', target.id);
      
      const { error: err2 } = await supabase
        .from('god_categories')
        .update({ sort_order: currentSort })
        .eq('id', swapWith.id);

      if (err1 || err2) throw err1 || err2;
      fetchCategories();
    } catch (err) {
      console.error('Category reordering failed:', err);
      showMessage('Failed to swap category sequence.', true);
    }
  };

  const clearForm = () => {
    if (pendingImagePreview) {
      URL.revokeObjectURL(pendingImagePreview);
    }
    setFormData({
      category: categories[0]?.name || '',
      image_url: '',
      sort_order: 0
    });
    setIsEditingId(null);
    setPendingImageFile(null);
    setPendingImagePreview('');
    setImageSizes({ original: 0, compressed: 0 });
    setUploadProgress(0);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const clearCategoryForm = () => {
    if (pendingIconPreview) {
      URL.revokeObjectURL(pendingIconPreview);
    }
    setCategoryFormData(initialCategoryFormState);
    setIsEditingCategoryId(null);
    setPendingIconFile(null);
    setPendingIconPreview('');
    setIconSizes({ original: 0, compressed: 0 });
    setIconUploadProgress(0);
    if (categoryIconInputRef.current) categoryIconInputRef.current.value = '';
  };

  // Filter list by category dropdown choice
  const filteredImages = images.filter(img => 
    categoryFilter === 'All Deities' ? true : img.category === categoryFilter
  );

  return (
    <div className="page-content" style={{ fontFamily: '"Outfit", sans-serif' }}>
      <div className="page-header">
        <h1 className="gradient-text">God's Gallery & Categories</h1>
        <p>Manage deity categories with custom icons, upload deity-specific background images to Cloudflare R2, and sync them to the mobile app.</p>
      </div>

      {/* Tab Selector */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '12px' }}>
        <button
          onClick={() => setActiveTab('images')}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            backgroundColor: activeTab === 'images' ? 'rgba(234, 88, 12, 0.15)' : 'transparent',
            border: activeTab === 'images' ? '1px solid #ea580c' : '1px solid transparent',
            color: activeTab === 'images' ? '#ea580c' : 'var(--text-muted)',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          Deity Background Images
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            backgroundColor: activeTab === 'categories' ? 'rgba(234, 88, 12, 0.15)' : 'transparent',
            border: activeTab === 'categories' ? '1px solid #ea580c' : '1px solid transparent',
            color: activeTab === 'categories' ? '#ea580c' : 'var(--text-muted)',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          Manage Deity Categories
        </button>
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
        
        {/* Left Panel: Creator & Editor Form */}
        <div className="manager-form-section" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {activeTab === 'categories' ? (
            /* TAB 2: MANAGE CATEGORIES */
            <>
              <div className="glass-card">
                <h3 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FolderPlus size={20} color="#ea580c" />
                  {isEditingCategoryId ? 'Edit Deity Category Details' : 'Add New Deity Category'}
                </h3>

                <form onSubmit={handleCategorySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  
                  <div className="form-group">
                    <label>Category / God Name *</label>
                    <input 
                      type="text"
                      name="name"
                      className="input-field"
                      placeholder="e.g. Ram Ji, Saraswati Ma"
                      value={categoryFormData.name}
                      onChange={(e) => setCategoryFormData(prev => ({ ...prev, name: e.target.value }))}
                      required
                    />
                  </div>

                  {/* Category Icon Upload */}
                  <div className="form-group" style={{ border: '1px dashed var(--border)', borderRadius: 'var(--radius)', padding: '1.25rem', background: 'rgba(255,255,255,0.01)' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
                      <ImageIcon size={16} color="#ea580c" />
                      Category Icon Image *
                    </label>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                      Upload a small image/icon representing this deity. **Recommended size: 512 × 512 px (1:1 aspect ratio)** for circular avatar layout.
                    </p>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <input 
                        type="file" 
                        accept="image/*" 
                        ref={categoryIconInputRef}
                        onChange={handleIconSelect}
                        disabled={uploadingIcon || compressingIcon}
                        style={{ display: 'none' }}
                      />
                      <button 
                        type="button" 
                        className="btn-secondary" 
                        disabled={uploadingIcon || compressingIcon}
                        onClick={() => categoryIconInputRef.current?.click()}
                        style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}
                      >
                        {compressingIcon ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : uploadingIcon ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Upload size={16} />
                        )}
                        {compressingIcon 
                          ? 'Compressing...' 
                          : uploadingIcon 
                          ? 'Uploading...' 
                          : pendingIconPreview || categoryFormData.icon_url 
                          ? 'Change Icon File' 
                          : 'Choose Icon File'}
                      </button>
                      
                      {uploadingIcon && (
                        <span style={{ fontSize: '0.8rem', color: '#ea580c', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          Uploading to R2 ({iconUploadProgress}%)
                        </span>
                      )}
                      
                      {categoryFormData.icon_url && !pendingIconFile && (
                        <span style={{ fontSize: '0.8rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Check size={14} /> Synced to R2.
                        </span>
                      )}

                      {pendingIconFile && (
                        <span style={{ fontSize: '0.8rem', color: '#ea580c', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <AlertTriangle size={14} /> Pending Submit.
                        </span>
                      )}
                    </div>

                    {uploadingIcon && (
                      <div style={{ marginTop: '8px', width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                          <span>R2 Upload Progress</span>
                          <span>{iconUploadProgress}%</span>
                        </div>
                        <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${iconUploadProgress}%`, height: '100%', backgroundColor: '#ea580c', transition: 'width 0.1s ease-out' }}></div>
                        </div>
                      </div>
                    )}

                    {pendingIconFile && iconSizes.original > 0 && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px', display: 'flex', gap: '16px' }}>
                        <span>Original: <strong>{(iconSizes.original / 1024).toFixed(1)} KB</strong></span>
                        <span>Compressed: <strong style={{ color: '#10b981' }}>{(iconSizes.compressed / 1024).toFixed(1)} KB</strong></span>
                        <span>Saved: <strong style={{ color: '#10b981' }}>{((1 - iconSizes.compressed / iconSizes.original) * 100).toFixed(0)}%</strong></span>
                      </div>
                    )}
                    
                    {(pendingIconPreview || categoryFormData.icon_url) && (
                      <div style={{ display: 'flex', gap: '12px', marginTop: '12px', alignItems: 'center' }}>
                        <img 
                          src={pendingIconPreview || categoryFormData.icon_url} 
                          alt="Category Icon Preview" 
                          style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)', backgroundColor: 'rgba(234, 152, 78, 0.2)' }} 
                        />
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '280px' }}>
                          {pendingIconFile ? (
                            <span style={{ color: '#ea580c', fontWeight: 'bold' }}>Local Compressed (Unpublished)</span>
                          ) : (
                            <>
                              <strong>CDN Link:</strong> <a href={categoryFormData.icon_url} target="_blank" rel="noreferrer" style={{ color: '#ea580c' }}>Open Icon</a>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Sort order priority</label>
                    <input 
                      type="number" 
                      name="sort_order" 
                      className="input-field"
                      value={categoryFormData.sort_order}
                      onChange={(e) => setCategoryFormData(prev => ({ ...prev, sort_order: parseInt(e.target.value) || 0 }))}
                    />
                  </div>

                  <div className="form-actions" style={{ marginTop: '0.5rem' }}>
                    {isEditingCategoryId && (
                      <button 
                        type="button" 
                        className="btn-secondary" 
                        onClick={clearCategoryForm}
                        style={{ marginRight: '8px' }}
                      >
                        Cancel Edit
                      </button>
                    )}
                    <button 
                      type="submit" 
                      className="btn-primary" 
                      disabled={uploadingIcon || compressingIcon}
                    >
                      {uploadingIcon ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Uploading ({iconUploadProgress}%)
                        </>
                      ) : (
                        <>
                          <Save size={16} />
                          {isEditingCategoryId ? 'Update Category' : 'Create Category'}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Categories List Section */}
              <div className="glass-card">
                <h3 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FolderPlus size={20} color="#ea580c" />
                  Deity Categories ({categories.length})
                </h3>

                {categoriesLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem', gap: '12px' }}>
                    <Loader2 size={32} className="animate-spin" color="#ea580c" />
                    <span style={{ color: 'var(--text-muted)' }}>Loading categories...</span>
                  </div>
                ) : categories.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No categories found. Create a category above!
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th style={{ width: '40px' }}>Seq</th>
                          <th style={{ width: '60px' }}>Icon</th>
                          <th>Category Name</th>
                          <th style={{ width: '160px', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categories.map((cat, idx) => (
                          <tr key={cat.id} style={{ background: isEditingCategoryId === cat.id ? 'rgba(234,88,12,0.06)' : 'transparent' }}>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <button 
                                  type="button" 
                                  onClick={() => handleMoveCategory(categories, idx, 'up')}
                                  disabled={idx === 0}
                                  style={{ color: idx === 0 ? 'rgba(255,255,255,0.1)' : 'var(--text-muted)', cursor: idx === 0 ? 'not-allowed' : 'pointer' }}
                                >
                                  <ArrowUp size={14} />
                                </button>
                                <span style={{ fontSize: '11px', fontWeight: 'bold', margin: '2px 0' }}>{cat.sort_order}</span>
                                <button 
                                  type="button" 
                                  onClick={() => handleMoveCategory(categories, idx, 'down')}
                                  disabled={idx === categories.length - 1}
                                  style={{ color: idx === categories.length - 1 ? 'rgba(255,255,255,0.1)' : 'var(--text-muted)', cursor: idx === categories.length - 1 ? 'not-allowed' : 'pointer' }}
                                >
                                  <ArrowDown size={14} />
                                </button>
                              </div>
                            </td>
                            <td>
                              {cat.icon_url ? (
                                <img 
                                  src={cat.icon_url} 
                                  alt={cat.name}
                                  style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)' }}
                                />
                              ) : (
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
                                  Local
                                </div>
                              )}
                            </td>
                            <td>
                              <div style={{ fontWeight: 'bold', color: 'var(--text-main)', textAlign: 'left' }}>{cat.name}</div>
                              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>
                                {cat.icon_url || 'Using default high-resolution local icon'}
                              </div>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                <button 
                                  type="button"
                                  className="action-btn-primary"
                                  onClick={() => handleEditCategory(cat)}
                                  style={{ padding: '0.4rem 0.6rem' }}
                                >
                                  <Edit3 size={13} /> Edit
                                </button>
                                <button 
                                  type="button"
                                  className="action-btn-danger"
                                  onClick={() => handleDeleteCategory(cat.id, cat.name)}
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
            </>
          ) : (
            /* TAB 1: MANAGE BACKGROUND IMAGES (Existing UI) */
            <>
              <div className="glass-card">
                <h3 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Sparkles size={20} color="#ea580c" />
                  {isEditingId ? 'Edit Deity Image Details' : 'Add New God / Deity Image'}
                </h3>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  
                  <div className="form-group">
                    <label>Deity Category / God Name *</label>
                    {categoriesLoading ? (
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Loading deity dropdown...</div>
                    ) : categories.length === 0 ? (
                      <div style={{ color: '#ef4444', fontSize: '0.85rem' }}>No categories found. Please create a category first!</div>
                    ) : (
                      <select 
                        name="category"
                        className="input-field"
                        value={formData.category}
                        onChange={handleInputChange}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          borderRadius: '8px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          color: 'white'
                        }}
                      >
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.name} style={{ backgroundColor: '#0f172a' }}>{cat.name}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* R2 Image Upload */}
                  <div className="form-group" style={{ border: '1px dashed var(--border)', borderRadius: 'var(--radius)', padding: '1.25rem', background: 'rgba(255,255,255,0.01)' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
                      <ImageIcon size={16} color="#ea580c" />
                      Deity Image File *
                    </label>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                      Choose a high-resolution, centered image of the deity. **Recommended size: 1000 × 1600 px (5:8 aspect ratio)**. PNG or transparent background is preferred to blend inside the temple gate.
                    </p>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <input 
                        type="file" 
                        accept="image/*" 
                        ref={imageInputRef}
                        onChange={handleImageSelect}
                        disabled={uploadingImage || compressingImage}
                        style={{ display: 'none' }}
                      />
                      <button 
                        type="button" 
                        className="btn-secondary" 
                        disabled={uploadingImage || compressingImage}
                        onClick={() => imageInputRef.current?.click()}
                        style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}
                      >
                        {compressingImage ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : uploadingImage ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Upload size={16} />
                        )}
                        {compressingImage 
                          ? 'Compressing...' 
                          : uploadingImage 
                          ? 'Uploading...' 
                          : pendingImagePreview || formData.image_url 
                          ? 'Change Image File' 
                          : 'Choose Image File'}
                      </button>

                      {uploadingImage && (
                        <span style={{ fontSize: '0.8rem', color: '#ea580c', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          Uploading to R2 ({uploadProgress}%)
                        </span>
                      )}

                      {formData.image_url && !pendingImageFile && (
                        <span style={{ fontSize: '0.8rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Check size={14} /> Synced to R2.
                        </span>
                      )}

                      {pendingImageFile && (
                        <span style={{ fontSize: '0.8rem', color: '#ea580c', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <AlertTriangle size={14} /> Pending Submit.
                        </span>
                      )}
                    </div>

                    {uploadingImage && (
                      <div style={{ marginTop: '8px', width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                          <span>R2 Upload Progress</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <div style={{ width: '100%', height: '6px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${uploadProgress}%`, height: '100%', backgroundColor: '#ea580c', transition: 'width 0.1s ease-out' }}></div>
                        </div>
                      </div>
                    )}

                    {pendingImageFile && imageSizes.original > 0 && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px', display: 'flex', gap: '16px' }}>
                        <span>Original: <strong>{(imageSizes.original / 1024).toFixed(1)} KB</strong></span>
                        <span>Compressed: <strong style={{ color: '#10b981' }}>{(imageSizes.compressed / 1024).toFixed(1)} KB</strong></span>
                        <span>Saved: <strong style={{ color: '#10b981' }}>{((1 - imageSizes.compressed / imageSizes.original) * 100).toFixed(0)}%</strong></span>
                      </div>
                    )}
                    
                    {(pendingImagePreview || formData.image_url) && (
                      <div style={{ display: 'flex', gap: '12px', marginTop: '12px', alignItems: 'center' }}>
                        <img 
                          src={pendingImagePreview || formData.image_url} 
                          alt="Deity Preview" 
                          style={{ width: '60px', height: '100px', borderRadius: '6px', objectFit: 'contain', border: '1px solid var(--border)', backgroundColor: 'rgba(234, 152, 78, 0.2)' }} 
                        />
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '280px' }}>
                          {pendingImageFile ? (
                            <span style={{ color: '#ea580c', fontWeight: 'bold' }}>Local Compressed (Unpublished)</span>
                          ) : (
                            <>
                              <strong>Public URL:</strong> <a href={formData.image_url} target="_blank" rel="noreferrer" style={{ color: '#ea580c' }}>Open Link</a>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Sort order priority</label>
                    <input 
                      type="number" 
                      name="sort_order" 
                      className="input-field"
                      value={formData.sort_order}
                      onChange={handleInputChange}
                    />
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
                      disabled={uploadingImage || compressingImage || categories.length === 0}
                    >
                      {uploadingImage ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Uploading ({uploadProgress}%)
                        </>
                      ) : (
                        <>
                          <Save size={16} />
                          {isEditingId ? 'Update Details' : 'Publish Image'}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* List Section */}
              <div className="glass-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '12px' }}>
                  <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ImageIcon size={20} color="#ea580c" />
                    Active Images ({filteredImages.length})
                  </h3>
                  
                  {/* Category Filter */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Filter size={16} color="var(--text-muted)" />
                    {categoriesLoading ? (
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading filters...</div>
                    ) : (
                      <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        style={{
                          padding: '0.4rem 1rem',
                          borderRadius: '6px',
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          color: 'white',
                          fontSize: '0.85rem'
                        }}
                      >
                        <option value="All Deities" style={{ backgroundColor: '#0f172a' }}>All Deities</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.name} style={{ backgroundColor: '#0f172a' }}>{cat.name}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {loading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '3rem', gap: '12px' }}>
                    <Loader2 size={32} className="animate-spin" color="#ea580c" />
                    <span style={{ color: 'var(--text-muted)' }}>Loading images...</span>
                  </div>
                ) : filteredImages.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No images found for filter "{categoryFilter}". Publish an image above!
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th style={{ width: '40px' }}>Seq</th>
                          <th style={{ width: '80px' }}>Image</th>
                          <th>Deity Category</th>
                          <th style={{ width: '160px', textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredImages.map((img, idx) => (
                          <tr key={img.id} style={{ background: isEditingId === img.id ? 'rgba(234,88,12,0.06)' : 'transparent' }}>
                            <td>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <button 
                                  type="button" 
                                  onClick={() => handleMove(filteredImages, idx, 'up')}
                                  disabled={idx === 0}
                                  style={{ color: idx === 0 ? 'rgba(255,255,255,0.1)' : 'var(--text-muted)', cursor: idx === 0 ? 'not-allowed' : 'pointer' }}
                                >
                                  <ArrowUp size={14} />
                                </button>
                                <span style={{ fontSize: '11px', fontWeight: 'bold', margin: '2px 0' }}>{img.sort_order}</span>
                                <button 
                                  type="button" 
                                  onClick={() => handleMove(filteredImages, idx, 'down')}
                                  disabled={idx === filteredImages.length - 1}
                                  style={{ color: idx === filteredImages.length - 1 ? 'rgba(255,255,255,0.1)' : 'var(--text-muted)', cursor: idx === filteredImages.length - 1 ? 'not-allowed' : 'pointer' }}
                                >
                                  <ArrowDown size={14} />
                                </button>
                              </div>
                            </td>
                            <td>
                              <img 
                                src={img.image_url} 
                                alt={img.category}
                                style={{ width: '45px', height: '75px', borderRadius: '4px', objectFit: 'contain', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}
                              />
                            </td>
                            <td>
                              <div style={{ fontWeight: 'bold', color: 'var(--text-main)', textAlign: 'left' }}>{img.category}</div>
                              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>
                                {img.image_url}
                              </div>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                <button 
                                  type="button"
                                  className="action-btn-primary"
                                  onClick={() => setSelectedPreviewImage(img)}
                                  style={{ padding: '0.4rem', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.2)' }}
                                  title="Show in Device Preview"
                                >
                                  <Eye size={13} />
                                </button>
                                <button 
                                  type="button"
                                  className="action-btn-primary"
                                  onClick={() => handleEdit(img)}
                                  style={{ padding: '0.4rem 0.6rem' }}
                                >
                                  <Edit3 size={13} /> Edit
                                </button>
                                <button 
                                  type="button"
                                  className="action-btn-danger"
                                  onClick={() => handleDelete(img.id)}
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
            </>
          )}
        </div>

        {/* Right Panel: Live Mobile App Simulator Mockup */}
        <div className="manager-preview-section">
          <div style={{ marginBottom: '14px', width: '100%', textAlign: 'center' }}>
            <h4 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Eye size={16} color="#ea580c" />
              Live Temple Preview
            </h4>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Visualizes the selected deity image behind the temple gate arch.</span>
          </div>

          <div className="phone-simulator">
            <div className="phone-notch"></div>
            <div className="phone-content" style={{ 
              backgroundColor: '#eb984e', // Matching mobile app background
              height: '100%', 
              padding: '24px 0 0 0', 
              display: 'flex', 
              flexDirection: 'column',
              position: 'relative'
            }}>
              
              {/* Header Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px 4px 16px', zIndex: 10 }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'white' }}>Temple Darshan</span>
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff', backgroundColor: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '12px' }}>
                  {selectedPreviewImage ? selectedPreviewImage.category : (formData.image_url ? formData.category : 'No Deity')}
                </span>
              </div>

              {/* Dynamic Deity Composition Area */}
              <div style={{ flex: 1, position: 'relative', marginTop: '-10px', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                
                {/* Temple Gate Outline Overlay (Golden Arch) */}
                <TempleGateSVG />
                
                {/* Deity Image inside Gate */}
                <div style={{ 
                  width: '100%', 
                  height: '75%', 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center',
                  zIndex: 1,
                  position: 'absolute',
                  top: '18%'
                }}>
                  {pendingImagePreview ? (
                    <img 
                      src={pendingImagePreview} 
                      alt="Pending Simulator Deity"
                      style={getPreviewStyle(formData.category)}
                    />
                  ) : selectedPreviewImage ? (
                    <img 
                      src={selectedPreviewImage.image_url} 
                      alt="Active Simulator Deity"
                      style={getPreviewStyle(selectedPreviewImage.category)}
                    />
                  ) : formData.image_url ? (
                    <img 
                      src={formData.image_url} 
                      alt="Uploading Deity"
                      style={{ 
                        ...getPreviewStyle(formData.category),
                        opacity: 0.65,
                        filter: 'blur(0.5px)'
                      }}
                    />
                  ) : (
                    <div style={{
                      textAlign: 'center',
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontSize: '11px',
                      background: 'rgba(0,0,0,0.35)',
                      padding: '12px 18px',
                      borderRadius: '12px',
                      maxWidth: '70%',
                      backdropFilter: 'blur(5px)',
                      border: '1px dashed rgba(255, 255, 255, 0.2)'
                    }}>
                      <ImageIcon size={20} style={{ margin: '0 auto 6px auto', display: 'block', opacity: 0.8 }} />
                      No image uploaded yet. Displaying default local asset in-app.
                    </div>
                  )}
                </div>

                {/* Bottom Pooja Utilities Overlay Stubs */}
                <div style={{
                  position: 'absolute',
                  bottom: '16px',
                  left: '16px',
                  zIndex: 10,
                  backgroundColor: 'rgba(255,255,255,0.25)',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <span style={{ fontSize: '13px' }}>🔔</span>
                </div>
                
                <div style={{
                  position: 'absolute',
                  bottom: '16px',
                  right: '16px',
                  zIndex: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{
                    backgroundColor: 'rgba(255,255,255,0.25)',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <span style={{ fontSize: '13px' }}>🌸</span>
                  </div>
                  <div style={{
                    backgroundColor: 'rgba(255,255,255,0.25)',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <span style={{ fontSize: '13px' }}>🔥</span>
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
