const { getrts, patch, div, p, span } = window
const search = document.getElementById('search-bar')
const routewrap = document.getElementById('routes')

const state = { routes: [] }
const routes = JSON.parse(window.localStorage.routes || '[]')

;(async function main () {
  state.routes = await getrts()
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
    window.sessionStorage.route = route.id
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
