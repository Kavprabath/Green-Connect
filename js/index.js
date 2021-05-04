
firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
      document.getElementById("user-div").style.display = "block";
      document.getElementById("main-div").style.display = "none";

    } else {
        document.getElementById("user-div").style.display = "none";
        document.getElementById("main-div").style.display = "block";
    }
  });


function login(){

    var email = document.getElementById("email").value;
    var password = document.getElementById("password").value;

    firebase.auth().signInWithEmailAndPassword(email, password)
  .then((userCredential) => {
    // Signed in
    var user = userCredential.user;
    // ...
  })
  .catch((error) => {
    var errorCode = error.code;
    var errorMessage = error.message;


    window.alert("Error: " + errorMessage);
  });


}