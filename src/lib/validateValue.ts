import KIND_TYPE from '../ts/kind'
import CATEGORY_TYPE from '../ts/category'
import { OrderOption } from '../ts/Option'

const validateKind = (kind?: string) => {
  switch (kind) {
    case KIND_TYPE.ALL: case KIND_TYPE.STUDY: case KIND_TYPE.CONTEST:
      return kind
    default:
      return KIND_TYPE.STUDY
  }
}

const validateCategory = (kind?: string, category?: string) => {
  let result = CATEGORY_TYPE.DEVELOPMENT

  if (kind === KIND_TYPE.STUDY) {
    switch (category) {
      case CATEGORY_TYPE.DEVELOPMENT: case CATEGORY_TYPE.DESIGN: case CATEGORY_TYPE.ETC:
        result = category 
    }
  } else if (kind === KIND_TYPE.CONTEST) {
    switch (category) {
      case CATEGORY_TYPE.DEVELOPMENT: case CATEGORY_TYPE.DESIGN: case CATEGORY_TYPE.IDEA: case CATEGORY_TYPE.ETC:
        return category
    }
  }
  
  return result
}

const validateModifyOrder = (order?: string): OrderOption => {
  let result
  switch (order) {
    case 'createdAt': case 'endDay': case 'hit':
      result = { [order]: -1, title: 1 }
      break
    case 'title':
      result = { [order]: -1, createdAt: -1 }
      break
    default: throw new Error('해당 속성으로 정렬할 수 없습니다')
  }
  return result
}

export { validateKind, validateCategory, validateModifyOrder }
