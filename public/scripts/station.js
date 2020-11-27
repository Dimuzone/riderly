// The station ID ex. 34654
let stationId = parseInt(sessionStorage.getItem("stationId"))

// The Current Station Name ex. Birney Ave
let currentStation = sessionStorage.getItem("stationName")

// The Route ID ex. 49W
let routeId = sessionStorage.getItem("route")

// The station Before the current station
let before = sessionStorage.getItem("before")

// The Station After the current Station
let after = sessionStorage.getItem("after")

// Splitting the station names as they are
// "Eastbound Central Blvd @ Willingdon Ave" and we only want the name
let [on, at] = currentStation.split(" @ ")
let name = at.startsWith("Bay") ? on : at
let [onB, atB] = before.split(" @ ")
let beforeName = atB.startsWith("Bay") ? onB : atB
let [onA, atA] = after.split(" @ ")
let afterName = atA.startsWith("Bay") ? onA : atA

const join = document.getElementById("join")
join.innerText = "Join chat for Route " + routeId
join.onclick = _ => {
	location.href = "chat.html"
}

document.getElementById("currentName").innerText = name
document.getElementById("name").innerText = name
document.getElementById("routeAndId").innerText = routeId + " - #" + stationId
document.getElementById("routeId").innerText = routeId
document.getElementById("currentName").innerText = name
document.getElementById("before").innerText = beforeName
document.getElementById("after").innerText = afterName

//Display recent report
const seating = ["Empty", "Seating Only", "Full"]
const timing = ["On time", "Late", "Very late"]
const mask = ["Complete", "Parial", "Few"]
const colors = ["-green", "-yellow", "-red"]


db.collection("reports")
    .where("station", "==", stationId)
    .where("route", "==", routeId)
    .orderBy("timestamp", "desc").limit(1)
    .get()
    .then(col => {
        let reports = []
        col.forEach(doc => reports.push(doc.data()))
        let report = reports[0]
        console.log(report)

        let seatingStatus = document.getElementsByClassName("-seating")[0]
        seatingStatus.innerText = seating[report.seating]
        seatingStatus.classList.add(colors[report.seating])

        let timingStatus = document.getElementsByClassName("-timing")[0]
        timingStatus.innerText = timing[report.timing]
        timingStatus.classList.add(colors[report.timing])

        let maskStatus = document.getElementsByClassName("-mask")[0]
        maskStatus.innerText = mask[report.masks]
        maskStatus.classList.add(colors[report.masks])
    })

const station = stationId
const route = routeId
const star = document.getElementById("star")
const stationName = currentStation
const previous = sessionStorage.getItem("before")
const next = sessionStorage.getItem("after")
let thisStation = station + "-" + route + "-" + stationName + "-" + previous + "-" + after

//Save stations button
firebase.auth().onAuthStateChanged(user => {
    console.log(user.email)

    // user log in
    db.collection("users").doc(user.uid).get().then(users => {
        star.style.display="inherit"
        let saves = users.data().saves.slice()
        if (saves.includes(thisStation)) {
            star.innerText = "star"
        }
    })
})

star.onclick = function onClick() {
    if (star.innerText === "star_border") {
        saveStation(station)
        star.innerText = "star"
    } else if (star.innerText === "star") {
        removeStation(station)
        star.innerText = "star_border"
    }

}

function saveStation(station) {
    firebase.auth().onAuthStateChanged(user => {
        let id = user.uid
        db.collection("users").doc(id).get().then(user => {
            let saves = user.data().saves.slice()
            saves.push(thisStation)
            db.collection("users").doc(id).update({ saves })
        })
    })
}

function removeStation(station) {
    firebase.auth().onAuthStateChanged(user => {
        let id = user.uid
        db.collection("users").doc(id).get().then(user => {
            let saves = user.data().saves.slice()
            if (saves.includes(thisStation)) {
                saves.splice(saves.indexOf(thisStation), 1)
            }
            db.collection("users").doc(id).update({ saves })
        })
    })
}

//display recent message
var messages = []
var now = Date.now()
const stationMessageWrap = document.getElementById("recentmsg")
db.collection("messages").where("route", "==", routeId).orderBy("timestamp", "desc").limit(3)
.get().then(col => {
    col.forEach(doc => messages.push(doc.data()))
    console.log(messages)
    console.log(stationMessageWrap)
    patch(stationMessageWrap, div({ id: "recentmsg" }, messages.map(renderRecentMsg)))
})

function renderRecentMsg(recentmsg) {
    return div({ class: "option" }, [
        div({ class: "option-data" }, [p({ class: "option-text" }, [recentmsg.route]),
            div({ class: "option-subtext" }, [recentmsg.username + ": " + recentmsg.content])
        ]),
        div({ class: "timewrap"}, [span({ class: "time"}, strifytime(recentmsg.timestamp, now)),
        span({ class: "option-icon material-icons"}, "chevron_right")])
    ])
}

//local storage for recent stations
if (localStorage.getItem("recents") == null) {
    localStorage.setItem("recents", thisStation)
} else {
    let recent = localStorage.getItem("recents").split(",")
    if (!recent.includes(thisStation)) {
        recent.push(thisStation)
        localStorage.setItem("recents", recent)
    }
    console.log(localStorage.getItem("recents"))
}