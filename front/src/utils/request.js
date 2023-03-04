import axios from 'axios'
import { Message } from 'element-ui'
import {
  addCancelToken,
  removeCancelToken
} from './ctrlCancelToken'

// 创建axios实例
let baseUrl = '/api'
if (process.env.NODE_ENV === 'production') {
  baseUrl = '/'
}
const service = axios.create({
  timeout: 120000, // 请求超时时间
  headers: { 'X-Requested-With': 'XMLHttpRequest' },
  withCredentials: true,
  baseURL: baseUrl // api 的 base_url
})

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
      return res
    } else {
      if (res.message) {
        Message({
          message: res.message,
          type: 'error',
          duration: 2000
        })
      }
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

export default service
