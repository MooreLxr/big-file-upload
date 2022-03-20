# 大文件上传组件

## 背景
当需要上传大文件，出现网速不好、上传速度慢、断网情况等，传统上传文件的方式就会出现问题。

## 实现原理
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
                        fileChunk.status = 'success' // 更新单个切片的状态
                        this.updateSliceUploadRecord(fileId, fileChunk.index) // 每个切片上传完都要更新一下切片记录
                        this.setProgressPercentage()
                        if (counter === requestNum) resolve() // 切片全部上传完成
                        else request()
                    }
                }).catch(() => {
                    // 失败重传
                    fileChunk.status = 'fail'
                    if (typeof retryArr[fileChunk.index] !== 'number') {
                        retryArr[fileChunk.index] = 0
                    }
                    // 次数累加
                    retryArr[fileChunk.index]++
                    // 一个请求报错超过最大重试次数
                    if (retryArr[fileChunk.index] >= retry) {
                        return reject()
                    }
                    // 释放当前占用的资源，但是counter不累加
                    max++
                    request()
                })
            }
        }
        request()
    })
}
```
### 暂停上传

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
    if (error.message) {
      Message({
        message: error.message,
        type: 'error',
        duration: 2000
      })
    }
    return Promise.reject(error)
  }
)
```
## 效果图：

![App Screenshot](https://raw.githubusercontent.com/MooreLxr/big-file-upload/master/front/src/assets/1.png)

![App Screenshot](https://raw.githubusercontent.com/MooreLxr/big-file-upload/master/front/src/assets/2.png)

![App Screenshot](https://raw.githubusercontent.com/MooreLxr/big-file-upload/master/front/src/assets/3.png)



```bash
npm run dev
```