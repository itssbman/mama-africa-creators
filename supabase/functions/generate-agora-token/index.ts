import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// RTC token builder implementation
const Role = {
  PUBLISHER: 1,
  SUBSCRIBER: 2,
};

const Privileges = {
  kJoinChannel: 1,
  kPublishAudioStream: 2,
  kPublishVideoStream: 3,
  kPublishDataStream: 4,
};

function encodeUint16(value: number): Uint8Array {
  const buffer = new Uint8Array(2);
  buffer[0] = value & 0xff;
  buffer[1] = (value >> 8) & 0xff;
  return buffer;
}

function encodeUint32(value: number): Uint8Array {
  const buffer = new Uint8Array(4);
  buffer[0] = value & 0xff;
  buffer[1] = (value >> 8) & 0xff;
  buffer[2] = (value >> 16) & 0xff;
  buffer[3] = (value >> 24) & 0xff;
  return buffer;
}

function encodeString(str: string): Uint8Array {
  const encoder = new TextEncoder();
  const strBytes = encoder.encode(str);
  const buffer = new Uint8Array(2 + strBytes.length);
  buffer.set(encodeUint16(strBytes.length), 0);
  buffer.set(strBytes, 2);
  return buffer;
}

function encodeMapUint32(map: Map<number, number>): Uint8Array {
  const parts: Uint8Array[] = [];
  parts.push(encodeUint16(map.size));
  map.forEach((value, key) => {
    parts.push(encodeUint16(key));
    parts.push(encodeUint32(value));
  });
  const totalLength = parts.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  parts.forEach(part => {
    result.set(part, offset);
    offset += part.length;
  });
  return result;
}

async function hmacSha256(key: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key.buffer as ArrayBuffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, data.buffer as ArrayBuffer);
  return new Uint8Array(signature);
}

function base64Encode(data: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < data.length; i++) {
    binary += String.fromCharCode(data[i]);
  }
  return btoa(binary);
}

async function generateRtcToken(
  appId: string,
  appCertificate: string,
  channelName: string,
  uid: number,
  role: number,
  privilegeExpiredTs: number
): Promise<string> {
  const encoder = new TextEncoder();
  
  const message: Uint8Array[] = [];
  
  // Pack salt (random)
  const salt = Math.floor(Math.random() * 0xffffffff);
  message.push(encodeUint32(salt));
  
  // Pack ts (current timestamp)
  const ts = Math.floor(Date.now() / 1000);
  message.push(encodeUint32(ts));
  
  // Pack privileges
  const privileges = new Map<number, number>();
  privileges.set(Privileges.kJoinChannel, privilegeExpiredTs);
  if (role === Role.PUBLISHER) {
    privileges.set(Privileges.kPublishAudioStream, privilegeExpiredTs);
    privileges.set(Privileges.kPublishVideoStream, privilegeExpiredTs);
    privileges.set(Privileges.kPublishDataStream, privilegeExpiredTs);
  }
  message.push(encodeMapUint32(privileges));
  
  // Combine message parts
  const messageTotalLength = message.reduce((sum, arr) => sum + arr.length, 0);
  const messageBuffer = new Uint8Array(messageTotalLength);
  let offset = 0;
  message.forEach(part => {
    messageBuffer.set(part, offset);
    offset += part.length;
  });
  
  // Create signing buffer
  const appIdBytes = encoder.encode(appId);
  const channelBytes = encoder.encode(channelName);
  const uidStr = String(uid);
  const uidBytes = encoder.encode(uidStr);
  
  const signBuffer = new Uint8Array(
    appIdBytes.length + channelBytes.length + uidBytes.length + messageBuffer.length
  );
  offset = 0;
  signBuffer.set(appIdBytes, offset);
  offset += appIdBytes.length;
  signBuffer.set(channelBytes, offset);
  offset += channelBytes.length;
  signBuffer.set(uidBytes, offset);
  offset += uidBytes.length;
  signBuffer.set(messageBuffer, offset);
  
  // Sign
  const certBytes = encoder.encode(appCertificate);
  const signature = await hmacSha256(certBytes, signBuffer);
  
  // Create final token
  const version = "007";
  const content = new Uint8Array(signature.length + messageBuffer.length);
  content.set(signature, 0);
  content.set(messageBuffer, signature.length);
  
  return version + base64Encode(content);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { channelName, uid, role = 'publisher' } = await req.json();

    const appId = Deno.env.get('AGORA_APP_ID');
    const appCertificate = Deno.env.get('AGORA_APP_CERTIFICATE');

    if (!appId || !appCertificate) {
      throw new Error('Agora credentials not configured');
    }

    if (!channelName) {
      throw new Error('Channel name is required');
    }

    const roleNum = role === 'publisher' ? Role.PUBLISHER : Role.SUBSCRIBER;
    const privilegeExpiredTs = Math.floor(Date.now() / 1000) + 3600; // 1 hour

    console.log(`Generating token for channel: ${channelName}, uid: ${uid}, role: ${role}`);

    const token = await generateRtcToken(
      appId,
      appCertificate,
      channelName,
      uid || 0,
      roleNum,
      privilegeExpiredTs
    );

    return new Response(JSON.stringify({ 
      token,
      appId,
      channelName,
      uid: uid || 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error generating Agora token:', error);
    return new Response(JSON.stringify({ error: error?.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
