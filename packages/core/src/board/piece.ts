export const Piece = {
  Empty: 0,
  WPawn: 1,
  WKnight: 2,
  WBishop: 3,
  WRook: 4,
  WQueen: 5,
  WKing: 6,
  BPawn: 7,
  BKnight: 8,
  BBishop: 9,
  BRook: 10,
  BQueen: 11,
  BKing: 12,
} as const;

export type Piece = (typeof Piece)[keyof typeof Piece];

export const PieceType = {
  Empty: 0,
  Pawn: 1,
  Knight: 2,
  Bishop: 3,
  Rook: 4,
  Queen: 5,
  King: 6,
} as const;

export type PieceType = (typeof PieceType)[keyof typeof PieceType];

export const Side = {
  White: 0,
  Black: 1,
} as const;

export type Side = (typeof Side)[keyof typeof Side];

export function getPieceTypeOnSquare(board: Int8Array, square: number) {
  const piece = board[square];

  if (piece === Piece.Empty) return PieceType.Empty;

  return (((piece - 1) % 6) + 1) as PieceType;
}

export function getPieceSide(piece: Piece) {
  return piece >= Piece.BPawn ? Side.Black : Side.White; //only valid for non-empty squares
}
