export function getFileFromSquare(square: number) {
  return square % 8;
}

export function getRankFromSquare(square: number) {
  return Math.floor(square / 8);
}
