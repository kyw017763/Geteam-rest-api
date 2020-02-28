import express from 'express';
import config from './../config';
import responseForm from './../lib/responseForm';
import models from './../models';

const router = express.Router();
export default router;

router.get('/study', async (req, res, next) => {
  try {
    const result = await models.Study.find()
    .then((result) => {
      return result;
    })
    .catch((err) => {
      throw new err;
    });

    res.json(responseForm(true, '', result));
  } catch (err) {
    res.status(500).json(responseForm(false, err.toString()));
  }
});

router.get('/study/:category', async (req, res, next) => {
  try {
    const { category } = req.params;
    
    switch (category) {
      case 'develop': case 'design': case 'etc': break;
      default: throw new Error('유효한 카테고리가 아닙니다');
    }

    const result = await models.Study.find({ kind: category })
    .then((result) => {
      return result;
    })
    .catch((err) => {
      throw new err;
    });

    res.json(responseForm(true, '', result));
  } catch (err) {
    res.status(500).json(responseForm(false, err.toString()));
  }
});

router.get('/study/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await models.Study.findById(id)
    .then((result) => {
      return result;
    })
    .catch((err) => {
      throw new err;
    });

    res.json(responseForm(true, '', result));
  } catch (err) {
    res.status(500).json(responseForm(false, err.toString()));
  }
});

router.post('/study/:category', async (req, res, next) => {
  try {
    const { category } = req.params;

    switch (category) {
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
    }).then((result) => {
      return result._id;
    }).catch((err) => {
      throw new err;
    });

    res.json(responseForm(true, '', result));
  } catch (err) {
    res.status(500).json(responseForm(false, err.toString()));
  }
});

router.patch('/study/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const { modify_author, modify_want_num, modify_end_day, modifyTopic, modifyTitle, modifyContent } = req.body;
    
    const updateObj = { 
      $set: 
      {
        topic: modifyTopic,
        title: modifyTitle,
        content: modifyContent,
        wantNum: modify_want_num,
        endDay: modify_end_day,
      }
    };
    
    const result = await models.Study.findByIdAndUpdate(id, updateObj, { new: true })
    .then((result) => {
      return result;
    })
    .catch((err) => {
      throw new err;
    });

    res.json(responseForm(true, '', result));
  } catch (err) {
    res.status(500).json(responseForm(false, err.toString()));
  }
});

router.delete('/study/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const result = await models.Study.findByIdAndDelete(id)
    .then((result) => {
      return true;
    })
    .catch((err) => {
      throw new err;
    });

    res.json(responseForm(true, '', result));
  } catch (err) {
    res.status(500).json(responseForm(false, err.toString()));
  }
});
