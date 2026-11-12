import { Position } from "../src/position/position.ts";
import { perft } from "../src/movegen/perft.ts";

const CASES = [
  ["start", "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1", 5],
  [
    "kiwipete",
    "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1",
    4,
  ],
] as const;

for (const [name, fen, depth] of CASES) {
  // warm-up: let the JIT compile the hot paths before timing
  perft(Position.fromFen(fen), depth - 1);

  const position = Position.fromFen(fen);
  const start = performance.now();
  const nodes = perft(position, depth);
  const seconds = (performance.now() - start) / 1000;

  console.log(
    `${name} d${depth}: ${nodes.toLocaleString()} nodes in ${seconds.toFixed(2)}s` +
      ` = ${Math.round(nodes / seconds).toLocaleString()} nps`,
  );
}

/**
 * FIRST ATEMPT
 * start (depth 5): 4,865,609 nodes in 1.13s = 4,317,682 nps
 * kiwipete (depth 4): 4,085,603 nodes in 1.44s = 2,829,938 nps
 */
