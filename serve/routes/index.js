const express = require('express')
const router = express.Router()
const path = require('path')
const fs = require('fs')
const multiparty = require('multiparty')
const { mkdirsSync, mergeFile } = require('../controller/index')

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' })
})

/**
 * 上传切片
 * file:文件流  fileId:文件id  fileIndex:切片索引
 */
let uploadDir = './public/upload_files/'
router.post('/uploadSlice', (req, res, next) => {
  const form = new multiparty.Form()
  form.encoding = 'utf-8'
  form.uploadDir = uploadDir //设置文件存储路径
  form.maxFilesSize = 10 * 1024 * 1024 // 单文件大小限制：10M
  mkdirsSync(uploadDir) // 创建上传目录
  
  form.parse(req, (err, fields, files) => {
    if (err) {
      res.json({
        data: '',
        message: '上传失败',
        code: 0
      })
      return false
    } else {
      const { fileId, fileIndex } = fields
      uploadDir = path.join(uploadDir, fileId[0], '/') // 切片上传至以fileId命名的文件夹中
      if(!fs.existsSync(uploadDir)) mkdirsSync(uploadDir) // 创建上传目录
      const oldChunkName = files.file[0].path
      const newChunkName = uploadDir + 'chunk_' + fileIndex[0] // 切片名称
      //重命名为真实文件名
      fs.rename(oldChunkName, newChunkName, function (err) {
        if (err) {
          res.json({
            data: '',
            message: '上传失败',
            code: 0
          })
        } else {
          res.json({
            data: chunkName,
            message: '上传成功',
            code: 1
          })
        }
      })
    }
  })
})

/**
 * 合并切片
 * fileId:文件id  suffix:后缀名  size:切片数量
 */
router.post('/combineSlice', (req, res, next) => {
  // const { fileId, suffix, size } = req.body
  console.log('----', req)

  res.json({
    data: '',
    message: '请求成功',
    code: 0
  })
})

module.exports = router
