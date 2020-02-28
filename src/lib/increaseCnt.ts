import redisClient from './../redis';

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

export const incAccountCnt = () => {
  if (redisClient.EXISTS('accountCnt')) {
    let cnt = redisClient.GET('accountCnt');
    let cntNum = Number(cnt) + 1;
    redisClient.SET('accountCnt', cntNum.toString());
    return cnt;
  } else {
    redisClient.SET('accountCnt', '1');
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
