<template>
  <div :class="['large-file-upload', `upload--${listType}`]">
    <div>
      <div class="upload-card" v-if="listType === 'picture-card'" @click.stop="handleClick">
        <i class="el-icon-upload"></i>
        <span>点击上传</span>
      </div>
      <button
        :class="['i-upload-button', `${buttonDisabled ? 'disabled' : ''}`]"
        type="button"
        :disabled="buttonDisabled"
        v-else
        @click.stop="handleClick"
      >
        上传
      </button>
      <input
        ref="inputRef"
        class="i-upload__input"
        type="file"
        name="file"
        multiple="false"
        :accept="accept"
        @change="handleUpload"
      />
    </div>
    
    <!-- 已上传的文件列表 -->
    <div class="uploaded-list" v-if="finishUpload">
      <div
        v-for="(item, i) in uploadedFileList"
        :class="['upload-list-item', `${item.status}`]"
        :key="i"
        @mouseover="isMouseIn = true"
        @mouseleave="isMouseIn = false"
      >
        <div class="upload-list-item-name">
          <i class="el-icon-paperclip"></i>
          <span :title="item.name">{{item.name}}</span>
        </div>
        <label class="upload-list-item-status" v-if="item.status">
          <i
            class="el-icon-close"
            v-show="isMouseIn"
            @click="delUploadedFile(item, i)"
          ></i>
          <i
            :class="`${item.status === 'is-success' ? 'el-icon-circle-check' : 'el-icon-circle-close'}`" v-show="!isMouseIn"
          ></i>
        </label>
      </div>
    </div>

    <!-- 上传进度 -->
    <div class="uploading-detail" v-else>
      <div style="flex: 1;">
        <el-progress :percentage="percentage"></el-progress>
        <!-- <div class="file-size">{{fileInfo.fileSize}}KB</div> -->
      </div>
      <div class="button-wrap">
        <i
          :class="`${isPause ? 'el-icon-video-play' : 'el-icon-video-pause'}`"
          @click="handlePlayOrPause"
          :title="`${isPause ? '开始' : '暂停'}`"
        ></i>
        <i
          class="el-icon-menu"
          @click="detaiVisible = !detaiVisible"
          title="查看切片状态"
        ></i>
      </div>
    </div>

    <!-- 切片状态 -->
    <div
      class="slice-wrap"
      ref="sliceDetailDom"
      v-if="fileSlices && fileSlices.length"
      :style="`height: ${detaiVisible ? 'auto' : '0px'};padding:${detaiVisible ? '10px 4px' : '0px'};border:${detaiVisible ? '1px solid #ddd' : 'none'}`"
    >
      <div
        :class="['slice-item',`slice-item-status__${item.status}`]"
        v-for="(item, i) in fileSlices"
        :key="i"
      ></div>
    </div>
  </div>
</template>

<script>
/**
* author lxr
* @Date: 2022-02-24 11:05:24
* @description 大文件上传组件
* 支持分片上传（限制并发数）
* 断点续传
* 失败重传
* <large-file-upload v-model="formData.courseUrl" accept="video/*" :limit="1"></large-file-upload>
*/
import * as api from '@/api/index'
import { v4 as uuidv4 } from 'uuid'
import { removeAllCancelToken } from '@/utils/ctrlCancelToken'
const MAX_REQUEST_NUM = 6 // 最大并发数
const MAX_RETRY_NUM = 3 // 切片上传失败重试次数
const piece_size = 1024 * 1024 * 5 // 切片大小

