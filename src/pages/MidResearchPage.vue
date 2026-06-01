<script setup>
import { computed, ref, watch } from 'vue'
import { BookPlus, CheckCircle2, FileBadge2, Files, ListTodo, LockKeyhole, Search, Send, Telescope } from 'lucide-vue-next'
import SoloAppShell from '../components/SoloAppShell.vue'
import UiButton from '../components/ui/UiButton.vue'
import UiCard from '../components/ui/UiCard.vue'
import UiDialog from '../components/ui/UiDialog.vue'
import UiProgress from '../components/ui/UiProgress.vue'
import { listResources } from '../api/resource'
import { recommendTopic, listTopics, saveTopic } from '../api/research'
import { listExperts, createAppointment } from '../api/expert'

const appName = '骨干教师端'
const pageTitle = '课题研究导航'
const pageSubtitle = '基于教学表现生成结构化课题建议，并维护研究清单。'
const theme = 'mid'
const navItems = [
  { name: '诊断', path: '/mid/diagnosis', icon: '诊' },
  { name: '助教', path: '/mid/avatar', icon: '助' },
  { name: '研究', path: '/mid/research', icon: '研' },
]

const categoryList = ['全部', '语文', '数学', '综合实践', '科学']

const docLibrary = ref([])
const topicLibrary = ref([])
const experts = ref([])
const loadingDocs = ref(false)

const selectedDocIds = ref(new Set())
const selectedTopic = ref({ title: '', meta: '', extra: '', sources: [], applicationDraft: '', transformed: false, createdAt: '' })
const keyword = ref('')
const category = ref('全部')
const dataAuthorized = ref(false)
const activeTopicId = ref(null)
const currentStage = ref(1)
const expertOpen = ref(false)

const derivedStats = computed(() => [
  { label: '在研课题', value: String(topicLibrary.value.length) },
  { label: '本周推荐', value: '—' },
  { label: '专家建议', value: '—' },
])

const filteredDocs = computed(() => {
  const value = keyword.value.trim()
  return docLibrary.value.filter((item) => {
    const matchCategory = category.value === '全部' || item.subject === category.value
    const matchKeyword = !value || `${item.title}${item.subject}${item.grade}${item.school || ''}${item.summary || ''}`.includes(value)
    return matchCategory && matchKeyword
  })
})

const selectedDocs = computed(() => docLibrary.value.filter((item) => selectedDocIds.value.has(item.id)))

const activeTopic = computed(() => topicLibrary.value.find((item) => item.id === activeTopicId.value) ?? null)

const navProgress = computed(() => Math.round((currentStage.value / 4) * 100))

const workflow = computed(() => [
  { id: 1, title: '授权数据', hint: '先开启案例授权。' },
  { id: 2, title: '选教案', hint: '从文档库选择来源。' },
  { id: 3, title: '建课题', hint: '生成建议并创建课题。' },
  { id: 4, title: '我的课题库', hint: '随时打开查看。' },
])

const todoList = computed(() => [
  { id: '1', text: '完成案例授权', done: dataAuthorized.value },
  { id: '2', text: '选择教案来源', done: selectedDocIds.value.size > 0 },
  { id: '3', text: '创建课题', done: topicLibrary.value.length > 0 },
])

const recommendationState = computed(() => dataAuthorized.value ? '已生成结构化推荐' : '等待授权')

const topicSummary = computed(() => {
  const sourceList = selectedTopic.value.sources?.length
    ? selectedTopic.value.sources.map((s) => `- ${s}`).join('\n')
    : '- 暂未选择'
  return `${selectedTopic.value.title}\n\n${selectedTopic.value.meta}\n\n${selectedTopic.value.extra}\n\n来源教案：\n${sourceList}`
})

const topicSourcesStr = computed(() =>
  Array.isArray(selectedTopic.value.sources) ? selectedTopic.value.sources.join(', ') : selectedTopic.value.sources,
)

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

async function loadDocLibrary() {
  loadingDocs.value = true
  try {
    const params = { resourceType: 'lesson' }
    if (category.value !== '全部') params.subject = category.value
    const list = await listResources(params)
    docLibrary.value = list.map((r) => ({
      ...r,
      selected: selectedDocIds.value.has(r.id),
    }))
  } catch {
    // keep empty library
  } finally {
    loadingDocs.value = false
  }
}

