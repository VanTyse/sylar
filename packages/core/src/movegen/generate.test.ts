import { describe, expect, it } from "vitest";
import { MoveFlag, formatMoveToUci, getMoveFlags } from "../move/move.ts";
import { Position } from "../position/position.ts";
import { generateMoves } from "./generate.ts";

/**
 * These tests describe PSEUDO-LEGAL move generation: every move the pieces can
 * physically make, without checking whether the mover's own king is left in check.
 * (King steps onto attacked squares are included; that filter comes later.)
 * The one exception is castling, whose attacked-square rules belong to generation.
 */

function generate(fen: string): string[] {
  const pos = Position.fromFen(fen);
  const list = new Uint16Array(256);
  const count = generateMoves(pos, list);
  const out: string[] = [];

  for (let i = 0; i < count; i++) out.push(formatMoveToUci(list[i]));

  return out;
}

/** All generated moves as sorted UCI strings. Duplicates are kept, so they fail the test. */
function moves(fen: string): string[] {
  return generate(fen).sort();
}

/** Only the moves starting on `from`, for positions where other pieces also move. */
function movesFrom(fen: string, from: string): string[] {
  return moves(fen).filter((m) => m.startsWith(from));
}

/** The flag of one generated move, looked up by its UCI string. */
function flagOf(fen: string, uci: string): number {
  const pos = Position.fromFen(fen);
  const list = new Uint16Array(256);
  const count = generateMoves(pos, list);

  for (let i = 0; i < count; i++) {
    if (formatMoveToUci(list[i]) === uci) return getMoveFlags(list[i]);
  }

  throw new Error(`${uci} was not generated`);
}

