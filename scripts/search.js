const { db, patch, div, p, span } = window
const search = document.getElementById('search-bar')
const routewrap = document.getElementById('routes')

const state = { routes: [] }

;(async function main () {
  let routes = JSON.parse(window.localStorage.getItem('routes'))
  if (!routes) {
    // Get all routes from Firestore and rerender
    routes = []
    const col = await db.collection('routes').get()
    for (const doc of col.docs) {
      routes.push({ ...doc.data(), id: doc.id })
    }
    window.localStorage.setItem('routes', JSON.stringify(routes))
  }
  state.routes = routes
  render(state)

  search.oninput = _ => {
    state.routes = routes.filter(route =>
      (route.id + route.name).includes(search.value))
    render(state)
  }
})()

function render (state) {
  patch(routewrap,
    div({ class: 'routes' }, state.routes.map(renderRoute)))
}

// Defines the HTML structure for a single bus route
function renderRoute (route) {
  function onclick () {
    window.sessionStorage.setItem('route', route.id)
    window.sessionStorage.setItem('stations_Id', route.path)
    window.sessionStorage.setItem('endingStation', route.name)
    window.location.href = 'route.html'
  }
  return div({ class: 'option', onclick }, [
    div({ class: 'option-data' }, [
      p({ class: 'option-text' }, route.id),
      div({ class: 'option-subtext' }, route.name)
    ]),
    span({ class: 'option-icon material-icons' }, 'chevron_right')
  ])
}
