import express from 'express';
import responseForm from './../lib/responseForm';
import { validateKind, validateCategory, validateModifyOrder } from '../lib/validateValue';
import models from './../models';

const router = express.Router();
export default router;

router.get('/boards/:kind/:page/:order', async (req, res, next) => {
  try {
    const { kind, page } = req.params;
    let { order } = req.params;
    let result = null, documentCnt = null;

    validateKind(kind);
    order = validateModifyOrder(order);

    // 종료일을 지나지 않았거나, 종료일을 지났지만 내가 쓴 글
    const condition = {
      active: true,
      $or: [
        {
          account: req!.session!.passport.user.toString() || null,
          endDay: { $lt: new Date }
        }, {
          endDay: { $gt: new Date }
        }
      ]
    };

    if (kind === 'study') {
      result = await models.Study.find(condition)
        .sort(order)
        .skip(Number(page) * 10)
        .limit(10)
        .populate({
          path: 'account',
          select: '_id id name sNum',
        });
      documentCnt = await models.Study.countDocuments(condition).exec();
    } else if (kind === 'contest') {
      result = await models.Contest.find(condition)
        .sort(order)
        .skip(Number(page) * 10)
        .limit(10)
        .populate({
          path: 'account',
          select: '_id id name sNum',
        });
      documentCnt = await models.Contest.countDocuments(condition).exec();
    }

    if ((<any>result).length) {
      res.json(responseForm(true, '', { list: result, total: documentCnt }));
    } else {
      res.status(204).json(responseForm(true));
    }
  } catch (err) {
    res.status(500).json(responseForm(false, err.toString()));
  }
});

router.get('/boards/:kind/:category/:page/:order', async (req, res, next) => {
  try {
    const { kind, category, page } = req.params;
    let { order } = req.params;
    let result = null, documentCnt = null;

    validateKind(kind);
    validateCategory(kind, category);
    order = validateModifyOrder(order);

    // 종료일을 지나지 않았거나, 종료일을 지났지만 내가 쓴 글
    const condition = {
      kind: category,
      active: true,
      $or: [
        {
          account: req!.session!.passport.user.toString() || null,
          endDay: { $lt: new Date }
        }, {
          endDay: { $gt: new Date }
        }
      ]
    };

    if (kind === 'study') {
      result = await models.Study.find(condition)
        .sort(order)
        .skip(Number(page) * 10)
        .limit(10)
        .populate({
          path: 'account',
          select: '_id id name sNum',
        });
      documentCnt = await models.Study.countDocuments(condition).exec();
    } else if (kind === 'contest') {
      result = await models.Contest.find(condition)
        .sort(order)
        .skip(Number(page) * 10)
        .limit(10)
        .populate({
          path: 'account',
          select: '_id id name sNum',
        });
      documentCnt = await models.Contest.countDocuments(condition).exec();
    }
    
    if ((<any>result).length) {
      res.json(responseForm(true, '', { list: result, total: documentCnt }));
    } else {
      res.status(204).json(responseForm(true));
    }
  } catch (err) {
    res.status(500).json(responseForm(false, err.toString()));
  }
});

router.get('/board/:kind/:id', async (req, res, next) => {
  try {
    const { kind, id } = req.params;
    let result = null, applyId = null;
    let isAccepted = null;

    validateKind(kind);
    
    if (kind === 'study') {
      await models.Study.findByIdAndUpdate(id, { $inc: { hit: 1 } })
        .catch((err) => {
          new Error(err);
        });

      result = await models.Study.findById(id)
        .populate({
          path: 'account',
          select: '_id id name sNum',
        });

      applyId = result? await models.StudyApply.findOne({ applyAccount: req!.session!.passport.user.toString(), item: result._id, active: true })
        .then((result) => result!._id)  
        .catch((err) => {
          new Error(err);
        }) : null;
    } else if (kind === 'contest') {
      await models.Contest.findByIdAndUpdate(id, { $inc: { hit: 1 } })
        .catch((err) => {
          new Error(err);
        });

      result = await models.Contest.findById(id)
        .populate({
          path: 'account',
          select: '_id id name sNum',
        });

      applyId = result? await models.StudyApply.findOne({ applyAccount: req!.session!.passport.user.toString(), item: result._id, active: true })
        .then((result) => result!._id)  
        .catch((err) => {
          new Error(err);
        }) : null;
    }

    const isApplied = applyId? true : false;
    if (result && isApplied === true && kind === 'study') {
      isAccepted = await models.StudyApply.exists({ applyAccount: req!.session!.passport.user.toString(), item: result._id, accept: true });
    } else if (result && isApplied === true && kind === 'contest') {
      isAccepted = await models.ContestApply.exists({ applyAccount: req!.session!.passport.user.toString(), item: result._id, accept: true });
    }

    const data = {
      result,
      enableModify: result? result.enableModify() : null,
      enableApply: result? result.enableApply() : null,
      applyId,
      isApplied,
      isAccepted,
    };

    res.json(responseForm(true, '', data));
  } catch (err) {
    res.status(500).json(responseForm(false, err.toString()));
  }
});

