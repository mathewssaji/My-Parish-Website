
// *** PASTE YOUR DEPLOYED GOOGLE APPS SCRIPT URL HERE ***
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw2mJMnA14CsZbNHtgz8FLbfECpLoQPAYPsbDHxGyvSCKFJ3uCLKcIVl496daPlG1OE/exec";

document.addEventListener("DOMContentLoaded", () => {
    loadGallery();
});

function loadGallery() {
    const grid = document.querySelector(".gallery-grid");
    // Keep static items if desired, but here we append dynamic ones
    // Or we could replace them. Let's append to keep the intro images.

    fetch(`${SCRIPT_URL}?action=get_gallery`)
        .then(res => res.json())
        .then(resp => {
            if (resp.result === "success" && resp.data.length > 0) {
                // Clear static items if we want a fully dynamic gallery
                // grid.innerHTML = ""; 

                resp.data.forEach(img => {
                    const item = document.createElement("div");
                    item.className = "gallery-item";
                    item.innerHTML = `
                        <img src="${img.url}" alt="Gallery Photo" loading="lazy">
                        <div class="overlay">
                            <h3>${img.description || "Church Event"}</h3>
                        </div>
                    `;
                    grid.appendChild(item);
                });
            }
        })
        .catch(err => console.error("Error loading gallery:", err));
}


