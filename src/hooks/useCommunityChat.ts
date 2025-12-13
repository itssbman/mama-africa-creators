import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Message {
  id: string;
  community_id: string;
  sender_id: string;
  recipient_id: string | null;
  content: string | null;
  message_type: string;
  file_url: string | null;
  file_name: string | null;
  file_size: number | null;
  is_pinned: boolean;
  is_deleted: boolean;
  reply_to_id: string | null;
  created_at: string;
  updated_at: string;
  sender?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export interface Presence {
  user_id: string;
  status: string;
  last_seen: string;
  is_typing: boolean;
  typing_in_chat: string | null;
}

export function useCommunityChat(communityId: string, recipientId?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState<Presence[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!communityId) return;

    try {
      let query = supabase
        .from('community_messages')
        .select('*')
        .eq('community_id', communityId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (recipientId) {
        query = query.or(`recipient_id.eq.${recipientId},and(sender_id.eq.${recipientId},recipient_id.is.not.null)`);
      } else {
        query = query.is('recipient_id', null);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch profiles separately
      const senderIds = [...new Set(data?.map(m => m.sender_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('user_id', senderIds);

      const messagesWithSender = (data || []).map(msg => ({
        ...msg,
        sender: profiles?.find(p => p.id === msg.sender_id) || null
      }));

      setMessages(messagesWithSender as Message[]);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [communityId, recipientId]);

  // Send message
  const sendMessage = useCallback(async (
    content: string,
    messageType: string = 'text',
    fileUrl?: string,
    fileName?: string,
    fileSize?: number,
    replyToId?: string
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('You must be logged in to send messages');
      return false;
    }

    try {
      const { error } = await supabase
        .from('community_messages')
        .insert({
          community_id: communityId,
          sender_id: user.id,
          recipient_id: recipientId || null,
          content,
          message_type: messageType,
          file_url: fileUrl || null,
          file_name: fileName || null,
          file_size: fileSize || null,
          reply_to_id: replyToId || null,
        });

      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      return false;
    }
  }, [communityId, recipientId]);

  // Delete message
  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('community_messages')
        .update({ is_deleted: true })
        .eq('id', messageId);

      if (error) throw error;
      toast.success('Message deleted');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    }
  }, []);

  // Pin/Unpin message
  const togglePinMessage = useCallback(async (messageId: string, isPinned: boolean) => {
    try {
      const { error } = await supabase
        .from('community_messages')
        .update({ is_pinned: !isPinned })
        .eq('id', messageId);

      if (error) throw error;
      toast.success(isPinned ? 'Message unpinned' : 'Message pinned');
    } catch (error) {
      console.error('Error toggling pin:', error);
      toast.error('Failed to update message');
    }
  }, []);

  // Update typing status
  const setTyping = useCallback(async (isTyping: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      await supabase
        .from('user_presence')
        .upsert({
          user_id: user.id,
          community_id: communityId,
          is_typing: isTyping,
          typing_in_chat: isTyping ? communityId : null,
          status: 'online',
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
    } catch (error) {
      console.error('Error updating typing status:', error);
    }
  }, [communityId]);

  // Subscribe to realtime updates
  useEffect(() => {
    fetchMessages();

    // Subscribe to new messages
    const messagesChannel = supabase
      .channel(`messages-${communityId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'community_messages',
          filter: `community_id=eq.${communityId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            fetchMessages();
          } else if (payload.eventType === 'UPDATE') {
            setMessages(prev => 
              prev.map(msg => 
                msg.id === payload.new.id ? { ...msg, ...payload.new } : msg
              )
            );
          }
        }
      )
      .subscribe();

    // Subscribe to presence updates
    const presenceChannel = supabase
      .channel(`presence-${communityId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence',
          filter: `community_id=eq.${communityId}`,
        },
        (payload) => {
          if (payload.new) {
            const presence = payload.new as Presence;
            if (presence.is_typing && presence.typing_in_chat === communityId) {
              setTypingUsers(prev => 
                prev.includes(presence.user_id) ? prev : [...prev, presence.user_id]
              );
            } else {
              setTypingUsers(prev => prev.filter(id => id !== presence.user_id));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(presenceChannel);
    };
  }, [communityId, fetchMessages]);

  return {
    messages,
    isLoading,
    onlineUsers,
    typingUsers,
    sendMessage,
    deleteMessage,
    togglePinMessage,
    setTyping,
    refetch: fetchMessages,
  };
}
