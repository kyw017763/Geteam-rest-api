import { Strategy as JWTStrategy, ExtractJwt } from 'passport-jwt'
import models from '../../../models'
import config from '../../../../config'
import IToken from '../../../ts/IToken'

const AccountDB = models.account

export default new JWTStrategy(
	{
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: config.JWT_SECRET,
    issuer: config.JWT_ISSUER
  }, (async (payload: IToken, done: any) => {
    try {
      const isExist = await AccountDB.IsExist({ _id: payload._id })

      if (!isExist) done(null, false)
      else done(null, { _id: payload._id })
    }
    catch (err) {
      done(null, { error: err }) // passport에서 error가 발생하는 건 피한다
    }
  })
)