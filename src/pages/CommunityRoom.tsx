import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  MessageCircle, 
  Users, 
  Phone, 
  Video,
  Megaphone,
  Settings,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CommunityChat } from '@/components/community/CommunityChat';
import { MembersList } from '@/components/community/MembersList';
import { AnnouncementsPanel } from '@/components/community/AnnouncementsPanel';
import { VideoCall } from '@/components/community/VideoCall';

interface Community {
  id: string;
  name: string;
  description: string;
  owner_id: string;
  theme_color: string;
  member_count: number;
}

export default function CommunityRoom() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [community, setCommunity] = useState<Community | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [activeCall, setActiveCall] = useState<{
    type: 'voice' | 'video' | 'group_voice' | 'group_video';
    channelName: string;
  } | null>(null);
  const [privateChat, setPrivateChat] = useState<{
    recipientId: string;
    recipientName: string;
  } | null>(null);

  useEffect(() => {
    if (id) {
      checkAuthAndFetch();
    }
  }, [id]);

  const checkAuthAndFetch = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Please login to access community');
      navigate('/login');
      return;
    }

    setCurrentUserId(user.id);
    await fetchCommunity(user.id);
  };

  const fetchCommunity = async (userId: string) => {
    try {
      // Fetch community
      const { data: communityData, error: communityError } = await supabase
        .from('communities')
        .select('*')
        .eq('id', id)
        .single();

      if (communityError) throw communityError;
      setCommunity(communityData);

      // Check membership
      const isOwner = communityData.owner_id === userId;
      if (!isOwner) {
        const { data: memberData } = await supabase
          .from('community_members')
          .select('id')
          .eq('community_id', id)
          .eq('user_id', userId)
          .eq('subscription_status', 'active')
          .single();

        if (!memberData) {
          toast.error('You are not a member of this community');
          navigate('/communities');
          return;
        }
      }

      setIsMember(true);

      // Update presence
      await supabase.from('user_presence').upsert({
        user_id: userId,
        community_id: id,
        status: 'online',
        last_seen: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error fetching community:', error);
      toast.error('Failed to load community');
      navigate('/communities');
    } finally {
      setIsLoading(false);
    }
  };

  const startCall = async (recipientId: string | null, type: 'voice' | 'video' | 'group_voice' | 'group_video') => {
    if (!currentUserId || !id) return;

    const channelName = `${id}-${Date.now()}`;

    try {
      // Create call record
      const { error } = await supabase
        .from('community_calls')
        .insert({
          community_id: id,
          caller_id: currentUserId,
          call_type: type,
          channel_name: channelName,
          status: 'pending',
          started_at: new Date().toISOString()
        });

      if (error) throw error;

      setActiveCall({ type, channelName });
    } catch (error) {
      console.error('Error starting call:', error);
      toast.error('Failed to start call');
    }
  };

  const handleStartPrivateChat = (recipientId: string, recipientName: string) => {
    setPrivateChat({ recipientId, recipientName });
  };

  const handleStartCall = (recipientId: string, type: 'voice' | 'video') => {
    startCall(recipientId, type);
  };

  // Update presence on unmount
  useEffect(() => {
    return () => {
      if (currentUserId && id) {
        supabase.from('user_presence').upsert({
          user_id: currentUserId,
          community_id: id,
          status: 'offline',
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    };
  }, [currentUserId, id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!community) {
    return null;
  }

  const isOwner = currentUserId === community.owner_id;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <div className="flex-1 pt-20 pb-8 px-4">
        <div className="container mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" onClick={() => navigate('/communities')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div 
              className="h-10 w-1 rounded"
              style={{ backgroundColor: community.theme_color }}
            />
            <div>
              <h1 className="text-2xl font-bold">{community.name}</h1>
              <p className="text-muted-foreground">{community.member_count} members</p>
            </div>
            
            <div className="ml-auto flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => startCall(null, 'group_voice')}
              >
                <Phone className="h-4 w-4 mr-2" />
                Group Call
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => startCall(null, 'group_video')}
              >
                <Video className="h-4 w-4 mr-2" />
                Video Call
              </Button>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-4">
              <AnnouncementsPanel 
                communityId={community.id} 
                isOwner={isOwner} 
              />
              <MembersList
                communityId={community.id}
                ownerId={community.owner_id}
                isOwner={isOwner}
                onStartPrivateChat={handleStartPrivateChat}
                onStartCall={handleStartCall}
              />
            </div>

            {/* Chat Area */}
            <div className="lg:col-span-3 h-[calc(100vh-16rem)]">
              <Tabs defaultValue="group" className="h-full flex flex-col">
                <TabsList className="w-fit">
                  <TabsTrigger value="group" onClick={() => setPrivateChat(null)}>
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Group Chat
                  </TabsTrigger>
                  {privateChat && (
                    <TabsTrigger value="private">
                      <Users className="h-4 w-4 mr-2" />
                      {privateChat.recipientName}
                    </TabsTrigger>
                  )}
                </TabsList>

                <TabsContent value="group" className="flex-1 mt-4">
                  <CommunityChat
                    communityId={community.id}
                    ownerId={community.owner_id}
                  />
                </TabsContent>

                {privateChat && (
                  <TabsContent value="private" className="flex-1 mt-4">
                    <CommunityChat
                      communityId={community.id}
                      ownerId={community.owner_id}
                      recipientId={privateChat.recipientId}
                      recipientName={privateChat.recipientName}
                    />
                  </TabsContent>
                )}
              </Tabs>
            </div>
          </div>
        </div>
      </div>

      {/* Active Call */}
      {activeCall && (
        <VideoCall
          communityId={community.id}
          callType={activeCall.type}
          channelName={activeCall.channelName}
          onEnd={() => setActiveCall(null)}
        />
      )}

      <Footer />
    </div>
  );
}
