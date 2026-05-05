import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/axios';
import toast from 'react-hot-toast';

const CATEGORIES = ['Electronics', 'Fashion', 'Furniture', 'Vehicles', 'Art', 'Jewelry', 'Sports', 'Other'];

const CreateAuction = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    description: '',
    basePrice: '',
    category: 'Electronics',
    duration: '24',
    customEnd: '',
    useCustomEnd: false,
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const getAISuggestion = async () => {
    if (!form.title) return toast.error('Please enter a Title first to get an AI suggestion');
    setLoadingAi(true); setAiSuggestion(null);
    try {
      const { data } = await API.post('/ai/suggest-price', {
        title: form.title, description: form.description, category: form.category
      });
      setAiSuggestion(data.data);
      toast.success('AI Suggestion generated!');
    } catch (err) {
      toast.error('Failed to get AI suggestion');
    } finally { setLoadingAi(false); }
  };

  const applyAISuggestion = () => {
    if (aiSuggestion) {
      setForm(f => ({ ...f, basePrice: String(aiSuggestion.suggestedPrice) }));
      setAiSuggestion(null);
      toast.success('Suggested price applied!');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error('Image must be under 5MB');
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.basePrice) return toast.error('Please fill all required fields');
    if (parseFloat(form.basePrice) <= 0) return toast.error('Base price must be positive');

    let endTime;
    if (form.useCustomEnd) {
      endTime = new Date(form.customEnd);
      if (endTime <= new Date()) return toast.error('End time must be in the future');
    } else {
      endTime = new Date(Date.now() + parseFloat(form.duration) * 60 * 60 * 1000);
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('basePrice', form.basePrice);
      formData.append('category', form.category);
      formData.append('endTime', endTime.toISOString());
      if (image) formData.append('image', image);

      const { data } = await API.post('/auctions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Auction created successfully! 🎉');
      navigate(`/auctions/${data.data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create auction');
    } finally { setLoading(false); }
  };

  return (
    <div className="page-wrapper">
      <div className="create-header animate-fade-in">
        <h1>List an Item for Auction</h1>
        <p className="text-muted" style={{ marginTop: 4 }}>Fill in the details below to start your auction</p>
      </div>

      <div className="create-layout animate-fade-in">
        <form onSubmit={handleSubmit} id="create-auction-form" className="create-form">

          {/* ── Item Details ── */}
          <div className="create-section card">
            <h2 className="create-section-title">📋 Item Details</h2>

            <div className="form-group">
              <label className="form-label" htmlFor="auction-title">Title *</label>
              <input
                id="auction-title" name="title" type="text" className="form-input"
                placeholder="e.g. iPhone 15 Pro Max 256GB"
                value={form.title} onChange={handleChange} maxLength={100}
              />
              <div className="char-count">{form.title.length}/100</div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="auction-desc">Description *</label>
              <textarea
                id="auction-desc" name="description" className="form-input"
                placeholder="Describe your item in detail — condition, specifications, what's included..."
                value={form.description} onChange={handleChange} rows={4} maxLength={2000}
              />
              <div className="char-count">{form.description.length}/2000</div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label" htmlFor="auction-price">Base Price (₹) *</label>
                <div className="input-with-prefix" style={{ marginBottom: 12 }}>
                  <span className="input-prefix">₹</span>
                  <input
                    id="auction-price" name="basePrice" type="number" className="form-input"
                    placeholder="10000" value={form.basePrice} onChange={handleChange} min="1" step="1"
                  />
                </div>

                <button type="button" className="btn btn-secondary btn-sm"
                  onClick={getAISuggestion} disabled={loadingAi}
                  style={{ width: '100%', marginBottom: aiSuggestion ? 12 : 0 }}>
                  {loadingAi ? <span className="btn-spinner" /> : '✨ AI Price Suggestion'}
                </button>

                {aiSuggestion && (
                  <div className="ai-suggestion-box">
                    <div className="ai-header">
                      <span>🤖 Suggested:</span>
                      <span className="ai-price">₹{aiSuggestion.suggestedPrice.toLocaleString('en-IN')}</span>
                    </div>
                    <p className="ai-reason">{aiSuggestion.reasoning}</p>
                    <button type="button" className="btn btn-primary btn-sm btn-full" onClick={applyAISuggestion}>
                      Apply This Price
                    </button>
                    {aiSuggestion.isMock && (
                      <div style={{ fontSize: 10, color: '#aeaeb2', marginTop: 8, textAlign: 'center' }}>
                        Using mock fallback (Add GEMINI_API_KEY for real AI)
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="auction-category">Category</label>
                <select id="auction-category" name="category" className="form-input"
                  value={form.category} onChange={handleChange}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* ── Auction Duration ── */}
          <div className="create-section card">
            <h2 className="create-section-title">⏱️ Auction Duration</h2>

            <div className="duration-toggle">
              <label className="toggle-label">
                <input type="checkbox" name="useCustomEnd"
                  checked={form.useCustomEnd} onChange={handleChange} className="toggle-checkbox" />
                <span className="toggle-slider" />
                Use custom end date/time
              </label>
            </div>

            {!form.useCustomEnd ? (
              <div>
                <label className="form-label">Duration</label>
                <div className="duration-options">
                  {[
                    { value: '1', label: '1 Hour' },
                    { value: '6', label: '6 Hours' },
                    { value: '24', label: '1 Day' },
                    { value: '48', label: '2 Days' },
                    { value: '72', label: '3 Days' },
                    { value: '168', label: '1 Week' },
                  ].map(o => (
                    <label key={o.value} className={`duration-option ${form.duration === o.value ? 'active' : ''}`}>
                      <input type="radio" name="duration" value={o.value}
                        checked={form.duration === o.value} onChange={handleChange}
                        style={{ display: 'none' }} />
                      {o.label}
                    </label>
                  ))}
                </div>
                <p className="duration-hint">
                  Ends: {new Date(Date.now() + parseFloat(form.duration || 24) * 60 * 60 * 1000).toLocaleString('en-IN')}
                </p>
              </div>
            ) : (
              <div className="form-group">
                <label className="form-label" htmlFor="custom-end">End Date &amp; Time</label>
                <input
                  id="custom-end" name="customEnd" type="datetime-local" className="form-input"
                  value={form.customEnd} onChange={handleChange}
                  min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
                />
              </div>
            )}
          </div>

          <button id="create-auction-submit" type="submit"
            className="btn btn-primary btn-full btn-lg" disabled={loading}>
            {loading ? <span className="btn-spinner" /> : '🚀 Launch Auction'}
          </button>
        </form>

        {/* ── Sidebar ── */}
        <div className="create-sidebar">
          <div className="image-upload-card card">
            <h2 className="create-section-title">🖼️ Product Image</h2>
            <div
              className={`image-drop-zone ${imagePreview ? 'has-image' : ''}`}
              onClick={() => document.getElementById('image-input').click()}
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="image-preview" />
              ) : (
                <div className="image-drop-content">
                  <span className="image-drop-icon">📸</span>
                  <div className="image-drop-text">Click to upload image</div>
                  <div className="image-drop-hint">JPEG, PNG, WEBP up to 5MB</div>
                </div>
              )}
            </div>
            <input id="image-input" type="file" accept="image/*" onChange={handleImage} style={{ display: 'none' }} />
            {imagePreview && (
              <button type="button" className="btn btn-secondary btn-sm btn-full"
                onClick={() => { setImage(null); setImagePreview(null); }} style={{ marginTop: 12 }}>
                Remove Image
              </button>
            )}
          </div>

          {/* Preview Card */}
          <div className="preview-card card">
            <h2 className="create-section-title">👁️ Preview</h2>
            <div className="preview-mini">
              <div className="preview-image">
                {imagePreview
                  ? <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span>🛍️</span>}
              </div>
              <div className="preview-body">
                <div className="preview-title">{form.title || 'Your Auction Title'}</div>
                <div className="preview-price">₹{parseFloat(form.basePrice || 0).toLocaleString('en-IN')}</div>
                <div className="preview-category">{form.category}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .create-header { margin-bottom: 28px; }
        .create-header h1 { font-size: 26px; font-weight: 800; margin-bottom: 4px; letter-spacing: -0.4px; }
        .create-layout { display: grid; grid-template-columns: 1fr 300px; gap: 24px; align-items: start; }
        .create-form { display: flex; flex-direction: column; gap: 18px; }
        .create-section { padding: 24px; }
        .create-section-title { font-size: 15px; font-weight: 700; margin-bottom: 20px; color: #1d1d1f; letter-spacing: -0.2px; }
        .form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .char-count { text-align: right; font-size: 11px; color: #aeaeb2; margin-top: 4px; }
        .input-with-prefix { position: relative; }
        .input-prefix { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); font-weight: 700; color: #6e6e73; z-index: 1; }
        .input-with-prefix .form-input { padding-left: 28px; }
        /* AI Suggestion */
        .ai-suggestion-box {
          padding: 16px; background: rgba(0,113,227,0.04); border: 1px solid rgba(0,113,227,0.15);
          border-radius: 14px; margin-top: 10px; animation: fadeIn 0.3s ease;
        }
        .ai-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-weight: 600; font-size: 13px; color: #1d1d1f; }
        .ai-price { font-size: 18px; color: #0071e3; font-weight: 800; }
        .ai-reason { font-size: 13px; color: #6e6e73; line-height: 1.5; margin-bottom: 12px; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        /* Duration */
        .duration-toggle { margin-bottom: 18px; }
        .toggle-label { display: flex; align-items: center; gap: 10px; cursor: pointer; font-size: 14px; font-weight: 500; color: #1d1d1f; user-select: none; }
        .toggle-checkbox { display: none; }
        .toggle-slider { width: 40px; height: 22px; background: #e5e7eb; border-radius: 11px; position: relative; transition: all 0.25s ease; flex-shrink: 0; }
        .toggle-slider::after { content: ''; position: absolute; top: 2px; left: 2px; width: 18px; height: 18px; background: #fff; border-radius: 50%; transition: all 0.25s ease; box-shadow: 0 1px 4px rgba(0,0,0,0.15); }
        .toggle-checkbox:checked + .toggle-slider { background: #0071e3; }
        .toggle-checkbox:checked + .toggle-slider::after { transform: translateX(18px); }
        .duration-options { display: flex; flex-wrap: wrap; gap: 7px; margin-bottom: 12px; margin-top: 8px; }
        .duration-option { padding: 7px 16px; border-radius: 980px; font-size: 13px; font-weight: 600; color: #6e6e73; background: #f5f5f7; border: 1px solid #e5e7eb; cursor: pointer; transition: all 0.18s ease; }
        .duration-option:hover { background: #ebebf0; color: #1d1d1f; }
        .duration-option.active { background: #0071e3; border-color: #0071e3; color: white; box-shadow: 0 2px 8px rgba(0,113,227,0.25); }
        .duration-hint { font-size: 12px; color: #6e6e73; }
        /* Sidebar */
        .create-sidebar { display: flex; flex-direction: column; gap: 18px; position: sticky; top: 80px; }
        .image-upload-card { padding: 22px; }
        .image-drop-zone {
          border: 2px dashed #e5e7eb; border-radius: 16px; min-height: 200px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.22s ease; overflow: hidden;
          background: #f9f9fb;
        }
        .image-drop-zone:hover, .image-drop-zone.has-image {
          border-color: #0071e3; background: rgba(0,113,227,0.03);
        }
        .image-drop-content { text-align: center; padding: 20px; }
        .image-drop-icon { font-size: 36px; display: block; margin-bottom: 10px; }
        .image-drop-text { font-size: 14px; font-weight: 600; color: #1d1d1f; margin-bottom: 4px; }
        .image-drop-hint { font-size: 12px; color: #aeaeb2; }
        .image-preview { width: 100%; height: 100%; object-fit: cover; }
        .preview-card { padding: 22px; }
        .preview-mini { display: flex; gap: 14px; align-items: center; }
        .preview-image { width: 58px; height: 58px; border-radius: 12px; background: #f5f5f7; display: flex; align-items: center; justify-content: center; font-size: 22px; overflow: hidden; flex-shrink: 0; border: 1px solid #e5e7eb; }
        .preview-body { flex: 1; }
        .preview-title { font-size: 13px; font-weight: 700; color: #1d1d1f; margin-bottom: 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .preview-price { font-size: 20px; font-weight: 800; color: #0071e3; letter-spacing: -0.5px; }
        .preview-category { font-size: 11px; color: #6e6e73; text-transform: uppercase; letter-spacing: 0.4px; margin-top: 2px; }
        @media (max-width: 900px) {
          .create-layout { grid-template-columns: 1fr; }
          .create-sidebar { position: static; }
          .form-row-2 { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default CreateAuction;
