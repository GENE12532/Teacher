<script setup>
import { computed, ref, onMounted } from 'vue'
import { CalendarRange, Download, Eye, ListTodo, Plus } from 'lucide-vue-next'
import SoloAppShell from '../components/SoloAppShell.vue'
import UiButton from '../components/ui/UiButton.vue'
import UiCard from '../components/ui/UiCard.vue'
import UiDialog from '../components/ui/UiDialog.vue'
import UiProgress from '../components/ui/UiProgress.vue'
import { getPortfolio, createEvent } from '../api/growth'

const appName = '新任教师端'
const pageTitle = '成长档案袋'
const pageSubtitle = '自动汇总课堂实践、反馈与指导意见，并支持持续整理。'
const theme = 'novice'
const navItems = [
  { name: '经验库', path: '/novice/library', icon: '库' },
  { name: '答疑', path: '/novice/qa', icon: '问' },
  { name: '档案', path: '/novice/portfolio', icon: '档' },
]

const levelColors = ['#eef2ff', '#c7d2fe', '#818cf8', '#4f46e5', '#312e81']
const monthLabels = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function isThisWeek(iso) {
  if (!iso) return false
  const d = new Date(iso)
  if (isNaN(d.getTime())) return false
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  return d >= weekAgo
}

const events = ref([])
const feedbacks = ref([])
const monthStats = ref([])
const loading = ref(false)
const previewOpen = ref(false)
const draft = ref('')
const selectedMonth = ref(new Date().getMonth())
const currentStage = ref(1)

const derivedStats = computed(() => {
  const thisWeek = events.value.filter((e) => isThisWeek(e.eventTime)).length
  return [
    { label: '事件总数', value: String(events.value.length) },
    { label: '本周新增', value: String(thisWeek) },
    { label: '名师点评', value: String(feedbacks.value.length) },
  ]
})

const calendarCells = computed(() => {
  const year = new Date().getFullYear()
  const month = selectedMonth.value + 1
  const daysInMonth = new Date(year, month, 0).getDate()
  const dayCounts = new Map()
  events.value.forEach((e) => {
    if (!e.eventTime) return
    const d = new Date(e.eventTime)
    if (isNaN(d.getTime())) return
    if (d.getFullYear() === year && d.getMonth() === selectedMonth.value) {
      const day = d.getDate()
      dayCounts.set(day, (dayCounts.get(day) || 0) + 1)
    }
  })
  return Array.from({ length: 35 }, (_, index) => {
    const day = index + 1
    if (day > daysInMonth) {
      return { key: `day-${day}`, day: '', count: 0, color: levelColors[0] }
    }
    const count = dayCounts.get(day) || 0
    return {
      key: `day-${day}`,
      day,
      count,
      color: levelColors[Math.min(count, levelColors.length - 1)],
    }
  })
})

const yearCalendar = computed(() => {
  const countByMonth = new Map()
  monthStats.value.forEach((m) => {
    if (m?.month) countByMonth.set(m.month, m.count || 0)
  })
  return monthLabels.map((label, monthIndex) => {
    const key = `${new Date().getFullYear()}-${String(monthIndex + 1).padStart(2, '0')}`
    const count = countByMonth.get(key) || 0
    const colorIdx = Math.min(count, levelColors.length - 1)
    const blocks = Array.from({ length: 28 }, (_, blockIndex) => ({
      key: `${label}-${blockIndex}`,
      color: levelColors[colorIdx],
    }))
    return { label, blocks }
  })
})

const achievementWall = computed(() => {
  const lines = ['# 新任教师成长成就墙', '', `- 累计成长事件：${events.value.length}`]
  if (feedbacks.value.length) {
    lines.push('', '## 名师点评')
    feedbacks.value.forEach((f, i) => {
      const date = formatDate(f.createdAt)
      lines.push(`${i + 1}. ${date}｜${f.source || ''}：${f.content || ''}`)
    })
  }
  if (events.value.length) {
    lines.push('', '## 成长事件')
    events.value.forEach((e, i) => {
      const date = formatDate(e.eventTime)
      lines.push(`${i + 1}. ${date}｜${e.title || e.content || ''}`)
    })
  }
  return lines.join('\n')
})

