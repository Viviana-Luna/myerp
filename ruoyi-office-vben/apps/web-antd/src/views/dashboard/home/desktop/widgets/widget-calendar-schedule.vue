<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import type { SystemScheduleApi } from '#/api/system/schedule';

import { computed, onMounted, ref } from 'vue';

import { useAccess } from '@vben/access';
import { useVbenModal } from '@vben/common-ui';
import { ChevronLeft, ChevronRight, IconifyIcon } from '@vben/icons';

import dayjs from 'dayjs';

import {
  getSchedule,
  getScheduleDates,
  getScheduleListByDate,
} from '#/api/system/schedule';

import ScheduleDetailModal from '../../components/schedule/schedule-detail-modal.vue';

defineOptions({ name: 'MacWidgetCalendarSchedule' });

const { hasAccessByCodes, hasAccessByRoles } = useAccess();

const hasPermission = computed(
  () =>
    hasAccessByRoles(['super_admin']) ||
    hasAccessByCodes(['system:schedule:query']),
);

const [DetailModal, detailModalApi] = useVbenModal({
  connectedComponent: ScheduleDetailModal,
  destroyOnClose: true,
});

const selectedDate = ref<Dayjs>(dayjs());
const currentMonth = ref<Dayjs>(dayjs());
const scheduleDates = ref<string[]>([]);
const daySchedules = ref<SystemScheduleApi.Schedule[]>([]);
const loading = ref(false);

const WEEK_LABELS = ['一', '二', '三', '四', '五', '六', '日'];

const calendarCells = computed(() => {
  const startOfMonth = currentMonth.value.startOf('month');
  const endOfMonth = currentMonth.value.endOf('month');
  const startWeekday = (startOfMonth.day() + 6) % 7; // 周一 = 0
  const daysInMonth = endOfMonth.date();
  const cells: Array<{
    date: Dayjs;
    inMonth: boolean;
    key: string;
  }> = [];

  for (let i = startWeekday - 1; i >= 0; i--) {
    const d = startOfMonth.subtract(i + 1, 'day');
    cells.push({ date: d, inMonth: false, key: d.format('YYYY-MM-DD') });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const d = startOfMonth.date(day);
    cells.push({ date: d, inMonth: true, key: d.format('YYYY-MM-DD') });
  }
  const remain = 42 - cells.length;
  for (let i = 1; i <= remain; i++) {
    const d = endOfMonth.add(i, 'day');
    cells.push({ date: d, inMonth: false, key: d.format('YYYY-MM-DD') });
  }
  return cells;
});

async function loadMonthDots() {
  if (!hasPermission.value) return;
  try {
    const start = currentMonth.value.startOf('month').format('YYYY-MM-DD');
    const end = currentMonth.value.endOf('month').format('YYYY-MM-DD');
    scheduleDates.value = (await getScheduleDates(start, end)) || [];
  } catch {
    scheduleDates.value = [];
  }
}

async function loadDaySchedules(date: Dayjs) {
  if (!hasPermission.value) return;
  loading.value = true;
  try {
    daySchedules.value =
      (await getScheduleListByDate({
        scheduleDate: date.format('YYYY-MM-DD'),
      })) || [];
  } catch {
    daySchedules.value = [];
  } finally {
    loading.value = false;
  }
}

function selectDay(date: Dayjs) {
  selectedDate.value = date;
  if (!date.isSame(currentMonth.value, 'month')) {
    currentMonth.value = date.startOf('month');
    loadMonthDots();
  }
  loadDaySchedules(date);
}

function shiftMonth(delta: number) {
  currentMonth.value = currentMonth.value.add(delta, 'month');
  loadMonthDots();
}

async function openSchedule(item: SystemScheduleApi.Schedule) {
  if (!item.id) return;
  try {
    const detail = await getSchedule(item.id);
    detailModalApi.setData(detail).open();
  } catch {
    detailModalApi.setData(item).open();
  }
}

onMounted(() => {
  loadMonthDots();
  loadDaySchedules(selectedDate.value);
});
</script>

