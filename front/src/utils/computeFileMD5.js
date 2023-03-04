import SparkMD5 from 'spark-md5'

/**
 * 根据切片生成md5
 * @param chunkList 切片
 * @returns 
 */
export function computeFileMD5(chunkList) {
  return new Promise((resolve, reject) => {
    const spark = new SparkMD5.ArrayBuffer()
    const fileReader = new FileReader()
    let count = 0
    const load = index => {
      fileReader.readAsArrayBuffer(chunkList[index])
      fileReader.onload = event => {
        count++
        spark.append(event.target.result)
        if(count === chunkList.length) {
          const md5 = spark.end() // 最终md5值
          spark.destroy() // 释放缓存
          resolve(md5)
        } else {
          load(count)
        }
      }
      fileReader.onerror = e => {
        console.warn('oops, something went wrong.')
        reject(e)
      }
    }
    load(count)
  })
}

/**
 * 根据文件流生成MD5
 * @param file 文件流
 */
export function calcFileMD5(file) {
  return new Promise((resolve, reject) => {
    const spark = new SparkMD5.ArrayBuffer()
    const fileReader = new FileReader()
    const chunkSize = 1024 * 1024 * 5 // 切片大小5M
    let start = 0

    const loadNext = () => {
      const chunk = file.slice(start, start + chunkSize)
      start += chunkSize
      fileReader.readAsArrayBuffer(chunk)
      fileReader.onload = event => {
        spark.append(event.target.result)
        if (start <= file.size) {
          loadNext()
        } else {
          let md5 = spark.end() //最终md5值
          spark.destroy() //释放缓存
          resolve(md5)
        }
      }
      fileReader.onerror = e => {
        console.warn('oops, something went wrong.')
        reject(e)
      }
    }
    loadNext()
  })
}