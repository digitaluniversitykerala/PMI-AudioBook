const fs = require('fs');
const path = require('path');

// Book 1: Adhyathmaramayanam Kilippattu
for (let i = 1; i <= 7; i++) {
  const dir = path.join('public', 'audio', 'books', '1', 'chapters');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, `chapter_${i}.mp3`), 
    'Placeholder audio content',
    'utf8'
  );
}

// Book 2: Oru Divasathe Sathyam
for (let i = 1; i <= 6; i++) {
  const dir = path.join('public', 'audio', 'books', '2', 'chapters');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, `chapter_${i}.mp3`), 
    'Placeholder audio content',
    'utf8'
  );
}

// Book 3: Arayannangal
for (let i = 1; i <= 6; i++) {
  const dir = path.join('public', 'audio', 'books', '3', 'chapters');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, `chapter_${i}.mp3`), 
    'Placeholder audio content',
    'utf8'
  );
}

// Book 4: Kashmirile Kunjali Marakkar
for (let i = 1; i <= 6; i++) {
  const dir = path.join('public', 'audio', 'books', '4', 'chapters');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, `chapter_${i}.mp3`), 
    'Placeholder audio content',
    'utf8'
  );
}

console.log('Generated placeholder audio files for all chapters.');
