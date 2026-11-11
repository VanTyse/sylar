import { describe, expect, it } from "vitest";
import {
  MoveFlag,
  encodeMove,
  formatMoveToUci,
  getFromSquare,
  getMoveFlags,
  getPromotionIndex,
  getToSquare,
  isCapture,
  isPromotion,
} from "./move.ts";

const ALL_FLAGS = Object.entries(MoveFlag);

const CAPTURE_FLAGS: MoveFlag[] = [
  MoveFlag.Capture,
  MoveFlag.EnPassant,
  MoveFlag.PromoCaptureKnight,
  MoveFlag.PromoCaptureBishop,
  MoveFlag.PromoCaptureRook,
  MoveFlag.PromoCaptureQueen,
];

const PROMOTION_FLAGS: MoveFlag[] = [
  MoveFlag.PromoKnight,
  MoveFlag.PromoBishop,
  MoveFlag.PromoRook,
  MoveFlag.PromoQueen,
  MoveFlag.PromoCaptureKnight,
  MoveFlag.PromoCaptureBishop,
  MoveFlag.PromoCaptureRook,
  MoveFlag.PromoCaptureQueen,
];

describe("encode and decode", () => {
  it.each([
    ["a1 to h8, lowest flag", 0, 63, MoveFlag.Quiet],
    ["h8 to a1, highest flag", 63, 0, MoveFlag.PromoCaptureQueen],
    ["same square both ends", 0, 0, MoveFlag.Quiet],
    ["highest square both ends", 63, 63, MoveFlag.PromoCaptureQueen],
    ["e2 to e4", 12, 28, MoveFlag.DoublePush],
  ] as const)("%s", (_name, from, to, flag) => {
    const move = encodeMove(from, to, flag);

    expect(getFromSquare(move)).toBe(from);
    expect(getToSquare(move)).toBe(to);
    expect(getMoveFlags(move)).toBe(flag);
  });

  it.each(ALL_FLAGS)("round-trips the %s flag", (_name, flag) => {
    const move = encodeMove(52, 60, flag);

    expect(getMoveFlags(move)).toBe(flag);
    expect(getFromSquare(move)).toBe(52);
    expect(getToSquare(move)).toBe(60);
  });

  it("round-trips every square pair with every flag", () => {
    for (let from = 0; from < 64; from++) {
      for (let to = 0; to < 64; to++) {
        for (const [, flag] of ALL_FLAGS) {
          const move = encodeMove(from, to, flag);

          if (
            getFromSquare(move) !== from ||
            getToSquare(move) !== to ||
            getMoveFlags(move) !== flag
          ) {
            expect.fail(`round trip failed for from=${from} to=${to} flag=${flag}`);
          }
        }
      }
    }
  });

  it("fits in 16 bits", () => {
    expect(encodeMove(63, 63, MoveFlag.PromoCaptureQueen)).toBe(0xffff);
  });
});

describe("isCapture", () => {
  it.each(ALL_FLAGS)("%s", (_name, flag) => {
    expect(isCapture(encodeMove(12, 28, flag))).toBe(CAPTURE_FLAGS.includes(flag));
  });
});

describe("isPromotion", () => {
  it.each(ALL_FLAGS)("%s", (_name, flag) => {
    expect(isPromotion(encodeMove(52, 60, flag))).toBe(PROMOTION_FLAGS.includes(flag));
  });
});

describe("getPromotionIndex", () => {
  it.each([
    [MoveFlag.PromoKnight, 0],
    [MoveFlag.PromoBishop, 1],
    [MoveFlag.PromoRook, 2],
    [MoveFlag.PromoQueen, 3],
    [MoveFlag.PromoCaptureKnight, 0],
    [MoveFlag.PromoCaptureBishop, 1],
    [MoveFlag.PromoCaptureRook, 2],
    [MoveFlag.PromoCaptureQueen, 3],
  ] as const)("flag %i gives index %i", (flag, index) => {
    expect(getPromotionIndex(encodeMove(52, 60, flag))).toBe(index);
  });
});

describe("formatMoveToUci", () => {
  it.each([
    ["quiet move", 6, 21, MoveFlag.Quiet, "g1f3"],
    ["double push", 12, 28, MoveFlag.DoublePush, "e2e4"],
    ["capture", 28, 35, MoveFlag.Capture, "e4d5"],
    ["en passant", 36, 43, MoveFlag.EnPassant, "e5d6"],
    ["white kingside castle", 4, 6, MoveFlag.KingCastle, "e1g1"],
    ["black queenside castle", 60, 58, MoveFlag.QueenCastle, "e8c8"],
    ["corner to corner", 0, 63, MoveFlag.Quiet, "a1h8"],
    ["promotion to queen", 52, 60, MoveFlag.PromoQueen, "e7e8q"],
    ["promotion to knight", 52, 60, MoveFlag.PromoKnight, "e7e8n"],
    ["promotion to bishop", 52, 60, MoveFlag.PromoBishop, "e7e8b"],
    ["promotion to rook", 52, 60, MoveFlag.PromoRook, "e7e8r"],
    ["capture-promotion to knight", 48, 57, MoveFlag.PromoCaptureKnight, "a7b8n"],
    ["black promotion uses lowercase too", 11, 3, MoveFlag.PromoQueen, "d2d1q"],
  ] as const)("%s", (_name, from, to, flag, uci) => {
    expect(formatMoveToUci(encodeMove(from, to, flag))).toBe(uci);
  });
});
