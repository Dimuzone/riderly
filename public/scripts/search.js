const routess = [{"id":"151W","data":{"name":"BURQUITLAM STN","path":[58143,56232,59842,61492,57757,60791,57814,57933,57357,59720]}},{"id":"173E","data":{"name":"CEDAR","path":[51916,54563,51435,51808,50199,60075,51702,58988,60500,54928]}},{"id":"132N","data":{"name":"CAPITOL HILL","path":[60424,51205,50391,58787,55790,59076,61961,57240,51838,58806]}},{"id":"640S","data":{"name":"LADNER EXCHANGE","path":[58625,55571,54796,53015,58947,54562,53771,53338,53211,57041]}},{"id":"191S","data":{"name":"COQUITLAM CTRL STN","path":[50400,53413,55651,60054,54565,55101,54942,56249,50451,54950]}},{"id":"174E","data":{"name":"ROCKLIN","path":[61533,99920,51650,56874,50273,56905,53491,53911,56932,60240]}},{"id":"146N","data":{"name":"METROTOWN STN","path":[53422,57284,53192,56401,58466,58703,50980,51407,55466,58765]}},{"id":"170S","data":{"name":"PORT COQUITLAM SOUTH","path":[52326,54547,55997,51705,53302,52835,51628,59678,59650,53585]}},{"id":"148W","data":{"name":"ROYAL OAK STN","path":[51660,55126,50072,58851,50681,54006,57305,59541,50926,53019]}},{"id":"159W","data":{"name":"BRAID STN","path":[54708,51862,53754,51963,53287,61119,59771,52890,53761,61862]}}]

main()

async function main() {
    // let col = await db.collection("routes").get()
    // let routes = []
    // col.forEach(doc => routes.push({
    //     id: doc.id,
    //     data: doc.data()
    // }))
    console.log(routess)

    const search = document.getElementById("search-bar")
    const routeWrap = document.getElementById("routes") 

    search.oninput = _ => {

        const x = routess.filter(route => route.id.includes(search.value))
        console.log(x)

        patch(routeWrap,
        div({ class: "routes" }, x.map(renderRoute)))

    }
    
}


function renderRoute(route) {
    return div({ class: "option" }, [
      p({ class: "option-text" }, route.id),
      p({ class: "option-subtext" }, route.data.name)
    ])
  }
