interface IResponse {
  code: string
  description: string 
}

export const SuccessResponse = (data: any = {}) => {
  return {
    success: true,
    ...data
  }
}

export const FailureResponse = (data: IResponse) => {
  const { code, description } = data
  return {
    code,
    description,
  }
}

export const InternalErrorResponse = FailureResponse({
  code: 'ERR_INTERNAL_ERROR',
  description: '서버에 오류가 발생했습니다.',
})
