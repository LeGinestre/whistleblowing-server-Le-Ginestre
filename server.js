require('dotenv').config();
const nodemailer = require('nodemailer');
const fs = require('fs');
const express = require('express');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Aggiungi questa linea qui

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

app.post('/submit', async (req, res) => {
  const { descrizione, nome, cognome, email, anonimo } = req.body;

  if (!email) {
    return res.status(400).send('L\'email è obbligatoria per inviare una segnalazione.');
  }

  const segnalazione = `Descrizione: ${descrizione}\nNome: ${nome}\nCognome: ${cognome}\nEmail: ${email}\nAnonimo: ${anonimo}\n\n`;

  try {
    await fs.promises.appendFile('segnalazioni.txt', segnalazione);
    console.log('Segnalazione salvata con successo');

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'whistleblowing@leginestreonlus.it',
      subject: 'Nuova Segnalazione Ricevuta',
      text: `È stata ricevuta una nuova segnalazione:\n\n${segnalazione}`
    };

    await transporter.sendMail(mailOptions);
    console.log('Email di notifica inviata');

    const userMailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Conferma Ricezione Segnalazione Whistleblowing',
      text: 'Abbiamo ricevuto la tua segnalazione e stiamo procedendo con le opportune verifiche. Grazie per averci contattato.'
    };

    await transporter.sendMail(userMailOptions);
    console.log('Email di conferma inviata all\'utente');

    res.status(200).send('Segnalazione ricevuta con successo');
  } catch (error) {
    console.error('Errore durante il processo:', error);
    res.status(500).send(`Errore durante il processo: ${error.message}`);
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server in ascolto su http://localhost:${port}`);
});
