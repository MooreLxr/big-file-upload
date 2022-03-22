import request from '@/utils/request'

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