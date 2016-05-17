let {div, p} = require("@cycle/dom")
let {header, footer, menu} = require("./common")

module.exports = (navi) => {
  return div("#wrapper", [
    header(navi), 

    p("[records]"),

    footer()
  ])
}
