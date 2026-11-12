import { Side } from "../board/piece.ts";
import { isInCheck } from "./attacks.ts";
import { generateMoves, MAX_MOVES } from "./generate.ts";
import type { Position } from "../position/position.ts";

const MAX_DEPTH = 64;
const moveLists = Array.from(
  { length: MAX_DEPTH },
  () => new Uint16Array(MAX_MOVES),
);

export function perft(position: Position, depth: number): number {
  if (depth > 63) throw new Error("Max depth exceeded");

  if (depth === 0) return 1;

  const moves = moveLists[depth];
  const count = generateMoves(position, moves);
  let nodes = 0;

  const sideToMove = position.sideToMove;
  const opposingSide = (sideToMove ^ 1) as Side;

  for (let i = 0; i < count; i++) {
    const move = moves[i];

    position.makeMove(move);

    if (!isInCheck(position, sideToMove)) {
      nodes += perft(position, depth - 1);
    }

    position.unmakeMove(move);
  }

  return nodes;
}
