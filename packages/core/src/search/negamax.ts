import { evaluate } from "../eval/evaluate.ts";
import { NO_MOVE, type Move } from "../move/move.ts";
import { isInCheck } from "../movegen/attacks.ts";
import { generateMoves, MAX_MOVES } from "../movegen/generate.ts";
import type { Position } from "../position/position.ts";

export const MATE_SCORE = 31_000;

const MAX_DEPTH = 128;
const moveLists = Array.from(
  { length: MAX_DEPTH },
  () => new Uint16Array(MAX_MOVES),
);
const INF_SCORE = 32_000;

function negamax(
  position: Position,
  depth: number,
  ply: number,
  alpha: number,
  beta: number,
): number {
  if (depth === 0) return evaluate(position);

  const moves = moveLists[ply];
  const count = generateMoves(position, moves);

  const sideToMove = position.sideToMove;

  let best = -INF_SCORE;
  let legalMoves = 0;

  for (let i = 0; i < count; i++) {
    const move = moves[i];

    position.makeMove(move);

    if (!isInCheck(position, sideToMove)) {
      legalMoves++;

      const score = -negamax(position, depth - 1, ply + 1, -beta, -alpha);

      alpha = Math.max(alpha, score);
      best = Math.max(best, score);
    }

    position.unmakeMove(move);

    if (best >= beta) break;
  }

  if (legalMoves === 0) {
    const kingInCheck = isInCheck(position, sideToMove);

    return kingInCheck ? -(MATE_SCORE - ply) : 0;
  }

  return best;
}

export function searchRoot(
  position: Position,
  depth: number,
): { bestMove: Move; score: number } {
  if (depth < 1) throw new Error("Must search at least 1 step");

  const moves = moveLists[0];
  const count = generateMoves(position, moves);

  let best = -INF_SCORE;
  const sideToMove = position.sideToMove;

  let bestMove: Move = NO_MOVE;
  let alpha = -INF_SCORE;
  const beta = INF_SCORE;

  for (let i = 0; i < count; i++) {
    const move = moves[i];

    position.makeMove(move);

    if (!isInCheck(position, sideToMove)) {
      const score = -negamax(position, depth - 1, 1, -beta, -alpha);

      if (score > best) {
        alpha = score;
        best = score;
        bestMove = move;
      }
    }

    position.unmakeMove(move);
  }

  return { bestMove, score: best };
}
