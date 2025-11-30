//lib/webrtc-host.js

class WebRTCHost {
    constructor({
      streamId,
      userId,
      onParticipantJoined,
      onParticipantLeft,
      onError,
      onConnectionStateChange
    }) {
      this.streamId = streamId;
      this.userId = userId;
      this.onParticipantJoined = onParticipantJoined;
      this.onParticipantLeft = onParticipantLeft;
      this.onError = onError;
      this.onConnectionStateChange = onConnectionStateChange;
  
      // Store peer connections for each participant
      this.peerConnections = new Map();
      
      // Media streams
      this.localStream = null;
      this.screenStream = null;
      this.recordingStream = null;
      
      // MediaRecorder for local recording
      this.mediaRecorder = null;
      this.recordedChunks = [];
  
      // WebSocket for signaling
      this.ws = null;
  
      // Stream settings
      this.videoConstraints = {
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        frameRate: { ideal: 30 }
      };
  
      this.audioConstraints = {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      };
    }
  
    // Initialize host streaming setup
    async initialize() {
      try {
        // Get local media stream
        this.localStream = await navigator.mediaDevices.getUserMedia({
          video: this.videoConstraints,
          audio: this.audioConstraints
        });
  
        // Set up preview
        const previewVideo = document.getElementById('local-preview');
        if (previewVideo) {
          previewVideo.srcObject = this.localStream;
        }
  
        // Initialize WebSocket connection
        await this.initializeSignaling();
  
      } catch (error) {
        console.error('Initialization error:', error);
        this.onError?.(error);
        throw error;
      }
    }
  
    // Set up WebSocket signaling
    async initializeSignaling() {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/webrtc`;
      
      this.ws = new WebSocket(wsUrl);
  
      this.ws.onopen = () => {
        // Register as host
        this.ws.send(JSON.stringify({
          type: 'host-register',
          streamId: this.streamId,
          userId: this.userId
        }));
      };
  
      this.ws.onmessage = async (event) => {
        const message = JSON.parse(event.data);
        await this.handleSignalingMessage(message);
      };
  
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.onError?.(new Error('Signaling connection failed'));
      };
  
      this.ws.onclose = () => {
        // Attempt to reconnect
        setTimeout(() => this.initializeSignaling(), 5000);
      };
    }
  
    // Handle incoming signaling messages
    async handleSignalingMessage(message) {
      switch (message.type) {
        case 'participant-join': {
          const { participantId, participantInfo } = message;
          await this.createPeerConnection(participantId, participantInfo);
          this.onParticipantJoined?.(participantInfo);
          break;
        }
  
        case 'participant-leave': {
          const { participantId } = message;
          this.closePeerConnection(participantId);
          this.onParticipantLeft?.(participantId);
          break;
        }
  
        case 'answer': {
          const { participantId, answer } = message;
          const pc = this.peerConnections.get(participantId);
          if (pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
          }
          break;
        }
  
        case 'candidate': {
          const { participantId, candidate } = message;
          const pc = this.peerConnections.get(participantId);
          if (pc) {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          }
          break;
        }
      }
    }
  
    // Create and manage peer connections
    async createPeerConnection(participantId, participantInfo) {
      try {
        const pc = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' }
          ]
        });
  
        // Add local streams
        this.localStream.getTracks().forEach(track => {
          pc.addTrack(track, this.localStream);
        });
  
        if (this.screenStream) {
          this.screenStream.getTracks().forEach(track => {
            pc.addTrack(track, this.screenStream);
          });
        }
  
        // Handle ICE candidates
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            this.ws.send(JSON.stringify({
              type: 'candidate',
              targetId: participantId,
              candidate: event.candidate
            }));
          }
        };
  
        // Monitor connection state
        pc.onconnectionstatechange = () => {
          this.onConnectionStateChange?.(pc.connectionState);
        };
  
        // Create and send offer
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
  
        this.ws.send(JSON.stringify({
          type: 'offer',
          targetId: participantId,
          offer
        }));
  
        this.peerConnections.set(participantId, pc);
  
      } catch (error) {
        console.error('Error creating peer connection:', error);
        this.onError?.(error);
      }
    }
  
    // Close peer connection
    closePeerConnection(participantId) {
      const pc = this.peerConnections.get(participantId);
      if (pc) {
        pc.close();
        this.peerConnections.delete(participantId);
      }
    }
  
    // Media control methods
    async toggleVideo() {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        this.broadcastTrackState('video', videoTrack.enabled);
      }
    }
  
    async toggleAudio() {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        this.broadcastTrackState('audio', audioTrack.enabled);
      }
    }
  
    // Screen sharing
    async startScreenShare(sourceId = null) {
      try {
        const options = {
          video: {
            cursor: 'always'
          },
          audio: false
        };
  
        if (sourceId) {
          options.video.mandatory = {
            chromeMediaSourceId: sourceId
          };
        }
  
        this.screenStream = await navigator.mediaDevices.getDisplayMedia(options);
  
        // Add screen track to all peer connections
        this.screenStream.getTracks().forEach(track => {
          this.peerConnections.forEach(pc => {
            pc.addTrack(track, this.screenStream);
          });
        });
  
        // Handle screen share stop
        this.screenStream.getVideoTracks()[0].onended = () => {
          this.stopScreenShare();
        };
  
        return true;
      } catch (error) {
        console.error('Screen share error:', error);
        this.onError?.(error);
        return false;
      }
    }
  
    async stopScreenShare() {
      if (this.screenStream) {
        this.screenStream.getTracks().forEach(track => {
          track.stop();
        });
        this.screenStream = null;
      }
    }
  
    // Recording methods
    async startRecording() {
      try {
        // Create a combined stream of video, audio, and screen share if present
        const tracks = [
          ...this.localStream.getTracks(),
          ...(this.screenStream?.getTracks() || [])
        ];
  
        const combinedStream = new MediaStream(tracks);
  
        this.mediaRecorder = new MediaRecorder(combinedStream, {
          mimeType: 'video/webm;codecs=vp8,opus'
        });
  
        this.mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            this.recordedChunks.push(event.data);
          }
        };
  
        this.mediaRecorder.onstop = async () => {
          const blob = new Blob(this.recordedChunks, {
            type: 'video/webm'
          });
  
          // Upload recording
          const formData = new FormData();
          formData.append('recording', blob);
          formData.append('streamId', this.streamId);
  
          await fetch(`/api/livestreams/${this.streamId}/recording`, {
            method: 'POST',
            body: formData
          });
  
          this.recordedChunks = [];
        };
  
        this.mediaRecorder.start(1000); // Save data every second
        return true;
      } catch (error) {
        console.error('Recording error:', error);
        this.onError?.(error);
        return false;
      }
    }
  
    async stopRecording() {
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      }
    }
  
    // Broadcast track state changes to participants
    broadcastTrackState(kind, enabled) {
      this.ws.send(JSON.stringify({
        type: 'track-state',
        kind,
        enabled
      }));
    }
  
    // Clean up resources
    disconnect() {
      // Stop all tracks
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => track.stop());
      }
      if (this.screenStream) {
        this.screenStream.getTracks().forEach(track => track.stop());
      }
  
      // Stop recording if active
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      }
  
      // Close all peer connections
      this.peerConnections.forEach(pc => pc.close());
      this.peerConnections.clear();
  
      // Close WebSocket
      if (this.ws) {
        this.ws.close();
      }
    }
  }
  
  export default WebRTCHost;
