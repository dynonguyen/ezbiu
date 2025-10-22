export type RealtimeChannel = {
	on(event: string, filter: { event: string }, callback: () => void): RealtimeChannel;
	subscribe(): void;
	unsubscribe(): void;
	send(message: { type: string; event: string; payload: any }): void;
};

export interface IRealtimeClient {
	channel: RealtimeChannel;
}
