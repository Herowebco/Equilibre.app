import { SignJWT, importPKCS8 } from 'jose';

const privateKey = `-----BEGIN PRIVATE KEY-----
MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQgT4v4jwd42v7TK3ll
BLp2oZYaNcz5/BNgDRtqXhvEcxWgCgYIKoZIzj0DAQehRANCAAQNCOVtOPMg1/Xc
fRs9RzII4Uy5xZnffZT+yPblT7yAfS4cFAummnDEcUwYRvP0UbT3TiXWyp1n1PZ9
TEAVVj9T
-----END PRIVATE KEY-----`;

async function generateSecret() {
  try {
    // Lecture de la clé Apple
    const ecPrivateKey = await importPKCS8(privateKey, 'ES256');
    
    // Création du JWT (Valable 5 mois pour être large)
    const secret = await new SignJWT({})
      .setProtectedHeader({ alg: 'ES256', kid: '243YL9FZUD' })
      .setIssuer('A9W9AX76V8')
      .setIssuedAt()
      .setExpirationTime('150d') 
      .setAudience('https://appleid.apple.com')
      .setSubject('com.app.equilibre')
      .sign(ecPrivateKey);

    console.log("\n--------------------------------------------------");
    console.log("👉 VOICI TON SECRET KEY (JWT) A COLLER DANS SUPABASE :");
    console.log("--------------------------------------------------");
    console.log(secret);
    console.log("--------------------------------------------------\n");
  } catch (error) {
    console.error("Erreur de génération :", error);
  }
}

generateSecret();