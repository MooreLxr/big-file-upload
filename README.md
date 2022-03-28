# 大文件上传组件

## 背景
在上传大文件时，常常会出现上传一半请求超时，上传速度慢等问题，传统上传文件的方式显然不适用于上传大文件

## 前端实现原理
1.前端运用 Blob Api 对大文件进行文件分片切割，将一个大文件切成一个个小文件，然后将这些分片文件一个个上传。

2.当前端将所有分片上传完成之后，前端再通知后端进行分片合并成文件。

## 组件功能清单：
①分片上传（限制并发数）

②断点续传

③失败重传


## API Reference

### 分片上传

1.文件生成切片

```
createFileSlice (file, pieceSize = 1024 * 1024 * 5) {
    const total = file.size
    let start = 0
    let end = start + pieceSize
    let index = 0
    const sliceArray = []
    while (start < total) {
        const temp = file.slice(start, end)
        sliceArray.push({
          file: temp,
          index,
          status: 'waiting' // waiting:等待、uploading:上传中, fail:上传失败、success:上传成功
        })
        start = end
        end = start + pieceSize
        index++
      }
      return sliceArray
    }
}
```

2.上传切片（并设置最大并发数）、失败重传
```
// 上传切片
uploadSlice () {
    // 上传切片，限制最大并发请求数量
    this.requestWithLimit(this.fileSlices, MAX_REQUEST_NUM, MAX_RETRY_NUM)
        .then(() => {
          this.combineSlice() // 全部上传完，合并切片
        })
        .catch(() => {
          console.warn('部分切片上传失败......')
          this.handleUploadPause() // 有部分请求失败，将请求停掉
        })
    }
}

/** 限制请求并发数
* @params fileChunkList:切片
* @params MAX_REQUEST_NUM：最大并发数
* @params MAX_RETRY_NUM：切片失败重传次数
*/
requestWithLimit (
    fileChunkList,
    max = MAX_REQUEST_NUM,
    retry = MAX_RETRY_NUM
) {
  return new Promise((resolve, reject) => {
    // 待上传的切片数量
    const requestNum = fileChunkList.filter(fileChunk => {
      return fileChunk.status === 'fail' || fileChunk.status === 'waiting'
    }).length
    if (requestNum === 0) {
      resolve() // 切片全部上传完成
      return
    }
    const  { fileId } = this.fileInfo
    let counter = 0 // 请求成功数量
    const retryArr = [] // 记录文件上传失败的次数
    const request = () => {
      if (this.isPause) return // 暂停则不再上传切片
      // max 限制了最大并发数
      while (counter < requestNum && max > 0) {
        max--
        // 上传状态为waiting/error的切片
        const fileChunk = fileChunkList.find(chunk => {
            return chunk.status === 'fail' || chunk.status === 'waiting'
        })
        if (!fileChunk) return
        fileChunk.status = 'uploading' // 状态标识要改，不然会重复请求改切片
        const formData = new FormData()
        formData.append('file', fileChunk.file)
        formData.append('fileId', fileId) // 文件唯一标识
        formData.append('fileIndex', fileChunk.index) // 切片索引
        formData.append('type', 0) // 0: 上传切片  1：合并切片
        api.uploadSlice(formData, { abortEnabled: true }).then(res => {
          if (res.data.code == 1) {
            max++ // 释放资源
            counter++
            ...
            if (counter === requestNum) resolve() // 切片全部上传完成
            else request()
          }
        }).catch(() => {
          // 失败重传
          ...
          max++
          request()
        })
      }
    }
    request()
  })
}
```
### 断点续传

暂停上传：取消当前已发送的ajax请求，并阻止继续发送新的请求

在Axios中取消请求最核心的方法是CanelToken，例
```
let cancel;
axios.get('/user/12345', {
  cancelToken: new axios.CancelToken(function executor(c) {
    // An executor function receives a cancel function as a parameter
    cancel = c;
  })
});

// cancel the request
cancel();
```
上面已对axios中的核心方法进行了举例，但是在实际中我们往往不会像官网例子中那样使用，更多的是在axios的拦截器中做全局配置管理

```
import { addCancelToken, removeCancelToken } from '@/utils/ctrlCancelToken'

// request拦截器
service.interceptors.request.use(
  config => {
    // 添加 cancelToken 并保存到 config
    if (config.abortEnabled === true) {
      addCancelToken(config) // 添加取消axios请求的参数
    }
    return config
  },
  error => {
    // Do something with request error
    Promise.reject(error)
  }
)

// response 拦截器
service.interceptors.response.use(
  response => {
    // code===1请求成功 可结合自己业务进行修改
    const res = response.data
    if (res.code === 1) {
      /** 请求成功，将 cancelToken 移除 */
      removeCancelToken(response.config)
      return response
    } else {
      return Promise.reject(res) 
    }
  },
  error => {
    return Promise.reject(error)
  }
)
```


## 后端实现原理：
后端使用的是node.js来开发，对于只会前端的同学真的很快就上手了

### 上传切片
这里将切片都上传至以fileId命名的文件夹中（合并的时候方便读取文件和删除切片）
上传使用了multiparty插件
```
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
    // 重命名为真实文件名
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
```
![App Screenshot](https://raw.githubusercontent.com/MooreLxr/big-file-upload/master/serve/public/images/效果1.png)

### 合并切片
主要用到node.js的File system中的API
```
/**
 * 合并文件
 * @param sourceDir 切片文件夹
 * @param filePath 目标文件
 * @param total 切片总数
 */
const mergeFile = (sourceDir, filePath, total) => {
  return new Promise((resolve, reject) => {
    // 读取切片存放的文件夹
    fs.readdir(sourceDir, (err, files) => {
      if (files.length !== total) {
        return reject('上传失败，切片数量不符')
      }

      const writeStream = fs.createWriteStream(filePath)
      function merge (i) {
        // 判断结束，删除切片文件夹
        if (i === total) {
          fs.rmdir(sourceDir, (err) => {
            return reject(err)
          })
          return resolve()
        }
        // 读取切片文件，遍历切片，写入filePath目标文件
        const chunkPath = sourceDir + 'chunk_' + i
        fs.readFile(chunkPath, (err, data) => {
          fs.appendFile(filePath, data, (err) => {
            // 删除切片
            fs.unlink(chunkPath, (err) => {
              merge(++i) // 递归合并下一个切片
            })
          })
        })
      }
      merge(0)
    })
  })
}
```
![App Screenshot](https://raw.githubusercontent.com/MooreLxr/big-file-upload/master/serve/public/images/效果2.png)

## 效果图：

![App Screenshot](https://raw.githubusercontent.com/MooreLxr/big-file-upload/master/front/src/assets/1.png)

![App Screenshot](https://raw.githubusercontent.com/MooreLxr/big-file-upload/master/front/src/assets/2.png)

![App Screenshot](https://raw.githubusercontent.com/MooreLxr/big-file-upload/master/front/src/assets/3.png)



```bash
npm run dev
```