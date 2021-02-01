import { ObjectId } from 'mongodb'
import IAccount from './IAccount'
import IPosition from './IPosition'

export default interface IBoard {
  _id?: ObjectId

  accountId: IAccount['_id']
  kind: string
  category: string
  topic: string
  title: string
  content: string
  positions: IPosition[] // only contest
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
