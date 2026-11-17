<script lang="ts" setup>
import type { SystemNoticeApi } from '#/api/system/notice';

import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { useAccess } from '@vben/access';
import { DICT_TYPE } from '@vben/constants';
import { getDictLabel } from '@vben/hooks';
import { ChevronRight, IconifyIcon } from '@vben/icons';

import { getNoticePage } from '#/api/system/notice';

import NoticePreviewModal from '../../components/notice/notice-preview-modal.vue';

defineOptions({ name: 'MacWidgetNoticeBoard' });

const router = useRouter();
const { hasAccessByCodes, hasAccessByRoles } = useAccess();

const loading = ref(false);
const noticeList = ref<SystemNoticeApi.Notice[]>([]);
const previewVisible = ref(false);
const selectedNotice = ref<null | SystemNoticeApi.Notice>(null);

const hasPermission = computed(
  () =>
    hasAccessByRoles(['super_admin']) ||
    hasAccessByCodes(['system:notice:query']),
);

const unreadCount = computed(
  () => noticeList.value.filter((item) => item.readStatus !== 1).length,
);

function formatDate(date?: Date | string) {
  if (!date) return '';
  const d = new Date(date);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${mm}-${dd}`;
}

function typeLabel(type: number) {
  return getDictLabel(DICT_TYPE.SYSTEM_NOTICE_TYPE, type) || '公告';
}

async function loadNotices() {
  if (!hasPermission.value) {
    return;
  }
  loading.value = true;
  try {
    const res = await getNoticePage({ pageNo: 1, pageSize: 6 });
    noticeList.value = res?.list ?? [];
  } catch {
    noticeList.value = [];
  } finally {
    loading.value = false;
  }
}

function openNotice(notice: SystemNoticeApi.Notice) {
  selectedNotice.value = notice;
  previewVisible.value = true;
}

function openMore() {
  router.push({ name: 'NoticeView' }).catch(() => {
    router.push('/system/notice');
  });
}

onMounted(loadNotices);
</script>

<template>
  <div class="mac-notice-widget">
    <div class="mac-widget-head">
      <div class="mac-widget-head__left">
        <span class="mac-widget-badge is-notice">
          <IconifyIcon icon="lucide:bell-ring" class="size-3.5 text-white" />
        </span>
        <div>
          <div class="mac-widget-head__title">
            通知公告
            <span v-if="unreadCount > 0" class="mac-unread-pill">
              {{ unreadCount }} 未读
            </span>
          </div>
          <div class="mac-widget-head__sub">点击公告直接在桌面阅读</div>
        </div>
      </div>

      <button class="mac-widget-link" type="button" @click="openMore">
        <span>更多</span>
        <ChevronRight class="size-3.5" />
      </button>
    </div>

    <div v-if="!hasPermission" class="mac-notice-empty">暂无公告查询权限</div>

    <div
      v-else-if="noticeList.length === 0 && !loading"
      class="mac-notice-empty"
    >
      暂无通知公告
    </div>

    <div v-else class="mac-notice-list">
      <button
        v-for="item in noticeList"
        :key="item.id"
        class="mac-notice-row"
        type="button"
        @click="openNotice(item)"
      >
        <span
          class="mac-notice-row__dot"
          :class="{ 'is-unread': item.readStatus !== 1 }"
        ></span>
        <span class="mac-notice-row__tag">{{ typeLabel(item.type) }}</span>
        <span class="mac-notice-row__title">
          {{ item.title }}
        </span>
        <span class="mac-notice-row__date">{{
          formatDate(item.createTime)
        }}</span>
      </button>
    </div>

    <NoticePreviewModal
      v-model:visible="previewVisible"
      :notice="selectedNotice"
      @refresh="loadNotices"
    />
  </div>
</template>

<style scoped>
.mac-notice-widget {
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

.mac-widget-badge.is-notice {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: linear-gradient(155deg, #fb7185, #e11d48);
  border-radius: 9px;
  box-shadow: 0 4px 10px -4px rgb(0 0 0 / 35%);
}

.mac-widget-head__title {
  display: flex;
  gap: 6px;
  align-items: center;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.2;
  color: hsl(var(--foreground));
}

.mac-unread-pill {
  padding: 1px 6px;
  font-size: 10px;
  font-weight: 600;
  color: #e11d48;
  background: rgb(225 29 72 / 12%);
  border-radius: 999px;
}

.mac-widget-head__sub {
  font-size: 11px;
  color: hsl(var(--muted-foreground));
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

.mac-notice-list {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 6px;
  min-height: 0;
  margin-top: 12px;
  overflow-y: auto;
}

.mac-notice-row {
  display: flex;
  gap: 8px;
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

.dark .mac-notice-row {
  background: rgb(255 255 255 / 7%);
  border-color: rgb(255 255 255 / 9%);
}

.mac-notice-row:hover {
  background: rgb(255 255 255 / 72%);
  transform: translateY(-1px);
}

.dark .mac-notice-row:hover {
  background: rgb(255 255 255 / 13%);
}

.mac-notice-row__dot {
  flex-shrink: 0;
  width: 6px;
  height: 6px;
  background: hsl(var(--muted-foreground) / 40%);
  border-radius: 999px;
}

.mac-notice-row__dot.is-unread {
  background: #ef4444;
  box-shadow: 0 0 8px rgb(239 68 68 / 55%);
}

.mac-notice-row__tag {
  flex-shrink: 0;
  padding: 1px 6px;
  font-size: 10px;
  font-weight: 500;
  color: hsl(var(--primary));
  background: hsl(var(--primary) / 10%);
  border-radius: 6px;
}

.mac-notice-row__title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12.5px;
  font-weight: 500;
  color: hsl(var(--foreground));
  white-space: nowrap;
}

.mac-notice-row__date {
  flex-shrink: 0;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: hsl(var(--muted-foreground));
}

.mac-notice-empty {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: hsl(var(--muted-foreground));
}
</style>
