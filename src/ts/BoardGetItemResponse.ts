import Board from './Board'

export default interface BoardGetItemResponse {
    board: Board;
    isApplied?: boolean;
    isAccepted?: boolean;
}