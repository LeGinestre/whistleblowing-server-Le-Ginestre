const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./segnalazioni.db');

db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS segnalazioni (descrizione TEXT, nome TEXT, cognome TEXT, email TEXT, anonimo TEXT)");
});

exports.handler = async (event, context) => {
    const body = JSON.parse(event.body);
    const { descrizione, nome, cognome, email, anonimo } = body;

    return new Promise((resolve, reject) => {
        const stmt = db.prepare("INSERT INTO segnalazioni (descrizione, nome, cognome, email, anonimo) VALUES (?, ?, ?, ?, ?)");
        stmt.run(descrizione, nome, cognome, email, anonimo, (err) => {
            if (err) {
                console.error('Errore durante l\'inserimento della segnalazione:', err);
                reject({ statusCode: 500, body: 'Errore durante l\'inserimento della segnalazione' });
            }
            resolve({ statusCode: 200, body: 'Segnalazione ricevuta. Grazie!' });
        });
        stmt.finalize();
    });
};
