// Centralized WebSocket Service - Single Point of Connection Management
// Optimized for production with connection pooling and intelligent reconnection

interface WebSocketMessage {
  type: 'chat_message' | 'ai_response' | 'chat_queued' | 'chat_ack' | 'ai_response_ack' | 
       'heartbeat' | 'error' | 'connected' | 'welcome' | 'log_summary' | 'stored_logs' | 
       'log_update' | 'message' | 'file' | 'typing' | 'ping' | 'pong' | 'queue_cleared' | 
       'queue_status_update' | 'system_status' | 'audit_progress';
  payload?: any;
  message?: string;
  timestamp?: string;
  source?: string;
  clientId?: string;
  client_id?: string;
  promptId?: string;
  queuePosition?: number;
  queueCleared?: boolean;
  cleared_count?: number;
  error?: string;
}

interface ConnectionConfig {
  url: string;
  clientType: 'dashboard' | 'general' | 'logger';
  maxReconnectAttempts: number;
  reconnectBackoffMs: number;
  heartbeatIntervalMs: number;
  connectionTimeoutMs: number;
}

interface Subscription {
  id: string;
  callback: (message: WebSocketMessage) => void;
  filter?: (message: WebSocketMessage) => boolean;
}

class WebSocketService {
  private static instance: WebSocketService;
  private ws: WebSocket | null = null;
  private config: ConnectionConfig;
  private clientId: string;
  private isConnected: boolean = false;
  private isConnecting: boolean = false;
  private reconnectAttempts: number = 0;
  private subscriptions: Map<string, Subscription> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private connectionPromise: Promise<void> | null = null;
  private lastConnectionAttempt: number = 0;
  private connectionThrottleMs: number = 5000; // Minimum time between connection attempts
  private messageQueue: WebSocketMessage[] = [];
  private lastHeartbeat: Date | null = null;

