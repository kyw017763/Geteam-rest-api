import passport from 'passport'
import JwtStratery from './strategy/jwtStrategy'

passport.use('jwt', JwtStratery)

passport.serializeUser((account, done) => done(null, account))
passport.deserializeUser((account: { _id: string }, done) => done(null, account))

export default passport