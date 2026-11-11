import { Rank } from "../board/constants.ts";
import { Piece, Side } from "../board/piece.ts";
import { encodeMove, MoveFlag } from "../move/move.ts";
import { Castling } from "../position/castling.ts";
import type { Position } from "../position/position.ts";
import { isSquareAttacked } from "./attacks.ts";

export function addCastlingMoves(
  position: Position,
  fromSquare: number,
  moves: Uint16Array,
  count: number,
): number {
  const kingSide =
    position.sideToMove === Side.White ? Castling.WK : Castling.BK;
  const queenSide =
    position.sideToMove === Side.White ? Castling.WQ : Castling.BQ;

  const opponentSide =
    position.sideToMove === Side.White ? Side.Black : Side.White;

  const base = position.sideToMove === Side.White ? 0 : 56;

  if (position.castling & kingSide) {
    if (
      position.board[base + Rank.F] === Piece.Empty &&
      position.board[base + Rank.G] === Piece.Empty &&
      !isSquareAttacked(position, base + Rank.E, opponentSide) && // king cannot be in check
      !isSquareAttacked(position, base + Rank.F, opponentSide) &&
      !isSquareAttacked(position, base + Rank.G, opponentSide)
    ) {
      moves[count++] = encodeMove(fromSquare, base + 6, MoveFlag.KingCastle);
    }
  }

  if (position.castling & queenSide) {
    if (
      position.board[base + Rank.B] === Piece.Empty &&
      position.board[base + Rank.C] === Piece.Empty &&
      position.board[base + Rank.D] === Piece.Empty &&
      !isSquareAttacked(position, base + Rank.C, opponentSide) &&
      !isSquareAttacked(position, base + Rank.D, opponentSide) &&
      !isSquareAttacked(position, base + Rank.E, opponentSide) // king cannot be in check
    ) {
      moves[count++] = encodeMove(fromSquare, base + 2, MoveFlag.QueenCastle);
    }
  }

  return count;
}
