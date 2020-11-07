const seat = ["empty", "seatingonly", "full"]
const time = ["ontime", "late", "verylate"]
const mask = ["complete", "parial", "few"]

let form = document.querySelector(".report-form")

form.onsubmit = event => {
    let formdata = new FormData(event.target)
    let seatStatus = formdata.get("seating")
    let timeStatus = formdata.get("timing")
    let maskStatus = formdata.get("mask-usage")
    let seating = seat.indexOf(seatStatus)
    let timing = time.indexOf(timeStatus)
    let masks = mask.indexOf(maskStatus)
    let author = "guest"
    let report = [author, seating, timing, masks]



    console.log(report)

    event.preventDefault()
}