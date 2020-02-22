import passport from 'passport';
import passportJWT from 'passport-jwt';
import jwt, { TokenExpiredError } from 'jsonwebtoken';
import config from './../config';
import models from './../models';

const JWTStrategy = passportJWT.Strategy;
const extractJWT = passportJWT.ExtractJwt;

export default () => {
  passport.serializeUser((member, done) => {
    // Strategy 성공 시 호출됨
    done(null, member);
  });

  passport.deserializeUser((user, done) => {
    // 매개변수 user는 serializeUser의 done의 두 번째 인자를 받은 것
    // 두 번째 인자는 req.{second argument's name} 로 저장된다
    done(null, user);
  });

  passport.use('jwt', new JWTStrategy({
    jwtFromRequest: extractJWT.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET || config.JWT_SECRET,
  }, ((payload, done) => {
    models.Member.findOne({ _id: payload._id })
      .then((user) => {
        if (user) {
          return done(null, user);
        } else {
          return done(true, user);
        }
      })
      .catch((err) => {
        console.log(err);
        return done(err);
      });
  })));
};
