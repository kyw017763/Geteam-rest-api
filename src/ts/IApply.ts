import IAccount from './IAccount'
import IBoard from './IBoard'

export default interface IApply {
  _id: string

  accountId: IAccount['_id']
  boardId: IBoard['_id']
  boardKind: string
  authorAccountId: IAccount['_id']
  position?: string // 맡고픈 역할. only contest
  portfolio?: string // path. only contest
  portfolioText?: string // only contest
  wantedList: string // 요구사항
  isAccepted: boolean
  acceptedAt: Date
  active: boolean
  
  createdAt: Date
  updatedAt: Date
}
