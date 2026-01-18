import React, { useState, useRef } from 'react';
import { 
  ArrowLeft, 
  Music, 
  BookOpen, 
  Upload, 
  Type, 
  User as UserIcon, 
  Tag, 
  Clock, 
  AlignLeft, 
  Plus, 
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X
} from "lucide-react";
import API from '@/api';
import styles from './AdminUpload.module.css';

const AdminUpload = ({ existingBook, onComplete }) => {
  const [bookData, setBookData] = useState({
    title: existingBook?.title || '',
    description: existingBook?.description || '',
    narrator: existingBook?.narrator || '',
    authors: existingBook?.authors?.map(a => a.name).join(', ') || '',
    genres: existingBook?.genres?.map(g => g.name).join(', ') || ''
  });
  
  const [chapters, setChapters] = useState(
    existingBook?.chapters?.length > 0 
      ? existingBook.chapters.map(c => ({ 
          title: c.title, 
          duration: c.duration, 
          file: null, 
          fileName: 'Existing File',
          audioFile: c.audioFile 
        }))
      : [{ title: '', duration: '', file: null, fileName: '' }]
  );
  
  const [coverImage, setCoverImage] = useState(null);
  const [coverPreview, setCoverPreview] = useState(
    existingBook?.coverImage 
      ? (existingBook.coverImage.startsWith('http') 
          ? existingBook.coverImage 
          : `/${existingBook.coverImage.startsWith('uploads/') ? '' : 'uploads/'}${existingBook.coverImage}`)
      : null
  );
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState({ message: '', type: '' });

  const fileInputRefs = useRef([]);

  const handleInputChange = (e) => {
    setBookData({
      ...bookData,
      [e.target.name]: e.target.value
    });
  };

  const handleChapterChange = (index, field, value) => {
    const newChapters = [...chapters];
    newChapters[index][field] = value;
    setChapters(newChapters);
  };
  
  const handleChapterFileChange = (index, file) => {
    if (!file) return;
    const newChapters = [...chapters];
    newChapters[index].file = file;
    newChapters[index].fileName = file.name;
    setChapters(newChapters);
  };

  const addChapter = () => {
    setChapters([...chapters, { title: '', duration: '', file: null, fileName: '' }]);
  };

  const removeChapter = (index) => {
    if (chapters.length > 1) {
      const newChapters = chapters.filter((_, i) => i !== index);
      setChapters(newChapters);
    }
  };

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileUpload = async (fileType, file) => {
    const formData = new FormData();
    formData.append(fileType === 'audio' ? 'audioFile' : 'coverImage', file);
    const endpoint = fileType === 'audio' ? '/auth/upload/audio' : '/auth/upload/cover';

    try {
      const response = await API.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data.file.filename;
    } catch (error) {
      console.error("Upload failed", error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    setStatus({ message: '', type: '' });

    if (!bookData.title || chapters.some(c => !c.title || (!c.file && !c.audioFile))) {
       setStatus({ message: 'Please fill all required fields and ensure all chapters have audio.', type: 'error' });
       setUploading(false);
       return;
    }

    try {
      let coverFileName = undefined;
      if (coverImage) {
          try {
             coverFileName = await handleFileUpload('image', coverImage);
          } catch(e) {
              console.warn("Cover upload failed, proceeding without it");
          }
      }

      const uploadedChapters = [];
      for (let i = 0; i < chapters.length; i++) {
          const chapter = chapters[i];
          
          if (!chapter.file && chapter.audioFile) {
            // Chapter already has a file and no new file was uploaded
            uploadedChapters.push({
                title: chapter.title,
                duration: parseFloat(chapter.duration) || 0,
                audioFile: chapter.audioFile
            });
            continue;
          }

          setStatus({ message: `Uploading chapter ${i + 1} of ${chapters.length}...`, type: 'info' });
          
          const audioPath = await handleFileUpload('audio', chapter.file);
          uploadedChapters.push({
              title: chapter.title,
              duration: parseFloat(chapter.duration) || 0,
              audioFile: audioPath
          });
      }

      const bookPayload = {
        title: bookData.title,
        description: bookData.description,
        narrator: bookData.narrator,
        authors: bookData.authors.split(',').map(a => a.trim()).filter(Boolean),
        genres: bookData.genres.split(',').map(g => g.trim()).filter(Boolean),
        chapters: uploadedChapters,
        coverImage: coverFileName || existingBook?.coverImage,
        duration: uploadedChapters.reduce((acc, c) => acc + c.duration, 0)
      };

      if (existingBook) {
        await API.put(`/books/${existingBook._id}`, bookPayload);
        setStatus({ message: 'Audiobook updated successfully!', type: 'success' });
      } else {
        await API.post('/books', bookPayload);
        setStatus({ message: 'Audiobook published successfully!', type: 'success' });
      }

      setTimeout(() => {
        if (onComplete) onComplete();
      }, 1500);

      if (!existingBook) {
        setBookData({ title: '', description: '', narrator: '', authors: '', genres: '' });
        setChapters([{ title: '', duration: '', file: null, fileName: '' }]);
        setCoverImage(null);
        setCoverPreview(null);
      }

    } catch (error) {
      setStatus({ message: `Error: ${error.message || 'Server error'}`, type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <button type="button" className={styles.backButton} aria-label="Go back" onClick={() => onComplete && onComplete()}>
          <ArrowLeft size={20} />
        </button>
        <div className={styles.headerText}>
          <h1 className={styles.title}>{existingBook ? 'Edit Audiobook' : 'Upload Audiobook'}</h1>
          <p className={styles.subtitle}>{existingBook ? `Updating: ${existingBook.title}` : 'Add a new audiobook to your library'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Status Messages */}
        {status.message && (
          <div className={`${styles.statusMessage} ${styles[status.type]}`}>
            {status.type === 'error' ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
            {status.message}
          </div>
        )}

        {/* Audio Files Section */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <Music className={styles.sectionIcon} size={20} />
            <h2 className={styles.sectionTitle}>Audio Chapters</h2>
          </div>

          <div className={styles.chaptersList}>
            {chapters.map((chapter, index) => (
              <div key={index} className={styles.chapterCard}>
                <div className={styles.chapterHeader}>
                   <span className={styles.chapterNumber}>#{index + 1}</span>
                   {chapters.length > 1 && (
                     <button type="button" onClick={() => removeChapter(index)} className={styles.removeChapter}>
                       <Trash2 size={16} />
                     </button>
                   )}
                </div>

                <div className={styles.dropzone}>
                  <Upload className={styles.uploadIcon} size={48} />
                  <p className={styles.dropTitle}>
                    {chapter.fileName ? chapter.fileName : "Drag and drop your audio file here"}
                  </p>
                  <p className={styles.dropSubtitle}>Supports MP3, M4A, WAV, and other audio formats</p>
                  
                  <button 
                    type="button" 
                    className={styles.browseButton}
                    onClick={() => fileInputRefs.current[index].click()}
                  >
                    Browse Files
                  </button>
                  <input 
                    type="file" 
                    ref={el => fileInputRefs.current[index] = el}
                    style={{display: 'none'}} 
                    accept="audio/*,.mp3,.m4a,.wav,.aac,.ogg,.flac,.mpeg,.mp4"
                    onChange={(e) => handleChapterFileChange(index, e.target.files[0])}
                  />
                </div>

                <div className={styles.chapterDetails}>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Chapter Title</label>
                    <div className={styles.inputWrapper}>
                      <Type className={styles.fieldIcon} size={18} />
                      <input 
                        type="text" 
                        placeholder="Enter chapter title"
                        value={chapter.title}
                        onChange={(e) => handleChapterChange(index, 'title', e.target.value)}
                        className={styles.input}
                        required
                      />
                    </div>
                  </div>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Duration (m)</label>
                    <div className={styles.inputWrapper}>
                      <Clock className={styles.fieldIcon} size={18} />
                      <input 
                        type="number" 
                        placeholder="e.g. 15"
                        value={chapter.duration}
                        onChange={(e) => handleChapterChange(index, 'duration', e.target.value)}
                        className={styles.input}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            <button type="button" onClick={addChapter} className={styles.addChapterButton}>
              <Plus size={18} /> Add Another Chapter
            </button>
          </div>
        </section>

        {/* Book Details Section */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <BookOpen className={styles.sectionIcon} size={20} />
            <h2 className={styles.sectionTitle}>Book Details</h2>
          </div>

          <div className={styles.detailsGrid}>
            <div className={styles.inputGroup}>
              <label className={styles.label}>Title</label>
              <div className={styles.inputWrapper}>
                <Type className={styles.fieldIcon} size={18} />
                <input 
                  type="text" 
                  name="title"
                  placeholder="Enter book title"
                  value={bookData.title}
                  onChange={handleInputChange}
                  className={styles.input}
                  required
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Author</label>
              <div className={styles.inputWrapper}>
                <UserIcon className={styles.fieldIcon} size={18} />
                <input 
                  type="text" 
                  name="authors"
                  placeholder="Enter author name"
                  value={bookData.authors}
                  onChange={handleInputChange}
                  className={styles.input}
                  required
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Category / Genres</label>
              <div className={styles.inputWrapper}>
                <Tag className={styles.fieldIcon} size={18} />
                <input 
                  type="text" 
                  name="genres"
                  placeholder="Fiction, Mystery"
                  value={bookData.genres}
                  onChange={handleInputChange}
                  className={styles.input}
                  required
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.label}>Narrator</label>
              <div className={styles.inputWrapper}>
                <UserIcon className={styles.fieldIcon} size={18} />
                <input 
                  type="text" 
                  name="narrator"
                  placeholder="Enter narrator name"
                  value={bookData.narrator}
                  onChange={handleInputChange}
                  className={styles.input}
                />
              </div>
            </div>

            <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
              <label className={styles.label}>Description</label>
              <div className={`${styles.inputWrapper} ${styles.textareaWrapper}`}>
                <AlignLeft className={styles.fieldIcon} size={18} />
                <textarea 
                  name="description"
                  placeholder="Write a brief description of the audiobook..."
                  value={bookData.description}
                  onChange={handleInputChange}
                  className={styles.textarea}
                  rows={4}
                />
              </div>
            </div>

            <div className={`${styles.inputGroup} ${styles.fullWidth}`}>
              <label className={styles.label}>Cover Image</label>
              <div className={styles.coverUploadContainer}>
                {coverPreview ? (
                  <div className={styles.coverPreviewWrapper}>
                    <img src={coverPreview} alt="Cover preview" className={styles.coverPreview} />
                    <button type="button" className={styles.removeCover} onClick={() => {setCoverImage(null); setCoverPreview(null);}}>
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className={styles.coverPlaceholder} onClick={() => document.getElementById('coverInput').click()}>
                    <Upload size={24} />
                    <span>Upload Cover</span>
                  </div>
                )}
                <input 
                  id="coverInput"
                  type="file" 
                  accept="image/*" 
                  style={{display: 'none'}} 
                  onChange={handleCoverChange} 
                />
              </div>
            </div>
          </div>
        </section>

        {/* Footer Actions */}
        <div className={styles.footer}>
          <button type="submit" className={styles.publishButton} disabled={uploading}>
            {uploading ? (
              <><Loader2 className={styles.spinner} size={18} /> Processing...</>
            ) : (
              <><Upload size={18} /> {existingBook ? 'Update Audiobook' : 'Publish Audiobook'}</>
            )}
          </button>
          <button type="button" className={styles.cancelButton} onClick={() => onComplete ? onComplete() : window.history.back()}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminUpload;
