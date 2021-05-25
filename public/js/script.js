function showPostShares(self) {
	var _id = self.getAttribute("data-id");
	document.getElementById("post-sharers-modal").style.display = "block";

	var ajax = new XMLHttpRequest();
	ajax.open("POST", "/showPostSharers", true);

	ajax.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {

			var response = JSON.parse(this.responseText);
			// console.log(response);

			if (response.status == "success") {

				response.data = response.data.reverse();
				
				var html = "<span class='close' onclick='this.parentElement.parentElement.style.display = \"none\";'>&times;</span>";
				for (var a = 0; a < response.data.length; a++) {
					const data = response.data[a];

					var createdDate = new Date(data.createdAt);
					var createdAt = createdDate.getDate() + " " + months[createdDate.getMonth() + 1] + ", " + createdDate.getFullYear();
					createdAt += " " + createdDate.getHours() + ":" + createdDate.getMinutes() + ":" + createdDate.getSeconds();

					html += `<div class="row" style="margin-top: 10px;">
						<div class="col-md-2">
							<figure>
								<a href="/user/` + data.username + `">
									<img src="` + mainURL + `/` + data.profileImage + `" onerror="this.src = '/public/img/default_profile.jpg';">
								</a>
							</figure>
						</div>

						<div class="col-md-10 pepl-info">
							<h4>
								<a href="/user/` + data.username + `">` + data.name + `</a>
							</h4>
							<p>` + createdAt + `</p>
						</div>
					</div>`;
				}
				document.querySelector("#post-sharers-modal .modal-content").innerHTML = html;
			}

			if (response.status == "error") {
				swal("Error", response.message, "error");
			}
		}
	};

	var formData = new FormData();
	formData.append("_id", _id);
	formData.append("accessToken", localStorage.getItem("accessToken"));
	ajax.send(formData);
}

function showPostLikers(self) {
	var _id = self.getAttribute("data-id");
	document.getElementById("post-likers-modal").style.display = "block";

	var ajax = new XMLHttpRequest();
	ajax.open("POST", "/showPostLikers", true);

	ajax.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {

			var response = JSON.parse(this.responseText);
			// console.log(response);

			if (response.status == "success") {

				response.data = response.data.reverse();

				var html = "<span class='close' onclick='this.parentElement.parentElement.style.display = \"none\";'>&times;</span>";
				for (var a = 0; a < response.data.length; a++) {
					const data = response.data[a];

					var createdDate = new Date(data.createdAt);
					var createdAt = createdDate.getDate() + " " + months[createdDate.getMonth() + 1] + ", " + createdDate.getFullYear();
					createdAt += " " + createdDate.getHours() + ":" + createdDate.getMinutes() + ":" + createdDate.getSeconds();

					html += `<div class="row" style="margin-top: 20px;">
						<div class="col-md-2">
							<figure>
								<a href="/user/` + data.username + `">
									<img src="` + mainURL + `/` + data.profileImage + `" onerror="this.src = '/public/img/default_profile.jpg';">
								</a>
							</figure>
						</div>

						<div class="col-md-10 pepl-info">
							<h4>
								<a href="/user/` + data.username + `">` + data.name + `</a>
							</h4>
							<p>` + createdAt + `</p>
						</div>
					</div>`;
				}
				document.querySelector("#post-likers-modal .modal-content").innerHTML = html;
			}

			if (response.status == "error") {
				swal("Error", response.message, "error");
			}
		}
	};

	var formData = new FormData();
	formData.append("_id", _id);
	formData.append("accessToken", localStorage.getItem("accessToken"));
	ajax.send(formData);
}

function deletePost(self) {
	var _id = self.getAttribute("data-id");

	var ajax = new XMLHttpRequest();
	ajax.open("POST", "/deletePost", true);

	ajax.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {

			var response = JSON.parse(this.responseText);
			// console.log(response);

			if (response.status == "success") {
				document.getElementById("delete-post-modal").style.display = "none";
				document.getElementById("post-" + _id).remove();
			}

			if (response.status == "error") {
				swal("Error", response.message, "error");
			}
		}
	};

	var formData = new FormData();
	formData.append("_id", _id);
	formData.append("accessToken", localStorage.getItem("accessToken"));
	ajax.send(formData);
}

function deletePostModal(self) {
	var _id = self.getAttribute("data-id");

	document.getElementById("delete-post-modal").querySelector("button").setAttribute("data-id", _id);
	document.getElementById("delete-post-modal").style.display = "block";
}

