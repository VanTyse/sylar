import { Piece, Side } from "../board/piece.ts";
import { parseSquare, unParseSquare } from "../board/square.ts";
import {
  getFromSquare,
  getMoveFlags,
  getPromotionIndex,
  getToSquare,
  isCapture,
  isPromotion,
  MoveFlag,
  type Move,
} from "../move/move.ts";
import {
  parseCastling,
  parsePlacement,
  unParseCastling,
  unParsePlacement,
  splitFen,
} from "./fen.ts";
import { CASTLING_MASK } from "./castling.ts";

export class Position {
  board = new Int8Array(64);
  sideToMove = Side.White as Side;
  castling = 0b0000;
  halfmoveClock = 0;
  epSquare = -1;
  fullmoveNumber = 1;

  private capturedStack = new Int8Array(1024);
  private castlingStack = new Uint8Array(1024);
  private epStack = new Int8Array(1024);
  private halfmoveStack = new Uint16Array(1024);
  private ply = 0;

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

  makeMove(encodedMove: Move): void {
    const board = this.board;
    const fromSquare = getFromSquare(encodedMove);
    const toSquare = getToSquare(encodedMove);
    const flags = getMoveFlags(encodedMove);
    const side = this.sideToMove;
    const piece = board[fromSquare];

    //save everything the encoded move and the board cannot tell you
    const ply = this.ply++;

    this.capturedStack[ply] = board[toSquare]; // Empty for quiet moves and en passant
    this.castlingStack[ply] = this.castling;
    this.epStack[ply] = this.epSquare;
    this.halfmoveStack[ply] = this.halfmoveClock;

    //move the piece
    board[toSquare] = piece;
    board[fromSquare] = Piece.Empty;

    //Handle special moves
    if (flags === MoveFlag.EnPassant) {
      const capturedPieceSquare = toSquare + (side === Side.White ? -8 : 8);

      board[capturedPieceSquare] = Piece.Empty;
    } else if (flags === MoveFlag.KingCastle) {
      const newRookSquare = fromSquare + 1;
      const oldRookSquare = fromSquare + 3;

      board[newRookSquare] = board[oldRookSquare];
      board[oldRookSquare] = Piece.Empty;
    } else if (flags === MoveFlag.QueenCastle) {
      const newRookSquare = fromSquare - 1;
      const oldRookSquare = fromSquare - 4;

      board[newRookSquare] = board[oldRookSquare];
      board[oldRookSquare] = Piece.Empty;
    } else if (isPromotion(encodedMove)) {
      const knight = side === Side.White ? Piece.WKnight : Piece.BKnight;

      const promotionPiece = knight + getPromotionIndex(encodedMove);

      board[toSquare] = promotionPiece;
    }

    this.epSquare =
      flags === MoveFlag.DoublePush
        ? toSquare + (side === Side.White ? -8 : 8)
        : -1;

    this.castling &= CASTLING_MASK[fromSquare] & CASTLING_MASK[toSquare];

    const isPawnMove = piece === Piece.WPawn || piece === Piece.BPawn;

    this.halfmoveClock =
      isPawnMove || isCapture(encodedMove) ? 0 : this.halfmoveClock + 1;

    if (side === Side.Black) this.fullmoveNumber++;

    this.sideToMove = (side ^ 1) as Side;
  }

  unmakeMove(encodedMove: Move): void {
    const board = this.board;
    const fromSquare = getFromSquare(encodedMove);
    const toSquare = getToSquare(encodedMove);
    const flags = getMoveFlags(encodedMove);
    const previousSide = (this.sideToMove ^ 1) as Side;
    const piece = board[toSquare];

    const ply = --this.ply;

    this.halfmoveClock = this.halfmoveStack[ply];
    this.castling = this.castlingStack[ply];
    this.epSquare = this.epStack[ply];

    const capturedPiece = this.capturedStack[ply];

    this.sideToMove = previousSide;

    board[fromSquare] = piece;
    board[toSquare] = capturedPiece;

    if (flags === MoveFlag.EnPassant) {
      const capturedPieceSquare =
        toSquare + (previousSide === Side.White ? -8 : 8);

      board[capturedPieceSquare] =
        previousSide === Side.White ? Piece.BPawn : Piece.WPawn;
    } else if (flags === MoveFlag.KingCastle) {
      const afterCastlingRookSquare = fromSquare + 1;
      const preCastlingRookSquare = fromSquare + 3;

      board[preCastlingRookSquare] = board[afterCastlingRookSquare];
      board[afterCastlingRookSquare] = Piece.Empty;
    } else if (flags === MoveFlag.QueenCastle) {
      const afterCastlingRookSquare = fromSquare - 1;
      const preCastlingRookSquare = fromSquare - 4;

      board[preCastlingRookSquare] = board[afterCastlingRookSquare];
      board[afterCastlingRookSquare] = Piece.Empty;
    } else if (isPromotion(encodedMove)) {
      board[fromSquare] =
        previousSide === Side.White ? Piece.WPawn : Piece.BPawn;
    }

    if (previousSide === Side.Black) this.fullmoveNumber--;
  }
}
