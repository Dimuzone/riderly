// list deps (for standardjs)
const {
  getrts, patch, filter, kwsplit,
  div, a, span, strong
} = window

// HTML refs
const $input = document.querySelector('.search-input')
const $close = document.querySelector('.search-close')
const $results = document.querySelector('.search-results')

// state defs
const state = {
  routes: JSON.parse(window.localStorage.routes || '[]'),
  search: JSON.parse(window.sessionStorage.search || null) || {
    query: '',
    keywords: [],
    results: []
  }
}

// init()
// logic entry point
;(async function main () {
  // ensure routes have been loaded from db
  if (!state.routes.length) state.routes = await getrts()

  // initial render
  update()

  // fill in input if it contains a cached value
  if (state.search) {
    $input.value = state.search.query
  }

  // handle x button clicks
  $close.onclick = _ => {
    // clear input value and focus
    $input.value = ''
    $input.focus()

    // update search results
    update({ search: { ...state.search, query: '', keywords: [], results: [] } })

    // clear cache
    delete window.sessionStorage.search
  }

  // handle search input
  $input.oninput = _ => {
    const query = $input.value

    // get keywords from query
    const keywords = kwsplit(query)

    // generate search results if query is non-empty
    const results = !query ? [] : filter(state.routes, keywords)

    // extend state with partial state object
    const search = { ...state.search, query, keywords, results }

    // update html
    update({ search })

    // cache input
    window.sessionStorage.search = JSON.stringify(search)
  }
})()

// update(data)
// updates page state with a partial data patch,
// then updates the page html structure
function update (data) {
  Object.assign(state, data)
  patch($results, Results(state))

  // show or hide search bar x button based on whether or not a query exists
  $close.style.display = state.search.query ? 'block' : 'none'
}

// Results(state) -> vnode
// component defining the html structure for a list of search results
function Results (state) {
  const search = state.search
  const keywords = search.keywords
  return div({ class: 'search-results' },
    // only display results if a query exists
    !search.query
      ? null
      : [
          span({ class: 'results-count' },
            `Found ${search.results.length} results for "${search.query}"`),
          div({ class: 'results' },
            search.results.map(route => Result(route, keywords)))
        ])
}

// Result(route, str[]) -> vnode
// component defining the HTML structure for a search result
// uses keywords for text highlighting
function Result (route, keywords) {
  const name = route.number + ' ' + route.name
  const tokens = tokenize(name, keywords)
  return a({ class: 'result', href: 'route.html#' + route.id }, [
    span({ class: 'icon -route material-icons-outlined' },
      'directions_bus'),
    span({ class: 'result-name' },
      // highlight tokens that match keywords
      tokens.map(token =>
        keywords.includes(token.toUpperCase()) ? strong(token) : token))
  ])
}

// tokenize(str, str[]) -> str[]
// lexes a string into a list of strings separated by the provided keywords
function tokenize (string, keywords) {
  const tokens = []
  const source = string.toUpperCase()
  let i = 0
  while (i < string.length) {
    // find keyword closest to current index
    let match = null
    let matchidx = Infinity
    for (let k = 0; k < keywords.length; k++) {
      const kw = keywords[k]
      const idx = source.indexOf(kw, i)
      if (idx !== -1 && idx < matchidx) {
        match = kw
        matchidx = idx
      }
    }
    if (match) {
      // add a token for the text between the start index and the match found
      if (matchidx - i) tokens.push(string.slice(i, matchidx))

      // add keyword as its own token
      tokens.push(string.slice(matchidx, matchidx + match.length))

      // start index ends at end of match
      i = matchidx + match.length
    } else {
      // no tokens until the end of the string
      tokens.push(string.slice(i, string.length))
      break
    }
  }
  return tokens
}
