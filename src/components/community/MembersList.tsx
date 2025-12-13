import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  MessageCircle, 
  Phone, 
  Video, 
  MoreVertical, 
  Ban, 
  VolumeX,
  Crown,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Member {
  id: string;
  user_id: string;
  subscription_status: string;
  joined_at: string;
  profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
  presence?: {
    status: string;
    last_seen: string;
  };
}

interface MembersListProps {
  communityId: string;
  ownerId: string;
  isOwner: boolean;
  onStartPrivateChat: (userId: string, userName: string) => void;
  onStartCall: (userId: string, type: 'voice' | 'video') => void;
}

export function MembersList({ 
  communityId, 
  ownerId, 
  isOwner,
  onStartPrivateChat,
  onStartCall
}: MembersListProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMembers();

    // Subscribe to presence updates
    const channel = supabase
      .channel(`members-presence-${communityId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence',
          filter: `community_id=eq.${communityId}`,
        },
        () => fetchMembers()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [communityId]);

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('community_members')
        .select('*')
        .eq('community_id', communityId)
        .eq('subscription_status', 'active');

      if (error) throw error;

      const userIds = data?.map(m => m.user_id) || [];
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, user_id, display_name, avatar_url')
        .in('user_id', userIds);

      const { data: presenceData } = await supabase
        .from('user_presence')
        .select('*')
        .in('user_id', userIds);

      const membersWithData = data?.map(member => ({
        ...member,
        profile: profiles?.find(p => p.user_id === member.user_id),
        presence: presenceData?.find(p => p.user_id === member.user_id)
      })) || [];

      membersWithData.sort((a, b) => {
        if (a.presence?.status === 'online' && b.presence?.status !== 'online') return -1;
        if (a.presence?.status !== 'online' && b.presence?.status === 'online') return 1;
        return 0;
      });

      setMembers(membersWithData as Member[]);
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const banMember = async (userId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      await supabase.from('community_bans').insert({
        community_id: communityId,
        user_id: userId,
        banned_by: user.id,
        reason: 'Banned by community owner'
      });
      toast.success('Member banned');
      fetchMembers();
    } catch (error) {
      console.error('Error banning member:', error);
      toast.error('Failed to ban member');
    }
  };

  const muteMember = async (userId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      await supabase.from('community_mutes').insert({
        community_id: communityId,
        user_id: userId,
        muted_by: user.id,
        reason: 'Muted by community owner'
      });
      toast.success('Member muted');
    } catch (error) {
      console.error('Error muting member:', error);
      toast.error('Failed to mute member');
    }
  };

  if (isLoading) {
    return (
      <Card className="p-4">
        <Loader2 className="h-6 w-6 animate-spin mx-auto" />
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Members ({members.length})</h3>
      </div>

      <ScrollArea className="h-[400px]">
        <div className="space-y-2">
          {members.map((member) => {
            const displayName = member.profile?.display_name || 'Unknown';
            const initials = displayName.slice(0, 2).toUpperCase();
            const isOnline = member.presence?.status === 'online';
            const isMemberOwner = member.user_id === ownerId;

            return (
              <div 
                key={member.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors"
              >
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={member.profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${
                    isOnline ? 'bg-green-500' : 'bg-muted'
                  }`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{displayName}</span>
                    {isMemberOwner && (
                      <Crown className="h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isOnline ? 'Online' : 'Offline'}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => onStartPrivateChat(member.user_id, displayName)}
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => onStartCall(member.user_id, 'voice')}
                  >
                    <Phone className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => onStartCall(member.user_id, 'video')}
                  >
                    <Video className="h-4 w-4" />
                  </Button>

                  {isOwner && !isMemberOwner && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => muteMember(member.user_id)}>
                          <VolumeX className="h-4 w-4 mr-2" />
                          Mute
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => banMember(member.user_id)}
                          className="text-destructive"
                        >
                          <Ban className="h-4 w-4 mr-2" />
                          Ban
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </Card>
  );
}