function doEditPost(form) {
	var ajax = new XMLHttpRequest();
	ajax.open("POST", "/editPost", true);

	form.submit.querySelector("i").style.display = "";
	form.submit.setAttribute("disabled", "disabled");

	ajax.onreadystatechange = function() {
		if (this.readyState == 4) {
			if (this.status == 200) {
				// console.log(this.responseText);
				var response = JSON.parse(this.responseText);
				// console.log(response);

				form.submit.querySelector("i").style.display = "none";
				form.submit.removeAttribute("disabled");

				if (response.status == "success") {
					document.getElementById("edit-post-modal").style.display = "none";

					var postNode = document.getElementById("post-" + response.post._id);
					postNode.querySelector(".description p").innerHTML = response.post.caption;

					if (postNode.querySelector(".post-image") != null) {
						postNode.querySelector(".post-image").setAttribute("src", mainURL + "/" + response.post.image);
					}

					if (postNode.querySelector(".post-video") != null) {
						postNode.querySelector(".post-video").setAttribute("src", mainURL + "/" + response.post.video);
					}
				} else if (response.status == "error") {
					swal("Error", response.message, "error");
				}
			}

			if (this.status == 500) {
				console.log(this.responseText);
			}
		}
	};

	var formData = new FormData(form);
	formData.append("accessToken", localStorage.getItem("accessToken"));
	formData.append("imgData", document.getElementById("edit-post-img-preview").getAttribute("src"));
	ajax.send(formData);

	return false;
}

function editPostModal(self) {
	var _id = self.getAttribute("data-id");
	
	var form = document.getElementById("form-edit-post");
	form._id.value = _id;

	var ajax = new XMLHttpRequest();
	ajax.open("POST", "/getPostById", true);

	ajax.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {

			var response = JSON.parse(this.responseText);
			// console.log(response.post);

			if (response.status == "success") {
				form.caption.value = response.post.caption;

				if (response.post.image == "") {
					document.getElementById("edit-post-img-preview").style.display = "none";
					document.getElementById("edit-post-img-preview").setAttribute("src", "");
				} else {
					document.getElementById("edit-post-img-preview").style.display = "";
					document.getElementById("edit-post-img-preview").setAttribute("src", mainURL + "/" + response.post.image);
				}

				if (response.post.video == "") {
					document.getElementById("edit-post-video-preview").style.display = "none";
					document.getElementById("edit-post-video-preview").setAttribute("src", "");
				} else {
					document.getElementById("edit-post-video-preview").style.display = "";
					document.getElementById("edit-post-video-preview").setAttribute("src", mainURL + "/" + response.post.video);
				}

				form.type.value = response.post.type;
				document.getElementById("edit-post-modal").style.display = "block";
			}

			if (response.status == "error") {
				swal("Error", response.message, "error");
			}
		}
	};

	var formData = new FormData(form);
	formData.append("accessToken", localStorage.getItem("accessToken"));
	ajax.send(formData);
}

function closeModal(modalId) {
	document.getElementById(modalId).style.display = "none";
}

function onSearch(button) {
	window.location.href = "/search/" + button.previousElementSibling.value;
}

function renderFeed(response) {
	var html = "";
	for (var a = 0; a < response.data.length; a++) {
		var data = response.data[a];
		html += renderSinglePost(data);
	}
	document.getElementById("newsfeed").innerHTML += html;
}

function renderSinglePost(data) {

	if (data.isBanned) {
		return "";
	}

	var html = "";
	html += '<div class="central-meta item" id="post-' + data._id + '">';
		html += '<div class="user-post">';
			html += '<div class="friend-info">';

				html += '<figure>';
					html += '<img src="' + mainURL + "/" + (data.type == "group_post" ? data.uploader.profileImage : data.user.profileImage) + '" style="width: 45px; height: 45px; object-fit: cover;" onerror="this.src = \'/public/img/default_profile.jpg\';">';
				html += '</figure>';

				html += '<div class="friend-name">';
					html += '<ins>';
						if (data.type == "post") {
							html += '<a href="/user/' + data.user.username + '">';
								html += data.user.name;
							html += '</a>';
						} else if (data.type == "group_post") {
							html += '<a href="/group/' + data.user._id + '">';
								html += data.user.name;
							html += '</a>';
						} else if (data.type == "page_post") {
							html += '<a href="/page/' + data.user._id + '">';
								html += data.user.name;
							html += '</a>';
						} else {
							html += data.user.name;
						}

						var isMyUploaded = false;
						if (data.type == "group_post") {
							if (data.uploader._id == window.user._id) {
								html += `<i class="fa fa-trash delete-post" onclick="deletePostModal(this);" data-id="` + data._id + `"></i>`;
								html += `<i class="fa fa-pencil edit-post" onclick="editPostModal(this);" data-id="` + data._id + `"></i>`;
							}
						} else {
							if (data.user._id == window.user._id) {
								html += `<i class="fa fa-trash delete-post" onclick="deletePostModal(this);" data-id="` + data._id + `"></i>`;
								html += `<i class="fa fa-pencil edit-post" onclick="editPostModal(this);" data-id="` + data._id + `"></i>`;
							}
						}

					html += '</ins>';

					var createdAt = new Date(data.createdAt);
					var date = createdAt.getDate() + "";
					date = date.padStart(2, "0") + " " + months[createdAt.getMonth()] + ", " + createdAt.getFullYear();

					html += '<span>Published: ' + date + '</span>';
				html += '</div>';

				html += '<div class="post-meta">';

					html += '<div class="description">';
						html += '<p>';
							html += data.caption;
						html += '</p>';
					html += '</div>';

					html += '<img class="post-image ' + (data.image == "" ? "hide" : "") + '" src="' + mainURL + "/" + data.image + '">';
					html += '<video class="post-video ' + (data.video == "" ? "hide" : "") + '" style="height: 359px; width: 100%;" controls src="' + mainURL + "/" + data.video + '"></video>';

					html += createLikesSection(data);
				html += '</div>';
			html += '</div>';

			html += "<div id='post-comments-" + data._id + "'>";
				html += createCommentsSection(data);
			html += "</div>";

		html += '</div>';
	html += '</div>';
	return html;
}

