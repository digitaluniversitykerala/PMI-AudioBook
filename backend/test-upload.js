const fs = require('fs');
const FormData = require('form-data');
const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5000';
const API_BASE = '/api/auth';

// Test credentials (update these)
const TEST_USER = {
  email: 'admin@test.com',
  password: 'password123'
};

// File paths (update these)
const FILES = {
  audio: 'test-audio.mp3', // Change to your audio file path
  cover: 'test-cover.jpg'  // Change to your cover image path
};

// Book data
const BOOK_DATA = {
  title: 'Test Audiobook',
  description: 'This is a test audiobook uploaded via script',
  duration: 120,
  narrator: 'Test Narrator',
  authors: 'Test Author',
  genres: 'Fiction, Test'
};

async function login() {
  try {
    console.log('Logging in...');
    const response = await axios.post(`${BASE_URL}${API_BASE}/login`, TEST_USER);
    return response.data.token;
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
    throw error;
  }
}

async function uploadFile(token, fileType, filePath) {
  try {
    console.log(`Uploading ${fileType} file: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const formData = new FormData();
    const fileKey = fileType === 'audio' ? 'audioFile' : 'coverImage';
    formData.append(fileKey, fs.createReadStream(filePath));

    const response = await axios.post(
      `${BASE_URL}${API_BASE}/upload/${fileType}`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${token}`
        }
      }
    );

    console.log(`${fileType} uploaded successfully:`, response.data.file.filename);
    return response.data.file.filename;
  } catch (error) {
    console.error(`Failed to upload ${fileType}:`, error.response?.data || error.message);
    throw error;
  }
}

async function createBook(token, bookData, audioFileName, coverFileName) {
  try {
    console.log('Creating book...');
    
    const payload = {
      ...bookData,
      duration: parseInt(bookData.duration),
      audioFile: audioFileName,
      coverImage: coverFileName,
      authors: bookData.authors.split(',').map(a => a.trim()),
      genres: bookData.genres.split(',').map(g => g.trim())
    };

    const response = await axios.post(
      `${BASE_URL}${API_BASE}/books`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Book created successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Failed to create book:', error.response?.data || error.message);
    throw error;
  }
}

async function testUpload() {
  try {
    // Step 1: Login
    const token = await login();
    console.log('✅ Login successful');

    // Step 2: Upload files
    const audioFileName = await uploadFile(token, 'audio', FILES.audio);
    const coverFileName = await uploadFile(token, 'cover', FILES.cover);
    console.log('✅ Files uploaded successfully');

    // Step 3: Create book
    const book = await createBook(token, BOOK_DATA, audioFileName, coverFileName);
    console.log('✅ Book created successfully');

    console.log('\n🎉 Test completed successfully!');
    console.log('Book ID:', book._id);
    console.log('You can now view this book in the dashboard at: http://localhost:5173/dashboard');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.log('\nTroubleshooting tips:');
    console.log('1. Make sure the backend server is running on port 5000');
    console.log('2. Check that your test user exists and has admin privileges');
    console.log('3. Verify file paths are correct');
    console.log('4. Ensure the uploads directory exists in the backend');
  }
}

// Check if required modules are installed
try {
  require('axios');
  require('form-data');
} catch (error) {
  console.log('❌ Missing required packages. Please install:');
  console.log('npm install axios form-data');
  process.exit(1);
}

// Run the test
testUpload();