const workflow = computed(() => [
  { id: 1, title: '看热力图', hint: '先看本月分布。' },
  { id: 2, title: '写记录', hint: '补一条成长记录。' },
  { id: 3, title: '导出成就墙', hint: '最后导出。' },
])

const navProgress = computed(() => Math.round((currentStage.value / 3) * 100))

const todoList = computed(() => [
  { id: '1', text: '查看热力图', done: true },
  { id: '2', text: '新增记录', done: events.value.some((e) => e.eventType === 'manual') },
  { id: '3', text: '导出成就墙', done: false },
])

async function loadPortfolio() {
  loading.value = true
  try {
    const portfolio = await getPortfolio()
    events.value = portfolio.events || []
    feedbacks.value = portfolio.feedbacks || []
    monthStats.value = portfolio.monthStats || []
  } catch {
    events.value = []
    feedbacks.value = []
    monthStats.value = []
  } finally {
    loading.value = false
  }
}

async function addItem() {
  if (!draft.value.trim()) return
  try {
    await createEvent({
      eventType: 'manual',
      title: draft.value.trim(),
      content: draft.value.trim(),
    })
    draft.value = ''
    await loadPortfolio()
    currentStage.value = 3
  } catch {
    // error
  }
}

function goStage(id) { currentStage.value = id }

onMounted(() => { loadPortfolio() })
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
      </aside>
    </template>

    <template #right>
      <UiCard class="workspace-panel-card">
        <div class="workspace-panel-head"><strong>档案</strong><span class="header-channel">{{ events.length }} 条</span></div>
        <ul class="workspace-checklist"><li v-for="todo in todoList" :key="todo.id"><span class="workspace-check"></span><span>{{ todo.text }}</span></li></ul>
      </UiCard>
    </template>

    <section class="feature-screen novice-portfolio-calendar-board">
      <section v-if="currentStage === 1" class="editor-card portfolio-calendar-main">
        <div class="panel-headline"><div><p class="hero-kicker">STEP 1</p><h3>{{ monthLabels[selectedMonth] }} 热力图</h3></div></div>
        <div class="portfolio-week-head"><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span><span>日</span></div>
        <p v-if="loading" class="helper-copy">加载中…</p>
        <div v-else class="portfolio-calendar-grid"><article v-for="cell in calendarCells" :key="cell.key" class="portfolio-calendar-cell" :style="{ background: cell.color }"><strong>{{ cell.day }}</strong><small>{{ cell.count }} 条</small></article></div>
        <div class="bottom-action-bar"><UiButton @click="currentStage = 2"><Plus :size="16" /> 下一步</UiButton></div>
      </section>

      <section v-if="currentStage === 2" class="editor-card">
        <div class="panel-headline"><div><p class="hero-kicker">STEP 2</p><h3>新增记录</h3></div></div>
        <textarea v-model="draft" rows="4" placeholder="写一条成长记录…"></textarea>
        <div class="bottom-action-bar"><UiButton @click="addItem"><Plus :size="16" /> 保存</UiButton></div>
      </section>

      <section v-if="currentStage === 3" class="editor-card portfolio-year-card">
        <div class="panel-headline"><div><p class="hero-kicker">STEP 3</p><h3>导出成就墙</h3></div><span class="status-pill"><CalendarRange :size="14" /> 年历</span></div>
        <div class="portfolio-year-list"><article v-for="month in yearCalendar" :key="month.label" class="portfolio-year-row"><strong>{{ month.label }}</strong><div class="portfolio-year-blocks"><span v-for="block in month.blocks" :key="block.key" :style="{ background: block.color }"></span></div></article></div>
        <div class="bottom-action-bar">
          <UiButton variant="secondary" @click="previewOpen = true"><Eye :size="16" /> 预览</UiButton>
          <UiButton as="a" :href="`data:text/plain;charset=utf-8,${encodeURIComponent(achievementWall)}`" download="成长成就墙.txt"><Download :size="16" /> 导出</UiButton>
        </div>
      </section>

      <UiDialog v-model:open="previewOpen" title="成长成就墙预览" description="">
        <div class="preview-paper"><pre>{{ achievementWall }}</pre></div>
      </UiDialog>
    </section>
  </SoloAppShell>
</template>
