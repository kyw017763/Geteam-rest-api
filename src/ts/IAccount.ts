import { ObjectId } from 'mongodb'

export default interface IAccount {
  _id: ObjectId

  id: string
  name: string
  pwd: string
  sNum: number
  interests: [string]
  profile: string
  notifications: {
    applied: boolean
    accepted: boolean
    team: boolean
  }
  
  active: boolean
  createdAt: Date
  updatedAt: Date

  refreshToken: string

  isVerified: boolean // 인증여부
  verifyKey: string // 인증코드
  verifyExpireAt: Date // 인증코드 만료일시
  verifiedAt: Date
}
