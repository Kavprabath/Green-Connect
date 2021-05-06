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
  
  function save() {
    var email = document.getElementById('email').value
    var password = document.getElementById('password').value
    var username = document.getElementById('username').value
    var say_something = document.getElementById('say_something').value
    var favourite_food = document.getElementById('favourite_food').value
  
    database.ref('users/' + username).set({
      email : email,
      password : password,
      username : username,
      say_something : say_something,
      favourite_food : favourite_food
    })
  
    alert('Saved')
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
  