-- Create community chat messages table for group and private messaging
CREATE TABLE public.community_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  recipient_id UUID, -- NULL for group messages, user_id for private messages
  content TEXT,
  message_type TEXT NOT NULL DEFAULT 'text', -- 'text', 'image', 'file', 'voice', 'system'
  file_url TEXT,
  file_name TEXT,
  file_size INTEGER,
  is_pinned BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  reply_to_id UUID REFERENCES public.community_messages(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create message reactions table
CREATE TABLE public.message_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.community_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

-- Create message read receipts table
CREATE TABLE public.message_read_receipts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.community_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id)
);

-- Create user presence table for online status
CREATE TABLE public.user_presence (
  user_id UUID NOT NULL PRIMARY KEY,
  community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'offline', -- 'online', 'away', 'offline'
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_typing BOOLEAN DEFAULT false,
  typing_in_chat UUID, -- message thread or community id
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create community bans table for moderation
CREATE TABLE public.community_bans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  banned_by UUID NOT NULL,
  reason TEXT,
  banned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE, -- NULL for permanent ban
  UNIQUE(community_id, user_id)
);

-- Create community mutes table for moderation
CREATE TABLE public.community_mutes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  muted_by UUID NOT NULL,
  reason TEXT,
  muted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE, -- NULL for permanent mute
  UNIQUE(community_id, user_id)
);

-- Create announcements table
CREATE TABLE public.community_announcements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create call logs table for voice/video calls
CREATE TABLE public.community_calls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  caller_id UUID NOT NULL,
  call_type TEXT NOT NULL, -- 'voice', 'video', 'group_voice', 'group_video'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'active', 'ended', 'missed', 'declined'
  channel_name TEXT, -- For Agora/Twilio channel
  participants UUID[] DEFAULT '{}',
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_read_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_mutes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_calls ENABLE ROW LEVEL SECURITY;

-- RLS Policies for community_messages
CREATE POLICY "Community members can view group messages"
ON public.community_messages FOR SELECT
USING (
  recipient_id IS NULL AND
  EXISTS (
    SELECT 1 FROM community_members 
    WHERE community_members.community_id = community_messages.community_id 
    AND community_members.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view their private messages"
ON public.community_messages FOR SELECT
USING (
  recipient_id IS NOT NULL AND
  (sender_id = auth.uid() OR recipient_id = auth.uid())
);

CREATE POLICY "Community owners can view all messages"
ON public.community_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM communities 
    WHERE communities.id = community_messages.community_id 
    AND communities.owner_id = auth.uid()
  )
);

CREATE POLICY "Members can send messages"
ON public.community_messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM community_members 
    WHERE community_members.community_id = community_messages.community_id 
    AND community_members.user_id = auth.uid()
    AND community_members.subscription_status = 'active'
  ) AND
  NOT EXISTS (
    SELECT 1 FROM community_mutes 
    WHERE community_mutes.community_id = community_messages.community_id 
    AND community_mutes.user_id = auth.uid()
    AND (expires_at IS NULL OR expires_at > now())
  ) AND
  NOT EXISTS (
    SELECT 1 FROM community_bans 
    WHERE community_bans.community_id = community_messages.community_id 
    AND community_bans.user_id = auth.uid()
    AND (expires_at IS NULL OR expires_at > now())
  )
);

CREATE POLICY "Owners can send messages"
ON public.community_messages FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM communities 
    WHERE communities.id = community_messages.community_id 
    AND communities.owner_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own messages"
ON public.community_messages FOR UPDATE
USING (auth.uid() = sender_id);

CREATE POLICY "Owners can moderate messages"
ON public.community_messages FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM communities 
    WHERE communities.id = community_messages.community_id 
    AND communities.owner_id = auth.uid()
  )
);

-- RLS Policies for message_reactions
CREATE POLICY "Members can view reactions"
ON public.message_reactions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM community_messages cm
    JOIN community_members mem ON mem.community_id = cm.community_id
    WHERE cm.id = message_reactions.message_id
    AND mem.user_id = auth.uid()
  )
);

