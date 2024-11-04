const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('segnalazioni.db');

db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS segnalazioni (descrizione TEXT, nome TEXT, cognome TEXT, email TEXT, anonimo TEXT)");
});

module.exports = db;
