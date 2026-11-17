export const DESKTOP_APP_PATH = '/workspace';
export const DESKTOP_ROUTE_PATH = '/workspace/home';

export type WallpaperId = 'aurora' | 'dawn' | 'sequoia' | 'tahoe';

export interface WallpaperPreset {
  id: WallpaperId;
  name: string;
  swatch: string;
}

export const WALLPAPER_PRESETS: WallpaperPreset[] = [
  {
    id: 'sequoia',
    name: 'Sequoia 晨光',
    swatch: 'linear-gradient(135deg, #6384f5 0%, #8b6fe8 48%, #e484b4 100%)',
  },
  {
    id: 'tahoe',
    name: 'Tahoe 蔚蓝',
    swatch: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 52%, #1e3a8a 100%)',
  },
  {
    id: 'dawn',
    name: '晴岚晨曦',
    swatch: 'linear-gradient(135deg, #34d399 0%, #38bdf8 52%, #818cf8 100%)',
  },
  {
    id: 'aurora',
    name: '极光夜幕',
    swatch: 'linear-gradient(135deg, #0f172a 0%, #312e81 52%, #0f766e 100%)',
  },
];

export interface AppVisualMeta {
  /** Dock 上展示的简短应用名（不填则使用菜单名称） */
  shortName?: string;
  /** 应用描述（用于 Launchpad 搜索与提示） */
  description?: string;
  /** 本地兜底 lucide / iconify 图标名 */
  icon: string;
  /** macOS Squircle 渐变底色 */
  gradient: [string, string];
}

export const APP_META_MAP: Record<string, AppVisualMeta> = {
  '/workspace': {
    shortName: '桌面',
    description: 'macOS 工作台桌面与小组件',
    icon: 'lucide:layout-grid',
    gradient: ['#4facfe', '#0066ff'],
  },
  '/erp': {
    shortName: 'ERP',
    description: '进销存、采购、销售、库存与财务一体化',
    icon: 'lucide:boxes',
    gradient: ['#34d399', '#059669'],
  },
  '/wms': {
    shortName: 'WMS',
    description: '仓库管理、采购入库与物资调拨',
    icon: 'lucide:warehouse',
    gradient: ['#fbbf24', '#ea580c'],
  },
  '/crm': {
    shortName: 'CRM',
    description: '客户关系、商机与合同管理',
    icon: 'lucide:handshake',
    gradient: ['#fb7185', '#e11d48'],
  },
  '/oa': {
    shortName: 'OA 办公',
    description: '协同办公与日常事务处理',
    icon: 'lucide:briefcase',
    gradient: ['#38bdf8', '#2563eb'],
  },
  '/bpm': {
    shortName: '流程中心',
    description: '审批流程、待办任务与表单设计',
    icon: 'lucide:git-branch',
    gradient: ['#a78bfa', '#6d28d9'],
  },
  '/hrm': {
    shortName: '人力资源',
    description: '组织架构、员工档案与人事考勤',
    icon: 'lucide:users',
    gradient: ['#f472b6', '#db2777'],
  },
  '/asset': {
    shortName: '资产管理',
    description: '固定资产台账、领用与盘点',
    icon: 'lucide:package-check',
    gradient: ['#2dd4bf', '#0f766e'],
  },
  '/ai': {
    shortName: 'AI 助手',
    description: '大模型对话、知识库与智能工具',
    icon: 'lucide:sparkles',
    gradient: ['#818cf8', '#9333ea'],
  },
  '/iot': {
    shortName: 'IoT 物联',
    description: '设备接入、物模型与数据监控',
    icon: 'lucide:cpu',
    gradient: ['#60a5fa', '#1d4ed8'],
  },
  '/mall': {
    shortName: '商城中心',
    description: '商品、订单、促销与交易运营',
    icon: 'lucide:shopping-bag',
    gradient: ['#fb923c', '#dc2626'],
  },
  '/report': {
    shortName: '报表中心',
    description: '可视化大屏与经营分析报表',
    icon: 'lucide:pie-chart',
    gradient: ['#22d3ee', '#0284c7'],
  },
  '/pay': {
    shortName: '支付中心',
    description: '支付渠道、商户订单与对账管理',
    icon: 'lucide:wallet',
    gradient: ['#4ade80', '#16a34a'],
  },
  '/member': {
    shortName: '会员中心',
    description: '会员等级、积分与标签体系',
    icon: 'lucide:award',
    gradient: ['#f59e0b', '#b45309'],
  },
  '/mp': {
    shortName: '公众号',
    description: '公众号菜单、素材与消息回复',
    icon: 'lucide:message-square-more',
    gradient: ['#34d399', '#0d9488'],
  },
  '/infra': {
    shortName: '基础设施',
    description: '代码生成、监控日志与系统工具',
    icon: 'lucide:server',
    gradient: ['#94a3b8', '#475569'],
  },
  '/system': {
    shortName: '系统设置',
    description: '用户、角色、菜单、部门与权限设置',
    icon: 'lucide:settings',
    gradient: ['#9ca3af', '#4b5563'],
  },
};

const FALLBACK_GRADIENTS: Array<[string, string]> = [
  ['#60a5fa', '#2563eb'],
  ['#34d399', '#059669'],
  ['#a78bfa', '#7c3aed'],
  ['#fb923c', '#ea580c'],
  ['#f472b6', '#db2777'],
  ['#22d3ee', '#0891b2'],
];

/** 默认固定在 Dock 上的业务应用（按菜单权限自动过滤） */
export const DEFAULT_DOCK_PATHS = [
  '/erp',
  '/wms',
  '/crm',
  '/oa',
  '/bpm',
  '/hrm',
  '/asset',
  '/system',
];

export function getAppMeta(path: string, fallbackIcon?: string): AppVisualMeta {
  const exact = APP_META_MAP[path];
  if (exact) {
    return exact;
  }
  let hash = 0;
  for (let i = 0; i < path.length; i++) {
    hash = (hash * 31 + (path.codePointAt(i) ?? 0)) >>> 0;
  }
  const gradient = FALLBACK_GRADIENTS[hash % FALLBACK_GRADIENTS.length] ?? [
    '#60a5fa',
    '#2563eb',
  ];
  return {
    icon: fallbackIcon || 'lucide:app-window',
    gradient,
  };
}
