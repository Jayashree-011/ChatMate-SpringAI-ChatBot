import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { sendMessage } from './services/chatApi'
import type { ChatMessage, HistoryTurn } from './types'

interface Conversation {
  id: string
  messages: ChatMessage[]
}
import './App.css'

const suggestions = [
  { icon: '✦', title: 'Spark an idea', prompt: 'Help me brainstorm a fresh idea for a weekend project.' },
  { icon: '⌘', title: 'Learn something', prompt: 'Explain how large language models work in simple terms.' },
  { icon: '↗', title: 'Get unstuck', prompt: 'I feel stuck on a task. Help me break it into smaller steps.' },
  { icon: '✎', title: 'Write with me', prompt: 'Help me write a warm, concise thank-you note.' },
]

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true as const,
  }

  switch (name) {
    case 'plus':
      return <svg {...common}><path d="M12 5v14M5 12h14" /></svg>
    case 'message':
      return <svg {...common}><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z" /></svg>
    case 'trash':
      return <svg {...common}><path d="M3 6h18M8 6V4h8v2m3 0-.8 14H5.8L5 6m4 4v6m6-6v6" /></svg>
    case 'send':
      return <svg {...common}><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
    case 'spark':
      return <svg {...common}><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z" /><path d="m19 14 1.1 2.9L23 18l-2.9 1.1L19 22l-1.1-2.9L15 18l2.9-1.1L19 14Z" /></svg>
    case 'menu':
      return <svg {...common}><path d="M4 6h16M4 12h16M4 18h16" /></svg>
    case 'close':
      return <svg {...common}><path d="m18 6-12 12M6 6l12 12" /></svg>
    default:
      return null
  }
}

