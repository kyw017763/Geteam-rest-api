import KIND_TYPE from './kindType'
import CATEGORY_TYPE from './categoryType'

const validateKind = (kind: string) => {
  switch (kind) {
    case KIND_TYPE.All: case KIND_TYPE.Study: case KIND_TYPE.Contest:
      return kind
    default:
      return KIND_TYPE.Study
  }
}

const validateCategory = (kind: string, category: string) => {
  let result = CATEGORY_TYPE.Development

  if (kind === KIND_TYPE.Study) {
    switch (category) {
      case CATEGORY_TYPE.Development: case CATEGORY_TYPE.Design: case CATEGORY_TYPE.Etc:
        result = category 
    }
  } else if (kind === KIND_TYPE.Contest) {
    switch (category) {
      case CATEGORY_TYPE.Development: case CATEGORY_TYPE.Design: case CATEGORY_TYPE.Idea: case CATEGORY_TYPE.Etc:
        return category
    }
  }
  
  return result
}

const validateModifyOrder = (order: string) => {
  switch (order) {
    case 'createdAt': case 'endDay': case 'hit':
      order = `-${order} title`
      break
    case 'title':
      order = `${order} -createdAt`
      break
    default: throw new Error('해당 속성으로 정렬할 수 없습니다')
  }
  return order
}

export { validateKind, validateCategory, validateModifyOrder }
