<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { midApp } from '../mock/platformData'
import { useAuthStore } from '../stores/authStore'

const router = useRouter()
const { login, loading } = useAuthStore()

const username = ref('')
const password = ref('')
const loginError = ref('')

const highlights = ['错题诊断', '数字助教', '课题研究导航']

async function handleLogin() {
  loginError.value = ''
  if (!username.value.trim() || !password.value.trim()) {
    loginError.value = '请输入账号和密码'
    return
  }
  try {
    await login(username.value.trim(), password.value)
    router.push('/mid/diagnosis')
  } catch (e) {
    loginError.value = e.message || '登录失败，请重试'
  }
}
</script>

<template>
  <div class="login-shell login-mid">
    <section class="login-layout-panel">
      <div class="login-side login-side-mid">
        <div class="login-side-top">
          <p class="page-eyebrow">骨干教师端</p>
          <span class="header-chip subtle">提升型工作流</span>
        </div>
        <h1>围绕课堂改进、互动支持和研究提升，形成更完整的教学闭环。</h1>
        <p>适合承担校本教研与课堂优化任务的教师，帮助分析学情、增强课堂互动并推进研究成果落地。</p>
        <div class="login-point-list">
          <span v-for="item in highlights" :key="item">{{ item }}</span>
        </div>
      </div>
      <div class="login-card-panel">
        <div class="login-card-clean">
          <p class="login-brand">{{ midApp.appName }}</p>
          <h2>{{ midApp.login.title }}</h2>
          <p class="login-subtitle">{{ midApp.login.subtitle }}</p>
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
