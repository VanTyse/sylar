import {
  KING_MAX_FILE_DIFF,
  KING_MOVEMENT_OFFSETS,
  KNIGHT_MAX_FILE_DIFF,
  KNIGHT_MOVEMENT_OFFSETS,
} from "../board/directions.ts";
import {
  getPieceSide,
  getPieceTypeOnSquare,
  Piece,
  PieceType,
} from "../board/piece.ts";
import { isOnBoardStep } from "../board/square.ts";
import { encodeMove, MoveFlag } from "../move/move.ts";
import type { Position } from "../position/position.ts";

export function isEnemy(position: Position, target: Piece) {
  const attackingSide = position.sideToMove;

  if (target === Piece.Empty) return false;

  return attackingSide !== getPieceSide(target);
}

// generate moves for knight and king
export function addStepMoves(
  position: Position,
  fromSquare: number,
  offsets: readonly number[],
  maxFileDiff: number,
  moves: Uint16Array,
  count: number,
): number {
  for (const offset of offsets) {
    const toSquare = fromSquare + offset;

    if (!isOnBoardStep(fromSquare, toSquare, maxFileDiff)) continue;

    const target = position.board[toSquare] as Piece;

    if (target === Piece.Empty) {
      moves[count++] = encodeMove(fromSquare, toSquare, MoveFlag.Quiet);
    } else if (isEnemy(position, target)) {
      moves[count++] = encodeMove(fromSquare, toSquare, MoveFlag.Capture);
    }
  }

  return count;
}

export function generateMoves(position: Position, moves: Uint16Array): number {
  let count = 0;

  for (let from = 0; from < 64; from++) {
    const piece = position.board[from] as Piece;

    if (piece === Piece.Empty || getPieceSide(piece) !== position.sideToMove)
      continue;

    switch (getPieceTypeOnSquare(position.board, from)) {
      case PieceType.Knight:
        count = addStepMoves(
          position,
          from,
          KNIGHT_MOVEMENT_OFFSETS,
          KNIGHT_MAX_FILE_DIFF,
          moves,
          count,
        );
        break;
      case PieceType.King:
        count = addStepMoves(
          position,
          from,
          KING_MOVEMENT_OFFSETS,
          KING_MAX_FILE_DIFF,
          moves,
          count,
        );
        break;
      // ...
    }
  }

  return count;
}
