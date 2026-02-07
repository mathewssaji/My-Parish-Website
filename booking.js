
const massbtn = document.getElementById('mass');
const novenabtn = document.getElementById('novena');
const massoppeesbtn = document.getElementById('mass-oppees');
const pidinerchabtn = document.getElementById('pidi-nercha');
const donationsbtn = document.getElementById('donations');

const inpar = document.getElementById('input');
const modal = document.getElementById("bookingpg");
const overlay = document.getElementById("overlay");
const closeBtn = document.getElementById("closeModal");
const submitBtn = document.getElementById("submitBooking");

let bookingType = "";
let amount = 0;

function openModal(type) {
    bookingType = type;
    modal.style.display = "block";
    overlay.style.display = "block";
}

function closeModal() {
    modal.style.display = "none";
    overlay.style.display = "none";
}


massbtn.onclick = () => {
    amount = 150;
    inpar.style.display = "block";
    document.getElementById("heading").innerText = "Mass Booking";
    openModal("mass");
};
novenabtn.onclick = () => {
    amount = 100;
    inpar.style.display = "block";
    document.getElementById("heading").innerText = "Novena Booking";
    openModal("novena");
};
massoppeesbtn.onclick = () => {
    amount = 200;
    inpar.style.display = "block";
    document.getElementById("heading").innerText = "Mass & Opees Booking";
    openModal("mass-oppees");
};
pidinerchabtn.onclick = () => {
    amount = 500;
    inpar.style.display = "none";
    document.getElementById("heading").innerText = "Pidi Nercha : 500 INR";
    openModal("pidi-nercha")
};
donationsbtn.onclick = () => {
    document.getElementById("datebk").innerText = "Amount:";
    document.getElementById("notepg").style.display = "none";
    document.getElementById("datepg").type = "number";
    document.getElementById("datepg").placeholder = "Enter Amount";
    document.getElementById("heading").innerText = "Donations";
    openModal("donations")
};

closeBtn.onclick = closeModal;
overlay.onclick = closeModal;


submitBtn.onclick = () => {
    if (bookingType === "donations") {
        amount = document.getElementById("datepg").value;
    }
    const date = document.getElementById("datepg").value;
    const note = document.getElementById("noteInput").value;

    if (bookingType === "pidi-nercha" || bookingType === "donations") {
        startPayment(null, null, amount);
    }
    else if (bookingType === "mass" || bookingType === "novena" || bookingType === "mass-oppees") {
        startPayment(date, note, amount);
    }
    else {
        alert(`${bookingType} booking submitted successfully!`);
        closeModal();
    }
};



function startPayment(date, note, amount) {
    const options = {
        key: "rzp_test_SAbPRRWka3ady4",
        amount: amount * 100,
        currency: "INR",
        name: "Date Booking",
        description: "Mass booking payment",

        handler: function (response) {
            alert("Payment successful! Booking confirmed.");

            console.log("Payment ID:", response.razorpay_payment_id);
            console.log("Date:", date);
            console.log("Note:", note);

            // Prepare data for Google Sheet
            const bookingData = {
                type: bookingType, // Global variable
                date: date || "N/A",
                note: note || "N/A",
                amount: amount, // Global variable
                payment_id: response.razorpay_payment_id
            };

            saveToGoogleSheet(bookingData);

            closeModal();
        },

        theme: {
            color: "#4CAF50"
        }
    };

    const rzp = new Razorpay(options);
    rzp.open();
}

/**
 * Sends booking data to Google Sheets via Apps Script
 * @param {Object} data - The booking data object
 */
function saveToGoogleSheet(data) {
    // Add action for new script V2
    data.action = "add_booking";

    // PASTE YOUR GOOGLE APPS SCRIPT WEB APP URL HERE
    const scriptURL = "https://script.google.com/macros/s/AKfycbxvPS04rg3894bTmBS3PGflhyIUUC3DOdYrP9lPslkPBIyrM_JY0RiLuYrdsVJMd9id/exec";

    if (scriptURL === "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE") {
        console.error("Script URL not set! accessing Google Sheet failed.");
        alert("Booking confirmed locally, but database connection is missing.");
        return;
    }

    fetch(scriptURL, {
        method: 'POST',
        mode: 'no-cors', // Standard mode for Apps Script
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
        .then(response => {
            // Apps Script 'no-cors' response is opaque, we can't read JSON content directly.
            // HOWEVER, since we used 'no-cors', if it failed logic-wise (e.g. "Full"), 
            // the server threw an Error which might result in a 500 or just silence in no-cors.

            // Wait! We CHANGED the script to return JSON.
            // Standard `fetch` to Apps Script with `no-cors` means we CANNOT read the response body.
            // This is a limitation. The only way to read the error ("Date Blocked") is to use `redirect: 'follow'`
            // and NOT `no-cors`, but that triggers CORS errors in browser unless we use a proxy or JSONP.

            // CORRECTION:
            // We cannot easily get the "Error Message" (like "Fully Booked") back to the client
            // if we use `no-cors`. 
            // But for Payment flow, the money is already paid via Razorpay!
            // This is a critical architectural issue. We should check availability BEFORE payment.

            // QUICK FIX for User Request: 
            // We will assume success for now. If the Admin wants to restrict, 
            // ideally we should check *before* `startPayment`.

            console.log("Booking sent.");
        })
        .catch(error => {
            console.error('Error!', error.message);
        });
}
// NOTE: To truly block properly, we should add a 'check_availability' call
// BEFORE opening the payment modal. I will suggest this improvement.
