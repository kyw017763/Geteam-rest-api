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
      active: false,
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
      pwd,
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
      active: false,
    }, {
      $set: {
        isVerified: true,
        active: true,
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
  GetForResetPassword: (params: any = {}) => {
    const { id } = params
    return Account.findOne(
      { id, active: true, isVerified: true },
      {
        projection: {
          id: true,
          name: true,
          interests: true,
        }
      }
    )
  },
  GetForUpdatePassword: (params: any = {}) => {
    const { _id } = params
    return Account.findOne(
      { _id: new ObjectId(_id), active: true, isVerified: true },
      {
        projection: {
          id: true,
          name: true,
          interests: true,
        }
      }
    )
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
  UpdatePassword: (params: any = {}) => {
    const { _id } = params
    let { pwd } = params
    pwd = bcrypt.hashSync(pwd)

    return Account.updateOne(
      { _id: new ObjectId(_id) },
      { $set: { pwd } }
    )
  },
  UpdateInfo: (params: any = {}) => {
    const { _id, name, sNum, interests, profile, profilePhoto } = params

    return Account.updateOne(
      { _id: new ObjectId(_id) },
      {
        $set: {
          name,
          sNum,
          interests,
          profile,
          profilePhoto: profilePhoto || '',
        }
      }
    )
  },
  UpdateNoti: (params: any = {}) => {
    const { _id, notiApplied, notiAccepted, notiTeam } = params

    const updateQuery: any = {}

    if (notiApplied !== undefined) {
      updateQuery['notiApplied'] = notiApplied
    }
    if (notiAccepted !== undefined) {
      updateQuery['notiAccepted'] = notiAccepted
    }
    if (notiTeam !== undefined) {
      updateQuery['notiTeam'] = notiTeam
    }

    return Account.updateOne(
      { _id: new ObjectId(_id) },
      {
        $set: updateQuery
      }
    )
  },
  Delete: (params: any = {}) => {
    const { _id } = params

    return Account.updateOne(
      { _id: new ObjectId(_id), active: true, isVerified: true },
      { $set: { active: false } }
    )
  },
}