function App() {
  const [conversations, setConversations] = useState<Conversation[]>(() => [
    { id: crypto.randomUUID(), messages: [] },
  ])
  const [activeConversationId, setActiveConversationId] = useState(conversations[0].id)
  const [draft, setDraft] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const endOfMessagesRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const activeConversation = conversations.find(({ id }) => id === activeConversationId)
  const messages = activeConversation?.messages ?? []
  const savedConversations = conversations.filter(({ messages: turns }) => turns.length > 0)

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, isLoading])

  async function submitMessage(value = draft) {
    const content = value.trim()
    if (!content || isLoading) return

    const conversationId = activeConversationId
    setDraft('')
    setError('')
    setIsLoading(true)
    const history: HistoryTurn[] = messages.map(({ role, content: turn }) => ({
      role: role === 'user' ? 'USER' : 'ASSISTANT',
      content: turn,
    }))
    setConversations((current) => current.map((conversation) =>
      conversation.id === conversationId
        ? { ...conversation, messages: [...conversation.messages, { id: crypto.randomUUID(), role: 'user', content }] }
        : conversation,
    ))

    try {
      const reply = await sendMessage({ message: content, history })
      setConversations((current) => current.map((conversation) =>
        conversation.id === conversationId
          ? { ...conversation, messages: [...conversation.messages, { id: crypto.randomUUID(), role: 'assistant', content: reply }] }
          : conversation,
      ))
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void submitMessage()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void submitMessage()
    }
  }

  function clearChat() {
    if (messages.length === 0) return
    if (window.confirm('Clear this conversation? This cannot be undone.')) {
      const nextId = crypto.randomUUID()
      setConversations((current) => [
        ...current.filter(({ id }) => id !== activeConversationId),
        { id: nextId, messages: [] },
      ])
      setActiveConversationId(nextId)
      setError('')
      setSidebarOpen(false)
      inputRef.current?.focus()
    }
  }

  function startNewChat() {
    if (messages.length === 0) {
      setSidebarOpen(false)
      inputRef.current?.focus()
      return
    }
    const nextId = crypto.randomUUID()
    setConversations((current) => [...current, { id: nextId, messages: [] }])
    setActiveConversationId(nextId)
    setError('')
    setDraft('')
    setSidebarOpen(false)
    inputRef.current?.focus()
  }

  function clearHistory() {
    if (savedConversations.length === 0) return
    if (window.confirm('Clear all conversation history? This cannot be undone.')) {
      const nextId = crypto.randomUUID()
      setConversations([{ id: nextId, messages: [] }])
      setActiveConversationId(nextId)
      setError('')
      setSidebarOpen(false)
    }
  }

  const firstUserMessage = messages.find((message) => message.role === 'user')

  return (
    <div className="app-shell">
      {sidebarOpen && <button className="sidebar-scrim" aria-label="Close menu" onClick={() => setSidebarOpen(false)} />}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-top">
          <a className="brand" href="#" onClick={(event) => event.preventDefault()} aria-label="ChatMate home">
            <span className="brand-mark"><Icon name="spark" size={20} /></span>
            <span>chatmate<span className="brand-period">.</span></span>
          </a>
          <button className="icon-button mobile-close" aria-label="Close menu" onClick={() => setSidebarOpen(false)}>
            <Icon name="close" />
          </button>
          <button className="new-chat-button" onClick={startNewChat} disabled={isLoading}>
            <Icon name="plus" size={17} />
            <span>New chat</span>
            <span className="shortcut">⌘ K</span>
          </button>
          <div className="sidebar-section-label">YOUR SPACE</div>
          {savedConversations.length > 0 ? (
            <div className="history-list">
              {savedConversations.map((conversation) => {
                const title = conversation.messages.find((message) => message.role === 'user')?.content ?? 'New chat'
                return (
                  <button
                    className={`history-item ${conversation.id === activeConversationId ? 'history-item-active' : ''}`}
                    key={conversation.id}
                    onClick={() => {
                      setActiveConversationId(conversation.id)
                      setError('')
                      setSidebarOpen(false)
                      inputRef.current?.focus()
                    }}
                    disabled={isLoading}
                  >
                    <Icon name="message" size={16} />
                    <span>{title}</span>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="history-empty">Your conversations will appear here.</div>
          )}
        </div>
        <div className="sidebar-bottom">
          <div className="sidebar-note"><span className="online-dot" /> Ready when you are</div>
          <button className="clear-button" onClick={clearHistory} disabled={savedConversations.length === 0 || isLoading}>
            <Icon name="trash" size={16} />
            <span>Clear history</span>
          </button>
          <div className="sidebar-footer">Made for curious minds <span>✦</span></div>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <button className="icon-button menu-toggle" aria-label="Open menu" onClick={() => setSidebarOpen(true)}>
            <Icon name="menu" />
          </button>
          <div className="topbar-context">
            <span className="context-dot" />
            <span>ChatMate</span>
            <span className="context-divider">/</span>
            <span className="context-subtitle">{messages.length ? 'A new perspective' : 'Your AI companion'}</span>
          </div>
          {firstUserMessage && (
            <button className="top-clear-button" disabled={isLoading} onClick={clearChat}>
              <Icon name="trash" size={15} /><span>Clear chat</span>
            </button>
          )}
        </header>

        <section className="conversation" aria-label="Conversation">
          {messages.length === 0 ? (
            <div className="welcome">
              <div className="welcome-orbit">
                <span className="orbit-ring orbit-ring-one" />
                <span className="orbit-ring orbit-ring-two" />
                <span className="welcome-spark"><Icon name="spark" size={27} /></span>
                <span className="orbit-star orbit-star-one">✦</span>
                <span className="orbit-star orbit-star-two">·</span>
              </div>
              <div className="eyebrow"><span /> A LITTLE MORE HUMAN</div>
              <h1>Good ideas start<br />with <span>a conversation.</span></h1>
              <p className="welcome-description">Ask anything, think out loud, or explore an idea.<br className="desktop-break" /> I’m here to help you make sense of it all.</p>
              <div className="suggestions">
                {suggestions.map((suggestion) => (
                  <button className="suggestion-card" key={suggestion.title} onClick={() => void submitMessage(suggestion.prompt)}>
                    <span className="suggestion-icon">{suggestion.icon}</span>
                    <span className="suggestion-title">{suggestion.title}</span>
                    <span className="suggestion-prompt">{suggestion.prompt}</span>
                    <span className="suggestion-arrow">↗</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="message-list">
              {messages.map((message) => (
                <article className={`message-row ${message.role}`} key={message.id}>
                  {message.role === 'assistant' && <div className="assistant-avatar"><Icon name="spark" size={16} /></div>}
                  <div className="message-content">
                    <div className="message-author">{message.role === 'user' ? 'You' : 'ChatMate'}</div>
                    <div className="message-bubble">{message.content}</div>
                  </div>
                  {message.role === 'user' && <div className="user-avatar">Y</div>}
                </article>
              ))}
              {isLoading && (
                <div className="message-row assistant">
                  <div className="assistant-avatar"><Icon name="spark" size={16} /></div>
                  <div className="message-content">
                    <div className="message-author">ChatMate <span className="thinking-label">is thinking</span></div>
                    <div className="typing-indicator" aria-label="ChatMate is responding"><span /><span /><span /></div>
                  </div>
                </div>
              )}
              {error && (
                <div className="error-banner" role="alert">
                  <span className="error-symbol">!</span><span>{error}</span>
                  <button onClick={() => setError('')} aria-label="Dismiss error"><Icon name="close" size={15} /></button>
                </div>
              )}
              <div ref={endOfMessagesRef} />
            </div>
          )}
        </section>

        <div className={`composer-area ${messages.length === 0 ? 'composer-welcome' : ''}`}>
          {messages.length === 0 && error && (
            <div className="error-banner welcome-error" role="alert"><span className="error-symbol">!</span><span>{error}</span><button onClick={() => setError('')} aria-label="Dismiss error"><Icon name="close" size={15} /></button></div>
          )}
          <form className="composer" onSubmit={handleSubmit}>
            <textarea
              ref={inputRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message ChatMate..."
              rows={1}
              aria-label="Message ChatMate"
              disabled={isLoading}
            />
            <div className="composer-bottom">
              <span className="composer-hint"><span className="hint-spark">✦</span> Here to help you think</span>
              <div className="composer-actions">
                <span className="keyboard-hint"><kbd>↵</kbd> to send</span>
                <button className="send-button" type="submit" aria-label="Send message" disabled={isLoading || !draft.trim()}>
                  <Icon name="send" size={17} />
                </button>
              </div>
            </div>
          </form>
          <p className="disclaimer">ChatMate can make mistakes. Trust your judgment, especially with important things.</p>
        </div>
      </main>
    </div>
  )
}

export default App
