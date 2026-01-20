const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

console.log(`Starting server on port ${PORT}...`);

const server = http.createServer((req, res) => {
    // Parse URL to separate path from query string
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    let pathname = parsedUrl.pathname;
    
    console.log(`${req.method} ${pathname}`);
    
    // Prevent directory traversal
    const safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
    let filePath = path.join(__dirname, safePath);

    // Check if path exists and if it is a directory
    fs.stat(filePath, (err, stats) => {
        if (err) {
            if (err.code === 'ENOENT') {
                console.log(`404: ${filePath}`);
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>404 Not Found</h1><p>The file could not be found.</p>', 'utf-8');
            } else {
                console.error(`500: ${err.code} for ${filePath}`);
                res.writeHead(500);
                res.end('Sorry, check with the site admin for error: ' + err.code + ' ..\n');
            }
            return;
        }

        // If directory, try to serve index.html
        if (stats.isDirectory()) {
            filePath = path.join(filePath, 'index.html');
        }

        const extname = String(path.extname(filePath)).toLowerCase();
        const contentType = mimeTypes[extname] || 'application/octet-stream';

        fs.readFile(filePath, (error, content) => {
            if (error) {
                if (error.code === 'ENOENT') {
                    console.log(`404 (Index): ${filePath}`);
                    res.writeHead(404, { 'Content-Type': 'text/html' });
                    res.end('<h1>404 Not Found</h1><p>Directory exists but no index.html found.</p>', 'utf-8');
                } else {
                    console.error(`500: ${error.code} for ${filePath}`);
                    res.writeHead(500);
                    res.end('Sorry, check with the site admin for error: ' + error.code + ' ..\n');
                }
            } else {
                res.writeHead(200, { 
                    'Content-Type': contentType,
                    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0',
                    'Surrogate-Control': 'no-store',
                    'Referrer-Policy': 'no-referrer',
                    'X-Content-Type-Options': 'nosniff',
                    'X-Frame-Options': 'SAMEORIGIN',
                    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
                    'Content-Security-Policy': [
                        "default-src 'self' 'unsafe-inline'",
                        "script-src 'self' 'unsafe-inline' https:",
                        "style-src 'self' 'unsafe-inline' https:",
                        "img-src 'self' https: data:",
                        "font-src 'self' https: data:",
                        "connect-src 'self' https:",
                        "frame-src 'self'",
                        "manifest-src 'self'"
                    ].join('; ')
                });
                res.end(content, 'utf-8');
            }
        });
    });
});

server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
        console.error('Address in use, retrying...');
        setTimeout(() => {
            server.close();
            server.listen(PORT);
        }, 1000);
    } else {
        console.error('Server error:', e);
    }
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
    console.log('Press Ctrl+C to stop.');
});
