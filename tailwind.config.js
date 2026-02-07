/** @type {import('tailwindcss').Config} */
export default {
  // Preserve simple HTML styles
  corePlugins: {
    preflight: false,
  },
  // 强制包含动态使用的类名，确保Tailwind JIT编译器生成这些样式
  safelist: [
    // 背景色类
    'bg-equal',
    'bg-notEqual',
    'bg-greaterThan',
    'bg-lessThan',
    'bg-other',
    // 非方向性边框色类（用于高亮显示）
    'border-equal-border',
    'border-notEqual-border',
    'border-greaterThan-border',
    'border-lessThan-border',
    'border-other-border',
    // 方向性边框色类（用于区域边框）
    'border-t-equal-border',
    'border-b-equal-border',
    'border-l-equal-border',
    'border-r-equal-border',
    'border-t-notEqual-border',
    'border-b-notEqual-border',
    'border-l-notEqual-border',
    'border-r-notEqual-border',
    'border-t-greaterThan-border',
    'border-b-greaterThan-border',
    'border-l-greaterThan-border',
    'border-r-greaterThan-border',
    'border-t-lessThan-border',
    'border-b-lessThan-border',
    'border-l-lessThan-border',
    'border-r-lessThan-border',
    'border-t-other-border',
    'border-b-other-border',
    'border-l-other-border',
    'border-r-other-border',
    // 文本色类
    'text-equal-text',
    'text-notEqual-text',
    'text-greaterThan-text',
    'text-lessThan-text',
    'text-other-text',
    // 边框宽度类（用于和边框颜色类组合）
    'border-2',
    'border-3',
    'border-4',
    // 边框方向和宽度组合类
    'border-t-4',
    'border-b-4',
    'border-l-4',
    'border-r-4',
    // 边框透明类
    'border-t-transparent',
    'border-b-transparent',
    'border-l-transparent',
    'border-r-transparent',
    // Ring类（用于高亮效果）
    'ring-4',
    'ring-blue-500',
    'ring-indigo-300',
    'ring-offset-1',
  ],
  theme: {
    extend: {
      fontFamily: {
        custom: ["Lato"],
      },
      // 添加自定义边框宽度
      borderWidth: {
        '3': '3px',
      },
      colors: {
        equal: {
          DEFAULT: '#d63031',
          border: '#ef4444',
          text: '#991b1b'
        },
        notEqual: {
          DEFAULT: '#00b894',
          border: '#10b981',
          text: '#065f46'
        },
        greaterThan: {
          DEFAULT: '#6c5ce7',
          border: '#a855f7',
          text: '#6b21a8'
        },
        lessThan: {
          DEFAULT: '#e17055',
          border: '#f97316',
          text: '#9a3412'
        },
        other: {
          DEFAULT: '#0984e3',
          border: '#3b82f6',
          text: '#1e40af'
        }
      }
    },
  },
};
