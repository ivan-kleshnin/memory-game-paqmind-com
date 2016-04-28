let {boardSize} = require("../rules")
let {randomLetterBoard} = require("../makers")

let seeds = {
  board: randomLetterBoard(...boardSize),
}

module.exports = seeds
