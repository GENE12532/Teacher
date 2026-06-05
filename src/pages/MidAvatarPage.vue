<script setup>
import { computed, ref, nextTick } from 'vue'
import { Bot, Send, Sparkles, Trash2 } from 'lucide-vue-next'
import SoloAppShell from '../components/SoloAppShell.vue'

const appName = '骨干教师端'
const pageTitle = '智能数字人'
const theme = 'mid'
const navItems = [
  { name: '诊断', path: '/mid/diagnosis', icon: '诊' },
  { name: '助教', path: '/mid/avatar', icon: '助' },
  { name: '研究', path: '/mid/research', icon: '研' },
]

/* ==================== 数字人状态 ==================== */
const avatarStatus = ref('idle')
const statusList = [
  { key: 'idle', label: '待机中' },
  { key: 'speaking', label: '讲解中' },
  { key: 'thinking', label: '思考中' },
]

/* ==================== 教学风格 ==================== */
const activeStyle = ref('启发式教学')
const styles = ['启发式教学', '故事化教学', '互动教学', '考试冲刺']

/* ==================== 教学案例 ==================== */
const teachingCases = [
  { title: '线段与射线', desc: '直线、线段与射线的区别与联系', prompt: '请帮我设计一个关于线段与射线的课堂讲解方案。' },
  { title: '分数概念教学', desc: '分数的意义与基本性质', prompt: '如何向学生讲解分数的概念？请设计一个互动教学方案。' },
  { title: '勾股定理讲解', desc: '勾股定理的证明与应用', prompt: '请帮我设计勾股定理的课堂讲解，包含证明演示和生活实例。' },
  { title: '课堂互动设计', desc: '有效课堂提问与互动策略', prompt: '如何在数学课堂中设计有效的师生互动环节？' },
]

/* ==================== 对话区域 ==================== */
const inputText = ref('')
const messages = ref([])
const messagesRef = ref(null)
const sending = ref(false)

const derivedStats = computed(() => [
  { label: '教学风格', value: activeStyle.value.slice(0, 4) },
  { label: '互动次数', value: String(messages.value.filter((m) => m.role === 'user').length) },
  { label: '数字人状态', value: statusList.find((s) => s.key === avatarStatus.value)?.label ?? '—' },
])

/* ==================== 交互方法（预留接口） ==================== */
function selectCase(item) {
  inputText.value = item.prompt
}

async function handleSend() {
  const text = inputText.value.trim()
  if (!text || sending.value) return

  messages.value.push({ role: 'user', content: text, time: Date.now() })
  inputText.value = ''
  sending.value = true
  avatarStatus.value = 'thinking'

  /* chatApi() 预留调用位置 —— 后续接入 AI */
  try {
    // const reply = await chatApi({ prompt: text, style: activeStyle.value })
    // messages.value.push({ role: 'ai', content: reply, time: Date.now() })
    // avatarStatus.value = 'speaking'

    /* 占位模拟回复 */
    await new Promise((r) => setTimeout(r, 600))
    messages.value.push({
      role: 'ai',
      content: `【${activeStyle.value}模式】已收到您的教学问题。后续接入 AI 服务后，此处将展示智能讲解建议。当前为占位回复，您可以继续输入其他教学问题。`,
      time: Date.now(),
    })
    avatarStatus.value = 'speaking'
    setTimeout(() => { avatarStatus.value = 'idle' }, 2000)
  } catch {
    avatarStatus.value = 'idle'
  } finally {
    sending.value = false
    await nextTick()
    scrollToBottom()
  }
}

function clearChat() {
  messages.value = []
  avatarStatus.value = 'idle'
}

function scrollToBottom() {
  const el = messagesRef.value
  if (el) el.scrollTop = el.scrollHeight
}

/**
 * chatApi() —— 预留 AI 接口
 * 后续接入时，替换为真实 API 调用即可
 */
// async function chatApi({ prompt, style }) {
//   return client.post('/avatar/chat', { prompt, style })
// }
</script>

