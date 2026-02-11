// chat.js - Handles chat messaging functionality

export class ChatManager {
    constructor(peerConnection) {
        this.peerConnection = peerConnection;
        this.chatMessages = document.getElementById("chatMessages");
        this.messageInput = document.getElementById("messageInput");
        this.chatBox = document.getElementById("chat");
        this.darkFont = false;
    }

    sendMessage(text) {
        if (!text.trim()) return;
        
        this.peerConnection.sendData({ type: 'chat', message: text, darkFont: this.darkFont });
        
        const msgDiv = document.createElement('div');
        msgDiv.className = 'message sent';
        if (this.darkFont) msgDiv.classList.add('dark-font');
        msgDiv.innerHTML = '⚡ ' + this.escapeHtml(text);
        this.chatMessages.appendChild(msgDiv);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        this.messageInput.value = '';
    }

    sendImage(file) {
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = () => {
            const dataUrl = reader.result;
            this.peerConnection.sendData({ type: 'image', dataUrl, darkFont: this.darkFont });
            
            this.removeExistingImages();

            const msgDiv = document.createElement('div');
            msgDiv.className = 'message sent';
            if (this.darkFont) msgDiv.classList.add('dark-font');
            const img = document.createElement('img');
            img.src = dataUrl;
            msgDiv.appendChild(img);
            this.chatMessages.appendChild(msgDiv);
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        };
        reader.readAsDataURL(file);
    }

    receiveMessage(text, darkFont = false) {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'message received';
        if (darkFont) msgDiv.classList.add('dark-font');
        msgDiv.innerHTML = '🎧 ' + this.escapeHtml(text);
        this.chatMessages.appendChild(msgDiv);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    receiveImage(dataUrl, darkFont = false) {
        this.removeExistingImages();
        const msgDiv = document.createElement('div');
        msgDiv.className = 'message received';
        if (darkFont) msgDiv.classList.add('dark-font');
        const img = document.createElement('img');
        img.src = dataUrl;
        msgDiv.appendChild(img);
        this.chatMessages.appendChild(msgDiv);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    toggleFontColor() {
        this.darkFont = !this.darkFont;
        return this.darkFont;
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