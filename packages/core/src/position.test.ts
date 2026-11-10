import { describe, expect, it } from "vitest";
import { Position } from "./position.ts";
import { Piece } from "./pieces.ts";

describe("Position", () => {
  it("has a 64-square board", () => {
    expect(new Position().board).toHaveLength(64);
  });

  const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

  it("parses the start position", () => {
    const pos = Position.fromFen(START);

    expect(pos.board[0]).toBe(Piece.WRook); // a1
    expect(pos.board[4]).toBe(Piece.WKing); // e1
    expect(pos.board[60]).toBe(Piece.BKing); // e8
    expect(pos.board[27]).toBe(Piece.Empty); // d4
    expect(pos.sideToMove).toBe(0);
    expect(pos.castling).toBe(0b1111);
    expect(pos.epSquare).toBe(-1);
  });

  it("parses an en passant square", () => {
    const pos = Position.fromFen(
      "rnbqkbnr/pppp1ppp/8/4p3/8/8/PPPPPPPP/RNBQKBNR w KQkq e6 0 2",
    );

    expect(pos.epSquare).toBe(44); // e6
    expect(pos.board[36]).toBe(Piece.BPawn); // e5
  });

  it("rejects bad FENs", () => {
    expect(() => Position.fromFen("8/8/8 w - - 0 1")).toThrow();
  });
});
