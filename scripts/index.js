firebase.auth().onAuthStateChanged(user => {

    console.log(user.email)

    db.collection("users").get().then(users => {

        users.forEach(otherUser => {

            if (user.email == otherUser.data().email) {

                console.log(otherUser.data().saves)

            }

        })
    })

})
