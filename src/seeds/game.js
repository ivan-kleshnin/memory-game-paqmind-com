let {BOARD_SIZE} = require("../constants")
let {randomLetterBoard} = require("../makers")

let seeds = {
  lockedForAnimation: false,
  board: randomLetterBoard(...BOARD_SIZE),
}

module.exports = seeds
