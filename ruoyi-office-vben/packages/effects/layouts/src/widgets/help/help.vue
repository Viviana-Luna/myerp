<script lang="ts" setup>
import { $t } from '@vben/locales';

import { useVbenModal } from '@vben-core/popup-ui';

import { useMagicKeys, whenever } from '@vueuse/core';

defineOptions({
  name: 'Help',
});

const keys = useMagicKeys();
whenever(keys['Alt+KeyH']!, () => {
  modalApi.open();
});

const [Modal, modalApi] = useVbenModal({
  draggable: true,
  footer: false,
  overlayBlur: 5,
  onCancel() {
    modalApi.close();
  },
});
</script>
<template>
  <Modal class="w-1/3" :title="$t('ui.widgets.qa')">
    <div class="space-y-3 py-2 text-sm">
      <div class="flex items-center justify-between border-b pb-2">
        <span class="text-muted-foreground">全局搜索菜单</span>
        <kbd class="bg-muted rounded px-2 py-0.5 text-xs">Cmd / Ctrl + K</kbd>
      </div>
      <div class="flex items-center justify-between border-b pb-2">
        <span class="text-muted-foreground">快速锁定屏幕</span>
        <kbd class="bg-muted rounded px-2 py-0.5 text-xs">Alt + L</kbd>
      </div>
      <div class="flex items-center justify-between">
        <span class="text-muted-foreground">收起启动台或程序坞</span>
        <kbd class="bg-muted rounded px-2 py-0.5 text-xs">Esc</kbd>
      </div>
    </div>
  </Modal>
</template>
