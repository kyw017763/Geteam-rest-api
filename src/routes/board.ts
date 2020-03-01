import express from 'express';
import responseForm from './../lib/responseForm';
import models from './../models';

const router = express.Router();
export default router;

router.get('/boards/study/:page/:order', async (req, res, next) => {
  try {
    const { page } = req.params;
    let { order } = req.params;

    switch (order) {
      case 'createdAt': case 'endDay': case 'hit':
        order = `-${order} title`; break;
      case 'title':
        order = `${order} -createdAt`; break;
      default: throw new Error('해당 속성으로 정렬할 수 없습니다');
    }

    // 종료일을 지나지 않았거나, 종료일을 지났지만 내가 쓴 글
    const result = await models.Study.find({
        active: true,
        $or: [
          {
            account: req!.session!.passport.user.toString() || null,
            endDay: { $lt: new Date }
          }, {
            endDay: { $gt: new Date }
          }
        ]
      })
      .sort(order)
      .skip(Number(page) * 10)
      .limit(10)
      .populate({
        path: 'account',
        select: '_id id name sNum',
      });

    if ((<any>result).length) {
      res.json(responseForm(true, '', result));
    } else {
      res.status(204).json(responseForm(true));
    }
  } catch (err) {
    res.status(500).json(responseForm(false, err.toString()));
  }
});

router.get('/boards/study/:category/:page/:order', async (req, res, next) => {
  try {
    const { category, page } = req.params;
    let { order } = req.params;
    
    switch (category) {
      case 'develop': case 'design': case 'etc': break;
      default: throw new Error('유효한 카테고리가 아닙니다');
    }

    switch (order) {
      case 'createdAt': case 'endDay': case 'hit':
        order = `-${order} title`; break;
      case 'title':
        order = `${order} -createdAt`; break;
      default: throw new Error('해당 속성으로 정렬할 수 없습니다');
    }

    // 종료일을 지나지 않았거나, 종료일을 지났지만 내가 쓴 글
    const result = await models.Study.find({
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
      })
      .sort(order)
      .skip(Number(page) * 10)
      .limit(10)
      .populate({
        path: 'account',
        select: '_id id name sNum',
      });

    if ((<any>result).length) {
      res.json(responseForm(true, '', result));
    } else {
      res.status(204).json(responseForm(true));
    }
  } catch (err) {
    res.status(500).json(responseForm(false, err.toString()));
  }
});

router.get('/board/study/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    await models.Study.findOneAndUpdate(id, { $inc: { hit: 1 } })
      .catch((err) => {
        new Error(err);
      });

    const result = await models.Study.findById(id)
      .populate({
        path: 'account',
        select: '_id id name sNum',
      });
    
    const isApplied = result? await models.StudyApply.exists({ applyAccount: req!.session!.passport.user.toString(), item: result._id }) : null;

    const data = {
      result,
      enableModify: result? result.enableModify() : null,
      enableApply: result? result.enableApply() : null,
      isApplied,
      isAccepted: result && isApplied === true? await models.StudyApply.exists({ applyAccount: req!.session!.passport.user.toString(), item: result._id, accept: true }) : null,
    };

    res.json(responseForm(true, '', data));
  } catch (err) {
    res.status(500).json(responseForm(false, err.toString()));
  }
});

