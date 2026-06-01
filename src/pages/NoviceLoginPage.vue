<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { noviceApp } from '../mock/platformData'
import { useAuthStore } from '../stores/authStore'

const router = useRouter()
const { login, loading } = useAuthStore()

const username = ref('')
const password = ref('')
const loginError = ref('')

const highlights = ['名师经验库', '在线答疑', '成长档案袋']

async function handleLogin() {
  loginError.value = ''
  if (!username.value.trim() || !password.value.trim()) {
    loginError.value = '请输入账号和密码'
    return
  }
  try {
    await login(username.value.trim(), password.value)
    router.push('/novice/library')
  } catch (e) {
    loginError.value = e.message || '登录失败，请重试'
  }
}
</script>

<template>
  <div class="login-shell login-novice">
    <section class="login-layout-panel">
      <div class="login-side login-side-novice">
        <div class="login-side-top">
          <p class="page-eyebrow">新任教师端</p>
          <span class="header-chip subtle">启航型工作流</span>
        </div>
        <h1>帮助新教师更快建立稳定、清晰、可复制的课堂方法。</h1>
        <p>围绕经验学习、在线提问和成长记录，减少新任教师进入课堂后的试错成本，提升上手效率。</p>
        <div class="login-point-list">
          <span v-for="item in highlights" :key="item">{{ item }}</span>
        </div>
      </div>
      <div class="login-card-panel">
        <div class="login-card-clean">
          <p class="login-brand">{{ noviceApp.appName }}</p>
          <h2>{{ noviceApp.login.title }}</h2>
          <p class="login-subtitle">{{ noviceApp.login.subtitle }}</p>
          <form class="login-form-clean" @submit.prevent="handleLogin">
            <input v-model="username" placeholder="请输入账号" autocomplete="username" />
            <input v-model="password" type="password" placeholder="请输入密码" autocomplete="current-password" />
            <p v-if="loginError" class="login-error">{{ loginError }}</p>
            <button type="submit" class="login-button-clean" :disabled="loading">
              {{ loading ? '登录中…' : '进入工作区' }}
            </button>
          </form>
        </div>
      </div>
    </section>
  </div>
</template>
