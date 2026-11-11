import { Piece } from "../board/piece.ts";
import { Castling } from "./castling.ts";

const FEN_PIECE_CHARS = "PNBRQKpnbrqk"; // indexOf(ch) + 1 === Piece value

export function parsePlacement(placement: string, board: Int8Array) {
  const ranks = placement.split("/");

  if (ranks.length !== 8) throw new Error(`FEN needs 8 ranks: ${placement}`);

  for (let r = 0; r < 8; r++) {
    const rank = 7 - r; // FEN starts at rank 8
    let file = 0;

    for (const ch of ranks[r]) {
      if (ch >= "1" && ch <= "8") {
        file += Number(ch);

        continue;
      }

      const idx = FEN_PIECE_CHARS.indexOf(ch);

      if (idx === -1 || file > 7) throw new Error(`Bad FEN rank: ${ranks[r]}`);

      board[rank * 8 + file] = idx + 1;
      file++;
    }

    if (file !== 8) throw new Error(`FEN rank is not 8 squares: ${ranks[r]}`);
  }
}

const CASTLING_CHARS: Record<string, number> = {
  K: Castling.WK,
  Q: Castling.WQ,
  k: Castling.BK,
  q: Castling.BQ,
};

export function parseCastling(castling: string): number {
  if (castling === "-") return 0b0000;

  let value = 0b0000;

  for (const char of castling) {
    const bit = CASTLING_CHARS[char];

    if (bit === undefined) throw new Error(`Bad castling field: ${castling}`);

    value |= bit;
  }

  return value;
}

export function splitFen(
  fen: string,
): [string, string, string, string, string, string] {
  const [placement, side, castling, ep, halfmove = "0", fullmove = "1"] = fen
    .trim()
    .split(/\s+/);

  if (!side || !castling || !ep)
    throw new Error(`FEN needs at least 4 fields: ${fen}`);

  const n = Number(halfmove);

  if (!Number.isInteger(n) || n < 0)
    throw new Error(`Bad halfmove clock: ${halfmove}`);

  const f = +fullmove;

  if (!Number.isInteger(f) || f < 1)
    throw new Error("Full move counter should be a valid number");

  const validSides = ["w", "b"];

  if (!validSides.includes(side)) throw new Error("Invalid fen side passed");

  return [placement, side, castling, ep, halfmove, fullmove];
}

// REVERSE TO FEN utilities.
export function unParsePlacement(board: Int8Array): string {
  const ranks: string[] = [];

  for (let rank = 7; rank >= 0; rank--) {
    let row = "";
    let empty = 0;

    for (let file = 0; file < 8; file++) {
      const piece = board[rank * 8 + file];

      if (piece === Piece.Empty) {
        empty++;

        continue;
      }

      if (empty) {
        row += empty;
        empty = 0;
      }

      row += FEN_PIECE_CHARS[piece - 1];
    }

    if (empty) row += empty;

    ranks.push(row);
  }

  return ranks.join("/");
}

export function unParseCastling(castling: number) {
  if (castling === 0) return "-";

  return Object.entries(CASTLING_CHARS).reduce((acc, [key, value]) => {
    if (value & castling) return acc + key;
    else return acc;
  }, "");
}
