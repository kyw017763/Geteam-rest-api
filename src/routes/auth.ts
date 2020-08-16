import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import decodeJWT from 'jwt-decode'
import passport from 'passport'
import createKey from './../lib/createKey'
import createHash from './../lib/createHash'
import { SuccessResponse, FailureResponse, InternalErrorResponse } from './../lib/responseForm'
import { INVALID_PARAM, NOT_FOUND, BAD_REQUEST } from '../lib/failureResponse';
import models from '../models'
import { validateKind, validateCategory, validateModifyOrder } from '../lib/validateValue'
import { sendAuthEmail, sendPwdEmail, sendQuestionEmail } from 'src/lib/sendEmail'
import redisClient from '../lib/redisClient'
import config from '../../config'

const AccountDB = models.account
const ApplyDB = models.apply

interface IDecodedAccessToken {
  _id: string
  exp: number
}

const router = express.Router()
export default router

router.post('/register', async (req, res) => {
  try {
    const {
      SignUpEmail: id,
      SignUpName: name,
      SignUpPwd: pwd,
      SignUpSNum: sNum,
      SignUpInterests: interests,
      SignUpProfile: profile,
    } = req.body

    const verifyKey = createKey()
    await sendAuthEmail(id, verifyKey)

    await AccountDB.DeleteBeforeSignUp({ id })

    await AccountDB.SignUp({
      id,
      name,
      pwd,
      sNum,
      interests,
      profile,
      verifyKey
    })
    
    res.status(201).end()
  } catch (err) {
    console.log(err)
    res.status(500).send(InternalErrorResponse)
  }
})

router.post('/register/compare-email', async (req, res) => {
  try {
    const { id } = req.body

    const result = await AccountDB.GetCompareEmail({ id })

    res.send(SuccessResponse({ result }))
  } catch (err) {
    console.log(err)
    res.status(500).send(InternalErrorResponse)
  }
})

router.post('/register/verify/:key', async (req, res) => {
  try {
    const { key } = req.params

    const result = await AccountDB.UpdateIsverified({ verifyKey: key })

    const { matchedCount, modifiedCount } = result

    if (matchedCount && modifiedCount) {
      return res.status(400).send(FailureResponse(BAD_REQUEST))
    }

    await redisClient.incCnt('accountCnt')

    res.end()
  } catch (err) {
    console.log(err)
    res.status(500).send(InternalErrorResponse)
  }
})

router.post('/register/verify/new/:key', async (req, res) => {
  try {
    const { key } = req.params
    const { email } = req.body

    const verifyKey = createKey()

    const result = await AccountDB.UpdateVerifyKey({ id: email, verifyKey: key })

    const { matchedCount, modifiedCount } = result

    if (matchedCount && modifiedCount) {
      return res.status(400).send(FailureResponse(BAD_REQUEST))
    }

    await sendAuthEmail(email, verifyKey)

    res.end()
  } catch (err) {
    console.log(err)
    res.status(500).send(InternalErrorResponse)
  }
})

// Access Token, Refresh Token 발급
router.post('/signin', async (req, res) => {
  try {
    const {
      SignInEmail: id,
      SignInPwd: pwd,
    } = req.body

    const result = await AccountDB.SignIn({ id })

    if (!result) {
      res.status(400).send(FailureResponse(NOT_FOUND))
    }

    if (bcrypt.compareSync(pwd, result.pwd)) {
      res.status(400).send(FailureResponse(BAD_REQUEST))
    }

    const payload = { _id: result._id }

    const accessOptions = {
      issuer: 'geteam',
      expiresIn: Number(process.env.ACCESS_EXPIRE || config.ACCESS_EXPIRE),
    }

    const refreshOptions = {
      issuer: 'geteam',
      expiresIn: process.env.REFRESH_EXPIRE || config.REFRESH_EXPIRE, 
    }

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET || config.JWT_SECRET, accessOptions)
    const refreshToken = jwt.sign(payload, process.env.REFRESH_SECRET || config.REFRESH_SECRET, refreshOptions)
    
    await AccountDB.UpdateRefreshToken({ id, refreshToken })

    const decodedAccessToken: IDecodedAccessToken = decodeJWT(accessToken)

    res.send(SuccessResponse({ accessToken, exp: decodedAccessToken.exp * 1000 }))
  } catch (err) {
    console.log(err)
    res.status(500).send(InternalErrorResponse)
  }
})

