const http = require('http');
const fs = require('fs');
const path = require('path');
const PORT = 8080;
const ROOT = __dirname;
const MIME = {
  '.html':'text/html','.css':'text/css','.js':'application/javascript',
  '.json':'application/json','.png':'image/png','.jpg':'image/jpeg',
  '.svg':'image/svg+xml','.ico':'image/x-icon','.woff2':'font/woff2'
};
http.createServer((req,res)=>{
  let url = req.url.split('?')[0];
  if(url==='/') url='/index.html';
  const fp = path.join(ROOT,url);
  fs.readFile(fp,(err,data)=>{
    if(err){res.writeHead(404);res.end('Not found');return;}
    res.writeHead(200,{'Content-Type':MIME[path.extname(fp)]||'application/octet-stream','Cache-Control':'no-cache'});
    res.end(data);
  });
}).listen(PORT,()=>console.log(`CrackIt dev server: http://localhost:${PORT}`));