export default {
  name: 'large-file-upload',
  props: {
    // 接受上传的文件类型
    accept: {
      type: String,
      default: ''
    },
    // 是否禁用
    disabled: {
      type: Boolean,
      default: false
    },
    // 文件列表的类型 (text/picture-card)
    listType: {
      type: String,
      default: 'text'
    },
    // 最大允许上传个数	
    limit: Number,
    // 已上传的文件列表，例如[{name: 'food.jpg', url: 'https://xxx.cdn.com/xxx.jpg'}]
    fileList: {
      type: Array,
      default: () => []
    },
    value: String
  },
  model: {
    prop: 'value',
    event: 'onSuccess'
  },
  data () {
    return {
      fileInfo: { // 待上传的文件信息
        fileId: '',
        fileName: '',
        fileSize: 0
      },
      fileSlices: null, // 切片
      percentage: 0, // 上传百分比
      isPause: false, // 是否暂停上传
      detaiVisible: false, // 是否显示每个切片的上传详情
      finishUpload: true, // 是否上传完成
      uploadedFileList: this.fileList, // 已上传的文件列表
      isMouseIn: false
    }
  },
  created () {},
  mounted () {},
  computed: {
    // 禁用、文件数===最大上传个数、正在上传中
    buttonDisabled () {
      return this.disabled || this.uploadedFileList.length === this.limit || !this.finishUpload
    }
  },
  methods: {
    handleClick () {
      if (this.disabled) return
      const inputDom = this.$refs.inputRef
      inputDom.value = null
      inputDom.click()
    },
    // 上传
    handleUpload () {
      // const file = e.target.files[0]
      this.finishUpload = false
      const file = this.$refs.inputRef.files[0]
      const fileId = this.getFileId() // 文件唯一标识名
      const sliceUploadedRecord = this.getSliceUploadRecord(fileId) // 已上传的切片记录
      const fileSlices = (this.fileSlices = this.createFileSlice(file, piece_size)) // 文件切片
      this.fileInfo = {
        fileId,
        fileName: file.name,
        fileSize: file.size
      }
      this.setProgressPercentage()

      // 标记已上传的切片状态
      fileSlices.forEach((chunk, i) => {
        if (sliceUploadedRecord.includes(i)) {
          chunk.status = 'success'
        }
      })
      this.uploadSlice()
    },
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
    },
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
        const { fileId } = this.fileInfo
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
    },
    // 合并切片
    combineSlice() {
      console.warn('上传完成，正在合并切片......')
      const { fileId, fileName } = this.fileInfo
      const { fileSlices } = this
      const sendData = {
        fileId, // 文件唯一标识
        fileName, // 文件名
        suffix: fileName.slice(fileName.indexOf('.')), // 文件后缀
        size: fileSlices.length // 切片数量
      }
      api.combineSlice(sendData).then(res => {
        if (res.data.code == 1) {
          this.$message({
            type: 'success',
            message: '上传成功',
            duration: 1500
          })
          const result = res.data && res.data.fileName
          this.$emit('onSuccess', result)
          this.setProgressPercentage()
          this.finishUpload = true
          this.uploadedFileList.push({
            name: fileName,
            status: 'is-success'
          })
        } else {
          console.error('上传完成，合并切片失败......')
          this.$message({
            type: 'error',
            message: '切片合并失败',
            duration: 1500
          })
          this.$emit('onError')
          this.setProgressPercentage()
          this.finishUpload = true
          this.uploadedFileList.push({
            name: fileName,
            status: 'is-error'
          })
        }
      }).catch(() => {
        console.error('上传完成，合并切片失败......')
        this.$message({
          type: 'error',
          message: '切片合并失败',
          duration: 1500
        })
        this.$emit('onError')
        this.setProgressPercentage()
        this.finishUpload = true
        this.uploadedFileList.push({
          name: fileName,
          status: 'is-error'
        })
      })
    },
    handlePlayOrPause () {
      this.isPause = !this.isPause
      if (this.isPause) this.handleUploadPause()
      else this.handleUploadContinue()
    },
    // 暂停上传（取消所有axios请求）
    handleUploadPause () {
      removeAllCancelToken(true)
    },
    // 继续上传
    handleUploadContinue () {
      this.uploadSlice()
    },
    // 删除已上传的文件
    delUploadedFile (item, i) {
      this.$confirm(`确定删除${item.name}?`, '', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.uploadedFileList.splice(i, 1)
      }).catch(() => {})
    },
    // 获取文件切片
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
    },
    // 获取文件id
    getFileId () {
      return uuidv4() // 9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d
    },
    // 获取已上传的切片记录
    getSliceUploadRecord (fileId) {
      const records = localStorage.getItem(fileId)
      return records ? JSON.parse(records) : []
    },
    // 更新已上传的切片记录
    updateSliceUploadRecord (fileId, sliceIndex) {
      let records = this.getSliceUploadRecord(fileId)
      records.push(sliceIndex)
      localStorage.setItem(fileId, JSON.stringify(records))
    },
    // 设置进度条百分比
    setProgressPercentage () {
      const { fileId } = this.fileInfo
      const doneNum = this.getSliceUploadRecord(fileId).length
      const total = this.fileSlices.length
      this.percentage = total ? parseInt((doneNum / total) * 100) : 0
    }
  }
}
</script>

