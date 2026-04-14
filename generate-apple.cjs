const jwt = require('jsonwebtoken');

// Clé formatée de manière stricte sans aucun espace parasite
const privateKey = 
"-----BEGIN PRIVATE KEY-----\n" +
"MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgT4v4jwd42v7TK3ll\n" +
"BLp2oZYaNcz5/BNgDRtqXhvEcxWgCgYIKoZIzj0DAQehRANCAAQNCOVtOPMg1/Xc\n" +
"fRs9RzII4Uy5xZnffZT+yPblT7yAfS4cFAummnDEcUwYRvP0UbT3TiXWyp1n1PZ9\n" +
"TEAVVj9T\n" +
"-----END PRIVATE KEY-----";

const token = jwt.sign({}, privateKey, {
  algorithm: 'ES256',
  expiresIn: '180d',
  audience: 'https://appleid.apple.com',
  issuer: 'A9W9AX76V8', 
  subject: 'com.app.equilibre', 
  keyid: '243YL9FZUD', 
});

console.log("--------------------------------------------------");
console.log("👉 VOICI TON SECRET KEY (JWT) A COLLER DANS SUPABASE :");
console.log("--------------------------------------------------");
console.log(token);
console.log("--------------------------------------------------");