async function loadTopics() {
  try {
    const list = await listTopics()
    topicLibrary.value = list.map((t) => ({
      ...t,
      sources: t.sources ? t.sources.split(',') : [],
    }))
    if (topicLibrary.value.length > 0 && !activeTopicId.value) {
      activeTopicId.value = topicLibrary.value[0].id
    }
  } catch {
    // keep empty
  }
}

async function loadExperts() {
  try {
    experts.value = await listExperts()
  } catch {
    // keep empty
  }
}

watch(category, () => {
  if (dataAuthorized.value) loadDocLibrary()
})

function goStage(id) { currentStage.value = id }

function authorizeCases() {
  dataAuthorized.value = true
  loadDocLibrary()
  loadTopics()
  loadExperts()
  currentStage.value = 2
}

function toggleDoc(item) {
  if (selectedDocIds.value.has(item.id)) {
    selectedDocIds.value.delete(item.id)
  } else {
    selectedDocIds.value.add(item.id)
  }
  selectedDocIds.value = new Set(selectedDocIds.value)
}

async function buildRecommendation() {
  const sources = selectedDocs.value
  const sourceTitles = sources.map((item) => item.title)
  currentStage.value = 3
  try {
    const result = await recommendTopic({
      teacherGoal: keyword.value || undefined,
      sources: sourceTitles,
    })
    let rec = {}
    try {
      rec = JSON.parse(result.recommendationJson || '{}')
    } catch { /* use empty */ }
    selectedTopic.value = {
      title: rec.title || `基于 ${sources.length} 篇教案的乡村课堂研究课题`,
      meta: rec.meta || `推荐依据：系统分析后识别出高频研究主题。`,
      extra: rec.extra || '',
      sources: rec.sources || sourceTitles,
      applicationDraft: rec.applicationDraft || '',
      transformed: false,
      createdAt: '',
    }
    if (result.savedTopic) {
      topicLibrary.value.unshift({
        ...result.savedTopic,
        sources: result.savedTopic.sources ? result.savedTopic.sources.split(',') : [],
      })
    }
  } catch {
    selectedTopic.value = {
      title: `基于 ${sources.length} 篇教案的乡村课堂研究课题`,
      meta: `推荐依据：系统分析后识别出高频研究主题。`,
      extra: '',
      sources: sourceTitles,
      applicationDraft: '',
      transformed: false,
      createdAt: '',
    }
  }
}

async function saveTopicToServer() {
  try {
    const saved = await saveTopic({
      title: selectedTopic.value.title,
      meta: selectedTopic.value.meta,
      extra: selectedTopic.value.extra,
      sources: Array.isArray(selectedTopic.value.sources)
        ? selectedTopic.value.sources.join(',')
        : selectedTopic.value.sources,
      applicationDraft: selectedTopic.value.applicationDraft || '',
    })
    topicLibrary.value.unshift({
      ...saved,
      sources: saved.sources ? saved.sources.split(',') : [],
    })
    activeTopicId.value = saved.id
    selectedTopic.value.createdAt = saved.createdAt
    currentStage.value = 4
  } catch {
    // error handled in UI
  }
}

function openTopic(item) {
  activeTopicId.value = item.id
  selectedTopic.value = {
    ...item,
    sources: Array.isArray(item.sources) ? item.sources : (item.sources ? item.sources.split(',') : []),
    transformed: false,
  }
  currentStage.value = 4
}

function transformResult() {
  selectedTopic.value = { ...selectedTopic.value, transformed: true }
  const index = topicLibrary.value.findIndex((item) => item.id === activeTopicId.value)
  if (index >= 0) {
    topicLibrary.value[index] = { ...topicLibrary.value[index], transformed: true }
  }
}

