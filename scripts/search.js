const { db, patch, div, p, span } = window

// Main function for getting the routes and calling the render function to set the page
main()
async function main () {
  const col = await db.collection('routes').get()
  const routes = []
  col.forEach(doc => routes.push({
    id: doc.id,
    data: doc.data()
  }))
  const search = document.getElementById('search-bar')
  const routeWrap = document.getElementById('routes')
  search.oninput = _ => {
    const routeSearch = routes.filter(route => route.id.includes(search.value))
    console.log(routeSearch)
    patch(routeWrap,
      div({ class: 'routes' }, routeSearch.map(renderRoute)))
  }
  patch(routeWrap,
    div({ class: 'routes' }, routes.map(renderRoute)))
}

// Render route function for changing the pages contents
function renderRoute (route) {
  function onclick () {
    window.sessionStorage.setItem('route', route.id)
    window.sessionStorage.setItem('stations_Id', route.data.path)
    window.sessionStorage.setItem('endingStation', route.data.name)
    window.location.href = 'route.html'
  }

  return div({ class: 'option', onclick: onclick }, [
    div({ class: 'option-data' }, [
      p({ class: 'option-text' }, route.id),
      div({ class: 'option-subtext' }, route.data.name)
    ]),
    span({ class: 'option-icon material-icons' }, 'chevron_right')
  ])
}
