
let saved = document.getElementById("usersaved")
let history = document.getElementById("userhistory")
const stationWrap = document.getElementById("station")

firebase.auth().onAuthStateChanged(user => {

    console.log(user.email)


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

            patch(stationWrap, div({
                id: "station"
            }, savedstations.map(rendersaved)))


            //user saved stations
            function rendersaved(save) {
                return div({
                    class: "option"
                }, [
                    div({
                        class: "option-data"
                    }, [p({
                            class: "option-text"
                        }, [save.split("-")[2]]),
                        div({
                            class: "option-subtext"
                        }, ["Route " + save.split("-")[1] + " ‧ " + save.split("-")[0]])
                    ])

                ])
            }

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
history.onclick = _ => {
    patch(stationWrap, div({
        id: "station"
    }, recents.map(renderRecent)))

}

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