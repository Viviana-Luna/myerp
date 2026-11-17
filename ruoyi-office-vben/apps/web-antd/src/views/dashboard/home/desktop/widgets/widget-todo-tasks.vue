<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { useAccess } from '@vben/access';
import { ChevronRight, IconifyIcon } from '@vben/icons';

import { getProcessInstanceMyPage } from '#/api/bpm/processInstance';
import { getTaskTodoPage } from '#/api/bpm/task';

defineOptions({ name: 'MacWidgetTodoTasks' });

const router = useRouter();
const { hasAccessByCodes, hasAccessByRoles } = useAccess();

type TabMode = 'my' | 'todo';
const activeTab = ref<TabMode>('todo');
const loading = ref(false);
const todoList = ref<any[]>([]);
const todoTotal = ref(0);
const myList = ref<any[]>([]);
const myTotal = ref(0);

function canCall(code: string) {
  return hasAccessByRoles(['super_admin']) || hasAccessByCodes([code]);
}

const hasPermission = computed(
  () => canCall('bpm:task:query') || canCall('bpm:process-instance:query'),
);

const activeItems = computed(() =>
  activeTab.value === 'todo' ? todoList.value : myList.value,
);

function formatTime(val?: number | string) {
  if (!val) return '';
  const d = new Date(val);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${mm}-${dd} ${hh}:${min}`;
}

async function loadData() {
  loading.value = true;
  try {
    const tasks: Promise<void>[] = [];
    if (canCall('bpm:task:query')) {
      tasks.push(
        getTaskTodoPage({ pageNo: 1, pageSize: 6 })
          .then((res) => {
            todoList.value = res?.list ?? [];
            todoTotal.value = res?.total ?? 0;
          })
          .catch(() => {
            todoList.value = [];
          }),
      );
    }
    if (canCall('bpm:process-instance:query')) {
      tasks.push(
        getProcessInstanceMyPage({ pageNo: 1, pageSize: 6 })
          .then((res) => {
            myList.value = res?.list ?? [];
            myTotal.value = res?.total ?? 0;
          })
          .catch(() => {
            myList.value = [];
          }),
      );
    }
    await Promise.all(tasks);
  } finally {
    loading.value = false;
  }
}

function openItem(record: any) {
  if (activeTab.value === 'todo') {
    router.push({
      name: 'BpmProcessInstanceDetail',
      query: {
        id: record.processInstance?.id,
        isTodo: 'true',
        nodeKey: record.taskDefinitionKey,
        taskId: record.id,
      },
    });
  } else {
    router.push({
      name: 'BpmProcessInstanceDetail',
      query: {
        id: record.id,
      },
    });
  }
}

function openAll() {
  router.push({
    name: activeTab.value === 'todo' ? 'BpmTodoTask' : 'BpmProcessInstanceMy',
  });
}

onMounted(loadData);
</script>

<template>
  <div class="mac-todo-widget">
    <div class="mac-widget-head">
      <div class="mac-widget-head__left">
        <span class="mac-widget-badge is-bpm">
          <IconifyIcon icon="lucide:git-branch" class="size-3.5 text-white" />
        </span>
        <div>
          <div class="mac-widget-head__title">流程审批与单据</div>
          <div class="mac-widget-head__sub">点击条目直接进入处理</div>
        </div>
      </div>

      <div class="mac-todo-head-right">
        <div class="mac-segmented">
          <button
            class="mac-segmented__btn"
            :class="{ 'is-active': activeTab === 'todo' }"
            type="button"
            @click="activeTab = 'todo'"
          >
            待办 ({{ todoTotal }})
          </button>
          <button
            class="mac-segmented__btn"
            :class="{ 'is-active': activeTab === 'my' }"
            type="button"
            @click="activeTab = 'my'"
          >
            我的 ({{ myTotal }})
          </button>
        </div>

        <button class="mac-widget-link" type="button" @click="openAll">
          <span>全部</span>
          <ChevronRight class="size-3.5" />
        </button>
      </div>
    </div>

    <div v-if="!hasPermission" class="mac-todo-empty">暂无流程中心查询权限</div>

    <div
      v-else-if="activeItems.length === 0 && !loading"
      class="mac-todo-empty"
    >
      {{
        activeTab === 'todo'
          ? '太棒了，当前没有待审批任务'
          : '暂无我发起的流程单据'
      }}
    </div>

    <div v-else class="mac-todo-list">
      <button
        v-for="item in activeItems"
        :key="item.id"
        class="mac-todo-row"
        type="button"
        @click="openItem(item)"
      >
        <span
          class="mac-todo-row__dot"
          :class="activeTab === 'todo' ? 'is-amber' : 'is-blue'"
        ></span>
        <div class="mac-todo-row__main">
          <div class="mac-todo-row__title">
            {{
              activeTab === 'todo'
                ? item.processInstance?.name || item.name
                : item.name
            }}
          </div>
          <div class="mac-todo-row__meta">
            <span v-if="activeTab === 'todo'">
              节点：{{ item.name || '-' }} · 发起人：{{
                item.processInstance?.startUser?.nickname || '-'
              }}
            </span>
            <span v-else>
              流程分类：{{
                item.categoryName || item.processDefinition?.name || '审批流程'
              }}
            </span>
          </div>
        </div>
        <span class="mac-todo-row__time">
          {{ formatTime(item.createTime) }}
        </span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.mac-todo-widget {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 14px 16px;
}

.mac-widget-head {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
}

.mac-widget-head__left {
  display: flex;
  gap: 9px;
  align-items: center;
}

.mac-widget-badge.is-bpm {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: linear-gradient(155deg, #a78bfa, #6d28d9);
  border-radius: 9px;
  box-shadow: 0 4px 10px -4px rgb(0 0 0 / 35%);
}

.mac-widget-head__title {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.2;
  color: hsl(var(--foreground));
}

.mac-widget-head__sub {
  font-size: 11px;
  color: hsl(var(--muted-foreground));
}

.mac-todo-head-right {
  display: flex;
  gap: 8px;
  align-items: center;
}

.mac-segmented {
  display: inline-flex;
  padding: 2px;
  background: rgb(15 23 42 / 7%);
  border-radius: 999px;
}

.dark .mac-segmented {
  background: rgb(255 255 255 / 10%);
}

.mac-segmented__btn {
  padding: 3px 10px;
  font-size: 11px;
  font-weight: 500;
  color: hsl(var(--muted-foreground));
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 999px;
  transition:
    background-color 140ms ease,
    color 140ms ease;
}

.mac-segmented__btn.is-active {
  color: hsl(var(--foreground));
  background: hsl(var(--background));
  box-shadow: 0 1px 4px rgb(0 0 0 / 10%);
}

.mac-widget-link {
  display: inline-flex;
  gap: 2px;
  align-items: center;
  padding: 4px 8px;
  font-size: 11px;
  font-weight: 500;
  color: hsl(var(--primary));
  cursor: pointer;
  background: hsl(var(--primary) / 10%);
  border: 0;
  border-radius: 999px;
}

.mac-todo-list {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 6px;
  min-height: 0;
  margin-top: 12px;
  overflow-y: auto;
}

.mac-todo-row {
  display: flex;
  gap: 10px;
  align-items: center;
  width: 100%;
  padding: 8px 10px;
  text-align: left;
  cursor: pointer;
  background: rgb(255 255 255 / 42%);
  border: 1px solid rgb(255 255 255 / 44%);
  border-radius: 12px;
  transition:
    background-color 130ms ease,
    transform 130ms ease;
}

.dark .mac-todo-row {
  background: rgb(255 255 255 / 7%);
  border-color: rgb(255 255 255 / 9%);
}

.mac-todo-row:hover {
  background: rgb(255 255 255 / 70%);
  transform: translateY(-1px);
}

.dark .mac-todo-row:hover {
  background: rgb(255 255 255 / 13%);
}

.mac-todo-row__dot {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: 999px;
}

.mac-todo-row__dot.is-amber {
  background: #f59e0b;
  box-shadow: 0 0 8px rgb(245 158 11 / 55%);
}

.mac-todo-row__dot.is-blue {
  background: #3b82f6;
  box-shadow: 0 0 8px rgb(59 130 246 / 55%);
}

.mac-todo-row__main {
  flex: 1;
  min-width: 0;
}

.mac-todo-row__title {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 13px;
  font-weight: 500;
  color: hsl(var(--foreground));
  white-space: nowrap;
}

.mac-todo-row__meta {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 11px;
  color: hsl(var(--muted-foreground));
  white-space: nowrap;
}

.mac-todo-row__time {
  flex-shrink: 0;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: hsl(var(--muted-foreground));
}

.mac-todo-empty {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: hsl(var(--muted-foreground));
}
</style>
