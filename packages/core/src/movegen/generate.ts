import {
  BISHOP_MOVEMENT_DIRECTIONS,
  KING_MAX_FILE_DIFF,
  KING_MOVEMENT_OFFSETS,
  KNIGHT_MAX_FILE_DIFF,
  KNIGHT_MOVEMENT_OFFSETS,
  ROOK_MOVEMENT_DIRECTIONS,
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
import { addCastlingMoves } from "./castling.ts";
import { addPawnMoves } from "./pawns.ts";
import { isEnemy } from "./utils.ts";

export const MAX_MOVES = 256;

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

export function addSlidingMoves(
  position: Position,
  fromSquare: number,
  directions: readonly number[],
  moves: Uint16Array,
  count: number,
): number {
  for (const offset of directions) {
    let prev = fromSquare;
    let next = prev + offset;

    while (isOnBoardStep(prev, next, 1)) {
      const target = position.board[next] as Piece;

      if (target === Piece.Empty) {
        moves[count++] = encodeMove(fromSquare, next, MoveFlag.Quiet);
      } else {
        if (isEnemy(position, target)) {
          moves[count++] = encodeMove(fromSquare, next, MoveFlag.Capture);
        }

        break; // any other piece ends the ray since enemies are captured first
      }

      prev = next;
      next += offset;
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
      case PieceType.Pawn:
        count = addPawnMoves(position, from, moves, count);

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
        count = addCastlingMoves(position, from, moves, count);

        break;
      case PieceType.Bishop:
        count = addSlidingMoves(
          position,
          from,
          BISHOP_MOVEMENT_DIRECTIONS,
          moves,
          count,
        );

        break;
      case PieceType.Rook:
        count = addSlidingMoves(
          position,
          from,
          ROOK_MOVEMENT_DIRECTIONS,
          moves,
          count,
        );

        break;
      case PieceType.Queen:
        count = addSlidingMoves(
          position,
          from,
          ROOK_MOVEMENT_DIRECTIONS,
          moves,
          count,
        );
        count = addSlidingMoves(
          position,
          from,
          BISHOP_MOVEMENT_DIRECTIONS,
          moves,
          count,
        );

        break;
    }
  }

  return count;
}
