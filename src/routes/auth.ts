import express from 'express';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import passportJWT from 'passport-jwt';
import nodemailer from 'nodemailer';
import config from './../config';
import responseForm from './../lib/responseForm';
import createKey from './../lib/createKey';
import models from './../models';

const router = express.Router();
export default router;

router.post('/signup/email', async (req, res) => {
  try {
    const verifyKey = createKey();
    await sendAuthEmail(req.body.signup_email, verifyKey);

    await models.Member.findOneAndDelete({
      id: req.body.signup_email,
      isVerified: false,
    }).then(() => {
    }).catch((err: any) => {
      throw new Error(err);
    });
    
    await models.Member.create({
      id: req.body.signup_email,
      name: req.body.signup_name,
      pwd: req.body.signup_pwd,
      sNum: req.body.signup_num,
      interest1: req.body.signup_inter1,
      interest2: req.body.signup_inter2,
      interest3: req.body.signup_inter3,
      profile: req.body.signup_profile,
      verifyKey
    }).then(() => {
    }).catch((err: any) => {
      throw new Error(err);
    });
  
    res.json(responseForm(true));
  } catch (err) {
    res.json(responseForm(false, err));
  }
});

router.get('/signup/verify/:key', async (req, res) => {
  try {
    const { key } = req.params;

    await models.Member.findOneAndUpdate({
      verifyKey: key,
      verifyExpireAt: {
        $gte: new Date(),
      },
      isVerified: false,
    }, {
      $set: {
        isVerified: true,
      },
    }).then((result) => {
      if (!result) {
        throw new Error('unvalid authentification!');
      }
    }).catch((err: any) => {
      throw new Error(err);
    });
    
    res.json(responseForm(true));
  } catch (err) {
    res.json(responseForm(false, err));
  }
});

router.get('/signup/verify/new/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { email } = req.query;

    const verifyKey = createKey();
    await models.Member.findOneAndUpdate({
      id: email,
      verifyKey: key,
      isVerified: false,
    }, {
      $set: {
        verifyKey,
      },
    }).then((result) => {
      if (!result) {
        throw new Error('unvalid authentification!');
      }
    }).catch((err: any) => {
      throw new Error(err);
    });

    await sendAuthEmail(email, verifyKey);
  
    res.json(responseForm(true));
  } catch (err) {
    res.json(responseForm(false, err));
  }
});

async function sendAuthEmail(userEmail: string, key: string) {
  try {
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      host :'smtp.gmlail.com',
      secure: false,
      auth: {
        user: process.env.EMAIL || config.EMAIL,
        pass: process.env.PWD || config.PWD,
      },
    });
  
    const mailOptions = {
      from: process.env.EMAIL || config.EMAIL,
      to: userEmail,
      subject: 'Geteam 이메일 인증',
      html: `<h3>Geteam 이메일 인증용 링크</h3>
      Geteam 계정에 등록하신 이메일 주소(${userEmail})가 올바른지 확인하기 위한 인증 링크입니다.
      이 <a href="http://127.0.0.1:3000/signup/verify/${key}" style="color: #efdc05;">인증 링크</a>를 클릭하여 이메일 인증을 완료해 주세요!
      <br>
      개인정보 보호를 위해 인증 링크는 하루동안만 유효합니다.
      <br>
      만약 인증 메일의 재발송을 원하신다면 <a href="http://127.0.0.1:3000/signup/verify/new/${key}?email=${userEmail}" style="color: #efdc05;">이 링크</a>를 클릭해주세요!
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Message sent : ${info.response}`);
    transporter.close();
    return true;
  } catch (err) {
    throw new Error(err);
  }
}
