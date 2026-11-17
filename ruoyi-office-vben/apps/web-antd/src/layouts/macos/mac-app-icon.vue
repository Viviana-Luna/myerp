<script lang="ts" setup>
import { computed, useId } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { getAppMeta } from './config';

defineOptions({ name: 'MacAppIcon' });

const props = withDefaults(
  defineProps<{
    fallbackIcon?: string;
    path: string;
    variant?: 'dock' | 'launchpad' | 'mini';
  }>(),
  {
    fallbackIcon: undefined,
    variant: 'dock',
  },
);

const uid = useId();

const KNOWN_PATHS = new Set([
  '/ai',
  '/asset',
  '/bpm',
  '/crm',
  '/erp',
  '/hrm',
  '/oa',
  '/system',
  '/wms',
  '/workspace',
  'launchpad',
]);

const iconKey = computed(() =>
  KNOWN_PATHS.has(props.path) ? props.path : 'custom',
);
const meta = computed(() => getAppMeta(props.path, props.fallbackIcon));
</script>

<template>
  <span class="mac-app-icon" :class="`is-${variant}`">
    <!-- 工作台桌面：钴蓝悬浮小组件桌面看板 + 底部微缩 Dock 条 -->
    <svg
      v-if="iconKey === '/workspace'"
      class="mac-app-icon__svg"
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient :id="`${uid}-ws`" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#53abff" />
          <stop offset="52%" stop-color="#256ef6" />
          <stop offset="100%" stop-color="#1746b8" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" :fill="`url(#${uid}-ws)`" />
      <!-- 左上小组件卡 -->
      <rect
        x="11"
        y="11"
        width="19"
        height="20"
        rx="5"
        fill="#ffffff"
        fill-opacity="0.96"
      />
      <circle cx="17.5" cy="18" r="3" fill="#256ef6" />
      <rect x="15" y="23.5" width="11" height="3" rx="1.5" fill="#93c5fd" />
      <!-- 右上小组件卡 -->
      <rect
        x="34"
        y="11"
        width="19"
        height="20"
        rx="5"
        fill="#ffffff"
        fill-opacity="0.82"
      />
      <rect x="38.5" y="21" width="3.5" height="6" rx="1.2" fill="#1d4ed8" />
      <rect
        x="43.5"
        y="16.5"
        width="3.5"
        height="10.5"
        rx="1.2"
        fill="#256ef6"
      />
      <rect x="48.5" y="19" width="2" height="8" rx="1" fill="#60a5fa" />
      <!-- 下方宽幅看板卡 -->
      <rect
        x="11"
        y="34.5"
        width="42"
        height="13.5"
        rx="4.5"
        fill="#ffffff"
        fill-opacity="0.9"
      />
      <circle cx="17.5" cy="41.25" r="2.75" fill="#3b82f6" />
      <rect
        x="23"
        y="38.5"
        width="14"
        height="2.6"
        rx="1.3"
        fill="#1e40af"
        fill-opacity="0.72"
      />
      <rect x="23" y="42.4" width="23" height="2.2" rx="1.1" fill="#93c5fd" />
      <!-- 底部微缩 Dock 指示条 -->
      <rect
        x="21"
        y="52"
        width="22"
        height="4"
        rx="2"
        fill="#ffffff"
        fill-opacity="0.92"
      />
    </svg>

    <!-- 启动台：macOS Launchpad 3x3 彩色应用方阵 -->
    <svg
      v-else-if="iconKey === 'launchpad'"
      class="mac-app-icon__svg"
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient :id="`${uid}-lp`" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#ffffff" />
          <stop offset="100%" stop-color="#dfe6f2" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" :fill="`url(#${uid}-lp)`" />
      <rect x="13" y="13" width="10" height="10" rx="3" fill="#ff5f57" />
      <rect x="27" y="13" width="10" height="10" rx="3" fill="#ff9f0a" />
      <rect x="41" y="13" width="10" height="10" rx="3" fill="#ffd60a" />
      <rect x="13" y="27" width="10" height="10" rx="3" fill="#30d158" />
      <rect x="27" y="27" width="10" height="10" rx="3" fill="#32ade6" />
      <rect x="41" y="27" width="10" height="10" rx="3" fill="#0a84ff" />
      <rect x="13" y="41" width="10" height="10" rx="3" fill="#5e5ce6" />
      <rect x="27" y="41" width="10" height="10" rx="3" fill="#bf5af2" />
      <rect x="41" y="41" width="10" height="10" rx="3" fill="#ff375f" />
    </svg>

    <!-- ERP 系统：翡翠质感立体魔方 -->
    <svg
      v-else-if="iconKey === '/erp'"
      class="mac-app-icon__svg"
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient :id="`${uid}-erp`" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#38d996" />
          <stop offset="55%" stop-color="#0ea974" />
          <stop offset="100%" stop-color="#056d53" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" :fill="`url(#${uid}-erp)`" />
      <polygon points="32,12 45,19.5 32,27 19,19.5" fill="#ffffff" />
      <polygon points="19,19.5 32,27 32,41 19,33.5" fill="#d1fae5" />
      <polygon points="45,19.5 32,27 32,41 45,33.5" fill="#6ee7b7" />
      <polygon
        points="16,35 27,41.5 27,52 16,45.5"
        fill="#ecfdf5"
        fill-opacity="0.92"
      />
      <polygon
        points="48,35 37,41.5 37,52 48,45.5"
        fill="#a7f3d0"
        fill-opacity="0.92"
      />
    </svg>

    <!-- WMS 仓储：暖橙立体仓库与货箱 -->
    <svg
      v-else-if="iconKey === '/wms'"
      class="mac-app-icon__svg"
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient :id="`${uid}-wms`" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#ffc347" />
          <stop offset="55%" stop-color="#f97316" />
          <stop offset="100%" stop-color="#c2410c" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" :fill="`url(#${uid}-wms)`" />
      <path
        d="M12 27L32 14L52 27V49C52 50.66 50.66 52 49 52H15C13.34 52 12 50.66 12 49V27Z"
        fill="#fff7ed"
        fill-opacity="0.95"
      />
      <path
        d="M10 27L32 13L54 27"
        fill="none"
        stroke="#ffffff"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="4"
      />
      <rect x="20" y="30" width="24" height="22" rx="3" fill="#fed7aa" />
      <line
        x1="23"
        x2="41"
        y1="35"
        y2="35"
        stroke="#ea580c"
        stroke-linecap="round"
        stroke-width="2.5"
      />
      <line
        x1="23"
        x2="41"
        y1="41"
        y2="41"
        stroke="#ea580c"
        stroke-linecap="round"
        stroke-width="2.5"
      />
      <rect x="26" y="44" width="12" height="8" rx="1.5" fill="#ea580c" />
    </svg>

    <!-- CRM 客户：珊瑚红双层卡片与客户徽章 -->
    <svg
      v-else-if="iconKey === '/crm'"
      class="mac-app-icon__svg"
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient :id="`${uid}-crm`" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#ff758f" />
          <stop offset="55%" stop-color="#f43f5e" />
          <stop offset="100%" stop-color="#be123c" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" :fill="`url(#${uid}-crm)`" />
      <rect
        x="13"
        y="17"
        width="38"
        height="31"
        rx="7"
        fill="#fff1f2"
        fill-opacity="0.28"
      />
      <circle cx="27" cy="27" r="6.5" fill="#ffffff" />
      <path d="M16 44C16 38.5 21 35 27 35C33 35 38 38.5 38 44" fill="#ffffff" />
      <circle cx="42" cy="29" r="5" fill="#ffe4e6" />
      <path d="M36 44C36 40 39 37 43 37C46.5 37 49 39.5 49 44" fill="#ffe4e6" />
    </svg>

    <!-- OA 协同：海蓝公文包与玻璃夹层 -->
    <svg
      v-else-if="iconKey === '/oa'"
      class="mac-app-icon__svg"
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient :id="`${uid}-oa`" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#60a5fa" />
          <stop offset="55%" stop-color="#2563eb" />
          <stop offset="100%" stop-color="#1e40af" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" :fill="`url(#${uid}-oa)`" />
      <path
        d="M24 21V17C24 15.34 25.34 14 27 14H37C38.66 14 40 15.34 40 17V21"
        fill="none"
        stroke="#dbeafe"
        stroke-width="3.2"
      />
      <rect
        x="13"
        y="21"
        width="38"
        height="28"
        rx="6"
        fill="#ffffff"
        fill-opacity="0.95"
      />
      <path
        d="M13 27C13 23.69 15.69 21 19 21H45C48.31 21 51 23.69 51 27V32C44 35.5 20 35.5 13 32V27Z"
        fill="#bfdbfe"
      />
      <rect x="29" y="30" width="6" height="6" rx="2" fill="#2563eb" />
    </svg>

    <!-- 流程中心 BPM：紫罗兰流转节点 -->
    <svg
      v-else-if="iconKey === '/bpm'"
      class="mac-app-icon__svg"
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient :id="`${uid}-bpm`" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#c084fc" />
          <stop offset="55%" stop-color="#7c3aed" />
          <stop offset="100%" stop-color="#4c1d95" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" :fill="`url(#${uid}-bpm)`" />
      <path
        d="M22 20V44M22 33C22 26 42 26 42 20"
        fill="none"
        stroke="#ede9fe"
        stroke-linecap="round"
        stroke-width="4"
      />
      <circle cx="22" cy="19" r="6" fill="#ffffff" />
      <circle cx="42" cy="19" r="6" fill="#ddd6fe" />
      <circle cx="22" cy="45" r="6" fill="#ffffff" />
      <rect
        x="36"
        y="39"
        width="12"
        height="12"
        rx="4"
        fill="#ffffff"
        fill-opacity="0.92"
      />
    </svg>

    <!-- 人力资源 HRM：樱粉组织名片 -->
    <svg
      v-else-if="iconKey === '/hrm'"
      class="mac-app-icon__svg"
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient :id="`${uid}-hrm`" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#f9a8d4" />
          <stop offset="52%" stop-color="#ec4899" />
          <stop offset="100%" stop-color="#9d174d" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" :fill="`url(#${uid}-hrm)`" />
      <rect
        x="14"
        y="15"
        width="36"
        height="34"
        rx="7"
        fill="#fdf2f8"
        fill-opacity="0.24"
      />
      <circle cx="32" cy="26" r="7" fill="#ffffff" />
      <path
        d="M19 46C19 39.5 24.8 35.5 32 35.5C39.2 35.5 45 39.5 45 46"
        fill="#ffffff"
      />
    </svg>

    <!-- 资产管理：青碧立体标牌 -->
    <svg
      v-else-if="iconKey === '/asset'"
      class="mac-app-icon__svg"
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient :id="`${uid}-asset`" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#5eead4" />
          <stop offset="55%" stop-color="#0d9488" />
          <stop offset="100%" stop-color="#115e59" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" :fill="`url(#${uid}-asset)`" />
      <rect
        x="15"
        y="17"
        width="34"
        height="30"
        rx="6"
        fill="#ffffff"
        fill-opacity="0.95"
      />
      <rect x="20" y="23" width="14" height="4" rx="2" fill="#0d9488" />
      <rect x="20" y="30" width="9" height="4" rx="2" fill="#99f6e4" />
      <circle cx="40" cy="37" r="7" fill="#0f766e" />
      <path
        d="M36.8 37L39.1 39.3L43.5 34.8"
        fill="none"
        stroke="#ffffff"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="2.2"
      />
    </svg>

    <!-- 系统设置：macOS System Settings 银灰金属齿轮 -->
    <svg
      v-else-if="iconKey === '/system'"
      class="mac-app-icon__svg"
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient :id="`${uid}-sys`" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#eceff4" />
          <stop offset="100%" stop-color="#9ca3af" />
        </linearGradient>
        <linearGradient :id="`${uid}-gear`" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="#6b7280" />
          <stop offset="100%" stop-color="#374151" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" :fill="`url(#${uid}-sys)`" />
      <circle cx="32" cy="32" r="20" fill="#1f2937" fill-opacity="0.14" />
      <path
        d="M35.5 11H28.5L27.4 15.8C26.1 16.2 24.9 16.7 23.8 17.4L19.4 14.8L14.5 19.7L17.1 24.1C16.4 25.2 15.9 26.4 15.5 27.7L10.8 28.8V35.8L15.5 36.9C15.9 38.2 16.4 39.4 17.1 40.5L14.5 44.9L19.4 49.8L23.8 47.2C24.9 47.9 26.1 48.4 27.4 48.8L28.5 53.5H35.5L36.6 48.8C37.9 48.4 39.1 47.9 40.2 47.2L44.6 49.8L49.5 44.9L46.9 40.5C47.6 39.4 48.1 38.2 48.5 36.9L53.2 35.8V28.8L48.5 27.7C48.1 26.4 47.6 25.2 46.9 24.1L49.5 19.7L44.6 14.8L40.2 17.4C39.1 16.7 37.9 16.2 36.6 15.8L35.5 11Z"
        :fill="`url(#${uid}-gear)`"
      />
      <circle cx="32" cy="32" r="9.5" fill="#d1d5db" />
      <circle cx="32" cy="32" r="4.8" fill="#4b5563" />
    </svg>

    <!-- AI 大模型：流光星芒 -->
    <svg
      v-else-if="iconKey === '/ai'"
      class="mac-app-icon__svg"
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient :id="`${uid}-ai`" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#818cf8" />
          <stop offset="50%" stop-color="#a855f7" />
          <stop offset="100%" stop-color="#ec4899" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="16" :fill="`url(#${uid}-ai)`" />
      <path
        d="M32 13L36.5 27.5L51 32L36.5 36.5L32 51L27.5 36.5L13 32L27.5 27.5L32 13Z"
        fill="#ffffff"
      />
      <circle cx="47" cy="17" r="3.5" fill="#fde68a" />
    </svg>

    <!-- 其他已授权模块：精致多层 Squircle + 矢量图标 -->
    <span
      v-else
      class="mac-app-icon__fallback"
      :style="{
        background: `linear-gradient(155deg, ${meta.gradient[0]}, ${meta.gradient[1]})`,
      }"
    >
      <IconifyIcon :icon="meta.icon" class="mac-app-icon__glyph" />
    </span>
  </span>
</template>

<style scoped>
.mac-app-icon {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: 24%;
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 45%),
    0 5px 14px -5px rgb(15 23 42 / 36%);
}

.mac-app-icon.is-mini {
  border-radius: 6px;
  box-shadow: 0 1px 3px rgb(15 23 42 / 22%);
}

.mac-app-icon__svg {
  display: block;
  width: 100%;
  height: 100%;
}

.mac-app-icon__fallback {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: #fff;
}

.mac-app-icon__fallback::before {
  position: absolute;
  inset: 0 0 50%;
  pointer-events: none;
  content: '';
  background: linear-gradient(180deg, rgb(255 255 255 / 22%), transparent);
}

.mac-app-icon__glyph {
  position: relative;
  z-index: 1;
  width: 54%;
  height: 54%;
}
</style>
