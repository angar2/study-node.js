var http = require('http');
var fs = require('fs');
var url = require('url');
var path = require('path');
var sanitizeHtml = require('sanitize-html');

var template = require('./lib/template.js');

var app = http.createServer(function (request, response) {
  var _url = request.url;
  var queryData = url.parse(_url, true).query;
  var pathname = url.parse(_url, true).pathname;
  if (pathname === '/') {
    if (queryData.id === undefined) {
      fs.readdir('./data', function (error, filelist) {
        var title = 'Welcome';
        var description = 'Hello, Node.js';
        var list = template.list(filelist);
        var HTML = template.HTML(
          title, 
          list,
          ` <a href="/create">create</a>`,
          `<h2>${title}</h2><p>${description}</p>`
        );
        response.writeHead(200);
        response.end(HTML);
      })
    } else {
      fs.readdir('./data', function (error, filelist) {
        // fileredId: 보안 상 내부 파일정보가 공개 되지 않도록 주소를 숨기는 보안역할
        var filteredId = path.parse(queryData.id).base;
        fs.readFile(`data/${filteredId}`, 'utf8', function (err, description) {
          // sanitized~: HTML 태그를 검증하여 걸러내는 역할
          var title = queryData.id;
          var sanitizedTitle = sanitizeHtml(title);
          var sanitizedDescription = sanitizeHtml(description);
          var list = template.list(filelist);
          var HTML = template.HTML(
            sanitizedTitle, 
            list,
            ` <a href="/create">create</a>
              <a href="/update?id=${sanitizedTitle}">update</a>
              <form action="delete_process" method="post">
                <input type="hidden" name="id" value="${sanitizedTitle}">
                <input type="submit" value="delete">
              </form>`,
            `<h2>${sanitizedTitle}</h2>${sanitizedDescription}`,
          );
          response.writeHead(200);
          response.end(HTML);
        });
      });
    }
  } else if (pathname === '/create') {
    fs.readdir('./data', function (error, filelist) {
      var title = 'Web - create';
      var list = template.list(filelist);
      var HTML = template.HTML(
        title,
        list,
        `<a href="/create">create</a>`,
        `<form action="create_process" method="post">
            <p><input type="text" name="title" placeholder="title"></p>
            <p>
              <textarea name="description" placeholder="description"></textarea>
            </p>
            <p>
              <input type="submit">
            </p>
          </form>`
      );
      response.writeHead(200);
      response.end(HTML);
    });
  } else if (pathname === '/create_process') {
    // 웹에서 post형식으로 넘기 data 받기
    // body를 쓰는 이유 : data를 하나씩 추가해서 쌓고 최종적으로 end를 실행
    var body = '';
    request.on('data', function (data) {
      body = body + data;
    });
    request.on('end', function () {
      var title = new URLSearchParams(body).get('title');
      var description = new URLSearchParams(body).get('description');
      console.log(title, description);
      fs.writeFile(`data/${title}`, description, 'utf8', function (err) {
        // redirection : 위치를 바꿔줌
        response.writeHead(302, { location: `/?id=${title}` });
        response.end('success');
      })
    });
  } else if (pathname === '/update') {
    fs.readdir('./data', function (error, filelist) {
      var filteredId = path.parse(queryData.id).base;
      fs.readFile(`data/${filteredId}`, 'utf8', function (err, description) {
        var title = queryData.id;
        var list = template.list(filelist);
        var HTML = template.HTML(
          title, 
          list,
          `<a href="/create">create</a> <a href="/update?id=${title}">update</a>`,
          `<form action="update_process" method="post">
            <input type="hidden" name="id"  value=${title}>
            <p><input type="text" name="title" placeholder="title" value=${title}></p>
            <p>
              <textarea name="description" placeholder="description">${description}</textarea>
            </p>
            <p>
              <input type="submit">
            </p>
          </form>`
        );
        response.writeHead(200);
        response.end(HTML);
      });
    });
  } else if (pathname === '/update_process') {
    var body = '';
    request.on('data', function (data) {
      body = body + data;
    });
    request.on('end', function () {
      var id = new URLSearchParams(body).get('id');
      var title = new URLSearchParams(body).get('title');
      var description = new URLSearchParams(body).get('description');
      console.log(id, title, description);
      fs.rename(`data/${id}`, `data/${title}`, function (err) {
        fs.writeFile(`data/${title}`, description, 'utf8', function (err) {
          // redirection : 위치를 바꿔줌
          response.writeHead(302, { location: `/?id=${title}` });
          response.end('success');
        })
      })
    });
  } else if (pathname === '/delete_process') {
    var body = '';
    request.on('data', function (data) {
      body = body + data;
    });
    request.on('end', function () {
      var id = new URLSearchParams(body).get('id');
      var filteredId = path.parse(id).base;
      fs.unlink(`data/${filteredId}`, function (error) {
        response.writeHead(302, { Location: `/` });
        response.end();
      })
    });
  } else {
    response.writeHead(404);
    response.end('Not found');
  }
});
app.listen(3000);