// Refresh Token을 이용(DB에서 Get)하여 Access Token 재발급 (실패시 false, /signin으로 redirect)
// Access Token이 만료되었을 것이므로 passport는 사용할 수 없음
router.post('/signin/refresh', async (req, res) => {
  try {
    const oldAccessToken = req.header('Authorization')?.replace(/^Bearer\s/, '')
    let decodedOldAccessToken: IDecodedAccessToken
    if (oldAccessToken) {
      decodedOldAccessToken = decodeJWT(oldAccessToken)
      if (decodedOldAccessToken.exp * 1000 > new Date().getTime()) {
        return res.status(400).send(FailureResponse(BAD_REQUEST))
      }
    } else {
      return res.status(400).send(FailureResponse(INVALID_PARAM))
    }

    const result = await AccountDB.SignIn({ id: decodedOldAccessToken._id })

    if (!result) {
      res.status(400).send(FailureResponse(NOT_FOUND))
    }

    // Verify refresh token
    try {
      jwt.verify(result.refreshToken, process.env.REFRESH_SECRET || config.REFRESH_SECRET)
    } catch (err) {
      throw new Error(err)
    }

    const payload = { _id: result._id }
    
    const accessOptions = {
      issuer: 'geteam',
      expiresIn: Number(process.env.ACCESS_EXPIRE || config.ACCESS_EXPIRE),
    }

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET || config.JWT_SECRET, accessOptions)
    const decodedAccessToken: IDecodedAccessToken = decodeJWT(accessToken)

    res.send(SuccessResponse({ accessToken, exp: decodedAccessToken.exp * 1000 }))
  } catch (err) {
    console.log(err)
    res.status(500).send(InternalErrorResponse)
  }
})

// Blacklisting Token, Set null RefreshToken in DB
// 정상적인 Access Token이 있어야 Signout이 진행된다
router.post('/signout', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const accessToken = req.header('Authorization')?.replace(/^Bearer\s/, '')

    if (!accessToken) {
      return res.status(400).send(FailureResponse(INVALID_PARAM))
    }

    const decodedAccessToken: IDecodedAccessToken = decodeJWT(accessToken)

    if (!decodedAccessToken || !decodedAccessToken._id || decodedAccessToken.exp) {
      return res.status(400).send(FailureResponse(INVALID_PARAM))
    }

    const result = await AccountDB.ResetRefreshToken({ _id: decodedAccessToken._id })

    const { matchedCount, modifiedCount } = result

    if (matchedCount && modifiedCount) {
      return res.status(400).send(FailureResponse(BAD_REQUEST))
    }

    // Blacklisting Token
    await redisClient.blacklistToken(accessToken, decodedAccessToken.exp)
    
    res.end()
  } catch (err) {
    console.log(err)
    res.status(500).send(InternalErrorResponse)
  }
})

// Reset Password (Check Interests, Create Hash)
router.patch('/signin/reset', async (req, res, next) => {
  try {
    const { find_email: email, find_hint: hint } = req.body

    const member = await models.Account.findOne({ id: email, active: true }).select('id name interest1 interest2 interest3')
      .then((member) => {
        if (member) {
          return member
        } else {
          throw new Error('인증 정보가 잘못되었습니다')
        }
      }).catch((err) => {
        throw new Error('인증 정보로 새로운 비밀번호를 설정하던 중 에러가 발생했습니다')
      })
    
    const interestsArr = [member.interest1, member.interest2, member.interest3]
    
    const memberDoc = await models.Account.findOne({ id: email, active: true })
      .then((member) => {
        if (member) {
          return member
        } else {
          throw new Error('인증 정보가 잘못되었습니다')
        }
      }).catch((err) => {
        throw new Error('인증 정보로 새로운 비밀번호를 설정하던 중 에러가 발생했습니다')
      })

    if (interestsArr.includes(hint)) {
      const newPwd = createHash(interestsArr.join('') + new Date().toISOString())
      memberDoc.pwd = newPwd
      memberDoc.save()
      sendPwdEmail('Geteam 비밀번호 초기화', member.id, member.name, newPwd)
    } else {
      throw new Error('입력하신 정보가 잘못되었습니다')
    }

    res.json(responseForm(true))
  } catch (err) {
    console.log(err)
    res.status(500).send(InternalErrorResponse)
  }
})

