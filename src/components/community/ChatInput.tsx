import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Send, 
  Paperclip, 
  Image as ImageIcon, 
  X, 
  Smile,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Message } from '@/hooks/useCommunityChat';

interface ChatInputProps {
  onSend: (
    content: string, 
    type?: string, 
    fileUrl?: string, 
    fileName?: string, 
    fileSize?: number,
    replyToId?: string
  ) => Promise<boolean>;
  onTyping: (isTyping: boolean) => void;
  replyTo?: Message | null;
  onCancelReply?: () => void;
  communityId: string;
}

export function ChatInput({ 
  onSend, 
  onTyping, 
  replyTo, 
  onCancelReply,
  communityId 
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (replyTo && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [replyTo]);

  const handleTyping = () => {
    onTyping(true);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      onTyping(false);
    }, 2000);
  };

  const handleSend = async () => {
    if (!message.trim() && !isUploading) return;
    
    setIsSending(true);
    const success = await onSend(
      message.trim(), 
      'text', 
      undefined, 
      undefined, 
      undefined,
      replyTo?.id
    );
    
    if (success) {
      setMessage('');
      onCancelReply?.();
    }
    setIsSending(false);
    onTyping(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const uploadFile = async (file: File, type: 'file' | 'image') => {
    if (file.size > 15 * 1024 * 1024) {
      toast.error('File size must be less than 15MB');
      return;
    }

    setIsUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('chat-files')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-files')
        .getPublicUrl(fileName);

      await onSend(
        type === 'image' ? '📷 Image' : `📎 ${file.name}`,
        type,
        publicUrl,
        file.name,
        file.size,
        replyTo?.id
      );
      
      onCancelReply?.();
      toast.success('File uploaded');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="border-t bg-background p-4">
      {replyTo && (
        <div className="flex items-center gap-2 mb-2 p-2 bg-secondary/50 rounded-lg">
          <div className="flex-1 text-sm">
            <span className="text-muted-foreground">Replying to </span>
            <span className="font-medium">{replyTo.sender?.display_name}</span>
            <p className="text-muted-foreground truncate">{replyTo.content}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onCancelReply}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      <div className="flex items-end gap-2">
        <div className="flex gap-1">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], 'file')}
          />
          <input
            type="file"
            ref={imageInputRef}
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0], 'image')}
          />
          
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <Paperclip className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => imageInputRef.current?.click()}
            disabled={isUploading}
          >
            <ImageIcon className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              handleTyping();
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="min-h-[44px] max-h-[120px] resize-none pr-12"
            rows={1}
          />
        </div>

        <Button 
          onClick={handleSend}
          disabled={(!message.trim() && !isUploading) || isSending}
          className="h-11 w-11"
        >
          {isSending || isUploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  );
}
