const express = require('express')
const router = express.Router()
const path = require('path')
const multiparty = require('multiparty')

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' })
})

router.post('/getName', (req, res, next) => {
  console.log('dadadad', req.body.name)
  res.json({
    data: req.name,
    message: '成功',
    code: 0
  })
})
/**
 * 上传切片
 * file:文件流  fileId:文件id  fileIndex:切片索引
 */
router.post('/uploadSlice', (req, res, next) => {
  console.log('----', req.body)
  // const { file, fileId, fileIndex } = req.body
  // const chunkUploadDir = path.join(uploadPath, fileId, '/') // 切片上传目录
  // const chunkFileName = fileId + '-' + fileIndex // 切片名称
  // const form = new multiparty.Form()
  // form.encoding = 'utf-8'
  // form.uploadDir = '../public/upload_files/' //设置文件存储路径
  // form.maxFilesSize = 10 * 1024 * 1024 // 单文件大小限制：10M
  // form.parse(req, (err, fields, files) => {
  //   console.log('fields', fields)
  //   console.log('files', files)
  //   if (err) {
  //     console.log(err)
  //     res.json({
  //       data: '',
  //       message: '上传失败',
  //       code: 0
  //     })
  //     return false
  //   } else {

  //   }
  // })
  // uploadFileFn(file, chunkUploadDir, chunkFileName).then(response => {
  //   res.json({
  //     data: '',
  //     message: '上传完成',
  //     code: 1
  //   })
  // }).catch(err => {
  //   res.json({
  //     data: '',
  //     message: '上传失败',
  //     code: 0
  //   })
  // })
})

/**
 * 合并切片
 * fileId:文件id  suffix:后缀名  size:切片数量
 */
router.post('/combineSlice', (req, res, next) => {
  const { fileId, suffix, size } = req.body
  res.json({
    data: '',
    message: '请求成功',
    code: 0
  })
})

module.exports = router
