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
let amount =0;

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
    if (bookingType === "donations"){
        amount = document.getElementById("datepg").value;
    }
    const date = document.getElementById("datepg").value;
    const note = document.getElementById("notepg").value;

    if (bookingType === "pidi-nercha" || bookingType === "donations"){
        startPayment(null, null, amount);
    }
    else if (bookingType === "mass" || bookingType === "novena" || bookingType === "mass-oppees") {
        startPayment(date, note, amount);
    }
    else{
        alert(`${bookingType} booking submitted successfully!`);
        closeModal();
    }
};



function startPayment(date,note,amount) {
    const options = {
        key: "rzp_test_SAbPRRWka3ady4",
        amount: amount*100,
        currency: "INR",
        name: "Date Booking",
        description: "Mass booking payment",

        handler: function (response) {
            alert("Payment successful! Booking confirmed.");

            console.log("Payment ID:", response.razorpay_payment_id);
            console.log("Date:", date);
            console.log("Note:", note);

            closeModal();
        },

        theme: {
            color: "#4CAF50"
        }
    };

    const rzp = new Razorpay(options);
    rzp.open();
}

