console.log("Dividend Monster started!");

const game = {
  money: 0,
  dividend: 100,
  level: 1
};

function collectDividend() {
  game.money += game.dividend;
  console.log("Money:", game.money);
}

setInterval(collectDividend, 5000);
