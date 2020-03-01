import express from 'express';
import redisClient from '../redisClient';
import responseForm from './../lib/responseForm';

const router = express.Router();
export default router;

router.get('/counting', async (req, res, next) => {
  try {
    interface ICounting {
      visit?: number;
      account?: number;
      list?: number;
      apply?: number;
      team?: number;
    }

    let counting: ICounting = {};

    redisClient.incCnt('visitCnt');

    counting.visit = redisClient.getCnt('visitCnt');
    counting.account = redisClient.getCnt('accountCnt');
    counting.list = redisClient.getCnt('listCnt');
    counting.apply = redisClient.getCnt('applyCnt');
    counting.team = redisClient.getCnt('teamCnt');
    
    res.status(200).json(responseForm(true, '', counting));
  } catch (err) {
    res.status(500).json(responseForm(false, err.toString()));
  }
});
