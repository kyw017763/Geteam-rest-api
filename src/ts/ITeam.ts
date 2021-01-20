import { ObjectId } from 'mongodb'
import IAccount from './IAccount'

interface IMember {
  accountId: IAccount['_id']
  position: string
}

export default interface ITeam {
  _id: ObjectId

  name: string
  master: IAccount['_id']
  members: [IMember]
  content: string
  
  createdAt: Date
}
