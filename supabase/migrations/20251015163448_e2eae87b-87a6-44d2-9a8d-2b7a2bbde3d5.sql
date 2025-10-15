-- Create communities table
CREATE TABLE public.communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  subscription_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  theme_color TEXT DEFAULT '#1E40AF',
  banner_url TEXT,
  logo_url TEXT,
  is_public BOOLEAN DEFAULT true,
  member_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;

-- Community owners can manage their communities
CREATE POLICY "Owners can view own communities"
  ON public.communities FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can create communities"
  ON public.communities FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update own communities"
  ON public.communities FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete own communities"
  ON public.communities FOR DELETE
  USING (auth.uid() = owner_id);

-- Public communities are viewable by everyone
CREATE POLICY "Anyone can view public communities"
  ON public.communities FOR SELECT
  USING (is_public = true);

-- Create community members table
CREATE TABLE public.community_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT now(),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'expired')),
  UNIQUE(community_id, user_id)
);

-- Enable RLS
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;

-- Members can view their own memberships
CREATE POLICY "Users can view own memberships"
  ON public.community_members FOR SELECT
  USING (auth.uid() = user_id);

-- Community owners can view all members
CREATE POLICY "Owners can view community members"
  ON public.community_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.communities
      WHERE communities.id = community_members.community_id
      AND communities.owner_id = auth.uid()
    )
  );

-- Add trigger for updated_at
CREATE TRIGGER update_communities_updated_at
  BEFORE UPDATE ON public.communities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();