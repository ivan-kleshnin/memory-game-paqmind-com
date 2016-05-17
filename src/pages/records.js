let {Observable: $} = require("rx")
let {render} = require("../rx.utils")
let view = require("../views/records")

module.exports = (src) => {
  return {
    title: $.of("Records | Memory Game"),
    
    DOM: render(view, [src.navi]),
  }
}
