import * as signalR from '@microsoft/signalr'

export const connection = new signalR.HubConnectionBuilder()
  .withUrl('/hubs/dashboard')
  .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
  .configureLogging(signalR.LogLevel.Warning)
  .build()

export async function startConnection() {
  if (connection.state === signalR.HubConnectionState.Disconnected) {
    await connection.start()
    await connection.invoke('SubscribeToAll')
  }
}
