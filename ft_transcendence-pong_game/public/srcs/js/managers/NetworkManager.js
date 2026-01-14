class NetworkManager {
    constructor(serverUrl)
    {
        this.serverUrl = serverUrl;
        this.ws = new WebSocket(serverUrl);
        this.ws.onopen = () =>
        {
            ;
            ;
        } 
        
        this.ws.onmessage = (event) =>
        {
            if (this.messageHandler)
            {
                try {
                    const data = JSON.parse(event.data);
                    this.messageHandler(data);
                } catch (e)
                {
                    ;
                }
            }
        };

        this.targetFPS = 60;
        this.updateInterval = 1000 / this.targetFPS;
        this.lastUpdateTime = 0;
    }

    setMessageHandler(handler)
    {
        this.messageHandler = handler;
    }

    broadCast(data)
    {
        if (this.ws.readyState === WebSocket.OPEN)
        {
            const payload = typeof data === 'string' ? data : JSON.stringify(data);
            this.ws.send(payload);
        }
    }

    sendGameUpdate(data)
    {
        const currentTime = performance.now();
        if (currentTime - this.lastUpdateTime >= this.updateInterval)
        {
            this.broadCast(data);
            this.lastUpdateTime = currentTime;
        }
    }
    
    close()
    {
        if (this.ws)
        {
            this.ws.close();
        }
    }
}

export { NetworkManager };
