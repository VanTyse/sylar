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

export const Castling = {
  WK: 0b0001,
  WQ: 0b0010,
  BK: 0b0100,
  BQ: 0b1000,
} as const;
