import express from 'express';
import redisClient from './redis';
import responseForm from './../lib/responseForm';

const router = express.Router();
export default router;

// GET 했는데 없다면 0

export const incVisitCnt = () => {
  if (redisClient.EXISTS('visitCnt')) {
    let cnt = redisClient.GET('visitCnt');
    let cntNum = Number(cnt) + 1;
    redisClient.SET('visitCnt', cntNum.toString());
    return cnt;
  } else {
    redisClient.SET('visitCnt', '1');
    return 1;
  }
};

export const incMemberCnt = () => {
  if (redisClient.EXISTS('memberCnt')) {
    let cnt = redisClient.GET('memberCnt');
    let cntNum = Number(cnt) + 1;
    redisClient.SET('memberCnt', cntNum.toString());
    return cnt;
  } else {
    redisClient.SET('memberCnt', '1');
    return 1;
  }
};

export const incListCnt = async () => {
  if (redisClient.EXISTS('listCnt')) {
    let cnt = redisClient.GET('listCnt');
    let cntNum = Number(cnt) + 1;
    redisClient.SET('listCnt', cntNum.toString());
    return cnt;
  } else {
    redisClient.SET('listCnt', '1');
    return 1;
  }
};

export const incApplyCnt = async () => {
  if (redisClient.EXISTS('applyCnt')) {
    let cnt = redisClient.GET('applyCnt');
    let cntNum = Number(cnt) + 1;
    redisClient.SET('applyCnt', cntNum.toString());
    return cnt;
  } else {
    redisClient.SET('applyCnt', '1');
    return 1;
  }
};

export const incTeamCnt = async () => {
  if (redisClient.EXISTS('teamCnt')) {
    let cnt = redisClient.GET('teamCnt');
    let cntNum = Number(cnt) + 1;
    redisClient.SET('teamCnt', cntNum.toString());
    return cnt;
  } else {
    redisClient.SET('teamCnt', '1');
    return 1;
  }
};

router.get('/counting', async (req, res, next) => {
  try {

    interface ICounting {
      visit?: number;
      member?: number;
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

    if (redisClient.EXISTS('memberCnt')) {
      counting.member = Number(redisClient.GET('memberCnt'));
    } else {
      redisClient.SET('memberCnt', '0');
      counting.member = 0;
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

    res.status(200).json(responseForm(true, '', counting));
  } catch (err) {
    res.status(500).json(responseForm(false, err.toString()));
  }
});
