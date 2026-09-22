const BASE_URL = "https://join--testuser-default-rtdb.europe-west1.firebasedatabase.app/";

async function getTemplateData(){
   let response = await fetch(BASE_URL + ".json");
   let data = await response.json();
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