CREATE POLICY "Members can add reactions"
ON public.message_reactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own reactions"
ON public.message_reactions FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for message_read_receipts
CREATE POLICY "Users can view read receipts"
ON public.message_read_receipts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can mark messages as read"
ON public.message_read_receipts FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_presence
CREATE POLICY "Anyone can view presence"
ON public.user_presence FOR SELECT
USING (true);

CREATE POLICY "Users can update own presence"
ON public.user_presence FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own presence status"
ON public.user_presence FOR UPDATE
USING (auth.uid() = user_id);

-- RLS Policies for community_bans
CREATE POLICY "Owners can view bans"
ON public.community_bans FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM communities 
    WHERE communities.id = community_bans.community_id 
    AND communities.owner_id = auth.uid()
  )
);

CREATE POLICY "Owners can ban users"
ON public.community_bans FOR INSERT
WITH CHECK (
  auth.uid() = banned_by AND
  EXISTS (
    SELECT 1 FROM communities 
    WHERE communities.id = community_bans.community_id 
    AND communities.owner_id = auth.uid()
  )
);

CREATE POLICY "Owners can unban users"
ON public.community_bans FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM communities 
    WHERE communities.id = community_bans.community_id 
    AND communities.owner_id = auth.uid()
  )
);

-- RLS Policies for community_mutes
CREATE POLICY "Owners can view mutes"
ON public.community_mutes FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM communities 
    WHERE communities.id = community_mutes.community_id 
    AND communities.owner_id = auth.uid()
  )
);

CREATE POLICY "Owners can mute users"
ON public.community_mutes FOR INSERT
WITH CHECK (
  auth.uid() = muted_by AND
  EXISTS (
    SELECT 1 FROM communities 
    WHERE communities.id = community_mutes.community_id 
    AND communities.owner_id = auth.uid()
  )
);

CREATE POLICY "Owners can unmute users"
ON public.community_mutes FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM communities 
    WHERE communities.id = community_mutes.community_id 
    AND communities.owner_id = auth.uid()
  )
);

-- RLS Policies for community_announcements
CREATE POLICY "Members can view announcements"
ON public.community_announcements FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM community_members 
    WHERE community_members.community_id = community_announcements.community_id 
    AND community_members.user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM communities 
    WHERE communities.id = community_announcements.community_id 
    AND communities.owner_id = auth.uid()
  )
);

CREATE POLICY "Owners can create announcements"
ON public.community_announcements FOR INSERT
WITH CHECK (
  auth.uid() = author_id AND
  EXISTS (
    SELECT 1 FROM communities 
    WHERE communities.id = community_announcements.community_id 
    AND communities.owner_id = auth.uid()
  )
);

CREATE POLICY "Owners can update announcements"
ON public.community_announcements FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM communities 
    WHERE communities.id = community_announcements.community_id 
    AND communities.owner_id = auth.uid()
  )
);

CREATE POLICY "Owners can delete announcements"
ON public.community_announcements FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM communities 
    WHERE communities.id = community_announcements.community_id 
    AND communities.owner_id = auth.uid()
  )
);

-- RLS Policies for community_calls
CREATE POLICY "Members can view calls"
ON public.community_calls FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM community_members 
    WHERE community_members.community_id = community_calls.community_id 
    AND community_members.user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM communities 
    WHERE communities.id = community_calls.community_id 
    AND communities.owner_id = auth.uid()
  )
);

CREATE POLICY "Members can initiate calls"
ON public.community_calls FOR INSERT
WITH CHECK (
  auth.uid() = caller_id AND
  (
    EXISTS (
      SELECT 1 FROM community_members 
      WHERE community_members.community_id = community_calls.community_id 
      AND community_members.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM communities 
      WHERE communities.id = community_calls.community_id 
      AND communities.owner_id = auth.uid()
    )
  )
);

CREATE POLICY "Participants can update call status"
ON public.community_calls FOR UPDATE
USING (
  auth.uid() = caller_id OR
  auth.uid() = ANY(participants)
);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_presence;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;

-- Create storage bucket for chat files
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-files', 'chat-files', false);

-- Storage policies for chat files
CREATE POLICY "Members can upload chat files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'chat-files');

CREATE POLICY "Members can view chat files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'chat-files');

-- Add profiles table for user display info
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view profiles"
ON public.profiles FOR SELECT
USING (true);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, user_id, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();