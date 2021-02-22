import Board from './models/Board'

export default interface BoardGetItemResponse {
    board: Board;
    isApplied?: boolean;
    isAccepted?: boolean;
}