import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff,
  Users,
  Loader2,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VideoCallProps {
  communityId: string;
  callType: 'voice' | 'video' | 'group_voice' | 'group_video';
  channelName: string;
  onEnd: () => void;
}

export function VideoCall({ communityId, callType, channelName, onEnd }: VideoCallProps) {
  const [isConnecting, setIsConnecting] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(callType.includes('video'));
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [participants, setParticipants] = useState<string[]>([]);
  const [callDuration, setCallDuration] = useState(0);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const callStartTimeRef = useRef<number>(0);

  useEffect(() => {
    initializeCall();
    return () => {
      cleanupCall();
    };
  }, []);

  useEffect(() => {
    if (!isConnecting) {
      callStartTimeRef.current = Date.now();
      const interval = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - callStartTimeRef.current) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isConnecting]);

  const initializeCall = async () => {
    try {
      // Get Agora token
      const { data, error } = await supabase.functions.invoke('generate-agora-token', {
        body: { channelName, role: 'publisher' }
      });

      if (error) throw error;

      console.log('Agora token received:', data);

      // Get local media stream
      const constraints = {
        video: callType.includes('video'),
        audio: true
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;

      if (localVideoRef.current && callType.includes('video')) {
        localVideoRef.current.srcObject = stream;
      }

      // In a real implementation, you would initialize the Agora SDK here
      // For now, we'll simulate the connection
      setTimeout(() => {
        setIsConnecting(false);
        toast.success('Connected to call');
      }, 2000);

    } catch (error: any) {
      console.error('Call initialization error:', error);
      toast.error('Failed to start call: ' + error.message);
      onEnd();
    }
  };

  const cleanupCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const endCall = async () => {
    cleanupCall();
    
    // Update call record
    try {
      await supabase
        .from('community_calls')
        .update({
          status: 'ended',
          ended_at: new Date().toISOString(),
          duration_seconds: callDuration
        })
        .eq('channel_name', channelName);
    } catch (error) {
      console.error('Error updating call record:', error);
    }

    onEnd();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isConnecting) {
    return (
      <Card className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg font-medium">Connecting to call...</p>
          <p className="text-sm text-muted-foreground mt-2">
            Please allow camera and microphone access
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`fixed z-50 bg-background/95 backdrop-blur ${
      isFullscreen ? 'inset-0' : 'bottom-4 right-4 w-96 h-[500px]'
    } flex flex-col`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
          <span className="font-medium">
            {callType.includes('group') ? 'Group Call' : 'Call'}
          </span>
          <span className="text-muted-foreground">{formatDuration(callDuration)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          {callType.includes('group') && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              {participants.length + 1}
            </div>
          )}
        </div>
      </div>

      {/* Video Area */}
      <div className="flex-1 relative bg-secondary/20 overflow-hidden">
        {callType.includes('video') ? (
          <>
            {/* Remote Video */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            
            {/* Local Video (Picture-in-Picture) */}
            <div className="absolute bottom-4 right-4 w-32 h-24 rounded-lg overflow-hidden shadow-lg border-2 border-background">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {!isVideoEnabled && (
                <div className="absolute inset-0 bg-secondary flex items-center justify-center">
                  <VideoOff className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>
          </>
        ) : (
          /* Voice Call UI */
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Phone className="h-12 w-12 text-primary" />
              </div>
              <p className="text-lg font-medium">Voice Call</p>
              <p className="text-sm text-muted-foreground">{formatDuration(callDuration)}</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 p-4 border-t">
        <Button
          variant={isAudioEnabled ? 'secondary' : 'destructive'}
          size="icon"
          className="h-12 w-12 rounded-full"
          onClick={toggleAudio}
        >
          {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
        </Button>

        {callType.includes('video') && (
          <Button
            variant={isVideoEnabled ? 'secondary' : 'destructive'}
            size="icon"
            className="h-12 w-12 rounded-full"
            onClick={toggleVideo}
          >
            {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
          </Button>
        )}

        <Button
          variant="destructive"
          size="icon"
          className="h-14 w-14 rounded-full"
          onClick={endCall}
        >
          <PhoneOff className="h-6 w-6" />
        </Button>
      </div>
    </Card>
  );
}
