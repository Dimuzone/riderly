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
  const EMPTY_OBJ = {}
  for (let i = 0; i < tags.length; i++) {
    const tag = tags[i]
    window[tag] = (function (h, tag) {
      return function (data, content) {
        if (data === undefined || Array.isArray(data) || typeof data !== 'object') {
          content = data
          data = EMPTY_OBJ
        }
        if (content === undefined) {
          content = []
        } else if (!Array.isArray(content)) {
          content = [content]
        }
        return h(tag, data, content)
      }
    })(h, tag)
  }

  window.patch = patch

  // h(tag, data, [ vnode | prim ]) -> vnode
  // Creates a vnode.
  function h (tag, data, content) {
    return {
      tag: tag,
      data: data,
      content: content
    }
  }

  // manifest(vnode) -> Element
  // Converts a vnode to an HTML element.
  function manifest (node) {
    if (node instanceof window.Element) return node
    if (!node || typeof node !== 'object') {
      return document.createTextNode(node)
    }
    const tag = node.tag
    const data = node.data
    const content = node.content
    const element = document.createElement(tag)
    for (const name in data) {
      const value = data[name]
      element[name] = value
      if (typeof value !== 'function') {
        element.setAttribute(name, value)
      }
    }
    for (let i = 0; i < content.length; i++) {
      if (content[i] == null) continue
      const child = manifest(content[i])
      element.appendChild(child)
    }
    return element
  }

  // patch(Element, vnode)
  // Updates an existing DOM element to match the given vnode.
  function patch (el, node) {
    if (!(el instanceof window.Element || el instanceof window.Text)) {
      throw new Error('Patch operation failed: Provided target is not an Element or Text node')
    }

    if (Array.isArray(node)) {
      throw new Error('Patch operation failed: Cannot patch from an array of nodes')
    }

    const tag = el.tagName
    const data = el.attributes
    const content = el.childNodes

    // just create a new element if the new tag is different
    if (!tag || typeof tag !== typeof node.tag ||
    tag !== node.tag.toUpperCase() || el.key !== node.data.key) {
      const newel = manifest(node)
      if (el.parentNode) {
        el.parentNode.replaceChild(newel, el)
      }
      return newel
    }

    // leave keyed elements alone
    if (el.key) return el

    // remove attributes on old element
    // if they are missing from new node
    for (let i = 0; i < data.length; i++) {
      const attr = data[i]
      const attrid = attr.name
      if (!node.data[attrid]) {
        el.removeAttribute(attrid)
      }
    }

    // add new node attributes to old element
    // if they are missing from old element
    for (const propname in node.data) {
      const propval = node.data[propname]
      if (typeof propval === 'function') {
        if (el[propname] === propval) continue
        el[propname] = propval
      } else if (propname === 'key') {
        el.key = propval
      } else if (el.getAttribute(propname) !== propval.toString()) {
        el.setAttribute(propname, propval)
      }
    }

    // ignore whitespace in old element
    for (let i = 0; i < content.length; i++) {
      const child = content[i]
      if (child instanceof window.Text && !child.data.trim()) {
        el.removeChild(child)
      }
    }

    // remove null children in new node
    for (let i = 0; i < node.content.length; i++) {
      if (node.content[i] == null) {
        node.content.splice(i--, 1)
      }
    }

    // remove extra children from old element
    // if they are missing from new element
    // TODO: determine if there's a faster way
    //   to find which elements were removed
    while (content.length > node.content.length) {
      el.removeChild(content[content.length - 1])
    }

    // patch remaining children
    for (let i = 0; i < node.content.length; i++) {
      const child = content[i]
      const newchild = node.content[i]
      if (!child) {
        // nothing to patch, add a new element
        el.appendChild(manifest(newchild))
      } else if (child instanceof window.Element || typeof newchild === 'object') {
        // general situation: patch existing child to reflect new child data
        patch(child, newchild)
      } else if (child.data !== newchild) {
        // for textnode: just change content
        child.data = newchild
      }
    }

    return el
  }
})([
  'a', 'abbr', 'address', 'area', 'article', 'aside', 'audio', 'b', 'base',
  'bdi', 'bdo', 'blockquote', 'body', 'br', 'button', 'canvas', 'caption',
  'cite', 'code', 'col', 'colgroup', 'data', 'datalist', 'dd', 'del', 'details',
  'dfn', 'dialog', 'div', 'dl', 'dt', 'em', 'embed', 'fieldset', 'figcaption',
  'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'head',
  'header', 'hgroup', 'hr', 'html', 'i', 'iframe', 'img', 'input', 'ins', 'kbd',
  'label', 'legend', 'li', 'link', 'main', 'map', 'mark', 'math', 'menu',
  'meta', 'meter', 'nav', 'noscript', 'object', 'ol', 'optgroup', 'option',
  'output', 'p', 'param', 'picture', 'pre', 'progress', 'q', 'rp', 'rt', 'ruby',
  's', 'samp', 'script', 'section', 'select', 'slot', 'small', 'source', 'span',
  'strong', 'style', 'sub', 'summary', 'sup', 'svg', 'table', 'tbody', 'td',
  'template', 'textarea', 'tfoot', 'th', 'thead', 'time', 'title', 'tr',
  'track', 'u', 'ul', 'video', 'wbr'
])
