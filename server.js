require('dotenv').config();
const nodemailer = require('nodemailer');
const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

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

const db = new sqlite3.Database('database.db'); // Usa un file per il database persistente.

// Creazione della tabella segnalazioni
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS segnalazioni (
    codice TEXT PRIMARY KEY,
    descrizione TEXT,
    nome TEXT,
    cognome TEXT,
    anonimo BOOLEAN,
    status TEXT
  )`);
});

// Funzione per generare un codice univoco
const generateUniqueCode = () => {
  return 'ID-' + Math.random().toString(36).substr(2, 9).toUpperCase();
};

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

  db.run(`INSERT INTO segnalazioni (codice, descrizione, nome, cognome, anonimo, status) VALUES (?, ?, ?, ?, ?, ?)`, 
    [codiceUnivoco, descrizione, nome, cognome, anonimo, 'Ricevuta'], (err) => {
      if (err) {
        return res.status(500).json({ error: 'Errore durante il salvataggio della segnalazione' });
      }

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

        if (email) {
          const userMailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Conferma Ricezione Segnalazione Whistleblowing',
            text: 'Abbiamo ricevuto la tua segnalazione e stiamo procedendo con le opportune verifiche. Grazie per averci contattato.'
          };

          console.log('Tentativo di invio dell\'email di conferma all\'utente...');
          await transporter.sendMail(userMailOptions);
          console.log('Email di conferma inviata all\'utente');
        }

        res.status(200).json({ message: 'Segnalazione ricevuta con successo', codiceSegnalazione: codiceUnivoco });
      } catch (error) {
        console.error('Errore durante il processo:', error);
        res.status(500).json({ error: `Errore durante il processo: ${error.message}` });
      }
    });
});

// Endpoint per verificare lo stato della segnalazione
app.get('/status', (req, res) => {
  const codiceUnivoco = req.query.code;

  db.get(`SELECT status FROM segnalazioni WHERE codice = ?`, [codiceUnivoco], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Errore durante il recupero dello stato della segnalazione' });
    }
    if (row) {
      res.status(200).json({ status: row.status });
    } else {
      res.status(404).json({ error: 'Segnalazione non trovata' });
    }
  });
});

// Endpoint per aggiornare lo stato della segnalazione
app.post('/update-status', (req, res) => {
  const { codiceSegnalazione, nuovoStato } = req.body;

  db.run(`UPDATE segnalazioni SET status = ? WHERE codice = ?`, [nuovoStato, codiceSegnalazione], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Errore durante l\'aggiornamento dello stato della segnalazione' });
    }
    res.status(200).json({ message: 'Stato della segnalazione aggiornato con successo' });
  });
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
