import {
  PAWN_ATTACK_OFFSETS,
  PAWN_MOVEMENT_OFFSET,
} from "../board/directions.ts";
import { Piece } from "../board/piece.ts";
import {
  isOnBoardStep,
  isPromotionSquare,
  isStartingSquare,
} from "../board/square.ts";
import { encodeMove, MoveFlag } from "../move/move.ts";
import type { Position } from "../position/position.ts";
import { isEnemy } from "./utils.ts";

export function addPawnMoves(
  position: Position,
  fromSquare: number,
  moves: Uint16Array,
  count: number,
): number {
  const attackingSide = position.sideToMove;
  const pawnMovementOffset = PAWN_MOVEMENT_OFFSET[attackingSide];
  const pawnAttackOffsets = PAWN_ATTACK_OFFSETS[attackingSide];

  for (const offset of pawnAttackOffsets) {
    const toSquare = fromSquare + offset;

    if (!isOnBoardStep(fromSquare, toSquare, 1)) continue;

    const target = position.board[toSquare] as Piece;

    if (isEnemy(position, target)) {
      if (isPromotionSquare(toSquare, attackingSide)) {
        moves[count++] = encodeMove(
          fromSquare,
          toSquare,
          MoveFlag.PromoCaptureBishop,
        );
        moves[count++] = encodeMove(
          fromSquare,
          toSquare,
          MoveFlag.PromoCaptureKnight,
        );
        moves[count++] = encodeMove(
          fromSquare,
          toSquare,
          MoveFlag.PromoCaptureQueen,
        );
        moves[count++] = encodeMove(
          fromSquare,
          toSquare,
          MoveFlag.PromoCaptureRook,
        );
      } else {
        moves[count++] = encodeMove(fromSquare, toSquare, MoveFlag.Capture);
      }
    }

    if (position.epSquare === toSquare) {
      moves[count++] = encodeMove(fromSquare, toSquare, MoveFlag.EnPassant);
    }
  }

  const toSquare = fromSquare + pawnMovementOffset;

  const target = position.board[toSquare] as Piece;

  if (target === Piece.Empty) {
    if (isPromotionSquare(toSquare, attackingSide)) {
      moves[count++] = encodeMove(fromSquare, toSquare, MoveFlag.PromoBishop);
      moves[count++] = encodeMove(fromSquare, toSquare, MoveFlag.PromoKnight);
      moves[count++] = encodeMove(fromSquare, toSquare, MoveFlag.PromoQueen);
      moves[count++] = encodeMove(fromSquare, toSquare, MoveFlag.PromoRook);
    } else moves[count++] = encodeMove(fromSquare, toSquare, MoveFlag.Quiet);

    if (isStartingSquare(fromSquare, attackingSide)) {
      const doublePushSquare = toSquare + pawnMovementOffset;

      if (position.board[doublePushSquare] === Piece.Empty) {
        moves[count++] = encodeMove(
          fromSquare,
          doublePushSquare,
          MoveFlag.DoublePush,
        );
      }
    }
  }

  return count;
}
