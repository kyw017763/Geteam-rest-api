import IAccount from './IAccount'

export default interface ITeam {
  _id: string
  name: string
  master: IAccount['_id']
  members: {
    accountId: IAccount['_id']
    position: string
  }
  content: string
  createdAt: Date
}