function createLikesSection(data) {

	var isLiked = false;
	for (var b = 0; b < data.likers.length; b++) {
		var liker = data.likers[b];
		if (liker._id == window.user._id) {
			isLiked = true;
			break;
		}
	}

	var html = "";

	html += '<div class="we-video-info">';
		html += '<ul>';

			html += '<li>';

				var className = isLiked ? "like" : "none";

				html += '<span class="' + className + '" onclick="toggleLikePost(this);" data-id="' + data._id + '">';
					html += '<i class="ti-thumb-up"></i>';
				html += '</span>';

				html += '<ins class="likers-count" data-id="' + data._id + '" onclick="showPostLikers(this);">' + data.likers.length + '</ins>';

			html += '</li>';

			html += '<li>';
				html += '<span class="comment" title="Comments">';
					html += '<i class="fa fa-comments-o"></i>';
					html += '<ins id="count-post-comments-' + data._id + '">' + data.comments.length + '</ins>';
				html += '</span>';
			html += '</li>';

			html += '<li>';
				html += '<span class="share" style="position: relative; top: 9px;">';
					html += `<div class="dropdown" style="position: relative; top: 20px;">
						<button class="dropdown-toggle" type="button" id="dropdownShare-` + data._id + `" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" style='background: none; border: none;'>
							<i class="ti-share"></i>
						</button>
						<div class="dropdown-menu" aria-labelledby="dropdownShare-` + data._id + `">
							<a class="dropdown-item" href="javascript:void(0);" onclick="sharePost(this);" data-id="` + data._id + `">Share on your timeline</a>
							<a class="dropdown-item" href="javascript:void(0);" onclick="shareInPage(this);" data-id="` + data._id + `">Share on pages you manage</a>
							<a class="dropdown-item" href="javascript:void(0);" onclick="shareInGroup(this);" data-id="` + data._id + `">Share in groups</a>
						</div>
					</div>

					<ins class="shares-count" data-id="` + data._id + `" onclick="showPostShares(this);" id="shares-count-` + data._id + `">` + data.shares.length + `</ins>`;
				html += '</span>';
			html += '</li>';

		html += '</ul>';
	html += '</div>';

	return html;
}

function shareInPage(self) {
	var _id = self.getAttribute("data-id");

	var html = "";
	for (var a = 0; a < window.user.pages.length; a++) {
		var page = window.user.pages[a];
		html += `<div class="row" style="margin-bottom: 20px;">
			<div class="col-md-4">
				<img src='` + mainURL + `/` + page.coverPhoto + `' style="width: 300px;" />
			</div>

			<div class="col-md-4">
				` + page.name + `
			</div>

			<div class="col-md-4">
				<form method="POST" onsubmit="return doSharePostInPage(this);">
					<input type="hidden" name="pageId" value="` + page._id + `">
					<input type="hidden" name="postId" value="` + _id + `">
					<input type="submit" name="submit" value="Share" class="btn-share" />
				</form>
			</div>
		</div>`;
	}
	document.querySelector("#shareInPagesModal .modal-body").innerHTML = html;

	$("#shareInPagesModal").modal("show");
}

