import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import decodeJWT from 'jwt-decode'
import createKey from './../lib/createKey'
import createHash from './../lib/createHash'
import { SuccessResponse, FailureResponse, InternalErrorResponse } from './../lib/responseForm'
import { INVALID_PARAM, NOT_FOUND, BAD_REQUEST } from '../lib/failureResponse';
import models from '../models'
import { sendAuthEmail, sendPwdEmail, sendQuestionEmail } from 'src/lib/sendEmail'
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
}

export const CompareEmail = async (req: Request, res: Response) => {
    try {
      const { id } = req.body
  
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
  
      const result = await AccountDB.UpdateIsverified({ verifyKey: key })
  
      const { matchedCount, modifiedCount } = result
  
      if (!matchedCount && !modifiedCount) {
        return res.status(400).send(FailureResponse(BAD_REQUEST))
      }
  
      await redisClient.incCnt('accountCnt')
  
      res.end()
    } catch (err) {
      console.log(err)
      res.status(500).send(InternalErrorResponse)
    }
}

export const CreateVerifyKey = async (req: Request, res: Response) => {
    try {
      const { key } = req.params
      const { email } = req.body
  
      const verifyKey = createKey()
  
      const result = await AccountDB.UpdateVerifyKey({ id: email, verifyKey: key })
  
      const { matchedCount, modifiedCount } = result
  
      if (!matchedCount && !modifiedCount) {
        return res.status(400).send(FailureResponse(BAD_REQUEST))
      }
  
      await sendAuthEmail(email, verifyKey)
  
      res.end()
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
        res.status(400).send(FailureResponse(NOT_FOUND))
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
      
      res.end()
    } catch (err) {
      console.log(err)
      res.status(500).send(InternalErrorResponse)
    }
}

export const ResetPassword = async (req: Request, res: Response) => {
    try {
      const { findEmail: email, findHint: hint } = req.body
  
      const result = await AccountDB.GetForResetPassword({ id: email })
  
      if (!result || !result.interests) {
        res.status(400).send(FailureResponse(NOT_FOUND))
      }
  
      if (result.interests.includes(hint)) {
        const newPwd = createHash(result.interests.join('') + new Date().toISOString())
        await AccountDB.UpdatePassword({ _id: result._id, pwd: newPwd })
        sendPwdEmail('Geteam 비밀번호 초기화', result.id, result.name, newPwd)
      }
  
      res.end()
    } catch (err) {
      console.log(err)
      res.status(500).send(InternalErrorResponse)
    }
}

export const UpdatePassword = async (req: Request, res: Response) => {
    try {
      const me = req!.session!.passport.user.toString()
      const { oldPwd, newPwd } = req.body
      
      const result = await AccountDB.GetForUpdatePassword({ _id: me })
      if (!result || !result.pwd) {
        return res.status(400).send(FailureResponse(NOT_FOUND))
      }
      else if (!bcrypt.compareSync(result.pwd, bcrypt.hashSync(oldPwd))) {
        return res.status(400).send(FailureResponse(INVALID_PARAM))
      }
      else {
        await AccountDB.UpdatePassword({ _id: result._id, pwd: newPwd })
      }
      
      const accessToken = req.header('Authorization')?.replace(/^Bearer\s/, '')
  
      const decodedAccessToken: IDecodedAccessToken = decodeJWT(accessToken!)
      
      // Blacklisting Token
      await redisClient.blacklistToken(accessToken!, decodedAccessToken.exp)
  
      res.end()
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
      
      res.end()
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
      const me = req!.session!.passport.user.toString()
  
      const result = await AccountDB.GetItem({ me })
  
      res.send(SuccessResponse(result))
    } catch (err) {
      console.log(err)
      res.status(500).send(InternalErrorResponse)
    }
}

export const UpdateInfo = async (req: Request, res: Response) => {
    try {
      const me = req!.session!.passport.user.toString()
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
  
      res.end()
    } catch (err) {
      console.log(err)
      res.status(500).send(InternalErrorResponse)
    }
}

export const UpdateNotiApplied = async (req: Request, res: Response) => {
    try {
      const me = req!.session!.passport.user.toString()
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
      const me = req!.session!.passport.user.toString()
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
      const me = req!.session!.passport.user.toString()
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

export const CheckEmail = async (req: Request, res: Response) => { // TODO

}

export const CheckSnum = async (req: Request, res: Response) => { // TODO

}