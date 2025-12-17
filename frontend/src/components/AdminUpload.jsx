import React, { useState } from 'react';
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
  const [message, setMessage] = useState('');

  const handleInputChange = (e) => {
    setBookData({
      ...bookData,
      [e.target.name]: e.target.value
    });
  };

  // Simple handler: just store the selected audio file; duration is entered manually.
  const handleAudioChange = (e) => {
    const file = e.target.files[0];
    setAudioFile(file || null);
  };

  const handleFileUpload = async (fileType, file) => {
    const formData = new FormData();
    formData.append(fileType === 'audio' ? 'audioFile' : 'coverImage', file);

    try {
<<<<<<< Updated upstream
      const response = await API.post(`/auth/upload/${fileType}`, formData, {
=======
      const response = await API.post(`/admin/upload/${fileType === 'audio' ? 'audio' : 'image'}`, formData, {
>>>>>>> Stashed changes
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setMessage(`${fileType} uploaded successfully: ${response.data.file.filename}`);
      return response.data.file.filename;
    } catch (error) {
      setMessage(`Error uploading ${fileType}: ${error.response?.data?.error || error.message}`);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    setMessage('');

    // Upload files first
    let audioFileName = bookData.audioFile; // if already uploaded
    let coverFileName = bookData.coverImage; // if already uploaded

    if (audioFile) {
      audioFileName = await handleFileUpload('audio', audioFile);
      if (!audioFileName) {
        setUploading(false);
        return;
      }
    }

    if (coverImage) {
      coverFileName = await handleFileUpload('cover', coverImage);
      if (!coverFileName) {
        setUploading(false);
        return;
      }
    }

    // Create book
    try {
      const bookPayload = {
        ...bookData,
        duration: parseInt(bookData.duration),
        audioFile: audioFileName,
        coverImage: coverFileName,
        authors: bookData.authors.split(',').map(a => a.trim()),
        genres: bookData.genres.split(',').map(g => g.trim())
      };

<<<<<<< Updated upstream
      const response = await API.post('/auth/books', bookPayload);
      setMessage('Book created successfully!');
=======
      const response = await API.post('/admin/books', bookPayload);
      
      alert('Audiobook added successfully!');
      
      // Reset form
>>>>>>> Stashed changes
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
    } catch (error) {
      setMessage(`Error creating book: ${error.response?.data?.error || error.message}`);
    }

    setUploading(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Upload Audiobook</h2>
      
      {message && (
        <div className={`p-4 mb-4 rounded ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
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
