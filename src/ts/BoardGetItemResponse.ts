import BoardModel from './models/BoardModel'

export default interface BoardGetItemResponse {
    board: BoardModel;
    isApplied?: boolean;
    isAccepted?: boolean;
}