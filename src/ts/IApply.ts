import IAccount from './IAccount'
import IBoard from './IBoard'

export default interface IApply {
  _id: string
  accountId: IAccount['_id']
  boardId: IBoard['_id']
  applyAccount: IAccount['_id']
  positino: string // 맡고픈 역할
  portfolio: string // path
  wantedList: string // 요구사항
  isAccepted: boolean
  acceptedAt: Date
  active: boolean
  createdAt: Date
  updatedAt: Date
}
