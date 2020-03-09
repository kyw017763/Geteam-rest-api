import nodemailer from 'nodemailer';
import config from './../config';
import { IStudy } from '../models/study';
import { IContest } from '../models/contest';

export async function sendAuthEmail(userEmail: string, key: string) {
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
      이 <a href="http://127.0.0.1:3003/signup/verify/${key}" style="color: #efdc05;">인증 링크</a>를 클릭하여 이메일 인증을 완료해 주세요!
      <br>
      개인정보 보호를 위해 인증 링크는 하루동안만 유효합니다.
      <br>
      만약 인증 메일의 재발송을 원하신다면 <a href="http://127.0.0.1:3003/signup/verify/new/${key}?email=${userEmail}" style="color: #efdc05;">이 링크</a>를 클릭해주세요!
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

export async function sendPwdEmail(subject: string, userEmail: string, userName: string, userTempPwd: string) {
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
      subject: subject,
      html: `<h1>비밀번호 초기화</h1> ${userName}님의 임시 비밀번호는 <span style="background: #efdc05;">${userTempPwd}</span> 입니다.`,
    };
  
    const info = await transporter.sendMail(mailOptions);
    console.log(`Message sent : ${info.response}`);
    transporter.close();
    return true;
  } catch (err) {
    throw new Error(err);
  }
}

export async function sendQuestionEmail (kind: string, title: string, content: string) {
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
  
    let message = content;
    message = message.replace(/(?:\r\n|\r|\n)/g, '<br />');
    
    const mailOptions = {
      from: process.env.EMAIL || config.EMAIL,
      to: process.env.EMAIL || config.EMAIL,
      subject: `Geteam 문의사항 : ${title}`,
      html: `<h3>[${kind}] ${title}</h3> ${message}`,
    };
  
    const info = await transporter.sendMail(mailOptions);
    console.log(`Message sent : ${info.response}`);
    transporter.close();
    return true;
  } catch (err) {
    throw new Error(err);
  }
}

export async function sendTeamEmail (kind: string, item: IStudy | IContest, content: string) {
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
  
    let message = content;
    message = message.replace(/(?:\r\n|\r|\n)/g, '<br />');
    
    const mailOptions = {
      from: process.env.EMAIL || config.EMAIL,
      to: process.env.EMAIL || config.EMAIL,
      subject: `Geteam 팀 모집 완료 : ${item.title}`,
      html: `<h3>[${kind}] ${item.title}</h3><br /> <h5>팀 모집자님(${item.account})이 보내셨습니다<h5><br />${message}`,
    };
  
    const info = await transporter.sendMail(mailOptions);
    console.log(`Message sent : ${info.response}`);
    transporter.close();
    return true;
  } catch (err) {
    throw new Error(err);
  }
}