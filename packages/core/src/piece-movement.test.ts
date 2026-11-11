import { describe, expect, it } from "vitest";
import { unParseSquare } from "./fen-parser-utils.ts";
import { isSquareAttacked } from "./piece-movement.ts";
import { Side } from "./pieces.ts";
import { Position } from "./position.ts";

/**
 * Every square attacked by `side`, as sorted square names.
 * Comparing the full list catches both missing attacks and extra ones
 * (wraparound, sliding past a blocker, pawns attacking backwards, ...).
 *
 * Most positions below have no kings, so each test isolates one piece type.
 */
function attackedSquares(fen: string, side: Side): string[] {
  const pos = Position.fromFen(fen);
  const squares: string[] = [];

  for (let sq = 0; sq < 64; sq++) {
    if (isSquareAttacked(pos, sq, side)) squares.push(unParseSquare(sq));
  }

  return squares.sort();
}

describe("isSquareAttacked", () => {
  describe("king", () => {
    it("king on the h-file attacks its neighbours without wrapping to the a-file", () => {
      // White king on h4 (31), black king far away on a8
      const pos = Position.fromFen("k7/8/8/8/7K/8/8/8 w - - 0 1");

      // The five real neighbours of h4
      expect(isSquareAttacked(pos, 38, Side.White)).toBe(true); // g5
      expect(isSquareAttacked(pos, 30, Side.White)).toBe(true); // g4
      expect(isSquareAttacked(pos, 22, Side.White)).toBe(true); // g3
      expect(isSquareAttacked(pos, 39, Side.White)).toBe(true); // h5
      expect(isSquareAttacked(pos, 23, Side.White)).toBe(true); // h3

      // Offsets +1, -7 and +9 from h4 land on the a-file: wraparound, not attacks
      expect(isSquareAttacked(pos, 32, Side.White)).toBe(false); // a5
      expect(isSquareAttacked(pos, 24, Side.White)).toBe(false); // a4
      expect(isSquareAttacked(pos, 40, Side.White)).toBe(false); // a6

      // The king's own square and squares two away are not attacked
      expect(isSquareAttacked(pos, 31, Side.White)).toBe(false); // h4
      expect(isSquareAttacked(pos, 29, Side.White)).toBe(false); // f4

      // The same squares are not attacked by Black
      expect(isSquareAttacked(pos, 38, Side.Black)).toBe(false); // g5
    });
  });

  describe("knight", () => {
    it("attacks all 8 squares from the centre", () => {
      expect(attackedSquares("8/8/8/8/3N4/8/8/8 w - - 0 1", Side.White)).toEqual([
        "b3", "b5", "c2", "c6", "e2", "e6", "f3", "f5",
      ]);
    });

    it("does not wrap from the h-file corner", () => {
      // From h1: b1 (-6), b3 (+10) and a4 (+17) would be wraparound
      expect(attackedSquares("8/8/8/8/8/8/8/7N w - - 0 1", Side.White)).toEqual([
        "f2", "g3",
      ]);
    });

    it("does not wrap from the a-file corner (black knight)", () => {
      // From a8: g8 (+6), g6 (-10) and h5 (-17) would be wraparound
      expect(attackedSquares("n7/8/8/8/8/8/8/8 b - - 0 1", Side.Black)).toEqual([
        "b6", "c7",
      ]);
    });

    it("jumps over surrounding pieces", () => {
      // White knight b1 boxed in by black pawns on a2, b2, c2
      expect(attackedSquares("8/8/8/8/8/8/ppp5/1N6 w - - 0 1", Side.White)).toEqual([
        "a3", "c3", "d2",
      ]);
    });
  });

  describe("pawn", () => {
    it("white pawn attacks both forward diagonals, not the square ahead", () => {
      expect(attackedSquares("8/8/8/8/4P3/8/8/8 w - - 0 1", Side.White)).toEqual([
        "d5", "f5",
      ]);
    });

    it("black pawn attacks downward", () => {
      expect(attackedSquares("8/8/8/4p3/8/8/8/8 b - - 0 1", Side.Black)).toEqual([
        "d4", "f4",
      ]);
    });

    it("white pawns on the edge files do not wrap", () => {
      // a2 + 7 would wrap to h2; h2 + 9 would wrap to a4
      expect(attackedSquares("8/8/8/8/8/8/P6P/8 w - - 0 1", Side.White)).toEqual([
        "b3", "g3",
      ]);
    });

    it("black pawns on the edge files do not wrap", () => {
      // a7 - 9 would wrap to h5; h7 - 7 would wrap to a7
      expect(attackedSquares("8/p6p/8/8/8/8/8/8 b - - 0 1", Side.Black)).toEqual([
        "b6", "g6",
      ]);
    });

    it("a white pawn is not a black attacker", () => {
      expect(attackedSquares("8/8/8/8/4P3/8/8/8 w - - 0 1", Side.Black)).toEqual([]);
    });
  });

  describe("rook", () => {
    it("attacks the whole rank and file from the centre", () => {
      expect(attackedSquares("8/8/8/8/3R4/8/8/8 w - - 0 1", Side.White)).toEqual([
        "a4", "b4", "c4", "d1", "d2", "d3", "d5", "d6", "d7", "d8", "e4", "f4", "g4", "h4",
      ]);
    });

    it("does not wrap from h1 onto the a-file", () => {
      expect(attackedSquares("8/8/8/8/8/8/8/7R w - - 0 1", Side.White)).toEqual([
        "a1", "b1", "c1", "d1", "e1", "f1", "g1", "h2", "h3", "h4", "h5", "h6", "h7", "h8",
      ]);
    });

    it("works for black", () => {
      expect(attackedSquares("7r/8/8/8/8/8/8/8 b - - 0 1", Side.Black)).toEqual([
        "a8", "b8", "c8", "d8", "e8", "f8", "g8", "h1", "h2", "h3", "h4", "h5", "h6", "h7",
      ]);
    });

    it("stops at an enemy piece and attacks its square", () => {
      // White rook a1, black pawns on a4 and d1
      expect(attackedSquares("8/8/8/8/p7/8/8/R2p4 w - - 0 1", Side.White)).toEqual([
        "a2", "a3", "a4", "b1", "c1", "d1",
      ]);
    });

    it("stops at its own piece and defends it", () => {
      // White rook a1, white pawn a3 (which itself attacks b4)
      expect(attackedSquares("8/8/8/8/8/P7/8/R7 w - - 0 1", Side.White)).toEqual([
        "a2", "a3", "b1", "b4", "c1", "d1", "e1", "f1", "g1", "h1",
      ]);
    });

    it("a white rook is not a black attacker", () => {
      expect(attackedSquares("8/8/8/8/3R4/8/8/8 w - - 0 1", Side.Black)).toEqual([]);
    });
  });

  describe("bishop", () => {
    it("attacks all four diagonals from the centre", () => {
      expect(attackedSquares("8/8/8/8/3B4/8/8/8 w - - 0 1", Side.White)).toEqual([
        "a1", "a7", "b2", "b6", "c3", "c5", "e3", "e5", "f2", "f6", "g1", "g7", "h8",
      ]);
    });

    it("does not wrap from the h-file", () => {
      // h3 + 9 would wrap to a5; h3 - 7 would wrap to a3
      expect(attackedSquares("8/8/8/8/8/7B/8/8 w - - 0 1", Side.White)).toEqual([
        "c8", "d7", "e6", "f1", "f5", "g2", "g4",
      ]);
    });

    it("does not wrap from the a-file (black bishop)", () => {
      // a6 + 7 would wrap to h6; a6 - 9 would wrap to h4
      expect(attackedSquares("8/8/b7/8/8/8/8/8 b - - 0 1", Side.Black)).toEqual([
        "b5", "b7", "c4", "c8", "d3", "e2", "f1",
      ]);
    });

    it("stops at a blocking piece", () => {
      // White bishop c1, black pawn e3
      expect(attackedSquares("8/8/8/8/8/4p3/8/2B5 w - - 0 1", Side.White)).toEqual([
        "a3", "b2", "d2", "e3",
      ]);
    });
  });

  describe("queen", () => {
    it("attacks like a rook and a bishop combined", () => {
      expect(attackedSquares("8/8/8/8/3Q4/8/8/8 w - - 0 1", Side.White)).toEqual([
        "a1", "a4", "a7", "b2", "b4", "b6", "c3", "c4", "c5",
        "d1", "d2", "d3", "d5", "d6", "d7", "d8",
        "e3", "e4", "e5", "f2", "f4", "f6", "g1", "g4", "g7", "h4", "h8",
      ]);
    });

    it("works for black from the corner", () => {
      expect(attackedSquares("q7/8/8/8/8/8/8/8 b - - 0 1", Side.Black)).toEqual([
        "a1", "a2", "a3", "a4", "a5", "a6", "a7",
        "b7", "b8", "c6", "c8", "d5", "d8", "e4", "e8", "f3", "f8", "g2", "g8", "h1", "h8",
      ]);
    });

    it("is blocked on the file, rank and diagonal", () => {
      // White queen a1, black pawns on a3, c3 and c1
      expect(attackedSquares("8/8/8/8/8/p1p5/8/Q1p5 w - - 0 1", Side.White)).toEqual([
        "a2", "a3", "b1", "b2", "c1", "c3",
      ]);
    });
  });

  describe("all pieces together", () => {
    it("white's attacks in the start position", () => {
      // a1 and h1 are the only back-rank squares nothing defends
      expect(
        attackedSquares("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", Side.White),
      ).toEqual([
        "a2", "a3", "b1", "b2", "b3", "c1", "c2", "c3", "d1", "d2", "d3",
        "e1", "e2", "e3", "f1", "f2", "f3", "g1", "g2", "g3", "h2", "h3",
      ]);
    });
  });
});
