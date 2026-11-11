import { Side } from "../board/piece.ts";
import { parseSquare, unParseSquare } from "../board/square.ts";
import {
  parseCastling,
  parsePlacement,
  unParseCastling,
  unParsePlacement,
  splitFen,
} from "./fen.ts";

export class Position {
  board = new Int8Array(64);
  sideToMove = Side.White as Side;
  castling = 0b0000;
  halfmoveClock = 0;
  epSquare = -1;
  fullmoveNumber = 1;

  static fromFen(fen: string): Position {
    const [placement, side, castling, ep, halfmove, fullmove] = splitFen(fen);

    const position = new Position();

    parsePlacement(placement, position.board);

    position.sideToMove = side === "b" ? Side.Black : Side.White;
    position.castling = parseCastling(castling);
    position.epSquare = parseSquare(ep);
    position.halfmoveClock = Number(halfmove);
    position.fullmoveNumber = Number(fullmove);

    return position;
  }

  static toFen(position: Position): string {
    const placement = unParsePlacement(position.board);
    const side = position.sideToMove === Side.Black ? "b" : "w";
    const castling = unParseCastling(position.castling);
    const ep = unParseSquare(position.epSquare);
    const halfMove = position.halfmoveClock;
    const fullMove = position.fullmoveNumber;

    return [placement, side, castling, ep, halfMove, fullMove].join(" ");
  }
}
