import { Side } from "./piece.ts";

export const KNIGHT_MOVEMENT_OFFSETS = [
  6, -6, 10, -10, 15, -15, 17, -17,
] as const;
export const KING_MOVEMENT_OFFSETS = [1, -1, 7, -7, 8, -8, 9, -9] as const;
export const BISHOP_MOVEMENT_DIRECTIONS = [7, -7, 9, -9] as const;
export const ROOK_MOVEMENT_DIRECTIONS = [1, -1, 8, -8] as const;
export const PAWN_ATTACK_OFFSETS = {
  [Side.Black]: [-7, -9],
  [Side.White]: [7, 9],
} as const;
export const PAWN_MOVEMENT_OFFSET = {
  [Side.Black]: -8,
  [Side.White]: 8,
} as const;

export const KING_MAX_FILE_DIFF = 1;
export const KNIGHT_MAX_FILE_DIFF = 2;
