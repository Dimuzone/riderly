// h2.js
// Tiny vdom impl for lightweight web interfaces.
// Optimized for browser inclusion.
//
// Exposes all tags from the WHATWG HTML Living Standard
// for use as h functions, e.g. p("Hello world!")
//
// Includes a patch function for updating DOM elements to match vnodes
//
(function (tags) {
	// Create contextualized h functions
	var EMPTY_OBJ = {}
	var EMPTY_ARR = []
	for (var i = 0; i < tags.length; i++) {
		let tag = tags[i]
		window[tag] = (function (h, tag) {
			return function (data, content) {
				if (data === undefined || Array.isArray(data)) {
					content = data
					data = EMPTY_OBJ
				}
				if (content === undefined) {
					content = EMPTY_ARR
				} else if (!Array.isArray(content)) {
					content = [ content ]
				}
				return h(tag, data, content)
			}
		})(h, tag)
	}

	window.patch = patch

	// h(tag, data, [ vnode | prim ]) -> vnode
	// Creates a vnode.
	function h(tag, data, content) {
		return {
			tag: tag,
			data: data,
			content: content
		}
	}

	// manifest(vnode) -> Element
	// Converts a vnode to an HTML element.
	function manifest(node) {
		if (node instanceof Element) return node
		if (!node || typeof node !== "object") {
			return document.createTextNode(node)
		}
		let tag = node.tag
		let data = node.data
		let content = node.content
		let element = document.createElement(tag)
		for (let name in data) {
			let value = data[name]
			element[name] = value
			if (typeof value !== "function") {
				element.setAttribute(name, value)
			}
		}
		for (let i = 0; i < content.length; i++) {
			let child = manifest(content[i])
			element.appendChild(child)
		}
		return element
	}

	// patch(Element, vnode)
	// Updates an existing DOM element to match the given vnode.
	function patch(el, node) {
		let tag = el.tagName
		let data = el.attributes
		let content = el.childNodes

		// just create a new element if the new tag is different
		if (typeof tag !== typeof node.tag || tag !== node.tag.toUpperCase()) {
			let newel = manifest(node)
			if (el.parentNode) {
				el.parentNode.replaceChild(newel, el)
			}
			return newel
		}

		// remove attributes on old element
		// if they are missing from new node
		for (let i = 0; i < data.length; i++) {
			let attr = data[i]
			let attrid = attr.name
			if (!node.data[attrid]) {
				el.removeAttribute(attrid)
			}
		}

		// add new node attributes to old element
		// if they are missing from old element
		for (let attrid in node.data) {
			let attrval = node.data[attrid]
			if (typeof attrval === "function") {
				if (el[attrid] === attrval) continue
				el[attrid] = attrval
			} else if (el.getAttribute(attrid) !== attrval.toString()) {
				el.setAttribute(attrid, attrval)
			}
		}

		// remove extra children from old element
		// if they are missing from new element
		// TODO: determine if there's a faster way
		//   to find which elements were removed
		while (content.length > node.content.length) {
			el.removeChild(content[content.length - 1])
		}

		for (let i = 0; i < content.length; i++) {
			let child = content[i]
			if (child instanceof Text && !child.data.trim()) {
				el.removeChild(child)
			}
		}

		// patch remaining children
		for (let i = 0; i < node.content.length; i++) {
			let child = content[i]
			let newchild = node.content[i]
			if (!child) {
				// nothing to patch, add a new element
				el.appendChild(manifest(newchild))
			} else if (child instanceof Element || typeof newchild === "object") {
				// general situation: patch child to reflect new child data
				patch(child, newchild)
			} else if (child.data !== newchild) {
				// for textnode: just change content
				child.data = newchild
			}
		}

		return el
	}
})([
	"a", "abbr", "address", "area", "article", "aside", "audio", "b", "base",
	"bdi", "bdo", "blockquote", "body", "br", "button", "canvas", "caption",
	"cite", "code", "col", "colgroup", "data", "datalist", "dd", "del", "details",
	"dfn", "dialog", "div", "dl", "dt", "em", "embed", "fieldset", "figcaption",
	"figure", "footer", "form", "h1", "h2", "h3", "h4", "h5", "h6", "head",
	"header", "hgroup", "hr", "html", "i", "iframe", "img", "input", "ins", "kbd",
	"label", "legend", "li", "link", "main", "map", "mark", "math", "menu",
	"meta", "meter", "nav", "noscript", "object", "ol", "optgroup", "option",
	"output", "p", "param", "picture", "pre", "progress", "q", "rp", "rt", "ruby",
	"s", "samp", "script", "section", "select", "slot", "small", "source", "span",
	"strong", "style", "sub", "summary", "sup", "svg", "table", "tbody", "td",
	"template", "textarea", "tfoot", "th", "thead", "time", "title", "tr",
	"track", "u", "ul", "video", "wbr"
])
