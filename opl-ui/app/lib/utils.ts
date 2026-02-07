/**
 * Calculate match weights based on the rating difference between two players.
 * The higher-rated player gets the higher weight (more balls to pocket).
 *
 * @param player1Rating - Rating of player 1
 * @param player2Rating - Rating of player 2
 * @returns Tuple of [player1Weight, player2Weight]
 */
export const getMatchWeight = (
  player1Rating: number,
  player2Rating: number
): [number, number] => {
  const diff = Math.abs(player1Rating - player2Rating);

  let highWeight: number;
  let lowWeight: number;

  if (diff <= 50) {
    [highWeight, lowWeight] = [8, 8];
  } else if (diff <= 100) {
    [highWeight, lowWeight] = [8, 7];
  } else if (diff <= 150) {
    [highWeight, lowWeight] = [9, 7];
  } else if (diff <= 200) {
    [highWeight, lowWeight] = [9, 6];
  } else if (diff <= 250) {
    [highWeight, lowWeight] = [10, 6];
  } else if (diff <= 300) {
    [highWeight, lowWeight] = [10, 5];
  } else if (diff <= 350) {
    [highWeight, lowWeight] = [11, 5];
  } else if (diff <= 400) {
    [highWeight, lowWeight] = [11, 4];
  } else {
    [highWeight, lowWeight] = [12, 4];
  }

  // Higher-rated player gets the higher weight
  if (player1Rating >= player2Rating) {
    return [highWeight, lowWeight];
  } else {
    return [lowWeight, highWeight];
  }
}
