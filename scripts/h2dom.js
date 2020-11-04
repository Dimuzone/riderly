// h2dom.js
// HTML tag prep for optimized for browser include
//
// Exposes a subset of HTML tags from the WHATWG HTML Living Standard
// for use as h functions, e.g. p([ "Hello world!" ])
//
(function (tags) {
	var EMPTY_OBJ = {}
	var EMPTY_ARR = []
	for (var tag of tags) {
		window[tag] = (function (h, tag) {
			return function (data, content) {
				return data === undefined || Array.isArray(data)
					? h(tag, EMPTY_OBJ, data || EMPTY_ARR)
					: h(tag, data, content || EMPTY_ARR)
			}
		})(h, tag)
	}

	function h(tag, data, content) {
		var el = document.createElement(tag)
		for (var attrid in data) {
			var attrval = data[attrid]
			el[attrid] = attrval
			if (typeof attrval !== "function") {
				el.setAttribute(attrid, attrval)
			}
		}
		for (var i = 0; i < content.length; i++) {
			var child = content[i]
			if (!child || typeof child !== "object") {
				child = document.createTextNode(child)
			}
			el.appendChild(child)
		}
		return el
	}
})([
	"main", "header", "footer", "div",
	"ul", "li", "p", "span", "button", "input"
])
