import {
  BISHOP_MOVEMENT_DIRECTIONS,
  KING_MAX_FILE_DIFF,
  KING_MOVEMENT_OFFSETS,
  KNIGHT_MAX_FILE_DIFF,
  KNIGHT_MOVEMENT_OFFSETS,
  PAWN_ATTACK_OFFSETS,
  ROOK_MOVEMENT_DIRECTIONS,
} from "../board/directions.ts";
import { Piece, Side } from "../board/piece.ts";
import { isOnBoardStep } from "../board/square.ts";
import type { Position } from "../position/position.ts";

// the idea is to work out from the square until we find a piece that can land on the square
export function isSquareAttacked(
  position: Position,
  square: number,
  attackingSide: Side,
): boolean {
  const board = position.board;

  const attackingPawn =
    attackingSide === Side.White ? Piece.WPawn : Piece.BPawn;
  const attackingKing =
    attackingSide === Side.White ? Piece.WKing : Piece.BKing;
  const attackingKnight =
    attackingSide === Side.White ? Piece.WKnight : Piece.BKnight;
  const attackingRook =
    attackingSide === Side.White ? Piece.WRook : Piece.BRook;
  const attackingBishop =
    attackingSide === Side.White ? Piece.WBishop : Piece.BBishop;
  const attackingQueen =
    attackingSide === Side.White ? Piece.WQueen : Piece.BQueen;

  const pawnOffsets = PAWN_ATTACK_OFFSETS[attackingSide];

  for (const offset of pawnOffsets) {
    // since offsets are the directions the pawn attcks in,
    // subtracting one goes back to where the pawn would be
    const from = square - offset;

    if (isOnBoardStep(square, from, 1) && board[from] === attackingPawn)
      return true;
  }

  for (const offset of KNIGHT_MOVEMENT_OFFSETS) {
    const from = square + offset;

    if (
      isOnBoardStep(square, from, KNIGHT_MAX_FILE_DIFF) &&
      board[from] === attackingKnight
    )
      return true;
  }

  for (const offset of KING_MOVEMENT_OFFSETS) {
    const from = square + offset;

    if (
      isOnBoardStep(square, from, KING_MAX_FILE_DIFF) &&
      board[from] === attackingKing
    )
      return true;
  }

  if (
    slide(
      board,
      square,
      ROOK_MOVEMENT_DIRECTIONS,
      attackingRook,
      attackingQueen,
    )
  )
    return true;

  if (
    slide(
      board,
      square,
      BISHOP_MOVEMENT_DIRECTIONS,
      attackingBishop,
      attackingQueen,
    )
  )
    return true;

  return false;
}

function slide(
  board: Int8Array,
  square: number,
  directions: readonly number[],
  attackerA: Piece,
  attackerB: Piece,
): boolean {
  for (const offset of directions) {
    let previous = square;
    let next = square + offset;

    while (isOnBoardStep(previous, next, 1)) {
      const piece = board[next];

      if (piece === attackerA || piece === attackerB) return true;

      if (piece !== Piece.Empty) break;

      previous = next;
      next += offset;
    }
  }

  return false;
}

export function findKingSquare(position: Position, side: Side): number {
  const king = side === Side.Black ? Piece.BKing : Piece.WKing;

  return position.board.indexOf(king);
}
