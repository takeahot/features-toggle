declare const acquireVsCodeApi: () => {
	postMessage(message: unknown): void;
	getState(): unknown;
	setState(state: unknown): void;
};

// Get the vscode API if available (in VSCode webview), otherwise create a mock
const vscode = typeof acquireVsCodeApi !== 'undefined'
	? acquireVsCodeApi()
	: {
			postMessage: (message: unknown) => {
				console.log('[Mock vscode] postMessage:', message);
			},
			getState: () => {
				console.log('[Mock vscode] getState');
				return undefined;
			},
			setState: (state: unknown) => {
				console.log('[Mock vscode] setState:', state);
			}
		};

export { vscode };
