import express from 'express';
import redisClient from './../redis';
import responseForm from './../lib/responseForm';
import { incVisitCnt } from './../lib/increaseCnt';

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

    if (redisClient.EXISTS('visitCnt')) {
      counting.visit = Number(redisClient.GET('visitCnt'));
    } else {
      redisClient.SET('visitCnt', '0');
      counting.visit = 0;
    }

    if (redisClient.EXISTS('accountCnt')) {
      counting.account = Number(redisClient.GET('accountCnt'));
    } else {
      redisClient.SET('accountCnt', '0');
      counting.account = 0;
    }

    if (redisClient.EXISTS('listCnt')) {
      counting.list = Number(redisClient.GET('listCnt'));
    } else {
      redisClient.SET('listCnt', '0');
      counting.list = 0;
    }

    if (redisClient.EXISTS('applyCnt')) {
      counting.apply = Number(redisClient.GET('applyCnt'));
    } else {
      redisClient.SET('applyCnt', '0');
      counting.apply = 0;
    }

    if (redisClient.EXISTS('teamCnt')) {
      counting.team = Number(redisClient.GET('teamCnt'));
    } else {
      redisClient.SET('teamCnt', '0');
      counting.team = 0;
    }

    incVisitCnt();
    res.status(200).json(responseForm(true, '', counting));
  } catch (err) {
    res.status(500).json(responseForm(false, err.toString()));
  }
});
