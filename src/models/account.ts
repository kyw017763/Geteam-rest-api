import { connection } from 'mongoose'
import { ObjectId } from 'mongodb'
import { ACCOUNT } from './models'
import bcrypt from 'bcryptjs'
import IAccount from '../ts/IAccount'

const Account = connection.collection(ACCOUNT)

export default {
  DeleteBeforeSignUp: (params: any = {}) => {
    const { id } = params
    return Account.deleteMany({
      id,
      isVerified: false,
      active: true,
    })
  },
  SignUp: (params: any = {}) => {
    const {
      id,
      name,
      sNum,
      interests,
      profile,
      verifyKey
    } = params
    let { pwd } = params
    pwd = bcrypt.hashSync(pwd)

    const currentDate = Date.now()

    return Account.insertOne({
      id,
      name,
      sNum,
      interests,
      profile,
      verifyKey,
      verifyExpireAt: currentDate + (3600000), // 1 hour

      notiApplied: false,
      notiAccepted: false,
      notiTeam: false,

      active: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
  },
  UpdateRefreshToken: (params: any = {}) => {
    const { id, refreshToken } = params

    return Account.updateOne({
      id, isVerified: true, active: true
    }, {
      $set: { refreshToken }
    })
  },
  ResetRefreshToken: (params: any = {}) => {
    const { _id } = params
    
    return Account.updateOne({
      _id: new ObjectId(_id), active: true
    }, {
      $set: { refreshToken: '' }
    })
  },
  UpdateIsverified: (params: any = {}) => {
    const { verifyKey } = params

    return Account.updateOne({
      verifyKey,
      verifyExpireAt: { $gte: new Date() },
      isVerified: false,
      active: true,
    }, {
      $set: {
        isVerified: true,
      }
    })
  },
  UpdateVerifyKey: (params: any = {}) => {
    const { id, verifyKey } = params

    return Account.updateOne({
      id,
      verifyKey,
      isVerified: false,
      active: true,
    }, {
      $set: {
        verifyKey,
      }
    })
  },
  SignIn: (params: any = {}) => {
    const { id } = params
    return Account.findOne({ id, isVerified: true, active: true })
  },
  GetCompareEmail: async (params: any = {}) => {
    const { id } = params

    return (await Account.countDocuments(
      { id, isVerified: true }
    )) > 0
  },
  GetItem: (params: any = {}) => {
    const { me } = params
    return Account.findOne(
      { _id: new ObjectId(me) },
      {
        projection: {
          id: true,
          name: true,
          sNum: true,
          interests: true,
          profile: true,
          notiApplied: true,
          notiAccepted: true,
          notiTeam: true,
          createdAt: true,
        }
      }
    )
  },
  UpdateInfo: (params: any = {}) => {

  },
}
