const fetch = require('node-fetch');

fetch('http://localhost:3000/submit', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    descrizione: 'Descrizione della segnalazione',
    nome: 'Nome',
    cognome: 'Cognome',
    email: 'email@example.com',
    anonimo: false
  })
})
.then(response => response.json())
.then(data => {
  console.log('Success:', data);
})
.catch((error) => {
  console.error('Error:', error);
});