async function consultExpert() {
  if (!activeTopicId.value || !experts.value.length) {
    expertOpen.value = true
    return
  }
  try {
    await createAppointment({
      expertId: experts.value[0].id,
      topicId: activeTopicId.value,
      title: selectedTopic.value.title,
      question: selectedTopic.value.meta,
    })
  } catch {
    // keep going, show preview anyway
  }
  expertOpen.value = true
}
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
        <div class="workspace-panel-head"><strong>我的课题库</strong><span class="header-channel">{{ topicLibrary.length }} 项</span></div>
        <div class="card-list">
          <article v-for="item in topicLibrary.slice(0, 4)" :key="item.id" class="history-row" :class="{ active: activeTopicId === item.id }" @click="openTopic(item)">
            <strong>{{ item.title }}</strong><small>{{ formatDate(item.createdAt) }}</small>
          </article>
        </div>
      </UiCard>
    </template>

    <section class="feature-screen mid-ops-board mid-research-archive-board">
      <section v-if="currentStage === 1" class="editor-card">
        <div class="panel-headline"><div><p class="hero-kicker">STEP 1</p><h3>先授权教学案例数据</h3></div><span class="status-pill"><Telescope :size="14" /> {{ recommendationState }}</span></div>
        <div class="bottom-action-bar"><UiButton @click="authorizeCases"><LockKeyhole :size="16" /> 授权案例数据</UiButton></div>
      </section>

      <section v-if="currentStage === 2" class="editor-card">
        <div class="panel-headline"><div><p class="hero-kicker">STEP 2</p><h3>选择教案来源</h3></div><label class="old-library-search"><Search :size="15" /><input v-model="keyword" placeholder="搜索教案标题 / 学校 / 年级" /></label></div>
        <div class="old-library-tags">
          <button v-for="item in categoryList" :key="item" type="button" class="old-library-tag" :class="{ active: category === item }" @click="category = item">{{ item }}</button>
        </div>
        <p v-if="loadingDocs" class="helper-copy">加载中…</p>
        <div class="old-library-grid">
          <article v-for="item in filteredDocs" :key="item.id" class="old-doc-card" :class="{ active: selectedDocIds.has(item.id) }" @click="toggleDoc(item)">
            <div class="old-doc-cover">教案</div>
            <div class="old-doc-body"><strong>{{ item.title }}</strong><p>{{ item.summary }}</p><small>{{ item.subject }} ｜ {{ item.grade }} ｜ {{ item.school || '未知学校' }}</small></div>
          </article>
          <p v-if="!loadingDocs && !filteredDocs.length" class="helper-copy">暂无教案资源。</p>
        </div>
        <div class="bottom-action-bar"><UiButton @click="buildRecommendation" :disabled="!selectedDocIds.size"><Files :size="16" /> 下一步</UiButton></div>
      </section>

      <section v-if="currentStage === 3" class="editor-card research-topic-editor-box">
        <div class="panel-headline"><div><p class="hero-kicker">STEP 3</p><h3>创建课题</h3></div></div>
        <div class="selected-source-list">
          <article v-for="item in selectedDocs" :key="item.id" class="selected-source-row"><strong>{{ item.title }}</strong><small>{{ item.subject }} · {{ item.grade }}</small></article>
          <article v-if="!selectedDocs.length" class="selected-source-row"><strong>未选择教案</strong></article>
        </div>
        <input v-model="selectedTopic.title" placeholder="请输入研究选题" />
        <textarea v-model="selectedTopic.meta" rows="4"></textarea>
        <textarea v-model="selectedTopic.extra" rows="5"></textarea>
        <div class="preview-paper old-library-preview"><pre>{{ topicSummary }}</pre></div>
        <div class="bottom-action-bar">
          <UiButton variant="secondary" @click="consultExpert"><Send :size="16" /> 咨询专家</UiButton>
          <UiButton variant="secondary" @click="transformResult"><BookPlus :size="16" /> 成果转化</UiButton>
          <UiButton @click="saveTopicToServer"><FileBadge2 :size="16" /> 创建课题</UiButton>
        </div>
      </section>

      <section v-if="currentStage === 4" class="editor-card">
        <div class="panel-headline"><div><p class="hero-kicker">STEP 4</p><h3>我的课题库</h3></div></div>
        <div class="my-topic-list">
          <article v-for="item in topicLibrary" :key="item.id" class="my-topic-row" :class="{ active: activeTopicId === item.id }" @click="openTopic(item)">
            <strong>{{ item.title }}</strong><small>{{ formatDate(item.createdAt) }}</small>
          </article>
          <article v-if="!topicLibrary.length" class="my-topic-row"><strong>暂无课题</strong></article>
        </div>
      </section>

      <UiDialog v-model:open="expertOpen" title="专家咨询草稿" description="">
        <div class="preview-paper old-library-preview"><pre>{{ topicSummary }}</pre></div>
      </UiDialog>
    </section>
  </SoloAppShell>
</template>
