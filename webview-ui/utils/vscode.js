// Get the vscode API if available (in VSCode webview), otherwise create a mock
const vscode = typeof acquireVsCodeApi !== 'undefined'
    ? acquireVsCodeApi()
    : {
        postMessage: (message) => {
            console.log('[Mock vscode] postMessage:', message);
        },
        getState: () => {
            console.log('[Mock vscode] getState');
            return undefined;
        },
        setState: (state) => {
            console.log('[Mock vscode] setState:', state);
        }
    };
export { vscode };
