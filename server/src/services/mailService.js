import nodemailer from 'nodemailer';

export const sendVerificationMail = async (email, token) => {
  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  const link = `${process.env.SERVER_URL}/auth/verify-email?token=${token}`;

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: email,
    subject: 'E-Mail bestätigen',
    html: `
      <h2>E-Mail bestätigen</h2>
      <p>Klicke auf den Link:</p>
      <a href="${link}">${link}</a>
      <p>Gültig für 24 Stunden.</p>
    `,
  });
};
