const createError = require('http-errors')
const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const logger = require('morgan')

var indexRouter = require('./routes/index')

var app = express()

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'jade')

app.use(logger('dev'))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))
//服务器提交的数据json化
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use('/', indexRouter)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404))
})
// 跨域
app.all("*", function (req, res, next) {
  // 允许跨域的域名，*代表允许任意域名跨域
  res.header("Access-Control-Allow-Origin", "*")
  // 允许的 header 类型
  res.header("Access-Control-Allow-Headers", "*")
  // 跨域允许的请求方式 
  res.header("Access-Control-Allow-Methods", "*")
  next()
})
app.use(function(err, req, res, next) {
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}
  res.status(err.status || 500)
  res.render('error')
})
// 监听3000端口
let server = app.listen(3000, '127.0.0.1', () => {
	let host = server.address().address // host域
	let port = server.address().port // 端口号
	
	console.log(`Server running at http://${host}:${port}`)
})

module.exports = app
