// chat.js - Handles chat messaging functionality

export class ChatManager {
    constructor(peerConnection) {
        this.peerConnection = peerConnection;
        this.chatMessages = document.getElementById("chatMessages");
        this.messageInput = document.getElementById("messageInput");
        this.chatBox = document.getElementById("chat");
    }

    sendMessage(text) {
        if (!text.trim()) return;
        
        this.peerConnection.sendData({ type: 'chat', message: text });
        
        const msgDiv = document.createElement('div');
        msgDiv.className = 'message sent';
        msgDiv.textContent = text;
        this.chatMessages.appendChild(msgDiv);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        this.messageInput.value = '';
    }

    sendImage(file) {
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = () => {
            const dataUrl = reader.result;
            this.peerConnection.sendData({ type: 'image', dataUrl });
            
            this.removeExistingImages();

            const msgDiv = document.createElement('div');
            msgDiv.className = 'message sent';
            const img = document.createElement('img');
            img.src = dataUrl;
            msgDiv.appendChild(img);
            this.chatMessages.appendChild(msgDiv);
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        };
        reader.readAsDataURL(file);
    }

    receiveMessage(text) {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'message received';
        msgDiv.textContent = text;
        this.chatMessages.appendChild(msgDiv);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    receiveImage(dataUrl) {
        this.removeExistingImages();
        const msgDiv = document.createElement('div');
        msgDiv.className = 'message received';
        const img = document.createElement('img');
        img.src = dataUrl;
        msgDiv.appendChild(img);
        this.chatMessages.appendChild(msgDiv);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    removeExistingImages() {
        const messages = this.chatMessages.querySelectorAll('.message');
        messages.forEach(msg => {
            if (msg.querySelector('img')) {
                msg.remove();
            }
        });
    }
}