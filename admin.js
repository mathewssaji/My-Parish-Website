
// *** PASTE YOUR DEPLOYED GOOGLE APPS SCRIPT URL HERE ***
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxvPS04rg3894bTmBS3PGflhyIUUC3DOdYrP9lPslkPBIyrM_JY0RiLuYrdsVJMd9id/exec";

/* ============================
   1. AUTHENTICATION (LocalStorage)
   ============================ */
const loginForm = document.getElementById("login-form");
const authContainer = document.getElementById("auth-container");
const dashboardContainer = document.getElementById("dashboard-container");

// Check if already logged in on load
if (localStorage.getItem("admin_user")) {
    showDashboard();
}

if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const user = document.getElementById("username").value.trim();
        const pass = document.getElementById("password").value.trim();

        login(user, pass);
    });
}

function login(user, pass) {
    const btn = document.querySelector("#login-form button");
    btn.innerText = "Checking...";
    btn.disabled = true;

    // --- CLIENT SIDE AUTH (Instant Access) ---
    // This bypasses the server check for the UI
    if (user === "admin" && pass === "123456") {
        setTimeout(() => {
            localStorage.setItem("admin_user", user);
            localStorage.setItem("admin_pass", pass);
            showDashboard();
        }, 500); // Fake delay for UX
    } else {
        alert("Invalid Username or Password.");
        btn.innerText = "Login to Dashboard";
        btn.disabled = false;
    }
}

function logout() {
    localStorage.removeItem("admin_user");
    localStorage.removeItem("admin_pass");
    location.reload();
}

function showDashboard() {
    authContainer.style.display = "none";
    dashboardContainer.style.display = "block";
    loadBookings(); // Load default tab
}

/* ============================
   2. TABS & NAVIGATION
   ============================ */
window.switchTab = function (tabName, element) {
    // Hide all sections
    document.querySelectorAll(".section-card").forEach(el => el.style.display = "none");
    // Show selected
    document.getElementById(tabName + "-section").style.display = "block";

    // Update Sidebar Active State
    if (element) {
        document.querySelectorAll(".nav-links a").forEach(el => el.classList.remove("active"));
        element.classList.add("active");
    } else if (event && event.currentTarget) {
        // Fallback for existing onclicks without 'this'
        document.querySelectorAll(".nav-links a").forEach(el => el.classList.remove("active"));
        event.currentTarget.classList.add("active");
    }

    // Load Data based on Tab
    if (tabName === "bookings") loadBookings();
    if (tabName === "updates") loadCurrentUpdate();
    if (tabName === "gallery") loadGallery();
    if (tabName === "restrictions") loadRestrictions();
};

/* ============================
   6. RESTRICTIONS (Capacity & Blocking)
   ============================ */
window.loadRestrictions = function () {
    const blockedTable = document.querySelector("#blocked-table tbody");
    const customTable = document.querySelector("#custom-limits-table tbody");
    blockedTable.innerHTML = "<tr><td colspan='3'>Loading...</td></tr>";
    customTable.innerHTML = "<tr><td colspan='3'>Loading...</td></tr>";

    fetch(`${SCRIPT_URL}?action=get_restrictions`)
        .then(res => res.json())
        .then(resp => {
            if (resp.result === "success") {
                // Set Capacity
                document.getElementById("max-capacity").value = resp.data.max_capacity || "2";

                // Set Custom Limits List
                const customs = resp.data.custom_limits || [];
                customTable.innerHTML = "";
                if (customs.length === 0) {
                    customTable.innerHTML = "<tr><td colspan='3'>No custom limits set.</td></tr>";
                } else {
                    customs.forEach(c => {
                        const row = document.createElement("tr");
                        row.innerHTML = `
                            <td>${c.date}</td>
                            <td>${c.limit}</td>
                            <td><button onclick="removeDailyLimit('${c.date}')" style="background:#64748b; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">Reset</button></td>
                        `;
                        customTable.appendChild(row);
                    });
                }

                // Set Blocked List
                const blocked = resp.data.blocked_dates || [];
                blockedTable.innerHTML = "";
                if (blocked.length === 0) {
                    blockedTable.innerHTML = "<tr><td colspan='3'>No dates blocked.</td></tr>";
                } else {
                    blocked.forEach(b => {
                        const row = document.createElement("tr");
                        row.innerHTML = `
                            <td>${b.date}</td>
                            <td>${b.reason}</td>
                            <td><button onclick="unblockDate('${b.date}')" style="background:#ef4444; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">Unblock</button></td>
                        `;
                        blockedTable.appendChild(row);
                    });
                }
            }
        });
};

