import BoardModel from './models/BoardModel'

export default interface BoardGetItemResponse {
    board: Board;
    isApplied?: boolean;
    isAccepted?: boolean;
}