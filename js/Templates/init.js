
 async function init(){
    await fetchFooterHeader();
    renderNavFooterMobile2();
    initNavbarButtonsBackground();
    const { userArray, taskArray } = await fetchTemplateData();
    createAlphabeticalList(userArray);
    sortTasks(taskArray);
}
/**
 * this is a function that fetches the footer and header templates and inserts them into the pages
 */

async function fetchFooterHeader() {
    const headerResponse = await fetch('../templates/header.txt');
    const headerHtml = await headerResponse.text();
    document.body.insertAdjacentHTML('afterbegin', headerHtml);
    const footerResponse = await fetch('../templates/footer.txt');
    const footerHtml = await footerResponse.text();
    document.body.insertAdjacentHTML('beforeend', footerHtml);
}

/**
 * this is a function that checks which html path is active and sets the background-color of the navbar
 */

function initNavbarButtonsBackground(){
const links = document.querySelectorAll(".nav-btn a");
const currentPage = window.location.pathname.split("/").pop();
links.forEach(link => {
    const linkPage = link.getAttribute("href").split("/").pop();
    if (currentPage === linkPage) {
        link.closest(".nav-btn").classList.add("is-active");
    }
});
}

function renderNavFooterMobile2(){
    const navfooterMobile = document.getElementById("nav-footer-mobile");
    const currentPage = window.location.pathname.split("/").pop();
    if(currentPage === "privacy-notice.html" || currentPage === "legal-notice.html") {
        navfooterMobile.innerHTML = displayNavFooterMobilePolicy();
    }
}

function displayNavFooterMobilePolicy() {
    return `<div class="mobile-nav-btns">
    <div class="nav-btn">
            <a href="../index.html" class="nav-element mobile-design">
                   <svg width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
<mask id="mask0_268662_8754" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="30" height="30">
<rect width="30" height="30" fill="#D9D9D9"/>
</mask>
<g mask="url(#mask0_268662_8754)">
<mask id="mask1_268662_8754" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="2" y="2" width="26" height="27">
<rect x="2" y="2.03418" width="26" height="26" fill="#D9D9D9"/>
</mask>
<g mask="url(#mask1_268662_8754)">
<path d="M16.0833 24.7842C15.7764 24.7842 15.5191 24.6804 15.3115 24.4727C15.1038 24.2651 15 24.0078 15 23.7008C15 23.3939 15.1038 23.1366 15.3115 22.929C15.5191 22.7213 15.7764 22.6175 16.0833 22.6175H22.5833V7.45085H16.0833C15.7764 7.45085 15.5191 7.34703 15.3115 7.13939C15.1038 6.93175 15 6.67446 15 6.36751C15 6.06057 15.1038 5.80328 15.3115 5.59564C15.5191 5.388 15.7764 5.28418 16.0833 5.28418H22.5833C23.1792 5.28418 23.6892 5.49633 24.1135 5.92064C24.5378 6.34494 24.75 6.85501 24.75 7.45085V22.6175C24.75 23.2133 24.5378 23.7234 24.1135 24.1477C23.6892 24.572 23.1792 24.7842 22.5833 24.7842H16.0833ZM14.1063 16.1175H6.33333C6.02639 16.1175 5.7691 16.0137 5.56146 15.8061C5.35382 15.5984 5.25 15.3411 5.25 15.0342C5.25 14.7272 5.35382 14.4699 5.56146 14.2623C5.7691 14.0547 6.02639 13.9508 6.33333 13.9508H14.1063L12.075 11.9196C11.8764 11.721 11.7771 11.4772 11.7771 11.1883C11.7771 10.8995 11.8764 10.6467 12.075 10.43C12.2736 10.2133 12.5264 10.1005 12.8333 10.0915C13.1403 10.0824 13.4021 10.1863 13.6188 10.4029L17.4917 14.2758C17.7083 14.4925 17.8167 14.7453 17.8167 15.0342C17.8167 15.3231 17.7083 15.5758 17.4917 15.7925L13.6188 19.6654C13.4021 19.8821 13.1448 19.9859 12.8469 19.9769C12.549 19.9679 12.2917 19.855 12.075 19.6383C11.8764 19.4217 11.7816 19.1644 11.7906 18.8665C11.7997 18.5686 11.9035 18.3203 12.1021 18.1217L14.1063 16.1175Z" fill="#CDCDCD"/>
</g>
</g>
</svg>
                    <span>Log In</span>
                </a>
                </div>
            <div class="legal-and-policy-mobile" id="mobile-nav-btns-legal-policy">
            <div class="nav-btn">
                <a href="../pages/privacy-notice.html" class="nav-element mobile-design">
                    <span>Privacy Policy</span>
                </a>
                </div>
            <div class="nav-btn">
                <a href="../pages/legal-notice.html" class="nav-element mobile-design">
                    <span>Legal Notice</span>
                </a>
                </div>
            </div>
            </div>`;
}

const BASE_URL = "https://join--testuser-default-rtdb.europe-west1.firebasedatabase.app/";

async function fetchTemplateData(){
   let response = await fetch(BASE_URL + ".json");
   let data = await response.json();
   const userArray = data.contacts;
   const taskArray = data.tasks;
   return { userArray, taskArray };
}

function createAlphabeticalList(userArray) {
    const sortedUsers = userArray.sort((a, b) => a.firstName.localeCompare(b.firstName));
    console.log(sortedUsers);
}

function sortTasks(taskArray) {
    const sortedTasks = taskArray.sort((a, b) => a.state.localeCompare(b.state));
    console.log(sortedTasks);
}


async function postData(path="", data={}){
    let response = await fetch(BASE_URL + path + ".json", {
        method: "POST",
        header: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    });
    let responseToJson= await response.json();
    console.log(responseToJson);
}