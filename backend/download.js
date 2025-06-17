fetch("http://localhost:3000/download", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: "https://youtu.be" })
})
.then(res => res.json())
.then(data => {
    console.log(data);
    if (data.url) {
        window.location.href = data.url; // Auto-download the file
    }
})
.catch(err => console.error(err));
