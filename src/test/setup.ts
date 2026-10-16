import 'fake-indexeddb/auto'
import { Blob as NodeBlob } from 'node:buffer'

// structuredClone в Node (его использует fake-indexeddb) не умеет клонировать Blob из happy-dom
// и превращает его в пустой объект. Нативный Blob Node клонируется корректно, как и Blob в браузере.
globalThis.Blob = NodeBlob as unknown as typeof Blob
