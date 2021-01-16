import { ObjectId } from 'mongodb'
import IAccount from './IAccount'
import IBoard from './IBoard'

export default interface IApply {
  _id: ObjectId

  accountId: IAccount['_id']
  boardId: IBoard['_id']
  author: IAccount['_id']
  position?: string // only contest
  portfolio?: string // link. only contest
  portfolioText?: string // only contest
  wantedText: string
  isAccepted: boolean
  acceptedAt: Date
  active: boolean
  
  createdAt: Date
  updatedAt: Date
}
