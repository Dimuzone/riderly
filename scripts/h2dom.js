(tags => {
	const h = (tag, data, content) => {
		let el = document.createElement(tag)
		for (let attrid in data) {
			let attrval = data[attrid]
			el[attrid] = attrval
			if (typeof attrval !== "function") {
				el.setAttribute(attrid, attrval)
			}
		}
		for (let i = 0; i < content.length; i++) {
			let child = content[i]
			if (!child || typeof child !== "object") {
				child = document.createTextNode(child)
			}
			el.appendChild(child)
		}
		return el
	}

	const EMPTY_OBJ = {}
	for (let tag of tags) {
		window[tag] = (data, content) =>
			data === undefined || Array.isArray(data)
				? h(tag, EMPTY_OBJ, data)
				: h(tag, data, content)
	}
})([
	"main", "header", "footer", "div",
	"ul", "li", "p", "span", "button", "input"
])
