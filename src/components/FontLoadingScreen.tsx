import { motion } from 'motion/react'

/**
 * 展示字体加载完成前的全屏加载状态。
 * 覆盖层为不透明背景，底层页面在字体就绪后才被看见，
 * 因此用户只会看到最终字体的倒计时与年龄，没有任何字体交换跳变。
 */
export function FontLoadingScreen() {
  return (
    <motion.div
      className="font-loading-screen"
      role="status"
      aria-label="正在准备页面"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <span className="font-loading-dot" aria-hidden="true" />
    </motion.div>
  )
}
