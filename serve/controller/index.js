const fs = require('fs')
const path = require('path')

// 递归创建目录  同步方法
const mkdirsSync = (dirname) => {
  if(fs.existsSync(dirname)) {
    return true
  } else {
    if (mkdirsSync(path.dirname(dirname))) {
      fs.mkdirSync(dirname)
      return true
    }
  }
}

/**
 * 合并文件
 * @param sourceDir 切片文件夹
 * @param filePath 目标文件
 * @param fileId 文件id
 * @param total 切片总数
 */
const mergeFile = (sourceDir, filePath, fileId, total) => {
  return new Promise((resolve, reject) => {
    fs.readdir(sourceDir, (err, files) => {
      if (files.length !== total) {
        return reject('上传失败，切片数量不符')
      }

      const writeStream = fs.createWriteStream(filePath)
      function merge (i) {
        // 判断结束
        if (i === total) {
          fs.rmdir(sourceDir, (err) => {
            return reject(err)
          })
          return resolve()
        }
        const chunkPath = sourceDir + 'chunk_' + i
        fs.readFile(chunkPath, (err, data) => {
          if (err) {
            return reject(err)
          }
          // 追加文件
          fs.appendFile(filePath, data, (err) => {
            if (err) {
              return reject(err)
            }
            // 删除切片
            fs.unlink(chunkPath, (err) => {
              // 递归合并下一个切片
              merge(++i)
            })
          })
        })
      }
      merge(0)
    })
  })
}

module.exports = {
  mkdirsSync,
  mergeFile
}