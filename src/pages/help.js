let {Observable: $} = require("rx")
let {render} = require("../rx.utils")
let view = require("../views/help")

module.exports = (src) => {
  return {
    title: $.of("Help | Memory Game"),
    
    DOM: render(view, [src.navi]),
  }
}