window.updateCapacity = function () {
    const limit = document.getElementById("max-capacity").value;
    if (!limit) return alert("Enter a number");
    postData("update_capacity", { limit: limit }).then(resp => {
        alert(resp.result === "success" ? "Global Default Capacity Updated" : "Error: " + resp.data);
    });
};

window.setDailyLimit = function () {
    const date = document.getElementById("custom-limit-date").value;
    const limit = document.getElementById("custom-limit-val").value;
    if (!date || !limit) return alert("Select date and enter limit");

    postData("set_daily_limit", { date: date, limit: limit }).then(resp => {
        if (resp.result === "success") {
            alert("Custom limit set!");
            loadRestrictions();
            document.getElementById("custom-limit-date").value = "";
            document.getElementById("custom-limit-val").value = "";
        } else alert("Error: " + resp.data);
    });
};

window.removeDailyLimit = function (date) {
    if (!confirm("Revert " + date + " to default limit?")) return;
    postData("remove_daily_limit", { date: date }).then(resp => {
        if (resp.result === "success") loadRestrictions();
        else alert("Error: " + resp.data);
    });
};

window.blockDate = function () {
    const date = document.getElementById("block-date-input").value;
    const reason = document.getElementById("block-reason").value;
    if (!date) return alert("Select a date");

    postData("block_date", { date: date, reason: reason }).then(resp => {
        if (resp.result === "success") {
            alert("Date Blocked");
            loadRestrictions();
            document.getElementById("block-date-input").value = "";
            document.getElementById("block-reason").value = "";
        } else {
            alert("Error: " + resp.data);
        }
    });
};

window.unblockDate = function (date) {
    if (!confirm("Unblock " + date + "?")) return;
    postData("unblock_date", { date: date }).then(resp => {
        if (resp.result === "success") loadRestrictions();
        else alert("Error: " + resp.data);
    });
};

window.loadCurrentUpdate = function () {
    // Optional: Fetch current update to show in "Current Text"
    // Since we don't have a specific "get_update_for_admin" endpoint, we use the public one.
    fetch(`${SCRIPT_URL}?action=get_updates`)
        .then(res => res.json())
        .then(resp => {
            if (resp.result === "success" && resp.data) {
                document.getElementById("update-text").value = resp.data.text || "";
                // Banner is an input[type=file], we can't set it, but we could show a preview if we added an img tag.
                // For now, just showing the text is helpful.
            }
        });
}

/* ============================
   3. BOOKINGS (Read Only)
   ============================ */
window.loadBookings = function () {
    const tableBody = document.querySelector("#bookings-table tbody");
    tableBody.innerHTML = "<tr><td colspan='5'>Loading data from Google Sheet...</td></tr>";

    fetch(`${SCRIPT_URL}?action=get_bookings`)
        .then(res => res.json())
        .then(resp => {
            if (resp.result === "success") {
                const bookings = resp.data; // Array of objects or rows
                tableBody.innerHTML = "";

                if (!bookings || bookings.length === 0) {
                    tableBody.innerHTML = "<tr><td colspan='5'>No bookings found.</td></tr>";
                    return;
                }

                // Reverse to show newest first
                bookings.reverse().forEach(bk => {
                    const row = document.createElement("tr");
                    // Handle both Object format (if V3 script used) and Array format (if raw)
                    // Our V3 script returns objects: {timestamp, type, date, note, amount}

                    // Format Date nicely
                    const dateObj = new Date(bk.timestamp || bk[0]);
                    const dateStr = dateObj.toLocaleDateString() + " " + dateObj.toLocaleTimeString();

                    row.innerHTML = `
                        <td>${dateStr}</td>
                        <td>${bk.type || bk[1]}</td>
                        <td>${bk.date || bk[2]}</td>
                        <td>${bk.note || bk[3]}</td>
                        <td>₹${bk.amount || bk[4]}</td>
                    `;
                    tableBody.appendChild(row);
                });
            } else {
                tableBody.innerHTML = `<tr><td colspan='5' style="color:red">Error: ${resp.data}</td></tr>`;
            }
        })
        .catch(err => {
            console.error(err);
            tableBody.innerHTML = `<tr><td colspan='5' style="color:red">Connection Failed. Check Console.</td></tr>`;
        });
};

