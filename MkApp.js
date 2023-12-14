var express = require('express');
var bodyParser = require('body-parser');
var cors = require('cors');
var router = require('./apis/index');
var cookieParser = require('cookie-parser');
require('express-async-errors');

var app = express();

// 设置web工程的根目录 /
app.use(express.static(__dirname + '/'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(
  cors({ // 跨域设置
    origin: '*', // 允许的域名
    methods: ['GET', 'POST'], // 允许的 HTTP 方法
    credentials: true
  })
);

// 设置返回code枚举值
const CODE_TYPE = {
  SUCCESS: 200, // 成功
  CLIENT_ERROR: 400, // 请求异常
  SERVER_ERROR: 500, // 服务异常
}
app.set('CODE_TYPE', CODE_TYPE);
app.set('secretKey', 'Moming Love KK');

// 静态服务
app.get('/', (req, res) => {
  console.log('收到请求');
  res.send({
    code: 200,
    msg: '',
    data: 'hello',
  });
});

// 启动mysql
var mysql = require('mysql');
var db = mysql.createConnection({
  host: '127.0.0.1',
  port: '3306',
  user: 'root',
  password: '11111111',
  database: 'MkBlog',
});
app.set('db', db);

// 设置api路由
app.use('/api', router);

app.listen(8211, () => {
  console.log('服务启动，http://127.0.0.1:8211/');
});

// 错误处理中间件
app.use(function (err, req, res, next) {
  console.error(err.stack); // 打印错误堆栈信息
  res.send({
    code: app.get('CODE_TYPE').SERVER_ERROR,
    msg: err,
    data: {}
  });
  next();
});

// 退出服务关闭数据库
process.on('SIGINT', function () {
  console.log('\nGracefully shutting down from SIGINT (Ctrl+C)');
  // 关闭数据库连接
  db.end((err) => {
    if (err) console.log('关闭数据库连接时发生错误:', err);
    process.exit()
  });
});

process.on('SIGTERM', function () {
  console.log('\nGracefully shutting down from SIGTERM');
  // 关闭数据库连接
  db.end((err) => {
    if (err) console.log('关闭数据库连接时发生错误:', err);
    process.exit()
  });
});