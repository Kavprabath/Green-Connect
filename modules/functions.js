module.exports = {
    
    database: null,

    updateUser: async function (user, profileImage, name) {
        /* update in profile views collection.
         * 'user' means the person who viewed the profile.
         */
        await this.database.collection("profile_viewers").updateMany({
            "user._id": user._id
        }, {
            $set: {
                "user.name": name,
                "user.profileImage": profileImage
            }
        });

        /* addPost */
        await this.database.collection("posts").updateMany({
            "uploader._id": user._id
        }, {
            $set: {
                "uploader.name": name,
                "uploader.profileImage": profileImage
            }
        });
        await this.database.collection("posts").updateMany({
            "user._id": user._id
        }, {
            $set: {
                "user.name": name,
                "user.profileImage": profileImage
            }
        });

        /* toggleLikePost */
        await this.database.collection("users").updateMany({
            "notifications.profileImage": user.profileImage
        }, {
            $set: {
                "notifications.$.profileImage": profileImage
            }
        });

        /* postComment */
        await this.database.collection("posts").updateMany({
            "comments.user._id": user._id
        }, {
            $set: {
                "comments.$.user.name": name,
                "comments.$.user.profileImage": profileImage
            }
        });

        /* postReply */

        /* sharePost */
        await this.database.collection("posts").updateMany({
            "shares._id": user._id
        }, {
            $set: {
                "shares.$.name": name,
                "shares.$.profileImage": profileImage
            }
        });

        /* sendFriendRequest */
        await this.database.collection("users").updateMany({
            "friends._id": user._id
        }, {
            $set: {
                "friends.$.name": name,
                "friends.$.profileImage": profileImage
            }
        });

        /* acceptFriendRequest */

        /* createPage */
        await this.database.collection("pages").updateMany({
            "user._id": user._id
        }, {
            $set: {
                "user.name": name,
                "user.profileImage": profileImage
            }
        });

        /* toggleLikePage */
        await this.database.collection("pages").updateMany({
            "likers._id": user._id
        }, {
            $set: {
                "likers.$.name": name,
                "likers.$.profileImage": profileImage
            }
        });

        /* createGroup */
        await this.database.collection("groups").updateMany({
            "members._id": user._id
        }, {
            $set: {
                "members.$.name": name,
                "members.$.profileImage": profileImage
            }
        });
        await this.database.collection("groups").updateMany({
            "user._id": user._id
        }, {
            $set: {
                "user.name": name,
                "user.profileImage": profileImage
            }
        });

        /* toggleJoinGroup */
    }
};