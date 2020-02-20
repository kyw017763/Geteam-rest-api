export default (success: boolean, error: string = '', data: any = null) => {
  return {
    success,
    error: error,
    data,
  };
};
