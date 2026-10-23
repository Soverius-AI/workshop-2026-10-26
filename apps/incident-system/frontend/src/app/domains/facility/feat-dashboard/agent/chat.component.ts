import { Component, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { FacilityStore } from '../../data/facility-store';
import { CopilotChat } from '@copilotkit/angular';
import { StreamingAutoScrollDirective } from './streaming-auto-scroll.directive';

@Component({
  selector: 'app-chat',
  imports: [CopilotChat, StreamingAutoScrollDirective],
  template: `
    <aside aria-labelledby="chat-title">
      @if (localMode) {
        <p class="eyebrow">Local model · Unit 1 / 2</p>
        <h2 id="chat-title">Factory assistant</h2>
        <label for="chat-metric">Reading</label>
        <select id="chat-metric" #metric>
          @for (option of store.metricOptions(); track option.id) {
            <option [value]="option.id">{{ option.label }}</option>
          }
        </select>
        <label for="chat-question">Your question</label>
        <textarea id="chat-question" #question rows="3">
The cooling room is too warm. What should I do?</textarea>
        <button type="button" (click)="ask(metric.value, question.value)" [disabled]="busy()">
          {{ busy() ? 'Generating…' : 'Ask local model' }}
        </button>
        <div class="local-answer" aria-live="polite" [attr.aria-busy]="busy()">
          @if (error()) {
            <p role="alert">{{ error() }}</p>
          }
          @if (result(); as reply) {
            <p class="chat-boundary">
              {{ reply.snapshot.room }} · {{ reply.snapshot.metric }}: {{ reply.snapshot.value }}
              {{ reply.snapshot.unit }}<br />Observed: {{ reply.snapshot.observedAt }}
            </p>
            <p class="answer-text">{{ reply.answer }}</p>
          }
        </div>
      } @else {
        <div class="chat-heading">
          <div>
            <p class="eyebrow">CopilotKit · AG-UI streaming</p>
            <h2 id="chat-title">Factory assistant</h2>
          </div>
          <span>Frontend + SQL + approval</span>
        </div>
        <p class="chat-boundary">
          The assistant can adjust this view, query the historian, and propose raising an alarm.
          Only the operator can approve the audited alarm action.
        </p>

        <div class="copilot-chat-shell">
          <copilot-chat agentId="default" appStreamingAutoScroll />
        </div>
      }
    </aside>
  `,
  styles: `
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
  `,
})
export class ChatComponent {
  protected readonly localMode = new URLSearchParams(location.search).get('unit') !== '3';
  protected readonly store = inject(FacilityStore);
  private readonly http = inject(HttpClient);
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected readonly result = signal<{
    answer: string;
    snapshot: {
      room: string;
      metric: string;
      value: string | number | null;
      unit: string;
      observedAt: string;
    };
  } | null>(null);

  protected async ask(metricId: string, question: string) {
    this.busy.set(true);
    this.error.set('');
    this.result.set(null);
    try {
      this.result.set(
        await firstValueFrom(
          this.http.post<NonNullable<ReturnType<typeof this.result>>>('/api/chat', {
            metricId,
            question,
          }),
        ),
      );
    } catch {
      this.error.set('Load Gemma in llama-server, wait until it is ready, then try again.');
    } finally {
      this.busy.set(false);
    }
  }
}
