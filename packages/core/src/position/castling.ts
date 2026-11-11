export const Castling = {
  WK: 0b0001,
  WQ: 0b0010,
  BK: 0b0100,
  BQ: 0b1000,
} as const;

/**
 * Rights kept after a move touches a square, indexed by square.
 * A move clears rights through both its from and to squares:
 * from covers the king or rook moving away, to covers a rook captured at home.
 * Usage: castling &= CASTLING_MASK[from] & CASTLING_MASK[to]
 */
export const CASTLING_MASK = new Uint8Array(64).fill(0b1111);

CASTLING_MASK[0] = 0b1111 & ~Castling.WQ; // a1
CASTLING_MASK[4] = 0b1111 & ~(Castling.WK | Castling.WQ); // e1
CASTLING_MASK[7] = 0b1111 & ~Castling.WK; // h1
CASTLING_MASK[56] = 0b1111 & ~Castling.BQ; // a8
CASTLING_MASK[60] = 0b1111 & ~(Castling.BK | Castling.BQ); // e8
CASTLING_MASK[63] = 0b1111 & ~Castling.BK; // h8
