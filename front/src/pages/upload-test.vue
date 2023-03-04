<template>
  <div class="upload-test">
    <large-file-upload
      v-model="courseUrl"
      :limit="1"
      listType="picture-card"
    ></large-file-upload>
  </div>
</template>

<script>
/**
* author lxr
* @Date: 2022-03-02 18:01:02
* @description 
*/
import largeFileUpload from '@/components/large-file-upload'
import * as api from '@/api/index'

export default {
  name: 'upload-test',
  components: { largeFileUpload },
  data () {
    return {
      courseUrl: ''
    }
  },
  created () {},
  mounted () {},
  methods: {}
}
</script>

<style lang="scss" scoped>
.upload-test {}
</style>