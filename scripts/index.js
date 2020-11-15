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