<template>
  <SoloAppShell
    :app-name="appName"
    :title="pageTitle"
    subtitle="课堂讲解助手"
    :stats="derivedStats"
    :nav-items="navItems"
    :theme="theme"
    :hide-main-header="true"
  >
    <div class="avatar-workspace">
      <!-- ========== 左侧 40%：数字教师展示区 ========== -->
      <aside class="avatar-left">
        <!-- 数字人舞台卡片 -->
        <div class="editor-card avatar-showcase-card">
          <div class="panel-headline">
            <div>
              <p class="hero-kicker">数字教师</p>
              <h3>课堂讲解助手</h3>
            </div>
            <span class="status-pill">
              <Sparkles :size="14" />
              {{ statusList.find((s) => s.key === avatarStatus)?.label }}
            </span>
          </div>

          <!-- 数字人舞台预留区域 -->
          <div class="avatar-stage" :class="`avatar-status-${avatarStatus}`">
            <div class="avatar-stage-inner">
              <div class="avatar-placeholder-icon">
                <Bot :size="48" />
              </div>
              <p class="avatar-placeholder-text">数字人形象区域</p>
              <p class="avatar-placeholder-hint">后续接入 Live2D / 视频 / 3D 数字人</p>
            </div>
          </div>

          <!-- 数字人状态指示 -->
          <div class="avatar-status-bar">
            <button
              v-for="item in statusList"
              :key="item.key"
              class="choice-btn status-btn"
              :class="{ active: avatarStatus === item.key }"
              @click="avatarStatus = item.key"
            >
              {{ item.label }}
            </button>
          </div>
        </div>

        <!-- 教学风格卡片 -->
        <div class="editor-card teaching-style-card">
          <div class="panel-headline">
            <div>
              <p class="hero-kicker">教学风格</p>
              <h3>选择讲解方式</h3>
            </div>
          </div>
          <div class="style-grid">
            <button
              v-for="s in styles"
              :key="s"
              class="choice-btn style-item-btn"
              :class="{ active: activeStyle === s }"
              @click="activeStyle = s"
            >
              <Sparkles v-if="activeStyle === s" :size="14" />
              {{ s }}
            </button>
          </div>
        </div>
      </aside>

      <!-- ========== 右侧 60%：教学助手工作区 ========== -->
      <main class="avatar-right">
        <!-- 标题区域 -->
        <div class="editor-card right-title-card">
          <div class="panel-headline">
            <div>
              <p class="hero-kicker">AI 教学助手</p>
              <h3>输入教学问题获取课堂讲解建议</h3>
            </div>
          </div>
        </div>

        <!-- 教学案例网格 -->
        <div class="cases-grid">
          <button
            v-for="item in teachingCases"
            :key="item.title"
            class="editor-card case-card"
            @click="selectCase(item)"
          >
            <strong>{{ item.title }}</strong>
            <small>{{ item.desc }}</small>
            <span class="case-arrow">点击使用 →</span>
          </button>
        </div>

        <!-- 对话展示区域 -->
        <div class="editor-card chat-card">
          <div ref="messagesRef" class="chat-messages">
            <!-- 空状态 -->
            <div v-if="!messages.length" class="chat-empty">
              <div class="chat-empty-icon">
                <Bot :size="32" />
              </div>
              <p>输入教学问题，AI 教学助手将为你提供讲解建议</p>
              <small>可点击上方教学案例快速填充问题</small>
            </div>

            <!-- 消息列表 -->
            <div
              v-for="(msg, i) in messages"
              :key="i"
              class="chat-message"
              :class="`msg-${msg.role}`"
            >
              <div class="msg-avatar">
                {{ msg.role === 'user' ? '师' : 'AI' }}
              </div>
              <div class="msg-body">
                <div class="msg-bubble">{{ msg.content }}</div>
              </div>
            </div>

            <!-- 发送中指示 -->
            <div v-if="sending" class="chat-message msg-ai">
              <div class="msg-avatar">AI</div>
              <div class="msg-body">
                <div class="msg-bubble msg-typing">
                  <span class="typing-dot"></span>
                  <span class="typing-dot"></span>
                  <span class="typing-dot"></span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 底部输入区 -->
        <div class="editor-card input-card">
          <textarea
            v-model="inputText"
            class="chat-input"
            placeholder="输入教学问题，如：请帮我设计一个关于分数概念教学的互动方案..."
            rows="3"
            @keydown.enter.exact.prevent="handleSend"
          ></textarea>
          <div class="bottom-action-bar">
            <button class="choice-btn" @click="clearChat" :disabled="!messages.length">
              <Trash2 :size="14" />
              清空对话
            </button>
            <button
              class="screen-primary"
              @click="handleSend"
              :disabled="!inputText.trim() || sending"
            >
              <Send :size="14" />
              发送
            </button>
          </div>
        </div>
      </main>
    </div>
  </SoloAppShell>
</template>

<style scoped>
/* ═══════════════════════════════════════════════
   智能数字人页面 —— 与系统原生风格完全一致
   色彩 / 圆角 / 阴影 / 字体 全部沿用 :root 变量
   ═══════════════════════════════════════════════ */

/* ── 整体布局：左右 40/60 ── */
.avatar-workspace {
  display: grid;
  grid-template-columns: 40% 60%;
  gap: 24px;
  height: calc(100svh - 56px - 56px); /* 减去顶部导航 + 底部移动端导航 */
  min-height: 680px;
}

.avatar-left,
.avatar-right {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
}

/* ═══════════════ 左侧：数字教师展示区 ═══════════════ */

.avatar-showcase-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
}

