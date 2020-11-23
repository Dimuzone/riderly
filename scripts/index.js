const station = [{
    "id": 54724,
    "name": "Northbound Almondel Rd @ Ripple Rd",
    "lat": 49.347592,
    "lon": -123.235382,
    "zone": "BUS ZN"
}, {
    "id": 57304,
    "name": "Eastbound Fraser Hwy @ 264 St",
    "lat": 49.059331,
    "lon": -122.491434,
    "zone": "BUS ZN"
}, {
    "id": 57468,
    "name": "Westbound 1st Ave @ 53 St",
    "lat": 49.004513,
    "lon": -123.077367,
    "zone": "BUS ZN"
}, {
    "id": 57206,
    "name": "Westbound 88 Ave @ 222A St",
    "lat": 49.162828,
    "lon": -122.607597,
    "zone": "BUS ZN"
}, {
    "id": 57582,
    "name": "Eastbound Hammond Rd @ Bonson Rd",
    "lat": 49.217148,
    "lon": -122.67734,
    "zone": "BUS ZN"
}, {
    "id": 57228,
    "name": "Northbound 204 St @ 93A Ave",
    "lat": 49.172786,
    "lon": -122.657134,
    "zone": "BUS ZN"
}, {
    "id": 57225,
    "name": "Northbound 204 St @ 88 Ave",
    "lat": 49.163419,
    "lon": -122.656832,
    "zone": "BUS ZN"
}, {
    "id": 57231,
    "name": "Eastbound 96 Ave @ 208 St",
    "lat": 49.176885,
    "lon": -122.645621,
    "zone": "BUS ZN"
}, {
    "id": 60211,
    "name": "Metrotown Station @ Bay 11",
    "lat": 49.226034,
    "lon": -123.004152,
    "zone": "BUS ZN"
}, {
    "id": 52500,
    "name": "Eastbound Central Blvd @ 4500 Block",
    "lat": 49.224203,
    "lon": -123.000304,
    "zone": "BUS ZN"
}]

firebase.auth().onAuthStateChanged(user => {

    console.log(user.email)

    let saved = document.getElementById("usersaved")

    // user log in
    db.collection("users").doc(user.uid).get().then(users => {


        console.log(users.data().name)
        let name = users.data().name.split(" ")
        console.log(name)

        //display welcome message 
        let welcome = document.getElementById("welcome")
        welcome.innerText = "Hi, " + name[0] + "!"

        //display user saved
        saved.style.display = "flex";

        //Saved Station button 
        saved.onclick = _ => {
            let savedstations = users.data().saves
            console.log(savedstations)




            //user saved stations
            // function rendersaved(save) {
            //     return div({
            //         class: "option"
            //     }, [
            //         div({
            //             class: "option-data"
            //         }, [p({
            //                 class: "option-text"
            //             }, [recent.split("-")[2]]),
            //             div({
            //                 class: "option-subtext"
            //             }, ["Route " + recent.split("-")[1] + " ‧ " + recent.split("-")[0]])
            //         ])

            //     ])
            // }

        }

    })


    let loginstatus = document.getElementsByClassName("login-text")[0]
    loginstatus.innerText = "Logout"

})





//log in/out button
let button = document.getElementsByClassName("login")[0]



button.onclick = _ => {
    var signin = firebase.auth().currentUser;
    if (signin) {
        firebase.auth().signOut().then(_ => location.href = "index.html")
        let welcome = document.getElementById("welcome")
        welcome.innerText = ""
    } else {
        location.href = "login.html"
    }
}







//Add recents
let recents = localStorage.getItem("recents").split(",")

console.log(recents)

const stationWrap = document.getElementById("station")

patch(stationWrap, div({
    id: "station"
}, recents.map(renderRecent)))


function renderRecent(recent) {
    return div({
        class: "option"
    }, [
        div({
            class: "option-data"
        }, [p({
                class: "option-text"
            }, [recent.split("-")[2]]),
            div({
                class: "option-subtext"
            }, ["Route " + recent.split("-")[1] + " ‧ " + recent.split("-")[0]])
        ])

    ])
}

//Recent messages
var messages = []
var now = Date.now()
const messageWrap = document.getElementById("recentmsg")



db.collection("messages").orderBy("time", "desc").limit(3)
    .get().then(col => {
        col.forEach(doc => messages.push(doc.data()))
        console.log(messages)
        patch(messageWrap, div({
            id: "recentmsg"
        }, messages.map(renderRecentMsg)))
    })


function renderRecentMsg(recentmsg) {
    return div({
        class: "option"
    }, [
        div({
            class: "option-data"
        }, [p({
                class: "option-text"
            }, [recentmsg.route]),
            div({
                class: "option-subtext"
            }, [recentmsg.author + ": " + recentmsg.content])
        ]),
        div({
            class: "timewrap"
        }, [span({
                class: "time"
            }, strifytime(recentmsg.time, now)),
            span({
                class: "option-icon material-icons"
            }, "chevron_right")
        ])

    ])
}