import { db } from "./firebase-config.js";
import { collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

async function loadGallery() {
    const grid = document.querySelector(".gallery-grid");

    // Fallback: If no DB connection or empty, keep existing static HTML
    // We only clear if we successfully get data
    try {
        const q = query(collection(db, "gallery"), orderBy("timestamp", "desc"));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            // Only clear static photos if we have dynamic ones
            grid.innerHTML = "";

            snapshot.forEach((doc) => {
                const data = doc.data();
                const item = document.createElement("div");
                item.className = "gallery-item";
                item.innerHTML = `
                    <img src="${data.url}" alt="${data.name}" loading="lazy">
                    <div class="overlay">
                        <h3>${data.name.split('.')[0]}</h3> 
                    </div>
                `;
                grid.appendChild(item);
            });
        }
    } catch (e) {
        console.log("Using static gallery (No dynamic data found or config missing):", e);
    }
}

// Initialize
document.addEventListener("DOMContentLoaded", loadGallery);
