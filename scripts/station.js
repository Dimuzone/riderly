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