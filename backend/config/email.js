const nodemailer = require('nodemailer');

const createTransporter = () => nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
  tls: { rejectUnauthorized: false }
});

const sendEmail = async (to, subject, html) => {
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"TalentFlow ATS" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log(` Email sent to ${to}`);
    return true;
  } catch (err) {
    console.error(' Email error:', err.message);
    return false;
  }
};

module.exports = { sendEmail };