router.post('/board/study', async (req, res, next) => {
  try {
    if (req!.session!.passport.user.toString() !== req.body.writeMem) {
      throw new Error('옳지 않은 권한입니다!');
    }

    switch (req.body.writeKind) {
      case 'develop': case 'design': case 'etc': break;
      default: throw new Error('유효한 카테고리가 아닙니다');
    }

    const { writeMem, writeKind, writeTopic, writeTitle, writeContent, writeWantNum, writeEndDay } = req.body;
    const result = await models.Study.create({
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

    res.status(201).json(responseForm(true, '', result));
  } catch (err) {
    res.status(500).json(responseForm(false, err.toString()));
  }
});

router.patch('/board/study/:id', async (req, res, next) => {
  try {
    if (req!.session!.passport.user.toString() !== req.body.modifyAuthor) {
      throw new Error('옳지 않은 권한입니다!');
    }

    const { id } = req.params;

    const { modifyWantNum, modifyEndDay, modifyTopic, modifyTitle, modifyContent } = req.body;
    
    const updateObj = { 
      $set: 
      {
        topic: modifyTopic,
        title: modifyTitle,
        content: modifyContent,
        wantNum: modifyWantNum,
        endDay: modifyEndDay,
      }
    };
    
    const result = await models.Study.findByIdAndUpdate(id, updateObj, { new: true })
      .then((result) => {
        return result ? result._id : result; 
      })
      .catch((err) => {
        new Error(err);
      });

    res.json(responseForm(true, '', result));
  } catch (err) {
    res.status(500).json(responseForm(false, err.toString()));
  }
});

router.delete('/board/study/:id', async (req, res, next) => {
  try {
    if (req!.session!.passport.user.toString() !== req.body.writeMem) {
      throw new Error('옳지 않은 권한입니다!');
    }

    const { id } = req.params;
    
    const result = await models.Study.findByIdAndUpdate(id, { active: false })
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
    
    res.json(responseForm(true, '', result));
  } catch (err) {
    res.status(500).json(responseForm(false, err.toString()));
  }
});


router.get('/boards/contest/:page/:order', async (req, res, next) => {
  try {
    const { page } = req.params;
    let { order } = req.params;

    switch (order) {
      case 'createdAt': case 'endDay': case 'hit':
        order = `-${order} title`; break;
      case 'title':
        order = `${order} -createdAt`; break;
      default: throw new Error('해당 속성으로 정렬할 수 없습니다');
    }

    const result = await models.Contest.find({
        active: true,
        $or: [
          {
            account: req!.session!.passport.user.toString() || null,
            endDay: { $lt: new Date }
          }, {
            endDay: { $gt: new Date }
          }
        ]
      })
      .sort(order)
      .skip(Number(page) * 10)
      .limit(10)
      .populate({
        path: 'account',
        select: '_id id name sNum',
      });

    if ((<any>result).length) {
      res.json(responseForm(true, '', result));
    } else {
      res.status(204).json(responseForm(true));
    }
  } catch (err) {
    res.status(500).json(responseForm(false, err.toString()));
  }
});

router.get('/boards/contest/:category/:page/:order', async (req, res, next) => {
  try {
    const { category, page } = req.params;
    let { order } = req.params;

    switch (category) {
      case 'develop': case 'design': case 'idea': case 'etc': break;
      default: throw new Error('유효한 카테고리가 아닙니다');
    }

    switch (order) {
      case 'createdAt': case 'endDay': case 'hit':
        order = `-${order} title`; break;
      case 'title':
        order = `${order} -createdAt`; break;
      default: throw new Error('해당 속성으로 정렬할 수 없습니다');
    }

    const result = await models.Contest.find({
        kind: category,
        active: true,
        $or: [{
            account: req!.session!.passport.user.toString() || null,
            endDay: { $lt: new Date }
          }, {
            endDay: { $gt: new Date }
          }
        ]
      })
      .sort(order)
      .skip(Number(page) * 10)
      .limit(10)
      .populate({
        path: 'account',
        select: '_id id name sNum',
      });

    if ((<any>result).length) {
      res.json(responseForm(true, '', result));
    } else {
      res.status(204).json(responseForm(true));
    }
  } catch (err) {
    res.status(500).json(responseForm(false, err.toString()));
  }
});

router.get('/board/contest/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    await models.Contest.findOneAndUpdate(id, { $inc: { hit: 1 } })
      .catch((err) => {
        new Error(err);
      });

    const result = await models.Contest.findById(id)
      .populate({
        path: 'account',
        select: '_id id name sNum',
      });
    
    const isApplied = result? await models.StudyApply.exists({ applyAccount: req!.session!.passport.user.toString(), item: result._id }) : null;

    const data = {
      result,
      enableModify: result? result.enableModify() : null,
      enableApply: result? result.enableApply() : null,
      isApplied,
      isAccepted: result && isApplied === true? await models.StudyApply.exists({ applyAccount: req!.session!.passport.user.toString(), item: result._id, accept: true }) : null,
    };

    res.json(responseForm(true, '', data));
  } catch (err) {
    res.status(500).json(responseForm(false, err.toString()));
  }
});

router.post('/board/contest', async (req, res, next) => {
  try {
    if (req!.session!.passport.user.toString() !== req.body.writeMem) {
      throw new Error('옳지 않은 권한입니다!');
    }

    switch (req.body.writeKind) {
      case 'develop': case 'design': case 'idea': case 'etc': break;
      default: throw new Error('유효한 카테고리가 아닙니다');
    }
    
    const { writeMem, writeKind, writeTopic, writePart, writePartNum, writeTitle, writeContent, writeWantNum, writeEndDay } = req.body;
    
    const partObj = {
      name: writePart.split(','),
      num: writePartNum,
    };
    
    const result = await models.Contest.create({
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

    res.status(201).json(responseForm(true, '', result));
  } catch (err) {
    res.status(500).json(responseForm(false, err.toString()));
  }
});

router.patch('/board/contest/:id', async (req, res, next) => {
  try {
    if (req!.session!.passport.user.toString() !== req.body.modifyAuthor) {
      throw new Error('옳지 않은 권한입니다!');
    }

    const { id } = req.params;

    const { modifyWantNum, modifyEndDay, modifyTopic, modifyTitle, modifyContent } = req.body;
    
    const updateObj = { 
      $set: 
      {
        topic: modifyTopic,
        title: modifyTitle,
        content: modifyContent,
        wantNum: modifyWantNum,
        endDay: modifyEndDay,
      }
    };
    const result = await models.Contest.findByIdAndUpdate(id, updateObj, { new: true })
      .then((result) => {
        return result ? result._id : result;
      })
      .catch((err) => {
        new Error(err);
      });

    res.json(responseForm(true, '', result));
  } catch (err) {
    res.status(500).json(responseForm(false, err.toString()));
  }
});

router.delete('/board/contest/:id', async (req, res, next) => {
  try {
    if (req!.session!.passport.user.toString() !== req.body.writeMem) {
      throw new Error('옳지 않은 권한입니다!');
    }

    const { id } = req.params;
    
    const result = await models.Contest.findByIdAndUpdate(id, { active: false })
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

    res.json(responseForm(true, '', result));
  } catch (err) {
    res.status(500).json(responseForm(false, err.toString()));
  }
});
