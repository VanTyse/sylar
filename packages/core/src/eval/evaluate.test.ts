import { describe, expect, it } from "vitest";
import { Position } from "../position/position.ts";
import { evaluate } from "./evaluate.ts";

/**
 * evaluate() returns centipawns from the side to move's point of view:
 * positive means the side to move is ahead. Negamax relies on this.
 */

function evalFen(fen: string): number {
  return evaluate(Position.fromFen(fen));
}

describe("evaluate", () => {
  it("scores the start position as 0", () => {
    expect(
      evalFen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"),
    ).toBe(0);
  });

  it("scores bare kings as 0", () => {
    expect(evalFen("4k3/8/8/8/8/8/8/4K3 w - - 0 1")).toBe(0);
    // -score turns 0 into -0 with black to move; -0 === 0, so either is fine
    expect(Math.abs(evalFen("4k3/8/8/8/8/8/8/4K3 b - - 0 1"))).toBe(0);
  });

  describe("piece values", () => {
    it.each([
      ["pawn", "P", 100],
      ["knight", "N", 320],
      ["bishop", "B", 330],
      ["rook", "R", 500],
      ["queen", "Q", 900],
    ])("white %s is worth %i", (_, piece, value) => {
      expect(evalFen(`4k3/8/8/8/3${piece}4/8/8/4K3 w - - 0 1`)).toBe(value);
    });

    it.each([
      ["pawn", "p", 100],
      ["knight", "n", 320],
      ["bishop", "b", 330],
      ["rook", "r", 500],
      ["queen", "q", 900],
    ])("black %s is worth %i", (_, piece, value) => {
      expect(evalFen(`4k3/8/8/8/3${piece}4/8/8/4K3 b - - 0 1`)).toBe(value);
    });
  });

  describe("side-to-move perspective", () => {
    const WHITE_UP_A_KNIGHT =
      "r1bqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR";

    it("is positive for the side that is ahead", () => {
      expect(evalFen(`${WHITE_UP_A_KNIGHT} w KQkq - 0 1`)).toBe(320);
    });

    it("is negative for the side that is behind", () => {
      expect(evalFen(`${WHITE_UP_A_KNIGHT} b KQkq - 0 1`)).toBe(-320);
    });

    it("gives the same score to a position and its color-swapped mirror", () => {
      const position4 =
        "r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1";
      const position4Mirrored =
        "r2q1rk1/pP1p2pp/Q4n2/bbp1p3/Np6/1B3NBn/pPPP1PPP/R3K2R b KQ - 0 1";

      expect(evalFen(position4)).toBe(evalFen(position4Mirrored));
    });
  });

  it("sums mixed material", () => {
    // white queen (900) against black rook and bishop (830)
    expect(evalFen("4k3/8/8/2rb4/8/8/3Q4/4K3 w - - 0 1")).toBe(70);
    expect(evalFen("4k3/8/8/2rb4/8/8/3Q4/4K3 b - - 0 1")).toBe(-70);
  });
});
