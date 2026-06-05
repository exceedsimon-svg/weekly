import { ref, watch, onMounted } from 'vue'

export function useDarkMode() {
  const isDark = ref(false)
  
  onMounted(() => {
    // 根据系统偏好设置初始值
    isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
    applyTheme()
  })
  
  // 应用主题
  function applyTheme() {
    if (isDark.value) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }
  
  // 监听变化
  watch(isDark, () => {
    applyTheme()
  })
  
  function toggle() {
    isDark.value = !isDark.value
  }
  
  return {
    isDark,
    toggle
  }
}
