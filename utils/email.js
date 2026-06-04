const express = require('express');
const nodemailer = require('nodemailer');
const app = express();
const port = 6666;

app.use(express.json());

app.post('/sendEmailCheckCode', (req, res) => {
  const email = req.body.email;
  // 生成6位随机验证码
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  // 存储验证码以便后续验证

  // 创建 transporter
  const transporter = nodemailer.createTransport({
    service: 'qq',
    host: 'smtp.qq.com',
    port: 465,
    secure: true,
    auth: {
      user: 'your_email@qq.com', // 替换为你的QQ邮箱
      pass: 'your_authorization_code' // 替换为你的授权码
    }
  });

  // 发送邮件
  transporter.sendMail({
    from: '"Your Name" <your_email@qq.com>', // 替换为你的邮箱
    to: email,
    subject: '您的验证码',
    text: `您的验证码是：${code}，请勿泄露给他人。`
  }, (error, info) => {
    if (error) {
      console.log(error);
      res.status(500).send('发送验证码失败');
    } else {
      console.log('Message sent: %s', info.messageId);
      res.send('验证码已发送');
    }
  });
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});