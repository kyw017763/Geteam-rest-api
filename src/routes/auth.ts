import express from 'express'
import passport from 'passport'
import * as controller from '../controller/auth.controller'

const router = express.Router()
export default router

router.post('/register', controller.Create)
router.post('/register/compare-email', controller.CompareEmail)
router.post('/register/verify/:key', controller.CompareVerifyKey)
router.post('/register/verify/new/:key', controller.CreateVerifyKey)

// Access Token, Refresh Token 발급
router.post('/signin', controller.SignIn)

// Refresh Token을 이용(DB에서 Get)하여 Access Token 재발급 (실패시 false, /signin으로 redirect)
// Access Token이 만료되었을 것이므로 passport는 사용할 수 없음
router.post('/signin/refresh', controller.RefreshToken)

// Reset Password (Check Interests, Create Hash)
router.patch('/signin/reset/pwd', controller.ResetPassword)

router.post('/verify', controller.Verify)

router.post('/check-email', controller.CheckIsDuplicatedEmail)

router.post('/check-snum', controller.CheckIsDuplicatedSnum)

router.use(passport.authenticate('jwt', { session: false }))

router.get('/info', controller.GetInfo)

// Blacklisting Token, Set null RefreshToken in DB
// 정상적인 Access Token이 있어야 Signout이 진행된다
router.post('/signout', controller.SignOut)

router.patch('/pwd', controller.UpdatePassword)
router.patch('/info', controller.UpdateInfo)
router.patch('/noti/applied', controller.UpdateNotiApplied)
router.patch('/noti/accepted', controller.UpdateNotiAccepted)
router.patch('/noti/team', controller.UpdateNotiTeam)

router.delete('/unregister', controller.Delete)