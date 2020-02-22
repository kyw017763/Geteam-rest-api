import express from 'express';
import jwt from 'jsonwebtoken';
import decodeJWT from 'jwt-decode';
import passport from 'passport';
import config from './../config';
import responseForm from './../lib/responseForm';
import createKey from './../lib/createKey';
import createHash from './../lib/createHash';
import { sendAuthEmail, sendPwdEmail, sendQuestionEmail } from './../lib/sendEmail'
import redisClient from './redis';
import models from './../models';

interface IDecodedAccessToken {
  _id: string;
  name: string;
  sNum: string;
  exp: number;
}

const router = express.Router();
export default router;

router.post('/register/email', async (req, res) => {
  try {
    const verifyKey = createKey();
    await sendAuthEmail(req.body.signup_email, verifyKey);

    await models.Member.findOneAndDelete({
      id: req.body.signup_email,
      isVerified: false,
      active: true,
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
  
    res.status(200).json(responseForm(true));
  } catch (err) {
    res.status(500).json(responseForm(false, err.toString()));
  }
});

router.get('/register/verify/:key', async (req, res) => {
  try {
    const { key } = req.params;

    await models.Member.findOneAndUpdate({
      verifyKey: key,
      verifyExpireAt: {
        $gte: new Date(),
      },
      isVerified: false,
      active: true,
    }, {
      $set: {
        isVerified: true,
      },
    }).then((result) => {
      if (!result) {
        throw new Error('unvalid authentication!');
      }
    }).catch((err: any) => {
      throw new Error(err);
    });
    
    res.status(200).json(responseForm(true));
  } catch (err) {
    res.status(500).json(responseForm(false, err.toString()));
  }
});

router.get('/register/verify/new/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { email } = req.query;

    const verifyKey = createKey();
    await models.Member.findOneAndUpdate({
      id: email,
      verifyKey: key,
      isVerified: false,
      active: true,
    }, {
      $set: {
        verifyKey,
      },
    }).then((result) => {
      if (!result) {
        throw new Error('unvalid authentication!');
      }
    }).catch((err: any) => {
      throw new Error(err);
    });

    await sendAuthEmail(email, verifyKey);
  
    res.status(200).json(responseForm(true));
  } catch (err) {
    res.status(500).json(responseForm(false, err.toString()));
  }
});

// Access Token, Refresh Token 발급
router.post('/signin', async (req, res, next) => {
  try {
    let { signin_email: id, signin_pwd: pwd } = req.body;
    const member = await models.Member.findOne({ id, isVerified: true, active: true })
      .then((result) => {
        if (!result) {
          throw new Error('잘못된 이메일입니다');
        } else {
          if (result.compareHash(pwd)) {
            return result;
          } else {
            throw new Error('잘못된 비밀번호입니다');
          }
        }
      }).catch((err) => {
        throw new Error(err);
      });

    const payload = {
      _id: member._id,
      name: member.name,
      sNum: member.sNum,
    };

    const accessOptions = {
      issuer: 'geteam',
      expiresIn: Number(process.env.ACCESS_EXPIRE || config.ACCESS_EXPIRE),
    };

    const refreshOptions = {
      issuer: 'geteam',
      expiresIn: process.env.REFRESH_EXPIRE || config.REFRESH_EXPIRE, 
    };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET || config.JWT_SECRET, accessOptions);
    const refreshToken = jwt.sign(payload, process.env.REFRESH_SECRET || config.REFRESH_SECRET, refreshOptions);
    
    await models.Member.findOneAndUpdate({ id, isVerified: true, active: true }, {
      $set: { refreshToken },
    }).then((result) => {
      if (!result) {
        throw new Error('Refresh Token 저장에 실패했습니다');
      }
    }).catch((err) => {
      throw new Error(err);
    });

    const decodedAccessToken: IDecodedAccessToken = decodeJWT(accessToken);
    
    res.status(200).json(responseForm(true, '', {
      accessToken,
      expiresIn: decodedAccessToken.exp * 1000,
    }));
  } catch (err) {
    res.status(401).json(responseForm(false, err.toString()));
  }
});

