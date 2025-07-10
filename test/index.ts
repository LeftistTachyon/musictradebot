import { randomInt } from "crypto";

const users = [...Array(4).keys()];
// console.log(users);

// create random trade graph
const fromUnchosen = users.slice(),
  toUnchosen = users.slice(),
  trades: { from: number; to: number }[] = [];
while (fromUnchosen.length > 2) {
  let fromIdx, toIdx;
  do {
    fromIdx = randomInt(fromUnchosen.length);
    toIdx = randomInt(toUnchosen.length);
  } while (fromUnchosen[fromIdx] === toUnchosen[toIdx]);

  trades.push({
    from: fromUnchosen.splice(fromIdx, 1)[0],
    to: toUnchosen.splice(toIdx, 1)[0],
  });
}
// ensure no lone wolf at end
const included = toUnchosen.filter((a) => fromUnchosen.includes(a)),
  excluded = toUnchosen.filter((a) => !fromUnchosen.includes(a));
switch (included.length) {
  case 2:
    // A <=> B
    trades.push({ from: included[0], to: included[1] });
    trades.push({ from: included[1], to: included[0] });
    break;
  case 1:
    // A => B => C
    if (fromUnchosen[0] === included[0]) {
      trades.push({ from: fromUnchosen[0], to: excluded[0] });
      trades.push({ from: fromUnchosen[1], to: included[0] });
    } else {
      trades.push({ from: fromUnchosen[1], to: excluded[0] });
      trades.push({ from: fromUnchosen[0], to: included[0] });
    }
    break;
  case 0:
    // A => B, C => D
    trades.push({
      from: fromUnchosen.splice(randomInt(fromUnchosen.length), 1)[0],
      to: toUnchosen.splice(randomInt(toUnchosen.length), 1)[0],
    });
    trades.push({ from: fromUnchosen[0], to: toUnchosen[0] });
    break;
  default:
    throw new Error("invalid trade state");
}

console.log(trades);
