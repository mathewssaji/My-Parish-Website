import { auth, db, storage } from "./firebase-config.js";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

/* ============================
   1. AUTHENTICATION LOGIC
   ============================ */
const loginForm = document.getElementById("login-form");
const authContainer = document.getElementById("auth-container");
const dashboardContainer = document.getElementById("dashboard-container");

// Login Handler
if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        try {
            await signInWithEmailAndPassword(auth, email, password);
            // UI update handled by onAuthStateChanged
        } catch (error) {
            alert("Login Failed: " + error.message);
        }
    });
}

// Auth State Observer
onAuthStateChanged(auth, (user) => {
    if (user) {
        authContainer.style.display = "none";
        dashboardContainer.style.display = "block";
        loadEvents(); // Initialize Dashboard data
        loadGallery();
    } else {
        authContainer.style.display = "flex";
        dashboardContainer.style.display = "none";
    }
});

// Logout
window.logout = async () => {
    await signOut(auth);
    location.reload();
};

/* ============================
   2. EVENTS MANAGEMENT
   ============================ */
async function loadEvents() {
    const list = document.getElementById("current-events-list");
    list.innerHTML = ""; // Clear existing

    try {
        // Query events ordered by latest created
        const q = query(collection(db, "events"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            list.innerHTML = "<p>No events found.</p>";
            return;
        }

        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const item = document.createElement("div");
            item.className = "preview-item";
            item.style.height = "auto";
            item.style.padding = "10px";
            item.style.background = "#f1f5f9";
            item.style.marginBottom = "10px";
            item.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h4>${data.title}</h4>
                    <button onclick="deleteEvent('${docSnap.id}')" style="background:red; color:white; border:none; padding:5px; border-radius:4px; cursor:pointer;">Delete</button>
                </div>
                <p style="font-size:0.9rem;">${data.description}</p>
            `;
            list.appendChild(item);
        });

    } catch (e) {
        console.error("Error loading events: ", e);
    }
}

// Global scope for HTML onclick access
window.openEventModal = async () => {
    const title = prompt("Enter Event Title:");
    if (!title) return;

    const description = prompt("Enter Event Description (keep it short):");
    if (!description) return;

    try {
        await addDoc(collection(db, "events"), {
            title: title,
            description: description,
            timestamp: serverTimestamp()
        });
        alert("Event Added!");
        loadEvents();
    } catch (e) {
        alert("Error: " + e.message);
    }
};

window.deleteEvent = async (id) => {
    if (confirm("Delete this event?")) {
        await deleteDoc(doc(db, "events", id));
        loadEvents();
    }
};


/* ============================
   3. GALLERY MANAGEMENT
   ============================ */
const uploadInput = document.getElementById("gallery-upload");
const status = document.getElementById("upload-status");

if (uploadInput) {
    uploadInput.addEventListener("change", async (e) => {
        const files = e.target.files;
        if (!files.length) return;

        for (let file of files) {
            status.innerText = `Uploading ${file.name}...`;

            try {
                // 1. Upload to Storage
                const storageRef = ref(storage, `gallery/${Date.now()}_${file.name}`);
                const snapshot = await uploadBytes(storageRef, file);
                const downloadURL = await getDownloadURL(snapshot.ref);

                // 2. Save metadata to Firestore
                await addDoc(collection(db, "gallery"), {
                    url: downloadURL,
                    name: file.name,
                    timestamp: serverTimestamp(),
                    storagePath: snapshot.ref.fullPath
                });

            } catch (error) {
                console.error("Upload failed:", error);
                alert(`Failed to upload ${file.name}`);
            }
        }
        status.innerText = "Upload Complete!";
        loadGallery(); // Refresh view
    });
}

async function loadGallery() {
    const grid = document.getElementById("gallery-preview");
    grid.innerHTML = "";

    const q = query(collection(db, "gallery"), orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);

    snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const div = document.createElement("div");
        div.className = "preview-item";
        div.innerHTML = `
            <img src="${data.url}" alt="${data.name}">
            <button class="delete-btn" onclick="deletePhoto('${docSnap.id}', '${data.storagePath}')">
                <i class="fas fa-trash"></i>
            </button>
        `;
        grid.appendChild(div);
    });
}

window.deletePhoto = async (docId, storagePath) => {
    if (!confirm("Delete this photo permanently?")) return;

    try {
        // Delete from Storage
        const imgRef = ref(storage, storagePath);
        await deleteObject(imgRef);

        // Delete from Firestore
        await deleteDoc(doc(db, "gallery", docId));

        loadGallery();
    } catch (e) {
        alert("Error deleting: " + e.message);
    }
};
