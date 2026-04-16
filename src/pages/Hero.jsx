import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY } from '../env.js';

const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY);

export default function Hero() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file) => {
    try {
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `uploads/${fileName}`;
      
      // Upload the file
      const { data, error } = await supabase.storage
        .from('jan-bucket')
        .upload(filePath, file);

      if (error) {
        console.error('Upload error:', error);
        throw new Error(`Upload failed: ${error.message}`);
      }

      // Get public URL
      const { data: publicData } = supabase.storage
        .from('jan-bucket')
        .getPublicUrl(filePath);

      if (!publicData || !publicData.publicUrl) {
        throw new Error('Failed to get public URL');
      }

      return publicData.publicUrl;
    } catch (err) {
      console.error('Image upload error:', err);
      throw new Error(`Image upload failed: ${err.message}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      let imageUrl = null;

      // Upload image first if provided
      if (image) {
        console.log('Uploading image...');
        imageUrl = await uploadImage(image);
        console.log('Image uploaded successfully:', imageUrl);
      }

      // Save lead to database
      const { data, error } = await supabase
        .from('leads')
        .insert([
          {
            name: name,
            email: email,
            image_url: imageUrl,
          },
        ])
        .select();

      if (error) {
        console.error('Insert error:', error);
        setMessage(`Error: ${error.message}`);
      } else {
        console.log('Lead saved:', data);
        setMessage('Lead and image saved successfully!');
        // Reset form
        setName('');
        setEmail('');
        setImage(null);
        setImagePreview(null);
        
        // Reset file input
        const fileInput = document.getElementById('image-input');
        if (fileInput) {
          fileInput.value = '';
        }
      }
    } catch (err) {
      console.error('Submit error:', err);
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hero-container">
      <div className="hero-content">
        <h1 className="hero-title">Capture Your Leads</h1>
        <p className="hero-subtitle">Join our community and stay updated with the latest news and offers</p>

        <form onSubmit={handleSubmit} className="lead-form">
          <div className="form-group">
            <input
              type="text"
              placeholder="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <input
              type="email"
              placeholder="Your Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="image-input" className="image-label">
              Upload Image (Optional)
            </label>
            <input
              id="image-input"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="form-input-file"
            />
            {imagePreview && (
              <div className="image-preview-container">
                <img src={imagePreview} alt="Preview" className="image-preview" />
                <button
                  type="button"
                  onClick={() => {
                    setImage(null);
                    setImagePreview(null);
                    const fileInput = document.getElementById('image-input');
                    if (fileInput) {
                      fileInput.value = '';
                    }
                  }}
                  className="remove-image-btn"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="submit-button"
          >
            {loading ? 'Uploading...' : 'Submit'}
          </button>
        </form>

        {message && (
          <div className={`message ${message.includes('Error') ? 'error-message' : 'success-message'}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}