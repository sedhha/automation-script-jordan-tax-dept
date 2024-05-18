import fetch from "node-fetch";


const makeRequestToTextDept = (request_config) => {
    const { url, client_id, client_secret } = request_config;
    const headers = {
        'Client-Id': client_id,
        'Secret-Key': client_secret,
        'Content-Type': 'application/json',
        'Cookie': 'stickounet=4fdb7136e666916d0e373058e9e5c44e|7480c8b0e4ce7933ee164081a50488f1',
    };

    const body = JSON.stringify({
        invoice: 'Encrypted XML Code',
    });

    fetch(url, {
        method: 'POST',
        headers: headers,
        body: body,
    })
        .then(response => response.text())
        .then(text => console.log(text))
        .catch(error => console.error('Error:', error));
}