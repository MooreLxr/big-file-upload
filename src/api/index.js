import request from '@/utils/request'

// 上传/合并 切片
export function uploadSlice(params, extend) {
  return request({
    url: '/asw/uploadFileByPart',
    method: 'post',
    data: params,
    ...extend
  })
}