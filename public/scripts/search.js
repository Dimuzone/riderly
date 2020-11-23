main()

async function main() {

    let col = await db.collection("routes").get()

    let routes = []

    col.forEach(doc => routes.push({

        id: doc.id,
        data: doc.data()

    }))

    console.log(routes)

    const search = document.getElementById("search-bar")
    const routeWrap = document.getElementById("routes")

    search.oninput = _ => {

        const routeSearch = routes.filter(route => route.id.includes(search.value))
        console.log(routeSearch)

        patch(routeWrap,
            div({ class: "routes" }, routeSearch.map(renderRoute)))

    }

}


function renderRoute(route) {

    function onclick() {

        sessionStorage.setItem("route", route.id)
        sessionStorage.setItem("stations_Id", route.data.path)
        sessionStorage.setItem("endingStation", route.data.name)
        location.href = "route.html"

      }

    return div({ class: "option", onclick: onclick }, [

      div({ class: "option-data"}, [

      p({ class: "option-text" }, route.id),
      div({ class: "option-subtext" }, route.data.name),

      ]),

      span({ class: "option-icon material-icons"}, "chevron_right")
    ])
}