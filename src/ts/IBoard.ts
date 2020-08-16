import IAccount from './IAccount'

export default interface IBoard {
  _id: string

  accountId: IAccount['_id']
  kind: string // study or contest
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
  applyCnt: number
  acceptCnt: number
  startDate: Date
  endDate: Date
  isCompleted: boolean
  active: boolean
  hit: number
  
  updatedAt: Date
}