function shareInGroup(self) {
	var _id = self.getAttribute("data-id");

	var html = "";
	for (var a = 0; a < window.user.groups.length; a++) {
		var group = window.user.groups[a];
		html += `<div class="row" style="margin-bottom: 20px;">
			<div class="col-md-4">
				<img src='` + mainURL + `/` + group.coverPhoto + `' style="width: 300px;" />
			</div>

			<div class="col-md-4">
				` + group.name + `
			</div>

			<div class="col-md-4">
				<form method="POST" onsubmit="return doSharePostInGroup(this);">
					<input type="hidden" name="groupId" value="` + group._id + `">
					<input type="hidden" name="postId" value="` + _id + `">
					<input type="submit" name="submit" value="Share" class="btn-share" />
				</form>
			</div>
		</div>`;
	}
	document.querySelector("#shareInGroupModal .modal-body").innerHTML = html;

	$("#shareInGroupModal").modal("show");
}

function doSharePostInPage(form) {
	form.submit.value = "Sharing...";
	form.submit.setAttribute("disabled", "disabled");

	var ajax = new XMLHttpRequest();
	ajax.open("POST", "/sharePostInPage", true);

	ajax.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {

			form.submit.removeAttribute("disabled");
			form.submit.value = "Share";

			var response = JSON.parse(this.responseText);
			if (response.status == "success") {
				swal("Success", response.message, "success");
			} else {
				swal("Error", response.message, "error");
			}

			if (response.status == "success") {
				self.className = "like";

				var shares = parseInt(document.getElementById("shares-count-" + form.postId.value).innerHTML);
				shares++;
				document.getElementById("shares-count-" + form.postId.value).innerHTML = shares;

				form.remove();
			}
		}
	};

	var formData = new FormData(form);
	formData.append("accessToken", localStorage.getItem("accessToken"));
	ajax.send(formData);

	return false;
}

function doSharePostInGroup(form) {
	form.submit.value = "Sharing...";
	form.submit.setAttribute("disabled", "disabled");

	var ajax = new XMLHttpRequest();
	ajax.open("POST", "/sharePostInGroup", true);

	ajax.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {

			form.submit.removeAttribute("disabled");
			form.submit.value = "Share";

			var response = JSON.parse(this.responseText);
			if (response.status == "success") {
				swal("Success", response.message, "success");
			} else {
				swal("Error", response.message, "error");
			}

			if (response.status == "success") {
				self.className = "like";

				var shares = parseInt(document.getElementById("shares-count-" + form.postId.value).innerHTML);
				shares++;
				document.getElementById("shares-count-" + form.postId.value).innerHTML = shares;

				form.remove();
			}
		}
	};

	var formData = new FormData(form);
	formData.append("accessToken", localStorage.getItem("accessToken"));
	ajax.send(formData);

	return false;
}

function sharePost(self) {

	swal({
		title: "Share post",
		text: "Are you sure you want to share this post on your timeline ?",
		icon: "warning",
		buttons: true,
		dangerMode: true,
	})
	.then((willDelete) => {
		if (willDelete) {
			var _id = self.getAttribute("data-id");

			var ajax = new XMLHttpRequest();
			ajax.open("POST", "/sharePost", true);

			ajax.onreadystatechange = function() {
				if (this.readyState == 4 && this.status == 200) {

					var response = JSON.parse(this.responseText);
					if (response.status == "success") {
						swal("Success", response.message, "success");
					} else {
						swal("Error", response.message, "error");
					}

					if (response.status == "success") {
						self.className = "like";

						var shares = parseInt(document.getElementById("shares-count-" + _id).innerHTML);
						shares++;
						document.getElementById("shares-count-" + _id).innerHTML = shares;

						showNewsfeed();
					}
				}
			};

			var formData = new FormData();
			formData.append("accessToken", localStorage.getItem("accessToken"));
			formData.append("_id", _id);
			ajax.send(formData);
		}
	});
}

function toggleLikePost(self) {
	var _id = self.getAttribute("data-id");

	var ajax = new XMLHttpRequest();
	ajax.open("POST", "/toggleLikePost", true);

	ajax.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {

			var response = JSON.parse(this.responseText);

			if (response.status == "success") {
				self.className = "like";

				var likes = parseInt(self.nextElementSibling.innerHTML);
				likes++;
				self.nextElementSibling.innerHTML = likes;
			}
			if (response.status == "unliked") {
				self.className = "none";

				var likes = parseInt(self.nextElementSibling.innerHTML);
				likes--;
				self.nextElementSibling.innerHTML = likes;
			}
			if (response.status == "error") {
				swal("Error", response.message, "error");
			}
		}
	};

	var formData = new FormData();
	formData.append("accessToken", localStorage.getItem("accessToken"));
	formData.append("_id", _id);
	ajax.send(formData);
}

