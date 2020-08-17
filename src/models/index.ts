import account from './account'
import apply from './apply'
import board from './board'
import message from './message'
import team from './team'

const models = {
  account,
  apply,
  board,
  message,
  team,
}

export default models

// updateOne updatedAt 처리
// TODO: list return 형태 {list, count} 로 바꾸기