// Refresh Token을 이용(DB에서 Get)하여 Access Token 재발급 (실패시 false, /signin으로 redirect)
// Access Token이 만료되었을 것이므로 passport는 사용할 수 없음
router.post('/signin/refresh', async (req, res, next) => {
  try {
    const oldAccessToken = req.header('Authorization')?.replace(/^Bearer\s/, '');
    let decodedOldAccessToken: IDecodedAccessToken;
    if (oldAccessToken) {
      decodedOldAccessToken = decodeJWT(oldAccessToken);
      if (decodedOldAccessToken.exp * 1000 > new Date().getTime()) {
        throw new Error('아직 만료되지 않은 Access Token이 전달되었습니다');
      }
    } else {
      throw new Error('Access Token이 전달되지 않았습니다');
    }

    const member = await models.Member.findOne({ _id: decodedOldAccessToken._id, active: true, }).select('_id name sNum refreshToken')
      .then((member) => {
        if (member) {
          return member;
        } else {
          throw new Error('인증 정보가 잘못되었습니다');
        }
      })
      .catch((err) => {
        throw new Error('인증 정보로 회원 정보를 조회하던 중 에러가 발생했습니다');
      });
    
    // Verify refresh token
    try {
      jwt.verify(member.refreshToken, process.env.REFRESH_SECRET || config.REFRESH_SECRET);
    } catch (err) {
      throw new Error(err);
    }

    const payload = {
      _id: member._id,
      name: member.name,
      sNum: member.sNum,
    };
    
    const accessOptions = {
      issuer: 'geteam',
      expiresIn: Number(process.env.ACCESS_EXPIRE || config.ACCESS_EXPIRE),
    };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET || config.JWT_SECRET, accessOptions);
    const decodedAccessToken: IDecodedAccessToken = decodeJWT(accessToken);

    res.status(200).json(responseForm(true, '', {
      accessToken,
      expiresIn: decodedAccessToken.exp * 1000,
    }));
  } catch (err) {
    res.status(500).json(responseForm(false, err.toString()));
  }
});

// Blacklisting Token, Set null RefreshToken in DB
// 정상적인 Access Token이 있어야 Signout이 진행된다
router.post('/signout', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
  try {
    const accessToken = req.header('Authorization')?.replace(/^Bearer\s/, '');
    if (!accessToken) {
      throw new Error('잘못된 Access Token이 전달되었습니다');
    }
    const decodedAccessToken: IDecodedAccessToken = decodeJWT(accessToken);

    await models.Member.findOneAndUpdate({ _id: decodedAccessToken._id, active: true, }, { $set: { refreshToken: '' }})
      .then((member) => {
        if (member) {
          return member;
        } else {
          throw new Error('인증 정보가 잘못되었습니다');
        }
      })
      .catch((err) => {
        throw new Error('인증 정보로 회원 정보를 변경하던 중 에러가 발생했습니다');
      });

    // Blacklisting Token
    redisClient.set(`jwt-blacklist-${accessToken}`, Number(0).toString());
    redisClient.expire(`jwt-blacklist-${accessToken}`, decodedAccessToken.exp - (new Date().getTime() / 1000));
    
    res.status(200).json(responseForm(true));
  } catch (err) {
    res.status(500).json(responseForm(false, err.toString()));
  }
});

// Reset Password (Check Interests, Create Hash)
router.patch('/signin/reset', async (req, res, next) => {
  try {
    const { find_email: email, find_hint: hint } = req.body;

    const member = await models.Member.findOne({ id: email, active: true }).select('id name interest1 interest2 interest3')
      .then((member) => {
        if (member) {
          return member;
        } else {
          throw new Error('인증 정보가 잘못되었습니다');
        }
      }).catch((err) => {
        throw new Error('인증 정보로 새로운 비밀번호를 설정하던 중 에러가 발생했습니다');
      });
    
    const interestsArr = [member.interest1, member.interest2, member.interest3];
    
    const memberDoc = await models.Member.findOne({ id: email, active: true })
      .then((member) => {
        if (member) {
          return member;
        } else {
          throw new Error('인증 정보가 잘못되었습니다');
        }
      }).catch((err) => {
        throw new Error('인증 정보로 새로운 비밀번호를 설정하던 중 에러가 발생했습니다');
      });

    if (interestsArr.includes(hint)) {
      const newPwd = createHash(interestsArr.join('') + new Date().toISOString());
      memberDoc.pwd = newPwd;
      memberDoc.save();
      sendPwdEmail('Geteam 비밀번호 초기화', member.id, member.name, newPwd);
    } else {
      throw new Error('입력하신 정보가 잘못되었습니다');
    }

    res.status(200).json(responseForm(true));
  } catch (err) {
    res.status(500).json(responseForm(false, err.toString()));
  }
});

router.delete('/unregister', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
  try {
    const accessToken = req.header('Authorization')?.replace(/^Bearer\s/, '');
    if (!accessToken) {
      throw new Error('잘못된 Access Token이 전달되었습니다');
    }
    const decodedAccessToken: IDecodedAccessToken = decodeJWT(accessToken);
    await models.Member.findOneAndUpdate({ _id: decodedAccessToken._id }, { active: false })
      .then((member) => {
        if (!member) {
          throw new Error('인증 정보가 잘못되었습니다');
        }
      }).catch((err) => {
        throw new Error('인증 정보로 새로운 비밀번호를 설정하던 중 에러가 발생했습니다');
      });
    
    res.status(200).json(responseForm(true));
  } catch (err) {
    res.status(500).json(responseForm(false, err.toString()));
  }
});
