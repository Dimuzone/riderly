const station = [{ "id": 54724, "name": "Northbound Almondel Rd @ Ripple Rd", "lat": 49.347592, "lon": -123.235382, "zone": "BUS ZN" }, { "id": 57304, "name": "Eastbound Fraser Hwy @ 264 St", "lat": 49.059331, "lon": -122.491434, "zone": "BUS ZN" }, { "id": 57468, "name": "Westbound 1st Ave @ 53 St", "lat": 49.004513, "lon": -123.077367, "zone": "BUS ZN" }, { "id": 57206, "name": "Westbound 88 Ave @ 222A St", "lat": 49.162828, "lon": -122.607597, "zone": "BUS ZN" }, { "id": 57582, "name": "Eastbound Hammond Rd @ Bonson Rd", "lat": 49.217148, "lon": -122.67734, "zone": "BUS ZN" }, { "id": 57228, "name": "Northbound 204 St @ 93A Ave", "lat": 49.172786, "lon": -122.657134, "zone": "BUS ZN" }, { "id": 57225, "name": "Northbound 204 St @ 88 Ave", "lat": 49.163419, "lon": -122.656832, "zone": "BUS ZN" }, { "id": 57231, "name": "Eastbound 96 Ave @ 208 St", "lat": 49.176885, "lon": -122.645621, "zone": "BUS ZN" }, { "id": 60211, "name": "Metrotown Station @ Bay 11", "lat": 49.226034, "lon": -123.004152, "zone": "BUS ZN" }, { "id": 52500, "name": "Eastbound Central Blvd @ 4500 Block", "lat": 49.224203, "lon": -123.000304, "zone": "BUS ZN" }]

firebase.auth().onAuthStateChanged(user => {

    console.log(user.email)

    db.collection("users").doc(user.uid).get().then(users => {

        console.log(users.data().saves)

    })

    let loginstatus = document.getElementsByClassName("login-text")[0]
    loginstatus.innerText = "Logout"

})

let button = document.getElementsByClassName("login")[0]

var signin = firebase.auth().currentUser;

button.onclick = _ => {
    if (signin) {
        firebase.auth().signOut().then(_ => location.href = "index.html")
    } else {
        location.href = "login.html"
    }
}

let recents = localStorage.getItem("recents").split(",")
recents.forEach(addRecent)

function addRecent(item) {
    let str = item.split("-")
    let stnid = str[0]
    let route = str[1]
    let name = str[2]


}
patch(document.querySelector(".stations-section"),
    p("Hello world!"))
console.log(recents)