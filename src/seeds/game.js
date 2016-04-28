let {BOARD_SIZE} = require("../constants")
let {randomLetterBoard} = require("../makers")

let seeds = {
  board: randomLetterBoard(...BOARD_SIZE),
}

module.exports = seeds
