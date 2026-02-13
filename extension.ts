import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('Extension is active! Hot reload test!');
    
    const disposable = vscode.commands.registerCommand(
        'featuresToggle.hello',
        () => {
            vscode.window.showInformationMessage('Hello World!');
        }
    );
    
    context.subscriptions.push(disposable);
}

export function deactivate() {}
