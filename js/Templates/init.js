
 async function init(){
    await fetchFooterHeader();
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