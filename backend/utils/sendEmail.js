// utils/sendEmail.js (Corrigé - utilise createTransport)
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Configuration Transporter Gmail (ton code existant, fixé pour sécurité)
const mailTransporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true pour TLS - false pour STARTTLS
  auth: {
    user: "briki.houda12345@gmail.com",
    pass: "ttpvdaxpzonxgasq", // App Password Gmail (pas mot de passe normal)
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Fonction Générique pour Email d'Invitation Team (avec Deep Link)
async function sendTeamInvite(userEmail, teamName, eventTitle, token, creatorName) {
  // Génère deep link en utilisant FRONTEND_URL ou localhost par défaut
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const deepLink = `${frontendUrl}/teams/accept/${token}`;

  // Options Email
  const mailOptions = {
    from: 'HarvestFlow <briki.houda12345@gmail.com>',
    to: userEmail,
    subject: `Invitation : Rejoignez la team "${teamName}" pour l'événement "${eventTitle}"`,
    text: `Bonjour ${userEmail} ! 

${creatorName} vous invite à rejoindre la team "${teamName}" pour l'événement "${eventTitle}".

Cliquez ici pour accepter : ${deepLink}

Le token expire dans 7 jours. Si le lien ne fonctionne pas, copiez-le.

Cordialement,
L'équipe HarvestFlow`,
    html: `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Invitation Team - HarvestFlow</title>
    <style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 20px; }
      .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
      .header { text-align: center; padding: 20px 0; }
      .button { background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
      .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Invitation à Rejoindre une Team</h1>
        </div>
        <p>Bonjour,</p>
        <p><strong>${creatorName}</strong> vous invite à rejoindre la team <strong>"${teamName}"</strong> pour l'événement <strong>"${eventTitle}"</strong>.</p>
        <p>Cliquez sur le bouton ci-dessous pour accepter l'invitation :</p>
        <a href="${deepLink}" class="button">Accepter l'Invitation</a>
        <p>Si le bouton ne fonctionne pas, copiez ce lien : <br><strong style="word-break: break-all;">${deepLink}</strong></p>
        <p>Le token expire dans 7 jours. Si vous avez des questions, contactez ${creatorName}.</p>
        <div class="footer">
            <p>Cordialement,<br>L'équipe HarvestFlow</p>
        </div>
    </div>
</body>
</html>`
  };

  // Envoi Email
  await mailTransporter.sendMail(mailOptions);
  console.log(`Email d'invitation envoyé à ${userEmail} pour la team "${teamName}"`);
}

// Export (utilise dans controller)
module.exports = { mailTransporter, sendTeamInvite };