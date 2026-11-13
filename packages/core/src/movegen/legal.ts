import { formatMoveToUci, NO_MOVE, type Move } from "../move/move.ts";
import type { Position } from "../position/position.ts";
import { isInCheck } from "./attacks.ts";
import { generateMoves, MAX_MOVES } from "./generate.ts";

const moves = new Uint16Array(MAX_MOVES);

/**
 * Finds the legal move written in UCI notation ("e2e4", "e7e8q", "e1g1").
 * Returns NO_MOVE if the text is not a legal move in this position, which
 * covers malformed text as well as moves that leave the king in check.
 *
 * Not for hot paths: it generates and tests every move. It is meant for
 * moves coming from outside the engine (a GUI, a player, a test).
 */
export function parseUciMove(position: Position, text: string): Move {
  const count = generateMoves(position, moves);
  const side = position.sideToMove;

  for (let i = 0; i < count; i++) {
    const move = moves[i];

    if (formatMoveToUci(move) !== text) continue;

    position.makeMove(move);
    const legal = !isInCheck(position, side);
    position.unmakeMove(move);

    return legal ? move : NO_MOVE;
  }

  return NO_MOVE;
}