<style lang="scss" scoped>
.large-file-upload {
  width: 370px;
  display: inline-block;
  cursor: pointer;
  outline: none;
  padding: 10px;
  &.upload--text {
    .i-upload-button {
      display: inline-block;
      font-size: 14px;
      color: #fff;
      background-color: #409eff;
      border: 1px solid #409eff;
      border-radius: 15px;
      padding: 7px 20px;
      text-align: center;
      line-height: 1;
      -webkit-appearance: none;
      white-space: nowrap;
      cursor: pointer;
      box-sizing: border-box;
      outline: none;
      margin: 0;
      transition: .1s;
      font-weight: 500;
      -moz-user-select: none;
      -webkit-user-select: none;
      -ms-user-select: none;
      user-select: none;
      &.disabled {
        cursor: not-allowed; 
        color: #fff;
        background-color: #a0cfff;
        border-color: #a0cfff;
      }
    }
  }
  &.upload--picture-card {
    .upload-card {
      width: 290px;
      height: 150px;
      background-color: #fff;
      border: 1px dashed #d9d9d9;
      border-radius: 6px;
      box-sizing: border-box;
      text-align: center;
      cursor: pointer;
      overflow: hidden;
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;
    }
    .el-icon-upload {
      font-size: 67px;
      color: #c0c4cc;
    }
    span {
      line-height: 30px;
      margin: 0;
      padding: 0;
      color: #666;
    }
  }
  .i-upload__input {
    display: none;
  }
  .uploaded-list {
    .upload-list-item {
      width: 100%;
      font-size: 14px;
      color: #606266;
      line-height: 1.8;
      margin-top: 5px;
      box-sizing: border-box;
      border-radius: 4px;
      padding: 0 10px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      &:first-child {
        margin-top: 10px;
      }
      &:hover {
        background-color: #f3f3f3;
        .upload-list-item-name {
          color: #409eff;
        }
      }
      .upload-list-item-name {
        color: #606266;
        margin-right: 40px;
        transition: color .3s;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .el-icon-circle-check {
        color: #02bf0f;
      }
      .el-icon-circle-close {
        color: #fa3239;
      }
      .el-icon-close {
        cursor: pointer;
      }
    }
  }
  .uploading-detail {
    display: flex;
    align-items: center;
    justify-content: space-between;
    .button-wrap i {
      font-size: 25px;
      color: #409eff;
      margin-right: 6px;
      &:first-child {
        margin-left: 10px;
      }
    }
    .file-size {
      color: #333;
      font-size: 14px;
    }
  }
  .slice-wrap {
    border: 1px solid #eee;
    transition: all .3s;
    margin: 10px 0;
    padding: 10px 5px;
    text-align: left;
    overflow: hidden;
    box-sizing: border-box;
    .slice-item {
      width: 20px;
      height: 20px;
      display: inline-block;
      margin: 2px 4px;
      border: 1px solid #ddd;
    }
    .slice-item-status__waiting{
      background-color: #fff;
    }
    .slice-item-status__success{
      background-color: #02bf0f;
      border-color: #02bf0f;
    }
    .slice-item-status__fail{
      background-color: #fa3239;
      border-color: #fa3239;
    }
  }
  ::v-deep.el-progress-bar {
    margin-top: 10px;
    margin-bottom: 10px;
  }
}
</style>