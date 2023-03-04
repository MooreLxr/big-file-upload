const express = require('express')
const router = express.Router()
const path = require('path')
const fs = require('fs')
const multiparty = require('multiparty')
const { mkdirsSync, mergeFileChunk, getUploadedChunks } = require('../controller/index')
const UPLOAD_DIR = './public/upload_files/'

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' })
})

/**
 * 查询文件是否已上传至服务器
 */
router.post('/verifyFile/isExist', async (req, res, next) => {
  const { fileId, suffix } = req.body
  const filePath = path.resolve(UPLOAD_DIR, `${fileId}.${suffix}`)
  if (fs.existsSync(filePath)) {
    res.json({
      data: {
        fileId,
        isExist: true
      },
      message: '文件已存在',
      code: 1
    })
    return
  }
  // 获取已上传的切片列表
  const chunkDir = path.resolve(UPLOAD_DIR, fileId)
  const uploadedChunks = await getUploadedChunks(chunkDir)
  res.json({
    data: {
      fileId,
      isExist: false,
      uploadedChunkList: uploadedChunks
    },
    message: '文件不存在',
    code: 1
  })
})

/**
 * 上传切片
 * file:文件流  fileId:文件id  chunkId:切片索引
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
    }
    const [fileId] = fields.fileId // 文件id
    const [chunkId] = fields.chunkId // 切片id(文件id+切片索引)
    const chunkDir = path.resolve(UPLOAD_DIR, fileId)
    mkdirsSync(chunkDir) // 切片存放在fileId命名的文件夹中
    const oldChunkName = files.file[0].path
    const newChunkName = path.resolve(chunkDir, chunkId) // 切片名称
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
          data: {
            chunkId
          },
          message: '上传成功',
          code: 1
        })
      }
    })
  })
})

/**
 * 合并切片
 * fileId:文件id  suffix: 文件后缀  size:切片数量
 */
router.post('/combineSlice', (req, res, next) => {
  const { fileId, suffix, size } = req.body
  const chunkDir = path.resolve(UPLOAD_DIR, fileId) // 切片存放的文件夹
  const destFile = path.resolve(UPLOAD_DIR, `${fileId}.${suffix}`) // 最终合并切片生成的文件名

  if (!fs.existsSync(chunkDir)) {
    res.json({
      data: '',
      message: '文件上传失败',
      code: 0
    })
    return
  }
  mergeFileChunk(chunkDir, destFile, size).then(() => {
    res.json({
      data: {
        fileId,
        Url: `${UPLOAD_DIR}${fileId}.${suffix}`,
      },
      message: '上传成功',
      code: 1
    })
  }).catch(err => {
    res.json({
      data: '',
      message: err,
      code: 0
    })
  })
})

module.exports = router
