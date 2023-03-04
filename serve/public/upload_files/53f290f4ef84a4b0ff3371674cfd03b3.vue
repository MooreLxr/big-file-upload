<template>
  <view class="cus-swiper" id="container">
    <!-- @touchstart="touchstart"
    @touchmove="touchmove"
    @touchend="touchend" -->
    <view class="swiper-main" :style="swiperMainStyle">
      <template v-if="resImgArr && resImgArr.length">
        <view
          v-for="(item, i) in resImgArr"
          :key="i"
          :class="['swiper-slide', `${curIndex === i ? 'active' : ''}`]"
          ref="swiper-slide"
          :style="swiperItemStyle(i)"
        >
          <image
            :src="item[imgField]"
            mode="scaleToFill"
            @click.stop="handleClick(item)"
            :style="swiperImgStyle(i)"
          />
        </view>
      </template>
    </view>
    <!-- 箭头 -->
    <view
      class="swiper-arrow arrow-left"
      ref="arrowLeft"
      v-if="resImgArr.length && resImgArr.length > 1"
      @click="handlePrev"
    >
      <view class="arrow" v-if="arrow === 'always'">
        <image
          src="/static/image/left-icon.png"
          mode="scaleToFill"
        />
      </view>
    </view>
    <view
      class="swiper-arrow arrow-right"
      ref="arrowRight"
      v-if="resImgArr.length && resImgArr.length > 1"
      @click="handleNext"
    >
      <view class="arrow" v-if="arrow === 'always'">
        <image
          src="/static/image/right-icon.png"
          mode="scaleToFill"
        />
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'cus-swiper',
  props: {
    imgArr: Array,
    initialIndex: Number, // 默认选中的索引
    imgField: String, // 图片显示的字段
    scale: {
      type: Number,
      default: 0.8
    },
    gap: Number,
    imgWidth: Number,
    // 每次动画的执行时间
    animateTime: {
      type: Number,
      default: 1000
    },
    // 多久轮播一次
    intervalTime: {
      type: Number,
      default: 3000
    },
    // 是否自动轮播
    autoPlay: {
      type: Boolean,
      default: true
    },
    // 箭头显示always  never
    arrow: {
      type: String,
      default: 'always'
    }
  },
  data () {
    return {
      resImgArr: [],
      curIndex: 0,
      diffLen: null, // 中间线
      timer: null,
      startX: null,
      startY: null,
      endX: null,
      endY: null
    }
  },
  mounted() {
	  this.init()
  },
  computed: {
    swiperMainStyle() {
      const { resImgArr, imgWidth, gap, diffLen, curIndex, animateTime } = this
      return {
        width: `${resImgArr.length * (imgWidth + gap/2)}rpx`,
        left: `${-(imgWidth * curIndex + gap - diffLen + 10)}rpx`,
        transition: `left ${animateTime / 1000}s`
      }
    },
    swiperItemStyle() {
      const { imgWidth, gap, scale, curIndex } = this
      return (i) => {
        let transformStyle
        if (i === curIndex) {
          transformStyle = 'scale(1)'
        } else  if (i === curIndex - 1) {
          transformStyle = `scale(${scale}) rotateY(-185deg) translateZ(80rpx)`
        } else if (i === curIndex + 1) {
          transformStyle = `scale(${scale}) rotateY(185deg) translateZ(80rpx)`
        } else {
          transformStyle = `scale(${scale})`
        }
        return {
          width: `${imgWidth}rpx`,
          margin: `0 ${gap}rpx`,
          transform: transformStyle
        }
      }
    },
    swiperImgStyle() {
      const { curIndex } = this
      return (i) => {
        let transformStyle
        if (i === curIndex - 1) {
          transformStyle = `scale(1) rotateY(185deg)`
        } else if (i === curIndex + 1) {
          transformStyle = `scale(1) rotateY(-185deg)`
        } else {
          transformStyle = ``
        }
        return {
          transform: transformStyle
        }
      }
    }
  },
  watch: {
    imgArr: {
      handler() {
        this.init()
      },
      deep: true
    },
    autoPlay(val) {
      if (val) this.handleAutoPlay()
      else this.timer && clearInterval(this.timer)
    }
  },
  methods: {
    init() {
      const { imgArr, initialIndex, imgWidth, gap } = this
      const query = uni.createSelectorQuery().in(this);
      query.select('#container').boundingClientRect(data => {
        const result = JSON.parse(JSON.stringify(data))
        this.diffLen = (result.width - imgWidth - gap) / 3
      }).exec()
      
      if (imgArr.length > 2) {
        this.curIndex = (initialIndex || 0) + 2
        this.resImgArr = [imgArr[imgArr.length - 2], imgArr[imgArr.length - 1], ...imgArr, imgArr[0], imgArr[1]]
      } else {
        this.curIndex = initialIndex || 0
        this.resImgArr = [...imgArr]
      }

      // 设置自动播放
      if (this.autoPlay) this.handleAutoPlay()
    },
    handleNext() {
      const { imgArr, animateTime, curIndex } = this
      if (imgArr.length < 2) return
      if (imgArr.length === 2) {
        this.curIndex = curIndex === 0 ? 1 : 0
      } else {
        this.curIndex++
        if (curIndex === imgArr.length + 1) {
          setTimeout(() => {
            this.curIndex = 2
          }, animateTime)
        }
      }
      this.$emit('change', this.resImgArr[this.curIndex])
    },
    handlePrev() {
      const { imgArr, animateTime, curIndex } = this
      if (imgArr.length < 2) return
      if (imgArr.length === 2) {
        this.curIndex = curIndex === 0 ? 1 : 0
      } else {
        this.curIndex--
        if (curIndex === 1) {
          setTimeout(() => {
            this.curIndex = imgArr.length
          }, animateTime)
        }
      }
      this.$emit('change', this.resImgArr[this.curIndex])
    },
    // 设置默认选中某张
    setActiveItem(val) {
      const { imgArr } = this
      this.curIndex = imgArr.length > 2 ? (val || 0) + 2 : (val || 0)
    },
    touchstart(e) {
      this.timer && clearInterval(this.timer)
      this.startX = e.changedTouches[0].clientX
      this.startY = e.changedTouches[0].clientY
    },
    touchmove(e) {
      this.endX = e.changedTouches[0].clientX
      this.endY = e.changedTouches[0].clientY
    },
    touchend() {
      const {  startX, startY, endX, endY } = this
      const angle = this.angle({ X: startX, Y: startY }, { X: endX, Y: endY })
      if (Math.abs(angle) > 30) return
      if (endX > startX) { // 右滑动
        this.handlePrev()
      } else {
        this.handleNext()
      }
    },
    handleAutoPlay() {
      const intervalTime = (this.animateTime + this.intervalTime) || 2000
      this.timer && clearInterval(this.timer)
      this.timer = setInterval(this.handleNext, intervalTime)
    },
    handleClick(item) {
      this.$emit('item-click', item)
    },
    /**
		* 计算滑动角度
		* @param {Object} start 起点坐标
		* @param {Object} end 终点坐标
		*/
		angle: function (start, end) {
      const _X = end.X - start.X
      const _Y = end.Y - start.Y
      //返回角度 Math.atan()返回数字的反正切值
      return 360 * Math.atan(_Y / _X) / (2 * Math.PI)
		}
  },
  beforeDestroy() {
    this.timer && clearInterval(this.timer)
  }
}
</script>