/* ============================
   4. UPDATES (Banner + Text)
   ============================ */
window.postUpdate = function () {
    const file = document.getElementById("update-banner").files[0];
    const text = document.getElementById("update-text").value;

    if (!text && !file) return alert("Please add text or an image.");

    const btn = document.querySelector("#updates-section .btn");
    btn.innerText = "Posting...";

    if (file) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function () {
            const base64 = reader.result.split(',')[1];
            sendUpdateData(text, base64, file.name, file.type);
        };
    } else {
        sendUpdateData(text, null, null, null);
    }
};

function sendUpdateData(text, imageBase64, filename, mimeType) {
    postData("save_update", {
        text: text,
        image: imageBase64,
        filename: filename,
        mimeType: mimeType
    }).then(resp => {
        alert(resp.result === "success" ? "Update Posted!" : "Error: " + resp.data);
    });
}

window.clearUpdate = function () {
    if (!confirm("Are you sure you want to remove the update from the Home Page?")) return;

    postData("clear_update", {}).then(resp => {
        alert("Update Removed.");
        document.getElementById("update-text").value = "";
        document.getElementById("update-banner").value = "";
    });
};

/* ============================
   5. GALLERY (Masonry)
   ============================ */
window.uploadPhoto = function () {
    const file = document.getElementById("gallery-file").files[0];
    const desc = document.getElementById("gallery-desc").value;
    const status = document.getElementById("upload-status");

    if (!file) return alert("Please select a file");

    status.innerText = "Uploading... (This may take a few seconds)";

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function () {
        const base64 = reader.result.split(',')[1];

        postData("upload_gallery", {
            image: base64,
            filename: file.name,
            mimeType: file.type,
            description: desc
        }).then(resp => {
            if (resp.result === "success") {
                status.innerText = "Upload Complete!";
                loadGallery(); // Refresh
                // Clear inputs
                document.getElementById("gallery-file").value = "";
                document.getElementById("gallery-desc").value = "";
            } else {
                status.innerText = "Error: " + resp.data;
            }
        }).catch(err => {
            status.innerText = "Error: " + err.message;
            alert("Upload Failed: " + err.message);
        });
    };
};

window.loadGallery = function () {
    const grid = document.getElementById("gallery-preview");
    grid.innerHTML = "<p>Loading...</p>";

    fetch(`${SCRIPT_URL}?action=get_gallery`)
        .then(res => res.json())
        .then(resp => {
            grid.innerHTML = "";
            const images = resp.data; // Array of objects

            if (!images || images.length === 0) {
                grid.innerHTML = "<p>No images found.</p>";
                return;
            }

            images.forEach(img => {
                const item = document.createElement("div");
                item.className = "gallery-item";
                item.innerHTML = `
                    <img src="${img.url}" loading="lazy">
                    <div class="gallery-info">
                        <p>${img.description || ""}</p>
                        <button onclick="deletePhoto('${img.id}')"><i class="fas fa-trash"></i></button>
                    </div>
                `;
                grid.appendChild(item);
            });
        });
};

window.deletePhoto = function (driveId) {
    if (!confirm("Permanently delete this photo?")) return;

    postData("delete_gallery", { drive_id: driveId })
        .then(resp => {
            if (resp.result === "success") {
                loadGallery(); // Refresh
            } else {
                alert("Error deleting: " + resp.data);
            }
        });
};

/* ============================
   HELPER: POST Data Wrapper
   ============================ */
function postData(action, payload) {
    // Add auth to every request
    payload.action = action;
    payload.username = localStorage.getItem("admin_user");
    payload.password = localStorage.getItem("admin_pass");

    // Google Apps Script requires no-cors for simple posts, 
    // BUT we need the response. 
    // To get response, we must use text/plain and handle CORS redirects.
    // However, the easiest way with Apps Script is just standard fetch.

    return fetch(SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify(payload)
    })
        .then(res => res.json())
        .catch(err => {
            console.error("Fetch Error:", err);
            throw err; // Propagate to caller
        });
}
