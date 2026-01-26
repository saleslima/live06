// event-handlers.js - All button and input event handlers

export class EventHandlers {
    constructor(peerConnection, camera, chat, ui) {
        this.peerConnection = peerConnection;
        this.camera = camera;
        this.chat = chat;
        this.ui = ui;
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Link management buttons
        this.ui.btnLink.onclick = () => this.handleGenerateLink();
        this.ui.btnCopy.onclick = () => this.handleCopyLink();
        this.ui.btnDeleteLink.onclick = () => this.handleDeleteLink();
        
        // Communication buttons
        this.ui.btnSendWhatsApp.onclick = () => this.ui.sendWhatsApp();
        this.ui.btnSendSMS.onclick = () => this.ui.sendSMS();
        
        // Video controls
        this.ui.btnRecord.onclick = () => this.handleRecord();
        this.ui.btnMyVideo.onclick = () => this.handleMyVideo();
        
        const btnSwitchCamera = document.getElementById("btnSwitchCamera");
        btnSwitchCamera.onclick = () => this.handleSwitchCamera();
        
        // Delegate event for sender camera switch button
        document.addEventListener('click', (e) => {
            if (e.target.id === 'btnSwitchSenderCamera') {
                this.handleSwitchSenderCamera();
            }
        });
        
        // Chat controls
        const btnSend = document.getElementById("btnSend");
        const messageInput = document.getElementById("messageInput");
        const btnToggleChat = document.getElementById("btnToggleChat");
        const btnImage = document.getElementById("btnImage");
        const imageInput = document.getElementById("imageInput");
        
        btnSend.onclick = () => this.chat.sendMessage(messageInput.value);
        
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.chat.sendMessage(messageInput.value);
            }
        });
        
        btnToggleChat.onclick = () => this.chat.toggleChat();
        
        btnImage.onclick = () => imageInput.click();
        
        imageInput.addEventListener('change', () => {
            const file = imageInput.files[0];
            if (file) {
                const type = file.type.toLowerCase();
                if (type === 'image/jpeg' || type === 'image/jpg' || type === 'image/gif') {
                    this.chat.sendImage(file);
                } else {
                    alert('Formato de imagem não suportado. Use JPEG, JPG ou GIF.');
                }
            }
            imageInput.value = '';
        });
    }

    handleGenerateLink() {
        this.ui.generateLink(this.peerConnection.peerId);
    }

    handleCopyLink() {
        this.ui.copyLink();
    }

    handleDeleteLink() {
        if (!this.ui.generatedLink) return;

        try {
            this.peerConnection.sendData({ type: 'stop_camera' });
        } catch (e) {
            console.error("Erro ao enviar comando de stop_camera:", e);
        }

        localStorage.removeItem("livecam_link");
        localStorage.removeItem("livecam_peerId");
        this.ui.generatedLink = "";
        this.ui.linkDiv.innerText = "";
        this.ui.btnCopy.disabled = true;
        this.ui.btnSendWhatsApp.disabled = true;
        this.ui.btnSendSMS.disabled = true;
        this.ui.btnDeleteLink.disabled = true;
        this.ui.setStatus("Link excluído. Recarregando para gerar um novo...");
        
        try {
            this.peerConnection.destroy();
        } catch (e) {}
        
        setTimeout(() => {
            location.reload();
        }, 500);
    }

    handleRecord() {
        if (!this.ui.isRecording && this.camera.remoteVideoElement && this.camera.remoteVideoElement.srcObject) {
            this.ui.startRecording(this.camera.remoteVideoElement.srcObject);
        } else if (this.ui.isRecording) {
            this.ui.stopRecording();
            try {
                this.peerConnection.sendData({ type: 'stop_camera' });
            } catch (e) {
                console.error("Erro ao enviar comando de stop_camera ao parar gravação:", e);
            }
        }
    }

    async handleMyVideo() {
        const params = new URLSearchParams(location.search);
        const room = params.get("r");
        if (room) return;
        
        try {
            const result = await this.camera.toggleSenderVideo(this.peerConnection.currentCall);
            
            if (!result.enabled) {
                this.peerConnection.sendData({ type: 'sender_video_stopped' });
            }
            
            this.ui.updateMyVideoButton(result.enabled);
        } catch (err) {
            console.error("Erro ao alternar vídeo:", err);
            this.ui.setStatus("Erro ao alternar vídeo", "#ef4444");
        }
    }

    async handleSwitchCamera() {
        const params = new URLSearchParams(location.search);
        const room = params.get("r");
        if (!room) return;
        
        try {
            const newStream = await this.camera.switchCamera();
            
            if (this.peerConnection.currentCall && this.peerConnection.currentCall.peerConnection) {
                const videoTrack = newStream.getVideoTracks()[0];
                const audioTrack = newStream.getAudioTracks()[0];
                this.peerConnection.currentCall.peerConnection.getSenders().forEach(sender => {
                    if (sender.track && sender.track.kind === "video") {
                        sender.replaceTrack(videoTrack);
                    } else if (sender.track && sender.track.kind === "audio") {
                        sender.replaceTrack(audioTrack);
                    }
                });
            }
        } catch (err) {
            this.ui.setStatus("Erro ao trocar câmera", "#ef4444");
        }
    }

    async handleSwitchSenderCamera() {
        const params = new URLSearchParams(location.search);
        const room = params.get("r");
        if (room) return;
        
        try {
            await this.camera.switchSenderCamera(this.peerConnection.currentCall);
        } catch (err) {
            this.ui.setStatus("Erro ao trocar câmera", "#ef4444");
        }
    }
}