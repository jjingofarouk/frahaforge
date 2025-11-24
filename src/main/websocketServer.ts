// src/main/websocketServer.ts
import { Server } from 'ws';
import { app } from 'electron';
import path from 'path';

export class WebSocketServer {
  private wss: Server | null = null;
  private port: number = 3000; // Use different port than HTTP
  private connectedTerminals: Map<string, any> = new Map();

  start(): void {
    try {
      this.wss = new Server({ port: this.port });
      
      this.wss.on('connection', (ws, req) => {
        console.log('🔌 New WebSocket connection');
        
        ws.on('message', (message) => {
          this.handleMessage(ws, message.toString());
        });

        ws.on('close', () => {
          console.log('🔌 WebSocket connection closed');
          this.removeTerminal(ws);
        });

        ws.on('error', (error) => {
          console.error('WebSocket error:', error);
        });
      });

      console.log(`✅ WebSocket server running on port ${this.port}`);
    } catch (error) {
      console.error('❌ Failed to start WebSocket server:', error);
    }
  }

  private handleMessage(ws: any, message: string): void {
    try {
      const data = JSON.parse(message);
      console.log('📨 WebSocket message:', data);

      switch (data.type) {
        case 'register':
          this.registerTerminal(ws, data);
          break;
        case 'heartbeat':
          this.sendToClient(ws, { type: 'heartbeat_ack' });
          break;
        case 'stock_update':
          this.broadcastToAllExcept(ws, data);
          break;
        case 'product_sold':
          this.broadcastToAllExcept(ws, data);
          break;
        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }

  private registerTerminal(ws: any, data: any): void {
    const { terminalId, tillNumber } = data;
    this.connectedTerminals.set(terminalId, { ws, tillNumber });
    
    console.log(`✅ Terminal registered: ${terminalId} (Till ${tillNumber})`);
    
    // Notify other terminals
    this.broadcastToAllExcept(ws, {
      type: 'terminal_connected',
      payload: { terminalId, tillNumber }
    });

    // Send confirmation
    this.sendToClient(ws, {
      type: 'registered',
      payload: { success: true, terminalId }
    });
  }

  private removeTerminal(ws: any): void {
    for (const [terminalId, terminal] of this.connectedTerminals.entries()) {
      if (terminal.ws === ws) {
        this.connectedTerminals.delete(terminalId);
        console.log(`🔌 Terminal disconnected: ${terminalId}`);
        
        // Notify other terminals
        this.broadcastToAll({
          type: 'terminal_disconnected',
          payload: { terminalId }
        });
        break;
      }
    }
  }

  private sendToClient(ws: any, message: any): void {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private broadcastToAll(message: any): void {
    this.connectedTerminals.forEach((terminal) => {
      this.sendToClient(terminal.ws, message);
    });
  }

  private broadcastToAllExcept(excludeWs: any, message: any): void {
    this.connectedTerminals.forEach((terminal) => {
      if (terminal.ws !== excludeWs) {
        this.sendToClient(terminal.ws, message);
      }
    });
  }

  stop(): void {
    if (this.wss) {
      this.wss.close();
      this.wss = null;
      console.log('🛑 WebSocket server stopped');
    }
  }
}

export const webSocketServer = new WebSocketServer();