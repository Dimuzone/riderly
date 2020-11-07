const seat = ["empty", "standonly", "full"]
const time = ["ontime", "late", "verylate"]
const mask = ["complete", "partial", "few"]

let form = document.querySelector(".report-form")

form.onsubmit = event => {
    let formdata = new FormData(event.target)
    let seatStatus = formdata.get("seating")
    let timeStatus = formdata.get("timing")
    let maskStatus = formdata.get("mask-usage")
    event.preventDefault()

    var newReport = db.collection("reports").doc();

    newReport.set({
        author: "guest",
        station: 52500,
        seating: seat.indexOf(seatStatus),
        timing: time.indexOf(timeStatus),
        masks: mask.indexOf(maskStatus)
    }).then(function(docRef) {
        console.log("sucessed");
    })
}