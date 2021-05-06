


// Your web app's Firebase configuration
var firebaseConfig = {
    apiKey: "AIzaSyB7gsFxhE7-9MpHM76OsN8jZHMrt7qBH4Q",
    authDomain: "gconnect-cf4d7.firebaseapp.com",
    databaseURL: "https://gconnect-cf4d7-default-rtdb.firebaseio.com",
    projectId: "gconnect-cf4d7",
    storageBucket: "gconnect-cf4d7.appspot.com",
    messagingSenderId: "644261886823",
    appId: "1:644261886823:web:7f70cbfdaf2744506dcdc2",
    measurementId: "G-CF9PRD3358"
  };
  // Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  
  
  
  // Set database variable
  var database = firebase.database();

  //Sert Authentication Variable
  var auth = firebase.auth();


  function stringToHash(string) {
                  
    var hash = 0;
      
    if (string.length == 0) return hash;
      
    for (i = 0; i < string.length; i++) {
        char = string.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
      
    return hash;
}
  
  function signup() {
    
    
    var studentID = document.getElementById('student_id').value
    var fname = document.getElementById('user_fname').value
    var lname = document.getElementById('user_lname').value
    var nsbmEmail = document.getElementById('nsbm_email'); //Not getting the value in
    var userDOB = document.getElementById('dob_input').value
    var userGender = document.getElementById('user_gender').value
    var userBatch = document.getElementById('user_batch').value
    var userFaculty = document.getElementById('user_faculty').value

 
    
    // // Password Input Variables
    var userPassword = document.getElementById('user_password');
    // var userConfirmPassword = stringToHash(document.getElementById('confirm_password').value);

    const promise = auth.createUserWithEmailAndPassword(nsbmEmail.value, userPassword.value);
    promise.catch(e => alert(e.message));

    alert("User Signed Up!");

    //User Input Validations
   if(studentID == "") {
     alert("Please Fill Out the studentID!" );
   }
   



  
    database.ref('StudentId/' + studentID).set({
      first_name: fname,
      last_name: lname,
      user_dob: userDOB,
      user_gender: userGender,
      user_batch: userBatch,
      user_faculty: userFaculty,
      
      

    })
  
    alert('User Registered Successfully!')
    document.forms['input-sec'].reset()
    
  }

  
  //Check whether the auth state
  auth.onAuthStateChanged(function(user){
    if(user){
        
        // If there is a user signed in
        var email = user.email;
        alert("Active User" + email);
        
    }else {
          //No user is Signed In
          alert("No Active User!");
          
    }
});
  
  
  function signIn() {
    
    var email = document.getElementById("user_email");
    var password = document.getElementById("user_password");

    const promise = auth.signInWithEmailAndPassword(email.value, password.value);
    promise.catch(e => alert(e.message));

    alert("Signed In with: " + email.value);
    
    //Redirecting user to the home page after authentication
    window.location.href = "../Home/home.html";

  }

  function signOut() {
    auth.signOut();
    alert("User Signed Out!");
    window.location.href = "../Log In/login.html";
  }
  
  function get() {
    var username = document.getElementById('username').value
  
    var user_ref = database.ref('users/' + username)
    user_ref.on('value', function(snapshot) {
      var data = snapshot.val()
  
      alert(data.email)
  
    })
  
  }
  
  function update() {
    var username = document.getElementById('username').value
    var email = document.getElementById('email').value
    var password = document.getElementById('password').value
  
    var updates = {
      email : email,
      password : password
    }
  
    database.ref('users/' + username).update(updates)
  
    alert('updated')
  }
  
  function remove() {
    var username = document.getElementById('username').value
  
    database.ref('users/' + username).remove()
  
    alert('deleted')
  }
  