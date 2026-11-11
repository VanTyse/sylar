/**
 * Following the conventional 16 bit move encoding where
 * bits 0 - 5 represent the from square 2^6 = 64 so 6 bits is enough to represent any square.
 * bits 6 - 11 represent the to square
 * bits 12 - 15 represent up to 16 possible kinds of moves (14 used)
 *
 *  bit 2 (flags 4, 5 and 12–15) = capture
 * bit 3 (flags 8–15) = promotion
 */

import { unParseSquare } from "../board/square.ts";

export type Move = number;

export const MoveFlag = {
  Quiet: 0,
  DoublePush: 1,
  KingCastle: 2,
  QueenCastle: 3,
  Capture: 4,
  EnPassant: 5,
  PromoKnight: 8,
  PromoBishop: 9,
  PromoRook: 10,
  PromoQueen: 11,
  PromoCaptureKnight: 12,
  PromoCaptureBishop: 13,
  PromoCaptureRook: 14,
  PromoCaptureQueen: 15,
} as const;

export type MoveFlag = (typeof MoveFlag)[keyof typeof MoveFlag];

export function encodeMove(
  fromSquare: number,
  toSquare: number,
  flag: MoveFlag,
): Move {
  return fromSquare | (toSquare << 6) | (flag << 12);
}

export function getFromSquare(encodedMove: Move): number {
  return encodedMove & 63;
}

export function getToSquare(encodedMove: Move): number {
  return (encodedMove >> 6) & 63;
}

export function getMoveFlags(encodedMove: Move): number {
  return (encodedMove >> 12) & 15;
}

export function isCapture(encodedMove: Move): boolean {
  return (getMoveFlags(encodedMove) & 4) !== 0; //notice 6 and 7 were skipped in MoveFlag because they would have had the third bit active, making this function return true for moves that are not captures.
}

export function isPromotion(encodedMove: Move): boolean {
  return (getMoveFlags(encodedMove) & 8) !== 0; //notice all promotions in MoveFlags have Bit 3 turned on (8 - 15)
}

export function getPromotionIndex(encodedMove: Move): number {
  return getMoveFlags(encodedMove) & 3;
}

const PROMOTION_PIECES_CHARS = "nbrq";

export function formatMoveToUci(encodedMove: Move): string {
  const fromSquare = getFromSquare(encodedMove);
  const toSquare = getToSquare(encodedMove);

  const uciFromSquare = unParseSquare(fromSquare);
  const uciToSquare = unParseSquare(toSquare);

  return (
    uciFromSquare +
    uciToSquare +
    (isPromotion(encodedMove)
      ? PROMOTION_PIECES_CHARS[getPromotionIndex(encodedMove)]
      : "")
  );
}
