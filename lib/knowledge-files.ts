export const KNOWLEDGE_DISPLAY_PATH = "/knowledge"
export const KNOWLEDGE_STORAGE_PATH = "/me/knowledge"

export function toKnowledgeDisplayPath(path: string) {
  if (path === KNOWLEDGE_STORAGE_PATH) return KNOWLEDGE_DISPLAY_PATH
  if (path.startsWith(`${KNOWLEDGE_STORAGE_PATH}/`)) {
    return `${KNOWLEDGE_DISPLAY_PATH}${path.slice(KNOWLEDGE_STORAGE_PATH.length)}`
  }
  return path
}
