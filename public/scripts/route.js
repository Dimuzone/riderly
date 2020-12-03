const {
  getrts, getstns, fmtstn, normname, L: Leaflet, kwsplit, filter: filterBy,
  patch, main, header, div, h1, h2, span, a, button, input
} = window

const $main = document.querySelector('main')
let $input = null

const state = {
  stations: JSON.parse(window.localStorage.stations || '[]'),
  routes: JSON.parse(window.localStorage.routes || '[]'),
  search: JSON.parse(window.sessionStorage.search || '{}'),
  filter: JSON.parse(window.sessionStorage.filter || null) || {
    query: '',
    keywords: [],
    results: []
  },
  path: null
}

;(async function init () {
  const rtid = window.location.hash.slice(1)

  state.routes = await getrts()
  const route = state.routes.find(rt => rt.id === rtid)
  if (!route) {
    return patch($main, 'not found')
  }

  route.path = await getstns(route.path)
  if (!route.path.length) {
    return patch($main, 'not found')
  }

  update({ route })

  const startstn = route.path[0]
  const startpos = [startstn.lat, startstn.long]
  const endstn = route.path[route.path.length - 1]
  const endpos = [endstn.lat, endstn.long]

  // mount map
  const map = Leaflet.mount('map')

  // route line
  const line = Leaflet.polyline(route.path.map(station => [station.lat, station.long]), {
    color: 'rgba(0, 0, 255, 0.5)'
  }).addTo(map)

  // adjust zoom
  map.fitBounds(line.getBounds())
  setTimeout(_ => map.zoomOut(0.5), 300)

  // start marker
  Leaflet.marker(startpos)
    .addTo(map)
    .bindTooltip('<strong>' + fmtstn(startstn.name)[0] + '</strong>')
    .openTooltip()

  // end marker
  Leaflet.marker(endpos)
    .addTo(map)
    .bindTooltip('<strong>' + fmtstn(endstn.name)[0] + '</strong>')
    .openTooltip()
})()

function update (data) {
  Object.assign(state, data)
  patch($main, RoutePage(state))
  if (!$input) {
    $input = document.querySelector('.search-input')
    if (state.filter) $input.value = state.filter.query
  }
}

const RoutePage = (state) => {
  const { route, search, filter } = state
  const stations = route.path

  const oninput = evt => {
    const query = $input.value
    const keywords = kwsplit(query)
    const results = !query ? [] : filterBy(stations, keywords)
    update({ filter: { ...state.filter, query, keywords, results } })
  }

  return main({ class: `page -route -${route.id}` }, [
    header({ class: 'header -color -primary' }, [
      div({ class: 'header-text' }, [
        div({ class: 'title-row' }, [
          h1({ class: 'title -small' }, `${route.number} ${normname(route.name)}`),
          button({ class: 'back', onclick: _ => window.history.back() }, [
            span({ class: 'icon -back material-icons' },
              'keyboard_arrow_left'),
            search.query ? 'Search' : 'Home'
          ])
        ]),
        h2({ class: 'subtitle' }, `Route ${route.number}${route.pattern}`)
      ])
    ]),
    div({ id: 'map', key: 'map' }),
    !stations.length
      ? null
      : div({ class: 'section -stops' }, [
        div({ class: 'section-header' }, [
          h2({ class: 'section-title' }, 'Route Overview'),
          span({ class: 'section-subtitle' },
            filter.query
              ? `${filter.results.length} stops for "${filter.query}"`
              : `${stations.length} stops`)
        ]),
        div({ class: 'section-content' }, [
          div({ class: 'search search-bar' }, [
            span({ class: 'icon -search material-icons' },
              'search'),
            input({
              id: 'filter',
              class: 'search-input',
              placeholder: 'Filter stations',
              autocomplete: 'off',
              oninput
            }),
            filter.query
              ? span({ class: 'icon -close material-icons', onclick: evt => evt },
                  'close')
              : null
          ]),
          div({ class: 'stations' },
            (filter.query ? filter.results : stations).map(stn => Station(stn, route)))
        ])
      ])
  ])
}

const Station = (station, route) => {
  const [name, subname] = fmtstn(station.name)
  const desc = `${station.id} · ${subname}`
  const href = `station.html#${route.id}/${station.id}`
  return a({ class: 'station -' + station.id, href }, [
    div({ class: 'station-lhs' }, [
      div({ class: 'station-meta' }, [
        span({ class: 'station-name' }, name),
        span({ class: 'station-desc' }, desc)
      ])
    ]),
    span({ class: 'stop-rhs material-icons' },
      'keyboard_arrow_right')
  ])
}
