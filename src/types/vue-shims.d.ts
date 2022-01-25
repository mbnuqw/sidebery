declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  /* eslint @typescript-eslint/ban-types: off */
  const component: DefineComponent<{}, {}, any>
  export default component
}
