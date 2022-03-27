const express = require('express')
const router = express.Router()
const path = require('path')
const fs = require('fs')
const multiparty = require('multiparty')
const { mkdirsSync, mergeFile } = require('../controller/index')
const UPLOAD_DIR = './public/upload_files/'

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' })
})

/**
 * 上传切片
 * file:文件流  fileId:文件id  fileIndex:切片索引
 */

router.post('/uploadSlice', (req, res, next) => {
  const form = new multiparty.Form()
  form.encoding = 'utf-8'
  form.uploadDir = UPLOAD_DIR //设置文件存储路径
  form.maxFilesSize = 10 * 1024 * 1024 // 单文件大小限制：10M
  mkdirsSync(UPLOAD_DIR) // 创建上传目录
  
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
      const chunkDir = path.join(UPLOAD_DIR, fileId[0], '/')
      mkdirsSync(chunkDir) // 创建以fileId命名的文件夹, 切片转移至该文件夹中
      const oldChunkName = files.file[0].path
      const newChunkName = chunkDir + 'chunk_' + fileIndex[0] // 切片名称
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
            data: newChunkName,
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
 * fileId:文件id  fileName: 文件名  suffix:后缀名  size:切片数量
 */
router.post('/combineSlice', (req, res, next) => {
  const { fileId, fileName, suffix, size } = req.body
  const chunkDir = path.join(UPLOAD_DIR, fileId, '/') // 切片存放的路径
  const destFile = path.join(UPLOAD_DIR, fileName)

  if (!fs.existsSync(chunkDir)) {
    res.json({
      data: '',
      message: '文件上传失败',
      code: 0
    })
  } else {
    mergeFile(chunkDir, destFile, size).then(() => {
      res.json({
        data: {
          fileId,
          fileName,
          Url: path.join(`http://localhost:3000/${UPLOAD_DIR}`, fileName),
        },
        message: '文件上传成功',
        code: 1
      })
    }).catch(err => {
      res.json({
        data: '',
        message: err,
        code: 0
      })
    })
  }
})

module.exports = router
