import request from '@/utils/request'

// 验证文件是否已上传至服务器
export function verifyFileIsExist(params) {
  return request({
    url: '/verifyFile/isExist',
    method: 'post',
    data: params
  })
}
// 上传切片
export function uploadSlice(params, extend) {
  return request({
    url: '/uploadSlice',
    method: 'post',
    data: params,
    ...extend
  })
}
// 合并切片
export function combineSlice(params) {
  return request({
    url: '/combineSlice',
    method: 'post',
    data: params
  })
}