  private constructor() {
    // Singleton pattern - only one WebSocket connection per app
    this.clientId = this.generatePersistentClientId();
    this.config = {
      url: 'wss://websocket.avai.life/ws',
      clientType: 'dashboard',
      maxReconnectAttempts: 5, // Reduced for better performance
      reconnectBackoffMs: 5000, // Increased initial backoff
      heartbeatIntervalMs: 45000, // Increased to reduce server load
      connectionTimeoutMs: 15000 // Reasonable timeout
    };
  }

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  private generatePersistentClientId(): string {
    // Use sessionStorage to persist client ID across page refreshes but not browser sessions
    const storageKey = 'avai_websocket_client_id';
    let clientId = sessionStorage.getItem(storageKey);
    
    if (!clientId) {
      clientId = `avai_frontend_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem(storageKey, clientId);
    }
    
    return clientId;
  }

  public async connect(config?: Partial<ConnectionConfig>): Promise<void> {
    // Prevent multiple simultaneous connection attempts
    if (this.isConnecting || this.isConnected) {
      return this.connectionPromise || Promise.resolve();
    }

    // Throttle connection attempts
    const now = Date.now();
    if (now - this.lastConnectionAttempt < this.connectionThrottleMs) {
      console.log('🚫 Connection throttled, waiting...');
      return;
    }

    this.lastConnectionAttempt = now;

    if (config) {
      this.config = { ...this.config, ...config };
    }

    this.isConnecting = true;

    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        this.cleanup();

        const wsUrl = `${this.config.url}?type=${this.config.clientType}&client_id=${this.clientId}`;
        console.log(`🔗 Connecting to WebSocket: ${wsUrl}`);
        console.log(`🆔 Client ID: ${this.clientId}`);

        this.ws = new WebSocket(wsUrl);

        const connectionTimeout = setTimeout(() => {
          console.error('❌ Connection timeout');
          this.ws?.close();
          this.handleConnectionFailure();
          reject(new Error('Connection timeout'));
        }, this.config.connectionTimeoutMs);

        this.ws.onopen = () => {
          clearTimeout(connectionTimeout);
          console.log('✅ WebSocket connected successfully');
          this.isConnected = true;
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.processMessageQueue();
          this.notifyConnectionChange(true);
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('❌ Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          clearTimeout(connectionTimeout);
          console.log(`🔌 WebSocket disconnected: ${event.code} - ${event.reason}`);
          this.handleDisconnection(event.code !== 1000); // Only reconnect if not deliberate close
        };

        this.ws.onerror = (error) => {
          clearTimeout(connectionTimeout);
          console.error('❌ WebSocket error:', error);
          this.handleConnectionFailure();
          reject(error);
        };

      } catch (error) {
        this.isConnecting = false;
        this.handleConnectionFailure();
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  private handleMessage(message: WebSocketMessage): void {
    // Handle system messages
    if (message.type === 'pong') {
      console.log('🏓 Heartbeat acknowledged');
      return;
    }

    if (message.type === 'welcome') {
      console.log('👋 Welcome message received:', message);
      return;
    }

    // Notify subscribers
    this.subscriptions.forEach(subscription => {
      if (!subscription.filter || subscription.filter(message)) {
        try {
          subscription.callback(message);
        } catch (error) {
          console.error(`❌ Error in subscription callback ${subscription.id}:`, error);
        }
      }
    });
  }

  private handleDisconnection(shouldReconnect: boolean): void {
    this.isConnected = false;
    this.isConnecting = false;
    this.connectionPromise = null;
    this.stopHeartbeat();
    this.notifyConnectionChange(false);

    if (shouldReconnect && this.reconnectAttempts < this.config.maxReconnectAttempts) {
      const backoffMs = this.config.reconnectBackoffMs * Math.pow(2, this.reconnectAttempts);
      const maxBackoff = 30000; // Max 30 seconds
      const delay = Math.min(backoffMs, maxBackoff);

      console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.config.maxReconnectAttempts})`);
      
      this.reconnectTimeout = setTimeout(() => {
        this.reconnectAttempts++;
        this.connect();
      }, delay);
    } else if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
    }
  }

  private handleConnectionFailure(): void {
    this.isConnected = false;
    this.isConnecting = false;
    this.connectionPromise = null;
    this.stopHeartbeat();
    this.notifyConnectionChange(false);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, this.config.heartbeatIntervalMs);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private sendHeartbeat(): void {
    if (this.isConnected) {
      this.lastHeartbeat = new Date();
      this.sendMessage({
        type: 'ping',
        timestamp: this.lastHeartbeat.toISOString(),
        clientId: this.clientId
      });
    }
  }

  private processMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.isConnected) {
      const message = this.messageQueue.shift();
      if (message) {
        this.sendMessage(message);
      }
    }
  }

  private notifyConnectionChange(connected: boolean): void {
    // Notify all subscribers about connection state changes
    const message: WebSocketMessage = {
      type: connected ? 'connected' : 'error',
      message: connected ? 'Connected to WebSocket' : 'Disconnected from WebSocket',
      timestamp: new Date().toISOString(),
      clientId: this.clientId
    };

    this.subscriptions.forEach(subscription => {
      if (!subscription.filter || subscription.filter(message)) {
        try {
          subscription.callback(message);
        } catch (error) {
          console.error(`❌ Error in connection change callback ${subscription.id}:`, error);
        }
      }
    });
  }

  public sendMessage(message: WebSocketMessage): boolean {
    if (!this.isConnected || !this.ws) {
      console.warn('⚠️ WebSocket not connected, queueing message');
      this.messageQueue.push(message);
      
      // Try to reconnect if not already attempting
      if (!this.isConnecting) {
        this.connect();
      }
      return false;
    }

    try {
      const payload = {
        ...message,
        clientId: this.clientId,
        timestamp: message.timestamp || new Date().toISOString()
      };

      this.ws.send(JSON.stringify(payload));
      console.log(`📤 Message sent:`, payload.type);
      return true;
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      this.messageQueue.push(message);
      return false;
    }
  }

  public sendChatMessage(message: string): boolean {
    return this.sendMessage({
      type: 'chat_message',
      message: message.trim(),
      source: 'react_frontend'
    });
  }

  public subscribe(callback: (message: WebSocketMessage) => void, filter?: (message: WebSocketMessage) => boolean): string {
    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.subscriptions.set(subscriptionId, {
      id: subscriptionId,
      callback,
      filter
    });

    console.log(`📝 Subscription created: ${subscriptionId}`);
    return subscriptionId;
  }

  public unsubscribe(subscriptionId: string): boolean {
    const removed = this.subscriptions.delete(subscriptionId);
    if (removed) {
      console.log(`🗑️ Subscription removed: ${subscriptionId}`);
    }
    return removed;
  }

  public disconnect(): void {
    console.log('🔌 Manually disconnecting WebSocket');
    this.cleanup();
  }

  private cleanup(): void {
    // Clear timeouts
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    this.stopHeartbeat();

    // Close WebSocket
    if (this.ws) {
      this.ws.close(1000, 'Client disconnecting');
      this.ws = null;
    }

    this.isConnected = false;
    this.isConnecting = false;
    this.connectionPromise = null;
  }

  // Getters
  public get connectionState(): 'connected' | 'connecting' | 'disconnected' {
    if (this.isConnected) return 'connected';
    if (this.isConnecting) return 'connecting';
    return 'disconnected';
  }

  public getIsConnected(): boolean {
    return this.isConnected;
  }

  public getIsReconnecting(): boolean {
    return this.reconnectAttempts > 0 && !this.isConnected;
  }

  public getClientId(): string {
    return this.clientId;
  }

  public getLastHeartbeat(): Date | null {
    return this.lastHeartbeat || null;
  }

  public get connectionInfo() {
    return {
      clientId: this.clientId,
      state: this.connectionState,
      reconnectAttempts: this.reconnectAttempts,
      queuedMessages: this.messageQueue.length,
      activeSubscriptions: this.subscriptions.size,
      isConnected: this.isConnected,
      isReconnecting: this.getIsReconnecting()
    };
  }
}

export default WebSocketService;
export type { WebSocketMessage };
