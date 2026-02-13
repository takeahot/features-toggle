import React, { useRef, useEffect, useState } from 'react';

import { vscode } from './utils/vscode';

function App() {
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [parsedData, setParsedData] = useState<any>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const handleMessage = (event: MessageEvent) => {
			const message = event.data;
			switch (message.type) {
				case 'diagramParsed':
					if (message.data.error) {
						setError(message.data.error);
						setParsedData(null);
					} else {
						setParsedData(message.data);
						setError(null);
					}
					break;
			}
		};

		window.addEventListener('message', handleMessage);
		return () => window.removeEventListener('message', handleMessage);
	}, []);

	const handleUploadClick = () => {
		fileInputRef.current?.click();
	};

	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			// Validate file extension
			if (!file.name.endsWith('.drawio')) {
				vscode.postMessage({
					type: 'error',
					data: { message: 'Please select a .drawio file' }
				});
				return;
			}
			const reader = new FileReader();
			reader.onload = () => {
				vscode.postMessage({
					type: 'uploadDiagram',
					data: {
						name: file.name,
						content: reader.result
					}
				});
			};
			reader.readAsText(file);
		}
	};

	return (
		<React.StrictMode>
			<div className="container">
				<input
					ref={fileInputRef}
					type="file"
					style={{ display: 'none' }}
					onChange={handleFileChange}
				/>
				<button onClick={handleUploadClick} className="upload-button">
					Выбрать файл
				</button>
			</div>
		</React.StrictMode>
	);
}

export default App;
