<script setup>
import { computed, ref, onMounted } from 'vue'
import { CheckCircle2, Image as ImageIcon, ListTodo, Send, UserRoundPlus } from 'lucide-vue-next'
import SoloAppShell from '../components/SoloAppShell.vue'
import UiButton from '../components/ui/UiButton.vue'
import UiCard from '../components/ui/UiCard.vue'
import UiDialog from '../components/ui/UiDialog.vue'
import UiProgress from '../components/ui/UiProgress.vue'
import { useAuthStore } from '../stores/authStore'
import { listQuestions, createQuestion, forwardQuestion } from '../api/qa'

const { user: currentUser } = useAuthStore()

const appName = '新任教师端'
const pageTitle = '在线答疑'
const pageSubtitle = '围绕真实课堂问题，发起提问、编辑记录并追踪处理状态。'
const theme = 'novice'
const navItems = [
  { name: '经验库', path: '/novice/library', icon: '库' },
  { name: '答疑', path: '/novice/qa', icon: '问' },
  { name: '档案', path: '/novice/portfolio', icon: '档' },
]

function resolveName(userId, role) {
  if (userId === 0) return role || '系统'
  if (userId === currentUser.value?.id) return currentUser.value?.nickname || '我'
  return role || `用户${userId}`
}

function formatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  if (isToday) return `今天 ${hh}:${mm}`
  return `${d.getMonth() + 1}-${String(d.getDate()).padStart(2, '0')} ${hh}:${mm}`
}

function statusText(status) {
  if (status === 'answered') return '已回复'
  if (status === 'forwarded') return '已转发'
  return '待回复'
}

function mapQuestion(q) {
  return {
    id: q.id,
    userId: q.userId,
    from: resolveName(q.userId, null),
    role: statusText(q.status),
    text: q.content,
    time: formatTime(q.createdAt),
    topic: q.topic || '课堂表达',
    comments: (q.replies || []).map((r) => ({
      id: r.id,
      userId: r.userId,
      from: resolveName(r.userId, r.role),
      text: r.content,
      role: r.role || '',
    })),
  }
}

const records = ref([])
const draft = ref('')
const loading = ref(false)
const mentorOpen = ref(false)
const currentStage = ref(1)

const derivedStats = computed(() => {
  const total = records.value.length
  const answered = records.value.filter((r) => r.role === '已回复').length
  return [
    { label: '待处理提问', value: String(total - answered) },
    { label: '已获得答复', value: String(answered) },
    { label: '本周互动', value: String(total) },
  ]
})

const workflow = computed(() => [
  { id: 1, title: '发动态', hint: '先写课堂问题。' },
  { id: 2, title: '看回复', hint: '看社区答疑。' },
  { id: 3, title: '转给名师', hint: '需要时再发给专家。' },
])

const navProgress = computed(() => Math.round((currentStage.value / 3) * 100))

const todoList = computed(() => [
  { id: '1', text: '写下问题', done: !!draft.value.trim() },
  { id: '2', text: '发布动态', done: records.value.some((r) => r.userId === currentUser.value?.id) },
  { id: '3', text: '查看回复', done: currentStage.value >= 2 },
])

async function loadQuestions() {
  loading.value = true
  try {
    const list = await listQuestions()
    records.value = list.map(mapQuestion)
  } catch {
    // keep empty
  } finally {
    loading.value = false
  }
}

async function submitQuestion() {
  if (!draft.value.trim()) return
  try {
    await createQuestion({ content: draft.value.trim() })
    draft.value = ''
    await loadQuestions()
    currentStage.value = 2
  } catch {
    // error
  }
}

async function forwardToMentor() {
  // Find the current user's first open question to forward
  const ownQuestion = records.value.find(
    (r) => r.userId === currentUser.value?.id && r.role === '待回复',
  )
  if (ownQuestion) {
    try {
      await forwardQuestion(ownQuestion.id)
      await loadQuestions()
    } catch {
      // error
    }
  }
  mentorOpen.value = true
  currentStage.value = 3
}

function goStage(id) { currentStage.value = id }

onMounted(() => { loadQuestions() })
</script>