describe("generateMoves", () => {
  describe("knight", () => {
    it("moves to all 8 squares from the centre", () => {
      expect(moves("8/8/8/8/3N4/8/8/8 w - - 0 1")).toEqual([
        "d4b3", "d4b5", "d4c2", "d4c6", "d4e2", "d4e6", "d4f3", "d4f5",
      ]);
    });

    it("does not wrap from the h1 corner", () => {
      expect(moves("8/8/8/8/8/8/8/7N w - - 0 1")).toEqual(["h1f2", "h1g3"]);
    });

    it("captures enemy pieces and skips its own", () => {
      // White knight b1: black pawn on c3, white pawn on d2
      const fen = "8/8/8/8/8/2p5/3P4/1N6 w - - 0 1";

      expect(movesFrom(fen, "b1")).toEqual(["b1a3", "b1c3"]);
      expect(flagOf(fen, "b1c3")).toBe(MoveFlag.Capture);
      expect(flagOf(fen, "b1a3")).toBe(MoveFlag.Quiet);
    });

    it("only moves the side to move", () => {
      expect(moves("8/8/8/8/3n4/8/8/8 w - - 0 1")).toEqual([]);
    });

    it("works for black", () => {
      expect(moves("8/8/8/8/3n4/8/8/8 b - - 0 1")).toEqual([
        "d4b3", "d4b5", "d4c2", "d4c6", "d4e2", "d4e6", "d4f3", "d4f5",
      ]);
    });
  });

  describe("king", () => {
    it("moves to all 8 squares from the centre", () => {
      expect(moves("8/8/8/8/4K3/8/8/8 w - - 0 1")).toEqual([
        "e4d3", "e4d4", "e4d5", "e4e3", "e4e5", "e4f3", "e4f4", "e4f5",
      ]);
    });

    it("does not wrap from the corners", () => {
      expect(moves("8/8/8/8/8/8/8/K7 w - - 0 1")).toEqual(["a1a2", "a1b1", "a1b2"]);
      expect(moves("7k/8/8/8/8/8/8/8 b - - 0 1")).toEqual(["h8g7", "h8g8", "h8h7"]);
    });

    it("captures enemy pieces and skips its own", () => {
      // White king e1: black pawn on d2, white pawn on f2, no castling rights
      const fen = "8/8/8/8/8/8/3p1P2/4K3 w - - 0 1";

      expect(movesFrom(fen, "e1")).toEqual(["e1d1", "e1d2", "e1e2", "e1f1"]);
      expect(flagOf(fen, "e1d2")).toBe(MoveFlag.Capture);
    });
  });

  describe("pawn", () => {
    it("white pawn pushes one or two squares from its starting rank", () => {
      const fen = "8/8/8/8/8/8/4P3/8 w - - 0 1";

      expect(moves(fen)).toEqual(["e2e3", "e2e4"]);
      expect(flagOf(fen, "e2e3")).toBe(MoveFlag.Quiet);
      expect(flagOf(fen, "e2e4")).toBe(MoveFlag.DoublePush);
    });

    it("white pawn pushes only one square off its starting rank", () => {
      expect(moves("8/8/8/8/8/4P3/8/8 w - - 0 1")).toEqual(["e3e4"]);
    });

    it("cannot push into a piece", () => {
      expect(moves("8/8/8/8/8/4p3/4P3/8 w - - 0 1")).toEqual([]);
    });

    it("cannot double push when the second square is blocked", () => {
      expect(moves("8/8/8/8/4p3/8/4P3/8 w - - 0 1")).toEqual(["e2e3"]);
    });

    it("captures diagonally but not straight ahead", () => {
      // White pawn e4, black pawns on d5, e5 and f5
      const fen = "8/8/8/3ppp2/4P3/8/8/8 w - - 0 1";

      expect(moves(fen)).toEqual(["e4d5", "e4f5"]);
      expect(flagOf(fen, "e4d5")).toBe(MoveFlag.Capture);
    });

    it("does not capture its own pieces", () => {
      expect(movesFrom("8/8/8/3P1P2/4P3/8/8/8 w - - 0 1", "e4")).toEqual(["e4e5"]);
    });

    it("white pawn on the a-file does not capture by wrapping to the h-file", () => {
      // White pawn a4, black pawns on b5 and h4 (a4 + 7 would wrap to h4)
      expect(movesFrom("8/8/8/1p6/P6p/8/8/8 w - - 0 1", "a4")).toEqual(["a4a5", "a4b5"]);
    });

    it("white pawn on the h-file does not capture by wrapping to the a-file", () => {
      // White pawn h4, black pawns on g5 and a6 (h4 + 9 would wrap to a6)
      expect(movesFrom("8/8/p7/6p1/7P/8/8/8 w - - 0 1", "h4")).toEqual(["h4g5", "h4h5"]);
    });

    it("black pawn pushes downward, two squares from its starting rank", () => {
      const fen = "8/4p3/8/8/8/8/8/8 b - - 0 1";

      expect(moves(fen)).toEqual(["e7e5", "e7e6"]);
      expect(flagOf(fen, "e7e5")).toBe(MoveFlag.DoublePush);
    });

    it("black pawn captures downward", () => {
      // Black pawn e5, white pawns on d4, e4 and f4
      expect(moves("8/8/8/4p3/3PPP2/8/8/8 b - - 0 1")).toEqual(["e5d4", "e5f4"]);
    });

    it("black pawn on the a-file does not capture by wrapping to the h-file", () => {
      // Black pawn a5, white pawns on b4 and h3 (a5 - 9 would wrap to h3)
      expect(movesFrom("8/8/8/p7/1P6/7P/8/8 b - - 0 1", "a5")).toEqual(["a5a4", "a5b4"]);
    });
  });

  describe("en passant", () => {
    it("white captures en passant", () => {
      const fen = "8/8/8/3pP3/8/8/8/8 w - d6 0 1";

      expect(moves(fen)).toEqual(["e5d6", "e5e6"]);
      expect(flagOf(fen, "e5d6")).toBe(MoveFlag.EnPassant);
    });

    it("black captures en passant", () => {
      const fen = "8/8/8/8/3Pp3/8/8/8 b - d3 0 1";

      expect(moves(fen)).toEqual(["e4d3", "e4e3"]);
      expect(flagOf(fen, "e4d3")).toBe(MoveFlag.EnPassant);
    });

    it("is not generated without an en passant square", () => {
      expect(moves("8/8/8/3pP3/8/8/8/8 w - - 0 1")).toEqual(["e5e6"]);
    });
  });

  describe("promotion", () => {
    it("a push to the last rank generates all four promotions", () => {
      const fen = "8/4P3/8/8/8/8/8/8 w - - 0 1";

      expect(moves(fen)).toEqual(["e7e8b", "e7e8n", "e7e8q", "e7e8r"]);
      expect(flagOf(fen, "e7e8q")).toBe(MoveFlag.PromoQueen);
      expect(flagOf(fen, "e7e8n")).toBe(MoveFlag.PromoKnight);
    });

    it("a capture onto the last rank generates all four capture-promotions", () => {
      // White pawn e7, black rook d8, black knight e8 blocks the push
      const fen = "3rn3/4P3/8/8/8/8/8/8 w - - 0 1";

      expect(moves(fen)).toEqual(["e7d8b", "e7d8n", "e7d8q", "e7d8r"]);
      expect(flagOf(fen, "e7d8q")).toBe(MoveFlag.PromoCaptureQueen);
      expect(flagOf(fen, "e7d8r")).toBe(MoveFlag.PromoCaptureRook);
    });

    it("black promotes on the first rank", () => {
      expect(moves("8/8/8/8/8/8/1p6/8 b - - 0 1")).toEqual([
        "b2b1b", "b2b1n", "b2b1q", "b2b1r",
      ]);
    });
  });

  describe("rook", () => {
    it("moves along the whole rank and file from the centre", () => {
      expect(moves("8/8/8/8/3R4/8/8/8 w - - 0 1")).toEqual([
        "d4a4", "d4b4", "d4c4", "d4d1", "d4d2", "d4d3", "d4d5",
        "d4d6", "d4d7", "d4d8", "d4e4", "d4f4", "d4g4", "d4h4",
      ]);
    });

    it("does not wrap from h1 onto the a-file", () => {
      expect(moves("8/8/8/8/8/8/8/7R w - - 0 1")).toEqual([
        "h1a1", "h1b1", "h1c1", "h1d1", "h1e1", "h1f1", "h1g1",
        "h1h2", "h1h3", "h1h4", "h1h5", "h1h6", "h1h7", "h1h8",
      ]);
    });

    it("captures the first enemy piece and stops before its own", () => {
      // White rook a1, black pawn a4, white pawn d1
      const fen = "8/8/8/8/p7/8/8/R2P4 w - - 0 1";

      expect(movesFrom(fen, "a1")).toEqual(["a1a2", "a1a3", "a1a4", "a1b1", "a1c1"]);
      expect(flagOf(fen, "a1a4")).toBe(MoveFlag.Capture);
      expect(flagOf(fen, "a1a3")).toBe(MoveFlag.Quiet);
    });
  });

  describe("bishop", () => {
    it("moves along all four diagonals from the centre", () => {
      expect(moves("8/8/8/8/3B4/8/8/8 w - - 0 1")).toEqual([
        "d4a1", "d4a7", "d4b2", "d4b6", "d4c3", "d4c5", "d4e3",
        "d4e5", "d4f2", "d4f6", "d4g1", "d4g7", "d4h8",
      ]);
    });

    it("does not wrap from the h-file", () => {
      expect(moves("8/8/8/8/8/7B/8/8 w - - 0 1")).toEqual([
        "h3c8", "h3d7", "h3e6", "h3f1", "h3f5", "h3g2", "h3g4",
      ]);
    });

    it("captures the first enemy piece and stops before its own", () => {
      // White bishop c1, black pawn e3, white pawn b2
      const fen = "8/8/8/8/8/4p3/1P6/2B5 w - - 0 1";

      expect(movesFrom(fen, "c1")).toEqual(["c1d2", "c1e3"]);
      expect(flagOf(fen, "c1e3")).toBe(MoveFlag.Capture);
    });
  });

  describe("queen", () => {
    it("moves like a rook and a bishop combined", () => {
      expect(moves("8/8/8/8/3Q4/8/8/8 w - - 0 1")).toEqual([
        "d4a1", "d4a4", "d4a7", "d4b2", "d4b4", "d4b6", "d4c3", "d4c4", "d4c5",
        "d4d1", "d4d2", "d4d3", "d4d5", "d4d6", "d4d7", "d4d8",
        "d4e3", "d4e4", "d4e5", "d4f2", "d4f4", "d4f6", "d4g1", "d4g4", "d4g7", "d4h4", "d4h8",
      ]);
    });

    it("works for black from the corner", () => {
      expect(moves("q7/8/8/8/8/8/8/8 b - - 0 1")).toEqual([
        "a8a1", "a8a2", "a8a3", "a8a4", "a8a5", "a8a6", "a8a7",
        "a8b7", "a8b8", "a8c6", "a8c8", "a8d5", "a8d8", "a8e4", "a8e8",
        "a8f3", "a8f8", "a8g2", "a8g8", "a8h1", "a8h8",
      ]);
    });
  });

  describe("castling", () => {
    const KING_STEPS_E1 = ["e1d1", "e1d2", "e1e2", "e1f1", "e1f2"];

    it("white castles on both sides", () => {
      const fen = "r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1";

      expect(movesFrom(fen, "e1")).toEqual(["e1c1", ...KING_STEPS_E1, "e1g1"]);
      expect(flagOf(fen, "e1g1")).toBe(MoveFlag.KingCastle);
      expect(flagOf(fen, "e1c1")).toBe(MoveFlag.QueenCastle);
    });

    it("black castles on both sides", () => {
      const fen = "r3k2r/8/8/8/8/8/8/R3K2R b KQkq - 0 1";

      expect(movesFrom(fen, "e8")).toEqual([
        "e8c8", "e8d7", "e8d8", "e8e7", "e8f7", "e8f8", "e8g8",
      ]);
      expect(flagOf(fen, "e8g8")).toBe(MoveFlag.KingCastle);
      expect(flagOf(fen, "e8c8")).toBe(MoveFlag.QueenCastle);
    });

    it("needs the castling right", () => {
      expect(movesFrom("r3k2r/8/8/8/8/8/8/R3K2R w - - 0 1", "e1")).toEqual(KING_STEPS_E1);
      expect(movesFrom("r3k2r/8/8/8/8/8/8/R3K2R w K - 0 1", "e1")).toEqual([
        ...KING_STEPS_E1, "e1g1",
      ]);
      expect(movesFrom("r3k2r/8/8/8/8/8/8/R3K2R w Q - 0 1", "e1")).toEqual([
        "e1c1", ...KING_STEPS_E1,
      ]);
    });

    it("needs every square between king and rook to be empty", () => {
      // Knight on b1: the king never crosses b1, but it must still be empty
      expect(movesFrom("r3k2r/8/8/8/8/8/8/RN2K2R w KQkq - 0 1", "e1")).toEqual([
        ...KING_STEPS_E1, "e1g1",
      ]);
      // Knight on g1 blocks kingside
      expect(movesFrom("r3k2r/8/8/8/8/8/8/R3K1NR w KQkq - 0 1", "e1")).toEqual([
        "e1c1", ...KING_STEPS_E1,
      ]);
    });

    it("cannot castle out of check", () => {
      // Black rook e8 attacks e1
      expect(movesFrom("4r2k/8/8/8/8/8/8/R3K2R w KQ - 0 1", "e1")).toEqual(KING_STEPS_E1);
    });

    it("cannot castle through an attacked square", () => {
      // Black rook f8 attacks f1: kingside is out, queenside is fine
      expect(movesFrom("5r1k/8/8/8/8/8/8/R3K2R w KQ - 0 1", "e1")).toEqual([
        "e1c1", ...KING_STEPS_E1,
      ]);
    });

    it("cannot castle into check", () => {
      // Black rook g8 attacks g1
      expect(movesFrom("6rk/8/8/8/8/8/8/R3K2R w KQ - 0 1", "e1")).toEqual([
        "e1c1", ...KING_STEPS_E1,
      ]);
    });

    it("can castle queenside when only b1 is attacked", () => {
      // Black rook b8 attacks b1, but the king only crosses d1 and lands on c1
      expect(movesFrom("1r5k/8/8/8/8/8/8/R3K2R w KQ - 0 1", "e1")).toEqual([
        "e1c1", ...KING_STEPS_E1, "e1g1",
      ]);
    });
  });

  describe("full positions", () => {
    it("white's 20 moves in the start position", () => {
      expect(moves("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1")).toEqual([
        "a2a3", "a2a4", "b1a3", "b1c3", "b2b3", "b2b4", "c2c3", "c2c4", "d2d3", "d2d4",
        "e2e3", "e2e4", "f2f3", "f2f4", "g1f3", "g1h3", "g2g3", "g2g4", "h2h3", "h2h4",
      ]);
    });

    it("black's 20 moves in the start position", () => {
      expect(moves("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR b KQkq - 0 1")).toEqual([
        "a7a5", "a7a6", "b7b5", "b7b6", "b8a6", "b8c6", "c7c5", "c7c6", "d7d5", "d7d6",
        "e7e5", "e7e6", "f7f5", "f7f6", "g7g5", "g7g6", "g8f6", "g8h6", "h7h5", "h7h6",
      ]);
    });
  });
});
