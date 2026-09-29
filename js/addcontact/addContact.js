/**
 * This function opens the dialog box.
 */

function showDialog(){
    const dialog = document.querySelector('dialog');
    dialog.showModal();
}

/**
 * This function closes the dialog box.
 */

function closeDialog(){
    const dialog = document.querySelector('dialog');
    dialog.close();
}

/**
 * This function shows a toast message if the input-field is invalid.
 */

function showToastMessage(message, duration = 7000) {
    const toastWrapperMail = document.getElementById("toast-wrapper-mail"); //hier fehlt noch ein platzhalter, damit die toastmessage bei mail oder phone angezeigt wird
    toastWrapperMail.classList.add("show");
    toastWrapperMail.textContent = message;
    setTimeout(() => {
        toastWrapperMail.classList.remove("show");
    }, duration);
}

let inputMail = document.querySelector('input[placeholder="Email"]');
let inputPhone = document.querySelector('input[placeholder="Phone"]');
let form = document.querySelector(".add-contact-form");

/**
 * This function examines the email input and shows a toast message if it's invalid.
 */ 

function isValidEmail(value){
    if(value.includes("@") && value.includes(".")){
        return true;
    }
    showToastMessage("Please enter a valid email address.");
    return false;
}

/**
 * This function examines the phone number input and shows a toast message if it's invalid.
 */  

function isValidPhoneNr(phoneNr){
    let cleanPhoneNr = phoneNr.replaceAll(" ", "").replaceAll("+", "");
    if(cleanPhoneNr.length >= 9 && !isNaN(cleanPhoneNr)){
        return true;
    }
    showToastMessage("Please enter a valid phone number.");
    return false;
}

inputMail.addEventListener("blur", () => {
    isValidEmail(inputMail.value);
});

inputPhone.addEventListener("blur", () => {
    isValidPhoneNr(inputPhone.value);
});


form.addEventListener("submit", event => {
    if (!isValidEmail(inputMail.value) || !isValidPhoneNr(inputPhone.value)) {
        event.preventDefault();
    }
}
)
