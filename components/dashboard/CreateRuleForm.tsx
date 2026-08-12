"use client"

import { useState, useEffect, useMemo } from "react"
import {
  Plus, Trash2, Film, Check, MessageCircle, Send, AtSign, Heart,
  MessageSquare, Image as ImageIcon, Link2, Loader2, Globe, ArrowLeft,
} from "lucide-react"
import { TagInput } from "@/components/ui/tag-input"
import type { ProButton, QuickReplyOption, Automation } from "@/lib/types"
import { toast } from "sonner"

/* ============================================================
   4-step automation builder — Trigger / Content / Response / Delivery
   Matches the Claude Design "Automations" mockup's visual language and
   flow; underlying fields/capabilities are the real product's, not a
   1:1 mockup copy (the mockup drops some real capabilities — media/
   card responses, multi-button, quick replies, reply rotation — those
   stay, restyled to fit the new step layout).
   ============================================================ */

interface CreateRuleFormProps {
  userId: string
  onSuccess: () => void
  onCancel: () => void
  editRule?: Automation | null
}

const STEP_LABELS = ["Trigger", "Content", "Response", "Delivery"] as const

const SOURCES = [
  { key: "comment" as const, label: "Comment", desc: "Someone comments on a post or reel" },
  { key: "dm" as const, label: "Direct message", desc: "Someone sends you a DM" },
  { key: "story" as const, label: "Story", desc: "A reply or mention on your story" },
]

const DELAYS = [
  { key: "0", label: "Instant" },
  { key: "3", label: "3s" },
  { key: "5", label: "5s" },
  { key: "10", label: "10s" },
  { key: "30", label: "30s" },
  { key: "random", label: "Random (3–10s)" },
]