/* ── 数字人舞台 ── */
.avatar-stage {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: linear-gradient(160deg, #FDF8F0 0%, #FAF3E8 50%, #F8EFE0 100%);
  border: 2px dashed var(--border);
  min-height: 300px;
  transition: border-color .3s, background .3s;
}

.avatar-stage.avatar-status-speaking {
  border-color: var(--primary);
  background: linear-gradient(160deg, #FFF8F0 0%, #FFF4E6 50%, #FFEFDB 100%);
}

.avatar-stage.avatar-status-thinking {
  border-color: var(--gold);
  background: linear-gradient(160deg, #FFFCF5 0%, #FFF9ED 50%, #FFF6E0 100%);
}

.avatar-stage-inner {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 24px;
}

.avatar-placeholder-icon {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  background: linear-gradient(135deg, #FFF4E0 0%, #FFEDD0 100%);
  border: 2px solid var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary);
  box-shadow: 0 4px 16px rgba(227, 146, 92, 0.15);
}

.avatar-placeholder-text {
  color: var(--text);
  font-size: .95rem;
  font-weight: 600;
  margin: 0;
}

.avatar-placeholder-hint {
  color: var(--text-faint);
  font-size: .78rem;
  margin: 0;
}

/* ── 数字人状态切换条 ── */
.avatar-status-bar {
  display: flex;
  gap: 8px;
  padding-top: 4px;
}

.status-btn {
  flex: 1;
  font-size: .82rem;
  min-height: 36px;
  padding: 0 8px;
}

/* ── 教学风格卡片 ── */
.teaching-style-card {
  flex-shrink: 0;
}

.style-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.style-item-btn {
  font-size: .84rem;
  min-height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

/* ═══════════════ 右侧：教学助手工作区 ═══════════════ */

.avatar-right {
  min-height: 0;
}

.right-title-card {
  flex-shrink: 0;
}

/* ── 教学案例网格 ── */
.cases-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  flex-shrink: 0;
}

.case-card {
  padding: 16px;
  cursor: pointer;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 6px;
  border: 1.5px solid var(--border);
  background: var(--surface);
  border-radius: 10px;
  transition: all .2s;
  font: inherit;
  color: var(--text);
}

.case-card:hover {
  border-color: var(--gold);
  box-shadow: 0 4px 16px rgba(180, 140, 80, 0.12);
  transform: translateY(-1px);
}

.case-card strong {
  font-size: .92rem;
}

.case-card small {
  color: var(--text-soft);
  font-size: .8rem;
  line-height: 1.5;
}

.case-arrow {
  color: var(--primary-strong);
  font-size: .75rem;
  font-weight: 500;
}

/* ── 对话区域 ── */
.chat-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  padding: 16px;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 200px;
  padding-right: 4px;
}

.chat-messages::-webkit-scrollbar {
  width: 5px;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: var(--border-strong);
  border-radius: 3px;
}

/* ── 空状态 ── */
.chat-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 10px;
  padding: 48px 24px;
}

.chat-empty-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--surface-strong);
  border: 1.5px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-faint);
  margin-bottom: 8px;
}

.chat-empty p {
  color: var(--text-soft);
  font-size: .9rem;
  margin: 0;
}

.chat-empty small {
  color: var(--text-faint);
  font-size: .78rem;
}

/* ── 消息项 ── */
.chat-message {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.msg-avatar {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: .75rem;
  font-weight: 600;
  flex-shrink: 0;
}

.msg-user .msg-avatar {
  background: linear-gradient(135deg, var(--primary), var(--primary-strong));
  color: #fff;
}

.msg-ai .msg-avatar {
  background: linear-gradient(135deg, var(--accent), #7FAE4E);
  color: #fff;
}

.msg-body {
  flex: 1;
  min-width: 0;
}

.msg-bubble {
  background: var(--surface-strong);
  border: 1.5px solid var(--border);
  border-radius: 10px;
  padding: 12px 16px;
  font-size: .9rem;
  line-height: 1.75;
  color: var(--text);
  white-space: pre-wrap;
  word-break: break-word;
}

.msg-user .msg-bubble {
  background: linear-gradient(135deg, #FFF8F0, #FFF4E6);
  border-color: rgba(227, 146, 92, 0.2);
}

/* ── 输入中动画 ── */
.msg-typing {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 14px 20px;
}

.typing-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--text-faint);
  animation: typingBounce 1.2s ease-in-out infinite;
}

.typing-dot:nth-child(2) {
  animation-delay: .15s;
}

.typing-dot:nth-child(3) {
  animation-delay: .3s;
}

@keyframes typingBounce {
  0%, 60%, 100% { transform: translateY(0); opacity: .4; }
  30% { transform: translateY(-6px); opacity: 1; }
}

/* ── 底部输入区 ── */
.input-card {
  flex-shrink: 0;
}

.chat-input {
  width: 100%;
  padding: 12px 16px;
  border: 1.5px solid var(--border);
  border-radius: 10px;
  font-size: .92rem;
  color: var(--text);
  background: var(--surface);
  outline: none;
  resize: none;
  font-family: inherit;
  line-height: 1.7;
  transition: border .2s, box-shadow .2s;
}

.chat-input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(227, 146, 92, 0.12);
  background: #fff;
}

.chat-input::placeholder {
  color: var(--text-faint);
}

/* ═══════════════ 响应式 ═══════════════ */
@media (max-width: 1280px) {
  .avatar-workspace {
    grid-template-columns: 1fr;
    height: auto;
    min-height: auto;
  }

  .avatar-stage {
    min-height: 240px;
  }

  .cases-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 640px) {
  .cases-grid {
    grid-template-columns: 1fr;
  }

  .style-grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
