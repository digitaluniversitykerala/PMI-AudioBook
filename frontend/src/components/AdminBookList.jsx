import React, { useState, useEffect } from 'react';
import { 
  Edit3, 
  Trash2, 
  Search, 
  BookOpen, 
  MoreVertical,
  ChevronRight,
  Clock,
  Music,
  AlertCircle,
  Loader2
} from "lucide-react";
import API from '@/api';
import styles from './AdminBookList.module.css';

const AdminBookList = ({ onEdit }) => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const userData = localStorage.getItem("user");
      let filters = "";
      if (userData) {
        const user = JSON.parse(userData);
        filters = `?uploadedBy=${user.id || user._id}`;
      }
      
      const response = await API.get(`/books${filters}`);
      const data = response.data.books || response.data || [];
      setBooks(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching books:", err);
      setError("Failed to load audiobooks. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this audiobook? This action cannot be undone.")) {
      return;
    }

    try {
      setDeletingId(id);
      await API.delete(`/books/${id}`);
      setBooks(books.filter(book => book._id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete the book. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredBooks = books.filter(book => 
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (book.authors?.[0]?.name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && books.length === 0) {
    return (
      <div className={styles.loaderContainer}>
        <Loader2 className={styles.spinner} size={40} />
        <p>Loading your library...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <div className={styles.searchWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search by title or author..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <div className={styles.stats}>
          <span>{filteredBooks.length} Books Found</span>
        </div>
      </div>

      {error && (
        <div className={styles.errorBanner}>
          <AlertCircle size={20} />
          <span>{error}</span>
          <button onClick={fetchBooks}>Retry</button>
        </div>
      )}

      <div className={styles.bookGrid}>
        {filteredBooks.length > 0 ? (
          filteredBooks.map((book) => (
            <div key={book._id} className={styles.bookCard}>
              <div className={styles.bookCover}>
                {book.coverImage ? (
                  <img 
                    src={book.coverImage.startsWith('http') 
                      ? book.coverImage 
                      : `/${book.coverImage.startsWith('uploads/') ? '' : 'uploads/'}${book.coverImage}`} 
                    alt={book.title} 
                  />
                ) : (
                  <div className={styles.placeholderCover}>
                    <BookOpen size={32} />
                  </div>
                )}
                <div className={styles.bookBadge}>{book.genres?.[0]?.name || 'Uncategorized'}</div>
              </div>
              
              <div className={styles.bookInfo}>
                <h3 className={styles.bookTitle}>{book.title}</h3>
                <p className={styles.bookAuthor}>By {book.authors?.[0]?.name || 'Unknown Author'}</p>
                
                <div className={styles.bookMeta}>
                  <div className={styles.metaItem}>
                    <Clock size={14} />
                    <span>{book.duration || 0} min</span>
                  </div>
                  <div className={styles.metaItem}>
                    <Music size={14} />
                    <span>{book.chapters?.length || 0} Ch.</span>
                  </div>
                </div>

                <div className={styles.actions}>
                  <button 
                    onClick={() => onEdit(book)}
                    className={styles.editButton}
                    title="Edit Book"
                  >
                    <Edit3 size={16} />
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(book._id)}
                    className={styles.deleteButton}
                    disabled={deletingId === book._id}
                    title="Delete Book"
                  >
                    {deletingId === book._id ? (
                      <Loader2 size={16} className={styles.spinner} />
                    ) : (
                      <Trash2 size={16} />
                    )}
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className={styles.emptyState}>
            <BookOpen size={48} />
            <p>No audiobooks found in your library.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBookList;
