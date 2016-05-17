let {div, h4, p} = require("@cycle/dom")
let {header, footer, menu} = require("./common")

module.exports = (navi) => {
  return div("#wrapper", [
    header(navi), 
    
    div("#content.text.center", [
      h4("Game Rules"),
      
      p(`
        You can consequently flip two cards, turning them face up.
        If both cards are equal, they are removed from the game. 
        If they are different, they are turned face down again.
      `),
  
      p(`
        You win if all cards are removed in time.
        You lose otherwise.
      `)
    ]), 
    
    footer()
  ])
}
