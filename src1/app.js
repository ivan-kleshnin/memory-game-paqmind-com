var VNode = require("virtual-dom").VNode
var createElement = require("virtual-dom").create

var Hook = function(){}
Hook.prototype.hook = function(elem, key, previousValue) {
  console.log("Hello from " + elem.id + "!\nMy key was: " + key, "value was", previousValue)
}

var tagName = "div"
var style = "width: 100px; height: 100px; background-color: #FF0000;"
var attributes = {style: style }
var key = "my-unique-red-box"
var properties = {
  attributes: attributes,
  className: "red box",
  id: "my-red-box",
  "a hook can have any property key": new Hook()
}
var childNode = new VNode("div", {id: "red-box-child"})

let RedBoxNode = new VNode(tagName, properties, [childNode], key)
let RedBoxElem = createElement(RedBoxNode)
document.body.appendChild(RedBoxElem)

// Will result in html that looks like
// <div class="red box" style="width: 100px; height: 100px; background-color: #FF0000;" id="my-red-box">
//   <div id="red-box-child"></div>
// </div>