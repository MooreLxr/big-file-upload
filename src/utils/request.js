import axios from 'axios'
import { Message } from 'element-ui'
import {
  addCancelToken,
  removeCancelToken
} from './ctrlCancelToken'

// 创建axios实例
const service = axios.create({
  baseURL: process.env.BASE_API, // api 的 base_url
  timeout: 120000, // 请求超时时间
  withCredentials: true
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

export default service
