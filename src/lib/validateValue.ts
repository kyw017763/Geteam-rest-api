const validateKind = (kind: string) => {
  switch (kind) {
    case 'all': case 'study': case 'contest':
      return kind
    default:
      return 'study'
  }
}

const validateCategory = (kind: string, category: string) => {
  let result = 'develop'

  if (kind === 'study') {
    switch (category) {
      case 'develop': case 'design': case 'etc':
        result = category 
    }
  } else if (kind === 'contest') {
    switch (category) {
      case 'develop': case 'design': case 'idea': case 'etc':
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
