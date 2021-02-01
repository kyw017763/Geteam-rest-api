import { ObjectId } from 'mongodb'
import IAccount from './IAccount'

export default interface IBoard {
  _id?: ObjectId

  accountId: IAccount['_id']
  kind: string
  category: string
  topic: string
  title: string
  content: string
  position?: { // only contest
    title: [string]
    description: [string]
    cnt: number
  }
  wantCnt: number
  applicationCnt?: number
  acceptCnt?: number
  startDate: Date
  endDate: Date
  isCompleted?: boolean
  active: boolean
  hit: number
  updatedAt: Date
}
