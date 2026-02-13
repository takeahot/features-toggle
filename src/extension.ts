import * as vscode from 'vscode';
import { parseDiagram } from './parser/diagramParser';

class FeaturesToggleViewProvider implements vscode.WebviewViewProvider {
	private webviewView?: vscode.WebviewView;

	constructor(
		private readonly context: vscode.ExtensionContext
	) {}

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken
	) {
		this.webviewView = webviewView;

		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [
				this.context.extensionUri
			]
		};

		webviewView.webview.html = this.getHtmlContent(webviewView.webview);

		webviewView.webview.onDidReceiveMessage(
			(message: any) => this.handleMessage(message),
			undefined,
			this.context.subscriptions
		);
	}

	private getHtmlContent(webview: vscode.Webview): string {
		const stylesUri = this.getUri(webview, this.context.extensionUri, [
			'webview-ui',
			'dist',
			'index.css'
		]);
		const scriptUri = this.getUri(webview, this.context.extensionUri, [
			'webview-ui',
			'dist',
			'index.js'
		]);

		const nonce = this.getNonce();

		return /*html*/ `
			<!DOCTYPE html>
			<html lang="en">
				<head>
					<meta charset="utf-8">
					<meta name="viewport" content="width=device-width,initial-scale=1,shrink-to-fit=no">
					<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
					<link rel="stylesheet" type="text/css" href="${stylesUri}">
					<title>Features Toggle</title>
				</head>
				<body>
					<div id="root"></div>
					<script nonce="${nonce}" type="module" src="${scriptUri}"></script>
				</body>
			</html>
		`;
	}

	private getUri(webview: vscode.Webview, extensionUri: vscode.Uri, pathList: string[]) {
		return webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, ...pathList));
	}

	private getNonce() {
		let text = '';
		const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		for (let i = 0; i < 32; i++) {
			text += possible.charAt(Math.floor(Math.random() * possible.length));
		}
		return text;
	}

	private handleMessage(message: any) {
		console.log('[Extension] Received message:', message.type);
		switch (message.type) {
			case 'uploadDiagram':
				this.handleDiagramUpload(message.data);
				break;
		}
	}

	private async handleDiagramUpload(data: { name: string; content: string }) {
		console.log('[Extension] Starting diagram upload:', data.name);
		try {
			console.log('[Extension] Calling parseDiagram...');
			const result = parseDiagram(data.name, data.content);
			console.log('[Extension] Parse result:', JSON.stringify(result, null, 2));
			this.webviewView?.webview.postMessage({
				type: 'diagramParsed',
				data: result
			});
			console.log('[Extension] Message sent to webview');
		} catch (error) {
			console.error('[Extension] Error during diagram parsing:', error);
			this.webviewView?.webview.postMessage({
				type: 'diagramParsed',
				data: { error: error instanceof Error ? error.message : String(error) }
			});
		}
	}
}

export function activate(context: vscode.ExtensionContext) {
	const provider = new FeaturesToggleViewProvider(context);

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider('features-toggle.view', provider)
	);

	console.log('Features Toggle extension activated!');
}

export function deactivate() {}
