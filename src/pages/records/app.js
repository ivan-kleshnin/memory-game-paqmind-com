let {div, h1, p} = require("@cycle/dom")

let menu = require("../../chunks/menu")

module.exports = function (src) {
  let DOM = src.navi.map((navi) => {
    return div([
      h1("Records"),
      menu({navi}),
      p(["[records]"])
    ])
  })

  return {DOM}
}
