import { db } from "./firebase-config.js";
import { collection, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

async function loadLatestEvents() {
    const eventsContainer = document.querySelector(".events"); // Targeting existing section

    try {
        // Fetch top 3 latest events
        const q = query(collection(db, "events"), orderBy("timestamp", "desc"), limit(3));
        const snapshot = await getDocs(q);

        if (snapshot.empty) return; // Keep default if no events

        // Create a Dynamic Container
        const container = document.createElement("div");
        container.className = "perunnal";
        container.style.marginTop = "0";
        container.style.paddingTop = "0";

        // Header
        container.innerHTML = `<h2 style="text-align:center; color:var(--primary-color); margin-bottom:40px; font-family:var(--font-heading);">Upcoming Events</h2>`;

        snapshot.forEach((doc) => {
            const data = doc.data();
            const row = document.createElement("div");
            row.className = "row";
            row.style.marginBottom = "60px";

            // Simple layout for dynamic events (Text dominant)
            row.innerHTML = `
                <div class="col" style="width:100%; text-align:center; background:white; padding:40px; border-radius:16px; box-shadow:var(--shadow-md); border-top: 4px solid var(--accent-color);">
                    <h2 style="font-size:2rem; margin-bottom:15px;">${data.title}</h2>
                    <p style="font-size:1.1rem; color:#475569;">${data.description}</p>
                </div>
            `;
            container.appendChild(row);
        });

        // Insert at the top of the events section
        eventsContainer.insertBefore(container, eventsContainer.firstChild);

    } catch (e) {
        console.log("Error loading events:", e);
    }
}

document.addEventListener("DOMContentLoaded", loadLatestEvents);
