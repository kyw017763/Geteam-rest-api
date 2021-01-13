import { Request, Response } from 'express'
import { SuccessResponse, FailureResponse, InternalErrorResponse } from './../lib/responseForm'
import { INVALID_PARAM, NOT_FOUND, BAD_REQUEST } from '../lib/failureResponse'
import { sendAuthEmail, sendPwdEmail, sendQuestionEmail } from '../lib/sendEmail'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import decodeJWT from 'jwt-decode'
import createKey from './../lib/createKey'
import createHash from './../lib/createHash'
import models from '../models'
import redisClient from '../lib/redisClient'
import config from '../../config'

const AccountDB = models.account

interface IDecodedAccessToken {
  _id: string
  exp: number
}

export const Create = async (req: Request, res: Response) => {
  try {
    const {
      SignUpEmail: id,
      SignUpName: name,
      SignUpPwd: pwd,
      SignUpSNum: sNum,
      SignUpInterests: interests,
      SignUpProfile: profile,
    } = req.body

    if (!id || !name || !pwd || !sNum || !interests.length || !profile) {
      return res.status(400).send(FailureResponse(INVALID_PARAM))
    }
  
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
    
    res.status(201).end(SuccessResponse())
  } catch (err) {
    console.log(err)
    res.status(500).send(InternalErrorResponse)
  }
}

export const CompareEmail = async (req: Request, res: Response) => {
  try {
    const { email: id } = req.body

    if (!id) {
      return res.status(400).send(FailureResponse(INVALID_PARAM))
    }
  
    const result = await AccountDB.GetCompareEmail({ id })
  
    res.send(SuccessResponse({ result }))
  } catch (err) {
    console.log(err)
    res.status(500).send(InternalErrorResponse)
  }
}

export const CompareVerifyKey = async (req: Request, res: Response) => {
  try {
    const { key } = req.params

    if (!key) {
      return res.status(400).send(FailureResponse(INVALID_PARAM))
    }
  
    const result = await AccountDB.UpdateIsVerified({ verifyKey: key })
  
    const { matchedCount, modifiedCount } = result
  
    if (!matchedCount && !modifiedCount) {
      return res.status(400).send(FailureResponse(BAD_REQUEST))
    }
  
    await redisClient.incCnt('accountCnt')
  
    res.send(SuccessResponse())
  } catch (err) {
    console.log(err)
    res.status(500).send(InternalErrorResponse)
  }
}

export const SetVerifyKey = async (req: Request, res: Response) => {
  try {
    const { key } = req.params
    const { email } = req.body

    if (!key || email) {
      return res.status(400).send(FailureResponse(INVALID_PARAM))
    }
  
    const verifyKey = createKey()
  
    const result = await AccountDB.UpdateVerifyKey({ id: email, verifyKey: key })
  
    const { matchedCount, modifiedCount } = result
  
    if (!matchedCount && !modifiedCount) {
      return res.status(400).send(FailureResponse(BAD_REQUEST))
    }
    
    sendAuthEmail(email, verifyKey)
  
    res.send(SuccessResponse())
  } catch (err) {
    console.log(err)
    res.status(500).send(InternalErrorResponse)
  }
}

