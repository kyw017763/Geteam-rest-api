export default interface IAccount {
  _id?: any

  id?: string
  name?: string
  pwd?: string
  sNum?: number
  interests?: [string]
  profile?: string
  profilePhoto?: string // TODO?: 프로필사진 처리
  
  notiApplied?: boolean // apply
  notiAccepted?: boolean // apply acception
  notiTeam?: boolean // team

  refreshToken?: string

  active?: boolean
  createdAt?: Date
  updatedAt?: Date

  isVerified?: boolean // 인증여부
  verifyKey?: string // 인증코드
  verifyExpireAt?: Date // 인증코드 만료일시
  verifiedAt?: Date
}
