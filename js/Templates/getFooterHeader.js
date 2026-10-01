 async function init(){
    await fetchFooterHeader();
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