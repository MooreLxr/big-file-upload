const fs = require('fs')
const multer = require('multer')

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

const uploadFileFn = (file, uploadDir, fileName) => {
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir)
    },
    filename: function (req, file, cb) {
      cb(null, fileName)
    }
  })
  const upload = multer({ storage: storage })
  return new Promise((resolve, reject) => {
    upload.single('uploaded_file').then(res => {
      console.log('reereer', res)
      resolve()
    }).catch(() => {
      reject()
    })
  })
}

module.exports = {
  mkdirsSync
}