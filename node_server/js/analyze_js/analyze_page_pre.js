setTimeout(() => {
       fetch('/rtech/api/get_analysis', { method: 'GET' })
        .then(response => response.text())
        .then(data => {document.open(); document.write(data); document.close();})
}, 15000 );