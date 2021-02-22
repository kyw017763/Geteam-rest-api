import passport from 'passport'
import JwtStratery from './strategy/jwtStrategy'
import PassportUser from '../../ts/PassportUser'

passport.use('jwt', JwtStratery)

passport.serializeUser((account, done) => done(null, account))
passport.deserializeUser((account: PassportUser, done) => done(null, account))

export default passport