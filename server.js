const express = require('express');
const bodyParser = require('body-parser');
const db = require('./database'); // importa il file database.js

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send('Benvenuti al server Whistleblowing!');
});

app.post('/submit', (req, res) => {
    console.log('Ricevuto una richiesta POST /submit');
    console.log('Body:', req.body);

    const { descrizione, nome, cognome, email, anonimo } = req.body;
    console.log('Descrizione:', descrizione);
    console.log('Nome:', nome);
    console.log('Cognome:', cognome);
    console.log('Email:', email);
    console.log('Anonimo:', anonimo);

    const stmt = db.prepare("INSERT INTO segnalazioni (descrizione, nome, cognome, email, anonimo) VALUES (?, ?, ?, ?, ?)");
    stmt.run(descrizione, nome, cognome, email, anonimo, (err) => {
        if (err) {
            console.error('Errore durante l\'inserimento della segnalazione:', err);
            return res.status(500).send('Errore durante l\'inserimento della segnalazione');
        }
        res.status(200).send('Segnalazione ricevuta. Grazie!');
    });
    stmt.finalize();
});

app.get('/segnalazioni', (req, res) => {
    db.all("SELECT * FROM segnalazioni", (err, rows) => {
        if (err) {
            console.error('Errore durante la visualizzazione delle segnalazioni:', err);
            return res.status(500).send('Errore durante la visualizzazione delle segnalazioni');
        }
        res.json(rows);
    });
});

app.listen(port, () => {
    console.log(`Server in ascolto su http://localhost:${port}`);
});
