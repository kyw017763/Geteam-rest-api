import passport from 'passport';
import passportJWT from 'passport-jwt';
import config from '../config';
import models from '../models';

const JWTStrategy = passportJWT.Strategy;
const extractJWT = passportJWT.ExtractJwt;

export default () => {
  passport.serializeUser((account, done) => {
    done(null, account);
  });

  passport.deserializeUser((account, done) => {
    done(null, account);
  });

  passport.use('jwt', new JWTStrategy({
    jwtFromRequest: extractJWT.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET || config.JWT_SECRET,
    passReqToCallback: true,
  }, ((req: any, payload: any, done: any) => {
    models.Account.findById(payload._id)
      .then((account) => {
        if (account) {
          return done(null, account._id);
        } else {
          return done(true);
        }
      })
      .catch((err) => {
        return done(err);
      });
  })));
};
