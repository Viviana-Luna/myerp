<script lang="ts" setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';

import { Alert } from 'ant-design-vue';

import MacOsDesktopWorkspace from './desktop/desktop-workspace.vue';
import LayoutRenderer from './renderer/layout-renderer.vue';

defineOptions({ name: 'DashboardHome' });

const route = useRoute();

// 首页管理 / 设计器触发的预览模式仍使用原 LayoutRenderer
const previewPageId = computed(() => {
  const pageId = route.query.preview;
  return pageId ? Number(pageId) : null;
});
</script>

<template>
  <div class="dashboard-home-root h-full w-full">
    <Page
      v-if="previewPageId"
      content-class="p-0! m-0!"
      :content-style="{ height: '100%', padding: '0', margin: '0' }"
    >
      <div class="preview-banner">
        <Alert
          closable
          description="您正在预览首页配置，此模式下的修改不会保存。"
          message="预览模式"
          show-icon
          type="info"
        />
      </div>
      <LayoutRenderer :page-id="previewPageId" />
    </Page>

    <MacOsDesktopWorkspace v-else />
  </div>
</template>

<style scoped>
.preview-banner {
  padding: 16px;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
}
</style>
