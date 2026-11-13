/**
 * UCI front end for the Sylar engine.
 *
 * Reads one command per line from stdin and answers on stdout, as described
 * in the UCI protocol. Only what a GUI needs to play a game is supported:
 * uci, isready, setoption (Depth), ucinewgame, position, go, quit.
 *
 * The engine searches to a fixed depth and ignores clock times for now, so
 * `stop` has no effect: the search always runs to completion.
 */
import { createInterface } from "node:readline";
import {
  formatMoveToUci,
  MATE_SCORE,
  NO_MOVE,
  parseUciMove,
  Position,
  searchRoot,
} from "@sylar/core";

const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const DEFAULT_DEPTH = 5;
const MAX_DEPTH = 10;

// mate scores are MATE_SCORE minus the plies to mate, so anything this
// close to MATE_SCORE is a forced mate rather than a material score
const MATE_THRESHOLD = MATE_SCORE - 1000;

let position = Position.fromFen(START_FEN);
let depth = DEFAULT_DEPTH;

function send(line: string): void {
  process.stdout.write(line + "\n");
}

function handlePosition(tokens: string[]): void {
  const movesIndex = tokens.indexOf("moves");
  const setup = movesIndex === -1 ? tokens : tokens.slice(0, movesIndex);
  const moves = movesIndex === -1 ? [] : tokens.slice(movesIndex + 1);

  if (setup[0] === "startpos") {
    position = Position.fromFen(START_FEN);
  } else if (setup[0] === "fen") {
    try {
      position = Position.fromFen(setup.slice(1).join(" "));
    } catch (error) {
      send(`info string invalid fen: ${(error as Error).message}`);
      return;
    }
  } else {
    send("info string expected 'startpos' or 'fen'");
    return;
  }

  for (const text of moves) {
    const move = parseUciMove(position, text);

    if (move === NO_MOVE) {
      send(`info string illegal move ${text}, ignoring the rest`);
      return;
    }

    position.makeMove(move);
  }
}

/** UCI reports mates in moves, not plies: positive if we mate, negative if we are mated. */
function formatScore(score: number): string {
  if (score >= MATE_THRESHOLD) {
    return `mate ${Math.ceil((MATE_SCORE - score) / 2)}`;
  }

  if (score <= -MATE_THRESHOLD) {
    return `mate -${Math.ceil((MATE_SCORE + score) / 2)}`;
  }

  return `cp ${score}`;
}

/** `go [depth N] [...]`: other parameters (wtime, movetime, ...) are ignored for now. */
function handleGo(tokens: string[]): void {
  const depthIndex = tokens.indexOf("depth");
  const searchDepth =
    depthIndex === -1 ? depth : clampDepth(Number(tokens[depthIndex + 1]));

  const start = performance.now();
  const { bestMove, score } = searchRoot(position, searchDepth);
  const ms = Math.round(performance.now() - start);

  if (bestMove === NO_MOVE) {
    // checkmate or stalemate: UCI's "null move"
    send("bestmove 0000");
    return;
  }

  send(`info depth ${searchDepth} score ${formatScore(score)} time ${ms}`);
  send(`bestmove ${formatMoveToUci(bestMove)}`);
}

/** `setoption name Depth value N` */
function handleSetOption(tokens: string[]): void {
  const nameIndex = tokens.indexOf("name");
  const valueIndex = tokens.indexOf("value");

  if (nameIndex === -1) return;

  const name = tokens
    .slice(nameIndex + 1, valueIndex === -1 ? undefined : valueIndex)
    .join(" ")
    .toLowerCase();

  if (name === "depth" && valueIndex !== -1) {
    depth = clampDepth(Number(tokens[valueIndex + 1]));
  }
}

function clampDepth(value: number): number {
  if (!Number.isInteger(value)) return depth;

  return Math.min(Math.max(value, 1), MAX_DEPTH);
}

function handleCommand(line: string): void {
  const tokens = line.trim().split(/\s+/);
  const [command, ...args] = tokens;

  switch (command) {
    case "uci":
      send("id name Sylar");
      send("id author Vantyse");
      send(
        `option name Depth type spin default ${DEFAULT_DEPTH} min 1 max ${MAX_DEPTH}`,
      );
      send("uciok");
      break;
    case "isready":
      send("readyok");
      break;
    case "setoption":
      handleSetOption(args);
      break;
    case "ucinewgame":
      position = Position.fromFen(START_FEN);
      break;
    case "position":
      handlePosition(args);
      break;
    case "go":
      handleGo(args);
      break;
    case "d":
      // not UCI: prints the current position, handy when testing by hand
      send(Position.toFen(position));
      break;
    case "quit":
      process.exit(0);
    // unknown commands are ignored, as the protocol requires
  }
}

createInterface({ input: process.stdin }).on("line", handleCommand);
