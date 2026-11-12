import { describe, expect, it } from "vitest";
import { formatMoveToUci, NO_MOVE } from "../move/move.ts";
import { isInCheck } from "../movegen/attacks.ts";
import { generateMoves, MAX_MOVES } from "../movegen/generate.ts";
import { Position } from "../position/position.ts";
import { evaluate } from "../eval/evaluate.ts";
import { MATE_SCORE, searchRoot } from "./negamax.ts";

/** Score for delivering mate `plies` half-moves from the root. */
function mateIn(plies: number): number {
  return MATE_SCORE - plies;
}

function search(fen: string, depth: number) {
  const position = Position.fromFen(fen);
  const { bestMove, score } = searchRoot(position, depth);

  return { move: formatMoveToUci(bestMove), bestMove, score, position };
}

function isCheckmate(position: Position): boolean {
  const moves = new Uint16Array(MAX_MOVES);
  const count = generateMoves(position, moves);
  const side = position.sideToMove;

  for (let i = 0; i < count; i++) {
    position.makeMove(moves[i]);

    const legal = !isInCheck(position, side);

    position.unmakeMove(moves[i]);

    if (legal) return false;
  }

  return isInCheck(position, side);
}

/**
 * Plain negamax with no pruning: slow but already proven correct.
 * Alpha-beta must return exactly the same root score at every depth,
 * so any pruning bug (move ordering, TT, etc.) shows up as a mismatch.
 */
const referenceLists = Array.from(
  { length: 16 },
  () => new Uint16Array(MAX_MOVES),
);

function referenceNegamax(
  position: Position,
  depth: number,
  ply: number,
): number {
  if (depth === 0) return evaluate(position);

  const moves = referenceLists[ply];
  const count = generateMoves(position, moves);
  const side = position.sideToMove;
  let best = -Infinity;
  let legalMoves = 0;

  for (let i = 0; i < count; i++) {
    position.makeMove(moves[i]);

    if (!isInCheck(position, side)) {
      legalMoves++;
      best = Math.max(best, -referenceNegamax(position, depth - 1, ply + 1));
    }

    position.unmakeMove(moves[i]);
  }

  if (legalMoves === 0) {
    return isInCheck(position, side) ? -(MATE_SCORE - ply) : 0;
  }

  return best;
}

const REFERENCE_POSITIONS = {
  start: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  kiwipete:
    "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1",
  position3: "8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1",
  position4:
    "r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1",
  position5: "rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8",
  blackToMove:
    "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R b KQkq - 0 1",
  mateIn2: "k7/8/2K5/8/8/8/8/7R w - - 0 1",
} as const;

// depths 1-3 everywhere, plus depth 4 where the reference search is cheap
const REFERENCE_CASES: [keyof typeof REFERENCE_POSITIONS, number][] = [
  ...Object.keys(REFERENCE_POSITIONS).flatMap((name) =>
    [1, 2, 3].map(
      (depth) => [name, depth] as [keyof typeof REFERENCE_POSITIONS, number],
    ),
  ),
  ["start", 4],
  ["position3", 4],
  ["mateIn2", 4],
];

describe("alpha-beta", () => {
  it.each(REFERENCE_CASES)(
    "matches plain negamax on %s at depth %i",
    (name, depth) => {
      const fen = REFERENCE_POSITIONS[name];
      const expected = referenceNegamax(Position.fromFen(fen), depth, 0);

      expect(search(fen, depth).score).toBe(expected);
    },
  );
});

describe("searchRoot", () => {
  describe("material", () => {
    it("captures a free piece at depth 1", () => {
      const { move, score } = search("4k3/8/8/3q4/8/8/3R4/4K3 w - - 0 1", 1);

      expect(move).toBe("d2d5");
      expect(score).toBe(500);
    });

    it("promotes to a queen", () => {
      const { move, score } = search("4k3/P7/8/8/8/8/8/4K3 w - - 0 1", 1);

      expect(move).toBe("a7a8q");
      expect(score).toBe(900);
    });

    it("grabs a protected pawn at depth 1 but not at depth 2", () => {
      // Qxd5 wins a pawn, then c6xd5 wins the queen
      const fen = "4k3/8/2p5/3p4/8/8/3Q4/4K3 w - - 0 1";

      expect(search(fen, 1).move).toBe("d2d5");
      expect(search(fen, 2).move).not.toBe("d2d5");
      expect(search(fen, 2).score).toBe(700);
    });
  });

  describe("mate", () => {
    it("finds a back-rank mate in 1 for white", () => {
      const { move, score } = search("6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1", 2);

      expect(move).toBe("a1a8");
      expect(score).toBe(mateIn(1));
    });

    it("finds a back-rank mate in 1 for black", () => {
      const { move, score } = search("r5k1/8/8/8/8/8/5PPP/6K1 b - - 0 1", 2);

      expect(move).toBe("a8a1");
      expect(score).toBe(mateIn(1));
    });

    it("scores a mate in 2 lower than a mate in 1", () => {
      const { score } = search("k7/8/2K5/8/8/8/8/7R w - - 0 1", 4);

      expect(score).toBe(mateIn(3));
    });

    it("scores being mated as a negative mate score", () => {
      // black's only move is Kb8, then Rh8#
      const { move, score } = search("k7/8/1K6/8/8/8/8/7R b - - 0 1", 3);

      expect(move).toBe("a8b8");
      expect(score).toBe(-mateIn(2));
    });
  });

  describe("stalemate", () => {
    it("prefers mate over a stalemating move that is generated first", () => {
      // Qc7 is stalemate and comes before Qc8# in generation order,
      // so a stalemate scored as a win would be picked here
      const { bestMove, score, position } = search(
        "k7/8/1K6/8/8/8/8/2Q5 w - - 0 1",
        2,
      );

      expect(formatMoveToUci(bestMove)).not.toBe("c1c7");
      expect(score).toBe(mateIn(1));

      position.makeMove(bestMove);
      expect(isCheckmate(position)).toBe(true);
    });
  });

  describe("no legal moves at the root", () => {
    it.each([
      ["checkmate", "R5k1/5ppp/8/8/8/8/8/6K1 b - - 0 1"],
      ["stalemate", "k7/2Q5/1K6/8/8/8/8/8 b - - 0 1"],
    ])("returns NO_MOVE in %s", (_, fen) => {
      expect(search(fen, 1).bestMove).toBe(NO_MOVE);
    });
  });

  it("leaves the position unchanged, including after cutoffs", () => {
    const fens = [
      "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1",
      "rnbqkbnr/ppp1p1pp/8/3pPp2/8/8/PPPP1PPP/RNBQKBNR w KQkq f6 0 3",
    ];

    for (const fen of fens) {
      expect(Position.toFen(search(fen, 3).position)).toBe(fen);
    }
  });

  it("throws below depth 1", () => {
    expect(() => search("4k3/8/8/8/8/8/8/4K3 w - - 0 1", 0)).toThrow();
  });
});
