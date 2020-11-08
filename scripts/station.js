const seating = ["Empty", "Seating Only", "Full"]
const timing = ["On time", "Late", "Very late"]
const mask = ["Complete", "Parial", "Few"]
const colors = ["-green", "-yellow", "-red"]

db.collection("reports")
    .where("station", "==", 52500)
    .get()
    .then(col => {
        let reports = []
        col.forEach(doc => reports.push(doc.data()))
        let report = reports[0]
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
const star = document.getElementById("star")


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

            saves.push(station)

            db.collection("users").doc(id).update( {saves} )

        })
    
    })
}

function removeStation(station) {
    firebase.auth().onAuthStateChanged(user => {
        let id = user.uid
        db.collection("users").doc(id).get().then(user => {

            let saves = user.data().saves.slice()

            if (saves.includes(station)) {
                saves.splice(saves.indexOf(station), 1)
            }

            db.collection("users").doc(id).update( {saves} )

        })
    })
}