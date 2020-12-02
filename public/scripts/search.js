const {
  getrts, patch, filter, kwsplit, normname,
  div, a, span, strong
} = window

const $input = document.querySelector('.search-input')
const $results = document.querySelector('.search-results')

const state = {
  routes: JSON.parse(window.localStorage.routes || '[]'),
  search: JSON.parse(window.sessionStorage.search || null) || {
    query: '',
    results: []
  }
}

;(async function main () {
  const routes = await getrts()
  state.routes = routes.map(route =>
    ({ ...route, name: normname(route.name) }))

  update()

  $input.oninput = _ => {
    const query = $input.value
    const keywords = kwsplit(query)
    const results = !query ? [] : filter(state.routes, keywords)
    update({ search: { ...state.search, query, keywords, results } })
  }
})()

function update (data) {
  Object.assign(state, data)
  patch($results, Results(state))
}

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

function Result (route, keywords) {
  const name = route.id + ' ' + route.name
  const tokens = tokenize(name, keywords)
  return a({ class: 'result' }, [
    span({ class: 'icon -route material-icons-outlined' },
      'directions_bus'),
    span({ class: 'result-name' },
      tokens.map(token =>
        keywords.includes(token.toUpperCase()) ? strong(token) : token))
  ])
}

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
