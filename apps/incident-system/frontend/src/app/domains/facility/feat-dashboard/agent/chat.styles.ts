export const CHAT_STYLES = `
    :host {
      position: sticky;
      top: 24px;
      display: flex;
      align-self: start;
      height: clamp(520px, calc(100vh - 48px), 900px);
      min-width: 0;
      min-height: 0;
      margin: -22px -22px -22px 0;
      padding: 22px;
      overflow: hidden;
      border-left: 1px solid var(--so-border);
      background: var(--so-surface-soft);
      color: var(--so-text);
      contain: size;
    }

    * {
      box-sizing: border-box;
    }

    aside {
      display: flex;
      flex: 1;
      flex-direction: column;
      min-width: 0;
      min-height: 0;
    }

    .eyebrow {
      margin: 0;
      color: var(--so-brand);
      font-size: 0.68rem;
      font-weight: 850;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .chat-heading {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
    }

    .chat-heading h2 {
      margin: 3px 0 0;
      font-size: 1.45rem;
      line-height: 1.1;
    }

    .chat-heading > span {
      padding: 6px 9px;
      border-radius: 999px;
      background: var(--so-violet-soft);
      color: var(--so-violet-text);
      font-size: 0.68rem;
      font-weight: 800;
      white-space: nowrap;
    }

    .chat-boundary {
      margin: 14px 0;
      color: var(--so-text-muted);
      font-size: 0.82rem;
    }

    .copilot-chat-shell {
      display: block;
      flex: 1;
      min-height: 0;
      border: 1px solid var(--so-border);
      border-radius: 12px;
      background: var(--so-surface-soft);
      overflow: hidden;
    }

    label {
      margin: 14px 0 6px;
      font-weight: 600;
    }
    select,
    textarea,
    button {
      font: inherit;
      padding: 10px;
      border: 1px solid var(--so-border);
      border-radius: 8px;
    }
    select,
    textarea {
      background: var(--so-surface-soft);
      color: var(--so-text);
      width: 100%;
    }
    button {
      margin-top: 12px;
      background: var(--so-brand);
      color: white;
      cursor: pointer;
    }
    button:disabled {
      opacity: 0.65;
      cursor: wait;
    }
    :is(select, textarea, button):focus-visible {
      outline: 3px solid var(--so-brand);
      outline-offset: 3px;
    }
    .local-answer {
      overflow: auto;
    }
    .answer-text {
      white-space: pre-wrap;
      line-height: 1.6;
    }

    details { margin: 14px 0; }
    summary { cursor: pointer; font-weight: 600; }
    summary:focus-visible { outline: 3px solid var(--so-brand); outline-offset: 3px; }
    .evidence { border-top: 1px solid var(--so-border); margin-top: 12px; }
    .evidence h3 { font-size: 0.82rem; overflow-wrap: anywhere; }
    .evidence p, pre { white-space: pre-wrap; overflow-wrap: anywhere; font-size: 0.78rem; line-height: 1.5; }
    pre { padding: 12px; background: var(--so-surface-soft); border: 1px solid var(--so-border); border-radius: 8px; }

    copilot-chat {
      display: block;
      height: 100%;
    }

    @media (max-width: 1100px) {
      :host {
        position: static;
        order: -1;
        height: 620px;
        min-height: 480px;
        margin: 0;
        padding: 20px 0 22px;
        border-left: 0;
        border-bottom: 1px solid var(--so-border);
        background: transparent;
      }
    }
  `;
