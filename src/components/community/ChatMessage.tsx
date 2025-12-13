import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  MoreVertical, 
  Pin, 
  Trash2, 
  Reply, 
  FileIcon, 
  Image as ImageIcon,
  Download
} from 'lucide-react';
import type { Message } from '@/hooks/useCommunityChat';

interface ChatMessageProps {
  message: Message;
  isOwn: boolean;
  isOwner: boolean;
  onDelete: (id: string) => void;
  onPin: (id: string, isPinned: boolean) => void;
  onReply: (message: Message) => void;
}

export function ChatMessage({ 
  message, 
  isOwn, 
  isOwner, 
  onDelete, 
  onPin, 
  onReply 
}: ChatMessageProps) {
  const senderName = message.sender?.display_name || 'Unknown User';
  const initials = senderName.slice(0, 2).toUpperCase();
  
  const renderContent = () => {
    if (message.message_type === 'image' && message.file_url) {
      return (
        <div className="mt-2">
          <img 
            src={message.file_url} 
            alt="Shared image" 
            className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => window.open(message.file_url!, '_blank')}
          />
        </div>
      );
    }
    
    if (message.message_type === 'file' && message.file_url) {
      return (
        <a 
          href={message.file_url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-2 p-3 mt-2 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors"
        >
          <FileIcon className="h-8 w-8 text-primary" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{message.file_name}</p>
            {message.file_size && (
              <p className="text-xs text-muted-foreground">
                {(message.file_size / 1024).toFixed(1)} KB
              </p>
            )}
          </div>
          <Download className="h-4 w-4 text-muted-foreground" />
        </a>
      );
    }

    return message.content && (
      <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
    );
  };

  return (
    <div className={`group flex gap-3 p-3 rounded-lg hover:bg-secondary/30 transition-colors ${
      message.is_pinned ? 'bg-primary/5 border-l-2 border-primary' : ''
    } ${isOwn ? 'flex-row-reverse' : ''}`}>
      <Avatar className="h-10 w-10 flex-shrink-0">
        <AvatarImage src={message.sender?.avatar_url || undefined} />
        <AvatarFallback className="bg-primary/10 text-primary text-sm">
          {initials}
        </AvatarFallback>
      </Avatar>
      
      <div className={`flex-1 min-w-0 ${isOwn ? 'text-right' : ''}`}>
        <div className={`flex items-center gap-2 ${isOwn ? 'justify-end' : ''}`}>
          <span className="font-medium text-sm">{senderName}</span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
          </span>
          {message.is_pinned && (
            <Pin className="h-3 w-3 text-primary" />
          )}
        </div>
        
        <div className={`mt-1 ${isOwn ? 'flex justify-end' : ''}`}>
          <div className={`inline-block max-w-[80%] ${
            isOwn ? 'bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-2' : ''
          }`}>
            {renderContent()}
          </div>
        </div>
      </div>

      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={isOwn ? 'start' : 'end'}>
            <DropdownMenuItem onClick={() => onReply(message)}>
              <Reply className="h-4 w-4 mr-2" />
              Reply
            </DropdownMenuItem>
            {(isOwn || isOwner) && (
              <>
                <DropdownMenuItem onClick={() => onPin(message.id, message.is_pinned)}>
                  <Pin className="h-4 w-4 mr-2" />
                  {message.is_pinned ? 'Unpin' : 'Pin'}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDelete(message.id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
