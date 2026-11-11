import { Side } from "./piece.ts";

export function getFileFromSquare(square: number) {
  return square % 8;
}

export function getRankFromSquare(square: number) {
  return Math.floor(square / 8);
}

//example is converting a1 to 0 and e3 to 20
export function parseSquare(square: string): number {
  if (square === "-") return -1;

  const file = square.charCodeAt(0) - 97; // "a" -> 0
  const rank = square.charCodeAt(1) - 49; // "1" -> 0

  if (square.length !== 2 || file < 0 || file > 7 || rank < 0 || rank > 7) {
    throw new Error(`Bad square: ${square}`);
  }

  return rank * 8 + file;
}

export function unParseSquare(square: number): string {
  if (square === -1) return "-";

  const rank = getRankFromSquare(square) + 1;
  const file = getFileFromSquare(square);

  const fileString = String.fromCharCode(file + 97);

  return `${fileString}${rank}`;
}

//prevents wraparound jumps by comparing how many files a piece can jump by in one step
export function isOnBoardStep(
  fromSquare: number,
  toSquare: number,
  maxFileDiff: number,
): boolean {
  const fromFile = getFileFromSquare(fromSquare);
  const toFile = getFileFromSquare(toSquare);

  return (
    toSquare >= 0 && toSquare < 64 && Math.abs(fromFile - toFile) <= maxFileDiff
  );
}

export function isStartingSquare(fromSquare: number, sideToMove: Side) {
  const rank = getRankFromSquare(fromSquare);

  if (sideToMove === Side.White) return rank === 1;
  else return rank === 6;
}

export function isPromotionSquare(toSquare: number, sideToMove: Side) {
  const rank = getRankFromSquare(toSquare);

  if (sideToMove === Side.White) return rank === 7;
  else return rank === 0;
}