<template>
  <SoloAppShell :app-name="appName" :title="pageTitle" subtitle="" :stats="derivedStats" :nav-items="navItems" :theme="theme">
    <template #left>
      <aside class="lesson-bookmark-sidebar">
        <div class="bookmark-card">
          <div class="bookmark-head"><ListTodo :size="16" /><strong>使用顺序</strong></div>
          <div class="bookmark-progress"><UiProgress :value="navProgress" label="当前步骤" /></div>
          <button v-for="item in workflow" :key="item.id" type="button" class="bookmark-item" :class="{ active: currentStage === item.id }" @click="goStage(item.id)">
            <span class="bookmark-index">{{ item.id }}</span>
            <div><strong>{{ item.title }}</strong><p>{{ item.hint }}</p></div>
          </button>
        </div>
        <div class="bookmark-card">
          <div class="bookmark-head"><CheckCircle2 :size="16" /><strong>工作清单</strong></div>
          <article v-for="todo in todoList" :key="todo.id" class="todo-row" :class="{ done: todo.done }"><span class="todo-dot"></span><p>{{ todo.text }}</p></article>
        </div>
      </aside>
    </template>

    <template #right>
      <UiCard class="workspace-panel-card">
        <div class="workspace-panel-head"><strong>社区记录</strong><span class="header-channel">{{ records.length }} 条</span></div>
        <ul class="workspace-checklist"><li><span class="workspace-check"></span><span>先发动态，再看回复</span></li></ul>
      </UiCard>
    </template>

    <section class="feature-screen novice-community-feed">
      <section v-if="currentStage === 1" class="editor-card community-compose-card">
        <div class="panel-headline"><div><p class="hero-kicker">STEP 1</p><h3>发动态</h3></div></div>
        <div class="community-compose-actions">
          <button class="community-inline-action"><ImageIcon :size="16" /> 配图</button>
          <button class="community-inline-action" @click="forwardToMentor"><UserRoundPlus :size="16" /> @名师</button>
        </div>
        <textarea v-model="draft" rows="5" placeholder="描述你在课堂上遇到的具体问题…"></textarea>
        <div class="bottom-action-bar"><UiButton @click="submitQuestion"><Send :size="16" /> 发布</UiButton></div>
      </section>

      <section v-if="currentStage === 2" class="editor-card">
        <div class="panel-headline"><div><p class="hero-kicker">STEP 2</p><h3>看回复</h3></div></div>
        <p v-if="loading" class="helper-copy">加载中…</p>
        <div v-else class="community-post-list">
          <article v-for="item in records" :key="item.id" class="community-post-card">
            <div class="community-post-head"><div class="community-avatar alt">{{ item.from.slice(0, 1) }}</div><div class="community-post-meta"><strong>{{ item.from }}</strong><small>{{ item.time }} · {{ item.role }}</small></div></div>
            <div class="community-post-copy"><span class="community-topic-tag"># {{ item.topic }}</span><p>{{ item.text }}</p></div>
            <div class="community-comment-box">
              <article v-for="reply in item.comments" :key="reply.id" class="community-comment-item"><strong>{{ reply.from }}</strong><p>{{ reply.text }}</p></article>
              <p v-if="!item.comments.length" class="helper-copy">暂无回复</p>
            </div>
          </article>
          <p v-if="!records.length" class="helper-copy">暂无问题，请先发布一条。</p>
        </div>
        <div class="bottom-action-bar"><UiButton variant="secondary" @click="forwardToMentor"><UserRoundPlus :size="16" /> 下一步</UiButton></div>
      </section>

      <section v-if="currentStage === 3" class="editor-card">
        <div class="panel-headline"><div><p class="hero-kicker">STEP 3</p><h3>转给名师</h3></div></div>
        <div class="bottom-action-bar"><UiButton @click="mentorOpen = true"><UserRoundPlus :size="16" /> 打开预览</UiButton></div>
      </section>

      <UiDialog v-model:open="mentorOpen" title="名师转发预览" description="">
        <div class="preview-paper"><p><strong>待转发：</strong>{{ draft || '当前输入框为空' }}</p></div>
      </UiDialog>
    </section>
  </SoloAppShell>
</template>