export const SignIn = async (req: Request, res: Response) => {
  try {
    const {
      SignInEmail: id,
      SignInPwd: pwd,
    } = req.body

    if (!id || !pwd) {
      return res.status(400).send(FailureResponse(INVALID_PARAM))
    }
  
    const result = await AccountDB.SignIn({ id })
  
    if (!result) {
      return res.status(400).send(FailureResponse(NOT_FOUND))
    }
  
    if (bcrypt.compareSync(pwd, result.pwd)) {
      return res.status(400).send(FailureResponse(BAD_REQUEST))
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
}

export const RefreshToken = async (req: Request, res: Response) => {
  try {
    const oldAccessToken = req.header('Authorization')?.replace(/^Bearer\s/, '')
    let decodedOldAccessToken: IDecodedAccessToken
    if (oldAccessToken) {
      decodedOldAccessToken = decodeJWT(oldAccessToken)
    if (decodedOldAccessToken.exp * 1000 > new Date().getTime()) {
      return res.status(400).send(FailureResponse(BAD_REQUEST))
    }
    } else {
      return res.status(400).send(FailureResponse(BAD_REQUEST))
    }
  
    const result = await AccountDB.SignIn({ id: decodedOldAccessToken._id })
  
    if (!result) {
      return res.status(400).send(FailureResponse(NOT_FOUND))
    }
  
    // Verify refresh token
    jwt.verify(result.refreshToken, process.env.REFRESH_SECRET || config.REFRESH_SECRET)
  
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
}

export const SignOut = async (req: Request, res: Response) => {
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
  
    if (!matchedCount && !modifiedCount) {
      return res.status(400).send(FailureResponse(BAD_REQUEST))
    }
  
    // Blacklisting Token
    await redisClient.blacklistToken(accessToken, decodedAccessToken.exp)
    
    res.send(SuccessResponse())
  } catch (err) {
    console.log(err)
    res.status(500).send(InternalErrorResponse)
  }
}

export const ResetPassword = async (req: Request, res: Response) => {
  try {
    const { findEmail: email, findHint: hint } = req.body

    if (!email || !hint) {
      return res.status(400).send(FailureResponse(INVALID_PARAM))
    }
  
    const result = await AccountDB.GetForResetPassword({ id: email })
  
    if (!result || !result.interests) {
      return res.status(400).send(FailureResponse(NOT_FOUND))
    }
  
    if (result.interests.includes(hint)) {
      const newPwd = createHash(result.interests.join('') + new Date().toISOString())
      await AccountDB.UpdatePassword({ _id: result._id, pwd: newPwd })
      sendPwdEmail('Geteam 비밀번호 초기화', result.id, result.name, newPwd)
    }
  
    res.send(SuccessResponse())
  } catch (err) {
    console.log(err)
    res.status(500).send(InternalErrorResponse)
  }
}

export const UpdatePassword = async (req: Request, res: Response) => {
  try {
    const { _id: me } = req!.session!.passport.user
    const { oldPwd, newPwd } = req.body
    
    const result = await AccountDB.GetForUpdatePassword({ _id: me })
    
    if (!result || !result.pwd) {
      return res.status(400).send(FailureResponse(NOT_FOUND))
    }
    
    if (!bcrypt.compareSync(result.pwd, bcrypt.hashSync(oldPwd))) {
      return res.status(400).send(FailureResponse(INVALID_PARAM))
    }

    await AccountDB.UpdatePassword({ _id: result._id, pwd: newPwd })
    
    const accessToken = req.header('Authorization')?.replace(/^Bearer\s/, '')
  
    const decodedAccessToken: IDecodedAccessToken = decodeJWT(accessToken!)
    
    // Blacklisting Token
    await redisClient.blacklistToken(accessToken!, decodedAccessToken.exp)
  
    res.send(SuccessResponse())
  } catch (err) {
    console.log(err)
    res.status(500).send(InternalErrorResponse)
  }
}

export const Delete = async (req: Request, res: Response) => {
  try {
    const accessToken = req.header('Authorization')?.replace(/^Bearer\s/, '')
  
    if (!accessToken) {
      return res.status(400).send(FailureResponse(BAD_REQUEST))
    }
  
    const decodedAccessToken: IDecodedAccessToken = decodeJWT(accessToken)
  
    if (!decodedAccessToken || !decodedAccessToken._id) {
      return res.status(400).send(FailureResponse(BAD_REQUEST))
    }
  
    const result = await AccountDB.Delete({ _id: decodedAccessToken._id })
  
    const { matchedCount, modifiedCount } = result
  
    if (!matchedCount && !modifiedCount) {
      return res.status(400).send(FailureResponse(BAD_REQUEST))
    }
  
    // Blacklisting Token
    await redisClient.blacklistToken(accessToken, decodedAccessToken.exp)
    
    res.send(SuccessResponse())
  } catch (err) {
    console.log(err)
    res.status(500).send(InternalErrorResponse)
  }
}

export const Verify = async (req: Request, res: Response) => {
  try {
    const accessToken = req.header('Authorization')?.replace(/^Bearer\s/, '')
  
    if (await redisClient.checkToken(accessToken!)) {
      return res.status(400).send(FailureResponse(BAD_REQUEST)) // Signout 처리된 Access Token
    }
    
    const decodedAccessToken: IDecodedAccessToken = decodeJWT(accessToken!)
  
    if ((decodedAccessToken.exp * 1000) <= new Date().getTime()) {
      return res.status(400).send(FailureResponse(BAD_REQUEST)) // 만료된 Access Token입니다
    }
  
    res.send(SuccessResponse(decodedAccessToken))
  } catch (err) {
    console.log(err)
    res.status(500).send(InternalErrorResponse)
  }
}

export const GetInfo = async (req: Request, res: Response) => {
  try {
    const { _id: me } = req!.session!.passport.user
  
    const result = await AccountDB.GetItem({ _id: me })
  
    res.send(SuccessResponse(result))
  } catch (err) {
    console.log(err)
    res.status(500).send(InternalErrorResponse)
  }
}

export const UpdateInfo = async (req: Request, res: Response) => {
  try {
    const { _id: me } = req!.session!.passport.user
    const {
      modifyName,
      modifySNum,
      modifyInterests,
      modifyProfile,
      modifyProfilePhoto,
    } = req.body

    await AccountDB.UpdateInfo({
      _id: me,
      name: modifyName,
      sNum: modifySNum,
      interests: modifyInterests,
      profile: modifyProfile,
      profilePhoto: modifyProfilePhoto,
    })
  
    res.send(SuccessResponse())
  } catch (err) {
    console.log(err)
    res.status(500).send(InternalErrorResponse)
  }
}

export const UpdateNotiApplied = async (req: Request, res: Response) => {
  try {
    const { _id: me } = req!.session!.passport.user
    const { notiApply } = req.body
  
    const result = await AccountDB.UpdateNoti({ _id: me, notiApply })
  
    const { matchedCount, modifiedCount } = result
  
    if (!matchedCount && !modifiedCount) {
      return res.status(400).send(FailureResponse(BAD_REQUEST))
    }
    
    res.send(SuccessResponse(notiApply))
  } catch (err) {
    console.log(err)
    res.status(500).send(InternalErrorResponse)
  }
}

export const UpdateNotiAccepted = async (req: Request, res: Response) => {
  try {
    const { _id: me } = req!.session!.passport.user
    const { notiAccepted } = req.body
  
    const result = await AccountDB.UpdateNoti({ _id: me, notiAccepted })
  
    const { matchedCount, modifiedCount } = result
  
    if (!matchedCount && !modifiedCount) {
      return res.status(400).send(FailureResponse(BAD_REQUEST))
    }
  
    res.send(SuccessResponse(notiAccepted))
  } catch (err) {
    console.log(err)
    res.status(500).send(InternalErrorResponse)
  }
}

export const UpdateNotiTeam = async (req: Request, res: Response) => {
  try {
    const { _id: me } = req!.session!.passport.user
    const { notiTeam } = req.body
    
    const result = await AccountDB.UpdateNoti({ _id: me, notiTeam })
  
    const { matchedCount, modifiedCount } = result
  
    if (!matchedCount && !modifiedCount) {
      return res.status(400).send(FailureResponse(BAD_REQUEST))
    }
  
    res.send(SuccessResponse(notiTeam))
  } catch (err) {
    console.log(err)
    res.status(500).send(InternalErrorResponse)
  }
}

export const CheckIsDuplicatedEmail = async (req: Request, res: Response) => {
  try {
  const { email } = req.body

  if (!email) {
    return res.status(400).send(FailureResponse(INVALID_PARAM))
  }

  const isDuplicated = await AccountDB.IsExist({ id: email })

  res.send(SuccessResponse({ isDuplicated }))
  } catch (err) {
  console.log(err)
  res.status(500).send(InternalErrorResponse)
  }
}

export const CheckIsDuplicatedSnum = async (req: Request, res: Response) => {
  try {
  const { sNum } = req.body

  if (!sNum) {
    return res.status(400).send(FailureResponse(INVALID_PARAM))
  }
  
  const isDuplicated = await AccountDB.IsExist({ sNum })

  res.send(SuccessResponse({ isDuplicated }))
  } catch (err) {
  console.log(err)
  res.status(500).send(InternalErrorResponse)
  }
}