const {
  patch, fmtstn, getstns,
  header, div, h1, button, span, a
} = window

const $main = document.querySelector('main')
const $header = document.querySelector('header')
const $form = document.querySelector('.report')

const state = {
  routes: JSON.parse(window.localStorage.routes || '[]'),
  station: null,
  path: null
}

;(async function init () {
  const [rtid, stnid] = window.location.hash.slice(1).split('/')
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
})()

// Reporting
$form.onsubmit = async event => {
  const formdata = new window.FormData(event.target)
  const seatStatus = formdata.get('seating')
  const timeStatus = formdata.get('timing')
  const maskStatus = formdata.get('masking')
  event.preventDefault()

  await window.db.collection('reports').add({
    author: 'guest',
    station: stationId,
    route: routeId,
    seating: seat.indexOf(seatStatus),
    timing: time.indexOf(timeStatus),
    masks: mask.indexOf(maskStatus),
    timestamp: Date.now()
  })

  window.history.back()
}

const Header = (station, route) =>
  header({ class: 'header header-text -color -primary' }, [
    div({ class: 'title-row' }, [
      h1({ class: 'title' }, 'Report changes'),
      button({ class: 'back', onclick: _ => window.history.back() }, [
        span({ class: 'icon -back material-icons' },
          'keyboard_arrow_left'),
        station.id
      ])
    ]),
    span({ class: 'subtitle' }, [
      fmtstn(station.name)[0],
      ' (', a({ href: 'route.html#' + route.id }, route.id), ')'
    ])
  ])
