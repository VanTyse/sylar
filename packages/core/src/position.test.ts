import { describe, expect, it } from "vitest";
import { Position } from "./position.ts";
import { Piece, Side } from "./pieces.ts";

const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

describe("Position", () => {
  it("has a 64-square board", () => {
    expect(new Position().board).toHaveLength(64);
  });

  it("parses the start position", () => {
    const pos = Position.fromFen(START);

    expect(pos.board[0]).toBe(Piece.WRook); // a1
    expect(pos.board[4]).toBe(Piece.WKing); // e1
    expect(pos.board[60]).toBe(Piece.BKing); // e8
    expect(pos.board[27]).toBe(Piece.Empty); // d4
    expect(pos.sideToMove).toBe(Side.White);
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

  it.each([
    ["too few ranks", "8/8/8 w - - 0 1"],
    ["bad side to move", "4k3/8/8/8/8/8/8/4K3 x - - 0 1"],
    ["bad castling char", "4k3/8/8/8/8/8/8/4K3 w X - 0 1"],
    ["bad en passant square", "4k3/8/8/8/8/8/8/4K3 w - z9 0 1"],
    ["rank too long", "4k4/8/8/8/8/8/8/4K3 w - - 0 1"],
    ["bad piece char", "4x3/8/8/8/8/8/8/4K3 w - - 0 1"],
    ["non-numeric move counter", "4k3/8/8/8/8/8/8/4K3 w - - abc 1"],
    ["negative move counter", "4k3/8/8/8/8/8/8/4K3 w - - -1 1"],
    ["fractional move counter", "4k3/8/8/8/8/8/8/4K3 w - - 0 1.5"],
  ])("rejects %s", (_name, fen) => {
    expect(() => Position.fromFen(fen)).toThrow();
  });
});

describe("FEN round trip", () => {
  it.each([
    // Standard perft positions
    ["start position", START],
    ["Kiwipete", "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1"],
    ["perft position 3", "8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1"],
    ["perft position 4", "r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1"],
    ["perft position 5", "rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8"],
    ["perft position 6", "r4rk1/1pp1qppp/p1np1n2/2b1p1B1/2B1P1b1/P1NP1N2/1PP1QPPP/R4RK1 w - - 0 10"],

    // En passant squares on both sides
    ["white just pushed e2-e4", "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1"],
    ["black just pushed e7-e5", "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e5 0 2"],
    ["en passant on the a-file", "rnbqkbnr/1ppppppp/8/pP6/8/8/P1PPPPPP/RNBQKBNR w KQkq a6 0 3"],
    ["en passant on the h-file", "rnbqkbnr/pppppp1p/8/8/6pP/8/PPPPPPP1/RNBQKBNR b KQkq h3 0 3"],

    // Partial castling rights, to check the KQkq order
    ["white kingside only", "4k3/8/8/8/8/8/8/4K2R w K - 0 1"],
    ["white queenside only", "4k3/8/8/8/8/8/8/R3K3 w Q - 0 1"],
    ["black kingside only", "4k2r/8/8/8/8/8/8/4K3 b k - 0 1"],
    ["black queenside only", "r3k3/8/8/8/8/8/8/4K3 b q - 0 1"],
    ["mixed rights", "r3k2r/8/8/8/8/8/8/R3K2R w Qk - 0 1"],

    // Board edges and empty-square runs
    ["pieces in all four corners", "r6r/8/8/3k4/3K4/8/8/R6R w - - 0 1"],
    ["empty run at the end of a rank", "4k3/8/8/8/8/8/8/4K3 w - - 0 1"],
    ["single empty squares between pieces", "k1n1b1r1/8/8/8/8/8/8/1R1B1N1K b - - 0 1"],
    ["promotion position", "n1n5/PPPk4/8/8/8/8/4Kppp/5N1N b - - 0 1"],

    // Move counters
    ["large move counters", "4k3/8/8/8/8/8/8/4K2R b K - 99 150"],
  ])("%s", (_name, fen) => {
    expect(Position.toFen(Position.fromFen(fen))).toBe(fen);
  });

  it("fills in missing move counters with 0 and 1", () => {
    const fen = "4k3/8/8/8/8/8/8/4K3 w - -";

    expect(Position.toFen(Position.fromFen(fen))).toBe(`${fen} 0 1`);
  });

  it("ignores extra whitespace", () => {
    const fen = "4k3/8/8/8/8/8/8/4K3 w - - 0 1";

    expect(Position.toFen(Position.fromFen(`  ${fen.replaceAll(" ", "   ")}  `))).toBe(fen);
  });
});
