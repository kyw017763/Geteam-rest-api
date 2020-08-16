export default interface IAccount {
  _id: string

  id: string
  name: string
  pwd: string
  sNum: number
  interests: [string]
  profile: string
  
  notiApplied: boolean // apply
  notiAccepted: boolean // apply acception
  notiTeam: boolean // team

  refreshToken: string

  active: boolean
  createdAt: Date
  updatedAt: Date

  isVerified: boolean // 인증여부
  verifyKey?: string // 인증코드
  verifyExpireAt?: Date // 인증코드 만료일시
  verifiedAt?: Date
}
