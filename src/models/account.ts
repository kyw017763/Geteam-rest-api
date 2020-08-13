import { connection } from 'mongoose'
import { ObjectId } from 'mongodb'
import * as models from './models'
import bcrypt from 'bcryptjs'
import IAccount from '../ts/IAccount'

const Account = connection.collection(models.ACCOUNT)

export default {
  SignUp: (params: IAccount = {}) => {
    let { pwd } = params
    pwd = bcrypt.hashSync(pwd)
  },
  Signin: async (params: IAccount = {}) => {
    const { _id, pwd } = params
    const currentPwd = await Account.findOne({ _id: new ObjectId(_id) })
    return bcrypt.compareSync(pwd, currentPwd)

  }
}
