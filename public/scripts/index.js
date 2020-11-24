
let saved = document.getElementById("usersaved")
let history = document.getElementById("userhistory")
const stationWrap = document.getElementById("station")

firebase.auth().onAuthStateChanged(user => {

    console.log(user.email)

    // user log in
    db.collection("users").doc(user.uid).get().then(users => {


        let name = users.data().name.split(" ")


        //display welcome message 
        let welcome = document.getElementById("welcome")
        welcome.innerText = "Hi, " + name[0] + "!"

        //display user saved
        saved.style.display = "flex";

        //Saved Station button 
        saved.onclick = _ => {
            let savedstations = users.data().saves

            patch(stationWrap, div({
                id: "station"
            }, savedstations.map(renderRecent)))
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

history.onclick = _ => {
    patch(stationWrap, div({
        id: "station"
    }, recents.map(renderRecent)))

}

patch(stationWrap, div({
    id: "station"
}, recents.map(renderRecent)))


function renderRecent(recent) {
let newStation = recent.split("-")

    function onclick() {
        sessionStorage.setItem("after", newStation[4])
        sessionStorage.setItem("before", newStation[3])
        sessionStorage.setItem("stationId", newStation[0])
        sessionStorage.setItem("stationName", newStation[2])
        sessionStorage.setItem("route", newStation[1])

        location.href = "station.html"
    
      }

    return div({
        class: "option", onclick: onclick
    }, [
        div({
            class: "option-data"
        }, [p({
                class: "option-text"
            }, [newStation[2]]),
            div({
                class: "option-subtext"
            }, ["Route " + newStation[1] + " ‧ " + newStation[0]])
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

