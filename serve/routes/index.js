const express = require('express')
const router = express.Router()
const path = require('path')
const fs = require('fs')
const multiparty = require('multiparty')

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' })
})

/**
 * 上传切片
 * file:文件流  fileId:文件id  fileIndex:切片索引
 */
router.post('/uploadSlice', (req, res, next) => {
  // const { file, fileId, fileIndex } = req.body
  // const chunkUploadDir = path.join(uploadPath, fileId, '/') // 切片上传目录
  // const chunkFileName = fileId + '-' + fileIndex // 切片名称
  const form = new multiparty.Form()
  form.encoding = 'utf-8'
  form.uploadDir = './public/upload_files/' //设置文件存储路径
  form.maxFilesSize = 10 * 1024 * 1024 // 单文件大小限制：10M
  form.parse(req, (err, fields, files) => {
    // fields {
    //   fileId: [ 'aacac792-6f28-4010-ad62-01d0bbe8d464' ],
    //   fileIndex: [ '0' ]
    // }
    // files {
    //   file: [
    //     {
    //       fieldName: 'file',
    //       originalFilename: 'blob',
    //       path: 'public\\upload_files\\uillblIiB7v3o_j8qLDhkNbg',
    //       headers: [Object],
    //       size: 2819779
    //     }
    //   ]
    // }
    console.log('fields', fields)
    console.log('files', files)
    if (err) {
      res.json({
        data: '',
        message: '上传失败',
        code: 0
      })
      return false
    } else {
      const { fileId, fileIndex } = fields
      const inputFile = files.file[0]
      const oldName = inputFile.path
      const chunkName =  './public/upload_files/' + fileId[0] + '-' + fileIndex[0]// 切片名称
      //重命名为真实文件名
      fs.rename(oldName, chunkName, function (err) {
        if (err) {
          console.log('rename error: ' + err)
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
  const { fileId, suffix, size } = req.body
  res.json({
    data: '',
    message: '请求成功',
    code: 0
  })
})

module.exports = router
