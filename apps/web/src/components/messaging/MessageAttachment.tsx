import React from 'react';
import { FileText, Download, Image as ImageIcon } from 'lucide-react';
import { MessageAttachment as AttachmentType } from '../../features/messaging/types';

interface MessageAttachmentProps {
  attachments?: AttachmentType[];
  className?: string;
}

export const MessageAttachment: React.FC<MessageAttachmentProps> = ({
  attachments = [],
  className = '',
}) => {
  if (!attachments || attachments.length === 0) return null;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={`space-y-1.5 mt-2 ${className}`}>
      {attachments.map((att) => {
        const isImage = att.mime_type.startsWith('image/');
        return (
          <div
            key={att.id}
            className="flex items-center justify-between p-2 rounded-lg bg-white border border-[#E5E7EB] hover:border-[#D1D5DB] transition-colors max-w-sm"
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded bg-[#F8F9FA] border border-[#E5E7EB] flex items-center justify-center text-[#6B7280] shrink-0">
                {isImage ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-[#111111] truncate">{att.file_name}</p>
                <p className="text-[11px] text-[#6B7280]">{formatFileSize(att.file_size)}</p>
              </div>
            </div>
            <a
              href={att.file_path}
              target="_blank"
              rel="noopener noreferrer"
              download={att.file_name}
              className="p-1.5 text-[#6B7280] hover:text-[#111111] hover:bg-[#F3F4F6] rounded transition-colors"
              title="Download file"
            >
              <Download className="w-3.5 h-3.5" />
            </a>
          </div>
        );
      })}
    </div>
  );
};
