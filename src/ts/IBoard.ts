import IAccount from './IAccount'

export default interface IBoard {
  _id: string
  accountId: IAccount['_id']
  kind: string // study or contest
  topic: string
  title: string
  content: string
  position: {
    title: [string]
    cnt: number
  }
  wantCnt: number
  applyCnt: number
  acceptCnt: number
  startDate: Date
  endDate: Date
  hit: number
  isCompleted: boolean
  active: boolean
  updatedAt: Date
}
