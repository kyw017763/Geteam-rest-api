export default interface IAccount {
  _id: string
  id: string
  name: string
  pwd: string
  sNum: number
  interests: [string]
  profile: string
  notiWritten: boolean // comments
  notiApplied: boolean // apply
  notiAccepted: boolean // apply acception
  refreshToken: string
  isVerified: boolean // 인증여부
  verifyKey: string // 인증코드
  verifyExpireAt: Date
  active: boolean
  createdAt: Date
  verifiedAt: Date
  updatedAt: Date
}