<style lang="scss" scoped>
.cus-swiper {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  perspective: 300px;
  user-select: none;
  .swiper-arrow {
    position: absolute;
    top: 50%;
		transform: translateY(-50%);
		width: 140rpx;
    height: 132rpx;
    cursor: pointer;
    z-index: 1002;
    display: flex;
    align-items: center;
    .arrow {
      width: 25rpx;
      height: 25rpx;
      border-radius: 50%;
      background-color: rgba(0, 0, 0, 0.4);
      text-align: center;
      image {
        width: 30rpx;
      }
    }
    &.arrow-left {
      left: 10rpx;
    }
    &.arrow-right {
      right: 10rpx;
      justify-content: end;
    }
    &:hover .arrow{
      background-color: rgba(0, 0, 0, 0.6);
    }
  }
  .swiper-main {
    height: 100%;
    position: relative;
    top: 2rpx;
    left: 0;
    transform-style: preserve-3d;
    .swiper-slide {
      height: calc(100% - 4rpx);
      border-radius: 1rpx;
      display: inline-block;
      user-select: none;
      transform-origin: center;
      border: 7rpx solid #3D99FF;
      box-shadow: 0rpx 0rpx 10rpx 0rpx rgba(0,0,0,0.5);
      box-sizing: border-box;
      image {
        width: 100%;
        height: 100%;
      }
      &.active {
        border-radius: 8rpx;
        border: 3rpx solid #95FBFF;
        box-shadow: 0rpx 6rpx 9rpx 4rpx rgba(159,252,255, 0.4);
        image {
          border-radius: 7rpx;
        }
      }
    }
  }
}
</style>
