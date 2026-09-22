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

function showToastMessage(message, duration = 3000) {
    const toastWrapper = document.getElementById("toast-wrapper");
    toastWrapper.classList.add("show");
    toastWrapper.textContent = message;
    setTimeout(() => {
        toastWrapper.classList.remove("show");
    }, duration);
}

let inputMail = document.querySelector('input[placeholder="Email"]');

function isValidEmail(value){
    if(inputMail.value.includes("@") && inputMail.value.includes(".")){
        return true;
    }
    showToastMessage("Please enter a valid email address.");
    return false;
}
