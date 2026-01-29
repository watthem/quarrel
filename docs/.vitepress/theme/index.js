import DefaultTheme from 'vitepress/theme'
import WordCloudDemo from '../../components/WordCloudDemo.vue'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component('WordCloudDemo', WordCloudDemo)
  }
}
