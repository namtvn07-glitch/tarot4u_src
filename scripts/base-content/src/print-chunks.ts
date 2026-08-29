// In danh sách chunk ra stdout dạng JSON — dùng để lấy phân công combo khi
// giao việc sinh nội dung cho từng lần gọi agent. Chạy: tsx src/print-chunks.ts [cardsPerChunk]
import { buildChunks } from './chunks.js'

const cardsPerChunk = Number(process.argv[2]) || 3
const chunks = buildChunks(cardsPerChunk)

console.log(JSON.stringify({ cardsPerChunk, chunkCount: chunks.length, chunks }, null, 2))