export function CreateRuleForm({ userId, onSuccess, onCancel, editRule }: CreateRuleFormProps) {
  const isEditing = !!editRule
  const [step, setStep] = useState(1)

  /* ---------- WHEN ---------- */
  const [source, setSource] = useState<"comment" | "dm" | "story">(editRule?.trigger_source || "comment")
  const [triggerMode, setTriggerMode] = useState<"keyword" | "reply_all">(
    editRule && editRule.trigger_type === "reply_all" ? "reply_all" : "keyword",
  )
  const [triggers, setTriggers] = useState<string[]>([])
  const [storyTriggerType, setStoryTriggerType] = useState<"mention" | "reaction" | "reply">("mention")
  const [selectedReel, setSelectedReel] = useState<any | null>(null)
  const [hasSelectedReelOption, setHasSelectedReelOption] = useState<boolean>(false)

  /* ---------- THEN ---------- */
  const [type, setType] = useState<"text" | "card" | "media">("text")
  const [messageText, setMessageText] = useState("")
  const [cardTitle, setCardTitle] = useState("")
  const [cardSubtitle, setCardSubtitle] = useState("")
  const [cardImage, setCardImage] = useState("")
  const [buttons, setButtons] = useState<ProButton[]>([])
  const [mediaUrl, setMediaUrl] = useState("")
  const [mediaType, setMediaType] = useState<"image" | "video" | "audio">("image")
  const [quickReplies, setQuickReplies] = useState<QuickReplyOption[]>([])

  /* ---------- Public comment reply ---------- */
  const [replyMode, setReplyMode] = useState<"both" | "dm_only" | "public_only">("both")
  const [publicReplies, setPublicReplies] = useState<string[]>([])
  const [includeReplies, setIncludeReplies] = useState(false)

  /* ---------- EXTRAS ---------- */
  const [name, setName] = useState("")
  const [nameEdited, setNameEdited] = useState(false)
  const [checkFollow, setCheckFollow] = useState(false)
  const [delaySeconds, setDelaySeconds] = useState<string>("random")
  const [typingIndicator, setTypingIndicator] = useState(false)
  const [markSeen, setMarkSeen] = useState(true)

  const [saving, setSaving] = useState(false)
  const [reels, setReels] = useState<any[]>([])
  const [loadingReels, setLoadingReels] = useState(false)

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    setLoadingReels(true)
    fetch(`/api/instagram/media?userId=${userId}`)
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return
        const list = j.data && Array.isArray(j.data) ? j.data : Array.isArray(j) ? j : []
        setReels(list)
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoadingReels(false))
    return () => { cancelled = true }
  }, [userId])

  /* Prefill on edit */
  useEffect(() => {
    if (!editRule) return
    const content: any =
      typeof editRule.response_content === "string"
        ? JSON.parse(editRule.response_content as any)
        : editRule.response_content || {}

    setName(editRule.name)
    setSource(editRule.trigger_source)
    if (["mention", "reaction", "reply"].includes(editRule.trigger_type)) {
      setStoryTriggerType(editRule.trigger_type as any)
    }
    setTriggerMode(editRule.trigger_type === "reply_all" ? "reply_all" : "keyword")
    const rawTriggers = (editRule.trigger_value || "")
      .split(",").map((t) => t.trim())
      .filter((t) => t && !["ALL", "ALL_COMMENTS", "ALL_MENTIONS", "ALL_REACTIONS"].includes(t.toUpperCase()))
    setTriggers(rawTriggers)

    if (content.media?.url) {
      setType("media"); setMediaUrl(content.media.url); setMediaType(content.media.type || "image"); setMessageText(content.message || "")
    } else if (content.card) {
      setType("card"); setCardTitle(content.card.title || ""); setCardSubtitle(content.card.subtitle || ""); setCardImage(content.card.image_url || "")
      setButtons((content.card.buttons || []).map((b: any, i: number) => ({ id: `${Date.now()}_${i}`, ...b })))
    } else {
      setType("text"); setMessageText(content.message || "")
    }
    setQuickReplies((content.quick_replies || []).map((q: any, i: number) => ({ id: `${Date.now()}_qr${i}`, title: q.title, payload: q.payload })))
    setReplyMode(content.reply_mode || "both")
    setPublicReplies(content.public_replies || [])
    setIncludeReplies(content.include_replies === true)
    setCheckFollow(content.check_follow === true)
    const loadedDelay = content.delay_seconds
    setDelaySeconds(
      loadedDelay === "random" || [0, 3, 5, 10, 30].includes(Number(loadedDelay)) ? String(loadedDelay) : "random",
    )
    setTypingIndicator(content.typing_indicator === true)
    setMarkSeen(content.mark_seen !== false)

    if (editRule.specific_media_id) {
      setSelectedReel({ id: editRule.specific_media_id, caption: "Selected post" })
      setHasSelectedReelOption(true)
    } else {
      setHasSelectedReelOption(true)
    }
  }, [editRule])

  /* Auto name — suggests a name from the trigger until the user actually types in the field.
     Must key off whether the user has edited it, not whether it's currently empty, or clearing
     the field to type a custom name would immediately get overwritten by this effect. */
  useEffect(() => {
    if (nameEdited || isEditing) return
    if (source === "comment" && triggerMode === "reply_all") setName("Reply to every comment")
    else if (triggers.length > 0) setName(`Reply to "${triggers[0]}"`)
  }, [source, triggerMode, triggers, nameEdited, isEditing])

  /* Switching source resets fields that don't carry over meaningfully. */
  const changeSource = (next: "comment" | "dm" | "story") => {
    setSource(next)
    setTriggerMode("keyword")
    setTriggers([])
    setSelectedReel(null)
    setHasSelectedReelOption(next !== "comment")
  }

  /* ---------- helpers ---------- */
  const addButton = () => {
    if (buttons.length >= 3) return
    setButtons([...buttons, { id: Date.now().toString(), type: "web_url", title: "", url: "", payload: "" }])
  }
  const updateButton = (id: string, field: keyof ProButton, value: string) =>
    setButtons(buttons.map((b) => (b.id === id ? { ...b, [field]: value } : b)))
  const removeButton = (id: string) => setButtons(buttons.filter((b) => b.id !== id))

  const addQuickReply = () => {
    if (quickReplies.length >= 4) return
    setQuickReplies([...quickReplies, { id: Date.now().toString(), title: "" }])
  }
  const updateQuickReply = (id: string, title: string) =>
    setQuickReplies(quickReplies.map((q) => (q.id === id ? { ...q, title } : q)))
  const removeQuickReply = (id: string) => setQuickReplies(quickReplies.filter((q) => q.id !== id))

  const needsKeywords = source === "dm" || (source === "story" && storyTriggerType !== "mention") || (source === "comment" && triggerMode === "keyword")

  const step1Valid = (!needsKeywords || triggers.length > 0) && name.trim().length > 0
  const step2Valid = source !== "comment" || hasSelectedReelOption
  const step3Valid =
    replyMode === "public_only" ||
    (type === "text" ? messageText.trim().length > 0 : type === "card" ? cardTitle.trim().length > 0 : mediaUrl.trim().length > 0)
  const canSave = step1Valid && step2Valid && step3Valid

  const stepValid = [step1Valid, step2Valid, step3Valid, true]

  /* Plain-language summary sentence */
  const summary = useMemo(() => {
    const isReplyAll = source === "comment" && triggerMode === "reply_all"
    const who =
      source === "comment"
        ? isReplyAll ? "anyone comments on your post" : `someone comments ${triggers.length ? `"${triggers[0]}"` : "a keyword"}`
        : source === "dm"
          ? `someone DMs you ${triggers.length ? `"${triggers[0]}"` : "a keyword"}`
          : storyTriggerType === "mention" ? "someone mentions you in a story"
            : storyTriggerType === "reaction" ? "someone reacts to your story"
              : "someone replies to your story"
    const what =
      replyMode === "public_only" ? "reply publicly"
        : type === "card" ? "send them a card with buttons"
          : type === "media" ? `send them ${mediaType === "image" ? "an image" : `a ${mediaType}`}`
            : "send them a DM"
    return { who, what }
  }, [source, triggerMode, triggers, storyTriggerType, replyMode, type, mediaType])

  /* ---------- save ---------- */
  const handleSubmit = async () => {
    if (!canSave || saving) return
    setSaving(true)

    const isReplyAll = source === "comment" && triggerMode === "reply_all"

    const content: any = { check_follow: checkFollow }
    content.delay_seconds = delaySeconds === "random" ? "random" : Number(delaySeconds)
    if (typingIndicator) content.typing_indicator = true
    if (!markSeen) content.mark_seen = false
    if (source === "comment") {
      content.reply_mode = replyMode
      if (publicReplies.length > 0) content.public_replies = publicReplies
      if (includeReplies) content.include_replies = true
    }
    if (quickReplies.filter((q) => q.title.trim()).length > 0) {
      content.quick_replies = quickReplies.filter((q) => q.title.trim()).map((q) => ({ title: q.title.trim(), payload: q.payload }))
    }

    if (type === "text") {
      content.message = messageText
    } else if (type === "media") {
      content.media = { type: mediaType, url: mediaUrl.trim() }
      if (messageText.trim()) content.message = messageText
    } else {
      const cleanButtons = buttons
        .map((b) => {
          if (b.type === "web_url") {
            let cleanUrl = b.url?.trim() || ""
            if (cleanUrl.startsWith("https://https://")) cleanUrl = cleanUrl.replace("https://https://", "https://")
            return { type: "web_url" as const, title: b.title, url: cleanUrl }
          }
          return { type: "postback" as const, title: b.title, payload: b.payload }
        })
        .filter((b) => b.title)
      content.card = { title: cardTitle, subtitle: cardSubtitle || undefined, image_url: cardImage || undefined, buttons: cleanButtons }
    }

    const payload = {
      userId,
      name,
      trigger_source: source,
      trigger_type: isReplyAll ? "reply_all" : source === "story" ? storyTriggerType : "keyword",
      trigger_value: isReplyAll ? "ALL_COMMENTS"
        : source === "story" && storyTriggerType === "mention" ? "ALL_MENTIONS"
          : source === "story" && storyTriggerType === "reaction" && triggers.length === 0 ? "ALL_REACTIONS"
            : triggers.length > 0 ? triggers.join(", ") : "ALL",
      content,
      specific_media_id: selectedReel?.id || null,
    }

    try {
      const res = await fetch("/api/automations", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEditing ? { ...payload, id: editRule!.id } : payload),
      })
      if (res.ok) {
        toast.success(isEditing ? "Automation updated" : "Automation is live")
        onSuccess()
      } else {
        toast.error("Could not save — try again")
      }
    } catch {
      toast.error("Network error")
    } finally {
      setSaving(false)
    }
  }

  const nextStep = () => { if (stepValid[step - 1]) setStep((s) => Math.min(4, s + 1)) }
  const prevStep = () => setStep((s) => Math.max(1, s - 1))

  return (
    <div className="min-h-screen flex flex-col">
      {/* Builder header */}
      <header className="flex items-center justify-between gap-6 px-6 md:px-8 py-5 border-b-2 border-[#201e1d]/40">
        <div className="flex items-center gap-4">
          <button
            onClick={onCancel}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-[#201e1d]/40 text-xs font-bold hover:bg-[#201e1d]/[0.06] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
          <div>
            <h6 className="text-[11px] tracking-[0.08em] uppercase text-[#7d7979]">{isEditing ? "Edit automation" : "New automation"}</h6>
            <div className="text-lg md:text-xl font-black tracking-[-0.02em]">{name || "Untitled automation"}</div>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-[#7d7979] hidden sm:inline">Step {step} of 4 · {STEP_LABELS[step - 1]}</span>
          {step > 1 && (
            <button onClick={prevStep} className="px-3.5 py-2 border border-[#201e1d]/40 text-xs font-bold hover:bg-[#201e1d]/[0.06] transition-colors">
              Previous
            </button>
          )}
          {step < 4 ? (
            <button
              onClick={nextStep}
              disabled={!stepValid[step - 1]}
              className="px-4 py-2 bg-[#201e1d] text-[#f3f2f2] text-xs font-bold hover:bg-black transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canSave || saving}
              className="flex items-center gap-2 px-5 py-2 bg-[#ec3013] text-[#f3f2f2] text-xs font-bold hover:bg-[#dd2b0f] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {saving ? "Saving…" : isEditing ? "Save automation" : "Activate automation"}
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 grid lg:grid-cols-[1fr_400px]">
        {/* Left: step content */}
        <div className="border-r-2 border-[#201e1d]/40 min-w-0">
          <div className="grid grid-cols-4 border-b-2 border-[#201e1d]/40">
            {STEP_LABELS.map((label, i) => (
              <button
                key={label}
                onClick={() => { if (i + 1 < step || stepValid[step - 1]) setStep(i + 1) }}
                className="text-left px-4 py-3 border-r border-[#201e1d]/25 last:border-r-0 hover:bg-[#201e1d]/[0.04] transition-colors"
              >
                <div className="text-[11px] tracking-[0.08em] uppercase text-[#7d7979]">Step {i + 1}</div>
                <div className="text-sm font-bold mt-0.5">{label}</div>
                <div className={`h-1 -mx-4 -mb-3 mt-2 ${step === i + 1 ? "bg-[#ec3013]" : "bg-transparent"}`} />
              </button>
            ))}
          </div>

          <div className="px-6 md:px-7 py-7">
            {step === 1 && (
              <div className="space-y-7">
                <div>
                  <FieldLabel>Where does it listen</FieldLabel>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {SOURCES.map((o) => (
                      <button
                        key={o.key}
                        onClick={() => changeSource(o.key)}
                        className={`text-left p-3.5 border flex flex-col gap-1.5 transition-colors ${
                          source === o.key ? "border-[#ec3013] bg-[#ec3013]/[0.04]" : "border-[#201e1d]/40 hover:bg-[#201e1d]/[0.04]"
                        }`}
                      >
                        <span className={`h-1 w-7 block ${source === o.key ? "bg-[#ec3013]" : "bg-[#d7d3d3]"}`} />
                        <span className="text-[15px] font-bold">{o.label}</span>
                        <span className="text-xs text-[#7d7979]">{o.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {source === "story" && (
                  <div>
                    <FieldLabel>Trigger</FieldLabel>
                    <div className="flex flex-col">
                      {[
                        { key: "mention" as const, icon: <AtSign className="w-4 h-4" />, label: "Story mention", desc: "Someone mentions you in their story" },
                        { key: "reaction" as const, icon: <Heart className="w-4 h-4" />, label: "Story reaction", desc: "An emoji reaction on your story" },
                        { key: "reply" as const, icon: <MessageSquare className="w-4 h-4" />, label: "Story reply", desc: "Someone replies to your story" },
                      ].map((o) => (
                        <button
                          key={o.key}
                          onClick={() => setStoryTriggerType(o.key)}
                          className="flex items-center gap-3 text-left py-3 border-b border-[#201e1d]/25 hover:bg-[#201e1d]/[0.04] px-1 transition-colors"
                        >
                          <span className={`w-3 h-3 shrink-0 border ${storyTriggerType === o.key ? "bg-[#ec3013] border-[#ec3013]" : "border-[#201e1d]"}`} />
                          <span>
                            <span className="text-sm font-bold block">{o.label}</span>
                            <span className="text-xs text-[#7d7979] block">{o.desc}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {source === "comment" && (
                  <div>
                    <FieldLabel>Trigger</FieldLabel>
                    <div className="flex gap-2">
                      {[
                        { key: "keyword" as const, label: "Comment contains keyword" },
                        { key: "reply_all" as const, label: "Any comment" },
                      ].map((o) => (
                        <button
                          key={o.key}
                          onClick={() => setTriggerMode(o.key)}
                          className={`px-3.5 py-2 border text-xs font-bold transition-colors ${
                            triggerMode === o.key ? "border-[#ec3013] bg-[#ec3013]/10 text-[#ae1800]" : "border-[#201e1d]/40 hover:bg-[#201e1d]/[0.04]"
                          }`}
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {needsKeywords && (
                  <div>
                    <FieldLabel>
                      {source === "story" && storyTriggerType === "reaction" ? "Only react on these emojis" : "Keywords to match"}
                    </FieldLabel>
                    <p className="text-xs text-[#7d7979] mb-2">
                      {source === "story" && storyTriggerType === "reaction"
                        ? "Leave empty to trigger on any emoji reaction."
                        : "Matching is case-insensitive and ignores punctuation."}
                    </p>
                    <TagInput
                      value={triggers}
                      onChange={setTriggers}
                      placeholder={source === "story" && storyTriggerType === "reaction" ? "e.g. ❤️, 🔥, 👍" : "type keyword, press Enter"}
                    />
                  </div>
                )}

                {source === "comment" && triggerMode === "keyword" && triggers.length > 0 && (
                  <ToggleRow title="Check replies to comments" sub="Normally only primary post comments trigger replies" on={includeReplies} onToggle={() => setIncludeReplies(!includeReplies)} />
                )}

                <div>
                  <FieldLabel>Automation name</FieldLabel>
                  <TextField value={name} onChange={(v) => { setName(v); setNameEdited(true) }} placeholder='e.g. "Free Ebook Download Trigger"' />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <p className="text-sm text-[#7d7979]">
                  {source === "story"
                    ? "Story automations apply to every story you publish."
                    : source === "dm"
                      ? "DM automations listen on the whole inbox."
                      : "Choose the reels and posts this automation watches."}
                </p>

                {source === "comment" && (
                  loadingReels ? (
                    <div className="p-8 flex flex-col items-center justify-center gap-3 border border-[#201e1d]/40">
                      <Loader2 className="w-6 h-6 animate-spin text-[#ec3013]" />
                      <span className="text-xs text-[#7d7979]">Fetching Instagram feed…</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-[420px] overflow-y-auto pr-1">
                      <button
                        onClick={() => { setSelectedReel(null); setHasSelectedReelOption(true) }}
                        className={`aspect-square border flex flex-col items-center justify-center p-3 text-center transition-colors ${
                          hasSelectedReelOption && selectedReel === null ? "border-[#ec3013] bg-[#ec3013]/[0.04]" : "border-[#201e1d]/40 hover:bg-[#201e1d]/[0.04]"
                        }`}
                      >
                        <Globe className="w-7 h-7 mb-2 text-[#7d7979]" />
                        <span className="text-xs font-bold">All posts &amp; reels</span>
                      </button>

                      {reels.map((reel) => {
                        const isSelected = hasSelectedReelOption && selectedReel?.id === reel.id
                        return (
                          <button
                            key={reel.id}
                            onClick={() => { setSelectedReel(reel); setHasSelectedReelOption(true) }}
                            className={`aspect-square border relative text-left overflow-hidden transition-colors ${
                              isSelected ? "border-[#ec3013]" : "border-[#201e1d]/40 hover:border-[#201e1d]/70"
                            }`}
                          >
                            {reel.media_url ? (
                              <img src={reel.media_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-[#eae7e7] flex items-center justify-center">
                                <Film className="w-6 h-6 text-[#9b9797]" />
                              </div>
                            )}
                            <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-[#201e1d]/80 text-[8px] text-white uppercase tracking-wider">
                              {reel.media_type === "STORY" ? "Story" : reel.media_type === "VIDEO" ? "Reel" : "Post"}
                            </span>
                            {isSelected && (
                              <div className="absolute inset-0 bg-[#ec3013]/15 flex items-center justify-center">
                                <div className="w-7 h-7 bg-[#ec3013] text-white flex items-center justify-center">
                                  <Check className="w-4 h-4 stroke-[3]" />
                                </div>
                              </div>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )
                )}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 max-w-2xl">
                {source === "comment" && (
                  <div>
                    <FieldLabel>Reply mode</FieldLabel>
                    <div className="flex gap-2">
                      {([
                        { key: "both" as const, label: "Reply + DM" },
                        { key: "public_only" as const, label: "Reply only" },
                        { key: "dm_only" as const, label: "DM only" },
                      ]).map(({ key, label }) => (
                        <button
                          key={key}
                          onClick={() => setReplyMode(key)}
                          className={`px-3.5 py-2 border text-xs font-bold transition-colors ${
                            replyMode === key ? "border-[#ec3013] bg-[#ec3013]/10 text-[#ae1800]" : "border-[#201e1d]/40 hover:bg-[#201e1d]/[0.04]"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {source === "comment" && replyMode !== "dm_only" && (
                  <div>
                    <FieldLabel>Public reply rotation</FieldLabel>
                    <p className="text-xs text-[#7d7979] mb-2">Add multiple phrases — they rotate to look human.</p>
                    <TagInput value={publicReplies} onChange={setPublicReplies} placeholder='e.g. "Sent you a DM!"' />
                  </div>
                )}

                {replyMode !== "public_only" && (
                  <div className="space-y-5">
                    <div>
                      <FieldLabel>Direct message format</FieldLabel>
                      <div className="grid grid-cols-3 gap-2">
                        {([
                          { key: "text" as const, icon: <MessageCircle className="w-4 h-4" />, label: "Text" },
                          { key: "card" as const, icon: <Link2 className="w-4 h-4" />, label: "Card / link" },
                          { key: "media" as const, icon: <ImageIcon className="w-4 h-4" />, label: "Media" },
                        ]).map(({ key, icon, label }) => (
                          <button
                            key={key}
                            onClick={() => setType(key)}
                            className={`p-2.5 border text-xs font-bold flex items-center justify-center gap-2 transition-colors ${
                              type === key ? "border-[#ec3013] bg-[#ec3013]/10 text-[#ae1800]" : "border-[#201e1d]/40 hover:bg-[#201e1d]/[0.04]"
                            }`}
                          >
                            {icon}
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {type === "text" && (
                      <div>
                        <FieldLabel>Message text</FieldLabel>
                        <textarea
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          rows={5}
                          maxLength={1000}
                          className="w-full border border-[#201e1d]/40 bg-[#f8f4f4] px-4 py-3 text-sm resize-none focus:outline-none focus:border-[#ec3013] transition-colors"
                          placeholder="Type the message to send in DMs…"
                        />
                        <p className="text-[10px] text-[#9b9797] text-right mt-1">{messageText.length}/1000</p>
                      </div>
                    )}

                    {type === "card" && (
                      <div className="space-y-4">
                        <div className="space-y-2.5">
                          <FieldLabel>Card configuration</FieldLabel>
                          <TextField value={cardTitle} onChange={setCardTitle} placeholder="Card main title" />
                          <TextField value={cardSubtitle} onChange={setCardSubtitle} placeholder="Subtitle (optional)" />
                          <TextField value={cardImage} onChange={setCardImage} placeholder="Cover image URL (optional)" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between border-b border-[#201e1d]/25 pb-2">
                            <FieldLabel>Buttons ({buttons.length}/3)</FieldLabel>
                            <button onClick={addButton} disabled={buttons.length >= 3} className="text-[11px] font-bold text-[#7d7979] hover:text-[#201e1d] disabled:opacity-40 flex items-center gap-1">
                              <Plus className="w-3 h-3" /> Add button
                            </button>
                          </div>
                          {buttons.map((btn) => (
                            <div key={btn.id} className="flex gap-2 items-center border border-[#201e1d]/25 p-2">
                              <input
                                value={btn.title}
                                onChange={(e) => updateButton(btn.id, "title", e.target.value)}
                                className="h-8 text-xs flex-1 bg-transparent border-none px-2 focus:outline-none"
                                placeholder="Button label"
                              />
                              <select
                                value={btn.type}
                                onChange={(e) => updateButton(btn.id, "type", e.target.value)}
                                className="h-8 text-[11px] bg-white border border-[#201e1d]/40 px-2 focus:outline-none"
                              >
                                <option value="web_url">Open link</option>
                                <option value="postback">Trigger flow</option>
                              </select>
                              <input
                                value={btn.type === "web_url" ? btn.url : btn.payload}
                                onChange={(e) => updateButton(btn.id, btn.type === "web_url" ? "url" : "payload", e.target.value)}
                                className="h-8 text-xs flex-1 bg-transparent border-none px-2 focus:outline-none font-mono"
                                placeholder={btn.type === "web_url" ? "https://link" : "flow_keyword"}
                              />
                              <button onClick={() => removeButton(btn.id)} className="text-[#7d7979] hover:text-[#ec3013] p-1">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {type === "media" && (
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          {(["image", "video", "audio"] as const).map((m) => (
                            <button
                              key={m}
                              onClick={() => setMediaType(m)}
                              className={`px-3.5 py-2 border text-xs font-bold uppercase transition-colors ${
                                mediaType === m ? "border-[#ec3013] bg-[#ec3013]/10 text-[#ae1800]" : "border-[#201e1d]/40 hover:bg-[#201e1d]/[0.04]"
                              }`}
                            >
                              {m}
                            </button>
                          ))}
                        </div>
                        <TextField value={mediaUrl} onChange={setMediaUrl} placeholder="Link to public media file" />
                        <TextField value={messageText} onChange={setMessageText} placeholder="Optional caption message" />
                      </div>
                    )}

                    {type !== "card" && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between border-b border-[#201e1d]/25 pb-2">
                          <FieldLabel>Quick reply chips ({quickReplies.length}/4)</FieldLabel>
                          <button onClick={addQuickReply} disabled={quickReplies.length >= 4} className="text-[11px] font-bold text-[#7d7979] hover:text-[#201e1d] disabled:opacity-40 flex items-center gap-1">
                            <Plus className="w-3 h-3" /> Add chip
                          </button>
                        </div>
                        {quickReplies.map((q) => (
                          <div key={q.id} className="flex gap-2 items-center">
                            <input
                              value={q.title}
                              onChange={(e) => updateQuickReply(q.id, e.target.value)}
                              maxLength={20}
                              className="h-9 text-xs flex-1 border border-[#201e1d]/40 bg-[#f8f4f4] px-3 focus:outline-none focus:border-[#ec3013]"
                              placeholder='e.g. "Send Details!"'
                            />
                            <button onClick={() => removeQuickReply(q.id)} className="text-[#7d7979] hover:text-[#ec3013] p-1">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6 max-w-2xl">
                <div>
                  <FieldLabel>Delay before sending</FieldLabel>
                  <div className="flex flex-wrap gap-2">
                    {DELAYS.map((o) => (
                      <button
                        key={o.key}
                        onClick={() => setDelaySeconds(o.key)}
                        className={`px-3.5 py-2 border text-xs font-bold transition-colors ${
                          delaySeconds === o.key ? "border-[#ec3013] bg-[#ec3013]/10 text-[#ae1800]" : "border-[#201e1d]/40 hover:bg-[#201e1d]/[0.04]"
                        }`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <ToggleRow title="Follow gate required" sub="Only followers get the payload; non-followers get a follow prompt first." on={checkFollow} onToggle={() => setCheckFollow(!checkFollow)} />
                  <ToggleRow title="Show typing indicator" sub="Displays a typing bubble before the DM lands." on={typingIndicator} onToggle={() => setTypingIndicator(!typingIndicator)} />
                  <ToggleRow title="Mark conversation as seen" sub="Marks the thread as read once we reply." on={markSeen} onToggle={() => setMarkSeen(!markSeen)} />
                </div>

                <hr className="border-t-2 border-[#201e1d]/40" />

                <div>
                  <FieldLabel>Summary</FieldLabel>
                  <div className="border-t border-[#201e1d]/25">
                    {[
                      { k: "Trigger", v: `${SOURCES.find((s) => s.key === source)!.label} · ${source === "comment" && triggerMode === "reply_all" ? "Any comment" : triggers[0] ? `"${triggers[0]}"` : storyTriggerType} ` },
                      { k: "Content", v: source !== "comment" ? "All" : hasSelectedReelOption && selectedReel === null ? "All posts and reels" : "1 selected" },
                      { k: "Response", v: source === "comment" ? (replyMode === "both" ? "Public reply + DM" : replyMode === "public_only" ? "Public reply only" : "DM only") : "DM reply" },
                      { k: "Delay", v: DELAYS.find((d) => d.key === delaySeconds)?.label || delaySeconds },
                    ].map((r) => (
                      <div key={r.k} className="grid grid-cols-[130px_1fr] gap-4 py-2.5 border-b border-[#201e1d]/25 text-sm">
                        <div className="text-[#7d7979]">{r.k}</div>
                        <div className="font-bold">{r.v}</div>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-[#605d5d] leading-relaxed mt-3">
                    When <span className="font-bold text-[#201e1d]">{summary.who}</span>, we will <span className="font-bold text-[#ec3013]">{summary.what}</span>.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: preview */}
        <aside className="bg-[#eae9e9] p-6 flex flex-col gap-4">
          <FieldLabel>Preview</FieldLabel>

          <div className="bg-[#f8f4f4] border border-[#201e1d]/40">
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[#201e1d]/25">
              <span className="w-6 h-6 bg-[#201e1d] text-[#f8f4f4] text-[9px] font-bold flex items-center justify-center">IG</span>
              <span className="text-xs font-bold">{name || "your_account"}</span>
              <span className="ml-auto text-[11px] text-[#7d7979]">{source === "story" ? "Story" : source === "dm" ? "Inbox" : "Post"}</span>
            </div>
            {source !== "dm" && (
              <div className="aspect-[5/4] bg-[repeating-linear-gradient(135deg,#e3e0e0_0_8px,#f8f4f4_8px_16px)]" />
            )}
            {source === "comment" && (
              <div className="p-3 flex flex-col gap-2.5">
                <div className="flex gap-2">
                  <span className="w-5.5 h-5.5 rounded-full bg-[#d7d3d3] shrink-0" />
                  <span className="text-xs">
                    <span className="font-bold block">commenter</span>
                    {triggers[0] ? `"${triggers[0]}" please 🙏` : "This is so good!"}
                  </span>
                </div>
                {replyMode !== "dm_only" && (
                  <div className="flex gap-2 pl-7">
                    <span className="w-5.5 h-5.5 rounded-full bg-[#201e1d] shrink-0" />
                    <span className="text-xs">
                      <span className="font-bold block">{name || "you"}</span>
                      {publicReplies[0] || "Sent! Check your DMs 📩"}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {replyMode !== "public_only" && (
            <div className="bg-[#f8f4f4] border border-[#201e1d]/40 flex flex-col">
              <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[#201e1d]/25">
                <span className="w-6 h-6 rounded-full bg-[#d7d3d3]" />
                <span className="text-xs font-bold">recipient</span>
                <span className="ml-auto text-[11px] text-[#7d7979]">Direct</span>
              </div>
              <div className="p-3 flex flex-col gap-2.5 items-end">
                {type === "text" && (
                  <div className="bg-[#ec3013] text-white px-3.5 py-2.5 text-xs max-w-[85%] whitespace-pre-wrap break-words">
                    {messageText || "Type message content…"}
                  </div>
                )}
                {type === "card" && (
                  <div className="border border-[#201e1d]/40 w-48 bg-white">
                    {cardImage && cardImage.startsWith("http") && <img src={cardImage} alt="" className="w-full h-24 object-cover" />}
                    <div className="p-2.5">
                      <p className="text-xs font-bold line-clamp-1">{cardTitle || "Card title"}</p>
                      {cardSubtitle && <p className="text-[10px] text-[#7d7979] mt-1 line-clamp-2">{cardSubtitle}</p>}
                    </div>
                    {buttons.filter((b) => b.title).map((b) => (
                      <div key={b.id} className="border-t border-[#201e1d]/25 py-1.5 text-center text-[10px] font-bold text-[#ec3013]">
                        {b.title}
                      </div>
                    ))}
                  </div>
                )}
                {type === "media" && (
                  <div className="border border-[#201e1d]/40 w-36 h-36 flex items-center justify-center bg-white">
                    {mediaType === "image" && mediaUrl.startsWith("http") ? (
                      <img src={mediaUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] text-[#7d7979] uppercase">{mediaType}</span>
                    )}
                  </div>
                )}
                {quickReplies.filter((q) => q.title.trim()).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 justify-end">
                    {quickReplies.filter((q) => q.title.trim()).map((q) => (
                      <span key={q.id} className="border border-[#ec3013] text-[#ec3013] px-2.5 py-1 text-[10px] font-bold">{q.title}</span>
                    ))}
                  </div>
                )}
                <p className="text-[11px] text-[#7d7979]">
                  {delaySeconds === "0" ? "sent instantly" : `sent after ${DELAYS.find((d) => d.key === delaySeconds)?.label.toLowerCase()}`}
                </p>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}

/* ============================================================
   Small shared field primitives
   ============================================================ */

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#7d7979] mb-2">{children}</p>
}

function TextField({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full h-10 border border-[#201e1d]/40 bg-[#f8f4f4] px-3 text-sm focus:outline-none focus:border-[#ec3013] transition-colors"
    />
  )
}

function ToggleRow({ title, sub, on, onToggle }: { title: string; sub: string; on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-3.5 text-left py-3 border-b border-[#201e1d]/25 hover:bg-[#201e1d]/[0.03] transition-colors px-1"
    >
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-bold">{title}</span>
        <span className="block text-xs text-[#7d7979] mt-0.5">{sub}</span>
      </span>
      <span className={`w-10 h-5.5 relative shrink-0 transition-colors ${on ? "bg-[#ec3013]" : "bg-[#d7d3d3]"}`}>
        <span className={`absolute top-0.5 w-4.5 h-4.5 bg-white shadow-sm transition-all ${on ? "left-[20px]" : "left-0.5"}`} />
      </span>
    </button>
  )
}
