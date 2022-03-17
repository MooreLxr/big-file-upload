import Vue from 'vue'
import Router from 'vue-router'
Vue.use(Router)

const router = new Router({
  mode: 'history',
  routes: [
    {
      path: '/',
      redirect: '/upload-test'
    },
    {
      path: '/upload-test',
      name: 'uploadTest',
      component: () => import(/* webpackInclude: /\.(js|vue)$/ */`../pages/upload-test.vue`)
    }
  ]
})

export default router