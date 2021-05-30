var express = require("express");
var app = express();

var formidable = require("express-formidable");
app.use(formidable());

var mongodb = require("mongodb");
var mongoClient = mongodb.MongoClient;
var ObjectId = mongodb.ObjectId;

var http = require("http").createServer(app);
var bcrypt = require("bcrypt");
var fileSystem = require("fs");

var nodemailer = require("nodemailer");
var requestModule = require('request');

var functions = require("./modules/functions");
var chat = require("./modules/chat");
var page = require("./modules/page");
var group = require("./modules/group");
var addPost = require("./modules/add-post");
var editPost = require("./modules/edit-post");

var jwt = require("jsonwebtoken");
var accessTokenSecret = "myAccessTokenSecret1234567890";

const Cryptr = require("cryptr");
const cryptr = new Cryptr("mySecretKey");

const Filter = require("bad-words");
const filter = new Filter();

var admin = require("./modules/admin");
admin.init(app, express);

app.use("/public", express.static(__dirname + "/public"));
app.set("view engine", "ejs");

var socketIO = require("socket.io")(http);
var socketID = "";
var users = [];

var mainURL = "http://localhost:3000";

// --------------- Sender`s Email Configurations ---------------------
var nodemailerFrom = "greenconnect101@gmail.com";
var nodemailerObject = {
	service: "gmail",
	host: 'smtp.gmail.com',
    port: 465,
    secure: true,
	auth: {
		user: "greenconnect101@gmail.com",
		pass: "nsbmgreen101"
	}
};

socketIO.on("connection", function (socket) {
	// console.log("User connected", socket.id);
	socketID = socket.id;
});