<template>
  <div class="mac-calendar-widget">
    <div class="mac-widget-head">
      <div class="mac-widget-head__left">
        <span class="mac-widget-badge is-cal">
          <IconifyIcon
            icon="lucide:calendar-days"
            class="size-3.5 text-white"
          />
        </span>
        <div>
          <div class="mac-widget-head__title">
            {{ currentMonth.format('YYYY年M月') }}
          </div>
          <div class="mac-widget-head__sub">
            {{ selectedDate.format('M月D日') }} 日程安排
          </div>
        </div>
      </div>

      <div class="mac-cal-nav">
        <button class="mac-cal-nav__btn" type="button" @click="shiftMonth(-1)">
          <ChevronLeft class="size-3.5" />
        </button>
        <button
          class="mac-cal-nav__today"
          type="button"
          @click="selectDay(dayjs())"
        >
          今天
        </button>
        <button class="mac-cal-nav__btn" type="button" @click="shiftMonth(1)">
          <ChevronRight class="size-3.5" />
        </button>
      </div>
    </div>

    <div class="mac-cal-body">
      <!-- 紧凑月历 -->
      <div class="mac-cal-grid-wrap">
        <div class="mac-cal-weekdays">
          <span v-for="w in WEEK_LABELS" :key="w">{{ w }}</span>
        </div>
        <div class="mac-cal-grid">
          <button
            v-for="cell in calendarCells"
            :key="cell.key"
            class="mac-cal-day"
            :class="{
              'is-muted': !cell.inMonth,
              'is-today': cell.key === dayjs().format('YYYY-MM-DD'),
              'is-selected': cell.key === selectedDate.format('YYYY-MM-DD'),
            }"
            type="button"
            @click="selectDay(cell.date)"
          >
            <span>{{ cell.date.date() }}</span>
            <i
              v-if="scheduleDates.includes(cell.key)"
              class="mac-cal-day__dot"
            ></i>
          </button>
        </div>
      </div>

      <!-- 选中日程 -->
      <div class="mac-cal-events">
        <div v-if="!hasPermission" class="mac-cal-empty">暂无日程权限</div>
        <div
          v-else-if="daySchedules.length === 0 && !loading"
          class="mac-cal-empty"
        >
          当日暂无日程安排
        </div>
        <button
          v-for="item in daySchedules"
          :key="item.id"
          class="mac-cal-event"
          type="button"
          @click="openSchedule(item)"
        >
          <span class="mac-cal-event__bar"></span>
          <div class="mac-cal-event__body">
            <div class="mac-cal-event__title">{{ item.title }}</div>
            <div class="mac-cal-event__time">
              {{
                item.startTime
                  ? `${item.startTime.slice(0, 5)}${item.endTime ? ` - ${item.endTime.slice(0, 5)}` : ''}`
                  : '全天'
              }}
            </div>
          </div>
        </button>
      </div>
    </div>

    <DetailModal />
  </div>
</template>

<style scoped>
.mac-calendar-widget {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 14px 16px;
}

.mac-widget-head {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
}

.mac-widget-head__left {
  display: flex;
  gap: 9px;
  align-items: center;
}

.mac-widget-badge.is-cal {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: linear-gradient(155deg, #38bdf8, #2563eb);
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

.mac-cal-nav {
  display: flex;
  gap: 4px;
  align-items: center;
}

.mac-cal-nav__btn,
.mac-cal-nav__today {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 24px;
  color: hsl(var(--foreground));
  cursor: pointer;
  background: rgb(255 255 255 / 45%);
  border: 1px solid rgb(255 255 255 / 45%);
  border-radius: 7px;
}

.dark .mac-cal-nav__btn,
.dark .mac-cal-nav__today {
  background: rgb(255 255 255 / 8%);
  border-color: rgb(255 255 255 / 10%);
}

.mac-cal-nav__btn {
  width: 24px;
}

.mac-cal-nav__today {
  padding: 0 8px;
  font-size: 11px;
}

.mac-cal-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
  margin-top: 10px;
}

.mac-cal-grid-wrap {
  padding: 6px;
  background: rgb(255 255 255 / 38%);
  border: 1px solid rgb(255 255 255 / 40%);
  border-radius: 12px;
}

.dark .mac-cal-grid-wrap {
  background: rgb(255 255 255 / 6%);
  border-color: rgb(255 255 255 / 9%);
}

.mac-cal-weekdays,
.mac-cal-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  text-align: center;
}

.mac-cal-weekdays {
  margin-bottom: 2px;
  font-size: 10px;
  color: hsl(var(--muted-foreground));
}

.mac-cal-day {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 24px;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: hsl(var(--foreground));
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 7px;
}

.mac-cal-day:hover {
  background: hsl(var(--accent));
}

.mac-cal-day.is-muted {
  color: hsl(var(--muted-foreground) / 45%);
}

.mac-cal-day.is-today {
  font-weight: 700;
  color: hsl(var(--primary));
}

.mac-cal-day.is-selected {
  font-weight: 600;
  color: #fff;
  background: hsl(var(--primary));
}

.mac-cal-day__dot {
  position: absolute;
  bottom: 2px;
  left: 50%;
  width: 4px;
  height: 4px;
  background: #f59e0b;
  border-radius: 999px;
  transform: translateX(-50%);
}

.mac-cal-day.is-selected .mac-cal-day__dot {
  background: #fff;
}

.mac-cal-events {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 5px;
  min-height: 0;
  overflow-y: auto;
}

.mac-cal-event {
  display: flex;
  gap: 8px;
  align-items: center;
  width: 100%;
  padding: 6px 10px;
  text-align: left;
  cursor: pointer;
  background: rgb(255 255 255 / 42%);
  border: 1px solid rgb(255 255 255 / 42%);
  border-radius: 10px;
}

.dark .mac-cal-event {
  background: rgb(255 255 255 / 7%);
  border-color: rgb(255 255 255 / 9%);
}

.mac-cal-event:hover {
  background: rgb(255 255 255 / 70%);
}

.dark .mac-cal-event:hover {
  background: rgb(255 255 255 / 12%);
}

.mac-cal-event__bar {
  width: 3px;
  height: 22px;
  background: #2563eb;
  border-radius: 999px;
}

.mac-cal-event__body {
  flex: 1;
  min-width: 0;
}

.mac-cal-event__title {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
  font-weight: 500;
  color: hsl(var(--foreground));
  white-space: nowrap;
}

.mac-cal-event__time {
  font-size: 10px;
  color: hsl(var(--muted-foreground));
}

.mac-cal-empty {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  font-size: 11.5px;
  color: hsl(var(--muted-foreground));
}
</style>
