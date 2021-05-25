module.exports = {

    database: null,
    functions: null,
    fileSystem: null,
    requestModule: null,
    filter: null,
    ObjectId: null,

    request: null,
    result: null,

    image: "",
    video: "",
    type: "",
    user: null,
    post: null,

    execute: async function (request, result) {
        var accessToken = request.fields.accessToken;
        var _id = request.fields._id;
        var caption = request.fields.caption;
        var type = request.fields.type;
        var createdAt = new Date().getTime();
        var base64 = request.fields.imgData;

        var self = this;

        this.request = request;
        this.result = result;

        var user = await this.database.collection("users").findOne({
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

        if (this.filter.isProfane(caption)) {
            result.json({
                "status": "error",
                "message": "Your message contains abusive or offensive language."
            });

            return false;
        }

        var post = await this.database.collection("posts").findOne({
            "_id": this.ObjectId(_id)
        });

        if (post == null) {
            result.json({
                "status": "error",
                "message": "Post does not exist."
            });
            return false;
        }

        if (type == "post") {
            if (post.user._id.toString() != user._id.toString()) {
                result.json({
                    "status": "error",
                    "message": "Sorry, you do not own this post."
                });
                return false;
            }
        }

        this.user = user;
        this.post = post;

        var image = post.image;
        var video = post.video;

        if (request.files.image.size > 0 && request.files.image.type.includes("image")) {
            image = "public/images/" + new Date().getTime() + "-" + request.files.image.name;
            this.image = image;

            this.requestModule.post("http://127.0.0.1:8888/scripts/social-networking-site/class.ImageFilter.php", {
                formData: {
                    "validate_image": 1,
                    "base_64": base64
                }
            }, function(err, res, body) {
                if (!err && res.statusCode === 200) {
                    // console.log(body);

                    if (body > 60) {
                        result.json({
                            "status": "error",
                            "message": "Image contains nudity."
                        });

                        return false;
                    } else {
                        self.moveForward();
                    }
                }
            });
        } else {
            self.moveForward();
        }
    },

    moveForward: async function () {

        var self = this;

        // Read the file
        if (this.request.files.image.size > 0 && this.request.files.image.type.includes("image")) {
            this.fileSystem.readFile(this.request.files.image.path, function (err, data) {
                if (err) throw err;
                console.log('File read!');

                // Write the file
                self.fileSystem.writeFile(self.image, data, function (err) {
                    if (err) throw err;
                    console.log('File written!');

                    self.fileUpload_moveForward();
                });

                // Delete the file
                self.fileSystem.unlink(self.request.files.image.path, function (err) {
                    if (err) throw err;
                    console.log('File deleted!');
                });
            });
        } else if (this.request.files.video.size > 0 && this.request.files.video.type.includes("video")) {
            this.video = "public/videos/" + new Date().getTime() + "-" + this.request.files.video.name;

            // Read the file
            this.fileSystem.readFile(this.request.files.video.path, function (err, data) {
                if (err) throw err;
                console.log('File read!');

                // Write the file
                self.fileSystem.writeFile(self.video, data, function (err) {
                    if (err) throw err;
                    console.log('File written!');

                    self.fileUpload_moveForward();
                });

                // Delete the file
                self.fileSystem.unlink(self.request.files.video.path, function (err) {
                    if (err) throw err;
                    console.log('File deleted!');
                });
            });
        } else {
            this.fileUpload_moveForward();
        }
    },

    fileUpload_moveForward: async function () {
        var updatedPost = await this.database.collection("posts").findOneAndUpdate({
            "_id": this.post._id
        }, {
            $set: {
                "caption": this.request.fields.caption,
                "image": this.image,
                "video": this.video
            }
        }, {
            returnOriginal: false
        });

        this.result.json({
            "status": "success",
            "message": "Post has been updated.",
            "post": updatedPost.value
        });

        return true;
    }
};