// --------------- Server Startup And Functions ---------------------
http.listen(3000, function () {
	console.log("Server started at " + mainURL);

	mongoClient.connect("mongodb://localhost:27017", {
		useUnifiedTopology: true
	}, function (error, client) {
		var database = client.db("green_connect"); //Initializing MongoDB Database
		console.log("Database connected.");

		functions.database = database;

		chat.database = database;
		chat.socketIO = socketIO;
		chat.users = users;
		chat.ObjectId = ObjectId;
		chat.fileSystem = fileSystem;
		chat.cryptr = cryptr;
		chat.filter = filter;

		page.database = database;
		page.ObjectId = ObjectId;
		page.fileSystem = fileSystem;

		group.database = database;
		group.ObjectId = ObjectId;
		group.fileSystem = fileSystem;

		addPost.database = database;
		addPost.functions = functions;
		addPost.fileSystem = fileSystem;
		addPost.requestModule = requestModule;
		addPost.filter = filter;
		addPost.ObjectId = ObjectId;

		editPost.database = database;
		editPost.functions = functions;
		editPost.fileSystem = fileSystem;
		editPost.requestModule = requestModule;
		editPost.filter = filter;
		editPost.ObjectId = ObjectId;

		admin.database = database;
		admin.bcrypt = bcrypt;
		admin.jwt = jwt;
		admin.ObjectId = ObjectId;
		admin.fileSystem = fileSystem;
		admin.mainURL = mainURL;

		app.get("/signup", function (request, result) {
			result.render("signup");
		});

		app.get("/forgot-password", function (request, result) {
			result.render("forgot-password");
		});

		// --------------- Send Recover Link For The User ---------------------
		app.post("/sendRecoveryLink", function (request, result) {

			//Getting user inputted email address
			var email = request.fields.email;
			
			//Finding is there any existing user in the database for a recovery
			database.collection("users").findOne({
				"email": email
			}, function (error, user) {
				if (user == null) {
					result.json({
						'status': "error",
						'message': "Email does not exists."
					});
				} else {
					var reset_token = new Date().getTime();
					
					database.collection("users").findOneAndUpdate({
						"email": email
					}, {
						$set: {
							"reset_token": reset_token
						}
					}, function (error, data) {
						
						var transporter = nodemailer.createTransport(nodemailerObject);

						var text = "Please click the following link to reset your password: " + mainURL + "/ResetPassword/" + email + "/" + reset_token;
						var html = "Please click the following link to reset your password: <br><br> <a href='" + mainURL + "/ResetPassword/" + email + "/" + reset_token + "'>Reset Password</a> <br><br> Thank you.";

						transporter.sendMail({
							from: nodemailerFrom,
							to: email,
							subject: "Reset Password",
							text: text,
							html: html
						}, function (error, info) {
							if (error) {
								console.error(error);
							} else {
								console.log("Email sent: " + info.response);
							}
							
							result.json({
								'status': "success",
								'message': 'Email has been sent with the link to recover the password.'
							});
						});
						
					});
				}
			});
		});

		// --------------- Getting Resetting Token ---------------------
		app.get("/ResetPassword/:email/:reset_token", function (request, result) {

			var email = request.params.email;
			var reset_token = request.params.reset_token;

			result.render("reset-password", {
				"email": email,
				"reset_token": reset_token
			});
		});

		// --------------- User Email Verfication ---------------------
		app.get("/verifyEmail/:email/:verification_token", function (request, result) {

			var email = request.params.email;
			var verification_token = request.params.verification_token;

			database.collection("users").findOne({
				$and: [{
					"email": email,
				}, {
					"verification_token": parseInt(verification_token)
				}]
			}, function (error, user) {
				if (user == null) {
					result.json({
						'status': "error",
						'message': 'Email does not exists. Or verification link is expired.'
					});
				} else {

					database.collection("users").findOneAndUpdate({
						$and: [{
							"email": email,
						}, {
							"verification_token": parseInt(verification_token)
						}]
					}, {
						$set: {
							"verification_token": "",
							"isVerified": true
						}
					}, function (error, data) {
						result.json({
							'status': "success",
							'message': 'Account has been verified. Please try login.'
						});
					});
				}
			});
		});

		// --------------- Resetting The Password ---------------------
		app.post("/ResetPassword", function (request, result) {
		    var email = request.fields.email;
		    var reset_token = request.fields.reset_token;
		    var new_password = request.fields.new_password;
		    var confirm_password = request.fields.confirm_password;

		    if (new_password != confirm_password) {
		    	result.json({
					'status': "error",
					'message': 'Password does not match.'
				});
		        return;
		    }

		    database.collection("users").findOne({
				$and: [{
					"email": email,
				}, {
					"reset_token": parseInt(reset_token)
				}]
			}, function (error, user) {
				if (user == null) {
					result.json({
						'status': "error",
						'message': 'Email does not exists. Or recovery link is expired.'
					});
				} else {

					// --------------- Encrypting New Password---------------------
					bcrypt.hash(new_password, 10, function (error, hash) {
						database.collection("users").findOneAndUpdate({
							$and: [{
								"email": email,
							}, {
								"reset_token": parseInt(reset_token)
							}]
						}, {
							$set: {
								"reset_token": "",
								"password": hash
							}
						}, function (error, data) {
							result.json({
								'status': "success",
								'message': 'Password has been changed. Please try login again.'
							});
						});

					});
				}
			});
		});

		
		// --------------- Changed User Password ---------------------
		app.get("/change-password", function (request, result) {
			result.render("change-password");
		});

		app.post("/changePassword", function (request, result) {
			
			var accessToken = request.fields.accessToken;
			var current_password = request.fields.current_password;
			var new_password = request.fields.new_password;
			var confirm_password = request.fields.confirm_password;

			if (new_password != confirm_password) {
		    	result.json({
					'status': "error",
					'message': 'Password does not match.'
				});
		        return;
		    }

			database.collection("users").findOne({
				"accessToken": accessToken
			}, function (error, user) {
				if (user == null) {
					result.json({
						"status": "error",
						"message": "User has been logged out. Please login again."
					});
				} else {

					if (user.isBanned) {
						result.json({
							"status": "error",
							"message": "You have been banned."
						});
						return false;
					}

					// --------------- Encrypting Entered Password ---------------------
					bcrypt.compare(current_password, user.password, function (error, isVerify) {
						if (isVerify) {
							bcrypt.hash(new_password, 10, function (error, hash) {
								database.collection("users").findOneAndUpdate({
									"accessToken": accessToken
								}, {
									$set: {
										"password": hash
									}
								}, function (error, data) {
									result.json({
										"status": "success",
										"message": "Password has been changed"
									});
								});
							});
						} else {
							result.json({
								"status": "error",
								"message": "Current password is not correct"
							});
						}
					});
				}
			});
		});

		// --------------- Signup A New User To The System ---------------------
		app.post("/signup", function (request, result) {
			var name = request.fields.name;
			var username = request.fields.username;
			var email = request.fields.email;
			var password = request.fields.password;
			var gender = request.fields.gender;
			var batch = request.files.batch;
			var faculty = request.fields.faculty;
			var reset_token = "";
			var isVerified = false;
			var isBanned = false;
			var verification_token = new Date().getTime();

			database.collection("users").findOne({
				$or: [{
					"email": email
				}, {
					"username": username
				}]
			}, function (error, user) {
				if (user == null) {
					
					// --------------- Encrypting User`s Password ---------------------
					bcrypt.hash(password, 10, function (error, hash) {
						
						// --------------- Adding New User To The Database ---------------------
						database.collection("users").insertOne({
						 	"name": name,
							"username": username,
							"email": email,
							"password": hash,
							"gender": gender,
							"reset_token": reset_token,
							"profileImage": "",
							"coverPhoto": "",
							"dob": "",
							"city": "",
							"country": "",
							"batch": batch,
							"faculty" : faculty
							"aboutMe": "",
							"friends": [],
							"pages": [],
							"notifications": [],
							"groups": [],
							"isVerified": isVerified,
							"verification_token": verification_token,
							"isBanned": isBanned
						}, function (error, data) {

							var transporter = nodemailer.createTransport(nodemailerObject);

							var text = "Please verify your account by click the following link: " + mainURL + "/verifyEmail/" + email + "/" + verification_token;
							var html = "Please verify your account by click the following link: <br><br> <a href='" + mainURL + "/verifyEmail/" + email + "/" + verification_token + "'>Confirm Email</a> <br><br> Thank you.";

							transporter.sendMail({
								from: nodemailerFrom,
								to: email,
								subject: "Email Verification",
								text: text,
								html: html
							}, function (error, info) {
								if (error) {
									console.error(error);
								} else {
									console.log("Email sent: " + info.response);
								}
								
								result.json({
									"status": "success",
									"message": "Signed up successfully. An email has been sent to verify your account. Once verified, you will be able to login and start using social network."
								});

							});
							
						});
					});
				} else {
					result.json({
						"status": "error",
						"message": "Email or username already exist."
					});
				}
			});
		});

		
		// --------------- Login Existing User To The System ---------------------
		app.get("/login", function (request, result) {
			result.render("login");
		});

		app.post("/login", function (request, result) {
			var email = request.fields.email;
			var password = request.fields.password;
			
			// --------------- Find Whether the User Exist In The System ---------------------
			database.collection("users").findOne({
				"email": email
			}, function (error, user) {
				if (user == null) {
					result.json({
						"status": "error",
						"message": "Email does not exist"
					});
				} else {

					if (user.isBanned) {
						result.json({
							"status": "error",
							"message": "You have been banned."
						});
						return false;
					}

					// --------------- Encypting Login User`s Password ---------------------
					bcrypt.compare(password, user.password, function (error, isVerify) {
						if (isVerify) {

							if (user.isVerified) {
								var accessToken = jwt.sign({ email: email }, accessTokenSecret);
								database.collection("users").findOneAndUpdate({
									"email": email
								}, {
									$set: {
										"accessToken": accessToken
									}
								}, function (error, data) {
									result.json({
										"status": "success",
										"message": "Login successfully",
										"accessToken": accessToken,
										"profileImage": user.profileImage
									});
								});
							}  else {
								result.json({
									"status": "error",
									"message": "Kindly verify your email."
								});
							}
							
						} else {
							result.json({
								"status": "error",
								"message": "Password is not correct"
							});
						}
					});
				}
			});
		});

		// --------------- Logged User Handling Directing to the User`s Profile---------------------
		app.get("/user/:username", function (request, result) {
			database.collection("users").findOne({
				"username": request.params.username
			}, function (error, user) {
				if (user == null) {
					result.render("errors/404", {
						"message": "This account does not exists anymore."
					});
				} else {
					result.render("userProfile", {
						"user": user
					});
				}
			});
		});

		
		// --------------- Update User`s Details ---------------------
		app.get("/updateProfile", function (request, result) {
			result.render("updateProfile");
		});

		// --------------- Checking Whether User Banned or Logget Out ---------------------
		app.post("/getUser", async function (request, result) {
			var accessToken = request.fields.accessToken;
			
			var user = await database.collection("users").findOne({
				"accessToken": accessToken
			});

			if (user == null) {
				result.json({
					"status": "error",
					"message": "User has been logged out. Please login again."
				});
			} else {

				if (user.isBanned) {
					result.json({
						"status": "error",
						"message": "You have been banned."
					});
					return false;
				}

				user.profileViewers = await database.collection("profile_viewers").find({
					"profile._id": user._id
				}).toArray();

				user.pages = await database.collection("pages").find({
					"user._id": user._id
				}).toArray();

				result.json({
					"status": "success",
					"message": "Record has been fetched.",
					"data": user
				});
			}
		});

		// --------------- Redirecting Logout User To Login Screen --------------------
		app.get("/logout", function (request, result) {
			result.redirect("/login");
		});

		app.post("/uploadCoverPhoto", function (request, result) {
			var accessToken = request.fields.accessToken;
			var coverPhoto = "";

			database.collection("users").findOne({
				"accessToken": accessToken
			}, function (error, user) {
				if (user == null) {
					result.json({
						"status": "error",
						"message": "User has been logged out. Please login again."
					});
				} else {

					if (user.isBanned) {
						result.json({
							"status": "error",
							"message": "You have been banned."
						});
						return false;
					}

					if (request.files.coverPhoto.size > 0 && request.files.coverPhoto.type.includes("image")) {

						if (user.coverPhoto != "") {
							fileSystem.unlink(user.coverPhoto, function (error) {
								//
							});
						}

						coverPhoto = "public/images/cover-" + new Date().getTime() + "-" + request.files.coverPhoto.name;

						
						// --------------- Handling Cover Photo Path ---------------------
						// Read the file
	                    fileSystem.readFile(request.files.coverPhoto.path, function (err, data) {
	                        if (err) throw err;
	                        console.log('File read!');

	                        // Write the file
	                        fileSystem.writeFile(coverPhoto, data, function (err) {
	                            if (err) throw err;
	                            console.log('File written!');

	                            database.collection("users").updateOne({
									"accessToken": accessToken
								}, {
									$set: {
										"coverPhoto": coverPhoto
									}
								}, function (error, data) {
									result.json({
										"status": "status",
										"message": "Cover photo has been updated.",
										data: mainURL + "/" + coverPhoto
									});
								});
	                        });

	                        // Delete the file
	                        fileSystem.unlink(request.files.coverPhoto.path, function (err) {
	                            if (err) throw err;
	                            console.log('File deleted!');
	                        });
	                    });
						
					} else {
						result.json({
							"status": "error",
							"message": "Please select valid image."
						});
					}
				}
			});
		});

		
		// --------------- Update User`s Profile Image---------------------
		app.post("/uploadProfileImage", function (request, result) {
			var accessToken = request.fields.accessToken;
			var profileImage = "";

			database.collection("users").findOne({
				"accessToken": accessToken
			}, function (error, user) {
				if (user == null) {
					result.json({
						"status": "error",
						"message": "User has been logged out. Please login again."
					});
				} else {

					if (user.isBanned) {
						result.json({
							"status": "error",
							"message": "You have been banned."
						});
						return false;
					}

					if (request.files.profileImage.size > 0 && request.files.profileImage.type.includes("image")) {

						if (user.profileImage != "") {
							fileSystem.unlink(user.profileImage, function (error) {
								// console.log("error deleting file: " + error);
							});
						}

						profileImage = "public/images/profile-" + new Date().getTime() + "-" + request.files.profileImage.name;

						
						// --------------- Handling Profile Photo Path ---------------------
						// Read the file
	                    fileSystem.readFile(request.files.profileImage.path, function (err, data) {
	                        if (err) throw err;
	                        console.log('File read!');

	                        // Write the file
	                        fileSystem.writeFile(profileImage, data, function (err) {
	                            if (err) throw err;
	                            console.log('File written!');

	                            database.collection("users").updateOne({
									"accessToken": accessToken
								}, {
									$set: {
										"profileImage": profileImage
									}
								}, async function (error, data) {

									await functions.updateUser(user, profileImage, user.name);

									result.json({
										"status": "status",
										"message": "Profile image has been updated.",
										data: mainURL + "/" + profileImage
									});
								});
	                        });

	                        // Delete the file
	                        fileSystem.unlink(request.files.profileImage.path, function (err) {
	                            if (err) throw err;
	                            console.log('File deleted!');
	                        });
	                    });

					} else {
						result.json({
							"status": "error",
							"message": "Please select valid image."
						});
					}
				}
			});
		});

		// --------------- Update Profile Details ---------------------
		app.post("/updateProfile", function (request, result) {
			var accessToken = request.fields.accessToken;
			var name = request.fields.name;
			var batch = request.fields.batch;
			var faculty = request.fields.faculty;
			var dob = request.fields.dob; 
			var city = request.fields.city;
			var country = request.fields.country;
			var aboutMe = request.fields.aboutMe;

			database.collection("users").findOne({
				"accessToken": accessToken
			}, function (error, user) {
				if (user == null) {
					result.json({
						"status": "error",
						"message": "User has been logged out. Please login again."
					});
				} else {

					if (user.isBanned) {
						result.json({
							"status": "error",
							"message": "You have been banned."
						});
						return false;
					}

					database.collection("users").updateOne({
						"accessToken": accessToken
					}, {
						$set: {
							"name": name,
							"batch": batch,
							"faculty": faculty, 
							"dob": dob,
							"city": city,
							"country": country,
							"aboutMe": aboutMe
						}
					}, async function (error, data) {

						await functions.updateUser(user, user.profileImage, name);

						result.json({
							"status": "status",
							"message": "Profile has been updated."
						});
					});
				}
			});
		});

		// --------------- Checking Existing Post in DB ---------------------
		app.get("/post/:id", function (request, result) {
			database.collection("posts").findOne({
				"_id": ObjectId(request.params.id)
			}, function (error, post) {
				if (post == null) {
					result.render("errors/404", {
						"message": "This post does not exist anymore."
					});
				} else {
					result.render("postDetail", {
						"post": post
					});
				}
			});
		});

		app.get("/", function (request, result) {
			result.render("index");
		});

		// --------------- Adding A Post ---------------------
		app.post("/addPost", function (request, result) {
			addPost.execute(request, result);
		});

        // --------------- Get User`s Feed And Check Whether User LogOut Or Not ---------------------
		app.post("/getUserFeed", async function (request, result) {
            var username = request.fields.username;
            var authUsername = request.fields.auth_user;

            var profile = await database.collection("users").findOne({
                "username": username
            });
            if (profile == null) {
                result.json({
                    "status": "error",
                    "message": "User does not exist."
                });
                return;
            }

            var authUser = await database.collection("users").findOne({
                "username": authUsername
            });
            if (authUser == null) {
                result.json({
                    "status": "error",
                    "message": "Sorry, you have been logged out."
                });
                return;
            }

            // --------------- Handle Profile View Counter ---------------------
			/* add or update the profile views counter */
            if (authUsername != username) {
                var hasViewed = await database.collection("profile_viewers").findOne({
                    $and: [{
                        "profile._id": profile._id
                    }, {
                        "user._id": authUser._id
                    }]
                });
                if (hasViewed == null) {
                    /* insert the view. */
                    /* username is saved so the other person can visit his profile. */
                    await database.collection("profile_viewers").insertOne({
                        "profile": {
                            "_id": profile._id,
                            "name": profile.name,
                            "username": profile.username,
                            "profileImage": profile.profileImage
                        },
                        "user": {
                            "_id": authUser._id,
                            "name": authUser.name,
                            "username": authUser.username,
                            "profileImage": authUser.profileImage
                        },
                        "views": 1,
                        "viewed_at": new Date().getTime()
                    });
                } else {
                    /* increment the counter and time */
                    await database.collection("profile_viewers").updateOne({
                        "_id": hasViewed._id
                    }, {
                        $inc: {
                            "views": 1
                        },
                        $set: {
                            "viewed_at": new Date().getTime()
                        }
                    });
                }
            }

            database.collection("posts")
	            .find({
	                "user._id": profile._id
	            })
	            .sort({
	                "createdAt": -1
	            })
	            .limit(5)
	            .toArray(function (error, data) {
	                result.json({
	                    "status": "success",
	                    "message": "Record has been fetched",
	                    "data": data
	                });
	            });
        });

        app.get("/profileViews", function (request, result) {
        	result.render("profileViews");
        });

		app.post("/getNewsfeed", function (request, result) {
			var accessToken = request.fields.accessToken;
			database.collection("users").findOne({
				"accessToken": accessToken
			}, function (error, user) {
				if (user == null) {
					result.json({
						"status": "error",
						"message": "User has been logged out. Please login again."
					});
				} else {

					if (user.isBanned) {
						result.json({
							"status": "error",
							"message": "You have been banned."
						});
						return false;
					}

					var ids = [];
					ids.push(user._id);

					for (var a = 0; a < user.pages.length; a++) {
						ids.push(user.pages[a]._id);
					}

					for (var a = 0; a < user.groups.length; a++) {
						if (user.groups[a].status == "Accepted") {
							ids.push(user.groups[a]._id);
						}
					}

					for (var a = 0; a < user.friends.length; a++) {
                        if (user.friends[a].status == "Accepted") {
    						ids.push(user.friends[a]._id);
                        }
					}

					database.collection("posts")
					.find({
						"user._id": {
							$in: ids
						}
					})
					.sort({
						"createdAt": -1
					})
					.limit(5)
					.toArray(function (error, data) {

						result.json({
							"status": "success",
							"message": "Record has been fetched",
							"data": data
						});
					});
				}
			});
		});

		// --------------- Handle User Like Section. Here Cheking User is Banned or Not---------------------
		app.post("/toggleLikePost", function (request, result) {

			var accessToken = request.fields.accessToken;
			var _id = request.fields._id;

			database.collection("users").findOne({
				"accessToken": accessToken
			}, function (error, user) {
				if (user == null) {
					result.json({
						"status": "error",
						"message": "User has been logged out. Please login again."
					});
				} else {

					if (user.isBanned) {
						result.json({
							"status": "error",
							"message": "You have been banned."
						});
						return false;
					}

					database.collection("posts").findOne({
						"_id": ObjectId(_id)
					}, function (error, post) {
						if (post == null) {
							result.json({
								"status": "error",
								"message": "Post does not exist."
							});
						} else {

							var isLiked = false;
							for (var a = 0; a < post.likers.length; a++) {
								var liker = post.likers[a];

								if (liker._id.toString() == user._id.toString()) {
									isLiked = true;
									break;
								}
							}

							if (isLiked) {
								database.collection("posts").updateOne({
									"_id": ObjectId(_id)
								}, {
									$pull: {
										"likers": {
											"_id": user._id,
										}
									}
								}, function (error, data) {
									result.json({
										"status": "unliked",
										"message": "Post has been unliked."
									});
								});
							} else {

								database.collection("users").updateOne({
									"_id": post.user._id
								}, {
									$push: {
										"notifications": {
											"_id": ObjectId(),
											"type": "photo_liked",
											"content": user.name + " has liked your post.",
											"profileImage": user.profileImage,
											"isRead": false,
											"post": {
												"_id": post._id
											},
											"createdAt": new Date().getTime()
										}
									}
								});

								database.collection("posts").updateOne({
									"_id": ObjectId(_id)
								}, {
									$push: {
										"likers": {
											"_id": user._id,
											"name": user.name,
											"username": user.username,
											"profileImage": user.profileImage,
											"createdAt": new Date().getTime()
										}
									}
								}, function (error, data) {
									result.json({
										"status": "success",
										"message": "Post has been liked."
									});
								});
							}

						}
					});

				}
			});
		});

		
		// --------------- Handle User Comment Section. Here Cheking User is Banned or Not---------------------
		app.post("/postComment", function (request, result) {

			var accessToken = request.fields.accessToken;
			var _id = request.fields._id;
			var comment = request.fields.comment;
			var createdAt = new Date().getTime();

			database.collection("users").findOne({
				"accessToken": accessToken
			}, function (error, user) {
				if (user == null) {
					result.json({
						"status": "error",
						"message": "User has been logged out. Please login again."
					});
				} else {

					if (user.isBanned) {
						result.json({
							"status": "error",
							"message": "You have been banned."
						});
						return false;
					}

					database.collection("posts").findOne({
						"_id": ObjectId(_id)
					}, function (error, post) {
						if (post == null) {
							result.json({
								"status": "error",
								"message": "Post does not exist."
							});
						} else {

							var commentId = ObjectId();

							database.collection("posts").updateOne({
								"_id": ObjectId(_id)
							}, {
								$push: {
									"comments": {
										"_id": commentId,
										"user": {
											"_id": user._id,
											"name": user.name,
											"profileImage": user.profileImage,
										},
										"comment": comment,
										"createdAt": createdAt,
										"replies": []
									}
								}
							}, function (error, data) {

								if (user._id.toString() != post.user._id.toString()) {
									database.collection("users").updateOne({
										"_id": post.user._id
									}, {
										$push: {
											"notifications": {
												"_id": ObjectId(),
												"type": "new_comment",
												"content": user.name + " commented on your post.",
												"profileImage": user.profileImage,
												"post": {
													"_id": post._id
												},
												"isRead": false,
												"createdAt": new Date().getTime()
											}
										}
									});
								}

								database.collection("posts").findOne({
									"_id": ObjectId(_id)
								}, function (error, updatePost) {
									result.json({
										"status": "success",
										"message": "Comment has been posted.",
										"updatePost": updatePost
									});
								});
							});

						}
					});
				}
			});
		});

		// --------------- Handle User Post Reply Section. Here Cheking User is Banned or Not---------------------
		app.post("/postReply", function (request, result) {

			var accessToken = request.fields.accessToken;
			var postId = request.fields.postId;
			var commentId = request.fields.commentId;
			var reply = request.fields.reply;
			var createdAt = new Date().getTime();

			database.collection("users").findOne({
				"accessToken": accessToken
			}, function (error, user) {
				if (user == null) {
					result.json({
						"status": "error",
						"message": "User has been logged out. Please login again."
					});
				} else {

					if (user.isBanned) {
						result.json({
							"status": "error",
							"message": "You have been banned."
						});
						return false;
					}

					database.collection("posts").findOne({
						"_id": ObjectId(postId)
					}, function (error, post) {
						if (post == null) {
							result.json({
								"status": "error",
								"message": "Post does not exist."
							});
						} else {

							var replyId = ObjectId();

							database.collection("posts").updateOne({
								$and: [{
									"_id": ObjectId(postId)
								}, {
									"comments._id": ObjectId(commentId)
								}]
							}, {
								$push: {
									"comments.$.replies": {
										"_id": replyId,
										"user": {
											"_id": user._id,
											"name": user.name,
											"profileImage": user.profileImage,
										},
										"reply": reply,
										"createdAt": createdAt
									}
								}
							}, function (error, data) {

								database.collection("users").updateOne({
									$and: [{
										"_id": post.user._id
									}, {
										"posts._id": post._id
									}, {
										"posts.comments._id": ObjectId(commentId)
									}]
								}, {
									$push: {
										"posts.$[].comments.$[].replies": {
											"_id": replyId,
											"user": {
												"_id": user._id,
												"name": user.name,
												"profileImage": user.profileImage,
											},
											"reply": reply,
											"createdAt": createdAt
										}
									}
								});

								database.collection("posts").findOne({
									"_id": ObjectId(postId)
								}, function (error, updatePost) {
									result.json({
										"status": "success",
										"message": "Reply has been posted.",
										"updatePost": updatePost
									});
								});
							});

						}
					});
				}
			});
		});

		
		// --------------- Handle Search Field. Here Checking Is There Similarities Available In Pages,Users, Groups---------------------
		app.get("/search/:query", function (request, result) {
			var query = request.params.query;
			result.render("search", {
				"query": query
			});
		});

		app.post("/search", function (request, result) {
			var query = request.fields.query;
			database.collection("users").find({
				$or: [{
					"name": {
						$regex: ".*" + query + ".*",
						$options: "i"
					}
				}, {
					"username": {
						$regex: ".*" + query + ".*",
						$options: "i"
					}
				}, {
					"email": {
						$regex: ".*" + query + ".*",
						$options: "i"
					}
				}]
			}).toArray(function (error, data) {

				database.collection("pages").find({
					"name": {
						$regex: ".*" + query + ".*",
						$options: "i"
					}
				}).toArray(function (error, pages) {

					database.collection("groups").find({
						"name": {
							$regex: ".*" + query + ".*",
							$options: "i"
						}
					}).toArray(function (error, groups) {

						result.json({
							"status": "success",
							"message": "Record has been fetched",
							"data": data,
							"pages": pages,
							"groups": groups
						});
					});
				});
			});
		});

		// --------------- Handle Friend Request Section. Here Cheking User is Banned or Not---------------------
		app.post("/sendFriendRequest", function (request, result) {

			var accessToken = request.fields.accessToken;
			var _id = request.fields._id;

			database.collection("users").findOne({
				"accessToken": accessToken
			}, function (error, user) {
				if (user == null) {
					result.json({
						"status": "error",
						"message": "User has been logged out. Please login again."
					});
				} else {

					if (user.isBanned) {
						result.json({
							"status": "error",
							"message": "You have been banned."
						});
						return false;
					}

					var me = user;
					database.collection("users").findOne({
						"_id": ObjectId(_id)
					}, function (error, user) {
						if (user == null) {
							result.json({
								"status": "error",
								"message": "User does not exist."
							});
						} else {

                            if (_id.toString() == me._id.toString()) {
                                result.json({
                                    "status": "error",
                                    "message": "You cannot send a friend request to yourself."
                                });
                                return;
                            }

                            database.collection("users").findOne({
                                $and: [{
                                    "_id": ObjectId(_id)
                                }, {
                                    "friends._id": me._id
                                }]
                            }, function (error, isExists) {
                                if (isExists) {
                                    result.json({
                                        "status": "error",
                                        "message": "Friend request already sent."
                                    });
                                } else {
                                    database.collection("users").updateOne({
                                        "_id": ObjectId(_id)
                                    }, {
                                        $push: {
                                            "friends": {
                                                "_id": me._id,
                                                "name": me.name,
                                                "username": me.username,
                                                "profileImage": me.profileImage,
                                                "status": "Pending",
                                                "sentByMe": false,
                                                "inbox": []
                                            }
                                        }
                                    }, function (error, data) {

                                        database.collection("users").updateOne({
                                            "_id": me._id
                                        }, {
                                            $push: {
                                                "friends": {
                                                    "_id": user._id,
                                                    "name": user.name,
                                                    "username": user.username,
                                                    "profileImage": user.profileImage,
                                                    "status": "Pending",
                                                    "sentByMe": true,
                                                    "inbox": []
                                                }
                                            }
                                        }, function (error, data) {

                                            result.json({
                                                "status": "success",
                                                "message": "Friend request has been sent."
                                            });

                                        });

                                    });
                                }
                            });
						}
					});
				}
			});
		});

		app.get("/friends", function (request, result) {
			result.render("friends");
		});


		// --------------- Handle Accepting Friend Request. Here Cheking User is Banned or Not---------------------
		app.post("/acceptFriendRequest", function (request, result) {

			var accessToken = request.fields.accessToken;
			var _id = request.fields._id;

			database.collection("users").findOne({
				"accessToken": accessToken
			}, function (error, user) {
				if (user == null) {
					result.json({
						"status": "error",
						"message": "User has been logged out. Please login again."
					});
				} else {

					if (user.isBanned) {
						result.json({
							"status": "error",
							"message": "You have been banned."
						});
						return false;
					}

					var me = user;
					database.collection("users").findOne({
						"_id": ObjectId(_id)
					}, function (error, user) {
						if (user == null) {
							result.json({
								"status": "error",
								"message": "User does not exist."
							});
						} else {

                            for (var a = 0; a < me.friends.length; a++) {
                                if (me.friends[a]._id.toString() == _id.toString()
                                    && me.friends[a].status == "Accepted") {
                                    result.json({
                                        "status": "error",
                                        "message": "Friend request already accepted."
                                    });
                                    return;
                                }
                            }

							database.collection("users").updateOne({
								"_id": ObjectId(_id)
							}, {
								$push: {
									"notifications": {
										"_id": ObjectId(),
										"type": "friend_request_accepted",
										"content": me.name + " accepted your friend request.",
										"profileImage": me.profileImage,
										"isRead": false,
										"createdAt": new Date().getTime()
									}
								}
							});

							database.collection("users").updateOne({
								$and: [{
									"_id": ObjectId(_id)
								}, {
									"friends._id": me._id
								}]
							}, {
								$set: {
									"friends.$.status": "Accepted"
								}
							}, function (error, data) {

								database.collection("users").updateOne({
									$and: [{
										"_id": me._id
									}, {
										"friends._id": user._id
									}]
								}, {
									$set: {
										"friends.$.status": "Accepted"
									}
								}, function (error, data) {

									result.json({
										"status": "success",
										"message": "Friend request has been accepted."
									});

								});

							});

						}
					});
				}
			});
		});

		// --------------- Handle Unfriend Section. Here Cheking User is Banned or Not---------------------
		app.post("/unfriend", function (request, result) {

			var accessToken = request.fields.accessToken;
			var _id = request.fields._id;

			database.collection("users").findOne({
				"accessToken": accessToken
			}, function (error, user) {
				if (user == null) {
					result.json({
						"status": "error",
						"message": "User has been logged out. Please login again."
					});
				} else {

					if (user.isBanned) {
						result.json({
							"status": "error",
							"message": "You have been banned."
						});
						return false;
					}

					var me = user;
					database.collection("users").findOne({
						"_id": ObjectId(_id)
					}, function (error, user) {
						if (user == null) {
							result.json({
								"status": "error",
								"message": "User does not exist."
							});
						} else {

							database.collection("users").updateOne({
								"_id": ObjectId(_id)
							}, {
								$pull: {
									"friends": {
										"_id": me._id
									}
								}
							}, function (error, data) {

								database.collection("users").updateOne({
									"_id": me._id
								}, {
									$pull: {
										"friends": {
											"_id": user._id
										}
									}
								}, function (error, data) {

									result.json({
										"status": "success",
										"message": "Friend has been removed."
									});

								});

							});

						}
					});
				}
			});
		});

		app.get("/inbox", function (request, result) {
			result.render("inbox");
		});

		app.post("/sendMessage", function (request, result) {
			chat.sendMessage(request, result);
		});

		app.post("/deleteMessage", function (request, result) {
			chat.deleteMessage(request, result);
		});

		app.post("/getFriendsChat", function (request, result) {
			chat.getFriendsChat(request, result);
		});

		// --------------- Connecting To Socket ---------------------
		app.post("/connectSocket", function (request, result) {
			var accessToken = request.fields.accessToken;
			database.collection("users").findOne({
				"accessToken": accessToken
			}, function (error, user) {
				if (user == null) {
					result.json({
						"status": "error",
						"message": "User has been logged out. Please login again."
					});
				} else {

					if (user.isBanned) {
						result.json({
							"status": "error",
							"message": "You have been banned."
						});
						return false;
					}

					users[user._id] = socketID;
					result.json({
						"status": "status",
						"message": "Socket has been connected."
					});
				}
			});
		});

		app.get("/createPage", function (request, result) {
			result.render("createPage");
		});

		// --------------- Handle Create Page Section. ---------------------
		app.post("/createPage", function (request, result) {

			var accessToken = request.fields.accessToken;
			var name = request.fields.name;
			var domainName = request.fields.domainName;
			var additionalInfo = request.fields.additionalInfo;
			var coverPhoto = "";
            var type = request.fields.type;
            var imageData = request.fields.imageData;

			database.collection("users").findOne({
				"accessToken": accessToken
			}, function (error, user) {
				if (user == null) {
					result.json({
						"status": "error",
						"message": "User has been logged out. Please login again."
					});
				} else {

					if (user.isBanned) {
						result.json({
							"status": "error",
							"message": "You have been banned."
						});
						return false;
					}

                    if (type == "ios") {

                        coverPhoto = "public/images/" + new Date().getTime() + ".jpeg";

                        var base64Data = imageData.replace(/^data:image\/jpeg;base64,/, "");
                        base64Data += base64Data.replace('+', ' ');
                        var binaryData = new Buffer(base64Data, 'base64').toString('binary');
                        fileSystem.writeFile(coverPhoto, binaryData, "binary", function (err) {
                            // console.log(err);
                        });

                        database.collection("pages").insertOne({
                            "name": name,
                            "domainName": domainName,
                            "additionalInfo": additionalInfo,
                            "coverPhoto": coverPhoto,
                            "likers": [],
                            "user": {
                                "_id": user._id,
                                "name": user.name,
                                "profileImage": user.profileImage
                            }
                        }, function (error, data) {

                            result.json({
                                "status": "success",
                                "message": "Page has been created."
                            });

                        });
                    } else {
                        if (request.files.coverPhoto.size > 0 && request.files.coverPhoto.type.includes("image")) {

                            coverPhoto = "public/images/" + new Date().getTime() + "-" + request.files.coverPhoto.name;
                            
                            // Read the file
		                    fileSystem.readFile(request.files.coverPhoto.path, function (err, data) {
		                        if (err) throw err;
		                        console.log('File read!');

		                        // Write the file
		                        fileSystem.writeFile(coverPhoto, data, function (err) {
		                            if (err) throw err;
		                            console.log('File written!');

		                            database.collection("pages").insertOne({
		                                "name": name,
		                                "domainName": domainName,
		                                "additionalInfo": additionalInfo,
		                                "coverPhoto": coverPhoto,
		                                "likers": [],
		                                "user": {
		                                    "_id": user._id,
		                                    "name": user.name,
		                                    "profileImage": user.profileImage
		                                }
		                            }, function (error, data) {

		                                result.json({
		                                    "status": "success",
		                                    "message": "Page has been created."
		                                });

		                            });
		                        });

		                        // Delete the file
		                        fileSystem.unlink(request.files.coverPhoto.path, function (err) {
		                            if (err) throw err;
		                            console.log('File deleted!');
		                        });
		                    });
                        } else {
                            result.json({
                                "status": "error",
                                "message": "Please select a cover photo."
                            });
                        }
                    }
				}
			});
		});

		app.get("/pages", function (request, result) {
			result.render("pages");
		});

		// --------------- Fetching Pages That Already In The System---------------------
		app.post("/getPages", function (request, result) {
			var accessToken = request.fields.accessToken;

			database.collection("users").findOne({
				"accessToken": accessToken
			}, function (error, user) {
				if (user == null) {
					result.json({
						"status": "error",
						"message": "User has been logged out. Please login again."
					});
				} else {

					if (user.isBanned) {
						result.json({
							"status": "error",
							"message": "You have been banned."
						});
						return false;
					}

					database.collection("pages").find({
						$or: [{
							"user._id": user._id
						}, {
							"likers._id": user._id
						}]
					}).toArray(function (error, data) {

						result.json({
							"status": "success",
							"message": "Record has been fetched.",
							"data": data
						});
					});
				}
			});
		});

		// --------------- Render A Single Page ---------------------
		app.get("/page/:_id", function (request, result) {
			var _id = request.params._id;

			database.collection("pages").findOne({
				"_id": ObjectId(_id)
			}, function (error, page) {
				if (page == null) {
					result.json({
						"status": "error",
						"message": "Page does not exist."
					});
				} else {
					result.render("singlePage", {
						"_id": _id
					});
				}
			});
		});

		// --------------- Edit Page Section ---------------------
		app.get("/edit-page/:_id", function (request, result) {
			var _id = request.params._id;

			database.collection("pages").findOne({
				"_id": ObjectId(_id)
			}, function (error, page) {
				if (page == null) {
					result.json({
						"status": "error",
						"message": "Page does not exist."
					});
				} else {
					result.render("editPage", {
						"page": page
					});
				}
			});
		});

		app.post("/editPage", function (request, result) {
			page.update(request, result);
		});

		app.post("/deletePage", function (request, result) {
			page.destroy(request, result);
		});

		app.post("/getPageDetail", function (request, result) {
			var _id = request.fields._id;

			database.collection("pages").findOne({
				"_id": ObjectId(_id)
			}, function (error, page) {
				if (page == null) {
					result.json({
						"status": "error",
						"message": "Page does not exist."
					});
				} else {

					database.collection("posts").find({
						$and: [{
							"user._id": page._id
						}, {
							"type": "page_post"
						}]
					}).toArray(function (error, posts) {

						result.json({
							"status": "success",
							"message": "Record has been fetched.",
							"data": page,
							"posts": posts
						});
					});
				}
			});
		});

		// --------------- Handle Page Liking ---------------------
		app.post("/toggleLikePage", function (request, result) {
			var accessToken = request.fields.accessToken;
			var _id = request.fields._id;

			database.collection("users").findOne({
				"accessToken": accessToken
			}, function (error, user) {
				if (user == null) {
					result.json({
						"status": "error",
						"message": "User has been logged out. Please login again."
					});
				} else {

					if (user.isBanned) {
						result.json({
							"status": "error",
							"message": "You have been banned."
						});
						return false;
					}

					database.collection("pages").findOne({
						"_id": ObjectId(_id)
					}, function (error, page) {
						if (page == null) {
							result.json({
								"status": "error",
								"message": "Page does not exist."
							});
						} else {

							var isLiked = false;
							for (var a = 0; a < page.likers.length; a++) {
								var liker = page.likers[a];

								if (liker._id.toString() == user._id.toString()) {
									isLiked = true;
									break;
								}
							}

							if (isLiked) {
								database.collection("pages").updateOne({
									"_id": ObjectId(_id)
								}, {
									$pull: {
										"likers": {
											"_id": user._id,
										}
									}
								}, function (error, data) {

									database.collection("users").updateOne({
										"accessToken": accessToken
									}, {
										$pull: {
											"pages": {
												"_id": ObjectId(_id)
											}
										}
									}, function (error, data) {
										result.json({
											"status": "unliked",
											"message": "Page has been unliked."
										});
									});
								});
							} else {
								database.collection("pages").updateOne({
									"_id": ObjectId(_id)
								}, {
									$push: {
										"likers": {
											"_id": user._id,
											"name": user.name,
											"profileImage": user.profileImage
										}
									}
								}, function (error, data) {

									database.collection("users").updateOne({
										"accessToken": accessToken
									}, {
										$push: {
											"pages": {
												"_id": page._id,
												"name": page.name,
												"coverPhoto": page.coverPhoto
											}
										}
									}, function (error, data) {
										result.json({
											"status": "success",
											"message": "Page has been liked."
										});
									});
								});
							}
						}
					});
				}
			});
		});

		// --------------- Get User Liked Pages From The System---------------------
		app.post("/getMyPages", function (request, result) {
			var accessToken = request.fields.accessToken;

			database.collection("users").findOne({
				"accessToken": accessToken
			}, function (error, user) {
				if (user == null) {
					result.json({
						"status": "error",
						"message": "User has been logged out. Please login again."
					});
				} else {

					if (user.isBanned) {
						result.json({
							"status": "error",
							"message": "You have been banned."
						});
						return false;
					}

					database.collection("pages").find({
						"user._id": user._id
					}).toArray(function (error, data) {
						result.json({
							"status": "success",
							"message": "Record has been fetched.",
							"data": data
						});
					});

				}
			});
		});

		app.get("/createGroup", function (request, result) {
			result.render("createGroup");
		});

		// --------------- Create Group Section ---------------------
		app.post("/createGroup", function (request, result) {

			var accessToken = request.fields.accessToken;
			var name = request.fields.name;
			var additionalInfo = request.fields.additionalInfo;
			var coverPhoto = "";
            var type = request.fields.type;
            var imageData = request.fields.imageData;

			database.collection("users").findOne({
				"accessToken": accessToken
			}, function (error, user) {
				if (user == null) {
					result.json({
						"status": "error",
						"message": "User has been logged out. Please login again."
					});
				} else {

					if (user.isBanned) {
						result.json({
							"status": "error",
							"message": "You have been banned."
						});
						return false;
					}

                    if (type == "ios") {

                        coverPhoto = "public/images/" + new Date().getTime() + ".jpeg";

                        var base64Data = imageData.replace(/^data:image\/jpeg;base64,/, "");
                        base64Data += base64Data.replace('+', ' ');
                        var binaryData = new Buffer(base64Data, 'base64').toString('binary');
                        fileSystem.writeFile(coverPhoto, binaryData, "binary", function (err) {
                            // console.log(err);
                        });

                        database.collection("groups").insertOne({
                            "name": name,
                            "additionalInfo": additionalInfo,
                            "coverPhoto": coverPhoto,
                            "members": [{
                                "_id": user._id,
                                "name": user.name,
                                "profileImage": user.profileImage,
                                "status": "Accepted"
                            }],
                            "user": {
                                "_id": user._id,
                                "name": user.name,
                                "profileImage": user.profileImage
                            }
                        }, function (error, data) {

                            database.collection("users").updateOne({
                                "accessToken": accessToken
                            }, {
                                $push: {
                                    "groups": {
                                        "_id": data.insertedId,
                                        "name": name,
                                        "coverPhoto": coverPhoto,
                                        "status": "Accepted"
                                    }
                                }
                            }, function (error, data) {

                                result.json({
                                    "status": "success",
                                    "message": "Group has been created."
                                });
                            });
                        });
                    } else {

    					if (request.files.coverPhoto.size > 0 && request.files.coverPhoto.type.includes("image")) {

    						coverPhoto = "public/images/" + new Date().getTime() + "-" + request.files.coverPhoto.name;
    						
    						// Read the file
		                    fileSystem.readFile(request.files.coverPhoto.path, function (err, data) {
		                        if (err) throw err;
		                        console.log('File read!');

		                        // Write the file
		                        fileSystem.writeFile(coverPhoto, data, function (err) {
		                            if (err) throw err;
		                            console.log('File written!');

		                            database.collection("groups").insertOne({
		    							"name": name,
		    							"additionalInfo": additionalInfo,
		    							"coverPhoto": coverPhoto,
		    							"members": [{
		    								"_id": user._id,
		    								"name": user.name,
		    								"profileImage": user.profileImage,
		    								"status": "Accepted"
		    							}],
		    							"user": {
		    								"_id": user._id,
		    								"name": user.name,
		    								"profileImage": user.profileImage
		    							}
		    						}, function (error, data) {

		    							database.collection("users").updateOne({
		    								"accessToken": accessToken
		    							}, {
		    								$push: {
		    									"groups": {
		    										"_id": data.insertedId,
		    										"name": name,
		    										"coverPhoto": coverPhoto,
		    										"status": "Accepted"
		    									}
		    								}
		    							}, function (error, data) {

		    								result.json({
		    									"status": "success",
		    									"message": "Group has been created."
		    								});
		    							});
		    						});
		                        });

		                        // Delete the file
		                        fileSystem.unlink(request.files.coverPhoto.path, function (err) {
		                            if (err) throw err;
		                            console.log('File deleted!');
		                        });
		                    });
    					} else {
    						result.json({
    							"status": "error",
    							"message": "Please select a cover photo."
    						});
    					}
                    }
				}
			});
		});

		app.get("/groups", function (request, result) {
			result.render("groups");
		});

		
		// --------------- Get Groups In The System ---------------------
		app.post("/getGroups", function (request, result) {
			var accessToken = request.fields.accessToken;

			database.collection("users").findOne({
				"accessToken": accessToken
			}, function (error, user) {
				if (user == null) {
					result.json({
						"status": "error",
						"message": "User has been logged out. Please login again."
					});
				} else {

					if (user.isBanned) {
						result.json({
							"status": "error",
							"message": "You have been banned."
						});
						return false;
					}

					database.collection("groups").find({
						$or: [{
							"user._id": user._id
						}, {
							"members._id": user._id
						}]
					}).toArray(function (error, data) {

						result.json({
							"status": "success",
							"message": "Record has been fetched.",
							"data": data
						});
					});
				}
			});
		});

		// --------------- Find A Group Already In The System ---------------------
		app.get("/group/:_id", function (request, result) {
			var _id = request.params._id;

			database.collection("groups").findOne({
				"_id": ObjectId(_id)
			}, function (error, group) {
				if (group == null) {
					result.json({
						"status": "error",
						"message": "Group does not exist."
					});
				} else {
					result.render("singleGroup", {
						"_id": _id
					});
				}
			});
		});

		// --------------- Edit Group Details In The System ---------------------
		app.get("/edit-group/:_id", function (request, result) {
			var _id = request.params._id;

			database.collection("groups").findOne({
				"_id": ObjectId(_id)
			}, function (error, group) {
				if (group == null) {
					result.json({
						"status": "error",
						"message": "Group does not exist."
					});
				} else {
					result.render("editGroup", {
						"group": group
					});
				}
			});
		});

		app.post("/editGroup", function (request, result) {
			group.update(request, result);
		});

		app.post("/deleteGroup", function (request, result) {
			group.destroy(request, result);
		});

		app.post("/getGroupDetail", function (request, result) {
			var _id = request.fields._id;

			database.collection("groups").findOne({
				"_id": ObjectId(_id)
			}, function (error, group) {
				if (group == null) {
					result.json({
						"status": "error",
						"message": "Group does not exist."
					});
				} else {

					database.collection("posts").find({
						$and: [{
							"user._id": group._id
						}, {
							"type": "group_post"
						}]
					})
					.sort({
						"createdAt": -1
					})
					.toArray(function (error, posts) {

						result.json({
							"status": "success",
							"message": "Record has been fetched.",
							"group": group,
							"data": posts
						});
					});

				}
			});
		});

		// --------------- Join For A Group ---------------------
		app.post("/toggleJoinGroup", function (request, result) {
			var accessToken = request.fields.accessToken;
			var _id = request.fields._id;

			database.collection("users").findOne({
				"accessToken": accessToken
			}, function (error, user) {
				if (user == null) {
					result.json({
						"status": "error",
						"message": "User has been logged out. Please login again."
					});
				} else {

					if (user.isBanned) {
						result.json({
							"status": "error",
							"message": "You have been banned."
						});
						return false;
					}

					database.collection("groups").findOne({
						"_id": ObjectId(_id)
					}, function (error, group) {
						if (group == null) {
							result.json({
								"status": "error",
								"message": "Group does not exist."
							});
						} else {

							var isMember = false;
							for (var a = 0; a < group.members.length; a++) {
								var member = group.members[a];

								if (member._id.toString() == user._id.toString()) {
									isMember = true;
									break;
								}
							}

							if (isMember) {
								database.collection("groups").updateOne({
									"_id": ObjectId(_id)}, {
										$pull: {
											"members": {
												"_id": user._id,
											}
										}
									}, function (error, data) {

										database.collection("users").updateOne({
											"accessToken": accessToken}, {
												$pull: {
													"groups": {
														"_id": ObjectId(_id)
													}
												}
											}, function (error, data) {
												result.json({
													"status": "leaved",
													"message": "Group has been left."
												});
											});
									});
							} else {
								database.collection("groups").updateOne({
									"_id": ObjectId(_id)
								}, {
									$push: {
										"members": {
											"_id": user._id,
											"name": user.name,
											"profileImage": user.profileImage,
											"status": "Pending"
										}
									}
								}, function (error, data) {

									database.collection("users").updateOne({
										"accessToken": accessToken
									}, {
										$push: {
											"groups": {
												"_id": group._id,
												"name": group.name,
												"coverPhoto": group.coverPhoto,
												"status": "Pending"
											}
										}
									}, function (error, data) {

										database.collection("users").updateOne({
											"_id": group.user._id
										}, {
											$push: {
												"notifications": {
													"_id": ObjectId(),
													"type": "group_join_request",
													"content": user.name + " sent a request to join your group.",
													"profileImage": user.profileImage,
													"groupId": group._id,
													"userId": user._id,
													"status": "Pending",
													"isRead": false,
													"createdAt": new Date().getTime()
												}
											}
										});

										result.json({
											"status": "success",
											"message": "Request to join group has been sent."
										});
									});
								});
							}
						}
					});
				}
			});
		});

		app.get("/notifications", function (request, result) {
			result.render("notifications");
		});

		// --------------- Group Request Accepting Section ---------------------
		app.post("/acceptRequestJoinGroup", function (request, result) {
			var accessToken = request.fields.accessToken;
			var _id = request.fields._id;
			var groupId = request.fields.groupId;
			var userId = request.fields.userId;

			database.collection("users").findOne({
				"accessToken": accessToken
			}, function (error, user) {
				if (user == null) {
					result.json({
						"status": "error",
						"message": "User has been logged out. Please login again."
					});
				} else {

					if (user.isBanned) {
						result.json({
							"status": "error",
							"message": "You have been banned."
						});
						return false;
					}

					database.collection("groups").findOne({
						"_id": ObjectId(groupId)
					}, function (error, group) {
						if (group == null) {
							result.json({
								"status": "error",
								"message": "Group does not exist."
							});
						} else {

							if (group.user._id.toString() != user._id.toString()) {
								result.json({
									"status": "error",
									"message": "Sorry, you do not own this group."
								});
								return;
							}

							database.collection("groups").updateOne({
								$and: [{
									"_id": group._id
								}, {
									"members._id": ObjectId(userId)
								}]
							}, {
								$set: {
									"members.$.status": "Accepted"
								}
							}, function (error, data) {

								database.collection("users").updateOne({
									$and: [{
										"accessToken": accessToken
									}, {
										"notifications.groupId": group._id
									}]
								}, {
									$set: {
										"notifications.$.status": "Accepted"
									}
								}, function (error, data) {

									database.collection("users").updateOne({
										$and: [{
											"_id": ObjectId(userId)
										}, {
											"groups._id": group._id
										}]
									}, {
										$set: {
											"groups.$.status": "Accepted"
										}
									}, function (error, data) {

										result.json({
											"status": "success",
											"message": "Group join request has been accepted."
										});
									});
								});
							});
						}
					});
				}
			});
		});

		// --------------- Marking Notifications As Read ---------------------
		app.post("/markNotificationsAsRead", function (request, result) {
			var accessToken = request.fields.accessToken;

			database.collection("users").findOne({
				"accessToken": accessToken
			}, function (error, user) {
				if (user == null) {
					result.json({
						"status": "error",
						"message": "User has been logged out. Please login again."
					});
				} else {

					if (user.isBanned) {
						result.json({
							"status": "error",
							"message": "You have been banned."
						});
						return false;
					}

					database.collection("users").updateMany({
						$and: [{
							"accessToken": accessToken
						}, {
							"notifications.isRead": false
						}]
					}, {
						$set: {
							"notifications.$.isRead": true
						}
					}, function (error, data) {
						result.json({
							"status": "success",
							"message": "Notifications has been marked as read."
						});
					});
				}
			});
		});

		// --------------- Reject Request For Joining Group ---------------------
		app.post("/rejectRequestJoinGroup", function (request, result) {
			var accessToken = request.fields.accessToken;
			var _id = request.fields._id;
			var groupId = request.fields.groupId;
			var userId = request.fields.userId;

			database.collection("users").findOne({
				"accessToken": accessToken
			}, function (error, user) {
				if (user == null) {
					result.json({
						"status": "error",
						"message": "User has been logged out. Please login again."
					});
				} else {

					if (user.isBanned) {
						result.json({
							"status": "error",
							"message": "You have been banned."
						});
						return false;
					}

					database.collection("groups").findOne({
						"_id": ObjectId(groupId)
					}, function (error, group) {
						if (group == null) {
							result.json({
								"status": "error",
								"message": "Group does not exist."
							});
						} else {

							if (group.user._id.toString() != user._id.toString()) {
								result.json({
									"status": "error",
									"message": "Sorry, you do not own this group."
								});
								return;
							}

							database.collection("groups").updateOne({
								"_id": group._id
							}, {
								$pull: {
									"members": {
										"_id": ObjectId(userId)
									}
								}
							}, function (error, data) {

								database.collection("users").updateOne({
									"accessToken": accessToken
								}, {
									$pull: {
										"notifications": {
											"groupId": group._id
										}
									}
								}, function (error, data) {

									database.collection("users").updateOne({
										"_id": ObjectId(userId)
									}, {
										$pull: {
											"groups": {
												"_id": group._id
											}
										}
									}, function (error, data) {

										result.json({
											"status": "success",
											"message": "Group join request has been rejected."
										});
									});
								});
							});
						}
					});
				}
			});
		});

		// --------------- share Post Section ---------------------
		app.post("/sharePost", function (request, result) {

			var accessToken = request.fields.accessToken;
			var _id = request.fields._id;
			var type = "shared";
			var createdAt = new Date().getTime();

			database.collection("users").findOne({
				"accessToken": accessToken
			}, function (error, user) {
				if (user == null) {
					result.json({
						"status": "error",
						"message": "User has been logged out. Please login again."
					});
				} else {

					if (user.isBanned) {
						result.json({
							"status": "error",
							"message": "You have been banned."
						});
						return false;
					}

					database.collection("posts").findOne({
						"_id": ObjectId(_id)
					}, function (error, post) {
						if (post == null) {
							result.json({
								"status": "error",
								"message": "Post does not exist."
							});
						} else {

							database.collection("posts").updateOne({
								"_id": ObjectId(_id)
							}, {
								$push: {
									"shares": {
										"_id": user._id,
										"name": user.name,
										"username": user.username,
										"profileImage": user.profileImage,
										"createdAt": new Date().getTime()
									}
								}
							}, function (error, data) {

								database.collection("posts").insertOne({
									"caption": post.caption,
									"image": post.image,
									"video": post.video,
									"type": type,
									"createdAt": createdAt,
									"likers": [],
									"comments": [],
									"shares": [],
									"user": {
										"_id": user._id,
										"name": user.name,
										"gender": user.gender,
										"profileImage": user.profileImage
									}
								}, function (error, data) {

									database.collection("users").updateOne({
										$and: [{
											"_id": post.user._id
										}, {
											"posts._id": post._id
										}]
									}, {
										$push: {
											"posts.$[].shares": {
												"_id": user._id,
												"name": user.name,
												"profileImage": user.profileImage
											}
										}
									});

									result.json({
										"status": "success",
										"message": "Post has been shared."
									});
								});
							});
						}
					});
				}
			});
		});

		// --------------- Share Post In Page ---------------------
		app.post("/sharePostInPage", async function (request, result) {
			var accessToken = request.fields.accessToken;
			var pageId = request.fields.pageId;
			var postId = request.fields.postId;
			var type = "page_post";
			var createdAt = new Date().getTime();

			var user = await database.collection("users").findOne({
				"accessToken": accessToken
			});
			if (user == null) {
				result.json({
					"status": "error",
					"message": "User has been logged out. Please login again."
				});
				return false;
			}

			if (user.isBanned) {
				result.json({
					"status": "error",
					"message": "You have been banned."
				});
				return false;
			}

			var post = await database.collection("posts").findOne({
				"_id": ObjectId(postId)
			});
			if (post == null) {
				result.json({
					"status": "error",
					"message": "Post does not exist."
				});
				return false;
			}

			var page = await database.collection("pages").findOne({
				"_id": ObjectId(pageId)
			});
			if (page == null) {
				result.json({
					"status": "error",
					"message": "Page does not exist."
				});
				return false;
			}

			if (page.user._id.toString() != user._id.toString()) {
				result.json({
					"status": "error",
					"message": "Sorry, you do not own this page."
				});
				return false;
			}

			/* insert in posts nested array */
			await database.collection("posts").findOneAndUpdate({
				"_id": post._id
			}, {
				$push: {
					"shares": {
						"_id": user._id,
						"name": user.name,
						"username": user.username,
						"profileImage": user.profileImage,
						"createdAt": new Date().getTime()
					}
				}
			});

			/* insert new document in posts collection */
			await database.collection("posts").insertOne({
				"caption": post.caption,
				"image": post.image,
				"video": post.video,
				"type": type,
				"createdAt": createdAt,
				"likers": [],
				"comments": [],
				"shares": [],
				"user": {
					"_id": page._id,
					"name": page.name,
					"username": page.username,
					"profileImage": page.coverPhoto
				}
			});

			result.json({
				"status": "success",
				"message": "Post has been shared in page '" + page.name + "'."
			});
		});

		// --------------- Share Post In A Group ---------------------
		app.post("/sharePostInGroup", async function (request, result) {

			var accessToken = request.fields.accessToken;
			var groupId = request.fields.groupId;
			var postId = request.fields.postId;
			var type = "group_post";
			var createdAt = new Date().getTime();

			var user = await database.collection("users").findOne({
				"accessToken": accessToken
			});
			if (user == null) {
				result.json({
					"status": "error",
					"message": "User has been logged out. Please login again."
				});
				return false;
			}

			if (user.isBanned) {
				result.json({
					"status": "error",
					"message": "You have been banned."
				});
				return false;
			}

			var post = await database.collection("posts").findOne({
				"_id": ObjectId(postId)
			});
			if (post == null) {
				result.json({
					"status": "error",
					"message": "Post does not exist."
				});
				return false;
			}

			var group = await database.collection("groups").findOne({
				"_id": ObjectId(groupId)
			});
			if (group == null) {
				result.json({
					"status": "error",
					"message": "Group does not exist."
				});
				return false;
			}

			var isMember = false;
			for (var a = 0; a < group.members.length; a++) {
				var member = group.members[a];

				if (member._id.toString() == user._id.toString() && member.status == "Accepted") {
					isMember = true;
					break;
				}
			}

			if (!isMember) {
				result.json({
					"status": "error",
					"message": "Sorry, you are not a member of this group."
				});
				return false;
			}

			/* insert in posts nested array */
			await database.collection("posts").findOneAndUpdate({
				"_id": post._id
			}, {
				$push: {
					"shares": {
						"_id": user._id,
						"name": user.name,
						"username": user.username,
						"profileImage": user.profileImage,
						"createdAt": new Date().getTime()
					}
				}
			});

			
			// --------------- Inserting A New Post For Database ---------------------
			/* insert new document in posts collection */
			await database.collection("posts").insertOne({
				"caption": post.caption,
				"image": post.image,
				"video": post.video,
				"type": type,
				"createdAt": createdAt,
				"likers": [],
				"comments": [],
				"shares": [],
				"user": {
					"_id": group._id,
					"name": group.name,
					"username": group.name,
					"profileImage": group.coverPhoto
				},
				"uploader": {
					"_id": user._id,
					"name": user.name,
					"username": user.username,
					"profileImage": user.profileImage
				}
			});

			result.json({
				"status": "success",
				"message": "Post has been shared in group '" + group.name + "'."
			});
		});

		// --------------- Get A Specific Post From Database ---------------------
		app.post("/getPostById", async function (request, result) {
			var accessToken = request.fields.accessToken;
			var _id = request.fields._id;

			var user = await database.collection("users").findOne({
				"accessToken": accessToken
			});

			if (user == null) {
				result.json({
					"status": "error",
					"message": "User has been logged out. Please login again."
				});
				return false;
			}

			if (user.isBanned) {
				result.json({
					"status": "error",
					"message": "You have been banned."
				});
				return false;
			}

			var post = await database.collection("posts").findOne({
				"_id": ObjectId(_id)
			});

			if (post == null) {
				result.json({
					"status": "error",
					"message": "Post does not exist."
				});
				return false;
			}

			result.json({
				"status": "success",
				"message": "Data has been fetched.",
				"post": post
			});
		});

		app.post("/editPost", async function (request, result) {
			editPost.execute(request, result);
		});

		// --------------- Delete Post From System ---------------------
		app.post("/deletePost", async function (request, result) {
			var accessToken = request.fields.accessToken;
			var _id = request.fields._id;

			var user = await database.collection("users").findOne({
				"accessToken": accessToken
			});

			if (user == null) {
				result.json({
					"status": "error",
					"message": "User has been logged out. Please login again."
				});
				return false;
			}

			if (user.isBanned) {
				result.json({
					"status": "error",
					"message": "You have been banned."
				});
				return false;
			}

			var post = await database.collection("posts").findOne({
				"_id": ObjectId(_id)
			});

			if (post == null) {
				result.json({
					"status": "error",
					"message": "Post does not exist."
				});
				return false;
			}

			var isMyUploaded = false;

			if (post.type == "group_post") {
				isMyUploaded = (post.uploader._id.toString() == user._id.toString());
			} else {
				isMyUploaded = (post.user._id.toString() == user._id.toString());
			}

			if (!isMyUploaded) {
				result.json({
					"status": "error",
					"message": "Sorry, you do not own this post."
				});
				return false;
			}

			await database.collection("posts").remove({
				"_id": post._id
			});

			result.json({
				"status": "success",
				"message": "Post has been deleted."
			});
		});

		// --------------- Fetch More Post Section ---------------------
		app.post("/fetch-more-posts", async function (request, result) {
			var accessToken = request.fields.accessToken;
			var start = parseInt(request.fields.start);

			var user = await database.collection("users").findOne({
				"accessToken": accessToken
			});

			if (user == null) {
				result.json({
					"status": "error",
					"message": "User has been logged out. Please login again."
				});
				return false;
			}

			if (user.isBanned) {
				result.json({
					"status": "error",
					"message": "You have been banned."
				});
				return false;
			}

			var ids = [];
			ids.push(user._id);

			for (var a = 0; a < user.pages.length; a++) {
				ids.push(user.pages[a]._id);
			}

			for (var a = 0; a < user.groups.length; a++) {
				if (user.groups[a].status == "Accepted") {
					ids.push(user.groups[a]._id);
				}
			}

			for (var a = 0; a < user.friends.length; a++) {
	            if (user.friends[a].status == "Accepted") {
					ids.push(user.friends[a]._id);
	            }
			}

			const posts = await database.collection("posts")
				.find({
					"user._id": {
						$in: ids
					}
				})
				.sort({
					"createdAt": -1
				})
				.skip(start)
				.limit(5)
				.toArray();

			result.json({
				"status": "success",
				"message": "Record has been fetched",
				"data": posts
			});
		});

		// --------------- Show Who Are Post Likers  ---------------------
		app.post("/showPostLikers", async function (request, result) {
			var accessToken = request.fields.accessToken;
			var _id = request.fields._id;

			var user = await database.collection("users").findOne({
				"accessToken": accessToken
			});

			if (user == null) {
				result.json({
					"status": "error",
					"message": "User has been logged out. Please login again."
				});
				return false;
			}

			if (user.isBanned) {
				result.json({
					"status": "error",
					"message": "You have been banned."
				});
				return false;
			}

			var post = await database.collection("posts").findOne({
				"_id": ObjectId(_id)
			});

			if (post == null) {
				result.json({
					"status": "error",
					"message": "Post does not exist."
				});
				return false;
			}

			result.json({
				"status": "success",
				"message": "Data has been fetched.",
				"data": post.likers
			});
		});

		// --------------- Show Post Shares ---------------------
		app.post("/showPostSharers", async function (request, result) {
			var accessToken = request.fields.accessToken;
			var _id = request.fields._id;

			var user = await database.collection("users").findOne({
				"accessToken": accessToken
			});

			if (user == null) {
				result.json({
					"status": "error",
					"message": "User has been logged out. Please login again."
				});
				return false;
			}

			if (user.isBanned) {
				result.json({
					"status": "error",
					"message": "You have been banned."
				});
				return false;
			}

			var post = await database.collection("posts").findOne({
				"_id": ObjectId(_id)
			});

			if (post == null) {
				result.json({
					"status": "error",
					"message": "Post does not exist."
				});
				return false;
			}

			result.json({
				"status": "success",
				"message": "Data has been fetched.",
				"data": post.shares
			});
		});

		// --------------- Customer Support Section For Creating A New Inquiery ---------------------
		app.get("/customer-support", function (request, result) {
			result.render("customer-support");
		});

		app.post("/createTicket", async function (request, result) {
			var accessToken = request.fields.accessToken;
			const description = request.fields.description;
			var image = "";
			var video = "";
			const comments = [];
			var createdAt = new Date().getTime();

			const user = await database.collection("users").findOne({
				"accessToken": accessToken
			});
			
			if (user == null) {
				result.json({
					"status": "error",
					"message": "User has been logged out. Please login again."
				});
				return false;
			}
			
			if (user.isBanned) {
				result.json({
					"status": "error",
					"message": "You have been banned."
				});
				return false;
			}

			if (request.files.image.size > 0 && request.files.image.type.includes("image")) {
				image = "public/images/ticket-" + new Date().getTime() + "-" + request.files.image.name;

				// Read the file
				fileSystem.readFile(request.files.image.path, function (err, data) {
					if (err) throw err;
					console.log('File read!');

					// Write the file
					fileSystem.writeFile(image, data, function (err) {
						if (err) throw err;
						console.log('File written!');
					});

					// Delete the file
					fileSystem.unlink(request.files.image.path, function (err) {
						if (err) throw err;
						console.log('File deleted!');
					});
				});
			}

			if (request.files.video.size > 0 && request.files.video.type.includes("video")) {
				video = "public/videos/ticket-" + new Date().getTime() + "-" + request.files.video.name;

				// Read the file
				fileSystem.readFile(request.files.video.path, function (err, data) {
					if (err) throw err;
					console.log('File read!');

					// Write the file
					fileSystem.writeFile(video, data, function (err) {
						if (err) throw err;
						console.log('File written!');
					});

					// Delete the file
					fileSystem.unlink(request.files.video.path, function (err) {
						if (err) throw err;
						console.log('File deleted!');
					});
				});
			}

			const ticket = await database.collection("tickets").insertOne({
				"description": description,
				"user": {
					"_id": user._id,
					"name": user.name,
					"username": user.username,
					"profileImage": user.profileImage
				},
				"image": image,
				"video": video,
				"status": "open", // closed
				"comments": comments,
				"createdAt": createdAt
			});

			result.json({
				"status": "success",
				"message": "Ticket has been created. We will respond to your request soon.",
				"ticket": ticket.ops[0]
			});
		});

		// --------------- Get All Added Inquieries ---------------------
		app.post("/getMyAllTickets", async function (request, result) {
			var accessToken = request.fields.accessToken;
			
			const user = await database.collection("users").findOne({
				"accessToken": accessToken
			});
			
			if (user == null) {
				result.json({
					"status": "error",
					"message": "User has been logged out. Please login again."
				});
				return false;
			}
			
			if (user.isBanned) {
				result.json({
					"status": "error",
					"message": "You have been banned."
				});
				return false;
			}

			var data = await database.collection("tickets").find({
				"user._id": user._id
			}).toArray();

			data = data.reverse();

			result.json({
				"status": "success",
				"message": "Data has been fetched.",
				"data": data
			});
		});

		app.get("/editTicket/:_id", async function (request, result) {
			result.render("editTicket", {
				"_id": request.params._id
			});
		});

		// --------------- Get A Inquiery And Edit It ---------------------
		app.post("/getTicket", async function (request, result) {
			var accessToken = request.fields.accessToken;
			var _id = request.fields._id;
			
			const user = await database.collection("users").findOne({
				"accessToken": accessToken
			});
			
			if (user == null) {
				result.json({
					"status": "error",
					"message": "User has been logged out. Please login again."
				});
				return false;
			}
			
			if (user.isBanned) {
				result.json({
					"status": "error",
					"message": "You have been banned."
				});
				return false;
			}

			const data = await database.collection("tickets").findOne({
				$and: [{
					"_id": ObjectId(_id)
				}, {
					"user._id": user._id
				}]
			});

			if (data == null) {
				result.json({
					"status": "error",
					"message": "Sorry, you are not the owner of this ticket."
				});
				return false;
			}

			result.json({
				"status": "success",
				"message": "Data has been fetched.",
				"data": data
			});
		});

		// --------------- Inquiery Editing ---------------------
		app.post("/editTicket/:_id", async function (request, result) {

			var accessToken = request.fields.accessToken;
			var _id = request.params._id;
			var description = request.fields.description;
			var image = "";
			var video = "";
			
			const user = await database.collection("users").findOne({
				"accessToken": accessToken
			});
			
			if (user == null) {
				result.render("editTicket", {
					"_id": request.params._id,
					"status": "error",
					"message": "User has been logged out. Please login again."
				});

				return false;
			}
			
			if (user.isBanned) {
				result.render("editTicket", {
					"_id": request.params._id,
					"status": "error",
					"message": "You have been banned."
				});

				return false;
			}

			const data = await database.collection("tickets").findOne({
				$and: [{
					"_id": ObjectId(_id)
				}, {
					"user._id": user._id
				}]
			});

			if (data == null) {
				result.render("editTicket", {
					"_id": request.params._id,
					"status": "error",
					"message": "Sorry, you are not the owner of this ticket."
				});

				return false;
			}

			image = data.image;
			video = data.video;

			if (request.files.image.size > 0 && request.files.image.type.includes("image")) {
				image = "public/images/ticket-" + new Date().getTime() + "-" + request.files.image.name;

				fileSystem.unlink(data.image, function (error) {
					console.log("Preview image has been deleted: " + error);
				});

				// Read the file
				fileSystem.readFile(request.files.image.path, function (err, data) {
					if (err) throw err;
					console.log('File read!');

					// Write the file
					fileSystem.writeFile(image, data, function (err) {
						if (err) throw err;
						console.log('File written!');
					});

					// Delete the file
					fileSystem.unlink(request.files.image.path, function (err) {
						if (err) throw err;
						console.log('File deleted!');
					});
				});
			}

			if (request.files.video.size > 0 && request.files.video.type.includes("video")) {
				video = "public/videos/ticket-" + new Date().getTime() + "-" + request.files.video.name;

				fileSystem.unlink(data.video, function (error) {
					console.log("Preview video has been deleted: " + error);
				});

				// Read the file
				fileSystem.readFile(request.files.video.path, function (err, data) {
					if (err) throw err;
					console.log('File read!');

					// Write the file
					fileSystem.writeFile(video, data, function (err) {
						if (err) throw err;
						console.log('File written!');
					});

					// Delete the file
					fileSystem.unlink(request.files.video.path, function (err) {
						if (err) throw err;
						console.log('File deleted!');
					});
				});
			}

			await database.collection("tickets").findOneAndUpdate({
				$and: [{
					"_id": ObjectId(_id)
				}, {
					"user._id": user._id
				}]
			}, {
				$set: {
					"description": description,
					"image": image,
					"video": video
				}
			});

			result.render("editTicket", {
				"_id": request.params._id,
				"status": "success",
				"message": "Ticket has been updated."
			});
		});

		// --------------- Delete A Inquiery From The System ---------------------
		app.post("/deleteTicket", async function (request, result) {
			var accessToken = request.fields.accessToken;
			var _id = request.fields._id;
			
			const user = await database.collection("users").findOne({
				"accessToken": accessToken
			});
			
			if (user == null) {
				result.json({
					"status": "error",
					"message": "User has been logged out. Please login again."
				});
				return false;
			}
			
			if (user.isBanned) {
				result.json({
					"status": "error",
					"message": "You have been banned."
				});
				return false;
			}

			const data = await database.collection("tickets").findOne({
				$and: [{
					"_id": ObjectId(_id)
				}, {
					"user._id": user._id
				}]
			});

			if (data == null) {
				result.json({
					"status": "error",
					"message": "Sorry, you are not the owner of this ticket."
				});
				return false;
			}

			if (data.image != "") {
				fileSystem.unlink(data.image, function (error) {
					console.log("Preview image has been deleted: " + error);
				});
			}

			if (data.video != "") {
				fileSystem.unlink(data.video, function (error) {
					console.log("Preview video has been deleted: " + error);
				});
			}

			await database.collection("tickets").findOneAndDelete({
				$and: [{
					"_id": ObjectId(_id)
				}, {
					"user._id": user._id
				}]
			});

			result.json({
				"status": "success",
				"message": "Ticket has been deleted."
			});
		});

		app.get("/tickets/detail/:_id", function (request, result) {
            const _id = request.params._id;

            result.render("tickets/detail", {
                "_id": _id
            });
        });
		
		// --------------- Adding A Comment For A Inquiery ---------------------
		app.post("/tickets/add-comment", async function (request, result) {
            var accessToken = request.fields.accessToken;
			var _id = request.fields._id;
			var comment = request.fields.comment;
			
			const user = await database.collection("users").findOne({
				"accessToken": accessToken
			});
			
			if (user == null) {
				result.json({
					"status": "error",
					"message": "User has been logged out. Please login again."
				});

				return false;
			}

            const data = await database.collection("tickets").findOne({
				$and: [{
					"_id": ObjectId(_id)
				}, {
					"user._id": user._id
				}]
			});

			if (data == null) {
				result.json({
					"status": "error",
					"message": "Sorry, you do not own this ticket."
				});

				return false;
			}

            if (data.status == "closed") {
                result.json({
					"status": "error",
					"message": "Sorry, the ticket is closed."
				});

				return false;
            }

            const commentObj = {
                "_id": ObjectId(),
                "user": {
                    "_id": user._id,
                    "name": user.name,
                    "username": user.username,
                    "profileImage": user.profileImage
                },
                "comment": comment,
                "createdAt": new Date().getTime()
            };

            await database.collection("tickets").findOneAndUpdate({
				$and: [{
					"_id": ObjectId(_id)
				}, {
					"user._id": user._id
				}]
			}, {
				$push: {
					"comments": commentObj
				}
			});

            // send notification to the admin
            /*self.database.collection("users").updateOne({
                "_id": data.user._id
            }, {
                $push: {
                    "notifications": {
                        "_id": self.ObjectId(),
                        "type": "comment_on_ticket",
                        "content": "You have a new comment on your <a href='" + mainURL + "/tickets/detail/" + data._id + "' class='notification-link'>ticket</a>.",
                        "profileImage": "",
                        "isRead": false,
                        "createdAt": new Date().getTime()
                    }
                }
            });*/

            result.json({
                "status": "success",
				"message": "Comment has been added.",
                "comment": commentObj
            });
        });

	});
});