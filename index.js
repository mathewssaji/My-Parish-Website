
// *** PASTE YOUR DEPLOYED GOOGLE APPS SCRIPT URL HERE (SAME AS ADMIN) ***
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxvPS04rg3894bTmBS3PGflhyIUUC3DOdYrP9lPslkPBIyrM_JY0RiLuYrdsVJMd9id/exec";

document.addEventListener("DOMContentLoaded", () => {
    fetchUpdates();
});

function fetchUpdates() {
    fetch(`${SCRIPT_URL}?action=get_updates`)
        .then(res => res.json())
        .then(resp => {
            if (resp.result === "success" && resp.data) {
                const update = resp.data;
                const section = document.getElementById("news-update");
                const banner = document.getElementById("news-banner");
                const text = document.getElementById("news-text");

                section.style.display = "block"; // Show section
                text.innerText = update.text || "";

                if (update.url) {
                    banner.src = update.url;
                    banner.style.display = "block";
                } else {
                    banner.style.display = "none";
                }
            } else {
                // No update or error, keep hidden
                console.log("No active updates.");
            }
        })
        .catch(err => console.error("Error fetching updates:", err));
}
