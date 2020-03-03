import express from 'express';
import decodeJWT from 'jwt-decode';
import responseForm from './../lib/responseForm';
import redisClient from './../redisClient';
import models from './../models';

const router = express.Router();
export default router;

interface IDecodedAccessToken {
  _id: string;
  name: string;
  sNum: string;
  exp: number;
}

router.get('/boards', async (req, res) => {
  try {
    const user = req!.session!.passport.user.toString();
    const studyResult = await models.Study.find({ account: user });
    const contestResult = await models.Contest.find({ account: user });
    
    if ((<any>studyResult).length || (<any>contestResult).length) {
      res.json(responseForm(true, '', { study: studyResult, contest: contestResult }));
    } else {
      res.status(204).json(responseForm(true));
    }
  } catch (err) {
    res.status(500).json(responseForm(false, err.toString()));
  }
});

router.get('/applies', async (req, res) => {
  try {
    const user = req!.session!.passport.user.toString();
    const studyResult = await models.StudyApply.find({ applyAccount: user });
    const contestResult = await models.ContestApply.find({ applyAccount: user });
    
    if ((<any>studyResult).length || (<any>contestResult).length) {
      res.json(responseForm(true, '', { study: studyResult, contest: contestResult }));
    } else {
      res.status(204).json(responseForm(true));
    }
  } catch (err) {
    res.status(500).json(responseForm(false, err.toString()));
  }
});

router.get('/info', async (req, res) => {
  try {
    const user = req!.session!.passport.user.toString();
    const result = await models.Account.findById(user).select(['interest1', 'interest2', 'interest3', 'profile', 'listNum', 'notiApply', 'notiWrite']);
    res.json(responseForm(true, '', result));
  } catch (err) {
    res.status(500).json(responseForm(false, err.toString()));
  }
});

router.patch('/info', async (req, res) => {
  try {
    const user = req!.session!.passport.user.toString();
    const { modifyName, modifySNum, modifyInterest1, modifyInterest2, modifyInterest3, modifyProfile } = req.body;
    const result = await models.Account.findByIdAndUpdate(user, {
      name: modifyName,
      sNum: modifySNum,
      interest1: modifyInterest1,
      interest2: modifyInterest2,
      interest3: modifyInterest3,
      profile: modifyProfile
    }, { new: true });
    if (result) {
      res.json(responseForm(true));
    } else {
      throw new Error();
    }
  } catch (err) {
    res.status(500).json(responseForm(false, err.toString()));
  }
});

router.patch('/pwd', async (req, res) => {
  try {
    const user = req!.session!.passport.user.toString();
    const { oldPwd, newPwd } = req.body;
    await models.Account.findById(user)
      .then((result) => {
        if (result)  {
          if (result.compareHash(oldPwd)) {
            result.pwd = newPwd;
            result.save();
          }
        } else {
          throw new Error();
        }
      });
    
    const accessToken = req.header('Authorization')?.replace(/^Bearer\s/, '');
    if (!accessToken) {
      throw new Error('잘못된 Access Token이 전달되었습니다');
    }
    const decodedAccessToken: IDecodedAccessToken = decodeJWT(accessToken);
    // Blacklisting Token
    await redisClient.blacklistToken(accessToken, decodedAccessToken.exp);
    res.json(responseForm(true));
  } catch (err) {
    res.status(500).json(responseForm(false, err.toString()));
  }
});

router.patch('/noti/apply', async (req, res) => {
  try {
    const user = req!.session!.passport.user.toString();
    const { applyBoolean: notiApply } = req.body;
    const result = await models.Account.findByIdAndUpdate(user, { notiApply }, { new: true });
    if (result) {
      res.json(responseForm(true, '', result.notiApply));
    } else {
      throw new Error();
    }
  } catch (err) {
    res.status(500).json(responseForm(false, err.toString()));
  }
});

router.patch('/noti/write', async (req, res) => {
  try {
    const user = req!.session!.passport.user.toString();
    const { writeBoolean: notiWrite } = req.body;
    const result = await models.Account.findByIdAndUpdate(user, { notiWrite }, { new: true });
    if (result) {
      res.json(responseForm(true, '', result.notiWrite));
    } else {
      throw new Error();
    }
  } catch (err) {
    res.status(500).json(responseForm(false, err.toString()));
  }
});
