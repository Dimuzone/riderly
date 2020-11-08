firebase.auth().onAuthStateChanged(user => {

    console.log(user.email)

    db.collection("users").doc(user.uid).get().then(users => {

        console.log(users.data().saves)
        
    })

})
