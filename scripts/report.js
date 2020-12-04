// list deps (for standardjs)
const {
  patch, getrts, getstns, fmtstn,
  header, div, h1, button, span, a
} = window

// HTML refs
const $main = document.querySelector('main')
const $header = document.querySelector('header')
const $form = document.querySelector('.report')

// state defs
const state = {
  routes: JSON.parse(window.localStorage.routes || '[]'),
  reports: JSON.parse(window.sessionStorage.reports || '[]'),
  station: null,
  path: null
}

// init()
// logic entry point
;(async function init () {
  // extract data from hash
  const locid = window.location.hash.slice(1).split('/')
  const rtid = locid[0]
  const stnid = +locid[1]

  state.routes = await getrts()
  const route = state.routes.find(rt => rt.id === rtid)
  if (!route) {
    return patch($main, 'not found')
  }

  route.path = await getstns(route.path)
  const station = route.path.find(stn => stn.id === +stnid)
  if (!station) {
    return patch($main, 'not found')
  }

  patch($header, Header(station, route))

  // parse form contents and submit report
  $form.onsubmit = event => {
    // extract form data
    const formdata = new window.FormData(event.target)
    const seating = +formdata.get('seating')
    const timing = +formdata.get('timing')
    const masking = +formdata.get('masking')

    // prevent default form submission
    event.preventDefault()

    const report = {
      timestamp: Date.now(),
      author: 'guest',
      station: station.id,
      route: route.id,
      seating,
      timing,
      masking
    }

    // cache now since we aren't listening for reports on this page
    state.reports.push(report)
    window.sessionStorage.reports = JSON.stringify(state.reports)

    // add report to collection then go back to station page
    window.db.collection('reports').add(report)
      .then(_ => window.history.back())
  }
})()

// Header(station, route)
// component defining the HTML structure for the report page header
const Header = (station, route) =>
  header({ class: 'header header-text -color -primary' }, [
    div({ class: 'title-row' }, [
      h1({ class: 'title -small' }, 'Report changes'),
      button({ class: 'back', onclick: _ => window.history.back() }, [
        span({ class: 'icon -back material-icons' },
          'keyboard_arrow_left'),
        station.id
      ])
    ]),
    span({ class: 'subtitle' }, [
      fmtstn(station.name)[0],
      ' (', a({ href: 'route.html#' + route.id }, route.number + route.pattern), ')'
    ])
  ])