router.post('/board/:kind', async (req, res, next) => {
  try {
    const { kind } = req.params;
    let result = null;

    validateKind(kind);

    if (req!.session!.passport.user.toString() !== req.body.writeMem) {
      throw new Error('옳지 않은 권한입니다!');
    }

    validateCategory(kind, req.body.writeKind);

    const { writeMem, writeKind, writeTopic, writeTitle, writeContent, writeWantNum, writeEndDay } = req.body;

    if (kind === 'study') {
      result = await models.Study.create({
          kind: writeKind,
          account: writeMem,
          topic: writeTopic,
          title: writeTitle,
          content: writeContent,
          wantNum: writeWantNum,
          endDay: writeEndDay,
        })
        .then((result) => {
          return result._id;
        }).catch((err) => {
          new Error(err);
        });
      
      await models.Account.findByIdAndUpdate(writeMem, { $inc: { listNum: 1 } })
        .catch((err) => {
          new Error(err);
        });
    } else if (kind === 'contest') {
      const { writePart } = req.body;
      const tempPartArr = writePart.split(',').map((item: string) => item.trim())
      const partObj = {
        name: tempPartArr,
        num: tempPartArr.length,
      };

      result = await models.Contest.create({
          kind: writeKind,
          account: writeMem,
          topic: writeTopic,
          part: partObj,
          title: writeTitle,
          content: writeContent,
          wantNum: writeWantNum,
          endDay: writeEndDay,
        })
        .then((result) => {
          return result._id;
        }).catch((err) => {
          new Error(err);
        });

      await models.Account.findByIdAndUpdate(writeMem, { $inc: { listNum: 1 } })
        .catch((err) => {
          new Error(err);
        });
    }

    res.status(201).json(responseForm(true, '', result));
  } catch (err) {
    res.status(500).json(responseForm(false, err.toString()));
  }
});

router.patch('/board/:kind/:id', async (req, res, next) => {
  try {
    const { kind, id } = req.params;
    let result = null;

    validateKind(kind);

    if (req!.session!.passport.user.toString() !== req.body.modifyAuthor) {
      throw new Error('옳지 않은 권한입니다!');
    }

    const { modifyCategory, modifyWantNum, modifyEndDay, modifyTopic, modifyTitle, modifyContent } = req.body;
    
    const updateObj = { 
      $set: 
      {
        kind: modifyCategory,
        topic: modifyTopic,
        title: modifyTitle,
        content: modifyContent,
        wantNum: modifyWantNum,
        endDay: modifyEndDay,
      }
    };

    if (kind === 'study') {
      result = await models.Study.findByIdAndUpdate(id, updateObj, { new: true })
      .then((result) => {
        return result ? result._id : result; 
      })
      .catch((err) => {
        new Error(err);
      });
    } else if (kind === 'contest') {
      result = await models.Contest.findByIdAndUpdate(id, updateObj, { new: true })
        .then((result) => {
          return result ? result._id : result;
        })
        .catch((err) => {
          new Error(err);
        });
    }

    res.json(responseForm(true, '', result));
  } catch (err) {
    res.status(500).json(responseForm(false, err.toString()));
  }
});

router.delete('/board/:kind/:id', async (req, res, next) => {
  try {
    const { kind, id } = req.params;
    let result = null;

    validateKind(kind);

    if (req!.session!.passport.user.toString() !== req.body.writeMem) {
      throw new Error('옳지 않은 권한입니다!');
    }

    if (kind === 'study') {
      result = await models.Study.findByIdAndUpdate(id, { active: false })
        .then((result) => {
          return true;
        })
        .catch((err) => {
          new Error(err);
        });
      
      await models.Account.findByIdAndUpdate(req.body.writeMem, { $inc: { listNum: -1 } })
        .catch((err) => {
          new Error(err);
        });
    } else if (kind === 'contest') {
      result = await models.Contest.findByIdAndUpdate(id, { active: false })
        .then((result) => {
          return true;
        })
        .catch((err) => {
          new Error(err);
        });
      
      await models.Account.findByIdAndUpdate(req.body.writeMem, { $inc: { listNum: -1 } })
        .catch((err) => {
          new Error(err);
        });
    }

    
    
    res.json(responseForm(true, '', result));
  } catch (err) {
    res.status(500).json(responseForm(false, err.toString()));
  }
});
