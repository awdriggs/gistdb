import 'dotenv/config';
import express from 'express';
import { Low } from 'lowdb';
import { GistAdapter } from './gist-adapter.js';

const app = express();
app.use(express.json());
app.use(express.static('public'));

// Configuration from environment variables
const GIST_ID = process.env.GIST_ID;
const GIST_TOKEN = process.env.GIST_TOKEN;
const GIST_FILENAME = process.env.GIST_FILENAME || 'playlist.json';
const PORT = process.env.PORT || 3000;

// Check if environment variables are set
if (!GIST_ID || !GIST_TOKEN) {
  console.error('ERROR: GIST_ID and GIST_TOKEN must be set in environment variables');
  console.error('Create a .env file with these values. See .env.example');
  process.exit(1);
}

// Initialize the database with Gist adapter
const adapter = new GistAdapter(GIST_ID, GIST_FILENAME, GIST_TOKEN);
const db = new Low(adapter, { songs: [] });

// Load data from gist on startup
db.read()
  .then(() => {
    console.log('Playlist loaded from gist');
    console.log('Current songs:', db.data.songs);
  })
  .catch(error => {
    console.error('Error loading playlist:', error);
  });

// Get all songs
app.get('/songs', (req, res) => {
  res.json(db.data.songs);
});

// Create new song
app.post('/songs', (req, res) => {
  const { title, artist } = req.body;

  if (!title || !artist) {
    res.status(400).json({ error: 'Title and artist are required' });
    return;
  }

  const newSong = {
    id: Date.now().toString(), // Generate unique ID from timestamp
    title: title,
    artist: artist,
    createdAt: new Date().toISOString()
  };

  db.data.songs.push(newSong);

  db.write()
    .then(() => {
      res.status(201).json(newSong);
    })
    .catch(error => {
      res.status(500).json({ error: 'Failed to save song' });
    });
});

// Delete song by ID
app.delete('/songs/:id', (req, res) => {
  const index = db.data.songs.findIndex(s => s.id === req.params.id);

  if (index === -1) {
    res.status(404).json({ error: 'Song not found' });
    return;
  }

  const deleted = db.data.songs.splice(index, 1);

  db.write()
    .then(() => {
      res.json(deleted[0]);
    })
    .catch(error => {
      res.status(500).json({ error: 'Failed to delete song' });
    });
});

app.listen(PORT, () => {
  console.log(`Playlist server running on port ${PORT}`);
});
