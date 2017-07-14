var express = require('express'); // express 라이브러리 import
var mysql = require('mysql'); // Mysql 클라이언트 라이브러리 import
var xmlparser = require('express-xml-bodyparser') // xml 파싱 라이브러리 import
// connection 객체 생성
var connection = mysql.createConnection({
	host:'localhost',
	port: 3306,
	user: 'root',
	password: '',
	database: 'lora_service'
});
var app = express();

// ThingPlug 서버로 부터 받은 xml 데이터를 파싱하기 위해 추가
app.use(xmlparser());

// [<ip 주소>:3000/mycallback]로 POST 요청이 들어왔을 때
app.post('/data_receiver',function(request, response) {
	var notificationMessage = request.body['m2m:cin']; // Subscription Data
	var content = notificationMessage.con[0]; // Subscription 의 Content
	var time = notificationMessage.lt[0]; // Subscription 의 발생시각
	console.log(notificationMessage);
	console.log(content,time);

	// notificationMessage 의 con,lt 데이터를 Mysql 의 subscription_data 테이블에 삽입하는 쿼리 실행
	connection.query('INSERT INTO subscription_data SET ?',
	{ con: content, lt: time }, function (err, result) {
		if (err) {
			console.error(err);
		}
		response.sendStatus(200); // 데이터 수신에 성공했음을 ThingPlug 서버에 응답
	});
});

// [<ip 주소>:3000/subscription_data]로 GET 요청이 들어왔을 때
app.get('/subscription_data', function(request, response) {
	// Mysql 의 subscription_data 테이블에서 모든 데이터를 조회하는 쿼리 실행
	connection.query('SELECT * FROM subscription_data', function(err, result) {
		if (err) {
			console.error(err);
		}
		response.json(result);
	});
});

// [<ip 주소>:3000/dashboard]로 GET 요청이 들어왔을 때
app.get('/dashboard', function(request, response) {
	// Mysql 의 subscription_data 테이블에서 모든 데이터를 조회하는 쿼리 실행
	connection.query('SELECT * FROM subscription_data', function(err, result) {
		if (err) {
			console.error(err);
		}

		var htmlTableData = ''

		// Mysql 에서 가져온 subscription data 를 html table row 로 변환
		result.forEach(function(el) {
		htmlTableData = htmlTableData + `
		<tr>
		<td>${el.lt}</td>
		<td>${el.con}</td>
		</tr>`
		}, this);

		var html = `
		<!DOCTYPE html>
		<html>
		<head>
		<meta charset ="utf-8">
		<title>Dashboard</title>
		</head>
		<body>
		<h1>Dashboard</h1>
		<table>
		<tr>
		<th>time</th>
		<th>content</th>
		</tr>
		${htmlTableData}
		</table>
		</body>
		</html>
		`;
		
		response.send(html); // 브라우저에 출력하기 위한 html 을 응답
	});
});

// [<ip 주소>:3000/]로 GT 요청이 들어왔을 때
app.get('/', function (request, response) {
	response.send('Hello World!');
});

// 서버를 3000 번 포트로 오픈하고 요청을 대기
app.listen(3000, function() {
	console.log('lora_service app listening on port 3000!');
});