function createCommentsSection(data) {
	var html = "";

	html += '<div class="coment-area">';
		html += '<ul class="we-comet" style="max-height: 300px; overflow-y: scroll;">';

		data.comments = data.comments.reverse();
		for (var b = 0; b < data.comments.length; b++) {
			var comment = data.comments[b];

			html += '<li>';
				html += '<div class="comet-avatar">';
					html += '<img src="' + mainURL + '/' + comment.user.profileImage + '" onerror="this.src = \'/public/img/default_profile.jpg\';">';
				html += '</div>';

				html += '<div class="we-comment">';
					html += '<div class="coment-head">';
						html += '<h5><a href="/">' + comment.user.name + '</a></h5>';

						var createdAt = new Date(comment.createdAt);
						var date = createdAt.getDate() + "";
						date = date.padStart(2, "0") + " " + months[createdAt.getMonth()] + ", " + createdAt.getFullYear();

						html += '<span>' + date + '</span>';
						html += '<a class="we-reply" href="javascript:void(0);" data-post-id="' + data._id + '" data-comment-id="' + comment._id + '" onclick="prepareToReply(this);" title="Reply"><i class="fa fa-reply"></i></a>';
					html += '</div>';

					html += '<p>' + comment.comment + '</p>';
				html += '</div>';

				html += '<ul>';

					comment.replies = comment.replies.reverse();

					for (var c = 0; c < comment.replies.length; c++) {
						var reply = comment.replies[c];

						html += '<li>';
							html += '<div class="comet-avatar">';
								html += '<img src="' + mainURL + '/' + reply.user.profileImage + '" onerror="this.src = \'/public/img/default_profile.jpg\';">';
							html += '</div>';

							html += '<div class="we-comment">';
								html += '<div class="coment-head">';
									html += '<h5><a href="/">' + reply.user.name + '</a></h5>';

									var createdAt = new Date(reply.createdAt);
									var date = createdAt.getDate() + "";
									date = date.padStart(2, "0") + " " + months[createdAt.getMonth()] + ", " + createdAt.getFullYear();

									html += '<span>' + date + '</span>';
								html += '</div>';
								html += '<p>' + reply.reply + '</p>';
							html += '</div>';
						html += '</li>';
					}
					html += '</ul>';

			html += '</li>';
		}
		html += '</ul>';

		html += '<ul class="we-comet">';
			html += '<li class="post-comment">';
				html += '<div class="comet-avatar">';
					html += '<img src="' + mainURL + '/' + window.user.profileImage + '" onerror="this.src = \'/public/img/default_profile.jpg\';">';
				html += '</div>';
				html += '<div class="post-comt-box">';
					html += '<form method="post" onsubmit="return doPostComment(this);">';
						html += '<input type="hidden" name="_id" value="' + data._id + '">';
						html += '<textarea name="comment" placeholder="Post your comment"></textarea>';
						html += '<button type="submit" style="position: relative; left: 90%; bottom: 32px;">Post</button>';
					html += '</form>';
				html += '</div>';
			html += '</li>';
		html += '</ul>';

	html += '</div>';

	return html;
}

function doPostComment(form) {

	var ajax = new XMLHttpRequest();
	ajax.open("POST", "/postComment", true);

	ajax.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {

			var response = JSON.parse(this.responseText);
			if (response.status == "success") {
				swal("Success", response.message, "success");
			} else {
				swal("Error", response.message, "error");
			}

			if (response.status == "success") {
				form.comment.value = "";

				var commentsHtml = createCommentsSection(response.updatePost);
				document.getElementById("post-comments-" + form._id.value).innerHTML = commentsHtml;

				var comments = parseInt(document.getElementById("count-post-comments-" + form._id.value).innerHTML);
				comments++;
				document.getElementById("count-post-comments-" + form._id.value).innerHTML = comments;
			}
		}
	};

	var formData = new FormData(form);
	formData.append("accessToken", localStorage.getItem("accessToken"));
	ajax.send(formData);

	return false;
}

function prepareToReply(self) {
	$("#replyModal input[name='postId']").val(self.getAttribute("data-post-id"));
	$("#replyModal input[name='commentId']").val(self.getAttribute("data-comment-id"));
	$("#replyModal").modal("show");
}

function doPostReply(form) {
	var ajax = new XMLHttpRequest();
	ajax.open("POST", "/postReply", true);

	ajax.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {

			var response = JSON.parse(this.responseText);
			if (response.status == "success") {
				swal("Success", response.message, "success");
			} else {
				swal("Error", response.message, "error");
			}

			if (response.status == "success") {
				form.reply.value = "";
				$("#replyModal").modal("hide");

				var commentsHtml = createCommentsSection(response.updatePost);
				document.getElementById("post-comments-" + form.postId.value).innerHTML = commentsHtml;
			}
		}
	};

	var formData = new FormData(form);
	formData.append("accessToken", localStorage.getItem("accessToken"));
	ajax.send(formData);

	return false;
}

