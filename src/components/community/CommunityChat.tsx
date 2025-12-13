import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import { useCommunityChat, type Message } from '@/hooks/useCommunityChat';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { supabase } from '@/integrations/supabase/client';

interface CommunityChatProps {
  communityId: string;
  ownerId: string;
  recipientId?: string;
  recipientName?: string;
}

export function CommunityChat({ 
  communityId, 
  ownerId, 
  recipientId,
  recipientName 
}: CommunityChatProps) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { 
    messages, 
    isLoading, 
    typingUsers,
    sendMessage, 
    deleteMessage, 
    togglePinMessage,
    setTyping 
  } = useCommunityChat(communityId, recipientId);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id || null);
    });
  }, []);

  useEffect(() => {
    // Scroll to bottom on new messages
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const isOwner = currentUserId === ownerId;
  const pinnedMessages = messages.filter(m => m.is_pinned);

  if (isLoading) {
    return (
      <Card className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </Card>
    );
  }

  return (
    <Card className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b">
        <h3 className="font-semibold">
          {recipientId ? `Chat with ${recipientName}` : 'Group Chat'}
        </h3>
        {typingUsers.length > 0 && (
          <p className="text-sm text-muted-foreground animate-pulse">
            Someone is typing...
          </p>
        )}
      </div>

      {/* Pinned Messages */}
      {pinnedMessages.length > 0 && (
        <div className="px-4 py-2 bg-primary/5 border-b">
          <p className="text-xs font-medium text-primary mb-1">
            📌 Pinned Messages
          </p>
          {pinnedMessages.slice(0, 2).map(msg => (
            <p key={msg.id} className="text-sm text-muted-foreground truncate">
              <span className="font-medium">{msg.sender?.display_name}: </span>
              {msg.content}
            </p>
          ))}
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-1">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                isOwn={message.sender_id === currentUserId}
                isOwner={isOwner}
                onDelete={deleteMessage}
                onPin={togglePinMessage}
                onReply={setReplyTo}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <ChatInput
        onSend={sendMessage}
        onTyping={setTyping}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        communityId={communityId}
      />
    </Card>
  );
}
