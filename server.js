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

// Funzione per generare un codice univoco
const generateUniqueCode = () => {
  return 'ID-' + Math.random().toString(36).substr(2, 9).toUpperCase();
};

// Struttura di archiviazione per le segnalazioni
const segnalazioni = {};

// Endpoint radice
app.get('/', (req, res) => {
  console.log('Richiesta GET su /');
  res.send('Benvenuto nel server Whistleblowing!');
});

// Servire la pagina HTML
app.get('/verify', (req, res) => {
  res.sendFile(path.join(__dirname, 'verify.html'));
});

// Endpoint /submit
app.post('/submit', async (req, res) => {
  console.log('Ricevuta richiesta su /submit');
  console.log('Dati ricevuti:', req.body);

  const { descrizione, nome, cognome, email, anonimo } = req.body;

  const codiceUnivoco = generateUniqueCode();
  segnalazioni[codiceUnivoco] = { descrizione, nome, cognome, anonimo, status: 'Ricevuta' };

  const segnalazione = `Descrizione: ${descrizione}\nNome: ${nome}\nCognome: ${cognome}\nAnonimo: ${anonimo}\nCodice Segnalazione: ${codiceUnivoco}\n\n`;

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

    res.status(200).json({ message: 'Segnalazione ricevuta con successo', codiceSegnalazione: codiceUnivoco });
  } catch (error) {
    console.error('Errore durante il processo:', error);
    res.status(500).json({ error: `Errore durante il processo: ${error.message}` });
  }
});

// Endpoint per verificare lo stato della segnalazione
app.get('/status', (req, res) => {
  const codiceUnivoco = req.query.code;
  const segnalazione = segnalazioni[codiceUnivoco];

  if (segnalazione) {
    res.status(200).json({ status: segnalazione.status });
  } else {
    res.status(404).json({ error: 'Segnalazione non trovata' });
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
