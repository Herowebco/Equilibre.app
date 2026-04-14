const jwt = require('jsonwebtoken');

// Ta clé privée (Le contenu du Fichier .p8)
const privateKey = `-----BEGIN PRIVATE KEY-----
MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgT4v4jwd42v7TK3ll
BLp2oZYaNcz5/BNgDRtqXhvEcxWgCgYIKoZIzj0DAQehRANCAAQNCOVtOPMg1/Xc
fRs9RzII4Uy5xZnffZT+yPblT7yAfS4cFAummnDEcUwYRvP0UbT3TiXWyp1n1PZ9
TEAVVj9T
-----END PRIVATE KEY-----`;

// Création du JWT
const token = jwt.sign({}, privateKey, {
  algorithm: 'ES256',
  expiresIn: '180d', // Valable environ 6 mois
  audience: 'https://appleid.apple.com',
  issuer: 'A9W9AX76V8', // Ton Team ID
  subject: 'com.app.equilibre', // Ton Bundle ID
  keyid: '243YL9FZUD', // Ton Key ID
});

console.log("--------------------------------------------------");
console.log("👉 VOICI TON SECRET KEY (JWT) A COLLER DANS SUPABASE :");
console.log("--------------------------------------------------");
console.log(token);
console.log("--------------------------------------------------");