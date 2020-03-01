import express from 'express';
import config from './../config';
import responseForm from './../lib/responseForm';
import models from './../models';

const router = express.Router();
export default router;

router.get('/study/:page/:order', async (req, res, next) => {
  // 내가 한 신청
  try {
    const account = req!.session!.passport.user.toString();
    const { page } = req.params;
    let { order } = req.params;
    // desc / asc, 최신 순, 오래된 순
    order = order === 'desc' ? '-createdAt' : 'createdAt';
    
    const result = await models.StudyApply.find({
        applyAccount: account
      })
      .sort(order)
      .skip(Number(page) * 10)
      .limit(10)
      .populate({
        path: 'item',
        select: '_id kind topic title wantNum applyNum endDay hit teamChk active',
      })
      .populate({
        path: 'recvAccount',
        select: '_id id name sNum',
      });
    
    if (result.length) {
      res.json(responseForm(true, '', result));
    } else {
      res.status(204).json(responseForm(true));
    }
  } catch (err) {
    res.status(500).json(responseForm(false, err.toString()));
  }
});

router.get('/accept/study/:page/:order', async (req, res, next) => {
  // 내가 한 신청 중 수락된 것
  try {
    const account = req!.session!.passport.user.toString();
    const { page } = req.params;
    let { order } = req.params;
    // desc / asc, 최신 순, 오래된 순
    order = order === 'desc' ? '-createdAt' : 'createdAt';

    const result = await models.StudyApply.find({
        applyAccount: account,
        accept: true,
      })
      .sort(order)
      .skip(Number(page) * 10)
      .limit(10)
      .populate({
        path: 'item',
        select: '_id kind topic title wantNum applyNum endDay hit teamChk active',
      })
      .populate({
        path: 'recvAccount',
        select: '_id id name sNum',
      });

    if (result.length) {
      res.json(responseForm(true, '', result));
    } else {
      res.status(204).json(responseForm(true));
    }
  } catch (err) {
    res.status(500).json(responseForm(false, err.toString()));
  }
});

router.get('/unaccept/study/:page/:order', async (req, res, next) => {
  // 내가 한 신청 중 수락되지 않은 것
  try {
    const account = req!.session!.passport.user.toString();
    const { page } = req.params;
    let { order } = req.params;
    // desc / asc, 최신 순, 오래된 순
    order = order === 'desc' ? '-createdAt' : 'createdAt';

    const result = await models.StudyApply.find({
        applyAccount: account,
        accept: false,
      })
      .sort(order)
      .skip(Number(page) * 10)
      .limit(10)
      .populate({
        path: 'item',
        select: '_id kind topic title wantNum applyNum endDay hit teamChk active',
      })
      .populate({
        path: 'recvAccount',
        select: '_id id name sNum',
      });

    if (result.length) {
      res.json(responseForm(true, '', result));
    } else {
      res.status(204).json(responseForm(true));
    }
  } catch (err) {
    res.status(500).json(responseForm(false, err.toString()));
  }
});

router.get('/study/:item', async (req, res, next) => {
  // 내가 작성한 글에 들어온 신청
  try {
    const { item } = req.params;
    const account = req!.session!.passport.user.toString();

    const result = await models.StudyApply.find({
        item,
        recvAccount: account,
        active: true,
      })
      .populate({
        path: 'item',
        select: '_id kind topic title wantNum applyNum acceptNum endDay hit teamChk active',
      })
      .populate({
        path: 'applyAccount',
        select: '_id id name sNum',
      });

    res.json(responseForm(true, '', result));
  } catch (err) {
    res.status(500).json(responseForm(false, err.toString()));
  }
});

router.post('/study', async (req, res, next) => {
  try {
    const { applyKind, applyItem, applyAccount, recvAccount, applyTopic, applyTitle, applyPortfolio, applyWant } = req.body;

    if (req!.session!.passport.user.toString() !== applyAccount) {
      throw new Error('옳지 않은 권한입니다!');
    }

    switch (applyKind) {
      case 'develop': case 'design': case 'etc': break;
      default: throw new Error('유효한 카테고리가 아닙니다');
    }

    const cnt = await models.StudyApply.countDocuments({ item: applyItem, applyAccount }).exec();
    if (cnt > 0) {
      throw new Error('한 게시글에 한 번 이상 신청할 수 없습니다');
    }
   
    const result = await models.StudyApply.create({
        kind: applyKind,
        item: applyItem,
        applyAccount,
        recvAccount,
        topic: applyTopic,
        title: applyTitle,
        portfolio: applyPortfolio,
        want: applyWant,
      })
      .then((result) => {
        return result.item;
      }).catch((err) => {
        throw new err;
      });
    
    await models.Study.findByIdAndUpdate(result, {
      $inc: { applyNum: 1 }
    }).catch((err) => {
      throw new Error(err);
    });

    res.status(201).json(responseForm(true, '', result));
  } catch (err) {
    res.status(500).json(responseForm(false, err.toString()));
  }
});

router.patch('/study/:id', async (req, res, next) => {
  // accept
  try {
    const { id } = req.params;

    const applyDocument = await models.StudyApply.findById(id);
    
    if (req!.session!.passport.user.toString() !== applyDocument!.recvAccount.toString()) {
      throw new Error('옳지 않은 권한입니다!');
    }

    applyDocument!.accept = true;
    applyDocument?.save();

    const boardDocument = await models.Study.findByIdAndUpdate(applyDocument!.item, {
        $inc: { acceptNum: 1 }
      });

    res.json(responseForm(true, '', boardDocument!._id));
  } catch (err) {
    res.status(500).json(responseForm(false, err.toString()));
  }
});

router.delete('/study/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
   
    const applyDocument = await models.StudyApply.findById(id);
    
    if (req!.session!.passport.user.toString() !== applyDocument?.applyAccount.toString()) {
      throw new Error('옳지 않은 권한입니다!');
    }

    if (applyDocument!.accept === true) {
      throw new Error('이미 수락된 신청은 취소할 수 없습니다');
    }

    const boardDocument = await models.Study.findByIdAndUpdate(applyDocument!.item, {
        $inc: { applyNum: -1 }
      });

    if (boardDocument!.endDay < new Date()) {
      throw new Error('신청기간이 지난 글의 신청을 취소할 수 없습니다');
    }

    if (boardDocument!.active === false) {
      throw new Error('삭제된 글의 신청을 취소할 수 없습니다');
    }

    applyDocument!.active = false;
    applyDocument?.save();

    res.json(responseForm(true, '', boardDocument!._id));
  } catch (err) {
    res.status(500).json(responseForm(false, err.toString()));
  }
});
