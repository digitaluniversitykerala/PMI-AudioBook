import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Upload, X } from "lucide-react";
import API from '@/api';

const AdminUpload = () => {
  const [bookData, setBookData] = useState({
    title: '',
    description: '',
    duration: '',
    narrator: '',
    authors: '',
    genres: ''
  });
  const [audioFile, setAudioFile] = useState(null);
  const [coverImage, setCoverImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleInputChange = (e) => {
    setBookData({
      ...bookData,
      [e.target.name]: e.target.value
    });
  };

  const handleAudioChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/aac', 'audio/ogg'];
      if (!validTypes.includes(file.type)) {
        alert('Invalid file type. Please upload an audio file (MP3, WAV, AAC, or OGG).');
        return;
      }
      if (file.size > 100 * 1024 * 1024) {
        alert('File is too large. Maximum size is 100MB.');
        return;
      }
      setAudioFile(file);
      setMessage({ text: 'Audio file selected', type: 'success' });
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        alert('Invalid file type. Please upload an image (JPEG, PNG, GIF, or WebP).');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('Image is too large. Maximum size is 5MB.');
        return;
      }
      setCoverImage(file);
      setMessage({ text: 'Cover image selected', type: 'success' });
    }
  };

  const handleFileUpload = async (fileType, file) => {
    const formData = new FormData();
    formData.append(fileType === 'audio' ? 'audioFile' : 'coverImage', file);

    try {
      const response = await API.post(`/api/admin/upload/${fileType === 'audio' ? 'audio' : 'image'}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log(`${fileType === 'audio' ? 'Audio' : 'Image'} uploaded successfully`);
      
      return response.data.file.filename;
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message || 'Failed to upload file';
      alert(`Error uploading ${fileType}: ${errorMsg}`);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    setMessage({ text: '', type: '' });

    // Validate required fields
    if (!bookData.title || !bookData.duration || !audioFile) {
      setMessage({ 
        text: 'Please fill in all required fields (title, duration) and upload an audio file.', 
        type: 'error' 
      });
      setUploading(false);
      return;
    }

    try {
      // Upload files first
      let audioFileName = null;
      let coverFileName = null;

      if (audioFile) {
        audioFileName = await handleFileUpload('audio', audioFile);
        if (!audioFileName) {
          setUploading(false);
          return;
        }
      }

      if (coverImage) {
        coverFileName = await handleFileUpload('image', coverImage);
        // Don't fail if cover image upload fails, just continue without it
      }

      // Create book
      const bookPayload = {
        title: bookData.title,
        description: bookData.description || '',
        duration: parseInt(bookData.duration, 10),
        narrator: bookData.narrator || '',
        authors: bookData.authors ? bookData.authors.split(',').map(a => a.trim()) : [],
        genres: bookData.genres ? bookData.genres.split(',').map(g => g.trim()) : [],
        audioFile: audioFileName,
        coverImage: coverFileName || undefined
      };

      const response = await API.post('/api/admin/books', bookPayload);
      
      alert('Audiobook added successfully!');
      
      // Reset form
      setBookData({
        title: '',
        description: '',
        duration: '',
        narrator: '',
        authors: '',
        genres: ''
      });
      setAudioFile(null);
      setCoverImage(null);
      
      // Clear file inputs
      const audioUpload = document.getElementById('audio-upload');
      const coverUpload = document.getElementById('cover-upload');
      
      if (audioUpload) audioUpload.value = '';
      if (coverUpload) coverUpload.value = '';
      
      alert('Audiobook added successfully!');
      setMessage({ 
        text: 'Audiobook added successfully!', 
        type: 'success' 
      });
    } catch (error) {
      setMessage(`Error creating book: ${error.response?.data?.error || error.message}`);
    }

    setUploading(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Upload Audiobook</h2>
      
      {message.text && (
        <div className={`p-4 mb-4 rounded ${
          message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Title</label>
          <input
            type="text"
            name="title"
            value={bookData.title}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            name="description"
            value={bookData.description}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
            rows="3"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Duration (minutes)</label>
          <input
            type="number"
            name="duration"
            value={bookData.duration}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Narrator</label>
          <input
            type="text"
            name="narrator"
            value={bookData.narrator}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Authors (comma-separated)</label>
          <input
            type="text"
            name="authors"
            value={bookData.authors}
            onChange={handleInputChange}
            placeholder="Author 1, Author 2"
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Genres (comma-separated)</label>
          <input
            type="text"
            name="genres"
            value={bookData.genres}
            onChange={handleInputChange}
            placeholder="Fiction, Classic"
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Audio File (MP3)</label>
          <input
            type="file"
            accept="audio/*"
            onChange={handleAudioChange}
            className="w-full p-2 border rounded"
          />
          <p className="mt-1 text-xs text-gray-500">
            Please enter the duration (in minutes) manually above.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Cover Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setCoverImage(e.target.files[0])}
            className="w-full p-2 border rounded"
          />
        </div>

        <button
          type="submit"
          disabled={uploading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {uploading ? 'Uploading...' : 'Upload Audiobook'}
        </button>
      </form>
    </div>
  );
};

export default AdminUpload;
