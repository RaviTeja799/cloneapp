import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
    getAuth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Initialize Firebase
const app = initializeApp(window.firebaseConfig);
const auth = getAuth(app);

// Toast notification function
function showToast(message, type) {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Show loading spinner
function showLoading() {
    document.getElementById("loading-spinner").style.display = "block";
}

// Hide loading spinner
function hideLoading() {
    document.getElementById("loading-spinner").style.display = "none";
}

// Sign-up function
document.getElementById("signup-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("signup-email").value;
    const password = document.getElementById("signup-password").value;

    showLoading();
    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            user.getIdToken().then((idToken) => {
                fetch("/login", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    body: new URLSearchParams({ id_token: idToken }),
                })
                    .then((response) => response.json())
                    .then((data) => {
                        hideLoading();
                        if (data.status === "success") {
                            window.location.href = "/";
                        } else {
                            showToast(data.message, "error");
                        }
                    })
                    .catch((error) => {
                        hideLoading();
                        showToast("Error: " + error.message, "error");
                    });
            });
        })
        .catch((error) => {
            hideLoading();
            showToast("Error: " + error.message, "error");
        });
});

// Login function
document.getElementById("login-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    showLoading();
    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            user.getIdToken().then((idToken) => {
                fetch("/login", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    body: new URLSearchParams({ id_token: idToken }),
                })
                    .then((response) => response.json())
                    .then((data) => {
                        hideLoading();
                        if (data.status === "success") {
                            window.location.href = "/";
                        } else {
                            showToast(data.message, "error");
                        }
                    })
                    .catch((error) => {
                        hideLoading();
                        showToast("Error: " + error.message, "error");
                    });
            });
        })
        .catch((error) => {
            hideLoading();
            showToast("Error: " + error.message, "error");
        });
});

// Logout function
function logout() {
    showLoading();
    signOut(auth)
        .then(() => {
            hideLoading();
            showToast("Logged out successfully!", "success");
            window.location.href = "/logout";
        })
        .catch((error) => {
            hideLoading();
            showToast("Error during logout: " + error.message, "error");
            window.location.href = "/logout";
        });
}

// Attach logout event listener
document.getElementById("logout-btn")?.addEventListener("click", logout);

// Monitor auth state
onAuthStateChanged(auth, (user) => {
    const authSection = document.getElementById("auth-section");
    const navLinks = document.getElementById("nav-links");
    if (user) {
        if (authSection) {
            authSection.innerHTML = '<button id="logout-btn">Logout</button>';
            document.getElementById("logout-btn").addEventListener("click", logout);
        }
        if (navLinks) {
            navLinks.style.display = "block";
        }
    } else {
        if (authSection) {
            authSection.innerHTML = "";
        }
        if (navLinks) {
            navLinks.style.display = "none";
        }
    }
});