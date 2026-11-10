import { Castling } from "./pieces.ts";

export class Position {
  board = new Int8Array(64);
  sideToMove = 0;
  castling = 0b1111;
  halfmoveClock = 0;
  epSquare = -1;
  fullmoveNumber = 0;

  static fromFen(fen: string): Position {
    const [placement, side, castling, ep, halfmove = "0", fullmove = "1"] = fen
      .trim()
      .split(/\s+/);

    if (!side || !castling || !ep)
      throw new Error(`FEN needs at least 4 fields: ${fen}`);

    const position = new Position();

    parsePlacement(placement, position.board);

    position.sideToMove = side === "b" ? 1 : 0;
    position.castling = parseCastling(castling);
    position.epSquare = parseSquare(ep);
    position.halfmoveClock = Number(halfmove);
    position.fullmoveNumber = Number(fullmove);

    return position;
  }

  static toFen(position: Position): string {
    // TBD
  }
}

const FEN_PIECE_CHARS = "PNBRQKpnbrqk"; // indexOf(ch) + 1 === Piece value

function parsePlacement(placement: string, board: Int8Array) {
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

function parseCastling(castling: string): number {
  if (castling === "-") return 0b0000;

  let value = 0b0000;

  for (const char of castling) {
    const bit = CASTLING_CHARS[char];

    if (bit === undefined) throw new Error(`Bad castling field: ${castling}`);

    value |= bit;
  }

  return value;
}

//example is converting a1 to 0 and e3 to 20

function parseSquare(square: string): number {
  if (square === "-") return -1;

  const file = square.charCodeAt(0) - 97; // "a" -> 0
  const rank = square.charCodeAt(1) - 49; // "1" -> 0

  if (square.length !== 2 || file < 0 || file > 7 || rank < 0 || rank > 7) {
    throw new Error(`Bad square: ${square}`);
  }

  return rank * 8 + file;
}
