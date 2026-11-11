import { describe, expect, it } from "vitest";
import { Position } from "../position/position.ts";
import { perft } from "./perft.ts";

/**
 * Perft counts the leaf nodes of the legal move tree to a fixed depth.
 * The expected numbers are the published reference counts from the Chess
 * Programming Wiki (https://www.chessprogramming.org/Perft_Results).
 *
 * If a count is wrong, compare per-move counts against Stockfish's
 * `go perft N` output to find what is wrong
 */

const POSITIONS = {
  start: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
  // castling both sides, en passant, promotions, pins
  kiwipete:
    "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1",
  // endgame: en passant that exposes a king on the rank, rook checks
  position3: "8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1",
  // promotions with capture, white has castled and black has not
  position4:
    "r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1",
  // position 4 with colors swapped: catches white/black asymmetry bugs
  position4Mirrored:
    "r2q1rk1/pP1p2pp/Q4n2/bbp1p3/Np6/1B3NBn/pPPP1PPP/R3K2R b KQ - 0 1",
  // promotion on d8 with capture options, discovered checks
  position5: "rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8",
  // quiet middlegame, both sides castled
  position6:
    "r4rk1/1pp1qppp/p1np1n2/2b1p1B1/2B1P1b1/P1NP1N2/1PP1QPPP/R4RK1 w - - 0 10",
} as const;

// [name, depth, expected nodes]: fast enough for every test run
const SHALLOW: [keyof typeof POSITIONS, number, number][] = [
  ["start", 1, 20],
  ["start", 2, 400],
  ["start", 3, 8902],
  ["kiwipete", 1, 48],
  ["kiwipete", 2, 2039],
  ["kiwipete", 3, 97862],
  ["position3", 1, 14],
  ["position3", 2, 191],
  ["position3", 3, 2812],
  ["position3", 4, 43238],
  ["position4", 1, 6],
  ["position4", 2, 264],
  ["position4", 3, 9467],
  ["position4Mirrored", 1, 6],
  ["position4Mirrored", 2, 264],
  ["position4Mirrored", 3, 9467],
  ["position5", 1, 44],
  ["position5", 2, 1486],
  ["position5", 3, 62379],
  ["position6", 1, 46],
  ["position6", 2, 2079],
  ["position6", 3, 89890],
];

const DEEP: [keyof typeof POSITIONS, number, number][] = [
  ["start", 4, 197281],
  ["start", 5, 4865609],
  ["kiwipete", 4, 4085603],
  ["position3", 5, 674624],
  ["position4", 4, 422333],
  ["position4Mirrored", 4, 422333],
  ["position5", 4, 2103487],
  ["position6", 4, 3894594],
];

describe("perft", () => {
  it.each(SHALLOW)("%s depth %i = %i", (name, depth, expected) => {
    expect(perft(Position.fromFen(POSITIONS[name]), depth)).toBe(expected);
  });

  it("returns 1 at depth 0", () => {
    expect(perft(Position.fromFen(POSITIONS.start), 0)).toBe(1);
  });

  it("throws past the maximum depth", () => {
    expect(() => perft(Position.fromFen(POSITIONS.start), 64)).toThrow();
  });

  it.each(Object.entries(POSITIONS))(
    "leaves the %s position unchanged",
    (_, fen) => {
      const position = Position.fromFen(fen);

      perft(position, 3);

      expect(Position.toFen(position)).toBe(fen);
    },
  );
});

describe.skip("perft (deep)", () => {
  it.each(DEEP)(
    "%s depth %i = %i",
    (name, depth, expected) => {
      expect(perft(Position.fromFen(POSITIONS[name]), depth)).toBe(expected);
    },
    60_000,
  );
});
