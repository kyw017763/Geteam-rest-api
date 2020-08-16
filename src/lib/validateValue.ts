const validateKind = (kind: string) => {
  switch (kind) {
    case 'study': case 'contest':
      return true
      break
    default:
      return false
      break
  }
}

const validateCategory = (kind: string, category: string) => {
  if (kind === 'study') {
    switch (category) {
      case 'develop': case 'design': case 'etc': break
      default: throw new Error('유효한 카테고리가 아닙니다')
    }
  } else if (kind === 'contest') {
    switch (category) {
      case 'develop': case 'design': case 'idea': case 'etc': break
      default: throw new Error('유효한 카테고리가 아닙니다')
    }
  }
}

const validateModifyOrder = (order: string) => {
  switch (order) {
    case 'createdAt': case 'endDay': case 'hit':
      order = `-${order} title` break
    case 'title':
      order = `${order} -createdAt` break
    default: throw new Error('해당 속성으로 정렬할 수 없습니다')
  }
  return order
}

export { validateKind, validateCategory, validateModifyOrder }
