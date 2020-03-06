import express from 'express';
import responseForm from './../lib/responseForm';
import { validateKind, validateCategory } from '../lib/validateValue';
import redisClient from '../redisClient';
import models from './../models';

const router = express.Router();
export default router;

router.get('/:kind/:page/:order', async (req, res, next) => {
  // 내가 한 신청
  try {
    const account = req!.session!.passport.user.toString();
    const { kind, page } = req.params;
    let { order } = req.params;
    // desc / asc, 최신 순, 오래된 순
    order = order === 'desc' ? '-createdAt' : 'createdAt';
    let result = null;

    validateKind(kind);

    if (kind === 'study') {
      result = await models.StudyApply.find({
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
    } else if (kind === 'contest') {
      result = await models.ContestApply.find({
          applyAccount: account
        })
        .sort(order)
        .skip(Number(page) * 10)
        .limit(10)
        .populate({
          path: 'item',
          select: '_id kind topic title part wantNum applyNum endDay hit teamChk active',
        })
        .populate({
          path: 'recvAccount',
          select: '_id id name sNum',
        });
    }
    
    if (result!.length) {
      res.json(responseForm(true, '', result));
    } else {
      res.status(204).json(responseForm(true));
    }
  } catch (err) {
    res.status(500).json(responseForm(false, err.toString()));
  }
});

router.get('/accept/:kind/:page/:order', async (req, res, next) => {
  // 내가 한 신청 중 수락된 것
  try {
    const account = req!.session!.passport.user.toString();
    const { kind, page } = req.params;
    let { order } = req.params;
    // desc / asc, 최신 순, 오래된 순
    order = order === 'desc' ? '-createdAt' : 'createdAt';
    let result = null;

    validateKind(kind);

    if (kind === 'study') {
      result = await models.StudyApply.find({
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
    } else if (kind === 'contest') {
      result = await models.ContestApply.find({
          applyAccount: account,
          accept: true,
        })
        .sort(order)
        .skip(Number(page) * 10)
        .limit(10)
        .populate({
          path: 'item',
          select: '_id kind topic title part wantNum applyNum endDay hit teamChk active',
        })
        .populate({
          path: 'recvAccount',
          select: '_id id name sNum',
        });
    }

    if (result!.length) {
      res.json(responseForm(true, '', result));
    } else {
      res.status(204).json(responseForm(true));
    }
  } catch (err) {
    res.status(500).json(responseForm(false, err.toString()));
  }
});

router.get('/unaccept/:kind/:page/:order', async (req, res, next) => {
  // 내가 한 신청 중 수락되지 않은 것
  try {
    const account = req!.session!.passport.user.toString();
    const { kind, page } = req.params;
    let { order } = req.params;
    // desc / asc, 최신 순, 오래된 순
    order = order === 'desc' ? '-createdAt' : 'createdAt';
    let result = null;

    validateKind(kind);

    if (kind === 'study') {
      result = await models.StudyApply.find({
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
    } else if (kind === 'contest') {
      result = await models.ContestApply.find({
          applyAccount: account,
          accept: false,
        })
        .sort(order)
        .skip(Number(page) * 10)
        .limit(10)
        .populate({
          path: 'item',
          select: '_id kind topic title part wantNum applyNum endDay hit teamChk active',
        })
        .populate({
          path: 'recvAccount',
          select: '_id id name sNum',
        });
    }

    if (result!.length) {
      res.json(responseForm(true, '', result));
    } else {
      res.status(204).json(responseForm(true));
    }
  } catch (err) {
    res.status(500).json(responseForm(false, err.toString()));
  }
});

router.get('/:kind/:item', async (req, res, next) => {
  // 내가 작성한 글에 들어온 신청
  try {
    const { kind, item } = req.params;
    const account = req!.session!.passport.user.toString();
    let result = null;

    validateKind(kind);

    if (kind === 'study') {
      result = await models.StudyApply.find({
          item,
          recvAccount: account,
          active: true,
        })
        .populate({
          path: 'applyAccount',
          select: '_id id name sNum',
        });
    } else if (kind === 'contest') {
      result = await models.ContestApply.find({
          item,
          recvAccount: account,
          active: true,
        })
        .populate({
          path: 'applyAccount',
          select: '_id id name sNum',
        });
    }

    if (result!.length) {
      res.json(responseForm(true, '', result));
    } else {
      res.status(204).json(responseForm(true));
    }
  } catch (err) {
    res.status(500).json(responseForm(false, err.toString()));
  }
});

router.post('/:kind', async (req, res, next) => {
  try {
    const { kind } = req.params;
    const { applyKind, applyItem, applyAccount, recvAccount, applyPortfolio, applyWant } = req.body;
    let cnt = null;
    let result = null;

    if (req!.session!.passport.user.toString() !== applyAccount) {
      throw new Error('옳지 않은 권한입니다!');
    }

    validateKind(kind);
    validateCategory(kind, applyKind)

    if (kind === 'study') {
      cnt = await models.StudyApply.countDocuments({ item: applyItem, applyAccount }).exec();
    } else if (kind === 'contest') {
      cnt = await models.ContestApply.countDocuments({ item: applyItem, applyAccount }).exec();
    }

    if (cnt! > 0 || !cnt) {
      throw new Error('한 게시글에 한 번 이상 신청할 수 없습니다');
    }

    if (kind === 'study') {
      result = await models.StudyApply.create({
          kind: applyKind,
          item: applyItem,
          applyAccount,
          recvAccount,
          portfolio: applyPortfolio,
          want: applyWant,
        })
        .then((result) => {
          return result.item;
        });

      await models.Study.findByIdAndUpdate(result, {
        $inc: { applyNum: 1 }
      });
    } else if (kind === 'contest') {
      const { applyPart } = req.body;
      result = await models.ContestApply.create({
          kind: applyKind,
          item: applyItem,
          part: applyPart,
          applyAccount,
          recvAccount,
          portfolio: applyPortfolio,
          want: applyWant,
        })
        .then((result) => {
          return result.item;
        });

      await models.Contest.findByIdAndUpdate(result, {
        $inc: { applyNum: 1 }
      }, { new: true })
        .then((result) => {
          if (!result) {
            throw new Error();
          }
        });
    }

    await redisClient.incCnt('applyCnt');

    res.status(201).json(responseForm(true, '', result));
  } catch (err) {
    res.status(500).json(responseForm(false, err.toString()));
  }
});

router.patch('/:kind/:id', async (req, res, next) => {
  // accept
  try {
    const { kind, id } = req.params;
    let applyDocument = null;
    let boardDocument = null;

    validateKind(kind);

    if (kind === 'study') {
      applyDocument = await models.StudyApply.findById(id);
    } else if (kind === 'contest') {
      applyDocument = await models.ContestApply.findById(id);
    }

    if (req!.session!.passport.user.toString() !== applyDocument!.recvAccount.toString()) {
      throw new Error('옳지 않은 권한입니다!');
    }

    applyDocument!.accept = true;
    applyDocument?.save();

    if (kind === 'study') {
      boardDocument = await models.Study.findByIdAndUpdate(applyDocument!.item, {
          $inc: { acceptNum: 1 }
        }, { new: true })
        .then((result) => {
          if (!result) {
            throw new Error();
          }
          return result;
        });
    } else if (kind === 'contest') {
      boardDocument = await models.Contest.findByIdAndUpdate(applyDocument!.item, {
          $inc: { acceptNum: 1 }
        }, { new: true })
        .then((result) => {
          if (!result) {
            throw new Error();
          }
          return result;
        });
    }

    res.json(responseForm(true, '', boardDocument!._id));
  } catch (err) {
    res.status(500).json(responseForm(false, err.toString()));
  }
});

router.delete('/:kind/:id', async (req, res, next) => {
  try {
    const { kind, id } = req.params;
    let applyDocument = null;
    let boardDocument = null;

    validateKind(kind);

    if (kind === 'study') {
      applyDocument = await models.StudyApply.findById(id);
    } else if (kind === 'contest') {
      applyDocument = await models.ContestApply.findById(id);
    }

    if (req!.session!.passport.user.toString() !== applyDocument?.applyAccount.toString()) {
      throw new Error('옳지 않은 권한입니다!');
    }

    if (applyDocument!.accept === true) {
      throw new Error('이미 수락된 신청은 취소할 수 없습니다');
    }

    if (kind === 'study') {
      boardDocument = await models.Study.findByIdAndUpdate(applyDocument!.item, {
          $inc: { applyNum: -1 }
        }, { new: true })
        .then((result) => {
          if (!result) {
            throw new Error();
          }
          return result;
        });
    } else if (kind === 'contest') {
      boardDocument = await models.Contest.findByIdAndUpdate(applyDocument!.item, {
          $inc: { applyNum: -1 }
        }, { new: true })
        .then((result) => {
          if (!result) {
            throw new Error();
          }
          return result;
        });
    }

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
