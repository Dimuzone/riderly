// The station ID ex. 34654
let stationId = sessionStorage.getItem("stationId")

// The Current Station Name ex. Birney Ave
let currentStation = sessionStorage.getItem("stationName")

// The Route ID ex. 49W
let routeId = sessionStorage.getItem("route")

// The station Before the current station
let before = sessionStorage.getItem("before")

// The Station After the current Station
let after = sessionStorage.getItem("after")

let [on, at] = currentStation.split(" @ ")
let name = at.startsWith("Bay") ? on : at
let [onB, atB] = before.split(" @ ")
let beforeName = atB.startsWith("Bay") ? onB : atB
let [onA, atA] = after.split(" @ ")
let afterName = atA.startsWith("Bay") ? onA : atA


document.getElementById("currentName").innerText = name


document.getElementById("name").innerText = name
document.getElementById("routeAndId").innerText = routeId + " - #" + stationId 
document.getElementById("routeId").innerText = routeId
document.getElementById("root").innerText = "Join chat for Route " + routeId
document.getElementById("currentName").innerText = name
document.getElementById("before").innerText = beforeName
document.getElementById("after").innerText = afterName


console.log(routeId)
console.log(stationId)
console.log(currentStation)
console.log(before)
console.log(after)



const seating = ["Empty", "Seating Only", "Full"]
const timing = ["On time", "Late", "Very late"]
const mask = ["Complete", "Parial", "Few"]
const colors = ["-green", "-yellow", "-red"]

db.collection("reports")
    .where("station", "==", 52500)
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

const station = 52500
const route = routeId
const star = document.getElementById("star")
const stationName = currentStation

//Save stations button
firebase.auth().onAuthStateChanged(user => {

    console.log(user.email)


    // user log in
    db.collection("users").doc(user.uid).get().then(users => {

        star.style.display="inherit"
        let saves = users.data().saves.slice()
        if (saves.includes(station + "-" + route + "-" + stationName)) {
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

            saves.push(station + "-" + route + "-" + stationName)

            db.collection("users").doc(id).update({ saves })

        })

    })
}

function removeStation(station) {
    firebase.auth().onAuthStateChanged(user => {
        let id = user.uid
        db.collection("users").doc(id).get().then(user => {

            let saves = user.data().saves.slice()

            if (saves.includes(station + "-" + route + "-" + stationName)) {
                saves.splice(saves.indexOf(station + "-" + route + "-" + stationName), 1)
            }

            db.collection("users").doc(id).update({ saves })

        })
    })
}

//display recent message
var messages = []
var now = Date.now()
const stationMessageWrap = document.getElementById("recentmsg")



db.collection("messages").where("route", "==", routeId).orderBy("time", "desc").limit(3)
.get().then(col => {
    col.forEach(doc => messages.push(doc.data()))
    console.log(messages)
    console.log(stationMessageWrap)

    patch(stationMessageWrap, div({ id: "recentmsg" }, messages.map(renderRecentMsg)))
})


function renderRecentMsg(recentmsg) {
    return div({ class: "option" }, [
        div({ class: "option-data" }, [p({ class: "option-text" }, [recentmsg.route]),
            div({ class: "option-subtext" }, [recentmsg.author + ": " + recentmsg.content])
        ]),
        div({ class: "timewrap"}, [span({ class: "time"}, strifytime(recentmsg.time, now)),
        span({ class: "option-icon material-icons"}, "chevron_right")])

    ])
}



//local storage for recent stations
localStorage.setItem("recents", "58143-151W-Station1,51916-173E-Station2,54950-191S-Station3")
let recent = localStorage.getItem("recents").split(",")
recent.push("58143-151W-Station4")
localStorage.setItem("recents", recent)

console.log(localStorage.getItem("recents"))