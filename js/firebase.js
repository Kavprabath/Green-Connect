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
  var database = firebase.database()
  
  function signup() {
    
    var fname = document.getElementById('user_fname').value
    var lname = document.getElementById('user_lname').value
    var userName = document.getElementById('user_name').value
    var nsbmEmail = document.getElementById('nsbm_email').value
    var userDOB = document.getElementById('dob_input').value
    var userGender = document.getElementById('user_gender').value
    var userBatch = document.getElementById('user_batch').value
    var userFaculty = document.getElementById('user_faculty').value
    
    // Password Input Variables
    var userPassword = document.getElementById('user_password').value
    var userConfirmPassword = document.getElementById('confirm_password').value

  
    database.ref('Email/' + nsbmEmail).set({
      first_name: fname,
      last_name: lname,
      user_dob: userDOB,
      user_gender: userGender,
      user_batch: userBatch,
      user_faculty: userFaculty,
      user_password: userPassword

    })
  
    alert('User Registered Successfully!')
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
  