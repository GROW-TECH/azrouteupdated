class WebRTCClient {
  constructor({
    streamId = null,
    userId = null,
    onConnectionStateChange = null,
    onTrack = null,
    onStreamChange = null,
    onError = null
  } = {}) {
    // Connection identifiers
    this.streamId = streamId;
    this.userId = userId;
    this.hostId = null;

    // Event callbacks
    this.onConnectionStateChange = onConnectionStateChange;
    this.onTrack = onTrack;
    this.onStreamChange = onStreamChange;
    this.onError = onError;

    // WebRTC state
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = new MediaStream();

    // Polling state
    this.pollingInterval = null;
  }

  async initialize(streamId = this.streamId, isHost = false) {
    try {
      this.streamId = streamId;

      // Signal the server to join or host
      const endpoint = isHost ? 'host-ready' : 'join';
      const response = await fetch('/api/webrtc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: endpoint,
          streamId: this.streamId
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to ${endpoint}`);
      }

      const { iceServers, hostId } = await response.json();
      this.hostId = hostId;

      // Initialize WebRTC connection
      this.peerConnection = new RTCPeerConnection({ iceServers });
      
      // Set up connection event handlers
      this.setupPeerConnectionHandlers(isHost);

      // If host, set up media stream
      if (isHost) {
        await this.setupHostMediaStream();
      }

      // Start polling for signals
      this.startSignalPolling();

      return true;
    } catch (error) {
      console.error('Initialization error:', error);
      this.onError?.(error);
      throw error;
    }
  }

  setupPeerConnectionHandlers(isHost) {
    // Handle ICE candidates
    this.peerConnection.onicecandidate = async (event) => {
      if (event.candidate) {
        await this.sendSignal('candidate', {
          targetId: isHost ? null : this.hostId,
          candidate: event.candidate
        });
      }
    };

    // Handle incoming tracks
    this.peerConnection.ontrack = (event) => {
      event.streams[0].getTracks().forEach(track => {
        this.remoteStream.addTrack(track);
      });
      
      // Notify through both callbacks for compatibility
      this.onTrack?.(event.track, this.remoteStream);
      this.onStreamChange?.(this.remoteStream);
    };

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      this.onConnectionStateChange?.(this.peerConnection.connectionState);
    };

    // Handle ICE connection failures
    this.peerConnection.oniceconnectionstatechange = () => {
      if (this.peerConnection.iceConnectionState === 'failed') {
        this.peerConnection.restartIce();
      }
    };
  }

  async setupHostMediaStream() {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      this.localStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, this.localStream);
      });

      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);
      
      await this.sendSignal('offer', { offer });
    } catch (error) {
      console.error('Media stream error:', error);
      this.onError?.(error);
      throw new Error('Failed to access media devices');
    }
  }

  async sendSignal(type, data = {}) {
    try {
      const response = await fetch('/api/webrtc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          streamId: this.streamId,
          ...data
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Signal failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Signal error:', error);
      this.onError?.(error);
      throw error;
    }
  }

  startSignalPolling() {
    // Implementation note: In production, use WebSocket or Server-Sent Events
    this.pollingInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/webrtc/poll?streamId=${this.streamId}`);
        if (!response.ok) return;

        const signals = await response.json();
        for (const signal of signals) {
          await this.handleSignal(signal);
        }
      } catch (error) {
        console.error('Signal polling error:', error);
        this.onError?.(error);
      }
    }, 1000);
  }

  async handleSignal(signal) {
    try {
      switch (signal.type) {
        case 'offer':
          await this.peerConnection.setRemoteDescription(
            new RTCSessionDescription(signal.offer)
          );

          const answer = await this.peerConnection.createAnswer();
          await this.peerConnection.setLocalDescription(answer);

          await this.sendSignal('answer', {
            answer,
            targetId: signal.from
          });
          break;

        case 'answer':
          await this.peerConnection.setRemoteDescription(
            new RTCSessionDescription(signal.answer)
          );
          break;

        case 'candidate':
          await this.peerConnection.addIceCandidate(
            new RTCIceCandidate(signal.candidate)
          );
          break;

        case 'stream-ended':
          await this.cleanup();
          break;
      }
    } catch (error) {
      console.error('Error handling signal:', error);
      this.onError?.(error);
    }
  }

  async cleanup() {
    // Stop polling
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }

    // Stop local media tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
    }

    // Stop remote media tracks
    this.remoteStream.getTracks().forEach(track => track.stop());
    
    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
    }

    // Notify server
    try {
      await this.sendSignal('leave', {});
    } catch (error) {
      console.error('Error during cleanup:', error);
      this.onError?.(error);
    }

    // Reset state
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = new MediaStream();
  }

  // Optional: Add connection statistics method
  async getConnectionStats() {
    if (!this.peerConnection) return null;

    const stats = await this.peerConnection.getStats();
    const report = {
      video: {
        bitrate: 0,
        framerate: 0,
        resolution: '',
        packetsLost: 0
      },
      audio: {
        bitrate: 0,
        packetsLost: 0
      },
      connection: {
        rtt: 0,
        quality: 'unknown'
      }
    };

    stats.forEach(stat => {
      if (stat.type === 'inbound-rtp' && stat.kind === 'video') {
        report.video.bitrate = stat.bitrate;
        report.video.framerate = stat.framesPerSecond;
        report.video.packetsLost = stat.packetsLost;
        report.video.resolution = `${stat.frameWidth}x${stat.frameHeight}`;
      }
      else if (stat.type === 'inbound-rtp' && stat.kind === 'audio') {
        report.audio.bitrate = stat.bitrate;
        report.audio.packetsLost = stat.packetsLost;
      }
      else if (stat.type === 'candidate-pair' && stat.state === 'succeeded') {
        report.connection.rtt = stat.currentRoundTripTime;
        report.connection.quality = this.getConnectionQuality(stat.currentRoundTripTime);
      }
    });

    return report;
  }

  getConnectionQuality(rtt) {
    if (rtt < 0.1) return 'excellent';
    if (rtt < 0.2) return 'good';
    if (rtt < 0.3) return 'fair';
    return 'poor';
  }
}

export default WebRTCClient;
