# Sylar

A chess engine written from scratch in TypeScript. The goal is to reach at least 2400 Elo and keep improving from there, with every gain measured rather than guessed.

**Play it on Lichess:** [@sylarbot](https://lichess.org/@/sylarbot) plays rated blitz and rapid games against other bots, and you can challenge it.

## Strength history

Each version is tagged in git, so every rating below can be traced to the exact code that earned it.

| Version                                                | Date       | Change                                                                | Lichess blitz | Lichess rapid |
| ------------------------------------------------------ | ---------- | --------------------------------------------------------------------- | ------------- | ------------- |
| [v0.1.0](https://github.com/VanTyse/sylar/tree/v0.1.0) | 2026-11-13 | First release: alpha-beta search to depth 5, material-only evaluation | pending       | pending       |

Ratings are recorded after at least 50 games per version. Lichess bot ratings are measured against other bots, so they are not comparable to human ratings, but they are public and consistent over time. From the next version on, each strength change will also be tested by self-play against the previous version before it goes live.

## What's inside (v0.1.0)

- **Board:** a flat 64-square `Int8Array` (a1 = 0, h8 = 63). Pieces are small integers, not objects.
- **Moves:** packed into 16-bit integers (from square, to square, flags), so generating moves allocates nothing.
- **Move generation:** pseudo-legal moves for every piece, including castling, en passant and promotion. Legality is checked by playing the move and testing whether the king is attacked.
- **Make/unmake:** a single position is updated in place during search, with an undo stack holding what can't be recomputed.
- **Search:** negamax with alpha-beta pruning. Mate scores prefer the fastest mate, and stalemate is scored as a draw.
- **Evaluation:** material only.
- **UCI:** [`apps/uci`](apps/uci) speaks the standard engine protocol, so Sylar works in any chess GUI and on Lichess. It picks the search depth from the time left on the clock.

### Known weaknesses

These are the next things to fix (see [Roadmap](#roadmap)):

- **Horizon blunders.** The search stops at a fixed depth, sometimes in the middle of an exchange, and misjudges who wins the material.
- **Odd opening moves.** Material-only evaluation sees most moves as equal, so it plays moves like 1. b3 and 2. Na3.
- **Can't convert some won endgames.** It finds mates within its search depth, but has no plan for longer ones.
- **No repetition detection.** It can repeat moves in a winning position until the game is drawn.

## Correctness

Move generation is verified with perft: counting every legal move sequence to a fixed depth and comparing with published reference counts. All of these match:

| Position                                  | Depth | Nodes     |
| ----------------------------------------- | ----- | --------- |
| Start position                            | 5     | 4,865,609 |
| Kiwipete                                  | 4     | 4,085,603 |
| Position 3                                | 5     | 674,624   |
| Position 4 (and its color-swapped mirror) | 4     | 422,333   |
| Position 5                                | 4     | 2,103,487 |
| Position 6                                | 4     | 3,894,594 |

The search is tested against a plain negamax reference with no pruning. Alpha-beta has to return exactly the same scores, so any pruning bug shows up as a mismatch.

## Performance

Perft speed (move generation, make/unmake and legality checks), on an Apple M5 with Node 24.18.1:

| Version | Start position, depth 5 | Kiwipete, depth 4 |
| ------- | ----------------------- | ----------------- |
| v0.1.0  | 4.3M nodes/s            | 2.8M nodes/s      |

## Running it

Requires Node 22.18+ or 24+, which runs TypeScript directly without a build step, and [pnpm](https://pnpm.io).

```sh
pnpm install
pnpm vitest run                         # all tests
node packages/core/benchmarks/perft.ts  # perft speed
```

To play against it, add `apps/uci/sylar.sh` as a UCI engine in a chess GUI such as [En Croissant](https://encroissant.org) or [Cute Chess](https://github.com/cutechess/cutechess). You can also talk to it directly. Start it, then type UCI commands:

```sh
node apps/uci/src/main.ts
```

```
uci
position startpos moves e2e4
go depth 5
```

It replies with its evaluation and `bestmove`.

## Repository layout

```
packages/core/   the engine: board, move generation, search, evaluation
apps/uci/        command-line UCI front end, used by GUIs and the Lichess bot
apps/web/        web app (planned): play in the browser, with an AI chess coach
```

`core` has no runtime dependencies and no Node or browser APIs, so the same engine code runs in the terminal, on Lichess and in a browser Web Worker.

## Roadmap

1. **Quiescence search:** keep searching captures past the depth limit to stop horizon blunders.
2. **Piece-square tables:** positional knowledge, such as developing pieces and centralizing the king in endgames.
3. **Iterative deepening and time management:** search deeper when there is time, which also helps convert won endgames.
4. **Move ordering and a transposition table:** search fewer positions to reach the same depth.
5. **Repetition and 50-move rule detection.**
6. **Web app:** play in the browser, with an AI coach that explains the engine's analysis. The engine is the source of truth: the coach only explains lines the engine actually calculated.
