import passport from 'passport';
import passportJWT from 'passport-jwt';
import config from './../config';
import models from './../models';

const JWTStrategy = passportJWT.Strategy;
const extractJWT = passportJWT.ExtractJwt;

export default () => {
  passport.serializeUser((account, done) => {
    // Strategy 성공 시 호출됨
    done(null, account);
  });

  passport.deserializeUser((account, done) => {
    // 매개변수 account는 serializeaccount의 done의 두 번째 인자를 받은 것
    // 두 번째 인자는 req.{second argument's name} 로 저장된다
    done(null, account);
  });

  passport.use('jwt', new JWTStrategy({
    jwtFromRequest: extractJWT.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET || config.JWT_SECRET,
  }, ((payload, done) => {
    models.Account.findOne({ _id: payload._id })
      .then((account) => {
        if (account) {
          return done(null, account);
        } else {
          return done(true, account);
        }
      })
      .catch((err) => {
        return done(err);
      });
  })));
};