function showAddPost() {
	if (localStorage.getItem("accessToken")) {
		var html = "";

		html += '<div class="central-meta">';
			html += '<div class="new-postbox">';
				html += '<figure>';
					html += '<img src="' + mainURL + '/' + window.user.profileImage + '" onerror="this.src = \'/public/img/default_profile.jpg\';">';
				html += '</figure>';

				html += '<div class="newpst-input">';
					html += '<form method="post" id="form-add-post" onsubmit="return doPost(this);">';

						html += '<input name="type" type="hidden" value="post" />';
						html += '<textarea rows="2" name="caption" placeholder="write something"></textarea>';
						html += '<div class="attachments">';
							html += '<ul>';

								html += '<li>';
									html += '<img id="post-img-preview" style="display: none; margin-bottom: 10px;">';
								html += '</li>';

								html += '<li>';
									html += '<video id="post-video-preview" controls style="display: none; margin-bottom: 10px;"></video>';
								html += '</li>';

								html += '<li>';
									html += '<i class="fa fa-image"></i>';
									html += '<label class="fileContainer">';
										html += '<input type="file" name="image" accept="image/*" onchange="previewPostImage(this, \'post-img-preview\');">';
									html += '</label>';
								html += '</li>';

								html += '<li>';
									html += '<i class="fa fa-video-camera"></i>';
									html += '<label class="fileContainer">';
										html += '<input type="file" name="video" accept="video/*" onchange="previewPostVideo(this, \'post-video-preview\');">';
									html += '</label>';
								html += '</li>';

								html += '<li>';
									html += '<button type="submit" name="submit">Post <i class="fa fa-spinner fa-spin" style="display: none;"></i></button>';
								html += '</li>';
							html += '</ul>';
						html += '</div>';
					html += '</form>';
				html += '</div>';
			html += '</div>';
		html += '</div>';
		document.getElementById("add-post-box").innerHTML = html;
	}
}

function previewPostImage(self, preview) {
	var file = self.files;
	if (file.length > 0) {
		var fileReader = new FileReader();

		fileReader.onload = function (event) {
			document.getElementById(preview).style.display = "";
			document.getElementById(preview).setAttribute("src", event.target.result);
		};

		fileReader.readAsDataURL(file[0]);
	}
}

function previewPostVideo(self, preview) {
	var file = self.files;
	if (file.length > 0) {
		var fileReader = new FileReader();

		fileReader.onload = function (event) {
			document.getElementById(preview).style.display = "";
			document.getElementById(preview).setAttribute("src", event.target.result);
		};

		fileReader.readAsDataURL(file[0]);
	}
}

function toggleLikePage(self) {
	var ajax = new XMLHttpRequest();
	ajax.open("POST", "/toggleLikePage", true);

	ajax.onreadystatechange = function() {
		if (this.readyState == 4 && this.status == 200) {

			var response = JSON.parse(this.responseText);

			if (response.status == "success") {
				self.className = "add-butn btn-unfriend";
				self.innerHTML = "Unlike";
			}

			if (response.status == "unliked") {
				self.className = "add-butn";
				self.innerHTML = "Like";
			}

			if (response.status == "error") {
				swal("Error", response.message, "error");
			}
		}
	};

	var formData = new FormData();
	formData.append("accessToken", localStorage.getItem("accessToken"));
	formData.append("_id", self.getAttribute("data-id"));
	ajax.send(formData);
}