router.patch('/pwd', async (req, res) => {
  try {
    const user = req!.session!.passport.user.toString()
    const { oldPwd, newPwd } = req.body
    await models.Account.findById(user)
      .then((result) => {
        if (result)  {
          if (result.compareHash(oldPwd)) {
            result.pwd = newPwd
            result.save()
          } else {
            throw new Error('기존 비밀번호를 잘못 입력하셨습니다')
          }
        } else {
          throw new Error()
        }
      })
    
    const accessToken = req.header('Authorization')?.replace(/^Bearer\s/, '')
    if (!accessToken) {
      throw new Error('잘못된 Access Token이 전달되었습니다')
    }
    const decodedAccessToken: IDecodedAccessToken = decodeJWT(accessToken)
    // Blacklisting Token
    await redisClient.blacklistToken(accessToken, decodedAccessToken.exp)
    res.json(responseForm(true))
  } catch (err) {
    console.log(err)
    res.status(500).send(InternalErrorResponse)
  }
})

router.delete('/unregister', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
  try {
    const accessToken = req.header('Authorization')?.replace(/^Bearer\s/, '')
    if (!accessToken) {
      throw new Error('잘못된 Access Token이 전달되었습니다')
    }
    const decodedAccessToken: IDecodedAccessToken = decodeJWT(accessToken)
    await models.Account.findOneAndUpdate({ _id: decodedAccessToken._id }, { active: false })
      .then((member) => {
        if (!member) {
          throw new Error('인증 정보가 잘못되었습니다')
        }
      }).catch((err) => {
        throw new Error('인증 정보로 새로운 비밀번호를 설정하던 중 에러가 발생했습니다')
      })
    
    // Blacklisting Token
    await redisClient.blacklistToken(accessToken, decodedAccessToken.exp)
    
    res.json(responseForm(true))
  } catch (err) {
    console.log(err)
    res.status(500).send(InternalErrorResponse)
  }
})

router.post('/verify', async (req, res, next) => {
  try {
    const accessToken = req.header('Authorization')?.replace(/^Bearer\s/, '')
    
    if (!accessToken) {
      throw new Error('잘못된 Access Token이 전달되었습니다')
    }
    if (await redisClient.checkToken(accessToken)) {
      throw new Error('Signout 처리된 Access Token입니다')
    }
    
    const decodedAccessToken: IDecodedAccessToken = decodeJWT(accessToken)

    if ((decodedAccessToken.exp * 1000) <= new Date().getTime()) {
      throw new Error('만료된 Access Token입니다')
    }

    res.json(responseForm(true, '', decodedAccessToken))
  } catch (err) {
    console.log(err)
    res.status(500).send(InternalErrorResponse)
  }
})

router.get('/info', async (req, res) => {
  try {
    const me = req!.session!.passport.user.toString()

    const result = await AccountDB.GetItem({ me })

    res.send(SuccessResponse(result))
  } catch (err) {
    res.status(500).json(responseForm(false, err.toString()))
  }
})

router.patch('/info', async (req, res) => {
  try {
    const me = req!.session!.passport.user.toString()
    const { modifyName, modifySNum, modifyInterest1, modifyInterest2, modifyInterest3, modifyProfile } = req.body

    await AccountDB.UpdateInfo({
      me,
      name: modifyName,
      sNum: modifySNum,
      interest1: modifyInterest1,
      interest2: modifyInterest2,
      interest3: modifyInterest3,
      profile: modifyProfile
    })

    res.send()
  } catch (err) {
    console.log(err)
    res.status(500).send(InternalErrorResponse)
  }
})

router.patch('/noti/apply', async (req, res) => {
  try {
    const user = req!.session!.passport.user.toString()
    const { applyBoolean: notiApply } = req.body
    const result = await models.Account.findByIdAndUpdate(user, { notiApply }, { new: true })
    if (result) {
      res.json(responseForm(true, '', result.notiApply))
    } else {
      throw new Error()
    }
  } catch (err) {
    console.log(err)
    res.status(500).send(InternalErrorResponse)
  }
})

router.patch('/noti/write', async (req, res) => {
  try {
    const user = req!.session!.passport.user.toString()
    const { writeBoolean: notiWrite } = req.body
    const result = await models.Account.findByIdAndUpdate(user, { notiWrite }, { new: true })
    if (result) {
      res.json(responseForm(true, '', result.notiWrite))
    } else {
      throw new Error()
    }
  } catch (err) {
    console.log(err)
    res.status(500).send(InternalErrorResponse)
  }
})

// TODO: 회원가입 할 때 하나씩 ajax로 검사