import { Piece, Side } from "../board/piece.ts";
import type { Position } from "../position/position.ts";

// indexed by Piece: Empty, P N B R Q K (white), p n b r q k (black)
const PIECE_VALUES = Int16Array.of(
  0,
  100,
  320,
  330,
  500,
  900,
  0,
  -100,
  -320,
  -330,
  -500,
  -900,
  0,
);

export function evaluate(position: Position): number {
  let score = 0;

  for (let square = 0; square < 64; square++) {
    const piece = position.board[square];
    const pieceValue = PIECE_VALUES[piece];

    score += pieceValue;
  }

  return position.sideToMove === Side.White ? score : -score;
}
