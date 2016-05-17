let {div, h4, p} = require("@cycle/dom")
let {header, footer, menu} = require("./common")

module.exports = (navi) => {
  return div("#wrapper", [
    header(navi),

    div("#content.container.text.holder.center", [
      h4("Not Found"),

      p(`
        No luck, pal?
      `),
    ]),

    footer()
  ])
}
