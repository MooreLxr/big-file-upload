var express = require('express')
var router = express.Router()

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' })
})

/* 上传切片 */
router.get('/uploadSlice', function(req, res, next) {
  // file:文件流  fileId:文件id  fileIndex:切片索引
  const { file, fileId, fileIndex } = req.body
  res.json({
    data: '',
    message: '请求成功',
    code: 1
  })
})

/* 合并切片 */
router.get('/combineSlice', function(req, res, next) {
  // fileId:文件id  suffix:后缀名  size:切片数量
  const { fileId, suffix, size } = req.body
  res.json({
    data: '',
    message: '请求成功',
    code: 1
  })
})

module.exports = router
