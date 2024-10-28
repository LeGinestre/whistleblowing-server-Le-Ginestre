const nodemailer = require('nodemailer');

exports.handler = async function(event, context) {
    try {
        const body = JSON.parse(event.body);
        const { descrizione, nome, cognome, email, tipoSegnalazione } = body;

        // Configurazione del trasportatore Nodemailer
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'whistleblowing@leginestreonlus.it',
                pass: 'Ulisse24!',
            },
        });

        // Configurazione email
        const mailOptions = {
            from: 'whistleblowing@leginestreonlus.it',
            to: 'whistleblowing@leginestreonlus.it',
            subject: 'Nuova Segnalazione',
            text: `Descrizione: ${descrizione}\nNome: ${nome}\nCognome: ${cognome}\nEmail: ${email}\nTipo Segnalazione: ${tipoSegnalazione}`,
        };

        // Invia email
        await transporter.sendMail(mailOptions);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Segnalazione ricevuta. Grazie!' }),
        };
    } catch (error) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Errore nella richiesta.' }),
        };
    }
};
