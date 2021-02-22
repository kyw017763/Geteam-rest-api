import { connection } from 'mongoose'
import { ObjectId } from 'mongodb'
import bcrypt from 'bcryptjs'
import models from './models'
import AccountModelFilter from '../ts/models/account/AccountModelFilter'

const accountColl = connection.collection(models.ACCOUNT)

export default {
  DeleteBeforeSignUp: (params = {}) => {
    const { id } = params

    return accountColl.deleteMany({ id, isVerified: false, active: false })
  },
  SignUp: (params = {}) => {
    const { id, name, sNum, interests, profile, verifyKey } = params
    let { pwd } = params
    pwd = bcrypt.hashSync(pwd)

    const currentDate = new Date()

    return accountColl.insertOne({
      id,
      name,
      pwd,
      sNum,
      interests,
      profile,
      notifications: {
        applied: false,
        accepted: false,
        team: false
      },
      verifyKey,
      verifyExpireAt: new Date(currentDate.getTime() + (3600000)), // 1 hour
      active: false,
      createdAt: currentDate,
      updatedAt: currentDate,
    })
  },

  SignIn: (params = {}) => {
    const { id } = params

    return accountColl.findOne({ id, isVerified: true, active: true })
  },
  GetItem: (params = {}) => {
    const { _id } = params

    return accountColl.findOne({ _id: new ObjectId(_id) }, { projection: { pwd: false } })
  },
  GetInterests: (params = {}) => {
    const { id } = params

    return accountColl.findOne(
      { id, active: true, isVerified: true },
      { projection: { id: true, name: true, interests: true } }
    )
  },
  GetPassword: (params = {}) => {
    const { _id } = params

    return accountColl.findOne(
      { _id: new ObjectId(_id), active: true, isVerified: true },
      { projection: { id: true, name: true, pwd: true, interests: true } }
    )
  },
  GetCompareEmail: async (params = {}) => {
    const { id } = params

    return (await accountColl.countDocuments({ id, isVerified: true })) > 0
  },
  IsExist: async (param = {}) => {
    const { _id, id, sNum } = param

    const filter: AccountModelFilter = {}

    if (_id) filter._id = new ObjectId(_id)
    if (id) filter.id = id
    if (sNum) filter.sNum = sNum

    return (await accountColl.countDocuments(filter)) > 0
  },
  
  UpdateRefreshToken: (params = {}) => {
    const { id, refreshToken } = params

    return accountColl.updateOne({ id, isVerified: true, active: true }, { $set: { refreshToken } })
  },
  ResetRefreshToken: (params = {}) => {
    const { _id } = params
    
    return accountColl.updateOne({ _id: new ObjectId(_id), isVerified: true, active: true }, { $unset: { refreshToken: true } })
  },
  UpdateIsVerified: (params = {}) => {
    const { verifyKey } = params

    return accountColl.updateOne(
      { verifyKey, verifyExpireAt: { $gte: new Date() }, isVerified: false, active: false },
      { $set: { isVerified: true, active: true } }
    )
  },
  UpdateVerifyKey: (params = {}) => {
    const { id, verifyKey } = params

    return accountColl.updateOne({ id, isVerified: false, active: false }, { $set: { verifyKey } })
  },
  UpdatePassword: (params = {}) => {
    const { _id } = params
    let { pwd } = params
    pwd = bcrypt.hashSync(pwd)

    return accountColl.updateOne({ _id: new ObjectId(_id) }, { $set: { pwd, updatedAt: new Date() } })
  },
  UpdateInfo: (params = {}) => {
    const { _id, name, sNum, interests, profile } = params

    return accountColl.updateOne(
      { _id: new ObjectId(_id) },
      { $set: { name, sNum, interests, profile, updatedAt: new Date() } }
    )
  },
  UpdateNotifications: (params = {}) => {
    const { _id, notifications: { applied, accepted, team } } = params

    const updateQuery = { notifications: {} }
    if (applied) updateQuery.notifications.applied = applied
    if (accepted) updateQuery.notifications.accepted = accepted
    if (team) updateQuery.notifications.team = team

    return accountColl.updateOne({ _id: new ObjectId(_id) }, { $set: { ...updateQuery, updatedAt: new Date() } })
  },
  Delete: (params = {}) => {
    const { _id } = params

    return accountColl.updateOne({ _id: new ObjectId(_id), active: true, isVerified: true }, { $set: { active: false } })
  },
}
