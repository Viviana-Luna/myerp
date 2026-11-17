<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';

import { useAccess } from '@vben/access';
import { LayoutGrid } from '@vben/icons';
import { useUserStore } from '@vben/stores';

// @ts-ignore solarlunar has no bundled types
import { solar2lunar } from 'solarlunar';

import { getTaskTodoPage } from '#/api/bpm/task';
import { getNoticePage } from '#/api/system/notice';
import { useMacOsShell } from '#/layouts/macos/use-macos-shell';

defineOptions({ name: 'MacWidgetClockGreeting' });

const userStore = useUserStore();
const { hasAccessByCodes, hasAccessByRoles } = useAccess();
const { desktopEditing, launchpadOpen } = useMacOsShell();

const now = ref(new Date());
let timer: number | undefined;

const todoTotal = ref<null | number>(null);
const noticeTotal = ref<null | number>(null);

const WEEKDAYS = [
  '星期日',
  '星期一',
  '星期二',
  '星期三',
  '星期四',
  '星期五',
  '星期六',
];

const timeText = computed(() => {
  const hh = String(now.value.getHours()).padStart(2, '0');
  const mm = String(now.value.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
});

const secondsText = computed(() =>
  String(now.value.getSeconds()).padStart(2, '0'),
);

const dateLine = computed(() => {
  const y = now.value.getFullYear();
  const m = now.value.getMonth() + 1;
  const d = now.value.getDate();
  const w = WEEKDAYS[now.value.getDay()] ?? '';
  let lunarText = '';
  try {
    const lunar = solar2lunar(y, m, d);
    if (lunar?.monthCn && lunar?.dayCn) {
      lunarText = ` · 农历${lunar.monthCn}${lunar.dayCn}`;
    }
  } catch {
    // 忽略农历转换异常
  }
  return `${y}年${m}月${d}日 ${w}${lunarText}`;
});

const greeting = computed(() => {
  const hour = now.value.getHours();
  const name =
    userStore.userInfo?.nickname || userStore.userInfo?.username || '伙伴';
  if (hour < 6) return `夜深了，${name}`;
  if (hour < 12) return `早安，${name}`;
  if (hour < 14) return `午安，${name}`;
  if (hour < 18) return `下午好，${name}`;
  return `晚上好，${name}`;
});

function canCall(code: string) {
  return hasAccessByRoles(['super_admin']) || hasAccessByCodes([code]);
}

async function loadQuickCounts() {
  const tasks: Promise<void>[] = [];
  if (canCall('bpm:task:query')) {
    tasks.push(
      getTaskTodoPage({ pageNo: 1, pageSize: 1 })
        .then((res) => {
          todoTotal.value = res?.total ?? 0;
        })
        .catch(() => {
          todoTotal.value = 0;
        }),
    );
  }
  if (canCall('system:notice:query')) {
    tasks.push(
      getNoticePage({ pageNo: 1, pageSize: 1 })
        .then((res) => {
          noticeTotal.value = res?.total ?? 0;
        })
        .catch(() => {
          noticeTotal.value = 0;
        }),
    );
  }
  await Promise.all(tasks);
}

onMounted(() => {
  timer = window.setInterval(() => {
    now.value = new Date();
  }, 1000);
  loadQuickCounts();
});

onUnmounted(() => {
  if (timer !== undefined) {
    window.clearInterval(timer);
  }
});
</script>

<template>
  <div class="mac-clock-widget">
    <div class="mac-clock-widget__top">
      <div>
        <div class="mac-clock-widget__greeting">{{ greeting }}</div>
        <div class="mac-clock-widget__date">{{ dateLine }}</div>
      </div>
      <div class="mac-clock-widget__time-box">
        <span class="mac-clock-widget__time">{{ timeText }}</span>
        <span class="mac-clock-widget__sec">:{{ secondsText }}</span>
      </div>
    </div>

    <div class="mac-clock-widget__bottom">
      <div class="mac-clock-widget__stats">
        <div class="mac-clock-stat">
          <span class="mac-clock-stat__label">待办审批</span>
          <span class="mac-clock-stat__val">{{ todoTotal ?? '-' }}</span>
        </div>
        <div class="mac-clock-stat">
          <span class="mac-clock-stat__label">系统公告</span>
          <span class="mac-clock-stat__val">{{ noticeTotal ?? '-' }}</span>
        </div>
      </div>

      <div class="mac-clock-widget__actions">
        <button
          class="mac-pill-btn"
          type="button"
          @click="launchpadOpen = true"
        >
          <LayoutGrid class="size-3.5" />
          <span>全部应用</span>
        </button>
        <button
          class="mac-pill-btn is-subtle"
          type="button"
          @click="desktopEditing = !desktopEditing"
        >
          <span>{{ desktopEditing ? '完成整理' : '整理桌面' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mac-clock-widget {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
  padding: 16px 18px;
}

.mac-clock-widget__top {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  justify-content: space-between;
}

.mac-clock-widget__greeting {
  font-size: 18px;
  font-weight: 700;
  line-height: 1.25;
  color: hsl(var(--foreground));
  letter-spacing: -0.02em;
}

.mac-clock-widget__date {
  margin-top: 4px;
  font-size: 12px;
  color: hsl(var(--muted-foreground));
}

.mac-clock-widget__time-box {
  display: flex;
  align-items: baseline;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.mac-clock-widget__time {
  font-size: 32px;
  font-weight: 700;
  color: hsl(var(--foreground));
  letter-spacing: -0.03em;
}

.mac-clock-widget__sec {
  margin-left: 2px;
  font-size: 14px;
  font-weight: 500;
  color: hsl(var(--muted-foreground));
}

.mac-clock-widget__bottom {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
}

.mac-clock-widget__stats {
  display: flex;
  gap: 10px;
}

.mac-clock-stat {
  display: flex;
  gap: 6px;
  align-items: baseline;
  padding: 6px 10px;
  background: rgb(255 255 255 / 44%);
  border: 1px solid rgb(255 255 255 / 45%);
  border-radius: 10px;
}

.dark .mac-clock-stat {
  background: rgb(255 255 255 / 8%);
  border-color: rgb(255 255 255 / 10%);
}

.mac-clock-stat__label {
  font-size: 11px;
  color: hsl(var(--muted-foreground));
}

.mac-clock-stat__val {
  font-size: 14px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: hsl(var(--foreground));
}

.mac-clock-widget__actions {
  display: flex;
  gap: 6px;
}

.mac-pill-btn {
  display: inline-flex;
  gap: 5px;
  align-items: center;
  height: 28px;
  padding: 0 10px;
  font-size: 12px;
  font-weight: 500;
  color: #fff;
  cursor: pointer;
  background: hsl(var(--primary));
  border: 0;
  border-radius: 999px;
  box-shadow: 0 4px 12px -4px hsl(var(--primary) / 60%);
  transition:
    filter 140ms ease,
    transform 140ms ease;
}

.mac-pill-btn:hover {
  filter: brightness(1.06);
  transform: translateY(-1px);
}

.mac-pill-btn.is-subtle {
  color: hsl(var(--foreground));
  background: rgb(255 255 255 / 55%);
  border: 1px solid rgb(255 255 255 / 55%);
  box-shadow: none;
}

.dark .mac-pill-btn.is-subtle {
  background: rgb(255 255 255 / 12%);
  border-color: rgb(255 255 255 / 14%);
}
</style>
