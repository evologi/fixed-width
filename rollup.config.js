export default {
  input: 'src/index.mjs',
  output: [
    {
      file: 'fixed-width.cjs',
      format: 'cjs'
    },
    {
      file: 'fixed-width.mjs',
      format: 'es'
    }
  ],
  external: ['stream', 'os']
}
