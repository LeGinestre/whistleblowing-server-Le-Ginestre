require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const path = require('path');
const app = express();

const Segnalazione = require('./models/Segnalazione');
const User = require('./models/User');
const auth = require('./middleware/auth');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Connessione a MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connesso'))
  .catch(err => console.error('Errore di connessione a MongoDB:', err));

const OAuth2 = google.auth.OAuth2;
const oauth2Client = new OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  "https://developers.google.com/oauthplayground"
);

oauth2Client.setCredentials({
  refresh_token: process.env.REFRESH_TOKEN
});

const accessToken = oauth2Client.getAccessToken();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: process.env.EMAIL_USER,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
    accessToken: accessToken
  }
});

// Endpoint radice
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Endpoint per la registrazione degli utenti
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = new User({ username, password });
    await user.save();
    res.status(201).json({ message: 'Utente registrato con successo.' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Endpoint per il login degli utenti
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ error: 'Username o password errati.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Username o password errati.' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint per inviare le segnalazioni (autenticato)
app.post('/submit', auth, async (req, res) => {
  try {
    const { descrizione, nome, cognome, email, anonimo } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'L\'email è obbligatoria per inviare una segnalazione.' });
    }

    const nuovaSegnalazione = new Segnalazione({
      descrizione,
