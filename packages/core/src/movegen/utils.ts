import { Piece, getPieceSide } from "../board/piece.ts";
import type { Position } from "../position/position.ts";

export function isEnemy(position: Position, target: Piece) {
  const attackingSide = position.sideToMove;

  if (target === Piece.Empty) return false;

  return attackingSide !== getPieceSide(target);
}
