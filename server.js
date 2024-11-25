require('dotenv').config();
const nodemailer = require('nodemailer');
const express = require('express');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const { google } = require('googleapis');
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
  console.log('Richiesta GET su /');
  res.send('Benvenuto nel server Whistleblowing!');
});

// Endpoint /submit
app.post('/submit', async (req, res) => {
  console.log('Ricevuta richiesta su /submit');
  console.log('Dati ricevuti:', req.body);

  const { descrizione, nome, cognome, email, anonimo } = req.body;

  if (!email) {
    console.log('Errore: l\'email è obbligatoria');
    return res.status(400).json({ error: 'L\'email è obbligatoria per inviare una segnalazione.' });
  }

  console.log('Dati convalidati:', { descrizione, nome, cognome, email, anonimo });

  const segnalazione = `Descrizione: ${descrizione}\nNome: ${nome}\nCognome: ${cognome}\nEmail: ${email}\nAnonimo: ${anonimo}\n\n`;

  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'whistleblowing@leginestreonlus.it',
      subject: 'Nuova Segnalazione Ricevuta',
      text: `È stata ricevuta una nuova segnalazione:\n\n${segnalazione}`
    };

    console.log('Tentativo di invio dell\'email di notifica...');
    await transporter.sendMail(mailOptions);
    console.log('Email di notifica inviata');

    const userMailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Conferma Ricezione Segnalazione Whistleblowing',
      text: 'Abbiamo ricevuto la tua segnalazione e stiamo procedendo con le opportune verifiche. Grazie per averci contattato.'
    };

    console.log('Tentativo di invio dell\'email di conferma all\'utente...');
    await transporter.sendMail(userMailOptions);
    console.log('Email di conferma inviata all\'utente');

    res.status(200).json({ message: 'Segnalazione ricevuta con successo' });
  } catch (error) {
    console.error('Errore durante il processo:', error);
    res.status(500).json({ error: `Errore durante il processo: ${error.message}` });
  }
});

// Aggiungi un endpoint per gestire richieste non trovate (404)
app.use((req, res, next) => {
  res.status(404).json({ error: 'Endpoint non trovato' });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server in ascolto su http://localhost:${port}`);
  console.log('Tutte le variabili di ambiente:', process.env);
});
