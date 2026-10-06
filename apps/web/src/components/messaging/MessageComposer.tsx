import React, { useState, useRef } from 'react';
import { Send, Lock, Paperclip } from 'lucide-react';
import { Message, MessageType } from '../../features/messaging/types';
import { MessageReplyPreview } from './MessageReplyPreview';

interface MessageComposerProps {
  onSendMessage: (payload: { content: string; message_type: MessageType; reply_to_message_id?: string | null }) => Promise<void>;
  replyToMessage?: Message | null;
  onClearReply?: () => void;
  isStaff?: boolean;
  disabled?: boolean;
  onTyping?: () => void;
  placeholder?: string;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({
  onSendMessage,
  replyToMessage,
  onClearReply,
  isStaff = false,
  disabled = false,
  onTyping,
  placeholder = 'Write a message or response...',
}) => {
  const [content, setContent] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || submitting || disabled) return;

    try {
      setSubmitting(true);
      setError(null);

      const messageType: MessageType = isInternalNote
        ? 'internal_note'
        : isStaff
        ? 'staff_reply'
        : 'customer_message';

      await onSendMessage({
        content: trimmed,
        message_type: messageType,
        reply_to_message_id: replyToMessage?.id || null,
      });

      setContent('');
      setIsInternalNote(false);
      onClearReply?.();
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to send message. Please retry.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else {
      onTyping?.();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  };

  return (
    <div className="p-3 bg-white border-t border-[#E5E7EB]">
      {/* Reply quote preview */}
      {replyToMessage && (
        <div className="mb-2">
          <MessageReplyPreview
            replyToMessage={replyToMessage}
            onClearReply={onClearReply}
            isComposer={true}
          />
        </div>
      )}

      {/* Internal note banner indicator if active */}
      {isInternalNote && (
        <div className="flex items-center gap-1.5 px-3 py-1 mb-2 text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 rounded-md">
          <Lock className="w-3.5 h-3.5" />
          <span>Internal Note mode: This note is confidential and will NOT be visible to the customer.</span>
        </div>
      )}

      {/* Input container */}
      <div
        className={`relative border rounded-xl transition-all focus-within:ring-2 focus-within:ring-[#111111]/10 ${
          isInternalNote
            ? 'border-amber-300 bg-amber-50/40 focus-within:border-amber-500'
            : 'border-[#E5E7EB] bg-[#F8F9FA] focus-within:border-[#111111] focus-within:bg-white'
        }`}
      >
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          disabled={disabled || submitting}
          rows={2}
          placeholder={isInternalNote ? 'Write a confidential staff note...' : placeholder}
          className="w-full px-3 py-2 text-sm text-[#111111] placeholder-[#9CA3AF] bg-transparent resize-none focus:outline-none max-h-40"
        />

        {/* Toolbar & Actions */}
        <div className="flex items-center justify-between px-3 py-1.5 border-t border-[#E5E7EB]/60">
          <div className="flex items-center gap-2">
            {isStaff && (
              <button
                type="button"
                onClick={() => setIsInternalNote(!isInternalNote)}
                className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors ${
                  isInternalNote
                    ? 'bg-amber-200 text-amber-900 border border-amber-300'
                    : 'text-[#6B7280] hover:text-[#111111] hover:bg-[#E5E7EB]'
                }`}
                title="Toggle internal note"
              >
                <Lock className="w-3 h-3" />
                <span>Note</span>
              </button>
            )}

            <button
              type="button"
              className="p-1 text-[#9CA3AF] hover:text-[#111111] rounded hover:bg-[#E5E7EB] transition-colors"
              title="Attach file (Optional)"
              onClick={() => alert('Attachments can be dropped or uploaded using database storage.')}
            >
              <Paperclip className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#9CA3AF] hidden sm:inline">
              Press <kbd className="px-1 py-0.5 font-mono text-[10px] bg-[#E5E7EB] rounded">Enter ↵</kbd> to send
            </span>

            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={!content.trim() || submitting || disabled}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors shadow-xs ${
                !content.trim() || submitting || disabled
                  ? 'bg-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed'
                  : isInternalNote
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-[#111111] hover:bg-[#242424] text-white'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Sending...' : isInternalNote ? 'Add Note' : 'Send'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error feedback with retry prompt */}
      {error && (
        <div className="mt-2 text-xs text-rose-600 flex items-center justify-between">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => handleSubmit()}
            className="font-semibold underline hover:text-rose-700 ml-2"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
};