jQuery(document).ready(function($) {
	
	"use strict";
	
//------- Notifications Dropdowns
  $('.top-area > .setting-area > li').on("click",function(){
	$(this).siblings().children('div').removeClass('active');
	$(this).children('div').addClass('active');
	return false;
  });
//------- remove class active on body
  $("body *").not('.top-area > .setting-area > li').on("click", function() {
	$(".top-area > .setting-area > li > div").removeClass('active');		
 });
	

//--- user setting dropdown on topbar	
$('.user-img').on('click', function() {
	$('.user-setting').toggleClass("active");
	return false;
});	
	
//--- side message box	
$('.friendz-list > li, .chat-users > li').on('click', function() {
	$('.chat-box').addClass("show");
	return false;
});	
	$('.close-mesage').on('click', function() {
		$('.chat-box').removeClass("show");
		return false;
	});	
	
//------ scrollbar plugin
	if ($.isFunction($.fn.perfectScrollbar)) {
		$('.dropdowns, .twiter-feed, .invition, .followers, .chatting-area, .peoples, #people-list, .chat-list > ul, .message-list, .chat-users, .left-menu').perfectScrollbar();
	}

/*--- socials menu scritp ---*/	
	$('.trigger').on("click", function() {
	    $(this).parent(".menu").toggleClass("active");
	  });
	
/*--- emojies show on text area ---*/	
	$('.add-smiles > span').on("click", function() {
	    $(this).parent().siblings(".smiles-bunch").toggleClass("active");
	  });

// delete notifications
$('.notification-box > ul li > i.del').on("click", function(){
    $(this).parent().slideUp();
	return false;
  }); 	

/*--- socials menu scritp ---*/	
	$('.f-page > figure i').on("click", function() {
	    $(".drop").toggleClass("active");
	  });

//===== Search Filter =====//
	(function ($) {
	// custom css expression for a case-insensitive contains()
	jQuery.expr[':'].Contains = function(a,i,m){
	  return (a.textContent || a.innerText || "").toUpperCase().indexOf(m[3].toUpperCase())>=0;
	};

	function listFilter(searchDir, list) { 
	  var form = $("<form>").attr({"class":"filterform","action":"#"}),
	  input = $("<input>").attr({"class":"filterinput","type":"text","placeholder":"Search Contacts..."});
	  $(form).append(input).appendTo(searchDir);

	  $(input)
	  .change( function () {
		var filter = $(this).val();
		if(filter) {
		  $(list).find("li:not(:Contains(" + filter + "))").slideUp();
		  $(list).find("li:Contains(" + filter + ")").slideDown();
		} else {
		  $(list).find("li").slideDown();
		}
		return false;
	  })
	  .keyup( function () {
		$(this).change();
	  });
	}

//search friends widget
	$(function () {
	  listFilter($("#searchDir"), $("#people-list"));
	});
	}(jQuery));	

//progress line for page loader
	$('body').show();
	NProgress.start();
	setTimeout(function() { NProgress.done(); $('.fade').removeClass('out'); }, 2000);
	
//--- bootstrap tooltip	
	$(function () {
	  $('[data-toggle="tooltip"]').tooltip();
	});
	
// Sticky Sidebar & header
	if($(window).width() < 769) {
		jQuery(".sidebar").children().removeClass("stick-widget");
	}

	if ($.isFunction($.fn.stick_in_parent)) {
		$('.stick-widget').stick_in_parent({
			parent: '#page-contents',
			offset_top: 60,
		});

		
		$('.stick').stick_in_parent({
		    parent: 'body',
            offset_top: 0,
		});
		
	}
	
/*--- topbar setting dropdown ---*/	
	$(".we-page-setting").on("click", function() {
	    $(".wesetting-dropdown").toggleClass("active");
	  });	
	  
/*--- topbar toogle setting dropdown ---*/	
$('#nightmode').on('change', function() {
    if ($(this).is(':checked')) {
        // Show popup window
        $(".theme-layout").addClass('black');	
    }
	else {
        $(".theme-layout").removeClass("black");
    }
});

//chosen select plugin
if ($.isFunction($.fn.chosen)) {
	$("select").chosen();
}

//----- add item plus minus button
if ($.isFunction($.fn.userincr)) {
	$(".manual-adjust").userincr({
		buttonlabels:{'dec':'-','inc':'+'},
	}).data({'min':0,'max':20,'step':1});
}	
	
/*if ($.isFunction($.fn.loadMoreResults)) {	
	$('.loadMore').loadMoreResults({
		displayedItems: 3,
		showItems: 1,
		button: {
		  'class': 'btn-load-more',
		  'text': 'Load More'
		}
	});	
}*/
	//===== owl carousel  =====//
	if ($.isFunction($.fn.owlCarousel)) {
		$('.sponsor-logo').owlCarousel({
			items: 6,
			loop: true,
			margin: 30,
			autoplay: true,
			autoplayTimeout: 1500,
			smartSpeed: 1000,
			autoplayHoverPause: true,
			nav: false,
			dots: false,
			responsiveClass:true,
				responsive:{
					0:{
						items:3,
					},
					600:{
						items:3,

					},
					1000:{
						items:6,
					}
				}

		});
	}
	
// slick carousel for detail page
	if ($.isFunction($.fn.slick)) {
	$('.slider-for-gold').slick({
		slidesToShow: 1,
		slidesToScroll: 1,
		arrows: false,
		slide: 'li',
		fade: false,
		asNavFor: '.slider-nav-gold'
	});
	
	$('.slider-nav-gold').slick({
		slidesToShow: 3,
		slidesToScroll: 1,
		asNavFor: '.slider-for-gold',
		dots: false,
		arrows: true,
		slide: 'li',
		vertical: true,
		centerMode: true,
		centerPadding: '0',
		focusOnSelect: true,
		responsive: [
		{
			breakpoint: 768,
			settings: {
				slidesToShow: 3,
				slidesToScroll: 1,
				infinite: true,
				vertical: false,
				centerMode: true,
				dots: false,
				arrows: false
			}
		},
		{
			breakpoint: 641,
			settings: {
				slidesToShow: 3,
				slidesToScroll: 1,
				infinite: true,
				vertical: true,
				centerMode: true,
				dots: false,
				arrows: false
			}
		},
		{
			breakpoint: 420,
			settings: {
				slidesToShow: 3,
				slidesToScroll: 1,
				infinite: true,
				vertical: false,
				centerMode: true,
				dots: false,
				arrows: false
			}
		}	
		]
	});
}
	
//---- responsive header
	
$(function() {

	//	create the menus
	$('#menu').mmenu();
	$('#shoppingbag').mmenu({
		navbar: {
			title: 'General Setting'
		},
		offCanvas: {
			position: 'right'
		}
	});

	//	fire the plugin
	$('.mh-head.first').mhead({
		scroll: {
			hide: 200
		}
		
	});
	$('.mh-head.second').mhead({
		scroll: false
	});
	
});		

//**** Slide Panel Toggle ***//
	  $("span.main-menu").on("click", function(){
	     $(".side-panel").addClass('active');
		  $(".theme-layout").addClass('active');
		  return false;
	  });

	  $('.theme-layout').on("click",function(){
		  $(this).removeClass('active');
	     $(".side-panel").removeClass('active');
		  
	     
	  });

	  
// login & register form
	$('button.signup').on("click", function(){
		$('.login-reg-bg').addClass('show');
		return false;
	  });
	  
	  $('.already-have').on("click", function(){
		$('.login-reg-bg').removeClass('show');
		return false;
	  });
	
//----- count down timer		
	if ($.isFunction($.fn.downCount)) {
		$('.countdown').downCount({
			date: '11/12/2018 12:00:00',
			offset: +10
		});
	}
	
/** Post a Comment **/
jQuery(".post-comt-box textarea").on("keydown", function(event) {

	if (event.keyCode == 13) {
		var comment = jQuery(this).val();
		var parent = jQuery(".showmore").parent("li");
		var comment_HTML = '	<li><div class="comet-avatar"><img src="images/resources/comet-1.jpg" alt=""></div><div class="we-comment"><div class="coment-head"><h5><a href="time-line.html" title="">Jason borne</a></h5><span>1 year ago</span><a class="we-reply" href="#" title="Reply"><i class="fa fa-reply"></i></a></div><p>'+comment+'</p></div></li>';
		$(comment_HTML).insertBefore(parent);
		jQuery(this).val('');
	}
}); 
	
//inbox page 	
//***** Message Star *****//  
    $('.message-list > li > span.star-this').on("click", function(){
    	$(this).toggleClass('starred');
    });


//***** Message Important *****//
    $('.message-list > li > span.make-important').on("click", function(){
    	$(this).toggleClass('important-done');
    });

    

// Listen for click on toggle checkbox
	$('#select_all').on("click", function(event) {
	  if(this.checked) {
	      // Iterate each checkbox
	      $('input:checkbox.select-message').each(function() {
	          this.checked = true;
	      });
	  }
	  else {
	    $('input:checkbox.select-message').each(function() {
	          this.checked = false;
	      });
	  }
	});


	$(".delete-email").on("click",function(){
		$(".message-list .select-message").each(function(){
			  if(this.checked) {
			  	$(this).parent().slideUp();
			  }
		});
	});

// change background color on hover
	$('.category-box').hover(function () {
		$(this).addClass('selected');
		$(this).parent().siblings().children('.category-box').removeClass('selected');
	});
	
	
//------- offcanvas menu 

	const menu = document.querySelector('#toggle');  
	const menuItems = document.querySelector('#overlay');  
	const menuContainer = document.querySelector('.menu-container');  
	const menuIcon = document.querySelector('.canvas-menu i');  

	function toggleMenu(e) {
		menuItems.classList.toggle('open');
		menuContainer.classList.toggle('full-menu');
		menuIcon.classList.toggle('fa-bars');
		menuIcon.classList.add('fa-times');
		e.preventDefault();
	}

	if( menu ) {
		menu.addEventListener('click', toggleMenu, false);	
	}
	
// Responsive nav dropdowns
	$('.offcanvas-menu li.menu-item-has-children > a').on('click', function () {
		$(this).parent().siblings().children('ul').slideUp();
		$(this).parent().siblings().removeClass('active');
		$(this).parent().children('ul').slideToggle();
		$(this).parent().toggleClass('active');
		return false;
	});	
	


});//document ready end





