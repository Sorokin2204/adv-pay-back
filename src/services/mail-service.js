const nodemailer = require('nodemailer');

class MailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }

  async sendActivationMail(to, link) {
    await this.transporter.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject: 'Активация аккаунта на ' + process.env.SITE_URL,
      text: '',
      html: `
                    <div>
                        <h1>Для активации перейдите по ссылке</h1>
                        <a href="${link}">${link}</a>
                    </div>
                `,
    });
  }
  async sendResetPassword(to, pass) {
    await this.transporter.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject: 'Сброс пароля на ' + process.env.SITE_URL,
      text: '',
      html: `
                    <div>
                        <h1>Здравствуйте!</h1>
                       <p style='font-size: 20px'>Ваш новый пароль: <b > ${pass}</b></p>
                    </div>
                `,
    });
  }
}

module.exports = new MailService();
