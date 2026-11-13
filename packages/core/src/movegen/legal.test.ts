import { describe, expect, it } from "vitest";
import { formatMoveToUci, getMoveFlags, MoveFlag, NO_MOVE } from "../move/move.ts";
import { Position } from "../position/position.ts";
import { parseUciMove } from "./legal.ts";

const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

describe("parseUciMove", () => {
  it("finds a legal move", () => {
    const move = parseUciMove(Position.fromFen(START), "e2e4");

    expect(formatMoveToUci(move)).toBe("e2e4");
    expect(getMoveFlags(move)).toBe(MoveFlag.DoublePush);
  });

  it("finds castling written as a king move", () => {
    const move = parseUciMove(
      Position.fromFen("r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1"),
      "e1c1",
    );

    expect(getMoveFlags(move)).toBe(MoveFlag.QueenCastle);
  });

  it("picks the promotion piece from the suffix", () => {
    const position = Position.fromFen("4k3/P7/8/8/8/8/8/4K3 w - - 0 1");

    expect(getMoveFlags(parseUciMove(position, "a7a8q"))).toBe(
      MoveFlag.PromoQueen,
    );
    expect(getMoveFlags(parseUciMove(position, "a7a8n"))).toBe(
      MoveFlag.PromoKnight,
    );
  });

  it("rejects a promotion without a piece", () => {
    const position = Position.fromFen("4k3/P7/8/8/8/8/8/4K3 w - - 0 1");

    expect(parseUciMove(position, "a7a8")).toBe(NO_MOVE);
  });

  it("rejects a move that leaves the king in check", () => {
    // the e2 bishop is pinned to the king by the e8 rook
    const position = Position.fromFen("4r1k1/8/8/8/8/8/4B3/4K3 w - - 0 1");

    expect(parseUciMove(position, "e2d3")).toBe(NO_MOVE);
  });

  it.each(["e2e5", "e7e5", "", "e2", "hello", "e2e4q"])(
    "rejects %j",
    (text) => {
      expect(parseUciMove(Position.fromFen(START), text)).toBe(NO_MOVE);
    },
  );

  it("leaves the position unchanged", () => {
    const position = Position.fromFen(START);

    parseUciMove(position, "e2e4");
    parseUciMove(position, "e2e5");

    expect(Position.toFen(position)).toBe(START);
  });
});
