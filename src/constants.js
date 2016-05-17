let openDelayMs = 1000

let timePerCardS = 4

let presets = {
  nano: {
    boardSize: [2, 3],
    timeout: (2 * 2) * timePerCardS,
  },

  small: {
    boardSize: [4, 4],
    timeout: (4 * 4) * timePerCardS,
  },

  normal: {
    boardSize: [4, 6],
    timeout: (4 * 6) * timePerCardS,
  },

  big: {
    boardSize: [5, 8],
    timeout: (5 * 8) * timePerCardS,
  }
}


exports.openDelayMs = openDelayMs
exports.presets = presets
