// lib/services/webrtc.js
class WebRTCService {
    constructor(streamId, userId, isTeacher) {
      this.streamId = streamId;
      this.userId = userId;
      this.isTeacher = isTeacher;
      this.peerConnections = new Map();
      this.localStream = null;
      this.screenStream = null;
      this.onParticipantJoined = null;
      this.onParticipantLeft = null;
      this.onScreenShare = null;
  
      // WebRTC configuration
      this.configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          {
            urls: process.env.NEXT_PUBLIC_TURN_SERVER,
            username: process.env.NEXT_PUBLIC_TURN_USERNAME,
            credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL
          }
        ],
        iceCandidatePoolSize: 10
      };
    }
  
    async initialize() {
      try {
        // Get user media with screen capture constraints
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { min: 640, ideal: 1920 },
            height: { min: 400, ideal: 1080 },
            aspectRatio: 1.777777778,
            frameRate: { max: 30 }
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
  
        this.localStream = stream;
        return stream;
      } catch (error) {
        console.error('Error initializing WebRTC:', error);
        throw error;
      }
    }
  
    async startScreenShare() {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            cursor: "always",
            displaySurface: "monitor",
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true
          }
        });
  
        this.screenStream = screenStream;
  
        // Replace video track in all peer connections
        const videoTrack = screenStream.getVideoTracks()[0];
        for (const [peerId, pc] of this.peerConnections.entries()) {
          const sender = pc.getSenders().find(s => s.track?.kind === 'video');
          if (sender) {
            await sender.replaceTrack(videoTrack);
          }
        }
  
        // Handle stream end
        videoTrack.onended = () => {
          this.stopScreenShare();
        };
  
        if (this.onScreenShare) {
          this.onScreenShare(true);
        }
  
        return screenStream;
      } catch (error) {
        console.error('Error starting screen share:', error);
        throw error;
      }
    }
  
    async stopScreenShare() {
      if (this.screenStream) {
        this.screenStream.getTracks().forEach(track => track.stop());
        this.screenStream = null;
  
        // Restore camera video track
        if (this.localStream) {
          const videoTrack = this.localStream.getVideoTracks()[0];
          for (const [peerId, pc] of this.peerConnections.entries()) {
            const sender = pc.getSenders().find(s => s.track?.kind === 'video');
            if (sender && videoTrack) {
              await sender.replaceTrack(videoTrack);
            }
          }
        }
  
        if (this.onScreenShare) {
          this.onScreenShare(false);
        }
      }
    }
  
    async createPeerConnection(participantId) {
      try {
        const pc = new RTCPeerConnection(this.configuration);
        this.peerConnections.set(participantId, pc);
  
        // Handle ICE candidates
        pc.onicecandidate = async (event) => {
          if (event.candidate) {
            await this.sendSignalingMessage({
              type: 'ice-candidate',
              candidate: event.candidate,
              to: participantId
            });
          }
        };
  
        // Handle connection state changes
        pc.onconnectionstatechange = () => {
          if (pc.connectionState === 'disconnected') {
            this.handleParticipantDisconnect(participantId);
          }
        };
  
        // Add tracks to the peer connection
        if (this.localStream) {
          this.localStream.getTracks().forEach(track => {
            pc.addTrack(track, this.localStream);
          });
        }
  
        return pc;
      } catch (error) {
        console.error('Error creating peer connection:', error);
        throw error;
      }
    }
  
    async handleSignalingMessage(message) {
      try {
        const { type, from, data } = message;
  
        let pc = this.peerConnections.get(from);
        if (!pc) {
          pc = await this.createPeerConnection(from);
        }
  
        switch (type) {
          case 'offer':
            await pc.setRemoteDescription(new RTCSessionDescription(data));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            await this.sendSignalingMessage({
              type: 'answer',
              to: from,
              data: answer
            });
            break;
  
          case 'answer':
            await pc.setRemoteDescription(new RTCSessionDescription(data));
            break;
  
          case 'ice-candidate':
            if (data) {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(data));
              } catch (e) {
                console.error('Error adding ICE candidate:', e);
              }
            }
            break;
  
          case 'leave':
            this.handleParticipantDisconnect(from);
            break;
        }
      } catch (error) {
        console.error('Error handling signaling message:', error);
        throw error;
      }
    }
  
    async sendSignalingMessage(message) {
      try {
        await fetch(`/api/${this.isTeacher ? 'teacher' : 'student'}/livestreams/${this.streamId}/signal`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...message,
            from: this.userId
          })
        });
      } catch (error) {
        console.error('Error sending signaling message:', error);
        throw error;
      }
    }
  
    handleParticipantDisconnect(participantId) {
      const pc = this.peerConnections.get(participantId);
      if (pc) {
        pc.close();
        this.peerConnections.delete(participantId);
      }
  
      if (this.onParticipantLeft) {
        this.onParticipantLeft(participantId);
      }
    }
  
    // Media control methods
    async toggleAudio(enabled) {
      if (this.localStream) {
        this.localStream.getAudioTracks().forEach(track => {
          track.enabled = enabled;
        });
      }
    }
  
    async toggleVideo(enabled) {
      if (this.localStream) {
        this.localStream.getVideoTracks().forEach(track => {
          track.enabled = enabled;
        });
      }
    }
  
    // Cleanup
    disconnect() {
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => track.stop());
      }
      if (this.screenStream) {
        this.screenStream.getTracks().forEach(track => track.stop());
      }
      this.peerConnections.forEach(pc => pc.close());
      this.peerConnections.clear();
    }
  }
  
  export default WebRTCService;
