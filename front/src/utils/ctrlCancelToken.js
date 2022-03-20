import axios from 'axios'

const cancelTokenMap = Object.create(null) // 声明一个变量用于存储每个ajax请求的取消函数和ajax标识
let id = 0

export function addCancelToken(axiosConfig) {
  let cancel
  const cancelToken = new axios.CancelToken(function executor(c) {
    cancel = c
  })
  axiosConfig.cancelToken = cancelToken
  axiosConfig.cancelTokenId = ++id

  cancelTokenMap[id] = () => {
    console.warn(`[utils/ctrlCancelToken] 现在正在取消请求`)
    cancel()
    removeCancelToken(axiosConfig)
  }

  return cancelTokenMap[id]
}

function removeCancelTokenById(id, needCallCancel = false) {
  if (id in cancelTokenMap === false) return

  if (needCallCancel) {
    /** 执行完这个 cancel 会重新调用 removeCancelToken */
    cancelTokenMap[id]('abort request')
  } else {
    delete cancelTokenMap[id]
  }
}

export function removeCancelToken(axiosConfig, needCallCancel = false) {
  if ('cancelTokenId' in axiosConfig === false) return
  removeCancelTokenById(axiosConfig.cancelTokenId, needCallCancel)
}

export function removeAllCancelToken(needCallCancel = false) {
  for (const id in cancelTokenMap) {
    removeCancelTokenById(id, needCallCancel)
  }
}
