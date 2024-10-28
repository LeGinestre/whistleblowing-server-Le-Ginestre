const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.post('/submit', (req, res) => {
    const { descrizione, nome, cognome, email } = req.body;
    console.log('Descrizione:', descrizione);
    console.log('Nome:', nome);
    console.log('Cognome:', cognome);
    console.log('Email:', email);

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'whistleblowing@leginestreonlus.it',
            pass: 'Ulisse24!'
        }
    });

    const mailOptions = {
        from: 'whistleblowing@leginestreonlus.it',
        to: 'whistleblowing@leginestreonlus.it',
        subject: 'New Whistleblowing Report',
        text: `Descrizione: ${descrizione}\nNome: ${nome}\nCognome: ${cognome}\nEmail: ${email}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return res.status(500).send(error.toString());
        }
        res.status(200).send('Segnalazione ricevuta. Grazie!');
    });
});

app.listen(port, () => {
    console.log(`Server in ascolto su http://localhost:${port}`);
});
