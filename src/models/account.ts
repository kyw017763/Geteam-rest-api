import { connection } from 'mongoose'
import { ObjectId } from 'mongodb'
import { ACCOUNT } from './models'
import bcrypt from 'bcryptjs'
import IAccount from '../ts/IAccount'

const Account = connection.collection(ACCOUNT)

export default {
  SignUp: (params: any = {}) => {
    let { pwd } = params
    pwd = bcrypt.hashSync(pwd)
  },
  Signin: async (params: any = {}) => {
    const { _id, pwd } = params
    const currentPwd = await Account.findOne({ _id: new ObjectId(_id) })
    return bcrypt.compareSync(pwd, currentPwd)

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
