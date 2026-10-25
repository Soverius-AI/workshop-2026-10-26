import { Component, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { FacilityStore } from '../../data/facility-store';
import { CHAT_STYLES } from './chat.styles';

@Component({
  selector: 'app-rag-chat',
  template: `
    <aside aria-labelledby="rag-chat-title">
      <p class="eyebrow">MCP · RAG · Unit 2</p>
      <h2 id="rag-chat-title">Factory RAG assistant</h2>
      <label for="rag-chat-metric">Reading</label>
      <select id="rag-chat-metric" #metric>
        @for (option of store.metricOptions(); track option.id) {
          <option [value]="option.id">{{ option.label }}</option>
        }
      </select>
      <label for="rag-chat-question">Your question</label>
      <textarea id="rag-chat-question" #question rows="3">
The cooling room is too warm. What should I do?</textarea>
      <button type="button" (click)="ask(metric.value, question.value)" [disabled]="busy()">
        {{ busy() ? 'Generating…' : 'Ask with documents' }}
      </button>
      <div class="local-answer" aria-live="polite" [attr.aria-busy]="busy()">
        @if (error()) {
          <p role="alert">{{ error() }}</p>
        }
        @if (result(); as reply) {
          <p class="chat-boundary">
            {{ reply.snapshot.room }} · {{ reply.snapshot.metric }}: {{ reply.snapshot.value }}
            {{ reply.snapshot.unit }}<br />
            Observed: {{ reply.snapshot.observedAt }}
          </p>
          <p class="answer-text">{{ reply.answer }}</p>
        }
      </div>
    </aside>
  `,
  styles: CHAT_STYLES,
})
export class RagChatComponent {
  protected readonly store = inject(FacilityStore);
  private readonly http = inject(HttpClient);
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected readonly result = signal<{
    answer: string | null;
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
          this.http.post<NonNullable<ReturnType<typeof this.result>>>('/api/rag-chat', {
            metricId,
            question,
          }),
        ),
      );
    } catch (error) {
      this.error.set(
        error instanceof HttpErrorResponse && typeof error.error?.error === 'string'
          ? error.error.error
          : 'The assistant is unavailable. Check the backend and model connection.',
      );
    } finally {
      this.busy.set(false);
    }
  }
}
