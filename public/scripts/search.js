const {
  getrts, patch, filter, kwsplit, normname,
  div, a, span, strong
} = window

const $input = document.querySelector('.search-input')
const $close = document.querySelector('.search-close')
const $results = document.querySelector('.search-results')

const state = {
  routes: JSON.parse(window.localStorage.routes || '[]'),
  search: JSON.parse(window.sessionStorage.search || null) || {
    query: '',
    keywords: [],
    results: []
  }
}

;(async function main () {
  const routes = await getrts()
  state.routes = routes.map(route =>
    ({ ...route, name: normname(route.name) }))

  update()

  if (state.search) {
    $input.value = state.search.query
  }

  $close.onclick = _ => {
    $input.value = ''
    $input.focus()
    update({ search: { ...state.search, query: '', keywords: [], results: [] } })
    delete window.sessionStorage.search
  }

  $input.oninput = _ => {
    const query = $input.value
    const keywords = kwsplit(query)
    const results = !query ? [] : filter(state.routes, keywords)
    const search = { ...state.search, query, keywords, results }
    update({ search })
    window.sessionStorage.search = JSON.stringify(search)
  }
})()

function update (data) {
  Object.assign(state, data)
  patch($results, Results(state))
  $close.style.display = state.search.query ? 'block' : 'none'
}

// Results(state) -> vnode
//
function Results (state) {
  const search = state.search
  const keywords = search.keywords
  return div({ class: 'search-results' },
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
      if (matchidx - i) tokens.push(string.slice(i, matchidx))
      tokens.push(string.slice(matchidx, matchidx + match.length))
      i = matchidx + match.length
    } else {
      tokens.push(string.slice(i, string.length))
      i = string.length
    }
  }
  return tokens
}
