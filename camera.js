// camera.js - Handles camera and media stream logic

export class CameraManager {
    constructor() {
        this.localStream = null;
        this.senderStream = null;
        this.usingFrontCamera = true;
        this.localVideoElement = null;
        this.senderVideoElement = null;
        this.remoteVideoElement = null;
        this.localVideoAdded = false;
        this.remoteVideoAdded = false;
        this.senderVideoActive = false;
        this.videosContainer = document.getElementById("videos");
    }

    async startCamera() {
        if (this.localStream) return this.localStream;
        
        try {
            this.localStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: this.usingFrontCamera ? "user" : "environment" },
                audio: true
            });
            
            if (!this.localVideoAdded) {
                this.addVideo(this.localStream, true, true);
                this.localVideoAdded = true;
            }
            
            return this.localStream;
        } catch (error) {
            console.error("Camera error:", error);
            throw error;
        }
    }

    async startSenderMedia() {
        if (this.senderStream) return this.senderStream;
        
        try {
            this.senderStream = await navigator.mediaDevices.getUserMedia({ 
                video: false, 
                audio: true 
            });
            return this.senderStream;
        } catch (error) {
            console.error("Erro ao acessar mídia do remetente:", error);
            throw error;
        }
    }

    stopLocalCamera() {
        try {
            if (this.localStream) {
                this.localStream.getTracks().forEach(t => t.stop());
                this.localStream = null;
            }
            if (this.localVideoElement) {
                this.localVideoElement.srcObject = null;
                this.localVideoElement.style.display = 'none';
            }
        } catch (e) {
            console.error("Erro ao encerrar câmera local:", e);
        }
    }

    addVideo(stream, muted = false, isLocal = false, isSender = false) {
        if (isLocal && this.localVideoAdded) return;
        if (!isLocal && !isSender && this.remoteVideoAdded) return;
        if (isSender && this.senderVideoActive) return;

        const wrapper = document.createElement("div");
        wrapper.className = "video-wrapper";

        const video = document.createElement("video");
        video.srcObject = stream;
        video.autoplay = true;
        video.playsInline = true;
        video.muted = muted;

        wrapper.appendChild(video);
        
        this.videosContainer.appendChild(wrapper);

        if (isLocal) {
            this.localVideoAdded = true;
            this.localVideoElement = video;

            const params = new URLSearchParams(location.search);
            const room = params.get("r");
            if (room) {
                const btnSwitchCamera = document.getElementById("btnSwitchCamera");
                btnSwitchCamera.style.display = "block";
                wrapper.appendChild(btnSwitchCamera);
            }
        } else if (isSender) {
            this.senderVideoActive = true;
            this.senderVideoElement = video;
            
            const btnSwitchSender = document.createElement("button");
            btnSwitchSender.id = "btnSwitchSenderCamera";
            btnSwitchSender.textContent = "🔄 Trocar";
            btnSwitchSender.style.cssText = `
                position: absolute;
                top: 8px;
                right: 8px;
                background: rgba(15,23,42,0.8);
                font-size: 13px;
                padding: 6px 10px;
                z-index: 20;
            `;
            wrapper.appendChild(btnSwitchSender);
            
            this.videosContainer.classList.add('dual-video');
        } else {
            this.remoteVideoAdded = true;
            this.remoteVideoElement = video;
        }

        return video;
    }

    removeSenderVideo() {
        if (this.senderVideoElement) {
            this.senderVideoElement.srcObject = null;
            this.senderVideoElement.parentElement.remove();
            this.senderVideoActive = false;
            this.senderVideoElement = null;
            this.videosContainer.classList.remove('dual-video');
        }
    }

    async switchCamera() {
        try {
            this.usingFrontCamera = !this.usingFrontCamera;
            const newStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: this.usingFrontCamera ? "user" : "environment" },
                audio: true,
            });

            if (this.localStream) {
                this.localStream.getTracks().forEach(t => t.stop());
            }

            this.localStream = newStream;

            if (this.localVideoElement) {
                this.localVideoElement.srcObject = this.localStream;
            }

            return newStream;
        } catch (err) {
            console.error("Erro ao trocar câmera:", err);
            throw err;
        }
    }

    async toggleSenderVideo(currentCall) {
        const hasVideo = this.senderStream && this.senderStream.getVideoTracks().length > 0;
        
        if (!hasVideo) {
            const newStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user" },
                audio: true
            });
            
            if (this.senderStream) {
                this.senderStream.getTracks().forEach(t => t.stop());
            }
            
            this.senderStream = newStream;
            
            if (!this.senderVideoActive) {
                this.addVideo(this.senderStream, true, false, true);
            } else if (this.senderVideoElement) {
                this.senderVideoElement.srcObject = this.senderStream;
            }
            
            if (currentCall && currentCall.peerConnection) {
                const videoTrack = this.senderStream.getVideoTracks()[0];
                const audioTrack = this.senderStream.getAudioTracks()[0];
                
                const senders = currentCall.peerConnection.getSenders();
                senders.forEach(sender => {
                    if (sender.track) {
                        if (sender.track.kind === "video") {
                            sender.replaceTrack(videoTrack);
                        } else if (sender.track.kind === "audio") {
                            sender.replaceTrack(audioTrack);
                        }
                    }
                });
            }
            
            return { enabled: true };
        } else {
            const audioOnlyStream = await navigator.mediaDevices.getUserMedia({
                video: false,
                audio: true
            });
            
            if (this.senderStream) {
                this.senderStream.getTracks().forEach(t => t.stop());
            }
            
            this.senderStream = audioOnlyStream;
            
            if (currentCall && currentCall.peerConnection) {
                const audioTrack = this.senderStream.getAudioTracks()[0];
                
                const senders = currentCall.peerConnection.getSenders();
                senders.forEach(sender => {
                    if (sender.track) {
                        if (sender.track.kind === "video") {
                            sender.replaceTrack(null);
                        } else if (sender.track.kind === "audio") {
                            sender.replaceTrack(audioTrack);
                        }
                    }
                });
            }
            
            this.removeSenderVideo();
            
            return { enabled: false };
        }
    }

    async switchSenderCamera(currentCall) {
        if (!this.senderStream || this.senderStream.getVideoTracks().length === 0) {
            return;
        }

        try {
            this.usingFrontCamera = !this.usingFrontCamera;
            const newStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: this.usingFrontCamera ? "user" : "environment" },
                audio: true,
            });

            if (this.senderStream) {
                this.senderStream.getTracks().forEach(t => t.stop());
            }

            this.senderStream = newStream;

            if (this.senderVideoElement) {
                this.senderVideoElement.srcObject = this.senderStream;
            }

            if (currentCall && currentCall.peerConnection) {
                const videoTrack = this.senderStream.getVideoTracks()[0];
                const audioTrack = this.senderStream.getAudioTracks()[0];
                
                const senders = currentCall.peerConnection.getSenders();
                senders.forEach(sender => {
                    if (sender.track) {
                        if (sender.track.kind === "video") {
                            sender.replaceTrack(videoTrack);
                        } else if (sender.track.kind === "audio") {
                            sender.replaceTrack(audioTrack);
                        }
                    }
                });
            }

            return newStream;
        } catch (err) {
            console.error("Erro ao trocar câmera do remetente:", err);
            throw err;
        }
    }
}