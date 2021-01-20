import { connection } from 'mongoose'
import { ObjectId } from 'mongodb'
import { ACCOUNT } from './models'
import IAccount from '../ts/IAccount'
import bcrypt from 'bcryptjs'

const accountColl = connection.collection(ACCOUNT)

export default {
  DeleteBeforeSignUp: (params: any = {}) => {
    const { id } = params

    return accountColl.deleteMany({ id, isVerified: false, active: false })
  },
  SignUp: (params: any = {}) => {
    const { id, name, sNum, interests, profile, verifyKey } = params
    let { pwd } = params
    pwd = bcrypt.hashSync(pwd)

    const currentDate = Date.now()

    return accountColl.insertOne({
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
      createdAt: currentDate,
      updatedAt: currentDate,
    })
  },

  SignIn: (params: any = {}) => {
    const { id } = params

    return accountColl.findOne({ id, isVerified: true, active: true })
  },
  GetItem: (params: any = {}) => {
    const { _id } = params

    return accountColl.findOne({ _id: new ObjectId(_id) }, { projection: { pwd: false } })
  },
  GetInterests: (params: any = {}) => {
    const { id } = params

    return accountColl.findOne(
      { id, active: true, isVerified: true },
      { projection: { id: true, name: true, interests: true } }
    )
  },
  GetPassword: (params: any = {}) => {
    const { _id } = params

    return accountColl.findOne(
      { _id: new ObjectId(_id), active: true, isVerified: true },
      { projection: { id: true, name: true, pwd: true, interests: true } }
    )
  },
  GetCompareEmail: async (params: any = {}) => {
    const { id } = params

    return (await accountColl.countDocuments({ id, isVerified: true })) > 0
  },
  IsExist: async (param: any = {}) => {
    const { _id, id, sNum } = param

    const filter: any = {}

    if (_id) filter['_id'] = new ObjectId(_id)
    if (id) filter['id'] = id
    if (sNum) filter['sNum'] = sNum

    return (await accountColl.countDocuments(filter)) > 0
  },
  
  UpdateRefreshToken: (params: any = {}) => {
    const { id, refreshToken } = params

    return accountColl.updateOne({ id, isVerified: true, active: true }, { $set: { refreshToken } })
  },
  ResetRefreshToken: (params: any = {}) => {
    const { _id } = params
    
    return accountColl.updateOne({ _id: new ObjectId(_id), active: true }, { $unset: { refreshToken: true } })
  },
  UpdateIsVerified: (params: any = {}) => {
    const { verifyKey } = params

    return accountColl.updateOne(
      { verifyKey, verifyExpireAt: { $gte: new Date() }, isVerified: false, active: false },
      { $set: { isVerified: true, active: true } }
    )
  },
  UpdateVerifyKey: (params: any = {}) => {
    const { id, verifyKey } = params

    return accountColl.updateOne({ id, verifyKey, isVerified: false, active: true }, { $set: { verifyKey } })
  },
  UpdatePassword: (params: any = {}) => {
    const { _id } = params
    let { pwd } = params
    pwd = bcrypt.hashSync(pwd)

    return accountColl.updateOne({ _id: new ObjectId(_id) }, { $set: { pwd, updatedAt: Date.now() } })
  },
  UpdateInfo: (params: any = {}) => {
    const { _id, name, sNum, interests, profile } = params

    return accountColl.updateOne(
      { _id: new ObjectId(_id) },
      { $set: { name, sNum, interests, profile, updatedAt: Date.now() } }
    )
  },
  UpdateNotifications: (params: any = {}) => {
    const { _id, notifications: { applied, accepted, team } } = params

    const updateQuery: any = { notifications: {} }
    if (applied) updateQuery.notifications.applied = applied
    if (accepted)updateQuery.notifications.accepted = accepted
    if (team) updateQuery.notifications.team = team

    return accountColl.updateOne({ _id: new ObjectId(_id) }, { $set: { updateQuery, updatedAt: Date.now() } })
  },
  Delete: (params: any = {}) => {
    const { _id } = params

    return accountColl.updateOne({ _id: new ObjectId(_id), active: true, isVerified: true }, { $set: { active: false } })
  },
}
