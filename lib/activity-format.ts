export interface ActivityItem {
  id: string
  content: string
  created_at: string
  conversation_id: string
  attachment_type?: string | null
  source?: "customer" | "automation" | "manual" | "echo" | null
  recipient?: {
    recipient_username: string
  }
}

const ATTACHMENT_LABELS: Record<string, string> = {
  image: "📷 Sent a photo",
  video: "🎥 Sent a video",
  audio: "🎵 Sent audio",
  file: "📎 Sent a file",
  share: "🔗 Shared a post",
  story_mention: "Mentioned in a story",
  ig_reel: "🎬 Shared a reel",
  reel: "🎬 Shared a reel",
}

const SOURCE_LABELS: Record<string, string> = {
  automation: "Automation replied to",
  manual: "You replied to",
  echo: "You messaged",
  customer: "Message from",
}

export function activityLabel(item: ActivityItem) {
  const verb = (item.source && SOURCE_LABELS[item.source]) || "Reply sent to"
  return `${verb} @${item.recipient?.recipient_username || "user"}`
}

export function activityPreview(item: ActivityItem) {
  if (item.attachment_type && /^\[.+\]$/.test(item.content)) {
    return ATTACHMENT_LABELS[item.attachment_type] || `📎 Sent a ${item.attachment_type.replace(/_/g, " ")}`
  }
  return item.content
}

export function activityTimestamp(iso: string) {
  const date = new Date(iso)
  const isToday = date.toDateString() === new Date().toDateString()
  const time = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  return isToday ? time : `${date.toLocaleDateString([], { month: "short", day: "numeric" })}, ${time}`
}
