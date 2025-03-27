from flask import Flask, render_template, request, redirect, url_for, flash, session
import requests
import base64
import logging
import os
from datetime import datetime

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "supersecretkey")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Moderation API URL (guardianAI API - provided by you)
MODERATION_API_URL = "https://guardianai-app-146374580513.us-central1.run.app"

# In-memory storage for posts and users
posts_db = {}  # {post_id: post_data}
users_db = {}  # {session_id: user_data}
post_counter = 0  # To generate unique post IDs

# Initialize session for each user
@app.before_request
def initialize_session():
    if "session_id" not in session:
        session["session_id"] = str(hash(str(datetime.now())))
        users_db[session["session_id"]] = {"is_banned": False}
        session["banned"] = False

@app.route("/", methods=["GET", "POST"])
def index():
    global post_counter

    if request.method == "POST":
        # Check if user is banned
        if session.get("banned"):
            flash("You are banned from posting.", "error")
            return redirect(url_for("index"))

        text = request.form.get("text", "")
        image_file = request.files.get("image")

        # Create a new post
        post = {
            "session_id": session["session_id"],
            "timestamp": datetime.now().isoformat(),
            "status": "pending",
        }

        # Mock moderation result (for fallback)
        def mock_moderation(content, content_type):
            harmful_keywords = ["inappropriate", "hate", "offensive"]
            confidence = 50.0
            if any(keyword in content.lower() for keyword in harmful_keywords):
                confidence = 85.0
                if "hate" in content.lower():
                    confidence = 99.5
            return {
                "action": "pending",
                "result": {
                    "is_harmful": confidence > 50.0,
                    "confidence": confidence,
                    "text_analysis": {"confidence": confidence} if content_type == "image" else None
                },
                "summary": f"Mock {content_type} moderation result"
            }

        # Moderate the post
        if text:
            try:
                response = requests.post(
                    f"{MODERATION_API_URL}/moderate/text",
                    json={"text": text, "user_id": session["session_id"]},
                    timeout=5
                )
                response.raise_for_status()
                result = response.json()
            except Exception as e:
                logger.error(f"GuardianAI API error: {str(e)}")
                result = mock_moderation(text, "text")
            post["type"] = "text"
            post["content"] = text
            post["moderation_result"] = result
            post["status"] = result.get("action", "unknown")
            post["summary"] = result.get("summary")

        elif image_file:
            image_data = base64.b64encode(image_file.read()).decode("utf-8")
            try:
                response = requests.post(
                    f"{MODERATION_API_URL}/moderate/image",
                    json={"image": image_data, "user_id": session["session_id"]},
                    timeout=5
                )
                response.raise_for_status()
                result = response.json()
            except Exception as e:
                logger.error(f"GuardianAI API error: {str(e)}")
                result = mock_moderation("mock_image_content", "image")
            post["type"] = "image"
            post["content"] = image_data
            post["moderation_result"] = result
            post["status"] = result.get("action", "unknown")
            post["summary"] = result.get("summary")

        else:
            flash("Please provide either text or an image to post.", "error")
            return redirect(url_for("index"))

        # Determine moderation action based on API response
        is_harmful = post["moderation_result"]["result"]["is_harmful"]
        confidence = 0.0
        if post["type"] == "text":
            confidence = post["moderation_result"]["result"]["confidence"]
        elif post["type"] == "image":
            confidence = post["moderation_result"]["result"].get("text_analysis", {}).get("confidence", 0.0)

        # Apply moderation rules based on is_harmful and content analysis
        contains_hate = "hate" in post.get("content", "").lower()
        if is_harmful and contains_hate and confidence > 99.0:
            users_db[session["session_id"]]["is_banned"] = True
            session["banned"] = True
            flash("Your post violates our guidelines. You have been banned.", "error")
            post["status"] = "auto_remove"
        elif is_harmful:
            flash("Your post has been flagged for review.", "warning")
            post["status"] = "human_review"
        else:
            flash("Your post has been submitted!", "success")
            post["status"] = "pass"

        # Store the post
        post_id = str(post_counter)
        post_counter += 1
        posts_db[post_id] = post
        post["id"] = post_id

        return redirect(url_for("index"))

    return render_template("index.html")

# Route for viewing posts
@app.route("/posts")
def view_posts():
    session_id = session["session_id"]
    user_posts = [
        post | {"id": post_id} for post_id, post in posts_db.items()
        if post["session_id"] == session_id and post["status"] in ["human_review", "pass"]
    ]
    user_posts.sort(key=lambda x: x["timestamp"], reverse=True)
    return render_template("posts.html", posts=user_posts)

# Route for moderator dashboard (accessible by modifying URL)
@app.route("/dashboard", methods=["GET", "POST"])
def dashboard():
    if request.method == "POST":
        # Handle post review
        post_id = request.form.get("post_id")
        action = request.form.get("action")
        if post_id in posts_db and action in ["approve", "remove"]:
            posts_db[post_id]["status"] = action
            flash(f"Post {action}d successfully.", "success")

        # Handle user ban/unban
        user_id = request.form.get("user_id")
        ban_action = request.form.get("ban_action")
        if user_id in users_db and ban_action in ["ban", "unban"]:
            users_db[user_id]["is_banned"] = (ban_action == "ban")
            flash(f"User {ban_action}ned successfully.", "success")

        return redirect(url_for("dashboard"))

    # Get posts for review
    review_posts = [
        post | {"id": post_id} for post_id, post in posts_db.items()
        if post["status"] == "human_review"
    ]
    review_posts.sort(key=lambda x: x["timestamp"], reverse=True)

    # Get all users
    users = [
        {"id": user_id, "is_banned": user_data["is_banned"]}
        for user_id, user_data in users_db.items()
    ]

    return render_template("dashboard.html", review_posts=review_posts, users=users)

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)